package main

import (
	"context"
	"database/sql"
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

const defaultServiceName = "platform-policy"

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

type policyCheckRequest struct {
	RequestID      string `json:"request_id"`
	TraceID        string `json:"trace_id"`
	OrganizationID uint64 `json:"organization_id"`
	ProjectID      uint64 `json:"project_id"`
	APIKeyID       uint64 `json:"api_key_id"`
	Model          string `json:"model"`
	Region         string `json:"region"`
}

type policyCheckResponse struct {
	Success         bool                   `json:"success"`
	Allowed         bool                   `json:"allowed"`
	RequestID       string                 `json:"request_id"`
	TraceID         string                 `json:"trace_id"`
	PolicyCode      string                 `json:"policy_code,omitempty"`
	PricePlanCode   string                 `json:"price_plan_code,omitempty"`
	Limits          map[string]any         `json:"limits,omitempty"`
	RouteHint       map[string]any         `json:"route_hint,omitempty"`
	DecisionContext map[string]any         `json:"decision_context,omitempty"`
	ErrorCode       string                 `json:"error_code,omitempty"`
	Message         string                 `json:"message,omitempty"`
}

func main() {
	startedAt := time.Now()
	serviceName := getenv("SERVICE_NAME", defaultServiceName)
	role := getenv("SERVICE_ROLE", "policy")
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
	mux.HandleFunc("/internal/policy/check", app.handlePolicyCheck)
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
	_, _ = w.Write([]byte(fmt.Sprintf("<h1>%s</h1><p>Policy service with MySQL access is running.</p>", a.serviceName)))
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

func (a *app) handlePolicyCheck(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error_code": "method_not_allowed"})
		return
	}

	var req policyCheckRequest
	if err := decodeJSON(r, &req); err != nil {
		requestID := fallbackRequestID(req.RequestID)
		traceID := fallbackTraceID(req.TraceID)
		writeJSON(w, http.StatusBadRequest, policyCheckResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "invalid_json",
			Message:   err.Error(),
		})
		return
	}
	requestID := fallbackRequestID(req.RequestID)
	traceID := fallbackTraceID(req.TraceID)

	if req.OrganizationID == 0 || req.ProjectID == 0 || req.APIKeyID == 0 || strings.TrimSpace(req.Model) == "" {
		writeJSON(w, http.StatusBadRequest, policyCheckResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "missing_required_fields",
			Message:   "organization_id, project_id, api_key_id and model are required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	type entitlementRecord struct {
		policyCode       string
		rpmLimit         int
		tpmLimit         int
		concurrencyLimit int
		dailyCostCap     string
	}

	entitlement := entitlementRecord{}
	err := a.db.QueryRowContext(ctx, `
		SELECT
			policy_code,
			rpm_limit,
			tpm_limit,
			concurrency_limit,
			CAST(daily_cost_cap AS CHAR)
		FROM model_entitlements
		WHERE organization_id = ?
		  AND external_model_name = ?
		  AND is_enabled = 1
		  AND (expires_at IS NULL OR expires_at > NOW())
		  AND (project_id = ? OR project_id IS NULL)
		ORDER BY CASE WHEN project_id = ? THEN 0 ELSE 1 END, id ASC
		LIMIT 1
	`, req.OrganizationID, strings.TrimSpace(req.Model), req.ProjectID, req.ProjectID).Scan(
		&entitlement.policyCode,
		&entitlement.rpmLimit,
		&entitlement.tpmLimit,
		&entitlement.concurrencyLimit,
		&entitlement.dailyCostCap,
	)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusForbidden, policyCheckResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "model_not_entitled",
			Message:   "model entitlement not found",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, policyCheckResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	type routeRecord struct {
		internalProfile string
		providerCode    string
		providerModel   string
		region          string
		channelCode     string
	}

	route := routeRecord{}
	region := fallbackRegion(req.Region)
	err = a.db.QueryRowContext(ctx, `
		SELECT
			internal_model_profile,
			provider_code,
			provider_model,
			region,
			channel_code
		FROM provider_routes
		WHERE external_model_name = ?
		  AND is_active = 1
		  AND (region = ? OR region = 'global')
		ORDER BY CASE WHEN region = ? THEN 0 ELSE 1 END, priority ASC, weight DESC, id ASC
		LIMIT 1
	`, strings.TrimSpace(req.Model), region, region).Scan(
		&route.internalProfile,
		&route.providerCode,
		&route.providerModel,
		&route.region,
		&route.channelCode,
	)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusServiceUnavailable, policyCheckResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "route_not_found",
			Message:   "active provider route not found",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, policyCheckResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	pricePlanCode := "unknown"
	_ = a.db.QueryRowContext(ctx, `
		SELECT code FROM price_plans
		WHERE is_active = 1
		ORDER BY id ASC
		LIMIT 1
	`).Scan(&pricePlanCode)

	writeJSON(w, http.StatusOK, policyCheckResponse{
		Success:       true,
		Allowed:       true,
		RequestID:     requestID,
		TraceID:       traceID,
		PolicyCode:    entitlement.policyCode,
		PricePlanCode: pricePlanCode,
		Limits: map[string]any{
			"rpm":            entitlement.rpmLimit,
			"tpm":            entitlement.tpmLimit,
			"concurrency":    entitlement.concurrencyLimit,
			"daily_cost_cap": entitlement.dailyCostCap,
		},
		RouteHint: map[string]any{
			"external_model_name": strings.TrimSpace(req.Model),
			"internal_profile":    route.internalProfile,
			"preferred_provider":  route.providerCode,
			"provider_model":      route.providerModel,
			"channel_code":        route.channelCode,
			"region":              route.region,
		},
		DecisionContext: map[string]any{
			"organization_id": req.OrganizationID,
			"project_id":      req.ProjectID,
			"api_key_id":      req.APIKeyID,
			"region":          region,
			"source":          "mysql",
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

func fallbackRegion(v string) string {
	v = strings.TrimSpace(v)
	if v != "" {
		return v
	}
	return "global"
}
