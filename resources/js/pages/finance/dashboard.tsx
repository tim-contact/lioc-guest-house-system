import { Head, router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ExportButton } from '@/components/export-button';
import { SortableHead } from '@/components/sortable-head';
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
import { useSortable } from '@/hooks/use-sortable';
import type { ExportColumn } from '@/lib/export-xlsx';
import { cn, formatMoney, shortDate } from '@/lib/utils';
import { close as closeFinanceOrder } from '@/routes/finance';
import type { EnumOption } from '@/types';
import { AddPaymentDialog } from './add-payment-dialog';
import { FinanceSummaryCards } from './summary-cards';

export interface PaymentRow {
    id: number;
    amount: string | null;
    date: string | null;
    type: string;
}

export interface CompletedRow {
    id: number;
    order_number: string | null;
    customer_name: string | null;
    vessel_name: string | null;
    location: string | null;
    vlsfo_qty: string | null;
    mgo_qty: string | null;
    hsfo_qty: string | null;
    invoice_value: string | null;
    invoice_date: string | null;
    payment_due_date: string | null;
    amount_received: string | null;
    payment_receipt_date: string | null;
    status: string | null;
    paid_in_full: boolean;
    payments: PaymentRow[];
}

interface FinanceDashboardProps {
    completedOrders: CompletedRow[];
    paymentTypeOptions: EnumOption[];
}

interface Column {
    header: string;
    sortKey: keyof CompletedRow;
    align?: 'right';
    cell: (row: CompletedRow) => ReactNode;
}

const COLUMNS: Column[] = [
    {
        header: 'Order Number',
        sortKey: 'order_number',
        cell: (row) => row.order_number ?? '—',
    },
    {
        header: 'Customer Name',
        sortKey: 'customer_name',
        cell: (row) => row.customer_name ?? '—',
    },
    {
        header: 'Vessel Name',
        sortKey: 'vessel_name',
        cell: (row) => row.vessel_name ?? '—',
    },
    {
        header: 'Supply Location',
        sortKey: 'location',
        cell: (row) => row.location ?? '—',
    },
    {
        header: 'VLSFO Qty',
        sortKey: 'vlsfo_qty',
        cell: (row) => row.vlsfo_qty ?? '—',
    },
    {
        header: 'MGO Qty',
        sortKey: 'mgo_qty',
        cell: (row) => row.mgo_qty ?? '—',
    },
    {
        header: 'HSFO Qty',
        sortKey: 'hsfo_qty',
        cell: (row) => row.hsfo_qty ?? '—',
    },
    {
        header: 'Invoice Value',
        sortKey: 'invoice_value',
        align: 'right',
        cell: (row) => formatMoney(row.invoice_value),
    },
    {
        header: 'Invoice Date',
        sortKey: 'invoice_date',
        cell: (row) => shortDate(row.invoice_date),
    },
    {
        header: 'Payment Due Date',
        sortKey: 'payment_due_date',
        cell: (row) => shortDate(row.payment_due_date),
    },
    {
        header: 'Payment Status',
        sortKey: 'paid_in_full',
        cell: (row) => (row.paid_in_full ? 'Received' : 'Not Received'),
    },
    {
        header: 'Amount Received',
        sortKey: 'amount_received',
        align: 'right',
        cell: (row) => formatMoney(row.amount_received),
    },
    {
        header: 'Last Payment Date',
        sortKey: 'payment_receipt_date',
        cell: (row) => shortDate(row.payment_receipt_date),
    },
    {
        header: 'Order Status',
        sortKey: 'status',
        cell: (row) => row.status ?? '—',
    },
];

const EXPORT_COLUMNS: ExportColumn<CompletedRow>[] = [
    { header: 'Order Number', value: (row) => row.order_number ?? '' },
    { header: 'Customer Name', value: (row) => row.customer_name ?? '' },
    { header: 'Vessel Name', value: (row) => row.vessel_name ?? '' },
    { header: 'Supply Location', value: (row) => row.location ?? '' },
    { header: 'VLSFO Qty', value: (row) => row.vlsfo_qty ?? '' },
    { header: 'MGO Qty', value: (row) => row.mgo_qty ?? '' },
    { header: 'HSFO Qty', value: (row) => row.hsfo_qty ?? '' },
    { header: 'Invoice Value', value: (row) => row.invoice_value ?? '' },
    { header: 'Invoice Date', value: (row) => row.invoice_date ?? '' },
    { header: 'Payment Due Date', value: (row) => row.payment_due_date ?? '' },
    {
        header: 'Payment Status',
        value: (row) => (row.paid_in_full ? 'Received' : 'Not Received'),
    },
    { header: 'Amount Received', value: (row) => row.amount_received ?? '' },
    {
        header: 'Last Payment Date',
        value: (row) => row.payment_receipt_date ?? '',
    },
    { header: 'Order Status', value: (row) => row.status ?? '' },
];

export default function FinanceDashboard({
    completedOrders,
    paymentTypeOptions,
}: FinanceDashboardProps) {
    const [closingId, setClosingId] = useState<number | null>(null);
    const [payingRow, setPayingRow] = useState<CompletedRow | null>(null);
    const { sortKey, sortDir, handleSort, sorted } = useSortable(
        completedOrders,
        'payment_due_date',
    );

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

            <div className="flex flex-col gap-6 p-4">
                <FinanceSummaryCards completedOrders={completedOrders} />

                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight">
                            Completed Orders
                        </h2>
                        <ExportButton
                            rows={sorted}
                            columns={EXPORT_COLUMNS}
                            filename="finance"
                        />
                    </div>
                    <TableFrame>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {COLUMNS.map((column) => (
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
                                    ))}
                                    <TableHead className="text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.map((row) => (
                                    <TableRow key={row.id}>
                                        {COLUMNS.map((column) => (
                                            <TableCell
                                                key={column.header}
                                                className={cn(
                                                    column.align === 'right' &&
                                                        'text-right tabular-nums',
                                                )}
                                            >
                                                {column.cell(row)}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 text-white hover:bg-green-600/90"
                                                    onClick={() =>
                                                        setPayingRow(row)
                                                    }
                                                >
                                                    Add Payment
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    disabled={
                                                        !row.paid_in_full ||
                                                        closingId === row.id
                                                    }
                                                    onClick={() =>
                                                        closeOrder(row.id)
                                                    }
                                                >
                                                    Close
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {sorted.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={COLUMNS.length + 1}
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

            {payingRow && (
                <AddPaymentDialog
                    open
                    onOpenChange={(open) => !open && setPayingRow(null)}
                    order={payingRow}
                    paymentTypeOptions={paymentTypeOptions}
                />
            )}
        </>
    );
}

FinanceDashboard.layout = {
    title: 'Finance',
};
