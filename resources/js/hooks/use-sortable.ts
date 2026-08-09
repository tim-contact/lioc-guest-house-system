import { useState } from 'react';

export type SortDir = 'asc' | 'desc';

/** Stable sort that keeps null/undefined values last and compares numbers/strings naturally. */
function sortRows<T>(rows: T[], key: keyof T, dir: SortDir): T[] {
    return [...rows].sort((a, b) => {
        const av = a[key];
        const bv = b[key];

        if (av === null || av === undefined) {
            return 1;
        }

        if (bv === null || bv === undefined) {
            return -1;
        }

        const cmp =
            typeof av === 'number' && typeof bv === 'number'
                ? av - bv
                : String(av).localeCompare(String(bv), undefined, {
                      numeric: true,
                  });

        return dir === 'asc' ? cmp : -cmp;
    });
}

/** Column sorting state for a table: click a header to toggle asc/desc on that key. */
export function useSortable<T>(
    rows: T[],
    initialKey: keyof T,
    initialDir: SortDir = 'asc',
) {
    const [sortKey, setSortKey] = useState<keyof T>(initialKey);
    const [sortDir, setSortDir] = useState<SortDir>(initialDir);

    function handleSort(key: keyof T): void {
        if (key === sortKey) {
            setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    return {
        sortKey,
        sortDir,
        handleSort,
        sorted: sortRows(rows, sortKey, sortDir),
    };
}
