export function AnnouncementBar({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null;
  return (
    <aside
      aria-label="Demo store"
      className="bg-on-surface px-margin py-2 text-center text-xs text-surface"
    >
      Portfolio storefront · Demo catalog by mock.shop · No real payments or
      orders
    </aside>
  );
}
