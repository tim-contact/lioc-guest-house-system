import { Head } from '@inertiajs/react';
import { Scale } from 'lucide-react';
import { useState } from 'react';
import type { DisputeRow } from '@/components/dispute-edit-dialog';
import { DisputeEditDialog } from '@/components/dispute-edit-dialog';
import { DetailRow } from '@/components/edit-panel/fields';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMoney, shortDate } from '@/lib/utils';
import type { EnumOption } from '@/types';

/** Pastel tint per delivery port — colors the card frame (no red). */
const PORT_STYLE: Record<string, string> = {
    Colombo: 'border-info/40 bg-info/10 hover:ring-info/50',
    Trincomalee: 'border-success/40 bg-success/10 hover:ring-success/50',
    Galle: 'border-warning/40 bg-warning/10 hover:ring-warning/50',
    Hambantota:
        'border-violet-500/40 bg-violet-500/10 hover:ring-violet-500/50',
};

const NEUTRAL_PORT_STYLE = 'border-border bg-muted/40 hover:ring-foreground/30';

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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(24rem,1fr))] gap-8">
            {rows.map((row) => (
                <button
                    key={row.id}
                    type="button"
                    onClick={() => onSelect(row)}
                    className="block w-full text-left"
                >
                    <Card
                        className={`h-full min-h-56 cursor-pointer justify-center gap-4 border py-8 text-base transition [--card-spacing:--spacing(8)] hover:scale-[1.02] hover:ring-2 ${
                            PORT_STYLE[row.port ?? ''] ?? NEUTRAL_PORT_STYLE
                        }`}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-2xl">
                                        <Scale className="size-7" />
                                        {row.order_number ?? `#${row.id}`}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Dispute #{row.id}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        row.dispute_status === 'closed'
                                            ? 'secondary'
                                            : 'destructive'
                                    }
                                    className="text-sm capitalize"
                                >
                                    {row.dispute_status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <DetailRow
                                label="Created"
                                value={shortDate(row.created_at)}
                            />
                            <DetailRow
                                label="Customer"
                                value={row.customer_name ?? '—'}
                            />
                            <DetailRow
                                label="Type"
                                value={row.type_of_dispute_label ?? '—'}
                            />
                            <DetailRow
                                label="Value"
                                value={formatMoney(row.dispute_value)}
                            />
                        </CardContent>
                    </Card>
                </button>
            ))}
        </div>
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
