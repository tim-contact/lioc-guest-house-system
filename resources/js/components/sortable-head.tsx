import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
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
    const Icon = active
        ? currentDir === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;

    return (
        <TableHead
            className={`cursor-pointer select-none hover:text-foreground ${className ?? ''}`}
            onClick={() => onSort(sortKey)}
        >
            <span className="inline-flex items-center gap-1.5">
                {label}
                <Icon
                    aria-hidden="true"
                    className={active ? 'size-3.5' : 'size-3.5 opacity-35'}
                />
            </span>
        </TableHead>
    );
}
