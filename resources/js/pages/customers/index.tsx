/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4 */
/* Hallmark · component: customer data table · genre: modern-minimal · theme: existing application */
import { Mail, MapPin, Phone } from 'lucide-react';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import { Badge } from '@/components/ui/badge';
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
    tableClassName:
        'min-w-[1080px] [&_th]:px-4 [&_tbody_td]:px-4 [&_tbody_td]:py-3.5',
    exportColumns: customerColumns,
    editTitle: (customer) => customer.name,
    deleteLabel: (customer) => `${customer.name} (${customer.sap_id})`,
    columns: [
        {
            header: 'Customer',
            sortKey: 'name',
            cell: (customer) => (
                <div className="min-w-56">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                            {customer.name}
                        </span>
                        {customer.sap_id.startsWith('TEMP-') && (
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1.5 py-0 text-[10px] font-semibold"
                            >
                                Temporary
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                        {customer.sap_id}
                    </p>
                </div>
            ),
            className: 'px-4 py-3.5 align-top',
            headerClassName: 'px-4',
        },
        {
            header: 'Location',
            sortKey: 'country',
            cell: (customer) => (
                <div className="max-w-72 min-w-56 whitespace-normal">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <MapPin
                            className="size-3.5 shrink-0 text-slate-400"
                            aria-hidden="true"
                        />
                        <span>{customer.country}</span>
                    </div>
                    <p
                        className="mt-1 line-clamp-2 pl-5 text-xs leading-5 text-slate-500"
                        title={customer.address}
                    >
                        {customer.address}
                    </p>
                </div>
            ),
            className: 'px-4 py-3.5 align-top',
            headerClassName: 'px-4',
        },
        {
            header: 'Account',
            sortKey: 'account_type',
            cell: (customer) =>
                customer.account_type ? (
                    <Badge
                        variant="outline"
                        className="rounded-sm border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold tracking-normal text-slate-700 uppercase"
                    >
                        {customer.account_type}
                    </Badge>
                ) : (
                    <span className="text-slate-400">—</span>
                ),
            className: 'px-4 py-3.5 align-top',
            headerClassName: 'px-4',
        },
        {
            header: 'Contact',
            sortKey: 'contact_person',
            cell: (customer) => (
                <div className="min-w-44">
                    <p className="font-medium text-slate-800">
                        {customer.contact_person ?? '—'}
                    </p>
                    {customer.contact_phone && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                            <Phone
                                className="size-3.5 shrink-0 text-slate-400"
                                aria-hidden="true"
                            />
                            {customer.contact_phone}
                        </p>
                    )}
                </div>
            ),
            className: 'px-4 py-3.5 align-top',
            headerClassName: 'px-4',
        },
        {
            header: 'Email',
            sortKey: 'mail_id',
            cell: (customer) => (
                <div className="max-w-64 min-w-52">
                    <p className="flex items-center gap-1.5 text-slate-700">
                        <Mail
                            className="size-3.5 shrink-0 text-slate-400"
                            aria-hidden="true"
                        />
                        <span
                            className="truncate"
                            title={customer.mail_id ?? undefined}
                        >
                            {customer.mail_id ?? '—'}
                        </span>
                    </p>
                    {customer.invoice_mail_ids && (
                        <p
                            className="mt-1 truncate pl-5 text-xs text-slate-500"
                            title={customer.invoice_mail_ids}
                        >
                            Invoice: {customer.invoice_mail_ids}
                        </p>
                    )}
                </div>
            ),
            className: 'px-4 py-3.5 align-top',
            headerClassName: 'px-4',
        },
        {
            header: 'Credit Limit',
            sortKey: 'credit_limit',
            align: 'right',
            cell: (customer) => (
                <span className="font-semibold whitespace-nowrap text-slate-900 tabular-nums">
                    {formatMoney(customer.credit_limit)}
                </span>
            ),
            className: 'px-4 py-3.5 align-top',
            headerClassName: 'px-4',
        },
    ],
    fields: [
        {
            name: 'sap_id',
            label: 'SAP ID',
            disabledWhen: (data) =>
                Boolean(data.original_sap_id) &&
                !String(data.original_sap_id).startsWith('TEMP-'),
        },
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
        { name: 'credit_limit', label: 'Credit limit', type: 'currency' },
    ],
    toFormData: (customer) => ({
        original_sap_id: customer?.sap_id ?? '',
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
