export interface FilterPresetItem<T> {
  id: string;
  name: string;
  values: T;
  createdAt: string;
  updatedAt: string;
}

const FILTER_PRESET_STORAGE_PREFIX = "platform-console.filter-presets.v1";

export function getFilterPresetStorageKey(scope: string) {
  return `${FILTER_PRESET_STORAGE_PREFIX}:${scope}`;
}

export function loadFilterPresets<T>(scope: string): FilterPresetItem<T>[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getFilterPresetStorageKey(scope));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as FilterPresetItem<T>[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        typeof item?.id === "string" &&
        typeof item?.name === "string" &&
        typeof item?.createdAt === "string" &&
        typeof item?.updatedAt === "string"
    );
  } catch {
    return [];
  }
}

export function persistFilterPresets<T>(scope: string, presets: FilterPresetItem<T>[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getFilterPresetStorageKey(scope), JSON.stringify(presets));
}
