"use client";

import type { ReactNode } from "react";
import { AppQueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppQueryProvider>{children}</AppQueryProvider>
    </ThemeProvider>
  );
}
