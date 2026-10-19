import { Head, router } from '@inertiajs/react';
import { CheckCircle2, CreditCard, XCircle } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    PaginationControls,
    type PaginationMeta,
} from '@/components/pagination-controls';
import {
    ALL_PORTS_VALUE,
    PortScopedOrderSearch,
    type PortSearchState,
} from '@/components/port-scoped-order-search';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { SortDir } from '@/hooks/use-sortable';
import type { ExportColumn } from '@/lib/export-xlsx';
import { exportToXlsx } from '@/lib/export-xlsx';
import { cn, formatMoney, productColor, shortDate } from '@/lib/utils';
import { close as closeFinanceOrder } from '@/routes/finance';
import type { EnumOption } from '@/types';
import { AddPaymentDialog } from './add-payment-dialog';
import {
    FinanceSummaryCards,
    type FinanceSummaryBucket,
} from './summary-cards';

export interface PaymentRow {
    id: number;
    amount: string | null;
    date: string | null;
    type: string;
}

export interface CompletedRow {
    id: number;
    order_number: string | null;
    order_date: string | null;
    customer_name: string | null;
    vessel_name: string | null;
    eta: string | null;
    port: string | null;
    location: string | null;
    vlsfo_qty: string | null;
    mgo_qty: string | null;
    hsfo_qty: string | null;
    barging_cost: string | null;
    agent_fees: string | null;
    invoice_value: string | null;
    invoice_date: string | null;
    payment_due_date: string | null;
    amount_received: string | null;
    amount_remaining: number;
    payment_receipt_date: string | null;
    status: string | null;
    paid_in_full: boolean;
    is_overdue: boolean;
    can_close: boolean;
    payments: PaymentRow[];
}

interface FinanceDashboardProps {
    completedOrders: PaginationMeta & {
        data: CompletedRow[];
    };
    financeSummary: FinanceSummaryBucket[];
    paymentTypeOptions: EnumOption[];
    filters: {
        search: string;
        sort: FinanceSortKey;
        dir: SortDir;
    };
}

type FinanceSortKey = keyof CompletedRow | 'payment_status';

interface Column {
    header: string;
    sortKey: FinanceSortKey;
    align?: 'right';
    cell: (row: CompletedRow) => ReactNode;
}

const COLUMNS: Column[] = [
    {
        header: 'Order',
        sortKey: 'order_number',
        cell: (row) => <OrderCell row={row} />,
    },
    {
        header: 'Customer',
        sortKey: 'customer_name',
        cell: (row) => <CustomerCell row={row} />,
    },
    {
        header: 'Vessel',
        sortKey: 'vessel_name',
        cell: (row) => <VesselCell row={row} />,
    },
    {
        header: 'Products',
        sortKey: 'vlsfo_qty',
        cell: (row) => <ProductChips row={row} />,
    },
    {
        header: 'Charges',
        sortKey: 'agent_fees',
        align: 'right',
        cell: (row) => <ChargesCell row={row} />,
    },
    {
        header: 'Invoice Value',
        sortKey: 'invoice_value',
        align: 'right',
        cell: (row) => <MoneyCell value={row.invoice_value} />,
    },
    {
        header: 'Invoice Date',
        sortKey: 'invoice_date',
        cell: (row) => <DateCell value={row.invoice_date} />,
    },
    {
        header: 'Due Date',
        sortKey: 'payment_due_date',
        cell: (row) => <DateCell value={row.payment_due_date} />,
    },
    {
        header: 'Payments Received',
        sortKey: 'amount_received',
        align: 'right',
        cell: (row) => <MoneyCell value={row.amount_received} />,
    },
    {
        header: 'Outstanding',
        sortKey: 'amount_remaining',
        align: 'right',
        cell: (row) => <MoneyCell value={row.amount_remaining} strong />,
    },
    {
        header: 'Status',
        sortKey: 'payment_status',
        cell: (row) => <StatusCell row={row} />,
    },
];

const EXPORT_COLUMNS: ExportColumn<CompletedRow>[] = [
    { header: 'Order Number', value: (row) => row.order_number ?? '' },
    { header: 'Order Date', value: (row) => row.order_date ?? '' },
    { header: 'Customer Name', value: (row) => row.customer_name ?? '' },
    { header: 'Vessel Name', value: (row) => row.vessel_name ?? '' },
    { header: 'ETA', value: (row) => row.eta ?? '' },
    { header: 'Supply Location', value: (row) => row.location ?? '' },
    { header: 'VLSFO Qty', value: (row) => row.vlsfo_qty ?? '' },
    { header: 'MGO Qty', value: (row) => row.mgo_qty ?? '' },
    { header: 'HSFO Qty', value: (row) => row.hsfo_qty ?? '' },
    { header: 'Barging Cost', value: (row) => row.barging_cost ?? '' },
    { header: 'Agent Fees', value: (row) => row.agent_fees ?? '' },
    { header: 'Invoice Value', value: (row) => row.invoice_value ?? '' },
    { header: 'Invoice Date', value: (row) => row.invoice_date ?? '' },
    { header: 'Payment Due Date', value: (row) => row.payment_due_date ?? '' },
    {
        header: 'Payment Status',
        value: (row) => getPaymentStatus(row).label,
    },
    { header: 'Amount Received', value: (row) => row.amount_received ?? '' },
    { header: 'Amount Remaining', value: (row) => row.amount_remaining },
    {
        header: 'Last Payment Date',
        value: (row) => row.payment_receipt_date ?? '',
    },
];

export default function FinanceDashboard({
    completedOrders,
    financeSummary,
    paymentTypeOptions,
    filters,
}: FinanceDashboardProps) {
    const rows = completedOrders.data;
    const [closingId, setClosingId] = useState<number | null>(null);
    const [payingRow, setPayingRow] = useState<CompletedRow | null>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [searchFilters, setSearchFilters] = useState<PortSearchState>({
        query: filters.search,
        port: ALL_PORTS_VALUE,
    });
    const didMount = useRef(false);
    const sortKey = filters.sort;
    const sortDir = filters.dir;

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }

        const timeout = window.setTimeout(() => {
            const params: Record<string, string | number> = {};
            const query = searchFilters.query.trim();

            if (query) {
                params.search = query;
            }

            if (completedOrders.per_page !== 25) {
                params.per_page = completedOrders.per_page;
            }

            if (sortKey !== 'payment_due_date') {
                params.sort = sortKey;
            }

            if (sortDir !== 'asc') {
                params.dir = sortDir;
            }

            router.get('/finance', params, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [completedOrders.per_page, searchFilters]);

    const handleSort = (key: FinanceSortKey): void => {
        const nextDir = key === sortKey && sortDir === 'asc' ? 'desc' : 'asc';
        const params: Record<string, string | number> = {
            sort: key,
            dir: nextDir,
        };
        const query = searchFilters.query.trim();

        if (query) {
            params.search = query;
        }

        if (completedOrders.per_page !== 25) {
            params.per_page = completedOrders.per_page;
        }

        router.get('/finance', params, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const closeOrder = (id: number) => {
        router.patch(
            closeFinanceOrder(id).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setClosingId(id),
                onFinish: () => setClosingId(null),
            },
        );
    };

    return (
        <>
            <Head title="Finance" />

            <main className="min-h-[calc(100svh-4.25rem)] overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.045),transparent_32%),#F4F7FA] px-3 py-4 sm:px-4 md:px-6">
                <div className="flex w-full flex-col gap-4">
                    <FinanceSummaryCards summary={financeSummary} />

                    <PortScopedOrderSearch
                        value={searchFilters}
                        onChange={setSearchFilters}
                        resultCount={completedOrders.total}
                        showPortSelect={false}
                    />

                    <section className="overflow-hidden rounded-[17px] border border-[#E3EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <h2 className="text-xl font-bold tracking-normal text-[#0F172A]">
                                    Completed Orders
                                </h2>
                                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-bold text-[#3155E7] tabular-nums">
                                    {completedOrders.total}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setExportDialogOpen(true)}
                            >
                                <img
                                    src="/images/icons/excel-file.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="mr-2 h-4 w-4 shrink-0"
                                />
                                Export to Excel
                            </Button>
                        </div>
                        <div className="px-4 pb-4">
                            <TableFrame className="rounded-[14px] border-[#E3EAF2]">
                                <Table>
                                    <TableHeader className="bg-[#EDF3FA]">
                                        <TableRow className="border-[#E7EDF4] hover:bg-[#EDF3FA]">
                                            {COLUMNS.map((column) => (
                                                <SortableHead
                                                    key={column.header}
                                                    label={column.header}
                                                    sortKey={column.sortKey}
                                                    currentKey={sortKey}
                                                    currentDir={sortDir}
                                                    onSort={handleSort}
                                                    className={cn(
                                                        'h-11 px-3 font-bold text-[#172033]',
                                                        column.align ===
                                                            'right' &&
                                                            'text-right',
                                                    )}
                                                />
                                            ))}
                                            <TableHead className="h-11 px-3 text-right font-bold text-[#172033]">
                                                Action
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="min-h-[50px] border-[#E7EDF4] bg-white hover:bg-[#F8FAFD]"
                                            >
                                                {COLUMNS.map((column) => (
                                                    <TableCell
                                                        key={column.header}
                                                        className={cn(
                                                            'px-3 py-3 text-[#334155]',
                                                            column.align ===
                                                                'right' &&
                                                                'text-right tabular-nums',
                                                        )}
                                                    >
                                                        {column.cell(row)}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="px-3 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="h-8 rounded-lg border border-[#4F75F5] bg-white px-3 text-sm font-semibold text-[#2455E6] shadow-none transition-[background-color,color,box-shadow] duration-200 hover:bg-[#2455E6] hover:text-white hover:shadow-[0_6px_14px_rgba(36,85,230,0.20)] focus-visible:ring-[#3155E7]/40"
                                                            onClick={() =>
                                                                setPayingRow(
                                                                    row,
                                                                )
                                                            }
                                                        >
                                                            <CreditCard
                                                                className="size-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            Add Payment
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            disabled={
                                                                !row.can_close ||
                                                                closingId ===
                                                                    row.id
                                                            }
                                                            className="h-8 rounded-lg border border-[#2DD4BF] bg-white px-3 text-sm font-semibold text-[#0F766E] shadow-none transition-[background-color,color,box-shadow] duration-200 hover:bg-[#0F766E] hover:text-white hover:shadow-[0_6px_14px_rgba(15,118,110,0.20)] focus-visible:ring-[#2DD4BF]/40 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                                                            onClick={() =>
                                                                closeOrder(
                                                                    row.id,
                                                                )
                                                            }
                                                        >
                                                            {row.can_close ? (
                                                                <CheckCircle2
                                                                    className="size-3.5"
                                                                    aria-hidden="true"
                                                                />
                                                            ) : (
                                                                <XCircle
                                                                    className="size-3.5"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            Close
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {rows.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={COLUMNS.length + 1}
                                                    className="px-3 py-8 text-center text-muted-foreground"
                                                >
                                                    No orders.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableFrame>
                            <div className="mt-4">
                                <PaginationControls
                                    pagination={completedOrders}
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {payingRow && (
                <AddPaymentDialog
                    open
                    onOpenChange={(open) => !open && setPayingRow(null)}
                    order={payingRow}
                    paymentTypeOptions={paymentTypeOptions}
                />
            )}

            <FinanceExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
            />
        </>
    );
}

FinanceDashboard.layout = {
    title: 'Finance',
};

const PRODUCT_FIELDS = [
    { key: 'vlsfo_qty', label: 'VLSFO' },
    { key: 'mgo_qty', label: 'MGO' },
    { key: 'hsfo_qty', label: 'HSFO' },
] as const;

function hasPositiveAmount(value: string | number | null): boolean {
    return Number(value ?? 0) > 0;
}

interface ExportFilters {
    order_date_from: string;
    order_date_to: string;
    eta_from: string;
    eta_to: string;
}

function FinanceExportDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [filters, setFilters] = useState<ExportFilters>({
        order_date_from: '',
        order_date_to: '',
        eta_from: '',
        eta_to: '',
    });
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function setFilter(key: keyof ExportFilters, value: string): void {
        setFilters((current) => ({ ...current, [key]: value }));
    }

    async function exportRows(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setExporting(true);

        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });

        try {
            const response = await fetch(`/finance/export?${params}`, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Unable to export finance rows.');
            }

            const payload = (await response.json()) as { rows: CompletedRow[] };

            if (payload.rows.length === 0) {
                setError('No finance rows match the selected filters.');
                return;
            }

            exportToXlsx(payload.rows, EXPORT_COLUMNS, 'finance');
            onOpenChange(false);
        } catch {
            setError('Unable to export finance rows. Please try again.');
        } finally {
            setExporting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <form onSubmit={exportRows} className="contents">
                    <DialogHeader>
                        <DialogTitle>Export finance rows</DialogTitle>
                        <DialogDescription>
                            Filter the full finance list before exporting to
                            Excel.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <DateRangeFields
                            title="Order Date"
                            fromId="finance-export-order-date-from"
                            toId="finance-export-order-date-to"
                            fromValue={filters.order_date_from}
                            toValue={filters.order_date_to}
                            onFromChange={(value) =>
                                setFilter('order_date_from', value)
                            }
                            onToChange={(value) =>
                                setFilter('order_date_to', value)
                            }
                        />
                        <DateRangeFields
                            title="ETA Date"
                            fromId="finance-export-eta-from"
                            toId="finance-export-eta-to"
                            fromValue={filters.eta_from}
                            toValue={filters.eta_to}
                            onFromChange={(value) =>
                                setFilter('eta_from', value)
                            }
                            onToChange={(value) => setFilter('eta_to', value)}
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-medium text-[#B91C1C]">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={exporting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={exporting}>
                            <img
                                src="/images/icons/excel-file.png"
                                alt=""
                                aria-hidden="true"
                                className="mr-2 h-4 w-4 shrink-0"
                            />
                            {exporting ? 'Exporting...' : 'Export'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DateRangeFields({
    title,
    fromId,
    toId,
    fromValue,
    toValue,
    onFromChange,
    onToChange,
}: {
    title: string;
    fromId: string;
    toId: string;
    fromValue: string;
    toValue: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
}) {
    return (
        <fieldset className="grid gap-3 rounded-xl border border-[#E3EAF2] p-3">
            <legend className="px-1 text-xs font-bold tracking-[0.08em] text-[#64748B] uppercase">
                {title}
            </legend>
            <div className="grid gap-2">
                <Label
                    htmlFor={fromId}
                    className="text-xs font-semibold text-[#64748B]"
                >
                    From
                </Label>
                <Input
                    id={fromId}
                    type="date"
                    value={fromValue}
                    onChange={(event) => onFromChange(event.target.value)}
                    className="h-10 rounded-lg border-[#CBD5E1]"
                />
            </div>
            <div className="grid gap-2">
                <Label
                    htmlFor={toId}
                    className="text-xs font-semibold text-[#64748B]"
                >
                    To
                </Label>
                <Input
                    id={toId}
                    type="date"
                    value={toValue}
                    onChange={(event) => onToChange(event.target.value)}
                    className="h-10 rounded-lg border-[#CBD5E1]"
                />
            </div>
        </fieldset>
    );
}

function OrderCell({ row }: { row: CompletedRow }) {
    return (
        <div className="flex min-w-32 flex-col gap-1">
            <span className="font-semibold text-[#172033]">
                {row.order_number ?? '—'}
            </span>
            <span className="text-xs text-[#64748B]">
                {row.location ?? 'No supply location'}
            </span>
        </div>
    );
}

function CustomerCell({ row }: { row: CompletedRow }) {
    return (
        <div className="flex min-w-40 flex-col gap-1">
            <span className="font-semibold text-[#172033]">
                {row.customer_name ?? '—'}
            </span>
        </div>
    );
}

function VesselCell({ row }: { row: CompletedRow }) {
    return (
        <div className="flex min-w-36 flex-col gap-1">
            <span className="font-semibold text-[#172033]">
                {row.vessel_name ?? '—'}
            </span>
        </div>
    );
}

function ProductChips({ row }: { row: CompletedRow }) {
    const products = PRODUCT_FIELDS.filter((product) =>
        hasPositiveAmount(row[product.key]),
    );

    if (products.length === 0) {
        return <span className="text-[#94A3B8]">—</span>;
    }

    return (
        <div className="flex min-w-40 flex-col items-start gap-1.5">
            {products.map((product, index) => {
                const color = productColor(product.label, index);

                return (
                    <span
                        key={product.key}
                        className="inline-flex w-fit items-center gap-1.5 rounded border px-2 py-1 text-xs font-semibold"
                        style={{
                            borderColor: color,
                            backgroundColor: color,
                            color: '#ffffff',
                        }}
                    >
                        <span>{product.label}</span>
                        <span className="tabular-nums">{row[product.key]}</span>
                    </span>
                );
            })}
        </div>
    );
}

function ChargesCell({ row }: { row: CompletedRow }) {
    return (
        <div className="flex min-w-40 flex-col items-end gap-1.5">
            <AgentFeesCell row={row} />
            {hasPositiveAmount(row.barging_cost) && (
                <span className="text-xs text-[#64748B]">
                    Barging {formatMoney(row.barging_cost)}
                </span>
            )}
        </div>
    );
}

function MoneyCell({
    value,
    strong = false,
}: {
    value: string | number | null;
    strong?: boolean;
}) {
    return (
        <div className="min-w-28 text-right">
            <span
                className={cn(
                    'text-sm text-[#172033] tabular-nums',
                    strong && 'font-semibold',
                )}
            >
                {formatMoney(value)}
            </span>
        </div>
    );
}

function DateCell({ value }: { value: string | null }) {
    return (
        <div className="min-w-28">
            <span className="text-sm font-medium text-[#334155]">
                {shortDate(value)}
            </span>
        </div>
    );
}

function getPaymentStatus(row: CompletedRow): {
    label: 'Paid' | 'Overdue' | 'Partially paid' | 'Not paid';
    className: string;
} {
    const amountReceived = Number(row.amount_received ?? 0);
    const amountRemaining = Number(row.amount_remaining ?? 0);

    if (row.paid_in_full || amountRemaining <= 0) {
        return {
            label: 'Paid',
            className: 'border-[#0F766E] bg-[#0F766E] text-white',
        };
    }

    if (row.is_overdue) {
        return {
            label: 'Overdue',
            className: 'border-[#B91C1C] bg-[#B91C1C] text-white',
        };
    }

    if (amountReceived > 0) {
        return {
            label: 'Partially paid',
            className: 'border-[#92400E] bg-[#92400E] text-white',
        };
    }

    return {
        label: 'Not paid',
        className: 'border-[#991B1B] bg-[#991B1B] text-white',
    };
}

function StatusCell({ row }: { row: CompletedRow }) {
    const status = getPaymentStatus(row);

    return (
        <div className="flex min-w-28">
            <span
                className={cn(
                    'inline-flex rounded-full border px-2.5 py-1 text-xs font-bold',
                    status.className,
                )}
            >
                {status.label}
            </span>
        </div>
    );
}

function AgentFeesCell({ row }: { row: CompletedRow }) {
    const [value, setValue] = useState(row.agent_fees ?? '0');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setValue(row.agent_fees ?? '0');
    }, [row.agent_fees]);

    function save() {
        if (value === (row.agent_fees ?? '0')) {
            return;
        }

        router.patch(
            `/finance/${row.id}/agent-fees`,
            { agent_fees: value || 0 },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <Input
            type="number"
            min="0"
            step="0.01"
            value={value}
            disabled={saving}
            onChange={(event) => setValue(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.currentTarget.blur();
                }
            }}
            className="ml-auto h-10 w-36 rounded-lg border-[#CBD5E1] bg-white text-right text-base font-semibold tabular-nums"
            aria-label={`Agent fees for order ${row.order_number}`}
        />
    );
}
