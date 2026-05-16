export function AppBreadcrumbs({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}
