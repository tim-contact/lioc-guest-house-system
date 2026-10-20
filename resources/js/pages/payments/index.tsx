import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { PaginationMeta } from '@/components/pagination-controls';
import { Input } from '@/components/ui/input';
import type { SortDir } from '@/hooks/use-sortable';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney, optionLabel, shortDate } from '@/lib/utils';
import type { EnumOption } from '@/types';

interface Payment {
    id: number;
    order_number: string | null;
    customer_name: string | null;
    vessel_name: string | null;
    port_name: string | null;
    amount: string | null;
    date: string | null;
    type: string;
}

interface PaymentsIndexProps {
    payments: PaginationMeta & {
        data: Payment[];
    };
    paymentTypeOptions: EnumOption[];
    canManagePayments: boolean;
    filters: {
        search: string;
        sort: keyof Payment & string;
        dir: SortDir;
    };
}

export default function PaymentsIndex({
    payments,
    paymentTypeOptions,
    filters,
}: PaymentsIndexProps) {
    const rows = payments.data;
    const [search, setSearch] = useState(filters.search);
    const sortKey = filters.sort;
    const sortDir = filters.dir;
    const filtersRef = useRef(filters);
    const didMount = useRef(false);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    const handleSort = (key: keyof Payment & string) => {
        const nextDir = key === sortKey && sortDir === 'asc' ? 'desc' : 'asc';

        router.get(
            '/payments',
            paymentsParams(search, payments.per_page, key, nextDir),
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;

            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                '/payments',
                paymentsParams(
                    search,
                    payments.per_page,
                    filtersRef.current.sort,
                    filtersRef.current.dir,
                ),
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [payments.per_page, search]);

    const exportColumns: ExportColumn<Payment>[] = [
        {
            header: 'Order Number',
            value: (payment) => payment.order_number ?? '',
        },
        { header: 'Customer', value: (payment) => payment.customer_name ?? '' },
        { header: 'Vessel', value: (payment) => payment.vessel_name ?? '' },
        { header: 'Port', value: (payment) => payment.port_name ?? '' },
        { header: 'Amount', value: (payment) => payment.amount ?? '' },
        { header: 'Date', value: (payment) => payment.date ?? '' },
        {
            header: 'Type',
            value: (payment) => optionLabel(paymentTypeOptions, payment.type),
        },
    ];

    const config: CrudConfig<Payment> = {
        title: 'Past Payments',
        entityLabel: 'Payment',
        filename: 'past-payments',
        emptyText: 'No payments yet.',
        pk: (payment) => payment.id,
        defaultSortKey: 'date',
        canCreate: false,
        canEdit: false,
        canDelete: false,
        exportColumns,
        toolbar: (
            <div className="flex flex-col gap-2">
                <div className="relative w-full max-w-md">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]"
                        aria-hidden="true"
                    />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search order, customer or vessel"
                        className="h-10 rounded-xl border-[#CBD5E1] bg-white pl-9 text-sm"
                        aria-label="Search past payments"
                    />
                </div>
                <span className="text-xs font-medium text-[#64748B]">
                    {payments.total} payment{payments.total === 1 ? '' : 's'}
                </span>
            </div>
        ),
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
                header: 'Port',
                cell: (payment) => payment.port_name ?? '—',
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
    };

    return (
        <ResourceCrudPage
            rows={rows}
            config={config}
            pagination={payments}
            sort={{ key: sortKey, direction: sortDir }}
            onSort={handleSort}
        />
    );
}

function paymentsParams(
    searchText: string,
    perPage: number,
    sortKey: string,
    dir: SortDir,
): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    const query = searchText.trim();

    if (query !== '') {
        params.search = query;
    }

    if (perPage !== 25) {
        params.per_page = perPage;
    }

    if (sortKey !== 'date') {
        params.sort = sortKey;
    }

    if (dir !== 'desc') {
        params.dir = dir;
    }

    return params;
}

PaymentsIndex.layout = {
    title: 'Past Payments',
};
