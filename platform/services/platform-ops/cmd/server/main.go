package main

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const defaultServiceName = "platform-ops"

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

type envelope struct {
	Data  any            `json:"data,omitempty"`
	Meta  map[string]any `json:"meta,omitempty"`
	Error *apiError      `json:"error,omitempty"`
}

type apiError struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

type presetActor struct {
	UserID      string
	Email       string
	DisplayName string
	OrgName     string
	Role        string
}

type filterPresetImportItem struct {
	Name       string         `json:"name"`
	Values     map[string]any `json:"values"`
	GroupName  string         `json:"groupName"`
	Tags       []string       `json:"tags"`
	Visibility string         `json:"visibility"`
	IsDefault  bool           `json:"isDefault"`
	IsPinned   bool           `json:"isPinned"`
	SortOrder  *int           `json:"sortOrder"`
}

type filterPresetImportPayload struct {
	Scope   string                   `json:"scope"`
	Presets []filterPresetImportItem `json:"presets"`
}

func main() {
	startedAt := time.Now()
	serviceName := getenv("SERVICE_NAME", defaultServiceName)
	role := getenv("SERVICE_ROLE", "operations")
	port := getenv("SERVICE_PORT", "8080")

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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := app.ensureConsoleTables(ctx); err != nil {
		log.Fatalf("[%s] failed to ensure console tables: %v", serviceName, err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", app.handleRoot)
	mux.HandleFunc("/healthz", app.handleHealthz)
	mux.HandleFunc("/readyz", app.handleReadyz)
	mux.HandleFunc("/metrics", app.handleMetrics)
	mux.HandleFunc("/v1/info", app.handleInfo)
	mux.HandleFunc("/v1/filter-presets", app.handleFilterPresets)
	mux.HandleFunc("/v1/filter-presets/export", app.handleFilterPresetsExport)
	mux.HandleFunc("/v1/filter-presets/import", app.handleFilterPresetsImport)
	mux.HandleFunc("/v1/filter-presets/", app.handleFilterPresetByID)
	mux.HandleFunc("/v1/projects/current/settings", app.handleProjectSettings)
	mux.HandleFunc("/v1/security/settings", app.handleSecuritySettings)
	mux.HandleFunc("/v1/request-logs", app.handleRequestLogs)
	mux.HandleFunc("/v1/request-logs/", app.handleRequestLogDetail)
	mux.HandleFunc("/v1/models", app.handleModels)
	mux.HandleFunc("/v1/models/", app.handleModelByID)
	mux.HandleFunc("/v1/team/members/export", app.handleTeamMembersExport)
	mux.HandleFunc("/v1/team/members", app.handleTeamMembers)
	mux.HandleFunc("/v1/team/members/", app.handleTeamMemberByID)
	mux.HandleFunc("/v1/team/invitations", app.handleTeamInvitations)
	mux.HandleFunc("/v1/webhooks/export", app.handleWebhooksExport)
	mux.HandleFunc("/v1/webhooks/test", app.handleWebhookTest)
	mux.HandleFunc("/v1/webhooks/deliveries", app.handleWebhookDeliveries)
	mux.HandleFunc("/v1/webhooks/deliveries/", app.handleWebhookDeliveryByID)
	mux.HandleFunc("/v1/webhooks", app.handleWebhooks)
	mux.HandleFunc("/v1/webhooks/", app.handleWebhookByID)
	mux.HandleFunc("/v1/billing/bills/export", app.handleBillsExport)
	mux.HandleFunc("/v1/billing/bills", app.handleBills)
	mux.HandleFunc("/v1/billing/bills/", app.handleBillByID)
	mux.HandleFunc("/v1/billing/invoices/export", app.handleInvoicesExport)
	mux.HandleFunc("/v1/billing/invoices", app.handleInvoices)
	mux.HandleFunc("/v1/billing/invoices/", app.handleInvoiceByID)
	mux.HandleFunc("/v1/support/tickets", app.handleSupportTickets)
	mux.HandleFunc("/v1/support/tickets/", app.handleSupportTicketByID)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           loggingMiddleware(serviceName, mux),
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("[%s] listening on :%s", serviceName, port)
	log.Fatal(server.ListenAndServe())
}

func (a *app) handleRoot(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	writeJSON(w, http.StatusOK, envelope{Data: map[string]any{"service": a.serviceName, "ok": true}})
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

func (a *app) handleMetrics(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	_, _ = w.Write([]byte(fmt.Sprintf("platform_ops_requests_total %d\n", requestCount.Load())))
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

func presetActorFromRequest(r *http.Request) presetActor {
	email := strings.TrimSpace(r.Header.Get("X-Session-User-Email"))
	displayName := strings.TrimSpace(r.Header.Get("X-Session-User-Name"))
	return presetActor{
		UserID:      firstNonEmpty(r.Header.Get("X-Session-User-Id"), email, "anonymous"),
		Email:       email,
		DisplayName: firstNonEmpty(displayName, email, "Unknown User"),
		OrgName:     firstNonEmpty(r.Header.Get("X-Session-Org-Name"), "default-org"),
		Role:        firstNonEmpty(r.Header.Get("X-Session-User-Role"), "member"),
	}
}

func normalizePresetVisibility(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "organization":
		return "organization"
	default:
		return "private"
	}
}

func canManagePreset(actor presetActor, ownerUserID, visibility, orgName string) bool {
	if ownerUserID == actor.UserID {
		return true
	}
	if visibility == "organization" && orgName == actor.OrgName {
		switch actor.Role {
		case "project_admin", "org_admin", "ops_admin", "platform_super_admin":
			return true
		}
	}
	return false
}

func clearDefaultPreset(ctx context.Context, db *sql.DB, actor presetActor, scope, visibility string) error {
	if visibility == "organization" {
		_, err := db.ExecContext(ctx, `UPDATE filter_presets SET is_default = 0, updated_at = NOW() WHERE scope = ? AND visibility = 'organization' AND org_name = ?`, scope, actor.OrgName)
		return err
	}
	_, err := db.ExecContext(ctx, `UPDATE filter_presets SET is_default = 0, updated_at = NOW() WHERE scope = ? AND visibility = 'private' AND owner_user_id = ?`, scope, actor.UserID)
	return err
}

func decodePresetValues(raw string) map[string]any {
	if strings.TrimSpace(raw) == "" {
		return map[string]any{}
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(raw), &parsed); err == nil && parsed != nil {
		return parsed
	}
	return map[string]any{}
}

func decodePresetTags(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return []string{}
	}
	var parsed []string
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return []string{}
	}
	seen := make(map[string]struct{}, len(parsed))
	normalized := make([]string, 0, len(parsed))
	for _, tag := range parsed {
		text := strings.TrimSpace(tag)
		if text == "" {
			continue
		}
		key := strings.ToLower(text)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, text)
	}
	return normalized
}

func normalizePresetTags(tags []string) []string {
	encoded, _ := json.Marshal(tags)
	return decodePresetTags(string(encoded))
}

func (a *app) handleFilterPresetsExport(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}

	actor := presetActorFromRequest(r)
	scope := strings.TrimSpace(r.URL.Query().Get("scope"))
	if scope == "" {
		writeError(w, http.StatusBadRequest, "validation_failed", "scope 不能为空。", map[string]any{"fieldErrors": map[string]string{"scope": "scope 必填"}})
		return
	}

	rows, err := a.db.QueryContext(r.Context(), `
		SELECT id, scope, name, values_json, group_name, tags_json, visibility, is_default, is_pinned, sort_order, owner_user_id, owner_display_name, org_name, created_at, updated_at, last_used_at
		FROM filter_presets
		WHERE scope = ?
		  AND (owner_user_id = ? OR (visibility = 'organization' AND org_name = ?))
		ORDER BY visibility ASC,
		         is_pinned DESC,
		         CASE WHEN sort_order > 0 THEN 0 ELSE 1 END ASC,
		         sort_order ASC,
		         is_default DESC,
		         COALESCE(last_used_at, updated_at) DESC,
		         created_at DESC
	`, scope, actor.UserID, actor.OrgName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "filter_presets_export_query_failed", err.Error(), nil)
		return
	}
	defer rows.Close()

	items := make([]map[string]any, 0)
	for rows.Next() {
		var id, presetScope, name, valuesJSON, visibility, ownerUserID, orgName string
		var groupName, tagsJSON, ownerDisplayName sql.NullString
		var sortOrder int
		var isDefault, isPinned bool
		var createdAt, updatedAt time.Time
		var lastUsedAt sql.NullTime
		if err := rows.Scan(&id, &presetScope, &name, &valuesJSON, &groupName, &tagsJSON, &visibility, &isDefault, &isPinned, &sortOrder, &ownerUserID, &ownerDisplayName, &orgName, &createdAt, &updatedAt, &lastUsedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "filter_presets_export_scan_failed", err.Error(), nil)
			return
		}
		var lastUsedAtValue any
		if lastUsedAt.Valid {
			lastUsedAtValue = lastUsedAt.Time.Format(time.RFC3339)
		}
		items = append(items, map[string]any{
			"id":               id,
			"scope":            presetScope,
			"name":             name,
			"values":           decodePresetValues(valuesJSON),
			"groupName":        groupName.String,
			"tags":             decodePresetTags(tagsJSON.String),
			"visibility":       visibility,
			"isDefault":        isDefault,
			"isPinned":         isPinned,
			"sortOrder":        sortOrder,
			"ownerUserId":      ownerUserID,
			"ownerDisplayName": ownerDisplayName.String,
			"orgName":          orgName,
			"createdAt":        createdAt.Format(time.RFC3339),
			"updatedAt":        updatedAt.Format(time.RFC3339),
			"lastUsedAt":       lastUsedAtValue,
		})
	}

	filename := fmt.Sprintf("filter-presets-%s-%s.json", scope, time.Now().UTC().Format("20060102-150405"))
	writeJSONAttachment(w, http.StatusOK, filename, map[string]any{
		"version":    "1.0",
		"exportedAt": time.Now().UTC().Format(time.RFC3339),
		"scope":      scope,
		"presets":    items,
	})
}

func (a *app) handleFilterPresetsImport(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}

	actor := presetActorFromRequest(r)
	var payload filterPresetImportPayload
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}

	scope := strings.TrimSpace(payload.Scope)
	if scope == "" {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Preset 导入参数校验失败。", map[string]any{"fieldErrors": map[string]string{"scope": "scope 必填"}})
		return
	}
	if len(payload.Presets) == 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Preset 导入列表不能为空。", map[string]any{"fieldErrors": map[string]string{"presets": "至少导入一个 Preset"}})
		return
	}

	createdCount := 0
	updatedCount := 0
	skippedCount := 0

	for _, item := range payload.Presets {
		name := strings.TrimSpace(item.Name)
		if name == "" {
			skippedCount++
			continue
		}
		groupName := strings.TrimSpace(item.GroupName)
		tagsJSONBytes, err := json.Marshal(normalizePresetTags(item.Tags))
		if err != nil {
			skippedCount++
			continue
		}
		visibility := normalizePresetVisibility(item.Visibility)
		valuesJSON, err := json.Marshal(item.Values)
		if err != nil {
			skippedCount++
			continue
		}

		var existingID string
		var existingSortOrder int
		var lookupErr error
		if visibility == "organization" {
			lookupErr = a.db.QueryRowContext(r.Context(), `
				SELECT id, sort_order
				FROM filter_presets
				WHERE scope = ? AND visibility = 'organization' AND org_name = ? AND name = ?
				LIMIT 1
			`, scope, actor.OrgName, name).Scan(&existingID, &existingSortOrder)
		} else {
			lookupErr = a.db.QueryRowContext(r.Context(), `
				SELECT id, sort_order
				FROM filter_presets
				WHERE scope = ? AND visibility = 'private' AND owner_user_id = ? AND name = ?
				LIMIT 1
			`, scope, actor.UserID, name).Scan(&existingID, &existingSortOrder)
		}
		if lookupErr != nil && lookupErr != sql.ErrNoRows {
			writeError(w, http.StatusInternalServerError, "filter_preset_import_lookup_failed", lookupErr.Error(), nil)
			return
		}

		nextSortOrder := existingSortOrder
		if item.SortOrder != nil && *item.SortOrder > 0 {
			nextSortOrder = *item.SortOrder
		}
		if nextSortOrder <= 0 {
			nextSortOrder, err = nextPresetSortOrder(r.Context(), a.db, actor, scope, visibility)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "filter_presets_sort_failed", err.Error(), nil)
				return
			}
		}

		if item.IsDefault {
			if err := clearDefaultPreset(r.Context(), a.db, actor, scope, visibility); err != nil {
				writeError(w, http.StatusInternalServerError, "filter_presets_default_failed", err.Error(), nil)
				return
			}
		}

		if lookupErr == sql.ErrNoRows {
			id := fmt.Sprintf("preset_%d", time.Now().UnixNano())
			if _, err := a.db.ExecContext(r.Context(), `
				INSERT INTO filter_presets (id, scope, name, values_json, group_name, tags_json, visibility, is_default, is_pinned, sort_order, owner_user_id, owner_email, owner_display_name, org_name, created_at, updated_at, last_used_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
			`, id, scope, name, string(valuesJSON), emptyToNil(groupName), string(tagsJSONBytes), visibility, item.IsDefault, item.IsPinned, nextSortOrder, actor.UserID, emptyToNil(actor.Email), actor.DisplayName, actor.OrgName); err != nil {
				writeError(w, http.StatusInternalServerError, "filter_presets_create_failed", err.Error(), nil)
				return
			}
			createdCount++
			continue
		}

		if _, err := a.db.ExecContext(r.Context(), `
			UPDATE filter_presets
			SET values_json = ?, group_name = ?, tags_json = ?, visibility = ?, is_default = ?, is_pinned = ?, sort_order = ?, updated_at = NOW()
			WHERE id = ?
		`, string(valuesJSON), emptyToNil(groupName), string(tagsJSONBytes), visibility, item.IsDefault, item.IsPinned, nextSortOrder, existingID); err != nil {
			writeError(w, http.StatusInternalServerError, "filter_preset_update_failed", err.Error(), nil)
			return
		}
		updatedCount++
	}

	writeData(w, http.StatusOK, map[string]any{
		"scope":   scope,
		"created": createdCount,
		"updated": updatedCount,
		"skipped": skippedCount,
		"total":   len(payload.Presets),
	}, nil)
}

func (a *app) handleFilterPresets(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	actor := presetActorFromRequest(r)

	switch r.Method {
	case http.MethodGet:
		scope := strings.TrimSpace(r.URL.Query().Get("scope"))
		if scope == "" {
			writeError(w, http.StatusBadRequest, "validation_failed", "scope 不能为空。", map[string]any{"fieldErrors": map[string]string{"scope": "scope 必填"}})
			return
		}

		rows, err := a.db.QueryContext(r.Context(), `
			SELECT id, scope, name, values_json, group_name, tags_json, visibility, is_default, is_pinned, sort_order, owner_user_id, owner_display_name, org_name, created_at, updated_at, last_used_at
			FROM filter_presets
			WHERE scope = ?
			  AND (owner_user_id = ? OR (visibility = 'organization' AND org_name = ?))
			ORDER BY is_pinned DESC,
			         CASE WHEN sort_order > 0 THEN 0 ELSE 1 END ASC,
			         sort_order ASC,
			         is_default DESC,
			         COALESCE(last_used_at, updated_at) DESC,
			         created_at DESC
		`, scope, actor.UserID, actor.OrgName)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "filter_presets_query_failed", err.Error(), nil)
			return
		}
		defer rows.Close()

		items := make([]map[string]any, 0)
		for rows.Next() {
			var id, presetScope, name, valuesJSON, visibility, ownerUserID, orgName string
			var groupName, tagsJSON, ownerDisplayName sql.NullString
			var sortOrder int
			var isDefault, isPinned bool
			var createdAt, updatedAt time.Time
			var lastUsedAt sql.NullTime
			if err := rows.Scan(&id, &presetScope, &name, &valuesJSON, &groupName, &tagsJSON, &visibility, &isDefault, &isPinned, &sortOrder, &ownerUserID, &ownerDisplayName, &orgName, &createdAt, &updatedAt, &lastUsedAt); err != nil {
				writeError(w, http.StatusInternalServerError, "filter_presets_scan_failed", err.Error(), nil)
				return
			}
			var lastUsedAtValue any
			if lastUsedAt.Valid {
				lastUsedAtValue = lastUsedAt.Time.Format(time.RFC3339)
			}
			items = append(items, map[string]any{
				"id":               id,
				"scope":            presetScope,
				"name":             name,
				"values":           decodePresetValues(valuesJSON),
				"groupName":        groupName.String,
				"tags":             decodePresetTags(tagsJSON.String),
				"visibility":       visibility,
				"isDefault":        isDefault,
				"isPinned":         isPinned,
				"sortOrder":        sortOrder,
				"ownerUserId":      ownerUserID,
				"ownerDisplayName": ownerDisplayName.String,
				"orgName":          orgName,
				"createdAt":        createdAt.Format(time.RFC3339),
				"updatedAt":        updatedAt.Format(time.RFC3339),
				"lastUsedAt":       lastUsedAtValue,
			})
		}
		writeData(w, http.StatusOK, items, nil)
		return

	case http.MethodPost:
		var payload struct {
			Scope      string         `json:"scope"`
			Name       string         `json:"name"`
			Values     map[string]any `json:"values"`
			GroupName  string         `json:"groupName"`
			Tags       []string       `json:"tags"`
			Visibility string         `json:"visibility"`
			IsDefault  bool           `json:"isDefault"`
			IsPinned   bool           `json:"isPinned"`
			SortOrder  *int           `json:"sortOrder"`
		}
		if err := decodeJSON(r, &payload); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
			return
		}

		scope := strings.TrimSpace(payload.Scope)
		name := strings.TrimSpace(payload.Name)
		groupName := strings.TrimSpace(payload.GroupName)
		tagsJSONBytes, err := json.Marshal(normalizePresetTags(payload.Tags))
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Preset 标签格式错误。", map[string]any{"fieldErrors": map[string]string{"tags": "标签格式错误"}})
			return
		}
		visibility := normalizePresetVisibility(payload.Visibility)
		if scope == "" || name == "" {
			fieldErrors := map[string]string{}
			if scope == "" {
				fieldErrors["scope"] = "scope 必填"
			}
			if name == "" {
				fieldErrors["name"] = "名称不能为空"
			}
			writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Preset 参数校验失败。", map[string]any{"fieldErrors": fieldErrors})
			return
		}

		valuesJSON, err := json.Marshal(payload.Values)
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "validation_failed", "筛选值必须为合法 JSON 对象。", map[string]any{"fieldErrors": map[string]string{"values": "筛选值格式错误"}})
			return
		}
		if payload.IsDefault {
			if err := clearDefaultPreset(r.Context(), a.db, actor, scope, visibility); err != nil {
				writeError(w, http.StatusInternalServerError, "filter_presets_default_failed", err.Error(), nil)
				return
			}
		}
		sortOrder, err := nextPresetSortOrder(r.Context(), a.db, actor, scope, visibility)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "filter_presets_sort_failed", err.Error(), nil)
			return
		}
		if payload.SortOrder != nil && *payload.SortOrder > 0 {
			sortOrder = *payload.SortOrder
		}

		id := fmt.Sprintf("preset_%d", time.Now().UnixNano())
		if _, err := a.db.ExecContext(r.Context(), `
			INSERT INTO filter_presets (id, scope, name, values_json, group_name, tags_json, visibility, is_default, is_pinned, sort_order, owner_user_id, owner_email, owner_display_name, org_name, created_at, updated_at, last_used_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)
		`, id, scope, name, string(valuesJSON), emptyToNil(groupName), string(tagsJSONBytes), visibility, payload.IsDefault, payload.IsPinned, sortOrder, actor.UserID, emptyToNil(actor.Email), actor.DisplayName, actor.OrgName); err != nil {
			writeError(w, http.StatusInternalServerError, "filter_presets_create_failed", err.Error(), nil)
			return
		}
		writeData(w, http.StatusOK, map[string]any{
			"id":               id,
			"scope":            scope,
			"name":             name,
			"values":           payload.Values,
			"groupName":        groupName,
			"tags":             normalizePresetTags(payload.Tags),
			"visibility":       visibility,
			"isDefault":        payload.IsDefault,
			"isPinned":         payload.IsPinned,
			"sortOrder":        sortOrder,
			"ownerUserId":      actor.UserID,
			"ownerDisplayName": actor.DisplayName,
			"orgName":          actor.OrgName,
			"createdAt":        time.Now().UTC().Format(time.RFC3339),
			"updatedAt":        time.Now().UTC().Format(time.RFC3339),
			"lastUsedAt":       nil,
		}, nil)
		return

	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
}

func (a *app) handleFilterPresetByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	presetID := strings.TrimPrefix(r.URL.Path, "/v1/filter-presets/")
	if presetID == "" {
		writeError(w, http.StatusNotFound, "filter_preset_not_found", "未找到 Preset。", nil)
		return
	}
	actor := presetActorFromRequest(r)

	var scope, name, valuesJSON, visibility, ownerUserID, orgName string
	var groupName, tagsJSON, ownerDisplayName sql.NullString
	var sortOrder int
	var isDefault, isPinned bool
	var createdAt, updatedAt time.Time
	var lastUsedAt sql.NullTime
	err := a.db.QueryRowContext(r.Context(), `
		SELECT scope, name, values_json, group_name, tags_json, visibility, is_default, is_pinned, sort_order, owner_user_id, owner_display_name, org_name, created_at, updated_at, last_used_at
		FROM filter_presets
		WHERE id = ?
		LIMIT 1
	`, presetID).Scan(&scope, &name, &valuesJSON, &groupName, &tagsJSON, &visibility, &isDefault, &isPinned, &sortOrder, &ownerUserID, &ownerDisplayName, &orgName, &createdAt, &updatedAt, &lastUsedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "filter_preset_not_found", "未找到 Preset。", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "filter_preset_query_failed", err.Error(), nil)
		return
	}
	if ownerUserID != actor.UserID && !(visibility == "organization" && orgName == actor.OrgName) {
		writeError(w, http.StatusForbidden, "forbidden", "你没有访问该 Preset 的权限。", nil)
		return
	}

	switch r.Method {
	case http.MethodPut:
		var payload struct {
			Name       *string        `json:"name"`
			Values     map[string]any `json:"values"`
			GroupName  *string        `json:"groupName"`
			Tags       *[]string      `json:"tags"`
			Visibility *string        `json:"visibility"`
			IsDefault  *bool          `json:"isDefault"`
			IsPinned   *bool          `json:"isPinned"`
			MarkUsed   *bool          `json:"markUsed"`
			SortOrder  *int           `json:"sortOrder"`
		}
		if err := decodeJSON(r, &payload); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
			return
		}
		onlyMarkUsed := payload.MarkUsed != nil && *payload.MarkUsed && payload.Name == nil && payload.GroupName == nil && payload.Tags == nil && payload.Visibility == nil && payload.IsDefault == nil && payload.IsPinned == nil && payload.Values == nil && payload.SortOrder == nil

		if !canManagePreset(actor, ownerUserID, visibility, orgName) && !onlyMarkUsed {
			writeError(w, http.StatusForbidden, "forbidden", "你没有修改该 Preset 的权限。", nil)
			return
		}

		nextName := name
		if payload.Name != nil && strings.TrimSpace(*payload.Name) != "" {
			nextName = strings.TrimSpace(*payload.Name)
		}
		nextGroupName := groupName.String
		if payload.GroupName != nil {
			nextGroupName = strings.TrimSpace(*payload.GroupName)
		}
		nextTags := decodePresetTags(tagsJSON.String)
		if payload.Tags != nil {
			nextTags = normalizePresetTags(*payload.Tags)
		}
		nextTagsJSON, err := json.Marshal(nextTags)
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Preset 标签格式错误。", map[string]any{"fieldErrors": map[string]string{"tags": "标签格式错误"}})
			return
		}
		nextVisibility := visibility
		if payload.Visibility != nil {
			nextVisibility = normalizePresetVisibility(*payload.Visibility)
		}
		nextIsDefault := isDefault
		if payload.IsDefault != nil {
			nextIsDefault = *payload.IsDefault
		}
		nextIsPinned := isPinned
		if payload.IsPinned != nil {
			nextIsPinned = *payload.IsPinned
		}
		nextSortOrder := sortOrder
		if payload.SortOrder != nil && *payload.SortOrder >= 0 {
			nextSortOrder = *payload.SortOrder
		}
		nextValuesJSON := valuesJSON
		nextValues := decodePresetValues(valuesJSON)
		if payload.Values != nil {
			encoded, err := json.Marshal(payload.Values)
			if err != nil {
				writeError(w, http.StatusUnprocessableEntity, "validation_failed", "筛选值必须为合法 JSON 对象。", map[string]any{"fieldErrors": map[string]string{"values": "筛选值格式错误"}})
				return
			}
			nextValuesJSON = string(encoded)
			nextValues = payload.Values
		}
		if nextIsDefault {
			if err := clearDefaultPreset(r.Context(), a.db, actor, scope, nextVisibility); err != nil {
				writeError(w, http.StatusInternalServerError, "filter_presets_default_failed", err.Error(), nil)
				return
			}
		}
		markUsed := payload.MarkUsed != nil && *payload.MarkUsed
		if _, err := a.db.ExecContext(r.Context(), `
			UPDATE filter_presets
			SET name = ?, values_json = ?, group_name = ?, tags_json = ?, visibility = ?, is_default = ?, is_pinned = ?, sort_order = ?, updated_at = NOW(), last_used_at = CASE WHEN ? THEN NOW() ELSE last_used_at END
			WHERE id = ?
		`, nextName, nextValuesJSON, emptyToNil(nextGroupName), string(nextTagsJSON), nextVisibility, nextIsDefault, nextIsPinned, nextSortOrder, markUsed, presetID); err != nil {
			writeError(w, http.StatusInternalServerError, "filter_preset_update_failed", err.Error(), nil)
			return
		}
		if markUsed {
			lastUsedAt = sql.NullTime{Time: time.Now().UTC(), Valid: true}
		}
		var lastUsedAtValue any
		if lastUsedAt.Valid {
			lastUsedAtValue = lastUsedAt.Time.Format(time.RFC3339)
		}
		writeData(w, http.StatusOK, map[string]any{
			"id":               presetID,
			"scope":            scope,
			"name":             nextName,
			"values":           nextValues,
			"groupName":        nextGroupName,
			"tags":             nextTags,
			"visibility":       nextVisibility,
			"isDefault":        nextIsDefault,
			"isPinned":         nextIsPinned,
			"sortOrder":        nextSortOrder,
			"ownerUserId":      ownerUserID,
			"ownerDisplayName": ownerDisplayName.String,
			"orgName":          orgName,
			"createdAt":        createdAt.Format(time.RFC3339),
			"updatedAt":        time.Now().UTC().Format(time.RFC3339),
			"lastUsedAt":       lastUsedAtValue,
		}, nil)
		return

	case http.MethodDelete:
		if !canManagePreset(actor, ownerUserID, visibility, orgName) {
			writeError(w, http.StatusForbidden, "forbidden", "你没有删除该 Preset 的权限。", nil)
			return
		}
		if _, err := a.db.ExecContext(r.Context(), `DELETE FROM filter_presets WHERE id = ?`, presetID); err != nil {
			writeError(w, http.StatusInternalServerError, "filter_preset_delete_failed", err.Error(), nil)
			return
		}
		writeData(w, http.StatusOK, map[string]any{"id": presetID, "deleted": true}, nil)
		return

	default:
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
}

func (a *app) ensureConsoleTables(ctx context.Context) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS team_members (
			id VARCHAR(64) NOT NULL,
			display_name VARCHAR(128) NOT NULL,
			email VARCHAR(255) NOT NULL,
			role VARCHAR(32) NOT NULL,
			project_scope_json LONGTEXT NOT NULL,
			status VARCHAR(16) NOT NULL,
			last_active_at DATETIME NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY uk_team_members_email (email)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS webhook_configs (
			id VARCHAR(64) NOT NULL,
			name VARCHAR(128) NOT NULL,
			endpoint VARCHAR(512) NOT NULL,
			events_json LONGTEXT NOT NULL,
			status VARCHAR(16) NOT NULL,
			retry_policy VARCHAR(255) NOT NULL,
			signing_secret VARCHAR(128) NOT NULL,
			last_delivery_at DATETIME NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS bill_overrides (
			bill_id VARCHAR(64) NOT NULL,
			status VARCHAR(16) NULL,
			notes TEXT NULL,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (bill_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS invoice_records (
			id VARCHAR(64) NOT NULL,
			bill_id VARCHAR(64) NOT NULL,
			invoice_number VARCHAR(64) NOT NULL,
			status VARCHAR(16) NOT NULL,
			amount_usd DECIMAL(18,6) NOT NULL DEFAULT 0,
			period_start DATE NOT NULL,
			period_end DATE NOT NULL,
			due_date DATE NOT NULL,
			issued_at DATETIME NOT NULL,
			billing_entity_name VARCHAR(255) NOT NULL,
			tax_id VARCHAR(64) NULL,
			currency CHAR(3) NOT NULL DEFAULT 'USD',
			notes TEXT NULL,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY uk_invoice_records_bill_id (bill_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS support_tickets (
			id VARCHAR(64) NOT NULL,
			ticket_number VARCHAR(64) NOT NULL,
			subject VARCHAR(255) NOT NULL,
			category VARCHAR(32) NOT NULL,
			priority VARCHAR(16) NOT NULL,
			status VARCHAR(16) NOT NULL,
			requester_name VARCHAR(128) NOT NULL,
			description TEXT NOT NULL,
			project_name VARCHAR(128) NULL,
			trace_id VARCHAR(64) NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY uk_support_ticket_number (ticket_number)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS support_ticket_replies (
			id VARCHAR(64) NOT NULL,
			ticket_id VARCHAR(64) NOT NULL,
			author_name VARCHAR(128) NOT NULL,
			author_role VARCHAR(16) NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS webhook_deliveries (
			delivery_id VARCHAR(96) NOT NULL,
			webhook_id VARCHAR(64) NOT NULL,
			webhook_name VARCHAR(128) NOT NULL,
			event_name VARCHAR(128) NOT NULL,
			status VARCHAR(16) NOT NULL,
			latency_ms INT NOT NULL DEFAULT 0,
			attempts INT NOT NULL DEFAULT 1,
			response_code INT NOT NULL DEFAULT 200,
			delivered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			trace_id VARCHAR(64) NULL,
			request_headers_json LONGTEXT NULL,
			request_body_json LONGTEXT NULL,
			response_body_json LONGTEXT NULL,
			PRIMARY KEY (delivery_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		`CREATE TABLE IF NOT EXISTS filter_presets (
			id VARCHAR(96) NOT NULL,
			scope VARCHAR(128) NOT NULL,
			name VARCHAR(128) NOT NULL,
			values_json LONGTEXT NOT NULL,
			group_name VARCHAR(128) NULL,
			tags_json LONGTEXT NULL,
			visibility VARCHAR(16) NOT NULL DEFAULT 'private',
			is_default TINYINT(1) NOT NULL DEFAULT 0,
			is_pinned TINYINT(1) NOT NULL DEFAULT 0,
			sort_order INT NOT NULL DEFAULT 0,
			owner_user_id VARCHAR(96) NOT NULL,
			owner_email VARCHAR(255) NULL,
			owner_display_name VARCHAR(128) NULL,
			org_name VARCHAR(255) NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_used_at DATETIME NULL,
			PRIMARY KEY (id),
			KEY idx_filter_presets_scope_visibility (scope, visibility),
			KEY idx_filter_presets_owner_scope (owner_user_id, scope),
			KEY idx_filter_presets_org_scope (org_name, scope),
			KEY idx_filter_presets_scope_recent (scope, last_used_at),
			KEY idx_filter_presets_scope_pinned (scope, is_pinned),
			KEY idx_filter_presets_scope_sort (scope, sort_order)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
	}
	for _, statement := range statements {
		if _, err := a.db.ExecContext(ctx, statement); err != nil {
			return err
		}
	}
	if err := ensureColumnExists(ctx, a.db, "filter_presets", "is_pinned", "ALTER TABLE filter_presets ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0"); err != nil {
		return err
	}
	if err := ensureColumnExists(ctx, a.db, "filter_presets", "last_used_at", "ALTER TABLE filter_presets ADD COLUMN last_used_at DATETIME NULL"); err != nil {
		return err
	}
	if err := ensureColumnExists(ctx, a.db, "filter_presets", "sort_order", "ALTER TABLE filter_presets ADD COLUMN sort_order INT NOT NULL DEFAULT 0"); err != nil {
		return err
	}
	if err := ensureColumnExists(ctx, a.db, "filter_presets", "group_name", "ALTER TABLE filter_presets ADD COLUMN group_name VARCHAR(128) NULL"); err != nil {
		return err
	}
	if err := ensureColumnExists(ctx, a.db, "filter_presets", "tags_json", "ALTER TABLE filter_presets ADD COLUMN tags_json LONGTEXT NULL"); err != nil {
		return err
	}
	if err := ensureColumnExists(ctx, a.db, "filter_presets", "owner_email", "ALTER TABLE filter_presets ADD COLUMN owner_email VARCHAR(255) NULL"); err != nil {
		return err
	}
	return a.seedConsoleData(ctx)
}

func ensureColumnExists(ctx context.Context, db *sql.DB, tableName, columnName, alterSQL string) error {
	var exists int
	err := db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = ?
		  AND COLUMN_NAME = ?
	`, tableName, columnName).Scan(&exists)
	if err != nil {
		return err
	}
	if exists > 0 {
		return nil
	}
	_, err = db.ExecContext(ctx, alterSQL)
	return err
}

func nextPresetSortOrder(ctx context.Context, db *sql.DB, actor presetActor, scope, visibility string) (int, error) {
	var query string
	var args []any
	if visibility == "organization" {
		query = `SELECT COALESCE(MAX(sort_order), 0) FROM filter_presets WHERE scope = ? AND visibility = 'organization' AND org_name = ?`
		args = []any{scope, actor.OrgName}
	} else {
		query = `SELECT COALESCE(MAX(sort_order), 0) FROM filter_presets WHERE scope = ? AND visibility = 'private' AND owner_user_id = ?`
		args = []any{scope, actor.UserID}
	}
	var maxValue int
	if err := db.QueryRowContext(ctx, query, args...).Scan(&maxValue); err != nil {
		return 0, err
	}
	return maxValue + 1, nil
}

func (a *app) seedConsoleData(ctx context.Context) error {
	if _, err := a.db.ExecContext(ctx, `
		INSERT IGNORE INTO team_members
			(id, display_name, email, role, project_scope_json, status, last_active_at, created_at, updated_at)
		SELECT 'tm_owner', COALESCE(display_name, 'Demo Owner'), email, 'org_admin', '["demo-project"]', 'active', last_login_at, NOW(), NOW()
		FROM users
		WHERE id = 5001
	`); err != nil {
		return err
	}

	if _, err := a.db.ExecContext(ctx, `
		INSERT IGNORE INTO team_members
			(id, display_name, email, role, project_scope_json, status, last_active_at, created_at, updated_at)
		VALUES
			('tm_finance', 'Finance Observer', 'finance@example.com', 'finance', '["demo-project"]', 'active', NOW(), NOW(), NOW())
	`); err != nil {
		return err
	}

	if _, err := a.db.ExecContext(ctx, `
		INSERT IGNORE INTO webhook_configs
			(id, name, endpoint, events_json, status, retry_policy, signing_secret, last_delivery_at, created_at, updated_at)
		VALUES
			('wh_trace_bridge', 'Trace Delivery Bridge', 'https://hooks.example.com/platform', '["request.trace.recorded"]', 'active', '指数退避，最多 6 次', 'whsec_dev_trace_bridge', NOW(), NOW(), NOW())
	`); err != nil {
		return err
	}

	if _, err := a.db.ExecContext(ctx, `
		INSERT IGNORE INTO support_tickets
			(id, ticket_number, subject, category, priority, status, requester_name, description, project_name, trace_id, created_at, updated_at)
		VALUES
			('ticket_100', 'TCK-2026-0001', '关于 chat-pro 调用链路的排查', 'technical', 'high', 'open', 'Demo Owner', '请协助确认 request_id=req_console_1776756684722 的调用情况，并核对 trace 对应的费用与状态。', 'demo-project', 'trace_console_1776756684722', NOW(), NOW()),
			('ticket_200', 'TCK-2026-0002', '关于 chat-pro 调用费用的确认', 'billing', 'medium', 'pending', 'Demo Owner', '请核对最近一笔请求的扣费与账单生成是否一致。', 'demo-project', 'trace_console_1776756673536', NOW(), NOW())
	`); err != nil {
		return err
	}

	if _, err := a.db.ExecContext(ctx, `
		INSERT INTO support_ticket_replies (id, ticket_id, author_name, author_role, content, created_at)
		SELECT 'reply_seed_100', 'ticket_100', 'Support Bot', 'support', '已收到工单，我们正在结合 trace_id 进行排查。', NOW()
		FROM DUAL
		WHERE NOT EXISTS (SELECT 1 FROM support_ticket_replies WHERE id = 'reply_seed_100')
	`); err != nil {
		return err
	}

	if _, err := a.db.ExecContext(ctx, `
		INSERT IGNORE INTO webhook_deliveries
			(delivery_id, webhook_id, webhook_name, event_name, status, latency_ms, attempts, response_code, delivered_at, trace_id, request_headers_json, request_body_json, response_body_json)
		SELECT
			CONCAT('del_', request_id),
			'wh_trace_bridge',
			'Trace Delivery Bridge',
			'request.trace.recorded',
			CASE WHEN error_code IS NULL THEN 'delivered' ELSE 'failed' END,
			latency_ms,
			1,
			CASE WHEN edge_status_code = 0 THEN 200 ELSE edge_status_code END,
			created_at,
			trace_id,
			'{"content-type":"application/json"}',
			JSON_OBJECT('event','request.trace.recorded','trace_id',trace_id,'request_id',request_id),
			JSON_OBJECT('accepted', IF(error_code IS NULL, true, false), 'edge_status_code', CASE WHEN edge_status_code = 0 THEN 200 ELSE edge_status_code END, 'error_code', error_code)
		FROM request_traces
	`); err != nil {
		return err
	}

	return a.syncInvoices(ctx)
}

func (a *app) syncInvoices(ctx context.Context) error {
	rows, err := a.db.QueryContext(ctx, `
		SELECT DATE_FORMAT(started_at, '%Y%m') AS month_key, MIN(started_at), MAX(started_at), SUM(sale_amount)
		FROM usage_records
		GROUP BY DATE_FORMAT(started_at, '%Y%m')
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var monthKey string
		var periodStart, periodEnd time.Time
		var amount float64
		if err := rows.Scan(&monthKey, &periodStart, &periodEnd, &amount); err != nil {
			return err
		}
		billID := "bill_" + monthKey
		invoiceID := "inv_" + monthKey
		if _, err := a.db.ExecContext(ctx, `
			INSERT IGNORE INTO invoice_records
				(id, bill_id, invoice_number, status, amount_usd, period_start, period_end, due_date, issued_at, billing_entity_name, tax_id, currency, notes, updated_at)
			VALUES (?, ?, ?, 'issued', ?, ?, ?, DATE_ADD(?, INTERVAL 7 DAY), ?, 'Demo Organization', NULL, 'USD', '开发环境自动生成发票记录。', NOW())
		`, invoiceID, billID, "INV-"+monthKey, amount, periodStart, periodEnd, periodEnd, periodEnd); err != nil {
			return err
		}
	}
	return rows.Err()
}

func openDB(dsn string) (*sql.DB, error) {
	if strings.TrimSpace(dsn) == "" {
		return nil, fmt.Errorf("MYSQL_DSN is required")
	}
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)
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

func decodeJSON(r *http.Request, target any) error {
	defer r.Body.Close()
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		return err
	}
	if len(body) == 0 {
		return fmt.Errorf("request body is empty")
	}
	return json.Unmarshal(body, target)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeData(w http.ResponseWriter, status int, data any, meta map[string]any) {
	writeJSON(w, status, envelope{Data: data, Meta: meta})
}

func writeJSONAttachment(w http.ResponseWriter, status int, filename string, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, code, message string, details map[string]any) {
	writeJSON(w, status, envelope{Error: &apiError{Code: code, Message: message, Details: details}})
}

func writeCSV(w http.ResponseWriter, filename string, headers []string, rows [][]string) {
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	writer := csv.NewWriter(w)
	_ = writer.Write(headers)
	for _, row := range rows {
		_ = writer.Write(row)
	}
	writer.Flush()
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
	if at := strings.Index(dsn, "@"); at > 0 {
		return "***" + dsn[at:]
	}
	return "***"
}

func parsePage(r *http.Request) (int, int) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return page, pageSize
}

func parseCSVFilterSet(value string) map[string]bool {
	set := map[string]bool{}
	for _, part := range strings.Split(value, ",") {
		normalized := strings.ToLower(strings.TrimSpace(part))
		if normalized != "" {
			set[normalized] = true
		}
	}
	return set
}

func matchesCSVFilter(value string, set map[string]bool) bool {
	if len(set) == 0 {
		return true
	}
	normalized := strings.ToLower(strings.TrimSpace(value))
	return set[normalized]
}

func parseOptionalDate(value string) *time.Time {
	text := strings.TrimSpace(value)
	if text == "" {
		return nil
	}
	parsed, err := time.Parse("2006-01-02", text)
	if err != nil {
		return nil
	}
	return &parsed
}

func parseOptionalFloat(value string) *float64 {
	text := strings.TrimSpace(value)
	if text == "" {
		return nil
	}
	parsed, err := strconv.ParseFloat(text, 64)
	if err != nil {
		return nil
	}
	return &parsed
}

func matchesDateRange(value any, dateFrom, dateTo *time.Time) bool {
	if dateFrom == nil && dateTo == nil {
		return true
	}
	parsed, ok := toSortableTime(value)
	if !ok {
		return false
	}
	if dateFrom != nil && parsed.Before(*dateFrom) {
		return false
	}
	if dateTo != nil {
		endExclusive := dateTo.Add(24 * time.Hour)
		if !parsed.Before(endExclusive) {
			return false
		}
	}
	return true
}

func matchesAmountRange(value any, amountMin, amountMax *float64) bool {
	if amountMin == nil && amountMax == nil {
		return true
	}
	parsed, ok := toSortableNumber(value)
	if !ok {
		return false
	}
	if amountMin != nil && parsed < *amountMin {
		return false
	}
	if amountMax != nil && parsed > *amountMax {
		return false
	}
	return true
}

func normalizeSortDirection(value, fallback string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "asc":
		return "asc"
	case "desc":
		return "desc"
	default:
		return fallback
	}
}

func normalizeSortField(value string, aliases map[string]string, fallback string) string {
	key := strings.TrimSpace(value)
	if key == "" {
		return fallback
	}
	if mapped, ok := aliases[key]; ok && mapped != "" {
		return mapped
	}
	return fallback
}

func compareForSort(left, right any) int {
	leftTime, leftIsTime := toSortableTime(left)
	rightTime, rightIsTime := toSortableTime(right)
	if leftIsTime && rightIsTime {
		switch {
		case leftTime.Before(rightTime):
			return -1
		case leftTime.After(rightTime):
			return 1
		default:
			return 0
		}
	}

	leftNumber, leftIsNumber := toSortableNumber(left)
	rightNumber, rightIsNumber := toSortableNumber(right)
	if leftIsNumber && rightIsNumber {
		switch {
		case leftNumber < rightNumber:
			return -1
		case leftNumber > rightNumber:
			return 1
		default:
			return 0
		}
	}

	leftText := strings.TrimSpace(fmt.Sprint(left))
	rightText := strings.TrimSpace(fmt.Sprint(right))
	if left == nil {
		leftText = ""
	}
	if right == nil {
		rightText = ""
	}

	if leftText == "" && rightText == "" {
		return 0
	}
	if leftText == "" {
		return 1
	}
	if rightText == "" {
		return -1
	}

	switch {
	case strings.ToLower(leftText) < strings.ToLower(rightText):
		return -1
	case strings.ToLower(leftText) > strings.ToLower(rightText):
		return 1
	default:
		return 0
	}
}

func toSortableNumber(value any) (float64, bool) {
	switch typed := value.(type) {
	case float64:
		return typed, true
	case float32:
		return float64(typed), true
	case int:
		return float64(typed), true
	case int64:
		return float64(typed), true
	case int32:
		return float64(typed), true
	case json.Number:
		parsed, err := typed.Float64()
		return parsed, err == nil
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(typed), 64)
		return parsed, err == nil
	default:
		return 0, false
	}
}

func toSortableTime(value any) (time.Time, bool) {
	switch typed := value.(type) {
	case time.Time:
		return typed, true
	case string:
		text := strings.TrimSpace(typed)
		if text == "" {
			return time.Time{}, false
		}
		for _, layout := range []string{"2006-01-02 15:04:05", "2006-01-02"} {
			parsed, err := time.Parse(layout, text)
			if err == nil {
				return parsed, true
			}
		}
		return time.Time{}, false
	default:
		return time.Time{}, false
	}
}

func sortRows(rows []map[string]any, field, direction string) {
	if len(rows) <= 1 || strings.TrimSpace(field) == "" {
		return
	}
	asc := strings.EqualFold(direction, "asc")
	sort.SliceStable(rows, func(i, j int) bool {
		result := compareForSort(rows[i][field], rows[j][field])
		if result == 0 {
			return i < j
		}
		if asc {
			return result < 0
		}
		return result > 0
	})
}

func paginate[T any](items []T, page, pageSize int) ([]T, map[string]any) {
	total := len(items)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	return items[start:end], map[string]any{
		"page":     page,
		"pageSize": pageSize,
		"total":    total,
	}
}

func loggingMiddleware(serviceName string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[%s] %s %s completed in %s", serviceName, r.Method, r.URL.Path, time.Since(started))
	})
}

func stringValue(value any, fallback string) string {
	if value == nil {
		return fallback
	}
	if text, ok := value.(string); ok && text != "" {
		return text
	}
	return fallback
}

func numberValue(value any, fallback float64) float64 {
	switch typed := value.(type) {
	case float64:
		return typed
	case float32:
		return float64(typed)
	case int:
		return float64(typed)
	case int64:
		return float64(typed)
	case json.Number:
		if parsed, err := typed.Float64(); err == nil {
			return parsed
		}
	}
	return fallback
}

func boolValue(value any, fallback bool) bool {
	if typed, ok := value.(bool); ok {
		return typed
	}
	return fallback
}

func stringSliceValue(value any) []string {
	if value == nil {
		return []string{}
	}
	switch typed := value.(type) {
	case []string:
		return typed
	case []any:
		out := make([]string, 0, len(typed))
		for _, item := range typed {
			if text, ok := item.(string); ok && text != "" {
				out = append(out, text)
			}
		}
		return out
	case string:
		if typed == "" {
			return []string{}
		}
		var parsed []string
		if err := json.Unmarshal([]byte(typed), &parsed); err == nil {
			return parsed
		}
	}
	return []string{}
}

func emptyToNil(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func isLikelyCIDR(value string) bool {
	return strings.ContainsAny(value, ".:/")
}

func httptestRequest(method, path string) *http.Request {
	req, _ := http.NewRequest(method, path, nil)
	return req
}

type requestLogRow struct {
	RequestID         string
	TraceID           sql.NullString
	ExternalModelName string
	InternalProfile   string
	ProviderCode      string
	InputTokens       int64
	OutputTokens      int64
	CacheReadTokens   int64
	SaleAmount        float64
	StartedAt         time.Time
	FinishedAt        sql.NullTime
	ProjectName       sql.NullString
	APIKeyName        sql.NullString
	EdgeStatusCode    sql.NullInt64
	ProviderStatus    sql.NullInt64
	LatencyMS         sql.NullInt64
	ErrorCode         sql.NullString
	ErrorMessage      sql.NullString
	RouteSnapshot     sql.NullString
}

func (a *app) listRequestLogs(ctx context.Context, traceFilter string) ([]map[string]any, error) {
	query := `
		SELECT
			ur.request_id,
			ur.trace_id,
			ur.external_model_name,
			ur.internal_model_profile,
			ur.provider_code,
			ur.input_tokens,
			ur.output_tokens,
			ur.cache_read_tokens,
			ur.sale_amount,
			ur.started_at,
			ur.finished_at,
			p.name,
			ak.name,
			rt.edge_status_code,
			rt.provider_status_code,
			rt.latency_ms,
			rt.error_code,
			rt.error_message_masked,
			CAST(rt.route_snapshot_json AS CHAR)
		FROM usage_records ur
		LEFT JOIN projects p ON p.id = ur.project_id
		LEFT JOIN api_keys ak ON ak.id = ur.api_key_id
		LEFT JOIN request_traces rt ON rt.request_id = ur.request_id`
	args := []any{}
	if traceFilter != "" {
		query += ` WHERE ur.trace_id = ? OR ur.request_id = ?`
		args = append(args, traceFilter, traceFilter)
	}
	query += ` ORDER BY ur.started_at DESC LIMIT 200`

	rows, err := a.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []map[string]any{}
	for rows.Next() {
		var row requestLogRow
		if err := rows.Scan(
			&row.RequestID,
			&row.TraceID,
			&row.ExternalModelName,
			&row.InternalProfile,
			&row.ProviderCode,
			&row.InputTokens,
			&row.OutputTokens,
			&row.CacheReadTokens,
			&row.SaleAmount,
			&row.StartedAt,
			&row.FinishedAt,
			&row.ProjectName,
			&row.APIKeyName,
			&row.EdgeStatusCode,
			&row.ProviderStatus,
			&row.LatencyMS,
			&row.ErrorCode,
			&row.ErrorMessage,
			&row.RouteSnapshot,
		); err != nil {
			return nil, err
		}
		status := "success"
		if row.ErrorCode.Valid {
			status = "failed"
		} else if row.EdgeStatusCode.Valid && row.EdgeStatusCode.Int64 == 429 {
			status = "rate_limited"
		}
		result = append(result, map[string]any{
			"id":               row.RequestID,
			"traceId":          firstNonEmpty(row.TraceID.String, row.RequestID),
			"requestStatus":    status,
			"retryStatus":      "none",
			"projectName":      firstNonEmpty(row.ProjectName.String, "demo-project"),
			"apiKeyName":       firstNonEmpty(row.APIKeyName.String, "demo-default-key"),
			"modelName":        row.ExternalModelName,
			"providerCode":     row.ProviderCode,
			"routeProfileCode": row.InternalProfile,
			"totalTokens":      row.InputTokens + row.OutputTokens,
			"actualCostUsd":    row.SaleAmount,
			"latencyMs":        row.LatencyMS.Int64,
			"cacheHit":         row.CacheReadTokens > 0,
			"createdAt":        row.StartedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result, rows.Err()
}

func (a *app) getRequestLogDetail(ctx context.Context, traceID string) (map[string]any, error) {
	rows, err := a.listRequestLogs(ctx, traceID)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, sql.ErrNoRows
	}
	base := rows[0]
	var routeSnapshot sql.NullString
	var errorMessage sql.NullString
	var requestID string
	if err := a.db.QueryRowContext(ctx, `SELECT request_id, CAST(route_snapshot_json AS CHAR), error_message_masked FROM request_traces WHERE trace_id = ? OR request_id = ? LIMIT 1`, traceID, traceID).Scan(&requestID, &routeSnapshot, &errorMessage); err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	snapshot := map[string]any{}
	if routeSnapshot.Valid && routeSnapshot.String != "" {
		_ = json.Unmarshal([]byte(routeSnapshot.String), &snapshot)
	}
	base["requestId"] = firstNonEmpty(requestID, fmt.Sprint(base["id"]))
	base["inputTokens"] = 0
	base["outputTokens"] = 0
	base["estimatedCostUsd"] = base["actualCostUsd"]
	base["headers"] = map[string]string{
		"x-request-id": fmt.Sprint(base["requestId"]),
		"x-trace-id":   fmt.Sprint(base["traceId"]),
	}
	base["requestPayload"] = map[string]any{
		"trace_id":       base["traceId"],
		"request_id":     base["requestId"],
		"model":          base["modelName"],
		"route_snapshot": snapshot,
	}
	base["responsePayload"] = map[string]any{
		"error_message": errorMessage.String,
	}
	base["retryTimeline"] = []map[string]any{
		{"step": "gateway.finalize", "status": base["requestStatus"], "time": base["createdAt"]},
	}
	return base, nil
}

func (a *app) listBills(ctx context.Context) ([]map[string]any, error) {
	rows, err := a.db.QueryContext(ctx, `
		SELECT DATE_FORMAT(started_at, '%Y%m') AS month_key, MIN(started_at), MAX(started_at), SUM(sale_amount)
		FROM usage_records
		GROUP BY DATE_FORMAT(started_at, '%Y%m')
		ORDER BY month_key DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []map[string]any{}
	for rows.Next() {
		var monthKey string
		var periodStart, periodEnd time.Time
		var amount float64
		if err := rows.Scan(&monthKey, &periodStart, &periodEnd, &amount); err != nil {
			return nil, err
		}
		status := "open"
		notes := ""
		_ = a.db.QueryRowContext(ctx, `SELECT COALESCE(status, 'open'), COALESCE(notes, '') FROM bill_overrides WHERE bill_id = ? LIMIT 1`, "bill_"+monthKey).Scan(&status, &notes)
		result = append(result, map[string]any{
			"id":                    "bill_" + monthKey,
			"billNumber":            "BILL-" + monthKey,
			"status":                status,
			"amountUsd":             amount,
			"usageAmountUsd":        amount,
			"subscriptionAmountUsd": 0,
			"adjustmentAmountUsd":   0,
			"periodStart":           periodStart.Format("2006-01-02"),
			"periodEnd":             periodEnd.Format("2006-01-02"),
			"dueDate":               periodEnd.Add(7 * 24 * time.Hour).Format("2006-01-02"),
			"notes":                 notes,
		})
	}
	return result, rows.Err()
}

func (a *app) getBillDetail(ctx context.Context, billID string) (map[string]any, error) {
	monthKey := strings.TrimPrefix(billID, "bill_")
	if monthKey == billID || len(monthKey) != 6 {
		return nil, sql.ErrNoRows
	}
	rows, err := a.db.QueryContext(ctx, `
		SELECT external_model_name, SUM(sale_amount), MIN(started_at), MAX(started_at)
		FROM usage_records
		WHERE DATE_FORMAT(started_at, '%Y%m') = ?
		GROUP BY external_model_name
		ORDER BY SUM(sale_amount) DESC
	`, monthKey)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	lineItems := []map[string]any{}
	var periodStart, periodEnd time.Time
	var amount float64
	for rows.Next() {
		var model string
		var itemAmount float64
		var itemStart, itemEnd time.Time
		if err := rows.Scan(&model, &itemAmount, &itemStart, &itemEnd); err != nil {
			return nil, err
		}
		if periodStart.IsZero() || itemStart.Before(periodStart) {
			periodStart = itemStart
		}
		if periodEnd.IsZero() || itemEnd.After(periodEnd) {
			periodEnd = itemEnd
		}
		amount += itemAmount
		lineItems = append(lineItems, map[string]any{
			"label":     model + " 用量",
			"amountUsd": itemAmount,
			"category":  "usage",
		})
	}
	if len(lineItems) == 0 {
		return nil, sql.ErrNoRows
	}
	status := "open"
	notes := ""
	_ = a.db.QueryRowContext(ctx, `SELECT COALESCE(status, 'open'), COALESCE(notes, '') FROM bill_overrides WHERE bill_id = ? LIMIT 1`, billID).Scan(&status, &notes)
	return map[string]any{
		"id":                    billID,
		"billNumber":            "BILL-" + monthKey,
		"status":                status,
		"amountUsd":             amount,
		"usageAmountUsd":        amount,
		"subscriptionAmountUsd": 0,
		"adjustmentAmountUsd":   0,
		"periodStart":           periodStart.Format("2006-01-02"),
		"periodEnd":             periodEnd.Format("2006-01-02"),
		"dueDate":               periodEnd.Add(7 * 24 * time.Hour).Format("2006-01-02"),
		"currency":              "USD",
		"lineItems":             lineItems,
		"notes":                 notes,
	}, nil
}

func (a *app) getInvoiceDetail(ctx context.Context, invoiceID string) (map[string]any, error) {
	var billID, invoiceNumber, status, billingEntityName, taxID, currency, notes string
	var amount float64
	var periodStart, periodEnd, dueDate time.Time
	var issuedAt time.Time
	err := a.db.QueryRowContext(ctx, `
		SELECT bill_id, invoice_number, status, amount_usd, period_start, period_end, due_date, issued_at, billing_entity_name, COALESCE(tax_id,''), currency, COALESCE(notes,'')
		FROM invoice_records
		WHERE id = ?
		LIMIT 1
	`, invoiceID).Scan(&billID, &invoiceNumber, &status, &amount, &periodStart, &periodEnd, &dueDate, &issuedAt, &billingEntityName, &taxID, &currency, &notes)
	if err != nil {
		return nil, err
	}
	billDetail, err := a.getBillDetail(ctx, billID)
	if err != nil {
		return nil, err
	}
	lineItems := []map[string]any{}
	for _, raw := range billDetail["lineItems"].([]map[string]any) {
		lineItems = append(lineItems, map[string]any{
			"label":        raw["label"],
			"quantity":     1,
			"unitPriceUsd": raw["amountUsd"],
			"amountUsd":    raw["amountUsd"],
		})
	}
	return map[string]any{
		"id":                invoiceID,
		"invoiceNumber":     invoiceNumber,
		"status":            status,
		"amountUsd":         amount,
		"periodStart":       periodStart.Format("2006-01-02"),
		"periodEnd":         periodEnd.Format("2006-01-02"),
		"dueDate":           dueDate.Format("2006-01-02"),
		"issuedAt":          issuedAt.Format("2006-01-02 15:04:05"),
		"billingEntityName": billingEntityName,
		"taxId":             taxID,
		"currency":          currency,
		"lineItems":         lineItems,
		"notes":             notes,
	}, nil
}

func parseJSONObject(value string) map[string]any {
	result := map[string]any{}
	if strings.TrimSpace(value) == "" {
		return result
	}
	_ = json.Unmarshal([]byte(value), &result)
	return result
}

func asObject(value any) map[string]any {
	if value == nil {
		return map[string]any{}
	}
	if object, ok := value.(map[string]any); ok {
		return object
	}
	if object, ok := value.(map[string]interface{}); ok {
		return object
	}
	return map[string]any{}
}

func sanitizeStringList(items []string, max int) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		trimmed := strings.TrimSpace(item)
		if trimmed == "" {
			continue
		}
		result = append(result, trimmed)
		if len(result) >= max {
			break
		}
	}
	return result
}

func validateProjectSettings(payload map[string]any) (map[string]any, map[string]string) {
	fieldErrors := map[string]string{}

	projectName := strings.TrimSpace(stringValue(payload["projectName"], ""))
	environment := strings.TrimSpace(stringValue(payload["environment"], ""))
	defaultModel := strings.TrimSpace(stringValue(payload["defaultModel"], ""))
	callbackURL := strings.TrimSpace(stringValue(payload["callbackUrl"], ""))
	monthlyBudgetUSD := numberValue(payload["monthlyBudgetUsd"], -1)
	allowedOrigins := sanitizeStringList(stringSliceValue(payload["allowedOrigins"]), 20)
	tags := sanitizeStringList(stringSliceValue(payload["tags"]), 20)

	if len(projectName) < 2 || len(projectName) > 128 {
		fieldErrors["projectName"] = "项目名称至少 2 个字符，且不能超过 128 个字符"
	}
	if environment != "production" && environment != "staging" && environment != "development" {
		fieldErrors["environment"] = "环境必须是 production / staging / development"
	}
	if len(defaultModel) < 2 || len(defaultModel) > 64 {
		fieldErrors["defaultModel"] = "默认模型不能为空且不能超过 64 个字符"
	}
	if callbackURL != "" && !strings.HasPrefix(callbackURL, "http://") && !strings.HasPrefix(callbackURL, "https://") {
		fieldErrors["callbackUrl"] = "回调地址必须以 http:// 或 https:// 开头"
	}
	if monthlyBudgetUSD < 0 || monthlyBudgetUSD > 1_000_000 {
		fieldErrors["monthlyBudgetUsd"] = "月预算必须在 0 到 1000000 之间"
	}
	if len(stringSliceValue(payload["allowedOrigins"])) > 20 {
		fieldErrors["allowedOrigins"] = "允许来源不能超过 20 条"
	}
	if len(stringSliceValue(payload["tags"])) > 20 {
		fieldErrors["tags"] = "标签不能超过 20 条"
	}

	normalized := map[string]any{
		"projectName":      projectName,
		"environment":      environment,
		"defaultModel":     defaultModel,
		"callbackUrl":      callbackURL,
		"monthlyBudgetUsd": monthlyBudgetUSD,
		"allowedOrigins":   allowedOrigins,
		"tags":             tags,
	}
	return normalized, fieldErrors
}

func validateSecuritySettings(payload map[string]any) (map[string]any, map[string]string) {
	fieldErrors := map[string]string{}

	mfaRequired, mfaOK := payload["mfaRequired"].(bool)
	sessionTimeout := int(numberValue(payload["sessionTimeoutMinutes"], -1))
	ipAllowlist := sanitizeStringList(stringSliceValue(payload["ipAllowlist"]), 20)
	webhookSignatureRequired, webhookOK := payload["webhookSignatureRequired"].(bool)
	keyRotationDays := int(numberValue(payload["keyRotationDays"], -1))

	if !mfaOK {
		fieldErrors["mfaRequired"] = "mfaRequired 必须是布尔值"
	}
	if sessionTimeout < 15 || sessionTimeout > 1440 {
		fieldErrors["sessionTimeoutMinutes"] = "会话超时必须在 15 到 1440 分钟之间"
	}
	if len(stringSliceValue(payload["ipAllowlist"])) > 20 {
		fieldErrors["ipAllowlist"] = "IP 白名单不能超过 20 条"
	}
	for _, ip := range ipAllowlist {
		if !isLikelyCIDR(ip) {
			fieldErrors["ipAllowlist"] = "IP 白名单格式不正确"
			break
		}
	}
	if !webhookOK {
		fieldErrors["webhookSignatureRequired"] = "webhookSignatureRequired 必须是布尔值"
	}
	if keyRotationDays < 1 || keyRotationDays > 365 {
		fieldErrors["keyRotationDays"] = "Key 轮换周期必须在 1 到 365 天之间"
	}

	normalized := map[string]any{
		"mfaRequired":              mfaRequired,
		"sessionTimeoutMinutes":    sessionTimeout,
		"ipAllowlist":              ipAllowlist,
		"webhookSignatureRequired": webhookSignatureRequired,
		"keyRotationDays":          keyRotationDays,
	}
	return normalized, fieldErrors
}

func validateWebhookPayload(name, endpoint string, events []string, retryPolicy, status string) (map[string]any, map[string]string) {
	fieldErrors := map[string]string{}
	normalized := map[string]any{
		"name":        strings.TrimSpace(name),
		"endpoint":    strings.TrimSpace(endpoint),
		"events":      sanitizeStringList(events, 20),
		"retryPolicy": strings.TrimSpace(retryPolicy),
		"status":      strings.TrimSpace(status),
	}

	if len(stringValue(normalized["name"], "")) < 2 || len(stringValue(normalized["name"], "")) > 128 {
		fieldErrors["name"] = "名称长度必须在 2 到 128 个字符之间"
	}
	if !strings.HasPrefix(stringValue(normalized["endpoint"], ""), "http://") && !strings.HasPrefix(stringValue(normalized["endpoint"], ""), "https://") {
		fieldErrors["endpoint"] = "Endpoint 必须以 http:// 或 https:// 开头"
	}
	if len(normalized["events"].([]string)) == 0 {
		fieldErrors["events"] = "至少需要一个订阅事件"
	}
	if len(normalized["events"].([]string)) > 20 {
		fieldErrors["events"] = "订阅事件不能超过 20 个"
	}
	if len(stringValue(normalized["retryPolicy"], "")) < 2 || len(stringValue(normalized["retryPolicy"], "")) > 255 {
		fieldErrors["retryPolicy"] = "重试策略长度必须在 2 到 255 个字符之间"
	}
	if normalized["status"] == "" {
		normalized["status"] = "active"
	}
	allowedStatus := map[string]bool{"active": true, "disabled": true, "failing": true}
	if !allowedStatus[stringValue(normalized["status"], "")] {
		fieldErrors["status"] = "状态必须为 active/disabled/failing"
	}
	return normalized, fieldErrors
}

func (a *app) handleProjectSettings(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet && r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}

	if r.Method == http.MethodGet {
		var id int64
		var name, env string
		var monthlyCostCap float64
		var metadata sql.NullString
		err := a.db.QueryRowContext(r.Context(), `SELECT id, name, env, monthly_cost_cap, metadata FROM projects WHERE id = ? LIMIT 1`, 2001).Scan(&id, &name, &env, &monthlyCostCap, &metadata)
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "project_not_found", "未找到默认项目配置。", nil)
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "project_query_failed", err.Error(), nil)
			return
		}

		meta := parseJSONObject(metadata.String)
		consoleSettings := asObject(meta["console_settings"])
		environment := "development"
		if env == "prod" {
			environment = "production"
		} else if env == "staging" {
			environment = "staging"
		}

		writeData(w, http.StatusOK, map[string]any{
			"projectId":        fmt.Sprint(id),
			"projectName":      name,
			"environment":      environment,
			"defaultModel":     stringValue(consoleSettings["defaultModel"], "chat-pro"),
			"callbackUrl":      stringValue(consoleSettings["callbackUrl"], ""),
			"monthlyBudgetUsd": numberValue(consoleSettings["monthlyBudgetUsd"], monthlyCostCap),
			"allowedOrigins":   stringSliceValue(consoleSettings["allowedOrigins"]),
			"tags":             stringSliceValue(consoleSettings["tags"]),
		}, nil)
		return
	}

	var payload map[string]any
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}

	normalized, fieldErrors := validateProjectSettings(payload)
	if len(fieldErrors) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "项目设置校验失败。", map[string]any{"fieldErrors": fieldErrors})
		return
	}

	var metadata sql.NullString
	if err := a.db.QueryRowContext(r.Context(), `SELECT metadata FROM projects WHERE id = ? LIMIT 1`, 2001).Scan(&metadata); err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "project_not_found", "未找到默认项目配置。", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "project_query_failed", err.Error(), nil)
		return
	}

	meta := parseJSONObject(metadata.String)
	meta["console_settings"] = map[string]any{
		"defaultModel":     normalized["defaultModel"],
		"callbackUrl":      emptyToNil(stringValue(normalized["callbackUrl"], "")),
		"monthlyBudgetUsd": normalized["monthlyBudgetUsd"],
		"allowedOrigins":   normalized["allowedOrigins"],
		"tags":             normalized["tags"],
	}

	nextEnv := stringValue(normalized["environment"], "development")
	dbEnv := nextEnv
	if nextEnv == "production" {
		dbEnv = "prod"
	}

	metaBytes, _ := json.Marshal(meta)
	if _, err := a.db.ExecContext(
		r.Context(),
		`UPDATE projects SET name = ?, env = ?, monthly_cost_cap = ?, metadata = ?, updated_at = NOW() WHERE id = ?`,
		normalized["projectName"],
		dbEnv,
		normalized["monthlyBudgetUsd"],
		string(metaBytes),
		2001,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "project_update_failed", err.Error(), nil)
		return
	}

	r.Method = http.MethodGet
	a.handleProjectSettings(w, r)
}

func (a *app) handleSecuritySettings(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet && r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}

	if r.Method == http.MethodGet {
		var id int64
		var metadata sql.NullString
		var updatedAt time.Time
		err := a.db.QueryRowContext(r.Context(), `SELECT id, metadata, updated_at FROM organizations WHERE id = ? LIMIT 1`, 1001).Scan(&id, &metadata, &updatedAt)
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "organization_not_found", "未找到组织安全设置。", nil)
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "organization_query_failed", err.Error(), nil)
			return
		}

		meta := parseJSONObject(metadata.String)
		security := asObject(meta["security_settings"])
		writeData(w, http.StatusOK, map[string]any{
			"organizationId":           fmt.Sprint(id),
			"mfaRequired":              boolValue(security["mfaRequired"], false),
			"sessionTimeoutMinutes":    int(numberValue(security["sessionTimeoutMinutes"], 120)),
			"ipAllowlist":              stringSliceValue(security["ipAllowlist"]),
			"webhookSignatureRequired": boolValue(security["webhookSignatureRequired"], true),
			"keyRotationDays":          int(numberValue(security["keyRotationDays"], 90)),
			"lastSecurityReviewAt":     stringValue(security["lastSecurityReviewAt"], updatedAt.Format("2006-01-02 15:04:05")),
		}, nil)
		return
	}

	var payload map[string]any
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}

	normalized, fieldErrors := validateSecuritySettings(payload)
	if len(fieldErrors) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "安全设置校验失败。", map[string]any{"fieldErrors": fieldErrors})
		return
	}

	var metadata sql.NullString
	if err := a.db.QueryRowContext(r.Context(), `SELECT metadata FROM organizations WHERE id = ? LIMIT 1`, 1001).Scan(&metadata); err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "organization_not_found", "未找到组织安全设置。", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "organization_query_failed", err.Error(), nil)
		return
	}

	meta := parseJSONObject(metadata.String)
	meta["security_settings"] = map[string]any{
		"mfaRequired":              normalized["mfaRequired"],
		"sessionTimeoutMinutes":    normalized["sessionTimeoutMinutes"],
		"ipAllowlist":              normalized["ipAllowlist"],
		"webhookSignatureRequired": normalized["webhookSignatureRequired"],
		"keyRotationDays":          normalized["keyRotationDays"],
		"lastSecurityReviewAt":     time.Now().Format("2006-01-02 15:04:05"),
	}
	metaBytes, _ := json.Marshal(meta)
	if _, err := a.db.ExecContext(r.Context(), `UPDATE organizations SET metadata = ?, updated_at = NOW() WHERE id = ?`, string(metaBytes), 1001); err != nil {
		writeError(w, http.StatusInternalServerError, "organization_update_failed", err.Error(), nil)
		return
	}

	r.Method = http.MethodGet
	a.handleSecuritySettings(w, r)
}

func (a *app) handleRequestLogs(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	traceFilter := strings.TrimSpace(r.URL.Query().Get("trace_id"))
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	statusFilter := strings.TrimSpace(r.URL.Query().Get("status"))
	modelFilter := strings.TrimSpace(r.URL.Query().Get("model"))
	projectFilter := strings.TrimSpace(r.URL.Query().Get("project"))
	providerFilter := strings.TrimSpace(r.URL.Query().Get("provider"))
	page, pageSize := parsePage(r)

	rows, err := a.listRequestLogs(r.Context(), traceFilter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "request_logs_failed", err.Error(), nil)
		return
	}
	filtered := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		if statusFilter != "" && stringValue(row["requestStatus"], "") != statusFilter {
			continue
		}
		if modelFilter != "" && stringValue(row["modelName"], "") != modelFilter {
			continue
		}
		if projectFilter != "" && stringValue(row["projectName"], "") != projectFilter {
			continue
		}
		if providerFilter != "" && stringValue(row["providerCode"], "") != providerFilter {
			continue
		}
		if search != "" {
			searchable := strings.ToLower(strings.Join([]string{
				stringValue(row["traceId"], ""),
				stringValue(row["id"], ""),
				stringValue(row["apiKeyName"], ""),
				stringValue(row["modelName"], ""),
				stringValue(row["providerCode"], ""),
				stringValue(row["projectName"], ""),
			}, " "))
			if !strings.Contains(searchable, search) {
				continue
			}
		}
		filtered = append(filtered, row)
	}
	items, meta := paginate(filtered, page, pageSize)
	if traceFilter != "" {
		meta["traceId"] = traceFilter
	}
	writeData(w, http.StatusOK, items, meta)
}

func (a *app) handleRequestLogDetail(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	traceID := strings.TrimPrefix(r.URL.Path, "/v1/request-logs/")
	detail, err := a.getRequestLogDetail(r.Context(), traceID)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "request_log_not_found", "未找到对应的请求日志。", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "request_log_detail_failed", err.Error(), nil)
		return
	}
	writeData(w, http.StatusOK, detail, nil)
}

type modelCatalogDefaults struct {
	Summary            string
	ContextWindow      string
	Modalities         []string
	MaxOutputTokens    int
	LatencyTier        string
	BestFor            []string
	Limitations        []string
	DefaultTemperature float64
	StreamingSupported bool
}

const providerModelIDPrefix = "provider__"

func defaultsForModel(modelID string) modelCatalogDefaults {
	switch strings.TrimSpace(modelID) {
	case "chat-basic":
		return modelCatalogDefaults{
			Summary:            "入门型通用对话模型，适合低成本客服、FAQ 与轻量自动化任务。",
			ContextWindow:      "128K",
			Modalities:         []string{"text"},
			MaxOutputTokens:    4096,
			LatencyTier:        "standard",
			BestFor:            []string{"通用对话", "轻量客服", "低成本自动化"},
			Limitations:        []string{"复杂推理能力有限", "长链路工具编排能力一般"},
			DefaultTemperature: 0.6,
			StreamingSupported: true,
		}
	case "chat-pro":
		return modelCatalogDefaults{
			Summary:            "高质量通用对话模型，兼顾稳定性、质量与延迟。",
			ContextWindow:      "128K",
			Modalities:         []string{"text"},
			MaxOutputTokens:    8192,
			LatencyTier:        "standard",
			BestFor:            []string{"生产对话", "内容生成", "多轮交互"},
			Limitations:        []string{"复杂工具调用仍建议结合工作流编排"},
			DefaultTemperature: 0.4,
			StreamingSupported: true,
		}
	case "reasoning-pro":
		return modelCatalogDefaults{
			Summary:            "面向复杂推理与结构化输出，适合分析、规划与排障场景。",
			ContextWindow:      "128K",
			Modalities:         []string{"text"},
			MaxOutputTokens:    8192,
			LatencyTier:        "priority",
			BestFor:            []string{"复杂推理", "流程规划", "技术排障"},
			Limitations:        []string{"成本高于普通对话模型", "平均响应延迟更高"},
			DefaultTemperature: 0.2,
			StreamingSupported: true,
		}
	case "vision-pro":
		return modelCatalogDefaults{
			Summary:            "多模态模型，支持图像理解与文本结合分析。",
			ContextWindow:      "64K",
			Modalities:         []string{"text", "image"},
			MaxOutputTokens:    4096,
			LatencyTier:        "priority",
			BestFor:            []string{"图像理解", "图文问答", "视觉审核"},
			Limitations:        []string{"依赖外部可访问图片 URL", "超大图像可能被上游拒绝"},
			DefaultTemperature: 0.3,
			StreamingSupported: true,
		}
	case "embedding-large":
		return modelCatalogDefaults{
			Summary:            "向量化模型，用于语义检索、召回与知识库构建。",
			ContextWindow:      "32K",
			Modalities:         []string{"text"},
			MaxOutputTokens:    0,
			LatencyTier:        "batch",
			BestFor:            []string{"向量检索", "RAG 索引", "语义聚类"},
			Limitations:        []string{"仅返回向量，不返回文本生成", "当前环境未启用可用上游"},
			DefaultTemperature: 0,
			StreamingSupported: false,
		}
	default:
		return modelCatalogDefaults{
			Summary:            "逻辑模型占位符。",
			ContextWindow:      "N/A",
			Modalities:         []string{"text"},
			MaxOutputTokens:    2048,
			LatencyTier:        "standard",
			BestFor:            []string{"通用场景"},
			Limitations:        []string{"请在管理后台补充模型说明与限制"},
			DefaultTemperature: 0.4,
			StreamingSupported: true,
		}
	}
}

func buildProviderModelID(providerCode, providerModel string) string {
	encodedModel := base64.RawURLEncoding.EncodeToString([]byte(strings.TrimSpace(providerModel)))
	return providerModelIDPrefix + strings.TrimSpace(providerCode) + "__" + encodedModel
}

func parseProviderModelID(modelID string) (providerCode string, providerModel string, ok bool) {
	if !strings.HasPrefix(modelID, providerModelIDPrefix) {
		return "", "", false
	}
	rest := strings.TrimPrefix(modelID, providerModelIDPrefix)
	parts := strings.SplitN(rest, "__", 2)
	if len(parts) != 2 {
		return "", "", false
	}
	providerCode = strings.TrimSpace(parts[0])
	if providerCode == "" {
		return "", "", false
	}
	decoded, err := base64.RawURLEncoding.DecodeString(strings.TrimSpace(parts[1]))
	if err != nil {
		return "", "", false
	}
	providerModel = strings.TrimSpace(string(decoded))
	if providerModel == "" {
		return "", "", false
	}
	return providerCode, providerModel, true
}

func parseCSVOrdered(value string) []string {
	parts := strings.Split(strings.TrimSpace(value), ",")
	seen := map[string]struct{}{}
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		text := strings.TrimSpace(part)
		if text == "" {
			continue
		}
		if _, exists := seen[text]; exists {
			continue
		}
		seen[text] = struct{}{}
		out = append(out, text)
	}
	return out
}

func logicalModelModalities(modelNames []string) []string {
	hasText := false
	hasImage := false
	for _, modelName := range modelNames {
		switch strings.TrimSpace(modelName) {
		case "vision-pro":
			hasText = true
			hasImage = true
		case "embedding-large":
			hasText = true
		default:
			if modelName != "" {
				hasText = true
			}
		}
	}
	out := make([]string, 0, 2)
	if hasText {
		out = append(out, "text")
	}
	if hasImage {
		out = append(out, "image")
	}
	if len(out) == 0 {
		out = append(out, "text")
	}
	return out
}

func buildPricingText(minInput, minOutput float64, activeRoutes int) string {
	if activeRoutes <= 0 {
		return "当前无可用上游路由，请联系管理员检查 provider/channel 状态。"
	}
	return fmt.Sprintf("$%.4f / 1K 输入 • $%.4f / 1K 输出", minInput, minOutput)
}

func (a *app) loadModelEntitlementAvailability(ctx context.Context) (map[string]bool, error) {
	rows, err := a.db.QueryContext(ctx, `
		SELECT external_model_name, MAX(is_enabled) AS enabled
		FROM model_entitlements
		GROUP BY external_model_name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string]bool{}
	for rows.Next() {
		var modelName string
		var enabled int
		if err := rows.Scan(&modelName, &enabled); err != nil {
			return nil, err
		}
		result[strings.TrimSpace(modelName)] = enabled > 0
	}
	return result, rows.Err()
}

func (a *app) listModelCatalog(ctx context.Context) ([]map[string]any, error) {
	queryRows, err := a.db.QueryContext(ctx, `
		SELECT
			external_model_name,
			SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_routes,
			COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_input_1k END), 0) AS min_input_cost,
			COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_output_1k END), 0) AS min_output_cost,
			COALESCE(MIN(CASE WHEN is_active = 1 THEN latency_slo_ms END), 0) AS min_latency,
			COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN is_active = 1 THEN provider_code END ORDER BY priority SEPARATOR ','), '') AS providers
		FROM provider_routes
		GROUP BY external_model_name
		ORDER BY external_model_name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer queryRows.Close()

	entitlements, err := a.loadModelEntitlementAvailability(ctx)
	if err != nil {
		return nil, err
	}

	items := make([]map[string]any, 0, 8)
	for queryRows.Next() {
		var modelName, providersCSV string
		var activeRoutes int
		var minInputCost, minOutputCost float64
		var minLatency int
		if err := queryRows.Scan(&modelName, &activeRoutes, &minInputCost, &minOutputCost, &minLatency, &providersCSV); err != nil {
			return nil, err
		}
		modelName = strings.TrimSpace(modelName)
		defaults := defaultsForModel(modelName)
		providers := parseCSVOrdered(providersCSV)
		available := activeRoutes > 0
		if enabled, ok := entitlements[modelName]; ok {
			available = available && enabled
		}

		summary := defaults.Summary
		if len(providers) > 0 {
			summary = fmt.Sprintf("%s 候选上游：%s", defaults.Summary, strings.Join(providers, " / "))
		}
		if !available {
			summary += "（当前未授权或未启用）"
		}
		if minLatency > 0 {
			summary += fmt.Sprintf("，目标延迟 ≤ %dms", minLatency)
		}

		items = append(items, map[string]any{
			"id":            modelName,
			"publicName":    modelName,
			"summary":       summary,
			"contextWindow": defaults.ContextWindow,
			"modalities":    defaults.Modalities,
			"pricingText":   buildPricingText(minInputCost, minOutputCost, activeRoutes),
			"available":     available,
		})
	}
	if err := queryRows.Err(); err != nil {
		return nil, err
	}

	// 补充：将 Nvidia 作为独立模型卡片展示（不是只在逻辑模型中作为候选上游）
	providerRows, err := a.db.QueryContext(ctx, `
		SELECT
			provider_code,
			provider_model,
			SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_routes,
			COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_input_1k END), 0) AS min_input_cost,
			COALESCE(MIN(CASE WHEN is_active = 1 THEN cost_per_output_1k END), 0) AS min_output_cost,
			COALESCE(MIN(CASE WHEN is_active = 1 THEN latency_slo_ms END), 0) AS min_latency,
			COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN is_active = 1 THEN external_model_name END ORDER BY external_model_name SEPARATOR ','), '') AS logical_models
		FROM provider_routes
		WHERE provider_code LIKE 'nvidia%'
		GROUP BY provider_code, provider_model
		ORDER BY provider_code ASC, provider_model ASC
	`)
	if err != nil {
		return nil, err
	}
	defer providerRows.Close()

	for providerRows.Next() {
		var providerCode, providerModel, logicalModelsCSV string
		var activeRoutes int
		var minInputCost, minOutputCost float64
		var minLatency int
		if err := providerRows.Scan(
			&providerCode,
			&providerModel,
			&activeRoutes,
			&minInputCost,
			&minOutputCost,
			&minLatency,
			&logicalModelsCSV,
		); err != nil {
			return nil, err
		}
		logicalModels := parseCSVOrdered(logicalModelsCSV)
		summary := fmt.Sprintf(
			"NVIDIA 独立上游卡片，映射逻辑模型：%s。当前作为候选备路由，实际生效需以 new-api 渠道状态为准。",
			strings.Join(logicalModels, " / "),
		)
		if minLatency > 0 {
			summary += fmt.Sprintf(" 目标延迟 ≤ %dms", minLatency)
		}
		items = append(items, map[string]any{
			"id":            buildProviderModelID(providerCode, providerModel),
			"publicName":    fmt.Sprintf("NVIDIA · %s · %s", providerCode, providerModel),
			"summary":       summary,
			"contextWindow": "按逻辑模型继承",
			"modalities":    logicalModelModalities(logicalModels),
			"pricingText":   buildPricingText(minInputCost, minOutputCost, activeRoutes),
			"available":     activeRoutes > 0,
		})
	}
	if err := providerRows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (a *app) getModelCatalogDetail(ctx context.Context, modelID string) (map[string]any, error) {
	if providerCode, providerModel, ok := parseProviderModelID(modelID); ok {
		return a.getProviderModelDetail(ctx, providerCode, providerModel, modelID)
	}

	rows, err := a.db.QueryContext(ctx, `
		SELECT
			provider_code,
			provider_model,
			internal_model_profile,
			cost_per_input_1k,
			cost_per_output_1k,
			latency_slo_ms,
			is_active
		FROM provider_routes
		WHERE external_model_name = ?
		ORDER BY is_active DESC, priority ASC, id ASC
	`, modelID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type routeItem struct {
		ProviderCode  string
		ProviderModel string
		Profile       string
		InputCost     float64
		OutputCost    float64
		Latency       int
		IsActive      bool
	}

	routeItems := make([]routeItem, 0, 8)
	for rows.Next() {
		var item routeItem
		var activeInt int
		if err := rows.Scan(
			&item.ProviderCode,
			&item.ProviderModel,
			&item.Profile,
			&item.InputCost,
			&item.OutputCost,
			&item.Latency,
			&activeInt,
		); err != nil {
			return nil, err
		}
		item.ProviderCode = strings.TrimSpace(item.ProviderCode)
		item.ProviderModel = strings.TrimSpace(item.ProviderModel)
		item.Profile = strings.TrimSpace(item.Profile)
		item.IsActive = activeInt > 0
		routeItems = append(routeItems, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(routeItems) == 0 {
		return nil, sql.ErrNoRows
	}

	entitlements, err := a.loadModelEntitlementAvailability(ctx)
	if err != nil {
		return nil, err
	}
	defaults := defaultsForModel(modelID)
	available := false
	activeRouteCount := 0
	minInputCost := 0.0
	minOutputCost := 0.0
	minLatency := 0

	routeProfiles := make([]string, 0, 8)
	routeProfileSet := map[string]struct{}{}
	backingProviders := make([]string, 0, 8)
	backingProviderSet := map[string]struct{}{}

	for _, item := range routeItems {
		if item.Profile != "" {
			if _, exists := routeProfileSet[item.Profile]; !exists {
				routeProfileSet[item.Profile] = struct{}{}
				routeProfiles = append(routeProfiles, item.Profile)
			}
		}
		if item.ProviderCode != "" {
			providerLabel := item.ProviderCode
			if item.ProviderModel != "" {
				providerLabel = fmt.Sprintf("%s (%s)", item.ProviderCode, item.ProviderModel)
			}
			if _, exists := backingProviderSet[providerLabel]; !exists {
				backingProviderSet[providerLabel] = struct{}{}
				backingProviders = append(backingProviders, providerLabel)
			}
		}
		if item.IsActive {
			activeRouteCount++
			available = true
			if minInputCost == 0 || item.InputCost < minInputCost {
				minInputCost = item.InputCost
			}
			if minOutputCost == 0 || item.OutputCost < minOutputCost {
				minOutputCost = item.OutputCost
			}
			if minLatency == 0 || item.Latency < minLatency {
				minLatency = item.Latency
			}
		}
	}
	if enabled, ok := entitlements[modelID]; ok {
		available = available && enabled
	}

	limitations := append([]string{}, defaults.Limitations...)
	if !available {
		limitations = append(limitations, "当前模型在本组织/项目尚未启用，或可用路由未激活。")
	}
	if minLatency > 0 {
		limitations = append(limitations, fmt.Sprintf("当前最佳路由延迟目标：%dms（以实时监控为准）。", minLatency))
	}

	return map[string]any{
		"id":                 modelID,
		"publicName":         modelID,
		"summary":            defaults.Summary,
		"contextWindow":      defaults.ContextWindow,
		"modalities":         defaults.Modalities,
		"pricingText":        buildPricingText(minInputCost, minOutputCost, activeRouteCount),
		"available":          available,
		"maxOutputTokens":    defaults.MaxOutputTokens,
		"latencyTier":        defaults.LatencyTier,
		"routeProfiles":      routeProfiles,
		"backingProviders":   backingProviders,
		"bestFor":            defaults.BestFor,
		"limitations":        limitations,
		"defaultTemperature": defaults.DefaultTemperature,
		"streamingSupported": defaults.StreamingSupported,
	}, nil
}

func (a *app) getProviderModelDetail(ctx context.Context, providerCode, providerModel, modelID string) (map[string]any, error) {
	rows, err := a.db.QueryContext(ctx, `
		SELECT
			external_model_name,
			internal_model_profile,
			cost_per_input_1k,
			cost_per_output_1k,
			latency_slo_ms,
			is_active
		FROM provider_routes
		WHERE provider_code = ? AND provider_model = ?
		ORDER BY is_active DESC, priority ASC, id ASC
	`, providerCode, providerModel)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type providerRoute struct {
		ExternalModel string
		Profile       string
		InputCost     float64
		OutputCost    float64
		Latency       int
		IsActive      bool
	}

	routeItems := make([]providerRoute, 0, 8)
	for rows.Next() {
		var route providerRoute
		var activeInt int
		if err := rows.Scan(
			&route.ExternalModel,
			&route.Profile,
			&route.InputCost,
			&route.OutputCost,
			&route.Latency,
			&activeInt,
		); err != nil {
			return nil, err
		}
		route.ExternalModel = strings.TrimSpace(route.ExternalModel)
		route.Profile = strings.TrimSpace(route.Profile)
		route.IsActive = activeInt > 0
		routeItems = append(routeItems, route)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(routeItems) == 0 {
		return nil, sql.ErrNoRows
	}

	activeRouteCount := 0
	minInputCost := 0.0
	minOutputCost := 0.0
	minLatency := 0
	maxOutputTokens := 0
	routeProfiles := make([]string, 0, 8)
	routeProfileSet := map[string]struct{}{}
	logicalModels := make([]string, 0, 8)
	logicalModelSet := map[string]struct{}{}
	bestFor := make([]string, 0, 8)
	bestForSet := map[string]struct{}{}
	streamingSupported := false

	for _, item := range routeItems {
		if item.Profile != "" {
			if _, exists := routeProfileSet[item.Profile]; !exists {
				routeProfileSet[item.Profile] = struct{}{}
				routeProfiles = append(routeProfiles, item.Profile)
			}
		}
		if item.ExternalModel != "" {
			if _, exists := logicalModelSet[item.ExternalModel]; !exists {
				logicalModelSet[item.ExternalModel] = struct{}{}
				logicalModels = append(logicalModels, item.ExternalModel)
				defaults := defaultsForModel(item.ExternalModel)
				if defaults.MaxOutputTokens > maxOutputTokens {
					maxOutputTokens = defaults.MaxOutputTokens
				}
				if defaults.StreamingSupported {
					streamingSupported = true
				}
				for _, scene := range defaults.BestFor {
					if _, existsScene := bestForSet[scene]; !existsScene && scene != "" {
						bestForSet[scene] = struct{}{}
						bestFor = append(bestFor, scene)
					}
				}
			}
		}
		if item.IsActive {
			activeRouteCount++
			if minInputCost == 0 || item.InputCost < minInputCost {
				minInputCost = item.InputCost
			}
			if minOutputCost == 0 || item.OutputCost < minOutputCost {
				minOutputCost = item.OutputCost
			}
			if minLatency == 0 || item.Latency < minLatency {
				minLatency = item.Latency
			}
		}
	}

	latencyTier := "standard"
	if minLatency > 4000 {
		latencyTier = "priority"
	}
	if minLatency == 0 {
		latencyTier = "batch"
	}

	limitations := []string{
		"该卡片用于观察供应商映射与成本，不建议客户端直接绑定供应商名调用。",
		"是否真实可调取决于 new-api 渠道启用状态与上游配额。",
	}
	if minLatency > 0 {
		limitations = append(limitations, fmt.Sprintf("当前最佳延迟目标：%dms（以实时监控为准）。", minLatency))
	}
	if activeRouteCount == 0 {
		limitations = append(limitations, "当前无激活路由，请检查 provider_routes.is_active 与渠道状态。")
	}

	return map[string]any{
		"id":                 modelID,
		"publicName":         fmt.Sprintf("NVIDIA · %s · %s", providerCode, providerModel),
		"summary":            fmt.Sprintf("NVIDIA 供应商独立模型卡片。覆盖逻辑模型：%s", strings.Join(logicalModels, " / ")),
		"contextWindow":      "按逻辑模型继承",
		"modalities":         logicalModelModalities(logicalModels),
		"pricingText":        buildPricingText(minInputCost, minOutputCost, activeRouteCount),
		"available":          activeRouteCount > 0,
		"maxOutputTokens":    maxOutputTokens,
		"latencyTier":        latencyTier,
		"routeProfiles":      routeProfiles,
		"backingProviders":   []string{fmt.Sprintf("%s (%s)", providerCode, providerModel)},
		"bestFor":            bestFor,
		"limitations":        limitations,
		"defaultTemperature": 0.3,
		"streamingSupported": streamingSupported,
	}, nil
}

func (a *app) handleModels(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	items, err := a.listModelCatalog(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "models_query_failed", err.Error(), nil)
		return
	}
	writeData(w, http.StatusOK, items, nil)
}

func (a *app) handleModelByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	modelID := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/v1/models/"))
	if modelID == "" {
		writeError(w, http.StatusBadRequest, "model_id_required", "model_id is required", nil)
		return
	}
	detail, err := a.getModelCatalogDetail(r.Context(), modelID)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "model_not_found", "未找到对应模型。", map[string]any{"modelId": modelID})
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "model_detail_failed", err.Error(), nil)
		return
	}
	writeData(w, http.StatusOK, detail, nil)
}

func (a *app) listInvoices(ctx context.Context) ([]map[string]any, error) {
	rows, err := a.db.QueryContext(ctx, `
		SELECT id, bill_id, invoice_number, status, amount_usd, period_start, period_end, due_date, issued_at, billing_entity_name, COALESCE(tax_id,''), currency, COALESCE(notes,'')
		FROM invoice_records
		ORDER BY period_start DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []map[string]any{}
	for rows.Next() {
		var id, billID, invoiceNumber, status, billingEntityName, taxID, currency, notes string
		var amount float64
		var periodStart, periodEnd, dueDate time.Time
		var issuedAt time.Time
		if err := rows.Scan(&id, &billID, &invoiceNumber, &status, &amount, &periodStart, &periodEnd, &dueDate, &issuedAt, &billingEntityName, &taxID, &currency, &notes); err != nil {
			return nil, err
		}
		result = append(result, map[string]any{
			"id":                id,
			"billId":            billID,
			"invoiceNumber":     invoiceNumber,
			"status":            status,
			"amountUsd":         amount,
			"periodStart":       periodStart.Format("2006-01-02"),
			"periodEnd":         periodEnd.Format("2006-01-02"),
			"dueDate":           dueDate.Format("2006-01-02"),
			"issuedAt":          issuedAt.Format("2006-01-02 15:04:05"),
			"billingEntityName": billingEntityName,
			"taxId":             taxID,
			"currency":          currency,
			"notes":             notes,
		})
	}
	return result, rows.Err()
}

func (a *app) handleBills(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	amountMin := parseOptionalFloat(r.URL.Query().Get("amount_min"))
	amountMax := parseOptionalFloat(r.URL.Query().Get("amount_max"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"billNumber":   "billNumber",
		"bill_number":  "billNumber",
		"id":           "id",
		"status":       "status",
		"amountUsd":    "amountUsd",
		"amount_usd":   "amountUsd",
		"periodStart":  "periodStart",
		"period_start": "periodStart",
		"dueDate":      "dueDate",
		"due_date":     "dueDate",
	}, "periodStart")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	page, pageSize := parsePage(r)
	rows, err := a.listBills(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "bills_query_failed", err.Error(), nil)
		return
	}
	filtered := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		if !matchesCSVFilter(stringValue(row["status"], ""), statusSet) {
			continue
		}
		searchable := strings.ToLower(stringValue(row["billNumber"], "") + " " + stringValue(row["id"], ""))
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		if !matchesDateRange(row["periodStart"], dateFrom, dateTo) {
			continue
		}
		if !matchesAmountRange(row["amountUsd"], amountMin, amountMax) {
			continue
		}
		filtered = append(filtered, row)
	}
	sortRows(filtered, sortBy, sortDir)
	items, meta := paginate(filtered, page, pageSize)
	writeData(w, http.StatusOK, items, meta)
}

func (a *app) handleBillsExport(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	amountMin := parseOptionalFloat(r.URL.Query().Get("amount_min"))
	amountMax := parseOptionalFloat(r.URL.Query().Get("amount_max"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"billNumber":   "billNumber",
		"bill_number":  "billNumber",
		"id":           "id",
		"status":       "status",
		"amountUsd":    "amountUsd",
		"amount_usd":   "amountUsd",
		"periodStart":  "periodStart",
		"period_start": "periodStart",
		"dueDate":      "dueDate",
		"due_date":     "dueDate",
	}, "periodStart")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	rows, err := a.listBills(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "bills_export_failed", err.Error(), nil)
		return
	}
	filtered := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		if !matchesCSVFilter(stringValue(row["status"], ""), statusSet) {
			continue
		}
		searchable := strings.ToLower(stringValue(row["billNumber"], "") + " " + stringValue(row["id"], ""))
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		if !matchesDateRange(row["periodStart"], dateFrom, dateTo) {
			continue
		}
		if !matchesAmountRange(row["amountUsd"], amountMin, amountMax) {
			continue
		}
		filtered = append(filtered, row)
	}
	sortRows(filtered, sortBy, sortDir)
	records := make([][]string, 0, len(filtered))
	for _, row := range filtered {
		records = append(records, []string{
			stringValue(row["billNumber"], ""),
			stringValue(row["status"], ""),
			fmt.Sprintf("%.6f", numberValue(row["amountUsd"], 0)),
			stringValue(row["periodStart"], ""),
			stringValue(row["periodEnd"], ""),
			stringValue(row["dueDate"], ""),
		})
	}
	writeCSV(w, "bills.csv", []string{"bill_number", "status", "amount_usd", "period_start", "period_end", "due_date"}, records)
}

func (a *app) handleBillByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	billID := strings.TrimPrefix(r.URL.Path, "/v1/billing/bills/")
	if billID == "" {
		writeError(w, http.StatusNotFound, "bill_not_found", "未找到对应账单。", nil)
		return
	}
	if r.Method == http.MethodGet {
		detail, err := a.getBillDetail(r.Context(), billID)
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "bill_not_found", "未找到对应账单。", nil)
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "bill_detail_failed", err.Error(), nil)
			return
		}
		writeData(w, http.StatusOK, detail, nil)
		return
	}
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	var payload struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}
	status := strings.TrimSpace(payload.Status)
	allowed := map[string]bool{"open": true, "settled": true, "partial": true, "overdue": true, "canceled": true}
	if !allowed[status] {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "账单状态不合法。", map[string]any{"fieldErrors": map[string]string{"status": "状态必须为 open/settled/partial/overdue/canceled"}})
		return
	}
	if _, err := a.db.ExecContext(r.Context(), `
		INSERT INTO bill_overrides (bill_id, status, notes, updated_at)
		VALUES (?, ?, ?, NOW())
		ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), updated_at = NOW()
	`, billID, status, strings.TrimSpace(payload.Notes)); err != nil {
		writeError(w, http.StatusInternalServerError, "bill_update_failed", err.Error(), nil)
		return
	}
	r.Method = http.MethodGet
	a.handleBillByID(w, r)
}

func (a *app) handleInvoices(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method == http.MethodPost {
		var payload struct {
			BillID            string  `json:"billId"`
			BillingEntityName string  `json:"billingEntityName"`
			TaxID             string  `json:"taxId"`
			Notes             string  `json:"notes"`
			DueDate           string  `json:"dueDate"`
			AmountUSD         float64 `json:"amountUsd"`
		}
		if err := decodeJSON(r, &payload); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
			return
		}
		billID := strings.TrimSpace(payload.BillID)
		if billID == "" {
			writeError(w, http.StatusUnprocessableEntity, "validation_failed", "发票创建校验失败。", map[string]any{"fieldErrors": map[string]string{"billId": "billId 不能为空"}})
			return
		}
		billDetail, err := a.getBillDetail(r.Context(), billID)
		if err != nil {
			writeError(w, http.StatusNotFound, "bill_not_found", "未找到可用于开票的账单。", nil)
			return
		}
		invoiceID := "inv_" + strings.TrimPrefix(billID, "bill_")
		invoiceNumber := "INV-" + strings.TrimPrefix(billID, "bill_")
		dueDate := stringValue(payload.DueDate, stringValue(billDetail["dueDate"], ""))
		if strings.TrimSpace(dueDate) == "" {
			dueDate = time.Now().Add(7 * 24 * time.Hour).Format("2006-01-02")
		}
		amount := payload.AmountUSD
		if amount <= 0 {
			amount = numberValue(billDetail["amountUsd"], 0)
		}
		if _, err := a.db.ExecContext(r.Context(), `
			INSERT INTO invoice_records
				(id, bill_id, invoice_number, status, amount_usd, period_start, period_end, due_date, issued_at, billing_entity_name, tax_id, currency, notes, updated_at)
			VALUES (?, ?, ?, 'issued', ?, ?, ?, ?, NOW(), ?, ?, 'USD', ?, NOW())
			ON DUPLICATE KEY UPDATE billing_entity_name = VALUES(billing_entity_name), tax_id = VALUES(tax_id), notes = VALUES(notes), amount_usd = VALUES(amount_usd), due_date = VALUES(due_date), updated_at = NOW()
		`, invoiceID, billID, invoiceNumber, amount, stringValue(billDetail["periodStart"], ""), stringValue(billDetail["periodEnd"], ""), dueDate, firstNonEmpty(strings.TrimSpace(payload.BillingEntityName), "Demo Organization"), emptyToNil(strings.TrimSpace(payload.TaxID)), strings.TrimSpace(payload.Notes)); err != nil {
			writeError(w, http.StatusInternalServerError, "invoice_create_failed", err.Error(), nil)
			return
		}
		detail, err := a.getInvoiceDetail(r.Context(), invoiceID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "invoice_create_failed", err.Error(), nil)
			return
		}
		writeData(w, http.StatusOK, detail, nil)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}

	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	amountMin := parseOptionalFloat(r.URL.Query().Get("amount_min"))
	amountMax := parseOptionalFloat(r.URL.Query().Get("amount_max"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"invoiceNumber":  "invoiceNumber",
		"invoice_number": "invoiceNumber",
		"billId":         "billId",
		"bill_id":        "billId",
		"status":         "status",
		"amountUsd":      "amountUsd",
		"amount_usd":     "amountUsd",
		"periodStart":    "periodStart",
		"period_start":   "periodStart",
		"periodEnd":      "periodEnd",
		"period_end":     "periodEnd",
		"dueDate":        "dueDate",
		"due_date":       "dueDate",
		"issuedAt":       "issuedAt",
		"issued_at":      "issuedAt",
	}, "issuedAt")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	page, pageSize := parsePage(r)
	rows, err := a.listInvoices(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "invoices_query_failed", err.Error(), nil)
		return
	}
	filtered := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		if !matchesCSVFilter(stringValue(row["status"], ""), statusSet) {
			continue
		}
		searchable := strings.ToLower(stringValue(row["invoiceNumber"], "") + " " + stringValue(row["billId"], "") + " " + stringValue(row["billingEntityName"], ""))
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		if !matchesDateRange(row["issuedAt"], dateFrom, dateTo) {
			continue
		}
		if !matchesAmountRange(row["amountUsd"], amountMin, amountMax) {
			continue
		}
		filtered = append(filtered, row)
	}
	sortRows(filtered, sortBy, sortDir)
	items, meta := paginate(filtered, page, pageSize)
	writeData(w, http.StatusOK, items, meta)
}

func (a *app) handleInvoicesExport(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	amountMin := parseOptionalFloat(r.URL.Query().Get("amount_min"))
	amountMax := parseOptionalFloat(r.URL.Query().Get("amount_max"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"invoiceNumber":  "invoiceNumber",
		"invoice_number": "invoiceNumber",
		"billId":         "billId",
		"bill_id":        "billId",
		"status":         "status",
		"amountUsd":      "amountUsd",
		"amount_usd":     "amountUsd",
		"periodStart":    "periodStart",
		"period_start":   "periodStart",
		"periodEnd":      "periodEnd",
		"period_end":     "periodEnd",
		"dueDate":        "dueDate",
		"due_date":       "dueDate",
		"issuedAt":       "issuedAt",
		"issued_at":      "issuedAt",
	}, "issuedAt")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	rows, err := a.listInvoices(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "invoices_export_failed", err.Error(), nil)
		return
	}
	filtered := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		if !matchesCSVFilter(stringValue(row["status"], ""), statusSet) {
			continue
		}
		searchable := strings.ToLower(stringValue(row["invoiceNumber"], "") + " " + stringValue(row["billId"], "") + " " + stringValue(row["billingEntityName"], ""))
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		if !matchesDateRange(row["issuedAt"], dateFrom, dateTo) {
			continue
		}
		if !matchesAmountRange(row["amountUsd"], amountMin, amountMax) {
			continue
		}
		filtered = append(filtered, row)
	}
	sortRows(filtered, sortBy, sortDir)
	records := make([][]string, 0, len(filtered))
	for _, row := range filtered {
		records = append(records, []string{
			stringValue(row["invoiceNumber"], ""),
			stringValue(row["status"], ""),
			fmt.Sprintf("%.6f", numberValue(row["amountUsd"], 0)),
			stringValue(row["periodStart"], ""),
			stringValue(row["periodEnd"], ""),
			stringValue(row["dueDate"], ""),
		})
	}
	writeCSV(w, "invoices.csv", []string{"invoice_number", "status", "amount_usd", "period_start", "period_end", "due_date"}, records)
}

func (a *app) handleInvoiceByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	invoiceID := strings.TrimPrefix(r.URL.Path, "/v1/billing/invoices/")
	if invoiceID == "" {
		writeError(w, http.StatusNotFound, "invoice_not_found", "未找到对应发票。", nil)
		return
	}
	if r.Method == http.MethodGet {
		detail, err := a.getInvoiceDetail(r.Context(), invoiceID)
		if err == sql.ErrNoRows {
			writeError(w, http.StatusNotFound, "invoice_not_found", "未找到对应发票。", nil)
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "invoice_detail_failed", err.Error(), nil)
			return
		}
		writeData(w, http.StatusOK, detail, nil)
		return
	}
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	var payload struct {
		Status            string `json:"status"`
		BillingEntityName string `json:"billingEntityName"`
		TaxID             string `json:"taxId"`
		Notes             string `json:"notes"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}
	status := strings.TrimSpace(payload.Status)
	allowed := map[string]bool{"draft": true, "issued": true, "paid": true, "void": true, "overdue": true}
	if !allowed[status] {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "发票状态不合法。", map[string]any{"fieldErrors": map[string]string{"status": "状态必须为 draft/issued/paid/void/overdue"}})
		return
	}
	if _, err := a.db.ExecContext(r.Context(), `
		UPDATE invoice_records
		SET status = ?, billing_entity_name = COALESCE(NULLIF(?, ''), billing_entity_name), tax_id = ?, notes = ?, updated_at = NOW()
		WHERE id = ?
	`, status, strings.TrimSpace(payload.BillingEntityName), emptyToNil(strings.TrimSpace(payload.TaxID)), strings.TrimSpace(payload.Notes), invoiceID); err != nil {
		writeError(w, http.StatusInternalServerError, "invoice_update_failed", err.Error(), nil)
		return
	}
	r.Method = http.MethodGet
	a.handleInvoiceByID(w, r)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func (a *app) handleTeamMembers(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	role := strings.TrimSpace(r.URL.Query().Get("role"))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"id":             "id",
		"displayName":    "displayName",
		"display_name":   "displayName",
		"email":          "email",
		"role":           "role",
		"status":         "status",
		"lastActiveAt":   "lastActiveAt",
		"last_active_at": "lastActiveAt",
	}, "displayName")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	page, pageSize := parsePage(r)
	rows, err := a.db.QueryContext(r.Context(), `SELECT id, display_name, email, role, project_scope_json, status, last_active_at FROM team_members ORDER BY created_at ASC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "team_query_failed", err.Error(), nil)
		return
	}
	defer rows.Close()

	itemsAll := []map[string]any{}
	for rows.Next() {
		var id, displayName, email, memberRole, scopeJSON, memberStatus string
		var lastActiveAt sql.NullTime
		if err := rows.Scan(&id, &displayName, &email, &memberRole, &scopeJSON, &memberStatus, &lastActiveAt); err != nil {
			writeError(w, http.StatusInternalServerError, "team_scan_failed", err.Error(), nil)
			return
		}
		projectScope := stringSliceValue(scopeJSON)
		if role != "" && role != memberRole {
			continue
		}
		if !matchesCSVFilter(memberStatus, statusSet) {
			continue
		}
		searchable := strings.ToLower(displayName + " " + email + " " + memberRole)
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		lastActive := ""
		if lastActiveAt.Valid {
			lastActive = lastActiveAt.Time.Format("2006-01-02 15:04:05")
		}
		if !matchesDateRange(lastActive, dateFrom, dateTo) {
			continue
		}
		itemsAll = append(itemsAll, map[string]any{
			"id":           id,
			"displayName":  displayName,
			"email":        email,
			"role":         memberRole,
			"projectScope": projectScope,
			"status":       memberStatus,
			"lastActiveAt": lastActive,
		})
	}
	sortRows(itemsAll, sortBy, sortDir)
	items, meta := paginate(itemsAll, page, pageSize)
	writeData(w, http.StatusOK, items, meta)
}

func (a *app) handleTeamMembersExport(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	roleFilter := strings.TrimSpace(r.URL.Query().Get("role"))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"displayName":    "displayName",
		"display_name":   "displayName",
		"email":          "email",
		"role":           "role",
		"status":         "status",
		"lastActiveAt":   "lastActiveAt",
		"last_active_at": "lastActiveAt",
	}, "displayName")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	rows, err := a.db.QueryContext(r.Context(), `SELECT display_name, email, role, status, last_active_at FROM team_members ORDER BY created_at ASC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "team_export_failed", err.Error(), nil)
		return
	}
	defer rows.Close()
	filtered := []map[string]any{}
	for rows.Next() {
		var displayName, email, memberRole, memberStatus string
		var lastActiveAt sql.NullTime
		if err := rows.Scan(&displayName, &email, &memberRole, &memberStatus, &lastActiveAt); err != nil {
			writeError(w, http.StatusInternalServerError, "team_export_failed", err.Error(), nil)
			return
		}
		if roleFilter != "" && roleFilter != memberRole {
			continue
		}
		if !matchesCSVFilter(memberStatus, statusSet) {
			continue
		}
		searchable := strings.ToLower(displayName + " " + email + " " + memberRole)
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		lastActive := ""
		if lastActiveAt.Valid {
			lastActive = lastActiveAt.Time.Format("2006-01-02 15:04:05")
		}
		if !matchesDateRange(lastActive, dateFrom, dateTo) {
			continue
		}
		filtered = append(filtered, map[string]any{
			"displayName":  displayName,
			"email":        email,
			"role":         memberRole,
			"status":       memberStatus,
			"lastActiveAt": lastActive,
		})
	}
	sortRows(filtered, sortBy, sortDir)
	records := make([][]string, 0, len(filtered))
	for _, row := range filtered {
		records = append(records, []string{
			stringValue(row["displayName"], ""),
			stringValue(row["email"], ""),
			stringValue(row["role"], ""),
			stringValue(row["status"], ""),
			stringValue(row["lastActiveAt"], ""),
		})
	}
	writeCSV(w, "team-members.csv", []string{"display_name", "email", "role", "status", "last_active_at"}, records)
}

func (a *app) handleTeamInvitations(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	var payload struct {
		Email        string   `json:"email"`
		Role         string   `json:"role"`
		ProjectScope []string `json:"projectScope"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}
	fieldErrors := map[string]string{}
	email := strings.TrimSpace(strings.ToLower(payload.Email))
	role := strings.TrimSpace(payload.Role)
	projectScope := sanitizeStringList(payload.ProjectScope, 20)
	if email == "" || !strings.Contains(email, "@") {
		fieldErrors["email"] = "邮箱格式不正确"
	}
	allowedRole := map[string]bool{"member": true, "project_admin": true, "org_admin": true, "finance": true}
	if !allowedRole[role] {
		fieldErrors["role"] = "角色必须为 member/project_admin/org_admin/finance"
	}
	if len(projectScope) == 0 {
		fieldErrors["projectScope"] = "至少需要一个项目范围"
	}
	if len(fieldErrors) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "团队邀请参数校验失败。", map[string]any{"fieldErrors": fieldErrors})
		return
	}
	id := fmt.Sprintf("tm_%d", time.Now().UnixNano())
	scopeBytes, _ := json.Marshal(projectScope)
	if _, err := a.db.ExecContext(r.Context(), `INSERT INTO team_members (id, display_name, email, role, project_scope_json, status, last_active_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'invited', NULL, NOW(), NOW())`, id, email, email, role, string(scopeBytes)); err != nil {
		writeError(w, http.StatusInternalServerError, "team_invite_failed", err.Error(), nil)
		return
	}
	writeData(w, http.StatusOK, map[string]any{
		"id":           id,
		"email":        email,
		"role":         role,
		"inviteStatus": "sent",
		"projectScope": projectScope,
	}, nil)
}

func (a *app) handleTeamMemberByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	memberID := strings.TrimPrefix(r.URL.Path, "/v1/team/members/")
	if memberID == "" {
		writeError(w, http.StatusNotFound, "team_member_not_found", "未找到成员。", nil)
		return
	}
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	var payload struct {
		Role         string   `json:"role"`
		ProjectScope []string `json:"projectScope"`
		Status       string   `json:"status"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}
	scopeBytes, _ := json.Marshal(payload.ProjectScope)
	if _, err := a.db.ExecContext(r.Context(), `UPDATE team_members SET role = ?, project_scope_json = ?, status = ?, updated_at = NOW() WHERE id = ?`, payload.Role, string(scopeBytes), payload.Status, memberID); err != nil {
		writeError(w, http.StatusInternalServerError, "team_update_failed", err.Error(), nil)
		return
	}
	writeData(w, http.StatusOK, map[string]any{
		"id":           memberID,
		"role":         payload.Role,
		"projectScope": payload.ProjectScope,
		"status":       payload.Status,
	}, nil)
}

func (a *app) handleWebhooks(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method == http.MethodPost {
		var payload struct {
			Name        string   `json:"name"`
			Endpoint    string   `json:"endpoint"`
			Events      []string `json:"events"`
			RetryPolicy string   `json:"retryPolicy"`
		}
		if err := decodeJSON(r, &payload); err != nil {
			writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
			return
		}
		normalized, fieldErrors := validateWebhookPayload(payload.Name, payload.Endpoint, payload.Events, payload.RetryPolicy, "active")
		if len(fieldErrors) > 0 {
			writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Webhook 参数校验失败。", map[string]any{"fieldErrors": fieldErrors})
			return
		}
		id := fmt.Sprintf("wh_%d", time.Now().UnixNano())
		secret := fmt.Sprintf("whsec_%d", time.Now().UnixNano())
		eventsBytes, _ := json.Marshal(normalized["events"])
		if _, err := a.db.ExecContext(r.Context(), `INSERT INTO webhook_configs (id, name, endpoint, events_json, status, retry_policy, signing_secret, last_delivery_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())`, id, normalized["name"], normalized["endpoint"], string(eventsBytes), normalized["status"], normalized["retryPolicy"], secret); err != nil {
			writeError(w, http.StatusInternalServerError, "webhook_create_failed", err.Error(), nil)
			return
		}
		writeData(w, http.StatusOK, map[string]any{
			"id":            id,
			"name":          normalized["name"],
			"endpoint":      normalized["endpoint"],
			"events":        normalized["events"],
			"signingSecret": secret,
			"status":        normalized["status"],
		}, nil)
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"id":               "id",
		"name":             "name",
		"endpoint":         "endpoint",
		"status":           "status",
		"lastDeliveryAt":   "lastDeliveryAt",
		"last_delivery_at": "lastDeliveryAt",
	}, "lastDeliveryAt")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	page, pageSize := parsePage(r)
	rows, err := a.db.QueryContext(r.Context(), `SELECT id, name, endpoint, events_json, status, retry_policy, last_delivery_at FROM webhook_configs ORDER BY created_at ASC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "webhooks_query_failed", err.Error(), nil)
		return
	}
	defer rows.Close()
	itemsAll := []map[string]any{}
	for rows.Next() {
		var id, name, endpoint, eventsJSON, webhookStatus, retryPolicy string
		var lastDeliveryAt sql.NullTime
		if err := rows.Scan(&id, &name, &endpoint, &eventsJSON, &webhookStatus, &retryPolicy, &lastDeliveryAt); err != nil {
			writeError(w, http.StatusInternalServerError, "webhooks_scan_failed", err.Error(), nil)
			return
		}
		events := stringSliceValue(eventsJSON)
		searchable := strings.ToLower(name + " " + endpoint + " " + strings.Join(events, " "))
		if !matchesCSVFilter(webhookStatus, statusSet) {
			continue
		}
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		lastDelivery := ""
		if lastDeliveryAt.Valid {
			lastDelivery = lastDeliveryAt.Time.Format("2006-01-02 15:04:05")
		}
		if !matchesDateRange(lastDelivery, dateFrom, dateTo) {
			continue
		}
		itemsAll = append(itemsAll, map[string]any{
			"id":             id,
			"name":           name,
			"endpoint":       endpoint,
			"events":         events,
			"status":         webhookStatus,
			"retryPolicy":    retryPolicy,
			"lastDeliveryAt": lastDelivery,
		})
	}
	sortRows(itemsAll, sortBy, sortDir)
	items, meta := paginate(itemsAll, page, pageSize)
	writeData(w, http.StatusOK, items, meta)
}

func (a *app) handleWebhooksExport(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	search := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("search")))
	statusSet := parseCSVFilterSet(r.URL.Query().Get("status"))
	dateFrom := parseOptionalDate(r.URL.Query().Get("date_from"))
	dateTo := parseOptionalDate(r.URL.Query().Get("date_to"))
	sortBy := normalizeSortField(r.URL.Query().Get("sort_by"), map[string]string{
		"name":             "name",
		"endpoint":         "endpoint",
		"status":           "status",
		"lastDeliveryAt":   "lastDeliveryAt",
		"last_delivery_at": "lastDeliveryAt",
	}, "lastDeliveryAt")
	sortDir := normalizeSortDirection(r.URL.Query().Get("sort_dir"), "desc")
	rows, err := a.db.QueryContext(r.Context(), `SELECT name, endpoint, status, last_delivery_at FROM webhook_configs ORDER BY created_at ASC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "webhook_export_failed", err.Error(), nil)
		return
	}
	defer rows.Close()
	filtered := []map[string]any{}
	for rows.Next() {
		var name, endpoint, webhookStatus string
		var lastDeliveryAt sql.NullTime
		if err := rows.Scan(&name, &endpoint, &webhookStatus, &lastDeliveryAt); err != nil {
			writeError(w, http.StatusInternalServerError, "webhook_export_failed", err.Error(), nil)
			return
		}
		if !matchesCSVFilter(webhookStatus, statusSet) {
			continue
		}
		searchable := strings.ToLower(name + " " + endpoint)
		if search != "" && !strings.Contains(searchable, search) {
			continue
		}
		lastDelivery := ""
		if lastDeliveryAt.Valid {
			lastDelivery = lastDeliveryAt.Time.Format("2006-01-02 15:04:05")
		}
		if !matchesDateRange(lastDelivery, dateFrom, dateTo) {
			continue
		}
		filtered = append(filtered, map[string]any{
			"name":           name,
			"endpoint":       endpoint,
			"status":         webhookStatus,
			"lastDeliveryAt": lastDelivery,
		})
	}
	sortRows(filtered, sortBy, sortDir)
	records := make([][]string, 0, len(filtered))
	for _, row := range filtered {
		records = append(records, []string{
			stringValue(row["name"], ""),
			stringValue(row["endpoint"], ""),
			stringValue(row["status"], ""),
			stringValue(row["lastDeliveryAt"], ""),
		})
	}
	writeCSV(w, "webhooks.csv", []string{"name", "endpoint", "status", "last_delivery_at"}, records)
}

func (a *app) handleWebhookByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	path := strings.TrimPrefix(r.URL.Path, "/v1/webhooks/")
	if strings.HasSuffix(path, "/deliveries/latest") {
		a.handleWebhookLatestDelivery(w, r)
		return
	}
	webhookID := path
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	var payload struct {
		Name        string   `json:"name"`
		Endpoint    string   `json:"endpoint"`
		Events      []string `json:"events"`
		RetryPolicy string   `json:"retryPolicy"`
		Status      string   `json:"status"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}
	normalized, fieldErrors := validateWebhookPayload(payload.Name, payload.Endpoint, payload.Events, payload.RetryPolicy, payload.Status)
	if len(fieldErrors) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Webhook 参数校验失败。", map[string]any{"fieldErrors": fieldErrors})
		return
	}
	eventsBytes, _ := json.Marshal(normalized["events"])
	if _, err := a.db.ExecContext(r.Context(), `UPDATE webhook_configs SET name = ?, endpoint = ?, events_json = ?, retry_policy = ?, status = ?, updated_at = NOW() WHERE id = ?`, normalized["name"], normalized["endpoint"], string(eventsBytes), normalized["retryPolicy"], normalized["status"], webhookID); err != nil {
		writeError(w, http.StatusInternalServerError, "webhook_update_failed", err.Error(), nil)
		return
	}
	writeData(w, http.StatusOK, map[string]any{
		"id":          webhookID,
		"name":        normalized["name"],
		"endpoint":    normalized["endpoint"],
		"events":      normalized["events"],
		"retryPolicy": normalized["retryPolicy"],
		"status":      normalized["status"],
	}, nil)
}

func (a *app) handleWebhookTest(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	var payload struct {
		WebhookID string `json:"webhookId"`
		Event     string `json:"event"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}
	deliveryID := fmt.Sprintf("del_test_%d", time.Now().UnixNano())
	requestBody := fmt.Sprintf(`{"event":"%s","trace_id":"trace_test_%d","request_id":"req_test_%d"}`, payload.Event, time.Now().Unix(), time.Now().Unix())
	if _, err := a.db.ExecContext(r.Context(), `INSERT INTO webhook_deliveries (delivery_id, webhook_id, webhook_name, event_name, status, latency_ms, attempts, response_code, delivered_at, trace_id, request_headers_json, request_body_json, response_body_json) VALUES (?, ?, 'Manual Test Delivery', ?, 'delivered', 42, 1, 200, NOW(), ?, '{"content-type":"application/json"}', ?, '{"accepted":true}')`, deliveryID, payload.WebhookID, payload.Event, "trace_test", requestBody); err != nil {
		writeError(w, http.StatusInternalServerError, "webhook_test_failed", err.Error(), nil)
		return
	}
	writeData(w, http.StatusOK, map[string]any{
		"deliveryId": deliveryID,
		"webhookId":  payload.WebhookID,
		"event":      payload.Event,
		"status":     "delivered",
		"latencyMs":  42,
	}, nil)
}

func (a *app) handleWebhookDeliveries(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	rows, err := a.db.QueryContext(r.Context(), `SELECT delivery_id, webhook_id, webhook_name, event_name, status, latency_ms, attempts, response_code, delivered_at, trace_id FROM webhook_deliveries ORDER BY delivered_at DESC LIMIT 100`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "webhook_deliveries_failed", err.Error(), nil)
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var deliveryID, webhookID, webhookName, eventName, status string
		var latencyMS, attempts, responseCode int
		var deliveredAt time.Time
		var traceID sql.NullString
		if err := rows.Scan(&deliveryID, &webhookID, &webhookName, &eventName, &status, &latencyMS, &attempts, &responseCode, &deliveredAt, &traceID); err != nil {
			writeError(w, http.StatusInternalServerError, "webhook_deliveries_failed", err.Error(), nil)
			return
		}
		items = append(items, map[string]any{
			"deliveryId":   deliveryID,
			"webhookId":    webhookID,
			"webhookName":  webhookName,
			"event":        eventName,
			"status":       status,
			"latencyMs":    latencyMS,
			"attempts":     attempts,
			"responseCode": responseCode,
			"deliveredAt":  deliveredAt.Format("2006-01-02 15:04:05"),
			"traceId":      traceID.String,
		})
	}
	writeData(w, http.StatusOK, items, nil)
}

func (a *app) handleWebhookDeliveryByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	deliveryID := strings.TrimPrefix(r.URL.Path, "/v1/webhooks/deliveries/")
	var webhookID, eventName, status, requestHeadersJSON, requestBodyJSON, responseBodyJSON string
	var latencyMS, attempts, responseCode int
	var deliveredAt time.Time
	err := a.db.QueryRowContext(r.Context(), `SELECT webhook_id, event_name, status, latency_ms, attempts, response_code, delivered_at, COALESCE(request_headers_json,'{}'), COALESCE(request_body_json,'{}'), COALESCE(response_body_json,'{}') FROM webhook_deliveries WHERE delivery_id = ? LIMIT 1`, deliveryID).Scan(&webhookID, &eventName, &status, &latencyMS, &attempts, &responseCode, &deliveredAt, &requestHeadersJSON, &requestBodyJSON, &responseBodyJSON)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "webhook_delivery_not_found", "未找到对应投递记录。", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "webhook_delivery_failed", err.Error(), nil)
		return
	}
	requestHeaders := map[string]any{}
	requestBody := map[string]any{}
	responseBody := map[string]any{}
	_ = json.Unmarshal([]byte(requestHeadersJSON), &requestHeaders)
	_ = json.Unmarshal([]byte(requestBodyJSON), &requestBody)
	_ = json.Unmarshal([]byte(responseBodyJSON), &responseBody)
	writeData(w, http.StatusOK, map[string]any{
		"deliveryId":     deliveryID,
		"webhookId":      webhookID,
		"event":          eventName,
		"status":         status,
		"latencyMs":      latencyMS,
		"deliveredAt":    deliveredAt.Format("2006-01-02 15:04:05"),
		"responseCode":   responseCode,
		"attempts":       attempts,
		"requestHeaders": requestHeaders,
		"requestBody":    requestBody,
		"responseBody":   responseBody,
	}, nil)
}

func (a *app) handleWebhookLatestDelivery(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	webhookID := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/v1/webhooks/"), "/deliveries/latest")
	row := a.db.QueryRowContext(r.Context(), `SELECT delivery_id FROM webhook_deliveries WHERE webhook_id = ? ORDER BY delivered_at DESC LIMIT 1`, webhookID)
	var deliveryID string
	if err := row.Scan(&deliveryID); err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "webhook_delivery_not_found", "未找到最近一次投递记录。", nil)
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "webhook_delivery_failed", err.Error(), nil)
		return
	}
	r.URL.Path = "/v1/webhooks/deliveries/" + deliveryID
	a.handleWebhookDeliveryByID(w, r)
}

func (a *app) handleSupportTickets(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	rows, err := a.db.QueryContext(r.Context(), `SELECT id, ticket_number, subject, category, priority, status, requester_name, created_at, updated_at FROM support_tickets ORDER BY updated_at DESC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "support_tickets_failed", err.Error(), nil)
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id, ticketNumber, subject, category, priority, status, requesterName string
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &ticketNumber, &subject, &category, &priority, &status, &requesterName, &createdAt, &updatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "support_tickets_failed", err.Error(), nil)
			return
		}
		items = append(items, map[string]any{
			"id":            id,
			"ticketNumber":  ticketNumber,
			"subject":       subject,
			"category":      category,
			"priority":      priority,
			"status":        status,
			"createdAt":     createdAt.Format("2006-01-02 15:04:05"),
			"updatedAt":     updatedAt.Format("2006-01-02 15:04:05"),
			"requesterName": requesterName,
		})
	}
	writeData(w, http.StatusOK, items, nil)
}

func (a *app) handleSupportTicketByID(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	path := strings.TrimPrefix(r.URL.Path, "/v1/support/tickets/")
	if strings.HasSuffix(path, "/replies") {
		a.handleSupportTicketReply(w, r)
		return
	}
	ticketID := path
	var id, ticketNumber, subject, category, priority, status, requesterName, description, projectName string
	var traceID sql.NullString
	var createdAt, updatedAt time.Time
	err := a.db.QueryRowContext(r.Context(), `SELECT id, ticket_number, subject, category, priority, status, requester_name, description, COALESCE(project_name,''), trace_id, created_at, updated_at FROM support_tickets WHERE id = ? LIMIT 1`, ticketID).Scan(&id, &ticketNumber, &subject, &category, &priority, &status, &requesterName, &description, &projectName, &traceID, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "support_ticket_not_found", "未找到对应工单。", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "support_ticket_failed", err.Error(), nil)
		return
	}
	replyRows, err := a.db.QueryContext(r.Context(), `SELECT id, author_name, author_role, content, created_at FROM support_ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC`, ticketID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "support_ticket_failed", err.Error(), nil)
		return
	}
	defer replyRows.Close()
	replies := []map[string]any{}
	for replyRows.Next() {
		var replyID, authorName, authorRole, content string
		var replyCreatedAt time.Time
		if err := replyRows.Scan(&replyID, &authorName, &authorRole, &content, &replyCreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "support_ticket_failed", err.Error(), nil)
			return
		}
		replies = append(replies, map[string]any{
			"id":         replyID,
			"authorName": authorName,
			"authorRole": authorRole,
			"content":    content,
			"createdAt":  replyCreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	writeData(w, http.StatusOK, map[string]any{
		"id":            id,
		"ticketNumber":  ticketNumber,
		"subject":       subject,
		"category":      category,
		"priority":      priority,
		"status":        status,
		"createdAt":     createdAt.Format("2006-01-02 15:04:05"),
		"updatedAt":     updatedAt.Format("2006-01-02 15:04:05"),
		"requesterName": requesterName,
		"description":   description,
		"projectName":   projectName,
		"traceId":       traceID.String,
		"replies":       replies,
	}, nil)
}

func (a *app) handleSupportTicketReply(w http.ResponseWriter, r *http.Request) {
	requestCount.Add(1)
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed", nil)
		return
	}
	ticketID := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/v1/support/tickets/"), "/replies")
	var payload struct {
		Content string `json:"content"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error(), nil)
		return
	}
	if len(strings.TrimSpace(payload.Content)) < 2 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "回复内容校验失败。", map[string]any{"fieldErrors": map[string]string{"content": "回复内容至少 2 个字符"}})
		return
	}
	replyID := fmt.Sprintf("reply_%d", time.Now().UnixNano())
	if _, err := a.db.ExecContext(r.Context(), `INSERT INTO support_ticket_replies (id, ticket_id, author_name, author_role, content, created_at) VALUES (?, ?, 'Support Operator', 'support', ?, NOW())`, replyID, ticketID, payload.Content); err != nil {
		writeError(w, http.StatusInternalServerError, "support_reply_failed", err.Error(), nil)
		return
	}
	if _, err := a.db.ExecContext(r.Context(), `UPDATE support_tickets SET status = 'pending', updated_at = NOW() WHERE id = ?`, ticketID); err != nil {
		writeError(w, http.StatusInternalServerError, "support_reply_failed", err.Error(), nil)
		return
	}
	r.URL.Path = "/v1/support/tickets/" + ticketID
	a.handleSupportTicketByID(w, r)
}
