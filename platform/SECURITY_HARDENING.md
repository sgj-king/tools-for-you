# 安全与稳定性加固清单

本文记录本轮已经处理的风险，以及上线前仍需要结合真实支付、短信/邮件、域名和密钥系统完成的事项。

## 本轮已修复

| 类别 | 风险 | 已做增强 |
| --- | --- | --- |
| 会话 | 生产环境缺少强制会话密钥、Cookie `secure` 不可配置 | 增加 `PLATFORM_SESSION_SECRET`、`PLATFORM_CONSOLE_COOKIE_SECURE`，生产环境禁止默认密钥 |
| 会话 | 开发占位密码哈希可能被带到生产继续可用 | 生产环境禁用 `demo.hash.placeholder` 登录兜底 |
| CSRF | Cookie 会话写接口缺少同源校验 | `POST/PUT/DELETE` 增加 Origin 校验，并修复 nginx 端口转发 |
| 暴力请求 | 登录、注册、忘记密码、资料更新缺少限流 | 增加内存级 IP 限流，返回 JSON 429 |
| 越权 | 浏览器可伪造 `x-session-user-*` 头透传到 Ops | BFF 只信任服务端解码的 Cookie 会话，nginx 清空外部伪造头 |
| 未登录泄露 | 未登录也可访问部分 `/api/platform/*` 代理接口 | BFF 代理统一要求有效登录会话 |
| 角色边界 | 账单、团队、安全、Webhook 等敏感接口没有前置角色控制 | BFF 增加粗粒度 RBAC：管理员/运维/财务按路径授权 |
| Ops 暴露 | 直接访问 `127.0.0.1:8086/v1/*` 可绕过控制台 | Ops 服务增加 `PLATFORM_OPS_SHARED_TOKEN`，仅 BFF 带令牌可调用 |
| 内部接口 | `/internal/*` 服务间接口没有共享认证 | FastAPI 服务间调用增加 `INTERNAL_SERVICE_TOKEN` |
| 请求体 | 大 JSON/头像可能造成 502 或内存压力 | BFF 与 FastAPI 增加请求体大小限制，头像前端压缩且服务端限制 |
| 头像 | SVG/data URL 可能带来脚本与超大 Cookie 风险 | 头像限制为 PNG/JPEG/WebP/GIF，不再写入 Cookie |
| 路由 | 动态路径参数未统一编码 | BFF 动态路由参数使用 `encodeURIComponent` |
| 支付账单 | 并发预授权可能同时读取余额造成超额占用 | 预授权/结算对组织行加 `FOR UPDATE`，序列化同组织余额变更 |
| 支付账单 | 金额、状态、日期字段校验不足 | 发票、账单状态、金额、到期日增加校验和长度限制 |
| Webhook | Webhook endpoint 缺少 URL 约束，后续投递可能 SSRF | Webhook 创建/更新限制 http(s) URL，生产要求 HTTPS，拦截本地/内网字面地址 |
| CSV 导出 | 导出字段以 `= + - @` 开头可能触发表格公式注入 | CSV 单元格增加公式前缀转义 |
| 响应 | 500/502 HTML 容易让前端 JSON 解析崩溃 | BFF/FastAPI 关键路径统一返回 JSON 错误 |
| 指纹 | 响应暴露 Next.js/nginx 细节 | 关闭 `X-Powered-By`，nginx 关闭版本号，增加安全响应头 |

## 上线前仍需接入真实基础设施

| 类别 | 待完成项 | 原因 |
| --- | --- | --- |
| 支付 | 接入真实支付渠道的 webhook 签名校验、幂等事件表、退款/拒付状态机 | 当前账单是平台内部账务模拟，不等于真实支付闭环 |
| 用户安全 | MFA/OTP、密码重置邮件签名链接、登录失败审计 | 当前忘记密码仍是开发模拟 |
| 权限 | 将 BFF 粗粒度 RBAC 下沉到 FastAPI/Ops 数据权限层 | 防止未来绕过 BFF 或新增入口时权限漂移 |
| 密钥 | API Key、Webhook Secret、上游模型 Key 使用 KMS/密文存储 | 当前 dev 环境仍以环境变量和数据库明文演示为主 |
| 审计 | 管理类写操作落审计日志，记录操作者、IP、请求 ID、前后差异 | 支付、用户、路由、密钥变更需要可追溯 |
| 防护 | 生产域名启用 HTTPS/HSTS、WAF、反向代理限流、Bot 防护 | 本地 Docker 只做应用层基础防线 |
| 依赖 | CI 中增加依赖漏洞扫描、镜像扫描、SAST/secret scanning | 防止新依赖或提交泄露密钥 |
| 备份 | MySQL/Redis 备份、恢复演练、账务表不可变归档 | 支付和用量数据需要可恢复、可审计 |
