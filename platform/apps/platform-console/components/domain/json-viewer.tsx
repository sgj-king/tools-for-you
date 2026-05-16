export function JsonViewer({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-[#101714] p-4 font-mono text-xs text-[#d7efe4]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
