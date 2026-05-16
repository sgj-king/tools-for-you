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

const defaultServiceName = "platform-billing"

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

type preauthorizeRequest struct {
	RequestID           string `json:"request_id"`
	TraceID             string `json:"trace_id"`
	OrganizationID      uint64 `json:"organization_id"`
	ProjectID           uint64 `json:"project_id"`
	APIKeyID            uint64 `json:"api_key_id"`
	Model               string `json:"model"`
	MaxTokens           int    `json:"max_tokens"`
	InputTokensEstimate int    `json:"input_tokens_estimate"`
	IdempotencyKey      string `json:"idempotency_key"`
}

type preauthorizeResponse struct {
	Success           bool           `json:"success"`
	Allowed           bool           `json:"allowed"`
	RequestID         string         `json:"request_id"`
	TraceID           string         `json:"trace_id"`
	HoldID            string         `json:"hold_id,omitempty"`
	HoldAmount        string         `json:"hold_amount,omitempty"`
	Currency          string         `json:"currency,omitempty"`
	PriceSnapshotCode string         `json:"price_snapshot_code,omitempty"`
	AccountMode       string         `json:"account_mode,omitempty"`
	DecisionContext   map[string]any `json:"decision_context,omitempty"`
	ErrorCode         string         `json:"error_code,omitempty"`
	Message           string         `json:"message,omitempty"`
}

type finalizeRequest struct {
	RequestID        string `json:"request_id"`
	TraceID          string `json:"trace_id"`
	HoldID           string `json:"hold_id"`
	OrganizationID   uint64 `json:"organization_id"`
	ProjectID        uint64 `json:"project_id"`
	APIKeyID         uint64 `json:"api_key_id"`
	Model            string `json:"model"`
	InputTokens      int    `json:"input_tokens"`
	OutputTokens     int    `json:"output_tokens"`
	ProviderCost     string `json:"provider_cost"`
	AuthorizedAmount string `json:"authorized_amount"`
	StreamStatus     string `json:"stream_status"`
	IdempotencyKey   string `json:"idempotency_key"`
}

type finalizeResponse struct {
	Success          bool           `json:"success"`
	Settled          bool           `json:"settled"`
	RequestID        string         `json:"request_id"`
	TraceID          string         `json:"trace_id"`
	HoldID           string         `json:"hold_id,omitempty"`
	CapturedAmount   string         `json:"captured_amount,omitempty"`
	ReleasedAmount   string         `json:"released_amount,omitempty"`
	Currency         string         `json:"currency,omitempty"`
	SettlementStatus string         `json:"settlement_status,omitempty"`
	UsageRecordID    string         `json:"usage_record_id,omitempty"`
	LedgerEntryIDs   []string       `json:"ledger_entry_ids,omitempty"`
	DecisionContext  map[string]any `json:"decision_context,omitempty"`
	ErrorCode        string         `json:"error_code,omitempty"`
	Message          string         `json:"message,omitempty"`
}

func main() {
	startedAt := time.Now()
	serviceName := getenv("SERVICE_NAME", defaultServiceName)
	role := getenv("SERVICE_ROLE", "billing")
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
	mux.HandleFunc("/internal/billing/preauthorize", app.handlePreauthorize)
	mux.HandleFunc("/internal/billing/finalize", app.handleFinalize)
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
	_, _ = w.Write([]byte(fmt.Sprintf("<h1>%s</h1><p>Billing service with MySQL access is running.</p>", a.serviceName)))
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

func (a *app) handlePreauthorize(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error_code": "method_not_allowed"})
		return
	}

	var req preauthorizeRequest
	if err := decodeJSON(r, &req); err != nil {
		requestID := fallbackRequestID(req.RequestID)
		traceID := fallbackTraceID(req.TraceID)
		writeJSON(w, http.StatusBadRequest, preauthorizeResponse{
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
		writeJSON(w, http.StatusBadRequest, preauthorizeResponse{
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

	tx, err := a.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "tx_begin_failed",
			Message:   err.Error(),
		})
		return
	}
	defer tx.Rollback()

	idemKey := fallbackIdempotencyKey(req.IdempotencyKey)
	var existingHoldID, existingHoldAmount string
	err = tx.QueryRowContext(ctx, `
		SELECT reference_id, CAST(amount AS CHAR)
		FROM balance_ledger
		WHERE idempotency_key = ?
		  AND reference_type = 'preauth_hold'
		LIMIT 1
	`, idemKey).Scan(&existingHoldID, &existingHoldAmount)
	if err == nil {
		if err := tx.Commit(); err != nil {
			writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
				Success:   false,
				Allowed:   false,
				RequestID: requestID,
				TraceID:   traceID,
				ErrorCode: "tx_commit_failed",
				Message:   err.Error(),
			})
			return
		}
		writeJSON(w, http.StatusOK, preauthorizeResponse{
			Success:           true,
			Allowed:           true,
			RequestID:         requestID,
			TraceID:           traceID,
			HoldID:            existingHoldID,
			HoldAmount:        existingHoldAmount,
			Currency:          "USD",
			PriceSnapshotCode: strings.TrimSpace(req.Model) + "@mysql-dev",
			AccountMode:       "prepaid",
			DecisionContext: map[string]any{
				"organization_id": req.OrganizationID,
				"project_id":      req.ProjectID,
				"api_key_id":      req.APIKeyID,
				"idempotency_key": idemKey,
				"source":          "mysql_idempotent_hit",
			},
		})
		return
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	var apiKeyExists int
	err = tx.QueryRowContext(ctx, `
		SELECT COUNT(1)
		FROM api_keys
		WHERE id = ? AND organization_id = ? AND project_id = ? AND status = 'active'
	`, req.APIKeyID, req.OrganizationID, req.ProjectID).Scan(&apiKeyExists)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}
	if apiKeyExists == 0 {
		writeJSON(w, http.StatusForbidden, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "api_key_scope_invalid",
			Message:   "api key does not belong to the provided organization/project scope",
		})
		return
	}

	cashBalance, err := signedSum(ctx, tx, req.OrganizationID, "cash")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	openHold, err := signedHold(ctx, tx, req.OrganizationID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	holdAmount := estimateHoldAmount(strings.TrimSpace(req.Model), req.MaxTokens, req.InputTokensEstimate)
	available := cashBalance - openHold
	if available < holdAmount {
		writeJSON(w, http.StatusPaymentRequired, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "insufficient_balance",
			Message:   "insufficient available balance for preauthorization",
		})
		return
	}

	holdID := "hold_" + requestID
	_, err = tx.ExecContext(ctx, `
		INSERT INTO balance_ledger (
			organization_id, project_id, api_key_id,
			account_type, direction, amount, currency,
			reference_type, reference_id, request_id, idempotency_key, remark
		) VALUES (?, ?, ?, 'hold', 'debit', ?, 'USD', 'preauth_hold', ?, ?, ?, ?)
	`, req.OrganizationID, req.ProjectID, req.APIKeyID, holdAmount, holdID, requestID, idemKey, "Development preauthorization hold")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "hold_insert_failed",
			Message:   err.Error(),
		})
		return
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, preauthorizeResponse{
			Success:   false,
			Allowed:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "tx_commit_failed",
			Message:   err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, preauthorizeResponse{
		Success:           true,
		Allowed:           true,
		RequestID:         requestID,
		TraceID:           traceID,
		HoldID:            holdID,
		HoldAmount:        formatAmount(holdAmount),
		Currency:          "USD",
		PriceSnapshotCode: strings.TrimSpace(req.Model) + "@mysql-dev",
		AccountMode:       "prepaid",
		DecisionContext: map[string]any{
			"organization_id": req.OrganizationID,
			"project_id":      req.ProjectID,
			"api_key_id":      req.APIKeyID,
			"idempotency_key": idemKey,
			"cash_balance":    formatAmount(cashBalance),
			"open_hold":       formatAmount(openHold),
			"source":          "mysql",
		},
	})
}

func (a *app) handleFinalize(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error_code": "method_not_allowed"})
		return
	}

	var req finalizeRequest
	if err := decodeJSON(r, &req); err != nil {
		requestID := fallbackRequestID(req.RequestID)
		traceID := fallbackTraceID(req.TraceID)
		writeJSON(w, http.StatusBadRequest, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "invalid_json",
			Message:   err.Error(),
		})
		return
	}
	requestID := fallbackRequestID(req.RequestID)
	traceID := fallbackTraceID(req.TraceID)

	if req.OrganizationID == 0 || req.ProjectID == 0 || req.APIKeyID == 0 || strings.TrimSpace(req.Model) == "" || strings.TrimSpace(req.HoldID) == "" {
		writeJSON(w, http.StatusBadRequest, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "missing_required_fields",
			Message:   "organization_id, project_id, api_key_id, model and hold_id are required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	tx, err := a.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "tx_begin_failed",
			Message:   err.Error(),
		})
		return
	}
	defer tx.Rollback()

	var existingUsageID uint64
	var existingSaleAmount string
	err = tx.QueryRowContext(ctx, `
		SELECT id, CAST(sale_amount AS CHAR)
		FROM usage_records
		WHERE request_id = ?
		LIMIT 1
	`, requestID).Scan(&existingUsageID, &existingSaleAmount)
	if err == nil {
		if err := tx.Commit(); err != nil {
			writeJSON(w, http.StatusInternalServerError, finalizeResponse{
				Success:   false,
				Settled:   false,
				RequestID: requestID,
				TraceID:   traceID,
				ErrorCode: "tx_commit_failed",
				Message:   err.Error(),
			})
			return
		}
		writeJSON(w, http.StatusOK, finalizeResponse{
			Success:          true,
			Settled:          true,
			RequestID:        requestID,
			TraceID:          traceID,
			HoldID:           strings.TrimSpace(req.HoldID),
			CapturedAmount:   existingSaleAmount,
			ReleasedAmount:   "0.000000",
			Currency:         "USD",
			SettlementStatus: "settled",
			UsageRecordID:    strconv.FormatUint(existingUsageID, 10),
			LedgerEntryIDs:   []string{},
			DecisionContext: map[string]any{
				"idempotency_key": fallbackIdempotencyKey(req.IdempotencyKey),
				"source":          "mysql_idempotent_hit",
			},
		})
		return
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	var holdAmountStr string
	err = tx.QueryRowContext(ctx, `
		SELECT CAST(amount AS CHAR)
		FROM balance_ledger
		WHERE organization_id = ?
		  AND project_id = ?
		  AND api_key_id = ?
		  AND reference_type = 'preauth_hold'
		  AND reference_id = ?
		LIMIT 1
	`, req.OrganizationID, req.ProjectID, req.APIKeyID, strings.TrimSpace(req.HoldID)).Scan(&holdAmountStr)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "hold_not_found",
			Message:   "matching preauthorization hold not found",
		})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "db_query_failed",
			Message:   err.Error(),
		})
		return
	}

	holdAmount := parseAmount(holdAmountStr)
	actualAmount := estimateActualAmount(strings.TrimSpace(req.Model), req.InputTokens, req.OutputTokens)
	if holdAmount <= 0 {
		holdAmount = holdAmountFromRequest(req.AuthorizedAmount, actualAmount)
	}
	released := holdAmount - actualAmount
	if released < 0 {
		released = 0
	}
	providerCost := parseAmount(req.ProviderCost)
	streamStatus := fallbackStreamStatus(req.StreamStatus)

	type routeRecord struct {
		internalProfile string
		providerCode    string
		providerModel   string
	}
	route := routeRecord{
		internalProfile: "unknown_profile",
		providerCode:    "unknown_provider",
		providerModel:   "unknown_model",
	}
	_ = tx.QueryRowContext(ctx, `
		SELECT internal_model_profile, provider_code, provider_model
		FROM provider_routes
		WHERE external_model_name = ? AND is_active = 1
		ORDER BY priority ASC, weight DESC, id ASC
		LIMIT 1
	`, strings.TrimSpace(req.Model)).Scan(&route.internalProfile, &route.providerCode, &route.providerModel)

	result, err := tx.ExecContext(ctx, `
		INSERT INTO usage_records (
			request_id, organization_id, project_id, api_key_id,
			external_model_name, internal_model_profile, provider_code, provider_model,
			input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
			billable_units, provider_cost, sale_amount, settlement_status,
			started_at, finished_at, trace_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, NOW(), NOW(), ?)
	`, requestID, req.OrganizationID, req.ProjectID, req.APIKeyID,
		strings.TrimSpace(req.Model), route.internalProfile, route.providerCode, route.providerModel,
		req.InputTokens, req.OutputTokens, float64(req.InputTokens+req.OutputTokens)/1000.0, providerCost, actualAmount, settlementStatus(streamStatus), traceID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "usage_insert_failed",
			Message:   err.Error(),
		})
		return
	}
	usageRecordID, _ := result.LastInsertId()

	captureRes, err := tx.ExecContext(ctx, `
		INSERT INTO balance_ledger (
			organization_id, project_id, api_key_id,
			account_type, direction, amount, currency,
			reference_type, reference_id, request_id, idempotency_key, remark
		) VALUES (?, ?, ?, 'cash', 'debit', ?, 'USD', 'settlement_capture', ?, ?, ?, ?)
	`, req.OrganizationID, req.ProjectID, req.APIKeyID, actualAmount, requestID, requestID, fallbackIdempotencyKey(req.IdempotencyKey)+"_capture", "Settlement capture")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "ledger_insert_failed",
			Message:   err.Error(),
		})
		return
	}
	captureID, _ := captureRes.LastInsertId()

	releaseRes, err := tx.ExecContext(ctx, `
		INSERT INTO balance_ledger (
			organization_id, project_id, api_key_id,
			account_type, direction, amount, currency,
			reference_type, reference_id, request_id, idempotency_key, remark
		) VALUES (?, ?, ?, 'hold', 'credit', ?, 'USD', 'hold_release', ?, ?, ?, ?)
	`, req.OrganizationID, req.ProjectID, req.APIKeyID, holdAmount, strings.TrimSpace(req.HoldID), requestID, fallbackIdempotencyKey(req.IdempotencyKey)+"_release", "Release full hold after final settlement")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "ledger_insert_failed",
			Message:   err.Error(),
		})
		return
	}
	releaseID, _ := releaseRes.LastInsertId()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO request_traces (
			request_id, trace_id, organization_id, project_id, api_key_id,
			edge_status_code, provider_status_code, route_snapshot_json, latency_ms, stream_duration_ms, error_code, error_message_masked
		) VALUES (?, ?, ?, ?, ?, 200, 200, JSON_OBJECT('internal_profile', ?, 'provider_code', ?, 'provider_model', ?), 0, 0, NULL, NULL)
	`, requestID, traceID, req.OrganizationID, req.ProjectID, req.APIKeyID, route.internalProfile, route.providerCode, route.providerModel)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "trace_insert_failed",
			Message:   err.Error(),
		})
		return
	}

	if err := tx.Commit(); err != nil {
		writeJSON(w, http.StatusInternalServerError, finalizeResponse{
			Success:   false,
			Settled:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "tx_commit_failed",
			Message:   err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, finalizeResponse{
		Success:          true,
		Settled:          true,
		RequestID:        requestID,
		TraceID:          traceID,
		HoldID:           strings.TrimSpace(req.HoldID),
		CapturedAmount:   formatAmount(actualAmount),
		ReleasedAmount:   formatAmount(released),
		Currency:         "USD",
		SettlementStatus: settlementStatus(streamStatus),
		UsageRecordID:    strconv.FormatInt(usageRecordID, 10),
		LedgerEntryIDs: []string{
			strconv.FormatInt(captureID, 10),
			strconv.FormatInt(releaseID, 10),
		},
		DecisionContext: map[string]any{
			"organization_id": req.OrganizationID,
			"project_id":      req.ProjectID,
			"api_key_id":      req.APIKeyID,
			"provider_cost":   formatAmount(providerCost),
			"stream_status":   streamStatus,
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

func signedSum(ctx context.Context, tx *sql.Tx, organizationID uint64, accountType string) (float64, error) {
	var value sql.NullString
	err := tx.QueryRowContext(ctx, `
		SELECT CAST(COALESCE(SUM(
			CASE
				WHEN direction = 'credit' THEN amount
				WHEN direction = 'debit' THEN -amount
				ELSE 0
			END
		), 0) AS CHAR)
		FROM balance_ledger
		WHERE organization_id = ?
		  AND account_type = ?
	`, organizationID, accountType).Scan(&value)
	if err != nil {
		return 0, err
	}
	return parseAmount(value.String), nil
}

func signedHold(ctx context.Context, tx *sql.Tx, organizationID uint64) (float64, error) {
	var value sql.NullString
	err := tx.QueryRowContext(ctx, `
		SELECT CAST(COALESCE(SUM(
			CASE
				WHEN direction = 'debit' THEN amount
				WHEN direction = 'credit' THEN -amount
				ELSE 0
			END
		), 0) AS CHAR)
		FROM balance_ledger
		WHERE organization_id = ?
		  AND account_type = 'hold'
	`, organizationID).Scan(&value)
	if err != nil {
		return 0, err
	}
	return parseAmount(value.String), nil
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

func fallbackIdempotencyKey(v string) string {
	v = strings.TrimSpace(v)
	if v != "" {
		return v
	}
	return "idem_dev_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}

func estimateHoldAmount(model string, maxTokens, inputTokensEstimate int) float64 {
	inputUnits := float64(max(1, inputTokensEstimate)) / 1000.0
	outputUnits := float64(max(1, maxTokens)) / 1000.0
	base := modelUnitPrice(model)
	return (inputUnits + outputUnits) * base * 1.20
}

func estimateActualAmount(model string, inputTokens, outputTokens int) float64 {
	inputUnits := float64(max(1, inputTokens)) / 1000.0
	outputUnits := float64(max(1, outputTokens)) / 1000.0
	base := modelUnitPrice(model)
	return (inputUnits + outputUnits) * base
}

func modelUnitPrice(model string) float64 {
	switch strings.TrimSpace(model) {
	case "chat-basic":
		return 0.0025
	case "chat-pro":
		return 0.0100
	case "reasoning-pro":
		return 0.0200
	case "vision-pro":
		return 0.0150
	case "embedding-large":
		return 0.0010
	default:
		return 0.0050
	}
}

func formatAmount(v float64) string {
	return fmt.Sprintf("%.6f", v)
}

func parseAmount(v string) float64 {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
	if err != nil {
		return 0
	}
	return parsed
}

func holdAmountFromRequest(v string, fallback float64) float64 {
	parsed := parseAmount(v)
	if parsed <= 0 {
		return fallback * 1.20
	}
	return parsed
}

func settlementStatus(streamStatus string) string {
	switch fallbackStreamStatus(streamStatus) {
	case "completed":
		return "settled"
	case "partial":
		return "partially_settled"
	default:
		return "compensated"
	}
}

func fallbackStreamStatus(v string) string {
	v = strings.TrimSpace(v)
	if v == "" {
		return "completed"
	}
	return v
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
