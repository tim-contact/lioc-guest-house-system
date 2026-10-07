import { router } from '@inertiajs/react';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { PaginationMeta } from '@/components/pagination-controls';
import type { SortDir } from '@/hooks/use-sortable';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney, shortDate } from '@/lib/utils';
import { update } from '@/routes/invoices';

interface Invoice {
    id: number;
    order_number: string | null;
    customer_name: string | null;
    vessel_name: string | null;
    invoice_value: string | null;
    invoice_date: string | null;
    payment_due_date: string | null;
    amount_received: string | null;
    balance_amount: string | null;
    status: string | null;
}

interface InvoicesIndexProps {
    invoices: PaginationMeta & {
        data: Invoice[];
    };
    filters: {
        sort: keyof Invoice & string;
        dir: SortDir;
    };
}

const invoiceColumns: ExportColumn<Invoice>[] = [
    { header: 'Order Number', value: (invoice) => invoice.order_number ?? '' },
    { header: 'Customer', value: (invoice) => invoice.customer_name ?? '' },
    { header: 'Vessel', value: (invoice) => invoice.vessel_name ?? '' },
    {
        header: 'Invoice Value',
        value: (invoice) => invoice.invoice_value ?? '',
    },
    { header: 'Invoice Date', value: (invoice) => invoice.invoice_date ?? '' },
    {
        header: 'Payment Due Date',
        value: (invoice) => invoice.payment_due_date ?? '',
    },
    {
        header: 'Amount Received',
        value: (invoice) => invoice.amount_received ?? '',
    },
    { header: 'Balance', value: (invoice) => invoice.balance_amount ?? '' },
    { header: 'Order Status', value: (invoice) => invoice.status ?? '' },
];

const config: CrudConfig<Invoice> = {
    title: 'Invoices',
    entityLabel: 'Invoice',
    filename: 'invoices',
    emptyText: 'No invoices yet.',
    pk: (invoice) => invoice.id,
    defaultSortKey: 'payment_due_date',
    canCreate: false,
    canDelete: false,
    exportColumns: invoiceColumns,
    editTitle: (invoice) => invoice.order_number ?? 'Invoice',
    columns: [
        {
            header: 'Order Number',
            sortKey: 'order_number',
            cell: (invoice) => invoice.order_number ?? '—',
            className: 'font-medium',
        },
        {
            header: 'Customer',
            sortKey: 'customer_name',
            cell: (invoice) => invoice.customer_name ?? '—',
        },
        {
            header: 'Vessel',
            sortKey: 'vessel_name',
            cell: (invoice) => invoice.vessel_name ?? '—',
        },
        {
            header: 'Invoice Value',
            sortKey: 'invoice_value',
            align: 'right',
            cell: (invoice) => formatMoney(invoice.invoice_value),
        },
        {
            header: 'Invoice Date',
            sortKey: 'invoice_date',
            cell: (invoice) => shortDate(invoice.invoice_date),
        },
        {
            header: 'Payment Due Date',
            sortKey: 'payment_due_date',
            cell: (invoice) => shortDate(invoice.payment_due_date),
        },
        {
            header: 'Amount Received',
            sortKey: 'amount_received',
            align: 'right',
            cell: (invoice) => formatMoney(invoice.amount_received),
        },
        {
            header: 'Balance',
            sortKey: 'balance_amount',
            align: 'right',
            cell: (invoice) => formatMoney(invoice.balance_amount),
        },
        {
            header: 'Order Status',
            sortKey: 'status',
            cell: (invoice) => invoice.status ?? '—',
        },
    ],
    fields: [
        { name: 'invoice_value', label: 'Invoice Value', type: 'currency' },
        { name: 'invoice_date', label: 'Invoice Date', type: 'date' },
        { name: 'payment_due_date', label: 'Payment Due Date', type: 'date' },
    ],
    toFormData: (invoice) => ({
        invoice_value: invoice?.invoice_value ?? '',
        invoice_date: invoice?.invoice_date ?? '',
        payment_due_date: invoice?.payment_due_date ?? '',
    }),
    routes: {
        update: (id) => update(Number(id)),
    },
};

export default function InvoicesIndex({
    invoices,
    filters,
}: InvoicesIndexProps) {
    const sortKey = filters.sort;
    const sortDir = filters.dir;

    const handleSort = (key: keyof Invoice & string) => {
        const nextDir = key === sortKey && sortDir === 'asc' ? 'desc' : 'asc';

        visitInvoices(invoices.per_page, key, nextDir);
    };

    return (
        <ResourceCrudPage
            rows={invoices.data}
            config={config}
            pagination={invoices}
            sort={{ key: sortKey, direction: sortDir }}
            onSort={handleSort}
        />
    );
}

function visitInvoices(perPage: number, sortKey: string, dir: SortDir) {
    const params: Record<string, string> = {};

    if (perPage !== 25) {
        params.per_page = String(perPage);
    }

    if (sortKey !== 'payment_due_date') {
        params.sort = sortKey;
    }

    if (dir !== 'asc') {
        params.dir = dir;
    }

    router.get('/invoices', params, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
    });
}

InvoicesIndex.layout = {
    title: 'Invoices',
};
