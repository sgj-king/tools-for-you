package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const defaultServiceName = "platform-auth"

var requestCount atomic.Uint64

type app struct {
	db          *sql.DB
	serviceName string
	role        string
	startedAt   time.Time
}

type infoResponse struct {
	Service      string            `json:"service"`
	Role         string            `json:"role"`
	Environment  string            `json:"environment"`
	Version      string            `json:"version"`
	Uptime       string            `json:"uptime"`
	Now          string            `json:"now"`
	Dependencies map[string]string `json:"dependencies"`
}

type validateKeyRequest struct {
	APIKey    string `json:"api_key"`
	RequestID string `json:"request_id"`
	TraceID   string `json:"trace_id"`
}

type validateKeyResponse struct {
	Success            bool              `json:"success"`
	Valid              bool              `json:"valid"`
	RequestID          string            `json:"request_id"`
	TraceID            string            `json:"trace_id"`
	APIKeyID           uint64            `json:"api_key_id,omitempty"`
	OrganizationID     uint64            `json:"organization_id,omitempty"`
	ProjectID          uint64            `json:"project_id,omitempty"`
	UserID             uint64            `json:"user_id,omitempty"`
	APIKeyPrefix       string            `json:"api_key_prefix,omitempty"`
	KeyStatus          string            `json:"key_status,omitempty"`
	OrganizationStatus string            `json:"organization_status,omitempty"`
	ProjectStatus      string            `json:"project_status,omitempty"`
	Scopes             []string          `json:"scopes,omitempty"`
	Metadata           map[string]string `json:"metadata,omitempty"`
	ErrorCode          string            `json:"error_code,omitempty"`
	Message            string            `json:"message,omitempty"`
}

func main() {
	startedAt := time.Now()
	serviceName := getenv("SERVICE_NAME", defaultServiceName)
	role := getenv("SERVICE_ROLE", "identity")
	port := getenv("SERVICE_PORT", "8080")
	addr := ":" + port

	db, err := openDB(getenv("MYSQL_DSN", ""))
	if err != nil {
		log.Fatalf("[%s] failed to connect to MySQL: %v", serviceName, err)
	}

	app := &app{
		db:          db,
		serviceName: serviceName,
		role:        role,
		startedAt:   startedAt,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", app.handleRoot)
	mux.HandleFunc("/healthz", app.handleHealthz)
	mux.HandleFunc("/readyz", app.handleReadyz)
	mux.HandleFunc("/v1/info", app.handleInfo)
	mux.HandleFunc("/v1/echo", app.handleEcho)
	mux.HandleFunc("/internal/auth/validate-key", app.handleValidateKey)
	mux.HandleFunc("/metrics", app.handleMetrics)

	server := &http.Server{
		Addr:              addr,
		Handler:           loggingMiddleware(serviceName, mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("[%s] listening on %s", serviceName, addr)
	log.Fatal(server.ListenAndServe())
}

func (a *app) handleRoot(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(fmt.Sprintf("<h1>%s</h1><p>Auth service with MySQL access is running.</p>", a.serviceName)))
}

func (a *app) handleHealthz(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if err := a.pingDB(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"success": false, "service": a.serviceName, "status": "db_down", "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": a.serviceName, "status": "ok"})
}

func (a *app) handleReadyz(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if err := a.pingDB(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"success": false, "service": a.serviceName, "status": "not_ready", "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": a.serviceName, "status": "ready"})
}

func (a *app) handleInfo(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	writeJSON(w, http.StatusOK, infoResponse{
		Service:     a.serviceName,
		Role:        a.role,
		Environment: getenv("APP_ENV", "development"),
		Version:     getenv("APP_VERSION", "0.1.0-dev"),
		Uptime:      time.Since(a.startedAt).String(),
		Now:         time.Now().UTC().Format(time.RFC3339),
		Dependencies: map[string]string{
			"mysql_dsn":  maskDSN(getenv("MYSQL_DSN", "")),
			"redis_addr": getenv("REDIS_ADDR", ""),
			"nats_url":   getenv("NATS_URL", ""),
		},
	})
}

func (a *app) handleEcho(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": a.serviceName, "path": r.URL.Path})
}

func (a *app) handleValidateKey(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error_code": "method_not_allowed"})
		return
	}

	var req validateKeyRequest
	if err := decodeJSON(r, &req); err != nil {
		requestID := fallbackRequestID(req.RequestID)
		traceID := fallbackTraceID(req.TraceID)
		writeJSON(w, http.StatusBadRequest, validateKeyResponse{
			Success:   false,
			Valid:     false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "invalid_json",
			Message:   err.Error(),
		})
		return
	}
	requestID := fallbackRequestID(req.RequestID)
	traceID := fallbackTraceID(req.TraceID)

	apiKey := strings.TrimSpace(req.APIKey)
	if apiKey == "" {
		writeJSON(w, http.StatusBadRequest, validateKeyResponse{
			Success:   false,
			Valid:     false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "missing_api_key",
			Message:   "api_key is required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	type keyRecord struct {
		apiKeyID           uint64
		organizationID     uint64
		projectID          uint64
		apiKeyPrefix       string
		keyStatus          string
		organizationStatus string
		projectStatus      string
		userID             uint64
		organizationSlug   string
		projectName        string
		scopesJSON         string
		expiresAt          sql.NullTime
	}

	record := keyRecord{}
	keyHash := sha256Hex(apiKey)
	err := a.db.QueryRowContext(ctx, `
		SELECT
			ak.id,
			ak.organization_id,
			ak.project_id,
			ak.key_prefix,
			ak.status,
			o.status,
			p.status,
			COALESCE(o.owner_user_id, 0),
			o.slug,
			p.name,
			COALESCE(CAST(ak.scopes_json AS CHAR), '[]'),
			ak.expires_at
		FROM api_keys ak
		INNER JOIN organizations o ON o.id = ak.organization_id
		INNER JOIN projects p ON p.id = ak.project_id
		WHERE ak.key_hash = ?
		LIMIT 1
	`, keyHash).Scan(
		&record.apiKeyID,
		&record.organizationID,
		&record.projectID,
		&record.apiKeyPrefix,
		&record.keyStatus,
		&record.organizationStatus,
		&record.projectStatus,
		&record.userID,
		&record.organizationSlug,
		&record.projectName,
		&record.scopesJSON,
		&record.expiresAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusUnauthorized, validateKeyResponse{
			Success:   false,
			Valid:     false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "invalid_api_key",
			Message:   "api key not found",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, validateKeyResponse{
			Success:   false,
			Valid:     false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	if record.keyStatus != "active" || record.organizationStatus != "active" || record.projectStatus != "active" {
		writeJSON(w, http.StatusForbidden, validateKeyResponse{
			Success:            false,
			Valid:              false,
			RequestID:          requestID,
			TraceID:            traceID,
			APIKeyID:           record.apiKeyID,
			OrganizationID:     record.organizationID,
			ProjectID:          record.projectID,
			APIKeyPrefix:       record.apiKeyPrefix,
			KeyStatus:          record.keyStatus,
			OrganizationStatus: record.organizationStatus,
			ProjectStatus:      record.projectStatus,
			ErrorCode:          "key_or_scope_disabled",
			Message:            "api key or related scope is not active",
		})
		return
	}

	if record.expiresAt.Valid && record.expiresAt.Time.Before(time.Now()) {
		writeJSON(w, http.StatusUnauthorized, validateKeyResponse{
			Success:   false,
			Valid:     false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "api_key_expired",
			Message:   "api key has expired",
		})
		return
	}

	scopes := []string{}
	if err := json.Unmarshal([]byte(record.scopesJSON), &scopes); err != nil {
		scopes = []string{}
	}

	_, _ = a.db.ExecContext(ctx, `UPDATE api_keys SET last_used_at = NOW() WHERE id = ?`, record.apiKeyID)

	writeJSON(w, http.StatusOK, validateKeyResponse{
		Success:            true,
		Valid:              true,
		RequestID:          requestID,
		TraceID:            traceID,
		APIKeyID:           record.apiKeyID,
		OrganizationID:     record.organizationID,
		ProjectID:          record.projectID,
		UserID:             record.userID,
		APIKeyPrefix:       record.apiKeyPrefix,
		KeyStatus:          record.keyStatus,
		OrganizationStatus: record.organizationStatus,
		ProjectStatus:      record.projectStatus,
		Scopes:             scopes,
		Metadata: map[string]string{
			"organization_slug": record.organizationSlug,
			"project_name":      record.projectName,
			"key_hash":          keyHash[:12],
			"source":            "mysql",
		},
	})
}

func (a *app) handleMetrics(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	_, _ = fmt.Fprintf(w, "service_info{service=%q,role=%q,env=%q} 1\n", a.serviceName, a.role, getenv("APP_ENV", "development"))
	_, _ = fmt.Fprintf(w, "service_uptime_seconds %.0f\n", time.Since(a.startedAt).Seconds())
	_, _ = fmt.Fprintf(w, "service_http_requests_total %d\n", requestCount.Load())
}

func openDB(dsn string) (*sql.DB, error) {
	if strings.TrimSpace(dsn) == "" {
		return nil, errors.New("MYSQL_DSN is required")
	}
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetMaxIdleConns(5)
	db.SetMaxOpenConns(20)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, err
	}
	return db, nil
}

func (a *app) pingDB(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return a.db.PingContext(ctx)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func decodeJSON(r *http.Request, dst any) error {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		return err
	}
	if len(strings.TrimSpace(string(body))) == 0 {
		return errors.New("request body is required")
	}
	if err := json.Unmarshal(body, dst); err != nil {
		return err
	}
	return nil
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

func sha256Hex(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func fallbackRequestID(v string) string {
	v = strings.TrimSpace(v)
	if v != "" {
		return v
	}
	return "req_dev_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}

func fallbackTraceID(v string) string {
	v = strings.TrimSpace(v)
	if v != "" {
		return v
	}
	return "trace_dev_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}
