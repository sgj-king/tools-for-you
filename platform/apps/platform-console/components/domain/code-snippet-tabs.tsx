"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SnippetMap = Record<string, string>;

const defaultSnippets = {
  curl: `curl https://api.example.com/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"chat-pro","messages":[{"role":"user","content":"hello"}]}'`,
  python: `from openai import OpenAI

client = OpenAI(base_url="https://api.example.com/v1", api_key="YOUR_KEY")
resp = client.chat.completions.create(model="chat-pro", messages=[{"role":"user","content":"hello"}])`,
  node: `import OpenAI from "openai";

const client = new OpenAI({ baseURL: "https://api.example.com/v1", apiKey: process.env.API_KEY });`
};

export function CodeSnippetTabs({
  snippets = defaultSnippets,
  title,
  description
}: {
  snippets?: SnippetMap;
  title?: string;
  description?: string;
}) {
  const snippetKeys = Object.keys(snippets);
  const [active, setActive] = useState(snippetKeys[0] ?? "curl");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const value = snippets[active];
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="space-y-3">
      {title ? <div className="text-sm font-semibold">{title}</div> : null}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {snippetKeys.map((item) => (
            <Button key={item} variant={active === item ? "default" : "secondary"} size="sm" onClick={() => setActive(item)}>
              {item}
            </Button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "已复制" : "复制代码"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-[#101714] p-4 font-mono text-xs text-[#d7efe4]">{snippets[active]}</pre>
    </div>
  );
}
