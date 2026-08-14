package parser

import (
	"regexp"
	"sort"
	"strconv"
)

type Marker struct {
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
	Escaped  bool   `json:"escaped"`
}

var (
	escapePattern   = regexp.MustCompile(`^(.*?):(\d+):(\d+):\s*(.*escapes to heap.*)$`)
	noEscapePattern = regexp.MustCompile(`^(.*?):(\d+):(\d+):\s*(.*does not escape.*)$`)
	inlinePattern   = regexp.MustCompile(`^(.*?):(\d+):(\d+):\s*(.*inlining call.*)$`)
)

func ParseEscapeAnalysis(output string) []Marker {
	var markers []Marker

	for _, line := range splitLines(output) {
		if m := escapePattern.FindStringSubmatch(line); m != nil {
			markers = append(markers, markerFromMatch(m, true, "warning"))
			continue
		}
		if m := noEscapePattern.FindStringSubmatch(line); m != nil {
			markers = append(markers, markerFromMatch(m, false, "info"))
			continue
		}
		if m := inlinePattern.FindStringSubmatch(line); m != nil {
			markers = append(markers, markerFromMatch(m, false, "info"))
		}
	}

	sort.Slice(markers, func(i, j int) bool {
		if markers[i].Line == markers[j].Line {
			return markers[i].Column < markers[j].Column
		}
		return markers[i].Line < markers[j].Line
	})

	return markers
}

func markerFromMatch(m []string, escaped bool, severity string) Marker {
	line, _ := strconv.Atoi(m[2])
	col, _ := strconv.Atoi(m[3])
	return Marker{
		Line:     line,
		Column:   col,
		Severity: severity,
		Message:  m[4],
		Escaped:  escaped,
	}
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}
