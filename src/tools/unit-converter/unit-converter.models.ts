// 单位转换模型 - 以 SI 单位为基准进行转换

// ===== 长度 (米) =====
export const lengthUnits: Record<string, { name: string; unit: string; toBase: (v: number) => number; fromBase: (v: number) => number }> = {
  meter: { name: '米', unit: 'm', toBase: v => v, fromBase: v => v },
  kilometer: { name: '千米', unit: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
  centimeter: { name: '厘米', unit: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
  millimeter: { name: '毫米', unit: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
  mile: { name: '英里', unit: 'mi', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
  yard: { name: '码', unit: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
  foot: { name: '英尺', unit: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
  inch: { name: '英寸', unit: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
};

// ===== 重量 (千克) =====
export const weightUnits = {
  kilogram: { name: '千克', unit: 'kg', toBase: (v: number) => v, fromBase: (v: number) => v },
  gram: { name: '克', unit: 'g', toBase: (v: number) => v / 1000, fromBase: (v: number) => v * 1000 },
  milligram: { name: '毫克', unit: 'mg', toBase: (v: number) => v / 1e6, fromBase: (v: number) => v * 1e6 },
  ton: { name: '吨', unit: 't', toBase: (v: number) => v * 1000, fromBase: (v: number) => v / 1000 },
  pound: { name: '磅', unit: 'lb', toBase: (v: number) => v * 0.453592, fromBase: (v: number) => v / 0.453592 },
  ounce: { name: '盎司', unit: 'oz', toBase: (v: number) => v * 0.0283495, fromBase: (v: number) => v / 0.0283495 },
};

// ===== 面积 (平方米) =====
export const areaUnits = {
  squareMeter: { name: '平方米', unit: 'm²', toBase: (v: number) => v, fromBase: (v: number) => v },
  squareKilometer: { name: '平方千米', unit: 'km²', toBase: (v: number) => v * 1e6, fromBase: (v: number) => v / 1e6 },
  squareCentimeter: { name: '平方厘米', unit: 'cm²', toBase: (v: number) => v / 1e4, fromBase: (v: number) => v * 1e4 },
  hectare: { name: '公顷', unit: 'ha', toBase: (v: number) => v * 1e4, fromBase: (v: number) => v / 1e4 },
  acre: { name: '英亩', unit: 'ac', toBase: (v: number) => v * 4046.86, fromBase: (v: number) => v / 4046.86 },
  squareMile: { name: '平方英里', unit: 'mi²', toBase: (v: number) => v * 2.59e6, fromBase: (v: number) => v / 2.59e6 },
  squareFoot: { name: '平方英尺', unit: 'ft²', toBase: (v: number) => v * 0.092903, fromBase: (v: number) => v / 0.092903 },
};

// ===== 体积 (升) =====
export const volumeUnits = {
  liter: { name: '升', unit: 'L', toBase: (v: number) => v, fromBase: (v: number) => v },
  milliliter: { name: '毫升', unit: 'mL', toBase: (v: number) => v / 1000, fromBase: (v: number) => v * 1000 },
  cubicMeter: { name: '立方米', unit: 'm³', toBase: (v: number) => v * 1000, fromBase: (v: number) => v / 1000 },
  gallon: { name: '加仑(美)', unit: 'gal', toBase: (v: number) => v * 3.78541, fromBase: (v: number) => v / 3.78541 },
  quart: { name: '夸脱(美)', unit: 'qt', toBase: (v: number) => v * 0.946353, fromBase: (v: number) => v / 0.946353 },
  pint: { name: '品脱(美)', unit: 'pt', toBase: (v: number) => v * 0.473176, fromBase: (v: number) => v / 0.473176 },
  cup: { name: '杯(美)', unit: 'cup', toBase: (v: number) => v * 0.236588, fromBase: (v: number) => v / 0.236588 },
  tablespoon: { name: '汤匙', unit: 'tbsp', toBase: (v: number) => v * 0.0147868, fromBase: (v: number) => v / 0.0147868 },
  teaspoon: { name: '茶匙', unit: 'tsp', toBase: (v: number) => v * 0.00492892, fromBase: (v: number) => v / 0.00492892 },
};

// ===== 速度 (米/秒) =====
export const speedUnits = {
  meterPerSecond: { name: '米/秒', unit: 'm/s', toBase: (v: number) => v, fromBase: (v: number) => v },
  kilometerPerHour: { name: '千米/时', unit: 'km/h', toBase: (v: number) => v / 3.6, fromBase: (v: number) => v * 3.6 },
  milePerHour: { name: '英里/时', unit: 'mph', toBase: (v: number) => v * 0.44704, fromBase: (v: number) => v / 0.44704 },
  knot: { name: '节', unit: 'kn', toBase: (v: number) => v * 0.514444, fromBase: (v: number) => v / 0.514444 },
  footPerSecond: { name: '英尺/秒', unit: 'ft/s', toBase: (v: number) => v * 0.3048, fromBase: (v: number) => v / 0.3048 },
};

// ===== 时间 (秒) =====
export const timeUnits = {
  second: { name: '秒', unit: 's', toBase: (v: number) => v, fromBase: (v: number) => v },
  minute: { name: '分钟', unit: 'min', toBase: (v: number) => v * 60, fromBase: (v: number) => v / 60 },
  hour: { name: '小时', unit: 'h', toBase: (v: number) => v * 3600, fromBase: (v: number) => v / 3600 },
  day: { name: '天', unit: 'd', toBase: (v: number) => v * 86400, fromBase: (v: number) => v / 86400 },
  week: { name: '周', unit: 'wk', toBase: (v: number) => v * 604800, fromBase: (v: number) => v / 604800 },
  month: { name: '月', unit: 'mo', toBase: (v: number) => v * 2592000, fromBase: (v: number) => v / 2592000 },
  year: { name: '年', unit: 'yr', toBase: (v: number) => v * 31536000, fromBase: (v: number) => v / 31536000 },
  millisecond: { name: '毫秒', unit: 'ms', toBase: (v: number) => v / 1000, fromBase: (v: number) => v * 1000 },
};

// ===== 数据存储 (字节) =====
export const dataUnits = {
  byte: { name: '字节', unit: 'B', toBase: (v: number) => v, fromBase: (v: number) => v },
  kilobyte: { name: '千字节', unit: 'KB', toBase: (v: number) => v * 1024, fromBase: (v: number) => v / 1024 },
  megabyte: { name: '兆字节', unit: 'MB', toBase: (v: number) => v * 1024 * 1024, fromBase: (v: number) => v / (1024 * 1024) },
  gigabyte: { name: '吉字节', unit: 'GB', toBase: (v: number) => v * 1024 * 1024 * 1024, fromBase: (v: number) => v / (1024 * 1024 * 1024) },
  terabyte: { name: '太字节', unit: 'TB', toBase: (v: number) => v * 1024 * 1024 * 1024 * 1024, fromBase: (v: number) => v / (1024 * 1024 * 1024 * 1024) },
  bit: { name: '比特', unit: 'bit', toBase: (v: number) => v / 8, fromBase: (v: number) => v * 8 },
  kilobit: { name: '千比特', unit: 'Kbit', toBase: (v: number) => v * 128, fromBase: (v: number) => v / 128 },
  megabit: { name: '兆比特', unit: 'Mbit', toBase: (v: number) => v * 128 * 1024, fromBase: (v: number) => v / (128 * 1024) },
};

// 单位类别
export const unitCategories = [
  { key: 'length', name: '长度', nameEn: 'Length', units: lengthUnits },
  { key: 'weight', name: '重量', nameEn: 'Weight', units: weightUnits },
  { key: 'area', name: '面积', nameEn: 'Area', units: areaUnits },
  { key: 'volume', name: '体积', nameEn: 'Volume', units: volumeUnits },
  { key: 'speed', name: '速度', nameEn: 'Speed', units: speedUnits },
  { key: 'time', name: '时间', nameEn: 'Time', units: timeUnits },
  { key: 'data', name: '数据', nameEn: 'Data', units: dataUnits },
];
