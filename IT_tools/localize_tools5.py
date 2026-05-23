#!/usr/bin/env python3
"""
批量汉化 IT-tools 所有工具组件 - 第五轮
"""

TRANSLATIONS = {
    # 选择类
    'Select camera': '选择摄像头',
    'Select font to use': '选择字体',
    'Select microphone': '选择麦克风',
    'Select the result encoding...': '选择结果编码...',
    'Select your mimetype here... (ex: application/pdf)': '选择 MIME 类型（如：application/pdf）',
    
    # 设置类
    'Separator': '分隔符',
    'Separator:': '分隔符：',
    'Set a correct ipv4 address': '设置正确的 IPv4 地址',
    'Set a prefix, e.g. 64:16:7F': '设置前缀，如：64:16:7F',
    
    # 排序类
    'Sort alphabetically': '按字母排序',
    'Sort list': '排序列表',
    
    # 地址类
    'Start address': '起始地址',
    
    # 字符串类
    'String to encode': '要编码的字符串',
    'String to obfuscate:': '要混淆的字符串：',
    'Text:': '文本：',
    'Text to match:': '要匹配的文本：',
    
    # 结果提示
    'The base64 encoding of your string will be here': '字符串的 Base64 编码将在此显示',
    'The binary representation of your text will be here': '文本的二进制表示将在此显示',
    'The decoded string will be here': '解码后的字符串将在此显示',
    'The ipv4 address:': 'IPv4 地址：',
    'The string to decode': '要解码的字符串',
    'The string to encode': '要编码的字符串',
    'The string to escape': '要转义的字符串',
    'The string to unescape': '要反转义的字符串',
    'The text representation of your binary will be here': '二进制的文本表示将在此显示',
    'The text representation of your unicode will be here': 'Unicode 的文本表示将在此显示',
    'The unicode representation of your text will be here': '文本的 Unicode 表示将在此显示',
    'The consumption started at': '消耗开始于',
    
    # 其他
    'Total duration': '总时长',
    'Trash': '回收站',
    'Trim list items': '修剪列表项',
    'Text from your Unicode': '从 Unicode 转换的文本',
    'Text from your binary': '从二进制转换的文本',
    'Unicode from your text': '从文本转换的 Unicode',
    'Unit': '单位',
    'User agent string': 'User-Agent 字符串',
    'Video:': '视频：',
    'View PEM cert': '查看 PEM 证书',
    'Width of the text': '文本宽度',
    'Width:': '宽度：',
    'Wrap item': '包裹项目',
    'Wrap list': '包裹列表',
    
    # 输入提示
    'You slug will be generated here (ex: my-file-path)': 'Slug 将在此生成（如：my-file-path）',
    'Your EAP Identity...': '您的 EAP 身份...',
    'Your SQL query': '您的 SQL 查询',
    'Your TOML': '您的 TOML',
    'Your WiFi Password...': '您的 WiFi 密码...',
    'Your WiFi SSID...': '您的 WiFi SSID...',
    'Your base64 string...': '您的 Base64 字符串...',
    'Your decrypted text:': '解密后的文本：',
    'Your docker run command to convert...': '要转换的 docker run 命令...',
    'Your docker run command:': '您的 docker run 命令：',
    'Your encoded string :': '编码后的字符串：',
    'Your encrypted text:': '加密后的文本：',
    'Your escaped string :': '转义后的字符串：',
    'Your hash: ': '您的哈希：',
    'Your input Outlook SafeLink Url...': '您输入的 Outlook SafeLink URL...',
    'Your input Outlook SafeLink Url:': '您输入的 Outlook SafeLink URL：',
    'Your input data': '您的输入数据',
    'Your link or text...': '您的链接或文本...',
    'Your math expression (ex: 2*sqrt(6) )...': '您的数学表达式（如：2*sqrt(6)）...',
    'Your meta tags': '您的 meta 标签',
    'Your numeronym will be here, e.g. \'i18n\'': '缩写词将在此显示，如 \'i18n\'',
    'Your secret key:': '您的密钥：',
    'Your slug': '您的 Slug',
    'Your string :': '您的字符串：',
    'Your string decoded :': '解码后的字符串：',
    'Your string decoded': '解码后的字符串',
    'Your string encoded :': '编码后的字符串：',
    'Your string encoded': '编码后的字符串',
    'Your string escaped :': '转义后的字符串：',
    'Your string escaped': '转义后的字符串',
    'Your string to slugify': '要转换为 Slug 的字符串',
    'Your string unescaped :': '反转义后的字符串：',
    'Your string unescaped': '反转义后的字符串',
    'Your string: ': '您的字符串：',
    'Your string:': '您的字符串：',
    'Your text encrypted:': '加密后的文本：',
    'Your text to draw': '要绘制的文本',
    'Your text...': '您的文本...',
    'Your text:': '您的文本：',
    'Your transformed data': '转换后的数据',
    'Your url to parse...': '要解析的 URL...',
    'Your url to parse:': '要解析的 URL：',
    'Your uuids': '您的 UUID',
    
    # 测试套件
    'Suite name': '套件名称',
    'Suite values': '套件值',
}

def process_file(file_path):
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
