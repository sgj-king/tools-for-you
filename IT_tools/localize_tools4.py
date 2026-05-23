#!/usr/bin/env python3
"""
批量汉化 IT-tools 所有工具组件 - 第四轮
处理所有剩余的英文字符串
"""

TRANSLATIONS = {
    # Base64 相关
    'Base64 of string': '字符串的 Base64',
    'Base64 string to decode': '要解码的 Base64 字符串',
    
    # 输入提示
    'Paste your JSON to compare here...': '在此粘贴要比较的 JSON...',
    'Paste your TOML here...': '在此粘贴 TOML...',
    'Paste your TOTP secret...': '在此粘贴 TOTP 密钥...',
    'Paste your XML content here...': '在此粘贴 XML 内容...',
    'Paste your XML here...': '在此粘贴 XML...',
    'Paste your YAML here...': '在此粘贴 YAML...',
    'Paste your first JSON here...': '在此粘贴第一个 JSON...',
    'Paste your input data here...': '在此粘贴输入数据...',
    'Paste your raw YAML here...': '在此粘贴原始 YAML...',
    'Paste your yaml here...': '在此粘贴 YAML...',
    
    # 输入框提示
    'Phone number:': '电话号码：',
    'Plain text to compute the hash': '要计算哈希的明文',
    'Plain text to compute the hash...': '要计算哈希的明文...',
    'Put your SQL query here...': '在此输入 SQL 查询...',
    'Put your base64 file string here...': '在此输入 Base64 文件字符串...',
    'Put your date string here...': '在此输入日期字符串...',
    'Put your emails here (one per line)...': '在此输入邮箱（每行一个）...',
    'Put your input base here (ex: 10)': '输入进制（如：10）',
    'Put your number here (ex: 42)': '输入数字（如：42）',
    'Put your string here (ex: My file path)': '输入字符串（如：我的文件路径）',
    'Put your string here...': '在此输入字符串...',
    'Put your text here...': '在此输入文本...',
    'Put your token here...': '在此输入令牌...',
    'Put your user-agent here...': '在此输入 User-Agent...',
    
    # 输出标签
    'Prettified version of your YAML': '格式化后的 YAML',
    'Prettify version of your query': '格式化后的查询',
    'Secret in hex will be displayed here': '十六进制密钥将在此显示',
    'Secret in hexadecimal': '十六进制密钥',
    'Secret': '密钥',
    
    # 操作
    'Remove duplicates': '去除重复',
    'Salt count: ': '盐值轮次：',
    'Search emojis (e.g. \'smile\')...': '搜索表情（如：\'smile\'）...',
    'Search http status...': '搜索 HTTP 状态码...',
    'Select an hashing function...': '选择哈希函数...',
}

def process_file(file_path):
    """处理单个文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for en, zh in TRANSLATIONS.items():
        content = content.replace(f'"{en}"', f'"{zh}"')
        content = content.replace(f"'{en}'", f"'{zh}'")
        content = content.replace(f'>{en}<', f'>{zh}<')
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    from pathlib import Path
    src_dir = Path("/home/sgj/pyproject/IT_tools/src/tools")
    
    count = 0
    for file_path in src_dir.rglob("*.vue"):
        if process_file(file_path):
            count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    print(f"\n✅ 共处理 {count} 个文件")

if __name__ == "__main__":
    main()
