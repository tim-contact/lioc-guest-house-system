import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Ship } from 'lucide-react';
import {
    PaginationControls,
    type PaginationMeta,
} from '@/components/pagination-controls';
import { TableFrame } from '@/components/table-frame';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { shortDate } from '@/lib/utils';
import { analytics } from '@/routes/reports';
import { orders as bargeOrders } from '@/routes/reports/barges';

type Filters = {
    period: 'currentMonth' | 'lastMonth' | 'pending' | 'all';
};

type BargeOrder = {
    id: number;
    order_number: string;
    vessel_name: string | null;
    customer_name: string | null;
    port_name: string | null;
    status: 'pending' | 'delivered' | 'closed';
    order_date: string | null;
    delivery_date: string | null;
    products: Record<'mgo' | 'vlsfo' | 'hsfo', string | number | null>;
};

type Props = {
    barge: { imo: string; name: string };
    filters: Filters;
    summary: { completed?: number; pending?: number };
    orders: PaginationMeta & { data: BargeOrder[] };
};

function quantity(value: string | number | null): string {
    return value === null
        ? '\u2014'
        : Number(value).toLocaleString('en-US', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
          });
}

export default function BargeOrders({
    barge,
    filters,
    summary,
    orders,
}: Props) {
    const applyFilter = (next: Partial<Filters>) =>
        router.get(
            bargeOrders.url(barge.imo),
            { ...filters, ...next, per_page: orders.per_page },
            { preserveScroll: true, preserveState: true, replace: true },
        );

    return (
        <>
            <Head title={`${barge.name} Orders`} />
            <main className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 md:px-8 md:py-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={analytics()}>
                        <ArrowLeft className="size-4" />
                        Analytics
                    </Link>
                </Button>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                            <Ship className="size-5" />
                            {barge.name}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            IMO {barge.imo}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                            {filters.period === 'pending'
                                ? 'Pending'
                                : 'Delivered'}{' '}
                            <strong className="text-slate-900 tabular-nums">
                                {filters.period === 'pending'
                                    ? summary.pending
                                    : summary.completed}
                            </strong>
                        </p>
                    </div>
                    <div className="grid gap-3 sm:min-w-52">
                        <div className="grid gap-1.5">
                            <Label htmlFor="barge-period">Period</Label>
                            <select
                                id="barge-period"
                                value={filters.period}
                                onChange={(event) =>
                                    applyFilter({
                                        period: event.target
                                            .value as Filters['period'],
                                    })
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="currentMonth">
                                    Current month
                                </option>
                                <option value="lastMonth">Last month</option>
                                <option value="pending">Pending orders</option>
                                <option value="all">All history</option>
                            </select>
                        </div>
                    </div>
                </div>
                <TableFrame>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Vessel / Customer</TableHead>
                                <TableHead>Port</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Order date</TableHead>
                                <TableHead>Delivery date</TableHead>
                                {(['mgo', 'vlsfo', 'hsfo'] as const).map(
                                    (product) => (
                                        <TableHead
                                            key={product}
                                            className="text-right"
                                        >
                                            {product.toUpperCase()} (MT)
                                        </TableHead>
                                    ),
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.data.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-semibold whitespace-nowrap">
                                        {order.order_number}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">
                                            {order.vessel_name ?? '\u2014'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {order.customer_name ?? '\u2014'}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        {order.port_name ?? '\u2014'}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={
                                                order.status === 'pending'
                                                    ? 'text-amber-700'
                                                    : 'text-emerald-700'
                                            }
                                        >
                                            {order.status === 'pending'
                                                ? 'Pending'
                                                : order.status === 'closed'
                                                  ? 'Delivered (closed)'
                                                  : 'Delivered'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {shortDate(order.order_date)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {shortDate(order.delivery_date)}
                                    </TableCell>
                                    {(['mgo', 'vlsfo', 'hsfo'] as const).map(
                                        (product) => (
                                            <TableCell
                                                key={product}
                                                className="text-right whitespace-nowrap tabular-nums"
                                            >
                                                {quantity(
                                                    order.products[product],
                                                )}
                                            </TableCell>
                                        ),
                                    )}
                                </TableRow>
                            ))}
                            {orders.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={9}
                                        className="py-10 text-center text-slate-500"
                                    >
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableFrame>
                <PaginationControls pagination={orders} />
            </main>
        </>
    );
}

BargeOrders.layout = { title: 'Barge Orders' };
