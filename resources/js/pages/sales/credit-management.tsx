import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney } from '@/lib/utils';

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
    return <ResourceCrudPage rows={customers} config={config} />;
}

CreditManagement.layout = {
    title: 'Credit Management',
};
