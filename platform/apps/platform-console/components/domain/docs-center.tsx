"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Link2, Printer, Search, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeSnippetTabs, type SnippetMap } from "@/components/domain/code-snippet-tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DocsIcon = ComponentType<{ className?: string }>;

export type DocsQuickLink = {
  title: string;
  description: string;
  href: string;
  icon: DocsIcon;
};

export type DocsSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  links: DocsQuickLink[];
  codeExamples?: {
    id: string;
    title: string;
    description?: string;
    snippets: SnippetMap;
  }[];
};

export type DocsFaq = {
  question: string;
  answer: string;
};

export function DocsCenter({
  badgeLabel,
  title,
  intro,
  tips,
  quickLinks,
  sections,
  faqs,
  primaryAction,
  secondaryAction,
  printTitle
}: {
  badgeLabel: string;
  title: string;
  intro: string;
  tips: string[];
  quickLinks: DocsQuickLink[];
  sections: DocsSection[];
  faqs: DocsFaq[];
  primaryAction?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  printTitle?: string;
}) {
  const [keyword, setKeyword] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");

  const filteredSections = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return sections;
    return sections.filter((section) => {
      const searchable = [
        section.title,
        section.summary,
        section.bullets.join(" "),
        section.links.map((item) => `${item.title} ${item.description}`).join(" "),
        section.codeExamples?.map((item) => `${item.title} ${item.description ?? ""} ${Object.keys(item.snippets).join(" ")}`).join(" ") ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [keyword, sections]);

  const filteredQuickLinks = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return quickLinks;
    return quickLinks.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(normalized));
  }, [keyword, quickLinks]);

  const filteredFaqs = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return faqs;
    return faqs.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(normalized));
  }, [faqs, keyword]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && filteredSections.some((section) => section.id === hash)) {
      setActiveSectionId(hash);
      return;
    }
    if (!filteredSections.length) {
      setActiveSectionId("");
      return;
    }
    setActiveSectionId((current) => (filteredSections.some((section) => section.id === current) ? current : filteredSections[0].id));
  }, [filteredSections]);

  useEffect(() => {
    if (!filteredSections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);
        const nextActive = visibleEntries[0]?.target.id;
        if (!nextActive) return;
        setActiveSectionId(nextActive);
        window.history.replaceState(null, "", `#${nextActive}`);
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0.15, 0.35, 0.6]
      }
    );

    filteredSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [filteredSections]);

  const resultCount = filteredSections.length + filteredFaqs.length;
  const activeSection = filteredSections.find((section) => section.id === activeSectionId) ?? filteredSections[0] ?? null;
  const activeSectionOutline = activeSection
    ? [
        { id: `${activeSection.id}--summary`, label: "章节概述" },
        { id: `${activeSection.id}--bullets`, label: "关键要点" },
        { id: `${activeSection.id}--links`, label: "相关入口" },
        ...(activeSection.codeExamples?.length ? [{ id: `${activeSection.id}--code`, label: "代码示例" }] : [])
      ]
    : [];

  const onJump = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    setActiveSectionId(sectionId);
    window.history.replaceState(null, "", `#${sectionId}`);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onResetSearch = () => {
    setKeyword("");
  };

  const onPrint = () => {
    const previousTitle = document.title;
    document.title = printTitle ?? title;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 150);
  };

  const onCopySectionLink = async (sectionId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setActiveSectionId(sectionId);
    } catch (error) {
      console.error(error);
      window.prompt("复制当前章节链接", url);
    }
  };

  return (
    <div className="docs-print-root grid gap-6 xl:grid-cols-[320px,minmax(0,1fr),260px]">
      <aside className="docs-hide-on-print xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>文档导航</CardTitle>
              <CardDescription>支持搜索、锚点定位、打印和导出 PDF。</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="pl-9" placeholder="搜索功能、页面或操作说明" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={onResetSearch} disabled={!keyword}>
                <RotateCcw className="h-4 w-4" />
                清空搜索
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={onPrint}>
                <Printer className="h-4 w-4" />
                导出 PDF / 打印
              </Button>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/25 px-3 py-3 text-xs text-muted-foreground">
              当前命中 <span className="font-semibold text-foreground">{resultCount}</span> 个内容块。
            </div>
            <div className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onJump(section.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left text-sm transition",
                    activeSectionId === section.id ? "bg-accent/12 text-accent" : "hover:bg-muted/60"
                  )}
                >
                  <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", activeSectionId === section.id ? "bg-accent" : "bg-border")} />
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="section-shell">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-8 px-6 py-6 lg:grid-cols-[1.2fr,0.8fr] lg:px-8 lg:py-8">
            <div>
              <Badge tone="info">{badgeLabel}</Badge>
              <h2 className="mt-4 font-display text-4xl leading-tight">{title}</h2>
              <p id="docs-intro" className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                {intro}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 docs-hide-on-print">
                {primaryAction ? (
                  <Button asChild>
                    <Link href={primaryAction.href}>
                      {primaryAction.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
                {secondaryAction ? (
                  <Button asChild variant="secondary">
                    <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="rounded-[28px] border border-border/70 bg-muted/35 p-5">
              <div className="text-sm font-semibold">阅读建议</div>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                {tips.map((tip) => (
                  <p key={tip}>{tip}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredQuickLinks.length ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>快速入口</CardTitle>
                <CardDescription>适合按真实业务路径快速进入相关页面。</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredQuickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="rounded-3xl border border-border/70 bg-background/70 p-5 transition hover:border-accent/35 hover:bg-muted/35">
                    <Icon className="h-5 w-5 text-accent" />
                    <div className="mt-4 text-base font-semibold">{item.title}</div>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        {filteredSections.length ? (
          filteredSections.map((section) => (
            <Card key={section.id} id={section.id} className={cn("scroll-mt-28", activeSectionId === section.id && "ring-1 ring-accent/25")}>
              <CardHeader>
                <div>
                  <CardTitle>
                    <HighlightText text={section.title} keyword={keyword} />
                  </CardTitle>
                  <CardDescription id={`${section.id}--summary`}>
                    <HighlightText text={section.summary} keyword={keyword} />
                  </CardDescription>
                </div>
                <Button type="button" size="sm" variant="secondary" className="docs-hide-on-print shrink-0" onClick={() => onCopySectionLink(section.id)}>
                  <Link2 className="h-4 w-4" />
                  复制章节链接
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul id={`${section.id}--bullets`} className="space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                      <HighlightText text={bullet} keyword={keyword} />
                    </li>
                  ))}
                </ul>
                <div id={`${section.id}--links`} className="grid gap-3 md:grid-cols-2">
                  {section.links.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={`${section.id}-${item.href}`} href={item.href} className="rounded-2xl border border-border/70 bg-muted/25 p-4 transition hover:bg-muted/45">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Icon className="h-4 w-4 text-accent" />
                          <HighlightText text={item.title} keyword={keyword} />
                        </div>
                        <div className="mt-2 text-sm leading-6 text-muted-foreground">
                          <HighlightText text={item.description} keyword={keyword} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {section.codeExamples?.length ? (
                  <div id={`${section.id}--code`} className="space-y-4">
                    {section.codeExamples.map((example) => (
                      <div key={example.id} className="rounded-3xl border border-border/70 bg-background/55 p-4">
                        <CodeSnippetTabs title={example.title} description={example.description} snippets={example.snippets} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">没有匹配的说明内容，请调整搜索关键词。</CardContent>
          </Card>
        )}

        {filteredFaqs.length ? (
          <Card id="faq" className="scroll-mt-28">
            <CardHeader>
              <div>
                <CardTitle>常见问题</CardTitle>
                <CardDescription>适合给客户、团队成员和运营同学快速解惑。</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredFaqs.map((item) => (
                <div key={item.question} className="rounded-2xl border border-border/70 bg-background/55 px-4 py-4">
                  <div className="text-sm font-semibold">
                    <HighlightText text={item.question} keyword={keyword} />
                  </div>
                  <div className="mt-2 text-sm leading-7 text-muted-foreground">
                    <HighlightText text={item.answer} keyword={keyword} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <aside className="docs-hide-on-print hidden xl:block">
        <div className="sticky top-24 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>当前章节</CardTitle>
                <CardDescription>{activeSection ? activeSection.title : "暂无匹配章节"}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeSection ? (
                activeSectionOutline.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onJump(item.id)}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-muted/60"
                  >
                    <span>{item.label}</span>
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">当前搜索结果里没有可用章节。</div>
              )}
            </CardContent>
          </Card>
          {activeSection ? (
            <Card className="overflow-hidden">
              <CardHeader>
                <div>
                  <CardTitle>章节摘要</CardTitle>
                  <CardDescription>跟随当前阅读位置变化。</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                <HighlightText text={activeSection.summary} keyword={keyword} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  const normalized = keyword.trim();
  if (!normalized) return <>{text}</>;

  const escaped = escapeRegExp(normalized);
  if (!escaped) return <>{text}</>;
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalized.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded bg-[#f7f1d1] px-1 py-0.5 text-foreground dark:bg-[#3d3620] dark:text-[#f7f1d1]">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
