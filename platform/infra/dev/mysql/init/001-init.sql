-- 初始化开发环境数据库
-- 说明:
-- 1. 该脚本仅用于本地/开发 compose
-- 2. 生产环境请使用迁移工具，不要依赖这里的初始化脚本

CREATE DATABASE IF NOT EXISTS platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS new_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'platform'@'%' IDENTIFIED BY 'platform_dev_password';
CREATE USER IF NOT EXISTS 'newapi'@'%' IDENTIFIED BY 'newapi_dev_password';

GRANT ALL PRIVILEGES ON platform.* TO 'platform'@'%';
GRANT ALL PRIVILEGES ON new_api.* TO 'newapi'@'%';

FLUSH PRIVILEGES;
