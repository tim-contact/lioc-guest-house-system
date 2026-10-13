import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowRightLeft,
    FileClock,
    Gauge,
    PackagePlus,
    Ship,
    Warehouse,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { EnumOption } from '@/types';

type ProductKey = 'mgo' | 'vlsfo' | 'hsfo';

interface PortOption {
    id: number;
    name: string;
}

interface BargeOption {
    imo: string;
    name: string;
}

type ProductTotals = Record<ProductKey, number>;

interface TerminalRow {
    date: string;
    opening: ProductTotals;
    opening_entries: ProductTotals;
    imports?: ProductTotals;
    rebond_sales?: ProductTotals;
    loadings: ProductTotals;
    dead_stock_opening: ProductTotals;
    dead_stock: ProductTotals;
    dead_stock_closing: ProductTotals;
    barge_loadings: ProductTotals;
    closing: ProductTotals;
}

interface BargeRow {
    date: string;
    barge_id: string;
    barge_name: string;
    vessel_names: string[];
    delivery_orders: {
        id: number;
        order_number: string | null;
        vessel_name: string | null;
        quantities: ProductTotals;
    }[];
    opening: ProductTotals;
    opening_entries: ProductTotals;
    loadings: ProductTotals;
    loading_movements: {
        id: number;
        quantities: ProductTotals;
    }[];
    deliveries: ProductTotals;
    closing: ProductTotals;
}

interface RecentMovement {
    id: number;
    movement_date: string;
    port_name: string | null;
    barge_name: string | null;
    movement_scope: string;
    movement_type: string;
    movement_type_label: string;
    counterparty_name: string | null;
    mgo_qty: string | number | null;
    vlsfo_qty: string | number | null;
    hsfo_qty: string | number | null;
    notes: string | null;
}

interface TrackedBargeStock {
    imo: string;
    name: string;
    totals: ProductTotals;
}

interface StockMovementsIndexProps {
    ports: PortOption[];
    barges: BargeOption[];
    movementScopeOptions: EnumOption[];
    movementTypeOptions: EnumOption[];
    filters: {
        port_id: number;
        date_from: string;
        date_to: string;
    };
    report: {
        terminal: TerminalRow[];
        barges: BargeRow[];
        totals: {
            terminal_closing?: ProductTotals;
            barge_closing?: ProductTotals;
            dead_stock?: ProductTotals;
            removable_closing?: ProductTotals;
        };
    };
    stockOverview: {
        colombo_terminal: ProductTotals;
        trinco_terminal: ProductTotals;
        tracked_barges: TrackedBargeStock[];
        balance_on_hand: ProductTotals;
    };
    recentMovements: RecentMovement[];
}

interface MovementFormData {
    movement_date: string;
    port_id: string;
    barge_id: string;
    movement_scope: string;
    movement_type: string;
    counterparty_name: string;
    mgo_qty: string;
    vlsfo_qty: string;
    hsfo_qty: string;
    notes: string;
    [key: string]: string;
}

const PRODUCTS: { key: ProductKey; label: string }[] = [
    { key: 'mgo', label: 'MGO' },
    { key: 'vlsfo', label: 'VLSFO' },
    { key: 'hsfo', label: 'HSFO' },
];

const MOVEMENT_OPTIONS = [
    {
        key: 'import',
        label: 'Import',
        scope: 'terminal',
        type: 'loading',
    },
    {
        key: 'load-barge',
        label: 'Load barge',
        scope: 'barge',
        type: 'loading',
    },
    {
        key: 'rebond-sale',
        label: 'Re-bond sale',
        scope: 'terminal',
        type: 'rebond_transfer',
    },
] as const;

function formatQty(value: string | number | null | undefined): string {
    const parsed = Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed === 0) {
        return '-';
    }

    return parsed.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function addTotals(first: ProductTotals, second: ProductTotals): ProductTotals {
    return PRODUCTS.reduce(
        (totals, product) => ({
            ...totals,
            [product.key]:
                Number(first[product.key] ?? 0) +
                Number(second[product.key] ?? 0),
        }),
        zeroTotals(),
    );
}

function subtractTotals(
    first: ProductTotals,
    second: ProductTotals,
): ProductTotals {
    return PRODUCTS.reduce(
        (totals, product) => ({
            ...totals,
            [product.key]:
                Number(first[product.key] ?? 0) -
                Number(second[product.key] ?? 0),
        }),
        zeroTotals(),
    );
}

function productTotal(totals: ProductTotals): number {
    return PRODUCTS.reduce(
        (sum, product) => sum + Number(totals[product.key] ?? 0),
        0,
    );
}

function productShare(totals: ProductTotals, product: ProductKey): number {
    const total = productTotal(totals);

    if (total <= 0) {
        return 0;
    }

    return Math.round((Number(totals[product] ?? 0) / total) * 100);
}

function positiveTotals(totals: ProductTotals): ProductTotals {
    return PRODUCTS.reduce(
        (positive, product) => ({
            ...positive,
            [product.key]: Math.max(0, Number(totals[product.key] ?? 0)),
        }),
        zeroTotals(),
    );
}

function hasNegativeBalance(totals: ProductTotals): boolean {
    return PRODUCTS.some((product) => Number(totals[product.key] ?? 0) < 0);
}

function productColor(product: ProductKey): string {
    return product === 'mgo'
        ? '#14B8A6'
        : product === 'vlsfo'
          ? '#2455E6'
          : '#F97316';
}

export default function StockMovementsIndex({
    ports,
    barges,
    filters,
    report,
    stockOverview,
    recentMovements,
}: StockMovementsIndexProps) {
    const movementForm = useForm<MovementFormData>({
        movement_date: filters.date_from,
        port_id: String(filters.port_id || ports[0]?.id || ''),
        barge_id: '',
        movement_scope: 'terminal',
        movement_type: 'loading',
        counterparty_name: '',
        mgo_qty: '',
        vlsfo_qty: '',
        hsfo_qty: '',
        notes: '',
    });
    const [showNote, setShowNote] = useState(false);
    const [selectedReportBargeId, setSelectedReportBargeId] = useState('');
    const selectedMovement =
        MOVEMENT_OPTIONS.find(
            (option) =>
                option.scope === movementForm.data.movement_scope &&
                option.type === movementForm.data.movement_type,
        ) ?? MOVEMENT_OPTIONS[0];
    const requiresBarge = selectedMovement.scope === 'barge';
    const showsCompany = selectedMovement.scope === 'terminal';
    const reportBarges = Array.from(
        new Map(
            report.barges.map((row) => [
                String(row.barge_id),
                { imo: String(row.barge_id), name: row.barge_name },
            ]),
        ).values(),
    );
    const activeReportBargeId = reportBarges.some(
        (barge) => barge.imo === selectedReportBargeId,
    )
        ? selectedReportBargeId
        : (reportBarges[0]?.imo ?? '');

    const selectMovement = (option: (typeof MOVEMENT_OPTIONS)[number]) => {
        movementForm.setData('movement_scope', option.scope);
        movementForm.setData('movement_type', option.type);

        if (option.scope !== 'barge') {
            movementForm.setData('barge_id', '');
        }

        if (option.scope === 'barge') {
            movementForm.setData('counterparty_name', '');
        }
    };

    const submitMovement = (event: FormEvent) => {
        event.preventDefault();

        movementForm.post('/stock-movements', {
            preserveScroll: true,
            onSuccess: () => {
                movementForm.reset(
                    'barge_id',
                    'counterparty_name',
                    'mgo_qty',
                    'vlsfo_qty',
                    'hsfo_qty',
                    'notes',
                );
                setShowNote(false);
            },
        });
    };

    const applyFilters = (nextFilters: Partial<typeof filters>) => {
        router.get(
            '/stock-movements',
            { ...filters, ...nextFilters },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const selectedPort = ports.find((port) => port.id === filters.port_id);
    const terminalClosing = report.totals.terminal_closing ?? zeroTotals();
    const bargeClosing = report.totals.barge_closing ?? zeroTotals();
    const deadStock = report.totals.dead_stock ?? zeroTotals();
    const removableClosing =
        report.totals.removable_closing ??
        subtractTotals(addTotals(terminalClosing, bargeClosing), deadStock);
    const balanceAfterDeliveries = addTotals(terminalClosing, bargeClosing);
    const latestTerminalRow = report.terminal.at(-1);

    return (
        <>
            <Head title="Stock Movement" />

            <main className="min-h-[calc(100svh-4.25rem)] bg-[#F2F1EF] px-3 py-4 sm:px-4 md:px-6">
                <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4">
                    <section className="rounded-lg border border-[#DCE3EC] bg-white shadow-xs">
                        <div className="flex flex-col gap-4 border-b border-[#E6EBF1] px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <h1 className="text-xl font-bold text-slate-900">
                                    Stock overview
                                </h1>
                                <p className="mt-1 text-sm text-[#64748B]">
                                    {selectedPort?.name ?? 'Port'} ·{' '}
                                    {filters.date_from} – {filters.date_to}
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px] lg:shrink-0">
                                <Field label="Port" htmlFor="stock-port">
                                    <select
                                        id="stock-port"
                                        value={filters.port_id}
                                        onChange={(event) =>
                                            applyFilters({
                                                port_id: Number(
                                                    event.target.value,
                                                ),
                                            })
                                        }
                                        className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
                                    >
                                        {ports.map((port) => (
                                            <option
                                                key={port.id}
                                                value={port.id}
                                            >
                                                {port.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="From" htmlFor="stock-date-from">
                                    <Input
                                        id="stock-date-from"
                                        className="h-10 min-w-0 rounded-lg border-slate-200 bg-white"
                                        type="date"
                                        value={filters.date_from}
                                        onChange={(event) =>
                                            applyFilters({
                                                date_from: event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field label="To" htmlFor="stock-date-to">
                                    <Input
                                        id="stock-date-to"
                                        className="h-10 min-w-0 rounded-lg border-slate-200 bg-white"
                                        type="date"
                                        value={filters.date_to}
                                        onChange={(event) =>
                                            applyFilters({
                                                date_to: event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="px-4 py-4">
                            <OverviewKpiCards overview={stockOverview} />
                        </div>
                    </section>

                    <Tabs defaultValue="daily-update" className="gap-4">
                        <TabsList className="flex h-12 w-full overflow-hidden rounded-lg border border-[#DCE3EC] bg-white p-0 shadow-sm">
                            <TabsTrigger
                                value="daily-update"
                                className="h-full min-w-0 flex-1 rounded-none border-b-2 border-transparent px-4 text-xs font-semibold after:hidden sm:text-sm data-active:border-[#2455E6] data-active:bg-[#F8FAFF] data-active:text-[#2455E6]"
                            >
                                Daily Update
                            </TabsTrigger>
                            <TabsTrigger
                                value="report-preview"
                                className="h-full min-w-0 flex-1 rounded-none border-b-2 border-transparent px-4 text-xs font-semibold after:hidden sm:text-sm data-active:border-[#2455E6] data-active:bg-[#F8FAFF] data-active:text-[#2455E6]"
                            >
                                Barge Stock Movement
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="h-full min-w-0 flex-1 rounded-none border-b-2 border-transparent px-4 text-xs font-semibold after:hidden sm:text-sm data-active:border-[#2455E6] data-active:bg-[#F8FAFF] data-active:text-[#2455E6]"
                            >
                                Terminal Stock Movement
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="daily-update" className="mt-0">
                            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                                <form
                                    onSubmit={submitMovement}
                                    className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-sm"
                                >
                                    <div className="mb-5">
                                        <h2 className="text-lg font-bold text-[#0F172A]">
                                            Record movement
                                        </h2>
                                    </div>

                                    <div className="grid gap-5">
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <FormField
                                                label="Date"
                                                error={
                                                    movementForm.errors
                                                        .movement_date
                                                }
                                            >
                                                <Input
                                                    type="date"
                                                    value={
                                                        movementForm.data
                                                            .movement_date
                                                    }
                                                    onChange={(event) =>
                                                        movementForm.setData(
                                                            'movement_date',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </FormField>
                                            <FormField
                                                label="Port"
                                                error={
                                                    movementForm.errors.port_id
                                                }
                                            >
                                                <select
                                                    value={
                                                        movementForm.data
                                                            .port_id
                                                    }
                                                    onChange={(event) =>
                                                        movementForm.setData(
                                                            'port_id',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="h-10 rounded-xl border border-[#D6DEE9] bg-white px-3 text-sm font-semibold text-[#172033] transition outline-none focus:border-[#2455E6] focus:ring-3 focus:ring-[#2455E6]/15"
                                                >
                                                    {ports.map((port) => (
                                                        <option
                                                            key={port.id}
                                                            value={port.id}
                                                        >
                                                            {port.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormField>
                                        </div>

                                        <div className="grid gap-2">
                                            <span className="text-xs font-semibold text-[#64748B]">
                                                Movement
                                            </span>
                                            <div className="grid gap-1.5 rounded-xl border border-[#D6DEE9] bg-[#F8FAFC] p-1 sm:grid-cols-3">
                                                {MOVEMENT_OPTIONS.map(
                                                    (option) => {
                                                        const active =
                                                            selectedMovement.key ===
                                                            option.key;

                                                        return (
                                                            <button
                                                                key={option.key}
                                                                type="button"
                                                                aria-pressed={
                                                                    active
                                                                }
                                                                onClick={() =>
                                                                    selectMovement(
                                                                        option,
                                                                    )
                                                                }
                                                                className={`h-9 rounded-lg px-3 text-sm font-bold transition focus-visible:ring-3 focus-visible:ring-[#2455E6]/25 focus-visible:outline-none ${
                                                                    active
                                                                        ? 'bg-[#2455E6] text-white shadow-sm'
                                                                        : 'text-[#475569] hover:bg-white hover:text-[#0F172A]'
                                                                }`}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                            {movementForm.errors
                                                .movement_type && (
                                                <span className="text-xs text-[#B91C1C]">
                                                    {
                                                        movementForm.errors
                                                            .movement_type
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                            {requiresBarge && (
                                                <FormField
                                                    label="Barge"
                                                    error={
                                                        movementForm.errors
                                                            .barge_id
                                                    }
                                                >
                                                    <select
                                                        value={
                                                            movementForm.data
                                                                .barge_id
                                                        }
                                                        onChange={(event) =>
                                                            movementForm.setData(
                                                                'barge_id',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="h-10 rounded-xl border border-[#D6DEE9] bg-white px-3 text-sm font-semibold text-[#172033] transition outline-none focus:border-[#2455E6] focus:ring-3 focus:ring-[#2455E6]/15"
                                                    >
                                                        <option value="">
                                                            Select barge
                                                        </option>
                                                        {barges.map((barge) => (
                                                            <option
                                                                key={barge.imo}
                                                                value={
                                                                    barge.imo
                                                                }
                                                            >
                                                                {barge.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormField>
                                            )}

                                            {showsCompany && (
                                                <FormField
                                                    label="Company"
                                                    error={
                                                        movementForm.errors
                                                            .counterparty_name
                                                    }
                                                >
                                                    <Input
                                                        value={
                                                            movementForm.data
                                                                .counterparty_name
                                                        }
                                                        onChange={(event) =>
                                                            movementForm.setData(
                                                                'counterparty_name',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Company name"
                                                    />
                                                </FormField>
                                            )}
                                        </div>

                                        <div className="grid gap-3">
                                            <span className="text-xs font-semibold text-[#64748B]">
                                                Quantity (MT)
                                            </span>
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {PRODUCTS.map((product) => (
                                                    <FormField
                                                        key={product.key}
                                                        label={product.label}
                                                        error={
                                                            movementForm.errors[
                                                                `${product.key}_qty`
                                                            ]
                                                        }
                                                    >
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.001"
                                                            value={
                                                                movementForm
                                                                    .data[
                                                                    `${product.key}_qty`
                                                                ]
                                                            }
                                                            onChange={(event) =>
                                                                movementForm.setData(
                                                                    `${product.key}_qty`,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="0.000"
                                                        />
                                                    </FormField>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            {showNote ? (
                                                <FormField label="Notes">
                                                    <Input
                                                        value={
                                                            movementForm.data
                                                                .notes
                                                        }
                                                        onChange={(event) =>
                                                            movementForm.setData(
                                                                'notes',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Optional note"
                                                    />
                                                </FormField>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowNote(true)
                                                    }
                                                    className="text-sm font-bold text-[#2455E6] transition hover:text-[#123B9F] focus-visible:ring-3 focus-visible:ring-[#2455E6]/25 focus-visible:outline-none"
                                                >
                                                    + Add note
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 border-t border-[#E6EBF1] pt-4 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-xs font-medium text-[#64748B]">
                                                The daily report updates after
                                                you save.
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    movementForm.processing
                                                }
                                                className="bg-[#2455E6] text-white hover:bg-[#123B9F] sm:ml-auto"
                                            >
                                                Save movement
                                            </Button>
                                        </div>
                                    </div>
                                </form>

                                <DailyReportPreview
                                    portName={
                                        selectedPort?.name ?? 'Selected port'
                                    }
                                    date={filters.date_to}
                                    terminalClosing={terminalClosing}
                                    bargeClosing={bargeClosing}
                                    deadStock={deadStock}
                                    removableClosing={removableClosing}
                                    balanceAfterDeliveries={
                                        balanceAfterDeliveries
                                    }
                                    latestTerminalRow={latestTerminalRow}
                                    bargeRows={report.barges}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="report-preview" className="mt-0">
                            <div className="grid gap-4">
                                <ReportSection
                                    icon={<Ship className="size-5" />}
                                    title="Barge Stock Movement"
                                    subtitle="Opening + terminal-to-barge loading - surveyor BDN delivery quantities"
                                >
                                    <BargeReportFilter
                                        barges={reportBarges}
                                        value={activeReportBargeId}
                                        onChange={setSelectedReportBargeId}
                                    />
                                    <BargeTable
                                        rows={report.barges}
                                        bargeId={activeReportBargeId}
                                    />
                                </ReportSection>
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0">
                            <ReportSection
                                icon={<FileClock className="size-5" />}
                                title="Recent Manual Entries"
                                subtitle="Latest imports, terminal-to-barge loadings and re-bond sales"
                            >
                                <RecentMovementsTable
                                    movements={recentMovements}
                                />
                            </ReportSection>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </>
    );
}

StockMovementsIndex.layout = {
    title: 'Stock Movement',
};

function zeroTotals(): ProductTotals {
    return { mgo: 0, vlsfo: 0, hsfo: 0 };
}

function Field({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={htmlFor} className="text-xs text-[#64748B]">
                {label}
            </Label>
            {children}
        </div>
    );
}

function FormField({
    label,
    children,
    error,
}: {
    label: string;
    children: ReactNode;
    error?: string;
}) {
    return (
        <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#64748B]">
                {label}
            </span>
            {children}
            {error && <span className="text-xs text-[#B91C1C]">{error}</span>}
        </label>
    );
}

function OverviewKpiCards({
    overview,
}: {
    overview: StockMovementsIndexProps['stockOverview'];
}) {
    const bargeTotals = overview.tracked_barges.reduce(
        (totals, barge) => addTotals(totals, barge.totals),
        zeroTotals(),
    );
    return (
        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewStockCard
                title="Colombo terminal"
                totals={overview.colombo_terminal}
            />
            <OverviewStockCard
                title="Trincomalee terminal"
                totals={overview.trinco_terminal}
            />
            <OverviewStockCard title="Barge stocks" totals={bargeTotals} />
            <OverviewBalanceCard totals={overview.balance_on_hand} />
        </div>
    );
}

function OverviewStockCard({
    title,
    totals,
}: {
    title: string;
    totals: ProductTotals;
}) {
    return (
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                    {title}
                </h2>
                <span className="text-xs text-slate-500">MT</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {PRODUCTS.map((product) => {
                    const quantity = reportQty(totals[product.key]);
                    return (
                        <div key={product.key} className="min-w-0">
                            <p className="mb-2 text-xs text-slate-500">
                                {product.label}
                            </p>
                            <p
                                className={`leading-snug font-bold [overflow-wrap:anywhere] tabular-nums ${quantity.length > 9 ? 'text-sm' : 'text-lg'} ${Number(totals[product.key]) < 0 ? 'text-red-700' : 'text-slate-900'}`}
                            >
                                {quantity}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function OverviewBalanceCard({ totals }: { totals: ProductTotals }) {
    const total = productTotal(totals);
    const hasCompleteBalance = PRODUCTS.every(
        (product) =>
            totals[product.key] !== null &&
            totals[product.key] !== undefined &&
            Number.isFinite(Number(totals[product.key])),
    );
    const hasMeaningfulComposition =
        hasCompleteBalance && total > 0 && !hasNegativeBalance(totals);
    const shareTotals = hasMeaningfulComposition
        ? positiveTotals(totals)
        : zeroTotals();
    return (
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                    Balance on hand
                </h2>
                <span className="text-xs text-slate-500">MT</span>
            </div>
            <p
                className={`text-2xl leading-snug font-bold [overflow-wrap:anywhere] tabular-nums ${total < 0 ? 'text-red-700' : 'text-slate-900'}`}
            >
                {reportQty(hasCompleteBalance ? total : null)}
            </p>
            <div
                className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={
                    hasMeaningfulComposition
                        ? PRODUCTS.map(
                              (product) =>
                                  `${product.label} ${productShare(shareTotals, product.key)}%`,
                          ).join(', ')
                        : 'Product shares unavailable'
                }
            >
                {hasMeaningfulComposition &&
                    PRODUCTS.map((product) => (
                        <span
                            key={product.key}
                            className="h-full"
                            style={{
                                backgroundColor: productColor(product.key),
                                width: `${(Number(shareTotals[product.key]) / total) * 100}%`,
                            }}
                        />
                    ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
                {PRODUCTS.map((product) => (
                    <div key={product.key} className="min-w-0 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500">
                            <span
                                className="size-1.5 shrink-0 rounded-full"
                                style={{
                                    backgroundColor: productColor(product.key),
                                }}
                            />
                            {product.label}
                        </span>
                        <span className="mt-1 block font-semibold text-slate-900 tabular-nums">
                            {hasMeaningfulComposition
                                ? `${productShare(shareTotals, product.key)}%`
                                : '—'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DailyReportPreview({
    portName,
    date,
    terminalClosing,
    bargeClosing,
    deadStock,
    removableClosing,
    balanceAfterDeliveries,
    latestTerminalRow,
    bargeRows,
}: {
    portName: string;
    date: string;
    terminalClosing: ProductTotals;
    bargeClosing: ProductTotals;
    deadStock: ProductTotals;
    removableClosing: ProductTotals;
    balanceAfterDeliveries: ProductTotals;
    latestTerminalRow?: TerminalRow;
    bargeRows: BargeRow[];
}) {
    const reportDate = latestTerminalRow?.date ?? date;
    const todayDeliveries = bargeRows
        .filter((row) => row.date === reportDate)
        .reduce(
            (totals, row) => addTotals(totals, row.deliveries),
            zeroTotals(),
        );
    const preDeliveryRemovable = addTotals(removableClosing, todayDeliveries);
    const imports = latestTerminalRow?.imports ?? latestTerminalRow?.loadings;
    const reportRows = [
        ['Terminal', terminalClosing, false],
        ['Barges', bargeClosing, false],
        ['Dead stock', deadStock, false],
        ['Available after deliveries', removableClosing, true],
    ] as const;

    return (
        <aside className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-sm">
            <div className="mb-3">
                <h2 className="text-base font-bold text-[#0F172A]">
                    Daily bunker report
                </h2>
                <p className="mt-0.5 text-xs font-medium text-[#64748B]">
                    {portName} · {reportDate} · MT
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#E6EBF1]">
                <table className="w-full border-collapse text-xs">
                    <thead className="bg-[#F8FAFC] text-[#64748B]">
                        <tr>
                            <th className="px-3 py-2 text-left font-bold">
                                Stock
                            </th>
                            {PRODUCTS.map((product) => (
                                <th
                                    key={product.key}
                                    className="px-3 py-2 text-right font-bold"
                                >
                                    {product.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {reportRows.map(([label, totals, highlight]) => (
                            <tr
                                key={label}
                                className={`border-t border-[#EDF2F7] ${
                                    highlight
                                        ? 'bg-[#EEF4FF] font-bold text-[#123B9F]'
                                        : 'text-[#172033]'
                                }`}
                            >
                                <td className="px-3 py-2 font-semibold">
                                    {label}
                                </td>
                                {PRODUCTS.map((product) => (
                                    <ReportAmountCell
                                        key={product.key}
                                        value={totals[product.key]}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <details className="mt-3 rounded-xl border border-[#E6EBF1] bg-[#FBFCFE]">
                <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-[#2455E6] transition outline-none hover:text-[#123B9F] focus-visible:ring-3 focus-visible:ring-[#2455E6]/20">
                    View movements and stock breakdown
                </summary>
                <div className="grid gap-2 border-t border-[#E6EBF1] p-3">
                    <CompactReportRow
                        label="Imports"
                        totals={imports ?? zeroTotals()}
                    />
                    <CompactReportRow
                        label="Re-bond sales"
                        totals={latestTerminalRow?.rebond_sales ?? zeroTotals()}
                    />
                    <CompactReportRow
                        label="Barge loading"
                        totals={
                            latestTerminalRow?.barge_loadings ?? zeroTotals()
                        }
                    />
                    <CompactReportRow
                        label="Gross balance"
                        totals={balanceAfterDeliveries}
                    />
                    <CompactReportRow
                        label="Pre-delivery removable stock"
                        totals={preDeliveryRemovable}
                    />
                    <CompactReportRow
                        label="Terminal stock"
                        totals={terminalClosing}
                    />
                    <CompactReportRow
                        label="Barge stock"
                        totals={bargeClosing}
                    />
                    <CompactReportRow label="Dead stock" totals={deadStock} />
                </div>
            </details>
        </aside>
    );
}

function reportQty(value: number | null | undefined): string {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return '—';
    }

    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });
}

function ReportAmountCell({ value }: { value: number | null | undefined }) {
    const numericValue = Number(value ?? 0);

    return (
        <td
            className={`px-3 py-2 text-right tabular-nums ${
                numericValue < 0 ? 'text-[#B42318]' : ''
            }`}
        >
            {reportQty(value)}
        </td>
    );
}

function CompactReportRow({
    label,
    totals,
}: {
    label: string;
    totals: ProductTotals;
}) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(56px,72px))] items-center gap-2 text-xs">
            <span className="min-w-0 truncate font-semibold text-[#475569]">
                {label}
            </span>
            {PRODUCTS.map((product) => (
                <span
                    key={product.key}
                    className={`text-right font-bold tabular-nums ${
                        Number(totals[product.key] ?? 0) < 0
                            ? 'text-[#B42318]'
                            : 'text-[#172033]'
                    }`}
                >
                    {reportQty(totals[product.key])}
                </span>
            ))}
        </div>
    );
}

function BargeReportFilter({
    barges,
    value,
    onChange,
}: {
    barges: BargeOption[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="mb-4 w-full sm:max-w-xs">
            <Field label="Barge" htmlFor="report-barge">
                <select
                    id="report-barge"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={barges.length === 0}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 disabled:opacity-50"
                >
                    {barges.length === 0 && (
                        <option value="">No barges available</option>
                    )}
                    {barges.map((barge) => (
                        <option key={barge.imo} value={barge.imo}>
                            {barge.name}
                        </option>
                    ))}
                </select>
            </Field>
        </div>
    );
}

interface BargeMovementRow extends BargeRow {
    key: string;
    order_number: string;
    vessel_name: string | null;
}

function bargeMovementRows(
    rows: BargeRow[],
    bargeId: string,
): BargeMovementRow[] {
    return rows
        .filter((row) => String(row.barge_id) === bargeId)
        .flatMap((row) => {
            const movements: BargeMovementRow[] = [];
            let balance = addTotals(row.opening, row.opening_entries);

            row.loading_movements.forEach((loading) => {
                const closing = addTotals(balance, loading.quantities);
                movements.push({
                    ...row,
                    key: `${row.date}-${row.barge_id}-loading-${loading.id}`,
                    order_number: `Terminal loading #${loading.id}`,
                    vessel_name: null,
                    opening: balance,
                    opening_entries: zeroTotals(),
                    loadings: loading.quantities,
                    deliveries: zeroTotals(),
                    closing,
                });
                balance = closing;
            });

            if (
                row.loading_movements.length === 0 &&
                row.delivery_orders.length === 0
            ) {
                movements.push({
                    ...row,
                    key: `${row.date}-${row.barge_id}-opening`,
                    order_number: 'Opening balance',
                    vessel_name: null,
                    opening: balance,
                    opening_entries: zeroTotals(),
                    loadings: zeroTotals(),
                    deliveries: zeroTotals(),
                    closing: balance,
                });
            }

            row.delivery_orders.forEach((delivery, index) => {
                const closing =
                    index === row.delivery_orders.length - 1
                        ? row.closing
                        : subtractTotals(balance, delivery.quantities);
                movements.push({
                    ...row,
                    key: `${row.date}-${row.barge_id}-${delivery.id}`,
                    order_number: delivery.order_number ?? '-',
                    vessel_name: delivery.vessel_name,
                    opening: balance,
                    opening_entries: zeroTotals(),
                    loadings: zeroTotals(),
                    deliveries: delivery.quantities,
                    closing,
                });
                balance = closing;
            });

            return movements;
        });
}

function BargeTable({ rows, bargeId }: { rows: BargeRow[]; bargeId: string }) {
    const filteredRows = bargeMovementRows(rows, bargeId);

    return (
        <TableFrame>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead rowSpan={2}>Date</TableHead>
                        <TableHead rowSpan={2}>Order / Movement</TableHead>
                        <TableHead rowSpan={2}>Vessel</TableHead>
                        {PRODUCTS.map((product) => (
                            <TableHead
                                key={product.key}
                                colSpan={3}
                                className="border-l text-center"
                            >
                                {product.label} (MT)
                            </TableHead>
                        ))}
                    </TableRow>
                    <TableRow>
                        {PRODUCTS.map((product) =>
                            ['Opening', 'Movement', 'Closing'].map(
                                (label, index) => (
                                    <TableHead
                                        key={`${product.key}-${label}`}
                                        className={`text-right ${index === 0 ? 'border-l' : ''}`}
                                    >
                                        {label}
                                    </TableHead>
                                ),
                            ),
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredRows.map((row) => (
                        <TableRow key={row.key}>
                            <TableCell className="font-semibold whitespace-nowrap text-[#172033]">
                                {row.date}
                            </TableCell>
                            <TableCell className="text-xs font-semibold whitespace-nowrap text-[#172033]">
                                {row.order_number}
                            </TableCell>
                            <TableCell className="max-w-64 min-w-40 text-sm whitespace-normal text-slate-900">
                                {row.vessel_name ?? '—'}
                            </TableCell>
                            {PRODUCTS.map((product) => (
                                <BargeProductCells
                                    key={product.key}
                                    row={row}
                                    product={product.key}
                                />
                            ))}
                        </TableRow>
                    ))}
                    {filteredRows.length === 0 && <EmptyRow colSpan={12} />}
                </TableBody>
            </Table>
        </TableFrame>
    );
}

function BargeProductCells({
    row,
    product,
}: {
    row: BargeRow;
    product: ProductKey;
}) {
    const loading = row.loadings[product];
    const delivery = row.deliveries[product];

    return (
        <>
            <ProductTableCell
                value={addTotals(row.opening, row.opening_entries)[product]}
                className="border-l"
            />
            <TableCell className="text-right text-xs font-semibold whitespace-nowrap tabular-nums">
                {loading !== 0 && (
                    <div
                        className={
                            loading < 0 ? 'text-red-700' : 'text-blue-600'
                        }
                        title="Loading"
                    >
                        {loading > 0 ? '+' : '-'}
                        {reportQty(Math.abs(loading))}
                    </div>
                )}
                {delivery !== 0 && (
                    <div
                        className={
                            delivery > 0 ? 'text-red-700' : 'text-blue-600'
                        }
                        title="Delivery"
                    >
                        {delivery > 0 ? '-' : '+'}
                        {reportQty(Math.abs(delivery))}
                    </div>
                )}
                {loading === 0 && delivery === 0 && (
                    <span className="text-slate-500">{reportQty(0)}</span>
                )}
            </TableCell>
            <ProductTableCell value={row.closing[product]} />
        </>
    );
}

function ProductTableCell({
    value,
    className = '',
}: {
    value: number | null | undefined;
    className?: string;
}) {
    const numericValue = Number(value ?? 0);

    return (
        <TableCell
            className={`${className} text-right text-xs font-semibold whitespace-nowrap tabular-nums ${
                numericValue < 0 ? 'text-[#B42318]' : 'text-[#172033]'
            }`}
        >
            {reportQty(value)}
        </TableCell>
    );
}

function RecentMovementsTable({ movements }: { movements: RecentMovement[] }) {
    return (
        <TableFrame>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Barge / Company</TableHead>
                        <ProductHeads />
                        <TableHead>Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((movement) => (
                        <TableRow key={movement.id}>
                            <TableCell>{movement.movement_date}</TableCell>
                            <TableCell className="font-semibold">
                                {movement.movement_type_label}
                            </TableCell>
                            <TableCell className="capitalize">
                                {movement.movement_scope}
                            </TableCell>
                            <TableCell>
                                {movement.barge_name ??
                                    movement.counterparty_name ??
                                    '-'}
                            </TableCell>
                            {PRODUCTS.map((product) => (
                                <TableCell
                                    key={product.key}
                                    className="text-right text-xs font-semibold tabular-nums"
                                >
                                    {formatQty(movement[`${product.key}_qty`])}
                                </TableCell>
                            ))}
                            <TableCell className="max-w-60 truncate text-[#64748B]">
                                {movement.notes ?? '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                    {movements.length === 0 && <EmptyRow colSpan={8} />}
                </TableBody>
            </Table>
        </TableFrame>
    );
}

function SummaryCards({
    portName,
    terminalClosing,
    bargeClosing,
    deadStock,
    removableClosing,
}: {
    portName: string;
    terminalClosing: ProductTotals;
    bargeClosing: ProductTotals;
    deadStock: ProductTotals;
    removableClosing: ProductTotals;
}) {
    return (
        <div className="grid gap-3 xl:grid-cols-4">
            <SummaryCard
                title={`${portName} Terminal Closing`}
                subtitle="Stock remaining at terminal"
                icon={<Warehouse className="size-5" />}
                totals={terminalClosing}
            />
            <SummaryCard
                title="Barge Closing Stock"
                subtitle="Stock currently held on barges"
                icon={<Ship className="size-5" />}
                totals={bargeClosing}
            />
            <SummaryCard
                title="Dead Stock"
                subtitle="Not removable from terminal"
                icon={<Gauge className="size-5" />}
                totals={deadStock}
            />
            <SummaryCard
                title="Stock Removable"
                subtitle="Terminal + barge - dead stock"
                icon={<PackagePlus className="size-5" />}
                totals={removableClosing}
            />
        </div>
    );
}

function SummaryCard({
    title,
    subtitle,
    icon,
    totals,
}: {
    title: string;
    subtitle: string;
    icon: ReactNode;
    totals: ProductTotals;
}) {
    return (
        <div className="rounded-2xl border border-[#E3EAF2] bg-[#FBFCFE] p-4">
            <div className="mb-4 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2455E6]">
                    {icon}
                </span>
                <div>
                    <h2 className="text-sm font-bold text-[#0F172A]">
                        {title}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#64748B]">{subtitle}</p>
                </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
                {PRODUCTS.map((product) => (
                    <div
                        key={product.key}
                        className="rounded-xl border border-[#E7EDF4] bg-white px-3 py-2"
                    >
                        <span className="text-[11px] font-bold text-[#64748B]">
                            {product.label}
                        </span>
                        <span className="mt-1 block text-base font-bold text-[#172033] tabular-nums">
                            {formatQty(totals[product.key])} MT
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReportSection({
    title,
    subtitle,
    icon,
    children,
}: {
    title: string;
    subtitle: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    {icon && (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#2455E6]">
                            {icon}
                        </span>
                    )}
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-[#0F172A]">
                            {title}
                        </h2>
                        <p className="mt-0.5 text-xs text-[#64748B]">
                            {subtitle}
                        </p>
                    </div>
                </div>
            </div>
            <div className="px-4 pb-4">{children}</div>
        </section>
    );
}

function TableFrame({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-[#E3EAF2] bg-white">
            {children}
        </div>
    );
}

function ProductHeads({ prefix }: { prefix?: string }) {
    return (
        <>
            {PRODUCTS.map((product) => (
                <TableHead
                    key={`${prefix ?? 'product'}-${product.key}`}
                    className="min-w-24 text-right text-[11px] font-bold tracking-wide text-[#64748B] uppercase"
                >
                    {prefix ? `${prefix} ${product.label}` : product.label}
                </TableHead>
            ))}
        </>
    );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
    return (
        <TableRow>
            <TableCell
                colSpan={colSpan}
                className="py-8 text-center text-sm text-[#64748B]"
            >
                No stock movement rows for this selection yet.
            </TableCell>
        </TableRow>
    );
}
