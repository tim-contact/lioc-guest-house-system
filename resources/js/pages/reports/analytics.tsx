import { Head } from '@inertiajs/react';
import NumberFlow from '@number-flow/react';
import {
    Activity,
    Anchor,
    AlertTriangle,
    Banknote,
    BarChart3,
    CheckCircle2,
    Clock3,
    CircleDollarSign,
    ClipboardCheck,
    FileText,
    MapPin,
    Ship,
    TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { FunnelChart } from '@/components/charts/funnel-chart';
import {
    BklitPieChart,
    PieCenter,
    PieSlice,
} from '@/components/charts/pie-chart';
import { ProductComparisonLineChart } from '@/components/charts/product-comparison-line-chart';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn, portColor, portIconPath, productColor } from '@/lib/utils';

type FunnelStage = {
    label: string;
    value: number;
    displayValue?: string;
};

type CountMetric = {
    label: string;
    value: number;
};

type ValueMetric = {
    label: string;
    value: number;
};

type MonthlyTrend = {
    label: string;
    enquiries: number;
    orders: number;
    completed: number;
};

type CyLySalesMetric = {
    label: string;
    currentYear: number;
    lastYear: number;
};

type CyLyProductSalesMetric = {
    key: string;
    label: string;
    months: CyLySalesMetric[];
};

type PortStatusMetric = {
    portKey: string;
    label: string;
    pendingDeliveries: number;
    completedDeliveries: number;
    pendingDisputes: number;
    total: number;
};

type Summary = {
    enquiries: number;
    orders: number;
    completed: number;
    conversionRate: number;
    completionRate: number;
    invoiceValue: number;
    amountReceived: number;
    outstanding: number;
};

type AnalyticsProps = {
    summary: Summary;
    funnel: FunnelStage[];
    portStatusMetrics: PortStatusMetric[];
    monthlyTrend: MonthlyTrend[];
    topPorts: CountMetric[];
    topCustomers: ValueMetric[];
    productMix: ValueMetric[];
    rebondProductMix: ValueMetric[];
    cyLyProductSales: CyLyProductSalesMetric[];
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

const chartCardClassName = 'rounded-lg border-[#E3EAF2] bg-white shadow-sm';
const analyticsCardTitleClassName =
    'text-lg font-bold tracking-normal text-[#172033] sm:text-xl';
const funnelGradients = [
    ['#00c996', '#003d4d'],
    ['#29EAC4', '#4284DB'],
    ['#0A2A88', '#59CDE9'],
] as const;

export default function ReportAnalytics({
    summary,
    funnel,
    portStatusMetrics,
    monthlyTrend,
    topPorts,
    topCustomers,
    productMix,
    rebondProductMix,
    cyLyProductSales,
}: AnalyticsProps) {
    const maxTrend = Math.max(
        ...monthlyTrend.flatMap((month) => [
            month.enquiries,
            month.orders,
            month.completed,
        ]),
        1,
    );
    const pendingDeliveries = portStatusMetrics.reduce(
        (total, port) => total + Number(port.pendingDeliveries || 0),
        0,
    );
    const disputes = portStatusMetrics.reduce(
        (total, port) => total + Number(port.pendingDisputes || 0),
        0,
    );

    return (
        <>
            <Head title="Report Analytics" />

            <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 md:px-8 md:py-6">
                <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:items-stretch">
                    <section className="min-w-0 xl:col-span-7">
                        <CyLySalesCard
                            products={cyLyProductSales}
                            className="h-[430px] sm:h-[500px] xl:h-full xl:min-h-[600px]"
                        />
                    </section>

                    <section className="min-w-0 xl:col-span-5">
                        <OperationalBentoGrid
                            summary={summary}
                            pendingDeliveries={pendingDeliveries}
                            disputes={disputes}
                        />
                    </section>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
                    <Card className={chartCardClassName}>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle
                                className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                            >
                                <Activity className="size-5 text-[#4f46e5]" />
                                Enquiry Conversion Funnel
                            </CardTitle>
                            <CardDescription>
                                How many enquiries become orders and completed
                                deliveries.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="h-180 overflow-visible">
                                <FunnelChart
                                    className="h-full"
                                    color="var(--chart-1)"
                                    data={funnel.map((stage, index) => ({
                                        ...stage,
                                        gradient: [
                                            {
                                                offset: '0%',
                                                color: funnelGradients[
                                                    index %
                                                        funnelGradients.length
                                                ][0],
                                            },
                                            {
                                                offset: '100%',
                                                color: funnelGradients[
                                                    index %
                                                        funnelGradients.length
                                                ][1],
                                            },
                                        ],
                                    }))}
                                    edges="curved"
                                    gap={6}
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

                    <PortStatusBentoGrid data={portStatusMetrics} />
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <TopPortsBarCard data={topPorts} />
                    <ProductMixPieCard
                        data={productMix}
                        title="Current Month Sales"
                        description="Product-wise sales from current month BDN quantities."
                    />
                    <ProductMixPieCard
                        data={rebondProductMix}
                        title="Rebond Sales"
                        description="Current month rebond sales by product."
                        emptyMessage="No rebond quantity yet."
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <TopCustomersBarCard data={topCustomers} />
                    <TrendCard data={monthlyTrend} max={maxTrend} />
                </section>
            </main>
        </>
    );
}

function BentoCard({
    children,
    className,
    ariaLabel,
}: {
    children: ReactNode;
    className?: string;
    ariaLabel: string;
}) {
    return (
        <section
            aria-label={ariaLabel}
            className={cn(
                'relative flex min-w-0 overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-4',
                className,
            )}
        >
            {children}
        </section>
    );
}

function BentoMetricCard({
    label,
    value,
    icon: Icon,
    className,
    ariaLabel,
    support,
    children,
}: {
    label: string;
    value: string;
    icon: LucideIcon;
    className?: string;
    ariaLabel: string;
    support?: string;
    children?: ReactNode;
}) {
    return (
        <BentoCard ariaLabel={ariaLabel} className={className}>
            <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between gap-3 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/80">
                            {label}
                        </p>
                        <p className="mt-2 truncate text-2xl leading-none font-bold tracking-tight text-white tabular-nums sm:text-3xl">
                            {value}
                        </p>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                        <Icon className="size-5 sm:size-6" aria-hidden="true" />
                    </span>
                </div>
                {support ? (
                    <p className="text-xs leading-5 text-white/78 sm:text-sm">
                        {support}
                    </p>
                ) : null}
                {children}
            </div>
            <span
                className="absolute -right-10 -bottom-12 size-32 rounded-full bg-white/10"
                aria-hidden="true"
            />
        </BentoCard>
    );
}

function OperationalBentoGrid({
    summary,
    pendingDeliveries,
    disputes,
}: {
    summary: Summary;
    pendingDeliveries: number;
    disputes: number;
}) {
    const conversionProgress = Math.min(
        100,
        Math.max(0, summary.conversionRate),
    );
    const orderSupport =
        summary.enquiries > 0
            ? `${summary.conversionRate}% of enquiries`
            : undefined;

    return (
        <div className="grid h-full min-w-0 auto-rows-[116px] grid-cols-2 gap-2.5 sm:auto-rows-[126px] xl:auto-rows-fr xl:grid-cols-6 xl:gap-3">
            <BentoMetricCard
                ariaLabel="Enquiries"
                className="order-2 border-[#405CFF]/20 bg-[linear-gradient(135deg,#2646E8,#5D78FF)] xl:order-1 xl:col-span-2"
                icon={FileText}
                label="Enquiries"
                value={compactNumber.format(summary.enquiries)}
            />
            <BentoMetricCard
                ariaLabel="Orders"
                className="order-1 col-span-2 border-[#0A1D56]/20 bg-[radial-gradient(ellipse_at_80%_8%,#486AF1_0%,#1237B9_46%,#071B52_100%)] xl:order-2 xl:col-span-4"
                icon={Ship}
                label="Orders"
                support={orderSupport}
                value={compactNumber.format(summary.orders)}
            />
            <BentoMetricCard
                ariaLabel="Completed"
                className="order-3 border-[#10A7A2]/20 bg-[linear-gradient(135deg,#087F8C,#20B8A8)] xl:order-4 xl:col-span-2"
                icon={ClipboardCheck}
                label="Completed"
                value={compactNumber.format(summary.completed)}
            />
            <BentoMetricCard
                ariaLabel="Conversion"
                className="order-4 col-span-2 border-[#22BDE2]/20 bg-[linear-gradient(135deg,#1D4ED8,#25C3D8)] xl:order-3 xl:col-span-4"
                icon={TrendingUp}
                label="Conversion"
                value={`${summary.conversionRate}%`}
            >
                <div className="h-2 overflow-hidden rounded-full bg-white/18">
                    <div
                        className="h-full rounded-full bg-white transition-[width] duration-500"
                        style={{ width: `${conversionProgress}%` }}
                    />
                </div>
            </BentoMetricCard>
            <BentoMetricCard
                ariaLabel="Received"
                className="order-5 border-[#10B981]/20 bg-[linear-gradient(135deg,#087F5B,#10B981)] xl:col-span-3"
                icon={CircleDollarSign}
                label="Received"
                value={money.format(summary.amountReceived)}
            />
            <BentoMetricCard
                ariaLabel="Outstanding"
                className="order-6 border-[#F59E0B]/20 bg-[linear-gradient(135deg,#B45309,#F59E0B)] xl:col-span-3"
                icon={Banknote}
                label="Outstanding"
                value={money.format(summary.outstanding)}
            />
            <BentoMetricCard
                ariaLabel="Pending deliveries"
                className="order-7 border-[#3155E7]/20 bg-[linear-gradient(135deg,#1E3A8A,#3155E7)] xl:col-span-3"
                icon={Clock3}
                label="Pending"
                value={compactNumber.format(pendingDeliveries)}
            />
            <BentoMetricCard
                ariaLabel="Disputes"
                className={cn(
                    'order-8 xl:col-span-3',
                    disputes > 0
                        ? 'border-[#F97316]/20 bg-[linear-gradient(135deg,#C2410C,#FB923C)]'
                        : 'border-[#06B6D4]/20 bg-[linear-gradient(135deg,#0E7490,#22D3EE)]',
                )}
                icon={AlertTriangle}
                label="Disputes"
                value={compactNumber.format(disputes)}
            />
        </div>
    );
}

function TrendCard({ data, max }: { data: MonthlyTrend[]; max: number }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const series = [
        {
            key: 'enquiries',
            label: 'Enquiries',
            color: funnelGradients[0][0],
            background: `linear-gradient(to top, ${funnelGradients[0][1]}, ${funnelGradients[0][0]})`,
        },
        {
            key: 'orders',
            label: 'Orders',
            color: funnelGradients[1][0],
            background: `linear-gradient(to top, ${funnelGradients[1][1]}, ${funnelGradients[1][0]})`,
        },
        {
            key: 'completed',
            label: 'Completed',
            color: funnelGradients[2][0],
            background: `linear-gradient(to top, ${funnelGradients[2][1]}, ${funnelGradients[2][0]})`,
        },
    ] as const;
    const activeMonth = activeIndex === null ? null : data[activeIndex];
    const activeLeft =
        activeIndex === null || data.length === 0
            ? 0
            : ((activeIndex + 0.5) / data.length) * 100;

    return (
        <Card
            className={`${chartCardClassName} [--card-spacing:--spacing(3)] xl:col-span-1`}
        >
            <CardHeader>
                <CardTitle className={analyticsCardTitleClassName}>
                    Six-Month Trend
                </CardTitle>
                <CardDescription>
                    Enquiries, orders, and completed orders by month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className="relative flex h-80 items-end gap-4 overflow-hidden rounded-2xl border border-[#E3EAF2] bg-white px-4 pt-5 pb-8"
                    onPointerLeave={() => setActiveIndex(null)}
                >
                    <div className="pointer-events-none absolute inset-x-4 top-5 bottom-8 grid grid-rows-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <span
                                key={`trend-grid-${index}`}
                                className="border-t border-dashed border-slate-200"
                            />
                        ))}
                    </div>
                    {activeMonth && (
                        <div
                            className="pointer-events-none absolute top-4 z-30 w-44 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-xs backdrop-blur-sm transition-[left] duration-150 ease-out"
                            style={{
                                left: `clamp(8px, calc(${activeLeft}% - 5.5rem), calc(100% - 11.5rem))`,
                            }}
                        >
                            <p className="mb-1.5 font-bold text-[#172033]">
                                {activeMonth.label}
                            </p>
                            <div className="grid gap-1.5">
                                {series.map((item) => (
                                    <div
                                        key={`trend-tooltip-${item.key}`}
                                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
                                    >
                                        <span
                                            className="size-2 rounded-full"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        <span className="truncate text-slate-500">
                                            {item.label}
                                        </span>
                                        <span className="text-right font-semibold text-[#172033] tabular-nums">
                                            {compactNumber.format(
                                                activeMonth[item.key],
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.map((month, index) => (
                        <div
                            key={month.label}
                            className="relative z-10 grid min-w-0 flex-1 gap-2 text-center outline-none"
                            onBlur={() => setActiveIndex(null)}
                            onFocus={() => setActiveIndex(index)}
                            onPointerEnter={() => setActiveIndex(index)}
                            role="group"
                            tabIndex={0}
                        >
                            <div className="flex h-64 items-end justify-center gap-1.5">
                                {series.map((item) => (
                                    <TrendBar
                                        key={`${month.label}-${item.key}`}
                                        background={item.background}
                                        label={item.label}
                                        max={max}
                                        value={month[item.key]}
                                    />
                                ))}
                            </div>
                            <span
                                className={`mx-auto truncate rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                                    activeIndex === index
                                        ? 'bg-[#020617] text-white'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {month.label}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {series.map((item) => (
                        <Legend
                            key={item.key}
                            color={item.color}
                            label={item.label}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function PortStatusBentoGrid({ data }: { data: PortStatusMetric[] }) {
    return (
        <Card className={chartCardClassName}>
            <CardHeader>
                <CardTitle
                    className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                >
                    <MapPin className="size-5 text-[#0077b6]" />
                    Port Status
                </CardTitle>
                <CardDescription>
                    Pending deliveries, completed deliveries, and pending
                    disputes by port.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4">
                {data.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No port status data yet.
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        {data.map((port, index) => {
                            const cardColor = portColor(port.label);
                            const iconPath = portIconPath(port.label, index);

                            return (
                                <div
                                    key={port.portKey}
                                    className="overflow-hidden rounded-2xl border border-white/20 text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] ring-1 ring-slate-950/[0.04]"
                                    style={{ backgroundColor: cardColor }}
                                >
                                    <div className="grid gap-3 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-white">
                                                    {port.label}
                                                </p>
                                                <p className="text-xs font-medium text-white/75">
                                                    {port.total} active
                                                    indicators
                                                </p>
                                            </div>
                                            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] ring-1 ring-white/60">
                                                <img
                                                    alt=""
                                                    className="size-8 object-contain"
                                                    src={iconPath}
                                                />
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 divide-x divide-white/28 border-t border-white/24 pt-3">
                                            <PortStatusMiniCard
                                                icon={Clock3}
                                                label="Pending"
                                                value={port.pendingDeliveries}
                                            />
                                            <PortStatusMiniCard
                                                icon={CheckCircle2}
                                                label="Completed"
                                                value={port.completedDeliveries}
                                            />
                                            <PortStatusMiniCard
                                                icon={AlertTriangle}
                                                label="Disputes"
                                                value={port.pendingDisputes}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PortStatusMiniCard({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
}) {
    return (
        <div className="grid min-h-16 gap-2 px-3 first:pl-0 last:pr-0">
            <div className="flex items-center gap-1.5">
                <Icon className="size-3.5 shrink-0 text-white/85" />
                <span className="truncate text-[0.7rem] font-semibold text-white/75">
                    {label}
                </span>
            </div>
            <span className="text-2xl leading-none font-bold text-white tabular-nums">
                {value}
            </span>
        </div>
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
        ...data.flatMap((month) => [month.currentYear, month.lastYear]),
        1,
    );
    const currentYearTotal = data.reduce(
        (sum, month) => sum + month.currentYear,
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

function TopPortsBarCard({ data }: { data: CountMetric[] }) {
    const ports = data.slice(0, 5);
    const total = ports.reduce((sum, item) => sum + item.value, 0);
    const max = Math.max(...ports.map((item) => item.value), 1);

    return (
        <Card className={`${chartCardClassName} min-h-[300px]`}>
            <CardHeader className="pb-2">
                <CardTitle
                    className={`flex items-center gap-2 ${analyticsCardTitleClassName}`}
                >
                    <Anchor className="size-5 text-[#0077b6]" />
                    Top Ports
                </CardTitle>
                <CardDescription>Ports with the most orders.</CardDescription>
            </CardHeader>
            <CardContent>
                {ports.length === 0 || total <= 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No port order data yet.
                    </p>
                ) : (
                    <div className="grid gap-3">
                        {ports.map((port, index) => {
                            const width = Math.max((port.value / max) * 100, 4);

                            return (
                                <div
                                    key={`${port.label}-bar`}
                                    className="grid gap-1.5"
                                >
                                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                                        <span className="font-bold text-slate-400 tabular-nums">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="truncate font-semibold text-[#172033]">
                                            {port.label}
                                        </span>
                                        <span className="font-semibold text-slate-500 tabular-nums">
                                            <NumberFlow
                                                value={port.value}
                                                format={{
                                                    notation: 'compact',
                                                    maximumFractionDigits: 1,
                                                }}
                                            />
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[#EDF3FA]">
                                        <span
                                            className="block h-full rounded-full"
                                            style={{
                                                backgroundColor: portColor(
                                                    port.label,
                                                    index,
                                                ),
                                                width: `${width}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TrendBar({
    background,
    label,
    value,
    max,
}: {
    background: string;
    label: string;
    value: number;
    max: number;
}) {
    return (
        <div
            aria-label={`${label}: ${value}`}
            title={`${label}: ${value}`}
            className="w-3 rounded-t-md rounded-b-sm shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition-[height,opacity] duration-200 hover:opacity-80"
            style={{
                background,
                height: `${Math.max((value / max) * 100, 4)}%`,
            }}
        />
    );
}

function TopCustomersBarCard({ data }: { data: ValueMetric[] }) {
    return (
        <Card className={chartCardClassName}>
            <CardHeader>
                <CardTitle className={analyticsCardTitleClassName}>
                    Top Customers
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

function ProductMixPieCard({
    data,
    title,
    description,
    emptyMessage = 'No product quantity yet.',
}: {
    data: ValueMetric[];
    title: string;
    description: string;
    emptyMessage?: string;
}) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const pieData = data.map((item, index) => ({
        ...item,
        id: item.label.toLowerCase().replace(/\s+/g, '-'),
        color: productColor(item.label, index),
        shareValue: total > 0 ? (item.value / total) * 100 : null,
    }));
    const centerRow = pieData.find((item) => item.value > 0) ?? pieData[0];

    return (
        <Card className={`${chartCardClassName} min-h-[300px]`}>
            <CardHeader className="pb-2">
                <CardTitle className={analyticsCardTitleClassName}>
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                {pieData.length === 0 || total <= 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        {emptyMessage}
                    </p>
                ) : (
                    <div className="grid items-center gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
                        <div className="flex justify-center md:justify-start">
                            <BklitPieChart
                                data={pieData}
                                size={180}
                                innerRadius={52}
                                padAngle={0.014}
                                className="[--chart-1:#03045e] [--chart-2:#0077b6] [--chart-3:#00b4d8]"
                            >
                                {pieData.map((row, index) => (
                                    <PieSlice
                                        key={`${row.id}-slice`}
                                        index={index}
                                        hoverEffect="grow"
                                        hoverOffset={6}
                                    />
                                ))}
                                <PieCenter>
                                    {({ item }) => {
                                        const displayRow = item ?? centerRow;
                                        const hasShareValue =
                                            displayRow?.shareValue !== null &&
                                            displayRow?.shareValue !==
                                                undefined;

                                        return (
                                            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border border-slate-200 bg-white/95 text-center shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                                                <p className="text-base leading-none font-semibold text-slate-950 tabular-nums">
                                                    {hasShareValue ? (
                                                        <NumberFlow
                                                            value={Number(
                                                                displayRow.shareValue,
                                                            )}
                                                            format={{
                                                                minimumFractionDigits: 1,
                                                                maximumFractionDigits: 1,
                                                            }}
                                                            suffix="%"
                                                        />
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </p>
                                                <p className="mt-1 max-w-[4.8rem] truncate text-[0.6rem] leading-tight font-bold tracking-[0.08em] text-slate-500 uppercase">
                                                    {displayRow?.label ??
                                                        'Current'}
                                                </p>
                                            </div>
                                        );
                                    }}
                                </PieCenter>
                            </BklitPieChart>
                        </div>
                        <div className="grid gap-2">
                            {pieData.map((item) => (
                                <div
                                    key={`${item.id}-legend`}
                                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#E3EAF2] bg-white px-3 py-2 text-sm"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        <span className="truncate font-medium text-[#172033]">
                                            {item.label}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right font-semibold text-slate-500 tabular-nums">
                                        {compactNumber.format(item.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
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
