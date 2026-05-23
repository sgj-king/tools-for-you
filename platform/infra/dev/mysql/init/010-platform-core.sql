-- 核心表结构初始化
-- 说明:
-- 1. 当前文件覆盖前 10 张优先实现的核心表
-- 2. 仅用于开发环境快速启动
-- 3. 生产请迁移到 Flyway / Atlas / Goose / Liquibase 等迁移工具

USE platform;

CREATE TABLE IF NOT EXISTS organizations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '组织ID',
    name VARCHAR(128) NOT NULL COMMENT '组织名称',
    slug VARCHAR(64) NOT NULL COMMENT '组织唯一短标识',
    status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '组织状态',
    owner_user_id BIGINT UNSIGNED NULL COMMENT '组织拥有者用户ID',
    billing_type VARCHAR(32) NOT NULL DEFAULT 'prepaid' COMMENT '计费类型',
    plan_tier VARCHAR(32) NOT NULL DEFAULT 'free' COMMENT '订阅级别：free / pro',
    credit_limit DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '信用额度',
    currency CHAR(3) NOT NULL DEFAULT 'USD' COMMENT '币种',
    metadata JSON NULL COMMENT '扩展元数据',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_organizations_slug (slug),
    KEY idx_organizations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组织表';

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    organization_id BIGINT UNSIGNED NULL COMMENT '默认组织ID',
    email VARCHAR(255) NOT NULL COMMENT '邮箱',
    phone VARCHAR(32) NULL COMMENT '手机号',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '用户状态',
    display_name VARCHAR(128) NOT NULL COMMENT '显示名',
    mfa_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否开启MFA',
    last_login_at DATETIME NULL COMMENT '最近登录时间',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_phone (phone),
    KEY idx_users_status (status),
    KEY idx_users_organization_id (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目ID',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT '所属组织ID',
    name VARCHAR(128) NOT NULL COMMENT '项目名',
    env VARCHAR(32) NOT NULL DEFAULT 'prod' COMMENT '环境标记',
    status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT '项目状态',
    daily_cost_cap DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '每日成本封顶',
    monthly_cost_cap DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '每月成本封顶',
    metadata JSON NULL COMMENT '扩展元数据',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_projects_org_name (organization_id, name),
    KEY idx_projects_status (status),
    CONSTRAINT fk_projects_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'API Key ID',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT '组织ID',
    project_id BIGINT UNSIGNED NOT NULL COMMENT '项目ID',
    name VARCHAR(128) NOT NULL COMMENT 'Key 名称',
    key_prefix VARCHAR(32) NOT NULL COMMENT 'Key 前缀',
    key_hash CHAR(64) NOT NULL COMMENT 'Key 哈希',
    encrypted_secret_ref VARCHAR(255) NULL COMMENT '加密密钥引用',
    status VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT 'Key 状态',
    scopes_json JSON NULL COMMENT '权限范围',
    last_used_at DATETIME NULL COMMENT '最后使用时间',
    expires_at DATETIME NULL COMMENT '过期时间',
    created_by BIGINT UNSIGNED NULL COMMENT '创建人',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_api_keys_key_hash (key_hash),
    KEY idx_api_keys_org_project (organization_id, project_id),
    KEY idx_api_keys_status_expires (status, expires_at),
    CONSTRAINT fk_api_keys_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_api_keys_project_id FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户API Key表';

CREATE TABLE IF NOT EXISTS price_plans (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '价格计划ID',
    code VARCHAR(64) NOT NULL COMMENT '价格计划编码',
    name VARCHAR(128) NOT NULL COMMENT '价格计划名称',
    plan_type VARCHAR(32) NOT NULL DEFAULT 'prepaid' COMMENT '计划类型',
    base_fee DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '基础费用',
    currency CHAR(3) NOT NULL DEFAULT 'USD' COMMENT '币种',
    included_credits DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '包含额度',
    overage_enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否支持超额计费',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
    rules_json JSON NULL COMMENT '扩展规则',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_price_plans_code (code),
    KEY idx_price_plans_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='价格计划表';

CREATE TABLE IF NOT EXISTS model_entitlements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模型权限ID',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT '组织ID',
    project_id BIGINT UNSIGNED NULL COMMENT '项目ID，可为空表示组织级默认',
    external_model_name VARCHAR(64) NOT NULL COMMENT '对外模型名',
    policy_code VARCHAR(64) NOT NULL COMMENT '策略编码',
    rpm_limit INT NOT NULL DEFAULT 60 COMMENT '每分钟请求数',
    tpm_limit INT NOT NULL DEFAULT 60000 COMMENT '每分钟Token数',
    concurrency_limit INT NOT NULL DEFAULT 5 COMMENT '并发上限',
    daily_cost_cap DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '每日成本上限',
    is_enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
    expires_at DATETIME NULL COMMENT '过期时间',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_model_entitlements_scope (organization_id, project_id, external_model_name),
    KEY idx_model_entitlements_enabled (is_enabled, expires_at),
    CONSTRAINT fk_model_entitlements_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_model_entitlements_project_id FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模型授权表';

CREATE TABLE IF NOT EXISTS balance_ledger (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账本流水ID',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT '组织ID',
    project_id BIGINT UNSIGNED NULL COMMENT '项目ID',
    api_key_id BIGINT UNSIGNED NULL COMMENT 'API Key ID',
    account_type VARCHAR(32) NOT NULL COMMENT '账户类型 cash/credit/promo/hold',
    direction VARCHAR(16) NOT NULL COMMENT '方向 debit/credit',
    amount DECIMAL(18,6) NOT NULL COMMENT '金额',
    currency CHAR(3) NOT NULL DEFAULT 'USD' COMMENT '币种',
    reference_type VARCHAR(32) NOT NULL COMMENT '引用类型',
    reference_id VARCHAR(64) NOT NULL COMMENT '引用ID',
    request_id VARCHAR(64) NULL COMMENT '请求ID',
    idempotency_key VARCHAR(128) NULL COMMENT '幂等键',
    balance_after DECIMAL(18,6) NULL COMMENT '变更后余额',
    remark VARCHAR(255) NULL COMMENT '备注',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_balance_ledger_idempotency_key (idempotency_key),
    KEY idx_balance_ledger_org_created_at (organization_id, created_at),
    KEY idx_balance_ledger_request_id (request_id),
    CONSTRAINT fk_balance_ledger_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_balance_ledger_project_id FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_balance_ledger_api_key_id FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='余额账本';

CREATE TABLE IF NOT EXISTS usage_records (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用量记录ID',
    request_id VARCHAR(64) NOT NULL COMMENT '请求ID',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT '组织ID',
    project_id BIGINT UNSIGNED NOT NULL COMMENT '项目ID',
    api_key_id BIGINT UNSIGNED NOT NULL COMMENT 'API Key ID',
    external_model_name VARCHAR(64) NOT NULL COMMENT '对外模型名',
    internal_model_profile VARCHAR(64) NOT NULL COMMENT '内部模型profile',
    provider_code VARCHAR(64) NOT NULL COMMENT '供应商编码',
    provider_model VARCHAR(128) NOT NULL COMMENT '供应商模型名',
    input_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输入token',
    output_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输出token',
    cache_read_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '缓存读token',
    cache_write_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '缓存写token',
    billable_units DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '计费单位',
    provider_cost DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '成本价',
    sale_amount DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '销售价',
    settlement_status VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT '结算状态',
    started_at DATETIME NOT NULL COMMENT '开始时间',
    finished_at DATETIME NULL COMMENT '结束时间',
    trace_id VARCHAR(64) NULL COMMENT 'Trace ID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_usage_records_request_id (request_id),
    KEY idx_usage_records_org_time (organization_id, started_at),
    KEY idx_usage_records_provider_time (provider_code, started_at),
    KEY idx_usage_records_trace_id (trace_id),
    CONSTRAINT fk_usage_records_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_usage_records_project_id FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_usage_records_api_key_id FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用量记录表';

CREATE TABLE IF NOT EXISTS provider_routes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '路由ID',
    external_model_name VARCHAR(64) NOT NULL COMMENT '对外模型名',
    internal_model_profile VARCHAR(64) NOT NULL COMMENT '内部profile',
    provider_code VARCHAR(64) NOT NULL COMMENT '供应商编码',
    channel_code VARCHAR(64) NOT NULL COMMENT '渠道编码',
    provider_model VARCHAR(128) NOT NULL COMMENT '供应商模型',
    priority INT NOT NULL DEFAULT 100 COMMENT '优先级，越小越优先',
    weight INT NOT NULL DEFAULT 100 COMMENT '权重',
    region VARCHAR(32) NOT NULL DEFAULT 'global' COMMENT '区域',
    cost_per_input_1k DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '输入每1K成本',
    cost_per_output_1k DECIMAL(18,6) NOT NULL DEFAULT 0 COMMENT '输出每1K成本',
    latency_slo_ms INT NOT NULL DEFAULT 3000 COMMENT '延迟SLO',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
    tenant_scope VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '租户作用域',
    rules_json JSON NULL COMMENT '扩展规则',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_provider_routes_external_model (external_model_name),
    KEY idx_provider_routes_profile_active (internal_model_profile, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商路由表';

CREATE TABLE IF NOT EXISTS request_traces (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '请求追踪ID',
    request_id VARCHAR(64) NOT NULL COMMENT '请求ID',
    trace_id VARCHAR(64) NOT NULL COMMENT 'Trace ID',
    span_root_id VARCHAR(64) NULL COMMENT '根span ID',
    organization_id BIGINT UNSIGNED NULL COMMENT '组织ID',
    project_id BIGINT UNSIGNED NULL COMMENT '项目ID',
    api_key_id BIGINT UNSIGNED NULL COMMENT 'API Key ID',
    edge_status_code INT NOT NULL DEFAULT 0 COMMENT '网关状态码',
    provider_status_code INT NULL COMMENT '上游状态码',
    route_snapshot_json JSON NULL COMMENT '路由快照',
    latency_ms INT NOT NULL DEFAULT 0 COMMENT '总延迟',
    stream_duration_ms INT NOT NULL DEFAULT 0 COMMENT '流式时长',
    error_code VARCHAR(64) NULL COMMENT '错误码',
    error_message_masked VARCHAR(255) NULL COMMENT '脱敏错误信息',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_request_traces_request_id (request_id),
    KEY idx_request_traces_trace_id (trace_id),
    KEY idx_request_traces_org_created_at (organization_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='请求追踪表';
