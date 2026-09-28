import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowRightLeft,
    FileClock,
    Gauge,
    PackagePlus,
    Ship,
    Warehouse,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
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
    opening: ProductTotals;
    opening_entries: ProductTotals;
    loadings: ProductTotals;
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

function formatQty(value: string | number | null | undefined): string {
    const parsed = Number(value ?? 0);

    if (!Number.isFinite(parsed) || parsed === 0) {
        return '-';
    }

    return parsed.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function productCells(totals: ProductTotals) {
    return PRODUCTS.map((product) => (
        <TableCell
            key={product.key}
            className="text-right text-xs font-semibold tabular-nums text-[#172033]"
        >
            {formatQty(totals[product.key])}
        </TableCell>
    ));
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
    movementTypeOptions,
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

    const submitMovement = (event: FormEvent) => {
        event.preventDefault();

        movementForm.post('/stock-movements', {
            preserveScroll: true,
            onSuccess: () =>
                movementForm.reset(
                    'barge_id',
                    'counterparty_name',
                    'mgo_qty',
                    'vlsfo_qty',
                    'hsfo_qty',
                    'notes',
                ),
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
                    <section className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-[#E6EBF1] px-4 py-4 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                                    Stock control
                                </p>
                                <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">
                                    {selectedPort?.name ?? 'Port'} stock movement
                                </h1>
                                <p className="mt-1 text-sm text-[#64748B]">
                                    A simple view of terminal stock, barge stock,
                                    loadings and BDN deliveries.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3 md:min-w-[620px]">
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
                                        className="h-10 rounded-xl border border-[#D6DEE9] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#172033] outline-none transition focus:border-[#2455E6] focus:bg-white"
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
                                <Field
                                    label="From"
                                    htmlFor="stock-date-from"
                                >
                                    <Input
                                        id="stock-date-from"
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
                                Report Preview
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="h-full min-w-0 flex-1 rounded-none border-b-2 border-transparent px-4 text-xs font-semibold after:hidden sm:text-sm data-active:border-[#2455E6] data-active:bg-[#F8FAFF] data-active:text-[#2455E6]"
                            >
                                History
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="daily-update" className="mt-0">
                            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                                <form
                                    onSubmit={submitMovement}
                                    className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm"
                                >
                                    <div className="border-b border-[#E6EBF1] px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-10 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2455E6]">
                                                <PackagePlus className="size-5" />
                                            </span>
                                            <div>
                                                <h2 className="text-base font-bold text-[#0F172A]">
                                                    Record today&apos;s movement
                                                </h2>
                                                <p className="text-xs text-[#64748B]">
                                                    Pick the task and enter the
                                                    quantity. The report updates
                                                    from the saved movement.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 p-4">
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
                                                    className="h-10 rounded-xl border border-[#D6DEE9] bg-white px-3 text-sm"
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

                                        <FriendlyPanel
                                            title="What are you updating?"
                                            description="These replace the sheet rows with simple tasks."
                                        >
                                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                                <MovementChoice
                                                    title="Terminal stock"
                                                    description="Opening or import at terminal"
                                                    icon={
                                                        <Warehouse className="size-4" />
                                                    }
                                                    active={
                                                        movementForm.data
                                                            .movement_scope ===
                                                            'terminal' &&
                                                        [
                                                            'opening',
                                                            'loading',
                                                            'rebond_transfer',
                                                        ].includes(
                                                            movementForm.data
                                                                .movement_type,
                                                        )
                                                    }
                                                    onClick={() => {
                                                        movementForm.setData(
                                                            'movement_scope',
                                                            'terminal',
                                                        );
                                                        movementForm.setData(
                                                            'movement_type',
                                                            'loading',
                                                        );
                                                        movementForm.setData(
                                                            'barge_id',
                                                            '',
                                                        );
                                                    }}
                                                />
                                                <MovementChoice
                                                    title="Barge stock"
                                                    description="Opening stock on a barge"
                                                    icon={
                                                        <Ship className="size-4" />
                                                    }
                                                    active={
                                                        movementForm.data
                                                            .movement_scope ===
                                                            'barge' &&
                                                        movementForm.data
                                                            .movement_type ===
                                                            'opening'
                                                    }
                                                    onClick={() => {
                                                        movementForm.setData(
                                                            'movement_scope',
                                                            'barge',
                                                        );
                                                        movementForm.setData(
                                                            'movement_type',
                                                            'opening',
                                                        );
                                                    }}
                                                />
                                                <MovementChoice
                                                    title="Transfer"
                                                    description="Terminal to barge loading"
                                                    icon={
                                                        <ArrowRightLeft className="size-4" />
                                                    }
                                                    active={
                                                        movementForm.data
                                                            .movement_scope ===
                                                            'barge' &&
                                                        movementForm.data
                                                            .movement_type ===
                                                            'loading'
                                                    }
                                                    onClick={() => {
                                                        movementForm.setData(
                                                            'movement_scope',
                                                            'barge',
                                                        );
                                                        movementForm.setData(
                                                            'movement_type',
                                                            'loading',
                                                        );
                                                    }}
                                                />
                                                <MovementChoice
                                                    title="Dead stock"
                                                    description="Deduct non-removable stock"
                                                    icon={
                                                        <Gauge className="size-4" />
                                                    }
                                                    active={
                                                        movementForm.data
                                                            .movement_scope ===
                                                            'terminal' &&
                                                        movementForm.data
                                                            .movement_type ===
                                                            'dead_stock'
                                                    }
                                                    onClick={() => {
                                                        movementForm.setData(
                                                            'movement_scope',
                                                            'terminal',
                                                        );
                                                        movementForm.setData(
                                                            'movement_type',
                                                            'dead_stock',
                                                        );
                                                        movementForm.setData(
                                                            'barge_id',
                                                            '',
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </FriendlyPanel>

                                        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                                            <FriendlyPanel
                                                title="Location details"
                                                description="Only choose a barge when the movement affects a barge."
                                            >
                                                <div className="grid gap-3">
                                                    <FormField
                                                        label="Movement type"
                                                        error={
                                                            movementForm.errors
                                                                .movement_type
                                                        }
                                                    >
                                                        <select
                                                            value={
                                                                movementForm
                                                                    .data
                                                                    .movement_type
                                                            }
                                                            onChange={(event) =>
                                                                movementForm.setData(
                                                                    'movement_type',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-10 rounded-xl border border-[#D6DEE9] bg-white px-3 text-sm"
                                                        >
                                                            {movementTypeOptions
                                                                .filter(
                                                                    (
                                                                        option,
                                                                    ) =>
                                                                        option.value !==
                                                                            'adjustment' &&
                                                                        (movementForm
                                                                            .data
                                                                            .movement_scope ===
                                                                            'terminal' ||
                                                                            ![
                                                                                'rebond_transfer',
                                                                                'dead_stock',
                                                                            ].includes(
                                                                                option.value,
                                                                            )),
                                                                )
                                                                .map((
                                                                    option,
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </FormField>
                                                    <FormField
                                                        label="Barge"
                                                        error={
                                                            movementForm.errors
                                                                .barge_id
                                                        }
                                                    >
                                                        <select
                                                            value={
                                                                movementForm
                                                                    .data
                                                                    .barge_id
                                                            }
                                                            onChange={(event) =>
                                                                movementForm.setData(
                                                                    'barge_id',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            disabled={
                                                                movementForm
                                                                    .data
                                                                    .movement_scope !==
                                                                'barge'
                                                            }
                                                            className="h-10 rounded-xl border border-[#D6DEE9] bg-white px-3 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                                                        >
                                                            <option value="">
                                                                Select barge
                                                            </option>
                                                            {barges.map(
                                                                (barge) => (
                                                                    <option
                                                                        key={
                                                                            barge.imo
                                                                        }
                                                                        value={
                                                                            barge.imo
                                                                        }
                                                                    >
                                                                        {
                                                                            barge.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </FormField>
                                                    <FormField label="Counterparty / Company">
                                                        <Input
                                                            value={
                                                                movementForm
                                                                    .data
                                                                    .counterparty_name
                                                            }
                                                            onChange={(event) =>
                                                                movementForm.setData(
                                                                    'counterparty_name',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Southern Star"
                                                        />
                                                    </FormField>
                                                </div>
                                            </FriendlyPanel>

                                            <FriendlyPanel
                                                title="Quantity in MT"
                                                description="Use positive values for opening stock, loadings, transfers and dead stock."
                                            >
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    {PRODUCTS.map((product) => (
                                                        <FormField
                                                            key={product.key}
                                                            label={
                                                                product.label
                                                            }
                                                            error={
                                                                movementForm
                                                                    .errors[
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
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    movementForm.setData(
                                                                        `${product.key}_qty`,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="0.000"
                                                            />
                                                        </FormField>
                                                    ))}
                                                </div>
                                                <div className="mt-3">
                                                    <FormField label="Notes">
                                                        <Input
                                                            value={
                                                                movementForm
                                                                    .data.notes
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
                                                </div>
                                            </FriendlyPanel>
                                        </div>

                                        <div className="flex flex-col gap-2 rounded-2xl bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-xs text-[#64748B]">
                                                Deliveries are deducted from
                                                completed BDN quantities. Manual
                                                entries are for opening stock,
                                                imports, transfers and dead
                                                stock.
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    movementForm.processing
                                                }
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
                                    terminalClosing={terminalClosing}
                                    bargeClosing={bargeClosing}
                                    deadStock={deadStock}
                                    removableClosing={removableClosing}
                                    balanceAfterDeliveries={
                                        balanceAfterDeliveries
                                    }
                                    latestTerminalRow={latestTerminalRow}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="report-preview" className="mt-0">
                            <div className="grid gap-4">
                                <BalanceOnHandCard
                                    totals={removableClosing}
                                />
                                <ReportSection
                                    icon={<Warehouse className="size-5" />}
                                    title={`${selectedPort?.name ?? 'Port'} Terminal Stock`}
                                    subtitle="Opening + loadings / re-bond transfers - barge loadings"
                                >
                                    <TerminalTable rows={report.terminal} />
                                </ReportSection>
                                <ReportSection
                                    icon={<Ship className="size-5" />}
                                    title="Barge Stock Movement"
                                    subtitle="Opening + operations loading - surveyor BDN delivery quantities"
                                >
                                    <BargeTable rows={report.barges} />
                                </ReportSection>
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0">
                            <ReportSection
                                icon={<FileClock className="size-5" />}
                                title="Recent Manual Entries"
                                subtitle="Latest opening, loading, re-bond transfer and dead stock records"
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

function FriendlyPanel({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-[#E3EAF2] bg-[#F8FAFC] p-3">
            <div className="mb-3">
                <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">{description}</p>
            </div>
            {children}
        </section>
    );
}

function MovementChoice({
    title,
    description,
    icon,
    active,
    onClick,
}: {
    title: string;
    description: string;
    icon: ReactNode;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-3 text-left transition ${
                active
                    ? 'border-[#2455E6] bg-[#EEF4FF] text-[#123B9F]'
                    : 'border-[#DDE6F0] bg-white text-[#172033] hover:border-[#BFD0E6]'
            }`}
        >
            <span
                className={`mb-3 flex size-8 items-center justify-center rounded-xl ${
                    active ? 'bg-[#2455E6] text-white' : 'bg-[#F1F5F9]'
                }`}
            >
                {icon}
            </span>
            <span className="block text-sm font-bold">{title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#64748B]">
                {description}
            </span>
        </button>
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
        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="grid gap-2.5 lg:grid-cols-3">
                <PortTerminalCard
                    title="Colombo Terminal Closing"
                    subtitle="Terminal stock at Colombo"
                    totals={overview.colombo_terminal}
                />
                <PortTerminalCard
                    title="Trincomalee Terminal Closing"
                    subtitle="Terminal stock at Trincomalee"
                    totals={overview.trinco_terminal}
                />
                <TrackedBargesCard
                    barges={overview.tracked_barges}
                    totals={bargeTotals}
                />
            </div>
            <BalancePieCard totals={overview.balance_on_hand} />
        </div>
    );
}

function PortTerminalCard({
    title,
    subtitle,
    totals,
}: {
    title: string;
    subtitle: string;
    totals: ProductTotals;
}) {
    return (
        <div className="h-fit rounded-xl border border-[#E1E8F0] bg-[#FBFCFE] p-3 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
            <div className="mb-2.5 border-l-2 border-[#2455E6] pl-2.5">
                <h2 className="text-[13px] font-bold text-[#0F172A]">
                    {title}
                </h2>
                <p className="mt-0.5 text-[11px] text-[#64748B]">{subtitle}</p>
            </div>
            <ProductMiniGrid totals={totals} />
        </div>
    );
}

function TrackedBargesCard({
    barges,
    totals,
}: {
    barges: TrackedBargeStock[];
    totals: ProductTotals;
}) {
    return (
        <div className="h-fit rounded-xl border border-[#E1E8F0] bg-[#FBFCFE] p-3 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
            <div className="mb-2.5 border-l-2 border-[#2455E6] pl-2.5">
                <h2 className="text-[13px] font-bold text-[#0F172A]">
                    Barge Stocks
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-[#64748B]">
                    Ceylon Star, Southern Star, Sanvi69
                </p>
            </div>
            <ProductMiniGrid totals={totals} />
            <div className="mt-2 flex flex-wrap gap-1">
            </div>
        </div>
    );
}

function BalancePieCard({ totals }: { totals: ProductTotals }) {
    const hasMeaningfulComposition =
        productTotal(totals) > 0 && !hasNegativeBalance(totals);
    const pieTotals = hasMeaningfulComposition
        ? positiveTotals(totals)
        : zeroTotals();
    const mgoShare = productShare(pieTotals, 'mgo');
    const vlsfoShare = productShare(pieTotals, 'vlsfo');
    const hsfoShare = productShare(pieTotals, 'hsfo');

    return (
        <div className="h-fit rounded-xl border border-[#E1E8F0] bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
            <div className="mb-2.5">
                <h2 className="text-[13px] font-bold text-[#0F172A]">
                    Balance on Hand by Product
                </h2>
                <p className="mt-0.5 text-[11px] text-[#64748B]">
                    Colombo + Trincomalee + tracked barges
                </p>
            </div>
            {hasMeaningfulComposition ? (
                <div className="flex items-center gap-3">
                    <div
                        className="grid size-[5.5rem] shrink-0 place-items-center rounded-full"
                        style={{
                            background: `conic-gradient(${productColor('mgo')} 0 ${mgoShare}%, ${productColor('vlsfo')} ${mgoShare}% ${mgoShare + vlsfoShare}%, ${productColor('hsfo')} ${mgoShare + vlsfoShare}% ${mgoShare + vlsfoShare + hsfoShare}%, #E2E8F0 ${mgoShare + vlsfoShare + hsfoShare}% 100%)`,
                        }}
                    >
                        <div className="grid size-12 place-items-center rounded-full bg-white px-1.5 text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                            <span className="text-[10px] font-bold leading-3 text-[#0F172A]">
                                {formatQty(productTotal(pieTotals))}
                                <span className="block text-[9px] font-semibold text-[#94A3B8]">
                                    MT
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="grid flex-1 gap-1.5">
                        {PRODUCTS.map((product) => (
                            <div
                                key={product.key}
                                className="flex items-center justify-between gap-2 text-[11px]"
                            >
                                <span className="flex items-center gap-2 font-semibold text-[#475569]">
                                    <span
                                        className="size-2.5 rounded-full"
                                        style={{
                                            backgroundColor: productColor(
                                                product.key,
                                            ),
                                        }}
                                    />
                                    {product.label}
                                </span>
                                <span className="font-bold tabular-nums text-[#172033]">
                                    {productShare(pieTotals, product.key)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid gap-2">
                    <p className="rounded-xl bg-[#F8FAFC] px-2.5 py-2 text-[11px] font-semibold text-[#64748B]">
                        Balance summary shown because these values are not a
                        nonnegative composition.
                    </p>
                    <ProductValueList totals={totals} />
                </div>
            )}
        </div>
    );
}

function ProductMiniGrid({ totals }: { totals: ProductTotals }) {
    return (
        <div className="grid grid-cols-3 gap-1.5">
            {PRODUCTS.map((product) => (
                <div
                    key={product.key}
                    className="min-w-0 rounded-lg border border-[#E7EDF4] bg-white px-2 py-1.5"
                >
                    <span
                        className="text-[10px] font-bold"
                        style={{ color: productColor(product.key) }}
                    >
                        {product.label}
                    </span>
                    <span
                        className={`mt-0.5 block whitespace-nowrap text-right text-[11px] font-bold tabular-nums 2xl:text-xs ${
                            Number(totals[product.key] ?? 0) < 0
                                ? 'text-[#B42318]'
                                : 'text-[#172033]'
                        }`}
                    >
                        {formatQty(totals[product.key])} MT
                    </span>
                </div>
            ))}
        </div>
    );
}

function ProductValueList({ totals }: { totals: ProductTotals }) {
    return (
        <div className="grid gap-1.5">
            {PRODUCTS.map((product) => (
                <div
                    key={product.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E7EDF4] bg-white px-3 py-2 text-xs"
                >
                    <span className="flex items-center gap-2 font-semibold text-[#475569]">
                        <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: productColor(product.key) }}
                        />
                        {product.label}
                    </span>
                    <span
                        className={`whitespace-nowrap font-bold tabular-nums ${
                            Number(totals[product.key] ?? 0) < 0
                                ? 'text-[#B42318]'
                                : 'text-[#172033]'
                        }`}
                    >
                        {formatQty(totals[product.key])} MT
                    </span>
                </div>
            ))}
        </div>
    );
}

function DailyReportPreview({
    portName,
    terminalClosing,
    bargeClosing,
    deadStock,
    removableClosing,
    balanceAfterDeliveries,
    latestTerminalRow,
}: {
    portName: string;
    terminalClosing: ProductTotals;
    bargeClosing: ProductTotals;
    deadStock: ProductTotals;
    removableClosing: ProductTotals;
    balanceAfterDeliveries: ProductTotals;
    latestTerminalRow?: TerminalRow;
}) {
    return (
        <aside className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
            <div className="border-b border-[#E6EBF1] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                    Live preview
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#0F172A]">
                    Daily bunker report
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                    This is the friendly replacement for the daily sheet.
                </p>
            </div>

            <div className="grid gap-4 p-4">
                <ReportPreviewBlock title={`Stock at ${portName}`}>
                    <PreviewProductRow
                        label="Terminal stock"
                        totals={terminalClosing}
                    />
                    <PreviewProductRow
                        label="Barge stock"
                        totals={bargeClosing}
                    />
                    <PreviewProductRow
                        label="Less dead stock"
                        totals={deadStock}
                    />
                    <PreviewProductRow
                        label="Total stock removable"
                        totals={removableClosing}
                        strong
                    />
                </ReportPreviewBlock>

                <ReportPreviewBlock title="Today’s movement summary">
                    <PreviewProductRow
                        label="Loadings / re-bond transfer"
                        totals={latestTerminalRow?.loadings ?? zeroTotals()}
                    />
                    <PreviewProductRow
                        label="Barge loading"
                        totals={
                            latestTerminalRow?.barge_loadings ?? zeroTotals()
                        }
                    />
                    <PreviewProductRow
                        label="Dead stock entered"
                        totals={latestTerminalRow?.dead_stock ?? zeroTotals()}
                    />
                </ReportPreviewBlock>

                <ReportPreviewBlock title="Balance after deliveries">
                    <PreviewProductRow
                        label="Gross balance"
                        totals={balanceAfterDeliveries}
                    />
                    <PreviewProductRow
                        label="Removable balance"
                        totals={removableClosing}
                        strong
                    />
                </ReportPreviewBlock>

                <BalanceOnHandCard totals={removableClosing} compact />
            </div>
        </aside>
    );
}

function ReportPreviewBlock({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-[#E3EAF2] bg-[#FBFCFE] p-3">
            <h3 className="mb-3 text-sm font-bold text-[#0F172A]">{title}</h3>
            <div className="grid gap-2">{children}</div>
        </div>
    );
}

function PreviewProductRow({
    label,
    totals,
    strong = false,
}: {
    label: string;
    totals: ProductTotals;
    strong?: boolean;
}) {
    return (
        <div
            className={`grid grid-cols-[1fr_repeat(3,minmax(0,84px))] items-center gap-2 rounded-xl px-3 py-2 ${
                strong ? 'bg-[#EEF4FF]' : 'bg-white'
            }`}
        >
            <span
                className={`min-w-0 truncate text-xs ${
                    strong
                        ? 'font-bold text-[#123B9F]'
                        : 'font-semibold text-[#475569]'
                }`}
            >
                {label}
            </span>
            {PRODUCTS.map((product) => (
                <span
                    key={product.key}
                    className="text-right text-xs font-bold tabular-nums text-[#172033]"
                >
                    {formatQty(totals[product.key])}
                </span>
            ))}
        </div>
    );
}

function BalanceOnHandCard({
    totals,
    compact = false,
}: {
    totals: ProductTotals;
    compact?: boolean;
}) {
    return (
        <section
            className={`rounded-2xl border border-[#E3EAF2] bg-white ${
                compact ? 'p-3' : 'p-4 shadow-sm'
            }`}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">
                        Balance on hand
                    </h3>
                    <p className="text-xs text-[#64748B]">
                        Product share of current balance
                    </p>
                </div>
                <span className="rounded-full bg-[#0F172A] px-3 py-1 text-xs font-bold text-white">
                    MT
                </span>
            </div>
            <div className="grid gap-3">
                {PRODUCTS.map((product) => {
                    const share = productShare(totals, product.key);

                    return (
                        <div key={product.key} className="grid gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#475569]">
                                    {product.label}
                                </span>
                                <span className="font-bold tabular-nums text-[#172033]">
                                    {share}%
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#E8EEF5]">
                                <div
                                    className="h-full rounded-full bg-[#2455E6]"
                                    style={{ width: `${share}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function TerminalTable({ rows }: { rows: TerminalRow[] }) {
    return (
        <TableFrame>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <ProductHeads prefix="Opening" />
                        <ProductHeads prefix="Load / Transfer" />
                        <ProductHeads prefix="Dead Stock" />
                        <ProductHeads prefix="Barge Loading" />
                        <ProductHeads prefix="Closing" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.date}>
                            <TableCell className="font-semibold text-[#172033]">
                                {row.date}
                            </TableCell>
                            {productCells(
                                addTotals(row.opening, row.opening_entries),
                            )}
                            {productCells(row.loadings)}
                            {productCells(row.dead_stock_closing)}
                            {productCells(row.barge_loadings)}
                            {productCells(row.closing)}
                        </TableRow>
                    ))}
                    {rows.length === 0 && <EmptyRow colSpan={16} />}
                </TableBody>
            </Table>
        </TableFrame>
    );
}

function BargeTable({ rows }: { rows: BargeRow[] }) {
    return (
        <TableFrame>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Barge</TableHead>
                        <ProductHeads prefix="Opening" />
                        <ProductHeads prefix="Loading" />
                        <ProductHeads prefix="Deliveries" />
                        <ProductHeads prefix="Closing" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={`${row.date}-${row.barge_id}`}>
                            <TableCell className="font-semibold text-[#172033]">
                                {row.date}
                            </TableCell>
                            <TableCell className="font-semibold text-[#172033]">
                                {row.barge_name}
                            </TableCell>
                            {productCells(
                                addTotals(row.opening, row.opening_entries),
                            )}
                            {productCells(row.loadings)}
                            {productCells(row.deliveries)}
                            {productCells(row.closing)}
                        </TableRow>
                    ))}
                    {rows.length === 0 && <EmptyRow colSpan={14} />}
                </TableBody>
            </Table>
        </TableFrame>
    );
}

function RecentMovementsTable({
    movements,
}: {
    movements: RecentMovement[];
}) {
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
                                    {formatQty(
                                        movement[`${product.key}_qty`],
                                    )}
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
                        <span className="mt-1 block text-base font-bold tabular-nums text-[#172033]">
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
                    className="min-w-24 text-right text-[11px] font-bold uppercase tracking-wide text-[#64748B]"
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
