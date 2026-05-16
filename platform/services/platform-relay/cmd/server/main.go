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

const defaultServiceName = "platform-relay"

var requestCount atomic.Uint64

type app struct {
	serviceName      string
	role             string
	startedAt        time.Time
	httpClient       *http.Client
	newAPIBaseURL    string
	newAPIAuthToken  string
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
	Name     string `json:"name"`
	URL      string `json:"url"`
	Ready    bool   `json:"ready"`
	Status   string `json:"status"`
	RootInit bool   `json:"root_init"`
}

type relayChatRequest struct {
	RequestID        string                 `json:"request_id"`
	TraceID          string                 `json:"trace_id"`
	OrganizationID   uint64                 `json:"organization_id"`
	ProjectID        uint64                 `json:"project_id"`
	APIKeyID         uint64                 `json:"api_key_id"`
	ExternalModel    string                 `json:"external_model_name"`
	PolicyCode       string                 `json:"policy_code"`
	RouteHint        map[string]any         `json:"route_hint"`
	OpenAIRequest    map[string]any         `json:"openai_request"`
}

type relayChatResponse struct {
	Success            bool                   `json:"success"`
	RequestID          string                 `json:"request_id"`
	TraceID            string                 `json:"trace_id"`
	UpstreamStatusCode int                    `json:"upstream_status_code"`
	ResponseJSON       map[string]any         `json:"response_json,omitempty"`
	Usage              relayUsage             `json:"usage,omitempty"`
	ErrorCode          string                 `json:"error_code,omitempty"`
	Message            string                 `json:"message,omitempty"`
	Metadata           map[string]any         `json:"metadata,omitempty"`
}

type relayUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

func main() {
	startedAt := time.Now()
	serviceName := getenv("SERVICE_NAME", defaultServiceName)
	role := getenv("SERVICE_ROLE", "relay")
	port := getenv("SERVICE_PORT", "8080")
	addr := ":" + port

	app := &app{
		serviceName:     serviceName,
		role:            role,
		startedAt:       startedAt,
		httpClient:      &http.Client{Timeout: 120 * time.Second},
		newAPIBaseURL:   strings.TrimRight(getenv("NEW_API_BASE_URL", "http://new-api:3000"), "/"),
		newAPIAuthToken: strings.TrimSpace(getenv("NEW_API_INTERNAL_TOKEN", "")),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", app.handleRoot)
	mux.HandleFunc("/healthz", app.handleHealthz)
	mux.HandleFunc("/readyz", app.handleReadyz)
	mux.HandleFunc("/v1/info", app.handleInfo)
	mux.HandleFunc("/v1/echo", app.handleEcho)
	mux.HandleFunc("/internal/relay/chat-completions", app.handleRelayChatCompletions)
	mux.HandleFunc("/internal/relay/chat-completions/stream", app.handleRelayChatCompletionsStream)
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
	_, _ = w.Write([]byte(fmt.Sprintf("<h1>%s</h1><p>Relay to new-api is running.</p>", a.serviceName)))
}

func (a *app) handleHealthz(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": a.serviceName, "status": "ok"})
}

func (a *app) handleReadyz(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	status, err := a.inspectNewAPI(ctx)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"success": false,
			"service": a.serviceName,
			"status":  "new_api_unreachable",
			"error":   err.Error(),
		})
		return
	}

	code := http.StatusOK
	ready := status.Ready
	state := "ready"
	if !ready {
		code = http.StatusServiceUnavailable
		state = "not_ready"
	}

	writeJSON(w, code, map[string]any{
		"success":      ready,
		"service":      a.serviceName,
		"status":       state,
		"dependencies": []dependencyStatus{status},
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
			"policy_base_url":   getenv("POLICY_BASE_URL", ""),
			"risk_base_url":     getenv("RISK_BASE_URL", ""),
			"billing_base_url":  getenv("BILLING_BASE_URL", ""),
			"new_api_base_url":  a.newAPIBaseURL,
			"new_api_auth_mode": boolLabel(a.newAPIAuthToken != ""),
			"redis_addr":        getenv("REDIS_ADDR", ""),
			"nats_url":          getenv("NATS_URL", ""),
		},
	})
}

func (a *app) handleEcho(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "service": a.serviceName, "path": r.URL.Path})
}

func (a *app) handleRelayChatCompletions(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error_code": "method_not_allowed"})
		return
	}

	var req relayChatRequest
	if err := decodeJSON(r, &req); err != nil {
		requestID := fallbackRequestID(req.RequestID)
		traceID := fallbackTraceID(req.TraceID)
		writeJSON(w, http.StatusBadRequest, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "invalid_json",
			Message:   err.Error(),
		})
		return
	}

	requestID := fallbackRequestID(req.RequestID)
	traceID := fallbackTraceID(req.TraceID)

	if a.newAPIAuthToken == "" {
		writeJSON(w, http.StatusServiceUnavailable, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "missing_new_api_internal_token",
			Message:   "NEW_API_INTERNAL_TOKEN is required",
		})
		return
	}

	if strings.TrimSpace(req.ExternalModel) == "" || len(req.OpenAIRequest) == 0 {
		writeJSON(w, http.StatusBadRequest, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "missing_required_fields",
			Message:   "external_model_name and openai_request are required",
		})
		return
	}

	if stream, ok := req.OpenAIRequest["stream"].(bool); ok && stream {
		writeJSON(w, http.StatusBadRequest, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "stream_not_supported_yet",
			Message:   "relay v1 currently supports stream=false only",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 120*time.Second)
	defer cancel()

	upstreamResp, statusCode, err := a.callNewAPIChatCompletions(ctx, requestID, traceID, req.OpenAIRequest)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, relayChatResponse{
			Success:            false,
			RequestID:          requestID,
			TraceID:            traceID,
			UpstreamStatusCode: http.StatusBadGateway,
			ErrorCode:          "new_api_unreachable",
			Message:            err.Error(),
		})
		return
	}

	if statusCode >= 400 {
		writeJSON(w, statusCode, relayChatResponse{
			Success:            false,
			RequestID:          requestID,
			TraceID:            traceID,
			UpstreamStatusCode: statusCode,
			ResponseJSON:       upstreamResp,
			ErrorCode:          extractUpstreamErrorCode(upstreamResp),
			Message:            extractUpstreamErrorMessage(upstreamResp),
			Metadata: map[string]any{
				"external_model_name": req.ExternalModel,
				"policy_code":         req.PolicyCode,
				"route_hint":          req.RouteHint,
				"source":              "new-api",
			},
		})
		return
	}

	writeJSON(w, http.StatusOK, relayChatResponse{
		Success:            true,
		RequestID:          requestID,
		TraceID:            traceID,
		UpstreamStatusCode: statusCode,
		ResponseJSON:       upstreamResp,
		Usage:              extractUsage(upstreamResp),
		Metadata: map[string]any{
			"external_model_name": req.ExternalModel,
			"policy_code":         req.PolicyCode,
			"route_hint":          req.RouteHint,
			"source":              "new-api",
		},
	})
}

func (a *app) handleRelayChatCompletionsStream(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"success": false, "error_code": "method_not_allowed"})
		return
	}

	var req relayChatRequest
	if err := decodeJSON(r, &req); err != nil {
		requestID := fallbackRequestID(req.RequestID)
		traceID := fallbackTraceID(req.TraceID)
		writeJSON(w, http.StatusBadRequest, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "invalid_json",
			Message:   err.Error(),
		})
		return
	}

	requestID := fallbackRequestID(req.RequestID)
	traceID := fallbackTraceID(req.TraceID)

	if a.newAPIAuthToken == "" {
		writeJSON(w, http.StatusServiceUnavailable, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "missing_new_api_internal_token",
			Message:   "NEW_API_INTERNAL_TOKEN is required",
		})
		return
	}

	if strings.TrimSpace(req.ExternalModel) == "" || len(req.OpenAIRequest) == 0 {
		writeJSON(w, http.StatusBadRequest, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "missing_required_fields",
			Message:   "external_model_name and openai_request are required",
		})
		return
	}

	stream, _ := req.OpenAIRequest["stream"].(bool)
	if !stream {
		writeJSON(w, http.StatusBadRequest, relayChatResponse{
			Success:   false,
			RequestID: requestID,
			TraceID:   traceID,
			ErrorCode: "stream_flag_required",
			Message:   "relay stream endpoint requires openai_request.stream=true",
		})
		return
	}

	upstreamResp, err := a.openNewAPIChatCompletionsStream(r.Context(), requestID, traceID, req.OpenAIRequest)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, relayChatResponse{
			Success:            false,
			RequestID:          requestID,
			TraceID:            traceID,
			UpstreamStatusCode: http.StatusBadGateway,
			ErrorCode:          "new_api_unreachable",
			Message:            err.Error(),
		})
		return
	}
	defer upstreamResp.Body.Close()

	for key, values := range upstreamResp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.Header().Set("X-Request-Id", requestID)
	w.Header().Set("X-Trace-Id", traceID)
	if strings.TrimSpace(w.Header().Get("Content-Type")) == "" {
		w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	}
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(upstreamResp.StatusCode)

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	buffer := make([]byte, 4096)
	for {
		n, err := upstreamResp.Body.Read(buffer)
		if n > 0 {
			if _, writeErr := w.Write(buffer[:n]); writeErr != nil {
				log.Printf("[%s] relay stream write failed: request_id=%s trace_id=%s error=%v", a.serviceName, requestID, traceID, writeErr)
				return
			}
			flusher.Flush()
		}
		if err != nil {
			if !errors.Is(err, io.EOF) {
				log.Printf("[%s] relay stream read failed: request_id=%s trace_id=%s error=%v", a.serviceName, requestID, traceID, err)
			}
			return
		}
	}
}

func (a *app) handleMetrics(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	_, _ = fmt.Fprintf(w, "service_info{service=%q,role=%q,env=%q} 1\n", a.serviceName, a.role, getenv("APP_ENV", "development"))
	_, _ = fmt.Fprintf(w, "service_uptime_seconds %.0f\n", time.Since(a.startedAt).Seconds())
	_, _ = fmt.Fprintf(w, "service_http_requests_total %d\n", requestCount.Load())
}

func (a *app) inspectNewAPI(ctx context.Context) (dependencyStatus, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, a.newAPIBaseURL+"/api/status", nil)
	if err != nil {
		return dependencyStatus{}, err
	}

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return dependencyStatus{}, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return dependencyStatus{}, err
	}

	type newAPIStatusEnvelope struct {
		Success bool `json:"success"`
		Data struct {
			Setup    bool `json:"setup"`
			RootInit bool `json:"root_init"`
			Status   bool `json:"status"`
		} `json:"data"`
	}

	status := dependencyStatus{
		Name: "new-api",
		URL:  a.newAPIBaseURL,
	}

	if resp.StatusCode >= 400 {
		status.Ready = false
		status.Status = "http_" + strconv.Itoa(resp.StatusCode)
		return status, nil
	}

	var parsed newAPIStatusEnvelope
	if err := json.Unmarshal(raw, &parsed); err != nil {
		status.Ready = false
		status.Status = "invalid_status_payload"
		return status, nil
	}

	status.RootInit = parsed.Data.Setup || parsed.Data.RootInit
	status.Ready = parsed.Success && status.RootInit
	if status.Ready {
		status.Status = "ready"
	} else {
		status.Status = "setup_required"
	}
	return status, nil
}

func (a *app) callNewAPIChatCompletions(ctx context.Context, requestID, traceID string, payload map[string]any) (map[string]any, int, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, 0, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.newAPIBaseURL+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", "Bearer "+a.newAPIAuthToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Request-Id", requestID)
	req.Header.Set("X-Trace-Id", traceID)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, resp.StatusCode, err
	}

	if len(strings.TrimSpace(string(raw))) == 0 {
		return map[string]any{}, resp.StatusCode, nil
	}

	var parsed map[string]any
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return map[string]any{
			"raw_response": string(raw),
		}, resp.StatusCode, nil
	}
	return parsed, resp.StatusCode, nil
}

func (a *app) openNewAPIChatCompletionsStream(ctx context.Context, requestID, traceID string, payload map[string]any) (*http.Response, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.newAPIBaseURL+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+a.newAPIAuthToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("X-Request-Id", requestID)
	req.Header.Set("X-Trace-Id", traceID)

	streamClient := &http.Client{}
	return streamClient.Do(req)
}

func extractUsage(payload map[string]any) relayUsage {
	usageMap, _ := payload["usage"].(map[string]any)
	return relayUsage{
		PromptTokens:     intValue(usageMap["prompt_tokens"]),
		CompletionTokens: intValue(usageMap["completion_tokens"]),
		TotalTokens:      intValue(usageMap["total_tokens"]),
	}
}

func extractUpstreamErrorCode(payload map[string]any) string {
	errorMap, _ := payload["error"].(map[string]any)
	return stringValue(errorMap["code"], "upstream_error")
}

func extractUpstreamErrorMessage(payload map[string]any) string {
	errorMap, _ := payload["error"].(map[string]any)
	return stringValue(errorMap["message"], "upstream request failed")
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

func stringValue(v any, fallback string) string {
	switch value := v.(type) {
	case string:
		if strings.TrimSpace(value) != "" {
			return value
		}
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
	case json.Number:
		parsed, _ := value.Int64()
		return int(parsed)
	}
	return 0
}

func boolLabel(v bool) string {
	if v {
		return "configured"
	}
	return "missing"
}
