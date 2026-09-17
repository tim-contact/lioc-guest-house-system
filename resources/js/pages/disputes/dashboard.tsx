import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { DisputeRow } from '@/components/dispute-edit-dialog';
import { DisputeEditDialog } from '@/components/dispute-edit-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMoney, shortDate } from '@/lib/utils';
import type { EnumOption } from '@/types';

interface DisputesDashboardProps {
    disputes: DisputeRow[];
    disputeTypeOptions: EnumOption[];
    proposedActionPlanOptions: EnumOption[];
    actionStatusOptions: EnumOption[];
}

function DisputeGrid({
    rows,
    onSelect,
}: {
    rows: DisputeRow[];
    onSelect: (row: DisputeRow) => void;
}) {
    if (rows.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
                No disputes here.
            </div>
        );
    }

    return (
        <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(24rem,1fr))] gap-4">
            {rows.map((row) => (
                <button
                    key={row.id}
                    type="button"
                    onClick={() => onSelect(row)}
                    className="group block h-full w-full rounded-xl text-left focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none"
                >
                    <Card
                        className="relative flex h-full min-h-64 flex-col overflow-hidden border-slate-200 bg-white py-0 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-red-200 group-hover:shadow-md"
                    >
                        {row.dispute_status === 'open' ? (
                            <span className="absolute inset-x-0 top-0 h-1 bg-red-500" />
                        ) : null}
                        <CardHeader className="p-4 pt-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-[0.08em] text-slate-400 uppercase">
                                        Dispute #{row.id}
                                    </p>
                                    <CardTitle className="mt-1 flex flex-wrap items-center gap-2 text-lg">
                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm font-bold text-slate-900">
                                            {row.order_number ?? `#${row.id}`}
                                        </span>
                                    </CardTitle>
                                </div>
                                <StatusBadge status={row.dispute_status} />
                            </div>
                        </CardHeader>
                        <CardContent className="grid flex-1 gap-4 p-4 pt-0">
                            <div className="flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
                                    {row.type_of_dispute_label ??
                                        'General dispute'}
                                </span>
                                {row.port ? (
                                    <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                                        {row.port}
                                    </span>
                                ) : null}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <Detail
                                    label="Customer"
                                    value={row.customer_name ?? 'Unassigned'}
                                />
                                <Detail
                                    label="Vessel"
                                    value={row.vessel_name ?? 'Unassigned'}
                                />
                                <Detail
                                    label="Created"
                                    value={shortDate(row.created_at)}
                                />
                                <Detail
                                    label="Value"
                                    value={formatMoney(row.dispute_value)}
                                    alignRight
                                />
                            </div>

                            <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                                <span className="truncate font-medium text-muted-foreground">
                                    {row.action_status
                                        ? row.action_status.replaceAll('_', ' ')
                                        : 'Action pending'}
                                </span>
                                <span className="font-semibold text-red-600 transition group-hover:text-red-700">
                                    Review
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </button>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: DisputeRow['dispute_status'] }) {
    if (status === 'closed') {
        return (
            <Badge
                variant="secondary"
                className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 capitalize"
            >
                Closed
            </Badge>
        );
    }

    return (
        <Badge className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 shadow-none ring-1 ring-red-100 hover:bg-red-50">
            Open
        </Badge>
    );
}

function Detail({
    label,
    value,
    alignRight = false,
}: {
    label: string;
    value: string;
    alignRight?: boolean;
}) {
    return (
        <span
            className={`min-w-0 rounded-lg bg-slate-50 px-3 py-2 ${
                alignRight ? 'sm:text-right' : ''
            }`}
        >
            <span className="block text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                {label}
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-slate-800">
                {value}
            </span>
        </span>
    );
}

export default function DisputesDashboard({
    disputes: rows,
    disputeTypeOptions,
    proposedActionPlanOptions,
    actionStatusOptions,
}: DisputesDashboardProps) {
    const [editing, setEditing] = useState<DisputeRow | null>(null);

    const openRows = rows.filter((row) => row.dispute_status !== 'closed');
    const closedRows = rows.filter((row) => row.dispute_status === 'closed');

    return (
        <>
            <Head title="Disputes" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {rows.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-muted-foreground">
                        No disputes yet.
                    </div>
                ) : (
                    <Tabs defaultValue="open" className="gap-4">
                        <TabsList
                            variant="line"
                            className="h-auto! w-full border-b"
                        >
                            <TabsTrigger
                                value="open"
                                className="px-4 py-2.5 text-base"
                            >
                                Open ({openRows.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="closed"
                                className="px-4 py-2.5 text-base"
                            >
                                Closed ({closedRows.length})
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="open">
                            <DisputeGrid
                                rows={openRows}
                                onSelect={setEditing}
                            />
                        </TabsContent>
                        <TabsContent value="closed">
                            <DisputeGrid
                                rows={closedRows}
                                onSelect={setEditing}
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {editing && (
                <DisputeEditDialog
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                    dispute={editing}
                    disputeTypeOptions={disputeTypeOptions}
                    proposedActionPlanOptions={proposedActionPlanOptions}
                    actionStatusOptions={actionStatusOptions}
                />
            )}
        </>
    );
}

DisputesDashboard.layout = {
    title: 'Disputes',
};
