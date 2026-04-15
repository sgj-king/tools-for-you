#!/usr/bin/env python3
"""
移除所有 i18n 翻译函数，替换为中文硬编码
"""
import os
import re
from pathlib import Path

# 中文翻译映射（从原来的 zh.yml 提取）
TRANSLATIONS = {
    # 工具名称和描述
    "tools.age-calculator.title": "年龄计算器",
    "tools.age-calculator.description": "计算你的年龄，支持多种日期格式",
    "tools.ascii-text-drawer.title": "ASCII 艺术生成器",
    "tools.ascii-text-drawer.description": "将文本转换为 ASCII 艺术",
    "tools.attendance-calculator.title": "考勤计算器",
    "tools.attendance-calculator.description": "计算考勤天数、出勤率等",
    "tools.base64-file-converter.title": "Base64 文件转换器",
    "tools.base64-file-converter.description": "将文件与 Base64 字符串互相转换",
    "tools.base64-string-converter.title": "Base64 字符串转换器",
    "tools.base64-string-converter.description": "将字符串与 Base64 互相转换",
    "tools.basic-auth-generator.title": "HTTP 基础认证生成器",
    "tools.basic-auth-generator.description": "生成 HTTP 基础认证头",
    "tools.bcrypt.title": "Bcrypt 哈希生成器",
    "tools.bcrypt.description": "生成和验证 Bcrypt 密码哈希",
    "tools.benchmark-builder.title": "基准测试构建器",
    "tools.benchmark-builder.description": "比较代码片段的性能",
    "tools.bip39-generator.title": "BIP39 助记词生成器",
    "tools.bip39-generator.description": "生成和解析 BIP39 助记词",
    "tools.bmi-calculator.title": "BMI 计算器",
    "tools.bmi-calculator.description": "计算身体质量指数",
    "tools.camera-recorder.title": "摄像头录制器",
    "tools.camera-recorder.description": "录制摄像头视频",
    "tools.case-converter.title": "大小写转换器",
    "tools.case-converter.description": "转换文本的大小写格式",
    "tools.chmod-calculator.title": "Chmod 计算器",
    "tools.chmod-calculator.description": "计算文件权限数字",
    "tools.chronometer.title": "秒表",
    "tools.chronometer.description": "精确计时器",
    "tools.color-converter.title": "颜色转换器",
    "tools.color-converter.description": "在不同颜色格式之间转换",
    "tools.compound-interest-calculator.title": "复利计算器",
    "tools.compound-interest-calculator.description": "计算复利收益",
    "tools.crontab-generator.title": "Crontab 生成器",
    "tools.crontab-generator.description": "生成和解析 crontab 表达式",
    "tools.date-time-converter.title": "日期时间转换器",
    "tools.date-time-converter.description": "在不同日期时间格式之间转换",
    "tools.device-information.title": "设备信息",
    "tools.device-information.description": "查看当前设备信息",
    "tools.discount-calculator.title": "折扣计算器",
    "tools.discount-calculator.description": "计算折扣价格",
    "tools.docker-run-to-docker-compose-converter.title": "Docker 命令转 Compose",
    "tools.docker-run-to-docker-compose-converter.description": "将 docker run 命令转换为 docker-compose",
    "tools.emoji-picker.title": "Emoji 选择器",
    "tools.emoji-picker.description": "选择和复制 Emoji 表情",
    "tools.encryption.title": "加密解密工具",
    "tools.encryption.description": "加密和解密文本",
    "tools.eta-calculator.title": "ETA 计算器",
    "tools.eta-calculator.description": "计算预计到达时间",
    "tools.gpa-calculator.title": "GPA 计算器",
    "tools.gpa-calculator.description": "计算平均绩点",
    "tools.hash-text.title": "文本哈希生成器",
    "tools.hash-text.description": "生成文本的哈希值",
    "tools.hmac-generator.title": "HMAC 生成器",
    "tools.hmac-generator.description": "生成 HMAC 签名",
    "tools.html-entities.title": "HTML 实体转换器",
    "tools.html-entities.description": "转换 HTML 实体字符",
    "tools.html-wysiwyg-editor.title": "HTML 可视化编辑器",
    "tools.html-wysiwyg-editor.description": "可视化编辑 HTML",
    "tools.http-status-codes.title": "HTTP 状态码",
    "tools.http-status-codes.description": "HTTP 状态码参考",
    "tools.iban-validator-and-parser.title": "IBAN 验证器",
    "tools.iban-validator-and-parser.description": "验证和解析 IBAN",
    "tools.image-color-extractor.title": "图片颜色提取器",
    "tools.image-color-extractor.description": "从图片中提取主要颜色",
    "tools.image-generator.title": "AI 图像生成器",
    "tools.image-generator.description": "使用 AI 生成图像",
    "tools.integer-base-converter.title": "整数进制转换器",
    "tools.integer-base-converter.description": "在不同进制之间转换数字",
    "tools.ipv4-address-converter.title": "IPv4 地址转换器",
    "tools.ipv4-address-converter.description": "转换 IPv4 地址格式",
    "tools.ipv4-range-expander.title": "IPv4 范围展开器",
    "tools.ipv4-range-expander.description": "展开 IPv4 地址范围",
    "tools.ipv4-subnet-calculator.title": "IPv4 子网计算器",
    "tools.ipv4-subnet-calculator.description": "计算 IPv4 子网信息",
    "tools.ipv6-ula-generator.title": "IPv6 ULA 生成器",
    "tools.ipv6-ula-generator.description": "生成 IPv6 本地地址",
    "tools.json-diff.title": "JSON 差异比较",
    "tools.json-diff.description": "比较两个 JSON 的差异",
    "tools.json-minify.title": "JSON 压缩",
    "tools.json-minify.description": "压缩 JSON 文件",
    "tools.json-to-csv.title": "JSON 转 CSV",
    "tools.json-to-csv.description": "将 JSON 转换为 CSV",
    "tools.json-to-toml.title": "JSON 转 TOML",
    "tools.json-to-toml.description": "将 JSON 转换为 TOML",
    "tools.json-to-xml.title": "JSON 转 XML",
    "tools.json-to-xml.description": "将 JSON 转换为 XML",
    "tools.json-to-yaml-converter.title": "JSON 转 YAML",
    "tools.json-to-yaml-converter.description": "将 JSON 转换为 YAML",
    "tools.json-viewer.title": "JSON 查看器",
    "tools.json-viewer.description": "格式化和查看 JSON",
    "tools.jwt-parser.title": "JWT 解析器",
    "tools.jwt-parser.description": "解析和验证 JWT",
    "tools.keycode-info.title": "按键码信息",
    "tools.keycode-info.description": "查看键盘按键码",
    "tools.list-converter.title": "列表转换器",
    "tools.list-converter.description": "转换列表格式",
    "tools.loan-calculator.title": "贷款计算器",
    "tools.loan-calculator.description": "计算贷款还款",
    "tools.lorem-ipsum-generator.title": "Lorem Ipsum 生成器",
    "tools.lorem-ipsum-generator.description": "生成占位文本",
    "tools.mac-address-generator.title": "MAC 地址生成器",
    "tools.mac-address-generator.description": "生成随机 MAC 地址",
    "tools.mac-address-lookup.title": "MAC 地址查询",
    "tools.mac-address-lookup.description": "查询 MAC 地址厂商",
    "tools.markdown-editor.title": "Markdown 编辑器",
    "tools.markdown-editor.description": "编辑和预览 Markdown",
    "tools.markdown-to-html.title": "Markdown 转 HTML",
    "tools.markdown-to-html.description": "将 Markdown 转换为 HTML",
    "tools.math-evaluator.title": "数学表达式计算器",
    "tools.math-evaluator.description": "计算数学表达式",
    "tools.meta-tag-generator.title": "Meta 标签生成器",
    "tools.meta-tag-generator.description": "生成 HTML Meta 标签",
    "tools.mime-types.title": "MIME 类型查询",
    "tools.mime-types.description": "查询文件 MIME 类型",
    "tools.numeronym-generator.title": "数字缩写生成器",
    "tools.numeronym-generator.description": "生成数字缩写如 a11y",
    "tools.otp-code-generator-and-validator.title": "OTP 验证码生成器",
    "tools.otp-code-generator-and-validator.description": "生成和验证 OTP 验证码",
    "tools.password-strength-analyser.title": "密码强度分析器",
    "tools.password-strength-analyser.description": "分析密码强度",
    "tools.pdf-signature-checker.title": "PDF 签名检查器",
    "tools.pdf-signature-checker.description": "检查 PDF 签名",
    "tools.percentage-calculator.title": "百分比计算器",
    "tools.percentage-calculator.description": "计算百分比",
    "tools.phone-parser-and-formatter.title": "电话号码解析器",
    "tools.phone-parser-and-formatter.description": "解析和格式化电话号码",
    "tools.qr-code-generator.title": "二维码生成器",
    "tools.qr-code-generator.description": "生成二维码",
    "tools.random-port-generator.title": "随机端口生成器",
    "tools.random-port-generator.description": "生成随机端口号",
    "tools.regex-memo.title": "正则表达式备忘单",
    "tools.regex-memo.description": "正则表达式快速参考",
    "tools.regex-tester.title": "正则表达式测试器",
    "tools.regex-tester.description": "测试正则表达式",
    "tools.roman-numeral-converter.title": "罗马数字转换器",
    "tools.roman-numeral-converter.description": "罗马数字与阿拉伯数字转换",
    "tools.rsa-key-pair-generator.title": "RSA 密钥对生成器",
    "tools.rsa-key-pair-generator.description": "生成 RSA 密钥对",
    "tools.safelink-decoder.title": "安全链接解码器",
    "tools.safelink-decoder.description": "解码 Outlook 安全链接",
    "tools.slugify-string.title": "URL Slug 生成器",
    "tools.slugify-string.description": "将文本转换为 URL Slug",
    "tools.sql-prettify.title": "SQL 格式化",
    "tools.sql-prettify.description": "格式化 SQL 语句",
    "tools.string-obfuscator.title": "字符串混淆器",
    "tools.string-obfuscator.description": "混淆字符串",
    "tools.svg-placeholder-generator.title": "SVG 占位图生成器",
    "tools.svg-placeholder-generator.description": "生成 SVG 占位图",
    "tools.temperature-converter.title": "温度转换器",
    "tools.temperature-converter.description": "在不同温度单位之间转换",
    "tools.text-diff.title": "文本差异比较",
    "tools.text-diff.description": "比较两个文本的差异",
    "tools.text-statistics.title": "文本统计",
    "tools.text-statistics.description": "统计文本信息",
    "tools.text-to-binary.title": "文本转二进制",
    "tools.text-to-binary.description": "将文本转换为二进制",
    "tools.text-to-nato-alphabet.title": "北约音标字母转换",
    "tools.text-to-nato-alphabet.description": "将文本转换为北约音标",
    "tools.text-to-unicode.title": "文本转 Unicode",
    "tools.text-to-unicode.description": "将文本转换为 Unicode",
    "tools.tip-calculator.title": "小费计算器",
    "tools.tip-calculator.description": "计算小费金额",
    "tools.token-generator.title": "Token 生成器",
    "tools.token-generator.description": "生成随机 Token",
    "tools.toml-to-json.title": "TOML 转 JSON",
    "tools.toml-to-json.description": "将 TOML 转换为 JSON",
    "tools.toml-to-yaml.title": "TOML 转 YAML",
    "tools.toml-to-yaml.description": "将 TOML 转换为 YAML",
    "tools.ulid-generator.title": "ULID 生成器",
    "tools.ulid-generator.description": "生成 ULID",
    "tools.unit-converter.title": "单位转换器",
    "tools.unit-converter.description": "在不同单位之间转换",
    "tools.url-encoder.title": "URL 编码解码器",
    "tools.url-encoder.description": "编码和解码 URL",
    "tools.url-parser.title": "URL 解析器",
    "tools.url-parser.description": "解析 URL 组件",
    "tools.user-agent-parser.title": "User Agent 解析器",
    "tools.user-agent-parser.description": "解析 User Agent 字符串",
    "tools.uuid-generator.title": "UUID 生成器",
    "tools.uuid-generator.description": "生成 UUID",
    "tools.wifi-qr-code-generator.title": "WiFi 二维码生成器",
    "tools.wifi-qr-code-generator.description": "生成 WiFi 连接二维码",
    "tools.xml-formatter.title": "XML 格式化",
    "tools.xml-formatter.description": "格式化 XML 文件",
    "tools.xml-to-json.title": "XML 转 JSON",
    "tools.xml-to-json.description": "将 XML 转换为 JSON",
    "tools.yaml-to-json-converter.title": "YAML 转 JSON",
    "tools.yaml-to-json-converter.description": "将 YAML 转换为 JSON",
    "tools.yaml-to-toml.title": "YAML 转 TOML",
    "tools.yaml-to-toml.description": "将 YAML 转换为 TOML",
    "tools.yaml-viewer.title": "YAML 查看器",
    "tools.yaml-viewer.description": "格式化和查看 YAML",
    "tools.email-normalizer.title": "邮箱标准化",
    "tools.email-normalizer.description": "标准化邮箱地址",
    
    # 分类名称
    "tools.categories.crypto": "安全加密",
    "tools.categories.converter": "格式转换",
    "tools.categories.web": "Web工具",
    "tools.categories.images-and-videos": "图像视频",
    "tools.categories.development": "开发工具",
    "tools.categories.network": "网络工具",
    "tools.categories.text": "文本工具",
    "tools.categories.math": "数学计算",
    "tools.categories.measurement": "测量工具",
    "tools.categories.data": "数据工具",
    "tools.categories.favorite-tools": "我的收藏",
    
    # 通用
    "home.subtitle": "为每个人打造的智能工具集",
    "home.home": "主页",
    "home.toggleMenu": "切换菜单",
    "home.support": "支持开发",
    "home.buyMeACoffee": "请作者喝咖啡",
    "home.uiLib": "UI 组件库",
}

def replace_translations(content):
    """替换翻译键为中文"""
    # 替换 translate('xxx') 函数调用
    def replace_translate(match):
        key = match.group(1)
        return f"'{TRANSLATIONS.get(key, key)}'"
    
    content = re.sub(r"translate\(['\"]([^'\"]+)['\"]\)", replace_translate, content)
    
    # 替换 $t('xxx') 函数调用
    def replace_t(match):
        key = match.group(1)
        return TRANSLATIONS.get(key, key)
    
    content = re.sub(r"\$t\(['\"]([^'\"]+)['\"]\)", replace_t, content)
    
    return content

def process_file(file_path):
    """处理单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否需要处理
        if "translate(" not in content and "$t(" not in content:
            return False
        
        new_content = replace_translations(content)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    src_dir = Path("/home/sgj/pyproject/IT_tools/src")
    
    # 处理所有 .ts 和 .vue 文件
    count = 0
    for ext in ['*.ts', '*.vue']:
        for file_path in src_dir.rglob(ext):
            if process_file(file_path):
                count += 1
                print(f"✓ {file_path.name}")
    
    print(f"\n✅ 共处理 {count} 个文件")

if __name__ == "__main__":
    main()
