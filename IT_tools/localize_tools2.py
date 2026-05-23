#!/usr/bin/env python3
"""
汉化 IT-tools 所有工具组件 - 第二轮
处理 label, title, placeholder 等属性
"""
import re
from pathlib import Path

# 翻译映射
TRANSLATIONS = {
    # 标题类
    'Global search': '全局搜索',
    'Case-insensitive search': '不区分大小写搜索',
    'Multiline': '多行模式',
    'Singleline': '单行模式',
    'Sample matching text': '示例匹配文本',
    'Regex Diagram': '正则表达式图示',
    'Error while decrypting': '解密错误',
    'Compare string with hash': '比较字符串和哈希',
    'Invalid combination of start and end IPv4 address': '起始和结束 IPv4 地址组合无效',
    'This options are not translatable to docker-compose': '这些选项无法转换为 docker-compose',
    'This options are not yet implemented and therefore haven\'t been translated to docker-compose': '这些选项尚未实现，因此未转换为 docker-compose',
    'The following errors occured': '发生以下错误',
    'Escape html entities': '转义 HTML 实体',
    'Unescape html entities': '反转义 HTML 实体',
    'String to base64': '字符串转 Base64',
    'Base64 to string': 'Base64 转字符串',
    'Text to Unicode': '文本转 Unicode',
    'Unicode to Text': 'Unicode 转文本',
    'Result ': '结果 ',
    'Arabic to roman': '阿拉伯数字转罗马数字',
    'Roman to arabic': '罗马数字转阿拉伯数字',
    'Base64 to file': 'Base64 转文件',
    'File to base64': '文件转 Base64',
    'Drag and drop a file here, or click to select a file': '拖放文件到此处，或点击选择文件',
    'Text to ASCII binary': '文本转 ASCII 二进制',
    'ASCII binary to text': 'ASCII 二进制转文本',
    'Drag and drop a PDF file here, or click to select a file': '拖放 PDF 文件到此处，或点击选择文件',
    
    # Label 类
    'Width (in px)': '宽度（像素）',
    'Height (in px)': '高度（像素）',
    'Text color': '文字颜色',
    'Font size': '字体大小',
    'Custom text': '自定义文本',
    'Use exact size': '使用精确尺寸',
    'SVG HTML element': 'SVG HTML 元素',
    'SVG in Base64': 'Base64 格式 SVG',
    'Your JSON': '您的 JSON',
    'YAML from your JSON': '转换后的 YAML',
    'Digest encoding': '摘要编码',
    'Sort keys :': '排序键：',
    'Indent size :': '缩进大小：',
    'Your raw JSON': '原始 JSON',
    'Prettified version of your JSON': '格式化后的 JSON',
    'Verbose': '详细输出',
    'Use 24 hour time format': '使用24小时制',
    'Days start at 0': '天数从0开始',
    'Authorization header:': '授权请求头：',
    'An IPv4 address with or without mask': 'IPv4 地址（可含掩码）',
    'Paragraphs': '段落数',
    'Sentences per paragraph': '每段句子数',
    'Words per sentence': '每句单词数',
    'Start with lorem ipsum ?': '以 Lorem Ipsum 开头？',
    'As html ?': '输出为 HTML？',
    'MAC address:': 'MAC 地址：',
    'Language:': '语言：',
    'Entropy (seed):': '熵（种子）：',
    'Passphrase (mnemonic):': '助记词：',
    'Regex to test:': '要测试的正则：',
    
    # Placeholder 类
    'SVG width...': 'SVG 宽度...',
    'SVG height...': 'SVG 高度...',
    'Font size...': '字体大小...',
    'Paste your JSON here...': '在此粘贴 JSON...',
    'Your string to hash...': '要哈希的字符串...',
    'Paste your raw JSON here...': '在此粘贴原始 JSON...',
    'Your username...': '您的用户名...',
    'Your password...': '您的密码...',
    'The ipv4 address...': 'IPv4 地址...',
    'Your lorem ipsum...': '生成的 Lorem Ipsum...',
    'Type a MAC address': '输入 MAC 地址',
    'Your string...': '您的字符串...',
    'Your mnemonic...': '您的助记词...',
    'Put the regex to test': '输入要测试的正则表达式',
    'Put the text to match': '输入要匹配的文本',
    'The string to cypher': '要加密的字符串',
    'Your string hash': '您的字符串哈希',
    'Your string to bcrypt...': '要 Bcrypt 加密的字符串...',
    'Salt rounds...': '盐值轮次...',
    'Your string to compare...': '要比较的字符串...',
    'Your hash to compare...': '要比较的哈希...',
    'Your Markdown content...': '您的 Markdown 内容...',
    'Suite name...': '套件名称...',
    'Unit (eg: ms)': '单位（如：ms）',
    'Set your measure...': '设置您的测量值...',
    'Start IPv4 address...': '起始 IPv4 地址...',
    'End IPv4 address...': '结束 IPv4 地址...',
    'Your string...': '您的字符串...',
}

def process_file(file_path):
    """处理单个文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for en, zh in TRANSLATIONS.items():
        # 替换各种格式的文本
        content = content.replace(f'"{en}"', f'"{zh}"')
        content = content.replace(f"'{en}'", f"'{zh}'")
        content = content.replace(f'>{en}<', f'>{zh}<')
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path("/home/sgj/pyproject/IT_tools/src/tools")
    
    count = 0
    for file_path in src_dir.rglob("*.vue"):
        if process_file(file_path):
            count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    print(f"\n✅ 共处理 {count} 个文件")

if __name__ == "__main__":
    main()
