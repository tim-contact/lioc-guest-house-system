import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import { ExportButton } from '@/components/export-button';
import { Input } from '@/components/ui/input';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney } from '@/lib/utils';
import { useState } from 'react';

// ---- Shape of one customer, matching what CreditManagementController@index sends ----
interface Customer {
    sap_id: string;
    name: string;
    credit_limit: string;
    credit_available: number | null;
    pending_orders: number;
    open_invoices: number;
}

interface CreditManagementProps {
    customers: Customer[];
}

const customerColumns: ExportColumn<Customer>[] = [
    { header: 'SAP ID', value: (customer) => customer.sap_id },
    { header: 'Name', value: (customer) => customer.name },
    { header: 'Credit Limit', value: (customer) => customer.credit_limit },
    {
        header: 'Credit Available',
        value: (customer) => customer.credit_available ?? '',
    },
    {
        header: 'Pending Orders',
        value: (customer) => customer.pending_orders,
    },
    { header: 'Open Invoices', value: (customer) => customer.open_invoices },
];

const config: CrudConfig<Customer> = {
    title: 'Credit Management',
    entityLabel: 'Customer',
    filename: 'credit-management',
    emptyText: 'No customers yet.',
    pk: (customer) => customer.sap_id,
    defaultSortKey: 'name',
    canCreate: false,
    canEdit: false,
    canDelete: false,
    exportColumns: customerColumns,
    columns: [
        {
            header: 'SAP ID',
            sortKey: 'sap_id',
            cell: (customer) => customer.sap_id,
            className: 'font-medium',
        },
        { header: 'Name', sortKey: 'name', cell: (customer) => customer.name },
        {
            header: 'Credit Limit',
            sortKey: 'credit_limit',
            align: 'right',
            cell: (customer) => formatMoney(customer.credit_limit),
        },
        {
            header: 'Credit Available',
            sortKey: 'credit_available',
            align: 'right',
            cell: (customer) => formatMoney(customer.credit_available),
        },
        {
            header: 'Pending Orders',
            sortKey: 'pending_orders',
            align: 'right',
            cell: (customer) => customer.pending_orders,
        },
        {
            header: 'Open Invoices',
            sortKey: 'open_invoices',
            align: 'right',
            cell: (customer) => customer.open_invoices,
        },
    ],
    fields: [],
    toFormData: () => ({}),
    routes: {},
};

export default function CreditManagement({ customers }: CreditManagementProps) {
    const [minimum, setMinimum] = useState('');
    const [maximum, setMaximum] = useState('');
    const invalidRange =
        minimum !== '' && maximum !== '' && Number(minimum) > Number(maximum);
    const exportRows = customers.filter((customer) => {
        const limit = Number(customer.credit_limit);

        return (
            Number.isFinite(limit) &&
            (minimum === '' || limit >= Number(minimum)) &&
            (maximum === '' || limit <= Number(maximum))
        );
    });

    return (
        <ResourceCrudPage
            rows={customers}
            config={{
                ...config,
                exportControl: (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Input
                            type="number"
                            aria-label="Minimum credit limit"
                            placeholder="Min credit limit"
                            className="w-36"
                            value={minimum}
                            onChange={(event) => setMinimum(event.target.value)}
                        />
                        <Input
                            type="number"
                            aria-label="Maximum credit limit"
                            placeholder="Max credit limit"
                            className="w-36"
                            value={maximum}
                            onChange={(event) => setMaximum(event.target.value)}
                        />
                        {invalidRange ? (
                            <span className="text-sm text-destructive">
                                Invalid credit limit range.
                            </span>
                        ) : (
                            <ExportButton
                                rows={exportRows}
                                columns={customerColumns}
                                filename="credit-management"
                            />
                        )}
                    </div>
                ),
            }}
        />
    );
}

CreditManagement.layout = {
    title: 'Credit Management',
};
