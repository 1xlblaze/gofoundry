import type { Lesson } from "./types";

export const webLessons: Lesson[] = [
  {
    slug: "rest-api-design-go",
    track: "web",
    title: "REST API Design in Go",
    subtitle: "Model resources, preserve HTTP semantics, and keep handlers thin.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["rest", "api", "http", "architecture"],
    prerequisites: ["Go interfaces", "net/http basics", "JSON encoding"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Turn business capabilities into stable resources, URLs, methods, and representations.",
          "Separate transport DTOs, application services, domain objects, and persistence.",
          "Map domain outcomes to status codes and a consistent machine-readable error model.",
          "Design create and update operations for concurrency, retries, and observability.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Who are the clients, and can they be upgraded independently?",
          "Which nouns are resources, and which actions are domain transitions?",
          "Can clients retry writes, and which uniqueness or idempotency rules apply?",
          "What authorization, pagination, latency, and consistency guarantees are required?",
        ],
        model: [
          "HTTP handler owns protocol concerns; an application service owns the use case.",
          "A repository interface hides storage mechanics but preserves domain-level errors.",
          "Representations are versioned contracts, not serialized database rows.",
        ],
        pitfalls: [
          "RPC-shaped URLs such as /createUser for ordinary resource creation.",
          "Returning 200 for every outcome or leaking raw database errors.",
          "Binding domain types directly to a public JSON schema.",
        ],
      },
      {
        type: "prose",
        title: "Resource and contract design",
        body: "Start with the lifecycle rather than a table. A project is created, read, listed, renamed, archived, and perhaps restored. POST /projects asks the collection to create a member; GET /projects/{id} reads it; PATCH changes selected fields; DELETE either removes it or documents a soft-delete transition. PUT means replacement at a client-known URI and should be idempotent. PATCH needs an explicit patch format so omitted fields are distinguishable from zero values. Relationships become nested paths only when ownership is strong: /projects/{id}/tasks is useful, while deep nesting makes resources hard to address. Responses should expose stable IDs and links, never internal row numbers or implementation-only flags.",
      },
      {
        type: "code",
        title: "Application boundary and domain errors",
        language: "go",
        code: `var (
	ErrProjectNotFound = errors.New("project not found")
	ErrNameTaken       = errors.New("project name taken")
	ErrVersionConflict = errors.New("project version conflict")
)

type CreateProject struct {
	AccountID string
	Name      string
}

type ProjectRepository interface {
	Create(ctx context.Context, p Project) error
	ByID(ctx context.Context, accountID, projectID string) (Project, error)
	Update(ctx context.Context, p Project, expectedVersion int64) error
}

type ProjectService interface {
	Create(ctx context.Context, cmd CreateProject) (Project, error)
	Rename(ctx context.Context, accountID, id, name string, version int64) (Project, error)
}

type service struct {
	repo ProjectRepository
	ids  interface{ New() string }
	now  func() time.Time
}

func (s *service) Create(ctx context.Context, cmd CreateProject) (Project, error) {
	name := strings.TrimSpace(cmd.Name)
	if name == "" {
		return Project{}, fmt.Errorf("name: %w", ErrInvalid)
	}
	p := Project{ID: s.ids.New(), AccountID: cmd.AccountID, Name: name, Version: 1, CreatedAt: s.now()}
	if err := s.repo.Create(ctx, p); err != nil {
		return Project{}, fmt.Errorf("create project: %w", err)
	}
	return p, nil
}`,
      },
      {
        type: "code",
        title: "Strict transport decoding and response writing",
        language: "go",
        code: `type createProjectRequest struct {
	Name string ` + "`json:\"name\"`" + `
}

type projectResponse struct {
	ID      string ` + "`json:\"id\"`" + `
	Name    string ` + "`json:\"name\"`" + `
	Version int64  ` + "`json:\"version\"`" + `
}

func (h *Handler) createProject(w http.ResponseWriter, r *http.Request) {
	var in createProjectRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&in); err != nil {
		writeProblem(w, http.StatusBadRequest, "invalid-json", err.Error())
		return
	}

	p, err := h.projects.Create(r.Context(), CreateProject{
		AccountID: accountIDFrom(r.Context()),
		Name:      in.Name,
	})
	if err != nil {
		h.writeProjectError(w, err)
		return
	}

	w.Header().Set("Location", "/projects/"+p.ID)
	w.Header().Set("ETag", strconv.Quote(strconv.FormatInt(p.Version, 10)))
	writeJSON(w, http.StatusCreated, projectResponse{ID: p.ID, Name: p.Name, Version: p.Version})
}`,
      },
      {
        type: "code",
        title: "One error translation point",
        language: "go",
        code: `type problem struct {
	Type   string            ` + "`json:\"type\"`" + `
	Title  string            ` + "`json:\"title\"`" + `
	Status int               ` + "`json:\"status\"`" + `
	Fields map[string]string ` + "`json:\"fields,omitempty\"`" + `
}

func (h *Handler) writeProjectError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, problem{
			Type: "validation", Title: "Request validation failed", Status: 422,
		})
	case errors.Is(err, ErrProjectNotFound):
		writeProblem(w, http.StatusNotFound, "not-found", "project does not exist")
	case errors.Is(err, ErrNameTaken), errors.Is(err, ErrVersionConflict):
		writeProblem(w, http.StatusConflict, "conflict", err.Error())
	case errors.Is(err, context.DeadlineExceeded):
		writeProblem(w, http.StatusGatewayTimeout, "timeout", "operation timed out")
	default:
		h.log.Error("project request failed", "error", err)
		writeProblem(w, http.StatusInternalServerError, "internal", "internal server error")
	}
}`,
      },
      {
        type: "steps",
        title: "Worked flow: POST /projects",
        items: [
          "The router matches POST /projects; request-ID, authentication, timeout, and logging middleware wrap the handler.",
          "The handler caps and strictly decodes JSON, then builds a transport-independent CreateProject command.",
          "The service trims and validates the name, creates an ID, and asks the repository to persist the aggregate.",
          "A unique account_id/name constraint closes the race between concurrent creates and becomes ErrNameTaken.",
          "The handler returns 201, a Location header, an ETag for optimistic concurrency, and the public representation.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes and edge cases",
        body: "Reject multiple JSON values, unknown fields when the contract is strict, oversized bodies, invalid UTF-8 policy violations, and unsupported media types. Treat cancellation as normal: pass r.Context through every call and do not replace it with context.Background. A read followed by write is not enough to enforce uniqueness; the database constraint is the authority. Concurrent PATCH requests can lose updates unless clients send If-Match and the repository updates WHERE version = expected. Never reveal whether another tenant owns an ID; return the same not-found response. Decide whether DELETE is idempotent: many APIs return 204 even when already absent, while security-sensitive resources may return 404.",
      },
      {
        type: "tradeoff",
        title: "How should updates be expressed?",
        choices: [
          {
            label: "PUT replacement",
            pros: ["Naturally idempotent", "Simple complete-resource semantics"],
            cons: ["Clients must send every writable field", "Risk of clearing fields from stale representations"],
            when: "Use when resources are small and clients own the complete representation.",
          },
          {
            label: "Typed PATCH document",
            pros: ["Efficient partial updates", "Pointers or option types distinguish omitted from zero"],
            cons: ["More DTO and validation code", "Patch semantics must be documented"],
            when: "Use for ordinary partial updates with a known set of fields.",
          },
          {
            label: "Domain action endpoint",
            pros: ["Captures commands such as cancel or approve", "Can enforce explicit transition rules"],
            cons: ["Less uniform than CRUD", "Can degrade into arbitrary RPC endpoints"],
            when: "Use for meaningful state transitions, for example POST /orders/{id}/cancellation.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would first identify resource lifecycles and retry semantics, then define the HTTP contract before choosing handler and repository details.",
        beats: [
          "Show collection/member routes and explain POST, PUT, PATCH, status codes, Location, and ETag.",
          "Draw handler → service → repository, with DTOs only at the transport boundary.",
          "Name domain errors and translate them once into a consistent problem response.",
          "Close races with constraints, transactions, idempotency keys, and optimistic versions.",
          "Finish with cancellation, observability, authorization, and compatibility testing.",
        ],
        closing: "The result is an HTTP contract that stays stable while business and storage code evolve independently.",
      },
    ],
    quiz: [
      {
        id: "rest-1",
        prompt: "Which response best describes successful resource creation?",
        options: ["200 without headers", "201 with Location", "204 with a JSON body", "302 to the database"],
        answerIndex: 1,
        explanation: "201 Created communicates creation, and Location identifies the new resource.",
      },
      {
        id: "rest-2",
        prompt: "What closes a race between two requests creating the same unique name?",
        options: ["Validation in both handlers", "A sleep before insert", "A database unique constraint", "A larger request body limit"],
        answerIndex: 2,
        explanation: "Application checks improve errors, but only an atomic storage constraint enforces uniqueness under concurrency.",
      },
      {
        id: "rest-3",
        prompt: "Why keep request DTOs separate from domain objects?",
        options: ["JSON cannot encode domain objects", "To let the public contract and domain evolve independently", "To avoid all mapping code", "Because interfaces require DTOs"],
        answerIndex: 1,
        explanation: "Boundary DTOs prevent transport concerns and accidental fields from becoming domain or API contracts.",
      },
      {
        id: "rest-4",
        prompt: "What does If-Match with an ETag help prevent?",
        options: ["Slow JSON parsing", "Lost updates from stale clients", "CORS preflights", "Duplicate route registration"],
        answerIndex: 1,
        explanation: "The server updates only when the supplied version still matches the resource.",
      },
    ],
  },
  {
    slug: "middleware-and-context",
    track: "web",
    title: "Middleware and Request Context",
    subtitle: "Build ordered request pipelines with cancellation and typed request-scoped values.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["middleware", "context", "http", "observability"],
    prerequisites: ["net/http", "goroutines", "defer"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Compose middleware in a deliberate order and reason about before/after execution.",
          "Propagate cancellation, deadlines, trace IDs, and authenticated principals safely.",
          "Capture status and latency without breaking optional http.ResponseWriter interfaces.",
          "Avoid context misuse, goroutine leaks, double writes, and panic-recovery traps.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which concerns apply globally, to a route group, or to one handler?",
          "Where is authentication performed and which handlers may be anonymous?",
          "What request timeout is valid for ordinary calls versus streams?",
          "Which metadata must appear in logs, traces, metrics, and downstream calls?",
        ],
        model: [
          "Middleware is func(http.Handler) http.Handler; outer layers run first and finish last.",
          "Context is a cancellation tree plus small request metadata, not a dependency container.",
          "The request owns its context; downstream work should stop when that context is done.",
        ],
        pitfalls: [
          "Using string keys, storing mutable global-like objects, or passing nil contexts.",
          "Starting detached goroutines that keep using request data after cancellation.",
          "Placing recovery inside middleware whose own panic must also be caught.",
        ],
      },
      {
        type: "prose",
        title: "A request pipeline is an ordered call stack",
        body: "Given chain(handler, recovery, requestID, logging, timeout, auth), recovery is outermost. Its prelude runs first; auth runs last before the handler; unwind happens in reverse. Ordering changes behavior: logging outside auth records rejected requests, a timeout inside tracing preserves trace metadata, and CORS outside auth ensures browsers can read an authorization error. Middleware should either terminate the request or call next exactly once. Cross-cutting protocol behavior belongs here; business authorization often belongs in the service because only it knows whether a user may mutate a particular aggregate.",
      },
      {
        type: "code",
        title: "Composable chain with typed context access",
        language: "go",
        code: `type Middleware func(http.Handler) http.Handler

func Chain(final http.Handler, middleware ...Middleware) http.Handler {
	for i := len(middleware) - 1; i >= 0; i-- {
		final = middleware[i](final)
	}
	return final
}

type principalKey struct{}

type Principal struct {
	UserID string
	Roles  map[string]struct{}
}

func withPrincipal(ctx context.Context, p Principal) context.Context {
	return context.WithValue(ctx, principalKey{}, p)
}

func principalFrom(ctx context.Context) (Principal, bool) {
	p, ok := ctx.Value(principalKey{}).(Principal)
	return p, ok
}

func RequirePrincipal(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p, err := authenticateBearer(r.Context(), r.Header.Get("Authorization"))
		if err != nil {
			writeProblem(w, 401, "unauthenticated", "valid credentials required")
			return
		}
		next.ServeHTTP(w, r.WithContext(withPrincipal(r.Context(), p)))
	})
}`,
      },
      {
        type: "code",
        title: "Timeout and recovery without hiding cancellation",
        language: "go",
        code: `func Timeout(d time.Duration) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), d)
			defer cancel()
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func Recover(log *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if v := recover(); v != nil {
					log.ErrorContext(r.Context(), "panic recovered",
						"panic", v, "stack", string(debug.Stack()))
					if !responseStarted(w) {
						writeProblem(w, 500, "internal", "internal server error")
					}
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}`,
      },
      {
        type: "code",
        title: "Status-aware access logging",
        language: "go",
        code: `type captureWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (w *captureWriter) WriteHeader(code int) {
	if w.status != 0 {
		return
	}
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *captureWriter) Write(p []byte) (int, error) {
	if w.status == 0 {
		w.WriteHeader(http.StatusOK)
	}
	n, err := w.ResponseWriter.Write(p)
	w.bytes += n
	return n, err
}

func AccessLog(log *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			cw := &captureWriter{ResponseWriter: w}
			next.ServeHTTP(cw, r)
			log.InfoContext(r.Context(), "request",
				"method", r.Method, "path", r.URL.Path,
				"status", cw.status, "bytes", cw.bytes,
				"duration", time.Since(start))
		})
	}
}`,
      },
      {
        type: "steps",
        title: "Worked flow: authenticated request times out",
        items: [
          "Recovery opens the outer safety boundary and request-ID middleware attaches an ID.",
          "Access logging records start time; timeout derives a child context with a deadline.",
          "Authentication verifies credentials and adds a Principal using a private key type.",
          "The handler calls a repository with r.Context; its database query is canceled at the deadline.",
          "The handler maps context.DeadlineExceeded, middleware unwinds, and the log includes status, bytes, request ID, and duration.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, edge cases, and concurrency",
        body: "Timeout middleware cannot safely write a 504 concurrently while a handler may still write; prefer cooperative cancellation and a server WriteTimeout, or use a carefully designed buffering handler. Recovery only catches panics in the same goroutine, so child goroutines need their own recovery or, better, structured ownership with errgroup. A response recorder can accidentally drop Flusher, Hijacker, Pusher, or ReaderFrom capabilities; production wrappers should forward interfaces needed by WebSockets and streaming. Context values should be immutable or treated as read-only. Never retain r.Context for queued work: copy the required IDs and create a bounded background context owned by the worker.",
      },
      {
        type: "tradeoff",
        title: "Where should request data live?",
        choices: [
          {
            label: "Typed context values",
            pros: ["Fits request-scoped metadata", "Propagates through standard APIs"],
            cons: ["Dependencies become implicit", "Type/key discipline is required"],
            when: "Use for request ID, trace span, locale, and authenticated identity.",
          },
          {
            label: "Explicit parameters",
            pros: ["Dependencies are visible and testable", "Compile-time clarity"],
            cons: ["Can create repetitive signatures", "Awkward for ubiquitous metadata"],
            when: "Use for business inputs, services, transactions, and optional behavior.",
          },
          {
            label: "Handler struct fields",
            pros: ["Good for stable process-scoped dependencies", "Easy constructor validation"],
            cons: ["Not request-specific", "Must be concurrency-safe"],
            when: "Use for logger, service, metrics registry, and configuration.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I model middleware as an ordered call stack and context as the request's cancellation and metadata carrier.",
        beats: [
          "State the wrapper signature and show reverse composition.",
          "Order recovery, IDs/tracing, access logs, CORS, timeout, and authentication intentionally.",
          "Use private key types and accessor functions for small immutable metadata.",
          "Propagate the same context to network and database calls so cancellation works.",
          "Call out streaming, optional ResponseWriter interfaces, child goroutines, and double-write hazards.",
        ],
        closing: "The pipeline remains observable and safe because every layer has one protocol responsibility and honors request ownership.",
      },
    ],
    quiz: [
      {
        id: "mw-1",
        prompt: "In Chain(handler, A, B), which prelude runs first?",
        options: ["The handler", "B", "A", "Order is random"],
        answerIndex: 2,
        explanation: "A wraps B, so A executes before B and unwinds after B.",
      },
      {
        id: "mw-2",
        prompt: "What belongs in context values?",
        options: ["All service dependencies", "Small request-scoped metadata", "A global mutable cache", "Optional configuration files"],
        answerIndex: 1,
        explanation: "Context values are intended for request-scoped data crossing API boundaries, not dependency injection.",
      },
      {
        id: "mw-3",
        prompt: "Why can a ResponseWriter wrapper break WebSockets?",
        options: ["It may fail to forward http.Hijacker", "It always disables TCP", "It changes the request method", "It removes context"],
        answerIndex: 0,
        explanation: "Upgrade paths may depend on optional interfaces such as Hijacker and Flusher.",
      },
      {
        id: "mw-4",
        prompt: "Can outer recovery catch a panic in a new goroutine?",
        options: ["Always", "Only on Linux", "No, recover applies to the same goroutine stack", "Only with a deadline"],
        answerIndex: 2,
        explanation: "Each goroutine has its own stack and panic boundary.",
      },
    ],
  },
  {
    slug: "auth-jwt-sessions",
    track: "web",
    title: "Authentication: Sessions, JWT, and OIDC",
    subtitle: "Design login, token rotation, revocation, and authorization boundaries.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["auth", "jwt", "sessions", "oidc", "security"],
    prerequisites: ["HTTP cookies", "cryptographic hashes", "middleware"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate authentication, session/token lifecycle, and resource authorization.",
          "Implement secure opaque sessions and short-lived JWT verification boundaries.",
          "Rotate refresh tokens safely and detect replay after token theft.",
          "Integrate OIDC without trusting unverified token fields or browser claims.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Are clients same-site browsers, SPAs, mobile apps, or internal services?",
          "How quickly must logout, role changes, or account suspension take effect?",
          "Which service is the token issuer, and how are verification keys distributed?",
          "What threats matter: XSS, CSRF, token replay, credential stuffing, or tenant confusion?",
        ],
        model: [
          "Passwords prove identity at login; sessions or tokens represent subsequent authentication.",
          "Authentication yields a principal; authorization still checks action and resource.",
          "Access tokens are short-lived; refresh credentials are high-value, stored and rotated.",
        ],
        pitfalls: [
          "Putting long-lived bearer tokens in localStorage where XSS can read them.",
          "Trusting a JWT algorithm, issuer, audience, or key ID supplied by the token itself.",
          "Treating decoding as signature verification or using an ID token as an API access token.",
        ],
      },
      {
        type: "prose",
        title: "Choose a credential lifecycle, not a buzzword",
        body: "An opaque session cookie contains a random, meaningless identifier. The server hashes it, loads state from a database or Redis, and can revoke it immediately. A JWT access token contains signed claims and can be verified locally, reducing per-request lookups but accepting stale claims until expiry. Neither is automatically safer. Browser applications often benefit from HttpOnly, Secure, SameSite cookies and CSRF protection; native clients commonly use authorization-code flow with PKCE and store refresh credentials in OS secure storage. OIDC delegates authentication to an issuer, while your application still maps the issuer/subject pair to a local principal and enforces local policy.",
      },
      {
        type: "code",
        title: "Opaque session store and secure cookie",
        language: "go",
        code: `type Session struct {
	IDHash    [32]byte
	UserID    string
	ExpiresAt time.Time
	CSRFHash  [32]byte
}

type SessionStore interface {
	Create(ctx context.Context, session Session) error
	FindActive(ctx context.Context, idHash [32]byte, now time.Time) (Session, error)
	Delete(ctx context.Context, idHash [32]byte) error
	DeleteAllForUser(ctx context.Context, userID string) error
}

func issueSession(ctx context.Context, w http.ResponseWriter, store SessionStore, userID string) error {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return fmt.Errorf("generate session: %w", err)
	}
	value := base64.RawURLEncoding.EncodeToString(raw)
	s := Session{IDHash: sha256.Sum256(raw), UserID: userID, ExpiresAt: time.Now().Add(12 * time.Hour)}
	if err := store.Create(ctx, s); err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name: "__Host-session", Value: value, Path: "/",
		HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode,
		MaxAge: int((12 * time.Hour).Seconds()),
	})
	return nil
}`,
      },
      {
        type: "code",
        title: "JWT verifier pins trust policy",
        language: "go",
        code: `type AccessClaims struct {
	Subject string
	Issuer  string
	Audience []string
	ExpiresAt time.Time
	NotBefore time.Time
	TokenID string
}

type KeySet interface {
	VerificationKey(ctx context.Context, keyID string) (crypto.PublicKey, error)
}

type TokenVerifier interface {
	VerifyAccess(ctx context.Context, raw string) (AccessClaims, error)
}

func (v *Verifier) VerifyAccess(ctx context.Context, raw string) (AccessClaims, error) {
	header, claims, signed, err := parseCompactJWT(raw)
	if err != nil || header.Algorithm != "RS256" {
		return AccessClaims{}, ErrInvalidToken
	}
	key, err := v.keys.VerificationKey(ctx, header.KeyID)
	if err != nil || !rsa.VerifyPKCS1v15(key.(*rsa.PublicKey), crypto.SHA256, digest(signed), claims.Signature) {
		return AccessClaims{}, ErrInvalidToken
	}
	now := v.clock.Now()
	if claims.Issuer != v.issuer || !contains(claims.Audience, v.audience) ||
		now.Before(claims.NotBefore) || !now.Before(claims.ExpiresAt) {
		return AccessClaims{}, ErrInvalidToken
	}
	return claims.AccessClaims, nil
}`,
      },
      {
        type: "code",
        title: "Refresh rotation as one atomic operation",
        language: "go",
        code: `type RefreshToken struct {
	FamilyID  string
	TokenHash [32]byte
	UserID    string
	ExpiresAt time.Time
	UsedAt    *time.Time
}

type RefreshStore interface {
	Rotate(ctx context.Context, oldHash [32]byte, replacement RefreshToken) (userID string, err error)
	RevokeFamily(ctx context.Context, familyID string) error
}

func (s *AuthService) Refresh(ctx context.Context, presented []byte) (Tokens, error) {
	oldHash := sha256.Sum256(presented)
	rawNext := randomBytes(32)
	next := RefreshToken{
		TokenHash: sha256.Sum256(rawNext),
		ExpiresAt: s.clock.Now().Add(30 * 24 * time.Hour),
	}
	userID, err := s.refresh.Rotate(ctx, oldHash, next)
	if errors.Is(err, ErrRefreshReused) {
		_ = s.refresh.RevokeFamily(ctx, next.FamilyID)
		return Tokens{}, ErrCredentialsCompromised
	}
	if err != nil {
		return Tokens{}, err
	}
	access, err := s.signer.SignAccess(userID, 10*time.Minute)
	return Tokens{Access: access, Refresh: rawNext}, err
}`,
      },
      {
        type: "steps",
        title: "Worked flow: OIDC login and refresh",
        items: [
          "The browser starts authorization code flow with state, nonce, and PKCE; the provider authenticates the user.",
          "The backend exchanges the one-time code, validates issuer, audience, signature, expiry, and nonce on the ID token.",
          "It maps (issuer, subject) to a local user and issues an application session or access/refresh pair.",
          "An API middleware verifies the access credential and builds a minimal Principal; the service authorizes the requested resource.",
          "At refresh, the store consumes the old hash and inserts the replacement atomically; reuse revokes the entire token family.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes and security edge cases",
        body: "Hash session and refresh values at rest so a database leak does not immediately create bearer credentials. Rate-limit login by account and network signals without permanently locking out victims. Regenerate sessions after login to prevent fixation. Cookie authentication needs CSRF defense for unsafe methods; bearer headers do not remove XSS risk. Cache JWKS keys by cache headers, allow controlled key rotation, and reject unknown key IDs rather than fetching arbitrary URLs. Apply small clock skew, but never unlimited leeway. Keep tokens out of URLs and logs. Logout from one device, all devices, password change, and compromised-refresh replay are separate product decisions.",
      },
      {
        type: "tradeoff",
        title: "Session or JWT access token?",
        choices: [
          {
            label: "Opaque server-side session",
            pros: ["Immediate revocation", "Small cookie and mutable server-side state", "Simple browser model"],
            cons: ["Shared lookup on requests", "Store availability affects authentication"],
            when: "Use for first-party web applications and strict revocation requirements.",
          },
          {
            label: "Short-lived JWT access token",
            pros: ["Local verification", "Useful across services and native clients"],
            cons: ["Claims remain stale until expiry", "Key and audience policy is easy to misconfigure"],
            when: "Use for bounded service ecosystems with a trusted issuer and short expirations.",
          },
          {
            label: "Opaque access token with introspection",
            pros: ["Central policy and revocation", "No claims exposed to clients"],
            cons: ["Network hop or caching", "Identity service can become a bottleneck"],
            when: "Use when centralized control matters more than local verification.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would choose the credential model from client type, revocation latency, and trust boundaries, then design rotation and attack handling explicitly.",
        beats: [
          "Separate login, authentication middleware, and resource authorization.",
          "For sessions, use high-entropy opaque values, hashed storage, secure cookie flags, expiry, and CSRF protection.",
          "For JWTs, pin algorithm, key, issuer, audience, time claims, and token purpose.",
          "Use short access lifetime and one-time refresh rotation with family replay detection.",
          "Cover OIDC code flow with PKCE, logout semantics, key rotation, rate limits, audit logs, and secret redaction.",
        ],
        closing: "The important property is a controlled, observable credential lifecycle—not whether the token happens to be a JWT.",
      },
    ],
    quiz: [
      {
        id: "auth-1",
        prompt: "Why hash opaque session IDs in the store?",
        options: ["To make cookies larger", "So a store leak does not directly reveal usable bearer values", "To avoid randomness", "Because SHA-256 expires values"],
        answerIndex: 1,
        explanation: "The browser holds the bearer secret; the server can store only a one-way lookup hash.",
      },
      {
        id: "auth-2",
        prompt: "Which JWT checks are essential beyond signature verification?",
        options: ["Only the subject", "Issuer, audience, time claims, algorithm, and purpose", "The JSON indentation", "The client IP in every case"],
        answerIndex: 1,
        explanation: "A valid signature does not prove the token was issued for this service, audience, or use.",
      },
      {
        id: "auth-3",
        prompt: "What does refresh-token rotation detect?",
        options: ["Slow databases", "Reuse of an already consumed refresh credential", "CORS errors", "Password strength"],
        answerIndex: 1,
        explanation: "If an old token appears after rotation, one copy was likely stolen, so the family should be revoked.",
      },
      {
        id: "auth-4",
        prompt: "Does authentication alone prove a user may edit project P?",
        options: ["Yes", "No; the application must authorize that action on that resource", "Only for JWTs", "Only with HTTPS"],
        answerIndex: 1,
        explanation: "Authentication identifies a principal; authorization evaluates an action against a resource and policy.",
      },
    ],
  },
  {
    slug: "grpc-basics-go",
    track: "web",
    title: "gRPC Services in Go",
    subtitle: "Design protobuf contracts, deadlines, streaming, and production interceptors.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["grpc", "protobuf", "rpc", "streaming"],
    prerequisites: ["HTTP/2 concepts", "Go interfaces", "context"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Design evolvable protobuf messages and service methods.",
          "Implement unary and server-streaming RPCs behind domain interfaces.",
          "Propagate deadlines, metadata, canonical errors, and cancellation.",
          "Reason about retries, idempotency, flow control, health, and REST tradeoffs.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Are callers internal services, native apps, browsers, or external partners?",
          "Which methods are unary, long-running, or streaming?",
          "Can calls be retried, and are writes idempotent?",
          "What compatibility window and languages must the schema support?",
        ],
        model: [
          "The proto is a wire contract; generated structs are transport DTOs.",
          "Handlers translate to an application service and canonical status codes.",
          "Clients own deadlines; servers stop work when stream or context cancellation arrives.",
        ],
        pitfalls: [
          "Reusing removed field numbers or changing a field's semantic meaning.",
          "Returning Internal for expected NotFound or InvalidArgument outcomes.",
          "Retrying non-idempotent calls after ambiguous transport failure.",
        ],
      },
      {
        type: "prose",
        title: "Contract-first RPC",
        body: "gRPC uses protobuf messages and generated client/server interfaces over HTTP/2. Binary encoding is compact, multiplexing avoids one TCP connection per call, and streaming is first-class. The schema still requires design discipline: field numbers are permanent identities, zero values need clear meaning, and optional presence matters for patches. Reserve deleted numbers and names. Prefer specific request/response messages over primitives so the contract can grow. Do not expose database models directly; generated messages belong at the transport edge just like JSON DTOs.",
      },
      {
        type: "code",
        title: "Evolvable service contract",
        language: "text",
        code: `syntax = "proto3";
package orders.v1;
option go_package = "example.com/shop/gen/orders/v1;ordersv1";

service OrderService {
  rpc GetOrder(GetOrderRequest) returns (GetOrderResponse);
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
  rpc WatchOrders(WatchOrdersRequest) returns (stream OrderEvent);
}

message GetOrderRequest { string order_id = 1; }
message GetOrderResponse { Order order = 1; }

message CreateOrderRequest {
  string customer_id = 1;
  repeated LineItem items = 2;
  string idempotency_key = 3;
}
message CreateOrderResponse { Order order = 1; }

message Order {
  string id = 1;
  string state = 2;
  int64 total_cents = 3;
  int64 version = 4;
  reserved 5;
}

message WatchOrdersRequest { string customer_id = 1; int64 after_sequence = 2; }
message OrderEvent { int64 sequence = 1; Order order = 2; }`,
      },
      {
        type: "code",
        title: "Unary implementation with error translation",
        language: "go",
        code: `type OrderApplication interface {
	Get(ctx context.Context, orderID string) (Order, error)
	Create(ctx context.Context, cmd CreateOrder) (Order, error)
	Events(ctx context.Context, customerID string, after int64) (<-chan OrderEvent, error)
}

type OrderServer struct {
	ordersv1.UnimplementedOrderServiceServer
	app OrderApplication
}

func (s *OrderServer) CreateOrder(ctx context.Context, req *ordersv1.CreateOrderRequest) (*ordersv1.CreateOrderResponse, error) {
	if req.GetCustomerId() == "" || len(req.GetItems()) == 0 {
		return nil, status.Error(codes.InvalidArgument, "customer_id and items are required")
	}
	order, err := s.app.Create(ctx, toCreateCommand(req))
	switch {
	case errors.Is(err, ErrDuplicateKey):
		return nil, status.Error(codes.AlreadyExists, "idempotency key has different input")
	case errors.Is(err, ErrCustomerNotFound):
		return nil, status.Error(codes.FailedPrecondition, "customer does not exist")
	case err != nil:
		return nil, status.Error(codes.Internal, "create order failed")
	default:
		return &ordersv1.CreateOrderResponse{Order: toProto(order)}, nil
	}
}`,
      },
      {
        type: "code",
        title: "Cancellation-aware stream and client deadline",
        language: "go",
        code: `func (s *OrderServer) WatchOrders(req *ordersv1.WatchOrdersRequest, stream ordersv1.OrderService_WatchOrdersServer) error {
	events, err := s.app.Events(stream.Context(), req.GetCustomerId(), req.GetAfterSequence())
	if err != nil {
		return toStatus(err)
	}
	for {
		select {
		case <-stream.Context().Done():
			return status.FromContextError(stream.Context().Err()).Err()
		case event, ok := <-events:
			if !ok {
				return nil
			}
			if err := stream.Send(toProtoEvent(event)); err != nil {
				return err
			}
		}
	}
}

func fetchOrder(ctx context.Context, client ordersv1.OrderServiceClient, id string) (*ordersv1.Order, error) {
	ctx, cancel := context.WithTimeout(ctx, 750*time.Millisecond)
	defer cancel()
	resp, err := client.GetOrder(ctx, &ordersv1.GetOrderRequest{OrderId: id},
		grpc.WaitForReady(false))
	if err != nil {
		return nil, fmt.Errorf("get order: %w", err)
	}
	return resp.GetOrder(), nil
}`,
      },
      {
        type: "steps",
        title: "Worked flow: CreateOrder",
        items: [
          "The generated client serializes CreateOrderRequest and sends metadata and a caller-owned deadline over HTTP/2.",
          "Server interceptors authenticate, authorize, trace, recover, and record metrics before invoking the generated handler.",
          "The handler validates transport shape and maps protobuf DTOs to a domain command.",
          "The application service atomically applies the idempotency key and persists the order.",
          "Expected domain errors become canonical codes; the client decides whether that code and method policy permit retry.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes and edge cases",
        body: "A DeadlineExceeded result does not prove the server did nothing; the response may have been lost after commit. Require idempotency for retried writes. Configure message size limits and avoid unbounded repeated fields. Slow stream consumers trigger HTTP/2 flow control and can hold resources indefinitely, so set application idle policies and bounded queues. Preserve unknown fields when proxying if required by your protobuf runtime. Use keepalive carefully: aggressive pings can cause servers or load balancers to disconnect clients. Expose the standard health service, drain on shutdown, and use TLS plus workload identity for cross-service calls.",
      },
      {
        type: "tradeoff",
        title: "REST, unary gRPC, or streaming gRPC?",
        choices: [
          {
            label: "REST/JSON",
            pros: ["Broad browser and tooling support", "Human-readable and cache-friendly"],
            cons: ["Weaker generated contract by default", "Streaming conventions vary"],
            when: "Use for public APIs, browser clients, and resource-oriented integration.",
          },
          {
            label: "Unary gRPC",
            pros: ["Typed multi-language clients", "Compact payloads and standard status model"],
            cons: ["More build tooling", "Browser use needs a bridge"],
            when: "Use for controlled service-to-service calls and native clients.",
          },
          {
            label: "Streaming gRPC",
            pros: ["Built-in bidirectional flow", "Efficient ordered incremental delivery"],
            cons: ["Harder load balancing and lifecycle management", "Long-lived resource cost"],
            when: "Use when incremental data or interactive streams materially improve the protocol.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would treat the proto as a long-lived compatibility contract and keep generated types at the transport boundary.",
        beats: [
          "Choose unary or streaming from the interaction, not from fashion.",
          "Use dedicated messages, stable field numbers, reserved deletions, and explicit presence.",
          "Translate domain errors to canonical codes and propagate caller deadlines.",
          "Retry only safe methods, accounting for ambiguous commit and idempotency keys.",
          "Add auth, tracing, metrics, size limits, health checks, TLS, and graceful stream draining.",
        ],
        closing: "gRPC is strongest when both sides can adopt its contract and operational model.",
      },
    ],
    quiz: [
      {
        id: "grpc-1",
        prompt: "What should happen to a removed protobuf field number?",
        options: ["Reuse it immediately", "Reserve it", "Change it to a method number", "Set it to zero"],
        answerIndex: 1,
        explanation: "Reserving removed numbers prevents future fields from being misread by older data or clients.",
      },
      {
        id: "grpc-2",
        prompt: "Why is retrying CreateOrder after DeadlineExceeded risky?",
        options: ["Deadlines disable protobuf", "The server may have committed even though the response was not received", "HTTP/2 forbids retries", "The request is always canceled before sending"],
        answerIndex: 1,
        explanation: "Transport ambiguity means the operation needs an idempotency strategy.",
      },
      {
        id: "grpc-3",
        prompt: "Where should generated protobuf types usually live?",
        options: ["Throughout the domain", "At the transport boundary with mapping", "Only in the database", "Inside log messages"],
        answerIndex: 1,
        explanation: "Mapping keeps wire compatibility concerns separate from domain design.",
      },
      {
        id: "grpc-4",
        prompt: "What context should a server stream observe?",
        options: ["context.Background only", "The stream context", "A nil context", "A package-global context"],
        answerIndex: 1,
        explanation: "The stream context carries client cancellation, deadlines, and metadata.",
      },
    ],
  },
  {
    slug: "websockets-realtime-go",
    track: "web",
    title: "WebSockets and Real-Time Go",
    subtitle: "Own connection lifecycles, backpressure, heartbeats, and horizontal fan-out.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["websocket", "realtime", "concurrency", "backpressure"],
    prerequisites: ["goroutines and channels", "HTTP upgrade", "context"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Model a WebSocket connection as one reader, one writer, and bounded queues.",
          "Design a hub API that serializes membership and fan-out state.",
          "Implement heartbeat, deadlines, close handling, and slow-consumer policy.",
          "Scale rooms across instances while preserving ordering and reconnect semantics.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Is delivery best-effort, at-least-once, or resumable from a sequence?",
          "How many concurrent connections, rooms, and messages per second?",
          "Must order be global, per room, or per sender?",
          "What should happen to slow or disconnected clients?",
        ],
        model: [
          "The connection object is owned by one read pump and one write pump.",
          "A room hub owns membership; bounded channels make overload explicit.",
          "Durable events and ephemeral presence have different storage and replay needs.",
        ],
        pitfalls: [
          "Concurrent writes to one connection.",
          "Unbounded per-client queues or one slow socket blocking a hub.",
          "Assuming TCP liveness without ping/pong and deadlines.",
        ],
      },
      {
        type: "prose",
        title: "Real-time means lifecycle management",
        body: "After an HTTP upgrade, the server owns a long-lived stateful connection. That changes deployment, load balancing, memory budgeting, and failure semantics. A useful contract includes message envelopes with type, ID, room, sequence, and payload; client acknowledgements only when the product needs delivery confirmation. Presence and typing indicators can be lossy. Chat messages may require durable persistence and replay. Define ordering scope explicitly—per-room ordering can be achieved by routing a room through one logical partition, while global order is expensive and rarely meaningful.",
      },
      {
        type: "code",
        title: "Hub API with one state-owning goroutine",
        language: "go",
        code: `type Envelope struct {
	Type     string          ` + "`json:\"type\"`" + `
	RoomID   string          ` + "`json:\"room_id\"`" + `
	Sequence int64           ` + "`json:\"sequence\"`" + `
	Payload  json.RawMessage ` + "`json:\"payload\"`" + `
}

type Client struct {
	id     string
	roomID string
	conn   *websocket.Conn
	send   chan Envelope
}

type Hub struct {
	join      chan *Client
	leave     chan *Client
	publish   chan Envelope
	byRoom    map[string]map[*Client]struct{}
}

func (h *Hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case c := <-h.join:
			if h.byRoom[c.roomID] == nil {
				h.byRoom[c.roomID] = make(map[*Client]struct{})
			}
			h.byRoom[c.roomID][c] = struct{}{}
		case c := <-h.leave:
			h.remove(c)
		case msg := <-h.publish:
			for c := range h.byRoom[msg.RoomID] {
				select {
				case c.send <- msg:
				default:
					h.remove(c)
				}
			}
		}
	}
}`,
      },
      {
        type: "code",
        title: "Single writer with batching and heartbeat",
        language: "go",
        code: `const (
	writeWait = 10 * time.Second
	pongWait  = 60 * time.Second
	pingEvery = 50 * time.Second
)

func (c *Client) writePump(ctx context.Context) {
	ticker := time.NewTicker(pingEvery)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case <-ctx.Done():
			_ = c.conn.WriteControl(websocket.CloseMessage, nil, time.Now().Add(writeWait))
			return
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}
			if err := c.conn.WriteJSON(msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}`,
      },
      {
        type: "code",
        title: "Reader limits, pong deadline, and publish boundary",
        language: "go",
        code: `type Publisher interface {
	Publish(ctx context.Context, roomID, userID string, payload json.RawMessage) error
}

func (c *Client) readPump(ctx context.Context, hub *Hub, pub Publisher, userID string) {
	defer func() { hub.leave <- c; c.conn.Close() }()
	c.conn.SetReadLimit(64 << 10)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		var in struct {
			Type    string          ` + "`json:\"type\"`" + `
			Payload json.RawMessage ` + "`json:\"payload\"`" + `
		}
		if err := c.conn.ReadJSON(&in); err != nil {
			return
		}
		if in.Type != "chat.send" || len(in.Payload) == 0 {
			continue
		}
		if err := pub.Publish(ctx, c.roomID, userID, in.Payload); err != nil {
			return
		}
	}
}`,
      },
      {
        type: "steps",
        title: "Worked flow: send and reconnect",
        items: [
          "An authenticated HTTP request upgrades only after checking Origin and room membership.",
          "The client joins a room; read and write pumps start with the connection as their shared lifecycle.",
          "A chat.send frame is validated, persisted with a per-room sequence, and published to that room's broker partition.",
          "Each instance receives the event and offers it to bounded client queues; a writer serializes frames.",
          "After disconnect, the client reconnects with its last sequence and fetches durable missed messages before resuming live delivery.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, edge cases, and concurrency",
        body: "Authenticate before upgrade or immediately close with a policy code; periodically re-evaluate long-lived authorization when membership changes. Check Origin because browsers attach cookies during WebSocket handshakes and ordinary CORS middleware does not protect upgraded traffic. Limit frame and decompressed message sizes. A send that succeeds to the kernel is not proof the peer processed it. Network partitions create half-open sockets, handled by ping/pong deadlines. During shutdown stop upgrades, send close frames, allow a drain interval, then cancel pumps. Across instances, expect duplicates from at-least-once brokers and deduplicate by event ID where effects matter.",
      },
      {
        type: "tradeoff",
        title: "Slow-consumer policy",
        choices: [
          {
            label: "Disconnect slow clients",
            pros: ["Bounds memory", "Protects room latency and hub health"],
            cons: ["Client must reconnect and replay", "Can punish temporarily slow networks"],
            when: "Use for durable streams with sequence-based catch-up.",
          },
          {
            label: "Drop selected messages",
            pros: ["Connection remains alive", "Good for ephemeral presence or telemetry"],
            cons: ["Client sees gaps", "Unsafe for durable business events"],
            when: "Use when message types are explicitly lossy and latest-state wins.",
          },
          {
            label: "Apply upstream backpressure",
            pros: ["Preserves every message", "Makes overload visible to producers"],
            cons: ["One consumer can affect others", "Can spread latency through the system"],
            when: "Use only with isolated streams or strong delivery requirements and bounded deadlines.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would begin with delivery, ordering, reconnect, and scale requirements because they determine whether WebSockets alone are sufficient.",
        beats: [
          "Give each connection exactly one reader and one writer.",
          "Serialize room membership in a hub and bound every queue.",
          "Separate durable message persistence from lossy presence updates.",
          "Use ping/pong, deadlines, frame limits, Origin checks, and explicit close handling.",
          "For multiple instances, partition room events through a broker and resume from sequence numbers.",
        ],
        closing: "The protocol is production-ready only when slow clients, reconnects, deploys, and partial failures have defined behavior.",
      },
    ],
    quiz: [
      {
        id: "ws-1",
        prompt: "Why should one goroutine own connection writes?",
        options: ["To preserve the WebSocket library's single-writer requirement", "Because reads use UDP", "To remove all buffering", "Because JSON is not concurrent"],
        answerIndex: 0,
        explanation: "Serializing writes avoids frame corruption and unsupported concurrent writer use.",
      },
      {
        id: "ws-2",
        prompt: "What is suitable to drop under backpressure?",
        options: ["Payment confirmations", "Ephemeral typing indicators", "Committed chat history without replay", "Authorization revocations"],
        answerIndex: 1,
        explanation: "Typing presence is naturally lossy; durable messages need stronger handling.",
      },
      {
        id: "ws-3",
        prompt: "Why check Origin on a cookie-authenticated upgrade?",
        options: ["CORS automatically blocks all upgrades", "To mitigate cross-site WebSocket hijacking", "To enable gzip", "To choose a TCP port"],
        answerIndex: 1,
        explanation: "Browsers can include cookies on cross-site handshakes, so the server must validate allowed origins.",
      },
      {
        id: "ws-4",
        prompt: "What enables reliable catch-up after reconnect?",
        options: ["A larger ping interval", "Durable events with monotonic scope-specific sequences", "A global mutex in the browser", "Only close frames"],
        answerIndex: 1,
        explanation: "The client can request events after its last observed sequence.",
      },
    ],
  },
  {
    slug: "cors-security-headers",
    track: "web",
    title: "CORS, CSRF, and Security Headers",
    subtitle: "Define browser trust boundaries instead of copying permissive header snippets.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["cors", "security", "csrf", "headers"],
    prerequisites: ["HTTP headers", "browser origins", "cookie basics"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Explain origin, simple requests, preflight, credentials, and cache variation.",
          "Implement an exact origin allowlist and correct OPTIONS behavior.",
          "Distinguish CORS response-read policy from CSRF and server-side authorization.",
          "Apply security headers appropriate to APIs and HTML applications.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which exact browser origins call the service in each environment?",
          "Are credentials cookies, Authorization headers, or both?",
          "Does the service return JSON only or also HTML and scripts?",
          "Which methods and custom headers does the frontend actually need?",
        ],
        model: [
          "Origin is scheme + host + port; paths do not create origins.",
          "CORS tells browsers whether JavaScript may read a cross-origin response.",
          "CSRF prevents an attacker from causing authenticated state changes.",
        ],
        pitfalls: [
          "Reflecting any Origin while allowing credentials.",
          "Protecting only preflight and forgetting simple credentialed requests.",
          "Using CORS as authentication or assuming non-browser clients obey it.",
        ],
      },
      {
        type: "prose",
        title: "CORS is a browser response-sharing protocol",
        body: "The same-origin policy restricts browser scripts. A cross-origin request may still reach the server; CORS controls whether browser JavaScript can expose the response. Simple requests can be sent without preflight, which is why CORS is not CSRF protection. A non-simple method, content type, or header prompts an OPTIONS request containing the intended method and header names. The server must validate the requesting Origin and answer only the capabilities needed. Credentialed responses require an explicit origin, Access-Control-Allow-Credentials: true, and Vary: Origin so shared caches do not serve one origin's policy to another.",
      },
      {
        type: "code",
        title: "Exact allowlist CORS middleware",
        language: "go",
        code: `type OriginPolicy interface {
	Allowed(origin string) bool
}

func CORS(policy OriginPolicy, methods, headers []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}
			w.Header().Add("Vary", "Origin")
			w.Header().Add("Vary", "Access-Control-Request-Method")
			w.Header().Add("Vary", "Access-Control-Request-Headers")
			if !policy.Allowed(origin) {
				writeProblem(w, http.StatusForbidden, "origin-denied", "origin is not allowed")
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Expose-Headers", "ETag, X-Request-ID")
			if r.Method == http.MethodOptions {
				w.Header().Set("Access-Control-Allow-Methods", strings.Join(methods, ", "))
				w.Header().Set("Access-Control-Allow-Headers", strings.Join(headers, ", "))
				w.Header().Set("Access-Control-Max-Age", "600")
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}`,
      },
      {
        type: "code",
        title: "Security headers with route-specific CSP",
        language: "go",
        code: `type HeaderPolicy struct {
	HTML bool
}

func SecurityHeaders(policy HeaderPolicy) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
			h.Set("Cross-Origin-Opener-Policy", "same-origin")
			if policy.HTML {
				h.Set("Content-Security-Policy",
					"default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
			}
			next.ServeHTTP(w, r)
		})
	}
}

// Set HSTS only at an HTTPS edge, after confirming every subdomain supports HTTPS.
func setHSTS(w http.ResponseWriter) {
	w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
}`,
      },
      {
        type: "code",
        title: "Double-submit CSRF validation",
        language: "go",
        code: `func RequireCSRF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		cookie, err := r.Cookie("__Host-csrf")
		header := r.Header.Get("X-CSRF-Token")
		if err != nil || header == "" ||
			subtle.ConstantTimeCompare([]byte(cookie.Value), []byte(header)) != 1 {
			writeProblem(w, http.StatusForbidden, "csrf", "CSRF token is invalid")
			return
		}
		if origin := r.Header.Get("Origin"); origin != "" && origin != "https://app.example.com" {
			writeProblem(w, http.StatusForbidden, "origin", "origin is invalid")
			return
		}
		next.ServeHTTP(w, r)
	})
}`,
      },
      {
        type: "steps",
        title: "Worked flow: credentialed cross-origin PATCH",
        items: [
          "The browser sends OPTIONS with Origin, Access-Control-Request-Method: PATCH, and requested header names.",
          "CORS middleware checks the exact origin and requested capability, then returns 204 and cache-safe Vary headers.",
          "The browser sends PATCH with cookies and X-CSRF-Token.",
          "CORS runs before authentication so even a 401 can expose the permitted response; CSRF validates before mutation.",
          "The actual response repeats the explicit allowed origin and credentials header so the browser can reveal it to the app.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes and edge cases",
        body: "Normalize configured origins at startup, but do not perform suffix checks such as HasSuffix(host, example.com), which accepts attackerexample.com. Validate URL scheme, host, and port. Preflight caches are browser-specific, so do not depend on very long max-age values during policy rollout. CDN caches need Vary: Origin or separate cache keys. CSP applies to documents, not as a generic API defense; start with report-only and remove inline scripts before enforcement. HSTS can lock users out if HTTPS is not universal, especially with includeSubDomains or preload. Frame-ancestors belongs in CSP and supersedes older X-Frame-Options in modern browsers.",
      },
      {
        type: "tradeoff",
        title: "Origin policy choices",
        choices: [
          {
            label: "Exact static allowlist",
            pros: ["Auditable", "No runtime tenant lookup", "Easy cache behavior"],
            cons: ["Configuration changes for new origins", "Less suited to custom domains"],
            when: "Use for first-party frontends with known deployment origins.",
          },
          {
            label: "Validated tenant custom domains",
            pros: ["Supports white-label products", "Can evolve without deploys"],
            cons: ["Needs domain ownership verification and fast lookup", "Cache invalidation is harder"],
            when: "Use only after securely binding each domain to a tenant.",
          },
          {
            label: "Wildcard without credentials",
            pros: ["Simple for truly public read APIs", "Good cacheability"],
            cons: ["Cannot be used for credentialed browser responses", "Does not authorize callers"],
            when: "Use for public, non-sensitive resources intended for any website.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would list exact browser origins and credential modes, then implement the minimum cross-origin capability.",
        beats: [
          "Explain that Origin is scheme, host, and port and that CORS is browser-enforced.",
          "Handle simple requests and preflight, emit Vary, and never reflect arbitrary credentialed origins.",
          "Keep authentication and authorization independent because non-browser clients ignore CORS.",
          "Add CSRF defense for cookie-authenticated unsafe methods.",
          "Apply CSP to HTML, nosniff and referrer policy broadly, and HSTS only after HTTPS readiness.",
        ],
        closing: "The policy should be narrow, testable, cache-correct, and based on real client origins.",
      },
    ],
    quiz: [
      {
        id: "cors-1",
        prompt: "Does CORS stop a simple cross-origin POST from reaching the server?",
        options: ["Always", "No; it mainly controls whether browser JavaScript can read the response", "Only over HTTPS", "Only with cookies disabled"],
        answerIndex: 1,
        explanation: "Simple requests can be sent without preflight, so state-changing endpoints still need CSRF protection.",
      },
      {
        id: "cors-2",
        prompt: "Why add Vary: Origin?",
        options: ["To compress JSON", "So caches distinguish responses with different origin policy", "To enable TLS", "To avoid authentication"],
        answerIndex: 1,
        explanation: "Without Vary, a shared cache can reuse an allow-origin response for the wrong requesting origin.",
      },
      {
        id: "cors-3",
        prompt: "Which combination is invalid for credentialed CORS?",
        options: ["Explicit origin and credentials true", "Wildcard origin and credentials true", "204 preflight", "Vary: Origin"],
        answerIndex: 1,
        explanation: "Credentialed responses require a specific allowed origin rather than wildcard.",
      },
      {
        id: "cors-4",
        prompt: "Where does CSP provide its main protection?",
        options: ["Database queries", "Browser-rendered documents and resource loading", "gRPC field numbers", "TCP handshakes"],
        answerIndex: 1,
        explanation: "CSP constrains document resource execution and embedding; it is not an API authorization mechanism.",
      },
    ],
  },
  {
    slug: "deploying-go-services",
    track: "web",
    title: "Deploying Go Services",
    subtitle: "Build reproducibly, probe honestly, drain safely, and operate under limits.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["deployment", "docker", "observability", "reliability"],
    prerequisites: ["Go modules", "HTTP servers", "containers"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Produce small reproducible images with explicit runtime assumptions.",
          "Configure server timeouts, resource limits, and dependency initialization.",
          "Separate liveness, readiness, startup, and diagnostic signals.",
          "Perform graceful rollout and shutdown without dropping avoidable work.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Where does TLS terminate, and how are secrets and configuration supplied?",
          "What is the maximum request duration and shutdown grace period?",
          "Which dependencies are required for readiness versus optional features?",
          "What rollout, rollback, migration, and observability facilities exist?",
        ],
        model: [
          "Build artifact, runtime image, and deployment configuration are separate concerns.",
          "Readiness controls new traffic; graceful shutdown drains traffic already accepted.",
          "Liveness detects a stuck process, not temporary dependency failure.",
        ],
        pitfalls: [
          "Using default HTTP timeouts or treating ListenAndServe errors as success.",
          "Putting database checks in liveness and causing restart storms.",
          "Running destructive schema migration independently on every replica.",
        ],
      },
      {
        type: "prose",
        title: "A binary still has a runtime contract",
        body: "CGO_ENABLED=0 often creates a statically linked binary, but applications may still need CA certificates, time-zone data, user records, and writable temporary space. Distroless images supply a minimal runtime; scratch supplies nothing. Build with pinned module inputs and record version metadata. Run as non-root, use a read-only root filesystem where practical, and keep configuration in environment variables or mounted files with startup validation. Container memory limits matter to Go's garbage collector; configure an appropriate memory limit and leave headroom for non-heap memory.",
      },
      {
        type: "code",
        title: "Reproducible multi-stage image",
        language: "bash",
        code: `FROM golang:1.24-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY . .
ARG VERSION=dev
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build \
    -trimpath -ldflags="-s -w -X main.version=$VERSION" \
    -o /out/service ./cmd/service

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/service /service
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/service"]`,
      },
      {
        type: "code",
        title: "Server lifecycle and graceful drain",
        language: "go",
        code: `func run(ctx context.Context, app http.Handler, log *slog.Logger) error {
	srv := &http.Server{
		Addr:              ":8080",
		Handler:           app,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       90 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}
	errs := make(chan error, 1)
	go func() {
		errs <- srv.ListenAndServe()
	}()

	select {
	case err := <-errs:
		if !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("serve: %w", err)
		}
		return nil
	case <-ctx.Done():
	}

	drain, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := srv.Shutdown(drain); err != nil {
		_ = srv.Close()
		return fmt.Errorf("shutdown: %w", err)
	}
	return nil
}`,
      },
      {
        type: "code",
        title: "Cheap liveness and meaningful readiness",
        language: "go",
        code: `type Readiness interface {
	Ready(ctx context.Context) error
}

func healthRoutes(ready Readiness, shuttingDown *atomic.Bool) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /livez", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
		if shuttingDown.Load() {
			http.Error(w, "draining", http.StatusServiceUnavailable)
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 250*time.Millisecond)
		defer cancel()
		if err := ready.Ready(ctx); err != nil {
			http.Error(w, "not ready", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
	return mux
}`,
      },
      {
        type: "steps",
        title: "Worked flow: rolling deployment",
        items: [
          "A new replica starts, validates configuration, opens bounded dependency pools, and remains unready.",
          "After initialization and required migration compatibility checks, readiness becomes 204 and the load balancer adds it.",
          "During replacement, the old replica marks itself unready; the platform stops routing new traffic after propagation.",
          "SIGTERM cancels the root context, background consumers stop fetching, and the HTTP server drains in-flight requests.",
          "At the grace deadline remaining connections are closed; exit status and shutdown metrics reveal forced termination.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes and operational edge cases",
        body: "Readiness checks that query every dependency on every probe can amplify an outage; cache checks briefly and include only dependencies needed to serve. Server WriteTimeout can terminate legitimate streaming responses, so use route-appropriate servers or streaming policies. Shutdown does not automatically wait for arbitrary goroutines; own them with errgroup and close queues in producer-before-consumer order. DNS and connection pools retain old endpoints, requiring sane lifetimes. A backwards-incompatible schema migration can break mixed-version rollouts; use expand, deploy, migrate, then contract. Record build version, commit, Go runtime, request RED metrics, traces, structured logs, and saturation.",
      },
      {
        type: "tradeoff",
        title: "Runtime image choice",
        choices: [
          {
            label: "Scratch",
            pros: ["Smallest surface", "No shell or package manager"],
            cons: ["Must copy certificates and data explicitly", "Harder emergency diagnosis"],
            when: "Use for truly static binaries with a fully understood runtime data set.",
          },
          {
            label: "Distroless",
            pros: ["Minimal but includes common runtime assets", "Non-root variants"],
            cons: ["Still lacks interactive tooling", "Image provenance must be managed"],
            when: "Use as a strong default for production Go services.",
          },
          {
            label: "Slim distribution",
            pros: ["Familiar diagnostics and compatibility", "Easy native library support"],
            cons: ["Larger attack surface and patch burden", "More mutable tooling"],
            when: "Use when CGO, operational tooling, or runtime packages are genuinely required.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would define the runtime and rollout contract before writing the Dockerfile.",
        beats: [
          "Build a pinned, reproducible binary and select an image that includes required certificates and data.",
          "Run non-root with validated config, bounded resources, and explicit HTTP timeouts.",
          "Keep liveness local and cheap; make readiness represent ability to accept traffic.",
          "On termination become unready, stop producers, drain requests and consumers, then force-close at a deadline.",
          "Use compatible migrations, progressive rollout, rollback signals, logs, metrics, traces, and build metadata.",
        ],
        closing: "A successful deployment is measured by safe lifecycle behavior, not merely by a container that starts.",
      },
    ],
    quiz: [
      {
        id: "deploy-1",
        prompt: "Why should a database outage usually not fail liveness?",
        options: ["Databases never fail", "Restarting healthy processes can amplify the dependency outage", "Liveness is only for TLS", "It makes images larger"],
        answerIndex: 1,
        explanation: "Liveness should detect a broken process; readiness removes replicas that temporarily cannot serve.",
      },
      {
        id: "deploy-2",
        prompt: "What does Server.Shutdown do?",
        options: ["Deletes the binary", "Stops new accepts and waits for active HTTP work until context expiry", "Kills every goroutine instantly", "Runs migrations"],
        answerIndex: 1,
        explanation: "Other background goroutines still need explicit lifecycle ownership.",
      },
      {
        id: "deploy-3",
        prompt: "Why use expand-and-contract schema migration?",
        options: ["To support mixed application versions during rollout", "To disable indexes", "To avoid backups", "To bypass tests"],
        answerIndex: 0,
        explanation: "Compatible intermediate schemas let old and new replicas run concurrently.",
      },
      {
        id: "deploy-4",
        prompt: "What can a scratch image lack even for a static binary?",
        options: ["Machine code", "CA certificates and time-zone data", "Goroutines", "TCP support in the kernel"],
        answerIndex: 1,
        explanation: "Static linking does not embed all runtime data files an application may use.",
      },
    ],
  },
  {
    slug: "pagination-filtering-idempotency",
    track: "web",
    title: "Pagination, Filtering, and Idempotency",
    subtitle: "Keep list APIs stable under change and write APIs safe under retries.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["pagination", "filtering", "idempotency", "api"],
    prerequisites: ["REST semantics", "SQL ordering", "transactions"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Choose offset or cursor pagination from consistency and access requirements.",
          "Define deterministic sort/filter contracts and safe query parsing.",
          "Build opaque signed cursors without exposing storage details.",
          "Implement idempotent writes with atomic ownership, replay, and mismatch detection.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Must users jump to a page number or mostly move next/previous?",
          "How frequently are rows inserted, deleted, or re-ranked while browsing?",
          "Which fields are filterable and sortable, and what indexes support them?",
          "Which writes can clients retry after timeout, and for how long?",
        ],
        model: [
          "Pagination is part of the consistency contract, not only a LIMIT clause.",
          "A cursor captures the last ordering tuple and query identity.",
          "An idempotency record binds caller, key, operation, request hash, and outcome.",
        ],
        pitfalls: [
          "Sorting by a non-unique field without a stable tie-breaker.",
          "Allowing arbitrary filter columns or sort expressions into SQL.",
          "Checking an idempotency key and performing the write in separate races.",
        ],
      },
      {
        type: "prose",
        title: "Stable list traversal",
        body: "Offset pagination is easy and supports page numbers, but large offsets become expensive and concurrent inserts shift rows, producing duplicates or skips. Keyset pagination asks for rows after the last observed ordering tuple. For ORDER BY created_at DESC, id DESC, the next predicate is (created_at, id) < (?, ?). The unique ID tie-breaker is mandatory. A cursor should be opaque and versioned, carry the tuple and normalized filter identity, and be authenticated to prevent tampering. Page size needs a server maximum. Return next_cursor only when more data exists, commonly by fetching limit+1 rows.",
      },
      {
        type: "code",
        title: "Typed list query and repository contract",
        language: "go",
        code: `type OrderFilter struct {
	CustomerID string
	States     []OrderState
	CreatedGTE *time.Time
}

type OrderCursor struct {
	Version   int       ` + "`json:\"v\"`" + `
	CreatedAt time.Time ` + "`json:\"created_at\"`" + `
	ID        string    ` + "`json:\"id\"`" + `
	QueryHash string    ` + "`json:\"query_hash\"`" + `
}

type ListOrdersQuery struct {
	Filter OrderFilter
	Limit  int
	After  *OrderCursor
}

type OrderPage struct {
	Orders     []Order
	NextCursor string
}

type OrderLister interface {
	List(ctx context.Context, query ListOrdersQuery) ([]Order, error)
}

func normalizeLimit(raw string) (int, error) {
	if raw == "" {
		return 50, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 {
		return 0, fmt.Errorf("limit must be a positive integer")
	}
	return min(n, 200), nil
}`,
      },
      {
        type: "code",
        title: "Authenticated opaque cursor",
        language: "go",
        code: `type CursorCodec struct{ key []byte }

func (c CursorCodec) Encode(cursor OrderCursor) (string, error) {
	body, err := json.Marshal(cursor)
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, c.key)
	_, _ = mac.Write(body)
	sig := mac.Sum(nil)
	return base64.RawURLEncoding.EncodeToString(body) + "." +
		base64.RawURLEncoding.EncodeToString(sig), nil
}

func (c CursorCodec) Decode(raw, expectedQueryHash string) (OrderCursor, error) {
	parts := strings.Split(raw, ".")
	if len(parts) != 2 {
		return OrderCursor{}, ErrInvalidCursor
	}
	body, e1 := base64.RawURLEncoding.DecodeString(parts[0])
	sig, e2 := base64.RawURLEncoding.DecodeString(parts[1])
	mac := hmac.New(sha256.New, c.key)
	_, _ = mac.Write(body)
	if e1 != nil || e2 != nil || !hmac.Equal(sig, mac.Sum(nil)) {
		return OrderCursor{}, ErrInvalidCursor
	}
	var out OrderCursor
	if json.Unmarshal(body, &out) != nil || out.Version != 1 || out.QueryHash != expectedQueryHash {
		return OrderCursor{}, ErrInvalidCursor
	}
	return out, nil
}`,
      },
      {
        type: "code",
        title: "Atomic idempotent command boundary",
        language: "go",
        code: `type StoredResponse struct {
	Status int
	Body   []byte
}

type IdempotencyStore interface {
	Begin(ctx context.Context, scope, key, requestHash string, ttl time.Duration) (lease string, prior *StoredResponse, err error)
	Complete(ctx context.Context, scope, key, lease string, response StoredResponse) error
	Abort(ctx context.Context, scope, key, lease string) error
}

func (h *Handler) createPayment(w http.ResponseWriter, r *http.Request) {
	key := r.Header.Get("Idempotency-Key")
	hash, body, err := hashRequest(r, 1<<20)
	if err != nil || key == "" {
		writeProblem(w, 400, "invalid-request", "idempotency key and valid body required")
		return
	}
	lease, prior, err := h.keys.Begin(r.Context(), tenantID(r.Context()), key, hash, 24*time.Hour)
	if prior != nil {
		writeBytes(w, prior.Status, prior.Body)
		return
	}
	if err != nil {
		h.writeIdempotencyError(w, err)
		return
	}
	response, err := h.payments.Create(r.Context(), body)
	if err != nil {
		_ = h.keys.Abort(r.Context(), tenantID(r.Context()), key, lease)
		h.writePaymentError(w, err)
		return
	}
	_ = h.keys.Complete(r.Context(), tenantID(r.Context()), key, lease, response)
	writeBytes(w, response.Status, response.Body)
}`,
      },
      {
        type: "steps",
        title: "Worked flows",
        items: [
          "List: normalize filters and sort, hash that query identity, verify the cursor, and request limit+1 using the tuple predicate.",
          "List: return at most limit items and encode the final item's tuple as next_cursor only when another row exists.",
          "Write: scope the idempotency key to tenant and operation, canonicalize and hash the request, then atomically claim the key.",
          "Write: a completed matching record replays the exact status/body; a different hash returns 409; in-progress returns 409 or waits briefly.",
          "Write: persist business result and idempotency outcome in one transaction or use a recoverable operation record to close the crash gap.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes and edge cases",
        body: "Cursor traversal observes a moving dataset; it prevents ordering drift but is not a snapshot unless backed by snapshot semantics. Mutable sort keys can move an item between pages; prefer immutable creation tuples or document behavior. Include filters, sort, tenant, and cursor version in the query hash. For idempotency, replay error responses only when they represent a completed business decision; transient 500s usually should be retryable. A crash after charging but before Complete is the critical gap—solve it with a shared transaction, provider idempotency key, or durable operation state. Cap key length and entropy, encrypt sensitive replay bodies, and expire records only after the retry horizon.",
      },
      {
        type: "tradeoff",
        title: "Pagination strategy",
        choices: [
          {
            label: "Offset/limit",
            pros: ["Simple", "Supports page-number jumps and total-count UX"],
            cons: ["Drifts under concurrent writes", "Large offsets can scan heavily"],
            when: "Use for small, mostly static admin datasets where page jumps matter.",
          },
          {
            label: "Keyset cursor",
            pros: ["Stable traversal", "Efficient index seek at depth"],
            cons: ["No arbitrary page jump", "Sort and filter must be encoded carefully"],
            when: "Use for feeds and large frequently changing collections.",
          },
          {
            label: "Snapshot cursor",
            pros: ["Consistent multi-page view", "Avoids movement during traversal"],
            cons: ["Storage/session cost", "Snapshot expiry and cleanup complexity"],
            when: "Use for exports or audits that require a fixed dataset.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would separate stable reads from safe write retries, but make both contracts explicit at the API edge.",
        beats: [
          "For changing large lists, order by a unique tuple and use an opaque authenticated keyset cursor.",
          "Allowlist filters and sorts, enforce page caps, fetch one extra row, and bind cursors to the query.",
          "For retryable writes, scope a key, hash a canonical request, and claim it atomically.",
          "Replay exact completed outcomes, reject mismatches, and define in-progress behavior.",
          "Close the commit-record crash gap with a transaction, operation log, or downstream idempotency.",
        ],
        closing: "Clients can then retry and traverse data without guessing what the server did.",
      },
    ],
    quiz: [
      {
        id: "page-1",
        prompt: "Why add ID after created_at in the ordering?",
        options: ["To encrypt the cursor", "To make the ordering total and deterministic", "To calculate totals", "To avoid indexes"],
        answerIndex: 1,
        explanation: "Many rows can share a timestamp; a unique tie-breaker gives every row a stable position.",
      },
      {
        id: "page-2",
        prompt: "What should an idempotency mismatch return?",
        options: ["Replay the old response anyway", "A conflict because the same scoped key represents different input", "Always create again", "A redirect"],
        answerIndex: 1,
        explanation: "Binding the key to the request prevents accidental reuse for another operation.",
      },
      {
        id: "page-3",
        prompt: "Why authenticate a cursor?",
        options: ["To make SQL faster", "To detect client tampering with position or query identity", "To replace TLS", "To create page totals"],
        answerIndex: 1,
        explanation: "An HMAC lets the server trust cursor fields it previously issued.",
      },
      {
        id: "page-4",
        prompt: "What is the dangerous idempotency crash window?",
        options: ["Before parsing headers", "After the business effect commits but before its replay record commits", "After returning a cached GET", "Before generating a request ID"],
        answerIndex: 1,
        explanation: "A retry cannot know the effect succeeded unless the operation and replay record are coordinated.",
      },
    ],
  },
  {
    slug: "validation-and-error-model",
    track: "web",
    title: "Validation and API Error Models",
    subtitle: "Validate at the right boundary and return errors clients can safely act on.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["validation", "errors", "api", "security"],
    prerequisites: ["JSON decoding", "Go errors", "REST basics"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate syntactic decoding, field validation, domain invariants, and storage constraints.",
          "Model expected errors with stable codes while preserving internal causes.",
          "Return field-level details without leaking implementation or sensitive values.",
          "Test error mappings as part of the public API contract.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which fields are required, optional, nullable, or mutually dependent?",
          "Should unknown fields be rejected for this client compatibility model?",
          "Which errors can clients fix, retry, or display?",
          "Is 400 versus 422 already standardized by the organization?",
        ],
        model: [
          "Decoder checks representation shape; validator checks DTO rules.",
          "Domain methods protect invariants regardless of transport.",
          "Database constraints are the final authority for concurrent uniqueness.",
        ],
        pitfalls: [
          "Returning err.Error from internal or database errors.",
          "Treating zero values as omitted in PATCH.",
          "Building client logic around human-readable error text.",
        ],
      },
      {
        type: "prose",
        title: "Validation has layers",
        body: "A malformed JSON token, unsupported media type, and oversized body are transport failures. A well-formed body with an invalid email or missing name is field validation. An order that cannot be canceled after shipment violates a domain invariant. A duplicate email found at commit is a storage-enforced conflict. Keeping layers distinct produces better tests and status mapping. Validate cheap structural rules first, then business rules that require state. Normalize cautiously: trimming a display name may be acceptable, while silently lowercasing a case-sensitive identifier changes meaning.",
      },
      {
        type: "code",
        title: "Strict single-document decoding",
        language: "go",
        code: `func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	if ct := r.Header.Get("Content-Type"); ct != "" {
		mediaType, _, err := mime.ParseMediaType(ct)
		if err != nil || mediaType != "application/json" {
			return apiError("unsupported-media-type", "Content-Type must be application/json")
		}
	}
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return apiError("invalid-json", classifyJSONError(err))
	}
	var extra any
	if err := dec.Decode(&extra); !errors.Is(err, io.EOF) {
		return apiError("invalid-json", "body must contain one JSON value")
	}
	return nil
}

type UpdateProfileRequest struct {
	DisplayName *string ` + "`json:\"display_name\"`" + `
	Timezone    *string ` + "`json:\"timezone\"`" + `
	Bio         *string ` + "`json:\"bio\"`" + `
}`,
      },
      {
        type: "code",
        title: "Structured violations and domain invariants",
        language: "go",
        code: `type Violation struct {
	Field   string ` + "`json:\"field\"`" + `
	Code    string ` + "`json:\"code\"`" + `
	Message string ` + "`json:\"message\"`" + `
}

func (r UpdateProfileRequest) Validate() []Violation {
	var out []Violation
	if r.DisplayName != nil {
		n := utf8.RuneCountInString(strings.TrimSpace(*r.DisplayName))
		if n < 2 || n > 80 {
			out = append(out, Violation{"display_name", "length", "must contain 2 to 80 characters"})
		}
	}
	if r.Timezone != nil {
		if _, err := time.LoadLocation(*r.Timezone); err != nil {
			out = append(out, Violation{"timezone", "unknown", "must be an IANA time zone"})
		}
	}
	return out
}

func (o *Order) Cancel(now time.Time) error {
	if o.State == Shipped || o.State == Delivered {
		return &DomainError{Code: "order_not_cancelable", Cause: ErrInvalidTransition}
	}
	if now.After(o.CancelUntil) {
		return &DomainError{Code: "cancel_window_closed", Cause: ErrInvalidTransition}
	}
	o.State = Canceled
	return nil
}`,
      },
      {
        type: "code",
        title: "Stable problem response with internal cause separation",
        language: "go",
        code: `type Problem struct {
	Type       string      ` + "`json:\"type\"`" + `
	Title      string      ` + "`json:\"title\"`" + `
	Status     int         ` + "`json:\"status\"`" + `
	Code       string      ` + "`json:\"code\"`" + `
	Detail     string      ` + "`json:\"detail,omitempty\"`" + `
	Instance   string      ` + "`json:\"instance,omitempty\"`" + `
	Violations []Violation ` + "`json:\"violations,omitempty\"`" + `
}

func writeApplicationError(w http.ResponseWriter, r *http.Request, err error, log *slog.Logger) {
	p := Problem{Type: "about:blank", Status: 500, Title: "Internal Server Error", Code: "internal"}
	var ve *ValidationError
	var de *DomainError
	switch {
	case errors.As(err, &ve):
		p.Status, p.Title, p.Code, p.Violations = 422, "Validation failed", "validation_failed", ve.Violations
	case errors.Is(err, ErrNotFound):
		p.Status, p.Title, p.Code = 404, "Resource not found", "not_found"
	case errors.Is(err, ErrConflict):
		p.Status, p.Title, p.Code = 409, "Conflict", "conflict"
	case errors.As(err, &de):
		p.Status, p.Title, p.Code = 409, "Operation rejected", de.Code
	default:
		log.ErrorContext(r.Context(), "unhandled request error", "error", err)
	}
	p.Instance = requestIDFrom(r.Context())
	writeJSON(w, p.Status, p)
}`,
      },
      {
        type: "steps",
        title: "Worked flow: PATCH /profile",
        items: [
          "Check media type, cap the body, reject unknown fields, and require exactly one JSON document.",
          "Pointers preserve omitted versus explicitly empty fields; DTO validation accumulates all safe field violations.",
          "The service loads the profile, calls domain update methods, and persists with an optimistic version.",
          "The handler maps validation to 422, stale version to 409, absence to 404, and unexpected errors to opaque 500.",
          "Logs retain wrapped causes and request ID; the response exposes only stable code, safe detail, and violations.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes and edge cases",
        body: "Regex is rarely enough for Unicode names, addresses, or email deliverability; validate only product requirements you can explain. Avoid catastrophic regexes and cap all inputs before expensive validation. Field paths for arrays need a documented syntax such as items[2].quantity. Localization belongs in clients keyed by stable codes, or in a negotiated presentation layer—not in code values. Do not reveal whether an email exists in password-reset responses. Preserve errors with %w for internal matching, but never turn wrapped error chains directly into public detail. Validation cannot replace authorization or transaction constraints.",
      },
      {
        type: "tradeoff",
        title: "400 or 422 for invalid fields?",
        choices: [
          {
            label: "400 for all client input errors",
            pros: ["Simple policy", "Widely understood"],
            cons: ["Does not distinguish malformed representation from semantic violations"],
            when: "Use when organizational consistency favors one broad category.",
          },
          {
            label: "400 syntax, 422 semantics",
            pros: ["More precise", "Clients can distinguish decoder from field errors"],
            cons: ["Requires a documented boundary", "Some APIs do not recognize the distinction"],
            when: "Use when clients benefit and the API consistently applies it.",
          },
          {
            label: "Domain-specific 409 for state conflicts",
            pros: ["Signals collision with current resource state", "Useful for retries or refresh"],
            cons: ["Can overlap conceptually with 422", "Needs stable domain codes"],
            when: "Use for stale versions, uniqueness, and invalid transitions caused by current state.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would make errors a versioned API contract and validate at the cheapest layer that has enough information.",
        beats: [
          "Decode one bounded document and decide an unknown-field policy.",
          "Use presence-aware DTOs and return accumulated field violations with stable codes.",
          "Keep invariants in domain methods and concurrency guarantees in storage constraints.",
          "Translate expected errors centrally; log wrapped internal causes but return safe details.",
          "Test status, code, field paths, content type, and redaction as contract behavior.",
        ],
        closing: "Clients receive actionable, stable errors while internals remain diagnosable and secure.",
      },
    ],
    quiz: [
      {
        id: "val-1",
        prompt: "Why use pointers in a PATCH request DTO?",
        options: ["To make JSON faster", "To distinguish omitted fields from explicit zero values", "To bypass validation", "To share mutable global state"],
        answerIndex: 1,
        explanation: "PATCH semantics require knowing whether the client mentioned a field.",
      },
      {
        id: "val-2",
        prompt: "Where should an order transition invariant live?",
        options: ["Only in JavaScript", "In the domain method used by every transport", "Only in an error writer", "In a CORS header"],
        answerIndex: 1,
        explanation: "Domain methods protect invariants regardless of HTTP, gRPC, or background callers.",
      },
      {
        id: "val-3",
        prompt: "What should client logic key on?",
        options: ["Exact English error text", "Stable machine-readable error codes", "Database driver messages", "Stack traces"],
        answerIndex: 1,
        explanation: "Human text changes and may be localized; stable codes are contract elements.",
      },
      {
        id: "val-4",
        prompt: "Why is a pre-insert uniqueness check insufficient?",
        options: ["It is too strict", "Concurrent requests can both pass before either inserts", "Go cannot query databases", "It always returns 500"],
        answerIndex: 1,
        explanation: "A unique storage constraint is required to close the race.",
      },
    ],
  },
  {
    slug: "openapi-and-versioning",
    track: "web",
    title: "OpenAPI and API Versioning",
    subtitle: "Turn HTTP behavior into an executable contract and evolve it compatibly.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["openapi", "versioning", "contracts", "api"],
    prerequisites: ["REST design", "JSON Schema", "CI basics"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Describe operations, schemas, errors, auth, and examples in OpenAPI.",
          "Choose design-first, code-first, or hybrid contract ownership deliberately.",
          "Detect breaking changes and evolve APIs additively where possible.",
          "Version only when semantics cannot remain compatible, with a migration plan.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Who consumes the contract: internal teams, SDKs, partners, or browsers?",
          "How long must old clients continue working?",
          "Which code or artifact is the source of truth?",
          "How are deprecation, compatibility review, and generated code enforced?",
        ],
        model: [
          "OpenAPI captures the wire contract, not every domain implementation detail.",
          "Compatibility includes syntax, semantics, defaults, and operational behavior.",
          "A version is a migration boundary, not a substitute for additive design.",
        ],
        pitfalls: [
          "Generating a schema but never checking runtime conformance.",
          "Removing enum values, changing defaults, or making optional fields required.",
          "Maintaining v1 and v2 indefinitely without ownership or sunset telemetry.",
        ],
      },
      {
        type: "prose",
        title: "An executable API contract",
        body: "A useful OpenAPI document names operations, parameters, security, request and response schemas, error shapes, examples, and pagination headers. It drives documentation, mock servers, contract tests, SDK generation, and compatibility checks. Design-first aligns consumers before code; code-first reduces duplicate declarations; a hybrid keeps a reviewed contract as the published artifact while generating server/client types and testing handlers against it. Generated validation does not replace business validation, and generated domain models often couple too much—map generated transport types to application commands.",
      },
      {
        type: "code",
        title: "Focused OpenAPI operation",
        language: "text",
        code: `openapi: 3.1.0
info:
  title: Projects API
  version: 1.4.0
paths:
  /v1/projects/{projectId}:
    get:
      operationId: getProject
      security:
        - bearerAuth: []
      parameters:
        - name: projectId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Project found
          headers:
            ETag: { schema: { type: string } }
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Project" }
        "404":
          description: Project is absent or invisible to the caller
          content:
            application/problem+json:
              schema: { $ref: "#/components/schemas/Problem" }
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
  schemas:
    Project:
      type: object
      required: [id, name, version]
      properties:
        id: { type: string, format: uuid }
        name: { type: string, minLength: 1, maxLength: 100 }
        version: { type: integer, format: int64 }`,
      },
      {
        type: "code",
        title: "Generated boundary, handwritten application",
        language: "go",
        code: `type ProjectApplication interface {
	Get(ctx context.Context, tenantID, projectID string) (Project, error)
}

type API struct {
	projects ProjectApplication
}

// GetProject satisfies the generated StrictServerInterface.
func (a *API) GetProject(ctx context.Context, req GetProjectRequestObject) (GetProjectResponseObject, error) {
	tenant, ok := tenantFrom(ctx)
	if !ok {
		return GetProject401ApplicationProblemPlusJSONResponse(problem("unauthenticated")), nil
	}
	p, err := a.projects.Get(ctx, tenant.ID, req.ProjectId.String())
	switch {
	case errors.Is(err, ErrNotFound):
		return GetProject404ApplicationProblemPlusJSONResponse(problem("not_found")), nil
	case err != nil:
		return nil, fmt.Errorf("get project: %w", err)
	default:
		tag := fmt.Sprintf("%q", p.Version)
		return GetProject200ApplicationJSONResponse{
			Body: Project{Id: uuid.MustParse(p.ID), Name: p.Name, Version: p.Version},
			Headers: GetProject200ResponseHeaders{ETag: tag},
		}, nil
	}
}`,
      },
      {
        type: "code",
        title: "Contract conformance in tests",
        language: "go",
        code: `func TestPublishedAPIConformance(t *testing.T) {
	spec, err := openapi.LoadFromFile("api/openapi.yaml")
	if err != nil {
		t.Fatal(err)
	}
	handler := newTestHandler(t)
	validator := middleware.OapiRequestValidatorWithOptions(spec,
		&middleware.Options{Options: openapi3filter.Options{
			AuthenticationFunc: func(context.Context, *openapi3filter.AuthenticationInput) error { return nil },
		}})

	req := httptest.NewRequest(http.MethodGet, "/v1/projects/not-a-uuid", nil)
	rec := httptest.NewRecorder()
	validator(handler).ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
	if got := rec.Header().Get("Content-Type"); !strings.HasPrefix(got, "application/problem+json") {
		t.Fatalf("unexpected content type %q", got)
	}
}`,
      },
      {
        type: "steps",
        title: "Worked flow: additive change and release",
        items: [
          "A proposal adds optional project.color with documented default behavior; consumer representatives review semantics.",
          "A compatibility tool compares the candidate contract to the last published artifact and confirms no required field or response was removed.",
          "Server types and SDKs regenerate; mappings and examples are updated rather than leaking generated structs into the domain.",
          "Contract tests validate requests and responses; provider tests run recorded consumer scenarios.",
          "The field deploys dark, telemetry confirms adoption, and only then may old behavior be considered for a future explicit version.",
        ],
      },
      {
        type: "prose",
        title: "Breaking changes and edge cases",
        body: "Adding an optional response field is syntactically compatible, but clients with strict unknown-field decoders may still fail; publish a tolerant-reader policy. Adding an enum value can break exhaustive client switches. Tightening a maximum, changing pagination order, altering money units, or turning a formerly retryable failure into a permanent one are semantic breaks even if the schema diff is green. Request changes are especially sensitive: making optional input required is breaking. Deprecation needs owner, replacement, telemetry by client version, documentation, and sunset communication. Never version only the documentation while routing both versions to incompatible behavior.",
      },
      {
        type: "tradeoff",
        title: "Version location",
        choices: [
          {
            label: "Path versioning (/v1)",
            pros: ["Visible and easy to route", "Works well with gateways and documentation"],
            cons: ["Encourages whole-API duplication", "Resource identity changes across versions"],
            when: "Use when operational simplicity and broad external client support dominate.",
          },
          {
            label: "Media type or header version",
            pros: ["Keeps resource URI stable", "Can version representations precisely"],
            cons: ["Less discoverable", "Caching and tooling require care"],
            when: "Use in mature HTTP ecosystems that control clients and intermediaries.",
          },
          {
            label: "No explicit version until needed",
            pros: ["Promotes additive evolution", "Avoids parallel stacks"],
            cons: ["Requires strong compatibility discipline", "A later break still needs migration"],
            when: "Use for well-governed APIs with contract checks and tolerant clients.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would make the published OpenAPI artifact reviewable and testable, then treat versions as rare migration boundaries.",
        beats: [
          "Specify operations, auth, schemas, standard errors, examples, pagination, and headers.",
          "Generate transport types or SDKs but map to a handwritten application boundary.",
          "Run schema lint, breaking-change checks, request validation, response conformance, and consumer scenarios in CI.",
          "Review semantic compatibility including enums, defaults, limits, order, and retry behavior.",
          "For unavoidable breaks, run versions in parallel with telemetry, migration docs, deprecation, and a sunset owner.",
        ],
        closing: "The contract stays trustworthy because documentation, generated artifacts, and runtime behavior are continuously reconciled.",
      },
    ],
    quiz: [
      {
        id: "oa-1",
        prompt: "Is adding an enum value always safe?",
        options: ["Yes", "No; exhaustive client switches may break", "Only in YAML", "Only for integers"],
        answerIndex: 1,
        explanation: "Schema-compatible additions can still violate client semantic assumptions.",
      },
      {
        id: "oa-2",
        prompt: "Why map generated API types to domain commands?",
        options: ["To hide HTTP contract concerns from the domain", "Because generated code cannot compile", "To remove validation", "To avoid tests"],
        answerIndex: 0,
        explanation: "Transport evolution and domain design have different responsibilities and lifecycles.",
      },
      {
        id: "oa-3",
        prompt: "Which request change is breaking?",
        options: ["Adding optional metadata", "Making an optional field required", "Adding an example", "Clarifying a description without semantic change"],
        answerIndex: 1,
        explanation: "Existing clients may omit the field and would immediately fail.",
      },
      {
        id: "oa-4",
        prompt: "What is needed before sunsetting a version?",
        options: ["Only a new logo", "Replacement, adoption telemetry, communication, and an owner", "A larger container", "A CORS wildcard"],
        answerIndex: 1,
        explanation: "Deprecation is a managed consumer migration, not merely a code deletion.",
      },
    ],
  },
];
