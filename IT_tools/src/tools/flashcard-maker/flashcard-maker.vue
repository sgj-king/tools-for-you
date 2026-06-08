<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref, watch, nextTick } from 'vue';
import {
  NButton, NInput, NGrid, NGi, NSelect, NIcon, NTabPane, NTabs,
  NTooltip, NRadioGroup, NRadio, NSlider, NSwitch, NScrollbar,
  NTag, NEmpty, NModal, NForm, NFormItem, NInputGroup, NPopconfirm,
  NProgress, NBadge, NDivider, NCollapse, NCollapseItem, NAlert,
} from 'naive-ui';
import {
  Book, Copy, Refresh, Download, Upload, Plus, Trash, Edit,
  ArrowLeft, ArrowRight, ArrowsShuffle as Shuffle, Eye, EyeOff, Settings, Search,
  Check, X, Star, RotateClockwise, SortAscending,
} from '@vicons/tabler';

// ===================== i18n =====================
const labels: Record<string, Record<string, string>> = {
  zh: {
    title: '闪卡制作器',
    subtitle: '制作和管理学习闪卡，支持翻转动画、分类分组、间隔重复复习、学习进度追踪',
    // Tabs
    studyTab: '学习',
    manageTab: '管理',
    statsTab: '统计',
    // Deck
    deckTitle: '卡组',
    newDeck: '新建卡组',
    deckName: '卡组名称',
    deckDesc: '描述',
    deleteDeck: '删除卡组',
    noDecks: '还没有卡组，点击"新建卡组"开始',
    // Card
    cardFront: '正面',
    cardBack: '背面',
    addCard: '添加闪卡',
    editCard: '编辑闪卡',
    deleteCard: '删除闪卡',
    noCards: '这个卡组还没有闪卡',
    frontPlaceholder: '输入正面内容（问题/单词/术语）',
    backPlaceholder: '输入背面内容（答案/释义/解释）',
    tagPlaceholder: '添加标签，逗号分隔',
    // Study
    startStudy: '开始学习',
    resumeStudy: '继续学习',
    studying: '学习中',
    cardProgress: '第 {0} / {1} 张',
    flipCard: '点击翻转',
    knowIt: '记住了 ✓',
    forgotIt: '再看看 ✗',
    studyComplete: '学习完成！',
    studyCompleteDesc: '本轮学习已结束，继续加油！',
    correct: '正确',
    incorrect: '需复习',
    remaining: '剩余',
    shuffleMode: '随机顺序',
    sequentialMode: '顺序学习',
    // Stats
    totalCards: '总卡片数',
    mastered: '已掌握',
    learning: '学习中',
    newCards: '未学习',
    todayStudied: '今日已学',
    streak: '连续天数',
    accuracy: '正确率',
    reviewHistory: '复习记录',
    noHistory: '暂无学习记录',
    // Import/Export
    importBtn: '导入',
    exportBtn: '导出',
    importTitle: '导入闪卡',
    importHint: '支持 JSON 格式，每张卡片包含 front、back 和可选的 tags 字段',
    importSuccess: '导入成功！添加了 {0} 张闪卡',
    importFail: '导入失败，请检查格式',
    exportFormat: '导出格式',
    exportJSON: 'JSON 文件',
    exportCSV: 'CSV 文件',
    exportSuccess: '导出成功！',
    // Actions
    copied: '已复制！',
    saved: '已保存',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    reset: '重置',
    search: '搜索卡片',
    allTags: '全部',
    // Quick Templates
    templates: '快捷模板',
    templateEnglish: '英语单词',
    templateMath: '数学公式',
    templateHistory: '历史知识',
    templateCode: '编程知识',
  },
  en: {
    title: 'Flashcard Maker',
    subtitle: 'Create and manage study flashcards with flip animation, categories, spaced repetition, and progress tracking',
    // Tabs
    studyTab: 'Study',
    manageTab: 'Manage',
    statsTab: 'Stats',
    // Deck
    deckTitle: 'Decks',
    newDeck: 'New Deck',
    deckName: 'Deck Name',
    deckDesc: 'Description',
    deleteDeck: 'Delete Deck',
    noDecks: 'No decks yet. Click "New Deck" to start',
    // Card
    cardFront: 'Front',
    cardBack: 'Back',
    addCard: 'Add Card',
    editCard: 'Edit Card',
    deleteCard: 'Delete Card',
    noCards: 'This deck has no cards yet',
    frontPlaceholder: 'Enter front content (question/word/term)',
    backPlaceholder: 'Enter back content (answer/definition/explanation)',
    tagPlaceholder: 'Add tags, comma separated',
    // Study
    startStudy: 'Start Study',
    resumeStudy: 'Resume',
    studying: 'Studying',
    cardProgress: 'Card {0} / {1}',
    flipCard: 'Click to flip',
    knowIt: 'Got it ✓',
    forgotIt: 'Review ✗',
    studyComplete: 'Study Complete!',
    studyCompleteDesc: 'Round finished, keep it up!',
    correct: 'Correct',
    incorrect: 'Review',
    remaining: 'Remaining',
    shuffleMode: 'Shuffle',
    sequentialMode: 'Sequential',
    // Stats
    totalCards: 'Total Cards',
    mastered: 'Mastered',
    learning: 'Learning',
    newCards: 'New',
    todayStudied: 'Studied Today',
    streak: 'Streak',
    accuracy: 'Accuracy',
    reviewHistory: 'Review History',
    noHistory: 'No study history yet',
    // Import/Export
    importBtn: 'Import',
    exportBtn: 'Export',
    importTitle: 'Import Flashcards',
    importHint: 'Supports JSON format. Each card contains front, back, and optional tags',
    importSuccess: 'Import successful! Added {0} cards',
    importFail: 'Import failed. Check format',
    exportFormat: 'Export Format',
    exportJSON: 'JSON File',
    exportCSV: 'CSV File',
    exportSuccess: 'Export successful!',
    // Actions
    copied: 'Copied!',
    saved: 'Saved',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    reset: 'Reset',
    search: 'Search cards',
    allTags: 'All',
    // Quick Templates
    templates: 'Templates',
    templateEnglish: 'English Vocab',
    templateMath: 'Math Formulas',
    templateHistory: 'History',
    templateCode: 'Programming',
  },
};

const lang = useStorage<'zh' | 'en'>('flashcard-maker-lang', 'zh');
const t = (key: string) => computed(() => labels[lang.value]?.[key] || labels.zh[key] || key);

// ===================== Types =====================
interface FlashCard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  level: 'new' | 'learning' | 'mastered';
  correctCount: number;
  incorrectCount: number;
  lastReviewed: number | null;
  createdAt: number;
}

interface Deck {
  id: string;
  name: string;
  description: string;
  cards: FlashCard[];
  createdAt: number;
}

interface StudyRecord {
  date: string;
  correct: number;
  incorrect: number;
  total: number;
}

// ===================== State =====================
const decks = useStorage<Deck[]>('flashcard-decks', []);
const activeDeckId = ref<string>('');
const activeTab = ref('study');
const searchQuery = ref('');
const filterTag = ref('');

// Study mode
const isStudying = ref(false);
const studyIndex = ref(0);
const isFlipped = ref(false);
const studyCorrect = ref(0);
const studyIncorrect = ref(0);
const studyOrder = ref<'sequential' | 'shuffle'>('sequential');
const studyCardIds = ref<string[]>([]);
const isStudyComplete = ref(false);

// Card editor modal
const showCardModal = ref(false);
const editingCardId = ref<string | null>(null);
const cardFront = ref('');
const cardBack = ref('');
const cardTags = ref('');

// Deck modal
const showDeckModal = ref(false);
const editingDeckId = ref<string | null>(null);
const deckNameInput = ref('');
const deckDescInput = ref('');

// Import modal
const showImportModal = ref(false);
const importText = ref('');

// Study records
const studyRecords = useStorage<StudyRecord[]>('flashcard-study-records', []);
const studyStreak = useStorage<number>('flashcard-study-streak', 0);
const lastStudyDate = useStorage<string>('flashcard-last-study-date', '');

// ===================== Helpers =====================
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ===================== Computed =====================
const activeDeck = computed(() => decks.value.find(d => d.id === activeDeckId.value) || null);

const allTags = computed(() => {
  if (!activeDeck.value) return [];
  const tags = new Set<string>();
  activeDeck.value.cards.forEach(c => c.tags.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
});

const filteredCards = computed(() => {
  if (!activeDeck.value) return [];
  let cards = activeDeck.value.cards;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    cards = cards.filter(c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q));
  }
  if (filterTag.value) {
    cards = cards.filter(c => c.tags.includes(filterTag.value));
  }
  return cards;
});

const deckStats = computed(() => {
  if (!activeDeck.value) return { total: 0, mastered: 0, learning: 0, newCount: 0 };
  const cards = activeDeck.value.cards;
  return {
    total: cards.length,
    mastered: cards.filter(c => c.level === 'mastered').length,
    learning: cards.filter(c => c.level === 'learning').length,
    newCount: cards.filter(c => c.level === 'new').length,
  };
});

const todayRecord = computed(() => studyRecords.value.find(r => r.date === getToday()));

const todayAccuracy = computed(() => {
  const rec = todayRecord.value;
  if (!rec || rec.total === 0) return 0;
  return Math.round((rec.correct / rec.total) * 100);
});

const currentStudyCard = computed(() => {
  if (!activeDeck.value || !isStudying.value) return null;
  const cardId = studyCardIds.value[studyIndex.value];
  return activeDeck.value.cards.find(c => c.id === cardId) || null;
});

const studyProgress = computed(() => {
  if (studyCardIds.value.length === 0) return 0;
  return Math.round(((studyIndex.value) / studyCardIds.value.length) * 100);
});

// ===================== Deck Operations =====================
function createDeck() {
  editingDeckId.value = null;
  deckNameInput.value = '';
  deckDescInput.value = '';
  showDeckModal.value = true;
}

function editDeck(deck: Deck) {
  editingDeckId.value = deck.id;
  deckNameInput.value = deck.name;
  deckDescInput.value = deck.description;
  showDeckModal.value = true;
}

function saveDeck() {
  const name = deckNameInput.value.trim();
  if (!name) return;

  if (editingDeckId.value) {
    const deck = decks.value.find(d => d.id === editingDeckId.value);
    if (deck) {
      deck.name = name;
      deck.description = deckDescInput.value.trim();
    }
  } else {
    const newDeck: Deck = {
      id: generateId(),
      name,
      description: deckDescInput.value.trim(),
      cards: [],
      createdAt: Date.now(),
    };
    decks.value.push(newDeck);
    activeDeckId.value = newDeck.id;
  }
  showDeckModal.value = false;
}

function deleteDeck(deckId: string) {
  const idx = decks.value.findIndex(d => d.id === deckId);
  if (idx >= 0) {
    decks.value.splice(idx, 1);
    if (activeDeckId.value === deckId) {
      activeDeckId.value = decks.value.length > 0 ? decks.value[0].id : '';
    }
  }
}

// ===================== Card Operations =====================
function openAddCard() {
  editingCardId.value = null;
  cardFront.value = '';
  cardBack.value = '';
  cardTags.value = '';
  showCardModal.value = true;
}

function openEditCard(card: FlashCard) {
  editingCardId.value = card.id;
  cardFront.value = card.front;
  cardBack.value = card.back;
  cardTags.value = card.tags.join(', ');
  showCardModal.value = true;
}

function saveCard() {
  if (!activeDeck.value) return;
  const front = cardFront.value.trim();
  const back = cardBack.value.trim();
  if (!front || !back) return;

  const tags = cardTags.value.split(/[,，]/).map(t => t.trim()).filter(Boolean);

  if (editingCardId.value) {
    const card = activeDeck.value.cards.find(c => c.id === editingCardId.value);
    if (card) {
      card.front = front;
      card.back = back;
      card.tags = tags;
    }
  } else {
    activeDeck.value.cards.push({
      id: generateId(),
      front,
      back,
      tags,
      level: 'new',
      correctCount: 0,
      incorrectCount: 0,
      lastReviewed: null,
      createdAt: Date.now(),
    });
  }
  showCardModal.value = false;
}

function deleteCard(cardId: string) {
  if (!activeDeck.value) return;
  const idx = activeDeck.value.cards.findIndex(c => c.id === cardId);
  if (idx >= 0) activeDeck.value.cards.splice(idx, 1);
}

// ===================== Study Mode =====================
function startStudy() {
  if (!activeDeck.value || activeDeck.value.cards.length === 0) return;

  const cards = filteredCards.value.length > 0 ? filteredCards.value : activeDeck.value.cards;
  let ids = cards.map(c => c.id);

  if (studyOrder.value === 'shuffle') {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }

  studyCardIds.value = ids;
  studyIndex.value = 0;
  studyCorrect.value = 0;
  studyIncorrect.value = 0;
  isFlipped.value = false;
  isStudyComplete.value = false;
  isStudying.value = true;
  activeTab.value = 'study';
}

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

function markCorrect() {
  if (!activeDeck.value || !currentStudyCard.value) return;
  const card = activeDeck.value.cards.find(c => c.id === currentStudyCard.value!.id);
  if (card) {
    card.correctCount++;
    card.lastReviewed = Date.now();
    if (card.correctCount >= 3 && card.level !== 'mastered') {
      card.level = 'mastered';
    } else if (card.level === 'new') {
      card.level = 'learning';
    }
  }
  studyCorrect.value++;
  nextCard();
}

function markIncorrect() {
  if (!activeDeck.value || !currentStudyCard.value) return;
  const card = activeDeck.value.cards.find(c => c.id === currentStudyCard.value!.id);
  if (card) {
    card.incorrectCount++;
    card.lastReviewed = Date.now();
    if (card.level === 'mastered') card.level = 'learning';
  }
  studyIncorrect.value++;
  nextCard();
}

function nextCard() {
  isFlipped.value = false;
  if (studyIndex.value < studyCardIds.value.length - 1) {
    studyIndex.value++;
  } else {
    endStudy();
  }
}

function endStudy() {
  isStudying.value = false;
  isStudyComplete.value = true;

  // Record study
  const today = getToday();
  const rec = studyRecords.value.find(r => r.date === today);
  if (rec) {
    rec.correct += studyCorrect.value;
    rec.incorrect += studyIncorrect.value;
    rec.total += studyCorrect.value + studyIncorrect.value;
  } else {
    studyRecords.value.push({
      date: today,
      correct: studyCorrect.value,
      incorrect: studyIncorrect.value,
      total: studyCorrect.value + studyIncorrect.value,
    });
  }

  // Update streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastStudyDate.value === yesterday) {
    studyStreak.value++;
  } else if (lastStudyDate.value !== today) {
    studyStreak.value = 1;
  }
  lastStudyDate.value = today;
}

// ===================== Import/Export =====================
function importCards() {
  showImportModal.value = true;
  importText.value = '';
}

function doImport() {
  if (!activeDeck.value) return;
  try {
    const data = JSON.parse(importText.value);
    const items = Array.isArray(data) ? data : data.cards || [];
    let count = 0;
    for (const item of items) {
      if (item.front && item.back) {
        activeDeck.value.cards.push({
          id: generateId(),
          front: String(item.front),
          back: String(item.back),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          level: 'new',
          correctCount: 0,
          incorrectCount: 0,
          lastReviewed: null,
          createdAt: Date.now(),
        });
        count++;
      }
    }
    showImportModal.value = false;
    window.$message?.success(
      (lang.value === 'zh' ? `导入成功！添加了 ${count} 张闪卡` : `Import successful! Added ${count} cards`),
    );
  } catch {
    window.$message?.error(lang.value === 'zh' ? '导入失败，请检查格式' : 'Import failed. Check format');
  }
}

function exportCards(format: 'json' | 'csv') {
  if (!activeDeck.value) return;
  const cards = activeDeck.value.cards;
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === 'json') {
    content = JSON.stringify({ deckName: activeDeck.value.name, cards: cards.map(c => ({ front: c.front, back: c.back, tags: c.tags })) }, null, 2);
    filename = `${activeDeck.value.name}.json`;
    mimeType = 'application/json';
  } else {
    const header = 'Front,Back,Tags\n';
    const rows = cards.map(c => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}","${c.tags.join('; ')}"`).join('\n');
    content = header + rows;
    filename = `${activeDeck.value.name}.csv`;
    mimeType = 'text/csv';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===================== Quick Templates =====================
const templateDecks: Record<string, { zh: Partial<Deck>; en: Partial<Deck> }> = {
  english: {
    zh: {
      name: '英语词汇',
      description: '常用英语单词与释义',
      cards: [
        { id: generateId(), front: 'Ephemeral', back: '短暂的，转瞬即逝的', tags: ['GRE', '形容词'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Ubiquitous', back: '无处不在的', tags: ['GRE', '形容词'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Pragmatic', back: '务实的，实用主义的', tags: ['GRE', '形容词'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Ambiguous', back: '模棱两可的，含糊的', tags: ['GRE', '形容词'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Resilient', back: '有弹性的，适应力强的', tags: ['GRE', '形容词'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
    en: {
      name: 'English Vocab',
      description: 'Common English vocabulary',
      cards: [
        { id: generateId(), front: 'Ephemeral', back: 'Lasting for a very short time', tags: ['GRE', 'adj'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Ubiquitous', back: 'Present everywhere', tags: ['GRE', 'adj'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Pragmatic', back: 'Dealing with things practically', tags: ['GRE', 'adj'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Ambiguous', back: 'Open to more than one interpretation', tags: ['GRE', 'adj'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Resilient', back: 'Able to recover quickly', tags: ['GRE', 'adj'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
  },
  math: {
    zh: {
      name: '数学公式',
      description: '常用数学公式与定理',
      cards: [
        { id: generateId(), front: '勾股定理', back: 'a² + b² = c²（直角三角形两直角边平方和等于斜边平方）', tags: ['几何'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: '求根公式', back: 'x = (-b ± √(b²-4ac)) / 2a', tags: ['代数'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: '欧拉公式', back: 'e^(iπ) + 1 = 0', tags: ['复数'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: '圆的面积', back: 'S = πr²', tags: ['几何'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
    en: {
      name: 'Math Formulas',
      description: 'Common mathematical formulas',
      cards: [
        { id: generateId(), front: 'Pythagorean Theorem', back: 'a² + b² = c² (sum of squares of legs equals square of hypotenuse)', tags: ['geometry'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Quadratic Formula', back: 'x = (-b ± √(b²-4ac)) / 2a', tags: ['algebra'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: "Euler's Identity", back: 'e^(iπ) + 1 = 0', tags: ['complex'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Area of Circle', back: 'A = πr²', tags: ['geometry'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
  },
  history: {
    zh: {
      name: '历史知识',
      description: '重要历史事件与人物',
      cards: [
        { id: generateId(), front: '中华人民共和国成立', back: '1949年10月1日，北京天安门', tags: ['中国历史', '现代'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: '五四运动', back: '1919年5月4日，反帝反封建爱国运动，新民主主义革命开端', tags: ['中国历史', '近代'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: '工业革命', back: '18世纪60年代始于英国，蒸汽机广泛应用，社会生产方式根本变革', tags: ['世界历史'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
    en: {
      name: 'History',
      description: 'Important historical events',
      cards: [
        { id: generateId(), front: 'French Revolution', back: '1789-1799, overthrow of monarchy, established republic', tags: ['world'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Industrial Revolution', back: '1760s-1840s, began in Britain, steam power, transformed manufacturing', tags: ['world'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Moon Landing', back: 'July 20, 1969, Apollo 11, Neil Armstrong', tags: ['modern'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
  },
  code: {
    zh: {
      name: '编程知识',
      description: '编程概念与代码片段',
      cards: [
        { id: generateId(), front: '什么是闭包(Closure)？', back: '函数与其词法环境的组合，内部函数可以访问外部函数的变量', tags: ['JavaScript', '概念'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'HTTP 状态码 404', back: 'Not Found - 请求的资源不存在', tags: ['HTTP', '状态码'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Git 合并命令', back: 'git merge <branch-name>', tags: ['Git'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
    en: {
      name: 'Programming',
      description: 'Programming concepts and snippets',
      cards: [
        { id: generateId(), front: 'What is a Closure?', back: 'A function combined with its lexical environment. Inner function can access outer function variables', tags: ['JavaScript', 'concept'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'HTTP Status 404', back: 'Not Found - The requested resource does not exist', tags: ['HTTP', 'status'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
        { id: generateId(), front: 'Git merge command', back: 'git merge <branch-name>', tags: ['Git'], level: 'new', correctCount: 0, incorrectCount: 0, lastReviewed: null, createdAt: Date.now() },
      ],
    } as any,
  },
};

function loadTemplate(key: string) {
  const tpl = templateDecks[key];
  if (!tpl) return;
  const data = tpl[lang.value] as Deck;
  const newDeck: Deck = {
    id: generateId(),
    name: data.name,
    description: data.description || '',
    cards: (data.cards || []).map(c => ({ ...c, id: generateId(), createdAt: Date.now() })),
    createdAt: Date.now(),
  };
  decks.value.push(newDeck);
  activeDeckId.value = newDeck.id;
}
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 16px;">
    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 700; margin: 0;">🃏 {{ t('title').value }}</h2>
        <p style="font-size: 12px; color: #888; margin: 4px 0 0;">{{ t('subtitle').value }}</p>
      </div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <NButton size="small" :type="lang === 'zh' ? 'primary' : 'default'" @click="lang = 'zh'">中文</NButton>
        <NButton size="small" :type="lang === 'en' ? 'primary' : 'default'" @click="lang = 'en'">EN</NButton>
      </div>
    </div>

    <!-- Deck Selector + New Deck -->
    <div style="display: flex; gap: 10px; margin-bottom: 16px; align-items: center; flex-wrap: wrap;">
      <NSelect
        v-if="decks.length > 0"
        :value="activeDeckId"
        :options="decks.map(d => ({ label: `${d.name} (${d.cards.length})`, value: d.id }))"
        :placeholder="t('deckTitle').value"
        style="min-width: 220px;"
        @update:value="(v: string) => activeDeckId = v"
      />
      <NButton size="small" type="primary" @click="createDeck">
        <template #icon><NIcon><Plus /></NIcon></template>
        {{ t('newDeck').value }}
      </NButton>
      <NButton v-if="activeDeck" size="small" @click="editDeck(activeDeck)">
        <template #icon><NIcon><Edit /></NIcon></template>
      </NButton>
      <NPopconfirm v-if="activeDeck" @positive-click="deleteDeck(activeDeckId)">
        <template #trigger>
          <NButton size="small" type="error" ghost>
            <template #icon><NIcon><Trash /></NIcon></template>
          </NButton>
        </template>
        {{ t('deleteDeck').value }}？
      </NPopconfirm>

      <NButton v-if="activeDeck" size="small" @click="importCards">
        <template #icon><NIcon><Upload /></NIcon></template>
        {{ t('importBtn').value }}
      </NButton>
      <NButton v-if="activeDeck && activeDeck.cards.length > 0" size="small" @click="exportCards('json')">
        <template #icon><NIcon><Download /></NIcon></template>
        JSON
      </NButton>
      <NButton v-if="activeDeck && activeDeck.cards.length > 0" size="small" @click="exportCards('csv')">
        <template #icon><NIcon><Download /></NIcon></template>
        CSV
      </NButton>
    </div>

    <!-- No Deck State -->
    <div v-if="decks.length === 0" style="text-align: center; padding: 60px 20px;">
      <NIcon size="64" color="#555"><Book /></NIcon>
      <p style="color: #888; margin: 16px 0 8px; font-size: 14px;">{{ t('noDecks').value }}</p>
      <NButton type="primary" @click="createDeck">
        <template #icon><NIcon><Plus /></NIcon></template>
        {{ t('newDeck').value }}
      </NButton>
      <NDivider style="margin: 20px 0;">{{ t('templates').value }}</NDivider>
      <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
        <NButton size="small" dashed @click="loadTemplate('english')">📖 {{ t('templateEnglish').value }}</NButton>
        <NButton size="small" dashed @click="loadTemplate('math')">📐 {{ t('templateMath').value }}</NButton>
        <NButton size="small" dashed @click="loadTemplate('history')">🏛️ {{ t('templateHistory').value }}</NButton>
        <NButton size="small" dashed @click="loadTemplate('code')">💻 {{ t('templateCode').value }}</NButton>
      </div>
    </div>

    <!-- Active Deck Content -->
    <div v-if="activeDeck">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- Study Tab -->
        <NTabPane :name="'study'" :tab="`📚 ${t('studyTab').value}`">
          <!-- Study Mode -->
          <div v-if="isStudying && currentStudyCard" style="padding: 20px 0;">
            <!-- Progress bar -->
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 4px;">
                <span>{{ t('cardProgress').value.replace('{0}', String(studyIndex + 1)).replace('{1}', String(studyCardIds.length)) }}</span>
                <span>{{ studyProgress }}%</span>
              </div>
              <NProgress :percentage="studyProgress" :show-indicator="false" type="line" color="#63e2b7" rail-color="#333" />
            </div>

            <!-- Flashcard -->
            <div
              class="flashcard-container"
              @click="flipCard"
              style="perspective: 1000px; cursor: pointer; margin: 0 auto; max-width: 600px;"
            >
              <div
                class="flashcard-inner"
                :class="{ 'is-flipped': isFlipped }"
                style="position: relative; width: 100%; min-height: 320px; transition: transform 0.6s; transform-style: preserve-3d;"
              >
                <!-- Front -->
                <div
                  class="flashcard-face flashcard-front"
                  style="position: absolute; inset: 0; backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"
                >
                  <div style="font-size: 11px; color: #63e2b7; margin-bottom: 12px; letter-spacing: 1px; text-transform: uppercase;">
                    {{ t('cardFront').value }}
                  </div>
                  <div style="font-size: 22px; font-weight: 600; text-align: center; line-height: 1.5; color: #e8e8e8;">
                    {{ currentStudyCard.front }}
                  </div>
                  <div v-if="currentStudyCard.tags.length" style="margin-top: 16px; display: flex; gap: 4px; flex-wrap: wrap;">
                    <NTag v-for="tag in currentStudyCard.tags" :key="tag" size="tiny" :bordered="false" type="info">{{ tag }}</NTag>
                  </div>
                  <div style="margin-top: 20px; font-size: 11px; color: #555;">👆 {{ t('flipCard').value }}</div>
                </div>
                <!-- Back -->
                <div
                  class="flashcard-face flashcard-back"
                  style="position: absolute; inset: 0; backface-visibility: hidden; transform: rotateY(180deg); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"
                >
                  <div style="font-size: 11px; color: #f2c97d; margin-bottom: 12px; letter-spacing: 1px; text-transform: uppercase;">
                    {{ t('cardBack').value }}
                  </div>
                  <div style="font-size: 20px; text-align: center; line-height: 1.6; color: #e0e0e0;">
                    {{ currentStudyCard.back }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div v-if="isFlipped" style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
              <NButton type="error" ghost size="large" @click="markIncorrect" style="min-width: 140px;">
                {{ t('forgotIt').value }}
              </NButton>
              <NButton type="success" ghost size="large" @click="markCorrect" style="min-width: 140px;">
                {{ t('knowIt').value }}
              </NButton>
            </div>

            <!-- Score while studying -->
            <div style="display: flex; gap: 16px; justify-content: center; margin-top: 16px; font-size: 13px; color: #888;">
              <span style="color: #63e2b7;">✓ {{ studyCorrect }}</span>
              <span style="color: #e88080;">✗ {{ studyIncorrect }}</span>
              <span>{{ t('remaining').value }}: {{ studyCardIds.length - studyIndex - 1 }}</span>
            </div>
          </div>

          <!-- Study Complete -->
          <div v-if="isStudyComplete" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
            <h3 style="font-size: 20px; font-weight: 700; margin: 0;">{{ t('studyComplete').value }}</h3>
            <p style="color: #888; margin: 8px 0;">{{ t('studyCompleteDesc').value }}</p>
            <div style="display: flex; gap: 20px; justify-content: center; margin: 20px 0; font-size: 14px;">
              <div style="text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #63e2b7;">{{ studyCorrect }}</div>
                <div style="font-size: 12px; color: #888;">{{ t('correct').value }}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #e88080;">{{ studyIncorrect }}</div>
                <div style="font-size: 12px; color: #888;">{{ t('incorrect').value }}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #f2c97d;">
                  {{ studyCorrect + studyIncorrect > 0 ? Math.round(studyCorrect / (studyCorrect + studyIncorrect) * 100) : 0 }}%
                </div>
                <div style="font-size: 12px; color: #888;">{{ t('accuracy').value }}</div>
              </div>
            </div>
            <NButton type="primary" @click="isStudyComplete = false">
              {{ lang === 'zh' ? '返回' : 'Back' }}
            </NButton>
          </div>

          <!-- Start Study Panel -->
          <div v-if="!isStudying && !isStudyComplete" style="padding: 20px 0;">
            <div v-if="activeDeck.cards.length === 0" style="text-align: center; padding: 40px; color: #666;">
              <NIcon size="48" color="#555"><Book /></NIcon>
              <p style="margin: 12px 0;">{{ t('noCards').value }}</p>
            </div>
            <div v-else>
              <!-- Deck overview cards -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700;">{{ deckStats.total }}</div>
                  <div style="font-size: 11px; color: #888;">{{ t('totalCards').value }}</div>
                </div>
                <div style="background: rgba(99,226,183,0.06); border-radius: 12px; padding: 16px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700; color: #63e2b7;">{{ deckStats.mastered }}</div>
                  <div style="font-size: 11px; color: #63e2b7;">{{ t('mastered').value }}</div>
                </div>
                <div style="background: rgba(242,201,125,0.06); border-radius: 12px; padding: 16px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700; color: #f2c97d;">{{ deckStats.learning }}</div>
                  <div style="font-size: 11px; color: #f2c97d;">{{ t('learning').value }}</div>
                </div>
                <div style="background: rgba(224,224,224,0.04); border-radius: 12px; padding: 16px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 700; color: #aaa;">{{ deckStats.newCount }}</div>
                  <div style="font-size: 11px; color: #888;">{{ t('newCards').value }}</div>
                </div>
              </div>

              <!-- Study options -->
              <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px;">
                <NRadioGroup v-model:value="studyOrder" size="small">
                  <NRadioButton value="sequential">
                    <NIcon style="margin-right: 4px;"><SortAscending /></NIcon>
                    {{ t('sequentialMode').value }}
                  </NRadioButton>
                  <NRadioButton value="shuffle">
                    <NIcon style="margin-right: 4px;"><Shuffle /></NIcon>
                    {{ t('shuffleMode').value }}
                  </NRadioButton>
                </NRadioGroup>
                <NButton type="primary" size="large" @click="startStudy" style="margin-left: auto;">
                  <template #icon><NIcon><Book /></NIcon></template>
                  {{ t('startStudy').value }}
                </NButton>
              </div>

              <!-- Mastery progress -->
              <div v-if="deckStats.total > 0" style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 6px;">
                  <span>{{ t('mastered').value }}</span>
                  <span>{{ Math.round(deckStats.mastered / deckStats.total * 100) }}%</span>
                </div>
                <NProgress
                  :percentage="Math.round(deckStats.mastered / deckStats.total * 100)"
                  type="line"
                  color="#63e2b7"
                  rail-color="#333"
                  :show-indicator="false"
                />
              </div>

              <!-- Quick Templates (when no cards) -->
              <div v-if="activeDeck.cards.length === 0" style="margin-top: 16px;">
                <NDivider>{{ t('templates').value }}</NDivider>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <NButton size="small" dashed @click="loadTemplate('english')">📖 {{ t('templateEnglish').value }}</NButton>
                  <NButton size="small" dashed @click="loadTemplate('math')">📐 {{ t('templateMath').value }}</NButton>
                  <NButton size="small" dashed @click="loadTemplate('history')">🏛️ {{ t('templateHistory').value }}</NButton>
                  <NButton size="small" dashed @click="loadTemplate('code')">💻 {{ t('templateCode').value }}</NButton>
                </div>
              </div>
            </div>
          </div>
        </NTabPane>

        <!-- Manage Tab -->
        <NTabPane :name="'manage'" :tab="`🗂️ ${t('manageTab').value} (${activeDeck.cards.length})`">
          <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <NInput
              v-model:value="searchQuery"
              :placeholder="t('search').value"
              clearable
              size="small"
              style="max-width: 240px;"
            >
              <template #prefix><NIcon><Search /></NIcon></template>
            </NInput>
            <NSelect
              v-if="allTags.length > 0"
              v-model:value="filterTag"
              :options="[{ label: t('allTags').value, value: '' }, ...allTags.map(t => ({ label: t, value: t }))]"
              size="small"
              clearable
              style="min-width: 120px; max-width: 180px;"
              :placeholder="t('allTags').value"
            />
            <NButton size="small" type="primary" @click="openAddCard" style="margin-left: auto;">
              <template #icon><NIcon><Plus /></NIcon></template>
              {{ t('addCard').value }}
            </NButton>
          </div>

          <!-- Card List -->
          <div v-if="filteredCards.length === 0" style="text-align: center; padding: 40px; color: #666;">
            <NIcon size="48" color="#555"><Book /></NIcon>
            <p style="margin: 12px 0;">{{ t('noCards').value }}</p>
          </div>
          <NScrollbar v-else style="max-height: 560px;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div
                v-for="card in filteredCards"
                :key="card.id"
                style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 14px; border: 1px solid rgba(255,255,255,0.04); transition: border-color 0.2s;"
                @mouseenter="($event.target as HTMLElement).style.borderColor='rgba(99,226,183,0.3)'"
                @mouseleave="($event.target as HTMLElement).style.borderColor='rgba(255,255,255,0.04)'"
              >
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="font-size: 11px; color: #63e2b7; font-weight: 600;">{{ t('cardFront').value }}</span>
                      <NTag v-if="card.level === 'mastered'" size="tiny" type="success" :bordered="false" round>{{ t('mastered').value }}</NTag>
                      <NTag v-else-if="card.level === 'learning'" size="tiny" type="warning" :bordered="false" round>{{ t('learning').value }}</NTag>
                      <NTag v-else size="tiny" :bordered="false" round>{{ t('newCards').value }}</NTag>
                    </div>
                    <div style="font-size: 14px; font-weight: 500; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ card.front }}
                    </div>
                    <div style="font-size: 11px; color: #f2c97d; margin-bottom: 4px;">{{ t('cardBack').value }}</div>
                    <div style="font-size: 13px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ card.back }}
                    </div>
                    <div v-if="card.tags.length" style="margin-top: 6px; display: flex; gap: 3px; flex-wrap: wrap;">
                      <NTag v-for="tag in card.tags" :key="tag" size="tiny" :bordered="false">{{ tag }}</NTag>
                    </div>
                  </div>
                  <div style="display: flex; gap: 4px; flex-shrink: 0;">
                    <NButton size="tiny" quaternary @click="openEditCard(card)">
                      <template #icon><NIcon><Edit /></NIcon></template>
                    </NButton>
                    <NPopconfirm @positive-click="deleteCard(card.id)">
                      <template #trigger>
                        <NButton size="tiny" quaternary type="error">
                          <template #icon><NIcon><Trash /></NIcon></template>
                        </NButton>
                      </template>
                      {{ t('deleteCard').value }}？
                    </NPopconfirm>
                  </div>
                </div>
              </div>
            </div>
          </NScrollbar>
        </NTabPane>

        <!-- Stats Tab -->
        <NTabPane :name="'stats'" :tab="`📊 ${t('statsTab').value}`">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #63e2b7;">{{ todayRecord?.total || 0 }}</div>
              <div style="font-size: 11px; color: #888;">{{ t('todayStudied').value }}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #f2c97d;">🔥 {{ studyStreak }}</div>
              <div style="font-size: 11px; color: #888;">{{ t('streak').value }}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700;">{{ todayAccuracy }}%</div>
              <div style="font-size: 11px; color: #888;">{{ t('accuracy').value }}</div>
            </div>
          </div>

          <!-- Review History -->
          <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 14px;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">📅 {{ t('reviewHistory').value }}</div>
            <div v-if="studyRecords.length === 0" style="text-align: center; padding: 20px; color: #666; font-size: 13px;">
              {{ t('noHistory').value }}
            </div>
            <NScrollbar v-else style="max-height: 300px;">
              <div
                v-for="rec in [...studyRecords].reverse().slice(0, 30)"
                :key="rec.date"
                style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px;"
              >
                <span style="color: #aaa;">{{ rec.date }}</span>
                <div style="display: flex; gap: 12px;">
                  <span style="color: #63e2b7;">✓ {{ rec.correct }}</span>
                  <span style="color: #e88080;">✗ {{ rec.incorrect }}</span>
                  <span style="color: #f2c97d;">{{ rec.total > 0 ? Math.round(rec.correct / rec.total * 100) : 0 }}%</span>
                </div>
              </div>
            </NScrollbar>
          </div>
        </NTabPane>
      </NTabs>
    </div>

    <!-- Deck Modal -->
    <NModal v-model:show="showDeckModal" preset="card" :title="editingDeckId ? t('editCard').value : t('newDeck').value" style="max-width: 400px;" :mask-closable="false">
      <div style="padding: 16px;">
        <NFormItem :label="t('deckName').value">
          <NInput v-model:value="deckNameInput" :placeholder="t('deckName').value" maxlength="50" />
        </NFormItem>
        <NFormItem :label="t('deckDesc').value">
          <NInput v-model:value="deckDescInput" type="textarea" :placeholder="t('deckDesc').value" :rows="2" maxlength="200" />
        </NFormItem>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
          <NButton @click="showDeckModal = false">{{ t('cancel').value }}</NButton>
          <NButton type="primary" @click="saveDeck" :disabled="!deckNameInput.trim()">{{ t('save').value }}</NButton>
        </div>
      </div>
    </NModal>

    <!-- Card Modal -->
    <NModal v-model:show="showCardModal" preset="card" :title="editingCardId ? t('editCard').value : t('addCard').value" style="max-width: 500px;" :mask-closable="false">
      <div style="padding: 16px;">
        <NFormItem :label="t('cardFront').value">
          <NInput v-model:value="cardFront" type="textarea" :placeholder="t('frontPlaceholder').value" :rows="3" />
        </NFormItem>
        <NFormItem :label="t('cardBack').value">
          <NInput v-model:value="cardBack" type="textarea" :placeholder="t('backPlaceholder').value" :rows="3" />
        </NFormItem>
        <NFormItem :label="lang === 'zh' ? '标签' : 'Tags'">
          <NInput v-model:value="cardTags" :placeholder="t('tagPlaceholder').value" />
        </NFormItem>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
          <NButton @click="showCardModal = false">{{ t('cancel').value }}</NButton>
          <NButton type="primary" @click="saveCard" :disabled="!cardFront.trim() || !cardBack.trim()">{{ t('save').value }}</NButton>
        </div>
      </div>
    </NModal>

    <!-- Import Modal -->
    <NModal v-model:show="showImportModal" preset="card" :title="t('importTitle').value" style="max-width: 600px;" :mask-closable="false">
      <div style="padding: 16px;">
        <NAlert type="info" :bordered="false" style="margin-bottom: 12px;">
          {{ t('importHint').value }}
          <br />
          <code style="font-size: 11px; color: #63e2b7;">[{"front":"hello","back":"你好","tags":["英语"]}]</code>
        </NAlert>
        <NInput v-model:value="importText" type="textarea" :rows="8" placeholder='[{"front":"hello","back":"你好"}]' />
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
          <NButton @click="showImportModal = false">{{ t('cancel').value }}</NButton>
          <NButton type="primary" @click="doImport" :disabled="!importText.trim()">{{ t('importBtn').value }}</NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.flashcard-container {
  perspective: 1000px;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  min-height: 320px;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flashcard-inner.is-flipped {
  transform: rotateY(180deg);
}

.flashcard-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flashcard-back {
  transform: rotateY(180deg);
}

.flashcard-front:hover,
.flashcard-back:hover {
  box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important;
}
</style>
