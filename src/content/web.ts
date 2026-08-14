import type { Lesson } from "./types";

export const webLessons: Lesson[] = [
  {
    slug: "rest-api-design-go",
    track: "web",
    title: "REST API Design in Go",
    subtitle: "Resource modeling, status codes, and a clean handler layering.",
    difficulty: "intermediate",
    minutes: 28,
    tags: ["rest", "api"],
    blocks: [
      {
        type: "think",
        title: "HEAT · Hear",
        clarify: [
          "What are the resources and their relationships?",
          "Pagination, filtering, sorting needs?",
          "Idempotency requirements for POST/PUT?",
        ],
        model: [
          "handler → service → repository layering",
          "DTOs at the edge, domain types inside",
        ],
      },
      {
        type: "prose",
        title: "Layering that stays testable",
        body: "Handlers parse/validate HTTP and call a service. The service holds business logic and depends on repository interfaces, not concrete DB code. This means you can unit test the service with a fake repository and never spin up a database.",
      },
      {
        type: "code",
        title: "Handler → service → repository",
        language: "go",
        code: `type UserRepository interface {
	Create(ctx context.Context, u User) (User, error)
	Get(ctx context.Context, id string) (User, error)
}

type UserService struct{ repo UserRepository }

func (s *UserService) Register(ctx context.Context, in RegisterInput) (User, error) {
	if in.Email == "" {
		return User{}, fmt.Errorf("%w: email required", ErrValidation)
	}
	return s.repo.Create(ctx, User{ID: newID(), Email: in.Email})
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var in RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	u, err := h.svc.Register(r.Context(), in)
	switch {
	case errors.Is(err, ErrValidation):
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
	case err != nil:
		http.Error(w, "internal error", http.StatusInternalServerError)
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(u)
	}
}`,
      },
      {
        type: "steps",
        title: "Status code cheat sheet",
        items: [
          "200 OK — success with body, 201 Created — POST that made a resource",
          "204 No Content — success, no body (e.g. DELETE)",
          "400 Bad Request — malformed input, 422 — semantically invalid",
          "401 Unauthenticated, 403 Forbidden, 404 Not Found, 409 Conflict",
          "429 Too Many Requests, 500 Internal, 503 Service Unavailable",
        ],
      },
    ],
    quiz: [
      {
        id: "rest1",
        prompt: "Why depend on a repository interface instead of *sql.DB directly in the service?",
        options: [
          "Interfaces are always faster",
          "It lets you substitute a fake in unit tests and swap storage later",
          "*sql.DB cannot be used in Go",
          "It removes the need for error handling",
        ],
        answerIndex: 1,
        explanation: "Dependency inversion at the service boundary is what makes business logic testable in isolation.",
      },
    ],
  },
  {
    slug: "middleware-and-context",
    track: "web",
    title: "Middleware & Request Context",
    subtitle: "Composable http.Handler chains, and passing request-scoped data safely.",
    difficulty: "intermediate",
    minutes: 24,
    tags: ["middleware", "context"],
    blocks: [
      {
        type: "prose",
        title: "Middleware is just a function wrapping a Handler",
        body: "A middleware has the shape func(http.Handler) http.Handler. Chain them by wrapping: logging(recoverPanic(auth(mux))). Use unexported context key types to avoid collisions when stashing request-scoped values like request ID or authenticated user.",
      },
      {
        type: "code",
        title: "Logging, recovery, and auth middleware",
        language: "go",
        code: `type ctxKey string

const userCtxKey ctxKey = "user"

func withUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := authenticate(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userCtxKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("panic recovered", "error", err)
				http.Error(w, "internal error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func chain(h http.Handler, mw ...func(http.Handler) http.Handler) http.Handler {
	for i := len(mw) - 1; i >= 0; i-- {
		h = mw[i](h)
	}
	return h
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never use a plain string as a context key — use an unexported named type to prevent collisions between packages.",
      },
    ],
    quiz: [
      {
        id: "mw1",
        prompt: "Why is a recover() middleware placed outermost in the chain?",
        options: [
          "It must run first alphabetically",
          "So a panic anywhere downstream is still caught before crashing the server",
          "recover() only works in main()",
          "It has nothing to do with ordering",
        ],
        answerIndex: 1,
        explanation: "recover only catches panics in the same goroutine's call stack below it, so it must wrap everything else.",
      },
    ],
  },
  {
    slug: "auth-jwt-sessions",
    track: "web",
    title: "Authentication: Sessions vs JWT",
    subtitle: "Trade-offs, refresh tokens, and where OAuth/OIDC (Google, Keycloak) fits.",
    difficulty: "advanced",
    minutes: 30,
    tags: ["auth", "jwt", "oauth"],
    blocks: [
      {
        type: "think",
        clarify: [
          "Single service or multiple services needing shared identity?",
          "Need instant revocation? Mobile + web clients?",
        ],
        model: [
          "Sessions: opaque ID + server-side store — easy revoke, needs shared store across instances",
          "JWT: self-contained, stateless verification — hard revoke, needs short expiry + refresh",
          "OAuth/OIDC (Google, Keycloak): delegate identity to a provider, receive a verified token",
        ],
      },
      {
        type: "prose",
        title: "Sessions vs JWT",
        body: "Sessions store a random ID in a cookie and look up state server-side (Redis/DB) — trivial to revoke, but requires shared storage across instances. JWTs are self-contained and verifiable without a lookup, which scales horizontally, but revocation before expiry requires a denylist, defeating some of the benefit. Most production systems use short-lived JWT access tokens plus a long-lived, revocable refresh token.",
      },
      {
        type: "code",
        title: "Verifying a JWT (HMAC) in Go",
        language: "go",
        code: `func verify(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token: %w", err)
	}
	return token.Claims.(*Claims), nil
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Always pin the expected signing algorithm when verifying JWTs — the classic \"alg: none\" or algorithm-confusion attack exploits code that trusts the token's own header.",
      },
      {
        type: "prose",
        title: "Where Google Sign-In / Keycloak fit",
        body: "OAuth2 + OIDC delegate authentication to a provider. Your Go backend receives an ID token (JWT) from Google or your self-hosted Keycloak realm, verifies its signature against the provider's public JWKS endpoint, and maps the verified subject to a local user record — you never see or store passwords.",
      },
    ],
    quiz: [
      {
        id: "auth1",
        prompt: "Why use short-lived JWT access tokens + a revocable refresh token?",
        options: [
          "It's slower on purpose",
          "It balances statelessness (fast verification) with the ability to revoke access within minutes",
          "Refresh tokens are not needed with JWT",
          "JWTs cannot expire",
        ],
        answerIndex: 1,
        explanation: "Short expiry limits the damage window; refresh tokens are checked against a revocable store.",
      },
    ],
  },
  {
    slug: "grpc-basics-go",
    track: "web",
    title: "gRPC Basics",
    subtitle: "Protobuf contracts, unary vs streaming RPCs, and when to choose it over REST.",
    difficulty: "advanced",
    minutes: 28,
    tags: ["grpc", "protobuf"],
    blocks: [
      {
        type: "prose",
        title: "Contract-first, binary, HTTP/2",
        body: "gRPC defines services in .proto files; protoc generates typed Go client/server stubs. It rides on HTTP/2, giving multiplexed streams and binary (protobuf) payloads — smaller and faster to parse than JSON, at the cost of human-readability and browser support (needs grpc-web).",
      },
      {
        type: "code",
        title: "Service definition and Go server",
        language: "text",
        code: `service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc StreamOrders(OrderQuery) returns (stream Order);
}`,
      },
      {
        type: "code",
        title: "Implementing the generated interface",
        language: "go",
        code: `type server struct {
	pb.UnimplementedUserServiceServer
	repo UserRepository
}

func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
	u, err := s.repo.Get(ctx, req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "user %s not found", req.GetId())
	}
	return &pb.User{Id: u.ID, Email: u.Email}, nil
}

func main() {
	lis, _ := net.Listen("tcp", ":9090")
	s := grpc.NewServer()
	pb.RegisterUserServiceServer(s, &server{repo: repo})
	s.Serve(lis)
}`,
      },
      {
        type: "steps",
        title: "REST vs gRPC — pick by need",
        items: [
          "Public/browser-facing API, human debuggability → REST + JSON",
          "Internal service-to-service, high throughput, streaming → gRPC",
          "Need strict typed contracts across many languages → gRPC + protobuf",
          "Simple CRUD, wide client compatibility → REST",
        ],
      },
    ],
    quiz: [
      {
        id: "grpc1",
        prompt: "gRPC uses status.Errorf(codes.NotFound, ...) instead of an HTTP 404 because…",
        options: [
          "gRPC cannot signal errors",
          "It runs over HTTP/2 with its own status code model, not standard HTTP status codes",
          "codes.NotFound is deprecated",
          "It always returns 200",
        ],
        answerIndex: 1,
        explanation: "gRPC has its own canonical status codes independent of HTTP status semantics.",
      },
    ],
  },
  {
    slug: "websockets-realtime-go",
    track: "web",
    title: "WebSockets & Real-Time",
    subtitle: "Full-duplex connections, hub patterns, and backpressure.",
    difficulty: "advanced",
    minutes: 26,
    tags: ["websocket", "realtime"],
    blocks: [
      {
        type: "prose",
        title: "One goroutine per connection, one hub to rule them",
        body: "A common Go pattern: each WebSocket connection gets a read goroutine and a write goroutine, both talking to a per-connection outbound channel. A central Hub tracks connections and fans out broadcasts by sending into each connection's channel — never writing to the same conn from two goroutines.",
      },
      {
        type: "code",
        title: "Hub + client pattern",
        language: "go",
        code: `type Client struct {
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

func (h *Hub) run() {
	for {
		select {
		case c := <-h.register:
			h.clients[c] = true
		case c := <-h.unregister:
			delete(h.clients, c)
			close(c.send)
		case msg := <-h.broadcast:
			for c := range h.clients {
				select {
				case c.send <- msg:
				default:
					// slow consumer: drop it rather than block the hub
					close(c.send)
					delete(h.clients, c)
				}
			}
		}
	}
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "A single slow client must never block broadcasts to everyone else — always use a non-blocking send (select/default) or a bounded buffer with drop policy.",
      },
    ],
    quiz: [
      {
        id: "ws1",
        prompt: "Why route all writes to a connection through one dedicated goroutine + channel?",
        options: [
          "WebSocket connections are not safe for concurrent writes from multiple goroutines",
          "It's required by TCP",
          "To make code longer",
          "Reads are impossible otherwise",
        ],
        answerIndex: 0,
        explanation: "gorilla/websocket (and most ws libs) require a single writer at a time per connection.",
      },
    ],
  },
  {
    slug: "cors-security-headers",
    track: "web",
    title: "CORS & Security Headers",
    subtitle: "Same-origin policy, preflight requests, and headers every API should set.",
    difficulty: "intermediate",
    minutes: 20,
    tags: ["cors", "security"],
    blocks: [
      {
        type: "prose",
        title: "CORS is a browser-enforced allowlist",
        body: "The browser blocks cross-origin JS from reading responses unless the server opts in via Access-Control-Allow-Origin (and friends). \"Non-simple\" requests (custom headers, non-GET/POST, JSON content-type in some cases) trigger a preflight OPTIONS request the server must answer correctly before the real request is sent.",
      },
      {
        type: "code",
        title: "Minimal CORS middleware",
        language: "go",
        code: `func cors(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}`,
      },
      {
        type: "steps",
        title: "Security headers worth setting",
        items: [
          "Strict-Transport-Security — force HTTPS on repeat visits",
          "X-Content-Type-Options: nosniff — stop MIME sniffing",
          "Content-Security-Policy — restrict script/style sources",
          "Referrer-Policy: strict-origin-when-cross-origin",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never set Access-Control-Allow-Origin: * together with Access-Control-Allow-Credentials: true — browsers reject that combination, and it's a security smell anyway.",
      },
    ],
    quiz: [
      {
        id: "cors1",
        prompt: "A preflight OPTIONS request is sent by the browser when…",
        options: [
          "Every single request, always",
          "The request is \"non-simple\" (custom headers, certain methods/content types)",
          "Only on GET requests",
          "Never — it's a myth",
        ],
        answerIndex: 1,
        explanation: "Simple requests skip preflight; anything else triggers it so the server can pre-approve.",
      },
    ],
  },
  {
    slug: "deploying-go-services",
    track: "web",
    title: "Deploying Go Services",
    subtitle: "Static binaries, multi-stage Docker builds, health checks, and graceful shutdown.",
    difficulty: "intermediate",
    minutes: 24,
    tags: ["deployment", "docker"],
    blocks: [
      {
        type: "prose",
        title: "Go's superpower: one static binary",
        body: "CGO_ENABLED=0 go build produces a single static binary with no runtime dependency — it can run in a scratch or distroless container with no OS package manager, drastically shrinking image size and attack surface.",
      },
      {
        type: "code",
        title: "Multi-stage Dockerfile",
        language: "bash",
        code: `# build stage
FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app ./cmd/server

# final stage
FROM gcr.io/distroless/static-debian12
COPY --from=build /app /app
EXPOSE 8080
ENTRYPOINT ["/app"]`,
      },
      {
        type: "code",
        title: "Graceful shutdown on SIGTERM",
        language: "go",
        code: `ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

go srv.ListenAndServe()

<-ctx.Done()
shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
defer cancel()
srv.Shutdown(shutdownCtx) // stop accepting, drain in-flight requests`,
      },
      {
        type: "steps",
        title: "Production checklist",
        items: [
          "/healthz (liveness) and /readyz (readiness, checks deps)",
          "Structured logs to stdout — let the platform collect them",
          "Expose Prometheus metrics via /metrics",
          "Set GOMAXPROCS correctly in containers (or use automaxprocs)",
          "Handle SIGTERM for graceful shutdown before the orchestrator sends SIGKILL",
        ],
      },
    ],
    quiz: [
      {
        id: "deploy1",
        prompt: "Why does CGO_ENABLED=0 matter for container images?",
        options: [
          "It makes builds fail intentionally",
          "It produces a statically linked binary that can run in minimal images without libc",
          "It disables goroutines",
          "It is required for HTTPS",
        ],
        answerIndex: 1,
        explanation: "Without cgo, the binary doesn't dynamically link libc, enabling scratch/distroless base images.",
      },
    ],
  },
];
