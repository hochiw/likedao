import { useMemo } from "react";

export function usePagination<T>(
  items: T[],
  offset: number,
  pageSize: number
): T[] {
  const totalCount = useMemo(() => items.length, [items]);

  const [startIdx, endIdx] = useMemo(() => {
    const start = offset;
    const end = offset + pageSize > totalCount ? totalCount : offset + pageSize;
    return [start, end];
  }, [offset, pageSize, totalCount]);

  const paginatedItems = useMemo(
    () => items.slice(startIdx, endIdx),
    [items, startIdx, endIdx]
  );

  return paginatedItems;
}
