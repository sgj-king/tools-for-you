"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CopySecretField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <code className="max-w-[80%] overflow-hidden text-ellipsis whitespace-nowrap rounded-xl bg-muted px-3 py-2 font-mono text-xs">
          {value}
        </code>
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "已复制" : "复制"}
        </Button>
      </CardContent>
    </Card>
  );
}
