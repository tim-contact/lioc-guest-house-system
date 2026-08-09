import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney, optionLabel, shortDate } from '@/lib/utils';
import { destroy, update } from '@/routes/payments';
import type { EnumOption } from '@/types';

interface Payment {
    id: number;
    order_number: string | null;
    customer_name: string | null;
    vessel_name: string | null;
    amount: string | null;
    date: string | null;
    type: string;
}

interface PaymentsIndexProps {
    payments: Payment[];
    paymentTypeOptions: EnumOption[];
}

export default function PaymentsIndex({
    payments,
    paymentTypeOptions,
}: PaymentsIndexProps) {
    const exportColumns: ExportColumn<Payment>[] = [
        {
            header: 'Order Number',
            value: (payment) => payment.order_number ?? '',
        },
        { header: 'Customer', value: (payment) => payment.customer_name ?? '' },
        { header: 'Vessel', value: (payment) => payment.vessel_name ?? '' },
        { header: 'Amount', value: (payment) => payment.amount ?? '' },
        { header: 'Date', value: (payment) => payment.date ?? '' },
        {
            header: 'Type',
            value: (payment) => optionLabel(paymentTypeOptions, payment.type),
        },
    ];

    const config: CrudConfig<Payment> = {
        title: 'Payments',
        entityLabel: 'Payment',
        filename: 'payments',
        emptyText: 'No payments yet.',
        pk: (payment) => payment.id,
        defaultSortKey: 'date',
        canCreate: false,
        exportColumns,
        editTitle: (payment) => payment.order_number ?? 'Payment',
        deleteLabel: (payment) =>
            `the ${formatMoney(payment.amount)} payment on ${payment.order_number}`,
        columns: [
            {
                header: 'Order Number',
                sortKey: 'order_number',
                cell: (payment) => payment.order_number ?? '—',
                className: 'font-medium',
            },
            {
                header: 'Customer',
                sortKey: 'customer_name',
                cell: (payment) => payment.customer_name ?? '—',
            },
            {
                header: 'Vessel',
                sortKey: 'vessel_name',
                cell: (payment) => payment.vessel_name ?? '—',
            },
            {
                header: 'Amount',
                sortKey: 'amount',
                align: 'right',
                cell: (payment) => formatMoney(payment.amount),
            },
            {
                header: 'Date',
                sortKey: 'date',
                cell: (payment) => shortDate(payment.date),
            },
            {
                header: 'Type',
                sortKey: 'type',
                cell: (payment) =>
                    optionLabel(paymentTypeOptions, payment.type),
            },
        ],
        fields: [
            { name: 'amount', label: 'Amount', type: 'number', step: '0.01' },
            { name: 'date', label: 'Date', type: 'date' },
            {
                name: 'type',
                label: 'Type',
                type: 'select',
                options: paymentTypeOptions,
            },
        ],
        toFormData: (payment) => ({
            amount: payment?.amount ?? '',
            date: payment?.date ?? '',
            type: payment?.type ?? 'regular',
        }),
        routes: {
            update: (id) => update(Number(id)),
            destroy: (id) => destroy(Number(id)),
        },
    };

    return <ResourceCrudPage rows={payments} config={config} />;
}

PaymentsIndex.layout = {
    title: 'Payments',
};
