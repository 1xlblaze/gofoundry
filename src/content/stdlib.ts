import type { Lesson } from "./types";

export const stdlibLessons: Lesson[] = [
  {
    slug: "fmt-and-formatting",
    track: "stdlib",
    title: "fmt & Formatting Verbs",
    subtitle: "Print, Sprintf, Stringer, and the verbs that matter for debugging.",
    difficulty: "beginner",
    minutes: 18,
    tags: ["fmt", "stdlib"],
    blocks: [
      {
        type: "prose",
        title: "The verbs you actually use",
        body: "%v (default), %+v (struct fields), %#v (Go-syntax repr), %T (type), %d/%f/%s, %q (quoted string), %x/%X (hex), %p (pointer), %w (error wrapping in Errorf only). Master these and you can debug almost anything without a debugger.",
      },
      {
        type: "code",
        title: "Stringer for custom formatting",
        language: "go",
        code: `type Status int

const (
	Pending Status = iota
	Active
	Closed
)

func (s Status) String() string {
	return [...]string{"Pending", "Active", "Closed"}[s]
}

func main() {
	s := Active
	fmt.Println(s)         // Active (fmt calls String() automatically)
	fmt.Printf("%v %d\\n", s, s) // Active 1
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Implement fmt.Stringer (String() string) on enum-like types and error types. Every fmt verb that prints a value checks for it first.",
      },
      {
        type: "code",
        title: "Sprintf for building strings, Errorf for wrapping",
        language: "go",
        code: `msg := fmt.Sprintf("user=%s attempts=%d", user, n)

err := fmt.Errorf("fetch %s: %w", url, baseErr) // %w preserves the chain
fmt.Println(errors.Unwrap(err) == baseErr) // true`,
      },
    ],
    quiz: [
      {
        id: "fmt1",
        prompt: "Which verb preserves an error chain for errors.Is/As?",
        options: ["%v", "%s", "%w (in Errorf)", "%q"],
        answerIndex: 2,
        explanation: "%w is only valid in fmt.Errorf and wraps the error for unwrapping.",
      },
    ],
  },
  {
    slug: "strings-strconv-bytes",
    track: "stdlib",
    title: "strings, strconv & bytes",
    subtitle: "The workhorses for text manipulation without regex overhead.",
    difficulty: "beginner",
    minutes: 20,
    tags: ["strings", "strconv", "bytes"],
    blocks: [
      {
        type: "prose",
        title: "Reach for these before regexp",
        body: "strings.Builder avoids O(n²) concatenation. strings.Split/Fields/Join cover most parsing. strconv converts between strings and numbers without the overhead of fmt.Sscanf. bytes mirrors strings for []byte when you want to avoid allocation from string conversion.",
      },
      {
        type: "code",
        title: "Builder, split/join, conversions",
        language: "go",
        code: `var b strings.Builder
for i := 0; i < 1000; i++ {
	b.WriteString("x")
}
s := b.String() // one allocation-friendly pass

parts := strings.Split("a,b,,c", ",")     // ["a" "b" "" "c"]
fields := strings.Fields("  a   b  c ")   // ["a" "b" "c"] — trims + splits on whitespace
joined := strings.Join(parts, "-")

n, err := strconv.Atoi("42")
f, err := strconv.ParseFloat("3.14", 64)
str := strconv.Itoa(42)
b2, err := strconv.ParseBool("true")`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "string(intVar) converts a rune code point to a string, not the digits! Use strconv.Itoa for number-to-string.",
      },
      {
        type: "code",
        title: "bytes.Buffer for binary-safe building",
        language: "go",
        code: `var buf bytes.Buffer
buf.WriteByte('{')
buf.WriteString(\`"key":"value"\`)
buf.WriteByte('}')
out := buf.Bytes()`,
      },
    ],
    quiz: [
      {
        id: "ssb1",
        prompt: "string(65) evaluates to…",
        options: ["\"65\"", "\"A\" (rune 65)", "compile error", "\"0x41\""],
        answerIndex: 1,
        explanation: "Converting an int to string treats it as a rune code point, not digits — a classic gotcha.",
      },
    ],
  },
  {
    slug: "time-and-scheduling",
    track: "stdlib",
    title: "time Package",
    subtitle: "Durations, timers, tickers, and avoiding timezone bugs.",
    difficulty: "intermediate",
    minutes: 22,
    tags: ["time"],
    blocks: [
      {
        type: "prose",
        title: "Monotonic vs wall clock",
        body: "time.Now() carries both a wall clock reading and a monotonic reading. Subtracting two time.Time values uses the monotonic clock, immune to NTP adjustments — always measure durations with time.Since, never by subtracting Unix timestamps you stored separately.",
      },
      {
        type: "code",
        title: "Timers, tickers, and context deadlines",
        language: "go",
        code: `start := time.Now()
// ... work ...
elapsed := time.Since(start)

ticker := time.NewTicker(2 * time.Second)
defer ticker.Stop()
for range ticker.C {
	fmt.Println("tick")
}

ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()
select {
case <-ctx.Done():
	fmt.Println("timed out:", ctx.Err())
case res := <-doWork():
	fmt.Println(res)
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Always Stop() a Timer/Ticker you created, and prefer context.WithTimeout over raw timers for cancellation that composes across call boundaries.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Store timestamps in UTC (time.Now().UTC()) and format with explicit layouts using the reference time Mon Jan 2 15:04:05 MST 2006 — Go's layout is an actual timestamp, not tokens like YYYY.",
      },
    ],
    quiz: [
      {
        id: "time1",
        prompt: "Best way to measure elapsed wall time in Go?",
        options: [
          "time.Now().Unix() twice and subtract",
          "time.Since(start) using a monotonic-backed time.Time",
          "Count CPU cycles manually",
          "os.Getenv(\"TIME\")",
        ],
        answerIndex: 1,
        explanation: "time.Time captures a monotonic reading; Since correctly measures elapsed duration.",
      },
    ],
  },
  {
    slug: "io-and-bufio",
    track: "stdlib",
    title: "io & bufio Patterns",
    subtitle: "Readers, writers, and streaming without loading everything into memory.",
    difficulty: "intermediate",
    minutes: 26,
    tags: ["io", "bufio"],
    blocks: [
      {
        type: "prose",
        title: "Compose, don't buffer everything",
        body: "io.Reader and io.Writer are Go's most important interfaces — one method each, endlessly composable. bufio.Scanner/Reader add buffering on top of any Reader. io.Copy streams between a Reader and Writer without materializing the whole payload.",
      },
      {
        type: "code",
        title: "Line-by-line scanning + io.Copy",
        language: "go",
        code: `func countLines(r io.Reader) (int, error) {
	scanner := bufio.NewScanner(r)
	n := 0
	for scanner.Scan() {
		n++
	}
	return n, scanner.Err()
}

func saveResponse(dst io.Writer, resp *http.Response) error {
	defer resp.Body.Close()
	_, err := io.Copy(dst, resp.Body) // streams, no full buffering
	return err
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "bufio.Scanner has a default 64KB line limit — call scanner.Buffer(make([]byte, 0, 1<<20), 1<<20) for larger lines (e.g. JSON logs).",
      },
      {
        type: "code",
        title: "io.MultiWriter and io.TeeReader",
        language: "go",
        code: `w := io.MultiWriter(os.Stdout, logFile) // write once, land in two places
tr := io.TeeReader(resp.Body, hashWriter) // hash while streaming to caller`,
      },
    ],
    quiz: [
      {
        id: "io1",
        prompt: "Why prefer io.Copy over reading the whole body then writing it?",
        options: [
          "It's shorter to type only",
          "It streams in fixed-size chunks, avoiding loading the entire payload into memory",
          "It's the only way to write to a file",
          "It automatically retries on failure",
        ],
        answerIndex: 1,
        explanation: "io.Copy uses an internal buffer and streams, which matters for large payloads.",
      },
    ],
  },
  {
    slug: "encoding-json",
    track: "stdlib",
    title: "encoding/json Deep Dive",
    subtitle: "Struct tags, custom marshaling, streaming decode, and common gotchas.",
    difficulty: "intermediate",
    minutes: 28,
    tags: ["json", "encoding"],
    blocks: [
      {
        type: "prose",
        title: "Tags shape the wire format",
        body: "`json:\"name,omitempty\"` controls key name and whether zero values are emitted. Unexported fields are never marshaled. json.RawMessage defers parsing of a sub-document. json.NewDecoder(r).Decode(&v) streams from a Reader instead of buffering the whole body with Unmarshal.",
      },
      {
        type: "code",
        title: "Tags, omitempty, and custom types",
        language: "go",
        code: `type User struct {
	ID        string    \`json:"id"\`
	Email     string    \`json:"email"\`
	Bio       string    \`json:"bio,omitempty"\`
	CreatedAt time.Time \`json:"created_at"\`
	Password  string    \`json:"-"\` // never serialized
}

type Status int

func (s Status) MarshalJSON() ([]byte, error) {
	names := map[Status]string{0: "pending", 1: "active"}
	return json.Marshal(names[s])
}

func decodeStream(r io.Reader) (*User, error) {
	var u User
	dec := json.NewDecoder(r)
	dec.DisallowUnknownFields() // strict: reject unexpected fields
	if err := dec.Decode(&u); err != nil {
		return nil, err
	}
	return &u, nil
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "encoding/json decodes JSON numbers into interface{} as float64 by default — large int64 IDs can lose precision. Use json.Number or a concrete struct field type.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "For hot paths, consider generated codecs (easyjson, ffjson) or the newer encoding/json/v2 experiments — but standard encoding/json is correct and good enough for most services.",
      },
    ],
    quiz: [
      {
        id: "json1",
        prompt: "Which struct tag value excludes a field from JSON entirely?",
        options: ["omitempty", "\"-\"", "required", "hidden"],
        answerIndex: 1,
        explanation: "A tag of `json:\"-\"` always omits the field on marshal and unmarshal.",
      },
    ],
  },
  {
    slug: "net-http-fundamentals",
    track: "stdlib",
    title: "net/http Fundamentals",
    subtitle: "Handlers, ServeMux, clients, and timeouts that prevent resource leaks.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["http", "server"],
    blocks: [
      {
        type: "prose",
        title: "Handler is one method",
        body: "http.Handler needs only ServeHTTP(w, r). http.HandlerFunc adapts a plain function. Since Go 1.22, http.ServeMux supports method + path patterns natively (GET /users/{id}), removing the need for a router library in many services.",
      },
      {
        type: "code",
        title: "A production-shaped server",
        language: "go",
        code: `mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("POST /users", createUser)

srv := &http.Server{
	Addr:              ":8080",
	Handler:           logging(mux),
	ReadHeaderTimeout: 5 * time.Second,
	ReadTimeout:       10 * time.Second,
	WriteTimeout:      10 * time.Second,
	IdleTimeout:       120 * time.Second,
}

func getUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func main() {
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()
	// graceful shutdown on signal, then:
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never use http.DefaultClient / http.Get in production without a timeout — a hung server can leak goroutines forever. Build a *http.Client{Timeout: ...} explicitly.",
      },
    ],
    quiz: [
      {
        id: "http1",
        prompt: "Since Go 1.22, ServeMux can match on…",
        options: [
          "Only exact paths",
          "HTTP method + path with wildcards, e.g. GET /users/{id}",
          "Only regex",
          "Nothing — you always need a third-party router",
        ],
        answerIndex: 1,
        explanation: "Enhanced routing patterns landed in the standard library in Go 1.22.",
      },
    ],
  },
  {
    slug: "errors-and-slog",
    track: "stdlib",
    title: "errors & log/slog",
    subtitle: "Structured errors and structured logging, the modern Go way.",
    difficulty: "intermediate",
    minutes: 24,
    tags: ["errors", "slog", "logging"],
    blocks: [
      {
        type: "prose",
        title: "Two standard toolkits, one philosophy: structure",
        body: "errors.Join combines multiple errors (Go 1.20+). log/slog (Go 1.21+) replaces ad-hoc fmt.Println logging with structured key-value logs and levels, and lets you swap handlers (text, JSON) without changing call sites.",
      },
      {
        type: "code",
        title: "errors.Join + slog with attributes",
        language: "go",
        code: `func validate(u User) error {
	var errs []error
	if u.Email == "" {
		errs = append(errs, errors.New("email required"))
	}
	if u.Age < 0 {
		errs = append(errs, errors.New("age must be non-negative"))
	}
	return errors.Join(errs...) // nil if errs is empty
}

logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
logger.Info("request handled",
	slog.String("method", r.Method),
	slog.String("path", r.URL.Path),
	slog.Int("status", 200),
	slog.Duration("latency", time.Since(start)),
)
slog.SetDefault(logger)`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Use slog.With(...) to create a child logger carrying request-scoped fields (request_id, user_id) through a call chain.",
      },
    ],
    quiz: [
      {
        id: "es1",
        prompt: "errors.Join(nil, nil, nil) returns…",
        options: ["A non-nil error listing three nils", "nil", "A panic", "An empty string error"],
        answerIndex: 1,
        explanation: "Join filters nils; if none remain, it returns nil.",
      },
    ],
  },
  {
    slug: "sort-slices-maps-packages",
    track: "stdlib",
    title: "sort, slices & maps Packages",
    subtitle: "Generic collection helpers that replaced hand-written loops.",
    difficulty: "intermediate",
    minutes: 20,
    tags: ["sort", "slices", "maps", "generics"],
    blocks: [
      {
        type: "prose",
        title: "Go 1.21 added slices and maps",
        body: "The generic slices and maps packages provide Sort, Contains, Index, Equal, Clone, Keys, Values, DeleteFunc, and more — no more copy-pasted helper functions per project. sort.Slice remains for custom Less functions on data that isn't a plain []T.",
      },
      {
        type: "code",
        title: "slices/maps in practice",
        language: "go",
        code: `nums := []int{5, 2, 4, 1, 3}
slices.Sort(nums)                      // [1 2 3 4 5]
i, found := slices.BinarySearch(nums, 3)

people := []Person{{"Bo", 30}, {"Ann", 25}}
slices.SortFunc(people, func(a, b Person) int {
	return cmp.Compare(a.Age, b.Age)
})

m := map[string]int{"a": 1, "b": 2}
keys := slices.Sorted(maps.Keys(m)) // deterministic order for tests/output

clone := slices.Clone(nums)          // shallow, independent backing array
unique := slices.Compact(slices.Clone(nums)) // dedupe adjacent (sort first)`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "slices.Compact only removes adjacent duplicates — sort first if you want global dedupe, or use a map[T]struct{} set instead.",
      },
    ],
    quiz: [
      {
        id: "sm1",
        prompt: "Why did Go add generic slices/maps packages in 1.21?",
        options: [
          "To replace arrays entirely",
          "To provide common generic operations without every project hand-rolling them",
          "Because sort.Slice was removed",
          "For binary compatibility with C",
        ],
        answerIndex: 1,
        explanation: "Generics enabled a shared, type-safe standard toolkit for common collection operations.",
      },
    ],
  },
  {
    slug: "testing-package-deep-dive",
    track: "stdlib",
    title: "testing Package Deep Dive",
    subtitle: "Subtests, benchmarks, fuzzing, and test doubles without a framework.",
    difficulty: "advanced",
    minutes: 30,
    tags: ["testing", "benchmark", "fuzz"],
    blocks: [
      {
        type: "prose",
        title: "The standard library is the framework",
        body: "Go deliberately ships one testing story: go test. Subtests (t.Run) give table-driven structure and independent pass/fail reporting. Benchmarks (testing.B) measure ns/op and allocs/op. Fuzzing (Go 1.18+) generates adversarial inputs from a seed corpus.",
      },
      {
        type: "code",
        title: "Table test, benchmark, fuzz target",
        language: "go",
        code: `func TestParse(t *testing.T) {
	cases := []struct {
		name    string
		in      string
		want    int
		wantErr bool
	}{
		{"simple", "42", 42, false},
		{"invalid", "abc", 0, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Parse(tc.in)
			if (err != nil) != tc.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, tc.wantErr)
			}
			if got != tc.want {
				t.Errorf("got %d, want %d", got, tc.want)
			}
		})
	}
}

func BenchmarkParse(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Parse("42")
	}
}

func FuzzParse(f *testing.F) {
	f.Add("42")
	f.Fuzz(func(t *testing.T, in string) {
		_, _ = Parse(in) // must never panic
	})
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Run go test -run TestParse/simple to target one subtest, go test -bench=. -benchmem for allocation counts, and go test -fuzz=FuzzParse for a fuzz run.",
      },
      {
        type: "callout",
        tone: "note",
        body: "For mocking, prefer small consumer-defined interfaces over a mocking framework — a hand-written fake often reads clearer than generated mock boilerplate.",
      },
    ],
    quiz: [
      {
        id: "test1",
        prompt: "testing.B measures a function by…",
        options: [
          "Running it once and timing it",
          "Running it b.N times, chosen by the framework to get a stable measurement",
          "Compiling it twice",
          "Randomly sampling CPU registers",
        ],
        answerIndex: 1,
        explanation: "The benchmark runner auto-scales b.N to get a statistically meaningful duration.",
      },
    ],
  },
];
