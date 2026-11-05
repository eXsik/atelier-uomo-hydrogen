import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useLocation } from "react-router";

export type BrowsePageInfo = {
  hasNextPage: boolean;
  endCursor?: string | null;
};

type LoadMoreResponse<T> = {
  products: readonly T[];
  pageInfo: BrowsePageInfo;
  dataSearch: string;
};

export function useLoadMore<T>(
  initialNodes: readonly T[],
  initialPageInfo: BrowsePageInfo,
  dataSearch: string,
) {
  const fetcher = useFetcher();
  const [nodes, setNodes] = useState<readonly T[]>(initialNodes);
  const [pageInfo, setPageInfo] = useState<BrowsePageInfo>(initialPageInfo);
  const requestedSearch = useRef<string | null>(null);
  const appendedSearches = useRef(new Set<string>());

  useEffect(() => {
    setNodes(initialNodes);
    setPageInfo(initialPageInfo);
    requestedSearch.current = null;
    appendedSearches.current.clear();
  }, [dataSearch, initialNodes, initialPageInfo]);

  useEffect(() => {
    const data = fetcher.data as LoadMoreResponse<T> | undefined;
    if (!data || data.dataSearch !== requestedSearch.current) return;
    if (appendedSearches.current.has(data.dataSearch)) return;

    appendedSearches.current.add(data.dataSearch);
    requestedSearch.current = null;
    setNodes((current) => [...current, ...data.products]);
    setPageInfo(data.pageInfo);
  }, [fetcher.data]);

  return {
    nodes,
    pageInfo,
    isLoading: fetcher.state !== "idle",
    loadMore: (href: string, nextDataSearch: string) => {
      requestedSearch.current = nextDataSearch;
      fetcher.load(href);
    },
  };
}

export function LoadMore({
  pageInfo,
  loadedCount,
  countLabel,
  isLoading,
  onLoad,
}: {
  pageInfo: BrowsePageInfo;
  loadedCount: number;
  countLabel?: string;
  isLoading: boolean;
  onLoad: (href: string, nextDataSearch: string) => void;
}) {
  const location = useLocation();

  if (!pageInfo.hasNextPage || !pageInfo.endCursor) return null;

  const params = new URLSearchParams(location.search);
  params.set("after", pageInfo.endCursor);
  const nextSearch = params.toString();
  const href = `${location.pathname}?${nextSearch}`;

  return (
    <div className="mt-12 flex flex-col items-center gap-3">
      <p className="text-sm text-on-surface-secondary">
        {countLabel ?? `Showing ${loadedCount} products`}
      </p>
      <Link
        to={href}
        preventScrollReset
        aria-disabled={isLoading}
        className={`button-outline inline-flex h-11 items-center justify-center gap-2 rounded-button px-6 text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97] ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        onClick={(event) => {
          event.preventDefault();
          if (!isLoading) onLoad(href, nextSearch);
        }}
      >
        {isLoading ? "Loading…" : "Load more"}
      </Link>
    </div>
  );
}
