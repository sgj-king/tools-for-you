<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NInputNumber, NIcon, NGrid, NGi, NSwitch, NSelect, NInput } from 'naive-ui';
import { Copy, Refresh, Plus, Trash, ArrowUp, ArrowDown, AddColumn, AddRow } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: 'Markdown 表格生成器',
    subtitle: '可视化创建和编辑 Markdown 表格，实时预览并一键复制',
    rows: '行数',
    cols: '列数',
    create: '创建表格',
    headerRow: '表头行',
    alignment: '对齐方式',
    alignLeft: '左对齐',
    alignCenter: '居中',
    alignRight: '右对齐',
    preview: '实时预览',
    output: 'Markdown 输出',
    copy: '复制',
    copied: '已复制！',
    addRow: '添加行',
    addCol: '添加列',
    deleteRow: '删除行',
    deleteCol: '删除列',
    moveUp: '上移',
    moveDown: '下移',
    moveLeft: '左移',
    moveRight: '右移',
    clear: '清空表格',
    reset: '重置',
    emptyCell: '空',
    header: '表头',
    row: '行',
    column: '列',
    template: '快捷模板',
    tplSchedule: '课程表',
    tplComparison: '功能对比',
    tplTodo: '待办清单',
    tplData: '数据报表',
    importHint: '粘贴 Markdown 表格可直接导入',
    importBtn: '导入',
    importLabel: '导入 Markdown',
    cellWidth: '列宽',
    compact: '紧凑模式',
    style: '风格',
    styleNormal: '标准',
    styleCompact: '紧凑',
    styleNoSpace: '无空格',
    tip: '小贴士',
    tipContent: '在单元格中输入内容，实时生成 Markdown 表格代码。支持拖拽调整行列、设置对齐方式，也可粘贴已有 Markdown 表格直接导入编辑。',
    perColumnAlign: '单独设置每列对齐',
  },
  en: {
    title: 'Markdown Table Generator',
    subtitle: 'Visually create and edit Markdown tables with live preview and one-click copy',
    rows: 'Rows',
    cols: 'Columns',
    create: 'Create Table',
    headerRow: 'Header Row',
    alignment: 'Alignment',
    alignLeft: 'Left',
    alignCenter: 'Center',
    alignRight: 'Right',
    preview: 'Live Preview',
    output: 'Markdown Output',
    copy: 'Copy',
    copied: 'Copied!',
    addRow: 'Add Row',
    addCol: 'Add Column',
    deleteRow: 'Delete Row',
    deleteCol: 'Delete Column',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    moveLeft: 'Move Left',
    moveRight: 'Move Right',
    clear: 'Clear Table',
    reset: 'Reset',
    emptyCell: 'Empty',
    header: 'Header',
    row: 'Row',
    column: 'Column',
    template: 'Templates',
    tplSchedule: 'Schedule',
    tplComparison: 'Comparison',
    tplTodo: 'Todo List',
    tplData: 'Data Report',
    importHint: 'Paste Markdown table to import directly',
    importBtn: 'Import',
    importLabel: 'Import Markdown',
    cellWidth: 'Column Width',
    compact: 'Compact Mode',
    style: 'Style',
    styleNormal: 'Normal',
    styleCompact: 'Compact',
    styleNoSpace: 'No Spaces',
    tip: 'Tip',
    tipContent: 'Enter content in cells to generate Markdown table code in real time. Supports drag-and-drop row/column adjustments, alignment settings, and pasting existing Markdown tables for direct import and editing.',
    perColumnAlign: 'Set alignment per column',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Table state
const defaultRows = 3;
const defaultCols = 3;

interface Cell {
  content: string;
}

const tableData = ref<Cell[][]>(
  Array.from({ length: defaultRows }, () =>
    Array.from({ length: defaultCols }, () => ({ content: '' })),
  ),
);

// Per-column alignment
const colAlignments = ref<('left' | 'center' | 'right')[]>(
  Array.from({ length: defaultCols }, () => 'left'),
);

// Global alignment override (null = use per-column)
const globalAlignment = ref<'left' | 'center' | 'right' | 'per-column'>('per-column');

// Table style
const tableStyle = ref<'normal' | 'compact' | 'nospace'>('normal');

// Import textarea
const showImport = ref(false);
const importText = ref('');

// ===================== Alignment Helpers =====================
function getAlignForCol(colIdx: number): 'left' | 'center' | 'right' {
  if (globalAlignment.value !== 'per-column') return globalAlignment.value;
  return colAlignments.value[colIdx] || 'left';
}

function alignStr(align: 'left' | 'center' | 'right'): string {
  if (align === 'center') return ':---:';
  if (align === 'right') return '---:';
  return ':---';
}

// ===================== Markdown Generation =====================
const markdownOutput = computed(() => {
  const rows = tableData.value;
  if (rows.length === 0) return '';
  const colCount = rows[0]?.length || 0;
  const isCompact = tableStyle.value === 'compact';
  const isNoSpace = tableStyle.value === 'nospace';

  const sep = isNoSpace ? '' : ' ';
  const padChar = ' ';

  function padCell(text: string, maxLen: number, align: 'left' | 'center' | 'right'): string {
    const pad = maxLen - text.length;
    if (pad <= 0) return text;
    if (align === 'center') {
      const left = Math.floor(pad / 2);
      const right = pad - left;
      return padChar.repeat(left) + text + padChar.repeat(right);
    }
    if (align === 'right') {
      return padChar.repeat(pad) + text;
    }
    return text + padChar.repeat(pad);
  }

  // Calculate max width per column
  const colWidths = Array.from({ length: colCount }, (_, ci) => {
    let maxW = 3; // minimum "---"
    for (const row of rows) {
      const cellLen = (row[ci]?.content || '').length;
      if (cellLen > maxW) maxW = cellLen;
    }
    return maxW;
  });

  function buildRow(cells: string[], aligns: ('left' | 'center' | 'right')[]): string {
    const padded = cells.map((c, i) => padCell(c, colWidths[i], aligns[i]));
    return `|${sep}${padded.join(`${sep}|${sep}`)}${sep}|`;
  }

  function buildSeparator(aligns: ('left' | 'center' | 'right')[]): string {
    const parts = aligns.map((a, i) => {
      const w = colWidths[i];
      const base = '-'.repeat(w);
      if (a === 'center') return `:${base}:`;
      if (a === 'right') return `${base}:`;
      return `:${base}`;
    });
    return `|${sep}${parts.join(`${sep}|${sep}`)}${sep}|`;
  }

  const aligns = Array.from({ length: colCount }, (_, i) => getAlignForCol(i));
  const lines: string[] = [];

  // Header row
  const headerCells = rows[0].map((c) => c.content || '');
  lines.push(buildRow(headerCells, aligns));
  lines.push(buildSeparator(aligns));

  // Data rows
  for (let ri = 1; ri < rows.length; ri++) {
    const cells = rows[ri].map((c) => c.content || '');
    lines.push(buildRow(cells, aligns));
  }

  return lines.join('\n');
});

// ===================== Table Operations =====================
function addRow() {
  const cols = tableData.value[0]?.length || defaultCols;
  tableData.value.push(Array.from({ length: cols }, () => ({ content: '' })));
}

function addCol() {
  for (const row of tableData.value) {
    row.push({ content: '' });
  }
  colAlignments.value.push('left');
}

function deleteRow(index: number) {
  if (tableData.value.length <= 1) return;
  tableData.value.splice(index, 1);
}

function deleteCol(index: number) {
  if ((tableData.value[0]?.length || 0) <= 1) return;
  for (const row of tableData.value) {
    row.splice(index, 1);
  }
  colAlignments.value.splice(index, 1);
}

function moveRowUp(index: number) {
  if (index <= 0) return;
  const temp = tableData.value[index];
  tableData.value[index] = tableData.value[index - 1];
  tableData.value[index - 1] = temp;
}

function moveRowDown(index: number) {
  if (index >= tableData.value.length - 1) return;
  const temp = tableData.value[index];
  tableData.value[index] = tableData.value[index + 1];
  tableData.value[index + 1] = temp;
}

function moveColLeft(index: number) {
  if (index <= 0) return;
  for (const row of tableData.value) {
    const temp = row[index];
    row[index] = row[index - 1];
    row[index - 1] = temp;
  }
  const tempAlign = colAlignments.value[index];
  colAlignments.value[index] = colAlignments.value[index - 1];
  colAlignments.value[index - 1] = tempAlign;
}

function moveColRight(index: number) {
  const colCount = tableData.value[0]?.length || 0;
  if (index >= colCount - 1) return;
  for (const row of tableData.value) {
    const temp = row[index];
    row[index] = row[index + 1];
    row[index + 1] = temp;
  }
  const tempAlign = colAlignments.value[index];
  colAlignments.value[index] = colAlignments.value[index + 1];
  colAlignments.value[index + 1] = tempAlign;
}

function clearTable() {
  for (const row of tableData.value) {
    for (const cell of row) {
      cell.content = '';
    }
  }
}

function resetTable() {
  tableData.value = Array.from({ length: defaultRows }, () =>
    Array.from({ length: defaultCols }, () => ({ content: '' })),
  );
  colAlignments.value = Array.from({ length: defaultCols }, () => 'left');
}

// ===================== Templates =====================
function applyTemplate(name: string) {
  switch (name) {
    case 'schedule': {
      tableData.value = [
        [{ content: lang.value === 'zh' ? '时间' : 'Time' }, { content: lang.value === 'zh' ? '周一' : 'Mon' }, { content: lang.value === 'zh' ? '周二' : 'Tue' }, { content: lang.value === 'zh' ? '周三' : 'Wed' }, { content: lang.value === 'zh' ? '周四' : 'Thu' }, { content: lang.value === 'zh' ? '周五' : 'Fri' }].map(c => ({ content: c.content })),
        [{ content: '08:00' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: '10:00' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: '14:00' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: '16:00' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }],
      ];
      colAlignments.value = ['left', 'center', 'center', 'center', 'center', 'center'];
      break;
    }
    case 'comparison': {
      tableData.value = [
        [{ content: lang.value === 'zh' ? '特性' : 'Feature' }, { content: 'A' }, { content: 'B' }, { content: 'C' }].map(c => ({ content: c.content })),
        [{ content: lang.value === 'zh' ? '价格' : 'Price' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: lang.value === 'zh' ? '性能' : 'Performance' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: lang.value === 'zh' ? '易用性' : 'Usability' }, { content: '' }, { content: '' }, { content: '' }],
      ];
      colAlignments.value = ['left', 'center', 'center', 'center'];
      break;
    }
    case 'todo': {
      tableData.value = [
        [{ content: lang.value === 'zh' ? '任务' : 'Task' }, { content: lang.value === 'zh' ? '状态' : 'Status' }, { content: lang.value === 'zh' ? '优先级' : 'Priority' }, { content: lang.value === 'zh' ? '截止日期' : 'Deadline' }].map(c => ({ content: c.content })),
        [{ content: '' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: '' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: '' }, { content: '' }, { content: '' }, { content: '' }],
      ];
      colAlignments.value = ['left', 'center', 'center', 'center'];
      break;
    }
    case 'data': {
      tableData.value = [
        [{ content: lang.value === 'zh' ? '月份' : 'Month' }, { content: lang.value === 'zh' ? '收入' : 'Revenue' }, { content: lang.value === 'zh' ? '支出' : 'Expense' }, { content: lang.value === 'zh' ? '利润' : 'Profit' }].map(c => ({ content: c.content })),
        [{ content: lang.value === 'zh' ? '1月' : 'Jan' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: lang.value === 'zh' ? '2月' : 'Feb' }, { content: '' }, { content: '' }, { content: '' }],
        [{ content: lang.value === 'zh' ? '3月' : 'Mar' }, { content: '' }, { content: '' }, { content: '' }],
      ];
      colAlignments.value = ['left', 'right', 'right', 'right'];
      break;
    }
  }
  globalAlignment.value = 'per-column';
}

// ===================== Import =====================
function importMarkdown() {
  const text = importText.value.trim();
  if (!text) return;

  const lines = text.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return;

  const parsed: string[][] = [];
  for (const line of lines) {
    // Skip separator line
    const cleaned = line.replace(/^\|/, '').replace(/\|$/, '');
    const cells = cleaned.split('|').map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    parsed.push(cells);
  }

  if (parsed.length === 0) return;

  const maxCols = Math.max(...parsed.map((r) => r.length));
  tableData.value = parsed.map((row) => {
    const cells: Cell[] = row.map((c) => ({ content: c }));
    while (cells.length < maxCols) cells.push({ content: '' });
    return cells;
  });

  // Try to detect alignments from separator line
  const sepLine = lines.find((l) => {
    const cleaned = l.replace(/^\|/, '').replace(/\|$/, '');
    return cleaned.split('|').every((c) => /^:?-+:?$/.test(c.trim()));
  });
  if (sepLine) {
    const cleaned = sepLine.replace(/^\|/, '').replace(/\|$/, '');
    const seps = cleaned.split('|').map((s) => s.trim());
    colAlignments.value = seps.map((s) => {
      const left = s.startsWith(':');
      const right = s.endsWith(':');
      if (left && right) return 'center' as const;
      if (right) return 'right' as const;
      return 'left' as const;
    });
    while (colAlignments.value.length < maxCols) colAlignments.value.push('left');
  } else {
    colAlignments.value = Array.from({ length: maxCols }, () => 'left' as const);
  }

  globalAlignment.value = 'per-column';
  showImport.value = false;
  importText.value = '';
}

// ===================== Copy =====================
const justCopied = ref(false);
function copyMarkdown() {
  navigator.clipboard.writeText(markdownOutput.value);
  justCopied.value = true;
  setTimeout(() => {
    justCopied.value = false;
  }, 1500);
}

// ===================== Hovered row/col for actions =====================
const hoverRow = ref(-1);
const hoverCol = ref(-1);
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1200px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <n-grid :cols="24" :x-gap="16" responsive="screen" item-responsive>
        <!-- Left: Table Editor -->
        <n-gi span="24 m:16">
          <c-card mb-4>
            <div flex justify-between items-center mb-4>
              <div text-lg font-bold>✏️ {{ t('title').value }}</div>
              <div flex gap-2>
                <!-- Template Dropdown -->
                <n-select
                  :value="null"
                  :placeholder="t('template').value"
                  :options="[
                    { label: t('tplSchedule').value, value: 'schedule' },
                    { label: t('tplComparison').value, value: 'comparison' },
                    { label: t('tplTodo').value, value: 'todo' },
                    { label: t('tplData').value, value: 'data' },
                  ]"
                  size="small"
                  style="width: 140px"
                  @update:value="applyTemplate"
                />
                <n-button size="small" quaternary round @click="showImport = !showImport">
                  📥 {{ t('importBtn').value }}
                </n-button>
              </div>
            </div>

            <!-- Import Area -->
            <div v-if="showImport" mb-4 p-3 rounded-lg style="background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.15);">
              <div text-sm op-70 mb-2>{{ t('importLabel').value }}</div>
              <textarea
                v-model="importText"
                :placeholder="t('importHint').value"
                rows="4"
                style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; color: inherit; font-family: monospace; font-size: 13px; resize: vertical; outline: none;"
              />
              <div flex justify-end mt-2 gap-2>
                <n-button size="small" @click="showImport = false; importText = ''">{{ lang === 'zh' ? '取消' : 'Cancel' }}</n-button>
                <n-button size="small" type="primary" @click="importMarkdown">{{ t('importBtn').value }}</n-button>
              </div>
            </div>

            <!-- Style & Alignment Controls -->
            <div flex flex-wrap gap-3 mb-4 items-center>
              <div flex items-center gap-2>
                <span text-sm op-70>{{ t('style').value }}:</span>
                <n-button-group size="small">
                  <n-button
                    :type="tableStyle === 'normal' ? 'primary' : 'default'"
                    @click="tableStyle = 'normal'"
                  >{{ t('styleNormal').value }}</n-button>
                  <n-button
                    :type="tableStyle === 'compact' ? 'primary' : 'default'"
                    @click="tableStyle = 'compact'"
                  >{{ t('styleCompact').value }}</n-button>
                  <n-button
                    :type="tableStyle === 'nospace' ? 'primary' : 'default'"
                    @click="tableStyle = 'nospace'"
                  >{{ t('styleNoSpace').value }}</n-button>
                </n-button-group>
              </div>
              <div flex items-center gap-2>
                <span text-sm op-70>{{ t('alignment').value }}:</span>
                <n-button-group size="small">
                  <n-button
                    :type="globalAlignment === 'per-column' ? 'primary' : 'default'"
                    @click="globalAlignment = 'per-column'"
                  >🎯 {{ t('perColumnAlign').value }}</n-button>
                  <n-button
                    :type="globalAlignment === 'left' ? 'primary' : 'default'"
                    @click="globalAlignment = 'left'"
                  >⬅ {{ t('alignLeft').value }}</n-button>
                  <n-button
                    :type="globalAlignment === 'center' ? 'primary' : 'default'"
                    @click="globalAlignment = 'center'"
                  >⬌ {{ t('alignCenter').value }}</n-button>
                  <n-button
                    :type="globalAlignment === 'right' ? 'primary' : 'default'"
                    @click="globalAlignment = 'right'"
                  >➡ {{ t('alignRight').value }}</n-button>
                </n-button-group>
              </div>
            </div>

            <!-- Table Grid -->
            <div overflow-x-auto>
              <table style="width: 100%; border-collapse: separate; border-spacing: 0; min-width: 400px;">
                <!-- Column alignment selectors (when per-column mode) -->
                <thead v-if="globalAlignment === 'per-column'">
                  <tr>
                    <th style="width: 36px; padding: 0;"></th>
                    <th v-for="(_, ci) in colAlignments" :key="'al-' + ci" style="padding: 2px 4px;">
                      <div flex justify-center>
                        <n-button-group size="tiny">
                          <n-button
                            :type="colAlignments[ci] === 'left' ? 'primary' : 'default'"
                            size="tiny"
                            @click="colAlignments[ci] = 'left'"
                            quaternary
                            style="padding: 0 4px; font-size: 10px;"
                          >⬅</n-button>
                          <n-button
                            :type="colAlignments[ci] === 'center' ? 'primary' : 'default'"
                            size="tiny"
                            @click="colAlignments[ci] = 'center'"
                            quaternary
                            style="padding: 0 4px; font-size: 10px;"
                          >⬌</n-button>
                          <n-button
                            :type="colAlignments[ci] === 'right' ? 'primary' : 'default'"
                            size="tiny"
                            @click="colAlignments[ci] = 'right'"
                            quaternary
                            style="padding: 0 4px; font-size: 10px;"
                          >➡</n-button>
                        </n-button-group>
                      </div>
                    </th>
                    <th style="width: 36px; padding: 0;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in tableData" :key="ri"
                    @mouseenter="hoverRow = ri"
                    @mouseleave="hoverRow = -1"
                  >
                    <!-- Row action button -->
                    <td style="padding: 0; vertical-align: middle; text-align: center;">
                      <div v-show="hoverRow === ri" flex flex-col items-center gap-1>
                        <button
                          v-if="ri > 0"
                          style="background: none; border: none; cursor: pointer; opacity: 0.5; color: inherit; padding: 1px;"
                          @click="moveRowUp(ri)"
                          title="Move row up"
                        >⬆</button>
                        <button
                          v-if="ri < tableData.length - 1"
                          style="background: none; border: none; cursor: pointer; opacity: 0.5; color: inherit; padding: 1px;"
                          @click="moveRowDown(ri)"
                          title="Move row down"
                        >⬇</button>
                      </div>
                    </td>

                    <!-- Cells -->
                    <td
                      v-for="(cell, ci) in row"
                      :key="ci"
                      style="padding: 3px; vertical-align: top;"
                      @mouseenter="hoverCol = ci"
                      @mouseleave="hoverCol = -1"
                    >
                      <!-- Header row styling -->
                      <div
                        v-if="ri === 0"
                        rounded-lg
                        p-1
                        style="background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1)); border: 1px solid rgba(99,102,241,0.25);"
                      >
                        <div text-xs op-50 mb-1 text-center>{{ t('header').value }} {{ ci + 1 }}</div>
                        <input
                          v-model="cell.content"
                          style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px 10px; color: inherit; font-size: 13px; font-weight: 600; outline: none; text-align: center;"
                          :placeholder="t('emptyCell').value"
                        />
                      </div>
                      <!-- Data row styling -->
                      <div
                        v-else
                        rounded-lg
                        p-1
                        style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);"
                      >
                        <input
                          v-model="cell.content"
                          style="width: 100%; background: transparent; border: none; padding: 6px 10px; color: inherit; font-size: 13px; outline: none;"
                          :placeholder="t('emptyCell').value"
                        />
                      </div>
                    </td>

                    <!-- Delete row button -->
                    <td style="padding: 0; vertical-align: middle; text-align: center;">
                      <div v-show="hoverRow === ri" flex items-center justify-center>
                        <button
                          v-if="tableData.length > 1"
                          style="background: none; border: none; cursor: pointer; opacity: 0.4; color: #ef4444; padding: 2px; font-size: 14px;"
                          @click="deleteRow(ri)"
                          title="Delete row"
                        >✕</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Action buttons row -->
            <div flex flex-wrap gap-2 mt-4 justify-between items-center>
              <div flex gap-2>
                <n-button size="small" round type="primary" @click="addRow">
                  <template #icon><n-icon><Plus /></n-icon></template>
                  {{ t('addRow').value }}
                </n-button>
                <n-button size="small" round type="primary" @click="addCol">
                  <template #icon><n-icon><Plus /></n-icon></template>
                  {{ t('addCol').value }}
                </n-button>
              </div>
              <div flex gap-2>
                <n-button size="small" round quaternary @click="clearTable">
                  🗑️ {{ t('clear').value }}
                </n-button>
                <n-button size="small" round quaternary @click="resetTable">
                  <template #icon><n-icon><Refresh /></n-icon></template>
                  {{ t('reset').value }}
                </n-button>
              </div>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Preview & Output -->
        <n-gi span="24 m:8">
          <!-- Markdown Output -->
          <c-card mb-4>
            <div flex justify-between items-center mb-3>
              <div text-lg font-bold>📋 {{ t('output').value }}</div>
              <n-button size="small" round :type="justCopied ? 'success' : 'primary'" @click="copyMarkdown">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ justCopied ? t('copied').value : t('copy').value }}
              </n-button>
            </div>
            <pre
              style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 16px; font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 12.5px; line-height: 1.6; overflow-x: auto; white-space: pre; color: #c4b5fd; margin: 0; min-height: 80px;"
            >{{ markdownOutput || (lang === 'zh' ? '在左侧输入内容...' : 'Enter content on the left...') }}</pre>
          </c-card>

          <!-- Live Preview -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>👁️ {{ t('preview').value }}</div>
            <div overflow-x-auto>
              <table
                v-if="tableData.length > 0 && tableData[0].some(c => c.content)"
                style="width: 100%; border-collapse: collapse; font-size: 13px;"
              >
                <thead>
                  <tr>
                    <th
                      v-for="(cell, ci) in tableData[0]"
                      :key="'ph-' + ci"
                      style="padding: 8px 12px; border-bottom: 2px solid rgba(139,92,246,0.4); color: #c4b5fd; font-weight: 600;"
                      :style="{ textAlign: getAlignForCol(ci) }"
                    >{{ cell.content || '&nbsp;' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in tableData.slice(1)" :key="'pr-' + ri">
                    <td
                      v-for="(cell, ci) in row"
                      :key="'pc-' + ci"
                      style="padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);"
                      :style="{ textAlign: getAlignForCol(ci) }"
                    >{{ cell.content || '' }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else text-center py-6>
                <div text-3xl mb-2>📊</div>
                <div text-sm op-50>{{ lang === 'zh' ? '输入内容后显示预览' : 'Preview appears as you type' }}</div>
              </div>
            </div>
          </c-card>

          <!-- Tip Card -->
          <c-card mb-4>
            <div p-3 rounded-lg style="background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05)); border: 1px solid rgba(99,102,241,0.2);">
              <div text-sm text-indigo-400 mb-1>💡 {{ t('tip').value }}</div>
              <div text-xs leading-relaxed op-70>{{ t('tipContent').value }}</div>
            </div>
          </c-card>

          <!-- Table Info -->
          <c-card>
            <div flex gap-3 justify-center>
              <div text-center>
                <div text-2xl font-bold text-indigo-400>{{ tableData[0]?.length || 0 }}</div>
                <div text-xs op-50>{{ t('column').value }}</div>
              </div>
              <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
              <div text-center>
                <div text-2xl font-bold text-purple-400>{{ tableData.length }}</div>
                <div text-xs op-50>{{ t('row').value }}</div>
              </div>
              <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
              <div text-center>
                <div text-2xl font-bold text-emerald-400>{{ markdownOutput.length }}</div>
                <div text-xs op-50>{{ lang === 'zh' ? '字符' : 'Chars' }}</div>
              </div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
input:focus {
  border-color: rgba(139, 92, 246, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.15);
}

textarea:focus {
  border-color: rgba(139, 92, 246, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.15);
}
</style>
