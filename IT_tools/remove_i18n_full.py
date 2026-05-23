#!/usr/bin/env python3
"""
完全移除 i18n 国际化系统，替换为中文硬编码
"""

import os
import re
from pathlib import Path
import yaml
import json

# 中文翻译映射（从 zh.yml 提取）
TRANSLATIONS = {}

def load_translations():
    """加载翻译文件"""
    zh_file = Path("/home/sgj/pyproject/IT_tools/locales/zh.yml")
    if zh_file.exists():
        with open(zh_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if data and 'tools' in data:
                flatten_dict(data['tools'], 'tools', TRANSLATIONS)
            # 加载其他顶级翻译
            for key, value in data.items():
                if key != 'tools':
                    flatten_dict(value, key, TRANSLATIONS)

def flatten_dict(d, prefix, result):
    """扁平化字典"""
    if isinstance(d, dict):
        for k, v in d.items():
            new_key = f"{prefix}.{k}"
            if isinstance(v, str):
                result[new_key] = v
            else:
                flatten_dict(v, new_key, result)

def get_translation(key):
    """获取翻译"""
    return TRANSLATIONS.get(key, key)

def process_tool_index(file_path):
    """处理工具定义文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换 translate('xxx') 为中文
    def replace_translate(match):
        key = match.group(1)
        return f"'{get_translation(key)}'"
    
    content = re.sub(r"translate\(['\"]([^'\"]+)['\"]\)", replace_translate, content)
    
    # 移除 import { translate } 
    content = re.sub(r"import\s+\{\s*translate\s*\}\s+from\s*['\"][^'\"]*i18n[^'\"]*['\"];\s*", '', content)
    content = re.sub(r"import\s+translate\s+from\s*['\"][^'\"]*i18n[^'\"]*['\"];\s*", '', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return True

def process_vue_file(file_path):
    """处理 Vue 文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 替换 $t('xxx')
    def replace_t(match):
        key = match.group(1)
        return f"'{get_translation(key)}'"
    
    content = re.sub(r"\$t\(['\"]([^'\"]+)['\"]\)", replace_t, content)
    
    # 替换 {{ $t('xxx') }}
    content = re.sub(r"\{\{\s*\$t\(['\"]([^'\"]+)['\"]\)\s*\}\}", lambda m: get_translation(m.group(1)), content)
    
    # 移除 useI18n 导入
    content = re.sub(r"import\s+\{\s*useI18n[^}]*\}\s+from\s*['\"]vue-i18n['\"];\s*", '', content)
    content = re.sub(r"import\s+\{\s*\w+,\s*useI18n[^}]*\}\s+from\s*['\"]vue-i18n['\"];\s*", '', content)
    
    # 移除 const { t } = useI18n()
    content = re.sub(r"const\s+\{\s*t\s*(?:,\s*locale)?\s*\}\s*=\s*useI18n\(\);\s*", '', content)
    
    # 替换 t('xxx') 函数调用
    content = re.sub(r"\bt\(['\"]([^'\"]+)['\"]\)", lambda m: f"'{get_translation(m.group(1))}'", content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def process_ts_file(file_path):
    """处理 TypeScript 文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 移除 i18n 相关导入
    content = re.sub(r"import\s+\{\s*useI18n[^}]*\}\s+from\s*['\"]vue-i18n['\"];\s*", '', content)
    
    # 替换翻译函数
    def replace_t(match):
        key = match.group(1)
        return f"'{get_translation(key)}'"
    
    content = re.sub(r"\bt\(['\"]([^'\"]+)['\"]\)", replace_t, content)
    
    # 移除 const { t } = useI18n()
    content = re.sub(r"const\s+\{\s*t\s*(?:,\s*locale)?\s*\}\s*=\s*useI18n\(\);\s*", '', content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # 加载翻译
    load_translations()
    print(f"已加载 {len(TRANSLATIONS)} 个翻译键")
    
    src_dir = Path("/home/sgj/pyproject/IT_tools/src")
    
    # 1. 处理所有工具定义文件
    print("\n=== 处理工具定义文件 ===")
    for file_path in src_dir.glob("tools/*/index.ts"):
        if process_tool_index(file_path):
            print(f"✓ {file_path.name}")
    
    # 2. 处理所有 Vue 文件
    print("\n=== 处理 Vue 文件 ===")
    count = 0
    for file_path in src_dir.rglob("*.vue"):
        if process_vue_file(file_path):
            count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    print(f"共处理 {count} 个 Vue 文件")
    
    # 3. 处理其他 TypeScript 文件
    print("\n=== 处理 TypeScript 文件 ===")
    for file_path in src_dir.rglob("*.ts"):
        if 'tools/' in str(file_path) and file_path.name == 'index.ts':
            continue
        if process_ts_file(file_path):
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    print("\n✅ 完成!")

if __name__ == "__main__":
    main()
