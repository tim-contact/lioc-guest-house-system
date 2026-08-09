import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ExportButton } from '@/components/export-button';
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
import { cn } from '@/lib/utils';
import type { CrudConfig } from './crud-types';
import { ResourceForm } from './resource-form';

export function ResourceCrudPage<T>({
    rows,
    config,
}: {
    rows: T[];
    config: CrudConfig<T>;
}) {
    const [editing, setEditing] = useState<T | null>(null);
    const [deleting, setDeleting] = useState<T | null>(null);
    const [creating, setCreating] = useState(false);
    const { sortKey, sortDir, handleSort, sorted } = useSortable(
        rows,
        config.defaultSortKey,
    );
    const canEdit = config.canEdit !== false;
    const canDelete = config.canDelete !== false;
    const showActions = canEdit || canDelete;

    return (
        <>
            <Head title={config.title} />

            <div className="flex flex-col gap-6 p-4">
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

                <TableFrame>
                    <Table>
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
                                            )}
                                        />
                                    ) : (
                                        <TableHead
                                            key={column.header}
                                            className={cn(
                                                column.align === 'right' &&
                                                    'text-right',
                                            )}
                                        >
                                            {column.header}
                                        </TableHead>
                                    ),
                                )}
                                {showActions && (
                                    <TableHead className="text-right">
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
                                            )}
                                        >
                                            {column.cell(row)}
                                        </TableCell>
                                    ))}
                                    {showActions && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {canEdit && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
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
                                                        size="sm"
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
                                        className="text-center text-muted-foreground"
                                    >
                                        {config.emptyText}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableFrame>
            </div>

            {/* ---- Create popup ---- */}
            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className={config.dialogClassName}>
                    <ResourceForm
                        config={config}
                        row={null}
                        onDone={() => setCreating(false)}
                    />
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
                        <ResourceForm
                            key={config.pk(editing)}
                            config={config}
                            row={editing}
                            onDone={() => setEditing(null)}
                        />
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
                                    ? config.routes.destroy?.(
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
