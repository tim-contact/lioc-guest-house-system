import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock3, Ship, Waves } from 'lucide-react';
import type { ReactNode } from 'react';
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
import { cn, shortDate } from '@/lib/utils';
import { ebdn } from '@/routes/bdns';
import { complete as completeOrder } from '@/routes/surveyor';
import type { AgentOption, EnumOption, SupplyLocationOption } from '@/types';
import { BdnDialog } from './bdn-dialog';
import type { BdnRow } from './bdn-dialog';

export interface BargeOption {
    imo: string;
    name: string;
}

interface DeliveryScopeOption {
    value: string;
    label: string;
    sublabel: string;
}

export interface PendingRow {
    id: number;
    order_number: string;
    vessel_name: string | null;
    vessel_id: string | null;
    port: string | null;
    port_id: number | null;
    location: string | null;
    delivery_location_id: number | null;
    delivery_mode: string | null;
    barge_id: string | null;
    agent_id: number | null;
    pic: string | null;
    mobile_no: string | null;
    sampling: string | null;
    quality_claim: string | null;
    instructions: string | null;
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
    id: number;
    vessel_name: string | null;
    port: string | null;
    location: string | null;
    vlsfo_qty: string | null;
    mgo_qty: string | null;
    hsfo_qty: string | null;
    eta: string | null;
}

interface SurveyorDashboardProps {
    pendingOrders: PendingRow[];
    completedOrders: CompletedRow[];
    barges: BargeOption[];
    agents: AgentOption[];
    supplyLocationOptions: SupplyLocationOption[];
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
    ...FUEL_GRADES.map((grade) => `${grade.label} Qty`),
    'ETA Date',
    'ETA Time',
];

function shortTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function picLabel({ pic, mobile_no }: PendingRow): string {
    if (!pic) {
        return '—';
    }

    return mobile_no ? `${pic} (${mobile_no})` : pic;
}

function BargeOverviewStrip({
    barge,
    selectedScope,
    pendingCount,
    completedCount,
    children,
}: {
    barge: BargeOption | null;
    selectedScope?: DeliveryScopeOption | null;
    pendingCount: number;
    completedCount: number;
    children?: ReactNode;
}) {
    const stats = [
        {
            label: 'Pending',
            value: pendingCount,
            icon: Clock3,
            tone: 'text-[#1d4ed8]',
        },
        {
            label: 'Completed',
            value: completedCount,
            icon: CheckCircle2,
            tone: 'text-[#15803d]',
        },
    ];

    return (
        <section className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-white shadow-[0_10px_28px_rgba(38,42,48,0.06),0_2px_5px_rgba(38,42,48,0.04)]">
            <div className="grid gap-4 bg-[linear-gradient(135deg,#102a4c_0%,#164a73_58%,#1e7b83_100%)] p-4 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-5">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/14 text-white ring-1 ring-white/20"
                        aria-hidden="true"
                    >
                        <Ship className="size-6" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-[0.08em] text-white/75 uppercase">
                            Selected scope
                        </p>
                        <h1 className="mt-1 truncate text-xl leading-tight font-bold md:text-2xl">
                            {barge?.name ??
                                selectedScope?.label ??
                                'Select a scope'}
                        </h1>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/78">
                            <Waves className="size-4" aria-hidden="true" />
                            <span className="truncate">
                                {barge?.imo
                                    ? `IMO ${barge.imo}`
                                    : (selectedScope?.sublabel ??
                                      'No scope selected')}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    {stats.map(({ label, value, icon: Icon, tone }) => (
                        <div
                            key={label}
                            className="min-w-[7rem] rounded-lg border border-white/18 bg-white/92 px-3 py-2 text-[#102a4c] shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                        >
                            <div className="flex items-center gap-2 text-xs font-medium text-[#657185]">
                                <Icon className={cn('size-4', tone)} />
                                {label}
                            </div>
                            <div className="mt-1 text-xl font-bold tabular-nums">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {children && (
                <div className="border-t border-[#e2e0dc] bg-[#faf9f7] p-3 sm:p-4">
                    {children}
                </div>
            )}
        </section>
    );
}

function OperationalInstruction({ row }: { row: PendingRow }) {
    const pairs: [string, string][] = [
        ['Sampling', row.sampling ?? '—'],
        ['Claim', row.quality_claim ?? '—'],
    ];

    return (
        <div className="grid grid-cols-[auto_1fr_auto_1fr] items-baseline gap-x-3 gap-y-1 text-xs">
            <span className="text-muted-foreground">PIC</span>
            <span className="col-span-3 break-words">{picLabel(row)}</span>

            {pairs.map(([label, value]) => (
                <Fragment key={label}>
                    <span className="text-muted-foreground">{label}</span>
                    <span className="break-words">{value}</span>
                </Fragment>
            ))}

            {row.instructions && (
                <>
                    <span className="text-muted-foreground">Notes</span>
                    <span
                        className="col-span-3 line-clamp-2 break-words"
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
    const deliveryScopeOptions: DeliveryScopeOption[] = [
        {
            value: 'delivery:truck',
            label: 'Truck Deliveries',
            sublabel: 'Delivery mode',
        },
        {
            value: 'delivery:pipeline',
            label: 'Pipeline Deliveries',
            sublabel: 'Delivery mode',
        },
    ];

    const [selectedBarge, setSelectedBarge] = useState(
        assignedBarge?.imo ?? '',
    );
    const [bdnOrderId, setBdnOrderId] = useState<number | null>(null);
    const selectedDeliveryScope =
        deliveryScopeOptions.find((scope) => scope.value === selectedBarge) ??
        null;
    const selectedBargeDetails =
        assignedBarge ??
        barges.find((barge) => barge.imo === selectedBarge) ??
        null;

    // Derived, so the open dialog sees the BDN number its own first save assigned.
    const bdnOrder = pendingOrders.find((row) => row.id === bdnOrderId);

    return (
        <>
            <Head title="Surveyor" />

            <div className="flex flex-col gap-6 p-4">
                <BargeOverviewStrip
                    barge={selectedBargeDetails}
                    selectedScope={selectedDeliveryScope}
                    pendingCount={pendingOrders.length}
                    completedCount={completedOrders.length}
                >
                    {isSurveyor && assignedBarge ? (
                        <div className="text-sm text-[#657185]">
                            Assigned to{' '}
                            <span className="font-semibold text-[#102a4c]">
                                {assignedBarge.name}
                            </span>
                        </div>
                    ) : (
                        <div className="max-w-xs">
                            <SearchableCombobox
                                items={[
                                    ...barges.map((barge) => ({
                                        value: barge.imo,
                                        label: barge.name,
                                        sublabel: barge.imo,
                                    })),
                                    ...deliveryScopeOptions,
                                ]}
                                value={selectedBarge}
                                onChange={(value) => {
                                    setSelectedBarge(value);
                                    router.reload({
                                        data: { barge: value },
                                        only: [
                                            'pendingOrders',
                                            'completedOrders',
                                        ],
                                    });
                                }}
                                placeholder="Select scope"
                                searchPlaceholder="Search barge, truck, or pipeline"
                                emptyText="No delivery scopes available."
                            />
                        </div>
                    )}
                </BargeOverviewStrip>

                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Pending Orders (next 7 days)
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
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    setBdnOrderId(row.id)
                                                }
                                            >
                                                BDN
                                            </Button>
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
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <a
                                                    href={ebdn(row.id).url}
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
