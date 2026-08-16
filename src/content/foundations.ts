import type { Lesson } from "./types";

/** Beginner on-ramp — feeds into Concepts `go-fundamentals`. */
export const foundationsLessons: Lesson[] = [
  {
    slug: "foundations-welcome-to-go",
    track: "foundations",
    title: "Welcome to Go",
    subtitle: "What Go is, who it is for, and how GoFoundry ladders from foundations to staff-grade depth.",
    difficulty: "beginner",
    minutes: 12,
    free: true,
    tags: ["beginner", "onboarding", "go"],
    blocks: [
      {
        type: "prose",
        title: "Start here if Go is new",
        body: "Go is a small language with a fast compiler, explicit error handling, and a runtime built for networked services. GoFoundry is not a generic tutorial site — we ladder from clear foundations into staff-grade concurrency, runtime internals, and system design. This track is lesson zero: plain language, no interview jargon yet.",
      },
      {
        type: "prose",
        title: "Two paths on the same ladder",
        body: "New to Go: finish Foundations (this track), then continue in Go Concepts. Preparing for staff interviews: take the placement quiz, then follow HEAT through curriculum, practice, and Lab. Both paths converge on the same staff-grade material — we do not water down the advanced tracks.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Install Go 1.22+ locally and run `go version`. You can also use the in-browser Lab for small experiments without installing anything.",
      },
      {
        type: "code",
        title: "Your first program",
        language: "go",
        code: `package main

import "fmt"

func main() {
\tfmt.Println("GoFoundry — foundations first, staff-grade later.")
}`,
      },
    ],
    quiz: [
      {
        id: "foundations-who",
        prompt: "Who should start with the Foundations track?",
        options: ["Experts only", "Anyone new to Go or rusty on basics", "Only hiring managers"],
        answerIndex: 1,
        explanation: "Foundations is the on-ramp; staff tracks assume comfort with Go syntax and values.",
      },
    ],
  },
  {
    slug: "foundations-types-and-functions",
    track: "foundations",
    title: "Types, Variables, and Functions",
    subtitle: "Declare values, call functions, and read signatures without memorizing the whole spec.",
    difficulty: "beginner",
    minutes: 20,
    free: true,
    tags: ["types", "functions", "basics"],
    blocks: [
      {
        type: "prose",
        body: "Go variables have static types. Short declaration `:=` infers the type from the right-hand side. Functions are values: they can be passed around, but their parameter and return types are always explicit in the signature.",
      },
      {
        type: "code",
        language: "go",
        code: `package main

import "fmt"

func greet(name string) string {
\treturn "hello, " + name
}

func main() {
\tname := "foundry"
\tfmt.Println(greet(name))
}`,
      },
      {
        type: "callout",
        tone: "note",
        body: "Exported names start with a capital letter. Package names stay short and lowercase — you will see this pattern across the standard library.",
      },
    ],
    quiz: [
      {
        id: "foundations-assign",
        prompt: "What does `:=` do in Go?",
        options: ["Declares and assigns with inferred type", "Imports a package", "Starts a goroutine"],
        answerIndex: 0,
        explanation: "`:=` declares a new variable when at least one name on the left is new.",
      },
    ],
  },
  {
    slug: "foundations-control-flow",
    track: "foundations",
    title: "Control Flow: if, for, and switch",
    subtitle: "Go uses explicit loops and early returns instead of hidden control-flow magic.",
    difficulty: "beginner",
    minutes: 18,
    free: true,
    tags: ["control-flow", "for", "if"],
    blocks: [
      {
        type: "prose",
        body: "There is only `for` — no `while`. `if` can include a short statement before the condition. `switch` cases do not fall through by default, which removes an entire class of bugs from C-style switches.",
      },
      {
        type: "code",
        language: "go",
        code: `package main

import "fmt"

func classify(n int) string {
\tswitch {
\tcase n < 0:
\t\treturn "negative"
\tcase n == 0:
\t\treturn "zero"
\tdefault:
\t\treturn "positive"
\t}
}

func main() {
\tfor i := 0; i < 3; i++ {
\t\tfmt.Println(classify(i - 1))
\t}
}`,
      },
    ],
    quiz: [
      {
        id: "foundations-while",
        prompt: "Does Go have a `while` keyword?",
        options: ["Yes", "No — use for", "Only in modules"],
        answerIndex: 1,
        explanation: "All looping is expressed with `for` and its variants.",
      },
    ],
  },
  {
    slug: "foundations-structs-and-errors",
    track: "foundations",
    title: "Structs and Errors",
    subtitle: "Group data in structs and return errors explicitly — Go's default style.",
    difficulty: "beginner",
    minutes: 22,
    free: true,
    tags: ["structs", "errors"],
    blocks: [
      {
        type: "prose",
        body: "Structs group fields. Methods attach behavior with receivers. Errors are values — functions return `(result, error)` and callers decide whether to handle, wrap, or propagate. This is different from exception-heavy languages and becomes essential in production Go.",
      },
      {
        type: "code",
        language: "go",
        code: `package main

import (
\t"errors"
\t"fmt"
)

type User struct {
\tID   int
\tName string
}

func findUser(id int) (User, error) {
\tif id <= 0 {
\t\treturn User{}, errors.New("invalid id")
\t}
\treturn User{ID: id, Name: "ada"}, nil
}

func main() {
\tu, err := findUser(1)
\tif err != nil {
\t\tfmt.Println("error:", err)
\t\treturn
\t}
\tfmt.Println(u.Name)
}`,
      },
    ],
    quiz: [
      {
        id: "foundations-errors",
        prompt: "How do Go functions usually report failure?",
        options: ["Thrown exceptions", "Return an error value", "Panic always"],
        answerIndex: 1,
        explanation: "Explicit error returns keep control flow visible in the source.",
      },
    ],
  },
  {
    slug: "foundations-collections-bridge",
    track: "foundations",
    title: "Slices and Maps — Bridge to Concepts",
    subtitle: "The two collections you will use every day, and where to go next in the curriculum.",
    difficulty: "beginner",
    minutes: 25,
    free: true,
    tags: ["slices", "maps", "bridge"],
    prerequisites: ["foundations-types-and-functions"],
    blocks: [
      {
        type: "prose",
        body: "Slices are dynamic views over arrays; maps are hash tables. Both have zero values that are safe to read from (nil slice, nil map read) but maps must be initialized before assignment. The next lesson in Go Concepts — Go Fundamentals — goes deep on copying, capacity, and when data is shared.",
      },
      {
        type: "code",
        language: "go",
        code: `package main

import "fmt"

func main() {
\tlangs := []string{"go", "rust"}
\tlangs = append(langs, "zig")

\tseen := make(map[string]bool)
\tfor _, lang := range langs {
\t\tseen[lang] = true
\t}
\tfmt.Println(len(seen), langs[0])
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Next step: open the Go Concepts track and complete **Go Fundamentals**. Then explore concurrency when you are comfortable with values, slices, and errors.",
      },
    ],
    quiz: [
      {
        id: "foundations-bridge",
        prompt: "After Foundations, which Concepts lesson should you take first?",
        options: ["scheduler-gpm", "go-fundamentals", "payment-arch"],
        answerIndex: 1,
        explanation: "Go Fundamentals continues the value and collection model from this bridge lesson.",
      },
    ],
  },
];
