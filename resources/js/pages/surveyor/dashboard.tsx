import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    CircleCheck,
    ClipboardList,
    Clock3,
    FilePenLine,
    Fuel,
    Inbox,
    MapPin,
    Ship,
    Waves,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { TableFrame } from '@/components/table-frame';
import { Badge } from '@/components/ui/badge';
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
    assignedDeliveryModes?: string[];
    selectedScope?: string | null;
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

function etaLabel(value: string | null): string {
    if (!value) {
        return 'ETA not set';
    }

    const eta = new Date(value);

    if (Number.isNaN(eta.getTime())) {
        return 'ETA not set';
    }

    const today = new Date();
    const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );
    const startOfEta = new Date(
        eta.getFullYear(),
        eta.getMonth(),
        eta.getDate(),
    );
    const daysAway = Math.round(
        (startOfEta.getTime() - startOfToday.getTime()) / 86_400_000,
    );

    if (daysAway < 0) {
        return 'Overdue';
    }

    if (daysAway === 0) {
        return 'Arriving today';
    }

    if (daysAway === 1) {
        return 'Tomorrow';
    }

    return `In ${daysAway} days`;
}

function orderProducts(row: PendingRow | CompletedRow) {
    return FUEL_GRADES.map((grade) => ({
        key: grade.key,
        label: grade.label,
        quantity: row[`${grade.key}_qty`],
    })).filter(({ quantity }) => {
        if (!quantity) {
            return false;
        }

        const numericQuantity = Number(quantity);

        return !Number.isFinite(numericQuantity) || numericQuantity > 0;
    });
}

function sortedByEta<T extends { eta: string | null }>(rows: T[]): T[] {
    return [...rows].sort((first, second) => {
        const firstTime = first.eta ? new Date(first.eta).getTime() : Infinity;
        const secondTime = second.eta
            ? new Date(second.eta).getTime()
            : Infinity;

        return firstTime - secondTime;
    });
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
            icon: CircleCheck,
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

function ProductQuantities({ row }: { row: PendingRow | CompletedRow }) {
    const products = orderProducts(row);

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <div className="flex items-start gap-2">
                <Fuel
                    className="mt-0.5 size-4 shrink-0 text-[#1d4ed8]"
                    aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                    {products.length > 0 ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {products.map((product) => (
                                <span
                                    key={product.key}
                                    className="text-sm whitespace-nowrap text-slate-700"
                                >
                                    <span className="font-semibold text-slate-950">
                                        {product.label}
                                    </span>{' '}
                                    {product.quantity} MT
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Quantities not entered
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function RouteSummary({ row }: { row: PendingRow | CompletedRow }) {
    return (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-[360px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[360px]:items-center">
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    Port
                </div>
                <p className="mt-0.5 text-sm font-semibold break-words text-slate-950">
                    {row.port ?? 'Not assigned'}
                </p>
            </div>
            <ArrowRight
                className="hidden size-4 text-slate-400 min-[360px]:block"
                aria-hidden="true"
            />
            <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">
                    Supply location
                </div>
                <p className="mt-0.5 text-sm font-semibold break-words text-slate-950">
                    {row.location ?? 'Not assigned'}
                </p>
            </div>
        </div>
    );
}

function OrderMetaGrid({ row }: { row: PendingRow | CompletedRow }) {
    const sampling =
        'sampling' in row && row.sampling ? `Sampling · ${row.sampling}` : null;
    const instructions =
        'instructions' in row && row.instructions ? row.instructions : null;

    return (
        <div className="grid gap-2 min-[390px]:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    ETA
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                    {shortDate(row.eta)} · {shortTime(row.eta)}
                </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <ClipboardList className="size-3.5" aria-hidden="true" />
                    Instruction
                </div>
                <p className="mt-1 text-sm font-semibold break-words text-slate-950">
                    {sampling ?? 'No instruction'}
                </p>
                {instructions ? (
                    <p className="mt-1 text-xs leading-5 break-words text-slate-600">
                        {instructions}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function PendingOrderCard({
    row,
    onCreateBdn,
}: {
    row: PendingRow;
    onCreateBdn: () => void;
}) {
    const etaText = etaLabel(row.eta);
    const isOverdue = etaText === 'Overdue';

    return (
        <article className="rounded-[14px] border border-slate-200 bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base leading-6 font-bold break-words text-slate-950">
                        {row.vessel_name ?? 'Untitled vessel'}
                    </h3>
                    <p
                        className={cn(
                            'mt-0.5 text-sm font-medium',
                            isOverdue ? 'text-red-700' : 'text-slate-600',
                        )}
                    >
                        {etaText}
                    </p>
                </div>
                <Badge className="shrink-0 border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800">
                    Pending
                </Badge>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
                <RouteSummary row={row} />
                <OrderMetaGrid row={row} />
                <ProductQuantities row={row} />
            </div>

            <Button
                type="button"
                className="mt-3 h-11 w-full rounded-lg bg-[#1d4ed8] text-base font-semibold text-white hover:bg-[#1e40af]"
                onClick={onCreateBdn}
            >
                <FilePenLine className="size-4" aria-hidden="true" />
                Create BDN
            </Button>
        </article>
    );
}

function CompletedOrderCard({ row }: { row: CompletedRow }) {
    return (
        <article className="rounded-[14px] border border-slate-200 bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base leading-6 font-bold break-words text-slate-950">
                        {row.vessel_name ?? 'Untitled vessel'}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-slate-600">
                        {etaLabel(row.eta)}
                    </p>
                </div>
                <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800">
                    Completed
                </Badge>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
                <RouteSummary row={row} />
                <OrderMetaGrid row={row} />
                <ProductQuantities row={row} />
            </div>

            <Button
                type="button"
                variant="outline"
                className="mt-3 h-11 w-full rounded-lg border-slate-300 bg-white text-base font-semibold"
                asChild
            >
                <a
                    href={ebdn(row.id).url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View BDN
                </a>
            </Button>
        </article>
    );
}

function OperationalInstruction({ row }: { row: PendingRow }) {
    const pairs: [string, string][] = [['Sampling', row.sampling ?? '—']];

    return (
        <div className="grid grid-cols-[auto_1fr_auto_1fr] items-baseline gap-x-3 gap-y-1 text-xs">
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
    assignedDeliveryModes = [],
    selectedScope,
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

    const assignedDeliveryScopeValues = new Set(
        assignedDeliveryModes.map((mode) => `delivery:${mode}`),
    );
    const availableDeliveryScopeOptions = isSurveyor
        ? deliveryScopeOptions.filter((scope) =>
              assignedDeliveryScopeValues.has(scope.value),
          )
        : deliveryScopeOptions;
    const scopeOptions = [
        ...barges.map((barge) => ({
            value: barge.imo,
            label: barge.name,
            sublabel: barge.imo,
        })),
        ...availableDeliveryScopeOptions,
    ];
    const canSelectScope = scopeOptions.length > 1;
    const [selectedBarge, setSelectedBarge] = useState(
        selectedScope ?? assignedBarge?.imo ?? scopeOptions[0]?.value ?? '',
    );
    const [bdnOrderId, setBdnOrderId] = useState<number | null>(null);
    const [mobileTab, setMobileTab] = useState<'pending' | 'completed'>(
        pendingOrders.length > 0 ? 'pending' : 'completed',
    );
    const selectedDeliveryScope =
        availableDeliveryScopeOptions.find(
            (scope) => scope.value === selectedBarge,
        ) ?? null;
    const selectedBargeDetails =
        assignedBarge ??
        barges.find((barge) => barge.imo === selectedBarge) ??
        null;

    // Derived, so the open dialog sees the BDN number its own first save assigned.
    const bdnOrder = pendingOrders.find((row) => row.id === bdnOrderId);
    const mobilePendingOrders = sortedByEta(pendingOrders);
    const mobileCompletedOrders = sortedByEta(completedOrders);

    return (
        <>
            <Head title="Surveyor" />

            <div className="flex flex-col gap-3 p-3 md:gap-6 md:p-4">
                <BargeOverviewStrip
                    barge={selectedBargeDetails}
                    selectedScope={selectedDeliveryScope}
                    pendingCount={pendingOrders.length}
                    completedCount={completedOrders.length}
                >
                    {isSurveyor && !canSelectScope ? (
                        <div className="text-sm text-[#657185]">
                            Assigned to{' '}
                            <span className="font-semibold text-[#102a4c]">
                                {selectedBargeDetails?.name ??
                                    selectedDeliveryScope?.label ??
                                    'No assigned scope'}
                            </span>
                        </div>
                    ) : (
                        <div className="w-full sm:max-w-xs">
                            <SearchableCombobox
                                items={scopeOptions}
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

                <section className="md:hidden">
                    <div
                        className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
                        role="tablist"
                        aria-label="Surveyor orders"
                    >
                        {[
                            {
                                id: 'pending',
                                label: `Pending · ${pendingOrders.length}`,
                            },
                            {
                                id: 'completed',
                                label: `Completed · ${completedOrders.length}`,
                            },
                        ].map((tab) => {
                            const selected = mobileTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    aria-controls={`mobile-${tab.id}-orders`}
                                    id={`mobile-${tab.id}-tab`}
                                    className={cn(
                                        'flex h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:outline-none',
                                        selected
                                            ? 'bg-[#e7f0ff] text-[#1d4ed8]'
                                            : 'text-slate-600',
                                    )}
                                    onClick={() =>
                                        setMobileTab(
                                            tab.id as 'pending' | 'completed',
                                        )
                                    }
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        id="mobile-pending-orders"
                        role="tabpanel"
                        aria-labelledby="mobile-pending-tab"
                        hidden={mobileTab !== 'pending'}
                        className="mt-3"
                    >
                        <div className="mb-2.5 flex items-center justify-between gap-3 px-0.5">
                            <h2 className="text-base font-bold text-slate-950">
                                Next 7 days
                            </h2>
                            <span className="text-xs font-medium text-slate-500">
                                Sorted by ETA
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {mobilePendingOrders.map((row) => (
                                <PendingOrderCard
                                    key={row.id}
                                    row={row}
                                    onCreateBdn={() => setBdnOrderId(row.id)}
                                />
                            ))}

                            {mobilePendingOrders.length === 0 ? (
                                <div className="rounded-[14px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                                    <Inbox
                                        className="mx-auto size-8 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <h3 className="mt-3 text-base font-bold text-slate-950">
                                        No pending orders
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Orders for the next 7 days will appear
                                        here.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div
                        id="mobile-completed-orders"
                        role="tabpanel"
                        aria-labelledby="mobile-completed-tab"
                        hidden={mobileTab !== 'completed'}
                        className="mt-3"
                    >
                        <div className="mb-2.5 flex items-center justify-between gap-3 px-0.5">
                            <h2 className="text-base font-bold text-slate-950">
                                Completed orders
                            </h2>
                            <span className="text-xs font-medium text-slate-500">
                                Last 7 days
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {mobileCompletedOrders.map((row) => (
                                <CompletedOrderCard key={row.id} row={row} />
                            ))}

                            {mobileCompletedOrders.length === 0 ? (
                                <div className="rounded-[14px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                                    <Inbox
                                        className="mx-auto size-8 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <h3 className="mt-3 text-base font-bold text-slate-950">
                                        No completed orders yet
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Completed orders from the last 7 days
                                        will appear here.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="hidden flex-col gap-4 md:flex">
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

                <section className="hidden flex-col gap-4 md:flex">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Completed Orders (last 7 days)
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
