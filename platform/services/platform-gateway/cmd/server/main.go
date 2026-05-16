package main

import (
	"bytes"
	"context"
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
)

const defaultServiceName = "platform-gateway"

var requestCount atomic.Uint64

type app struct {
	serviceName    string
	role           string
	startedAt      time.Time
	httpClient     *http.Client
	authBaseURL    string
	policyBaseURL  string
	billingBaseURL string
	riskBaseURL    string
	relayBaseURL   string
	newAPIBaseURL  string
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

type dependencyStatus struct {
	Name   string `json:"name"`
	URL    string `json:"url"`
	Ready  bool   `json:"ready"`
	Status string `json:"status"`
}

type chatCompletionRequest struct {
	Model     string        `json:"model"`
	Messages  []chatMessage `json:"messages"`
	MaxTokens int           `json:"max_tokens"`
	Stream    bool          `json:"stream"`
	User      string        `json:"user"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

type chatCompletionResponse struct {
	ID                string                   `json:"id"`
	Object            string                   `json:"object"`
	Created           int64                    `json:"created"`
	Model             string                   `json:"model"`
	Choices           []chatCompletionChoice   `json:"choices"`
	Usage             usagePayload             `json:"usage"`
	SystemFingerprint string                   `json:"system_fingerprint,omitempty"`
	RequestID         string                   `json:"request_id"`
	TraceID           string                   `json:"trace_id"`
	Metadata          map[string]any           `json:"metadata,omitempty"`
}

type chatCompletionChoice struct {
	Index        int               `json:"index"`
	Message      assistantMessage  `json:"message"`
	FinishReason string            `json:"finish_reason"`
}

type assistantMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type usagePayload struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type gatewayErrorEnvelope struct {
	Error     gatewayError `json:"error"`
	RequestID string       `json:"request_id"`
	TraceID   string       `json:"trace_id"`
}

type gatewayError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Code    string `json:"code"`
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
	APIKeyID           uint64            `json:"api_key_id"`
	OrganizationID     uint64            `json:"organization_id"`
	ProjectID          uint64            `json:"project_id"`
	UserID             uint64            `json:"user_id"`
	APIKeyPrefix       string            `json:"api_key_prefix"`
	KeyStatus          string            `json:"key_status"`
	OrganizationStatus string            `json:"organization_status"`
	ProjectStatus      string            `json:"project_status"`
	Scopes             []string          `json:"scopes"`
	Metadata           map[string]string `json:"metadata"`
	ErrorCode          string            `json:"error_code"`
	Message            string            `json:"message"`
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
	PolicyCode      string                 `json:"policy_code"`
	PricePlanCode   string                 `json:"price_plan_code"`
	Limits          map[string]any         `json:"limits"`
	RouteHint       map[string]any         `json:"route_hint"`
	DecisionContext map[string]any         `json:"decision_context"`
	ErrorCode       string                 `json:"error_code"`
	Message         string                 `json:"message"`
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
	HoldID            string         `json:"hold_id"`
	HoldAmount        string         `json:"hold_amount"`
	Currency          string         `json:"currency"`
	PriceSnapshotCode string         `json:"price_snapshot_code"`
	AccountMode       string         `json:"account_mode"`
	DecisionContext   map[string]any `json:"decision_context"`
	ErrorCode         string         `json:"error_code"`
	Message           string         `json:"message"`
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
	HoldID           string         `json:"hold_id"`
	CapturedAmount   string         `json:"captured_amount"`
	ReleasedAmount   string         `json:"released_amount"`
	Currency         string         `json:"currency"`
	SettlementStatus string         `json:"settlement_status"`
	UsageRecordID    string         `json:"usage_record_id"`
	LedgerEntryIDs   []string       `json:"ledger_entry_ids"`
	DecisionContext  map[string]any `json:"decision_context"`
	ErrorCode        string         `json:"error_code"`
	Message          string         `json:"message"`
}

type relayChatRequest struct {
	RequestID      string         `json:"request_id"`
	TraceID        string         `json:"trace_id"`
	OrganizationID uint64         `json:"organization_id"`
	ProjectID      uint64         `json:"project_id"`
	APIKeyID       uint64         `json:"api_key_id"`
	ExternalModel  string         `json:"external_model_name"`
	PolicyCode     string         `json:"policy_code"`
	RouteHint      map[string]any `json:"route_hint"`
	OpenAIRequest  map[string]any `json:"openai_request"`
}

type relayChatResponse struct {
	Success            bool                   `json:"success"`
	RequestID          string                 `json:"request_id"`
	TraceID            string                 `json:"trace_id"`
	UpstreamStatusCode int                    `json:"upstream_status_code"`
	ResponseJSON       map[string]any         `json:"response_json"`
	Usage              usagePayload           `json:"usage"`
	ErrorCode          string                 `json:"error_code"`
	Message            string                 `json:"message"`
	Metadata           map[string]any         `json:"metadata"`
}

func main() {
	startedAt := time.Now()
	serviceName := getenv("SERVICE_NAME", defaultServiceName)
	role := getenv("SERVICE_ROLE", "gateway")
	port := getenv("SERVICE_PORT", "8080")
	addr := ":" + port

	app := &app{
		serviceName:    serviceName,
		role:           role,
		startedAt:      startedAt,
		httpClient:     &http.Client{Timeout: 12 * time.Second},
		authBaseURL:    strings.TrimRight(getenv("AUTH_BASE_URL", "http://auth:8080"), "/"),
		policyBaseURL:  strings.TrimRight(getenv("POLICY_BASE_URL", "http://policy:8080"), "/"),
		billingBaseURL: strings.TrimRight(getenv("BILLING_BASE_URL", "http://billing:8080"), "/"),
		riskBaseURL:    strings.TrimRight(getenv("RISK_BASE_URL", "http://risk:8080"), "/"),
		relayBaseURL:   strings.TrimRight(getenv("RELAY_BASE_URL", "http://relay:8080"), "/"),
		newAPIBaseURL:  strings.TrimRight(getenv("NEW_API_BASE_URL", "http://new-api:3000"), "/"),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", app.handleRoot)
	mux.HandleFunc("/healthz", app.handleHealthz)
	mux.HandleFunc("/readyz", app.handleReadyz)
	mux.HandleFunc("/v1/info", app.handleInfo)
	mux.HandleFunc("/v1/echo", app.handleEcho)
	mux.HandleFunc("/v1/chat/completions", app.handleChatCompletions)
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
	_, _ = w.Write([]byte(fmt.Sprintf(`
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>%s</title></head>
  <body style="font-family: sans-serif; padding: 32px;">
    <h1>%s</h1>
    <p>Gateway v1 chain is running: gateway -> auth -> policy -> billing -> relay -> new-api.</p>
    <ul>
      <li><a href="/healthz">/healthz</a></li>
      <li><a href="/readyz">/readyz</a></li>
      <li><a href="/v1/info">/v1/info</a></li>
      <li><a href="/metrics">/metrics</a></li>
    </ul>
  </body>
</html>`, a.serviceName, a.serviceName)))
}

func (a *app) handleHealthz(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"service": a.serviceName,
		"status":  "ok",
		"mode":    "gateway-chain-v1",
	})
}

func (a *app) handleReadyz(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)

	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()

	deps := []dependencyStatus{
		a.checkDependency(ctx, "auth", a.authBaseURL),
		a.checkDependency(ctx, "policy", a.policyBaseURL),
		a.checkDependency(ctx, "billing", a.billingBaseURL),
		a.checkDependency(ctx, "relay", a.relayBaseURL),
	}

	allReady := true
	for _, dep := range deps {
		if !dep.Ready {
			allReady = false
			break
		}
	}

	statusCode := http.StatusOK
	status := "ready"
	if !allReady {
		statusCode = http.StatusServiceUnavailable
		status = "not_ready"
	}

	writeJSON(w, statusCode, map[string]any{
		"success":      allReady,
		"service":      a.serviceName,
		"status":       status,
		"dependencies": deps,
	})
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
			"auth_base_url":    a.authBaseURL,
			"billing_base_url": a.billingBaseURL,
			"policy_base_url":  a.policyBaseURL,
			"risk_base_url":    a.riskBaseURL,
			"relay_base_url":   a.relayBaseURL,
			"new_api_base_url": a.newAPIBaseURL,
			"mysql_dsn":        maskDSN(getenv("MYSQL_DSN", "")),
			"redis_addr":       getenv("REDIS_ADDR", ""),
			"nats_url":         getenv("NATS_URL", ""),
		},
	})
}

func (a *app) handleEcho(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"service": a.serviceName,
		"method":  r.Method,
		"path":    r.URL.Path,
		"query":   r.URL.RawQuery,
	})
}

func (a *app) handleChatCompletions(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeGatewayError(w, http.StatusMethodNotAllowed, fallbackRequestID(""), fallbackTraceID(""), "method_not_allowed", "only POST is supported")
		return
	}

	requestID := firstNonEmpty(strings.TrimSpace(r.Header.Get("X-Request-Id")), fallbackRequestID(""))
	traceID := firstNonEmpty(strings.TrimSpace(r.Header.Get("X-Trace-Id")), fallbackTraceID(""))
	idempotencyKey := firstNonEmpty(strings.TrimSpace(r.Header.Get("Idempotency-Key")), "idem_"+requestID)

	apiKey := extractBearerToken(r)
	if apiKey == "" {
		writeGatewayError(w, http.StatusUnauthorized, requestID, traceID, "missing_bearer_token", "Authorization: Bearer <api_key> is required")
		return
	}

	var req chatCompletionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeGatewayError(w, http.StatusBadRequest, requestID, traceID, "invalid_json", err.Error())
		return
	}

	if strings.TrimSpace(req.Model) == "" || len(req.Messages) == 0 {
		writeGatewayError(w, http.StatusBadRequest, requestID, traceID, "missing_required_fields", "model and messages are required")
		return
	}
	if req.Stream {
		a.handleStreamChatCompletions(w, r, req, apiKey, requestID, traceID, idempotencyKey)
		return
	}
	if req.MaxTokens <= 0 {
		req.MaxTokens = 256
	}

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	authResp, statusCode, err := a.callValidateKey(ctx, validateKeyRequest{
		APIKey:    apiKey,
		RequestID: requestID,
		TraceID:   traceID,
	})
	if err != nil {
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "auth_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !authResp.Success || !authResp.Valid {
		writeGatewayError(w, mapGatewayStatus(statusCode, http.StatusUnauthorized), requestID, traceID, firstNonEmpty(authResp.ErrorCode, "auth_rejected"), firstNonEmpty(authResp.Message, "api key validation failed"))
		return
	}

	policyResp, statusCode, err := a.callPolicyCheck(ctx, policyCheckRequest{
		RequestID:      requestID,
		TraceID:        traceID,
		OrganizationID: authResp.OrganizationID,
		ProjectID:      authResp.ProjectID,
		APIKeyID:       authResp.APIKeyID,
		Model:          strings.TrimSpace(req.Model),
		Region:         fallbackRegion(r.Header.Get("X-Region")),
	})
	if err != nil {
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "policy_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !policyResp.Success || !policyResp.Allowed {
		writeGatewayError(w, mapGatewayStatus(statusCode, http.StatusForbidden), requestID, traceID, firstNonEmpty(policyResp.ErrorCode, "policy_rejected"), firstNonEmpty(policyResp.Message, "policy check failed"))
		return
	}

	promptTokens := estimatePromptTokens(req.Messages)
	preauthResp, statusCode, err := a.callPreauthorize(ctx, preauthorizeRequest{
		RequestID:           requestID,
		TraceID:             traceID,
		OrganizationID:      authResp.OrganizationID,
		ProjectID:           authResp.ProjectID,
		APIKeyID:            authResp.APIKeyID,
		Model:               strings.TrimSpace(req.Model),
		MaxTokens:           req.MaxTokens,
		InputTokensEstimate: promptTokens,
		IdempotencyKey:      idempotencyKey,
	})
	if err != nil {
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "billing_preauthorize_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !preauthResp.Success || !preauthResp.Allowed {
		writeGatewayError(w, mapGatewayStatus(statusCode, http.StatusPaymentRequired), requestID, traceID, firstNonEmpty(preauthResp.ErrorCode, "preauthorize_rejected"), firstNonEmpty(preauthResp.Message, "preauthorization failed"))
		return
	}

	relayResp, statusCode, err := a.callRelayChatCompletions(ctx, relayChatRequest{
		RequestID:      requestID,
		TraceID:        traceID,
		OrganizationID: authResp.OrganizationID,
		ProjectID:      authResp.ProjectID,
		APIKeyID:       authResp.APIKeyID,
		ExternalModel:  strings.TrimSpace(req.Model),
		PolicyCode:     policyResp.PolicyCode,
		RouteHint:      policyResp.RouteHint,
		OpenAIRequest: map[string]any{
			"model":      strings.TrimSpace(req.Model),
			"messages":   req.Messages,
			"max_tokens": req.MaxTokens,
			"stream":     false,
			"user":       strings.TrimSpace(req.User),
		},
	})
	if err != nil {
		a.compensateHold(requestID, traceID, preauthResp.HoldID, authResp.OrganizationID, authResp.ProjectID, authResp.APIKeyID, strings.TrimSpace(req.Model), preauthResp.HoldAmount, idempotencyKey)
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "relay_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !relayResp.Success {
		a.compensateHold(requestID, traceID, preauthResp.HoldID, authResp.OrganizationID, authResp.ProjectID, authResp.APIKeyID, strings.TrimSpace(req.Model), preauthResp.HoldAmount, idempotencyKey)
		writeRelayError(
			w,
			mapGatewayStatus(statusCode, http.StatusBadGateway),
			requestID,
			traceID,
			firstNonEmpty(relayResp.ErrorCode, "relay_upstream_error"),
			firstNonEmpty(relayResp.Message, "relay request failed"),
			relayResp.ResponseJSON,
		)
		return
	}

	upstreamPayload := cloneMap(relayResp.ResponseJSON)
	if len(upstreamPayload) == 0 {
		a.compensateHold(requestID, traceID, preauthResp.HoldID, authResp.OrganizationID, authResp.ProjectID, authResp.APIKeyID, strings.TrimSpace(req.Model), preauthResp.HoldAmount, idempotencyKey)
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "empty_upstream_payload", "relay returned an empty response payload")
		return
	}

	usage := relayResp.Usage
	if usage.PromptTokens <= 0 {
		usage.PromptTokens = promptTokens
	}
	if usage.CompletionTokens <= 0 {
		usage.CompletionTokens = extractCompletionTokensFromResponse(upstreamPayload)
	}
	if usage.TotalTokens <= 0 {
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
	}
	providerCost := formatAmount(estimateProviderCost(req.Model, usage.PromptTokens, usage.CompletionTokens))

	finalizeResp, statusCode, err := a.callFinalize(ctx, finalizeRequest{
		RequestID:        requestID,
		TraceID:          traceID,
		HoldID:           preauthResp.HoldID,
		OrganizationID:   authResp.OrganizationID,
		ProjectID:        authResp.ProjectID,
		APIKeyID:         authResp.APIKeyID,
		Model:            strings.TrimSpace(req.Model),
		InputTokens:      usage.PromptTokens,
		OutputTokens:     usage.CompletionTokens,
		ProviderCost:     providerCost,
		AuthorizedAmount: preauthResp.HoldAmount,
		StreamStatus:     "completed",
		IdempotencyKey:   idempotencyKey,
	})
	if err != nil {
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "billing_finalize_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !finalizeResp.Success || !finalizeResp.Settled {
		writeGatewayError(w, mapGatewayStatus(statusCode, http.StatusBadGateway), requestID, traceID, firstNonEmpty(finalizeResp.ErrorCode, "finalize_failed"), firstNonEmpty(finalizeResp.Message, "final settlement failed"))
		return
	}

	w.Header().Set("X-Request-Id", requestID)
	w.Header().Set("X-Trace-Id", traceID)
	w.Header().Set("X-Hold-Id", preauthResp.HoldID)
	w.Header().Set("X-Usage-Record-Id", finalizeResp.UsageRecordID)
	w.Header().Set("X-Gateway-Mode", "chain-v1-relay")

	upstreamPayload["request_id"] = requestID
	upstreamPayload["trace_id"] = traceID
	upstreamPayload["metadata"] = mergeMetadata(asMap(upstreamPayload["metadata"]), map[string]any{
		"organization_id": authResp.OrganizationID,
		"project_id":      authResp.ProjectID,
		"api_key_id":      authResp.APIKeyID,
		"policy_code":     policyResp.PolicyCode,
		"price_plan_code": policyResp.PricePlanCode,
		"hold_id":         preauthResp.HoldID,
		"hold_amount":     preauthResp.HoldAmount,
		"usage_record_id": finalizeResp.UsageRecordID,
		"provider_cost":   providerCost,
		"route_hint":      policyResp.RouteHint,
		"gateway_mode":    "gateway-auth-policy-billing-relay-v1",
	})
	if _, ok := upstreamPayload["usage"]; !ok {
		upstreamPayload["usage"] = usage
	}

	writeJSON(w, http.StatusOK, upstreamPayload)
}

func (a *app) handleStreamChatCompletions(
	w http.ResponseWriter,
	r *http.Request,
	req chatCompletionRequest,
	apiKey string,
	requestID string,
	traceID string,
	idempotencyKey string,
) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeGatewayError(w, http.StatusInternalServerError, requestID, traceID, "streaming_unsupported", "response writer does not support streaming")
		return
	}

	setupCtx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	authResp, statusCode, err := a.callValidateKey(setupCtx, validateKeyRequest{
		APIKey:    apiKey,
		RequestID: requestID,
		TraceID:   traceID,
	})
	if err != nil {
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "auth_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !authResp.Success || !authResp.Valid {
		writeGatewayError(w, mapGatewayStatus(statusCode, http.StatusUnauthorized), requestID, traceID, firstNonEmpty(authResp.ErrorCode, "auth_rejected"), firstNonEmpty(authResp.Message, "api key validation failed"))
		return
	}

	policyResp, statusCode, err := a.callPolicyCheck(setupCtx, policyCheckRequest{
		RequestID:      requestID,
		TraceID:        traceID,
		OrganizationID: authResp.OrganizationID,
		ProjectID:      authResp.ProjectID,
		APIKeyID:       authResp.APIKeyID,
		Model:          strings.TrimSpace(req.Model),
		Region:         fallbackRegion(r.Header.Get("X-Region")),
	})
	if err != nil {
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "policy_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !policyResp.Success || !policyResp.Allowed {
		writeGatewayError(w, mapGatewayStatus(statusCode, http.StatusForbidden), requestID, traceID, firstNonEmpty(policyResp.ErrorCode, "policy_rejected"), firstNonEmpty(policyResp.Message, "policy check failed"))
		return
	}

	promptTokens := estimatePromptTokens(req.Messages)
	preauthResp, statusCode, err := a.callPreauthorize(setupCtx, preauthorizeRequest{
		RequestID:           requestID,
		TraceID:             traceID,
		OrganizationID:      authResp.OrganizationID,
		ProjectID:           authResp.ProjectID,
		APIKeyID:            authResp.APIKeyID,
		Model:               strings.TrimSpace(req.Model),
		MaxTokens:           req.MaxTokens,
		InputTokensEstimate: promptTokens,
		IdempotencyKey:      idempotencyKey,
	})
	if err != nil {
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "billing_preauthorize_unreachable", err.Error())
		return
	}
	if statusCode >= 400 || !preauthResp.Success || !preauthResp.Allowed {
		writeGatewayError(w, mapGatewayStatus(statusCode, http.StatusPaymentRequired), requestID, traceID, firstNonEmpty(preauthResp.ErrorCode, "preauthorize_rejected"), firstNonEmpty(preauthResp.Message, "preauthorization failed"))
		return
	}

	relayResp, err := a.callRelayChatCompletionsStream(r.Context(), relayChatRequest{
		RequestID:      requestID,
		TraceID:        traceID,
		OrganizationID: authResp.OrganizationID,
		ProjectID:      authResp.ProjectID,
		APIKeyID:       authResp.APIKeyID,
		ExternalModel:  strings.TrimSpace(req.Model),
		PolicyCode:     policyResp.PolicyCode,
		RouteHint:      policyResp.RouteHint,
		OpenAIRequest: map[string]any{
			"model":      strings.TrimSpace(req.Model),
			"messages":   req.Messages,
			"max_tokens": req.MaxTokens,
			"stream":     true,
			"stream_options": map[string]any{
				"include_usage": true,
			},
			"user": strings.TrimSpace(req.User),
		},
	})
	if err != nil {
		a.compensateHold(requestID, traceID, preauthResp.HoldID, authResp.OrganizationID, authResp.ProjectID, authResp.APIKeyID, strings.TrimSpace(req.Model), preauthResp.HoldAmount, idempotencyKey)
		writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "relay_unreachable", err.Error())
		return
	}
	defer relayResp.Body.Close()

	if relayResp.StatusCode >= 400 || !strings.Contains(strings.ToLower(relayResp.Header.Get("Content-Type")), "text/event-stream") {
		raw, readErr := io.ReadAll(io.LimitReader(relayResp.Body, 8<<20))
		if readErr != nil {
			a.compensateHold(requestID, traceID, preauthResp.HoldID, authResp.OrganizationID, authResp.ProjectID, authResp.APIKeyID, strings.TrimSpace(req.Model), preauthResp.HoldAmount, idempotencyKey)
			writeGatewayError(w, http.StatusBadGateway, requestID, traceID, "relay_stream_read_failed", readErr.Error())
			return
		}
		a.compensateHold(requestID, traceID, preauthResp.HoldID, authResp.OrganizationID, authResp.ProjectID, authResp.APIKeyID, strings.TrimSpace(req.Model), preauthResp.HoldAmount, idempotencyKey)
		if len(strings.TrimSpace(string(raw))) == 0 {
			writeGatewayError(w, mapGatewayStatus(relayResp.StatusCode, http.StatusBadGateway), requestID, traceID, "empty_upstream_payload", "relay returned an empty response payload")
			return
		}
		contentType := firstNonEmpty(relayResp.Header.Get("Content-Type"), "application/json")
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("X-Request-Id", requestID)
		w.Header().Set("X-Trace-Id", traceID)
		w.WriteHeader(mapGatewayStatus(relayResp.StatusCode, http.StatusBadGateway))
		_, _ = w.Write(raw)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("X-Request-Id", requestID)
	w.Header().Set("X-Trace-Id", traceID)
	w.Header().Set("X-Hold-Id", preauthResp.HoldID)
	w.Header().Set("X-Gateway-Mode", "chain-v1-relay-stream")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	parser := &sseStreamAccumulator{}
	buffer := make([]byte, 4096)
	streamStatus := "completed"

	for {
		n, readErr := relayResp.Body.Read(buffer)
		if n > 0 {
			chunk := buffer[:n]
			parser.consume(chunk)
			if _, writeErr := w.Write(chunk); writeErr != nil {
				streamStatus = "errored"
				log.Printf("[%s] gateway stream write failed: request_id=%s trace_id=%s error=%v", a.serviceName, requestID, traceID, writeErr)
				break
			}
			flusher.Flush()
		}

		if readErr != nil {
			if !errors.Is(readErr, io.EOF) {
				streamStatus = "errored"
				log.Printf("[%s] gateway stream read failed: request_id=%s trace_id=%s error=%v", a.serviceName, requestID, traceID, readErr)
			}
			break
		}
	}

	if !parser.done {
		streamStatus = "errored"
	}

	usage := parser.usage
	if usage.PromptTokens <= 0 {
		usage.PromptTokens = promptTokens
	}
	if usage.CompletionTokens <= 0 {
		usage.CompletionTokens = estimateTextTokens(parser.assistantText)
	}
	if usage.TotalTokens <= 0 {
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
	}

	finalizeCtx, finalizeCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer finalizeCancel()

	providerCost := formatAmount(estimateProviderCost(req.Model, usage.PromptTokens, usage.CompletionTokens))
	finalizeResp, statusCode, err := a.callFinalize(finalizeCtx, finalizeRequest{
		RequestID:        requestID,
		TraceID:          traceID,
		HoldID:           preauthResp.HoldID,
		OrganizationID:   authResp.OrganizationID,
		ProjectID:        authResp.ProjectID,
		APIKeyID:         authResp.APIKeyID,
		Model:            strings.TrimSpace(req.Model),
		InputTokens:      usage.PromptTokens,
		OutputTokens:     usage.CompletionTokens,
		ProviderCost:     providerCost,
		AuthorizedAmount: preauthResp.HoldAmount,
		StreamStatus:     streamStatus,
		IdempotencyKey:   idempotencyKey,
	})
	if err != nil {
		log.Printf("[%s] finalize after stream failed: request_id=%s trace_id=%s error=%v", a.serviceName, requestID, traceID, err)
		return
	}
	if statusCode >= 400 || !finalizeResp.Success || !finalizeResp.Settled {
		log.Printf("[%s] finalize after stream rejected: request_id=%s trace_id=%s status=%d code=%s message=%s", a.serviceName, requestID, traceID, statusCode, finalizeResp.ErrorCode, finalizeResp.Message)
	}
}

type sseStreamAccumulator struct {
	buffer        string
	assistantText string
	usage         usagePayload
	done          bool
}

func (s *sseStreamAccumulator) consume(chunk []byte) {
	s.buffer += string(chunk)
	for {
		boundary := strings.Index(s.buffer, "\n\n")
		if boundary == -1 {
			return
		}
		block := s.buffer[:boundary]
		s.buffer = s.buffer[boundary+2:]
		s.parseBlock(block)
	}
}

func (s *sseStreamAccumulator) parseBlock(block string) {
	block = strings.ReplaceAll(block, "\r\n", "\n")
	lines := strings.Split(block, "\n")
	dataLines := make([]string, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "data:") {
			dataLines = append(dataLines, strings.TrimSpace(strings.TrimPrefix(line, "data:")))
		}
	}
	if len(dataLines) == 0 {
		return
	}

	data := strings.Join(dataLines, "\n")
	if data == "[DONE]" {
		s.done = true
		return
	}

	var payload map[string]any
	if err := json.Unmarshal([]byte(data), &payload); err != nil {
		return
	}

	if usageMap, ok := payload["usage"].(map[string]any); ok {
		s.usage = usagePayload{
			PromptTokens:     intValue(usageMap["prompt_tokens"]),
			CompletionTokens: intValue(usageMap["completion_tokens"]),
			TotalTokens:      intValue(usageMap["total_tokens"]),
		}
	}

	choices, _ := payload["choices"].([]any)
	for _, choice := range choices {
		choiceMap, _ := choice.(map[string]any)
		delta, _ := choiceMap["delta"].(map[string]any)
		content := stringValue(delta["content"], "")
		if content == "" {
			content = stringValue(delta["reasoning_content"], "")
		}
		if content == "" {
			content = stringValue(delta["reasoning"], "")
		}
		if content != "" {
			s.assistantText += content
		}
	}
}

func (a *app) handleMetrics(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	_, _ = fmt.Fprintf(w, "# HELP service_info static service info\n")
	_, _ = fmt.Fprintf(w, "# TYPE service_info gauge\n")
	_, _ = fmt.Fprintf(w, "service_info{service=%q,role=%q,env=%q} 1\n", a.serviceName, a.role, getenv("APP_ENV", "development"))
	_, _ = fmt.Fprintf(w, "# HELP service_uptime_seconds service uptime in seconds\n")
	_, _ = fmt.Fprintf(w, "# TYPE service_uptime_seconds gauge\n")
	_, _ = fmt.Fprintf(w, "service_uptime_seconds %.0f\n", time.Since(a.startedAt).Seconds())
	_, _ = fmt.Fprintf(w, "# HELP service_http_requests_total total http requests handled\n")
	_, _ = fmt.Fprintf(w, "# TYPE service_http_requests_total counter\n")
	_, _ = fmt.Fprintf(w, "service_http_requests_total %d\n", requestCount.Load())
}

func (a *app) callValidateKey(ctx context.Context, payload validateKeyRequest) (validateKeyResponse, int, error) {
	var resp validateKeyResponse
	statusCode, err := a.postJSON(ctx, a.authBaseURL+"/internal/auth/validate-key", payload, &resp)
	return resp, statusCode, err
}

func (a *app) callPolicyCheck(ctx context.Context, payload policyCheckRequest) (policyCheckResponse, int, error) {
	var resp policyCheckResponse
	statusCode, err := a.postJSON(ctx, a.policyBaseURL+"/internal/policy/check", payload, &resp)
	return resp, statusCode, err
}

func (a *app) callPreauthorize(ctx context.Context, payload preauthorizeRequest) (preauthorizeResponse, int, error) {
	var resp preauthorizeResponse
	statusCode, err := a.postJSON(ctx, a.billingBaseURL+"/internal/billing/preauthorize", payload, &resp)
	return resp, statusCode, err
}

func (a *app) callFinalize(ctx context.Context, payload finalizeRequest) (finalizeResponse, int, error) {
	var resp finalizeResponse
	statusCode, err := a.postJSON(ctx, a.billingBaseURL+"/internal/billing/finalize", payload, &resp)
	return resp, statusCode, err
}

func (a *app) callRelayChatCompletions(ctx context.Context, payload relayChatRequest) (relayChatResponse, int, error) {
	var resp relayChatResponse
	statusCode, err := a.postJSON(ctx, a.relayBaseURL+"/internal/relay/chat-completions", payload, &resp)
	return resp, statusCode, err
}

func (a *app) callRelayChatCompletionsStream(ctx context.Context, payload relayChatRequest) (*http.Response, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.relayBaseURL+"/internal/relay/chat-completions/stream", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("Cache-Control", "no-cache")

	streamClient := &http.Client{}
	return streamClient.Do(req)
}

func (a *app) compensateHold(requestID, traceID, holdID string, organizationID, projectID, apiKeyID uint64, model, authorizedAmount, idempotencyKey string) {
	if strings.TrimSpace(holdID) == "" {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	_, _, err := a.callFinalize(ctx, finalizeRequest{
		RequestID:        requestID,
		TraceID:          traceID,
		HoldID:           holdID,
		OrganizationID:   organizationID,
		ProjectID:        projectID,
		APIKeyID:         apiKeyID,
		Model:            model,
		InputTokens:      0,
		OutputTokens:     0,
		ProviderCost:     "0.000000",
		AuthorizedAmount: authorizedAmount,
		StreamStatus:     "errored",
		IdempotencyKey:   idempotencyKey,
	})
	if err != nil {
		log.Printf("[%s] compensate hold failed: hold_id=%s request_id=%s error=%v", a.serviceName, holdID, requestID, err)
	}
}

func (a *app) postJSON(ctx context.Context, url string, payload any, out any) (int, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return 0, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return resp.StatusCode, err
	}
	if len(strings.TrimSpace(string(raw))) == 0 {
		return resp.StatusCode, nil
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return resp.StatusCode, fmt.Errorf("decode %s failed: %w", url, err)
	}
	return resp.StatusCode, nil
}

func (a *app) checkDependency(ctx context.Context, name, baseURL string) dependencyStatus {
	if strings.TrimSpace(baseURL) == "" {
		return dependencyStatus{Name: name, URL: baseURL, Ready: false, Status: "missing_url"}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"/readyz", nil)
	if err != nil {
		return dependencyStatus{Name: name, URL: baseURL, Ready: false, Status: err.Error()}
	}

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return dependencyStatus{Name: name, URL: baseURL, Ready: false, Status: err.Error()}
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return dependencyStatus{Name: name, URL: baseURL, Ready: false, Status: "http_" + strconv.Itoa(resp.StatusCode)}
	}
	return dependencyStatus{Name: name, URL: baseURL, Ready: true, Status: "ready"}
}

func estimatePromptTokens(messages []chatMessage) int {
	total := 0
	for _, message := range messages {
		total += estimateTextTokens(message.Role)
		total += estimateContentTokens(message.Content)
		total += 4
	}
	return max(1, total)
}

func estimateContentTokens(content any) int {
	switch value := content.(type) {
	case string:
		return estimateTextTokens(value)
	case []any:
		total := 0
		for _, item := range value {
			total += estimateContentPartTokens(item)
		}
		return max(1, total)
	case map[string]any:
		return estimateContentPartTokens(value)
	default:
		return estimateTextTokens(stringValue(value, ""))
	}
}

func estimateContentPartTokens(part any) int {
	partMap, ok := part.(map[string]any)
	if !ok {
		return estimateTextTokens(stringValue(part, ""))
	}

	switch strings.TrimSpace(stringValue(partMap["type"], "")) {
	case "text":
		return estimateTextTokens(stringValue(partMap["text"], ""))
	case "image_url":
		// 多模态图片输入在网关侧只做近似预估，这里给一个稳定的开发环境估值。
		return 512
	default:
		return estimateTextTokens(stringValue(partMap["text"], ""))
	}
}

func estimateTextTokens(text string) int {
	text = strings.TrimSpace(text)
	if text == "" {
		return 1
	}
	return max(1, (len([]rune(text))+3)/4)
}

func estimateProviderCost(model string, promptTokens, completionTokens int) float64 {
	unitPrice := 0.0020
	switch strings.TrimSpace(model) {
	case "chat-basic":
		unitPrice = 0.0010
	case "chat-pro":
		unitPrice = 0.0020
	case "reasoning-pro":
		unitPrice = 0.0060
	case "vision-pro":
		unitPrice = 0.0080
	case "embedding-large":
		unitPrice = 0.0006
	}
	return (float64(promptTokens+completionTokens) / 1000.0) * unitPrice * 0.55
}

func writeGatewayError(w http.ResponseWriter, status int, requestID, traceID, code, message string) {
	writeJSON(w, status, gatewayErrorEnvelope{
		Error: gatewayError{
			Message: message,
			Type:    "gateway_error",
			Code:    code,
		},
		RequestID: requestID,
		TraceID:   traceID,
	})
}

func writeRelayError(w http.ResponseWriter, status int, requestID, traceID, code, message string, payload map[string]any) {
	if len(payload) == 0 {
		writeGatewayError(w, status, requestID, traceID, code, message)
		return
	}

	body := cloneMap(payload)
	body["request_id"] = requestID
	body["trace_id"] = traceID

	if _, ok := body["error"]; !ok {
		body["error"] = map[string]any{
			"message": message,
			"type":    "relay_error",
			"code":    code,
		}
	}

	writeJSON(w, status, body)
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

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			return value
		}
	}
	return ""
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
	v = strings.TrimSpace(strings.ToLower(v))
	if v == "" {
		return "global"
	}
	return v
}

func extractBearerToken(r *http.Request) string {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if len(authorization) < 8 {
		return ""
	}
	if !strings.EqualFold(authorization[:7], "Bearer ") {
		return ""
	}
	return strings.TrimSpace(authorization[7:])
}

func stringValue(v any, fallback string) string {
	switch value := v.(type) {
	case string:
		if strings.TrimSpace(value) != "" {
			return value
		}
	case fmt.Stringer:
		return value.String()
	case float64:
		return strconv.FormatFloat(value, 'f', -1, 64)
	case int:
		return strconv.Itoa(value)
	}
	return fallback
}

func intValue(v any) int {
	switch value := v.(type) {
	case float64:
		return int(value)
	case int:
		return value
	case int64:
		return int(value)
	case json.Number:
		parsed, _ := value.Int64()
		return int(parsed)
	}
	return 0
}

func formatAmount(v float64) string {
	return strconv.FormatFloat(v, 'f', 6, 64)
}

func extractCompletionTokensFromResponse(payload map[string]any) int {
	choices, _ := payload["choices"].([]any)
	total := 0
	for _, choice := range choices {
		choiceMap, _ := choice.(map[string]any)
		if messageMap := asMap(choiceMap["message"]); len(messageMap) > 0 {
			total += estimateTextTokens(stringValue(messageMap["content"], ""))
			continue
		}
		total += estimateTextTokens(stringValue(choiceMap["text"], ""))
	}
	return max(1, total)
}

func cloneMap(in map[string]any) map[string]any {
	if len(in) == 0 {
		return map[string]any{}
	}
	out := make(map[string]any, len(in))
	for key, value := range in {
		out[key] = value
	}
	return out
}

func asMap(v any) map[string]any {
	m, _ := v.(map[string]any)
	if len(m) == 0 {
		return map[string]any{}
	}
	return cloneMap(m)
}

func mergeMetadata(base, extra map[string]any) map[string]any {
	merged := cloneMap(base)
	for key, value := range extra {
		merged[key] = value
	}
	return merged
}

func mapGatewayStatus(internalStatus, fallback int) int {
	if internalStatus >= 400 {
		return internalStatus
	}
	return fallback
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
