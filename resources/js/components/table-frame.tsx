import type { ReactNode } from 'react';

/** Rounded, bordered frame around a <Table>; Table supplies its own horizontal scroll. */
export function TableFrame({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            {children}
        </div>
    );
}
