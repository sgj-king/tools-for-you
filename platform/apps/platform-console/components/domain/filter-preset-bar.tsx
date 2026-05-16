"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { usePathname } from "next/navigation";
import { useSessionUserQuery } from "@/hooks/use-console-data";
import { FilterPresetItem, loadFilterPresets, persistFilterPresets } from "@/lib/filter-presets";
import { hasRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { filterPresetApi } from "@/services/sdk/console-api";
import type { FilterPresetRecord } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const useRemotePresetStore = process.env.NEXT_PUBLIC_ENABLE_PLATFORM_BFF === "true";

type PresetVisibility = "private" | "organization";
type PresetViewFilter = "all" | PresetVisibility;
type PresetSortBy = "custom_order" | "updated_desc" | "created_desc" | "recent_used_desc" | "name_asc" | "owner_asc";

type PresetEntry<T extends Record<string, unknown>> = {
  id: string;
  name: string;
  values: T;
  groupName?: string | null;
  tags: string[];
  visibility: PresetVisibility;
  isDefault: boolean;
  isPinned: boolean;
  sortOrder: number;
  ownerUserId?: string;
  ownerDisplayName?: string;
  orgName?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
};

type PendingImportItem = {
  name: string;
  values: Record<string, unknown>;
  groupName?: string;
  tags: string[];
  visibility: PresetVisibility;
  isDefault: boolean;
  isPinned: boolean;
  sortOrder?: number;
};

type ImportPreviewEntry<T extends Record<string, unknown>> = {
  item: PendingImportItem;
  status: "create" | "update" | "skip";
  reason: string;
  existingPreset?: PresetEntry<T>;
};

interface FilterPresetBarProps<T extends Record<string, unknown>> {
  scope: string;
  currentValues: T;
  defaultValues: T;
  onApply: (values: T) => void;
  serialize: (values: T) => URLSearchParams;
  className?: string;
  title?: string;
  description?: string;
  maxPresets?: number;
}

function normalizeLocalPreset<T extends Record<string, unknown>>(item: FilterPresetItem<T>): PresetEntry<T> {
  return {
    id: item.id,
    name: item.name,
    values: item.values,
    groupName: null,
    tags: [],
    visibility: "private",
    isDefault: false,
    isPinned: false,
    sortOrder: 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastUsedAt: null
  };
}

function normalizeRemotePreset<T extends Record<string, unknown>>(item: FilterPresetRecord): PresetEntry<T> {
  return {
    id: item.id,
    name: item.name,
    values: item.values as T,
    groupName: item.groupName ?? null,
    tags: item.tags ?? [],
    visibility: item.visibility,
    isDefault: item.isDefault,
    isPinned: item.isPinned ?? false,
    sortOrder: item.sortOrder ?? 0,
    ownerUserId: item.ownerUserId,
    ownerDisplayName: item.ownerDisplayName,
    orgName: item.orgName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastUsedAt: item.lastUsedAt ?? null
  };
}

export function FilterPresetBar<T extends Record<string, unknown>>({
  scope,
  currentValues,
  defaultValues,
  onApply,
  serialize,
  className,
  title = "高级筛选方案",
  description = "保存常用筛选、复制当前分享链接，或一键恢复默认筛选。",
  maxPresets = 10
}: FilterPresetBarProps<T>) {
  const pathname = usePathname();
  const session = useSessionUserQuery();
  const [presets, setPresets] = useState<PresetEntry<T>[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetGroupName, setPresetGroupName] = useState("");
  const [presetTagsInput, setPresetTagsInput] = useState("");
  const [presetVisibility, setPresetVisibility] = useState<PresetVisibility>("private");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetEntry<T> | null>(null);
  const [presetSearch, setPresetSearch] = useState("");
  const [presetViewFilter, setPresetViewFilter] = useState<PresetViewFilter>("all");
  const [presetSortBy, setPresetSortBy] = useState<PresetSortBy>("custom_order");
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [draggingPresetId, setDraggingPresetId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [pendingImportItems, setPendingImportItems] = useState<PendingImportItem[]>([]);
  const [selectedImportKeys, setSelectedImportKeys] = useState<string[]>([]);
  const [importSourceScope, setImportSourceScope] = useState<string>(scope);
  const [importOverwriteExisting, setImportOverwriteExisting] = useState(true);
  const [importPreviewFileName, setImportPreviewFileName] = useState("");
  const [presetGroupFilter, setPresetGroupFilter] = useState<string>("all");
  const defaultAppliedRef = useRef<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const currentSignature = useMemo(() => serialize(currentValues).toString(), [currentValues, serialize]);
  const baseDefaultSignature = useMemo(() => serialize(defaultValues).toString(), [defaultValues, serialize]);

  const canManageSharedPresets = session.data ? hasRole(session.data.role, "project_admin") : false;
  const normalizeTags = (value: string) =>
    value
      .split(/[,\n，]/)
      .map((item) => item.trim())
      .filter((item, index, items) => item.length > 0 && items.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index);

  const loadPresets = async () => {
    setIsLoading(true);
    try {
      if (useRemotePresetStore && session.data) {
        const items = await filterPresetApi.list(session.data, { scope });
        setPresets(items.map((item) => normalizeRemotePreset<T>(item)));
      } else {
        setPresets(loadFilterPresets<T>(scope).map((item) => normalizeLocalPreset(item)));
      }
    } catch (error) {
      console.warn(error);
      setFeedback("加载筛选方案失败，请稍后重试。");
      setPresets(loadFilterPresets<T>(scope).map((item) => normalizeLocalPreset(item)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPresets();
  }, [scope, session.data?.id]);

  useEffect(() => {
    setSelectedPresetIds((current) => current.filter((id) => presets.some((preset) => preset.id === id)));
  }, [presets]);

  const preferredDefaultPreset = useMemo(() => {
    const personalDefault = presets.find((item) => item.isDefault && item.visibility === "private");
    if (personalDefault) return personalDefault;
    return presets.find((item) => item.isDefault);
  }, [presets]);

  const activePreset = useMemo(() => presets.find((item) => serialize(item.values).toString() === currentSignature), [currentSignature, presets, serialize]);

  const filteredPresets = useMemo(() => {
    const keyword = presetSearch.trim().toLowerCase();
    const filtered = presets.filter((item) => {
      if (presetViewFilter !== "all" && item.visibility !== presetViewFilter) {
        return false;
      }
      if (presetGroupFilter !== "all" && (item.groupName ?? "未分组") !== presetGroupFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const searchable = [item.name, item.groupName ?? "", item.tags.join(" "), item.ownerDisplayName ?? "", item.orgName ?? ""].join(" ").toLowerCase();
      return searchable.includes(keyword);
    });

    return filtered.sort((left, right) => {
      switch (presetSortBy) {
        case "custom_order": {
          if (left.isPinned !== right.isPinned) {
            return Number(right.isPinned) - Number(left.isPinned);
          }
          const leftOrder = left.sortOrder > 0 ? left.sortOrder : Number.MAX_SAFE_INTEGER;
          const rightOrder = right.sortOrder > 0 ? right.sortOrder : Number.MAX_SAFE_INTEGER;
          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        }
        case "created_desc":
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        case "recent_used_desc":
          return new Date(right.lastUsedAt ?? right.updatedAt).getTime() - new Date(left.lastUsedAt ?? left.updatedAt).getTime();
        case "name_asc":
          return left.name.localeCompare(right.name, "zh-CN");
        case "owner_asc":
          return (left.ownerDisplayName ?? "").localeCompare(right.ownerDisplayName ?? "", "zh-CN");
        case "updated_desc":
        default:
          if (left.isPinned !== right.isPinned) {
            return Number(right.isPinned) - Number(left.isPinned);
          }
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }
    });
  }, [presetGroupFilter, presetSearch, presetSortBy, presetViewFilter, presets]);

  const availableGroups = useMemo(() => {
    return Array.from(new Set(presets.map((item) => item.groupName?.trim() || "未分组"))).sort((left, right) => left.localeCompare(right, "zh-CN"));
  }, [presets]);

  const defaultConflictPreset = useMemo(() => {
    if (!saveAsDefault) return null;
    return presets.find((item) => item.isDefault && item.visibility === presetVisibility && item.id !== editingPreset?.id) ?? null;
  }, [editingPreset?.id, presetVisibility, presets, saveAsDefault]);

  const importPreviewEntries = useMemo<ImportPreviewEntry<T>[]>(() => {
    return pendingImportItems.map((item) => {
      const existingPreset =
        presets.find(
          (preset) => preset.visibility === item.visibility && preset.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        ) ?? undefined;

      if (item.visibility === "organization" && !canManageSharedPresets) {
        return {
          item,
          status: "skip",
          reason: "当前账号没有团队共享 Preset 导入权限",
          existingPreset
        };
      }

      if (existingPreset && !importOverwriteExisting) {
        return {
          item,
          status: "skip",
          reason: "同名方案已存在，当前策略为跳过现有方案",
          existingPreset
        };
      }

      if (existingPreset) {
        return {
          item,
          status: "update",
          reason: `将覆盖现有方案“${existingPreset.name}”`,
          existingPreset
        };
      }

      return {
        item,
        status: "create",
        reason: "将创建为新方案"
      };
    });
  }, [canManageSharedPresets, importOverwriteExisting, pendingImportItems, presets]);

  const selectableImportKeys = useMemo(
    () =>
      importPreviewEntries
        .map((entry, index) => ({ entry, key: `${entry.item.name}-${index}` }))
        .filter(({ entry }) => entry.status !== "skip")
        .map(({ key }) => key),
    [importPreviewEntries]
  );

  useEffect(() => {
    if (!importPreviewOpen) return;
    setSelectedImportKeys(selectableImportKeys);
  }, [importPreviewOpen, selectableImportKeys]);

  const importPreviewSummary = useMemo(() => {
    return importPreviewEntries.reduce(
      (summary, entry) => {
        summary[entry.status] += 1;
        return summary;
      },
      { create: 0, update: 0, skip: 0 }
    );
  }, [importPreviewEntries]);

  useEffect(() => {
    if (!preferredDefaultPreset) return;
    if (defaultAppliedRef.current === scope) return;
    if (currentSignature !== baseDefaultSignature) return;
    onApply(preferredDefaultPreset.values);
    defaultAppliedRef.current = scope;
    setFeedback(`已自动应用默认方案“${preferredDefaultPreset.name}”。`);
  }, [preferredDefaultPreset, currentSignature, baseDefaultSignature, onApply, scope]);

  const handleSavePreset = async () => {
    const name = presetName.trim();
    const groupName = presetGroupName.trim();
    const tags = normalizeTags(presetTagsInput);
    if (!name) {
      setFeedback("请输入方案名称后再保存。");
      return;
    }
    if (presetVisibility === "organization" && !canManageSharedPresets) {
      setFeedback("当前账号暂无团队共享方案权限，请切换为仅自己或使用更高权限账号。");
      return;
    }
    if (saveAsDefault && defaultConflictPreset) {
      const confirmed = window.confirm(`当前已有默认方案“${defaultConflictPreset.name}”。继续后将改为由“${name}”成为新的默认方案。是否继续？`);
      if (!confirmed) return;
    }

    setIsSaving(true);
    try {
      const existing = editingPreset ?? presets.find((item) => item.name.toLowerCase() === name.toLowerCase() && item.visibility === presetVisibility);
      if (useRemotePresetStore && session.data) {
        if (existing) {
          await filterPresetApi.update(session.data, existing.id, {
            name,
            values: currentValues,
            groupName,
            tags,
            visibility: presetVisibility,
            isDefault: saveAsDefault,
            isPinned: existing.isPinned,
            sortOrder: existing.sortOrder
          });
          setFeedback(`已更新筛选方案“${name}”。`);
        } else {
          await filterPresetApi.create(session.data, {
            scope,
            name,
            values: currentValues,
            groupName,
            tags,
            visibility: presetVisibility,
            isDefault: saveAsDefault,
            isPinned: false,
            sortOrder: presets.length + 1
          });
          setFeedback(`已保存筛选方案“${name}”。`);
        }
        await loadPresets();
      } else {
        const now = new Date().toISOString();
        const nextPreset: FilterPresetItem<T> = existing
          ? {
              id: existing.id,
              name,
              values: currentValues,
              createdAt: existing.createdAt,
              updatedAt: now
            }
          : {
              id: `preset_${Date.now()}`,
              name,
              values: currentValues,
              createdAt: now,
              updatedAt: now
            };
        const nextLocal = [nextPreset, ...loadFilterPresets<T>(scope).filter((item) => item.id !== nextPreset.id)].slice(0, maxPresets);
        persistFilterPresets(scope, nextLocal);
        setPresets(nextLocal.map((item) => normalizeLocalPreset(item)));
        setFeedback(existing ? `已更新筛选方案“${name}”。` : `已保存筛选方案“${name}”。`);
      }
      setPresetName("");
      setPresetGroupName("");
      setPresetTagsInput("");
      setPresetVisibility("private");
      setSaveAsDefault(false);
      setEditingPreset(null);
      setSaveOpen(false);
    } catch (error) {
      console.warn(error);
      setFeedback("保存筛选方案失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPreset(null);
    setPresetName(activePreset?.name ?? "");
    setPresetGroupName(activePreset?.groupName ?? "");
    setPresetTagsInput((activePreset?.tags ?? []).join(", "));
    setPresetVisibility(activePreset?.visibility ?? "private");
    setSaveAsDefault(activePreset?.isDefault ?? false);
    setSaveOpen(true);
  };

  const openEditDialog = (preset: PresetEntry<T>) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetGroupName(preset.groupName ?? "");
    setPresetTagsInput(preset.tags.join(", "));
    setPresetVisibility(preset.visibility);
    setSaveAsDefault(preset.isDefault);
    setSaveOpen(true);
  };

  const openDuplicateDialog = (preset: PresetEntry<T>) => {
    setEditingPreset(null);
    setPresetName(`${preset.name} 副本`);
    setPresetGroupName(preset.groupName ?? "");
    setPresetTagsInput(preset.tags.join(", "));
    setPresetVisibility(preset.visibility === "organization" && canManageSharedPresets ? "organization" : "private");
    setSaveAsDefault(false);
    onApply(preset.values);
    setFeedback(`已载入“${preset.name}”内容，可另存为新的筛选方案。`);
    setSaveOpen(true);
  };

  const handleDeletePreset = async (preset: PresetEntry<T>) => {
    try {
      if (useRemotePresetStore && session.data) {
        await filterPresetApi.remove(session.data, preset.id);
        await loadPresets();
      } else {
        const nextLocal = loadFilterPresets<T>(scope).filter((item) => item.id !== preset.id);
        persistFilterPresets(scope, nextLocal);
        setPresets(nextLocal.map((item) => normalizeLocalPreset(item)));
      }
      setFeedback(`已删除筛选方案“${preset.name}”。`);
    } catch (error) {
      console.warn(error);
      setFeedback("删除筛选方案失败，请稍后重试。");
    }
  };

  const handleBatchVisibilityUpdate = async (visibility: PresetVisibility) => {
    if (!useRemotePresetStore || !session.data || selectedPresetIds.length === 0) return;
    const selectedPresets = presets.filter((preset) => selectedPresetIds.includes(preset.id));
    const candidates = selectedPresets.filter((preset) => {
      if (visibility === "organization") return preset.visibility === "private" && canEditPreset(preset);
      return preset.visibility === "organization" && canEditPreset(preset);
    });

    if (candidates.length === 0) {
      setFeedback(visibility === "organization" ? "当前没有可共享到团队的方案。" : "当前没有可取消团队共享的方案。");
      return;
    }

    try {
      await Promise.all(
        candidates.map((preset) =>
          filterPresetApi.update(session.data!, preset.id, {
            name: preset.name,
            values: preset.values,
            visibility,
            isDefault: preset.isDefault,
            isPinned: preset.isPinned,
            sortOrder: preset.sortOrder
          })
        )
      );
      await loadPresets();
      setSelectedPresetIds([]);
      setFeedback(
        visibility === "organization"
          ? `已将 ${candidates.length} 个方案迁移为团队共享。`
          : `已将 ${candidates.length} 个方案取消团队共享。`
      );
    } catch (error) {
      console.warn(error);
      setFeedback(visibility === "organization" ? "批量共享失败，请稍后重试。" : "批量取消共享失败，请稍后重试。");
    }
  };

  const handleMakeDefault = async (preset: PresetEntry<T>) => {
    const currentDefault = presets.find((item) => item.isDefault && item.visibility === preset.visibility && item.id !== preset.id);
    if (currentDefault) {
      const confirmed = window.confirm(`当前默认方案是“${currentDefault.name}”。继续后将切换为“${preset.name}”。是否继续？`);
      if (!confirmed) return;
    }
    try {
      if (useRemotePresetStore && session.data) {
        await filterPresetApi.update(session.data, preset.id, {
          name: preset.name,
          values: preset.values,
          visibility: preset.visibility,
          isDefault: true,
          isPinned: preset.isPinned,
          sortOrder: preset.sortOrder
        });
        await loadPresets();
      } else {
        setFeedback("当前环境未启用服务端 Preset，默认方案仅在后端模式下可用。");
        return;
      }
      setFeedback(`已将“${preset.name}”设为默认方案。`);
    } catch (error) {
      console.warn(error);
      setFeedback("设置默认方案失败，请稍后重试。");
    }
  };

  const handleApplyPreset = async (preset: PresetEntry<T>) => {
    onApply(preset.values);
    if (useRemotePresetStore && session.data) {
      try {
        await filterPresetApi.update(session.data, preset.id, {
          markUsed: true,
          isPinned: preset.isPinned,
          sortOrder: preset.sortOrder
        });
        await loadPresets();
      } catch (error) {
        console.warn(error);
      }
    }
    setFeedback(`已应用筛选方案“${preset.name}”。`);
  };

  const handleTogglePinned = async (preset: PresetEntry<T>) => {
    if (!useRemotePresetStore || !session.data) {
      setFeedback("当前环境未启用服务端 Preset，暂不支持置顶收藏。");
      return;
    }
    if (!canEditPreset(preset)) {
      setFeedback("当前账号没有修改该筛选方案置顶状态的权限。");
      return;
    }
    try {
      await filterPresetApi.update(session.data, preset.id, {
        name: preset.name,
        values: preset.values,
        visibility: preset.visibility,
        isDefault: preset.isDefault,
        isPinned: !preset.isPinned,
        sortOrder: preset.sortOrder
      });
      await loadPresets();
      setFeedback(!preset.isPinned ? `已将“${preset.name}”加入置顶收藏。` : `已取消“${preset.name}”的置顶收藏。`);
    } catch (error) {
      console.warn(error);
      setFeedback("更新置顶状态失败，请稍后重试。");
    }
  };

  const handleResetDefaults = () => {
    if (preferredDefaultPreset) {
      onApply(preferredDefaultPreset.values);
      setFeedback(`已恢复默认方案“${preferredDefaultPreset.name}”。`);
      return;
    }
    onApply(defaultValues);
    setFeedback("已恢复系统默认筛选。");
  };

  const handleBatchDelete = async () => {
    if (!selectedPresetIds.length) return;
    const removable = presets.filter((preset) => selectedPresetIds.includes(preset.id) && canDeletePreset(preset));
    if (!removable.length) {
      setFeedback("当前没有可批量删除的筛选方案。");
      return;
    }
    if (!window.confirm(`确定删除选中的 ${removable.length} 个筛选方案吗？此操作不可恢复。`)) {
      return;
    }
    try {
      if (useRemotePresetStore && session.data) {
        await Promise.all(removable.map((preset) => filterPresetApi.remove(session.data!, preset.id)));
        await loadPresets();
      } else {
        const nextLocal = loadFilterPresets<T>(scope).filter((item) => !removable.some((preset) => preset.id === item.id));
        persistFilterPresets(scope, nextLocal);
        setPresets(nextLocal.map((item) => normalizeLocalPreset(item)));
      }
      setSelectedPresetIds([]);
      setFeedback(`已删除 ${removable.length} 个筛选方案。`);
    } catch (error) {
      console.warn(error);
      setFeedback("批量删除失败，请稍后重试。");
    }
  };

  const handleBatchMakeDefault = async () => {
    if (!useRemotePresetStore || !session.data) {
      setFeedback("当前环境未启用服务端 Preset，暂不支持批量设默认。");
      return;
    }
    const selectedCandidates = selectedPresetIds
      .map((id) => presets.find((preset) => preset.id === id) ?? null)
      .filter((preset): preset is PresetEntry<T> => preset !== null);
    const selectedDefaultable = selectedCandidates.filter((preset) => canMakeDefaultPreset(preset));

    if (!selectedDefaultable.length) {
      setFeedback("当前没有可设为默认的筛选方案。");
      return;
    }

    const grouped = selectedDefaultable.reduce<Record<PresetVisibility, PresetEntry<T>[]>>(
      (accumulator, preset) => {
        accumulator[preset.visibility].push(preset);
        return accumulator;
      },
      { private: [], organization: [] }
    );

    const winners = (["private", "organization"] as PresetVisibility[])
      .map((visibility) => {
        const group = grouped[visibility];
        return group.length ? group[group.length - 1] : null;
      })
      .filter((preset): preset is PresetEntry<T> => Boolean(preset));

    const conflicts = (["private", "organization"] as PresetVisibility[])
      .map((visibility) => grouped[visibility])
      .filter((group) => group.length > 1);

    if (conflicts.length > 0) {
      const conflictMessage = conflicts
        .map((group) => {
          const winner = group[group.length - 1];
          const names = group.map((item) => item.name).join("、");
          return `${winner.visibility === "organization" ? "团队" : "个人"}方案中你选中了多个：${names}。将以最后勾选的“${winner.name}”作为默认方案。`;
        })
        .join("\n");
      if (!window.confirm(`${conflictMessage}\n\n是否继续批量设默认？`)) {
        return;
      }
    }

    try {
      await Promise.all(
        winners.map((preset) =>
          filterPresetApi.update(session.data!, preset.id, {
            name: preset.name,
            values: preset.values,
            visibility: preset.visibility,
            isDefault: true,
            isPinned: preset.isPinned,
            sortOrder: preset.sortOrder
          })
        )
      );
      await loadPresets();
      setFeedback(`已批量更新默认方案：${winners.map((preset) => preset.name).join("、")}。`);
    } catch (error) {
      console.warn(error);
      setFeedback("批量设默认失败，请稍后重试。");
    }
  };

  const handleMovePreset = async (preset: PresetEntry<T>, direction: "up" | "down") => {
    if (!useRemotePresetStore || !session.data) {
      setFeedback("当前环境未启用服务端 Preset，暂不支持自定义顺序。");
      return;
    }
    if (!canEditPreset(preset)) {
      setFeedback("当前账号没有调整该筛选方案顺序的权限。");
      return;
    }
    const siblings = buildCustomOrderedSiblings(preset.visibility);
    const currentIndex = siblings.findIndex((item) => item.id === preset.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      setPresetSortBy("custom_order");
      await persistPresetOrder(reordered);
      await loadPresets();
      setFeedback(direction === "up" ? `已上移“${preset.name}”。` : `已下移“${preset.name}”。`);
    } catch (error) {
      console.warn(error);
      setFeedback("调整筛选方案顺序失败，请稍后重试。");
    }
  };

  const handleDropReorder = async (sourceId: string, targetId: string) => {
    if (!useRemotePresetStore || !session.data || sourceId === targetId) return;
    const source = presets.find((item) => item.id === sourceId);
    const target = presets.find((item) => item.id === targetId);
    if (!source || !target || source.visibility !== target.visibility) return;
    if (!canEditPreset(source) || !canEditPreset(target)) return;
    const siblings = buildCustomOrderedSiblings(source.visibility);
    const sourceIndex = siblings.findIndex((item) => item.id === source.id);
    const targetIndex = siblings.findIndex((item) => item.id === target.id);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      setPresetSortBy("custom_order");
      await persistPresetOrder(reordered);
      await loadPresets();
      setFeedback(`已将“${source.name}”移动到“${target.name}”附近。`);
    } catch (error) {
      console.warn(error);
      setFeedback("拖拽调整顺序失败，请稍后重试。");
    } finally {
      setDraggingPresetId(null);
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      const query = serialize(currentValues).toString();
      const shareUrl = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
      await navigator.clipboard.writeText(shareUrl);
      setFeedback("已复制当前筛选分享链接。");
    } catch {
      setFeedback("复制分享链接失败，请检查浏览器剪贴板权限。");
    }
  };

  const handleExportPresets = async () => {
    try {
      let blob: Blob;
      let filename = `filter-presets-${scope}.json`;
      if (useRemotePresetStore && session.data) {
        const response = await filterPresetApi.export(session.data, { scope });
        const disposition = response.headers.get("content-disposition");
        const matchedFilename = disposition?.match(/filename="?([^"]+)"?/i)?.[1];
        if (matchedFilename) {
          filename = matchedFilename;
        }
        blob = await response.blob();
      } else {
        blob = new Blob(
          [
            JSON.stringify(
              {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                scope,
                presets: presets.map((preset) => ({
                  id: preset.id,
                  scope,
                  name: preset.name,
                  values: preset.values,
                  visibility: preset.visibility,
                  isDefault: preset.isDefault,
                  isPinned: preset.isPinned,
                  sortOrder: preset.sortOrder,
                  createdAt: preset.createdAt,
                  updatedAt: preset.updatedAt,
                  lastUsedAt: preset.lastUsedAt ?? null
                }))
              },
              null,
              2
            )
          ],
          { type: "application/json" }
        );
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setFeedback("已导出当前页面的 Preset JSON。");
    } catch (error) {
      console.warn(error);
      setFeedback("导出 Preset 失败，请稍后重试。");
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { scope?: string; presets?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      const incomingScope = Array.isArray(parsed) ? scope : typeof parsed.scope === "string" ? parsed.scope : scope;
      const sourcePresets = Array.isArray(parsed) ? parsed : Array.isArray(parsed.presets) ? parsed.presets : [];
      if (!sourcePresets.length) {
        setFeedback("导入文件中没有可用的 Preset。");
        return;
      }
      if (incomingScope !== scope) {
        const confirmed = window.confirm(`导入文件的 scope 是“${incomingScope}”，当前页面 scope 是“${scope}”。将按当前页面 scope 导入。是否继续？`);
        if (!confirmed) return;
      }

      const normalized: PendingImportItem[] = sourcePresets
        .map((item) => {
          const name = typeof item.name === "string" ? item.name.trim() : "";
          if (!name) return null;
          const values = item.values && typeof item.values === "object" ? (item.values as Record<string, unknown>) : {};
          const visibility: PresetVisibility = item.visibility === "organization" ? "organization" : "private";
          const sortOrder = typeof item.sortOrder === "number" && item.sortOrder > 0 ? item.sortOrder : undefined;
          const groupName = typeof item.groupName === "string" ? item.groupName.trim() : "";
          const tags =
            Array.isArray(item.tags) && item.tags.every((tag) => typeof tag === "string")
              ? item.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
              : [];
          return {
            name,
            values,
            groupName,
            tags,
            visibility,
            isDefault: Boolean(item.isDefault),
            isPinned: Boolean(item.isPinned),
            sortOrder
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (!normalized.length) {
        setFeedback("导入文件解析成功，但没有有效的 Preset 条目。");
        return;
      }
      setImportSourceScope(incomingScope);
      setImportPreviewFileName(file.name);
      setImportOverwriteExisting(true);
      setPendingImportItems(normalized);
      setImportPreviewOpen(true);
    } catch (error) {
      console.warn(error);
      setFeedback("导入 Preset 失败，请确认 JSON 文件格式正确。");
    } finally {
      event.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    const importableItems = importPreviewEntries
      .map((entry, index) => ({ entry, key: `${entry.item.name}-${index}` }))
      .filter(({ entry, key }) => entry.status !== "skip" && selectedImportKeys.includes(key))
      .map(({ entry }) => entry.item);
    if (!importableItems.length) {
      setFeedback("当前导入预览中没有可执行的 Preset。");
      return;
    }

    setIsImporting(true);
    try {
      if (useRemotePresetStore && session.data) {
        const result = await filterPresetApi.import(session.data, { scope, presets: importableItems });
        await loadPresets();
        setFeedback(`导入完成：新增 ${result.created} 个，更新 ${result.updated} 个，跳过 ${result.skipped} 个。`);
      } else {
        const now = new Date().toISOString();
        const existingLocal = loadFilterPresets<T>(scope);
        const nextLocal = [...existingLocal];
        let createdCount = 0;
        let updatedCount = 0;

        importableItems.forEach((item, index) => {
          const existingIndex = nextLocal.findIndex((preset) => preset.name.trim().toLowerCase() === item.name.trim().toLowerCase());
          if (existingIndex >= 0) {
            nextLocal[existingIndex] = {
              ...nextLocal[existingIndex],
              name: item.name,
              values: item.values as T,
              updatedAt: now
            };
            updatedCount += 1;
            return;
          }
          nextLocal.unshift({
            id: `preset_import_${Date.now()}_${index}`,
            name: item.name,
            values: item.values as T,
            createdAt: now,
            updatedAt: now
          });
          createdCount += 1;
        });

        persistFilterPresets(scope, nextLocal.slice(0, maxPresets));
        setPresets(nextLocal.slice(0, maxPresets).map((item) => normalizeLocalPreset(item)));
        setFeedback(`本地导入完成：新增 ${createdCount} 个，更新 ${updatedCount} 个。`);
      }

      setImportPreviewOpen(false);
      setPendingImportItems([]);
      setSelectedImportKeys([]);
      setImportPreviewFileName("");
      setImportSourceScope(scope);
    } catch (error) {
      console.warn(error);
      setFeedback("确认导入 Preset 失败，请稍后重试。");
    } finally {
      setIsImporting(false);
    }
  };

  const canEditPreset = (preset: PresetEntry<T>) => {
    if (!useRemotePresetStore || !session.data) return true;
    if (preset.visibility === "organization") return canManageSharedPresets;
    return preset.ownerUserId === session.data.id;
  };

  const canDeletePreset = (preset: PresetEntry<T>) => {
    if (!useRemotePresetStore || !session.data) return true;
    if (preset.visibility === "organization") return canManageSharedPresets;
    return preset.ownerUserId === session.data.id;
  };

  const canDuplicatePreset = (preset: PresetEntry<T>) => {
    if (!useRemotePresetStore) return true;
    if (!session.data) return false;
    if (preset.visibility === "organization") return true;
    return preset.ownerUserId === session.data.id;
  };

  const canMakeDefaultPreset = (preset: PresetEntry<T>) => {
    if (!useRemotePresetStore || !session.data) return false;
    if (preset.visibility === "organization") return canManageSharedPresets;
    return preset.ownerUserId === session.data.id;
  };

  const buildCustomOrderedSiblings = (visibility: PresetVisibility) =>
    presets
      .filter((item) => item.visibility === visibility)
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return Number(right.isPinned) - Number(left.isPinned);
        }
        const leftOrder = left.sortOrder > 0 ? left.sortOrder : Number.MAX_SAFE_INTEGER;
        const rightOrder = right.sortOrder > 0 ? right.sortOrder : Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });

  const persistPresetOrder = async (nextOrderedPresets: PresetEntry<T>[]) => {
    if (!useRemotePresetStore || !session.data) return;
    const updates = nextOrderedPresets
      .map((preset, index) => ({ preset, nextOrder: index + 1 }))
      .filter(({ preset, nextOrder }) => preset.sortOrder !== nextOrder);

    if (updates.length === 0) return;

    await Promise.all(
      updates.map(({ preset, nextOrder }) =>
        filterPresetApi.update(session.data!, preset.id, {
          sortOrder: nextOrder,
          isPinned: preset.isPinned
        })
      )
    );
  };

  const allSelectablePresetIds = filteredPresets.filter((preset) => canEditPreset(preset)).map((preset) => preset.id);
  const allSelectableChecked = allSelectablePresetIds.length > 0 && allSelectablePresetIds.every((id) => selectedPresetIds.includes(id));

  const defaultSourceLabel = preferredDefaultPreset
    ? preferredDefaultPreset.visibility === "organization"
      ? "团队默认方案"
      : "个人默认方案"
    : "系统默认筛选";

  const activeSourceLabel = activePreset
    ? activePreset.visibility === "organization"
      ? activePreset.isDefault
        ? "当前使用团队默认方案"
        : "当前使用团队共享方案"
      : activePreset.isDefault
        ? "当前使用个人默认方案"
        : "当前使用个人方案"
    : currentSignature === baseDefaultSignature
      ? "当前使用系统默认筛选"
      : "当前使用临时未保存筛选";

  return (
    <div className={cn("rounded-3xl border border-border/70 bg-muted/30 p-4", className)}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openCreateDialog} disabled={isLoading || session.isPending}>
            保存当前方案
          </Button>
          <Button variant="secondary" onClick={() => void handleExportPresets()} disabled={isLoading}>
            导出 JSON
          </Button>
          <Button variant="secondary" onClick={() => importInputRef.current?.click()} disabled={isImporting}>
            {isImporting ? "导入中…" : "导入 JSON"}
          </Button>
          <Button variant="secondary" onClick={() => void handleCopyShareUrl()}>
            复制分享链接
          </Button>
          <Button variant="ghost" onClick={handleResetDefaults}>
            恢复默认筛选
          </Button>
        </div>
      </div>
      <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => void handleImportFile(event)} />

      <div className="mt-4 grid gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">默认方案来源</div>
          <div className="mt-2 text-sm font-medium">{defaultSourceLabel}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {preferredDefaultPreset ? `${preferredDefaultPreset.name} · ${preferredDefaultPreset.ownerDisplayName ?? "当前用户"}` : "未设置服务端默认方案时，将回落到系统默认筛选。"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">当前激活状态</div>
          <div className="mt-2 text-sm font-medium">{activeSourceLabel}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {activePreset ? `${activePreset.name} · 更新于 ${new Date(activePreset.updatedAt).toLocaleString("zh-CN")}` : "当前筛选未命中任何已保存 Preset。"}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-border/70 bg-card/60 p-4 text-xs text-muted-foreground">
        默认方案优先级：个人默认方案 &gt; 团队默认方案 &gt; 系统默认筛选。团队共享方案对成员默认只开放“应用 / 另存为”，编辑、删除、设默认需要项目管理员及以上权限。
      </div>

      {presetSortBy === "custom_order" ? (
        <div className="mt-3 rounded-2xl border border-border/70 bg-card/60 p-4 text-xs text-muted-foreground">
          你当前正在按自定义顺序查看方案。可使用“上移 / 下移”按钮，或直接拖拽可管理的方案卡片来调整顺序。
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 lg:grid-cols-[1.1fr,0.8fr,0.8fr,0.8fr]">
        <Input value={presetSearch} onChange={(event) => setPresetSearch(event.target.value)} placeholder="搜索方案名称 / 创建者 / 组织" />
        <select
          value={presetViewFilter}
          onChange={(event) => setPresetViewFilter(event.target.value as PresetViewFilter)}
          className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">全部方案</option>
          <option value="organization">仅团队共享</option>
          <option value="private">仅个人方案</option>
        </select>
        <select
          value={presetSortBy}
          onChange={(event) => setPresetSortBy(event.target.value as PresetSortBy)}
          className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="custom_order">按自定义顺序</option>
          <option value="updated_desc">按最近更新时间</option>
          <option value="created_desc">按创建时间</option>
          <option value="recent_used_desc">按最近使用</option>
          <option value="name_asc">按方案名称</option>
          <option value="owner_asc">按创建者</option>
        </select>
        <select
          value={presetGroupFilter}
          onChange={(event) => setPresetGroupFilter(event.target.value)}
          className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">全部分组</option>
          {availableGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      {useRemotePresetStore && canManageSharedPresets ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card/60 p-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={allSelectableChecked}
              onChange={(event) => {
                if (event.target.checked) {
                  setSelectedPresetIds(allSelectablePresetIds);
                } else {
                  setSelectedPresetIds([]);
                }
              }}
            />
            全选可管理方案
          </label>
          <span className="text-xs text-muted-foreground">已选 {selectedPresetIds.length} 个</span>
          <Button size="sm" variant="secondary" disabled={selectedPresetIds.length === 0} onClick={() => void handleBatchVisibilityUpdate("organization")}>
            批量共享到团队
          </Button>
          <Button size="sm" variant="secondary" disabled={selectedPresetIds.length === 0} onClick={() => void handleBatchVisibilityUpdate("private")}>
            批量取消共享
          </Button>
          <Button size="sm" variant="secondary" disabled={selectedPresetIds.length === 0} onClick={() => void handleBatchMakeDefault()}>
            批量设默认
          </Button>
          <Button size="sm" variant="ghost" disabled={selectedPresetIds.length === 0} onClick={() => void handleBatchDelete()}>
            批量删除
          </Button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isLoading ? (
          <div className="text-xs text-muted-foreground">正在加载筛选方案…</div>
        ) : filteredPresets.length > 0 ? (
          filteredPresets.map((preset) => {
            const active = serialize(preset.values).toString() === currentSignature;
            return (
              <div
                key={preset.id}
                draggable={canEditPreset(preset) && presetSortBy === "custom_order"}
                onDragStart={() => setDraggingPresetId(preset.id)}
                onDragOver={(event) => {
                  if (presetSortBy === "custom_order") {
                    event.preventDefault();
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingPresetId) {
                    void handleDropReorder(draggingPresetId, preset.id);
                  }
                }}
                className={cn(
                  "flex flex-wrap items-center gap-1 rounded-2xl border px-2 py-2",
                  active ? "border-primary/50 bg-primary/10" : "border-border bg-card/80",
                  draggingPresetId === preset.id ? "opacity-60" : null
                )}
              >
                {useRemotePresetStore && canManageSharedPresets ? (
                  <label className="flex items-center px-1">
                    <input
                      type="checkbox"
                      checked={selectedPresetIds.includes(preset.id)}
                      disabled={!canEditPreset(preset)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedPresetIds((current) => (current.includes(preset.id) ? current : [...current, preset.id]));
                        } else {
                          setSelectedPresetIds((current) => current.filter((id) => id !== preset.id));
                        }
                      }}
                    />
                  </label>
                ) : null}
                <Button size="sm" variant={active ? "default" : "ghost"} onClick={() => void handleApplyPreset(preset)}>
                  {preset.name}
                </Button>
                {preset.groupName ? <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[11px] text-sky-700 dark:text-sky-300">{preset.groupName}</span> : null}
                {preset.isDefault ? <span className="rounded-full bg-accent/15 px-2 py-1 text-[11px] text-accent">默认</span> : null}
                {preset.isPinned ? <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">置顶</span> : null}
                {preset.visibility === "organization" ? <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">团队共享</span> : null}
                {preset.tags.map((tag) => (
                  <span key={`${preset.id}-${tag}`} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
                {preset.ownerDisplayName ? <span className="px-1 text-[11px] text-muted-foreground">by {preset.ownerDisplayName}</span> : null}
                {preset.lastUsedAt ? <span className="px-1 text-[11px] text-muted-foreground">最近使用 {new Date(preset.lastUsedAt).toLocaleDateString("zh-CN")}</span> : null}
                <span className="px-1 text-[11px] text-muted-foreground">{new Date(preset.updatedAt).toLocaleDateString("zh-CN")}</span>
                {canEditPreset(preset) ? (
                  <Button size="sm" variant="ghost" className="px-2 text-xs text-muted-foreground" onClick={() => void handleMovePreset(preset, "up")}>
                    上移
                  </Button>
                ) : null}
                {canEditPreset(preset) ? (
                  <Button size="sm" variant="ghost" className="px-2 text-xs text-muted-foreground" onClick={() => void handleMovePreset(preset, "down")}>
                    下移
                  </Button>
                ) : null}
                {canEditPreset(preset) ? (
                  <Button size="sm" variant="ghost" className="px-2 text-xs text-muted-foreground" onClick={() => void handleTogglePinned(preset)}>
                    {preset.isPinned ? "取消置顶" : "置顶"}
                  </Button>
                ) : null}
                {canDuplicatePreset(preset) ? (
                  <Button size="sm" variant="ghost" className="px-2 text-xs text-muted-foreground" onClick={() => openDuplicateDialog(preset)}>
                    另存为
                  </Button>
                ) : null}
                {canEditPreset(preset) ? (
                  <Button size="sm" variant="ghost" className="px-2 text-xs text-muted-foreground" onClick={() => openEditDialog(preset)}>
                    编辑
                  </Button>
                ) : null}
                {!preset.isDefault && canMakeDefaultPreset(preset) ? (
                  <Button size="sm" variant="ghost" className="px-2 text-xs text-muted-foreground" onClick={() => void handleMakeDefault(preset)}>
                    设默认
                  </Button>
                ) : null}
                {canDeletePreset(preset) ? (
                  <Button size="sm" variant="ghost" className="px-2 text-xs text-muted-foreground" onClick={() => void handleDeletePreset(preset)}>
                    删除
                  </Button>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="text-xs text-muted-foreground">还没有保存的筛选方案。常用筛选可以先保存成 Preset，后续一键复用。</div>
        )}
      </div>

      {feedback ? <div className="mt-4 rounded-2xl border border-border/70 bg-card/80 p-3 text-xs text-muted-foreground">{feedback}</div> : null}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <div className="space-y-5">
            <div>
              <DialogTitle className="text-xl font-semibold">{editingPreset ? "编辑筛选方案" : "保存筛选方案"}</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                当前支持服务端持久化、默认方案和团队共享。你可以在这里重命名、调整可见范围，或直接修改默认归属。
              </DialogDescription>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor={`filter-preset-name-${scope}`}>
                方案名称
              </label>
              <Input
                id={`filter-preset-name-${scope}`}
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                placeholder="例如：本月已结清账单 / 风险事件排查"
                autoFocus
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor={`filter-preset-group-${scope}`}>
                  分组
                </label>
                <Input
                  id={`filter-preset-group-${scope}`}
                  value={presetGroupName}
                  onChange={(event) => setPresetGroupName(event.target.value)}
                  placeholder="例如：运营值守 / 财务对账 / 风控排查"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor={`filter-preset-tags-${scope}`}>
                  标签
                </label>
                <Input
                  id={`filter-preset-tags-${scope}`}
                  value={presetTagsInput}
                  onChange={(event) => setPresetTagsInput(event.target.value)}
                  placeholder="例如：高成本, 失败率, 重点项目"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">可见范围</label>
                <select
                  value={presetVisibility}
                  onChange={(event) => setPresetVisibility(event.target.value as PresetVisibility)}
                  className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="private">仅自己</option>
                  <option value="organization" disabled={!canManageSharedPresets}>
                    团队共享
                  </option>
                </select>
                {!canManageSharedPresets ? <div className="text-xs text-muted-foreground">团队共享需项目管理员及以上权限。</div> : null}
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-sm">
                <input type="checkbox" checked={saveAsDefault} onChange={(event) => setSaveAsDefault(event.target.checked)} />
                设为默认方案
              </label>
            </div>
            {defaultConflictPreset ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                当前 {presetVisibility === "organization" ? "团队" : "个人"} 默认方案为“{defaultConflictPreset.name}”，保存后会被替换。
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSaveOpen(false)}>
                取消
              </Button>
              <Button onClick={() => void handleSavePreset()} disabled={isSaving}>
                {isSaving ? "保存中…" : editingPreset ? "保存修改" : "保存方案"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importPreviewOpen}
        onOpenChange={(open) => {
          setImportPreviewOpen(open);
          if (!open) {
            setPendingImportItems([]);
            setSelectedImportKeys([]);
            setImportPreviewFileName("");
            setImportSourceScope(scope);
          }
        }}
      >
        <DialogContent className="w-[min(96vw,860px)]">
          <div className="space-y-5">
            <div>
              <DialogTitle className="text-xl font-semibold">导入 Preset 预览</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                先查看将要新增、覆盖或跳过的方案，再决定是否正式导入。当前文件：{importPreviewFileName || "未命名文件"}。
              </DialogDescription>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 md:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">导入目标</div>
                <div className="mt-2 text-sm font-medium">{scope}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {importSourceScope === scope ? "与当前页面 scope 一致" : `源文件 scope 为 ${importSourceScope}，将按当前页面 scope 导入`}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">将新增</div>
                <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">{importPreviewSummary.create}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">将覆盖</div>
                <div className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-300">{importPreviewSummary.update}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">将跳过</div>
                <div className="mt-2 text-sm font-medium text-muted-foreground">{importPreviewSummary.skip}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={importOverwriteExisting} onChange={(event) => setImportOverwriteExisting(event.target.checked)} />
                覆盖同名方案
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedImportKeys.length > 0 && selectableImportKeys.every((key) => selectedImportKeys.includes(key))}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedImportKeys(selectableImportKeys);
                    } else {
                      setSelectedImportKeys([]);
                    }
                  }}
                />
                全选可导入条目
              </label>
              <div className="text-xs text-muted-foreground">关闭后，遇到同名方案会自动跳过，不会覆盖现有 Preset。</div>
            </div>

            <div className="max-h-[380px] space-y-2 overflow-y-auto rounded-2xl border border-border/70 bg-card/40 p-3">
              {importPreviewEntries.map((entry, index) => (
                <div key={`${entry.item.name}-${index}`} className="rounded-2xl border border-border/70 bg-card/80 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.status !== "skip" ? (
                      <label className="mr-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedImportKeys.includes(`${entry.item.name}-${index}`)}
                          onChange={(event) => {
                            const key = `${entry.item.name}-${index}`;
                            if (event.target.checked) {
                              setSelectedImportKeys((current) => (current.includes(key) ? current : [...current, key]));
                            } else {
                              setSelectedImportKeys((current) => current.filter((itemKey) => itemKey !== key));
                            }
                          }}
                        />
                      </label>
                    ) : null}
                    <div className="text-sm font-medium">{entry.item.name}</div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px]",
                        entry.status === "create"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : entry.status === "update"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {entry.status === "create" ? "新增" : entry.status === "update" ? "覆盖" : "跳过"}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                      {entry.item.visibility === "organization" ? "团队共享" : "仅自己"}
                    </span>
                    {entry.item.groupName ? (
                      <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[11px] text-sky-700 dark:text-sky-300">{entry.item.groupName}</span>
                    ) : null}
                    {entry.item.isDefault ? <span className="rounded-full bg-accent/15 px-2 py-1 text-[11px] text-accent">默认</span> : null}
                    {entry.item.isPinned ? <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] text-primary">置顶</span> : null}
                    {entry.item.tags.map((tag) => (
                      <span key={`${entry.item.name}-${tag}`} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{entry.reason}</div>
                  {entry.existingPreset ? (
                    <div className="mt-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      当前存在：{entry.existingPreset.name} · 更新于 {new Date(entry.existingPreset.updatedAt).toLocaleString("zh-CN")}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setImportPreviewOpen(false);
                  setPendingImportItems([]);
                  setSelectedImportKeys([]);
                  setImportPreviewFileName("");
                  setImportSourceScope(scope);
                }}
              >
                取消
              </Button>
              <Button onClick={() => void handleConfirmImport()} disabled={isImporting || selectedImportKeys.length === 0}>
                {isImporting ? "导入中…" : "确认导入"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
