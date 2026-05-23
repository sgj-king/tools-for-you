"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { Route as AppRoute } from "next";
import { Bell, BookText, Camera, LoaderCircle, LogOut, Search, Sparkles, UserCircle2, Wrench } from "lucide-react";
import { useLogoutMutation, useSessionUserQuery, useUpdateSessionProfileMutation } from "@/hooks/use-console-data";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_AVATAR_DATA_URL_LENGTH = 680_000;
const AVATAR_CANVAS_SIZE = 320;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export function Topbar({
  title,
  subtitle,
  docsHref,
  docsLabel = "说明"
}: {
  title: string;
  subtitle: string;
  docsHref?: AppRoute | string;
  docsLabel?: string;
}) {
  const session = useSessionUserQuery();
  const updateProfileMutation = useUpdateSessionProfileMutation();
  const logoutMutation = useLogoutMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (session.data?.displayName) {
      setDraftName(session.data.displayName);
    }
  }, [session.data?.displayName]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [menuOpen]);

  const currentUser = session.data;
  const initials = useMemo(() => {
    const display = (currentUser?.displayName ?? "").trim();
    if (!display) return "U";
    const chunks = display.split(/\s+/).filter(Boolean);
    if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
    return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
  }, [currentUser?.displayName]);

  const canSaveName = Boolean(currentUser && draftName.trim().length >= 2 && draftName.trim() !== currentUser.displayName);

  const onPickAvatar = () => {
    fileInputRef.current?.click();
  };

  const onUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentUser) return;
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      window.alert("头像文件不能超过 2MB。");
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      window.alert("头像仅支持 PNG、JPEG、WebP 或 GIF。");
      return;
    }
    let avatarUrl = "";
    try {
      avatarUrl = await createAvatarDataUrl(file);
    } catch {
      window.alert("头像图片解析失败，请换一张图片。");
      return;
    }
    if (avatarUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
      window.alert("头像数据过大，请换一张更小的图片。");
      return;
    }
    await updateProfileMutation.mutateAsync({
      displayName: draftName.trim() || currentUser.displayName,
      avatarUrl
    });
  };

  const onSaveName = async () => {
    if (!currentUser || !canSaveName) return;
    await updateProfileMutation.mutateAsync({
      displayName: draftName.trim()
    });
  };

  const onLogout = async () => {
    const result = await logoutMutation.mutateAsync();
    window.location.assign(result.redirectTo || "/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-72 pl-9" placeholder="搜索 trace_id / API Key / 用户" />
          </div>
          {docsHref ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={docsHref as AppRoute}>
                <BookText className="h-4 w-4" />
                {docsLabel}
              </Link>
            </Button>
          ) : null}
          {siteConfig.digitalLifeUrl ? (
            <Button asChild variant="secondary" size="sm">
              <a href={siteConfig.digitalLifeUrl}>
                <Sparkles className="h-4 w-4" />
                数字生命
              </a>
            </Button>
          ) : null}
          {siteConfig.itToolsUrl ? (
            <Button asChild variant="secondary" size="sm">
              <a href={siteConfig.itToolsUrl}>
                <Wrench className="h-4 w-4" />
                IT 工具箱
              </a>
            </Button>
          ) : null}
          <ThemeToggle />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
            <Bell className="h-4 w-4" />
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-2 py-1.5 transition hover:bg-muted/60"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent">
                {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="hidden text-left md:block">
                <div className="text-sm font-medium leading-tight">{currentUser?.displayName ?? "未登录用户"}</div>
                <div className="text-xs text-muted-foreground">{currentUser?.role ?? "guest"}</div>
              </div>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-2xl border border-border bg-card p-4 shadow-card">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadAvatar} />
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" /> : initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{currentUser?.displayName ?? "未登录用户"}</p>
                    <p className="truncate text-xs text-muted-foreground">{currentUser?.email ?? "-"}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{currentUser?.orgName ?? "-"}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-medium text-muted-foreground">姓名</label>
                  <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="请输入显示姓名" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={onPickAvatar} disabled={updateProfileMutation.isPending}>
                    <Camera className="h-4 w-4" />
                    上传头像
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={onSaveName} disabled={!canSaveName || updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserCircle2 className="h-4 w-4" />}
                    保存姓名
                  </Button>
                </div>

                <Button type="button" variant="danger" size="sm" className="mt-3 w-full" onClick={onLogout} disabled={logoutMutation.isPending}>
                  {logoutMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  退出登录
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("读取头像文件失败"));
    reader.readAsDataURL(file);
  });
}

async function createAvatarDataUrl(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) throw new Error("不支持的头像格式");

  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_CANVAS_SIZE;
  canvas.height = AVATAR_CANVAS_SIZE;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
  context.clearRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);

  const compressed = canvas.toDataURL("image/webp", 0.82);
  return compressed.startsWith("data:image/webp") ? compressed : canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("头像图片解析失败"));
    image.src = src;
  });
}
