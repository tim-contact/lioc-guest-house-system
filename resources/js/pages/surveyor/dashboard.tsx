import { Head, router, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { TableFrame } from '@/components/table-frame';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FUEL_GRADES } from '@/lib/domain';
import { formatMoney, shortDate } from '@/lib/utils';
import { ebdn } from '@/routes/bdns';
import { complete as completeOrder } from '@/routes/surveyor';
import type { AgentOption, EnumOption } from '@/types';
import { BdnDialog } from './bdn-dialog';
import type { BdnRow } from './bdn-dialog';

export interface BargeOption {
    imo: string;
    name: string;
}

export interface PendingRow {
    id: number;
    order_number: string;
    vessel_name: string | null;
    vessel_id: string | null;
    port: string | null;
    location: string | null;
    delivery_location: string | null;
    delivery_mode: string | null;
    barge_id: string | null;
    agent_id: number | null;
    pic: string | null;
    mobile_no: string | null;
    sampling: string | null;
    quality_claim: string | null;
    instructions: string | null;
    barging_cost: string | null;
    vlsfo_qty: string | null;
    mgo_qty: string | null;
    hsfo_qty: string | null;
    vlsfo_bdn_qty: string | null;
    mgo_bdn_qty: string | null;
    hsfo_bdn_qty: string | null;
    grades: EnumOption[];
    bdn: BdnRow | null;
    eta: string | null;
}

interface CompletedRow {
    id: string;
    order_id: number;
    vessel_name: string | null;
    port: string | null;
    location: string | null;
    product: string;
    qty: string | null;
    eta: string | null;
}

interface SurveyorDashboardProps {
    pendingOrders: PendingRow[];
    completedOrders: CompletedRow[];
    barges: BargeOption[];
    agents: AgentOption[];
    supplyLocationOptions: EnumOption[];
    deliveryMethodOptions: EnumOption[];
    samplingLocationOptions: EnumOption[];
    samplingMethodOptions: EnumOption[];
    assignedBarge?: BargeOption | null;
}

const PENDING_COLUMNS = [
    'Vessel Name',
    'Port',
    'Supply Location',
    ...FUEL_GRADES.map((grade) => `${grade.label} Qty`),
    'ETA Date',
    'ETA Time',
    'Operational Instruction',
];

const COMPLETED_COLUMNS = [
    'Vessel Name',
    'Port',
    'Supply Location',
    'Product',
    'Qty',
    'ETA Date',
    'ETA Time',
] as const;

function shortTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function picLabel({ pic, mobile_no }: PendingRow): string {
    if (!pic) {
        return '—';
    }

    return mobile_no ? `${pic} (${mobile_no})` : pic;
}

function OperationalInstruction({ row }: { row: PendingRow }) {
    const details: [string, string][] = [
        ['PIC', picLabel(row)],
        ['Sampling', row.sampling ?? '—'],
        ['Claim', row.quality_claim ?? '—'],
        ['Barging', formatMoney(row.barging_cost)],
    ];

    return (
        <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-3 text-xs">
            {details.map(([label, value]) => (
                <Fragment key={label}>
                    <span className="text-muted-foreground">{label}</span>
                    <span>{value}</span>
                </Fragment>
            ))}

            {row.instructions && (
                <>
                    <span className="text-muted-foreground">Notes</span>
                    <span
                        className="col-span-3 line-clamp-2"
                        title={row.instructions}
                    >
                        {row.instructions}
                    </span>
                </>
            )}
        </div>
    );
}

export default function SurveyorDashboard({
    pendingOrders,
    completedOrders,
    barges,
    agents,
    supplyLocationOptions,
    deliveryMethodOptions,
    samplingLocationOptions,
    samplingMethodOptions,
    assignedBarge,
}: SurveyorDashboardProps) {
    const { auth } = usePage().props;
    const userType = auth.user?.type ?? '';
    const isSurveyor = userType === 'surveyor';

    const [selectedBarge, setSelectedBarge] = useState(
        assignedBarge?.imo ?? '',
    );
    const [bdnOrderId, setBdnOrderId] = useState<number | null>(null);

    // Derived, so the open dialog sees the BDN number its own first save assigned.
    const bdnOrder = pendingOrders.find((row) => row.id === bdnOrderId);

    const handleComplete = (id: number) =>
        router.patch(completeOrder(id).url, {}, { preserveScroll: true });

    return (
        <>
            <Head title="Surveyor" />

            <div className="flex flex-col gap-6 p-4">
                <div className="max-w-xs">
                    {isSurveyor && assignedBarge ? (
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Assigned barge:</span>
                            <span className="font-medium">{assignedBarge.name}</span>
                            <span className="text-xs text-muted-foreground">({assignedBarge.imo})</span>
                        </div>
                    ) : (
                        <SearchableCombobox
                            items={barges.map((barge) => ({
                                value: barge.imo,
                                label: barge.name,
                                sublabel: barge.imo,
                            }))}
                            value={selectedBarge}
                            onChange={(value) => {
                                setSelectedBarge(value);
                                router.reload({
                                    data: { barge: value },
                                    only: ['pendingOrders', 'completedOrders'],
                                });
                            }}
                            placeholder="Select barge"
                            searchPlaceholder="Search barge name or IMO"
                            emptyText="No barges available."
                        />
                    )}
                </div>

                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Pending Orders (next 3 days)
                    </h2>
                    <TableFrame>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {PENDING_COLUMNS.map((column) => (
                                        <TableHead key={column}>
                                            {column}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingOrders.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            {row.vessel_name ?? '—'}
                                        </TableCell>
                                        <TableCell>{row.port ?? '—'}</TableCell>
                                        <TableCell>
                                            {row.location ?? '—'}
                                        </TableCell>
                                        {FUEL_GRADES.map((grade) => (
                                            <TableCell key={grade.key}>
                                                {row[`${grade.key}_qty`] ?? '—'}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            {shortDate(row.eta)}
                                        </TableCell>
                                        <TableCell>
                                            {shortTime(row.eta)}
                                        </TableCell>
                                        <TableCell className="max-w-md align-top whitespace-normal">
                                            <OperationalInstruction row={row} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Upload
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setBdnOrderId(row.id)
                                                    }
                                                >
                                                    BDN
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleComplete(row.id)
                                                    }
                                                >
                                                    Submit
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {pendingOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={PENDING_COLUMNS.length + 1}
                                            className="text-center text-muted-foreground"
                                        >
                                            No orders.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableFrame>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Completed Orders (last 30 days)
                    </h2>
                    <TableFrame>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {COMPLETED_COLUMNS.map((column) => (
                                        <TableHead key={column}>
                                            {column}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {completedOrders.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            {row.vessel_name ?? '—'}
                                        </TableCell>
                                        <TableCell>{row.port ?? '—'}</TableCell>
                                        <TableCell>
                                            {row.location ?? '—'}
                                        </TableCell>
                                        <TableCell>{row.product}</TableCell>
                                        <TableCell>{row.qty ?? '—'}</TableCell>
                                        <TableCell>
                                            {shortDate(row.eta)}
                                        </TableCell>
                                        <TableCell>
                                            {shortTime(row.eta)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={
                                                        ebdn(row.order_id).url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    eBDN
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {completedOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                COMPLETED_COLUMNS.length + 1
                                            }
                                            className="text-center text-muted-foreground"
                                        >
                                            No orders.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableFrame>
                </section>
            </div>

            {bdnOrder && (
                <BdnDialog
                    open
                    onOpenChange={(open) => !open && setBdnOrderId(null)}
                    order={bdnOrder}
                    barges={barges}
                    agents={agents}
                    supplyLocationOptions={supplyLocationOptions}
                    deliveryMethodOptions={deliveryMethodOptions}
                    samplingLocationOptions={samplingLocationOptions}
                    samplingMethodOptions={samplingMethodOptions}
                />
            )}
        </>
    );
}

SurveyorDashboard.layout = {
    title: 'Surveyor',
};
