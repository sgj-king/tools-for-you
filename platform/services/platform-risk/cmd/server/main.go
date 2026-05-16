package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync/atomic"
	"time"
)

const defaultServiceName = "platform-risk"

var requestCount atomic.Uint64

type infoResponse struct {
	Service      string            `json:"service"`
	Role         string            `json:"role"`
	Environment  string            `json:"environment"`
	Version      string            `json:"version"`
	Uptime       string            `json:"uptime"`
	Now          string            `json:"now"`
	Dependencies map[string]string `json:"dependencies"`
}

func main() {
	startedAt := time.Now()
	serviceName := getenv("SERVICE_NAME", defaultServiceName)
	role := getenv("SERVICE_ROLE", "risk")
	port := getenv("SERVICE_PORT", "8080")
	addr := ":" + port

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(fmt.Sprintf("<h1>%s</h1><p>Risk skeleton is running.</p>", serviceName)))
	})
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": serviceName, "status": "ok"})
	})
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": serviceName, "status": "ready"})
	})
	mux.HandleFunc("/v1/info", func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		writeJSON(w, http.StatusOK, infoResponse{
			Service:     serviceName,
			Role:        role,
			Environment: getenv("APP_ENV", "development"),
			Version:     getenv("APP_VERSION", "0.1.0-dev"),
			Uptime:      time.Since(startedAt).String(),
			Now:         time.Now().UTC().Format(time.RFC3339),
			Dependencies: map[string]string{
				"mysql_dsn":  maskDSN(getenv("MYSQL_DSN", "")),
				"redis_addr": getenv("REDIS_ADDR", ""),
				"nats_url":   getenv("NATS_URL", ""),
			},
		})
	})
	mux.HandleFunc("/v1/echo", func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": serviceName, "path": r.URL.Path})
	})
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		w.Header().Set("Content-Type", "text/plain; version=0.0.4")
		_, _ = fmt.Fprintf(w, "service_info{service=%q,role=%q,env=%q} 1\n", serviceName, role, getenv("APP_ENV", "development"))
		_, _ = fmt.Fprintf(w, "service_uptime_seconds %.0f\n", time.Since(startedAt).Seconds())
		_, _ = fmt.Fprintf(w, "service_http_requests_total %d\n", requestCount.Load())
	})

	server := &http.Server{
		Addr:              addr,
		Handler:           loggingMiddleware(serviceName, mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("[%s] listening on %s", serviceName, addr)
	log.Fatal(server.ListenAndServe())
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func loggingMiddleware(serviceName string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[%s] %s %s", serviceName, r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func getenv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func maskDSN(dsn string) string {
	if dsn == "" {
		return ""
	}
	if i := strings.Index(dsn, "@"); i > 0 {
		return "***" + dsn[i:]
	}
	return "***"
}
