import type { Lesson } from "./types";

export const conceptsLessons: Lesson[] = [
  {
    slug: "go-fundamentals",
    track: "concepts",
    title: "Go Fundamentals: Values, State, and Control Flow",
    subtitle:
      "Build an accurate model of zero values, slices, maps, functions, and explicit control flow.",
    difficulty: "beginner",
    minutes: 45,
    tags: ["basics", "types", "slices", "maps", "control-flow"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "By the end of this lesson you will be able to read a Go function and identify which operations copy values, which operations can affect shared state, and which zero values are immediately useful. You will be able to choose arrays, slices, and maps deliberately; write explicit control flow without importing habits from exception-heavy languages; and explain why a short piece of Go behaves as it does. These foundations matter because later topics—methods, interfaces, concurrency, and performance—are all consequences of Go's value model.",
      },
      {
        type: "prose",
        title: "Mental model: variables contain values",
        body: "A Go variable is a named location containing a value of one static type. Assignment copies that value. For an int or struct, the copied bits usually contain all of the data. For a slice, map, pointer, function, channel, or interface, the copied value is a small descriptor that refers to other runtime state. Copying a slice therefore copies its header, not its elements; two headers may still point at the same backing array. This is more useful than memorizing a list of reference types: always ask what the value itself contains and what it can reach.",
      },
      {
        type: "code",
        title: "Zero values make useful types possible",
        language: "go",
        code: `package counter

import "sync"

// Counter is ready to use without a constructor. Both fields have useful
// zero values: sync.Mutex is unlocked and int64 is zero.
type Counter struct {
	mu sync.Mutex
	n  int64
}

func (c *Counter) Add(delta int64) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.n += delta
}

func (c *Counter) Value() int64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n
}

func Example() int64 {
	var c Counter // no NewCounter call is required
	c.Add(3)
	c.Add(4)
	return c.Value() // 7
}`,
      },
      {
        type: "prose",
        title: "Zero does not always mean ready",
        body: "Every declared variable is initialized: numbers become 0, booleans false, strings empty, and pointers, slices, maps, channels, functions, and interfaces nil. A nil slice is safe to inspect, range over, and append to. A nil map is safe to read from but panics on assignment because no map storage exists. A nil channel blocks forever on send and receive. Good API design either makes the zero value useful or documents and enforces construction. Do not claim that every zero value is usable merely because every type has one.",
      },
      {
        type: "code",
        title: "Arrays, slices, and capacity",
        language: "go",
        code: `package main

import "fmt"

func appendLabel(xs []string, label string) []string {
	// append may reuse xs's backing array or allocate a new one.
	// Returning the new header is therefore part of the function contract.
	return append(xs, label)
}

func main() {
	base := make([]string, 2, 4)
	base[0], base[1] = "a", "b"

	view := base[:1]              // len=1, cap=4; shares base's array
	view = appendLabel(view, "X") // reuses capacity and overwrites base[1]
	fmt.Println(base)             // [a X]

	isolated := append([]string(nil), base...)
	isolated[0] = "changed"
	fmt.Println(base[0]) // still "a": the elements were copied
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "A slice parameter is passed by value, but its copied header can address the caller's elements. Mutating s[i] may be visible to the caller; appending may or may not be, depending on capacity. Return the result of append and copy when ownership must be isolated.",
      },
      {
        type: "code",
        title: "Maps, comma-ok, and explicit flow",
        language: "go",
        code: `package inventory

import (
	"fmt"
	"strings"
)

func Count(words []string) map[string]int {
	counts := make(map[string]int, len(words))
	for _, raw := range words {
		word := strings.ToLower(strings.TrimSpace(raw))
		if word == "" {
			continue // skip invalid records, not the entire function
		}
		counts[word]++ // reading a missing key yields int's zero value
	}
	return counts
}

func Require(counts map[string]int, key string) (int, error) {
	n, ok := counts[key] // ok distinguishes "missing" from "present with zero"
	if !ok {
		return 0, fmt.Errorf("inventory key %q is missing", key)
	}
	return n, nil
}`,
      },
      {
        type: "steps",
        title: "Worked example: trace shared slice state",
        items: [
          "Start with backing array [10, 20, 0, 0]. The slice a := make([]int, 2, 4) has len 2 and cap 4.",
          "Assign b := a[:1]. Assignment copies a slice header; b has len 1 and cap 4 but points at the same first element.",
          "Execute b = append(b, 99). Because b has spare capacity, append writes at backing-array index 1 and returns a header with len 2.",
          "Reading a now produces [10, 99], even though a itself was never passed to append. Its header still exposes the changed element.",
          "Execute c := append([]int(nil), a...). append allocates storage for c and copies 10 and 99. Future element mutations through c do not affect a.",
        ],
      },
      {
        type: "think",
        title: "HEAT: reason before running",
        clarify: [
          "For each assignment, what exact value is copied?",
          "Does that value contain data directly or a descriptor that reaches shared state?",
          "Could append allocate, and does the caller receive the returned slice header?",
        ],
        model: [
          "Draw a slice as three fields—pointer, length, capacity—beside a separate backing array.",
          "Draw a map variable as a small handle to runtime-managed hash-table state.",
          "Mark ownership explicitly when a function retains a slice or map after returning.",
        ],
        pitfalls: [
          "Calling slices pass-by-reference; Go passes the slice header by value.",
          "Using len as though it were allocated capacity.",
          "Relying on map iteration order, which Go deliberately does not specify.",
        ],
      },
      {
        type: "prose",
        title: "Control flow, scope, and edges",
        body: "Go has one looping construct, for, plus if and switch. Initializers such as if err := work(); err != nil keep temporary variables in the smallest useful scope. switch does not fall through by default, and a switch without an expression is an idiomatic alternative to a long if/else chain. range copies each element into iteration variables; mutating the variable does not mutate a struct element in the slice. Empty and nil slices both have length zero, but they can serialize differently. Map iteration order is unspecified. Integer overflow follows fixed-width arithmetic rather than raising an exception, so validate bounds where overflow would violate correctness.",
      },
      {
        type: "complexity",
        time: "Slice index O(1); append amortized O(1); map lookup average O(1)",
        space: "A slice header is O(1); backing storage is O(cap); maps scale with entries",
        notes: "Amortized append allows occasional O(n) growth. Map O(1) is an expected runtime property, not a worst-case guarantee you should use for adversarial complexity proofs.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Prefer types whose zero value is useful: a bytes.Buffer, sync.Mutex, or your own Counter can often be used immediately. Add a constructor when invariants require validation, dependencies, or initialized maps—not simply because constructors are familiar.",
      },
    ],
    quiz: [
      {
        id: "fundamentals-copy",
        prompt: "What is copied by b := a when a is a slice?",
        options: [
          "Every element in the backing array",
          "A slice header containing pointer, length, and capacity",
          "Only the length",
          "Nothing; b is an alias for the variable a",
        ],
        answerIndex: 1,
        explanation: "The header is copied. The two independent headers initially reach the same backing array, which explains shared element mutations without inventing pass-by-reference semantics.",
      },
      {
        id: "fundamentals-map-zero",
        prompt: "Which operation is valid on a nil map m?",
        options: ["m[\"x\"] = 1", "delete followed by assignment", "Reading m[\"x\"]", "Taking m[\"x\"]'s address"],
        answerIndex: 2,
        explanation: "A read from a nil map returns the element zero value. Assignment panics because nil has no initialized map storage.",
      },
      {
        id: "fundamentals-range",
        prompt: "Why does setting v.Name inside for _, v := range users often fail to update []User?",
        options: [
          "range executes concurrently",
          "v is a copy of each struct element",
          "Struct fields are immutable",
          "Slices cannot contain structs",
        ],
        answerIndex: 1,
        explanation: "The value iteration variable receives a copy. Use users[i].Name or range over []*User when pointer ownership is intentional.",
      },
      {
        id: "fundamentals-append",
        prompt: "Why should a helper that appends normally return the resulting slice?",
        options: [
          "append always sorts the slice",
          "The length cannot change",
          "append may produce a new header pointing to a new array",
          "Go forbids slice mutation in functions",
        ],
        answerIndex: 2,
        explanation: "When capacity is exhausted, append allocates and returns a different pointer and capacity. Even without allocation, the caller needs the new length.",
      },
    ],
  },
  {
    slug: "methods-and-receivers",
    track: "concepts",
    title: "Methods and Receivers",
    subtitle:
      "Understand receiver copies, method sets, addressability, nil receivers, and API-level consistency.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["methods", "receivers", "method-sets", "pointers"],
    prerequisites: ["go-fundamentals"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to choose a value or pointer receiver based on semantics rather than folklore, predict which interfaces T and *T satisfy, and explain when the compiler's convenient automatic address-taking does not apply. You will also learn how receiver naming, nil handling, copying, and method expressions affect production API design.",
      },
      {
        type: "prose",
        title: "Mental model: a method is a function with a typed first argument",
        body: "A declaration such as func (a Account) Balance() int64 belongs to the method set of Account, but invocation still passes a receiver value. A value receiver receives a copy of Account. A pointer receiver receives a copied pointer through which the original Account can be changed. The compiler may rewrite addressable calls such as a.Deposit(5) to (&a).Deposit(5), which is syntax convenience—not a change to interface method sets or to Go's pass-by-value rule.",
      },
      {
        type: "code",
        title: "Receiver choice communicates identity",
        language: "go",
        code: `package ledger

import "fmt"

type Money struct {
	Cents    int64
	Currency string
}

// Add uses a value receiver because Money behaves like an immutable value.
// Returning a new value avoids surprising either operand.
func (m Money) Add(other Money) (Money, error) {
	if m.Currency != other.Currency {
		return Money{}, fmt.Errorf("currency mismatch: %s vs %s", m.Currency, other.Currency)
	}
	m.Cents += other.Cents // changes only the receiver copy
	return m, nil
}

type Account struct {
	id      string
	balance Money
}

// Deposit uses a pointer because an Account has identity and mutable state.
func (a *Account) Deposit(amount Money) error {
	next, err := a.balance.Add(amount)
	if err != nil {
		return err
	}
	a.balance = next
	return nil
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Choose receivers for semantic consistency across the type. If one method must use *T because it mutates, contains a mutex, or must not be copied, using *T for the type's other methods usually prevents a confusing split API.",
      },
      {
        type: "code",
        title: "Method sets and interface satisfaction",
        language: "go",
        code: `package main

import "fmt"

type Stringer interface {
	String() string
}

type Renamer interface {
	Rename(string)
}

type User struct{ Name string }

func (u User) String() string   { return u.Name } // method of User and *User
func (u *User) Rename(s string) { u.Name = s }    // method of *User only

var _ Stringer = User{}          // T has value-receiver methods
var _ Stringer = (*User)(nil)    // *T also has T's methods
var _ Renamer = (*User)(nil)     // pointer method is present on *T
// var _ Renamer = User{}        // would not compile

func main() {
	u := User{Name: "Ada"}
	u.Rename("Grace") // compiler can take &u because u is addressable
	fmt.Println(u)

	// User{Name: "Ada"}.Rename("Grace") would fail: the temporary value
	// is not addressable, so the compiler cannot manufacture a stable *User.
}`,
      },
      {
        type: "prose",
        title: "The method-set rule worth proving",
        body: "The method set of T contains methods declared with receiver T. The method set of *T contains methods declared with receiver T or *T. This asymmetry protects interface calls: if a non-addressable T value were stored inside an interface, the runtime could not safely take its address to call a mutating pointer method. Direct selector calls feel looser only because the compiler can take the address of an addressable variable.",
      },
      {
        type: "code",
        title: "Nil receivers and method values",
        language: "go",
        code: `package tree

type Node struct {
	Value int
	Left  *Node
	Right *Node
}

// Size intentionally supports a nil receiver. Calling a method on a nil
// pointer is legal; dereferencing it without this check would panic.
func (n *Node) Size() int {
	if n == nil {
		return 0
	}
	return 1 + n.Left.Size() + n.Right.Size()
}

func Add(delta int) func(*Node) {
	return func(n *Node) {
		if n != nil {
			n.Value += delta
		}
	}
}

func Example(root *Node) int {
	sizeFn := root.Size // method value captures the current receiver pointer
	mutate := Add(10)
	mutate(root)
	return sizeFn()
}

// The method expression below does not capture a receiver. Its full type is
// func(*Node) int, making the receiver explicit like an ordinary first arg.
var nodeSize = (*Node).Size`,
      },
      {
        type: "steps",
        title: "Worked example: determine interface compatibility",
        items: [
          "Write the declared methods: String has receiver Document; Save has receiver *Document.",
          "Build Document's method set: it contains String only.",
          "Build *Document's method set: it contains both String and Save.",
          "A Formatter interface requiring String is satisfied by Document and *Document.",
          "A RepositoryItem interface requiring String and Save is satisfied only by *Document. Automatic address-taking at d.Save() does not alter this result.",
          "If an interface stores (*Document)(nil), the interface itself is non-nil because it carries a dynamic type. A method must explicitly support a nil receiver if such a value can reach it.",
        ],
      },
      {
        type: "think",
        title: "HEAT: choose the receiver",
        clarify: [
          "Does the type model a small value, or an entity with identity?",
          "Must any method mutate it, preserve object identity, or avoid a potentially expensive copy?",
          "Does the struct contain sync.Mutex, atomic types, or other no-copy state?",
        ],
        model: [
          "Expand a method into an ordinary function whose first parameter is T or *T.",
          "Write separate method-set lists for T and *T before checking an interface.",
          "Treat nil receiver behavior as part of the API contract, not an automatic safety feature.",
        ],
        pitfalls: [
          "Using a value receiver on a type containing sync.Mutex, which copies the lock.",
          "Mixing receivers arbitrarily and exposing different interface behavior for T and *T.",
          "Assuming a pointer receiver is required merely because a struct contains a slice or map; the copied descriptor can still mutate shared elements.",
        ],
      },
      {
        type: "tradeoff",
        title: "Value or pointer receiver?",
        choices: [
          {
            label: "Value receiver T",
            pros: ["Expresses value semantics", "Works for T and *T interface method sets", "Avoids nil receiver states"],
            cons: ["Copies the receiver", "Cannot replace receiver fields in the original", "Dangerous for no-copy fields"],
            when: "Use for small, immutable value-like types such as coordinates, durations, or validated identifiers.",
          },
          {
            label: "Pointer receiver *T",
            pros: ["Can mutate receiver fields", "Preserves identity", "Avoids copying large or no-copy structs"],
            cons: ["Only *T gets pointer-receiver methods", "Introduces a possible nil receiver", "May contribute to escaping depending on use"],
            when: "Use for mutable entities, large structs, synchronized types, or any type whose methods must observe one identity.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases and API discipline",
        body: "A nil *T can call a method, but the method panics if it dereferences the receiver without checking. A map element is not addressable, so a pointer method cannot be called directly on m[key]; retrieve it, modify it, and assign it back, or store pointers in the map. Values reached through interfaces follow method-set rules established at assignment. Receiver names should be short and consistent, usually one or two letters based on the type, never this or self. Finally, do not use a pointer solely to return several values—Go already supports multiple returns.",
      },
    ],
    quiz: [
      {
        id: "methods-set",
        prompt: "Type T has Read() on T and Write() on *T. Which methods are in *T's method set?",
        options: ["Only Write", "Only Read", "Read and Write", "Neither"],
        answerIndex: 2,
        explanation: "*T's method set includes methods declared on both T and *T. T's method set includes only Read.",
      },
      {
        id: "methods-addressable",
        prompt: "Why can a variable v often call a pointer-receiver method even though T lacks that method in its method set?",
        options: [
          "The runtime changes T into *T permanently",
          "The compiler rewrites an addressable call to use &v",
          "Interfaces add missing methods",
          "Pointer methods never mutate",
        ],
        answerIndex: 1,
        explanation: "Selector-call convenience permits implicit address-taking for addressable values. It does not change interface satisfaction.",
      },
      {
        id: "methods-mutex",
        prompt: "Why should a struct containing sync.Mutex generally use pointer receivers?",
        options: [
          "Mutex only works on the heap",
          "Value receivers copy the lock and separate synchronization state",
          "Pointer methods execute atomically",
          "The compiler requires it syntactically",
        ],
        answerIndex: 1,
        explanation: "A copied mutex does not protect the same state and must not be copied after first use. Pointer receivers preserve one lock identity.",
      },
      {
        id: "methods-nil",
        prompt: "What happens when a method is invoked on a nil *Node receiver?",
        options: [
          "The call always fails before entering the method",
          "The method runs and may handle nil; dereferencing nil still panics",
          "Go allocates a Node automatically",
          "The method returns the zero value automatically",
        ],
        answerIndex: 1,
        explanation: "Dispatch is legal because the receiver is simply a nil pointer value passed to the function. Safety depends on the implementation.",
      },
    ],
  },
  {
    slug: "packages-modules-workspace",
    track: "concepts",
    title: "Packages, Modules, and Workspaces",
    subtitle:
      "Design dependency boundaries and understand how Go resolves, versions, and builds code.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["packages", "modules", "go-mod", "workspaces", "api-design"],
    prerequisites: ["go-fundamentals"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to distinguish package names, import paths, modules, and workspaces; organize an application so dependency direction remains clear; explain minimal version selection at a practical level; and use internal packages and command packages intentionally. You will also know when a go.work file helps local multi-module development and why it usually should not determine a published module's dependencies.",
      },
      {
        type: "prose",
        title: "Mental model: three nested concerns",
        body: "A package is the compilation and encapsulation unit: files in one directory normally declare one package and share unexported identifiers. A module is a versioned collection of packages rooted at a go.mod file; its module path prefixes package import paths. A workspace, configured by go.work, tells local Go commands to treat several module directories as main modules at once. Packages shape source boundaries, modules shape version and distribution boundaries, and workspaces shape a developer's local build view.",
      },
      {
        type: "code",
        title: "Put policy behind a small package API",
        language: "go",
        code: `// Package discount computes order discounts.
package discount

import "fmt"

// Customer is the data this policy needs, not a database model with 30 fields.
type Customer struct {
	LoyaltyYears int
	IsEmployee   bool
}

// Percent returns a whole-number discount from 0 through 50.
func Percent(c Customer, subtotalCents int64) (int, error) {
	if subtotalCents < 0 {
		return 0, fmt.Errorf("subtotal must be non-negative: %d", subtotalCents)
	}
	pct := c.LoyaltyYears * 2
	if c.IsEmployee {
		pct += 10
	}
	if pct > 50 {
		pct = 50
	}
	return pct, nil
}`,
      },
      {
        type: "prose",
        title: "Package cohesion and dependency direction",
        body: "A package should own a coherent vocabulary and a reason to change. Its exported names form an API that every importer depends upon; unexported details remain replaceable. Avoid generic buckets named util, common, or helpers because they accumulate unrelated dependencies. Package names should make selectors read naturally: discount.Percent, not discount.DiscountPercent. Cyclic imports are rejected, which forces a directed dependency graph. When two packages want each other, move shared policy to a lower-level package, pass behavior through a consumer-owned interface, or reconsider the boundary—do not create a third dumping ground by reflex.",
      },
      {
        type: "code",
        title: "Wire dependencies at the command boundary",
        language: "go",
        code: `// cmd/orders/main.go
package main

import (
	"context"
	"log"
	"os"

	"example.com/shop/internal/postgres"
	"example.com/shop/order"
)

func run(ctx context.Context) error {
	db, err := postgres.Open(os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	defer db.Close()

	// The command assembles concrete dependencies. The order package contains
	// business policy and need not import environment or process concerns.
	service := order.NewService(db)
	return service.Reconcile(ctx)
}

func main() {
	if err := run(context.Background()); err != nil {
		log.Fatal(err)
	}
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Use package main under cmd/<binary> as a composition root. Parse configuration and construct concrete adapters there; keep reusable policy in importable packages. This makes dependency direction visible and tests cheaper.",
      },
      {
        type: "code",
        title: "Consumer-owned interface breaks an upward dependency",
        language: "go",
        code: `// order/service.go
package order

import "context"

type Order struct {
	ID     string
	Status string
}

// Store is declared by the consumer. Any adapter with these exact methods
// can satisfy it without importing package order merely for a declaration.
type Store interface {
	Pending(context.Context) ([]Order, error)
	Save(context.Context, Order) error
}

type Service struct{ store Store }

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (s *Service) Reconcile(ctx context.Context) error {
	orders, err := s.store.Pending(ctx)
	if err != nil {
		return err
	}
	for _, o := range orders {
		o.Status = "checked"
		if err := s.store.Save(ctx, o); err != nil {
			return err
		}
	}
	return nil
}`,
      },
      {
        type: "steps",
        title: "Worked example: resolve an import",
        items: [
          "The current module declares module example.com/shop in /work/shop/go.mod.",
          "Source imports example.com/shop/order. The module-path prefix matches the main module, so Go reads /work/shop/order.",
          "Source also imports example.com/payments/client. The main go.mod requires example.com/payments v1.4.0.",
          "A transitive dependency requires payments v1.6.0. Minimal version selection chooses the maximum required version, v1.6.0, rather than repeatedly solving for an arbitrary newest version.",
          "During local development, a go.work file may use ../payments. Go commands then build the local module instead. That workspace override does not edit shop's go.mod and consumers still receive the declared module dependency.",
          "Run go mod tidy in each module to align requirements and sums with actual imports and tests; run CI without accidental workspace state when verifying published-module behavior.",
        ],
      },
      {
        type: "code",
        title: "Module and workspace commands",
        language: "bash",
        code: `# Create a module whose path prefixes all public package imports.
go mod init example.com/shop

# Explain why a module is in the graph and inspect selected versions.
go mod why -m example.com/payments
go list -m all

# Create a local workspace containing two independently versioned modules.
go work init ./shop ./payments
go work sync

# Verify as a consumer would, without a parent go.work override.
GOWORK=off go test ./...`,
      },
      {
        type: "think",
        title: "HEAT: sketch the dependency graph",
        clarify: [
          "Which packages represent policy, and which packages are process or infrastructure adapters?",
          "Which code is versioned and released together, making one module sensible?",
          "Would a proposed import point from stable policy toward volatile infrastructure?",
        ],
        model: [
          "Draw packages as nodes and imports as one-way arrows; no directed cycle may exist.",
          "Mark the go.mod root around packages that share one version graph.",
          "Treat go.work as a local lens over modules, not as a replacement for their release metadata.",
        ],
        pitfalls: [
          "Using replace directives to unpublished local paths and accidentally committing them.",
          "Splitting into many modules before independent versioning or ownership is needed.",
          "Putting reusable library code under internal when external importers are intended.",
        ],
      },
      {
        type: "tradeoff",
        title: "One module or several?",
        choices: [
          {
            label: "Single module",
            pros: ["Atomic changes", "One dependency graph", "Simple refactoring and CI"],
            cons: ["One release/version boundary", "All packages share dependency selection"],
            when: "Default for one product or library unless components genuinely need independent consumers and releases.",
          },
          {
            label: "Multiple modules",
            pros: ["Independent versions", "Smaller consumer dependency surfaces", "Clear publication boundaries"],
            cons: ["Cross-module changes require coordination", "More release and CI machinery", "Local work often needs go.work"],
            when: "Use when modules have independent lifecycles, ownership, or external consumers—not merely to organize directories.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases: internal, major versions, and initialization",
        body: "A package beneath an internal directory may be imported only by code rooted in the parent tree, a compiler-enforced boundary useful for non-public APIs. Modules at major version v2 or later normally include /v2 in the module and import path. Package init functions run after dependencies are initialized and before main, but hidden side effects make startup order hard to test; prefer explicit construction. Test files may use package p for white-box access or p_test to exercise only the public API. Build tags and platform suffixes can select files, so ensure every supported target still presents a coherent package.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "A workspace can hide an undeclared or incompatible module requirement because local source wins. Validate release behavior with GOWORK=off and a clean module cache in CI when publishing modules.",
      },
    ],
    quiz: [
      {
        id: "packages-unit",
        prompt: "What is Go's primary compilation and encapsulation unit?",
        options: ["A single file", "A package", "A workspace", "A git branch"],
        answerIndex: 1,
        explanation: "Files in a package compile together and share unexported identifiers. Modules version collections of packages.",
      },
      {
        id: "packages-work",
        prompt: "What does go.work primarily change?",
        options: [
          "The published version of every module",
          "The local set of main modules used by Go commands",
          "Package visibility rules",
          "The Go language version globally",
        ],
        answerIndex: 1,
        explanation: "A workspace provides a local multi-module build view. It does not replace each module's go.mod release contract.",
      },
      {
        id: "packages-cycle",
        prompt: "Two packages import each other. Which response best addresses the design?",
        options: [
          "Enable cyclic imports in go.mod",
          "Move shared policy or invert behavior through a focused interface",
          "Rename one import",
          "Put all code in init functions",
        ],
        answerIndex: 1,
        explanation: "Cycles expose unclear ownership. Moving stable policy downward or depending on consumer-required behavior restores a directed graph.",
      },
      {
        id: "packages-internal",
        prompt: "What does an internal directory enforce?",
        options: [
          "Names are unexported inside the package",
          "Imports are limited to code within the parent tree",
          "The package cannot have tests",
          "The module cannot be public",
        ],
        answerIndex: 1,
        explanation: "The go command checks the importer path against the parent of internal, creating an import boundary stronger than naming convention.",
      },
    ],
  },
  {
    slug: "interfaces",
    track: "concepts",
    title: "Interfaces: Behavior, Boundaries, and Runtime Values",
    subtitle:
      "Design small consumer-owned contracts and reason correctly about dynamic types and typed nils.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["interfaces", "composition", "type-assertions", "dependency-inversion"],
    prerequisites: ["methods-and-receivers", "packages-modules-workspace"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to define interfaces at the point of use, check satisfaction from method sets, and choose between a concrete type, an interface, and a type parameter. You will also be able to diagnose the typed-nil trap, use type assertions and type switches safely, and explain why implicit satisfaction enables decoupling without making every dependency abstract.",
      },
      {
        type: "prose",
        title: "Mental model: an interface value carries type and data",
        body: "An interface type is a set of required methods. A concrete value satisfies it implicitly when its method set includes those methods. At runtime, an interface value can be modeled as a pair: a dynamic concrete type and dynamic data. The interface is nil only when both are absent. If it stores a nil *Client, its dynamic type is still *Client, so comparison with nil is false. Method dispatch uses the dynamic type's implementation and passes the dynamic data as receiver.",
      },
      {
        type: "code",
        title: "Define the minimum behavior at the consumer",
        language: "go",
        code: `package report

import (
	"context"
	"fmt"
)

type Row struct {
	ID    string
	Total int64
}

// Queryer belongs here because Generate is the consumer. A database adapter,
// in-memory fake, or cached decorator can satisfy this one-method contract.
type Queryer interface {
	Orders(context.Context, string) ([]Row, error)
}

func Generate(ctx context.Context, q Queryer, customerID string) (int64, error) {
	rows, err := q.Orders(ctx, customerID)
	if err != nil {
		return 0, fmt.Errorf("query orders for %s: %w", customerID, err)
	}
	var total int64
	for _, row := range rows {
		total += row.Total
	}
	return total, nil
}`,
      },
      {
        type: "prose",
        title: "Accept interfaces when substitutability is real",
        body: "The slogan accept interfaces, return structs is a heuristic, not a law. Accept an interface when the caller's operation needs behavior that several implementations can meaningfully provide or when a boundary makes a test double useful. Return a concrete type by default so callers retain its full API and your package can add methods without expanding an interface contract. Do not create an interface beside every struct before a consumer exists; speculative interfaces add names, mocks, and method-set constraints without proven flexibility.",
      },
      {
        type: "code",
        title: "See the typed-nil pair",
        language: "go",
        code: `package main

import "fmt"

type Notifier interface {
	Notify(string) error
}

type EmailClient struct {
	address string
}

func (c *EmailClient) Notify(message string) error {
	if c == nil {
		return fmt.Errorf("email client is not configured")
	}
	fmt.Printf("send %q to %s\\n", message, c.address)
	return nil
}

func load(enabled bool) Notifier {
	var client *EmailClient
	if enabled {
		client = &EmailClient{address: "ops@example.com"}
	}
	return client // when disabled: dynamic type *EmailClient, dynamic data nil
}

func main() {
	n := load(false)
	fmt.Println(n == nil) // false
	fmt.Println(n.Notify("disk full"))
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Do not return a typed nil pointer as an interface to mean no value. Return a literal nil interface on that path, or change the API to return a concrete pointer plus an explicit status/error.",
      },
      {
        type: "code",
        title: "Assertions, switches, and capability interfaces",
        language: "go",
        code: `package transport

import (
	"fmt"
	"io"
)

// Flush only when the runtime value actually supports flushing.
type flusher interface {
	Flush() error
}

func WriteMessage(w io.Writer, payload []byte) error {
	if _, err := w.Write(payload); err != nil {
		return fmt.Errorf("write message: %w", err)
	}
	if f, ok := w.(flusher); ok { // comma-ok avoids panic when unsupported
		if err := f.Flush(); err != nil {
			return fmt.Errorf("flush message: %w", err)
		}
	}
	return nil
}

func Describe(v any) string {
	switch x := v.(type) {
	case nil:
		return "<nil interface>"
	case string:
		return fmt.Sprintf("string(%d)", len(x))
	case fmt.Stringer:
		return x.String()
	default:
		return fmt.Sprintf("%T", x)
	}
}`,
      },
      {
        type: "steps",
        title: "Worked example: interface assignment and call",
        items: [
          "Declare var p *bytes.Buffer. The pointer is nil and has static type *bytes.Buffer.",
          "Assign var w io.Writer = p. *bytes.Buffer's method set includes Write, so assignment compiles.",
          "The interface w now has dynamic type *bytes.Buffer and dynamic data nil; therefore w != nil.",
          "Calling w.Write dispatches to (*bytes.Buffer).Write with a nil receiver. That implementation does not promise nil safety, so the call can panic.",
          "By contrast, var w io.Writer leaves both dynamic type and data absent; w == nil and no method should be called.",
          "Prevent the state at construction boundaries rather than scattering reflection-based nil checks throughout consumers.",
        ],
      },
      {
        type: "think",
        title: "HEAT: design an interface from a use case",
        clarify: [
          "What exact operation does this consumer perform?",
          "Are multiple implementations meaningful, or is abstraction speculative?",
          "Does the required method need T or *T according to its method set?",
        ],
        model: [
          "Write the interface as the intersection of behavior the consumer actually calls.",
          "Model runtime values as (dynamic type, dynamic data).",
          "Place adaptation at boundaries so domain code depends on a stable, narrow capability.",
        ],
        pitfalls: [
          "Returning broad provider-owned interfaces with many unused methods.",
          "Using any and type switches where a concrete type or generic constraint would preserve compile-time guarantees.",
          "Embedding an interface accidentally and acquiring future methods you did not intend to promise.",
        ],
      },
      {
        type: "tradeoff",
        title: "Interface, concrete type, or type parameter?",
        choices: [
          {
            label: "Concrete type",
            pros: ["Strongest API", "Simplest call path", "No unnecessary abstraction"],
            cons: ["No behavioral substitution at that boundary"],
            when: "Use by default when one representation and implementation are part of the contract.",
          },
          {
            label: "Interface",
            pros: ["Runtime substitution", "Decouples consumer from adapters", "Can express capabilities"],
            cons: ["Dynamic dispatch", "Typed-nil state", "Contract grows costly once public"],
            when: "Use when behavior varies and a consumer can state a small stable requirement.",
          },
          {
            label: "Type parameter",
            pros: ["Compile-time operations across a family of types", "Preserves concrete type relationships"],
            cons: ["Generic API complexity", "Not runtime heterogeneity by itself"],
            when: "Use for algorithms or containers where the same operations apply across types.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases and contract evolution",
        body: "Adding a method to a published interface breaks every implementation, including downstream fakes you cannot see; keep public interfaces especially small. An interface can be comparable only when its dynamic value is comparable—comparing two interfaces containing slices panics. A type assertion x := v.(T) panics on mismatch; use x, ok := v.(T) unless mismatch truly indicates a programming invariant violation. Embedding interfaces composes method requirements, while embedding concrete types promotes methods but does not create subtype relationships. The empty interface any accepts every value but guarantees no operations.",
      },
      {
        type: "complexity",
        time: "Interface dispatch and assertions are O(1)",
        space: "An interface value is constant-sized, but assigned values may escape or be boxed",
        notes: "Do not optimize away interfaces without profiles. Their primary cost is often architectural—broader contracts and lost static information—rather than dispatch time.",
      },
    ],
    quiz: [
      {
        id: "interfaces-nil",
        prompt: "Why is an interface containing (*Client)(nil) not equal to nil?",
        options: [
          "Interfaces cannot be nil",
          "Its dynamic type is present even though dynamic data is nil",
          "Go allocates Client automatically",
          "Pointer comparison is disabled",
        ],
        answerIndex: 1,
        explanation: "Only an interface with neither dynamic type nor data is nil. The pair (*Client, nil) is a populated interface.",
      },
      {
        id: "interfaces-location",
        prompt: "Where should a small interface usually be declared?",
        options: [
          "Beside every concrete provider",
          "In a global interfaces package",
          "Near the consumer that requires the behavior",
          "Only in test files",
        ],
        answerIndex: 2,
        explanation: "Consumer ownership keeps the contract minimal and prevents providers from dictating broad abstractions.",
      },
      {
        id: "interfaces-assert",
        prompt: "What does x, ok := v.(Flusher) provide?",
        options: [
          "A compile-time generic conversion",
          "A safe runtime capability check without panic",
          "A deep copy of v",
          "Automatic method generation",
        ],
        answerIndex: 1,
        explanation: "ok reports whether v's dynamic type implements Flusher. The one-result form panics when it does not.",
      },
      {
        id: "interfaces-evolution",
        prompt: "Why is adding a method to a public interface potentially breaking?",
        options: [
          "Methods cannot be exported",
          "Every existing implementation must now provide the new method",
          "It changes all concrete struct layouts",
          "Go interfaces are versioned separately",
        ],
        answerIndex: 1,
        explanation: "Interface satisfaction is structural. Expanding the requirement invalidates previously satisfying types.",
      },
    ],
  },
  {
    slug: "embedding-composition",
    track: "concepts",
    title: "Embedding and Composition",
    subtitle:
      "Reuse behavior without inheritance and keep ownership, dispatch, and public APIs explicit.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["embedding", "composition", "delegation", "api-design"],
    prerequisites: ["interfaces"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to distinguish struct embedding, interface embedding, and ordinary named-field composition. You will predict selector and method promotion, explain why embedding is not inheritance or subtyping, and decide when explicit delegation protects a cleaner API. You will also recognize collisions, zero-value assumptions, and serialization surprises caused by embedded fields.",
      },
      {
        type: "prose",
        title: "Mental model: promotion is shorthand, not ownership transfer",
        body: "An embedded field is still a real field with a concrete name—its type name—stored inside the outer struct. Selectors may be promoted, so e.Logger.Print can mean e.Logger.Print, but the outer value does not become a Logger. A promoted method executes with the embedded receiver, not the outer receiver, and Go does not perform virtual dispatch through an inheritance hierarchy. Composition works because the outer type contains collaborators and chooses which behavior to expose.",
      },
      {
        type: "code",
        title: "Embedding promotes selectors",
        language: "go",
        code: `package audit

import (
	"fmt"
	"time"
)

type Metadata struct {
	CreatedAt time.Time
	CreatedBy string
}

func (m Metadata) Age(now time.Time) time.Duration {
	return now.Sub(m.CreatedAt)
}

type Record struct {
	Metadata // embedded field; its field name is Metadata
	ID       string
}

func Example(r Record, now time.Time) {
	fmt.Println(r.CreatedBy)     // shorthand for r.Metadata.CreatedBy
	fmt.Println(r.Age(now))      // promoted method
	fmt.Println(r.Metadata.Age(now)) // explicit form reveals the receiver
}`,
      },
      {
        type: "prose",
        title: "Promotion does not create dynamic override",
        body: "If an embedded component's method calls another method on its own receiver, it calls that component's implementation. Defining a same-named method on the outer type shadows the promoted selector for callers, but it does not override internal calls in the embedded type. This differs fundamentally from class inheritance. When behavior needs variation, pass an interface or function into the component so dispatch is explicit.",
      },
      {
        type: "code",
        title: "Explicit composition enables real substitution",
        language: "go",
        code: `package service

import (
	"context"
	"fmt"
)

type Sender interface {
	Send(context.Context, string) error
}

type RetryingSender struct {
	next     Sender // named field makes the decoration relationship explicit
	attempts int
}

func NewRetryingSender(next Sender, attempts int) (*RetryingSender, error) {
	if next == nil {
		return nil, fmt.Errorf("sender is required")
	}
	if attempts < 1 {
		return nil, fmt.Errorf("attempts must be positive")
	}
	return &RetryingSender{next: next, attempts: attempts}, nil
}

func (s *RetryingSender) Send(ctx context.Context, msg string) error {
	var err error
	for attempt := 1; attempt <= s.attempts; attempt++ {
		if err = s.next.Send(ctx, msg); err == nil {
			return nil
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
	}
	return fmt.Errorf("send after %d attempts: %w", s.attempts, err)
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Prefer a named field when the outer type should expose only a curated API. Embedding can unintentionally promote every exported method and make that surface difficult to retract later.",
      },
      {
        type: "code",
        title: "Delegate deliberately and resolve collisions",
        language: "go",
        code: `package device

import "fmt"

type FileStore struct{}
func (FileStore) Close() error { return nil }
func (FileStore) Path() string { return "/tmp/data" }

type Metrics struct{}
func (Metrics) Close() error { return nil }
func (Metrics) Count() int   { return 42 }

type Agent struct {
	files   FileStore // named collaborators avoid promoted Close collision
	metrics Metrics
}

func (a *Agent) DataPath() string {
	return a.files.Path() // curated delegation; callers do not depend on FileStore
}

func (a *Agent) Close() error {
	if err := a.files.Close(); err != nil {
		return fmt.Errorf("close files: %w", err)
	}
	if err := a.metrics.Close(); err != nil {
		return fmt.Errorf("close metrics: %w", err)
	}
	return nil
}`,
      },
      {
        type: "steps",
        title: "Worked example: trace selector resolution",
        items: [
          "Server embeds Logger, and Logger has Print and Close methods. Server therefore has promoted selectors s.Print and s.Close when no shallower name conflicts.",
          "Server declares its own Close method. s.Close resolves to Server.Close; s.Logger.Close still reaches the embedded implementation.",
          "Server also embeds Metrics, which has Print. Now s.Print is ambiguous because two fields at the same depth provide it; the compiler requires s.Logger.Print or s.Metrics.Print.",
          "Assigning *Server to an interface requiring Close uses Server.Close. It is method-set satisfaction, not a subtype conversion to Logger.",
          "If Logger is a nil embedded pointer, a promoted call can enter a method with a nil *Logger receiver. Whether it panics depends on that method's contract.",
        ],
      },
      {
        type: "think",
        title: "HEAT: inspect the public surface",
        clarify: [
          "Is the embedded type part of the outer type's lasting public identity?",
          "Which promoted methods are being promised unintentionally?",
          "Would a named field plus two delegating methods express ownership more clearly?",
        ],
        model: [
          "Expand every promoted selector to its full field path.",
          "Draw method calls with the actual receiver that executes them.",
          "Use interfaces or function fields for variation, embedding only for structural composition.",
        ],
        pitfalls: [
          "Expecting outer methods to override calls made inside an embedded type.",
          "Embedding a large third-party type and leaking its evolving API.",
          "Ignoring duplicate promoted names until a dependency adds a colliding method.",
        ],
      },
      {
        type: "tradeoff",
        title: "Embedding or named-field delegation?",
        choices: [
          {
            label: "Embed",
            pros: ["Concise selector promotion", "Useful when the embedded API is intentionally part of the outer API", "Can compose interface requirements"],
            cons: ["Broadens public surface", "Creates collision risk", "Can be mistaken for inheritance"],
            when: "Use when callers should legitimately view the embedded capability as part of the outer type's identity.",
          },
          {
            label: "Named field and delegation",
            pros: ["Curated API", "Clear ownership", "Easy to adapt arguments, errors, and lifecycle"],
            cons: ["Requires small forwarding methods", "More explicit code"],
            when: "Use for implementation collaborators, third-party types, or any dependency whose whole API should not escape.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases: pointers, literals, and serialization",
        body: "An embedded pointer keeps the outer struct small and can represent absence, but its zero value is nil; promoted calls may panic. An embedded value contributes its full size and zero value. Promoted fields cannot be used as keys in an outer composite literal: initialize the embedded field explicitly. Encoding packages may flatten anonymous fields and resolve tag conflicts according to their own rules, so test JSON shape rather than assuming selector rules equal serialization rules. Embedding an interface gives the outer struct promoted methods but also leaves a nil interface field in the zero value.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Embedding a mutex merely to call Lock directly also exports synchronization as part of your type's method set. Prefer a named unexported mu field so callers cannot manipulate your invariants.",
      },
    ],
    quiz: [
      {
        id: "embedding-promotion",
        prompt: "What does method promotion from an embedded field mean?",
        options: [
          "The outer type inherits implementation and becomes a subtype",
          "A shorthand selector forwards to the embedded field's method",
          "The method receiver changes to the outer type",
          "The embedded method is copied at runtime",
        ],
        answerIndex: 1,
        explanation: "Promotion is selector shorthand. The embedded value remains the receiver and the outer type does not enter an inheritance hierarchy.",
      },
      {
        id: "embedding-collision",
        prompt: "Two embedded fields at the same depth both expose Close. What does s.Close do?",
        options: [
          "Calls both",
          "Calls the first declared field",
          "Fails to compile as ambiguous unless qualified",
          "Chooses one at runtime",
        ],
        answerIndex: 2,
        explanation: "Neither same-depth selector wins. Use s.First.Close or s.Second.Close, or define an explicit outer Close.",
      },
      {
        id: "embedding-delegation",
        prompt: "Why can a named field be safer for a third-party collaborator?",
        options: [
          "Named fields allocate less memory",
          "It prevents the collaborator's entire method set from becoming your public API",
          "Embedded fields cannot call methods",
          "Named fields provide virtual dispatch",
        ],
        answerIndex: 1,
        explanation: "Delegation lets the outer package expose only stable operations and adapt behavior or errors at the boundary.",
      },
      {
        id: "embedding-override",
        prompt: "If Outer defines Print and embeds Inner, what does Inner's own method call to i.Print dispatch to?",
        options: [
          "Outer.Print automatically",
          "Inner.Print on its Inner receiver",
          "Both methods",
          "Whichever was declared last",
        ],
        answerIndex: 1,
        explanation: "There is no virtual override. Code executing with an Inner receiver resolves Inner's methods statically.",
      },
    ],
  },
  {
    slug: "panic-recover-defer",
    track: "concepts",
    title: "Defer, Panic, and Recover",
    subtitle:
      "Model stack unwinding precisely and build narrow recovery boundaries without hiding ordinary failures.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["defer", "panic", "recover", "cleanup", "boundaries"],
    prerequisites: ["go-fundamentals", "methods-and-receivers"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to predict the order and values used by deferred calls, use defer for reliable cleanup, and distinguish ordinary error returns from invariant-breaking panics. You will understand exactly where recover works, why it cannot catch a panic from another goroutine, and how to convert a panic at a process boundary without discarding diagnostics or corrupting state.",
      },
      {
        type: "prose",
        title: "Mental model: each call frame owns a deferred stack",
        body: "When execution reaches a defer statement, Go evaluates the deferred function value and its arguments immediately, then pushes the resulting call onto the current function's defer stack. On any return from that function—including a return caused by panic—deferred calls run last-in, first-out. A panic begins unwinding frames: each frame runs its defers before the next frame unwinds. If no deferred function recovers, the program prints the panic and stacks and terminates. This model explains cleanup, ordering, and recovery without treating defer as background work.",
      },
      {
        type: "code",
        title: "Argument evaluation and LIFO order",
        language: "go",
        code: `package main

import "fmt"

func trace() (result int) {
	result = 1

	// The argument is evaluated now, so this deferred call prints 1.
	defer fmt.Println("argument snapshot:", result)

	// A closure reads the named result later, while the function returns.
	defer func() {
		fmt.Println("closure sees:", result) // prints 3
		result *= 10                        // named result becomes 30
	}()

	defer fmt.Println("runs first")
	result = 3
	return // defers run: "runs first", closure, then argument snapshot
}

func main() {
	fmt.Println("returned:", trace()) // returned: 30
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "A deferred closure can modify a named result, but doing so casually makes control flow difficult to audit. Reserve the pattern for focused responsibilities such as translating a cleanup error when no earlier error exists.",
      },
      {
        type: "code",
        title: "Cleanup that preserves the primary error",
        language: "go",
        code: `package export

import (
	"fmt"
	"os"
)

func Write(path string, data []byte) (err error) {
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create %s: %w", path, err)
	}

	defer func() {
		// A close error matters only if writing did not already fail. This policy
		// keeps the primary failure instead of silently replacing it.
		if closeErr := f.Close(); err == nil && closeErr != nil {
			err = fmt.Errorf("close %s: %w", path, closeErr)
		}
	}()

	if _, err := f.Write(data); err != nil {
		return fmt.Errorf("write %s: %w", path, err)
	}
	if err := f.Sync(); err != nil {
		return fmt.Errorf("sync %s: %w", path, err)
	}
	return nil
}`,
      },
      {
        type: "prose",
        title: "Panic is for broken assumptions, not routine branching",
        body: "Return errors for expected operational failures: invalid input, missing files, timeouts, unavailable services, and user requests. Panic is appropriate when continuing the current operation is impossible because a programmer invariant is broken, or in a Must-style startup helper whose documented contract says invalid static configuration is fatal. Standard operations such as indexing out of range and sending on a closed channel also panic. Libraries should rarely panic for caller-controlled data because callers need ordinary control over failure.",
      },
      {
        type: "code",
        title: "Recover at a request boundary",
        language: "go",
        code: `package web

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
)

func Recover(next http.Handler, logger *log.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if value := recover(); value != nil {
				// Capture diagnostics before returning a generic response. Do not
				// expose stack traces or panic values to untrusted clients.
				logger.Printf("panic: %v\\n%s", value, debug.Stack())
				http.Error(w, "internal server error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func MustPositive(n int) int {
	if n <= 0 {
		panic(fmt.Sprintf("expected positive constant, got %d", n))
	}
	return n
}`,
      },
      {
        type: "steps",
        title: "Worked example: unwind a panic",
        items: [
          "handler calls parse, and parse defers release(\"parse\") before calling decode.",
          "decode defers release(\"decode\") and then panics with the value \"bad schema\".",
          "decode stops normal execution and runs its defer. The frame then unwinds to parse.",
          "parse runs its defer. Because it has no recovery function, unwinding continues to handler.",
          "handler's directly deferred closure calls recover and receives \"bad schema\". The panic stops.",
          "Execution does not resume at the panic site. handler continues by returning normally after its deferred closure finishes.",
          "If decode had panicked in a newly started goroutine, handler's defer could not recover it; that goroutine needs its own boundary.",
        ],
      },
      {
        type: "think",
        title: "HEAT: place a recovery boundary",
        clarify: [
          "Is the failure expected and actionable by the caller? If yes, return an error.",
          "Can state remain trustworthy after this panic, or must the process terminate?",
          "Which goroutine executes the risky code, and where can diagnostics be captured?",
        ],
        model: [
          "Draw call frames with a LIFO defer stack attached to each.",
          "Trace panic upward one frame at a time, executing defers on the way.",
          "Place recover only at a boundary that can end one isolated unit of work safely.",
        ],
        pitfalls: [
          "Recovering everywhere and allowing corrupted state to continue.",
          "Assuming a parent goroutine can recover a child goroutine's panic.",
          "Calling recover indirectly from a helper rather than directly in the deferred function.",
        ],
      },
      {
        type: "tradeoff",
        title: "Error return or panic?",
        choices: [
          {
            label: "Return error",
            pros: ["Explicit in API", "Composable and testable", "Caller controls policy"],
            cons: ["Must be propagated deliberately", "Can become repetitive without good boundaries"],
            when: "Use for invalid input, I/O, cancellation, dependency failures, and other expected operational outcomes.",
          },
          {
            label: "Panic",
            pros: ["Immediately aborts the current call path", "Runs deferred cleanup", "Signals a broken invariant strongly"],
            cons: ["Non-local control flow", "Can terminate the process", "Requires a safe boundary to contain"],
            when: "Use for impossible states, programmer bugs, or explicitly documented Must initialization.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases and loop cleanup",
        body: "recover returns nil when called outside the active panic path, and it is effective only when called directly by a deferred function in the panicking goroutine. A panic value can itself be nil-like, so recovery code should follow the current language/runtime semantics rather than use panic(nil) as a control signal. os.Exit and log.Fatal terminate immediately and do not run defers. Deferring resource cleanup inside a very long loop postpones all cleanup until the surrounding function returns; extract one iteration into a helper so each resource closes promptly. Defers run after return values are assigned but before the caller receives them.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "A recovery boundary should log the panic value and stack, end the isolated operation with a generic failure, and preserve process health only when invariants outside that operation remain trustworthy.",
      },
    ],
    quiz: [
      {
        id: "panic-defer-args",
        prompt: "When are arguments to a deferred function call evaluated?",
        options: ["When the function returns", "When the defer statement executes", "After every later assignment", "Only during panic"],
        answerIndex: 1,
        explanation: "The function value and arguments are captured immediately; the call itself runs later. Closures can instead read variables at execution time.",
      },
      {
        id: "panic-order",
        prompt: "In what order do multiple defers in one function run?",
        options: ["First-in, first-out", "Last-in, first-out", "Alphabetically", "Concurrently"],
        answerIndex: 1,
        explanation: "Each frame has a stack of deferred calls, so the most recently deferred call runs first.",
      },
      {
        id: "panic-goroutine",
        prompt: "Can a defer in goroutine A recover a panic from goroutine B?",
        options: ["Always", "Only with a channel", "No; recovery is confined to the panicking goroutine", "Only in tests"],
        answerIndex: 2,
        explanation: "Each goroutine has its own stack. Put a recovery boundary inside B if its work is safe to isolate.",
      },
      {
        id: "panic-usage",
        prompt: "Which failure should normally be returned as an error?",
        options: ["A violated internal impossible-state invariant", "A missing user-requested file", "A corrupted compiler assumption", "An invalid hard-coded Must configuration"],
        answerIndex: 1,
        explanation: "Missing input is expected and caller-actionable. It belongs in ordinary error control flow.",
      },
    ],
  },
  {
    slug: "context-and-errors",
    track: "concepts",
    title: "Context and Error Design",
    subtitle:
      "Propagate cancellation, preserve error meaning, and translate failures at architectural boundaries.",
    difficulty: "intermediate",
    minutes: 55,
    tags: ["context", "errors", "cancellation", "wrapping", "api-design"],
    prerequisites: ["interfaces", "panic-recover-defer"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to thread context through a call graph, assign ownership of cancellation functions, and avoid goroutine leaks caused by ignored cancellation. You will design errors that preserve both operation context and machine-checkable identity, use errors.Is and errors.As correctly, and translate infrastructure failures into stable domain or transport outcomes without depending on message strings.",
      },
      {
        type: "prose",
        title: "Mental model: context is an immutable cancellation tree",
        body: "A Context is a small interface representing a deadline, a done signal, an error, and request-scoped values. Deriving a context creates a child linked to its parent. Parent cancellation closes every descendant's Done channel; child cancellation does not cancel siblings or ancestors. Values conceptually flow downward. The cancel function releases timer and parent-child bookkeeping, so the code that creates a cancellable child owns calling cancel, usually with defer immediately after successful creation.",
      },
      {
        type: "code",
        title: "Budget an outbound operation",
        language: "go",
        code: `package profile

import (
	"context"
	"errors"
	"fmt"
	"time"
)

type Loader interface {
	Load(context.Context, string) (string, error)
}

func DisplayName(ctx context.Context, loader Loader, id string) (string, error) {
	// Bound this dependency even if the incoming request has a longer deadline.
	callCtx, cancel := context.WithTimeout(ctx, 250*time.Millisecond)
	defer cancel() // releases timer resources on every return path

	name, err := loader.Load(callCtx, id)
	if err != nil {
		switch {
		case errors.Is(err, context.DeadlineExceeded):
			return "", fmt.Errorf("profile lookup exceeded 250ms: %w", err)
		case errors.Is(err, context.Canceled):
			return "", fmt.Errorf("profile lookup canceled: %w", err)
		default:
			return "", fmt.Errorf("load profile %s: %w", id, err)
		}
	}
	return name, nil
}`,
      },
      {
        type: "prose",
        title: "Context is a signal, not a worker killer",
        body: "Cancellation is cooperative. Closing Done does not forcibly stop a function or goroutine; code must select on it, call context-aware dependencies, or periodically check ctx.Err during CPU work. Pass context as the first parameter and do not store it in long-lived structs. Use values only for request-scoped metadata that crosses API boundaries—trace IDs or auth claims—not for optional configuration or required dependencies. Use unexported key types to prevent collisions.",
      },
      {
        type: "code",
        title: "A cancellation-aware stream",
        language: "go",
        code: `package stream

import "context"

func Squares(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out) // this goroutine owns the only send side
		for {
			select {
			case <-ctx.Done():
				return
			case n, ok := <-in:
				if !ok {
					return
				}
				select {
				case <-ctx.Done():
					return // cancellation also unblocks a blocked send
				case out <- n * n:
				}
			}
		}
	}()
	return out
}`,
      },
      {
        type: "prose",
        title: "Errors are values with identity and a chain",
        body: "An error should answer two audiences. Humans need operation context such as which order failed. Code needs stable semantics such as not found, validation, or temporary unavailability. Wrap a cause with fmt.Errorf and %w so errors.Is can follow sentinel identity and errors.As can locate a typed error anywhere in the chain. A message is for people, not a parsing protocol. Every layer should add information it uniquely knows; repeating failed to at every layer creates noise.",
      },
      {
        type: "code",
        title: "Typed details plus a stable sentinel",
        language: "go",
        code: `package account

import (
	"context"
	"errors"
	"fmt"
)

var ErrInvalid = errors.New("invalid account")

type FieldError struct {
	Field string
	Value string
}

func (e *FieldError) Error() string {
	return fmt.Sprintf("%s has invalid value %q", e.Field, e.Value)
}

// Is lets every FieldError match the broad ErrInvalid category while still
// carrying details for errors.As.
func (e *FieldError) Is(target error) bool {
	return target == ErrInvalid
}

func ParseID(raw string) (string, error) {
	if len(raw) != 8 {
		return "", fmt.Errorf("parse account id: %w", &FieldError{
			Field: "id",
			Value: raw,
		})
	}
	return raw, nil
}

func HTTPStatus(err error) int {
	var fieldErr *FieldError
	switch {
	case errors.As(err, &fieldErr):
		return 400
	case errors.Is(err, context.Canceled):
		return 499
	default:
		return 500
	}
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never compare wrapped errors with == or parse Error() text. Use errors.Is for semantic identity and errors.As for typed details; reserve message text for human diagnostics.",
      },
      {
        type: "steps",
        title: "Worked example: deadline and error propagation",
        items: [
          "An HTTP request arrives with a two-second context deadline.",
          "The handler derives a 300ms child for the inventory service and immediately defers its cancel function.",
          "The repository receives that child as its first argument and passes it to the database driver's context-aware query.",
          "At 300ms the child's Done channel closes. The database call returns context deadline exceeded; the sibling payment operation using another child can follow its own policy.",
          "The repository wraps the cause as query inventory for SKU-7. The service wraps once more with its domain operation.",
          "At the HTTP boundary, errors.Is still finds context.DeadlineExceeded through both wrappers and maps it to the chosen response. Logs retain the operation chain.",
          "The deferred cancel runs even though the timer fired, releasing references promptly.",
        ],
      },
      {
        type: "think",
        title: "HEAT: design cancellation and failure semantics",
        clarify: [
          "Which boundary owns the total deadline, and which dependency needs a smaller sub-budget?",
          "What work must stop when the caller leaves?",
          "Which error categories must callers distinguish programmatically?",
        ],
        model: [
          "Draw a context tree with deadlines beside each child and cancellation arrows downward.",
          "Draw the error chain from low-level cause outward through operation wrappers.",
          "Translate errors only at boundaries that understand both source and destination semantics.",
        ],
        pitfalls: [
          "Creating WithTimeout and forgetting cancel.",
          "Starting work with context.Background inside a request and severing cancellation.",
          "Wrapping with %v, which preserves text but breaks the error chain.",
        ],
      },
      {
        type: "tradeoff",
        title: "Sentinel, typed error, or opaque wrapped error?",
        choices: [
          {
            label: "Sentinel",
            pros: ["Simple stable category", "Easy errors.Is matching"],
            cons: ["Carries no per-instance structured fields", "Becomes public API once exposed"],
            when: "Use for broad conditions such as not found or conflict that callers need to branch on.",
          },
          {
            label: "Typed error",
            pros: ["Carries structured details", "Discoverable with errors.As", "Can customize Is behavior"],
            cons: ["Exports more API surface", "Pointer/value matching requires care"],
            when: "Use when callers need fields such as retry delay, invalid field, or conflicting version.",
          },
          {
            label: "Opaque wrapped cause",
            pros: ["Adds human context", "Preserves diagnostics", "Avoids inventing categories"],
            cons: ["Can expose implementation identity if wrapped across a public boundary"],
            when: "Use within an architectural layer; translate before implementation details become a lasting public contract.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases: causes, joins, and value keys",
        body: "A context may already be canceled when a function starts, so check or enter a select before expensive work. A nil Done channel, as on context.Background, disables that select case. Modern Go can attach a cancellation cause and combine independent failures with errors.Join; errors.Is and errors.As traverse those relationships, but Error text order is not a machine contract. Never pass nil Context—use context.TODO temporarily when a caller has not yet decided the source. Context values retain reachable objects for the request lifetime, so keep them small and immutable. A deadline reported by ctx.Deadline can help skip work that cannot finish in the remaining budget.",
      },
      {
        type: "complexity",
        time: "Cancellation propagation is proportional to affected descendants; Is/As scale with error-chain size",
        space: "Each derived context and wrapper adds small metadata and references",
        notes: "The dominant cost is usually retained work: a function that ignores cancellation can consume far more CPU, memory, and connections than context bookkeeping itself.",
      },
    ],
    quiz: [
      {
        id: "context-owner",
        prompt: "Who should normally call the cancel function returned by context.WithTimeout?",
        options: ["The garbage collector", "The code that created that child context", "Any deep callee", "Only the process main function"],
        answerIndex: 1,
        explanation: "Creation establishes ownership. Deferring cancel at that site reliably releases timer and tree resources on all paths.",
      },
      {
        id: "context-cooperative",
        prompt: "What does cancellation do to a running goroutine?",
        options: [
          "Immediately terminates it",
          "Closes a signal that cooperative code must observe",
          "Rolls back all its writes",
          "Converts every return into panic",
        ],
        answerIndex: 1,
        explanation: "Context has no force-stop mechanism. Functions and blocking operations must explicitly react to Done or Err.",
      },
      {
        id: "errors-wrap",
        prompt: "Why use %w rather than %v for a causal error?",
        options: [
          "%w makes logging asynchronous",
          "%w preserves an unwrap relationship for errors.Is and errors.As",
          "%w suppresses the message",
          "%w retries the operation",
        ],
        answerIndex: 1,
        explanation: "%v includes only formatting. %w records the cause in the error chain while also rendering its message.",
      },
      {
        id: "errors-as",
        prompt: "When should errors.As be preferred over a direct type assertion?",
        options: [
          "When the desired typed error may be inside wrappers",
          "Only for nil errors",
          "When comparing strings",
          "Only before returning an error",
        ],
        answerIndex: 0,
        explanation: "errors.As traverses wrapped and joined errors to assign the first compatible typed error.",
      },
      {
        id: "context-values",
        prompt: "Which is a good context value?",
        options: ["Required database handle", "Optional retry count", "Request trace ID", "Global application configuration"],
        answerIndex: 2,
        explanation: "A trace ID is request-scoped metadata crossing boundaries. Dependencies and configuration should be explicit parameters or fields.",
      },
    ],
  },
  {
    slug: "concurrency-goroutines",
    track: "concepts",
    title: "Goroutines, Channels, and Shared State",
    subtitle:
      "Build bounded concurrent lifecycles with explicit ownership, synchronization, and cancellation.",
    difficulty: "intermediate",
    minutes: 55,
    tags: ["goroutines", "channels", "select", "mutex", "race-detector"],
    prerequisites: ["context-and-errors"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to decide whether channels, mutexes, or sequential code best express a problem; assign ownership of goroutine lifetimes and channel closure; and construct cancellation-safe pipelines and bounded worker pools. You will understand what synchronization actually guarantees, identify common leak and race patterns, and reason about nil, open, and closed channel behavior.",
      },
      {
        type: "prose",
        title: "Mental model: concurrency is overlapping lifetimes",
        body: "A goroutine is an independently scheduled call stack, not a promise that work runs in parallel or faster. Once started, it needs a termination condition and someone responsible for observing its result. Channels combine communication with synchronization: a send transfers a value, and matching send/receive events establish ordering recognized by Go's memory model. Mutex unlock/lock pairs can establish ordering around shared state. Without such synchronization, concurrent reads and writes form a data race even if tests happen to pass.",
      },
      {
        type: "code",
        title: "Ownership through a pipeline stage",
        language: "go",
        code: `package pipeline

import "context"

type Result struct {
	Input int
	Value int
}

func Double(ctx context.Context, in <-chan int) <-chan Result {
	out := make(chan Result)
	go func() {
		defer close(out) // producer closes because it knows no more sends remain
		for {
			select {
			case <-ctx.Done():
				return
			case n, ok := <-in:
				if !ok {
					return
				}
				result := Result{Input: n, Value: n * 2}
				select {
				case out <- result:
				case <-ctx.Done():
					return // avoids leaking if downstream stops receiving
				}
			}
		}
	}()
	return out
}`,
      },
      {
        type: "prose",
        title: "Channels coordinate; mutexes protect",
        body: "Use a channel when transferring ownership, distributing work, streaming values, or representing an event. Use a mutex when several operations need short, synchronous access to one in-memory invariant. A channel around every field can make simple state obscure; a mutex around an unbounded blocking network call can serialize the system or deadlock it. Sequential code is often best when overlap does not improve latency or throughput. The goal is a clear ownership protocol, not maximum goroutine count.",
      },
      {
        type: "code",
        title: "Protect one compound invariant with a mutex",
        language: "go",
        code: `package quota

import "sync"

type Quota struct {
	mu        sync.Mutex
	remaining map[string]int
}

func New(initial map[string]int) *Quota {
	copyOfInitial := make(map[string]int, len(initial))
	for key, value := range initial {
		copyOfInitial[key] = value
	}
	return &Quota{remaining: copyOfInitial}
}

func (q *Quota) Take(key string, n int) bool {
	q.mu.Lock()
	defer q.mu.Unlock()

	// Check and decrement must be one critical section. Two independent atomic
	// operations would still permit both callers to observe enough quota.
	if n < 0 || q.remaining[key] < n {
		return false
	}
	q.remaining[key] -= n
	return true
}

func (q *Quota) Snapshot() map[string]int {
	q.mu.Lock()
	defer q.mu.Unlock()
	out := make(map[string]int, len(q.remaining))
	for key, value := range q.remaining {
		out[key] = value // return a copy so the lock still owns internal state
	}
	return out
}`,
      },
      {
        type: "code",
        title: "A bounded worker pool with complete shutdown",
        language: "go",
        code: `package worker

import (
	"context"
	"fmt"
	"sync"
)

type Job struct{ ID int }
type Process func(context.Context, Job) error

func Run(ctx context.Context, jobs []Job, workers int, process Process) error {
	if workers < 1 {
		return fmt.Errorf("workers must be positive")
	}

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	jobCh := make(chan Job)
	errCh := make(chan error, 1) // first error can be reported without blocking
	var wg sync.WaitGroup

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobCh {
				if err := process(ctx, job); err != nil {
					select {
					case errCh <- fmt.Errorf("job %d: %w", job.ID, err):
						cancel() // first reporter asks feeder and peers to stop
					default:
					}
					return
				}
			}
		}()
	}

feedDone := make(chan struct{})
	go func() {
		defer close(feedDone)
		defer close(jobCh) // exactly one producer owns channel closure
		for _, job := range jobs {
			select {
			case jobCh <- job:
			case <-ctx.Done():
				return
			}
		}
	}()

	wg.Wait()
	cancel()   // unblocks feeder if workers exited after an error
	<-feedDone // prove the feeder has terminated before returning

	select {
	case err := <-errCh:
		return err
	default:
		return ctx.Err() // nil on successful parent context
	}
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Starting a goroutine is acquiring a resource. Before writing go f(), answer how it stops, who waits for it, and how blocked sends or receives are released during cancellation.",
      },
      {
        type: "steps",
        title: "Worked example: channel state transitions",
        items: [
          "Create ch := make(chan int, 2). Its buffer is open and empty; a receive would block.",
          "Send 10 and 20. Both sends complete because buffer capacity is available.",
          "A receiver reads 10, establishing synchronization with that send and freeing one slot.",
          "The sole producer calls close(ch) after its final send. Closing does not discard buffered 20.",
          "The next receive yields 20 with ok=true. The following receive yields 0 with ok=false immediately.",
          "A range loop performs receives until the buffer drains and ok becomes false.",
          "Any later send panics. A second close also panics. Setting a local channel variable to nil does not close the shared channel; it only disables sends and receives through that variable.",
        ],
      },
      {
        type: "think",
        title: "HEAT: design a concurrent lifecycle",
        clarify: [
          "What state is owned, and can one goroutine own it exclusively?",
          "What bounds concurrency and queue growth under overload?",
          "On every return path, which goroutines could be blocked and what wakes them?",
        ],
        model: [
          "Draw each goroutine as a lifecycle with start and termination edges.",
          "Label every channel with its sender, receiver, buffer bound, and sole closer.",
          "Mark synchronization edges before claiming shared writes are visible.",
        ],
        pitfalls: [
          "Closing a channel from a receiver because it is no longer interested.",
          "Holding a mutex while sending, calling callbacks, or doing slow I/O.",
          "Copying a struct containing a used mutex or WaitGroup.",
        ],
      },
      {
        type: "tradeoff",
        title: "Channel or mutex?",
        choices: [
          {
            label: "Channel ownership",
            pros: ["Expresses streams and transfer", "Combines notification with data", "Can eliminate shared mutable state"],
            cons: ["Lifecycle and closure protocols are subtle", "Backpressure can leak goroutines if ignored", "Request-response state can become indirect"],
            when: "Use for pipelines, queues, event streams, and handing values between independently lived operations.",
          },
          {
            label: "Mutex-protected state",
            pros: ["Direct synchronous API", "Efficient for short critical sections", "Natural for compound in-memory invariants"],
            cons: ["Incorrect lock scope races or deadlocks", "Callers can accidentally retain mutable aliases"],
            when: "Use when several goroutines need coordinated access to one local data structure.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases: select, nil channels, and races",
        body: "Receiving from a closed channel is immediately ready and returns the zero value, so omitting the ok check can create an infinite select loop. Assign a closed input to nil after detecting closure when the select should stop considering it. A nil channel blocks forever; in select, that case is disabled, which is useful for state machines. If several select cases are ready, Go makes a pseudo-random choice and promises no priority. WaitGroup.Add must happen before the goroutine can call Done. The race detector finds observed unsynchronized accesses, not every possible race, so run realistic tests with go test -race and still reason from the memory model.",
      },
      {
        type: "complexity",
        time: "Channel send/receive and uncontended lock operations are O(1); total work remains task-dependent",
        space: "O(workers + channel capacity + retained task data)",
        notes: "A bounded queue gives a real memory ceiling and backpressure. An unbounded goroutine-per-item design may be O(n) live stacks and external requests even when each operation is individually cheap.",
      },
    ],
    quiz: [
      {
        id: "concurrency-close",
        prompt: "Who should normally close a work channel?",
        options: ["Any receiver", "The producer that knows no more values will be sent", "The runtime", "Every worker after one job"],
        answerIndex: 1,
        explanation: "Closure asserts that all sends are complete. The producer or coordinating owner has that knowledge; competing closers can panic.",
      },
      {
        id: "concurrency-closed",
        prompt: "What does receiving from a closed, drained chan int return?",
        options: ["It blocks", "It panics", "0 and ok=false", "The last value forever"],
        answerIndex: 2,
        explanation: "Closed receives are immediately ready. The comma-ok result distinguishes closure from a legitimate zero value.",
      },
      {
        id: "concurrency-mutex",
        prompt: "Why must checking and decrementing quota happen under one lock?",
        options: [
          "Map reads always panic",
          "The compound invariant must be atomic with respect to other callers",
          "Locks make arithmetic faster",
          "Channels cannot carry integers",
        ],
        answerIndex: 1,
        explanation: "Separate synchronized operations could interleave and both pass the check, violating remaining >= 0.",
      },
      {
        id: "concurrency-select",
        prompt: "When two select cases are ready, which runs?",
        options: ["Always the first textual case", "A pseudo-random ready case", "Both atomically", "The case with the largest channel"],
        answerIndex: 1,
        explanation: "select does not encode priority. Build explicit state if order matters.",
      },
      {
        id: "concurrency-leak",
        prompt: "A pipeline consumer returns early. What must upstream senders usually have?",
        options: ["A larger stack", "A cancellation path that unblocks sends", "A finalizer", "An unbuffered logging channel"],
        answerIndex: 1,
        explanation: "Without cancellation or draining, an upstream goroutine may block forever trying to send an unwanted value.",
      },
    ],
  },
  {
    slug: "generics-and-testing",
    track: "concepts",
    title: "Generics and Evidence-Driven Testing",
    subtitle:
      "Use type parameters where relationships matter and prove behavior with tables, fuzzing, and focused seams.",
    difficulty: "intermediate",
    minutes: 55,
    tags: ["generics", "constraints", "testing", "fuzzing", "benchmarks"],
    prerequisites: ["interfaces", "packages-modules-workspace"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to decide whether repetition calls for a generic function, behavioral interface, or plain concrete code; read and write constraints including comparable and approximation terms; and recognize where type inference needs help. You will also build table-driven tests that preserve isolation, write property-oriented fuzz tests, and choose fakes at meaningful dependency boundaries instead of mocking implementation details.",
      },
      {
        type: "prose",
        title: "Mental model: a type parameter preserves relationships",
        body: "A generic declaration is checked for every type in its constraint's type set. The function body may use only operations guaranteed by that constraint. Type parameters are most valuable when input and output types relate—return the same T, map []T to []U, or maintain a Set[T]. An interface value, by contrast, erases a concrete value behind runtime behavior. Both use interface syntax in modern Go, but constraints govern compile-time instantiation while ordinary interfaces support runtime substitution.",
      },
      {
        type: "code",
        title: "A set with a meaningful constraint",
        language: "go",
        code: `package set

type Set[T comparable] map[T]struct{}

func New[T comparable](values ...T) Set[T] {
	s := make(Set[T], len(values))
	for _, value := range values {
		s[value] = struct{}{} // zero-sized value; keys carry the information
	}
	return s
}

func (s Set[T]) Add(value T) {
	s[value] = struct{}{}
}

func (s Set[T]) Contains(value T) bool {
	_, ok := s[value]
	return ok
}

func (s Set[T]) Clone() Set[T] {
	out := make(Set[T], len(s))
	for value := range s {
		out[value] = struct{}{}
	}
	return out
}

// []byte cannot instantiate Set because slices are not comparable map keys.
var names = New("Ada", "Grace", "Ada")`,
      },
      {
        type: "prose",
        title: "Constraints should express the algorithm, not all imaginable types",
        body: "any permits no type-specific operators. comparable permits ==, !=, and map-key use. A union such as ~int | ~int64 includes defined types whose underlying type matches because ~ means approximately that underlying type. Keep constraints local and small. If code needs methods that vary by implementation at runtime, use a behavioral interface. If only two concrete call sites share three obvious lines, duplication may be clearer than a public generic abstraction.",
      },
      {
        type: "code",
        title: "Preserve named numeric types with approximation",
        language: "go",
        code: `package measure

type Number interface {
	~int | ~int64 | ~float64
}

func Sum[T Number](values []T) T {
	var total T // valid zero for every type in Number
	for _, value := range values {
		total += value // + is guaranteed by the constraint's type set
	}
	return total
}

type Milliseconds int64

func Example() {
	durations := []Milliseconds{10, 15, 25}
	total := Sum(durations) // inference chooses T = Milliseconds
	var _ Milliseconds = total // named type relationship is preserved

	empty := Sum([]float64(nil))
	var _ float64 = empty // zero, with no special empty case required
}`,
      },
      {
        type: "tradeoff",
        title: "Choose the abstraction mechanism",
        choices: [
          {
            label: "Concrete function",
            pros: ["Simplest implementation and errors", "Most specific API", "Easy to optimize and understand"],
            cons: ["May duplicate a truly type-independent algorithm"],
            when: "Start here; generalize only after the common relationship is clear.",
          },
          {
            label: "Generic function/type",
            pros: ["Preserves static types", "Reuses representation-independent algorithms", "Avoids assertions"],
            cons: ["Constraint and inference complexity", "Can produce overly abstract APIs"],
            when: "Use for containers and algorithms whose operations are valid for a coherent type set.",
          },
          {
            label: "Behavioral interface",
            pros: ["Runtime substitution", "Hides implementation", "Natural dependency seam"],
            cons: ["Erases concrete type", "Dynamic dispatch and typed-nil concerns"],
            when: "Use when implementations differ by behavior and are selected at runtime.",
          },
        ],
      },
      {
        type: "code",
        title: "Table tests with isolated cases",
        language: "go",
        code: `package username

import "testing"

func Normalize(s string) (string, error) {
	// implementation omitted here; tests define the observable contract
	return normalize(s)
}

func TestNormalize(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{name: "trim and lower", input: "  Ada_1 ", want: "ada_1"},
		{name: "empty after trim", input: "   ", wantErr: true},
		{name: "reject punctuation", input: "ada!", wantErr: true},
		{name: "boundary length", input: "abcdefgh", want: "abcdefgh"},
	}

	for _, tc := range tests {
		tc := tc // safe on older Go versions; each closure gets its own case
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got, err := Normalize(tc.input)
			if (err != nil) != tc.wantErr {
				t.Fatalf("Normalize(%q) error = %v, wantErr %v", tc.input, err, tc.wantErr)
			}
			if err == nil && got != tc.want {
				t.Errorf("Normalize(%q) = %q, want %q", tc.input, got, tc.want)
			}
		})
	}
}`,
      },
      {
        type: "code",
        title: "Fuzz a property, not a list of guesses",
        language: "go",
        code: `package username

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func FuzzNormalize(f *testing.F) {
	for _, seed := range []string{"Ada_1", "  grace  ", "", "é", "a!"} {
		f.Add(seed)
	}

	f.Fuzz(func(t *testing.T, input string) {
		if !utf8.ValidString(input) {
			t.Skip() // this API's contract accepts text, not arbitrary bytes
		}
		got, err := Normalize(input)
		if err != nil {
			return // rejection is a valid outcome; panics never are
		}

		// Property 1: accepted output is canonical.
		if got != strings.ToLower(strings.TrimSpace(got)) {
			t.Fatalf("output is not canonical: %q", got)
		}
		// Property 2: normalization is idempotent.
		again, err := Normalize(got)
		if err != nil || again != got {
			t.Fatalf("Normalize(%q) = %q, %v; want same value", got, again, err)
		}
	})
}`,
      },
      {
        type: "steps",
        title: "Worked example: derive tests from a contract",
        items: [
          "State the Normalize contract: trim spaces, lowercase ASCII letters, allow letters/digits/underscore, require 1–8 output bytes, and never panic.",
          "Partition inputs rather than guessing: valid middle, empty, too long, forbidden rune, exact minimum, and exact maximum.",
          "Put representatives in one table so every partition uses the same error and output assertions.",
          "Identify properties with many possible inputs: successful output is canonical and applying Normalize twice is equivalent to once.",
          "Seed the fuzzer with each important partition, then let mutation explore combinations and unusual Unicode.",
          "When fuzzing finds a failure, keep the minimized input as a seed or regression table case before changing implementation.",
        ],
      },
      {
        type: "think",
        title: "HEAT: abstraction and test evidence",
        clarify: [
          "Which static relationship does a type parameter preserve?",
          "What operations does every type in the proposed constraint guarantee?",
          "Which contract partitions and invariants would expose a wrong implementation?",
        ],
        model: [
          "Write the generic function for an arbitrary T, not just the first concrete example.",
          "Draw test layers: pure unit behavior, adapter integration, and a small end-to-end path.",
          "Use fakes for domain-relevant behavior; avoid asserting private call choreography.",
        ],
        pitfalls: [
          "Using any plus type switches as a less-safe imitation of overloads.",
          "Running parallel subtests that share mutable fixtures or environment variables.",
          "Treating 100% statement coverage as proof of correct boundaries and properties.",
        ],
      },
      {
        type: "prose",
        title: "Edge cases: inference, nil, and test isolation",
        body: "Type inference uses function arguments, not a desired assignment result in every context, so a zero-argument generic constructor may need explicit type arguments. A nil slice can infer T only when its static element type is known. Generic code cannot compare T with nil unless the constraint guarantees a nilable shape—and Go constraints rarely express a useful union of all nilable types. In tests, t.Parallel delays execution and can expose shared globals, temp paths, clocks, or loop captures. Use t.TempDir, dependency injection, and per-case state. Tests in an external package verify exported behavior but cannot reach internals; internal-package tests can target implementation details, so use both intentionally.",
      },
      {
        type: "complexity",
        time: "Generic abstraction does not change the algorithm: Set operations average O(1), Sum O(n)",
        space: "Set O(n); Sum O(1) beyond input; test/fuzz corpus grows with retained cases",
        notes: "Type parameters do not make an inefficient algorithm efficient. Keep complexity claims attached to operations and data structures, not to whether code is generic.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "A good test fails for one comprehensible contract violation. Prefer observable outputs and state over mock call counts unless ordering itself is part of the behavior.",
      },
    ],
    quiz: [
      {
        id: "generics-comparable",
        prompt: "Why does Set[T] constrain T with comparable?",
        options: [
          "It makes every value sortable",
          "Map keys require equality-comparable types",
          "It permits arithmetic",
          "It enables runtime interfaces",
        ],
        answerIndex: 1,
        explanation: "Set is represented as map[T]struct{}, and map keys must support == and !=. comparable states exactly that requirement.",
      },
      {
        id: "generics-tilde",
        prompt: "What does ~int64 include in a constraint?",
        options: ["Only the predeclared int64 type", "Types whose underlying type is int64", "All integer sizes", "Pointers to int64"],
        answerIndex: 1,
        explanation: "Approximation admits defined types such as Milliseconds whose underlying type is int64, preserving useful domain types.",
      },
      {
        id: "testing-fuzz",
        prompt: "What is the strongest fuzz target?",
        options: [
          "One exact expected output for every possible string",
          "A general invariant such as idempotence",
          "A sleep-based concurrency check",
          "A mock call count",
        ],
        answerIndex: 1,
        explanation: "Properties apply across generated inputs and let the fuzzer explore cases humans did not enumerate.",
      },
      {
        id: "testing-parallel",
        prompt: "When is t.Parallel unsafe?",
        options: [
          "When the test has assertions",
          "When cases mutate shared non-isolated state",
          "When testing strings",
          "When using table tests",
        ],
        answerIndex: 1,
        explanation: "Parallel tests need independent fixtures. Shared globals, environment, ports, or maps can race and make results nondeterministic.",
      },
      {
        id: "generics-interface",
        prompt: "When is a behavioral interface preferable to a type parameter?",
        options: [
          "When implementations are selected at runtime by required methods",
          "Whenever two functions share a line",
          "For every numeric sum",
          "When no behavior varies",
        ],
        answerIndex: 0,
        explanation: "Interfaces model runtime substitutability. Type parameters model compile-time operations and relationships across types.",
      },
    ],
  },
  {
    slug: "memory-and-performance",
    track: "concepts",
    title: "Memory, Allocation, and Performance",
    subtitle:
      "Reason about reachable storage, measure real bottlenecks, and optimize without breaking ownership.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["memory", "escape-analysis", "allocations", "benchmarking", "pprof"],
    free: true,
    prerequisites: ["concurrency-goroutines", "generics-and-testing"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to explain stack-versus-heap placement without unsafe folklore, identify slice and substring retention, read benchmark allocation data, and use profiles to find dominant costs. You will learn safe preallocation and buffer reuse patterns, understand when sync.Pool helps, and evaluate optimization tradeoffs against readability, ownership, garbage-collector pressure, and end-to-end latency.",
      },
      {
        type: "prose",
        title: "Mental model: the compiler places values; reachability keeps them alive",
        body: "Go semantics do not expose manual stack or heap allocation. The compiler's escape analysis decides whether storage can remain in a stack frame or must outlive it on the heap. Returning a pointer is safe because the compiler can move the pointee. Heap allocation is not inherently a bug; it becomes costly when allocation rate and live reachable data increase garbage-collector work. First reason about ownership and reachability, then measure allocations and CPU rather than rewriting code based on guesses.",
      },
      {
        type: "code",
        title: "Preallocate when the size is known",
        language: "go",
        code: `package encode

import "strconv"

func IDsText(ids []int64) []string {
	// Length is known, so allocate the exact result once and assign by index.
	out := make([]string, len(ids))
	for i, id := range ids {
		out[i] = strconv.FormatInt(id, 10)
	}
	return out
}

func Positive(ids []int64) []int64 {
	// Final length is unknown but cannot exceed len(ids). Start at length zero
	// with enough capacity, then append only accepted values.
	out := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id > 0 {
			out = append(out, id)
		}
	}
	return out
}`,
      },
      {
        type: "prose",
        title: "Capacity is both performance and ownership",
        body: "Preallocation reduces backing-array growth and copying when you can estimate result size. Over-allocation can retain far more memory than useful data, especially for long-lived slices. Capacity also controls aliasing: append may overwrite a caller-visible array when capacity remains. A full slice expression s[i:j:j] caps capacity at length, forcing a future append to allocate, but it does not copy existing elements. If the callee must retain or mutate independently, make an actual copy.",
      },
      {
        type: "code",
        title: "Avoid retaining a huge backing array",
        language: "go",
        code: `package packet

func HeaderBad(packet []byte) []byte {
	if len(packet) < 16 {
		return nil
	}
	// This tiny slice still points into the entire packet backing array.
	return packet[:16]
}

func Header(packet []byte) []byte {
	if len(packet) < 16 {
		return nil
	}
	header := make([]byte, 16)
	copy(header, packet[:16]) // 16-byte copy lets a multi-megabyte packet die
	return header
}

func ReadOnlyView(packet []byte) []byte {
	// Restrict append capacity when a temporary shared view is acceptable.
	// Existing elements still alias packet and are not read-only by enforcement.
	return packet[:16:16]
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "A small subslice can keep a very large array reachable. The allocation-saving view may consume more memory over time than copying the small result. Optimize retained bytes, not merely allocation count.",
      },
      {
        type: "code",
        title: "Benchmark the operation and report allocations",
        language: "go",
        code: `package encode

import "testing"

var benchmarkResult []string // prevents the result becoming trivially dead

func BenchmarkIDsText(b *testing.B) {
	ids := make([]int64, 1000)
	for i := range ids {
		ids[i] = int64(i)
	}

	b.ReportAllocs()
	b.ResetTimer() // fixture construction is not part of the measured operation
	for i := 0; i < b.N; i++ {
		benchmarkResult = IDsText(ids)
	}
}

// Compare with:
// go test -run '^$' -bench BenchmarkIDsText -benchmem -count 10
// Feed old/new output to benchstat; one noisy run is not evidence.`,
      },
      {
        type: "code",
        title: "Pool temporary buffers, not durable ownership",
        language: "go",
        code: `package render

import (
	"bytes"
	"sync"
)

var buffers = sync.Pool{
	New: func() any { return new(bytes.Buffer) },
}

func Line(fields ...string) string {
	buf := buffers.Get().(*bytes.Buffer)
	buf.Reset()
	defer func() {
		// Do not retain unusually large buffers forever.
		if buf.Cap() <= 64<<10 {
			buffers.Put(buf)
		}
	}()

	for i, field := range fields {
		if i > 0 {
			buf.WriteByte(',')
		}
		buf.WriteString(field)
	}
	// String returns an owned immutable result for the caller before reuse.
	return buf.String()
}`,
      },
      {
        type: "prose",
        title: "Profiles answer different questions",
        body: "Benchmarks compare a controlled workload; production profiles reveal where a real workload spends resources. CPU profiles sample running stacks. Heap in-use profiles show retained live memory, while allocation profiles show churn. Goroutine profiles expose blocked or leaked stacks. Block and mutex profiles reveal waiting and contention. Start from an end-to-end objective such as p99 latency or memory limit, choose the profile matching the symptom, optimize a dominant node, and remeasure the same workload. Microbenchmarks can improve while the application regresses because batching, cache behavior, I/O, and contention changed.",
      },
      {
        type: "steps",
        title: "Worked example: investigate an allocation regression",
        items: [
          "A load test shows heap growth and longer GC pauses after a parser change. Record the same request rate and payload distribution for reproducibility.",
          "Compare in-use heap profiles and find many large []byte objects retained beneath Parser.Prefix.",
          "Inspect the code: Prefix returns payload[:32], and cached results keep each entire 2MB payload backing array alive.",
          "Change Prefix to allocate 32 bytes and copy the prefix. This intentionally adds one tiny allocation per cache miss.",
          "Rerun the workload. Allocation count rises slightly, but live heap falls dramatically because payloads become unreachable.",
          "Compare latency and GC metrics, then add a benchmark or retention-focused test around realistic large payloads to guard the behavior.",
          "Document the ownership reason; otherwise a future allocation-count cleanup may reintroduce retention.",
        ],
      },
      {
        type: "think",
        title: "HEAT: optimize from evidence",
        clarify: [
          "Which user or system metric is outside its target?",
          "Is the symptom CPU time, allocation rate, retained heap, blocking, or lock contention?",
          "What representative workload and baseline will prove improvement without semantic regressions?",
        ],
        model: [
          "Draw references from roots to live objects; unreachable storage is collectible regardless of where it was allocated.",
          "Separate bytes allocated per operation from bytes retained over time.",
          "Treat every optimization as a hypothesis followed by before/after measurement.",
        ],
        pitfalls: [
          "Reading escape-analysis diagnostics as a list of bugs.",
          "Using sync.Pool for connections, correctness, or guaranteed retention.",
          "Benchmarking unrealistic tiny data that removes I/O, contention, or cache effects dominating production.",
        ],
      },
      {
        type: "tradeoff",
        title: "Reuse, copy, or retain a view?",
        choices: [
          {
            label: "Retain a view",
            pros: ["No element copy", "Very cheap construction"],
            cons: ["Aliases mutable storage", "Can retain a huge backing object", "Ownership is easy to violate"],
            when: "Use for short-lived, synchronous processing with documented immutability or ownership.",
          },
          {
            label: "Copy",
            pros: ["Independent ownership", "Releases large source storage", "Simpler concurrency reasoning"],
            cons: ["Costs allocation and O(n) copying"],
            when: "Use across lifecycle boundaries, caches, asynchronous work, or whenever independent mutation matters.",
          },
          {
            label: "Pool temporary object",
            pros: ["Can reduce hot-path allocation churn", "Useful for reusable scratch capacity"],
            cons: ["Adds lifecycle complexity", "Pool may discard items", "Large objects may inflate retained memory"],
            when: "Use only after profiles show repeated temporary allocation and benchmarks prove a net benefit.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases: escape reports, strings, and false precision",
        body: "Inlining can change escape decisions, so compiler diagnostics differ across versions and build flags. A value escaping does not guarantee a separate allocation if optimized with its container. Converting between []byte and string normally copies, while unsafe no-copy tricks impose immutability and lifetime hazards rarely justified. Map preallocation accepts a hint, not an exact capacity promise. bytes.Buffer and strings.Builder must not be copied after use. Benchmark nanoseconds fluctuate with CPU frequency, scheduling, and garbage collection; use repeated samples and statistical comparison. Optimize only after preserving race freedom and API semantics.",
      },
      {
        type: "complexity",
        time: "Copying or growing n elements is O(n); indexed access remains O(1)",
        space: "Copies require O(n) independent storage; views use O(1) headers but can retain O(source) memory",
        notes: "This distinction between header size and retained reachable storage is central to Go performance. Big-O alone does not describe allocation rate, cache locality, or garbage-collector pressure.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Use go test -bench with -benchmem for controlled comparisons, escape diagnostics to explain compiler choices, and pprof on realistic workloads to decide where optimization matters. Each tool answers a different question.",
      },
    ],
    quiz: [
      {
        id: "memory-escape",
        prompt: "Why is returning a pointer to a local variable safe in Go?",
        options: [
          "The pointer becomes nil after return",
          "Escape analysis can place the storage where it outlives the frame",
          "All variables are global",
          "The garbage collector copies the source code",
        ],
        answerIndex: 1,
        explanation: "The compiler preserves language semantics by allocating storage with a sufficient lifetime, often on the heap.",
      },
      {
        id: "memory-retention",
        prompt: "How can a 16-byte subslice retain megabytes?",
        options: [
          "Its length changes automatically",
          "Its data pointer keeps the large backing array reachable",
          "Slices compress data",
          "Map iteration duplicates it",
        ],
        answerIndex: 1,
        explanation: "Garbage collection follows reachability of the backing object, not the view's length. Copy the small retained portion when appropriate.",
      },
      {
        id: "memory-pool",
        prompt: "What guarantee does sync.Pool provide about stored objects?",
        options: [
          "They remain until explicitly removed",
          "They may be dropped at any time and are only temporary reuse candidates",
          "They are shared across processes",
          "They never need resetting",
        ],
        answerIndex: 1,
        explanation: "A pool is a performance cache, not storage or ownership. Correctness cannot rely on any item remaining there.",
      },
      {
        id: "memory-profile",
        prompt: "Which profile best starts an investigation of live retained memory?",
        options: ["CPU profile", "In-use heap profile", "Execution trace only", "Code coverage"],
        answerIndex: 1,
        explanation: "In-use heap identifies objects currently retaining memory. Allocation profiles instead emphasize cumulative churn.",
      },
      {
        id: "memory-measure",
        prompt: "What is the right response after a microbenchmark improves?",
        options: [
          "Assume production latency improved",
          "Revalidate realistic workload metrics and semantics",
          "Remove all tests",
          "Add sync.Pool everywhere",
        ],
        answerIndex: 1,
        explanation: "Microbenchmarks isolate one effect. End-to-end costs, contention, retention, and correctness still need confirmation.",
      },
    ],
  },
];
