-- Development database hardening.
-- This file is idempotent and can be re-applied to an existing dev database.

USE platform;

CREATE TABLE IF NOT EXISTS console_user_profiles (
    user_id BIGINT UNSIGNED NOT NULL,
    avatar_url LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    project_scope_json LONGTEXT NOT NULL,
    status VARCHAR(16) NOT NULL,
    last_active_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_team_members_email (email),
    KEY idx_team_members_role_status (role, status),
    KEY idx_team_members_status_updated (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_configs (
    id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    endpoint VARCHAR(512) NOT NULL,
    events_json LONGTEXT NOT NULL,
    status VARCHAR(16) NOT NULL,
    retry_policy VARCHAR(255) NOT NULL,
    signing_secret VARCHAR(128) NOT NULL,
    last_delivery_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_webhook_configs_status_updated (status, updated_at),
    KEY idx_webhook_configs_last_delivery (last_delivery_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_deliveries (
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
    PRIMARY KEY (delivery_id),
    KEY idx_webhook_deliveries_webhook_at (webhook_id, delivered_at),
    KEY idx_webhook_deliveries_status_at (status, delivered_at),
    KEY idx_webhook_deliveries_trace_id (trace_id),
    KEY idx_webhook_deliveries_delivered_at (delivered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bill_overrides (
    bill_id VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL,
    notes TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (bill_id),
    KEY idx_bill_overrides_status_updated (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_records (
    id VARCHAR(64) NOT NULL,
    bill_id VARCHAR(64) NOT NULL,
    invoice_number VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL,
    amount_usd DECIMAL(18,6) NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    billing_entity_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(64) NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    notes TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_invoice_records_bill_id (bill_id),
    KEY idx_invoice_records_status_due (status, due_date),
    KEY idx_invoice_records_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_support_ticket_number (ticket_number),
    KEY idx_support_tickets_status_updated (status, updated_at),
    KEY idx_support_tickets_priority_updated (priority, updated_at),
    KEY idx_support_tickets_trace_id (trace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id VARCHAR(64) NOT NULL,
    ticket_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(128) NOT NULL,
    author_role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_support_ticket_replies_ticket_created (ticket_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS filter_presets (
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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_filter_presets_scope_visibility (scope, visibility),
    KEY idx_filter_presets_owner_scope (owner_user_id, scope),
    KEY idx_filter_presets_org_scope (org_name, scope),
    KEY idx_filter_presets_scope_recent (scope, last_used_at),
    KEY idx_filter_presets_scope_pinned (scope, is_pinned),
    KEY idx_filter_presets_scope_sort (scope, sort_order),
    KEY idx_filter_presets_scope_default (scope, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

DROP PROCEDURE IF EXISTS platform_add_column_if_missing//
CREATE PROCEDURE platform_add_column_if_missing(IN in_table_name VARCHAR(64), IN in_column_name VARCHAR(64), IN in_alter_sql TEXT)
BEGIN
    DECLARE existing_count BIGINT DEFAULT 0;
    SELECT COUNT(*) INTO existing_count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = in_table_name
      AND COLUMN_NAME = in_column_name;
    IF existing_count = 0 THEN
        SET @platform_ddl = in_alter_sql;
        PREPARE platform_stmt FROM @platform_ddl;
        EXECUTE platform_stmt;
        DEALLOCATE PREPARE platform_stmt;
    END IF;
END//

DROP PROCEDURE IF EXISTS platform_add_index_if_missing//
CREATE PROCEDURE platform_add_index_if_missing(IN in_table_name VARCHAR(64), IN in_index_name VARCHAR(64), IN in_alter_sql TEXT)
BEGIN
    DECLARE existing_count BIGINT DEFAULT 0;
    SELECT COUNT(*) INTO existing_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = in_table_name
      AND INDEX_NAME = in_index_name;
    IF existing_count = 0 THEN
        SET @platform_ddl = in_alter_sql;
        PREPARE platform_stmt FROM @platform_ddl;
        EXECUTE platform_stmt;
        DEALLOCATE PREPARE platform_stmt;
    END IF;
END//

DROP PROCEDURE IF EXISTS platform_add_constraint_if_missing//
CREATE PROCEDURE platform_add_constraint_if_missing(IN in_table_name VARCHAR(64), IN in_constraint_name VARCHAR(64), IN in_alter_sql TEXT)
BEGIN
    DECLARE existing_count BIGINT DEFAULT 0;
    SELECT COUNT(*) INTO existing_count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = in_table_name
      AND CONSTRAINT_NAME = in_constraint_name;
    IF existing_count = 0 THEN
        SET @platform_ddl = in_alter_sql;
        PREPARE platform_stmt FROM @platform_ddl;
        EXECUTE platform_stmt;
        DEALLOCATE PREPARE platform_stmt;
    END IF;
END//

DELIMITER ;

CALL platform_add_column_if_missing('filter_presets', 'is_pinned', 'ALTER TABLE filter_presets ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0');
CALL platform_add_column_if_missing('filter_presets', 'last_used_at', 'ALTER TABLE filter_presets ADD COLUMN last_used_at DATETIME NULL');
CALL platform_add_column_if_missing('filter_presets', 'sort_order', 'ALTER TABLE filter_presets ADD COLUMN sort_order INT NOT NULL DEFAULT 0');
CALL platform_add_column_if_missing('filter_presets', 'group_name', 'ALTER TABLE filter_presets ADD COLUMN group_name VARCHAR(128) NULL');
CALL platform_add_column_if_missing('filter_presets', 'tags_json', 'ALTER TABLE filter_presets ADD COLUMN tags_json LONGTEXT NULL');
CALL platform_add_column_if_missing('filter_presets', 'owner_email', 'ALTER TABLE filter_presets ADD COLUMN owner_email VARCHAR(255) NULL');

CALL platform_add_index_if_missing('api_keys', 'idx_api_keys_project_status', 'ALTER TABLE api_keys ADD KEY idx_api_keys_project_status (project_id, status)');
CALL platform_add_index_if_missing('api_keys', 'idx_api_keys_prefix_status', 'ALTER TABLE api_keys ADD KEY idx_api_keys_prefix_status (key_prefix, status)');
CALL platform_add_index_if_missing('balance_ledger', 'idx_balance_ledger_reference', 'ALTER TABLE balance_ledger ADD KEY idx_balance_ledger_reference (reference_type, reference_id)');
CALL platform_add_index_if_missing('balance_ledger', 'idx_balance_ledger_api_key_created', 'ALTER TABLE balance_ledger ADD KEY idx_balance_ledger_api_key_created (api_key_id, created_at)');
CALL platform_add_index_if_missing('balance_ledger', 'idx_balance_ledger_project_created', 'ALTER TABLE balance_ledger ADD KEY idx_balance_ledger_project_created (project_id, created_at)');
CALL platform_add_index_if_missing('bill_overrides', 'idx_bill_overrides_status_updated', 'ALTER TABLE bill_overrides ADD KEY idx_bill_overrides_status_updated (status, updated_at)');
CALL platform_add_index_if_missing('filter_presets', 'idx_filter_presets_scope_recent', 'ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_recent (scope, last_used_at)');
CALL platform_add_index_if_missing('filter_presets', 'idx_filter_presets_scope_pinned', 'ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_pinned (scope, is_pinned)');
CALL platform_add_index_if_missing('filter_presets', 'idx_filter_presets_scope_sort', 'ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_sort (scope, sort_order)');
CALL platform_add_index_if_missing('filter_presets', 'idx_filter_presets_scope_default', 'ALTER TABLE filter_presets ADD KEY idx_filter_presets_scope_default (scope, is_default)');
CALL platform_add_index_if_missing('invoice_records', 'idx_invoice_records_status_due', 'ALTER TABLE invoice_records ADD KEY idx_invoice_records_status_due (status, due_date)');
CALL platform_add_index_if_missing('invoice_records', 'idx_invoice_records_period', 'ALTER TABLE invoice_records ADD KEY idx_invoice_records_period (period_start, period_end)');
CALL platform_add_index_if_missing('model_entitlements', 'idx_model_entitlements_model_enabled', 'ALTER TABLE model_entitlements ADD KEY idx_model_entitlements_model_enabled (external_model_name, is_enabled)');
CALL platform_add_index_if_missing('provider_routes', 'idx_provider_routes_active_priority', 'ALTER TABLE provider_routes ADD KEY idx_provider_routes_active_priority (external_model_name, is_active, priority, weight)');
CALL platform_add_index_if_missing('provider_routes', 'idx_provider_routes_provider_model', 'ALTER TABLE provider_routes ADD KEY idx_provider_routes_provider_model (provider_code, provider_model, is_active)');
CALL platform_add_index_if_missing('provider_routes', 'idx_provider_routes_tenant_active', 'ALTER TABLE provider_routes ADD KEY idx_provider_routes_tenant_active (tenant_scope, is_active, priority)');
CALL platform_add_index_if_missing('request_traces', 'idx_request_traces_created_at', 'ALTER TABLE request_traces ADD KEY idx_request_traces_created_at (created_at)');
CALL platform_add_index_if_missing('request_traces', 'idx_request_traces_project_created_at', 'ALTER TABLE request_traces ADD KEY idx_request_traces_project_created_at (project_id, created_at)');
CALL platform_add_index_if_missing('request_traces', 'idx_request_traces_api_key_created_at', 'ALTER TABLE request_traces ADD KEY idx_request_traces_api_key_created_at (api_key_id, created_at)');
CALL platform_add_index_if_missing('support_tickets', 'idx_support_tickets_status_updated', 'ALTER TABLE support_tickets ADD KEY idx_support_tickets_status_updated (status, updated_at)');
CALL platform_add_index_if_missing('support_tickets', 'idx_support_tickets_priority_updated', 'ALTER TABLE support_tickets ADD KEY idx_support_tickets_priority_updated (priority, updated_at)');
CALL platform_add_index_if_missing('support_tickets', 'idx_support_tickets_trace_id', 'ALTER TABLE support_tickets ADD KEY idx_support_tickets_trace_id (trace_id)');
CALL platform_add_index_if_missing('support_ticket_replies', 'idx_support_ticket_replies_ticket_created', 'ALTER TABLE support_ticket_replies ADD KEY idx_support_ticket_replies_ticket_created (ticket_id, created_at)');
CALL platform_add_index_if_missing('team_members', 'idx_team_members_role_status', 'ALTER TABLE team_members ADD KEY idx_team_members_role_status (role, status)');
CALL platform_add_index_if_missing('team_members', 'idx_team_members_status_updated', 'ALTER TABLE team_members ADD KEY idx_team_members_status_updated (status, updated_at)');
CALL platform_add_index_if_missing('usage_records', 'idx_usage_records_finished_at', 'ALTER TABLE usage_records ADD KEY idx_usage_records_finished_at (finished_at)');
CALL platform_add_index_if_missing('usage_records', 'idx_usage_records_project_finished', 'ALTER TABLE usage_records ADD KEY idx_usage_records_project_finished (project_id, finished_at)');
CALL platform_add_index_if_missing('usage_records', 'idx_usage_records_api_key_finished', 'ALTER TABLE usage_records ADD KEY idx_usage_records_api_key_finished (api_key_id, finished_at)');
CALL platform_add_index_if_missing('usage_records', 'idx_usage_records_status_finished', 'ALTER TABLE usage_records ADD KEY idx_usage_records_status_finished (settlement_status, finished_at)');
CALL platform_add_index_if_missing('usage_records', 'idx_usage_records_model_finished', 'ALTER TABLE usage_records ADD KEY idx_usage_records_model_finished (external_model_name, finished_at)');
CALL platform_add_index_if_missing('webhook_configs', 'idx_webhook_configs_status_updated', 'ALTER TABLE webhook_configs ADD KEY idx_webhook_configs_status_updated (status, updated_at)');
CALL platform_add_index_if_missing('webhook_configs', 'idx_webhook_configs_last_delivery', 'ALTER TABLE webhook_configs ADD KEY idx_webhook_configs_last_delivery (last_delivery_at)');
CALL platform_add_index_if_missing('webhook_deliveries', 'idx_webhook_deliveries_webhook_at', 'ALTER TABLE webhook_deliveries ADD KEY idx_webhook_deliveries_webhook_at (webhook_id, delivered_at)');
CALL platform_add_index_if_missing('webhook_deliveries', 'idx_webhook_deliveries_status_at', 'ALTER TABLE webhook_deliveries ADD KEY idx_webhook_deliveries_status_at (status, delivered_at)');

CALL platform_add_constraint_if_missing('balance_ledger', 'chk_balance_ledger_non_negative_amount', 'ALTER TABLE balance_ledger ADD CONSTRAINT chk_balance_ledger_non_negative_amount CHECK (amount >= 0)');
CALL platform_add_constraint_if_missing('usage_records', 'chk_usage_records_non_negative_amounts', 'ALTER TABLE usage_records ADD CONSTRAINT chk_usage_records_non_negative_amounts CHECK (provider_cost >= 0 AND sale_amount >= 0 AND billable_units >= 0)');
CALL platform_add_constraint_if_missing('provider_routes', 'chk_provider_routes_positive_routing', 'ALTER TABLE provider_routes ADD CONSTRAINT chk_provider_routes_positive_routing CHECK (priority >= 0 AND weight >= 0 AND cost_per_input_1k >= 0 AND cost_per_output_1k >= 0 AND latency_slo_ms >= 0)');

DROP PROCEDURE IF EXISTS platform_add_column_if_missing;
DROP PROCEDURE IF EXISTS platform_add_index_if_missing;
DROP PROCEDURE IF EXISTS platform_add_constraint_if_missing;
