#!/usr/bin/env python3
"""
提取并替换所有翻译键
"""
import re
import os
from pathlib import Path

# 中文翻译映射
TRANSLATIONS = {
    # BMI 计算器
    'tools.bmi-calculator.parameters': '参数设置',
    'tools.bmi-calculator.metric': '公制',
    'tools.bmi-calculator.imperial': '英制',
    'tools.bmi-calculator.weight': '体重',
    'tools.bmi-calculator.height': '身高',
    'tools.bmi-calculator.weightPlaceholder': '输入体重 (kg)',
    'tools.bmi-calculator.heightPlaceholder': '输入身高 (cm)',
    'tools.bmi-calculator.weightPlaceholderImperial': '输入体重 (lbs)',
    'tools.bmi-calculator.feet': '英尺',
    'tools.bmi-calculator.inches': '英寸',
    'tools.bmi-calculator.result': '计算结果',
    'tools.bmi-calculator.healthyWeightRange': '健康体重范围',
    'tools.bmi-calculator.needToGain': '需要增重',
    'tools.bmi-calculator.needToLose': '需要减重',
    'tools.bmi-calculator.inHealthyRange': '在健康范围内',
    'tools.bmi-calculator.whatIsBMI': '什么是 BMI？',
    'tools.bmi-calculator.bmiExplanation': 'BMI（身体质量指数）是根据体重和身高计算的数值，用于评估体重是否健康。',
    'tools.bmi-calculator.formula': '公式',
    'tools.bmi-calculator.formulaDesc': 'BMI = 体重(kg) / 身高(m)²',
    'tools.bmi-calculator.referenceTable': '参考表',
    'tools.bmi-calculator.category': '分类',
    'tools.bmi-calculator.healthRisk': '健康风险',
    'tools.bmi-calculator.categories.underweight': '偏瘦',
    'tools.bmi-calculator.categories.normal': '正常',
    'tools.bmi-calculator.categories.overweight': '超重',
    'tools.bmi-calculator.categories.obese': '肥胖',
    
    # 年龄计算器
    'tools.age-calculator.birthDate': '出生日期',
    'tools.age-calculator.birthPlaceholder': '选择您的出生日期',
    'tools.age-calculator.yourAge': '您的年龄',
    'tools.age-calculator.years': '岁',
    'tools.age-calculator.months': '个月',
    'tools.age-calculator.days': '天',
    'tools.age-calculator.totalDays': '总天数',
    'tools.age-calculator.totalWeeks': '总周数',
    'tools.age-calculator.totalMonths': '总月数',
    'tools.age-calculator.totalHours': '总小时数',
    'tools.age-calculator.nextBirthday': '下次生日',
    'tools.age-calculator.daysLeft': '天后',
    'tools.age-calculator.turningAge': '将满',
    'tools.age-calculator.zodiac': '生肖',
    'tools.age-calculator.chineseZodiac': '中国生肖',
    'tools.age-calculator.lifeStats': '生命统计',
    'tools.age-calculator.heartbeats': '心跳次数',
    'tools.age-calculator.breaths': '呼吸次数',
    'tools.age-calculator.dreams': '梦境次数',
    'tools.age-calculator.laughs': '大笑次数',
    'tools.age-calculator.parameters': '参数',
    'tools.age-calculator.result': '结果',
    'tools.age-calculator.howToUse': '使用说明',
    'tools.age-calculator.step1': '1. 选择您的出生日期',
    'tools.age-calculator.step2': '2. 点击计算按钮',
    'tools.age-calculator.step3': '3. 查看您的年龄详情',
    'tools.age-calculator.bornOn': '出生于',
    
    # 复利计算器
    'tools.compound-interest-calculator.tableStartBalance': '期初余额',
    'tools.compound-interest-calculator.tableContribution': '追加投资',
    'tools.compound-interest-calculator.tableInterest': '利息',
    'tools.compound-interest-calculator.tableEndBalance': '期末余额',
    'tools.compound-interest-calculator.formula': '计算公式',
    'tools.compound-interest-calculator.formulaDesc': 'A = P(1 + r/n)^(nt)',
    
    # 考勤计算器
    'tools.attendance-calculator.attendedClasses': '已上课时',
    'tools.attendance-calculator.attendedClassesPlaceholder': '已上的课时数',
    'tools.attendance-calculator.currentAttendance': '当前出勤率',
    'tools.attendance-calculator.required': '要求',
    'tools.attendance-calculator.requiredPercentage': '要求出勤率 (%)',
    'tools.attendance-calculator.totalClasses': '总课时',
    'tools.attendance-calculator.totalClassesPlaceholder': '总课时数',
    'tools.attendance-calculator.needToAttend': '需要上课',
    'tools.attendance-calculator.canBunk': '可以翘课',
    'tools.attendance-calculator.justEnough': '刚好达标',
    'tools.attendance-calculator.status.safe': '安全',
    'tools.attendance-calculator.status.warning': '警告',
    'tools.attendance-calculator.status.danger': '危险',
    'tools.attendance-calculator.reset': '重置',
    'tools.attendance-calculator.howToUse': '使用说明',
    'tools.attendance-calculator.step1': '1. 输入总课时数',
    'tools.attendance-calculator.step2': '2. 输入已上课时数',
    'tools.attendance-calculator.step3': '3. 输入要求出勤率',
    
    # 进制转换器
    'tools.base-converter.title': '进制转换器',
    'tools.base-converter.description': '在不同进制之间转换数字',
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
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path("/home/sgj/pyproject/IT_tools/src")
    
    count = 0
    for file_path in src_dir.rglob("*.vue"):
        if process_file(file_path):
            count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    for file_path in src_dir.rglob("*.ts"):
        if file_path.name == 'index.ts' and file_path.parent.name in ['base-converter', 'bmi-calculator', 'age-calculator', 'attendance-calculator']:
            if process_file(file_path):
                count += 1
                print(f"✓ {file_path.relative_to(src_dir)}")
    
    print(f"\n✅ 共处理 {count} 个文件")

if __name__ == "__main__":
    main()
