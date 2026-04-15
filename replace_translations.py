#!/usr/bin/env python3
"""
替换所有 Vue 组件中的翻译键为中文
"""

import os
import re
from pathlib import Path

# 中文翻译映射
TRANSLATIONS = {
    # 复利计算器
    'tools.compound-interest-calculator.title': '复利计算器',
    'tools.compound-interest-calculator.description': '计算复利收益，支持多种复利频率',
    'tools.compound-interest-calculator.parameters': '参数设置',
    'tools.compound-interest-calculator.principal': '本金',
    'tools.compound-interest-calculator.annualRate': '年利率 (%)',
    'tools.compound-interest-calculator.years': '投资年限',
    'tools.compound-interest-calculator.compoundFrequency': '复利频率',
    'tools.compound-interest-calculator.monthlyContribution': '每月追加投资',
    'tools.compound-interest-calculator.optional': '可选',
    'tools.compound-interest-calculator.result': '计算结果',
    'tools.compound-interest-calculator.finalAmount': '最终金额',
    'tools.compound-interest-calculator.totalContributions': '累计投入',
    'tools.compound-interest-calculator.totalInterest': '利息收益',
    'tools.compound-interest-calculator.effectiveRate': '实际年化收益率',
    'tools.compound-interest-calculator.yearlyBreakdown': '年度明细',
    'tools.compound-interest-calculator.tableYear': '年份',
    'tools.compound-interest-calculator.yearly': '按年',
    'tools.compound-interest-calculator.quarterly': '按季度',
    'tools.compound-interest-calculator.monthly': '按月',
    'tools.compound-interest-calculator.daily': '按天',
    
    # GPA计算器
    'tools.gpa-calculator.title': 'GPA 计算器',
    'tools.gpa-calculator.description': '计算平均绩点',
    'tools.gpa-calculator.addCourse': '添加课程',
    'tools.gpa-calculator.courseName': '课程名称',
    'tools.gpa-calculator.credits': '学分',
    'tools.gpa-calculator.grade': '成绩',
    'tools.gpa-calculator.calculate': '计算 GPA',
    'tools.gpa-calculator.result': '计算结果',
    'tools.gpa-calculator.gpa': 'GPA',
    'tools.gpa-calculator.totalCredits': '总学分',
    
    # 折扣计算器
    'tools.discount-calculator.title': '折扣计算器',
    'tools.discount-calculator.description': '计算折扣价格',
    'tools.discount-calculator.originalPrice': '原价',
    'tools.discount-calculator.discountRate': '折扣率 (%)',
    'tools.discount-calculator.finalPrice': '折后价',
    'tools.discount-calculator.savedAmount': '节省金额',
    
    # 贷款计算器
    'tools.loan-calculator.title': '贷款计算器',
    'tools.loan-calculator.description': '计算贷款还款',
    'tools.loan-calculator.loanAmount': '贷款金额',
    'tools.loan-calculator.interestRate': '年利率 (%)',
    'tools.loan-calculator.loanTerm': '贷款期限 (年)',
    'tools.loan-calculator.monthlyPayment': '月还款额',
    'tools.loan-calculator.totalPayment': '总还款额',
    'tools.loan-calculator.totalInterest': '总利息',
    
    # 小费计算器
    'tools.tip-calculator.title': '小费计算器',
    'tools.tip-calculator.description': '计算小费金额',
    'tools.tip-calculator.billAmount': '账单金额',
    'tools.tip-calculator.tipPercentage': '小费比例 (%)',
    'tools.tip-calculator.tipAmount': '小费金额',
    'tools.tip-calculator.totalAmount': '总金额',
}

def process_file(file_path):
    """处理单个文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 替换所有翻译键
    for key, value in TRANSLATIONS.items():
        # 替换 'key' 格式
        content = content.replace(f"'{key}'", f"'{value}'")
        # 替换 "key" 格式
        content = content.replace(f'"{key}"', f'"{value}"')
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path("/home/sgj/pyproject/IT_tools/src")
    
    # 处理所有 .vue 文件
    count = 0
    for file_path in src_dir.rglob("*.vue"):
        if process_file(file_path):
            count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    # 处理工具定义文件
    for file_path in src_dir.glob("tools/*/index.ts"):
        if process_file(file_path):
            count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    print(f"\n✅ 共处理 {count} 个文件")

if __name__ == "__main__":
    main()
