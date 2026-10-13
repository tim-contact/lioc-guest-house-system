import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ExportButton } from '@/components/export-button';
import { PaginationControls } from '@/components/pagination-controls';
import type { PaginationMeta } from '@/components/pagination-controls';
import { SortableHead } from '@/components/sortable-head';
import { TableFrame } from '@/components/table-frame';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSortable } from '@/hooks/use-sortable';
import type { SortDir } from '@/hooks/use-sortable';
import { cn } from '@/lib/utils';
import type { CrudConfig } from './crud-types';
import { ResourceForm } from './resource-form';

export function ResourceCrudPage<T>({
    rows,
    config,
    pagination,
    sort,
    onSort,
}: {
    rows: T[];
    config: CrudConfig<T>;
    pagination?: PaginationMeta;
    /** Current server-side sort state; provide with onSort to sort server-side instead of client-side. */
    sort?: { key: keyof T & string; direction: SortDir };
    onSort?: (key: keyof T & string) => void;
}) {
    const [editing, setEditing] = useState<T | null>(null);
    const [deleting, setDeleting] = useState<T | null>(null);
    const [creating, setCreating] = useState(false);
    const serverSorted = sort !== undefined && onSort !== undefined;
    const clientSort = useSortable(rows, config.defaultSortKey);
    const sortKey = (
        sort !== undefined ? sort.key : clientSort.sortKey
    ) as keyof T & string;
    const sortDir = sort !== undefined ? sort.direction : clientSort.sortDir;
    const handleSort = (key: keyof T) => {
        if (onSort !== undefined) {
            onSort(key as keyof T & string);
        } else {
            clientSort.handleSort(key);
        }
    };
    const sorted = serverSorted ? rows : clientSort.sorted;
    const canEdit = config.canEdit !== false;
    const canDelete = config.canDelete !== false;
    const showActions = canEdit || canDelete || !!config.rowActions;
    const dense = config.dense === true;

    return (
        <>
            <Head title={config.title} />

            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 md:px-8 md:py-6">
                <div className="flex flex-col gap-3 py-1 md:flex-row md:items-center md:justify-between">
                    {config.toolbar ? (
                        <div className="min-w-0 flex-1">{config.toolbar}</div>
                    ) : (
                        <span />
                    )}
                    <div className="flex items-center justify-end gap-2">
                        <ExportButton
                            rows={sorted}
                            columns={config.exportColumns}
                            filename={config.filename}
                        />
                        {config.canCreate !== false && (
                            <Button onClick={() => setCreating(true)}>
                                + Add {config.entityLabel}
                            </Button>
                        )}
                    </div>
                </div>

                <TableFrame>
                    <Table
                        className={cn(
                            config.tableClassName,
                            dense && 'text-[13px]',
                        )}
                    >
                        <TableHeader>
                            <TableRow>
                                {config.columns.map((column) =>
                                    column.sortKey ? (
                                        <SortableHead
                                            key={column.header}
                                            label={column.header}
                                            sortKey={column.sortKey}
                                            currentKey={sortKey}
                                            currentDir={sortDir}
                                            onSort={handleSort}
                                            className={cn(
                                                column.align === 'right' &&
                                                    'text-right',
                                                column.headerClassName,
                                                dense && 'h-8',
                                            )}
                                        />
                                    ) : (
                                        <TableHead
                                            key={column.header}
                                            className={cn(
                                                column.align === 'right' &&
                                                    'text-right',
                                                column.headerClassName,
                                                dense && 'h-8',
                                            )}
                                        >
                                            {column.header}
                                        </TableHead>
                                    ),
                                )}
                                {showActions && (
                                    <TableHead
                                        className={cn(
                                            'text-right',
                                            dense && 'h-8',
                                        )}
                                    >
                                        Actions
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.map((row) => (
                                <TableRow key={config.pk(row)}>
                                    {config.columns.map((column) => (
                                        <TableCell
                                            key={column.header}
                                            className={cn(
                                                column.align === 'right' &&
                                                    'text-right tabular-nums',
                                                column.className,
                                                dense && 'px-2 py-1.5',
                                            )}
                                        >
                                            {column.cell(row)}
                                        </TableCell>
                                    ))}
                                    {showActions && (
                                        <TableCell
                                            className={cn(
                                                'text-right',
                                                dense && 'px-2 py-1.5',
                                            )}
                                        >
                                            <div className="flex justify-end gap-2">
                                                {config.rowActions?.(row)}
                                                {canEdit && (
                                                    <Button
                                                        variant="outline"
                                                        size={
                                                            dense ? 'xs' : 'sm'
                                                        }
                                                        onClick={() =>
                                                            setEditing(row)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="destructive"
                                                        size={
                                                            dense ? 'xs' : 'sm'
                                                        }
                                                        onClick={() =>
                                                            setDeleting(row)
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}

                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            config.columns.length +
                                            (showActions ? 1 : 0)
                                        }
                                        className={cn(
                                            'text-center text-muted-foreground',
                                            dense && 'px-2 py-1.5',
                                        )}
                                    >
                                        {config.emptyText}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableFrame>

                {pagination && <PaginationControls pagination={pagination} />}
            </div>

            {/* ---- Create popup ---- */}
            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className={config.dialogClassName}>
                    {config.form?.({
                        row: null,
                        onDone: () => setCreating(false),
                    }) ?? (
                        <ResourceForm
                            config={config}
                            row={null}
                            onDone={() => setCreating(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ---- Edit popup ---- */}
            <Dialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent className={config.dialogClassName}>
                    {editing && (
                        // key forces a fresh form each time a different row is opened
                        <div key={config.pk(editing)}>
                            {config.form?.({
                                row: editing,
                                onDone: () => setEditing(null),
                            }) ?? (
                                <ResourceForm
                                    config={config}
                                    row={editing}
                                    onDone={() => setEditing(null)}
                                />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ---- Delete confirmation ---- */}
            <Dialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete {config.entityLabel.toLowerCase()}
                        </DialogTitle>
                        <DialogDescription>
                            {deleting
                                ? `Delete ${config.deleteLabel?.(deleting) ?? config.pk(deleting)}? This cannot be undone.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleting(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                const action = deleting
                                    ? config.routes?.destroy?.(
                                          config.pk(deleting),
                                      )
                                    : undefined;

                                if (!action) {
                                    return;
                                }

                                router.delete(action.url, {
                                    onSuccess: () => setDeleting(null),
                                });
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
