-- 开发环境种子数据
-- Demo API Key 明文: demo_live_sk_platform_dev
-- Demo API Key SHA256: 1d990962d51571a40f431c3715715846db4543c04aa5a0f32d347092ff8b7d6c

USE platform;

INSERT INTO organizations (id, name, slug, status, owner_user_id, billing_type, plan_tier, credit_limit, currency, metadata)
VALUES
  (1001, 'Demo Organization', 'demo-org', 'active', 5001, 'prepaid', 'pro', 0, 'USD', JSON_OBJECT('tier', 'team')),
  (1002, 'Demo Free Tier', 'demo-free', 'active', 5002, 'prepaid', 'free', 0, 'USD', JSON_OBJECT('tier', 'free'))
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), plan_tier = VALUES(plan_tier);

INSERT INTO users (id, organization_id, email, password_hash, status, display_name, mfa_enabled)
VALUES
  (5001, 1001, 'owner@example.com', '$2y$10$demo.hash.placeholder', 'active', 'Demo Owner', 0),
  (5002, 1002, 'free@example.com', '$2y$10$demo.hash.placeholder', 'active', 'Demo Free User', 0)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), status = VALUES(status);

INSERT INTO projects (id, organization_id, name, env, status, daily_cost_cap, monthly_cost_cap, metadata)
VALUES
  (2001, 1001, 'demo-project', 'prod', 'active', 50.000000, 1000.000000, JSON_OBJECT('purpose', 'development'))
ON DUPLICATE KEY UPDATE status = VALUES(status), daily_cost_cap = VALUES(daily_cost_cap);

INSERT INTO price_plans (id, code, name, plan_type, base_fee, currency, included_credits, overage_enabled, is_active, rules_json)
VALUES
  (4001, 'dev-free', 'Development Free', 'prepaid', 0, 'USD', 100.000000, 1, 1, JSON_OBJECT('supports_enterprise_invoice', false))
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active);

INSERT INTO api_keys (id, organization_id, project_id, name, key_prefix, key_hash, status, scopes_json, created_by)
VALUES
  (3001, 1001, 2001, 'demo-default-key', 'demo_live_sk', '1d990962d51571a40f431c3715715846db4543c04aa5a0f32d347092ff8b7d6c', 'active', JSON_ARRAY('model.invoke', 'usage.read'), 5001)
ON DUPLICATE KEY UPDATE status = VALUES(status), scopes_json = VALUES(scopes_json);

INSERT INTO model_entitlements (organization_id, project_id, external_model_name, policy_code, rpm_limit, tpm_limit, concurrency_limit, daily_cost_cap, is_enabled)
VALUES
  (1001, 2001, 'chat-basic', 'dev-default', 120, 120000, 10, 20.000000, 1),
  (1001, 2001, 'chat-pro', 'dev-default', 60, 80000, 5, 20.000000, 1),
  (1001, 2001, 'reasoning-pro', 'dev-reasoning', 30, 50000, 3, 10.000000, 1),
  (1001, 2001, 'vision-pro', 'dev-vision', 20, 40000, 2, 10.000000, 1),
  (1001, 2001, 'embedding-large', 'dev-embedding', 240, 240000, 20, 20.000000, 1)
ON DUPLICATE KEY UPDATE policy_code = VALUES(policy_code), is_enabled = VALUES(is_enabled);

INSERT INTO provider_routes (id, external_model_name, internal_model_profile, provider_code, channel_code, provider_model, priority, weight, region, cost_per_input_1k, cost_per_output_1k, latency_slo_ms, is_active, tenant_scope, rules_json)
VALUES
  (6001, 'chat-basic', 'chat_basic_v1', 'openai', 'primary-openai', 'gpt-4.1-mini', 10, 100, 'global', 0.000300, 0.000600, 2500, 1, 'default', JSON_OBJECT('fallback', true)),
  (6002, 'chat-pro', 'chat_pro_v1', 'openai', 'primary-openai', 'gpt-4.1', 10, 100, 'global', 0.002000, 0.008000, 3000, 1, 'default', JSON_OBJECT('fallback', true)),
  (6003, 'reasoning-pro', 'reasoning_pro_v1', 'openai', 'primary-openai', 'o4-mini-high', 10, 100, 'global', 0.004000, 0.016000, 5000, 1, 'default', JSON_OBJECT('mode', 'reasoning')),
  (6004, 'vision-pro', 'vision_pro_v1', 'openai', 'primary-openai', 'gpt-4.1', 10, 100, 'global', 0.003000, 0.012000, 4000, 1, 'default', JSON_OBJECT('supports_image', true)),
  (6005, 'embedding-large', 'embedding_large_v1', 'openai', 'primary-openai', 'text-embedding-3-large', 10, 100, 'global', 0.000150, 0.000000, 1500, 1, 'default', JSON_OBJECT('embedding', true))
ON DUPLICATE KEY UPDATE provider_model = VALUES(provider_model), is_active = VALUES(is_active);

INSERT INTO balance_ledger (organization_id, project_id, api_key_id, account_type, direction, amount, currency, reference_type, reference_id, request_id, idempotency_key, balance_after, remark)
VALUES
  (1001, 2001, 3001, 'cash', 'credit', 100.000000, 'USD', 'seed', 'seed-initial-balance', 'seed-request', 'seed-initial-balance-idem', 100.000000, 'Initial development balance')
ON DUPLICATE KEY UPDATE balance_after = VALUES(balance_after), remark = VALUES(remark);
