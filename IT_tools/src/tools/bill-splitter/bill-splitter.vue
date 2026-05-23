<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { NButton, NInputNumber, NGrid, NGi, NSwitch, NIcon, NInput } from 'naive-ui';
import { Copy, Refresh, Plus, Trash, Users } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: 'AA 付款计算器',
    subtitle: '轻松分摊账单，支持项目分配、共享费用、智能结算',
    addItem: '添加项目',
    itemName: '项目名称',
    amount: '金额',
    assignTo: '分配给',
    sharedItems: '共享费用',
    sharedAmount: '共享金额',
    splitEqually: '均摊',
    subtotal: '小计',
    tax: '税费/服务费',
    tip: '小费',
    total: '总计',
    perPerson: '每人应付',
    settlement: '结算方案',
    pays: '需支付',
    to: '→',
    personName: '姓名',
    addPerson: '添加人员',
    quickAdd: '快捷添加',
    reset: '重置',
    copyResult: '复制结果',
    copied: '已复制！',
    noItems: '点击"添加项目"开始记账',
    evenlySplit: '全部均摊',
    customSplit: '自定义分配',
    sharedNote: '共享费用由所有人均摊',
    summary: '汇总',
    currency: '¥',
    people: '人',
    deleteItem: '删除',
    deletePerson: '删除',
    totalShared: '共享费用总计',
    totalAssigned: '分配费用总计',
    grandTotal: '账单总额',
    balanceDetail: '明细',
    owes: '欠',
    self: '自己',
    person1: '小明',
    person2: '小红',
    person3: '小华',
    item1: '主菜',
    item2: '饮品',
    item3: '甜点',
  },
  en: {
    title: 'Bill Splitter',
    subtitle: 'Split bills easily with item assignment, shared costs, and smart settlement',
    addItem: 'Add Item',
    itemName: 'Item Name',
    amount: 'Amount',
    assignTo: 'Assign To',
    sharedItems: 'Shared Costs',
    sharedAmount: 'Shared Amount',
    splitEqually: 'Split Equally',
    subtotal: 'Subtotal',
    tax: 'Tax / Service',
    tip: 'Tip',
    total: 'Total',
    perPerson: 'Per Person',
    settlement: 'Settlement',
    pays: 'pays',
    to: '→',
    personName: 'Name',
    addPerson: 'Add Person',
    quickAdd: 'Quick Add',
    reset: 'Reset',
    copyResult: 'Copy Result',
    copied: 'Copied!',
    noItems: 'Click "Add Item" to start',
    evenlySplit: 'Split All Evenly',
    customSplit: 'Custom Assignment',
    sharedNote: 'Shared costs are split equally among all',
    summary: 'Summary',
    currency: '$',
    people: 'people',
    deleteItem: 'Delete',
    deletePerson: 'Delete',
    totalShared: 'Total Shared',
    totalAssigned: 'Total Assigned',
    grandTotal: 'Grand Total',
    balanceDetail: 'Details',
    owes: 'owes',
    self: 'self',
    person1: 'Alice',
    person2: 'Bob',
    person3: 'Charlie',
    item1: 'Main Course',
    item2: 'Drinks',
    item3: 'Dessert',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== State =====================
interface Person {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  amount: number;
  assignedTo: string[]; // person IDs; empty = shared
}

let nextId = 1;
const uid = () => `id_${nextId++}_${Date.now()}`;

// People
const people = ref<Person[]>([
  { id: uid(), name: labels.zh.person1 },
  { id: uid(), name: labels.zh.person2 },
]);

// Items
const items = ref<Item[]>([]);

// Tax and tip
const taxPercent = ref(0);
const tipPercent = ref(0);

// ===================== Computed =====================

// Subtotal (sum of all items)
const subtotal = computed(() => items.value.reduce((sum, item) => sum + item.amount, 0));

// Tax and tip amounts
const taxAmount = computed(() => subtotal.value * (taxPercent.value / 100));
const tipAmount = computed(() => subtotal.value * (tipPercent.value / 100));
const grandTotal = computed(() => subtotal.value + taxAmount.value + tipAmount.tipAmount);

// Shared items total (items with no specific assignment)
const sharedTotal = computed(() => {
  return items.value
    .filter(item => item.assignedTo.length === 0)
    .reduce((sum, item) => sum + item.amount, 0);
});

// Per-person balance
const personBalances = computed(() => {
  const balances: Record<string, number> = {};
  const n = people.value.length || 1;

  // Initialize
  people.value.forEach(p => { balances[p.id] = 0; });

  // Shared costs (split equally)
  const sharedPerPerson = sharedTotal.value / n;
  people.value.forEach(p => {
    balances[p.id] += sharedPerPerson;
  });

  // Assigned items
  items.value.forEach(item => {
    if (item.assignedTo.length > 0) {
      const perPerson = item.amount / item.assignedTo.length;
      item.assignedTo.forEach(pid => {
        if (balances[pid] !== undefined) {
          balances[pid] += perPerson;
        }
      });
    }
  });

  // Add proportional tax and tip to each person
  const totalBeforeExtras = Object.values(balances).reduce((s, v) => s + v, 0) || 1;
  people.value.forEach(p => {
    const ratio = balances[p.id] / totalBeforeExtras;
    balances[p.id] += taxAmount.value * ratio + tipAmount.value * ratio;
  });

  return balances;
});

// Settlements (simplified: who pays whom)
const settlements = computed(() => {
  const balances = { ...personBalances.value };
  const avg = grandTotal.value / (people.value.length || 1);
  const results: { from: string; to: string; amount: number }[] = [];

  // Calculate deviation from average
  const deviations: Record<string, number> = {};
  people.value.forEach(p => {
    deviations[p.id] = balances[p.id] - avg;
  });

  // Simple settlement: those above average pay those below
  const debtors = people.value.filter(p => deviations[p.id] < 0).sort((a, b) => deviations[a.id] - deviations[b.id]);
  const creditors = people.value.filter(p => deviations[p.id] > 0).sort((a, b) => deviations[b.id] - deviations[a.id]);

  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];
    const debt = Math.abs(deviations[debtor.id]);
    const credit = deviations[creditor.id];

    if (debt <= 0.01) { di++; continue; }
    if (credit <= 0.01) { ci++; continue; }

    const amount = Math.min(debt, credit);
    if (amount > 0.01) {
      results.push({ from: debtor.id, to: creditor.id, amount });
      deviations[debtor.id] += amount;
      deviations[creditor.id] -= amount;
    }

    if (Math.abs(deviations[debtor.id]) < 0.01) di++;
    if (Math.abs(deviations[creditor.id]) < 0.01) ci++;
  }

  return results;
});

// ===================== Actions =====================

function addPerson() {
  const id = uid();
  people.value.push({
    id,
    name: `${t('personName').value} ${people.value.length + 1}`,
  });
}

function removePerson(id: string) {
  if (people.value.length <= 2) return;
  people.value = people.value.filter(p => p.id !== id);
  // Remove from item assignments
  items.value.forEach(item => {
    item.assignedTo = item.assignedTo.filter(pid => pid !== id);
  });
}

function addItem() {
  items.value.push({
    id: uid(),
    name: '',
    amount: 0,
    assignedTo: [], // empty = shared
  });
}

function removeItem(id: string) {
  items.value = items.value.filter(item => item.id !== id);
}

function togglePersonAssignment(itemId: string, personId: string) {
  const item = items.value.find(i => i.id === itemId);
  if (!item) return;
  const idx = item.assignedTo.indexOf(personId);
  if (idx >= 0) {
    item.assignedTo.splice(idx, 1);
  } else {
    item.assignedTo.push(personId);
  }
}

function isAssignedTo(itemId: string, personId: string) {
  return items.value.find(i => i.id === itemId)?.assignedTo.includes(personId) ?? false;
}

function isShared(itemId: string) {
  return items.value.find(i => i.id === itemId)?.assignedTo.length === 0 ?? true;
}

function setAllShared() {
  items.value.forEach(item => { item.assignedTo = []; });
}

function resetAll() {
  items.value = [];
  taxPercent.value = 0;
  tipPercent.value = 0;
}

// Copy result
const justCopied = ref(false);
function copyResult() {
  const lines = people.value.map(p => {
    const balance = personBalances.value[p.id];
    return `${p.name}: ${t('currency').value}${balance.toFixed(2)}`;
  });
  navigator.clipboard.writeText(lines.join('\n'));
  justCopied.value = true;
  setTimeout(() => { justCopied.value = false; }, 1500);
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <n-grid :cols="24" :x-gap="16" responsive="screen" item-responsive>
        <!-- Left: Input -->
        <n-gi span="24 m:14">
          <!-- People Card -->
          <c-card mb-4>
            <div flex justify-between items-center mb-4>
              <div text-lg font-bold>👥 {{ lang === 'zh' ? '参与人员' : 'People' }}</div>
              <n-button size="small" type="primary" round @click="addPerson">
                <template #icon><n-icon><Plus /></n-icon></template>
                {{ t('addPerson').value }}
              </n-button>
            </div>
            <div flex flex-wrap gap-2>
              <div
                v-for="person in people"
                :key="person.id"
                flex items-center gap-2
                px-3 py-2 rounded-lg
                style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);"
              >
                <n-input
                  :value="person.name"
                  @update:value="person.name = $event"
                  size="small"
                  style="width: 80px"
                  placeholder="Name"
                />
                <n-button
                  v-if="people.length > 2"
                  size="tiny"
                  quaternary
                  type="error"
                  circle
                  @click="removePerson(person.id)"
                >
                  ✕
                </n-button>
              </div>
            </div>
            <div mt-2 text-xs op-40>{{ people.length }} {{ t('people').value }}</div>
          </c-card>

          <!-- Items Card -->
          <c-card mb-4>
            <div flex justify-between items-center mb-4>
              <div text-lg font-bold>🍽️ {{ lang === 'zh' ? '消费项目' : 'Items' }}</div>
              <div flex gap-2>
                <n-button size="small" quaternary round @click="setAllShared">{{ t('evenlySplit').value }}</n-button>
                <n-button size="small" type="primary" round @click="addItem">
                  <template #icon><n-icon><Plus /></n-icon></template>
                  {{ t('addItem').value }}
                </n-button>
              </div>
            </div>

            <div v-if="items.length === 0" text-center py-6>
              <div text-3xl mb-2>🧾</div>
              <div text-sm op-50>{{ t('noItems').value }}</div>
            </div>

            <div v-else flex flex-col gap-3>
              <div
                v-for="item in items"
                :key="item.id"
                p-4 rounded-xl
                style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);"
              >
                <div flex justify-between items-center mb-3>
                  <n-input
                    :value="item.name"
                    @update:value="item.name = $event"
                    size="small"
                    :placeholder="t('itemName').value"
                    style="width: 140px"
                  />
                  <n-input-number
                    :value="item.amount"
                    @update:value="item.amount = $event || 0"
                    :min="0"
                    :step="1"
                    size="small"
                    style="width: 120px"
                  >
                    <template #prefix>{{ t('currency').value }}</template>
                  </n-input-number>
                  <n-button size="tiny" quaternary type="error" circle @click="removeItem(item.id)">
                    <template #icon><n-icon><Trash /></n-icon></template>
                  </n-button>
                </div>

                <!-- Assignment -->
                <div>
                  <div text-xs op-50 mb-2>{{ t('assignTo').value }}</div>
                  <div flex flex-wrap gap-2>
                    <button
                      :class="isShared(item.id) ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/40'"
                      px-3 py-1 rounded-full text-xs border transition-all
                      @click="item.assignedTo = []"
                    >
                      {{ t('splitEqually').value }}
                    </button>
                    <button
                      v-for="person in people"
                      :key="person.id"
                      :class="isAssignedTo(item.id, person.id) ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/40'"
                      px-3 py-1 rounded-full text-xs border transition-all
                      @click="togglePersonAssignment(item.id, person.id)"
                    >
                      {{ person.name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </c-card>

          <!-- Tax & Tip Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-4>💵 {{ lang === 'zh' ? '额外费用' : 'Extras' }}</div>
            <n-grid :cols="2" :x-gap="12">
              <n-gi>
                <div flex justify-between text-sm mb-1>
                  <span op-70>{{ t('tax').value }}</span>
                  <span font-bold>{{ taxPercent }}%</span>
                </div>
                <n-slider v-model:value="taxPercent" :min="0" :max="30" :step="0.5" />
              </n-gi>
              <n-gi>
                <div flex justify-between text-sm mb-1>
                  <span op-70>{{ t('tip').value }}</span>
                  <span font-bold>{{ tipPercent }}%</span>
                </div>
                <n-slider v-model:value="tipPercent" :min="0" :max="30" :step="0.5" />
              </n-gi>
            </n-grid>
          </c-card>
        </n-gi>

        <!-- Right: Results -->
        <n-gi span="24 m:10">
          <!-- Summary Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('summary').value }}</div>

            <!-- Grand Total -->
            <div text-center mb-6>
              <div text-sm op-60 mb-1>{{ t('grandTotal').value }}</div>
              <div text-4xl font-bold text-amber-400>{{ t('currency').value }}{{ grandTotal.toFixed(2) }}</div>
              <div v-if="people.length > 0" mt-1 text-sm op-50>
                {{ t('perPerson').value }}: {{ t('currency').value }}{{ (grandTotal / people.length).toFixed(2) }}
              </div>
            </div>

            <!-- Detail Cards -->
            <div grid grid-cols-3 gap-2 mb-4>
              <div p-3 rounded-lg text-center style="background: rgba(255,255,255,0.03);">
                <div text-xs op-50 mb-1>{{ t('subtotal').value }}</div>
                <div text-lg font-bold>{{ t('currency').value }}{{ subtotal.toFixed(2) }}</div>
              </div>
              <div p-3 rounded-lg text-center style="background: rgba(255,255,255,0.03);">
                <div text-xs op-50 mb-1>{{ t('tax').value }}</div>
                <div text-lg font-bold>{{ t('currency').value }}{{ taxAmount.toFixed(2) }}</div>
              </div>
              <div p-3 rounded-lg text-center style="background: rgba(255,255,255,0.03);">
                <div text-xs op-50 mb-1>{{ t('tip').value }}</div>
                <div text-lg font-bold>{{ t('currency').value }}{{ tipAmount.toFixed(2) }}</div>
              </div>
            </div>

            <!-- Per Person Breakdown -->
            <div text-sm font-bold mb-3>{{ t('balanceDetail').value }}</div>
            <div flex flex-col gap-2>
              <div
                v-for="person in people"
                :key="person.id"
                flex justify-between items-center
                p-3 rounded-lg
                style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);"
              >
                <span text-sm>{{ person.name }}</span>
                <span text-sm font-bold text-amber-400>{{ t('currency').value }}{{ personBalances[person.id]?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
          </c-card>

          <!-- Settlement Card -->
          <c-card v-if="settlements.length > 0" mb-4>
            <div text-lg font-bold mb-4>🤝 {{ t('settlement').value }}</div>
            <div flex flex-col gap-2>
              <div
                v-for="(s, i) in settlements"
                :key="i"
                flex items-center justify-center gap-3
                p-3 rounded-lg
                style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15);"
              >
                <span text-sm font-bold>{{ people.find(p => p.id === s.from)?.name }}</span>
                <span text-xs op-50>{{ t('pays').value }}</span>
                <span text-lg font-bold text-indigo-400>{{ t('currency').value }}{{ s.amount.toFixed(2) }}</span>
                <span text-xs op-50>{{ t('to').value }}</span>
                <span text-sm font-bold>{{ people.find(p => p.id === s.to)?.name }}</span>
              </div>
            </div>
          </c-card>

          <!-- Actions -->
          <div flex gap-3>
            <n-button block quaternary round @click="resetAll">
              <template #icon><n-icon><Refresh /></n-icon></template>
              {{ t('reset').value }}
            </n-button>
            <n-button block type="primary" round @click="copyResult" :disabled="items.length === 0">
              <template #icon><n-icon><Copy /></n-icon></template>
              {{ justCopied ? t('copied').value : t('copyResult').value }}
            </n-button>
          </div>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
button {
  cursor: pointer;
}
</style>
