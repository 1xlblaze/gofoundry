package executor

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/gofoundry/worker/internal/parser"
	"github.com/gofoundry/worker/internal/problems"
)

type Request struct {
	ProblemID string
	Code      string
	Modes     []string
}

type Emitter func(event any)

type Executor struct {
	goBin string
}

func New() *Executor {
	goBin := os.Getenv("GO_BIN")
	if goBin == "" {
		goBin = "go"
	}
	return &Executor{goBin: goBin}
}

func (e *Executor) Run(ctx context.Context, req Request, emit Emitter) error {
	problem, ok := problems.Get(req.ProblemID)
	if !ok {
		return fmt.Errorf("unknown problem: %s", req.ProblemID)
	}

	dir, err := os.MkdirTemp("", "gofoundry-worker-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(dir)

	if err := os.WriteFile(filepath.Join(dir, "go.mod"), []byte(problem.GoMod), 0o644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dir, "solution.go"), []byte(req.Code), 0o644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dir, "solution_test.go"), []byte(problem.TestSuite), 0o644); err != nil {
		return err
	}

	modes := map[string]bool{}
	for _, m := range req.Modes {
		modes[m] = true
	}
	if len(modes) == 0 {
		modes["correctness"] = true
	}

	if modes["escape"] || modes["correctness"] {
		emit(map[string]string{"event": "PROGRESS", "step": "vet", "message": "Running go vet…"})
		_, stderr, _ := e.run(ctx, dir, "vet", "./...")
		if strings.Contains(stderr, "vet:") {
			emit(map[string]string{"event": "ERROR", "message": strings.TrimSpace(stderr)})
		}
	}

	if modes["escape"] {
		emit(map[string]string{"event": "PROGRESS", "step": "escape", "message": "Running escape analysis…"})
		stdout, stderr, _ := e.run(ctx, dir, "build", "-gcflags=-m -m", "-o", "/dev/null", ".")
		markers := parser.ParseEscapeAnalysis(stdout + "\n" + stderr)
		emit(map[string]any{"event": "ESCAPE_ANALYSIS_READY", "markers": markers})
	}

	if modes["correctness"] || modes["race"] || modes["leak"] {
		emit(map[string]string{"event": "PROGRESS", "step": "test", "message": "Running tests…"})
		_, _ , _ = e.run(ctx, dir, "mod", "tidy")

		args := []string{"test", "-count=1", "-v", "./..."}
		if modes["race"] {
			args = []string{"test", "-race", "-count=1", "-v", "./..."}
		}

		stdout, stderr, _ := e.run(ctx, dir, args...)
		combined := stdout + "\n" + stderr
		passed, failed := countTests(combined)
		race := strings.Contains(combined, "WARNING: DATA RACE") || strings.Contains(combined, "race detected")
		leaks := modes["leak"] && (strings.Contains(combined, "leaked goroutine") || strings.Contains(combined, "goroutine leak"))

		emit(map[string]any{
			"event":         "SAFETY_CHECK_RESULT",
			"raceDetected":  race,
			"leaksDetected": leaks,
			"testsPassed":   passed,
			"testsFailed":   failed,
		})
	}

	if modes["bench"] {
		emit(map[string]string{"event": "PROGRESS", "step": "bench", "message": "Running benchmarks…"})
		stdout, stderr, _ := e.run(ctx, dir, "test", "-bench=.", "-benchmem", "-benchtime=500ms", "-run=^$", "./...")
		ns, bytes, allocs := parseBench(stdout + "\n" + stderr)
		maxAllocs := problem.MaxHeapAllocs
		passedBar := maxAllocs < 0 || allocs <= float64(maxAllocs)

		emit(map[string]any{
			"event":          "BENCHMARK_COMPLETE",
			"nsPerOp":        ns,
			"bytesPerOp":     bytes,
			"allocsPerOp":    allocs,
			"passedStaffBar": passedBar,
		})
	}

	return nil
}

func (e *Executor) run(ctx context.Context, dir string, args ...string) (string, string, error) {
	cmd := exec.CommandContext(ctx, e.goBin, args...)
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), "GO111MODULE=on")

	var stdout, stderr strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	return stdout.String(), stderr.String(), err
}

func countTests(output string) (passed, failed int) {
	for _, line := range strings.Split(output, "\n") {
		if strings.HasPrefix(line, "--- PASS:") {
			passed++
		}
		if strings.HasPrefix(line, "--- FAIL:") {
			failed++
		}
	}
	if passed == 0 && failed == 0 && strings.Contains(output, "PASS") {
		passed = 1
	}
	return passed, failed
}

var benchLine = regexp.MustCompile(`([\d.]+)\s*ns/op.*?([\d.]+)\s*B/op.*?([\d.]+)\s*allocs/op`)

func parseBench(output string) (ns, bytes, allocs float64) {
	for _, line := range strings.Split(output, "\n") {
		if !strings.Contains(line, "ns/op") {
			continue
		}
		if m := benchLine.FindStringSubmatch(line); m != nil {
			ns, _ = strconv.ParseFloat(m[1], 64)
			bytes, _ = strconv.ParseFloat(m[2], 64)
			allocs, _ = strconv.ParseFloat(m[3], 64)
			return ns, bytes, allocs
		}
	}
	return 0, 0, 0
}
