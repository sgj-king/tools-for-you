<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import {
  NButton,
  NSelect,
  NIcon,
  NTag,
  NProgress,
  NScrollbar,
  NTooltip,
  NModal,
} from 'naive-ui';
import {
  Keyboard,
  Refresh,
  InfoCircle,
  Trophy,
  Volume,
  Volume3,
  Settings,
} from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '快捷键训练器',
    subtitle: '互动式训练，快速掌握常用快捷键，让你的效率翻倍',
    category: '应用分类',
    difficulty: '难度',
    basic: '基础',
    intermediate: '进阶',
    advanced: '高级',
    all: '全部',
    currentShortcut: '当前快捷键',
    pressKeys: '请按下快捷键…',
    correct: '正确！',
    wrong: '再试一次',
    skipped: '已跳过',
    skip: '跳过',
    next: '下一个',
    restart: '重新开始',
    progress: '训练进度',
    mastered: '已掌握',
    learning: '学习中',
    totalAttempts: '总尝试',
    correctRate: '正确率',
    streak: '连胜',
    bestStreak: '最佳连胜',
    categories: '分类选择',
    categoryWindows: 'Windows 系统',
    categoryMac: 'macOS 系统',
    categoryVSCode: 'VS Code',
    categoryChrome: 'Chrome 浏览器',
    categoryExcel: 'Excel',
    categoryWord: 'Word',
    categoryGeneral: '通用编辑',
    howToUse: '使用说明',
    howToUseTitle: '如何使用快捷键训练器？',
    step1: '选择你想练习的应用分类和难度等级',
    step2: '屏幕会显示一个操作描述，请按下对应快捷键',
    step3: '按下正确组合键将获得积分，错误可重试或跳过',
    step4: '坚持训练，追踪进度，逐步掌握所有快捷键！',
    tip: '小贴士',
    tipContent: '建议每天练习5-10分钟，从基础级别开始。掌握后再切换到进阶和高级。快捷键熟练后可以大幅提升工作效率！',
    sound: '音效',
    on: '开',
    off: '关',
    score: '得分',
    combo: '连击',
    newRecord: '新纪录！',
    shortcutOf: '第 {current} / {total} 个',
    description: '操作描述',
    shortcutKeys: '快捷键',
    platformMac: 'Mac',
    platformWin: 'Win',
    switchPlatform: '切换平台',
    practiceMode: '练习模式',
    challengeMode: '挑战模式',
    challengeDesc: '60秒限时挑战，看你能答对多少！',
    timeLeft: '剩余时间',
    challengeScore: '挑战得分',
    startChallenge: '开始挑战',
    endChallenge: '结束挑战',
    challengeResult: '挑战结果',
    challengeComplete: '时间到！',
    yourScore: '你的得分',
    shortcutsCorrect: '答对快捷键',
    accuracy: '准确率',
    tryAgain: '再来一次',
    backToPractice: '返回练习',
  },
  en: {
    title: 'Shortcut Trainer',
    subtitle: 'Interactive training to master keyboard shortcuts and boost your productivity',
    category: 'Category',
    difficulty: 'Difficulty',
    basic: 'Basic',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    all: 'All',
    currentShortcut: 'Current Shortcut',
    pressKeys: 'Press the shortcut keys…',
    correct: 'Correct!',
    wrong: 'Try again',
    skipped: 'Skipped',
    skip: 'Skip',
    next: 'Next',
    restart: 'Restart',
    progress: 'Progress',
    mastered: 'Mastered',
    learning: 'Learning',
    totalAttempts: 'Total Attempts',
    correctRate: 'Accuracy',
    streak: 'Streak',
    bestStreak: 'Best Streak',
    categories: 'Category',
    categoryWindows: 'Windows System',
    categoryMac: 'macOS System',
    categoryVSCode: 'VS Code',
    categoryChrome: 'Chrome Browser',
    categoryExcel: 'Excel',
    categoryWord: 'Word',
    categoryGeneral: 'General Editing',
    howToUse: 'How to Use',
    howToUseTitle: 'How to use Shortcut Trainer?',
    step1: 'Select the app category and difficulty level you want to practice',
    step2: 'A description will appear — press the matching keyboard shortcut',
    step3: 'Correct combos earn points; wrong attempts let you retry or skip',
    step4: 'Track your progress daily and master all shortcuts over time!',
    tip: 'Tip',
    tipContent: 'Practice 5-10 minutes daily, starting from Basic. Move to Intermediate and Advanced once comfortable. Mastering shortcuts dramatically boosts productivity!',
    sound: 'Sound',
    on: 'On',
    off: 'Off',
    score: 'Score',
    combo: 'Combo',
    newRecord: 'New Record!',
    shortcutOf: '# {current} / {total}',
    description: 'Action',
    shortcutKeys: 'Shortcut',
    platformMac: 'Mac',
    platformWin: 'Win',
    switchPlatform: 'Switch Platform',
    practiceMode: 'Practice',
    challengeMode: 'Challenge',
    challengeDesc: '60-second timed challenge — how many can you get right?',
    timeLeft: 'Time Left',
    challengeScore: 'Score',
    startChallenge: 'Start Challenge',
    endChallenge: 'End Challenge',
    challengeResult: 'Challenge Result',
    challengeComplete: 'Time\'s up!',
    yourScore: 'Your Score',
    shortcutsCorrect: 'Shortcuts Correct',
    accuracy: 'Accuracy',
    tryAgain: 'Try Again',
    backToPractice: 'Back to Practice',
  },
};

const lang = useStorage<'zh' | 'en'>('shortcut-trainer-lang', 'zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Shortcut Data =====================
interface Shortcut {
  descriptionZh: string;
  descriptionEn: string;
  winKeys: string[];
  macKeys: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  category: string;
}

const shortcuts: Shortcut[] = [
  // Windows System
  { descriptionZh: '复制', descriptionEn: 'Copy', winKeys: ['Ctrl', 'C'], macKeys: ['⌘', 'C'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '粘贴', descriptionEn: 'Paste', winKeys: ['Ctrl', 'V'], macKeys: ['⌘', 'V'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '剪切', descriptionEn: 'Cut', winKeys: ['Ctrl', 'X'], macKeys: ['⌘', 'X'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '撤销', descriptionEn: 'Undo', winKeys: ['Ctrl', 'Z'], macKeys: ['⌘', 'Z'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '重做', descriptionEn: 'Redo', winKeys: ['Ctrl', 'Y'], macKeys: ['⌘', '⇧', 'Z'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '全选', descriptionEn: 'Select All', winKeys: ['Ctrl', 'A'], macKeys: ['⌘', 'A'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '查找', descriptionEn: 'Find', winKeys: ['Ctrl', 'F'], macKeys: ['⌘', 'F'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '保存', descriptionEn: 'Save', winKeys: ['Ctrl', 'S'], macKeys: ['⌘', 'S'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '新建', descriptionEn: 'New', winKeys: ['Ctrl', 'N'], macKeys: ['⌘', 'N'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '打开', descriptionEn: 'Open', winKeys: ['Ctrl', 'O'], macKeys: ['⌘', 'O'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '关闭窗口', descriptionEn: 'Close Window', winKeys: ['Ctrl', 'W'], macKeys: ['⌘', 'W'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '打印', descriptionEn: 'Print', winKeys: ['Ctrl', 'P'], macKeys: ['⌘', 'P'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '切换窗口', descriptionEn: 'Switch Windows', winKeys: ['Alt', 'Tab'], macKeys: ['⌘', 'Tab'], difficulty: 'basic', category: 'windows' },
  { descriptionZh: '锁屏', descriptionEn: 'Lock Screen', winKeys: ['Win', 'L'], macKeys: ['⌃', '⌘', 'Q'], difficulty: 'intermediate', category: 'windows' },
  { descriptionZh: '任务管理器', descriptionEn: 'Task Manager', winKeys: ['Ctrl', '⇧', 'Esc'], macKeys: ['⌥', '⌘', 'Esc'], difficulty: 'intermediate', category: 'windows' },
  { descriptionZh: '显示桌面', descriptionEn: 'Show Desktop', winKeys: ['Win', 'D'], macKeys: ['F11'], difficulty: 'intermediate', category: 'windows' },
  { descriptionZh: '文件管理器', descriptionEn: 'File Explorer', winKeys: ['Win', 'E'], macKeys: ['⌘', '⇧', '⇥'], difficulty: 'intermediate', category: 'windows' },
  { descriptionZh: '截图（全屏）', descriptionEn: 'Screenshot (Full)', winKeys: ['Win', 'PrtSc'], macKeys: ['⌘', '⇧', '3'], difficulty: 'intermediate', category: 'windows' },
  { descriptionZh: '截图（区域）', descriptionEn: 'Screenshot (Area)', winKeys: ['Win', '⇧', 'S'], macKeys: ['⌘', '⇧', '4'], difficulty: 'intermediate', category: 'windows' },
  { descriptionZh: '运行对话框', descriptionEn: 'Run Dialog', winKeys: ['Win', 'R'], macKeys: ['⌘', 'Space'], difficulty: 'advanced', category: 'windows' },
  { descriptionZh: '系统设置', descriptionEn: 'System Settings', winKeys: ['Win', 'I'], macKeys: ['⌘', 'Space'], difficulty: 'intermediate', category: 'windows' },
  { descriptionZh: '虚拟桌面', descriptionEn: 'Virtual Desktop', winKeys: ['Win', 'Ctrl', 'D'], macKeys: ['⌃', '⌘', 'N'], difficulty: 'advanced', category: 'windows' },
  { descriptionZh: '切换虚拟桌面', descriptionEn: 'Switch Virtual Desktop', winKeys: ['Win', 'Ctrl', '←/→'], macKeys: ['⌃', '←/→'], difficulty: 'advanced', category: 'windows' },

  // VS Code
  { descriptionZh: '打开命令面板', descriptionEn: 'Command Palette', winKeys: ['Ctrl', '⇧', 'P'], macKeys: ['⌘', '⇧', 'P'], difficulty: 'basic', category: 'vscode' },
  { descriptionZh: '打开文件', descriptionEn: 'Quick Open File', winKeys: ['Ctrl', 'P'], macKeys: ['⌘', 'P'], difficulty: 'basic', category: 'vscode' },
  { descriptionZh: '全局搜索', descriptionEn: 'Global Search', winKeys: ['Ctrl', '⇧', 'F'], macKeys: ['⌘', '⇧', 'F'], difficulty: 'basic', category: 'vscode' },
  { descriptionZh: '切换终端', descriptionEn: 'Toggle Terminal', winKeys: ['Ctrl', '`'], macKeys: ['⌘', '`'], difficulty: 'basic', category: 'vscode' },
  { descriptionZh: '多行光标（点击）', descriptionEn: 'Multi-cursor (Click)', winKeys: ['Alt', 'Click'], macKeys: ['⌥', 'Click'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '多行光标（行尾）', descriptionEn: 'Multi-cursor (Line End)', winKeys: ['Ctrl', 'Alt', '↑/↓'], macKeys: ['⌘', '⌥', '↑/↓'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '复制行', descriptionEn: 'Duplicate Line', winKeys: ['Ctrl', '⇧', 'D'], macKeys: ['⌘', '⇧', 'D'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '移动行（上/下）', descriptionEn: 'Move Line Up/Down', winKeys: ['Alt', '↑/↓'], macKeys: ['⌥', '↑/↓'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '删除行', descriptionEn: 'Delete Line', winKeys: ['Ctrl', '⇧', 'K'], macKeys: ['⌘', '⇧', 'K'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '注释/取消注释', descriptionEn: 'Toggle Comment', winKeys: ['Ctrl', '/'], macKeys: ['⌘', '/'], difficulty: 'basic', category: 'vscode' },
  { descriptionZh: '块注释', descriptionEn: 'Block Comment', winKeys: ['Ctrl', '⇧', '/'], macKeys: ['⌥', '⇧', 'A'], difficulty: 'advanced', category: 'vscode' },
  { descriptionZh: '格式化文档', descriptionEn: 'Format Document', winKeys: ['Ctrl', '⇧', 'I'], macKeys: ['⌘', '⇧', 'I'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '跳转到定义', descriptionEn: 'Go to Definition', winKeys: ['F12'], macKeys: ['F12'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '重命名符号', descriptionEn: 'Rename Symbol', winKeys: ['F2'], macKeys: ['F2'], difficulty: 'advanced', category: 'vscode' },
  { descriptionZh: '分屏编辑', descriptionEn: 'Split Editor', winKeys: ['Ctrl', '\\'], macKeys: ['⌘', '\\'], difficulty: 'advanced', category: 'vscode' },
  { descriptionZh: '关闭编辑器', descriptionEn: 'Close Editor', winKeys: ['Ctrl', 'W'], macKeys: ['⌘', 'W'], difficulty: 'basic', category: 'vscode' },
  { descriptionZh: '跳转到行', descriptionEn: 'Go to Line', winKeys: ['Ctrl', 'G'], macKeys: ['⌃', 'G'], difficulty: 'intermediate', category: 'vscode' },
  { descriptionZh: '切换侧边栏', descriptionEn: 'Toggle Sidebar', winKeys: ['Ctrl', 'B'], macKeys: ['⌘', 'B'], difficulty: 'basic', category: 'vscode' },

  // Chrome
  { descriptionZh: '新标签页', descriptionEn: 'New Tab', winKeys: ['Ctrl', 'T'], macKeys: ['⌘', 'T'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '关闭标签页', descriptionEn: 'Close Tab', winKeys: ['Ctrl', 'W'], macKeys: ['⌘', 'W'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '恢复关闭的标签页', descriptionEn: 'Reopen Closed Tab', winKeys: ['Ctrl', '⇧', 'T'], macKeys: ['⌘', '⇧', 'T'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '切换到下一个标签页', descriptionEn: 'Next Tab', winKeys: ['Ctrl', 'Tab'], macKeys: ['⌃', 'Tab'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '打开新窗口', descriptionEn: 'New Window', winKeys: ['Ctrl', 'N'], macKeys: ['⌘', 'N'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '隐身模式', descriptionEn: 'Incognito Mode', winKeys: ['Ctrl', '⇧', 'N'], macKeys: ['⌘', '⇧', 'N'], difficulty: 'intermediate', category: 'chrome' },
  { descriptionZh: '历史记录', descriptionEn: 'History', winKeys: ['Ctrl', 'H'], macKeys: ['⌘', 'Y'], difficulty: 'intermediate', category: 'chrome' },
  { descriptionZh: '下载记录', descriptionEn: 'Downloads', winKeys: ['Ctrl', 'J'], macKeys: ['⌘', '⇧', 'J'], difficulty: 'intermediate', category: 'chrome' },
  { descriptionZh: '书签管理', descriptionEn: 'Bookmarks', winKeys: ['Ctrl', '⇧', 'O'], macKeys: ['⌘', '⌥', 'B'], difficulty: 'advanced', category: 'chrome' },
  { descriptionZh: '页面内查找', descriptionEn: 'Find in Page', winKeys: ['Ctrl', 'F'], macKeys: ['⌘', 'F'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '刷新页面', descriptionEn: 'Reload Page', winKeys: ['F5'], macKeys: ['⌘', 'R'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '强制刷新', descriptionEn: 'Hard Reload', winKeys: ['Ctrl', '⇧', 'R'], macKeys: ['⌘', '⇧', 'R'], difficulty: 'intermediate', category: 'chrome' },
  { descriptionZh: '开发者工具', descriptionEn: 'DevTools', winKeys: ['F12'], macKeys: ['⌘', '⌥', 'I'], difficulty: 'intermediate', category: 'chrome' },
  { descriptionZh: '查看源代码', descriptionEn: 'View Source', winKeys: ['Ctrl', 'U'], macKeys: ['⌘', '⌥', 'U'], difficulty: 'advanced', category: 'chrome' },
  { descriptionZh: '全屏模式', descriptionEn: 'Fullscreen', winKeys: ['F11'], macKeys: ['⌃', '⌘', 'F'], difficulty: 'intermediate', category: 'chrome' },
  { descriptionZh: '放大页面', descriptionEn: 'Zoom In', winKeys: ['Ctrl', '+'], macKeys: ['⌘', '+'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '缩小页面', descriptionEn: 'Zoom Out', winKeys: ['Ctrl', '-'], macKeys: ['⌘', '-'], difficulty: 'basic', category: 'chrome' },
  { descriptionZh: '重置缩放', descriptionEn: 'Reset Zoom', winKeys: ['Ctrl', '0'], macKeys: ['⌘', '0'], difficulty: 'intermediate', category: 'chrome' },

  // Excel
  { descriptionZh: '自动求和', descriptionEn: 'Auto Sum', winKeys: ['Alt', '='], macKeys: ['⌘', '⇧', 'T'], difficulty: 'basic', category: 'excel' },
  { descriptionZh: '加粗', descriptionEn: 'Bold', winKeys: ['Ctrl', 'B'], macKeys: ['⌘', 'B'], difficulty: 'basic', category: 'excel' },
  { descriptionZh: '斜体', descriptionEn: 'Italic', winKeys: ['Ctrl', 'I'], macKeys: ['⌘', 'I'], difficulty: 'basic', category: 'excel' },
  { descriptionZh: '插入超链接', descriptionEn: 'Insert Hyperlink', winKeys: ['Ctrl', 'K'], macKeys: ['⌘', 'K'], difficulty: 'intermediate', category: 'excel' },
  { descriptionZh: '插入新行', descriptionEn: 'Insert Row', winKeys: ['Ctrl', '⇧', '+'], macKeys: ['⌘', '⇧', '+'], difficulty: 'intermediate', category: 'excel' },
  { descriptionZh: '删除行', descriptionEn: 'Delete Row', winKeys: ['Ctrl', '-'], macKeys: ['⌘', '-'], difficulty: 'intermediate', category: 'excel' },
  { descriptionZh: '选中整行', descriptionEn: 'Select Row', winKeys: ['⇧', 'Space'], macKeys: ['⇧', 'Space'], difficulty: 'intermediate', category: 'excel' },
  { descriptionZh: '选中整列', descriptionEn: 'Select Column', winKeys: ['Ctrl', 'Space'], macKeys: ['⌃', 'Space'], difficulty: 'intermediate', category: 'excel' },
  { descriptionZh: '移动到工作表开头', descriptionEn: 'Go to Sheet Start', winKeys: ['Ctrl', 'Home'], macKeys: ['⌘', 'Home'], difficulty: 'advanced', category: 'excel' },
  { descriptionZh: '填充下方单元格', descriptionEn: 'Fill Down', winKeys: ['Ctrl', 'D'], macKeys: ['⌘', 'D'], difficulty: 'intermediate', category: 'excel' },
  { descriptionZh: '填充右侧单元格', descriptionEn: 'Fill Right', winKeys: ['Ctrl', 'R'], macKeys: ['⌘', 'R'], difficulty: 'advanced', category: 'excel' },
  { descriptionZh: '编辑单元格', descriptionEn: 'Edit Cell', winKeys: ['F2'], macKeys: ['F2'], difficulty: 'basic', category: 'excel' },
  { descriptionZh: '创建图表', descriptionEn: 'Create Chart', winKeys: ['Alt', 'F1'], macKeys: ['F11'], difficulty: 'advanced', category: 'excel' },
  { descriptionZh: '切换工作表', descriptionEn: 'Switch Sheet', winKeys: ['Ctrl', 'PgUp/PgDn'], macKeys: ['⌥', '←/→'], difficulty: 'intermediate', category: 'excel' },

  // Word
  { descriptionZh: '加粗', descriptionEn: 'Bold', winKeys: ['Ctrl', 'B'], macKeys: ['⌘', 'B'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '斜体', descriptionEn: 'Italic', winKeys: ['Ctrl', 'I'], macKeys: ['⌘', 'I'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '下划线', descriptionEn: 'Underline', winKeys: ['Ctrl', 'U'], macKeys: ['⌘', 'U'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '居中', descriptionEn: 'Center Align', winKeys: ['Ctrl', 'E'], macKeys: ['⌘', 'E'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '左对齐', descriptionEn: 'Left Align', winKeys: ['Ctrl', 'L'], macKeys: ['⌘', 'L'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '右对齐', descriptionEn: 'Right Align', winKeys: ['Ctrl', 'R'], macKeys: ['⌘', 'R'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '增大字号', descriptionEn: 'Increase Font Size', winKeys: ['Ctrl', '⇧', '>'], macKeys: ['⌘', '⇧', '>'], difficulty: 'intermediate', category: 'word' },
  { descriptionZh: '减小字号', descriptionEn: 'Decrease Font Size', winKeys: ['Ctrl', '⇧', '<'], macKeys: ['⌘', '⇧', '<'], difficulty: 'intermediate', category: 'word' },
  { descriptionZh: '插入分页符', descriptionEn: 'Insert Page Break', winKeys: ['Ctrl', 'Enter'], macKeys: ['⌘', 'Enter'], difficulty: 'intermediate', category: 'word' },
  { descriptionZh: '查找替换', descriptionEn: 'Find & Replace', winKeys: ['Ctrl', 'H'], macKeys: ['⌘', 'H'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '首行缩进', descriptionEn: 'First Line Indent', winKeys: ['Ctrl', 'M'], macKeys: ['⌘', 'M'], difficulty: 'advanced', category: 'word' },
  { descriptionZh: '行距（1.5倍）', descriptionEn: 'Line Spacing (1.5x)', winKeys: ['Ctrl', '5'], macKeys: ['⌘', '5'], difficulty: 'advanced', category: 'word' },
  { descriptionZh: '插入链接', descriptionEn: 'Insert Link', winKeys: ['Ctrl', 'K'], macKeys: ['⌘', 'K'], difficulty: 'basic', category: 'word' },
  { descriptionZh: '双倍行距', descriptionEn: 'Double Line Spacing', winKeys: ['Ctrl', '2'], macKeys: ['⌘', '2'], difficulty: 'advanced', category: 'word' },

  // General Editing
  { descriptionZh: '跳到行首', descriptionEn: 'Go to Line Start', winKeys: ['Home'], macKeys: ['⌘', '←'], difficulty: 'basic', category: 'general' },
  { descriptionZh: '跳到行尾', descriptionEn: 'Go to Line End', winKeys: ['End'], macKeys: ['⌘', '→'], difficulty: 'basic', category: 'general' },
  { descriptionZh: '选中到行首', descriptionEn: 'Select to Line Start', winKeys: ['⇧', 'Home'], macKeys: ['⌘', '⇧', '←'], difficulty: 'intermediate', category: 'general' },
  { descriptionZh: '选中到行尾', descriptionEn: 'Select to Line End', winKeys: ['⇧', 'End'], macKeys: ['⌘', '⇧', '→'], difficulty: 'intermediate', category: 'general' },
  { descriptionZh: '删除前一词', descriptionEn: 'Delete Previous Word', winKeys: ['Ctrl', 'Backspace'], macKeys: ['⌥', 'Delete'], difficulty: 'intermediate', category: 'general' },
  { descriptionZh: '删除后一词', descriptionEn: 'Delete Next Word', winKeys: ['Ctrl', 'Delete'], macKeys: ['⌥', 'Delete'], difficulty: 'intermediate', category: 'general' },
  { descriptionZh: '跳到文档开头', descriptionEn: 'Go to Doc Start', winKeys: ['Ctrl', 'Home'], macKeys: ['⌘', '↑'], difficulty: 'basic', category: 'general' },
  { descriptionZh: '跳到文档末尾', descriptionEn: 'Go to Doc End', winKeys: ['Ctrl', 'End'], macKeys: ['⌘', '↓'], difficulty: 'basic', category: 'general' },
  { descriptionZh: '选中上一个词', descriptionEn: 'Select Previous Word', winKeys: ['Ctrl', '⇧', '←'], macKeys: ['⌥', '⇧', '←'], difficulty: 'advanced', category: 'general' },
  { descriptionZh: '选中下一个词', descriptionEn: 'Select Next Word', winKeys: ['Ctrl', '⇧', '→'], macKeys: ['⌥', '⇧', '→'], difficulty: 'advanced', category: 'general' },
];

// Category name map
const categoryNameMap: Record<string, { zh: string; en: string }> = {
  windows: { zh: 'Windows 系统', en: 'Windows System' },
  mac: { zh: 'macOS 系统', en: 'macOS System' },
  vscode: { zh: 'VS Code', en: 'VS Code' },
  chrome: { zh: 'Chrome 浏览器', en: 'Chrome Browser' },
  excel: { zh: 'Excel', en: 'Excel' },
  word: { zh: 'Word', en: 'Word' },
  general: { zh: '通用编辑', en: 'General Editing' },
};

// ===================== State =====================
const isMac = useStorage<boolean>('shortcut-trainer-platform', false);
const selectedCategory = ref<string>('all');
const selectedDifficulty = ref<string>('all');
const soundEnabled = useStorage<boolean>('shortcut-trainer-sound', true);
const mode = ref<'practice' | 'challenge'>('practice');

// Practice state
const currentIndex = ref(0);
const pressedKeys = ref<Set<string>>(new Set());
const feedbackState = ref<'idle' | 'correct' | 'wrong'>('idle');
const score = useStorage<number>('shortcut-trainer-score', 0);
const streak = ref(0);
const bestStreak = useStorage<number>('shortcut-trainer-best-streak', 0);
const totalAttempts = useStorage<number>('shortcut-trainer-attempts', 0);
const correctAttempts = useStorage<number>('shortcut-trainer-correct', 0);
const masteredSet = useStorage<string[]>('shortcut-trainer-mastered', []);
const isNewRecord = ref(false);

// Challenge state
const challengeActive = ref(false);
const challengeTimeLeft = ref(60);
const challengeScore = ref(0);
const challengeCorrect = ref(0);
const challengeTotal = ref(0);
const challengeResultModal = ref(false);
let challengeTimer: ReturnType<typeof setInterval> | null = null;

// ===================== Filtered Shortcuts =====================
const filteredShortcuts = computed(() => {
  return shortcuts.filter(s => {
    if (selectedCategory.value !== 'all' && s.category !== selectedCategory.value) return false;
    if (selectedDifficulty.value !== 'all' && s.difficulty !== selectedDifficulty.value) return false;
    return true;
  });
});

const currentShortcut = computed(() => filteredShortcuts.value[currentIndex.value]);

// ===================== Key Matching =====================
const normalizeKey = (key: string): string => {
  const map: Record<string, string> = {
    'Control': 'Ctrl',
    'Meta': isMac.value ? '⌘' : 'Win',
    'Alt': isMac.value ? '⌥' : 'Alt',
    'Shift': '⇧',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'PageUp': 'PgUp',
    'PageDown': 'PgDn',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Escape': 'Esc',
    'Plus': '+',
    'Minus': '-',
    'Equal': '=',
    'Slash': '/',
    'Backslash': '\\',
    'Backquote': '`',
    'Space': 'Space',
  };
  return map[key] || key.toUpperCase();
};

const getExpectedKeys = computed((): string[] => {
  if (!currentShortcut.value) return [];
  return isMac.value ? currentShortcut.value.macKeys : currentShortcut.value.winKeys;
});

const checkMatch = (pressed: Set<string>, expected: string[]): boolean => {
  if (pressed.size !== expected.length) return false;
  const normalizeForMatch = (k: string) => k.toLowerCase().replace(/^key/, '');
  const pressedNorm = new Set([...pressed].map(normalizeForMatch));
  const expectedNorm = new Set(expected.map(normalizeForMatch));
  if (pressedNorm.size !== expectedNorm.size) return false;
  for (const k of expectedNorm) {
    if (!pressedNorm.has(k)) return false;
  }
  return true;
};

// ===================== Audio =====================
const playSound = (type: 'correct' | 'wrong') => {
  if (!soundEnabled.value) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'correct') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.frequency.value = 220;
      osc.type = 'square';
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {}
};

// ===================== Keyboard Handler =====================
const activeKeys = ref<Set<string>>(new Set());

const handleKeyDown = (e: KeyboardEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const normalized = normalizeKey(e.key);
  activeKeys.value.add(normalized);

  // When all keys are released, we check the combo
};

const handleKeyUp = (e: KeyboardEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const normalized = normalizeKey(e.key);
  activeKeys.value.delete(normalized);

  // If no keys are held, check the last combo
  if (activeKeys.value.size === 0 && pressedKeys.value.size > 0) {
    evaluateCombo();
  } else if (activeKeys.value.size > 0) {
    // Track currently held keys
    pressedKeys.value = new Set(activeKeys.value);
  }
};

const evaluateCombo = () => {
  if (!currentShortcut.value) return;

  const expected = getExpectedKeys.value;
  const isCorrect = checkMatch(pressedKeys.value, expected);

  totalAttempts.value++;

  if (isCorrect) {
    feedbackState.value = 'correct';
    correctAttempts.value++;
    streak.value++;
    score.value += 10 + streak.value * 2;

    if (challengeActive.value) {
      challengeScore.value += 10 + streak.value * 2;
      challengeCorrect.value++;
      challengeTotal.value++;
    }

    if (streak.value > bestStreak.value) {
      bestStreak.value = streak.value;
      isNewRecord.value = true;
      setTimeout(() => { isNewRecord.value = false; }, 2000);
    }

    // Mark as mastered
    const key = `${currentShortcut.value.category}:${currentShortcut.value.descriptionEn}`;
    if (!masteredSet.value.includes(key)) {
      masteredSet.value = [...masteredSet.value, key];
    }

    playSound('correct');

    // Auto advance after delay
    setTimeout(() => {
      feedbackState.value = 'idle';
      pressedKeys.value = new Set();
      advanceShortcut();
    }, 800);
  } else {
    feedbackState.value = 'wrong';
    streak.value = 0;
    playSound('wrong');

    if (challengeActive.value) {
      challengeTotal.value++;
    }

    setTimeout(() => {
      feedbackState.value = 'idle';
      pressedKeys.value = new Set();
    }, 500);
  }
};

const handleKeyDownTrack = (e: KeyboardEvent) => {
  e.preventDefault();
  const normalized = normalizeKey(e.key);
  activeKeys.value.add(normalized);
  pressedKeys.value = new Set(activeKeys.value);

  // For simple combos (non-modifier release detection), also check on keydown when all expected keys are pressed
  const expected = getExpectedKeys.value;
  if (pressedKeys.value.size >= expected.length) {
    const isCorrect = checkMatch(pressedKeys.value, expected);
    if (isCorrect) {
      // Immediately evaluate on full match
      totalAttempts.value++;
      correctAttempts.value++;
      feedbackState.value = 'correct';
      streak.value++;
      score.value += 10 + streak.value * 2;

      if (challengeActive.value) {
        challengeScore.value += 10 + streak.value * 2;
        challengeCorrect.value++;
        challengeTotal.value++;
      }

      if (streak.value > bestStreak.value) {
        bestStreak.value = streak.value;
        isNewRecord.value = true;
        setTimeout(() => { isNewRecord.value = false; }, 2000);
      }

      const key = `${currentShortcut.value.category}:${currentShortcut.value.descriptionEn}`;
      if (!masteredSet.value.includes(key)) {
        masteredSet.value = [...masteredSet.value, key];
      }

      playSound('correct');

      setTimeout(() => {
        feedbackState.value = 'idle';
        pressedKeys.value = new Set();
        activeKeys.value.clear();
        advanceShortcut();
      }, 600);
    }
  }
};

const handleKeyUpTrack = (e: KeyboardEvent) => {
  const normalized = normalizeKey(e.key);
  activeKeys.value.delete(normalized);

  if (activeKeys.value.size === 0 && feedbackState.value === 'idle' && pressedKeys.value.size > 0) {
    // Keys released without a match — wrong answer
    totalAttempts.value++;
    feedbackState.value = 'wrong';
    streak.value = 0;
    playSound('wrong');

    if (challengeActive.value) {
      challengeTotal.value++;
    }

    setTimeout(() => {
      feedbackState.value = 'idle';
      pressedKeys.value = new Set();
    }, 400);
  }
};

// ===================== Navigation =====================
const advanceShortcut = () => {
  if (filteredShortcuts.value.length === 0) return;
  currentIndex.value = (currentIndex.value + 1) % filteredShortcuts.value.length;
};

const skip = () => {
  feedbackState.value = 'skipped';
  streak.value = 0;
  setTimeout(() => {
    feedbackState.value = 'idle';
    pressedKeys.value = new Set();
    advanceShortcut();
  }, 300);
};

const restart = () => {
  currentIndex.value = 0;
  feedbackState.value = 'idle';
  pressedKeys.value = new Set();
  streak.value = 0;
};

// ===================== Challenge Mode =====================
const startChallenge = () => {
  challengeActive.value = true;
  challengeTimeLeft.value = 60;
  challengeScore.value = 0;
  challengeCorrect.value = 0;
  challengeTotal.value = 0;
  challengeResultModal.value = false;
  currentIndex.value = 0;
  feedbackState.value = 'idle';
  streak.value = 0;

  // Shuffle
  const len = filteredShortcuts.value.length;
  currentIndex.value = Math.floor(Math.random() * len);

  challengeTimer = setInterval(() => {
    challengeTimeLeft.value--;
    if (challengeTimeLeft.value <= 0) {
      endChallenge();
    }
  }, 1000);
};

const endChallenge = () => {
  if (challengeTimer) {
    clearInterval(challengeTimer);
    challengeTimer = null;
  }
  challengeActive.value = false;
  challengeResultModal.value = true;
};

// ===================== Displayed Keys =====================
const displayPressedKeys = computed(() => {
  return [...pressedKeys.value];
});

const displayExpectedKeys = computed(() => {
  return getExpectedKeys.value;
});

const formatKeyCombo = (keys: string[]): string => {
  return keys.join(' + ');
};

const difficultyColor = (d: string) => {
  if (d === 'basic') return '#63e2b7';
  if (d === 'intermediate') return '#f2c97d';
  return '#e88080';
};

const difficultyLabel = (d: string) => {
  if (d === 'basic') return t('basic').value;
  if (d === 'intermediate') return t('intermediate').value;
  return t('advanced').value;
};

// ===================== Progress Stats =====================
const correctRate = computed(() => {
  if (totalAttempts.value === 0) return 0;
  return Math.round((correctAttempts.value / totalAttempts.value) * 100);
});

const masteredCount = computed(() => {
  const relevant = filteredShortcuts.value.map(s => `${s.category}:${s.descriptionEn}`);
  return masteredSet.value.filter(k => relevant.includes(k)).length;
});

const progressPercent = computed(() => {
  if (filteredShortcuts.value.length === 0) return 0;
  return Math.round((masteredCount.value / filteredShortcuts.value.length) * 100);
});

// Category options
const categoryOptions = computed(() => [
  { label: lang.value === 'zh' ? '全部分类' : 'All Categories', value: 'all' },
  ...Object.entries(categoryNameMap).map(([key, name]) => ({
    label: lang.value === 'zh' ? name.zh : name.en,
    value: key,
  })),
]);

const difficultyOptions = computed(() => [
  { label: t('all').value, value: 'all' },
  { label: t('basic').value, value: 'basic' },
  { label: t('intermediate').value, value: 'intermediate' },
  { label: t('advanced').value, value: 'advanced' },
]);

// ===================== Key Caps Rendering =====================
const keyCapClass = (key: string, isExpected: boolean) => {
  const isPressed = pressedKeys.value.has(key) || pressedKeys.value.has(key.toLowerCase()) || pressedKeys.value.has(key.toUpperCase());
  let cls = 'st-keycap';
  if (isExpected && isPressed) cls += ' st-keycap-match';
  else if (isPressed) cls += ' st-keycap-pressed';
  else if (isExpected) cls += ' st-keycap-expected';
  return cls;
};

// ===================== Lifecycle =====================
onMounted(() => {
  window.addEventListener('keydown', handleKeyDownTrack, true);
  window.addEventListener('keyup', handleKeyUpTrack, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDownTrack, true);
  window.removeEventListener('keyup', handleKeyUpTrack, true);
  if (challengeTimer) clearInterval(challengeTimer);
});

// Reset index when filters change
watch([selectedCategory, selectedDifficulty], () => {
  currentIndex.value = 0;
  feedbackState.value = 'idle';
  pressedKeys.value = new Set();
});
</script>

<template>
  <div class="shortcut-trainer">
    <!-- Header -->
    <div class="st-header">
      <div class="st-title-row">
        <NIcon size="28" class="st-icon"><Keyboard /></NIcon>
        <div>
          <h2 class="st-title">{{ t('title').value }}</h2>
          <p class="st-subtitle">{{ t('subtitle').value }}</p>
        </div>
      </div>
      <div class="st-header-actions">
        <NButton size="tiny" quaternary @click="isMac = !isMac">
          {{ isMac ? t('platformMac').value : t('platformWin').value }}
        </NButton>
        <NButton size="tiny" quaternary @click="soundEnabled = !soundEnabled">
          <template #icon>
            <NIcon size="14"><component :is="soundEnabled ? Volume : Volume3" /></NIcon>
          </template>
        </NButton>
        <NButton size="tiny" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
          {{ lang === 'zh' ? 'EN' : '中' }}
        </NButton>
      </div>
    </div>

    <!-- Mode Toggle -->
    <div class="st-mode-toggle">
      <NButton
        :type="mode === 'practice' ? 'primary' : 'default'"
        size="small"
        @click="mode = 'practice'"
        :disabled="challengeActive"
      >
        {{ t('practiceMode').value }}
      </NButton>
      <NButton
        :type="mode === 'challenge' ? 'warning' : 'default'"
        size="small"
        @click="mode = 'challenge'"
        :disabled="challengeActive"
      >
        🏆 {{ t('challengeMode').value }}
      </NButton>
    </div>

    <!-- Challenge Mode Banner -->
    <div v-if="mode === 'challenge' && !challengeActive" class="st-challenge-banner">
      <p class="st-challenge-desc">{{ t('challengeDesc').value }}</p>
      <NButton type="warning" size="large" @click="startChallenge">
        🚀 {{ t('startChallenge').value }}
      </NButton>
    </div>

    <!-- Challenge Timer -->
    <div v-if="challengeActive" class="st-challenge-timer">
      <div class="st-timer-bar">
        <NProgress
          :percentage="(challengeTimeLeft / 60) * 100"
          :show-indicator="false"
          :color="challengeTimeLeft > 20 ? '#63e2b7' : challengeTimeLeft > 10 ? '#f2c97d' : '#e88080'"
          :height="8"
          :border-radius="4"
        />
      </div>
      <div class="st-timer-info">
        <span class="st-timer-time">{{ challengeTimeLeft }}s</span>
        <span class="st-timer-score">
          {{ t('score').value }}: {{ challengeScore }}
          <span v-if="streak > 1" class="st-combo-badge">
            🔥 {{ streak }}x {{ t('combo').value }}
          </span>
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="st-filters" v-if="!challengeActive || mode === 'practice'">
      <div class="st-filter-row">
        <div class="st-filter-item">
          <span class="st-filter-label">{{ t('category').value }}</span>
          <NSelect
            v-model:value="selectedCategory"
            :options="categoryOptions"
            size="small"
            class="st-filter-select"
          />
        </div>
        <div class="st-filter-item">
          <span class="st-filter-label">{{ t('difficulty').value }}</span>
          <NSelect
            v-model:value="selectedDifficulty"
            :options="difficultyOptions"
            size="small"
            class="st-filter-select"
          />
        </div>
      </div>
    </div>

    <!-- Main Training Area -->
    <div v-if="currentShortcut && (mode === 'practice' || challengeActive)" class="st-training-area">
      <!-- Feedback overlay -->
      <div
        class="st-feedback"
        :class="{
          'st-feedback-correct': feedbackState === 'correct',
          'st-feedback-wrong': feedbackState === 'wrong',
        }"
      >
        <span v-if="feedbackState === 'correct'" class="st-feedback-text st-feedback-correct-text">
          ✅ {{ t('correct').value }}
          <span v-if="streak > 1" class="st-streak-badge">🔥 {{ streak }}x</span>
          <span v-if="isNewRecord" class="st-new-record">⭐ {{ t('newRecord').value }}</span>
        </span>
        <span v-else-if="feedbackState === 'wrong'" class="st-feedback-text st-feedback-wrong-text">
          ❌ {{ t('wrong').value }}
        </span>
      </div>

      <!-- Shortcut Display -->
      <div class="st-shortcut-card">
        <div class="st-shortcut-meta">
          <NTag
            size="tiny"
            :bordered="false"
            :style="{ background: difficultyColor(currentShortcut.difficulty) + '22', color: difficultyColor(currentShortcut.difficulty) }"
          >
            {{ difficultyLabel(currentShortcut.difficulty) }}
          </NTag>
          <NTag size="tiny" :bordered="false" type="info">
            {{ lang === 'zh' ? categoryNameMap[currentShortcut.category]?.zh : categoryNameMap[currentShortcut.category]?.en }}
          </NTag>
          <span class="st-shortcut-index">
            {{ t('shortcutOf').value.replace('{current}', String(currentIndex + 1)).replace('{total}', String(filteredShortcuts.length)) }}
          </span>
        </div>

        <div class="st-description">
          {{ lang === 'zh' ? currentShortcut.descriptionZh : currentShortcut.descriptionEn }}
        </div>

        <!-- Expected keys (hint area) -->
        <div class="st-keys-section">
          <div class="st-keys-label">{{ t('shortcutKeys').value }}</div>
          <div class="st-keys-display">
            <template v-for="(key, i) in displayExpectedKeys" :key="'exp-'+i">
              <span v-if="i > 0" class="st-key-plus">+</span>
              <span
                class="st-keycap"
                :class="keyCapClass(key, true)"
              >
                {{ key }}
              </span>
            </template>
          </div>
        </div>

        <!-- Pressed keys display -->
        <div class="st-pressed-section">
          <div class="st-keys-label">{{ t('pressKeys').value }}</div>
          <div class="st-keys-display st-pressed-keys">
            <template v-if="pressedKeys.size > 0">
              <template v-for="(key, i) in displayPressedKeys" :key="'press-'+i">
                <span v-if="i > 0" class="st-key-plus">+</span>
                <span class="st-keycap st-keycap-pressed">{{ key }}</span>
              </template>
            </template>
            <span v-else class="st-press-hint">
              ⌨️ {{ t('pressKeys').value }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="st-actions">
        <NButton secondary size="small" @click="skip" :disabled="feedbackState === 'correct'">
          {{ t('skip').value }}
        </NButton>
        <NButton secondary size="small" @click="restart" :disabled="challengeActive">
          <template #icon><NIcon size="14"><Refresh /></NIcon></template>
          {{ t('restart').value }}
        </NButton>
        <NButton v-if="challengeActive" type="warning" size="small" @click="endChallenge">
          {{ t('endChallenge').value }}
        </NButton>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredShortcuts.length === 0" class="st-empty">
      <span class="st-empty-icon">🔍</span>
      <p>{{ lang === 'zh' ? '没有匹配的快捷键，请调整筛选条件' : 'No shortcuts match the filters' }}</p>
    </div>

    <!-- Stats Panel -->
    <div class="st-stats">
      <h3 class="st-section-title">{{ t('progress').value }}</h3>
      <div class="st-stats-grid">
        <div class="st-stat-card st-stat-mastered">
          <span class="st-stat-value">{{ masteredCount }}</span>
          <span class="st-stat-label">{{ t('mastered').value }}</span>
          <span class="st-stat-sub">/ {{ filteredShortcuts.length }}</span>
        </div>
        <div class="st-stat-card st-stat-rate">
          <span class="st-stat-value">{{ correctRate }}%</span>
          <span class="st-stat-label">{{ t('correctRate').value }}</span>
        </div>
        <div class="st-stat-card st-stat-streak">
          <span class="st-stat-value">{{ streak }}</span>
          <span class="st-stat-label">{{ t('streak').value }}</span>
        </div>
        <div class="st-stat-card st-stat-best">
          <span class="st-stat-value">{{ bestStreak }}</span>
          <span class="st-stat-label">{{ t('bestStreak').value }}</span>
        </div>
      </div>
      <div class="st-progress-bar">
        <NProgress
          :percentage="progressPercent"
          :indicator-placement="'inside'"
          :color="'#63e2b7'"
          :height="10"
          :border-radius="5"
        />
      </div>
    </div>

    <!-- How to Use -->
    <div class="st-info">
      <h3 class="st-section-title">{{ t('howToUse').value }}</h3>
      <div class="st-info-steps">
        <div class="st-step"><span class="st-step-num">1</span>{{ t('step1').value }}</div>
        <div class="st-step"><span class="st-step-num">2</span>{{ t('step2').value }}</div>
        <div class="st-step"><span class="st-step-num">3</span>{{ t('step3').value }}</div>
        <div class="st-step"><span class="st-step-num">4</span>{{ t('step4').value }}</div>
      </div>
      <div class="st-tip">
        <strong>💡 {{ t('tip').value }}</strong>
        <p>{{ t('tipContent').value }}</p>
      </div>
    </div>

    <!-- Challenge Result Modal -->
    <NModal v-model:show="challengeResultModal" preset="card" :style="{ maxWidth: '400px' }" :closable="true">
      <div class="st-challenge-result">
        <h3 class="st-result-title">🏆 {{ t('challengeComplete').value }}</h3>
        <div class="st-result-stats">
          <div class="st-result-item">
            <span class="st-result-label">{{ t('yourScore').value }}</span>
            <span class="st-result-value st-result-score">{{ challengeScore }}</span>
          </div>
          <div class="st-result-item">
            <span class="st-result-label">{{ t('shortcutsCorrect').value }}</span>
            <span class="st-result-value">{{ challengeCorrect }} / {{ challengeTotal }}</span>
          </div>
          <div class="st-result-item">
            <span class="st-result-label">{{ t('accuracy').value }}</span>
            <span class="st-result-value">{{ challengeTotal > 0 ? Math.round((challengeCorrect / challengeTotal) * 100) : 0 }}%</span>
          </div>
        </div>
        <div class="st-result-actions">
          <NButton type="warning" @click="startChallenge">{{ t('tryAgain').value }}</NButton>
          <NButton secondary @click="challengeResultModal = false; mode = 'practice'">{{ t('backToPractice').value }}</NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.shortcut-trainer {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px;
  user-select: none;
}

/* Header */
.st-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.st-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.st-icon { color: #63e2b7; }
.st-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}
.st-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}
.st-header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* Mode Toggle */
.st-mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

/* Challenge Banner */
.st-challenge-banner {
  padding: 24px;
  text-align: center;
  background: rgba(242, 201, 125, 0.06);
  border: 1px solid rgba(242, 201, 125, 0.15);
  border-radius: 14px;
  margin-bottom: 16px;
}
.st-challenge-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px;
}

/* Challenge Timer */
.st-challenge-timer {
  margin-bottom: 16px;
}
.st-timer-bar { margin-bottom: 8px; }
.st-timer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.st-timer-time {
  font-size: 20px;
  font-weight: 700;
  color: #f2c97d;
  font-variant-numeric: tabular-nums;
}
.st-timer-score {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}
.st-combo-badge {
  margin-left: 8px;
  color: #e88080;
}

/* Filters */
.st-filters {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.st-filter-row {
  display: flex;
  gap: 12px;
}
.st-filter-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.st-filter-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
.st-filter-select { width: 100%; }

/* Training Area */
.st-training-area {
  position: relative;
  margin-bottom: 20px;
}

/* Feedback */
.st-feedback {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.st-feedback-correct,
.st-feedback-wrong {
  opacity: 1;
}
.st-feedback-text {
  font-size: 18px;
  font-weight: 700;
  padding: 6px 20px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.st-feedback-correct-text {
  background: rgba(99, 226, 183, 0.15);
  color: #63e2b7;
  border: 1px solid rgba(99, 226, 183, 0.3);
}
.st-feedback-wrong-text {
  background: rgba(232, 128, 128, 0.15);
  color: #e88080;
  border: 1px solid rgba(232, 128, 128, 0.3);
}
.st-streak-badge {
  font-size: 14px;
}
.st-new-record {
  font-size: 13px;
  animation: st-pulse 0.6s ease-in-out 2;
}

@keyframes st-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Shortcut Card */
.st-shortcut-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  margin-top: 40px;
}
.st-shortcut-meta {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}
.st-shortcut-index {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}
.st-description {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 24px;
  letter-spacing: 0.5px;
}

/* Keys Display */
.st-keys-section {
  margin-bottom: 16px;
}
.st-keys-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 10px;
}
.st-keys-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 48px;
}

/* Key Cap */
.st-keycap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s ease;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}
.st-keycap-expected {
  background: rgba(99, 226, 183, 0.08);
  border-color: rgba(99, 226, 183, 0.25);
  color: #63e2b7;
}
.st-keycap-pressed {
  background: rgba(242, 201, 125, 0.12);
  border-color: rgba(242, 201, 125, 0.3);
  color: #f2c97d;
  transform: translateY(2px);
  box-shadow: none;
}
.st-keycap-match {
  background: rgba(99, 226, 183, 0.2);
  border-color: #63e2b7;
  color: #63e2b7;
  transform: translateY(2px);
  box-shadow: 0 0 12px rgba(99, 226, 183, 0.3);
}
.st-key-plus {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
}

/* Pressed Section */
.st-pressed-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
}
.st-pressed-keys {
  min-height: 48px;
}
.st-press-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
}

/* Actions */
.st-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}

/* Empty */
.st-empty {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.4);
}
.st-empty-icon { font-size: 36px; }

/* Stats */
.st-stats {
  margin-bottom: 20px;
}
.st-section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}
.st-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.st-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.st-stat-value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.st-stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}
.st-stat-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}
.st-stat-mastered .st-stat-value { color: #63e2b7; }
.st-stat-rate .st-stat-value { color: #f2c97d; }
.st-stat-streak .st-stat-value { color: #e88080; }
.st-stat-best .st-stat-value { color: rgba(255, 255, 255, 0.7); }
.st-progress-bar { margin-top: 4px; }

/* Info */
.st-info {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.st-info-steps {
  margin-bottom: 14px;
}
.st-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
}
.st-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(99, 226, 183, 0.15);
  color: #63e2b7;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.st-tip {
  padding: 12px;
  background: rgba(242, 201, 125, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(242, 201, 125, 0.1);
}
.st-tip strong {
  display: block;
  font-size: 13px;
  color: #f2c97d;
  margin-bottom: 4px;
}
.st-tip p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}

/* Challenge Result Modal */
.st-challenge-result {
  text-align: center;
  padding: 8px;
}
.st-result-title {
  margin: 0 0 20px;
  font-size: 20px;
  color: #f2c97d;
}
.st-result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.st-result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.st-result-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
}
.st-result-value {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}
.st-result-score {
  color: #f2c97d;
  font-size: 28px;
}
.st-result-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* Responsive */
@media (max-width: 600px) {
  .st-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .st-description {
    font-size: 20px;
  }
  .st-keycap {
    min-width: 36px;
    height: 38px;
    font-size: 13px;
    padding: 0 10px;
  }
  .st-result-stats {
    grid-template-columns: 1fr;
  }
}
</style>
