package main

import (
	"bufio"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gofoundry/worker/internal/executor"
)

type executeRequest struct {
	ProblemID string   `json:"problemId"`
	Code      string   `json:"code"`
	Modes     []string `json:"modes"`
}

func main() {
	port := os.Getenv("SANDBOX_WORKER_PORT")
	if port == "" {
		port = "8081"
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	http.HandleFunc("/execute", handleExecute)

	log.Printf("GoFoundry sandbox worker listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleExecute(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req executeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/x-ndjson")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	writer := bufio.NewWriter(w)
	emit := func(event any) {
		_ = json.NewEncoder(writer).Encode(event)
		writer.Flush()
		flusher.Flush()
	}

	exec := executor.New()
	if err := exec.Run(r.Context(), executor.Request{
		ProblemID: req.ProblemID,
		Code:      req.Code,
		Modes:     req.Modes,
	}, emit); err != nil {
		emit(map[string]string{"event": "ERROR", "message": err.Error()})
	}

	emit(map[string]string{"event": "COMPLETE"})
}
