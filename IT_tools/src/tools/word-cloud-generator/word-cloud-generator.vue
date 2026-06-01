<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import {
  NButton,
  NInput,
  NGrid,
  NGi,
  NSelect,
  NIcon,
  NTabPane,
  NTabs,
  NTooltip,
  NRadioGroup,
  NRadio,
  NSlider,
  NSwitch,
  NScrollbar,
  NTag,
  NEmpty,
  NColorPicker,
} from 'naive-ui';
import { Cloud, Copy, Refresh, Download, Settings, Palette, FileText } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '词云生成器',
    subtitle: '从文本生成可视化词云，直观展示关键词频率，支持中英文分词、多种配色、导出PNG',
    // Tabs
    inputTab: '输入文本',
    settingsTab: '样式设置',
    // Input
    inputPlaceholder: '请输入或粘贴文本内容...\n支持中文和英文文本\n\n例如：人工智能技术正在改变世界 人工智能 机器学习 深度学习 自然语言处理 计算机视觉 强化学习 神经网络 大数据 云计算 物联网 区块链 元宇宙 虚拟现实 增强现实 数字化转型 智能制造 自动驾驶 智慧城市 数字经济 量子计算 边缘计算 数据科学 算法 开源 编程 Python JavaScript 前端 后端 全栈 微服务 容器 DevOps',
    sampleBtn: '示例文本',
    sampleTech: '科技热词',
    sampleEssay: '论文摘要',
    sampleResume: '岗位职责',
    clearBtn: '清空',
    generateBtn: '生成词云',
    regenBtn: '重新生成',
    // Stats
    statsTitle: '文本统计',
    totalChars: '总字符数',
    totalWords: '总词数',
    uniqueWords: '独立词数',
    topWords: '高频词 TOP',
    // Settings
    layoutTitle: '布局设置',
    maxWordsLabel: '最大词数',
    minFontLabel: '最小字号',
    maxFontLabel: '最大字号',
    fontFamilyLabel: '字体',
    shapeLabel: '形状',
    shapeCircle: '圆形',
    shapeRect: '矩形',
    shapeDiamond: '菱形',
    shapeHeart: '心形',
    rotationLabel: '文字旋转',
    rotationNone: '不旋转',
    rotationSmall: '轻微旋转',
    rotationMixed: '混合旋转',
    // Color
    colorTitle: '配色方案',
    colorSunset: '日落',
    colorOcean: '海洋',
    colorForest: '森林',
    colorCandy: '糖果',
    colorNeon: '霓虹',
    colorMono: '黑白',
    colorVintage: '复古',
    colorRainbow: '彩虹',
    colorCustom: '自定义',
    customColorsLabel: '自定义颜色',
    addColorBtn: '添加颜色',
    // Stop words
    stopWordsLabel: '过滤停用词',
    stopWordsOn: '开启',
    stopWordsOff: '关闭',
    // Result
    resultTitle: '词云预览',
    noResult: '输入文本并点击"生成词云"查看效果',
    downloadBtn: '导出 PNG',
    downloadHdBtn: '导出高清 PNG',
    copyBtn: '复制到剪贴板',
    // Actions
    copied: '已复制！',
    reset: '重置',
    // Word list
    wordListTitle: '词频排行',
    rank: '排名',
    word: '词语',
    count: '频次',
  },
  en: {
    title: 'Word Cloud Generator',
    subtitle: 'Generate visual word clouds from text, showing keyword frequency at a glance. Supports Chinese/English, multiple color schemes, PNG export',
    // Tabs
    inputTab: 'Input Text',
    settingsTab: 'Style Settings',
    // Input
    inputPlaceholder: 'Enter or paste text here...\nSupports Chinese and English\n\nExample: Artificial intelligence is transforming the world AI machine learning deep learning natural language processing computer vision reinforcement learning neural network big data cloud computing IoT blockchain metaverse VR AR digital transformation smart manufacturing autonomous driving smart city digital economy quantum computing edge computing data science algorithm open source programming Python JavaScript frontend backend fullstack microservices container DevOps',
    sampleBtn: 'Sample',
    sampleTech: 'Tech Buzz',
    sampleEssay: 'Paper Abstract',
    sampleResume: 'Job Description',
    clearBtn: 'Clear',
    generateBtn: 'Generate Cloud',
    regenBtn: 'Regenerate',
    // Stats
    statsTitle: 'Text Stats',
    totalChars: 'Total Chars',
    totalWords: 'Total Words',
    uniqueWords: 'Unique Words',
    topWords: 'Top Words',
    // Settings
    layoutTitle: 'Layout Settings',
    maxWordsLabel: 'Max Words',
    minFontLabel: 'Min Font Size',
    maxFontLabel: 'Max Font Size',
    fontFamilyLabel: 'Font Family',
    shapeLabel: 'Shape',
    shapeCircle: 'Circle',
    shapeRect: 'Rectangle',
    shapeDiamond: 'Diamond',
    shapeHeart: 'Heart',
    rotationLabel: 'Text Rotation',
    rotationNone: 'No Rotation',
    rotationSmall: 'Slight Rotation',
    rotationMixed: 'Mixed Rotation',
    // Color
    colorTitle: 'Color Scheme',
    colorSunset: 'Sunset',
    colorOcean: 'Ocean',
    colorForest: 'Forest',
    colorCandy: 'Candy',
    colorNeon: 'Neon',
    colorMono: 'Mono',
    colorVintage: 'Vintage',
    colorRainbow: 'Rainbow',
    colorCustom: 'Custom',
    customColorsLabel: 'Custom Colors',
    addColorBtn: 'Add Color',
    // Stop words
    stopWordsLabel: 'Filter Stop Words',
    stopWordsOn: 'On',
    stopWordsOff: 'Off',
    // Result
    resultTitle: 'Word Cloud Preview',
    noResult: 'Enter text and click "Generate Cloud" to see the result',
    downloadBtn: 'Export PNG',
    downloadHdBtn: 'Export HD PNG',
    copyBtn: 'Copy to Clipboard',
    // Actions
    copied: 'Copied!',
    reset: 'Reset',
    // Word list
    wordListTitle: 'Word Frequency',
    rank: 'Rank',
    word: 'Word',
    count: 'Count',
  },
};

const lang = useStorage<'zh' | 'en'>('word-cloud-generator-lang', 'zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Sample Texts =====================
const sampleTexts: Record<string, Record<string, string>> = {
  zh: {
    tech: '人工智能 人工智能 人工智能 机器学习 机器学习 深度学习 深度学习 深度学习 自然语言处理 自然语言处理 计算机视觉 计算机视觉 计算机视觉 强化学习 神经网络 神经网络 神经网络 大数据 大数据 大数据 云计算 云计算 物联网 物联网 区块链 区块链 元宇宙 虚拟现实 增强现实 数字化转型 数字化转型 数字化转型 智能制造 自动驾驶 自动驾驶 智慧城市 智慧城市 数字经济 量子计算 边缘计算 数据科学 数据科学 算法 算法 算法 开源 开源 编程 编程 编程 Python Python Python JavaScript JavaScript 前端 前端 后端 后端 全栈 微服务 容器 DevOps DevOps API API 数据库 数据库 安全 安全 隐私 芯片 芯片 GPU GPU 模型 训练 推理 部署 优化 分布式 并发 高可用 低延迟 实时 批处理 流计算 知识图谱 图数据库 向量检索 RAG Agent 多模态 多模态 大语言模型 大语言模型 大语言模型 提示工程 微调 预训练 自监督 对比学习 扩散模型 生成式AI 生成式AI 生成式AI AIGC AIGC AIGC 智能体 智能体',
    essay: '摘要 研究目的 方法论 数据分析 实验设计 实验设计 文献综述 文献综述 文献综述 理论框架 理论框架 假设检验 统计分析 统计分析 显著性 相关性 样本 变量 变量 控制组 实验组 测量 信度 效度 效度 定量研究 定量研究 定性研究 定性研究 混合方法 抽样 问卷 访谈 观察法 案例研究 元分析 系统综述 效果量 置信区间 P值 回归分析 方差分析 因子分析 聚类分析 结构方程 纵向研究 横截面 交叉验证 正则化 泛化 过拟合 欠拟合 特征选择 降维 可视化 可视化 研究局限 未来工作 结论 结论 结论 学术贡献 实践意义 创新点 创新点',
    resume: '负责 负责 负责 协调 协调 沟通 沟通 沟通 团队管理 团队管理 项目管理 项目管理 项目管理 需求分析 需求分析 系统设计 系统设计 架构设计 代码评审 代码评审 技术方案 技术方案 技术方案 性能优化 性能优化 数据建模 接口设计 接口设计 单元测试 集成测试 部署上线 监控告警 故障排查 故障排查 文档编写 代码规范 版本控制 敏捷开发 敏捷开发 迭代交付 持续集成 持续集成 持续部署 自动化测试 代码审查 技术分享 跨部门协作 业务理解 产品思维 创新能力 解决问题 解决问题 领导力 领导力 学习能力 学习能力 责任心 执行力 目标导向 团队合作 技术视野 规范化 流程优化 质量保障 风险控制 客户需求 用户体验 数据驱动 成本优化',
  },
  en: {
    tech: 'artificial intelligence artificial intelligence artificial intelligence machine learning machine learning deep learning deep learning deep learning natural language processing natural language processing computer vision computer vision computer vision reinforcement learning neural network neural network neural network big data big data big data cloud computing cloud computing internet of things internet of things blockchain blockchain metaverse virtual reality augmented reality digital transformation digital transformation digital transformation smart manufacturing autonomous driving autonomous driving smart city smart city digital economy quantum computing edge computing data science data science algorithm algorithm algorithm open source open source programming programming programming Python Python Python JavaScript JavaScript frontend frontend backend backend fullstack microservices container DevOps DevOps API API database database security security privacy chip chip GPU GPU model training inference deployment optimization distributed concurrent high availability low latency real-time batch processing stream computing knowledge graph graph database vector search RAG agent multimodal multimodal large language model large language model large language model prompt engineering fine-tuning pre-training self-supervised contrastive learning diffusion model generative AI generative AI generative AI AIGC AIGC AIGC intelligent agent intelligent agent',
    essay: 'abstract research purpose methodology data analysis experimental design experimental design literature review literature review literature review theoretical framework theoretical framework hypothesis testing statistical analysis statistical analysis significance correlation sample variable variable control group experimental group measurement reliability validity validity quantitative research quantitative research qualitative research qualitative research mixed methods sampling questionnaire interview observation case study meta-analysis systematic review effect size confidence interval P-value regression analysis ANOVA factor analysis cluster analysis structural equation longitudinal study cross-sectional cross-validation regularization generalization overfitting underfitting feature selection dimensionality reduction visualization visualization research limitations future work conclusion conclusion conclusion academic contribution practical implications innovation innovation',
    resume: 'responsible responsible responsible coordinate coordinate communicate communicate communicate team management team management project management project management project management requirements analysis requirements analysis system design system design architecture design code review code review technical solution technical solution technical solution performance optimization performance optimization data modeling API design API design unit testing integration testing deployment monitoring troubleshooting troubleshooting documentation coding standards version control agile development agile development iterative delivery continuous integration continuous integration continuous deployment automated testing code review technical sharing cross-functional collaboration business understanding product thinking innovation problem solving problem solving leadership leadership learning ability learning ability responsibility execution goal-oriented teamwork technical vision standardization process optimization quality assurance risk management customer needs user experience data-driven cost optimization',
  },
};

// ===================== Stop Words =====================
const stopWordsZh = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '们', '那', '些', '什么', '怎么', '如何', '吗',
  '呢', '吧', '啊', '呀', '哦', '嗯', '哈', '哪', '谁', '多', '少', '可以', '能',
  '把', '被', '从', '对', '向', '与', '为', '以', '及', '等', '或', '但', '而',
  '所', '其', '之', '中', '里', '外', '前', '后', '时', '年', '月', '日',
  '个', '只', '还', '又', '更', '最', '已', '将', '正', '于', '给', '让',
  '比', '因', '所以', '如果', '虽然', '不过', '然而', '因此', '这个', '那个',
  '这些', '那些', '一个', '一些', '一种', '一样', '这样', '那样',
]);

const stopWordsEn = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
  'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being',
  'has', 'had', 'did', 'does', 'am', 'it\'s', 'i\'m', 'don\'t', 'won\'t',
  'that\'s', 'there\'s', 'very', 'really', 'too', 'much', 'more', 'own',
]);

// ===================== Color Schemes =====================
const colorSchemes: Record<string, string[]> = {
  sunset: ['#FF6B6B', '#FF8E53', '#FFC857', '#E85D75', '#FF9A76', '#FFCC5C', '#FF6F61', '#D4545A'],
  ocean: ['#0D7377', '#14A3C7', '#32C5D2', '#7ED8E8', '#1B8A8A', '#2BAAAD', '#5BC8AF', '#3CAEA3'],
  forest: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#1B4332', '#B7E4C7', '#D8F3DC'],
  candy: ['#FF6B9D', '#C44569', '#FF9FF3', '#F368E0', '#FF6348', '#FF7979', '#FFA3B5', '#E056A0'],
  neon: ['#00FF87', '#60EFFF', '#FF00FF', '#FFE600', '#00FF40', '#FF0099', '#00FFFF', '#FF6600'],
  mono: ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#2C2C54', '#474787', '#706FD3', '#40407A'],
  vintage: ['#D4A574', '#C08552', '#8B6F47', '#E6C9A8', '#A67B5B', '#BF9B7A', '#D4A373', '#E9C46A'],
  rainbow: ['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#0088FF', '#8800FF', '#FF00FF', '#FF3388'],
};

// ===================== State =====================
const inputText = ref('');
const activeTab = ref('input');
const maxWords = ref(80);
const minFontSize = ref(14);
const maxFontSize = ref(72);
const fontFamily = ref('sans-serif');
const cloudShape = ref<'circle' | 'rect' | 'diamond' | 'heart'>('circle');
const rotationMode = ref<'none' | 'slight' | 'mixed'>('slight');
const colorSchemeKey = ref('sunset');
const customColors = ref<string[]>(['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE']);
const filterStopWords = ref(true);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isGenerating = ref(false);
const isGenerated = ref(false);
const wordFrequencyList = ref<{ word: string; count: number }[]>([]);

// ===================== Computed =====================
const currentColors = computed(() => {
  if (colorSchemeKey.value === 'custom') return customColors.value;
  return colorSchemes[colorSchemeKey.value] || colorSchemes.sunset;
});

const totalChars = computed(() => inputText.value.length);
const totalWords = computed(() => wordFrequencyList.value.reduce((sum, w) => sum + w.count, 0));
const uniqueWords = computed(() => wordFrequencyList.value.length);

const fontOptions = computed(() => [
  { label: lang.value === 'zh' ? '默认无衬线' : 'Sans Serif', value: 'sans-serif' },
  { label: lang.value === 'zh' ? '默认衬线' : 'Serif', value: 'serif' },
  { label: lang.value === 'zh' ? '等宽字体' : 'Monospace', value: 'monospace' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
]);

const colorOptions = computed(() => [
  { label: t('colorSunset').value, value: 'sunset' },
  { label: t('colorOcean').value, value: 'ocean' },
  { label: t('colorForest').value, value: 'forest' },
  { label: t('colorCandy').value, value: 'candy' },
  { label: t('colorNeon').value, value: 'neon' },
  { label: t('colorMono').value, value: 'mono' },
  { label: t('colorVintage').value, value: 'vintage' },
  { label: t('colorRainbow').value, value: 'rainbow' },
  { label: t('colorCustom').value, value: 'custom' },
]);

const shapeOptions = computed(() => [
  { label: t('shapeCircle').value, value: 'circle' },
  { label: t('shapeRect').value, value: 'rect' },
  { label: t('shapeDiamond').value, value: 'diamond' },
  { label: t('shapeHeart').value, value: 'heart' },
]);

const rotationOptions = computed(() => [
  { label: t('rotationNone').value, value: 'none' },
  { label: t('rotationSmall').value, value: 'slight' },
  { label: t('rotationMixed').value, value: 'mixed' },
]);

const topWords = computed(() => wordFrequencyList.value.slice(0, 10));

// ===================== Word Frequency Analysis =====================
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  // Check if text has significant Chinese characters
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  const hasChinese = chineseChars && chineseChars.length > text.length * 0.1;

  if (hasChinese) {
    // Chinese text: split by spaces/punctuation, and also extract 2-4 char Chinese segments
    // First, split by whitespace
    const parts = text.split(/[\s,，。！？；：、""''（）【】《》\n\r\t]+/);
    for (const part of parts) {
      if (!part) continue;
      // If segment is pure Chinese, try to split into meaningful 2-char words
      if (/^[\u4e00-\u9fff]+$/.test(part)) {
        if (part.length <= 4) {
          tokens.push(part);
        } else {
          // Simple bigram splitting for longer Chinese text
          for (let i = 0; i < part.length - 1; i++) {
            tokens.push(part.substring(i, i + 2));
          }
        }
      } else {
        tokens.push(part);
      }
    }
  } else {
    // English / other: split by whitespace and punctuation
    const words = text.toLowerCase().split(/[\s,.\-;:!?"'()\[\]{}<>\/\\@#$%^&*+=|~`\n\r\t]+/);
    for (const word of words) {
      if (word.length >= 2) {
        tokens.push(word);
      }
    }
  }

  return tokens;
}

function analyzeFrequency(text: string): { word: string; count: number }[] {
  const tokens = tokenize(text);
  const freq: Record<string, number> = {};

  for (const token of tokens) {
    const lower = token.toLowerCase().trim();
    if (!lower || lower.length < 1) continue;

    // Filter stop words
    if (filterStopWords.value) {
      if (stopWordsZh.has(lower) || stopWordsEn.has(lower)) continue;
    }

    // Filter pure numbers and very short tokens
    if (/^\d+$/.test(lower)) continue;

    freq[lower] = (freq[lower] || 0) + 1;
  }

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxWords.value * 2); // Get more than needed, then trim after rendering
}

// ===================== Shape Constraint =====================
function isInShape(x: number, y: number, cx: number, cy: number, maxR: number, shape: string): boolean {
  const dx = x - cx;
  const dy = y - cy;
  const normX = dx / maxR;
  const normY = dy / maxR;

  switch (shape) {
    case 'circle':
      return normX * normX + normY * normY <= 1;
    case 'rect':
      return Math.abs(normX) <= 0.85 && Math.abs(normY) <= 0.85;
    case 'diamond':
      return Math.abs(normX) + Math.abs(normY) <= 1;
    case 'heart': {
      // Heart equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
      const hx = normX * 1.2;
      const hy = -normY * 1.0 + 0.3;
      const val = (hx * hx + hy * hy - 1) ** 3 - hx * hx * hy * hy * hy;
      return val <= 0;
    }
    default:
      return true;
  }
}

// ===================== Spiral Placement Algorithm =====================
interface PlacedWord {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
  color: string;
  width: number;
  height: number;
}

function getRotation(): number {
  switch (rotationMode.value) {
    case 'none': return 0;
    case 'slight': return (Math.random() - 0.5) * 0.15; // ±4 degrees
    case 'mixed': {
      const r = Math.random();
      if (r < 0.4) return 0;
      if (r < 0.7) return (Math.random() - 0.5) * 0.2;
      return Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    }
    default: return 0;
  }
}

function getTextDimensions(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  rotation: number,
): { width: number; height: number } {
  ctx.font = `bold ${fontSize}px ${fontFamily.value}`;
  const metrics = ctx.measureText(text);
  const w = metrics.width;
  const h = fontSize * 1.2;
  // If rotated 90 degrees, swap
  if (Math.abs(Math.abs(rotation) - Math.PI / 2) < 0.1) {
    return { width: h, height: w };
  }
  return { width: w + fontSize * 0.3, height: h };
}

function rectsOverlap(
  a: PlacedWord,
  b: PlacedWord,
  padding: number = 4,
): boolean {
  const ax1 = a.x - a.width / 2 - padding;
  const ax2 = a.x + a.width / 2 + padding;
  const ay1 = a.y - a.height / 2 - padding;
  const ay2 = a.y + a.height / 2 + padding;

  const bx1 = b.x - b.width / 2 - padding;
  const bx2 = b.x + b.width / 2 + padding;
  const by1 = b.y - b.height / 2 - padding;
  const by2 = b.y + b.height / 2 + padding;

  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

function placeWords(
  words: { word: string; count: number }[],
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
): PlacedWord[] {
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const maxR = Math.min(canvasW, canvasH) / 2 * 0.9;
  const placed: PlacedWord[] = [];

  if (words.length === 0) return placed;

  const maxCount = words[0].count;
  const minCount = words[words.length - 1].count;
  const countRange = maxCount - minCount || 1;
  const colors = currentColors.value;

  for (let i = 0; i < Math.min(words.length, maxWords.value); i++) {
    const { word, count } = words[i];
    // Map count to font size
    const ratio = (count - minCount) / countRange;
    const fontSize = Math.round(minFontSize.value + ratio * (maxFontSize.value - minFontSize.value));
    const rotation = getRotation();
    const { width, height } = getTextDimensions(ctx, word, fontSize, rotation);
    const color = colors[i % colors.length];

    // Spiral placement: start from center, move outward
    let placedOk = false;
    const spiralStep = 2;
    const angleStep = 0.3;
    let angle = Math.random() * Math.PI * 2;
    let radius = 0;
    const maxAttempts = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      // Check shape boundary
      if (!isInShape(x, y, cx, cy, maxR, cloudShape.value)) {
        angle += angleStep;
        radius += spiralStep * angleStep / (2 * Math.PI);
        continue;
      }

      const candidate: PlacedWord = { text: word, x, y, fontSize, rotation, color, width, height };

      // Check overlap with placed words
      let overlapping = false;
      for (const pw of placed) {
        if (rectsOverlap(candidate, pw)) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        placed.push(candidate);
        placedOk = true;
        break;
      }

      angle += angleStep;
      radius += spiralStep * angleStep / (2 * Math.PI);
    }
  }

  return placed;
}

function renderWords(ctx: CanvasRenderingContext2D, placed: PlacedWord[], bg: string) {
  const canvas = ctx.canvas;
  // Draw background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const pw of placed) {
    ctx.save();
    ctx.translate(pw.x, pw.y);
    ctx.rotate(pw.rotation);
    ctx.font = `bold ${pw.fontSize}px ${fontFamily.value}`;
    ctx.fillStyle = pw.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pw.text, 0, 0);
    ctx.restore();
  }
}

// ===================== Generate =====================
const bgColor = ref('#1a1a2e');

async function generate() {
  if (!inputText.value.trim()) return;
  isGenerating.value = true;

  await nextTick();

  const freq = analyzeFrequency(inputText.value);
  wordFrequencyList.value = freq;

  if (freq.length === 0) {
    isGenerating.value = false;
    return;
  }

  const canvas = canvasRef.value;
  if (!canvas) {
    isGenerating.value = false;
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const displayW = canvas.clientWidth;
  const displayH = canvas.clientHeight;
  canvas.width = displayW * dpr;
  canvas.height = displayH * dpr;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const placed = placeWords(freq, ctx, displayW, displayH);
  renderWords(ctx, placed, bgColor.value);

  isGenerated.value = true;
  isGenerating.value = false;
}

// ===================== Export =====================
function downloadPNG(hd = false) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  if (hd) {
    // Render at 2x for HD
    const tmpCanvas = document.createElement('canvas');
    const scale = 2;
    tmpCanvas.width = canvas.clientWidth * scale;
    tmpCanvas.height = canvas.clientHeight * scale;
    const ctx = tmpCanvas.getContext('2d')!;
    ctx.scale(scale, scale);

    const placed = placeWords(wordFrequencyList.value, ctx, canvas.clientWidth, canvas.clientHeight);
    renderWords(ctx, placed, bgColor.value);

    const link = document.createElement('a');
    link.download = `wordcloud-hd-${Date.now()}.png`;
    link.href = tmpCanvas.toDataURL('image/png');
    link.click();
  } else {
    const link = document.createElement('a');
    link.download = `wordcloud-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

async function copyToClipboard() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  try {
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    copiedFlag.value = true;
    setTimeout(() => { copiedFlag.value = false; }, 1500);
  } catch {
    // Fallback: copy data URL
    try {
      await navigator.clipboard.writeText(canvas.toDataURL('image/png'));
      copiedFlag.value = true;
      setTimeout(() => { copiedFlag.value = false; }, 1500);
    } catch {
      // ignore
    }
  }
}

const copiedFlag = ref(false);

function resetAll() {
  inputText.value = '';
  wordFrequencyList.value = [];
  isGenerated.value = false;
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function loadSample(key: string) {
  inputText.value = sampleTexts[lang.value]?.[key] || sampleTexts.zh[key] || '';
}

function removeCustomColor(index: number) {
  if (customColors.value.length > 2) {
    customColors.value.splice(index, 1);
  }
}

function addCustomColor() {
  const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  customColors.value.push(randomColor);
}

// Auto re-generate on settings change
watch([colorSchemeKey, cloudShape, rotationMode, maxWords, minFontSize, maxFontSize, fontFamily], () => {
  if (isGenerated.value && inputText.value.trim()) {
    generate();
  }
});
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 16px;">
    <!-- Header -->
    <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <NIcon size="26" color="#60EFFF"><Cloud /></NIcon>
          {{ t('title').value }}
        </h2>
        <p style="margin: 4px 0 0; color: #999; font-size: 13px;">{{ t('subtitle').value }}</p>
      </div>
      <div style="display: flex; gap: 6px;">
        <NButton size="small" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
          {{ lang === 'zh' ? 'EN' : '中' }}
        </NButton>
        <NButton size="small" quaternary type="error" @click="resetAll">
          <template #icon><NIcon><Refresh /></NIcon></template>
          {{ t('reset').value }}
        </NButton>
      </div>
    </div>

    <!-- Main Layout -->
    <NGrid :cols="24" :x-gap="16">
      <!-- Left Panel: Input + Settings -->
      <NGi :span="10">
        <NTabs v-model:value="activeTab" type="line" animated>
          <!-- Input Tab -->
          <NTabPane name="input" :tab="t('inputTab').value">
            <div style="margin-bottom: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
              <NButton size="small" @click="loadSample('tech')">
                <template #icon><NIcon><FileText /></NIcon></template>
                {{ t('sampleTech').value }}
              </NButton>
              <NButton size="small" @click="loadSample('essay')">
                {{ t('sampleEssay').value }}
              </NButton>
              <NButton size="small" @click="loadSample('resume')">
                {{ t('sampleResume').value }}
              </NButton>
              <NButton size="small" quaternary type="warning" @click="inputText = ''">
                {{ t('clearBtn').value }}
              </NButton>
            </div>

            <NInput
              v-model:value="inputText"
              type="textarea"
              :placeholder="t('inputPlaceholder').value"
              :rows="10"
              style="font-size: 13px;"
            />

            <!-- Stats -->
            <div v-if="inputText.trim()" style="margin-top: 12px; padding: 12px; background: rgba(255,255,255,0.04); border-radius: 8px;">
              <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">📊 {{ t('statsTitle').value }}</div>
              <div style="display: flex; gap: 16px; font-size: 12px; color: #aaa; margin-bottom: 8px;">
                <span>{{ t('totalChars').value }}: <b style="color: #fff;">{{ totalChars }}</b></span>
                <span>{{ t('totalWords').value }}: <b style="color: #fff;">{{ totalWords || '-' }}</b></span>
                <span>{{ t('uniqueWords').value }}: <b style="color: #fff;">{{ uniqueWords || '-' }}</b></span>
              </div>
              <div v-if="topWords.length" style="display: flex; flex-wrap: wrap; gap: 4px;">
                <span style="font-size: 11px; color: #888; margin-right: 4px;">{{ t('topWords').value }}:</span>
                <NTag v-for="(w, i) in topWords.slice(0, 8)" :key="i" size="small" :bordered="false"
                  :style="{ background: currentColors[i % currentColors.length] + '30', color: currentColors[i % currentColors.length] }">
                  {{ w.word }} ({{ w.count }})
                </NTag>
              </div>
            </div>

            <NButton type="primary" block strong style="margin-top: 12px;" :loading="isGenerating" @click="generate">
              <template #icon><NIcon><Cloud /></NIcon></template>
              {{ isGenerated ? t('regenBtn').value : t('generateBtn').value }}
            </NButton>
          </NTabPane>

          <!-- Settings Tab -->
          <NTabPane name="settings" :tab="t('settingsTab').value">
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <!-- Layout Settings -->
              <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                  <NIcon size="16" style="vertical-align: middle; margin-right: 4px;"><Settings /></NIcon>
                  {{ t('layoutTitle').value }}
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">{{ t('maxWordsLabel').value }}: {{ maxWords }}</div>
                  <NSlider v-model:value="maxWords" :min="20" :max="200" :step="10" />
                </div>

                <div style="display: flex; gap: 12px; margin-bottom: 10px;">
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">{{ t('minFontLabel').value }}: {{ minFontSize }}px</div>
                    <NSlider v-model:value="minFontSize" :min="10" :max="30" :step="1" />
                  </div>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">{{ t('maxFontLabel').value }}: {{ maxFontSize }}px</div>
                    <NSlider v-model:value="maxFontSize" :min="36" :max="120" :step="2" />
                  </div>
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">{{ t('fontFamilyLabel').value }}</div>
                  <NSelect v-model:value="fontFamily" :options="fontOptions" size="small" />
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">{{ t('shapeLabel').value }}</div>
                  <NRadioGroup v-model:value="cloudShape" size="small">
                    <NRadio v-for="opt in shapeOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </NRadio>
                  </NRadioGroup>
                </div>

                <div style="margin-bottom: 10px;">
                  <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">{{ t('rotationLabel').value }}</div>
                  <NRadioGroup v-model:value="rotationMode" size="small">
                    <NRadio v-for="opt in rotationOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </NRadio>
                  </NRadioGroup>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 12px; color: #aaa;">{{ t('stopWordsLabel').value }}</span>
                  <NSwitch v-model:value="filterStopWords" size="small">
                    <template #checked>{{ t('stopWordsOn').value }}</template>
                    <template #unchecked>{{ t('stopWordsOff').value }}</template>
                  </NSwitch>
                </div>
              </div>

              <!-- Color Settings -->
              <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                  <NIcon size="16" style="vertical-align: middle; margin-right: 4px;"><Palette /></NIcon>
                  {{ t('colorTitle').value }}
                </div>

                <NRadioGroup v-model:value="colorSchemeKey" size="small">
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    <NRadio v-for="opt in colorOptions" :key="opt.value" :value="opt.value">
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <span
                          v-if="opt.value !== 'custom'"
                          :style="{
                            display: 'inline-block',
                            width: '32px',
                            height: '12px',
                            borderRadius: '3px',
                            background: `linear-gradient(90deg, ${colorSchemes[opt.value]?.slice(0, 4).join(', ')})`,
                          }"
                        />
                        <span>{{ opt.label }}</span>
                      </div>
                    </NRadio>
                  </div>
                </NRadioGroup>

                <!-- Custom Colors -->
                <div v-if="colorSchemeKey === 'custom'" style="margin-top: 10px;">
                  <div style="font-size: 12px; color: #aaa; margin-bottom: 6px;">{{ t('customColorsLabel').value }}</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    <div v-for="(c, i) in customColors" :key="i" style="position: relative;">
                      <NColorPicker v-model:value="customColors[i]" size="small" :modes="['hex']" :show-alpha="false" />
                      <NButton v-if="customColors.length > 2" size="tiny" quaternary circle
                        style="position: absolute; top: -6px; right: -6px; min-width: 16px; height: 16px; padding: 0; font-size: 10px; z-index: 1;"
                        @click="removeCustomColor(i)">×</NButton>
                    </div>
                    <NButton size="small" dashed @click="addCustomColor">+ {{ t('addColorBtn').value }}</NButton>
                  </div>
                </div>
              </div>

              <!-- Background Color -->
              <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 12px; color: #aaa;">Background</span>
                  <NColorPicker v-model:value="bgColor" size="small" :modes="['hex']" :show-alpha="false"
                    :swatches="['#1a1a2e', '#0d1117', '#ffffff', '#f5f5f5', '#1e1e1e', '#0a192f', '#fafafa', '#2d2d2d']"
                    @update:value="() => isGenerated && generate()" />
                </div>
              </div>
            </div>
          </NTabPane>
        </NTabs>
      </NGi>

      <!-- Right Panel: Canvas + Word List -->
      <NGi :span="14">
        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden;">
          <div style="padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="font-size: 13px; font-weight: 600;">☁️ {{ t('resultTitle').value }}</span>
            <div v-if="isGenerated" style="display: flex; gap: 6px;">
              <NButton size="tiny" @click="copyToClipboard" :type="copiedFlag ? 'success' : 'default'">
                <template #icon><NIcon><Copy /></NIcon></template>
                {{ copiedFlag ? t('copied').value : t('copyBtn').value }}
              </NButton>
              <NButton size="tiny" @click="downloadPNG(false)">
                <template #icon><NIcon><Download /></NIcon></template>
                {{ t('downloadBtn').value }}
              </NButton>
              <NButton size="tiny" @click="downloadPNG(true)">
                {{ t('downloadHdBtn').value }}
              </NButton>
            </div>
          </div>

          <div style="position: relative; width: 100%; aspect-ratio: 4/3; background: #111; display: flex; align-items: center; justify-content: center;">
            <canvas ref="canvasRef" style="width: 100%; height: 100%; display: block;" />
            <div v-if="!isGenerated && !isGenerating" style="position: absolute; text-align: center; color: #555;">
              <NIcon size="48"><Cloud /></NIcon>
              <p style="margin: 8px 0 0; font-size: 13px;">{{ t('noResult').value }}</p>
            </div>
            <div v-if="isGenerating" style="position: absolute; text-align: center; color: #aaa;">
              <div class="spin-icon" style="font-size: 36px;">☁️</div>
              <p style="margin: 8px 0 0; font-size: 13px;">{{ lang === 'zh' ? '生成中...' : 'Generating...' }}</p>
            </div>
          </div>
        </div>

        <!-- Word Frequency List -->
        <div v-if="wordFrequencyList.length > 0" style="margin-top: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden;">
          <div style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <span style="font-size: 13px; font-weight: 600;">📊 {{ t('wordListTitle').value }}</span>
          </div>
          <NScrollbar style="max-height: 240px;">
            <div style="padding: 8px 14px;">
              <div style="display: grid; grid-template-columns: 40px 1fr 60px; gap: 4px; font-size: 11px; color: #666; margin-bottom: 4px;">
                <span>{{ t('rank').value }}</span>
                <span>{{ t('word').value }}</span>
                <span style="text-align: right;">{{ t('count').value }}</span>
              </div>
              <div
                v-for="(item, i) in wordFrequencyList.slice(0, 30)"
                :key="i"
                style="display: grid; grid-template-columns: 40px 1fr 60px; gap: 4px; align-items: center; padding: 3px 0; font-size: 12px;"
              >
                <span style="color: #666;">{{ i + 1 }}</span>
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span
                    :style="{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: currentColors[i % currentColors.length],
                    }"
                  />
                  {{ item.word }}
                </span>
                <div style="text-align: right;">
                  <div
                    :style="{
                      display: 'inline-block',
                      height: '6px',
                      borderRadius: '3px',
                      background: currentColors[i % currentColors.length] + '60',
                      width: Math.min(item.count / wordFrequencyList[0].count * 50, 50) + 'px',
                      marginRight: '4px',
                      verticalAlign: 'middle',
                    }"
                  />
                  <span style="color: #aaa;">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </NScrollbar>
        </div>
      </NGi>
    </NGrid>
  </div>
</template>

<style scoped>
.spin-icon {
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
