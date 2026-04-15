#!/usr/bin/env python3
"""
批量汉化 IT-tools 所有工具组件 - 第三轮
处理所有剩余的英文字符串
"""
import re
from pathlib import Path

# 翻译映射
TRANSLATIONS = {
    # 通用
    'Background color:': '背景颜色：',
    'Foreground color:': '前景颜色：',
    'File Name': '文件名',
    'Password:': '密码：',
    'Enter a password...': '输入密码...',
    'Download filename': '下载文件名',
    'Format: ': '格式：',
    'Indent size:': '缩进大小：',
    'Indent style': '缩进风格',
    'Case:': '大小写：',
    'Namespace': '命名空间',
    'Dialect': '方言',
    'Extension': '扩展名',
    'Identity:': '身份：',
    'Bits :': '位数：',
    'Byte size': '字节大小',
    'Count:': '计数：',
    'Font:': '字体：',
    'Audio:': '音频：',
    
    # 输入输出
    'Input base': '输入进制',
    'Input number': '输入数字',
    'Output encoding': '输出编码',
    'Decoded string': '解码后的字符串',
    'Encoded string': '编码后的字符串',
    'Converted JSON': '转换后的 JSON',
    'Converted XML': '转换后的 XML',
    'Formatted XML from your XML': '格式化后的 XML',
    'Minified version of your JSON': '压缩后的 JSON',
    'Binary version will be here...': '二进制版本将在此显示...',
    'Decimal version will be here...': '十进制版本将在此显示...',
    'Hexadecimal version will be here...': '十六进制版本将在此显示...',
    'Octal version will be here...': '八进制版本将在此显示...',
    'Base64 version will be here...': 'Base64 版本将在此显示...',
    'File in base64 will be here': '文件的 Base64 将在此显示',
    
    # 进制转换
    'Binary (2)': '二进制 (2)',
    'Octal (8)': '八进制 (8)',
    'Decimal (10)': '十进制 (10)',
    'Hexadecimal (16)': '十六进制 (16)',
    'Base64 (64)': 'Base64 (64)',
    
    # 加密相关
    'Encryption algorithm:': '加密算法：',
    'Encryption method': '加密方式',
    'Hashing function': '哈希函数',
    'Enter the secret key...': '输入密钥...',
    'Generate a new random secret': '生成新的随机密钥',
    'Error resistance:': '纠错级别：',
    'Iteration count will be displayed here': '迭代次数将在此显示',
    'Iteration count in hex will be displayed here': '十六进制迭代次数将在此显示',
    
    # 文本处理
    'Ascii Art text:': 'ASCII 艺术文本：',
    'Enter text to convert to binary': '输入要转换为二进制的文本',
    'Enter text to convert to unicode': '输入要转换为 Unicode 的文本',
    'Enter binary to convert to text': '输入要转换为文本的二进制',
    'Enter unicode to convert to text': '输入要转换为文本的 Unicode',
    'Enter string to obfuscate': '输入要混淆的字符串',
    'Binary from your text': '文本转换为二进制',
    'Input Unicode': '输入 Unicode',
    'Output decoded URL:': '输出解码后的 URL：',
    'Output HTML:': '输出 HTML：',
    
    # URL/编码
    'Encode URL safe': 'URL 安全编码',
    'Decode URL safe': 'URL 安全解码',
    'Enter a phone number': '输入电话号码',
    'Enter an IBAN to check for validity...': '输入 IBAN 进行验证...',
    'Enter a word, e.g. \'internationalization\'': '输入一个单词，如 \'internationalization\'',
    'Default country code:': '默认国家代码：',
    
    # 正则表达式
    'Allows . to match newline characters.': '允许 . 匹配换行符。',
    'Allows ^ and $ to match next to newline characters.': '允许 ^ 和 $ 匹配换行符相邻位置。',
    'An upgrade to the u mode with more Unicode features.': 'u 模式的升级版，提供更多 Unicode 功能。',
    
    # 对比/差异
    'Do they match ? ': '是否匹配？',
    'Only show differences': '仅显示差异',
    
    # 日期时间
    'Epoch': '时间戳',
    'Epoch in sec will be displayed here': '秒级时间戳将在此显示',
    'Invalid date...': '无效日期...',
    'It will end ': '将结束于 ',
    'It\\\'s': '它',
    
    # 列表处理
    'Item prefix': '项目前缀',
    'Item suffix': '项目后缀',
    'List prefix': '列表前缀',
    'List suffix': '列表后缀',
    'Keep line breaks': '保留换行',
    'Amount of element to consume': '要消耗的元素数量',
    
    # 其他
    'Paste your JSON content here...': '在此粘贴 JSON 内容...',
    'Normalized emails will appear here...': '规范化后的邮箱将在此显示...',
    'Padded hex:': '填充后的十六进制：',
    'Collapse content:': '折叠内容：',
    'Delete this value': '删除此值',
    'Convert to lowercase': '转换为小写',
    'End address': '结束地址',
    'Exchange': '交换',
    'Keyword case': '关键字大小写',
    
    # 按钮文本
    'Add': '添加',
    'Remove': '移除',
    'Swap': '交换',
    'Clear': '清除',
    'Copy': '复制',
    'Download': '下载',
    'Upload': '上传',
    'Reset': '重置',
    'Generate': '生成',
    'Convert': '转换',
    'Process': '处理',
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
