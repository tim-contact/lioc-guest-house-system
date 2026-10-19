import { tableUpdate } from '@/actions/App/Http/Controllers/OrderController';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { PaginationMeta } from '@/components/pagination-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SortDir } from '@/hooks/use-sortable';
import { FUEL_GRADES } from '@/lib/domain';
import type { ExportColumn } from '@/lib/export-xlsx';
import {
    formatMoney,
    optionLabel,
    shortDate,
    shortDateTime,
    str,
    toDateInput,
    toDateTimeInput,
} from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type {
    AgentOption,
    AgentPicOption,
    EnumOption,
    SupplyLocationOption,
} from '@/types';

interface Order {
    id: number;
    enquiry_id: number;
    order_number: string;
    order_date: string | null;
    customer_id: string;
    vessel_id: string | null;
    vessel_name: string | null;
    port_id: number | null;
    eta: string | null;
    laycan_from: string | null;
    laycan_to: string | null;
    delivery_mode: string | null;
    delivery_location_id: number | null;
    delivery_location: string | null;
    barging_cost: string | null;
    agent_fees: string | null;
    product_type: string | null;
    compliance_checked: boolean;
    nomination_received: boolean;
    barge_id: string | null;
    agent_id: number | null;
    agent_name: string | null;
    agent_pic_id: number | null;
    pic: string | null;
    mobile_no: string | null;
    credit_terms: string | null;
    vlsfo_quantity_low: string | null;
    vlsfo_quantity_high: string | null;
    vlsfo_qty_range: string | null;
    vlsfo_rate: string | null;
    vlsfo_final_qty: string | null;
    vlsfo_bdn_qty: string | null;
    mgo_quantity_low: string | null;
    mgo_quantity_high: string | null;
    mgo_qty_range: string | null;
    mgo_rate: string | null;
    mgo_final_qty: string | null;
    mgo_bdn_qty: string | null;
    hsfo_quantity_low: string | null;
    hsfo_quantity_high: string | null;
    hsfo_qty_range: string | null;
    hsfo_rate: string | null;
    hsfo_final_qty: string | null;
    hsfo_bdn_qty: string | null;
    invoice_value: string | null;
    invoice_date: string | null;
    payment_due_date: string | null;
    amount_received: string | null;
    payment_receipt_date: string | null;
    balance_amount: number;
    status: string;
    created_at: string | null;
    updated_at: string | null;
}

interface OrdersTableProps {
    orders: PaginationMeta & {
        data: Order[];
    };
    filters: {
        vessel: string;
        sort: keyof Order & string;
        dir: SortDir;
    };
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    statusOptions: EnumOption[];
    deliveryModeOptions: EnumOption[];
    supplyLocationOptions: SupplyLocationOption[];
    productTypeOptions: EnumOption[];
    creditTermsOptions: EnumOption[];
}

export default function OrdersTable({
    orders,
    filters,
    agents,
    agentPics,
    statusOptions,
    deliveryModeOptions,
    supplyLocationOptions,
    productTypeOptions,
    creditTermsOptions,
}: OrdersTableProps) {
    const rows = orders.data;
    const [vesselSearch, setVesselSearch] = useState(filters.vessel ?? '');
    const sortKey = filters.sort;
    const sortDir = filters.dir;

    function handleSort(key: keyof Order & string) {
        const nextDir = key === sortKey && sortDir === 'asc' ? 'desc' : 'asc';

        visitOrdersTable(vesselSearch, orders.per_page, key, nextDir);
    }

    const agentOptions = agents.map((agent) => ({
        value: String(agent.id),
        label: agent.name,
    }));

    // This select cannot filter on the chosen agency, so name the agency in every option.
    const agencyNames = new Map(agents.map((agent) => [agent.id, agent.name]));
    const agentPicOptions = agentPics.map((pic) => ({
        value: String(pic.id),
        label: `${pic.name} — ${agencyNames.get(pic.agent_id) ?? 'Unknown agency'}`,
    }));

    const exportColumns: ExportColumn<Order>[] = [
        { header: 'ID', value: (o) => o.id },
        { header: 'Enquiry ID', value: (o) => o.enquiry_id },
        { header: 'Order Number', value: (o) => o.order_number },
        { header: 'Order Date', value: (o) => o.order_date ?? '' },
        { header: 'Customer ID', value: (o) => o.customer_id },
        { header: 'Vessel ID', value: (o) => o.vessel_id ?? '' },
        { header: 'Vessel Name', value: (o) => o.vessel_name ?? '' },
        { header: 'Port ID', value: (o) => o.port_id ?? '' },
        { header: 'ETA', value: (o) => o.eta ?? '' },
        { header: 'Laycan From', value: (o) => o.laycan_from ?? '' },
        { header: 'Laycan To', value: (o) => o.laycan_to ?? '' },
        {
            header: 'Delivery Mode',
            value: (o) => optionLabel(deliveryModeOptions, o.delivery_mode),
        },
        {
            header: 'Supply Location',
            value: (o) => o.delivery_location ?? '',
        },
        {
            header: 'Product Type',
            value: (o) => optionLabel(productTypeOptions, o.product_type),
        },
        {
            header: 'Compliance Checked',
            value: (o) => (o.compliance_checked ? 'Yes' : 'No'),
        },
        {
            header: 'Nomination Received',
            value: (o) => (o.nomination_received ? 'Yes' : 'No'),
        },
        { header: 'Barge ID', value: (o) => o.barge_id ?? '' },
        { header: 'Agent ID', value: (o) => o.agent_id ?? '' },
        { header: 'Agent Name', value: (o) => o.agent_name ?? '' },
        { header: 'Agent PIC ID', value: (o) => o.agent_pic_id ?? '' },
        { header: 'PIC', value: (o) => o.pic ?? '' },
        { header: 'Mobile No', value: (o) => o.mobile_no ?? '' },
        {
            header: 'Credit Terms',
            value: (o) => optionLabel(creditTermsOptions, o.credit_terms),
        },
        ...FUEL_GRADES.flatMap((product): ExportColumn<Order>[] => [
            {
                header: `${product.label} Qty Low`,
                value: (o) => o[`${product.key}_quantity_low`] ?? '',
            },
            {
                header: `${product.label} Qty High`,
                value: (o) => o[`${product.key}_quantity_high`] ?? '',
            },
            {
                header: `${product.label} Qty Range`,
                value: (o) => o[`${product.key}_qty_range`] ?? '',
            },
            {
                header: `${product.label} Rate`,
                value: (o) => o[`${product.key}_rate`] ?? '',
            },
            {
                header: `${product.label} Final Qty`,
                value: (o) => o[`${product.key}_final_qty`] ?? '',
            },
            {
                header: `${product.label} BDN Qty`,
                value: (o) => o[`${product.key}_bdn_qty`] ?? '',
            },
        ]),
        { header: 'Barging Cost', value: (o) => o.barging_cost ?? '' },
        { header: 'Agent Fees', value: (o) => o.agent_fees ?? '' },
        { header: 'Invoice Value', value: (o) => o.invoice_value ?? '' },
        { header: 'Invoice Date', value: (o) => o.invoice_date ?? '' },
        {
            header: 'Payment Due Date',
            value: (o) => o.payment_due_date ?? '',
        },
        {
            header: 'Amount Received',
            value: (o) => o.amount_received ?? '',
        },
        {
            header: 'Payment Receipt Date',
            value: (o) => o.payment_receipt_date ?? '',
        },
        { header: 'Balance Amount', value: (o) => o.balance_amount },
        {
            header: 'Status',
            value: (o) => optionLabel(statusOptions, o.status),
        },
        { header: 'Created At', value: (o) => o.created_at ?? '' },
        { header: 'Updated At', value: (o) => o.updated_at ?? '' },
    ];

    const config: CrudConfig<Order> = {
        title: 'Orders',
        entityLabel: 'Order',
        filename: 'orders',
        emptyText: 'No orders yet.',
        pk: (order) => order.id,
        defaultSortKey: 'id',
        canCreate: false,
        formColumns: 2,
        dialogClassName: 'sm:max-w-3xl',
        exportColumns,
        editTitle: (order) => order.order_number,
        canDelete: false,
        toolbar: (
            <form
                className="flex max-w-xl flex-col gap-2 rounded-[17px] border border-[#E3EAF2] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center"
                onSubmit={(event) => {
                    event.preventDefault();
                    visitOrdersTable(
                        vesselSearch,
                        orders.per_page,
                        sortKey,
                        sortDir,
                    );
                }}
            >
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748B]" />
                    <Input
                        aria-label="Search admin orders by vessel name"
                        className="h-10 rounded-xl border-[#D8E2EE] bg-[#F8FAFD] pl-9 text-[#0F172A] placeholder:text-[#64748B]"
                        onChange={(event) =>
                            setVesselSearch(event.target.value)
                        }
                        placeholder="Search by vessel name"
                        value={vesselSearch}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button type="submit" className="h-10 rounded-xl">
                        Search
                    </Button>
                    {filters.vessel && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-xl border-[#D8E2EE]"
                            onClick={() => {
                                setVesselSearch('');
                                visitOrdersTable(
                                    '',
                                    orders.per_page,
                                    sortKey,
                                    sortDir,
                                );
                            }}
                        >
                            <X />
                            Clear
                        </Button>
                    )}
                </div>
            </form>
        ),
        columns: [
            {
                header: 'Order Number',
                sortKey: 'order_number',
                cell: (o) => o.order_number,
                className: 'font-medium',
            },
            {
                header: 'Order Date',
                sortKey: 'order_date',
                cell: (o) => shortDate(o.order_date),
            },
            {
                header: 'Customer ID',
                sortKey: 'customer_id',
                cell: (o) => o.customer_id,
            },
            {
                header: 'Vessel Name',
                sortKey: 'vessel_name',
                cell: (o) => <VesselNameCell order={o} />,
            },
            {
                header: 'Vessel ID',
                sortKey: 'vessel_id',
                cell: (o) => o.vessel_id ?? '—',
            },
            {
                header: 'Port ID',
                sortKey: 'port_id',
                cell: (o) => o.port_id ?? '—',
            },
            {
                header: 'ETA',
                sortKey: 'eta',
                cell: (o) => shortDateTime(o.eta),
            },
            {
                header: 'Laycan From',
                sortKey: 'laycan_from',
                cell: (o) => shortDate(o.laycan_from),
            },
            {
                header: 'Laycan To',
                sortKey: 'laycan_to',
                cell: (o) => shortDate(o.laycan_to),
            },
            {
                header: 'Delivery Mode',
                sortKey: 'delivery_mode',
                cell: (o) => optionLabel(deliveryModeOptions, o.delivery_mode),
            },
            {
                header: 'Supply Location',
                sortKey: 'delivery_location_id',
                cell: (o) => o.delivery_location ?? '—',
            },
            {
                header: 'Product Type',
                sortKey: 'product_type',
                cell: (o) => optionLabel(productTypeOptions, o.product_type),
            },
            {
                header: 'Barge ID',
                sortKey: 'barge_id',
                cell: (o) => o.barge_id ?? '—',
            },
            {
                header: 'Agent ID',
                sortKey: 'agent_id',
                cell: (o) => o.agent_id ?? '—',
            },
            {
                header: 'Agent Name',
                sortKey: 'agent_name',
                cell: (o) => o.agent_name ?? '—',
            },
            {
                header: 'Agent PIC ID',
                sortKey: 'agent_pic_id',
                cell: (o) => o.agent_pic_id ?? '—',
            },
            { header: 'PIC', sortKey: 'pic', cell: (o) => o.pic ?? '—' },
            {
                header: 'Mobile No',
                sortKey: 'mobile_no',
                cell: (o) => o.mobile_no ?? '—',
            },
            {
                header: 'Credit Terms',
                sortKey: 'credit_terms',
                cell: (o) => optionLabel(creditTermsOptions, o.credit_terms),
            },
            ...FUEL_GRADES.flatMap((product) => [
                {
                    header: `${product.label} Qty Range`,
                    sortKey: `${product.key}_qty_range` as const,
                    cell: (o: Order) => o[`${product.key}_qty_range`] ?? '—',
                },
                {
                    header: `${product.label} Rate`,
                    sortKey: `${product.key}_rate` as const,
                    align: 'right' as const,
                    cell: (o: Order) => formatMoney(o[`${product.key}_rate`]),
                },
                {
                    header: `${product.label} Qty`,
                    sortKey: `${product.key}_final_qty` as const,
                    align: 'right' as const,
                    cell: (o: Order) => productQuantityFor(o, product.key),
                },
                {
                    header: `${product.label} BDN Qty`,
                    sortKey: `${product.key}_bdn_qty` as const,
                    align: 'right' as const,
                    cell: (o: Order) => o[`${product.key}_bdn_qty`] ?? '—',
                },
            ]),
            {
                header: 'Barging Cost',
                sortKey: 'barging_cost',
                align: 'right',
                cell: (o) => formatMoney(o.barging_cost),
            },
            {
                header: 'Agent Fees',
                sortKey: 'agent_fees',
                align: 'right',
                cell: (o) => formatMoney(o.agent_fees),
            },
            {
                header: 'Invoice Value',
                sortKey: 'invoice_value',
                align: 'right',
                cell: (o) => formatMoney(o.invoice_value),
            },
            {
                header: 'Invoice Date',
                sortKey: 'invoice_date',
                cell: (o) => shortDate(o.invoice_date),
            },
            {
                header: 'Payment Due Date',
                sortKey: 'payment_due_date',
                cell: (o) => shortDate(o.payment_due_date),
            },
            {
                header: 'Amount Received',
                sortKey: 'amount_received',
                align: 'right',
                cell: (o) => formatMoney(o.amount_received),
            },
            {
                header: 'Payment Receipt Date',
                sortKey: 'payment_receipt_date',
                cell: (o) => shortDate(o.payment_receipt_date),
            },
            {
                header: 'Balance',
                sortKey: 'balance_amount',
                align: 'right',
                cell: (o) => formatMoney(o.balance_amount),
            },
            {
                header: 'Status',
                sortKey: 'status',
                cell: (o) => optionLabel(statusOptions, o.status),
            },
            {
                header: 'Created At',
                sortKey: 'created_at',
                cell: (o) => shortDateTime(o.created_at),
            },
            {
                header: 'Updated At',
                sortKey: 'updated_at',
                cell: (o) => shortDateTime(o.updated_at),
            },
        ],
        fields: [
            { name: 'order_number', label: 'Order Number', section: 'Core' },
            {
                name: 'order_date',
                label: 'Order Date',
                type: 'date',
                section: 'Core',
            },
            { name: 'enquiry_id', label: 'Enquiry ID', section: 'Core' },
            { name: 'customer_id', label: 'Customer ID', section: 'Core' },
            { name: 'vessel_id', label: 'Vessel ID', section: 'Core' },
            { name: 'vessel_name', label: 'Vessel Name', section: 'Core' },
            { name: 'port_id', label: 'Port ID', section: 'Core' },
            {
                name: 'eta',
                label: 'ETA',
                type: 'datetime-local',
                section: 'Core',
            },
            {
                name: 'laycan_from',
                label: 'Laycan From',
                type: 'date',
                section: 'Core',
            },
            {
                name: 'laycan_to',
                label: 'Laycan To',
                type: 'date',
                section: 'Core',
            },
            {
                name: 'agent_id',
                label: 'Agency',
                type: 'select',
                options: agentOptions,
                section: 'Core',
            },
            {
                name: 'agent_pic_id',
                label: 'PIC',
                type: 'select',
                options: agentPicOptions,
                section: 'Core',
            },
            { name: 'barge_id', label: 'Barge ID', section: 'Core' },
            { name: 'mobile_no', label: 'Mobile No', section: 'Core' },
            {
                name: 'credit_terms',
                label: 'Credit Terms',
                type: 'select',
                options: creditTermsOptions,
                section: 'Core',
            },
            {
                name: 'status',
                label: 'Status',
                type: 'select',
                options: statusOptions,
                section: 'Core',
            },
            {
                name: 'delivery_mode',
                label: 'Delivery Mode',
                type: 'select',
                options: deliveryModeOptions,
                section: 'Delivery',
            },
            {
                name: 'delivery_location_id',
                label: 'Supply Location',
                type: 'select',
                options: supplyLocationOptions,
                section: 'Delivery',
            },
            {
                name: 'product_type',
                label: 'Product Type',
                type: 'select',
                options: productTypeOptions,
                section: 'Delivery',
            },
            {
                name: 'compliance_checked',
                label: 'Compliance Checked',
                type: 'checkbox',
                section: 'Delivery',
            },
            {
                name: 'nomination_received',
                label: 'Nomination Received',
                type: 'checkbox',
                section: 'Delivery',
            },
            ...FUEL_GRADES.flatMap((product) => [
                {
                    name: `${product.key}_quantity_low`,
                    label: 'Minimum Quantity',
                    type: 'number' as const,
                    step: '0.001',
                    section: product.label,
                },
                {
                    name: `${product.key}_quantity_high`,
                    label: 'Maximum Quantity',
                    type: 'number' as const,
                    step: '0.001',
                    section: product.label,
                },
                {
                    name: `${product.key}_rate`,
                    label: 'Rate',
                    type: 'currency' as const,
                    section: product.label,
                },
                {
                    name: `${product.key}_final_qty`,
                    label: 'Final Quantity',
                    type: 'number' as const,
                    step: '0.001',
                    section: product.label,
                },
                {
                    name: `${product.key}_bdn_qty`,
                    label: 'BDN Quantity',
                    type: 'number' as const,
                    step: '0.001',
                    section: product.label,
                },
            ]),
            {
                name: 'barging_cost',
                label: 'Barging Cost',
                type: 'currency',
                section: 'Invoicing',
            },
            {
                name: 'agent_fees',
                label: 'Agent Fees',
                type: 'currency',
                section: 'Invoicing',
            },
            {
                name: 'invoice_value',
                label: 'Invoice Value',
                type: 'currency',
                section: 'Invoicing',
                disabledOnEdit: true,
            },
            {
                name: 'invoice_date',
                label: 'Invoice Date',
                type: 'date',
                section: 'Invoicing',
            },
            {
                name: 'payment_due_date',
                label: 'Payment Due Date',
                type: 'date',
                section: 'Invoicing',
            },
            {
                name: 'amount_received',
                label: 'Amount Received',
                type: 'currency',
                section: 'Invoicing',
            },
            {
                name: 'payment_receipt_date',
                label: 'Payment Receipt Date',
                type: 'date',
                section: 'Invoicing',
            },
        ],
        toFormData: (order) => ({
            order_number: str(order?.order_number),
            order_date: toDateInput(order?.order_date),
            enquiry_id: str(order?.enquiry_id),
            customer_id: str(order?.customer_id),
            vessel_id: str(order?.vessel_id),
            vessel_name: str(order?.vessel_name),
            port_id: str(order?.port_id),
            eta: toDateTimeInput(order?.eta),
            laycan_from: toDateInput(order?.laycan_from),
            laycan_to: toDateInput(order?.laycan_to),
            agent_id: str(order?.agent_id),
            agent_pic_id: str(order?.agent_pic_id),
            barge_id: str(order?.barge_id),
            mobile_no: str(order?.mobile_no),
            credit_terms: str(order?.credit_terms),
            status: order?.status ?? 'pending',
            delivery_mode: str(order?.delivery_mode),
            delivery_location_id: str(order?.delivery_location_id),
            barging_cost: str(order?.barging_cost ?? '0'),
            agent_fees: str(order?.agent_fees ?? '0'),
            product_type: str(order?.product_type),
            compliance_checked: order?.compliance_checked === true,
            nomination_received: order?.nomination_received === true,
            ...Object.fromEntries(
                FUEL_GRADES.flatMap((product) => [
                    [
                        `${product.key}_quantity_low`,
                        str(order?.[`${product.key}_quantity_low`]),
                    ],
                    [
                        `${product.key}_quantity_high`,
                        str(order?.[`${product.key}_quantity_high`]),
                    ],
                    [
                        `${product.key}_rate`,
                        str(order?.[`${product.key}_rate`]),
                    ],
                    [
                        `${product.key}_final_qty`,
                        str(order?.[`${product.key}_final_qty`]),
                    ],
                    [
                        `${product.key}_bdn_qty`,
                        str(order?.[`${product.key}_bdn_qty`]),
                    ],
                ]),
            ),
            invoice_value: str(order?.invoice_value),
            invoice_date: toDateInput(order?.invoice_date),
            payment_due_date: toDateInput(order?.payment_due_date),
            amount_received: str(order?.amount_received),
            payment_receipt_date: toDateInput(order?.payment_receipt_date),
        }),
        routes: {
            update: (id) => tableUpdate(Number(id)),
        },
    };

    return (
        <ResourceCrudPage
            rows={rows}
            config={config}
            pagination={orders}
            sort={{ key: sortKey, direction: sortDir }}
            onSort={handleSort}
        />
    );
}

function VesselNameCell({ order }: { order: Order }) {
    return (
        <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
                <BooleanStatusIcon
                    checked={order.compliance_checked}
                    kind="compliance"
                />
                <BooleanStatusIcon
                    checked={order.nomination_received}
                    kind="nomination"
                />
            </div>
            <span className="min-w-0 truncate">{order.vessel_name ?? '—'}</span>
        </div>
    );
}

function BooleanStatusIcon({
    checked,
    kind,
}: {
    checked: boolean;
    kind: 'compliance' | 'nomination';
}) {
    const label =
        kind === 'nomination'
            ? checked
                ? 'Nomination received'
                : 'Nomination not received'
            : checked
              ? 'Compliance checked'
              : 'Compliance not checked';
    const icon =
        kind === 'nomination'
            ? checked
                ? '/images/icons/nomination_received_true.png'
                : '/images/icons/nomination_received_false.png'
            : checked
              ? '/images/icons/compliance_check_true.png'
              : '/images/icons/compliance_check_false.png';

    return (
        <span
            className="inline-grid size-5 place-items-center"
            title={label}
            aria-label={label}
            role="img"
        >
            <img src={icon} alt="" className="size-5 object-contain" />
        </span>
    );
}

function productQuantityFor(order: Order, productKey: string): string {
    const quantity = productQuantityValueFor(
        order,
        productKey,
        order.status === 'delivered' ? 'bdn' : 'final',
    );

    return quantity ?? '—';
}

function productQuantityValueFor(
    order: Order,
    productKey: string,
    source: 'bdn' | 'final',
): string | null {
    if (order.status === 'delivered') {
        source = 'bdn';
    }

    if (productKey === 'vlsfo') {
        return source === 'bdn' ? order.vlsfo_bdn_qty : order.vlsfo_final_qty;
    }

    if (productKey === 'mgo') {
        return source === 'bdn' ? order.mgo_bdn_qty : order.mgo_final_qty;
    }

    if (productKey === 'hsfo') {
        return source === 'bdn' ? order.hsfo_bdn_qty : order.hsfo_final_qty;
    }

    return null;
}

function visitOrdersTable(
    vessel: string,
    perPage: number,
    sortKey: string,
    direction: SortDir,
) {
    const params = new URLSearchParams();
    const trimmedVessel = vessel.trim();

    if (trimmedVessel !== '') {
        params.set('vessel', trimmedVessel);
    }

    if (perPage !== 25) {
        params.set('per_page', String(perPage));
    }

    if (sortKey !== 'id') {
        params.set('sort', sortKey);
    }

    if (direction !== 'asc') {
        params.set('dir', direction);
    }

    const query = params.toString();

    router.get(`/orders/all${query ? `?${query}` : ''}`, undefined, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
    });
}

OrdersTable.layout = {
    title: 'Orders',
};
