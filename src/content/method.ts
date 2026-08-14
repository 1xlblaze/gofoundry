import type { Lesson } from "./types";

/** GoFoundry's repeatable reasoning system for solving and communicating in Go. */
export const methodLessons: Lesson[] = [
  {
    slug: "foundry-heat-method",
    track: "method",
    title: "The Foundry HEAT Method",
    subtitle:
      "Hear → Etch → Anchor → Temper: turn an ambiguous prompt into a proved, idiomatic Go solution.",
    difficulty: "beginner",
    minutes: 50,
    tags: ["heat", "problem-solving", "communication", "go"],
    blocks: [
      {
        type: "diagram",
        title: "The HEAT cycle",
        kind: "heat-cycle",
        caption:
          "HEAT reduces uncertainty in order: contract, model, approach, then implementation and proof.",
      },
      {
        type: "prose",
        title: "What you will be able to do",
        body: "After this lesson you will be able to turn a vague engineering prompt into an explicit contract, draw the smallest useful state model, select an approach from constraints rather than habit, and implement it in Go with a correctness argument. You will also be able to communicate your reasoning so a reviewer can intervene before expensive code is written. HEAT applies to algorithms, production debugging, low-level design, and system design because each begins with uncertainty and ends with evidence.",
      },
      {
        type: "prose",
        title: "Mental model: each phase removes a different risk",
        body: "Hear removes requirement risk: solving the wrong problem perfectly is still failure. Etch removes model risk by externalizing state, transitions, ownership, and a concrete example. Anchor removes strategy risk by naming the invariant, target complexity, and rejected alternatives before implementation details consume attention. Temper removes execution risk: code, tests, dry-runs, and tradeoffs challenge the model. The phases are ordered but not one-way; a contradiction discovered while Tempering should send you back to Hear or Etch rather than invite a patch around a broken assumption.",
      },
      {
        type: "prose",
        title: "H — Hear the real contract",
        body: "Restate the outcome in your own words and ask questions whose answers can change data structures, API shape, or correctness. Clarify input size, ordering, mutation, duplicates, invalid data, concurrency, and the meaning of failure. Then state assumptions when an answer is unavailable. High-value questions branch the solution: must output preserve first appearance? Can amounts be negative? Is nil distinct from empty? Low-value questions merely request permission to use ordinary language features.",
      },
      {
        type: "code",
        title: "Hear: encode the clarified contract",
        language: "go",
        code: `package totals

import "fmt"

type Charge struct {
	Account string
	Cents   int64
}

type Total struct {
	Account string
	Cents   int64
}

// Summarize combines charges by account while preserving the order in which
// each account first appears. It does not mutate input. Empty input returns an
// empty non-nil result. Blank accounts and negative amounts are rejected.
func Summarize(charges []Charge) ([]Total, error) {
	// Implementation comes after the contract is agreed upon.
	if charges == nil {
		return []Total{}, nil
	}
	return summarize(charges)
}

func validate(c Charge) error {
	if c.Account == "" {
		return fmt.Errorf("account is required")
	}
	if c.Cents < 0 {
		return fmt.Errorf("negative charge for %s", c.Account)
	}
	return nil
}`,
      },
      {
        type: "prose",
        title: "E — Etch the state and walk one input",
        body: "A useful sketch is operational, not decorative. For the charge problem, write input [A:30, B:20, A:7]. To preserve first appearance while updating an existing result, maintain output totals plus a map from account to its output index. After each input, the invariant is: totals contains one row per account seen so far in first-seen order, and index points to every row. This sentence is strong enough to guide implementation and later proof.",
      },
      {
        type: "steps",
        title: "Etched trace: [A:30, B:20, A:7]",
        items: [
          "Initially totals=[] and index={}. The invariant holds vacuously.",
          "Read A:30. A is absent, so record index[A]=0 and append {A,30}. State: totals=[A:30], index={A:0}.",
          "Read B:20. B is absent, so record index[B]=1 and append {B,20}. State: totals=[A:30,B:20], index={A:0,B:1}.",
          "Read A:7. A maps to index 0, so add 7 to totals[0]. State: totals=[A:37,B:20]. Order does not change.",
          "Every input has been processed once. The invariant now implies the returned rows are unique, correctly summed, and first-seen ordered.",
        ],
      },
      {
        type: "prose",
        title: "A — Anchor the approach",
        body: "Name the pattern, invariant, complexity target, and one rejected alternative. Here the pattern is an order-preserving aggregation using an index map. The target is O(n) expected time and O(k) additional space for k distinct accounts. A nested scan of prior totals would preserve order with O(1) map space but degrade to O(n²) when all accounts are distinct. A map directly to totals is O(n) but loses required first-seen ordering. Anchoring makes the choice reviewable before syntax obscures it.",
      },
      {
        type: "code",
        title: "Temper: implementation follows the invariant",
        language: "go",
        code: `package totals

import "fmt"

func summarize(charges []Charge) ([]Total, error) {
	totals := make([]Total, 0, len(charges))
	index := make(map[string]int, len(charges))

	for position, charge := range charges {
		if err := validate(charge); err != nil {
			return nil, fmt.Errorf("charge %d: %w", position, err)
		}

		i, seen := index[charge.Account]
		if !seen {
			// Record the index before append. len(totals) is exactly the index
			// the new row will occupy, preserving first-seen order.
			index[charge.Account] = len(totals)
			totals = append(totals, Total{
				Account: charge.Account,
				Cents:   charge.Cents,
			})
			continue
		}

		// The invariant guarantees i names this account's unique output row.
		totals[i].Cents += charge.Cents
	}
	return totals, nil
}`,
      },
      {
        type: "prose",
        title: "T — Temper means proof, not polish",
        body: "Tempering challenges the solution. Dry-run a normal example and at least one boundary case. State why the invariant starts true, why every branch preserves it, and why termination gives the postcondition. Check Go-specific hazards: map iteration order, slice aliasing, nil behavior, integer overflow, pointer/value semantics, and error wrapping. Write tests from the contract rather than from implementation lines. Finally, name the limit that would force redesign—for example, totals may overflow int64 or the whole result may not fit memory.",
      },
      {
        type: "code",
        title: "Temper with contract-focused tests",
        language: "go",
        code: `package totals

import (
	"reflect"
	"testing"
)

func TestSummarize(t *testing.T) {
	tests := []struct {
		name    string
		input   []Charge
		want    []Total
		wantErr bool
	}{
		{
			name:  "repeated account preserves first order",
			input: []Charge{{"A", 30}, {"B", 20}, {"A", 7}},
			want:  []Total{{"A", 37}, {"B", 20}},
		},
		{name: "empty is non-nil", input: nil, want: []Total{}},
		{name: "reject invalid", input: []Charge{{"A", -1}}, wantErr: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			before := append([]Charge(nil), tc.input...)
			got, err := Summarize(tc.input)
			if (err != nil) != tc.wantErr {
				t.Fatalf("error = %v, wantErr %v", err, tc.wantErr)
			}
			if !tc.wantErr && !reflect.DeepEqual(got, tc.want) {
				t.Errorf("got %#v, want %#v", got, tc.want)
			}
			if !reflect.DeepEqual(tc.input, before) {
				t.Errorf("input mutated: got %#v, began %#v", tc.input, before)
			}
		})
	}
}`,
      },
      {
        type: "think",
        title: "HEAT worksheet",
        clarify: [
          "H: What outcome, invalid inputs, ordering, mutation, scale, and failure semantics define success?",
          "E: What state owns truth, how does it change, and what example exposes every branch?",
          "A: What invariant and complexity target select this approach over plausible alternatives?",
        ],
        model: [
          "T: Implement names that mirror the model, then dry-run normal and boundary inputs.",
          "Prove initialization, preservation, and termination in plain language.",
          "End with tradeoffs and the first changed constraint that would invalidate the design.",
        ],
        pitfalls: [
          "Treating HEAT as four phrases to recite after already coding.",
          "Drawing data structures without showing state transitions.",
          "Claiming complexity without defining n and without accounting for output or retained state.",
        ],
      },
      {
        type: "answer",
        title: "A concise spoken HEAT answer",
        opening:
          "I will restate the contract and resolve the choices that affect correctness before choosing a data structure.",
        beats: [
          "Hear: We aggregate by account, reject invalid charges, preserve first appearance, and do not mutate input.",
          "Etch: I will keep ordered totals plus account→output-index; after each charge they represent exactly the processed prefix.",
          "Anchor: That gives expected O(n) time and O(k) space, avoiding an O(n²) prior-output scan.",
          "Temper: I will implement one pass, trace A/B/A, test nil and invalid inputs, and mention int64 overflow as a domain edge.",
        ],
        closing:
          "If data no longer fits memory, I would revisit the ordering requirement or use partitioned external aggregation.",
      },
      {
        type: "tradeoff",
        title: "How much process should you show?",
        choices: [
          {
            label: "Full HEAT",
            pros: ["Best for ambiguity and expensive mistakes", "Creates review checkpoints", "Produces a reusable proof"],
            cons: ["More explicit setup"],
            when: "Use for interviews, unfamiliar problems, public APIs, concurrency, and system boundaries.",
          },
          {
            label: "Compressed HEAT",
            pros: ["Fast for routine work", "Still protects contract and invariant"],
            cons: ["Easy to skip a phase unconsciously"],
            when: "Use for familiar, low-risk changes: one sentence each for contract, model, approach, and verification.",
          },
        ],
      },
      {
        type: "complexity",
        time: "Example solution: expected O(n)",
        space: "O(k) for k distinct accounts, plus O(k) output",
        notes: "HEAT itself is not an algorithmic overhead to optimize away. It moves cheap reasoning before expensive implementation and debugging.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "If you cannot state the invariant without referring to line numbers, return to Etch. A model should explain why many possible implementations are correct, not merely narrate one listing.",
      },
    ],
    quiz: [
      {
        id: "heat-hear",
        prompt: "Which Hear question is highest leverage for Summarize?",
        options: [
          "May I use a for loop?",
          "Must output preserve first appearance?",
          "Should variables be short?",
          "Which editor theme is used?",
        ],
        answerIndex: 1,
        explanation: "Ordering changes the valid representation: a plain map is insufficient, while an index map plus slice preserves order.",
      },
      {
        id: "heat-etch",
        prompt: "What makes an Etch diagram useful?",
        options: [
          "It uses many boxes",
          "It shows state, transitions, and a concrete trace",
          "It is drawn after coding",
          "It contains Go syntax only",
        ],
        answerIndex: 1,
        explanation: "An operational model predicts behavior and exposes missing branches before implementation.",
      },
      {
        id: "heat-anchor",
        prompt: "What belongs in Anchor?",
        options: [
          "Only the final complexity",
          "Pattern, invariant, target complexity, and rejected alternative",
          "A full test log",
          "Production deployment commands",
        ],
        answerIndex: 1,
        explanation: "Anchor makes the strategic choice and its justification explicit before code.",
      },
      {
        id: "heat-temper",
        prompt: "A dry-run contradicts the invariant. What should you do?",
        options: [
          "Patch the output only",
          "Return to Etch or Hear and repair the model",
          "Hide the example",
          "Claim an average-case exception",
        ],
        answerIndex: 1,
        explanation: "HEAT is a loop. Evidence that breaks the model should revise an earlier assumption or approach.",
      },
      {
        id: "heat-proof",
        prompt: "What three parts form a common invariant proof?",
        options: [
          "Compile, deploy, monitor",
          "Initialization, preservation, termination",
          "Input, print, output",
          "Heap, stack, queue",
        ],
        answerIndex: 1,
        explanation: "Show the invariant begins true, each transition keeps it true, and at termination it implies the required result.",
      },
    ],
  },
  {
    slug: "interview-operating-system",
    track: "method",
    title: "Interview Operating System",
    subtitle:
      "Manage the clock, communicate evidence, recover from dead ends, and demonstrate senior Go judgment.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["interview", "communication", "debugging", "go"],
    prerequisites: ["foundry-heat-method"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to run a coding interview as a sequence of observable checkpoints instead of one long silent implementation. You will know what to say while clarifying, designing, coding, testing, and optimizing; how to recover when an approach fails; and which Go details demonstrate judgment without derailing the core solution. The objective is not theatrical narration. It is giving the interviewer enough evidence to evaluate your decisions and help redirect misunderstandings early.",
      },
      {
        type: "prose",
        title: "Mental model: the interview is a collaborative control loop",
        body: "You and the interviewer share incomplete information. Your spoken model is telemetry: it exposes the current contract, invariant, next action, and uncertainty. Periodic checkpoints let the interviewer correct the trajectory at low cost. Silence hides both good reasoning and mistakes. Constant line-by-line narration creates noise. Communicate decisions and invariants, then use quiet focus for syntax. Think of the clock as a budget reallocated by evidence, not a rigid script.",
      },
      {
        type: "steps",
        title: "A 45-minute default cadence",
        items: [
          "0–4 minutes — Hear: restate the outcome, ask 2–4 branching questions, name assumptions, and confirm one example.",
          "4–9 minutes — Etch: draw state and transitions, manually walk the example, and identify an invariant.",
          "9–12 minutes — Anchor: compare a baseline with the proposed approach; state time and space in terms of defined variables.",
          "12–30 minutes — Temper/code: implement in coherent slices, narrating invariants and Go-specific decisions rather than every keystroke.",
          "30–38 minutes — Verify: compile mentally or actually, dry-run normal and edge inputs, and write focused tests.",
          "38–43 minutes — Improve: address a discovered defect, optimize only if needed, and discuss alternatives.",
          "43–45 minutes — Close: summarize correctness, complexity, API behavior, and what changes under a new constraint.",
        ],
      },
      {
        type: "callout",
        tone: "note",
        body: "Adjust the cadence to the prompt. A design-heavy question should spend more time on Hear and Etch; a supplied algorithm may spend more time proving and coding. Preserve checkpoints even when their durations change.",
      },
      {
        type: "code",
        title: "Write a narratable skeleton first",
        language: "go",
        code: `package pair

// FindPair returns indices of two distinct values whose sum is target.
// If several pairs exist, it returns the first pair encountered by right index.
func FindPair(values []int, target int) (left, right int, ok bool) {
	// seen maps a value from the processed prefix to its earliest index.
	seen := make(map[int]int, len(values))

	for j, value := range values {
		need := target - value
		if i, exists := seen[need]; exists {
			return i, j, true
		}
		// Preserve the earliest index so duplicate values honor the tie rule.
		if _, exists := seen[value]; !exists {
			seen[value] = j
		}
	}
	return 0, 0, false
}`,
      },
      {
        type: "prose",
        title: "Narrate decisions, not syntax",
        body: "Before the loop, say: seen represents the processed prefix and retains the earliest index. At each value I look for the complement before inserting the current index, which prevents using one element twice. That sentence conveys more than narrating make, range, and if. While typing routine syntax, focus. Speak again when a branch preserves an invariant, when a Go semantic is non-obvious, or when you discover a mismatch.",
      },
      {
        type: "answer",
        title: "Useful phrases at each checkpoint",
        opening:
          "I will make my current model explicit so we can correct assumptions before implementation gets expensive.",
        beats: [
          "Hear: My understanding is …; the two choices that change the design are …",
          "Etch: After processing the prefix, this state means …; let me test that on the duplicate case.",
          "Anchor: A baseline costs …; I propose … because it preserves … within the target.",
          "Temper: I am implementing the invariant now; this lookup occurs before insertion to prevent reusing the same index.",
          "Verify: I will test the smallest input, a normal match, no match, and duplicates because each exercises a distinct branch.",
        ],
        closing:
          "The final solution is correct because the invariant covers every processed element; its costs are …, and the main tradeoff is …",
      },
      {
        type: "code",
        title: "Tests are part of the answer",
        language: "go",
        code: `package pair

import "testing"

func TestFindPair(t *testing.T) {
	tests := []struct {
		name       string
		values     []int
		target     int
		left, right int
		ok         bool
	}{
		{name: "normal", values: []int{2, 7, 11, 15}, target: 9, left: 0, right: 1, ok: true},
		{name: "distinct duplicate indices", values: []int{3, 3}, target: 6, left: 0, right: 1, ok: true},
		{name: "no match", values: []int{1, 2}, target: 8, ok: false},
		{name: "empty", values: nil, target: 0, ok: false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			left, right, ok := FindPair(tc.values, tc.target)
			if ok != tc.ok || (ok && (left != tc.left || right != tc.right)) {
				t.Fatalf("got (%d,%d,%v), want (%d,%d,%v)",
					left, right, ok, tc.left, tc.right, tc.ok)
			}
		})
	}
}`,
      },
      {
        type: "prose",
        title: "Recovery is an evaluated skill",
        body: "Getting stuck is not the same as failing. First identify the precise blocker: I cannot show that removing this element preserves the invariant. Restore a correct baseline, shrink to a three-element example, and find the first transition that diverges. If optimization is blocking progress, offer the slower correct method and implement it or derive the faster one from it. Do not repeatedly erase code without explaining what evidence invalidated it. A visible recovery loop demonstrates debugging discipline.",
      },
      {
        type: "steps",
        title: "Worked recovery: the duplicate bug",
        items: [
          "Your first FindPair version inserts value into seen before checking its complement.",
          "Dry-run values=[3], target=6. Inserting seen[3]=0 and then looking up need=3 returns index 0, falsely using one element twice.",
          "Name the broken invariant: seen was supposed to contain only indices strictly before j.",
          "Move lookup before insertion. The processed-prefix meaning is restored.",
          "Dry-run values=[3,3]. At j=0, no prior 3 exists; insert 0. At j=1, lookup finds 0, producing distinct indices.",
          "Add the single-element no-match and duplicate-pair cases to tests. Explain the fix from the invariant, not as a lucky line reorder.",
        ],
      },
      {
        type: "code",
        title: "Show production Go judgment without overengineering",
        language: "go",
        code: `package lookup

import (
	"context"
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("not found")

type Store interface {
	Find(context.Context, string) (string, error)
}

func Display(ctx context.Context, store Store, id string) (string, error) {
	if id == "" {
		return "", fmt.Errorf("id is required")
	}
	value, err := store.Find(ctx, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return "", fmt.Errorf("display %s: %w", id, ErrNotFound)
		}
		return "", fmt.Errorf("display %s: %w", id, err)
	}
	return value, nil
}`,
      },
      {
        type: "prose",
        title: "Go signals that help—and signals that distract",
        body: "Helpful signals are proportional to the prompt: context first at an I/O boundary, wrapped errors with stable identity, consumer-owned small interfaces, table tests, clear channel ownership, and awareness of slice aliasing. Distracting signals include introducing interfaces with one hypothetical implementation, mentioning escape analysis in an O(n²) algorithm discussion, building a worker pool before correctness, or forcing every design into channels. Seniority appears as prioritization: solve the dominant correctness and scale risks first, then add language-specific precision where it changes the design.",
      },
      {
        type: "think",
        title: "Pre-interview control checks",
        clarify: [
          "What artifact must exist by the end: function, API, class/struct design, or architecture?",
          "Which two ambiguities can change correctness or complexity?",
          "At what minute will I deliberately stop and verify rather than continue adding code?",
        ],
        model: [
          "Keep a visible contract, invariant, and next step.",
          "Use one normal trace and one adversarial trace as continuous tests of the model.",
          "Reserve time to close with proof and tradeoffs; unfinished narration is not verification.",
        ],
        pitfalls: [
          "Memorizing a speech so rigidly that new evidence is ignored.",
          "Optimizing before the interviewer agrees with the baseline and contract.",
          "Using compiler execution as a substitute for explaining why the algorithm is correct.",
        ],
      },
      {
        type: "tradeoff",
        title: "What to do under time pressure",
        choices: [
          {
            label: "Correct baseline first",
            pros: ["Produces a complete answer", "Creates an oracle for optimization", "Makes reasoning concrete"],
            cons: ["May leave less coding time for the optimal method"],
            when: "Use when the optimized invariant is not yet trustworthy or remaining time is short.",
          },
          {
            label: "Proceed with optimized approach",
            pros: ["Can meet required constraints directly", "Avoids duplicate implementation"],
            cons: ["Higher risk of finishing with no correct solution"],
            when: "Use when the model and invariant are already clear and the baseline has been explained.",
          },
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never silently change the contract to make your code pass an example. State the mismatch, ask or declare the revised assumption, and update the model before coding onward.",
      },
    ],
    quiz: [
      {
        id: "interview-telemetry",
        prompt: "What is the most useful thing to narrate while coding?",
        options: [
          "Every punctuation character",
          "The invariant and decisions at meaningful branches",
          "Unrelated Go trivia",
          "Your typing speed",
        ],
        answerIndex: 1,
        explanation: "Decision-level narration exposes correctness reasoning while leaving quiet space for routine syntax.",
      },
      {
        id: "interview-stuck",
        prompt: "What is the strongest first move when stuck?",
        options: [
          "Erase everything silently",
          "Name the precise blocker and shrink to a concrete counterexample",
          "Change languages immediately",
          "Claim the prompt is impossible",
        ],
        answerIndex: 1,
        explanation: "A precise blocker plus small trace turns vague confusion into debuggable evidence.",
      },
      {
        id: "interview-timing",
        prompt: "Why reserve explicit verification time?",
        options: [
          "Compilation proves all inputs",
          "Implementation frequently reveals model and edge-case defects",
          "Tests replace complexity analysis",
          "Interviewers only score test syntax",
        ],
        answerIndex: 1,
        explanation: "Dry-runs and tests are where assumptions meet evidence; an unverified complete-looking function is not a complete answer.",
      },
      {
        id: "interview-go",
        prompt: "Which choice best demonstrates senior Go judgment?",
        options: [
          "Adding concurrency to every solution",
          "Using the simplest construct that protects the dominant invariant",
          "Always defining a provider interface",
          "Discussing heap allocation before correctness",
        ],
        answerIndex: 1,
        explanation: "Judgment is proportional: language tools serve the actual correctness and scale needs rather than displaying trivia.",
      },
    ],
  },
  {
    slug: "heat-for-dsa",
    track: "method",
    title: "HEAT for Data Structures and Algorithms",
    subtitle:
      "Derive invariants, optimize from a correct baseline, and prove Go implementations on concrete traces.",
    difficulty: "intermediate",
    minutes: 55,
    tags: ["heat", "dsa", "invariants", "sliding-window", "complexity"],
    prerequisites: ["foundry-heat-method", "interview-operating-system"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to apply HEAT specifically to algorithm prompts: extract constraints that select an algorithm family, construct a brute-force correctness oracle, derive a loop invariant for an optimization, and prove complexity without hand-waving. You will also handle Go representation choices such as byte versus rune indexing and write tests that target the transitions most likely to break.",
      },
      {
        type: "prose",
        title: "Mental model: optimization compresses repeated work",
        body: "A strong optimized algorithm is often a correct baseline with reusable state. Begin by defining what the baseline recomputes. Then ask which fact changes predictably when one element enters or leaves. The stored fact becomes your data structure; its meaning becomes the invariant. This derivation is safer than pattern matching a prompt to sliding window, heap, or dynamic programming by keywords. Patterns are names for state transitions, not magic templates.",
      },
      {
        type: "prose",
        title: "Problem: longest substring with distinct characters",
        body: "Given UTF-8 text, return the maximum number of Unicode code points in a contiguous substring containing no repeated code point. We explicitly choose code points rather than user-perceived grapheme clusters: é written as one code point and e plus a combining mark are different sequences. Empty input returns zero. This Hear decision determines whether byte indexing is correct and what n means in complexity analysis.",
      },
      {
        type: "think",
        title: "Hear and Etch",
        clarify: [
          "Does character mean byte, Unicode code point, or grapheme cluster?",
          "Do we return length, indices, or the substring itself?",
          "What input size rules out checking every start/end pair?",
        ],
        model: [
          "Convert to []rune so indices and returned length count code points under this contract.",
          "Etch a window [left,right] and a map from rune to its latest index.",
          "Invariant: before measuring at right, the current window contains no duplicate rune.",
        ],
        pitfalls: [
          "Using byte indices from range as though they were consecutive rune indices.",
          "Moving left backward when the repeated rune occurred before the current window.",
          "Calling a substring problem O(1) space without stating a bounded alphabet.",
        ],
      },
      {
        type: "code",
        title: "Baseline: make correctness obvious",
        language: "go",
        code: `package distinct

func LongestBrute(text string) int {
	runes := []rune(text)
	best := 0

	for start := 0; start < len(runes); start++ {
		seen := make(map[rune]struct{})
		for end := start; end < len(runes); end++ {
			if _, duplicate := seen[runes[end]]; duplicate {
				break // any longer substring from start remains invalid
			}
			seen[runes[end]] = struct{}{}
			if length := end - start + 1; length > best {
				best = length
			}
		}
	}
	return best
}`,
      },
      {
        type: "prose",
        title: "Anchor by identifying repeated work",
        body: "For each new start, the baseline rebuilds a set and scans many runes already examined. Instead, keep one moving left boundary and the last index of each rune. When rune x repeats at previous index p inside the current window, every start through p is invalid; jump left to p+1. If p is before left, the old occurrence is irrelevant and left must not move backward. Each right index advances once and left only advances, giving O(n) time after rune conversion.",
      },
      {
        type: "code",
        title: "Optimized window derived from the invariant",
        language: "go",
        code: `package distinct

func Longest(text string) int {
	runes := []rune(text)
	last := make(map[rune]int, len(runes))
	left, best := 0, 0

	for right, current := range runes {
		if previous, seen := last[current]; seen && previous >= left {
			// Drop the earlier current plus everything before it. The resulting
			// window is distinct again, and left never moves backward.
			left = previous + 1
		}
		last[current] = right

		// [left,right] is now valid by the invariant.
		if length := right - left + 1; length > best {
			best = length
		}
	}
	return best
}`,
      },
      {
        type: "steps",
        title: "Worked trace: abbaé",
        items: [
          "Start left=0, best=0, last={}. At right=0 rune a: record a→0; window a has length 1, best=1.",
          "At right=1 rune b: record b→1; window ab has length 2, best=2.",
          "At right=2 rune b: previous b is 1 and inside [0,1], so set left=2; record b→2. Window b has length 1.",
          "At right=3 rune a: previous a is 0, which is before left=2. Do not move left backward. Record a→3; window ba has length 2.",
          "At right=4 rune é: unseen, record é→4; window baé has length 3, best=3.",
          "Every rune entered once. left moved only forward. The answer is 3 code points even though é occupies multiple UTF-8 bytes.",
        ],
      },
      {
        type: "prose",
        title: "Correctness proof",
        body: "Initialization: before the loop, the empty window is distinct. Preservation: if current is absent from the window, adding it keeps the window distinct. If it appears at previous within the window, moving left to previous+1 removes that occurrence; the old window had no other duplicate by the invariant, so the new one is distinct. We then record current's latest index. Maximality at each right: left is the smallest valid start after handling the latest duplicate, so right-left+1 is the longest distinct window ending at right. Termination: every possible right endpoint was considered, and best is the maximum of those longest endings.",
      },
      {
        type: "code",
        title: "Differential and property tests",
        language: "go",
        code: `package distinct

import (
	"math/rand"
	"testing"
	"unicode/utf8"
)

func TestLongest(t *testing.T) {
	tests := map[string]int{
		"":       0,
		"abbaé":  3,
		"aaaa":   1,
		"abcabc": 3,
		"世界世":    2,
	}
	for input, want := range tests {
		if got := Longest(input); got != want {
			t.Errorf("Longest(%q)=%d, want %d", input, got, want)
		}
	}
}

func TestLongestMatchesBaseline(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	alphabet := []rune("abé世")
	for trial := 0; trial < 1000; trial++ {
		n := rng.Intn(12)
		value := make([]rune, n)
		for i := range value {
			value[i] = alphabet[rng.Intn(len(alphabet))]
		}
		text := string(value)
		got := Longest(text)
		if got != LongestBrute(text) || got > utf8.RuneCountInString(text) {
			t.Fatalf("counterexample %q: optimized=%d brute=%d",
				text, got, LongestBrute(text))
		}
	}
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Keep a slow, obviously correct baseline in tests for algorithms with tricky transitions. Differential testing can discover counterexamples more effectively than a long list of hand-picked expected outputs.",
      },
      {
        type: "tradeoff",
        title: "Choose the text representation",
        choices: [
          {
            label: "Bytes",
            pros: ["No rune-slice allocation", "Correct for ASCII or byte-oriented protocols", "Simple fixed alphabet tables"],
            cons: ["Splits multi-byte UTF-8 code points", "Byte length may violate user-facing contract"],
            when: "Use when the problem explicitly defines bytes or guarantees ASCII.",
          },
          {
            label: "[]rune",
            pros: ["Straightforward code-point indexing", "Returned lengths match stated contract", "Simple trace and proof"],
            cons: ["O(n) conversion memory", "Still not grapheme-cluster semantics"],
            when: "Use when Unicode code points are the declared unit and simplicity matters.",
          },
          {
            label: "Stream range positions",
            pros: ["Avoids full rune slice", "Can preserve UTF-8 byte offsets"],
            cons: ["Code-point length and left movement need more bookkeeping", "Harder proof"],
            when: "Use when text is large and the required output can be maintained incrementally.",
          },
        ],
      },
      {
        type: "complexity",
        time: "Brute force O(n²); sliding window O(n)",
        space: "Brute force O(k) per active scan; optimized O(k), plus O(n) for []rune conversion",
        notes: "n is the number of Unicode code points and k is the number of distinct code points seen. Saying O(1) space is only defensible under an explicitly bounded alphabet.",
      },
      {
        type: "prose",
        title: "Edge cases and extension pressure",
        body: "Normalization is outside the stated contract: canonically equivalent Unicode sequences may compare as different runes. Full grapheme clusters require a segmentation library and change both representation and complexity constants. If the function must return byte offsets into the original string, converting to []rune loses direct offsets unless they are tracked. For a streaming reader, a distinct-window algorithm may need to retain enough sequence state to evict old positions. Integer index overflow is not practical for in-memory slices but still illustrates why complexity variables should match representable inputs.",
      },
      {
        type: "answer",
        title: "A strong DSA explanation",
        opening:
          "I will define character as a Unicode code point and return only the maximum length, so I can reason over []rune indices.",
        beats: [
          "The baseline starts at every index and extends a set until a duplicate, costing O(n²).",
          "Repeated work is rebuilding knowledge of the current distinct suffix.",
          "I keep last positions and a left boundary; the invariant is that [left,right] is duplicate-free after adjustment.",
          "On a repeated rune inside the window, left jumps to previous+1 and never moves backward.",
          "Each endpoint advances once, so time is O(n) and state is O(k), plus rune conversion.",
        ],
        closing:
          "I would verify against the brute-force oracle on generated short strings and revisit representation if grapheme clusters or byte offsets are required.",
      },
    ],
    quiz: [
      {
        id: "dsa-window",
        prompt: "Why must the optimized algorithm check previous >= left?",
        options: [
          "Map lookups require it",
          "An occurrence before the current window must not move left backward",
          "Rune indices can be negative",
          "It reduces map memory",
        ],
        answerIndex: 1,
        explanation: "Only duplicates inside the active window violate the invariant. Older occurrences have already been excluded.",
      },
      {
        id: "dsa-proof",
        prompt: "Why is the current window the longest valid window ending at right?",
        options: [
          "It always begins at zero",
          "left moves only as far as required to remove the latest in-window duplicate",
          "The map is sorted",
          "Every rune is unique globally",
        ],
        answerIndex: 1,
        explanation: "After the jump, any earlier start would include both copies; any later start is valid but shorter.",
      },
      {
        id: "dsa-unicode",
        prompt: "What does converting text to []rune guarantee?",
        options: [
          "Indices count Unicode code points",
          "Indices count grapheme clusters",
          "All strings become ASCII",
          "Canonical normalization",
        ],
        answerIndex: 0,
        explanation: "Runes represent code points. User-perceived characters can contain multiple code points, and normalization is separate.",
      },
      {
        id: "dsa-differential",
        prompt: "Why compare the optimized function with LongestBrute on random short inputs?",
        options: [
          "To improve asymptotic runtime",
          "The simple oracle can expose transition mistakes in the optimized state",
          "To avoid all explicit tests",
          "To benchmark Unicode",
        ],
        answerIndex: 1,
        explanation: "Differential testing uses independent implementations so generated counterexamples reveal disagreement.",
      },
      {
        id: "dsa-space",
        prompt: "When could the last-seen map be described as O(1) space?",
        options: [
          "Always",
          "Only when the alphabet is explicitly bounded independently of n",
          "Only for empty input",
          "When implemented in Go",
        ],
        answerIndex: 1,
        explanation: "With unbounded Unicode distinct values, map size grows with k. A fixed ASCII alphabet provides a constant upper bound.",
      },
    ],
  },
  {
    slug: "heat-for-lld-hld",
    track: "method",
    title: "HEAT for Low-Level and High-Level Design",
    subtitle:
      "Connect domain invariants, Go APIs, state machines, storage, queues, and system tradeoffs in one design.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["heat", "lld", "hld", "state-machines", "idempotency", "outbox"],
    prerequisites: ["foundry-heat-method", "interview-operating-system"],
    blocks: [
      {
        type: "prose",
        title: "What you will be able to do",
        body: "You will be able to use one HEAT process across low-level and high-level design rather than treating them as unrelated interviews. Starting from a webhook-delivery prompt, you will derive invariants, model a delivery state machine, design Go types and interfaces, place transactional and asynchronous boundaries, estimate capacity, and explain delivery semantics honestly. You will learn where implementation detail should stop and architecture-level tradeoffs should begin.",
      },
      {
        type: "prose",
        title: "Mental model: LLD and HLD are two zoom levels of the same guarantees",
        body: "High-level boxes are meaningful only when they preserve a contract under failure; low-level methods are meaningful only within the lifecycle and ownership provided by the system. The same invariant should survive zooming. For webhook delivery: one accepted event creates one logical delivery per endpoint; retries may create multiple network attempts, but state transitions are durable and a successful delivery is never intentionally retried. At LLD, methods enforce legal transitions. At HLD, transactions, queues, leases, and idempotency preserve them across processes and crashes.",
      },
      {
        type: "prose",
        title: "H — Hear requirements as guarantees",
        body: "Suppose clients submit an event ID, endpoint, and payload. The service should respond quickly, deliver asynchronously, retry transient failures with backoff, stop after a configured maximum, and treat repeated submissions with the same tenant and event ID idempotently. Ask about ordering, payload limits, endpoint authentication, latency targets, retry horizon, tenant isolation, and whether the receiver supports idempotency. Never promise exactly-once network side effects: a worker can time out after the receiver commits but before the acknowledgement reaches us.",
      },
      {
        type: "think",
        title: "Hear the design branches",
        clarify: [
          "Is ordering required globally, per tenant, per endpoint, or not at all?",
          "What response should a duplicate event ID produce when payload differs?",
          "Which status codes are transient, permanent, or subject to Retry-After?",
          "What are average/peak events per second, payload size, retention, and delivery SLO?",
        ],
        model: [
          "State the honest semantic: durable at-least-once attempts with receiver-visible event IDs for deduplication.",
          "Separate acceptance latency from delivery latency.",
          "Name the consistency boundary: event row and outbox message must commit atomically.",
        ],
        pitfalls: [
          "Claiming a queue alone prevents duplicate delivery.",
          "Adding distributed components before writing the state transitions they must preserve.",
          "Ignoring tenant+event identity scope and allowing cross-tenant collisions.",
        ],
      },
      {
        type: "prose",
        title: "E — Etch the state machine and data flow",
        body: "Model a delivery as queued → leased → succeeded, retry-wait, or dead. A lease has an expiry so another worker can recover work after a crash. A transient result increments attempts and schedules nextAttemptAt; a permanent result or exhausted attempt budget becomes dead. Duplicate queue messages are safe only when claiming checks current durable state. On the system sketch, submission writes event plus outbox in one database transaction; an outbox relay publishes IDs; workers claim, call endpoints, and commit outcomes.",
      },
      {
        type: "diagram",
        title: "Transactional outbox path",
        kind: "outbox",
        caption:
          "API transaction → event and outbox rows → relay → queue → leased worker → endpoint → durable outcome.",
      },
      {
        type: "code",
        title: "LLD: encode legal state transitions",
        language: "go",
        code: `package delivery

import (
	"fmt"
	"time"
)

type Status string

const (
	Queued    Status = "queued"
	Leased    Status = "leased"
	RetryWait Status = "retry_wait"
	Succeeded Status = "succeeded"
	Dead      Status = "dead"
)

type Delivery struct {
	ID            string
	Status        Status
	Attempts      int
	MaxAttempts   int
	LeaseUntil    time.Time
	NextAttemptAt time.Time
	LastError     string
}

func (d *Delivery) Claim(now time.Time, lease time.Duration) error {
	claimable := d.Status == Queued ||
		(d.Status == RetryWait && !now.Before(d.NextAttemptAt)) ||
		(d.Status == Leased && !now.Before(d.LeaseUntil))
	if !claimable {
		return fmt.Errorf("delivery %s in %s is not claimable", d.ID, d.Status)
	}
	d.Status = Leased
	d.LeaseUntil = now.Add(lease)
	d.Attempts++
	return nil
}

func (d *Delivery) MarkSuccess() error {
	if d.Status != Leased {
		return fmt.Errorf("success requires leased state, got %s", d.Status)
	}
	d.Status = Succeeded
	d.LeaseUntil = time.Time{}
	return nil
}

func (d *Delivery) MarkFailure(now time.Time, cause string, retryAfter time.Duration) error {
	if d.Status != Leased {
		return fmt.Errorf("failure requires leased state, got %s", d.Status)
	}
	d.LastError = cause
	d.LeaseUntil = time.Time{}
	if d.Attempts >= d.MaxAttempts {
		d.Status = Dead
		return nil
	}
	d.Status = RetryWait
	d.NextAttemptAt = now.Add(retryAfter)
	return nil
}`,
      },
      {
        type: "prose",
        title: "A — Anchor invariants before technologies",
        body: "Anchor on guarantees: the unique key (tenant_id,event_id) makes retries of submission idempotent; event and outbox insert share one transaction; claiming is a conditional durable update so at most one live lease normally owns a delivery; expired leases permit recovery; terminal success is immutable; receivers get the event ID to deduplicate ambiguous attempts. Then select technologies that implement those operations at expected scale. Naming Kafka or Redis without mapping it to an invariant is not design.",
      },
      {
        type: "code",
        title: "Boundary: idempotent acceptance plus outbox",
        language: "go",
        code: `package submit

import (
	"context"
	"crypto/sha256"
	"fmt"
)

type Request struct {
	TenantID string
	EventID  string
	Endpoint string
	Payload  []byte
}

type Result struct {
	DeliveryID string
	Duplicate  bool
}

type Tx interface {
	// InsertEvent returns the existing delivery and inserted=false on a unique
	// (tenant,event) conflict. Implementations must also compare payload hashes.
	InsertEvent(context.Context, Request, [32]byte) (deliveryID string, inserted bool, err error)
	InsertOutbox(context.Context, string) error
}

type Database interface {
	WithinTx(context.Context, func(Tx) error) error
}

func Accept(ctx context.Context, db Database, req Request) (Result, error) {
	if req.TenantID == "" || req.EventID == "" || req.Endpoint == "" {
		return Result{}, fmt.Errorf("tenant, event, and endpoint are required")
	}
	hash := sha256.Sum256(req.Payload)
	var result Result

	err := db.WithinTx(ctx, func(tx Tx) error {
		id, inserted, err := tx.InsertEvent(ctx, req, hash)
		if err != nil {
			return fmt.Errorf("insert event: %w", err)
		}
		result = Result{DeliveryID: id, Duplicate: !inserted}
		if !inserted {
			return nil // original transaction already created its outbox row
		}
		if err := tx.InsertOutbox(ctx, id); err != nil {
			return fmt.Errorf("insert outbox: %w", err)
		}
		return nil
	})
	if err != nil {
		return Result{}, err
	}
	return result, nil
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "A repeated idempotency key with a different payload is not a harmless duplicate. Store and compare a request hash, then return conflict rather than silently reusing the original result.",
      },
      {
        type: "code",
        title: "Worker: claim, attempt, and record",
        language: "go",
        code: `package worker

import (
	"context"
	"fmt"
	"time"
)

type Store interface {
	Claim(context.Context, string, time.Time, time.Duration) (Delivery, error)
	Succeed(context.Context, string) error
	Fail(context.Context, string, string, time.Time) error
}

type Sender interface {
	Send(context.Context, Delivery) (retryable bool, err error)
}

type Worker struct {
	store Store
	send  Sender
	now   func() time.Time
}

func (w *Worker) Process(ctx context.Context, id string) error {
	now := w.now()
	d, err := w.store.Claim(ctx, id, now, 30*time.Second)
	if err != nil {
		return fmt.Errorf("claim %s: %w", id, err)
	}

	retryable, sendErr := w.send.Send(ctx, d)
	if sendErr == nil {
		if err := w.store.Succeed(ctx, id); err != nil {
			// The receiver may have committed even though our state write failed.
			// A future retry is why the receiver also needs the stable event ID.
			return fmt.Errorf("record success %s: %w", id, err)
		}
		return nil
	}

	if !retryable {
		return w.store.Fail(ctx, id, sendErr.Error(), time.Time{})
	}
	next := now.Add(backoff(d.Attempts))
	return w.store.Fail(ctx, id, sendErr.Error(), next)
}`,
      },
      {
        type: "steps",
        title: "Worked failure trace: accepted, timed out, duplicated",
        items: [
          "Client submits tenant T, event E, payload P. The transaction inserts delivery D and outbox O, then commits. API returns D.",
          "The relay publishes D and marks O sent. A crash before marking could publish D twice; queue delivery is therefore treated as duplicate-prone.",
          "Worker W1 conditionally claims D with lease until 10:00:30 and sends E to the endpoint.",
          "The endpoint commits the side effect but W1 times out before receiving its response. W1 crashes before recording success.",
          "After lease expiry, W2 claims D and sends E again. The receiver uses T+E as an idempotency key and returns the original success.",
          "W2 records D as succeeded. A stale duplicate queue message later cannot claim the terminal state.",
          "A client resubmitting T+E+P receives D with duplicate=true. T+E with a different payload hash receives conflict.",
        ],
      },
      {
        type: "capacity",
        title: "Illustrative sizing before technology selection",
        rows: [
          { label: "Average submissions", value: "2,000 events/s" },
          { label: "Peak factor", value: "5× → 10,000 events/s" },
          { label: "Average payload", value: "4 KiB" },
          { label: "Raw payload ingress", value: "~8 MiB/s average, ~40 MiB/s peak" },
          { label: "30-day raw payload", value: "~20 TiB before replication/compression" },
          { label: "Endpoint p95 latency", value: "500 ms" },
          { label: "Peak in-flight attempts", value: "about 5,000 at 10k/s × 0.5s, before retry headroom" },
        ],
      },
      {
        type: "prose",
        title: "Capacity changes the shape",
        body: "The illustrative numbers immediately raise design questions. Keeping 30 days of payloads in the primary relational database may be expensive; object storage plus metadata may be preferable. Peak in-flight attempts suggest bounded worker concurrency, per-tenant quotas, and per-endpoint circuit breaking. Retries amplify traffic, so size from attempt rate rather than submission rate and add jitter to prevent synchronized waves. Partitioning by endpoint can preserve per-endpoint order but creates hot partitions for large tenants. State these consequences instead of presenting capacity arithmetic as decoration.",
      },
      {
        type: "tradeoff",
        title: "Delivery and ordering choices",
        choices: [
          {
            label: "Unordered at-least-once",
            pros: ["Highest parallelism", "Simple partitioning", "Failures affect fewer later events"],
            cons: ["Receiver must tolerate reordering and duplicates"],
            when: "Use when events are independent or contain versions that let receivers reconcile.",
          },
          {
            label: "Per-endpoint ordering",
            pros: ["Matches many receiver expectations", "Limits ordering scope"],
            cons: ["One slow event blocks later events", "Hot endpoint partitions limit throughput"],
            when: "Use when endpoint-local sequence is a contractual requirement.",
          },
          {
            label: "Effectively-once with receiver dedupe",
            pros: ["Prevents repeated receiver side effects in common failure paths", "Works across ambiguous timeouts"],
            cons: ["Requires receiver cooperation and retention of keys", "Still not universal exactly-once delivery"],
            when: "Use when stable event IDs can be honored end to end.",
          },
        ],
      },
      {
        type: "prose",
        title: "Temper across both zoom levels",
        body: "At LLD, test every legal and illegal state transition, inject a clock, avoid holding locks across HTTP calls, and make errors classifiable. At HLD, run failure thought experiments: database commit succeeds but response is lost; outbox publish duplicates; worker dies during lease; endpoint is slow; an entire tenant floods retries; a region fails. Verify observability for queue age, attempts, terminal failures, lease expiry, per-endpoint latency, and outbox lag. Security is part of the contract: encrypt payloads, authenticate callbacks, sign requests, prevent SSRF to private addresses, and isolate tenant data.",
      },
      {
        type: "think",
        title: "Temper checklist",
        clarify: [
          "Which write is the source of truth, and which updates must be atomic with it?",
          "For every network timeout, could the remote side have committed?",
          "How are overload, poison events, hot tenants, and regional loss contained?",
        ],
        model: [
          "Trace one identifier across API, database, outbox, queue, worker, and receiver logs.",
          "Test the state machine independently, then test adapter contracts and failure recovery.",
          "Map each dashboard metric to a violated SLO or stuck transition.",
        ],
        pitfalls: [
          "Using an in-memory mutex as though it coordinates multiple service instances.",
          "Deleting terminal failures before operators or clients can inspect them.",
          "Retrying every 4xx response and turning permanent failures into self-inflicted load.",
        ],
      },
      {
        type: "answer",
        title: "A layered design answer",
        opening:
          "I will first define delivery semantics and ordering, then carry those guarantees from the state machine into storage and asynchronous processing.",
        beats: [
          "Hear: asynchronous acceptance, bounded retries, tenant-scoped idempotency, and honest at-least-once attempts.",
          "Etch: queued/leased/retry/succeeded/dead transitions plus API→transactional outbox→queue→worker→endpoint.",
          "Anchor: unique keys, atomic event+outbox commit, conditional leases, immutable terminal success, and receiver dedupe IDs.",
          "Temper LLD: methods reject illegal transitions; clock and adapters are injectable; tests cover lease expiry and attempt exhaustion.",
          "Temper HLD: size attempts and retention, contain hot tenants, simulate ambiguous timeout and duplicate publication, and instrument queue age/outbox lag.",
        ],
        closing:
          "I would revisit partitioning, payload storage, and regional topology after confirming measured throughput, ordering scope, and recovery objectives.",
      },
      {
        type: "complexity",
        time: "State transition and indexed claim are expected O(1); relay/worker throughput scales with partitions and external latency",
        space: "O(retained events + attempts/metadata + queued work)",
        notes: "System complexity is dominated by retention, retries, and skew—not by the constant-time in-memory transition methods.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "When zooming from HLD to LLD, pick the riskiest invariant and show the method or transaction that enforces it. When zooming out, show which distributed failure can still challenge that local guarantee.",
      },
    ],
    quiz: [
      {
        id: "design-exactly-once",
        prompt: "Why can the sender not guarantee exactly-once receiver side effects by itself?",
        options: [
          "Queues cannot store IDs",
          "A timeout may occur after the receiver commits but before acknowledgement",
          "HTTP cannot retry",
          "Databases cannot use unique keys",
        ],
        answerIndex: 1,
        explanation: "The sender cannot distinguish not processed from processed but response lost. Receiver-side idempotency closes the common ambiguity.",
      },
      {
        id: "design-outbox",
        prompt: "What problem does a transactional outbox solve?",
        options: [
          "It makes HTTP exactly once",
          "It atomically records domain state and intent to publish",
          "It removes the need for a database",
          "It guarantees queue ordering globally",
        ],
        answerIndex: 1,
        explanation: "One local transaction prevents the state-committed/message-missing gap. Relays may still publish duplicates, which consumers must handle.",
      },
      {
        id: "design-lease",
        prompt: "Why does a work claim have an expiry?",
        options: [
          "To sort payloads",
          "To let another worker recover after the claimant crashes",
          "To encrypt events",
          "To avoid all duplicate attempts",
        ],
        answerIndex: 1,
        explanation: "A permanent claim would strand work after a crash. Expiry trades recoverability for possible duplicate attempts.",
      },
      {
        id: "design-idempotency",
        prompt: "What should happen when the same idempotency key arrives with a different payload?",
        options: [
          "Silently return the first result",
          "Treat it as conflict or misuse",
          "Deliver both under one ID",
          "Delete the original",
        ],
        answerIndex: 1,
        explanation: "Hash comparison distinguishes a genuine retry from two different operations incorrectly sharing identity.",
      },
      {
        id: "design-capacity",
        prompt: "Why size workers from attempt rate rather than submission rate?",
        options: [
          "Attempts are always fewer",
          "Retries amplify outbound work beyond accepted events",
          "Submission rate cannot be measured",
          "Workers only process failures",
        ],
        answerIndex: 1,
        explanation: "One accepted event may generate several attempts, especially during dependency failure, precisely when capacity is under stress.",
      },
    ],
  },
];
