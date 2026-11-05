export function AnnouncementBar({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null;
  return (
    <aside aria-label="Demo store" className="atelier-demo-note px-margin py-2 text-center text-xs">
      Independent storefront concept. Demo checkout — no real payments.
    </aside>
  );
}
