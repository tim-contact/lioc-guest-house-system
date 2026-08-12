import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney } from '@/lib/utils';
import { destroy, store, update } from '@/routes/customers';

// ---- Shape of one customer, matching what CustomerController@index sends ----
interface Customer {
    sap_id: string;
    name: string;
    address: string;
    credit_limit: string;
    country: string;
    account_type: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    mail_id: string | null;
    invoice_mail_ids: string | null;
}

interface CustomersIndexProps {
    customers: Customer[];
}

const customerColumns: ExportColumn<Customer>[] = [
    { header: 'SAP ID', value: (customer) => customer.sap_id },
    { header: 'Name', value: (customer) => customer.name },
    { header: 'Address', value: (customer) => customer.address },
    { header: 'Country', value: (customer) => customer.country },
    {
        header: 'Account Type',
        value: (customer) => customer.account_type ?? '',
    },
    {
        header: 'Contact Person',
        value: (customer) => customer.contact_person ?? '',
    },
    {
        header: 'Contact Phone',
        value: (customer) => customer.contact_phone ?? '',
    },
    { header: 'Mail ID', value: (customer) => customer.mail_id ?? '' },
    {
        header: 'Mails IDs for Invoice',
        value: (customer) => customer.invoice_mail_ids ?? '',
    },
    { header: 'Credit Limit', value: (customer) => customer.credit_limit },
];

const config: CrudConfig<Customer> = {
    title: 'Customers',
    entityLabel: 'Customer',
    filename: 'customers',
    emptyText: 'No customers yet.',
    pk: (customer) => customer.sap_id,
    defaultSortKey: 'name',
    exportColumns: customerColumns,
    editTitle: (customer) => customer.name,
    deleteLabel: (customer) => `${customer.name} (${customer.sap_id})`,
    columns: [
        {
            header: 'SAP ID',
            sortKey: 'sap_id',
            cell: (customer) => customer.sap_id,
            className: 'font-medium',
        },
        { header: 'Name', sortKey: 'name', cell: (customer) => customer.name },
        {
            header: 'Address',
            sortKey: 'address',
            cell: (customer) => customer.address,
        },
        {
            header: 'Country',
            sortKey: 'country',
            cell: (customer) => customer.country,
        },
        {
            header: 'Account Type',
            sortKey: 'account_type',
            cell: (customer) => customer.account_type ?? '—',
        },
        {
            header: 'Contact Person',
            sortKey: 'contact_person',
            cell: (customer) => customer.contact_person,
        },
        {
            header: 'Contact Phone',
            sortKey: 'contact_phone',
            cell: (customer) => customer.contact_phone,
        },
        {
            header: 'Mail ID',
            sortKey: 'mail_id',
            cell: (customer) => customer.mail_id,
        },
        {
            header: 'Mails IDs for Invoice',
            cell: (customer) => customer.invoice_mail_ids,
        },
        {
            header: 'Credit Limit',
            sortKey: 'credit_limit',
            align: 'right',
            cell: (customer) => formatMoney(customer.credit_limit),
        },
    ],
    fields: [
        { name: 'sap_id', label: 'SAP ID', disabledOnEdit: true },
        { name: 'name', label: 'Name' },
        { name: 'address', label: 'Address' },
        { name: 'country', label: 'Country' },
        {
            name: 'account_type',
            label: 'Account Type',
            type: 'select',
            options: [
                { value: 'fcbu', label: 'FCBU' },
                { value: 'dbu', label: 'DBU' },
            ],
        },
        { name: 'contact_person', label: 'Contact Person' },
        { name: 'contact_phone', label: 'Contact Phone' },
        { name: 'mail_id', label: 'Mail ID', type: 'email' },
        { name: 'invoice_mail_ids', label: 'Mails IDs for Invoice' },
        {
            name: 'credit_limit',
            label: 'Credit limit',
            type: 'number',
            step: '0.01',
        },
    ],
    toFormData: (customer) => ({
        sap_id: customer?.sap_id ?? '',
        name: customer?.name ?? '',
        address: customer?.address ?? '',
        credit_limit: customer?.credit_limit ?? '',
        country: customer?.country ?? '',
        account_type: customer?.account_type ?? '',
        contact_person: customer?.contact_person ?? '',
        contact_phone: customer?.contact_phone ?? '',
        mail_id: customer?.mail_id ?? '',
        invoice_mail_ids: customer?.invoice_mail_ids ?? '',
    }),
    routes: {
        store: () => store(),
        update: (id) => update(String(id)),
        destroy: (id) => destroy(String(id)),
    },
};

export default function CustomersIndex({ customers }: CustomersIndexProps) {
    return <ResourceCrudPage rows={customers} config={config} />;
}

CustomersIndex.layout = {
    title: 'Customers',
};
