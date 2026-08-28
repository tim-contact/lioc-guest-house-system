import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Rounded, bordered frame around a <Table>; Table supplies its own horizontal scroll. */
export function TableFrame({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border',
                className,
            )}
        >
            {children}
        </div>
    );
}
