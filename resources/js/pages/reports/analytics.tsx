import { Head, Link } from '@inertiajs/react';
import NumberFlow from '@number-flow/react';
import {
    Activity,
    Anchor,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileText,
    Ship,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { FunnelChart } from '@/components/charts/funnel-chart';
import { ProductComparisonLineChart } from '@/components/charts/product-comparison-line-chart';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn, productColor } from '@/lib/utils';
import { disputes, finance, orders } from '@/routes';
import { index as customersIndex } from '@/routes/customers';

type FunnelStage = {
    label: string;
    value: number;
    displayValue?: string;
};

type ValueMetric = {
    label: string;
    value: number;
};

type MonthlyProductVolume = {
    label: string;
    vlsfo: number;
    hsfo: number;
    mgo: number;
    total: number;
};

type CyLySalesMetric = {
    label: string;
    currentYear: number | null;
    lastYear: number;
};

type CyLyProductSalesMetric = {
    key: string;
    label: string;
    months: CyLySalesMetric[];
};

type ProductDemandPeriod = {
    total: number;
    rebond: number;
};

type ProductDemandComparison = {
    key: string;
    label: string;
    current: ProductDemandPeriod;
    lastYear: ProductDemandPeriod;
};

type ProductDemandPort = {
    portKey: string;
    label: string;
    data: ProductDemandComparison[];
};

type BargeUtilizationPeriod = {
    completed: number;
    total: number;
    products: Record<'mgo' | 'vlsfo' | 'hsfo', number>;
};

type BargeUtilizationMetric = {
    imo: string;
    label: string;
    ordersUrl: string | null;
    periods: {
        currentMonth: BargeUtilizationPeriod;
        lastMonth: BargeUtilizationPeriod;
        pending: {
            pending: number;
            total: number;
            products: Record<'mgo' | 'vlsfo' | 'hsfo', number>;
        };
    };
};

type PortStatusMetric = {
    portKey: string;
    label: string;
    pendingDeliveries: number;
    completedDeliveries: number;
    pendingDisputes: number;
    total: number;
};

type PendingDispute = {
    id: number;
    orderNumber: string | null;
    customerName: string;
    vesselName: string;
    disputeType: string;
    actionStatus: string | null;
    createdAt: string | null;
};

type PendingDisputesByPort = {
    portKey: string;
    label: string;
    count: number;
    disputes: PendingDispute[];
};

type Summary = {
    enquiries: number;
    totalCreditLimit: number;
    orders: number;
    completed: number;
    currentMonthVolume: number;
    invoiceValue: number;
    amountReceived: number;
    outstanding: number;
};

type AnalyticsProps = {
    stockPosition: StockPosition;
    summary: Summary;
    funnel: FunnelStage[];
    portStatusMetrics: PortStatusMetric[];
    monthlyProductVolumes: MonthlyProductVolume[];
    topCustomers: ValueMetric[];
    bargeUtilization: BargeUtilizationMetric[];
    pendingDisputesByPort: PendingDisputesByPort[];
    productDemandComparison: ProductDemandComparison[];
    productDemandByPort: ProductDemandPort[];
    cyLyProductSales: CyLyProductSalesMetric[];
};

type StockPosition = {
    asOf: string;
    rows: {
        label: string;
        support: string | null;
        values: Record<'vlsfo' | 'mgo' | 'hsfo', number | null>;
    }[];
};

const compactNumber = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const volume = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const chartCardClassName = 'rounded-lg border-[#E3EAF2] bg-white shadow-sm';
const analyticsCardTitleClassName =
    'text-lg font-bold tracking-normal text-[#172033] sm:text-xl';
const funnelGradients = [
    ['#00c996', '#003d4d'],
    ['#29EAC4', '#4284DB'],
    ['#0A2A88', '#59CDE9'],
] as const;
const statusColors = {
    pending: '#F59E0B',
    completed: '#2563EB',
} as const;

const monthlyVolumeProducts = [
    { key: 'vlsfo', label: 'VLSFO' },
    { key: 'hsfo', label: 'HSFO' },
    { key: 'mgo', label: 'MGO' },
] as const;

function niceAxisMax(value: number): number {
    if (value <= 0) {
        return 1;
    }

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const niceNormalized =
        normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

    return niceNormalized * magnitude;
}

function displayScaleMax(values: number[]): number {
    const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);

    if (sorted.length === 0) {
        return 1;
    }

    const largest = sorted[sorted.length - 1];
    const secondLargest = sorted[sorted.length - 2] ?? largest;
    const hasSevereOutlier = largest > secondLargest * 4;

    return niceAxisMax(hasSevereOutlier ? secondLargest * 1.25 : largest);
}

export default function ReportAnalytics({
    stockPosition,
    summary,
    funnel,
    portStatusMetrics,
    monthlyProductVolumes,
    topCustomers,
    bargeUtilization,
    pendingDisputesByPort,
    productDemandComparison,
    productDemandByPort,
    cyLyProductSales,
}: AnalyticsProps) {
    return (
        <>
            <Head title="Report Analytics" />

            <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 md:px-8 md:py-6">
                <AnalyticsKpiGrid summary={summary} />

                <section className="grid gap-6 xl:grid-cols-3">
                    <MonthlyVolumeStackedBarCard data={monthlyProductVolumes} />
                    <PortOrdersBarCard data={portStatusMetrics} />
                    <EnquiryFunnelCompactCard data={funnel} />
                </section>

                <CyLySalesCard
                    products={cyLyProductSales}
                    className="h-[430px] sm:h-[500px] xl:min-h-[600px]"
                />

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.4fr)]">
                    <BargeUtilizationCard data={bargeUtilization} />
                    <StockPositionCard data={stockPosition} />
                    <ProductDemandComparisonCard
                        data={productDemandComparison}
                        ports={productDemandByPort}
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <TopCustomersBarCard data={topCustomers} />
                    <PendingDisputesCard data={pendingDisputesByPort} />
                </section>
            </main>
        </>
    );
}

function KpiCard({
    label,
    value,
    icon: Icon,
    tone,
    className,
    support,
    href,
}: {
    label: string;
    value: string;
    icon: LucideIcon;
    tone: string;
    className?: string;
    support?: string;
    href?: string;
}) {
    const card = (
        <Card
            className={cn(
                'overflow-hidden rounded-2xl border border-[#E3EAF2] bg-white py-0 shadow-sm',
                href &&
                    'transition-colors hover:border-slate-300 hover:bg-slate-50/70',
                className,
            )}
        >
            <CardContent className="flex min-h-32 items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-[0.08em] text-slate-500 uppercase">
                        {label}
                    </p>
                    <p className="mt-3 truncate text-3xl leading-none font-bold tracking-tight text-[#172033] tabular-nums">
                        {value}
                    </p>
                    {support ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                            {support}
                        </p>
                    ) : null}
                </div>
                <span
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                        tone,
                    )}
                >
                    <Icon className="size-5" aria-hidden="true" />
                </span>
            </CardContent>
        </Card>
    );

    return href ? (
        <Link
            href={href}
            aria-label={`View ${label}`}
            className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            {card}
        </Link>
    ) : (
        card
    );
}

function AnalyticsKpiGrid({ summary }: { summary: Summary }) {
    return (
        <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <KpiCard
                icon={Ship}
                label="Orders Confirmed"
                tone="bg-indigo-50 text-indigo-600"
                value={compactNumber.format(summary.orders)}
                href={`${orders().url}#pending-orders`}
            />
            <KpiCard
                icon={CheckCircle2}
                label="Completed Orders"
                tone="bg-teal-50 text-teal-600"
                value={compactNumber.format(summary.completed)}
                href={`${orders().url}#completed-orders`}
            />
            <KpiCard
                icon={BarChart3}
                label="Total Volume"
                support="Completed deliveries this month"
                tone="bg-cyan-50 text-cyan-600"
                value={`${volume.format(summary.currentMonthVolume)} MT`}
            />
            <KpiCard
                icon={Clock3}
                label="Outstandings"
                tone="bg-amber-50 text-amber-600"
                value={money.format(summary.outstanding)}
                href={finance().url}
            />
            <KpiCard
                icon={CreditCard}
                label="Total Credit Limit"
                tone="bg-emerald-50 text-emerald-600"
                value={money.format(summary.totalCreditLimit)}
                href={customersIndex().url}
            />
        </section>
    );
}

function PendingDisputesCard({ data }: { data: PendingDisputesByPort[] }) {
    const totalDisputes = data.reduce((total, port) => total + port.count, 0);

    return (
        <Card
            className={`${chartCardClassName} [--card-spacing:--spacing(3)] xl:col-span-1`}
        >
            <CardHeader>
                <CardTitle
                    className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                >
                    <AlertTriangle className="size-5 text-amber-500" />
                    Pending Disputes
                </CardTitle>
                <CardDescription>
                    Open disputes grouped by port with order context.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {totalDisputes === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No pending disputes.
                    </p>
                ) : (
                    <div className="grid max-h-96 gap-3 overflow-y-auto pr-1">
                        {data.map((port) => (
                            <section
                                key={port.portKey}
                                className="overflow-hidden rounded-xl border border-[#E3EAF2] bg-white"
                            >
                                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-amber-50/70 px-3 py-2">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-bold text-[#172033]">
                                            {port.label}
                                        </h3>
                                        <p className="text-[10px] font-semibold text-amber-700">
                                            {port.count}{' '}
                                            {port.count === 1
                                                ? 'open dispute'
                                                : 'open disputes'}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white tabular-nums">
                                        {port.count}
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {port.disputes.map((dispute) => (
                                        <Link
                                            key={dispute.id}
                                            className="grid gap-2 px-3 py-2.5 transition-colors hover:bg-amber-50/60 focus-visible:bg-amber-50/60 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset"
                                            href={disputes.url({
                                                query: {
                                                    dispute: dispute.id,
                                                },
                                            })}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-[#172033]">
                                                        {dispute.vesselName}
                                                    </p>
                                                    <p className="truncate text-xs font-medium text-slate-500">
                                                        {dispute.customerName}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                                                    {dispute.orderNumber ??
                                                        'No order'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                                                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                                                    {dispute.disputeType}
                                                </span>
                                                {dispute.actionStatus ? (
                                                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                                                        {dispute.actionStatus
                                                            .replaceAll(
                                                                '_',
                                                                ' ',
                                                            )
                                                            .replace(
                                                                /\b\w/g,
                                                                (letter) =>
                                                                    letter.toUpperCase(),
                                                            )}
                                                    </span>
                                                ) : null}
                                                {dispute.createdAt ? (
                                                    <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-500">
                                                        {dispute.createdAt}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function MonthlyVolumeStackedBarCard({
    data,
}: {
    data: MonthlyProductVolume[];
}) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const max = displayScaleMax(data.map((month) => month.total));
    const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
        ratio,
        value: max * ratio,
    }));
    const activeMonth = activeIndex === null ? null : data[activeIndex];
    const activeLeft =
        activeIndex === null || data.length === 0
            ? 0
            : ((activeIndex + 0.5) / data.length) * 100;

    return (
        <Card className={chartCardClassName}>
            <CardHeader className="p-4 pb-2">
                <CardTitle
                    className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                >
                    <BarChart3 className="size-5 text-[#3155E7]" />
                    Monthly Volume
                    <span className="text-sm font-semibold text-slate-400">
                        (MT)
                    </span>
                </CardTitle>
                <CardDescription>
                    Product-wise pending and delivered volume by month.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div
                    className="rounded-2xl border border-[#E3EAF2] bg-white p-4"
                    onPointerLeave={() => setActiveIndex(null)}
                >
                    <div className="grid h-72 grid-cols-[3rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
                        <div className="relative row-start-1 text-[0.65rem] font-semibold text-slate-400 tabular-nums">
                            {yTicks.map((tick) => (
                                <span
                                    key={`monthly-volume-y-${tick.ratio}`}
                                    className="absolute right-0 -translate-y-1/2"
                                    style={{
                                        top: `${(1 - tick.ratio) * 100}%`,
                                    }}
                                >
                                    {volume.format(tick.value)}
                                </span>
                            ))}
                        </div>

                        <div className="relative row-start-1 min-w-0 overflow-visible">
                            <div className="pointer-events-none absolute inset-0 grid grid-rows-4">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <span
                                        key={`monthly-volume-grid-${index}`}
                                        className="border-t border-dashed border-slate-200"
                                    />
                                ))}
                            </div>

                            {activeMonth && (
                                <div
                                    className="pointer-events-none absolute top-2 z-30 w-44 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-xs backdrop-blur-sm transition-[left] duration-150 ease-out"
                                    style={{
                                        left: `clamp(0.5rem, calc(${activeLeft}% - 5.5rem), calc(100% - 11.5rem))`,
                                    }}
                                >
                                    <p className="mb-1.5 font-bold text-[#172033]">
                                        {activeMonth.label}
                                    </p>
                                    <div className="grid gap-1.5">
                                        {monthlyVolumeProducts.map(
                                            (product) => {
                                                const value =
                                                    activeMonth[product.key];

                                                return (
                                                    <div
                                                        key={`monthly-volume-tooltip-${product.key}`}
                                                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
                                                    >
                                                        <span
                                                            className="size-2 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    productColor(
                                                                        product.label,
                                                                    ),
                                                            }}
                                                        />
                                                        <span className="truncate text-slate-500">
                                                            {product.label}
                                                        </span>
                                                        <span className="text-right font-semibold text-[#172033] tabular-nums">
                                                            {volume.format(
                                                                value,
                                                            )}
                                                        </span>
                                                    </div>
                                                );
                                            },
                                        )}
                                        <div className="mt-1 border-t border-slate-100 pt-1 font-bold text-[#172033]">
                                            Total:{' '}
                                            {volume.format(activeMonth.total)}{' '}
                                            MT
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative z-10 flex h-full items-end gap-3">
                                {data.map((month, index) => {
                                    const hasOverflow = month.total > max;

                                    return (
                                        <div
                                            key={month.label}
                                            className="flex h-full min-w-0 flex-1 justify-center outline-none"
                                            onBlur={() => setActiveIndex(null)}
                                            onFocus={() =>
                                                setActiveIndex(index)
                                            }
                                            onPointerEnter={() =>
                                                setActiveIndex(index)
                                            }
                                            role="group"
                                            tabIndex={0}
                                            aria-label={`${month.label}: ${volume.format(month.total)} MT`}
                                        >
                                            <div className="relative h-full w-full max-w-12">
                                                <div className="absolute inset-x-0 inset-y-0 rounded-t-xl bg-slate-100/70 shadow-inner ring-1 ring-slate-200/70" />
                                                {hasOverflow && (
                                                    <span
                                                        className="absolute inset-x-0 top-0 z-10 h-1.5 bg-slate-900/35"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {(() => {
                                                    let offset = 0;

                                                    return monthlyVolumeProducts.map(
                                                        (product) => {
                                                            const value =
                                                                month[
                                                                    product.key
                                                                ];

                                                            if (value <= 0) {
                                                                return null;
                                                            }

                                                            const segmentHeight =
                                                                (value / max) *
                                                                100;
                                                            const bottom =
                                                                offset;
                                                            offset +=
                                                                segmentHeight;

                                                            const clampedBottom =
                                                                Math.min(
                                                                    bottom,
                                                                    100,
                                                                );

                                                            return (
                                                                <span
                                                                    key={`${month.label}-${product.key}`}
                                                                    className="absolute inset-x-0 min-h-[3px]"
                                                                    style={{
                                                                        bottom: `${clampedBottom}%`,
                                                                        height: `${Math.min(segmentHeight, 100 - clampedBottom)}%`,
                                                                        backgroundColor:
                                                                            productColor(
                                                                                product.label,
                                                                            ),
                                                                    }}
                                                                    aria-label={`${product.label}: ${volume.format(value)} MT`}
                                                                />
                                                            );
                                                        },
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="col-start-2 row-start-2 flex gap-3">
                            {data.map((month) => (
                                <span
                                    key={`monthly-volume-label-${month.label}`}
                                    className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-slate-500"
                                >
                                    {month.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {monthlyVolumeProducts.map((product) => (
                        <Legend
                            key={product.key}
                            color={productColor(product.label)}
                            label={product.label}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function PortOrdersBarCard({ data }: { data: PortStatusMetric[] }) {
    const rows = [
        {
            key: 'all-ports',
            label: 'All Ports',
            pendingDeliveries: data.reduce(
                (total, port) => total + Number(port.pendingDeliveries || 0),
                0,
            ),
            completedDeliveries: data.reduce(
                (total, port) => total + Number(port.completedDeliveries || 0),
                0,
            ),
        },
        ...data.map((port) => ({
            key: port.portKey,
            label: port.label,
            pendingDeliveries: port.pendingDeliveries,
            completedDeliveries: port.completedDeliveries,
        })),
    ];
    const max = Math.max(
        ...rows.flatMap((row) => [
            row.pendingDeliveries,
            row.completedDeliveries,
        ]),
        1,
    );

    return (
        <Card className={chartCardClassName}>
            <CardHeader className="p-4 pb-2">
                <CardTitle
                    className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                >
                    <Anchor className="size-5 text-[#0077b6]" />
                    Confirmed - Orders by Port
                </CardTitle>
                <CardDescription>
                    Pending and completed orders across all ports and each port.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="grid max-h-80 gap-3 overflow-y-auto pr-1">
                    {rows.map((row) => (
                        <div
                            key={row.key}
                            className="grid gap-2 rounded-xl border border-[#E3EAF2] bg-white px-3 py-2.5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-bold text-[#172033]">
                                    {row.label}
                                </p>
                                <p className="text-xs font-semibold text-slate-500 tabular-nums">
                                    {compactNumber.format(
                                        row.pendingDeliveries +
                                            row.completedDeliveries,
                                    )}{' '}
                                    orders
                                </p>
                            </div>
                            <PortOrderMetricBar
                                color={statusColors.pending}
                                icon={Clock3}
                                label="Pending"
                                max={max}
                                value={row.pendingDeliveries}
                            />
                            <PortOrderMetricBar
                                color={statusColors.completed}
                                icon={CheckCircle2}
                                label="Completed"
                                max={max}
                                value={row.completedDeliveries}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <Legend color={statusColors.pending} label="Pending" />
                    <Legend color={statusColors.completed} label="Completed" />
                </div>
            </CardContent>
        </Card>
    );
}

function PortOrderMetricBar({
    color,
    icon: Icon,
    label,
    max,
    value,
}: {
    color: string;
    icon: LucideIcon;
    label: string;
    max: number;
    value: number;
}) {
    const width = Math.max((value / max) * 100, value > 0 ? 3 : 0);

    return (
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Icon className="size-3.5 shrink-0" style={{ color }} />
                <span className="truncate">{label}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full"
                    style={{
                        backgroundColor: color,
                        width: `${Math.min(width, 100)}%`,
                    }}
                />
            </div>
            <span className="text-right text-xs font-bold text-[#172033] tabular-nums">
                {compactNumber.format(value)}
            </span>
        </div>
    );
}

function EnquiryFunnelCompactCard({ data }: { data: FunnelStage[] }) {
    return (
        <Card className={chartCardClassName}>
            <CardHeader className="p-4 pb-2">
                <CardTitle
                    className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                >
                    <Activity className="size-5 text-[#4f46e5]" />
                    Enquiry Funnel
                </CardTitle>
                <CardDescription>
                    Enquiries to confirmed and completed orders.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="h-80 overflow-visible rounded-2xl border border-[#E3EAF2] bg-white p-2">
                    <FunnelChart
                        className="h-full"
                        color="var(--chart-1)"
                        data={data.map((stage, index) => ({
                            ...stage,
                            gradient: [
                                {
                                    offset: '0%',
                                    color: funnelGradients[
                                        index % funnelGradients.length
                                    ][0],
                                },
                                {
                                    offset: '100%',
                                    color: funnelGradients[
                                        index % funnelGradients.length
                                    ][1],
                                },
                            ],
                        }))}
                        edges="curved"
                        gap={4}
                        grid={{
                            bands: true,
                            bandColor: 'rgba(79, 70, 229, 0.035)',
                            lines: true,
                            lineColor: 'rgba(15, 23, 42, 0.08)',
                        }}
                        labelLayout="grouped"
                        layers={3}
                        orientation="vertical"
                        showLabels
                        showPercentage
                        showValues
                        style={{ aspectRatio: 'auto' }}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function CyLySalesCard({
    products,
    className,
}: {
    products: CyLyProductSalesMetric[];
    className?: string;
}) {
    const [selectedProductKey, setSelectedProductKey] = useState(
        products[0]?.key ?? '',
    );
    const selectedProduct =
        products.find((product) => product.key === selectedProductKey) ??
        products[0];
    const selectedProductIndex = Math.max(
        products.findIndex((product) => product.key === selectedProduct?.key),
        0,
    );
    const selectedProductColor = selectedProduct
        ? productColor(selectedProduct.label, selectedProductIndex)
        : '#3155E7';
    const data = selectedProduct?.months ?? [];
    const max = Math.max(
        ...data.flatMap((month) => [month.currentYear ?? 0, month.lastYear]),
        1,
    );
    const currentYearTotal = data.reduce(
        (sum, month) => sum + (month.currentYear ?? 0),
        0,
    );
    const lastYearTotal = data.reduce((sum, month) => sum + month.lastYear, 0);

    return (
        <Card className={cn(chartCardClassName, 'flex flex-col', className)}>
            <CardHeader className="shrink-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <CardTitle
                            className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                        >
                            <BarChart3 className="size-5 text-[#3155E7]" />
                            CY vs LY Sales
                            <span className="text-sm font-semibold text-slate-400">
                                (MT)
                            </span>
                        </CardTitle>
                        <CardDescription>
                            Product-wise monthly BDN quantity comparison.
                        </CardDescription>
                    </div>
                    <div className="flex shrink-0 rounded-full border border-[#D8E2EE] bg-[#F8FAFD] p-1">
                        {products.map((product, index) => {
                            const active = product.key === selectedProduct?.key;

                            return (
                                <button
                                    key={product.key}
                                    type="button"
                                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                                        active
                                            ? 'bg-[#3155E7] text-white shadow-sm'
                                            : 'text-slate-500 hover:bg-white hover:text-[#172033]'
                                    }`}
                                    onClick={() =>
                                        setSelectedProductKey(product.key)
                                    }
                                    style={
                                        active
                                            ? {
                                                  backgroundColor: productColor(
                                                      product.label,
                                                      index,
                                                  ),
                                              }
                                            : undefined
                                    }
                                >
                                    {product.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="hidden shrink-0 text-right lg:block">
                        <p className="text-xs font-semibold tracking-[0.08em] text-slate-400 uppercase">
                            CY Total
                        </p>
                        <p className="mt-1 text-xl leading-none font-bold text-[#172033] tabular-nums">
                            {compactNumber.format(currentYearTotal)}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 px-1 sm:px-2">
                {data.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No CY vs LY product sales yet.
                    </p>
                ) : (
                    <div className="grid h-full min-h-0 gap-4">
                        <ProductComparisonLineChart
                            currentColor={selectedProductColor}
                            data={data}
                            max={max}
                            productLabel={selectedProduct?.label ?? ''}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div className="flex flex-wrap gap-3">
                                <Legend
                                    color={selectedProductColor}
                                    label="Current Year"
                                />
                                <Legend color="#94A3B8" label="Last Year" />
                            </div>
                            <span className="font-semibold tabular-nums">
                                LY Total {compactNumber.format(lastYearTotal)}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function BargeUtilizationCard({ data }: { data: BargeUtilizationMetric[] }) {
    const [period, setPeriod] =
        useState<keyof BargeUtilizationMetric['periods']>('currentMonth');
    const isPending = period === 'pending';
    const barColor = isPending ? statusColors.pending : statusColors.completed;
    const max = Math.max(
        ...data.map((barge) => barge.periods[period].total),
        1,
    );

    return (
        <Card className={`${chartCardClassName} min-w-0 gap-3 self-start py-4`}>
            <CardHeader className="px-4 pb-0">
                <div className="grid gap-2">
                    <div>
                        <CardTitle
                            className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                        >
                            <Ship className="size-5 text-[#2563eb]" />
                            Barge Utilization
                            <span className="ml-auto text-[10px] font-semibold text-slate-400">
                                MT
                            </span>
                        </CardTitle>
                        <CardDescription>
                            {isPending
                                ? 'All pending orders assigned to each barge.'
                                : 'Completed deliveries by BDN delivery date.'}
                        </CardDescription>
                    </div>
                    <div className="flex flex-nowrap gap-1">
                        {[
                            ['currentMonth', 'Current month'],
                            ['lastMonth', 'Last month'],
                            ['pending', 'Pending orders'],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                className={cn(
                                    'min-w-0 flex-1 rounded-full border px-1 py-1.5 text-[10px] font-bold whitespace-nowrap transition-colors',
                                    period === key
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                                )}
                                type="button"
                                aria-pressed={period === key}
                                onClick={() =>
                                    setPeriod(
                                        key as keyof BargeUtilizationMetric['periods'],
                                    )
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4">
                {data.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No barge utilization data yet.
                    </p>
                ) : (
                    <div className="grid gap-2">
                        {data.map((barge) => {
                            const values = barge.periods[period];
                            const barWidth =
                                values.total > 0
                                    ? (values.total / max) * 100
                                    : 0;

                            return (
                                <Link
                                    key={barge.imo}
                                    href={barge.ordersUrl ?? '#'}
                                    data={{ period }}
                                    aria-label={`View orders for ${barge.label}`}
                                    aria-disabled={!barge.ordersUrl}
                                    tabIndex={barge.ordersUrl ? undefined : -1}
                                    onClick={(event) => {
                                        if (!barge.ordersUrl) {
                                            event.preventDefault();
                                        }
                                    }}
                                    className={cn(
                                        'grid gap-1.5 rounded-lg border border-[#E3EAF2] bg-white px-2.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600',
                                        barge.ordersUrl &&
                                            'hover:border-blue-300 hover:bg-blue-50/40',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-[#172033]">
                                                {barge.label}
                                            </p>
                                            <p className="text-[10px] font-semibold text-slate-400">
                                                IMO {barge.imo}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-xs font-bold text-[#172033] tabular-nums">
                                            {values.total}{' '}
                                            <span className="text-[10px] font-medium text-slate-500">
                                                {values.total === 1
                                                    ? 'order'
                                                    : 'orders'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
                                        {values.total > 0 ? (
                                            <>
                                                <span
                                                    className="absolute inset-y-0 left-0"
                                                    style={{
                                                        backgroundColor:
                                                            barColor,
                                                        width: `${barWidth}%`,
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <span className="absolute inset-y-0 left-0 w-4 rounded-full bg-slate-200" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(
                                                [
                                                    'mgo',
                                                    'vlsfo',
                                                    'hsfo',
                                                ] as const
                                            ).map((product) => (
                                                <div
                                                    key={product}
                                                    className="min-w-0"
                                                >
                                                    <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                                        <span
                                                            className="size-1.5 shrink-0 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    productColor(
                                                                        product,
                                                                    ),
                                                            }}
                                                        />
                                                        {product.toUpperCase()}
                                                    </p>
                                                    <p className="text-[11px] font-bold [overflow-wrap:anywhere] text-[#172033] tabular-nums">
                                                        {values.products[
                                                            product
                                                        ].toLocaleString(
                                                            'en-US',
                                                            {
                                                                minimumFractionDigits: 3,
                                                                maximumFractionDigits: 3,
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StockPositionCard({ data }: { data: StockPosition }) {
    return (
        <Card className={`${chartCardClassName} min-h-[300px] min-w-0`}>
            <CardHeader className="pb-2">
                <CardTitle
                    className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                >
                    <FileText className="size-5 text-[#2563eb]" />
                    Stock Position
                </CardTitle>
                <CardDescription>All ports · {data.asOf} · MT</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden rounded-xl border border-[#E3EAF2] bg-white">
                    <div className="grid grid-cols-[minmax(112px,1.25fr)_repeat(3,minmax(0,0.65fr))] border-b border-slate-100 bg-slate-50">
                        <div className="px-3 py-2 text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                            Metric
                        </div>
                        {['VLSFO', 'MGO', 'HSFO'].map((product, index) => (
                            <div
                                key={product}
                                className="px-2 py-2 text-center text-[10px] font-bold tracking-[0.08em] uppercase"
                                style={{ color: productColor(product, index) }}
                            >
                                {product}
                            </div>
                        ))}
                    </div>
                    <div className="divide-y divide-slate-100">
                        {data.rows.map((row) => (
                            <div
                                key={row.label}
                                className="grid grid-cols-[minmax(112px,1.25fr)_repeat(3,minmax(0,0.65fr))] items-stretch"
                            >
                                <div className="min-w-0 px-3 py-2">
                                    <p className="truncate text-xs font-bold text-[#172033]">
                                        {row.label}
                                    </p>
                                    {row.support ? (
                                        <p className="truncate text-[9px] font-semibold text-slate-400">
                                            {row.support}
                                        </p>
                                    ) : null}
                                </div>
                                {(['vlsfo', 'mgo', 'hsfo'] as const).map(
                                    (product) => {
                                        const value = row.values[product];

                                        return (
                                            <div
                                                key={`${row.label}-${product}`}
                                                className="flex items-center justify-center border-l border-slate-100 px-1.5 py-2"
                                            >
                                                <span
                                                    className={`min-w-0 text-right text-[10px] font-bold [overflow-wrap:anywhere] tabular-nums ${value !== null && value < 0 ? 'text-red-700' : 'text-slate-900'}`}
                                                >
                                                    {value === null
                                                        ? '—'
                                                        : value.toLocaleString(
                                                              'en-US',
                                                              {
                                                                  minimumFractionDigits: 3,
                                                                  maximumFractionDigits: 3,
                                                              },
                                                          )}
                                                </span>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TopCustomersBarCard({ data }: { data: ValueMetric[] }) {
    return (
        <Card className={chartCardClassName}>
            <CardHeader>
                <CardTitle className={analyticsCardTitleClassName}>
                    Top Customers
                    <span className="px-2 text-sm font-semibold text-slate-400">
                        Last 30 days
                    </span>
                </CardTitle>
                <CardDescription>
                    Highest invoice value by customer.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No customer invoice data yet.
                    </p>
                ) : (
                    <div className="grid gap-2">
                        {data.map((customer, index) => (
                            <div
                                key={customer.label}
                                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#E3EAF2] bg-white px-3 py-2.5 text-sm ring-1 ring-slate-950/[0.04]"
                            >
                                <span className="text-xs font-bold text-slate-400 tabular-nums">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="truncate font-semibold text-[#172033]">
                                    {customer.label}
                                </span>
                                <span className="font-semibold text-slate-500 tabular-nums">
                                    <NumberFlow
                                        value={customer.value}
                                        format={{
                                            currency: 'USD',
                                            maximumFractionDigits: 1,
                                            notation: 'compact',
                                            style: 'currency',
                                        }}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ProductDemandComparisonCard({
    data,
    ports,
}: {
    data: ProductDemandComparison[];
    ports: ProductDemandPort[];
}) {
    const [selectedPortKey, setSelectedPortKey] = useState('all');
    const selectedPort = ports.find((port) => port.portKey === selectedPortKey);
    const chartData = selectedPort?.data ?? data;
    const hasData = chartData.some(
        (product) => product.current.total > 0 || product.lastYear.total > 0,
    );

    return (
        <Card className={`${chartCardClassName} min-h-[300px] min-w-0`}>
            <CardHeader className="pb-2">
                <div className="grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle
                                className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                            >
                                <BarChart3 className="size-5 text-[#2563eb]" />
                                Product Demand
                                <span className="text-sm font-semibold text-slate-400">
                                    (MT)
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Current month vs same month LY, scaled
                                separately by product.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                            <Legend color="#172033" label="Product volume" />
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            className={cn(
                                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                                selectedPortKey === 'all'
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                            )}
                            type="button"
                            onClick={() => setSelectedPortKey('all')}
                        >
                            All ports
                        </button>
                        {ports.map((port) => (
                            <button
                                key={port.portKey}
                                className={cn(
                                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                                    selectedPortKey === port.portKey
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                                )}
                                type="button"
                                onClick={() => setSelectedPortKey(port.portKey)}
                            >
                                {port.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No product demand data yet.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-[#E3EAF2] bg-white">
                        <div className="relative grid gap-0 md:grid-cols-3">
                            <div className="pointer-events-none absolute inset-x-0 top-[5.35rem] bottom-[4.2rem] grid grid-rows-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <span
                                        key={`demand-grid-${index}`}
                                        className="border-t border-dashed border-slate-200/75"
                                    />
                                ))}
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-[4.2rem] border-t border-slate-300" />
                            {chartData.map((product, index) => (
                                <ProductDemandColumn
                                    key={product.key}
                                    index={index}
                                    product={product}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ProductDemandColumn({
    product,
    index,
}: {
    product: ProductDemandComparison;
    index: number;
}) {
    const color = productColor(product.label, index);
    const productScaleMax = niceAxisMax(
        Math.max(product.current.total, product.lastYear.total, 1),
    );
    const usesLowerVisualScale = ['mgo', 'hsfo'].includes(
        product.key.toLowerCase(),
    );
    const max = usesLowerVisualScale ? productScaleMax * 1.5 : productScaleMax;

    return (
        <div className="relative z-10 grid min-h-[304px] grid-rows-[auto_1fr] border-b border-[#E3EAF2] p-3 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0">
            <div className="flex items-start justify-between gap-3 pb-3">
                <div>
                    <h3
                        className="text-sm font-bold text-[#172033]"
                        style={{ color }}
                    >
                        {product.label}
                    </h3>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-1 text-right">
                    <p className="text-[9px] font-bold tracking-[0.06em] text-slate-400 uppercase">
                        Current total
                    </p>
                    <p className="text-sm leading-tight font-bold text-[#172033] tabular-nums">
                        {volume.format(product.current.total)}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-2 items-end gap-4 px-3 pb-7">
                <ProductDemandBar
                    color={color}
                    label="Current"
                    max={max}
                    period={product.current}
                />
                <ProductDemandBar
                    color={color}
                    label="LY"
                    max={max}
                    period={product.lastYear}
                />
            </div>
        </div>
    );
}

function ProductDemandBar({
    color,
    label,
    max,
    period,
}: {
    color: string;
    label: string;
    max: number;
    period: ProductDemandPeriod;
}) {
    const barHeight = (period.total / max) * 100;
    const hasValue = period.total > 0;

    return (
        <div className="grid min-w-0 grid-rows-[1fr_auto] gap-1.5">
            <div className="relative flex h-44 items-end justify-center">
                <span
                    className={cn(
                        'absolute left-1/2 -translate-x-1/2 text-center text-xs font-bold whitespace-nowrap tabular-nums',
                        hasValue ? 'text-[#172033]' : 'text-slate-400',
                    )}
                    style={{
                        bottom: hasValue
                            ? `calc(${Math.min(barHeight, 100)}% + 0.35rem)`
                            : '0.5rem',
                    }}
                >
                    {hasValue ? volume.format(period.total) : '0'}
                </span>
                {hasValue ? (
                    <span
                        className="block w-9 self-end rounded-t-md shadow-[0_-8px_18px_rgba(15,23,42,0.08)]"
                        style={{
                            backgroundColor: color,
                            height: `${barHeight}%`,
                        }}
                    />
                ) : (
                    <span className="mb-0.5 h-1.5 w-9 rounded-full border border-slate-200 bg-slate-100" />
                )}
            </div>
            <span className="text-center text-[11px] font-bold text-slate-600">
                {label}
            </span>
        </div>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className="size-2 rounded-full"
                style={{ backgroundColor: color }}
            />
            {label}
        </span>
    );
}

ReportAnalytics.layout = {
    title: 'Reports',
};
