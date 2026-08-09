import type { ReactNode } from 'react';
import { TableHead } from '@/components/ui/table';
import type { SortDir } from '@/hooks/use-sortable';

/** Clickable table header that shows the active sort direction. */
export function SortableHead<K extends PropertyKey>({
    label,
    sortKey,
    currentKey,
    currentDir,
    onSort,
    className,
}: {
    label: string;
    sortKey: K;
    currentKey: K;
    currentDir: SortDir;
    onSort: (key: K) => void;
    className?: string;
}): ReactNode {
    const active = currentKey === sortKey;

    return (
        <TableHead
            className={`cursor-pointer select-none hover:text-foreground ${className ?? ''}`}
            onClick={() => onSort(sortKey)}
        >
            {label}
            <span className={active ? 'ml-1' : 'ml-1 opacity-30'}>
                {active ? (currentDir === 'asc' ? '↑' : '↓') : '↕'}
            </span>
        </TableHead>
    );
}
