#!/usr/bin/env python3
"""
完整翻译替换 - 所有剩余的翻译键
"""

# 完整翻译映射
TRANSLATIONS = {
    # BMI 计算器补充
    'tools.bmi-calculator.howToUse': '使用说明',
    'tools.bmi-calculator.note': '注意',
    'tools.bmi-calculator.noteContent': 'BMI 仅作为参考指标，不能完全反映健康状况',
    'tools.bmi-calculator.risks.normal': '健康风险较低',
    'tools.bmi-calculator.risks.obese': '心血管疾病、糖尿病风险高',
    'tools.bmi-calculator.risks.overweight': '有一定健康风险',
    'tools.bmi-calculator.risks.underweight': '营养不良风险',
    'tools.bmi-calculator.step1': '1. 选择单位制（公制/英制）',
    'tools.bmi-calculator.step2': '2. 输入您的体重和身高',
    'tools.bmi-calculator.step3': '3. 查看计算结果和健康建议',
    
    # 颜色选择器
    'tools.color-picker.title': '颜色选择器',
    'tools.color-picker.description': '选择颜色并获取各种格式',
    
    # 折扣计算器
    'tools.discount-calculator.amountPlaceholder': '输入金额',
    'tools.discount-calculator.discountAmount': '折扣金额',
    'tools.discount-calculator.discountPercentage': '折扣比例',
    'tools.discount-calculator.discountType': '折扣类型',
    'tools.discount-calculator.effectiveDiscount': '实际折扣',
    'tools.discount-calculator.fixedAmount': '固定金额',
    'tools.discount-calculator.howToUse': '使用说明',
    'tools.discount-calculator.parameters': '参数',
    'tools.discount-calculator.percentPlaceholder': '输入百分比',
    'tools.discount-calculator.percentageOff': '百分比折扣',
    'tools.discount-calculator.pricePlaceholder': '输入原价',
    'tools.discount-calculator.quantity': '数量',
    'tools.discount-calculator.quickDiscounts': '快捷折扣',
    'tools.discount-calculator.result': '结果',
    'tools.discount-calculator.step1': '1. 输入商品原价',
    'tools.discount-calculator.step2': '2. 选择折扣类型和数值',
    'tools.discount-calculator.step3': '3. 查看折扣后价格',
    'tools.discount-calculator.subtotal': '小计',
    'tools.discount-calculator.unitPrice': '单价',
    'tools.discount-calculator.youSave': '您节省',
    
    # GPA 计算器补充
    'tools.gpa-calculator.average': '平均',
    'tools.gpa-calculator.clearAll': '清空全部',
    'tools.gpa-calculator.courseCount': '课程数',
    'tools.gpa-calculator.courseList': '课程列表',
    'tools.gpa-calculator.courseNamePlaceholder': '课程名称',
    'tools.gpa-calculator.excellent': '优秀',
    'tools.gpa-calculator.good': '良好',
    'tools.gpa-calculator.gradingScale': '评分标准',
    'tools.gpa-calculator.needsImprovement': '需要提高',
    'tools.gpa-calculator.selectGrade': '选择成绩',
    
    # 图像颜色提取器
    'tools.image-color-extractor.clear': '清除',
    'tools.image-color-extractor.colorCount': '颜色数量',
    'tools.image-color-extractor.copyCss': '复制 CSS',
    'tools.image-color-extractor.copyHex': '复制 HEX',
    'tools.image-color-extractor.copyRgb': '复制 RGB',
    'tools.image-color-extractor.cssVariables': 'CSS 变量',
    'tools.image-color-extractor.description': '从图像中提取主要颜色',
    'tools.image-color-extractor.emptyHint': '上传图片开始提取颜色',
    'tools.image-color-extractor.extractedColors': '提取的颜色',
    'tools.image-color-extractor.palette': '调色板',
    'tools.image-color-extractor.processing': '处理中...',
    'tools.image-color-extractor.title': '图像颜色提取器',
    'tools.image-color-extractor.uploadHint': '支持 JPG、PNG、GIF 格式',
    'tools.image-color-extractor.uploadTitle': '上传图片',
    
    # 贷款计算器补充
    'tools.loan-calculator.amountPlaceholder': '输入贷款金额',
    'tools.loan-calculator.annualRate': '年利率',
    'tools.loan-calculator.downPayment': '首付',
    'tools.loan-calculator.downPaymentPaid': '已付首付',
    'tools.loan-calculator.downPaymentPlaceholder': '输入首付金额',
    'tools.loan-calculator.ellipsis': '...',
    'tools.loan-calculator.formula': '计算公式',
    'tools.loan-calculator.formulaDesc': '等额本息还款方式',
    'tools.loan-calculator.interestRatio': '利息占比',
    'tools.loan-calculator.months': '月',
    'tools.loan-calculator.monthsUnit': '个月',
    'tools.loan-calculator.parameters': '参数',
    'tools.loan-calculator.paymentSchedule': '还款计划',
    'tools.loan-calculator.perMonth': '每月',
    'tools.loan-calculator.principal': '本金',
    'tools.loan-calculator.ratePlaceholder': '输入年利率',
    'tools.loan-calculator.result': '结果',
    'tools.loan-calculator.tableBalance': '剩余本金',
    'tools.loan-calculator.tableInterest': '利息',
    'tools.loan-calculator.tableMonth': '期数',
    'tools.loan-calculator.tablePayment': '还款额',
    'tools.loan-calculator.tablePrincipal': '本金',
    'tools.loan-calculator.termPlaceholder': '输入贷款期限',
    'tools.loan-calculator.tip1': '贷款期限越长，月供越低，但总利息越高',
    'tools.loan-calculator.tip2': '提前还款可以减少总利息支出',
    'tools.loan-calculator.tip3': '比较不同银行的利率可以获得更优惠的条件',
    'tools.loan-calculator.tips': '小提示',
    'tools.loan-calculator.totalMonths': '总月数',
    'tools.loan-calculator.years': '年',
    
    # Markdown 编辑器
    'tools.markdown-editor.title': 'Markdown 编辑器',
    'tools.markdown-editor.description': '实时预览的 Markdown 编辑器',
    
    # 小费计算器
    'tools.tip-calculator.billPerPerson': '每人账单',
    'tools.tip-calculator.billPlaceholder': '输入账单金额',
    'tools.tip-calculator.howToUse': '使用说明',
    'tools.tip-calculator.numberOfPeople': '人数',
    'tools.tip-calculator.parameters': '参数',
    'tools.tip-calculator.people': '人',
    'tools.tip-calculator.perPerson': '每人',
    'tools.tip-calculator.percentPlaceholder': '输入百分比',
    'tools.tip-calculator.person': '人',
    'tools.tip-calculator.quickTips': '快捷小费',
    'tools.tip-calculator.result': '结果',
    'tools.tip-calculator.step1': '1. 输入账单金额',
    'tools.tip-calculator.step2': '2. 选择小费比例',
    'tools.tip-calculator.step3': '3. 查看分摊结果',
    'tools.tip-calculator.tipPerPerson': '每人小费',
    
    # 单位转换器
    'tools.unit-converter.title': '单位转换器',
    'tools.unit-converter.description': '在不同单位之间转换',
}

def process_file(file_path):
    """处理单个文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 替换所有翻译键
    for key, value in TRANSLATIONS.items():
        content = content.replace(f"'{key}'", f"'{value}'")
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    import os
    from pathlib import Path
    
    src_dir = Path("/home/sgj/pyproject/IT_tools/src")
    
    count = 0
    for file_path in src_dir.rglob("*.vue"):
        if process_file(file_path):
            count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    for file_path in src_dir.rglob("*.ts"):
        if 'tools' in str(file_path) and file_path.name == 'index.ts':
            if process_file(file_path):
                count += 1
                print(f"✓ {file_path.relative_to(src_dir)}")
    
    print(f"\n✅ 共处理 {count} 个文件")

if __name__ == "__main__":
    main()
