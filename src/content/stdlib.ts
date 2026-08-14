import type { Lesson } from "./types";

export const stdlibLessons: Lesson[] = [
  {
    slug: "fmt-and-formatting",
    track: "stdlib",
    title: "fmt and the Formatting Protocol",
    subtitle: "Read and produce precise text with verbs, widths, custom formatters, scanning, and error wrapping.",
    difficulty: "intermediate",
    minutes: 40,
    tags: ["fmt", "formatting", "stringer", "errors"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Choose verbs, flags, width, and precision deliberately.",
          "Understand the formatting dispatch order and implement Stringer or Formatter safely.",
          "Write to io.Writer without unnecessary intermediate strings.",
          "Avoid recursion, accidental secrets, and brittle scan-based parsing.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: fmt interprets a small formatting language",
        body: "Printf parses a format string and consumes operands in order. A verb selects representation; flags modify it; width controls a minimum field; precision controls details such as decimal places or maximum string runes. %v is default, %+v adds field names for structs, %#v prefers Go-syntax-like output, %T reports dynamic type, %q quotes, %x emits hexadecimal, and %p prints an address. Explicit argument indexes such as %[2]d can reuse or reorder operands.",
      },
      {
        type: "code",
        title: "Width, precision, quoting, and types",
        language: "go",
        code: `name := "Go\\nFoundry"
ratio := 7.0 / 3
fmt.Printf("|%10s|\\n", "right")  // minimum width 10
fmt.Printf("|%-10s|\\n", "left")  // left aligned
fmt.Printf("%.2f\\n", ratio)      // 2.33
fmt.Printf("%q\\n", name)         // escaped, quoted string
fmt.Printf("%T %#v\\n", ratio, ratio)
fmt.Printf("%08x\\n", 48879)      // 0000beef`,
      },
      {
        type: "steps",
        title: "Worked formatting dispatch",
        items: [
          "fmt parses the verb and obtains the operand, including its dynamic type when it is an interface.",
          "For string-like verbs it considers specialized formatting interfaces, including fmt.Formatter and error/string representations.",
          "A Formatter receives fmt.State, which exposes flags, width, precision, and an io.Writer.",
          "If no customization applies, reflection-based default formatting handles the underlying value.",
          "Customization must avoid calling the same formatting path on itself, which would recurse forever.",
        ],
      },
      {
        type: "code",
        title: "Stringer with an invalid-value case",
        language: "go",
        code: `type Status uint8
const (
	Pending Status = iota
	Running
	Done
)

func (s Status) String() string {
	switch s {
	case Pending: return "pending"
	case Running: return "running"
	case Done: return "done"
	default: return fmt.Sprintf("Status(%d)", uint8(s))
	}
}

fmt.Printf("state=%s raw=%d\\n", Running, Running)`,
      },
      {
        type: "code",
        title: "Format directly to a destination",
        language: "go",
        code: `func writeRow(w io.Writer, id int, label string) error {
	_, err := fmt.Fprintf(w, "%06d\\t%q\\n", id, label)
	return err
}

base := fs.ErrNotExist
err := fmt.Errorf("load config: %w", base)
fmt.Println(errors.Is(err, fs.ErrNotExist)) // true`,
      },
      {
        type: "prose",
        title: "Scanning is token-oriented, not a general parser",
        body: "Fscan reads whitespace-separated tokens from an io.Reader, while Sscan reads a string and Scan reads standard input. Scanning returns the number of assigned operands and an error; always check both when partial input matters. For CSV, JSON, shell syntax, or validation-heavy protocols, use the dedicated parser. fmt scanning is convenient but reflection-heavy and often too permissive or ambiguous for production wire formats.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "String methods often appear in logs. Do not include passwords, tokens, or full personal records. Also handle unknown enum values: indexing a fixed name array without bounds checks can panic while formatting an error.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "%w has wrapping meaning in Errorf, not Printf. A mismatch produces diagnostic text such as %!d(string=...), which is useful during development but poor user output. Precision for strings counts input runes, while widths are measured in runes rather than terminal display cells; combining marks and wide glyphs can still misalign. Sprintf allocates a string, whereas Fprintf can stream directly. Use strconv for hot, simple numeric conversion.",
      },
    ],
    quiz: [
      {
        id: "fmt-quote",
        prompt: "Which verb is most useful for exposing newlines and quotes in a string?",
        options: ["%s", "%q", "%p", "%T"],
        answerIndex: 1,
        explanation: "%q emits a quoted, escaped representation.",
      },
      {
        id: "fmt-wrap",
        prompt: "Where does %w create an unwrap-able error relationship?",
        options: ["fmt.Printf", "fmt.Sprintf", "fmt.Errorf", "fmt.Fscan"],
        answerIndex: 2,
        explanation: "Errorf gives %w its wrapping semantics.",
      },
      {
        id: "fmt-writer",
        prompt: "Why prefer Fprintf(w, ...) to Sprintf followed by w.Write?",
        options: ["It always sorts fields", "It can avoid an intermediate formatted string", "It encrypts output", "It retries writes"],
        answerIndex: 1,
        explanation: "Fprintf implements formatting directly against an io.Writer.",
      },
      {
        id: "fmt-stringer",
        prompt: "What should String return for an unknown enum value?",
        options: ["Panic", "A stable fallback containing the numeric value", "An empty string", "The previous enum name"],
        answerIndex: 1,
        explanation: "A fallback preserves diagnostic value and keeps logging paths safe.",
      },
    ],
  },
  {
    slug: "strings-strconv-bytes",
    track: "stdlib",
    title: "strings, strconv, and bytes",
    subtitle: "Process UTF-8 text and byte sequences with controlled allocation and correct parsing.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["strings", "strconv", "bytes", "utf8"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Distinguish bytes, runes, and grapheme-like user characters.",
          "Select strings, bytes, Builder, or Buffer from ownership and mutation needs.",
          "Parse and format numbers with explicit bases and bit sizes.",
          "Avoid substring retention, conversion churn, and locale assumptions.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: strings are immutable bytes, usually UTF-8",
        body: "A Go string is an immutable byte sequence; it does not guarantee valid UTF-8. len reports bytes and indexing returns a byte. Ranging decodes UTF-8 into rune values and reports byte offsets, replacing invalid encodings with utf8.RuneError. A rune is a Unicode code point, not necessarily one visible character: accents can combine and emoji may contain multiple code points.",
      },
      {
        type: "code",
        title: "Byte length versus rune iteration",
        language: "go",
        code: `s := "Go界"
fmt.Println(len(s))                    // 5 bytes
fmt.Println(utf8.RuneCountInString(s)) // 3 runes
fmt.Printf("%x\\n", []byte(s))         // 47 6f e7 95 8c

for byteOffset, r := range s {
	fmt.Printf("%d: %U\\n", byteOffset, r)
}`,
      },
      {
        type: "prose",
        title: "Search and transform without regex first",
        body: "strings.Contains, Index, Cut, Fields, Split, TrimSpace, Map, ReplaceAll, and EqualFold cover common text work with clear semantics. Cut is ideal for one delimiter because it returns before, after, and found without manufacturing a surprising number of pieces. Fields collapses Unicode whitespace; Split preserves empty pieces around delimiters. EqualFold performs Unicode case folding and is more correct than lowercasing both sides for caseless equality.",
      },
      {
        type: "code",
        title: "Parse a line with Cut and strconv",
        language: "go",
        code: `func parseLimit(line string) (string, int64, error) {
	key, raw, ok := strings.Cut(line, "=")
	if !ok || strings.TrimSpace(key) == "" {
		return "", 0, fmt.Errorf("expected key=value")
	}
	n, err := strconv.ParseInt(strings.TrimSpace(raw), 10, 32)
	if err != nil {
		return "", 0, fmt.Errorf("limit %q: %w", raw, err)
	}
	return strings.TrimSpace(key), n, nil
}`,
      },
      {
        type: "steps",
        title: "Worked ParseInt choices",
        items: [
          "The base argument controls accepted digits; base 10 rejects hexadecimal prefixes, while base 0 infers prefixes such as 0x.",
          "The bitSize argument defines the intended range. ParseInt with 32 rejects values outside int32 even though it returns int64.",
          "On failure, *strconv.NumError distinguishes syntax from range errors and includes the original function/input.",
          "FormatInt performs the reverse operation without fmt's reflection machinery.",
          "A conversion string(n) means Unicode code point n; strconv.Itoa(n) means decimal digits.",
        ],
      },
      {
        type: "code",
        title: "Builder for text, Buffer for mutable bytes",
        language: "go",
        code: `func joinPath(parts []string) string {
	var b strings.Builder
	b.Grow(len(parts) * 8)
	for i, part := range parts {
		if i > 0 { b.WriteByte('/') }
		b.WriteString(url.PathEscape(part))
	}
	return b.String()
}

var buf bytes.Buffer
_, _ = io.Copy(&buf, compressedSource)
payload := bytes.Clone(buf.Bytes()) // own bytes independent of later reuse`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Do not copy a non-zero strings.Builder; its String result may share builder storage and copying breaks its ownership rules. bytes.Buffer's Bytes slice aliases the buffer and is invalidated by later mutations—clone it when the result must outlive reuse.",
      },
      {
        type: "prose",
        title: "Allocation and edge cases",
        body: "Converting between string and []byte normally copies, because one is immutable and one mutable. Repeated conversions in a loop can dominate allocation profiles. A small substring may keep a much larger source string alive; strings.Clone creates independent storage when long-term retention matters. strings.Trim cutsets are sets of runes, not exact prefixes—use TrimPrefix/TrimSuffix for exact tokens. Neither strings nor bytes provides locale-aware collation or full grapheme segmentation.",
      },
    ],
    quiz: [
      {
        id: "ssb-len",
        prompt: "What does len return for a string?",
        options: ["Unicode code points", "Bytes", "Display columns", "Words"],
        answerIndex: 1,
        explanation: "Strings are byte sequences; range performs UTF-8 decoding separately.",
      },
      {
        id: "ssb-parse",
        prompt: "Why pass bitSize=32 to ParseInt when the result type is int64?",
        options: ["For speed only", "To reject values outside the intended 32-bit range", "To parse base 32", "To return int32"],
        answerIndex: 1,
        explanation: "ParseInt returns int64 but validates range according to bitSize.",
      },
      {
        id: "ssb-cut",
        prompt: "Which function cleanly separates the first key=value delimiter?",
        options: ["strings.Fields", "strings.Cut", "strings.Trim", "bytes.Equal"],
        answerIndex: 1,
        explanation: "Cut returns before, after, and a found boolean for the first occurrence.",
      },
      {
        id: "ssb-buffer",
        prompt: "What is true of bytes.Buffer.Bytes()?",
        options: ["It always returns an independent copy", "It aliases buffer storage", "It returns a string", "It closes the buffer"],
        answerIndex: 1,
        explanation: "The returned slice is only valid until the next buffer modification.",
      },
    ],
  },
  {
    slug: "time-and-scheduling",
    track: "stdlib",
    title: "time, Timers, and Scheduling",
    subtitle: "Model instants, durations, civil time, monotonic measurement, and cancellable timer lifecycles.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["time", "timers", "timezones", "scheduling"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate elapsed duration from wall-clock and civil-time calculations.",
          "Parse and format with explicit layouts and locations.",
          "Use Timer and Ticker without leaks, stale assumptions, or overlapping work.",
          "Test time-dependent code with injected clocks or deadlines.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: instant plus presentation rules",
        body: "time.Time identifies an instant and carries a Location used to derive civil fields. time.Now values also contain a monotonic reading used by Sub, Since, Before, and related comparisons when both operands preserve it. Wall clocks can jump because of NTP or manual changes; monotonic clocks measure elapsed duration. Serialization strips the monotonic component, so persisted timestamps should represent instants, not stopwatch state.",
      },
      {
        type: "code",
        title: "Measure duration and format an instant",
        language: "go",
        code: `start := time.Now()
err := doWork()
elapsed := time.Since(start) // monotonic when available
fmt.Printf("elapsed=%s err=%v\\n", elapsed.Round(time.Millisecond), err)

stamp := time.Now().UTC()
wire := stamp.Format(time.RFC3339Nano)
parsed, err := time.Parse(time.RFC3339Nano, wire)
fmt.Println(parsed.Equal(stamp), err)`,
      },
      {
        type: "prose",
        title: "Layouts and locations",
        body: "Go layouts describe the desired shape by rearranging the reference instant 01/02 03:04:05PM '06 -0700. Parsing without zone information uses UTC with time.Parse; ParseInLocation interprets zone-less civil input in a supplied location. Location rules come from the IANA timezone database and encode historical offset changes. Prefer numeric offsets or named IANA locations over fixed abbreviations, which can be ambiguous.",
      },
      {
        type: "code",
        title: "Civil time across daylight-saving transitions",
        language: "go",
        code: `loc, err := time.LoadLocation("America/New_York")
if err != nil { return err }

meeting, err := time.ParseInLocation(
	"2006-01-02 15:04",
	"2026-11-02 09:30",
	loc,
)
if err != nil { return err }
fmt.Println(meeting.UTC().Format(time.RFC3339))
fmt.Println(meeting.AddDate(0, 0, 1)) // next civil date
fmt.Println(meeting.Add(24 * time.Hour)) // exactly 24 elapsed hours`,
      },
      {
        type: "steps",
        title: "Worked recurring-job choices",
        items: [
          "A Ticker emits opportunities at a target cadence; if the receiver is slow, ticks may be dropped or coalesced rather than building an unbounded queue.",
          "If work must never overlap, perform it synchronously in the receive branch.",
          "If cadence should be measured after completion, use a Timer reset for delay-after-work semantics.",
          "Stop timers/tickers when the owning operation ends. Cancellation should be selected alongside the timer channel.",
          "Define whether missed runs are skipped, caught up, or coalesced—time package APIs do not decide business policy.",
        ],
      },
      {
        type: "code",
        title: "Cancellable non-overlapping schedule",
        language: "go",
        code: `func runEvery(ctx context.Context, period time.Duration, job func()) {
	timer := time.NewTimer(period)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
			job()
			timer.Reset(period) // period after job completion
		}
	}
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Calendar arithmetic is not duration arithmetic. 'Tomorrow at 09:00 local' needs a Location and civil-date rules; adding 24 hours can land at a different local hour across daylight-saving changes.",
      },
      {
        type: "prose",
        title: "Edge cases and testability",
        body: "time.Time's == compares location and representation details, while Equal compares instants; use Equal for semantic timestamp equality. Zero time can be tested with IsZero. Duration overflow and parsing errors deserve checks. time.After is concise, but repeated creation in hot loops creates timers that cannot be stopped by the caller; own a Timer when lifecycle matters. Inject a now function, timer abstraction, or explicit deadline into tests rather than sleeping and hoping the scheduler cooperates.",
      },
    ],
    quiz: [
      {
        id: "time-monotonic",
        prompt: "Why is time.Since(start) preferable to subtracting Unix timestamps?",
        options: ["It always uses UTC text", "It can use monotonic time immune to wall-clock adjustment", "It starts a ticker", "It rounds automatically"],
        answerIndex: 1,
        explanation: "A time.Now value can carry a monotonic reading used for elapsed-time operations.",
      },
      {
        id: "time-layout",
        prompt: "What does Go use to describe timestamp layouts?",
        options: ["YYYY tokens", "A rearranged reference instant", "Regular expressions only", "Locale IDs"],
        answerIndex: 1,
        explanation: "Layouts use the memorable reference components 01/02 03:04:05PM '06 -0700.",
      },
      {
        id: "time-equal",
        prompt: "Which operation compares two time.Time values as instants?",
        options: ["== only", "Time.Equal", "String equality", "Location pointer equality"],
        answerIndex: 1,
        explanation: "Equal accounts for different locations/representations of the same instant.",
      },
      {
        id: "time-ticker",
        prompt: "If a ticker consumer is too slow, what should code assume?",
        options: ["Every tick queues forever", "Ticks may be dropped/coalesced; business catch-up needs explicit policy", "Work runs concurrently automatically", "The ticker panics"],
        answerIndex: 1,
        explanation: "Ticker channels do not provide an unbounded record of every nominal interval.",
      },
    ],
  },
  {
    slug: "io-and-bufio",
    track: "stdlib",
    title: "io and bufio Composition",
    subtitle: "Build bounded-memory pipelines while respecting short reads, EOF, buffering, and ownership.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["io", "bufio", "streaming", "interfaces"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Implement the Reader/Writer contracts correctly, including n>0 with an error.",
          "Compose bounded readers, tees, sections, and copies into streaming pipelines.",
          "Choose Scanner versus Reader and tune token limits.",
          "Flush, close, and propagate errors in the correct ownership layer.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: pull bytes through tiny interfaces",
        body: "io.Reader fills caller-provided storage and returns a byte count plus an error; io.Writer consumes bytes and returns a count plus an error. The pair is powerful because producers and consumers agree only on movement, not storage or source type. A read may return n>0 and io.EOF together—the bytes must be processed before the error. Callers must not assume Read fills the buffer.",
      },
      {
        type: "code",
        title: "Correct manual read loop",
        language: "go",
        code: `func digest(r io.Reader) ([32]byte, error) {
	h := sha256.New()
	buf := make([]byte, 32*1024)
	for {
		n, err := r.Read(buf)
		if n > 0 {
			_, _ = h.Write(buf[:n])
		}
		if err == io.EOF { break }
		if err != nil { return [32]byte{}, err }
	}
	var out [32]byte
	copy(out[:], h.Sum(nil))
	return out, nil
}`,
      },
      {
        type: "prose",
        title: "Let adapters encode common loops",
        body: "io.Copy handles repeated read/write and can use optimized WriterTo or ReaderFrom paths. LimitReader caps exposure to a source; TeeReader observes bytes as they are read; MultiReader concatenates streams; SectionReader presents a bounded seekable window; Pipe synchronizes a streaming producer and consumer without storing the full result. CopyN means exactly N bytes and reports short input.",
      },
      {
        type: "code",
        title: "Bounded upload with simultaneous hashing",
        language: "go",
        code: `func store(dst io.Writer, body io.Reader, max int64) (string, error) {
	h := sha256.New()
	limited := io.LimitReader(body, max+1)
	n, err := io.Copy(io.MultiWriter(dst, h), limited)
	if err != nil { return "", err }
	if n > max { return "", fmt.Errorf("payload exceeds %d bytes", max) }
	return hex.EncodeToString(h.Sum(nil)), nil
}`,
      },
      {
        type: "steps",
        title: "Worked streaming pipeline",
        items: [
          "LimitReader exposes at most max+1 bytes so one extra byte detects oversize input.",
          "MultiWriter sends each chunk to storage and hash state before Copy requests another chunk.",
          "Memory remains bounded by internal buffers rather than payload size.",
          "If either destination fails, MultiWriter returns the failure and Copy stops; callers decide cleanup of partial storage.",
          "The owner of body closes it. A helper accepting a generic Reader should not assume it owns Close.",
        ],
      },
      {
        type: "code",
        title: "Scanner with an explicit token policy",
        language: "go",
        code: `func readLines(r io.Reader) ([]string, error) {
	s := bufio.NewScanner(r)
	s.Buffer(make([]byte, 16*1024), 1024*1024)
	var lines []string
	for s.Scan() {
		lines = append(lines, strings.Clone(s.Text()))
	}
	if err := s.Err(); err != nil { return nil, err }
	return lines, nil
}

// For unbounded or delimiter-preserving input, prefer bufio.Reader
// methods such as ReadString, ReadBytes, or ReadSlice.`,
      },
      {
        type: "prose",
        title: "Buffering and flushing",
        body: "bufio.Reader amortizes small reads and supports Peek/Unread operations. Scanner owns tokenization and is simplest when each token has a known maximum. bufio.Writer batches writes but data is not delivered until the buffer fills or Flush succeeds. Flush errors matter. If another wrapper such as gzip.Writer sits above it, close/flush from outermost transformation inward according to ownership so final trailers and buffered bytes are emitted.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never loop only on err == nil and ignore n. Readers are allowed to return data with a non-nil error, and pathological Readers can occasionally return (0, nil). Use io helpers when possible; custom loops must make progress safely.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "io.ReadAll is correct only when input is already bounded; network bodies need explicit limits. Writer implementations must return a non-nil error if n < len(p), commonly io.ErrShortWrite. Pipe has no internal buffering, so writes block until reads consume data and error propagation must close the appropriate end. Reader values are often stateful and not safe for concurrent use unless documented.",
      },
    ],
    quiz: [
      {
        id: "io-read",
        prompt: "A Reader returns n=5, err=io.EOF. What should the caller do?",
        options: ["Discard bytes", "Process five bytes, then finish", "Retry forever", "Treat it as invalid"],
        answerIndex: 1,
        explanation: "The Reader contract permits data and EOF together; bytes are valid first.",
      },
      {
        id: "io-limit",
        prompt: "Why read max+1 bytes for an upload limit?",
        options: ["For alignment", "The extra byte distinguishes exactly-at-limit from oversized", "To force EOF", "To encrypt the body"],
        answerIndex: 1,
        explanation: "Observing one byte beyond the permitted size proves the payload exceeds the limit.",
      },
      {
        id: "io-scanner",
        prompt: "When is Scanner a poor default?",
        options: ["Bounded line tokens", "Potentially huge tokens without a defined maximum", "Word parsing", "Reading from strings.Reader"],
        answerIndex: 1,
        explanation: "Scanner intentionally has a maximum token size; Reader offers more control for large data.",
      },
      {
        id: "io-flush",
        prompt: "What must happen before a buffered writer's final bytes are guaranteed downstream?",
        options: ["Call Len", "Successful Flush", "Call Reset only", "Run GC"],
        answerIndex: 1,
        explanation: "Buffered data may remain in memory until Flush or a documented close path completes.",
      },
    ],
  },
  {
    slug: "encoding-json",
    track: "stdlib",
    title: "encoding/json at API Boundaries",
    subtitle: "Design wire types, enforce decoding policy, preserve numbers, stream values, and customize safely.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["json", "encoding", "api", "validation"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Design exported wire structs with deliberate tags and optionality.",
          "Decode exactly one bounded JSON value under a clear unknown-field policy.",
          "Preserve numeric precision and distinguish missing, null, and zero.",
          "Implement custom marshaling without recursion or invalid output.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: decoding and validation are separate",
        body: "encoding/json maps JSON syntax into exported Go fields using names and tags. Decode answers whether bytes can be represented by the target shape; it does not enforce business requirements such as positive prices or mutually exclusive fields. Keep transport types explicit, then validate. Unexported fields are ignored. Unknown object fields are ignored by default for compatibility unless Decoder.DisallowUnknownFields is enabled.",
      },
      {
        type: "code",
        title: "Wire struct with optional update fields",
        language: "go",
        code: `type UpdateUser struct {
	DisplayName *string   \`json:"display_name,omitempty"\`
	Age         *int      \`json:"age,omitempty"\`
	Labels      []string  \`json:"labels,omitempty"\`
	Secret      string    \`json:"-"\`
}

func (u UpdateUser) Validate() error {
	if u.Age != nil && (*u.Age < 0 || *u.Age > 150) {
		return fmt.Errorf("age out of range")
	}
	return nil
}

// nil Age means absent; pointer-to-zero means explicitly set to zero.`,
      },
      {
        type: "prose",
        title: "Zero, absent, and null",
        body: "For a non-pointer numeric field, missing and JSON zero both decode to Go zero. A pointer distinguishes absent from present numbers, but JSON null also produces nil, so a custom option type is needed to distinguish all three states. omitempty uses the field's emptiness rule and may hide meaningful zero values. API contracts should choose explicit representations instead of relying on tags to infer intent.",
      },
      {
        type: "code",
        title: "Strict, bounded, single-value decoding",
        language: "go",
        code: `func decodeUpdate(r io.Reader) (UpdateUser, error) {
	var req UpdateUser
	dec := json.NewDecoder(io.LimitReader(r, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		return req, fmt.Errorf("decode request: %w", err)
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		if err == nil { return req, fmt.Errorf("multiple JSON values") }
		return req, fmt.Errorf("trailing data: %w", err)
	}
	return req, req.Validate()
}`,
      },
      {
        type: "steps",
        title: "Worked request boundary",
        items: [
          "LimitReader prevents an attacker from making decoding memory proportional to an unlimited body.",
          "DisallowUnknownFields catches misspelled fields but can make additive API evolution harder; choose policy intentionally.",
          "The first Decode reads one complete value but can leave another value in the stream.",
          "A second Decode requiring io.EOF rejects concatenated values and non-whitespace trailing syntax.",
          "Domain validation runs after syntax/shape decoding and can report contract-specific errors.",
        ],
      },
      {
        type: "code",
        title: "Preserve large numbers and defer variants",
        language: "go",
        code: `type Envelope struct {
	Type string          \`json:"type"\`
	Data json.RawMessage \`json:"data"\`
}

dec := json.NewDecoder(r)
dec.UseNumber()
var dynamic map[string]any
if err := dec.Decode(&dynamic); err != nil { return err }

id, err := dynamic["id"].(json.Number).Int64()
if err != nil { return fmt.Errorf("id: %w", err) }
_ = id`,
      },
      {
        type: "prose",
        title: "Custom types and streaming",
        body: "Marshaler and Unmarshaler own a type's wire representation. Use a defined alias inside methods to avoid recursively calling the same method. Validate enum strings and return descriptive errors. RawMessage retains encoded bytes for delayed variant dispatch. Encoder/Decoder support sequences of JSON values; Token and More permit incremental traversal of large arrays, though concrete structs are simpler and safer for ordinary APIs.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Decoding into any turns JSON numbers into float64 unless UseNumber is enabled. Integers above 2^53 can silently lose precision. Prefer concrete integer/string ID fields or json.Number.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "Marshal rejects NaN and infinities. Duplicate object keys are generally processed in order, so later values can replace or merge earlier ones—validate upstream if duplicates are security-sensitive. HTML escaping is enabled by default in Encoder/Marshal output; SetEscapeHTML(false) changes it when embedding rules permit. Map keys are ordered deterministically in encoded output by current package behavior, but canonical JSON and cryptographic signing need a specified canonicalization scheme.",
      },
    ],
    quiz: [
      {
        id: "json-extra",
        prompt: "Why perform a second Decode after the target value?",
        options: ["To decode fields twice", "To require EOF and reject another JSON value/trailing syntax", "To enable omitempty", "To sort keys"],
        answerIndex: 1,
        explanation: "One Decode can succeed while unread JSON remains in the stream.",
      },
      {
        id: "json-number",
        prompt: "What happens to numbers decoded into any by default?",
        options: ["int64", "json.Number", "float64", "decimal.Decimal"],
        answerIndex: 2,
        explanation: "UseNumber or concrete fields are required when float64 is unsuitable.",
      },
      {
        id: "json-pointer",
        prompt: "Why use *int in a partial-update wire type?",
        options: ["JSON requires pointers", "To distinguish absent from explicitly present zero", "For faster sorting", "To accept strings"],
        answerIndex: 1,
        explanation: "A nil pointer can represent no update while &0 represents an explicit zero.",
      },
      {
        id: "json-unknown",
        prompt: "What tradeoff comes with DisallowUnknownFields?",
        options: ["More typo detection but less tolerance for additive fields", "No validation", "Automatic migrations", "Lossless large numbers"],
        answerIndex: 0,
        explanation: "Strict consumers reject keys they do not know, which may impede forward compatibility.",
      },
    ],
  },
  {
    slug: "net-http-fundamentals",
    track: "stdlib",
    title: "net/http Fundamentals",
    subtitle: "Build bounded servers and reusable clients with correct body, timeout, cancellation, and shutdown behavior.",
    difficulty: "intermediate",
    minutes: 55,
    tags: ["http", "server", "client", "timeouts"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Follow a request through Server, Handler, middleware, and response commitment.",
          "Set server and client limits for distinct phases rather than one magical timeout.",
          "Reuse Transports and close response bodies to preserve connection pooling.",
          "Perform graceful shutdown and propagate request cancellation.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: handlers run concurrently over managed connections",
        body: "Server accepts connections, parses requests, and calls a Handler. Requests may run concurrently, so handler dependencies must be safe or request-scoped. ResponseWriter headers remain mutable until WriteHeader or the first Write commits them. Request.Context is canceled when the client disconnects, the request is canceled, or the handler returns; downstream work should honor it.",
      },
      {
        type: "code",
        title: "A bounded server with Go 1.22+ routing",
        language: "go",
        code: `mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"id": id}); err != nil {
		slog.ErrorContext(r.Context(), "encode response", "err", err)
	}
})

srv := &http.Server{
	Addr:              ":8080",
	Handler:           recoverer(mux),
	ReadHeaderTimeout: 5 * time.Second,
	IdleTimeout:       90 * time.Second,
	MaxHeaderBytes:    1 << 20,
}`,
      },
      {
        type: "prose",
        title: "Timeouts are phase budgets",
        body: "ReadHeaderTimeout limits slow headers. ReadTimeout can cover request-body reads but may be too blunt for streaming uploads. WriteTimeout limits response writing with protocol-specific nuance. IdleTimeout bounds keep-alive idle periods. Per-request application deadlines belong in contexts. On clients, Client.Timeout caps the entire exchange, while Transport exposes dial, TLS handshake, response-header, idle-connection, and pool controls. Select the budget matching the failure mode.",
      },
      {
        type: "code",
        title: "Reusable client and status-aware request",
        language: "go",
        code: `var client = &http.Client{
	Timeout: 8 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:          100,
		MaxIdleConnsPerHost:   20,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   5 * time.Second,
		ResponseHeaderTimeout: 4 * time.Second,
	},
}

func fetch(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil { return nil, err }
	resp, err := client.Do(req)
	if err != nil { return nil, err }
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 32<<10))
		return nil, fmt.Errorf("GET %s: %s", url, resp.Status)
	}
	return io.ReadAll(io.LimitReader(resp.Body, 2<<20))
}`,
      },
      {
        type: "steps",
        title: "Worked client lifecycle",
        items: [
          "NewRequestWithContext binds cancellation and deadline to DNS/dial/write/read work managed by the client.",
          "A long-lived Client shares its Transport, connection pool, and TLS session state across requests.",
          "Do returning nil error means an HTTP response arrived; 404 and 500 are application statuses, not Go errors.",
          "The caller closes Body on every non-nil response. Reading to EOF when reasonable helps HTTP/1 connection reuse.",
          "Response bodies are bounded before ReadAll so memory does not follow an untrusted Content-Length.",
        ],
      },
      {
        type: "code",
        title: "Graceful process shutdown",
        language: "go",
        code: `go func() {
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("server stopped", "err", err)
	}
}()

stopCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
defer stop()
<-stopCtx.Done()

ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
	_ = srv.Close()
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Do not create a new http.Client or Transport per request. You lose pooling and can exhaust sockets. Clients and Transports are designed for concurrent reuse.",
      },
      {
        type: "prose",
        title: "Edge cases and security",
        body: "Limit request bodies with MaxBytesReader before decoding. Set headers before writing status/body; a second WriteHeader does nothing useful. Middleware order determines which layer observes panics, status, and latency. ReverseProxy requires careful trust rules for forwarding headers. Redirects can cross hosts and strip or retain sensitive headers according to policy—configure CheckRedirect when credentials or SSRF boundaries matter. Server.Shutdown waits for active handlers but does not automatically coordinate arbitrary hijacked connections or background jobs.",
      },
    ],
    quiz: [
      {
        id: "http-status",
        prompt: "Does Client.Do return an error for HTTP 500 by default?",
        options: ["Yes", "No; inspect resp.StatusCode", "Only for JSON", "Only with HTTP/2"],
        answerIndex: 1,
        explanation: "A valid HTTP response is transport success even when its application status indicates failure.",
      },
      {
        id: "http-reuse",
        prompt: "Why reuse one http.Client/Transport?",
        options: ["Handlers require globals", "To reuse connection pools and avoid socket churn", "To disable timeouts", "To serialize requests"],
        answerIndex: 1,
        explanation: "Clients and Transports are concurrency-safe and hold expensive reusable network state.",
      },
      {
        id: "http-context",
        prompt: "What should downstream handler work use for cancellation?",
        options: ["context.Background only", "r.Context()", "A global bool", "time.Sleep"],
        answerIndex: 1,
        explanation: "The request context tracks client disconnect and request cancellation.",
      },
      {
        id: "http-shutdown",
        prompt: "What does Server.Shutdown primarily do?",
        options: ["Kill active handlers immediately", "Stop accepting and wait for active connections within the context", "Restart the listener", "Flush every external queue"],
        answerIndex: 1,
        explanation: "Shutdown is graceful for managed HTTP connections; application background work needs its own coordination.",
      },
    ],
  },
  {
    slug: "errors-and-slog",
    track: "stdlib",
    title: "Errors and Structured Logging with slog",
    subtitle: "Design inspectable error chains and emit contextual logs once at the right boundary.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["errors", "slog", "logging", "observability"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Wrap errors with operation context while preserving machine-inspectable identity.",
          "Use Is, As, Join, and custom errors deliberately.",
          "Separate returning an error from deciding where and how to log it.",
          "Build slog records with levels, groups, handlers, and context.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: an error is a value with a traversal graph",
        body: "An error's message is for humans; behavior and chain identity are for code. fmt.Errorf with %w adds context and an Unwrap relationship. errors.Is traverses chains and asks whether a target matches, while errors.As locates a compatible typed error. This preserves abstraction: callers can react to fs.ErrNotExist without parsing 'file not found' text.",
      },
      {
        type: "code",
        title: "Wrap at operation boundaries, classify at policy boundaries",
        language: "go",
        code: `func loadUser(id string) (User, error) {
	u, err := repo.Find(id)
	if err != nil {
		return User{}, fmt.Errorf("find user %q: %w", id, err)
	}
	return u, nil
}

u, err := loadUser(id)
switch {
case errors.Is(err, sql.ErrNoRows):
	http.Error(w, "not found", http.StatusNotFound)
case err != nil:
	http.Error(w, "internal error", http.StatusInternalServerError)
default:
	_ = json.NewEncoder(w).Encode(u)
}`,
      },
      {
        type: "prose",
        title: "Typed errors and multiple causes",
        body: "A typed error is appropriate when callers need structured fields, such as retry-after or invalid field. As should receive a pointer to the target variable. Join combines non-nil errors and exposes multiple unwrap children; Is and As traverse them. Joined errors are useful for independent cleanup/validation failures, but ordering and message parsing should not become APIs.",
      },
      {
        type: "code",
        title: "Collect validation errors without losing identity",
        language: "go",
        code: `var ErrInvalid = errors.New("invalid input")

type FieldError struct {
	Field string
	Cause error
}
func (e *FieldError) Error() string { return e.Field + ": " + e.Cause.Error() }
func (e *FieldError) Unwrap() error { return e.Cause }

err := errors.Join(
	&FieldError{Field: "email", Cause: ErrInvalid},
	&FieldError{Field: "age", Cause: ErrInvalid},
)
fmt.Println(errors.Is(err, ErrInvalid)) // true`,
      },
      {
        type: "steps",
        title: "Worked logging boundary",
        items: [
          "A repository returns a low-level error without logging because it does not know request outcome or severity.",
          "Each layer wraps only useful operation context and returns.",
          "The HTTP boundary maps known errors to status and logs unexpected failures once.",
          "The log record carries request ID, operation, and typed error as attributes—not a preformatted blob.",
          "The client receives a stable safe message; internal paths and credentials stay out of the response.",
        ],
      },
      {
        type: "code",
        title: "Contextual slog with grouped attributes",
        language: "go",
        code: `handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	Level: slog.LevelInfo,
})
base := slog.New(handler).With(
	slog.String("service", "users"),
	slog.String("version", buildVersion),
)

logger := base.With(slog.Group("request",
	slog.String("id", requestID),
	slog.String("method", r.Method),
))
logger.ErrorContext(r.Context(), "request failed",
	slog.String("operation", "load_user"),
	slog.Any("err", err),
)`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Logging and returning the same error at every layer creates duplicate alerts and noisy traces. Return with context; log once where retry, status, severity, and audience are known.",
      },
      {
        type: "prose",
        title: "Edge cases and handler design",
        body: "Wrapping nil with Errorf creates a non-nil error, so guard first. Sentinel comparisons require errors.Is, not ==, once wrapping is possible. slog accepts alternating key/value arguments, but typed attributes catch mistakes and reduce repeated conversion. Handler.Enabled lets expensive attributes be skipped before construction. Use LogValuer to control representation and redact secrets, while preventing recursive values. Context does not magically add attributes; middleware must extract and attach them.",
      },
    ],
    quiz: [
      {
        id: "err-is",
        prompt: "Why use errors.Is instead of == for a wrapped sentinel?",
        options: ["Is compares messages", "Is traverses unwrap relationships", "== panics for errors", "Is logs automatically"],
        answerIndex: 1,
        explanation: "Wrapping changes the outer value while preserving target identity in the chain.",
      },
      {
        id: "err-as",
        prompt: "What does errors.As provide?",
        options: ["String equality", "The first compatible typed error in the chain", "A JSON record", "Automatic retry"],
        answerIndex: 1,
        explanation: "As traverses and assigns a matching error to the supplied target.",
      },
      {
        id: "slog-boundary",
        prompt: "Where should an unexpected request error usually be logged?",
        options: ["At every called function", "Once at the boundary that knows request outcome and severity", "Only in the database", "Inside Error()"],
        answerIndex: 1,
        explanation: "Boundary logging avoids duplicates and has the policy context needed for a useful record.",
      },
      {
        id: "slog-group",
        prompt: "Why group request attributes in slog?",
        options: ["To start goroutines", "To namespace related structured fields", "To wrap errors", "To force debug level"],
        answerIndex: 1,
        explanation: "Groups preserve structure and reduce key collisions in machine-readable output.",
      },
    ],
  },
  {
    slug: "sort-slices-maps-packages",
    track: "stdlib",
    title: "sort, slices, maps, and cmp",
    subtitle: "Apply ordering contracts and generic collection algorithms without hidden aliasing or nondeterminism.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["sort", "slices", "maps", "cmp", "generics"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Write valid three-way comparators and choose stable versus unstable sorting.",
          "Use binary search only under its ordering precondition.",
          "Understand shallow clone, compaction, deletion, and iterator helpers.",
          "Make map-derived output deterministic explicitly.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: algorithms depend on ordering laws",
        body: "Sorting and binary search assume a consistent ordering: comparison should be transitive and agree with equality for the intended key. slices.Sort handles ordered element types; SortFunc takes a comparator returning negative, zero, or positive. Stable sorts preserve input order for equal keys, which matters for multi-pass sorting and user-visible ties, while unstable sorts can use less movement or memory.",
      },
      {
        type: "code",
        title: "Compose a deterministic comparator",
        language: "go",
        code: `type Person struct {
	Name string
	Age  int
}

people := []Person{{"Bo", 30}, {"Ann", 30}, {"Cal", 22}}
slices.SortFunc(people, func(a, b Person) int {
	if n := cmp.Compare(a.Age, b.Age); n != 0 {
		return n
	}
	return cmp.Compare(a.Name, b.Name)
})`,
      },
      {
        type: "prose",
        title: "Binary search is a contract, not a detector",
        body: "slices.BinarySearch requires ascending sorted input under the package's ordering. BinarySearchFunc requires the same comparator relation used to order the slice. It returns an insertion position even when not found, making sorted insertion straightforward. Calling it on unsorted data is logically invalid even if one test happens to find the value.",
      },
      {
        type: "code",
        title: "Search and insert while preserving order",
        language: "go",
        code: `nums := []int{2, 4, 7, 11}
i, found := slices.BinarySearch(nums, 7)
fmt.Println(i, found) // 2 true

pos, found := slices.BinarySearch(nums, 5)
if !found {
	nums = slices.Insert(nums, pos, 5)
}
fmt.Println(nums) // [2 4 5 7 11]`,
      },
      {
        type: "steps",
        title: "Worked deduplication",
        items: [
          "Clone first when the caller's order must remain unchanged; Clone copies the slice backing array but not nested referenced objects.",
          "Sort the clone so equal values become adjacent.",
          "Compact removes adjacent equal runs and returns the shortened slice.",
          "Clear or drop the discarded tail if retaining pointer elements would keep large objects live; current helpers clear obsolete elements where documented.",
          "If original order must be preserved, scan once with a map-based seen set instead of sorting.",
        ],
      },
      {
        type: "code",
        title: "Deterministic map output and safe deletion",
        language: "go",
        code: `scores := map[string]int{"zara": 8, "amy": 10, "bo": 4}
maps.DeleteFunc(scores, func(_ string, score int) bool {
	return score < 5
})

names := slices.Sorted(maps.Keys(scores))
for _, name := range names {
	fmt.Printf("%s=%d\\n", name, scores[name])
}

copyOfScores := maps.Clone(scores) // shallow map copy`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never implement integer comparison as return a-b: subtraction can overflow and violate ordering. Use cmp.Compare(a, b), and define explicit policy for floating-point NaN when it can appear.",
      },
      {
        type: "prose",
        title: "Aliasing and edge cases",
        body: "Most slices mutators modify the input backing array and may return a slice with a changed length; always use the return value. Clone is shallow: pointers, maps, slices, and object fields inside elements still alias. maps.Equal compares values with == and is therefore limited to comparable values; EqualFunc handles custom equality. maps.Keys returns an iterator in current Go APIs, and collecting/sorting it imposes deterministic order. Map iteration itself remains unspecified.",
      },
    ],
    quiz: [
      {
        id: "coll-stable",
        prompt: "When is a stable sort required?",
        options: ["Every numeric sort", "When equal-key elements must preserve prior relative order", "Only for maps", "When using cmp.Compare"],
        answerIndex: 1,
        explanation: "Stability is precisely the preservation of order among elements that compare equal.",
      },
      {
        id: "coll-search",
        prompt: "What does BinarySearch return when a key is absent?",
        options: ["Always -1", "An insertion position and false", "A random index", "A panic"],
        answerIndex: 1,
        explanation: "The index is where the key could be inserted while preserving order.",
      },
      {
        id: "coll-clone",
        prompt: "Does slices.Clone deep-copy pointer-referenced objects?",
        options: ["Yes", "No, it copies elements into a new backing array", "Only after sorting", "Only for structs"],
        answerIndex: 1,
        explanation: "Clone breaks backing-array aliasing but element references still point to the same objects.",
      },
      {
        id: "coll-map-order",
        prompt: "How should stable map output be produced?",
        options: ["Range twice", "Collect keys and sort them", "Depend on insertion order", "Use maps.Clone"],
        answerIndex: 1,
        explanation: "Go maps do not promise iteration order, so order must be imposed.",
      },
    ],
  },
  {
    slug: "testing-package-deep-dive",
    track: "stdlib",
    title: "The testing Package: Tests, Benchmarks, and Fuzzing",
    subtitle: "Design isolated tests, meaningful benchmarks, robust fuzz properties, and diagnosable failures.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["testing", "benchmark", "fuzz", "coverage"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Structure table tests and subtests without shared-state traps.",
          "Use cleanup, temporary directories, environment control, and parallelism safely.",
          "Benchmark the operation rather than setup and interpret allocations.",
          "Write fuzz properties that turn crashes into durable regression inputs.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: tests are ordinary Go under a generated driver",
        body: "go test builds a package-specific binary and runs Test, Benchmark, Example, and fuzz entry points according to flags. Tests should state a behavior, arrange only the required state, invoke production APIs, and compare observable results. Subtests provide names, filtering, isolation hooks, and optional parallel scheduling; tables are a data organization technique, not a requirement.",
      },
      {
        type: "code",
        title: "Table-driven test with useful failure output",
        language: "go",
        code: `func TestParsePort(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    int
		wantErr bool
	}{
		{"minimum", "1", 1, false},
		{"maximum", "65535", 65535, false},
		{"zero", "0", 0, true},
		{"text", "http", 0, true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := ParsePort(tc.input)
			if (err != nil) != tc.wantErr {
				t.Fatalf("ParsePort(%q) error=%v, wantErr=%v", tc.input, err, tc.wantErr)
			}
			if got != tc.want { t.Errorf("got %d, want %d", got, tc.want) }
		})
	}
}`,
      },
      {
        type: "prose",
        title: "Isolation and parallel subtests",
        body: "t.TempDir creates per-test storage and cleanup. t.Setenv restores environment but must not be combined with parallel ancestors. t.Cleanup runs even after FailNow. t.Helper marks assertion/helper frames so errors point to callers. Parallel tests pause at t.Parallel and resume under the runner's parallelism limit; shared fixtures must be immutable, independently allocated, or synchronized.",
      },
      {
        type: "code",
        title: "A benchmark that excludes setup",
        language: "go",
        code: `func BenchmarkEncode(b *testing.B) {
	input := makeFixture()
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		out, err := Encode(input)
		if err != nil { b.Fatal(err) }
		runtime.KeepAlive(out)
	}
}

// Run several samples:
// go test -run='^$' -bench=BenchmarkEncode -benchmem -count=10`,
      },
      {
        type: "steps",
        title: "Worked benchmark interpretation",
        items: [
          "Move fixture creation, I/O setup, and validation outside the timed region unless they are the operation under study.",
          "The harness chooses repetitions to obtain a stable interval; do not assume b.N.",
          "Report allocations because a small ns/op change may hide a meaningful GC improvement—or vice versa.",
          "Run multiple samples under controlled CPU/power conditions and compare distributions with a tool such as benchstat.",
          "Prevent dead-code elimination by making results observable, while avoiding measurement overhead inside the loop.",
        ],
      },
      {
        type: "code",
        title: "Fuzz round-trip and invariants",
        language: "go",
        code: `func FuzzCodec(f *testing.F) {
	f.Add([]byte("hello"))
	f.Add([]byte{})
	f.Fuzz(func(t *testing.T, input []byte) {
		encoded := EncodeBytes(input)
		decoded, err := DecodeBytes(encoded)
		if err != nil { t.Fatalf("decode encoded input: %v", err) }
		if !bytes.Equal(decoded, input) {
			t.Fatalf("round trip mismatch: got %x want %x", decoded, input)
		}
	})
}`,
      },
      {
        type: "prose",
        title: "Fuzzing, coverage, and doubles",
        body: "Fuzzing mutates seed corpus values to discover inputs that violate a property or panic. A minimized failure is saved as testdata and rerun as a regression. Keep targets deterministic, fast, and free of unbounded resource use. Coverage indicates executed statements, not assertion quality. For dependencies, define small interfaces at the consumer and use focused fakes; httptest.Server and ResponseRecorder exercise HTTP behavior with realistic standard-library machinery.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Do not use time.Sleep to 'let a goroutine run.' Synchronize on observable events with channels, contexts, or hooks. Sleeping tests are both slow and flaky under loaded CI.",
      },
      {
        type: "prose",
        title: "Edge cases and commands",
        body: "Test caching can surprise integration tests; use -count=1 when rerunning external-state tests, while preferring hermetic tests. -race finds exercised data races, -shuffle exposes order dependence, -run filters hierarchical names, and -failfast changes feedback but not correctness. Fatal/FailNow exits only the calling goroutine via runtime.Goexit, so calling t.Fatal from a worker goroutine is invalid; report through the test goroutine.",
      },
    ],
    quiz: [
      {
        id: "test-cleanup",
        prompt: "Why prefer t.Cleanup over a final manual cleanup line?",
        options: ["It runs only on success", "It runs when the test completes, including FailNow paths", "It parallelizes cleanup", "It changes coverage"],
        answerIndex: 1,
        explanation: "Cleanup hooks are registered with the test lifecycle and survive early termination.",
      },
      {
        id: "test-bench",
        prompt: "What belongs outside a benchmark's timed loop?",
        options: ["The operation being measured", "Fixture setup not part of the operation", "Every result use", "All error checks"],
        answerIndex: 1,
        explanation: "Benchmark timing should isolate the claimed operation.",
      },
      {
        id: "test-fuzz",
        prompt: "What makes a strong fuzz target?",
        options: ["A single exact expected output for random input", "A deterministic invariant such as round-trip correctness", "Network calls to production", "Unbounded allocation"],
        answerIndex: 1,
        explanation: "Properties let the engine explore broad input space while retaining a clear failure oracle.",
      },
      {
        id: "test-parallel",
        prompt: "What is required for parallel subtests sharing a fixture?",
        options: ["Nothing", "Immutability, separation, or synchronization", "A longer sleep", "GOMAXPROCS=1"],
        answerIndex: 1,
        explanation: "Parallel subtests are concurrent and must obey ordinary race and isolation rules.",
      },
    ],
  },
  {
    slug: "context-package-stdlib",
    track: "stdlib",
    title: "context: Cancellation, Deadlines, and Request Scope",
    subtitle: "Propagate bounded work across APIs without turning context into a dependency bag.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["context", "cancellation", "deadlines", "concurrency"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Explain the context tree and cancellation propagation.",
          "Design APIs with Context in the conventional position.",
          "Stop goroutines and blocking operations when work is canceled.",
          "Use values sparingly and preserve cancellation causes.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: an immutable tree of lifetimes",
        body: "A Context carries a done signal, optional deadline, cancellation error/cause, and request-scoped values. Derivation creates a child linked to its parent. Canceling a parent closes cancellation for descendants; canceling a child does not affect siblings or the parent. Context is safe for concurrent use and should be passed explicitly rather than stored in long-lived structs.",
      },
      {
        type: "code",
        title: "Conventional API and cooperative cancellation",
        language: "go",
        code: `func Process(ctx context.Context, jobs <-chan Job) error {
	for {
		select {
		case <-ctx.Done():
			return context.Cause(ctx)
		case job, ok := <-jobs:
			if !ok { return nil }
			if err := handle(ctx, job); err != nil { return err }
		}
	}
}

// Context is first, named ctx, and not optional.`,
      },
      {
        type: "prose",
        title: "Deadlines are budgets, not schedules",
        body: "WithTimeout and WithDeadline derive cancellation that fires no later than a point in time. A child cannot extend an earlier parent deadline. Downstream calls should receive the same or a deliberately smaller budget. Always invoke the returned CancelFunc: it releases timer and parent-link resources even if the operation completes early. Deadline tells whether a budget exists, while Done lets select interrupt waits.",
      },
      {
        type: "code",
        title: "Bound a dependency and preserve cause",
        language: "go",
        code: `var ErrClientGone = errors.New("client disconnected")

ctx, cancel := context.WithCancelCause(parent)
go func() {
	if clientDisconnected() {
		cancel(ErrClientGone)
	}
}()
defer cancel(nil)

dbCtx, stop := context.WithTimeout(ctx, 750*time.Millisecond)
defer stop()
row := db.QueryRowContext(dbCtx, query, id)
if err := row.Scan(&name); err != nil {
	return fmt.Errorf("scan user: %w", err)
}`,
      },
      {
        type: "steps",
        title: "Worked cancellation propagation",
        items: [
          "An HTTP request supplies a root-like request context tied to the client connection.",
          "The handler derives a 750ms database child and immediately defers its cancel function.",
          "If the client disconnects, the request context cancels and the database child follows.",
          "If the database budget expires first, only that child and its descendants cancel.",
          "The driver must implement context-aware interruption; Context cannot forcibly stop arbitrary code that ignores it.",
        ],
      },
      {
        type: "code",
        title: "Typed private keys for request metadata",
        language: "go",
        code: `type requestIDKey struct{}

func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, id)
}

func RequestID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(requestIDKey{}).(string)
	return id, ok
}

// Values are for cross-cutting request metadata, not service clients
// or optional function parameters.`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never pass nil Context or hide Context in a struct because it is inconvenient. Use context.Background when no caller lifetime exists, and pass ordinary required dependencies as explicit fields/parameters.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "Context cancellation is level-triggered: once Done closes it stays closed. Err reports Canceled or DeadlineExceeded; Cause can preserve an application cause. WithoutCancel detaches cancellation/deadline while retaining values and should be rare because detached work needs its own bounded lifetime. AfterFunc schedules a callback on cancellation and returns a stop function; callback races must be handled. Selecting only on output while a consumer exits can leak a producer—every blocking send in a cancellable pipeline needs a cancellation path.",
      },
    ],
    quiz: [
      {
        id: "ctx-tree",
        prompt: "What happens when a child Context is canceled?",
        options: ["Its parent cancels", "Its siblings cancel", "Only it and its descendants cancel", "Nothing"],
        answerIndex: 2,
        explanation: "Cancellation propagates downward, not upward or sideways.",
      },
      {
        id: "ctx-cancel",
        prompt: "Why call a timeout Context's CancelFunc even after fast success?",
        options: ["To change the result", "To release timer and parent-link resources promptly", "To cancel the parent", "To log the deadline"],
        answerIndex: 1,
        explanation: "Canceling removes resources that otherwise remain until deadline or parent cancellation.",
      },
      {
        id: "ctx-values",
        prompt: "What belongs in Context values?",
        options: ["Database handles", "Optional business parameters", "Cross-cutting request metadata such as request IDs", "All function arguments"],
        answerIndex: 2,
        explanation: "Values are for data transiting API/process boundaries, not dependency injection.",
      },
      {
        id: "ctx-force",
        prompt: "Can Context forcibly terminate code that never checks cancellation?",
        options: ["Yes", "No; operations must cooperate through context-aware APIs or Done checks", "Only on Linux", "Only after GC"],
        answerIndex: 1,
        explanation: "Context communicates cancellation; it cannot kill arbitrary goroutines.",
      },
    ],
  },
  {
    slug: "reflect-unsafe-when",
    track: "stdlib",
    title: "reflect and unsafe: When the Type System Is Not Enough",
    subtitle: "Use runtime type inspection and representation-level operations with explicit invariants and narrow blast radius.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["reflect", "unsafe", "types", "performance"],
    prerequisites: ["interfaces", "pointers", "generics"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Navigate Type, Value, Kind, validity, settable state, and interface extraction.",
          "Write reflection code that handles pointers, nils, and unexported fields safely.",
          "Know which problems generics or ordinary interfaces solve better.",
          "State and test the lifetime, alignment, and pointer rules behind unsafe code.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: reflect reifies dynamic type operations",
        body: "reflect.Type describes a Go type; reflect.Value pairs a dynamic type with access to a value. Kind is the broad representation category—Slice, Struct, Pointer—not the defined type identity. Values may be invalid, nil-able, addressable, settable, or interface-able independently. Reflection moves compile-time checks to runtime, so every operation must establish its preconditions before calling methods that can panic.",
      },
      {
        type: "code",
        title: "Safely walk a pointer to a struct",
        language: "go",
        code: `func exportedFields(x any) (map[string]any, error) {
	v := reflect.ValueOf(x)
	if !v.IsValid() { return nil, fmt.Errorf("nil interface") }
	if v.Kind() == reflect.Pointer {
		if v.IsNil() { return nil, fmt.Errorf("nil pointer") }
		v = v.Elem()
	}
	if v.Kind() != reflect.Struct { return nil, fmt.Errorf("want struct") }

	out := make(map[string]any)
	t := v.Type()
	for i := 0; i < v.NumField(); i++ {
		f := v.Field(i)
		if t.Field(i).IsExported() && f.CanInterface() {
			out[t.Field(i).Name] = f.Interface()
		}
	}
	return out, nil
}`,
      },
      {
        type: "steps",
        title: "Worked reflective assignment",
        items: [
          "ValueOf receives an interface copy. A non-pointer struct Value is not settable.",
          "Require a non-nil pointer, then Elem reaches the addressed object.",
          "Find the field and verify CanSet before mutation.",
          "Construct/convert a value only when assignability or conversion rules permit it.",
          "Return descriptive errors for unsupported shape instead of allowing a reflection panic far from the caller.",
        ],
      },
      {
        type: "code",
        title: "Set an exported string field defensively",
        language: "go",
        code: `func setString(ptr any, field, value string) error {
	v := reflect.ValueOf(ptr)
	if !v.IsValid() || v.Kind() != reflect.Pointer || v.IsNil() {
		return fmt.Errorf("want non-nil pointer")
	}
	dst := v.Elem()
	if dst.Kind() != reflect.Struct { return fmt.Errorf("want pointer to struct") }
	f := dst.FieldByName(field)
	if !f.IsValid() { return fmt.Errorf("unknown field %q", field) }
	if !f.CanSet() || f.Kind() != reflect.String {
		return fmt.Errorf("field %q is not a settable string", field)
	}
	f.SetString(value)
	return nil
}`,
      },
      {
        type: "prose",
        title: "Prefer static tools when shape is known",
        body: "Interfaces handle behavior, generics handle reusable algorithms over compile-time type sets, code generation handles repeated schemas, and type switches handle a closed dynamic set. Reflection is justified for serializers, dependency wiring, schema tools, and framework boundaries where types genuinely arrive at runtime. Cache validated type metadata in hot paths; reflect calls and allocation can otherwise dominate.",
      },
      {
        type: "code",
        title: "unsafe conversion with an explicit lifetime rule",
        language: "go",
        code: `func bytesView(s string) []byte {
	if len(s) == 0 { return nil }
	return unsafe.Slice(unsafe.StringData(s), len(s))
}

// The returned bytes alias immutable string storage.
// The caller MUST NOT modify them and must not use them after s's
// storage is no longer live. A normal []byte(s) copy is safer.

func ownedBytes(s string) []byte {
	return []byte(s)
}`,
      },
      {
        type: "prose",
        title: "unsafe is a proof obligation",
        body: "unsafe.Pointer permits conversions outside ordinary type safety, but garbage collector visibility, pointer provenance, alignment, object bounds, mutability, and lifetime rules still apply. uintptr is an integer, not a rooted pointer; retaining it across allocations or safe points does not keep an object alive. Modern helpers such as unsafe.Add, Slice, String, SliceData, and StringData express intent more clearly, but they do not validate your invariants.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Zero-copy string/byte conversions can create mutable access to immutable memory or a dangling view. Keep unsafe in a tiny internal package, document invariants beside it, test with checkptr/race-enabled builds, and benchmark whether the avoided copy matters.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "Value.IsNil panics for non-nil-able kinds; IsZero and IsValid answer different questions. Interface on an unexported field can panic. Reflect DeepEqual has semantics that may surprise for functions, NaN, nil versus empty slices, and identity shortcuts; prefer domain equality or slices/maps helpers. unsafe.Sizeof excludes referenced storage, struct padding varies by field order and architecture, and representation assumptions can break across Go releases.",
      },
    ],
    quiz: [
      {
        id: "reflect-kind",
        prompt: "What is the difference between Type and Kind?",
        options: ["None", "Type preserves defined identity; Kind is a broad representation category", "Kind includes methods only", "Type is always string"],
        answerIndex: 1,
        explanation: "Many distinct defined types can share the same Kind.",
      },
      {
        id: "reflect-set",
        prompt: "Why pass a pointer to reflective code that mutates a struct?",
        options: ["Pointers sort fields", "Elem can expose addressable, settable storage", "ValueOf rejects structs", "To enable JSON"],
        answerIndex: 1,
        explanation: "ValueOf a struct interface holds a copy; mutation requires addressable underlying storage.",
      },
      {
        id: "unsafe-uintptr",
        prompt: "Why should uintptr not be retained as an object pointer?",
        options: ["It is too small always", "It is an integer and does not keep the object alive or track pointer movement rules", "It is immutable", "It causes compile errors"],
        answerIndex: 1,
        explanation: "Converting to uintptr leaves the GC's pointer model and is safe only in narrow documented patterns.",
      },
      {
        id: "reflect-choice",
        prompt: "When should generics usually beat reflection?",
        options: ["When types are known at compile time and share an algorithm", "When parsing arbitrary schemas at runtime", "When inspecting struct tags dynamically", "Never"],
        answerIndex: 0,
        explanation: "Generics preserve static checking and usually reduce runtime branching and panic risk.",
      },
    ],
  },
  {
    slug: "embed-fs-templates",
    track: "stdlib",
    title: "embed, io/fs, and Templates",
    subtitle: "Package immutable assets, compose filesystem views, and render text or HTML with the right escaping model.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["embed", "fs", "templates", "html"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Embed files at build time and expose them through fs.FS.",
          "Compose Sub, WalkDir, Glob, and testing filesystems without OS coupling.",
          "Parse templates once and execute them concurrently with request data.",
          "Distinguish text/template from html/template contextual escaping.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: fs.FS is a read-only namespace",
        body: "io/fs defines minimal read-only filesystem interfaces with slash-separated paths rooted at '.'. os.DirFS adapts an OS directory; embed.FS exposes build-time files; fstest.MapFS supplies in-memory tests. Algorithms that accept fs.FS become independent of deployment layout. Additional interfaces such as ReadDirFS or StatFS are optional accelerators, and package helpers provide fallbacks.",
      },
      {
        type: "code",
        title: "Embed assets and create a rooted view",
        language: "go",
        code: `import "embed"

//go:embed templates/*.html static/*
var assets embed.FS

func staticFS() (fs.FS, error) {
	return fs.Sub(assets, "static")
}

func listTemplates() error {
	return fs.WalkDir(assets, "templates", func(path string, d fs.DirEntry, err error) error {
		if err != nil { return err }
		if !d.IsDir() { fmt.Println(path) }
		return nil
	})
}`,
      },
      {
        type: "prose",
        title: "Embedding is a build decision",
        body: "Patterns are evaluated relative to the package containing the directive and must match files at build time. Embedded bytes increase binary size and are immutable until a new binary is built. This is excellent for migrations, default config, templates, and small web assets; it is unsuitable for user uploads or data requiring runtime updates. Files beginning with dot/underscore and module boundaries have pattern-specific restrictions, so verify matches in tests.",
      },
      {
        type: "code",
        title: "Parse HTML templates once with explicit functions",
        language: "go",
        code: `var funcs = template.FuncMap{
	"upper": strings.ToUpper,
}

var pages = template.Must(
	template.New("pages").
		Funcs(funcs).
		ParseFS(assets, "templates/*.html"),
)

type PageData struct {
	Title string
	User  string
}

func render(w io.Writer, name string, data PageData) error {
	return pages.ExecuteTemplate(w, name, data)
}`,
      },
      {
        type: "steps",
        title: "Worked template lifecycle",
        items: [
          "Register FuncMap before parsing because function names are resolved during parse.",
          "Parse and validate templates at startup; template.Must is appropriate when malformed bundled assets should prevent startup.",
          "Treat the parsed template set as immutable. Execution is concurrency-safe when writers are independent.",
          "Execute into a buffer when partial output is unacceptable: execution can fail after writing some bytes.",
          "For HTTP, commit status/headers only after buffered rendering succeeds.",
        ],
      },
      {
        type: "code",
        title: "Atomic HTTP rendering and filesystem test",
        language: "go",
        code: `func servePage(w http.ResponseWriter, data PageData) {
	var buf bytes.Buffer
	if err := render(&buf, "page.html", data); err != nil {
		http.Error(w, "render failed", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = buf.WriteTo(w)
}

func TestLoad(t *testing.T) {
	mem := fstest.MapFS{"config.json": {Data: []byte("{\\"port\\":8080}")}}
	got, err := fs.ReadFile(mem, "config.json")
	if err != nil { t.Fatal(err) }
	_ = got
}`,
      },
      {
        type: "prose",
        title: "Contextual escaping is the security boundary",
        body: "text/template performs no HTML escaping and suits plain text, configuration, and source generation. html/template understands HTML contexts and escapes untrusted data differently in text, attributes, URLs, CSS, and JavaScript. Never prebuild markup in strings. Trusted types such as template.HTML bypass escaping and therefore require a proof that content is sanitized—not merely that it came from your database.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Do not switch to text/template to 'fix' escaped HTML, and do not cast user input to template.HTML. Both remove the contextual XSS defense instead of solving the data-model problem.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "FS paths use forward slashes and reject leading slash or '..' traversal through ValidPath rules. DirFS confines path resolution lexically but symlink behavior and hostile directories require careful threat modeling; it is not a universal sandbox. Template map iteration has defined ordering for basic ordered key types in template execution, but presentation order should still be modeled explicitly. Missing keys can render zero values unless option(\"missingkey=error\") is selected.",
      },
    ],
    quiz: [
      {
        id: "embed-sub",
        prompt: "What does fs.Sub provide?",
        options: ["A writable directory", "A filesystem view rooted at a subdirectory", "A compressed archive", "A template clone"],
        answerIndex: 1,
        explanation: "Sub removes a leading directory from the namespace exposed to callers.",
      },
      {
        id: "embed-runtime",
        prompt: "When do embedded asset changes reach the program?",
        options: ["Immediately on disk write", "After rebuilding/redeploying the binary", "After GC", "After template execution"],
        answerIndex: 1,
        explanation: "embed includes matched file data at build time.",
      },
      {
        id: "template-html",
        prompt: "Why use html/template for web pages?",
        options: ["It is faster only", "It applies context-sensitive escaping", "It permits arbitrary Go", "It downloads CSS"],
        answerIndex: 1,
        explanation: "Escaping depends on whether data appears in HTML text, attributes, URLs, scripts, and other contexts.",
      },
      {
        id: "template-buffer",
        prompt: "Why execute a template into bytes.Buffer before an HTTP response?",
        options: ["To avoid parsing", "To prevent partial committed responses when execution fails", "To disable escaping", "To make FS writable"],
        answerIndex: 1,
        explanation: "Template execution can write before encountering an error; buffering makes response commitment atomic.",
      },
    ],
  },
];
