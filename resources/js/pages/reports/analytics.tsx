import { Head } from '@inertiajs/react';
import NumberFlow from '@number-flow/react';
import {
    Activity,
    Anchor,
    AlertTriangle,
    Banknote,
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
import { useState } from 'react';
import { FunnelChart } from '@/components/charts/funnel-chart';
import {
    BklitPieChart,
    PieCenter,
    PieSlice,
} from '@/components/charts/pie-chart';
import { Ring, RingCenter, RingChart } from '@/components/charts/ring-chart';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ANALYTICS_STAGE_COLORS,
    analyticsStageColor,
    portColor,
    portIconPath,
    productColor,
} from '@/lib/utils';

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

const metricCards: {
    key: keyof Summary;
    label: string;
    icon: LucideIcon;
    format: (value: number) => string;
}[] = [
    {
        key: 'enquiries',
        label: 'Enquiries',
        icon: FileText,
        format: (value) => compactNumber.format(value),
    },
    {
        key: 'orders',
        label: 'Orders',
        icon: Ship,
        format: (value) => compactNumber.format(value),
    },
    {
        key: 'completed',
        label: 'Completed',
        icon: ClipboardCheck,
        format: (value) => compactNumber.format(value),
    },
    {
        key: 'conversionRate',
        label: 'Conversion',
        icon: TrendingUp,
        format: (value) => `${value}%`,
    },
    {
        key: 'amountReceived',
        label: 'Received',
        icon: CircleDollarSign,
        format: (value) => money.format(value),
    },
    {
        key: 'outstanding',
        label: 'Outstanding',
        icon: Banknote,
        format: (value) => money.format(value),
    },
];

const chartCardClassName = 'rounded-lg border-[#E3EAF2] bg-white shadow-sm';
const analyticsCardTitleClassName =
    'text-lg font-bold tracking-normal text-[#172033] sm:text-xl';

export default function ReportAnalytics({
    summary,
    funnel,
    portStatusMetrics,
    monthlyTrend,
    topPorts,
    topCustomers,
    productMix,
}: AnalyticsProps) {
    const maxTrend = Math.max(
        ...monthlyTrend.flatMap((month) => [
            month.enquiries,
            month.orders,
            month.completed,
        ]),
        1,
    );

    return (
        <>
            <Head title="Report Analytics" />

            <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 md:px-8 md:py-6">
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {metricCards.map((metric) => (
                        <Card
                            key={metric.key}
                            className="rounded-[1.25rem] bg-[radial-gradient(ellipse_at_82%_18%,#040F3A_0%,#062894_45%,#2C55E8_81%,#486AF1_97%)] py-5 text-white shadow-[0_18px_38px_rgba(37,77,255,0.22)]"
                        >
                            <CardHeader className="flex flex-row items-center justify-between gap-3 px-4">
                                <div className="min-w-0">
                                    <CardDescription className="text-[0.95rem] font-bold text-white/85">
                                        {metric.label}
                                    </CardDescription>
                                    <CardTitle className="mt-2 truncate text-4xl leading-none font-bold text-white">
                                        {metric.format(summary[metric.key])}
                                    </CardTitle>
                                </div>
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white shadow-sm">
                                    <metric.icon className="size-5" />
                                </span>
                            </CardHeader>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
                    <Card className={chartCardClassName}>
                        <CardHeader>
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
                        <CardContent>
                            <div className="min-h-[280px] overflow-visible">
                                <FunnelChart
                                    data={funnel.map((stage, index) => ({
                                        ...stage,
                                        gradient: [
                                            {
                                                offset: '0%',
                                                color: analyticsStageColor(
                                                    stage.label,
                                                    index,
                                                ),
                                            },
                                            {
                                                offset: '100%',
                                                color: analyticsStageColor(
                                                    stage.label,
                                                    index,
                                                ),
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
                                    showLabels
                                    showPercentage
                                    showValues
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <PortStatusBentoGrid data={portStatusMetrics} />
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <TrendCard data={monthlyTrend} max={maxTrend} />
                    <TopPortsRingCard data={topPorts} />
                    <ProductMixPieCard data={productMix} />
                </section>

                <section>
                    <TopCustomersBarCard data={topCustomers} />
                </section>
            </main>
        </>
    );
}

function TrendCard({ data, max }: { data: MonthlyTrend[]; max: number }) {
    const series = [
        {
            key: 'enquiries',
            label: 'Enquiries',
            color: ANALYTICS_STAGE_COLORS.enquiries,
        },
        {
            key: 'orders',
            label: 'Orders',
            color: ANALYTICS_STAGE_COLORS.orders,
        },
        {
            key: 'completed',
            label: 'Completed',
            color: ANALYTICS_STAGE_COLORS.completed,
        },
    ] as const;

    return (
        <Card className={`${chartCardClassName} xl:col-span-1`}>
            <CardHeader>
                <CardTitle className={analyticsCardTitleClassName}>
                    Six-Month Trend
                </CardTitle>
                <CardDescription>
                    Enquiries, orders, and completed orders by month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative flex h-80 items-end gap-4 overflow-hidden rounded-2xl border border-[#E3EAF2] bg-white px-4 pt-5 pb-8">
                    <div className="pointer-events-none absolute inset-x-4 top-5 bottom-8 grid grid-rows-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <span
                                key={`trend-grid-${index}`}
                                className="border-t border-dashed border-slate-200"
                            />
                        ))}
                    </div>
                    {data.map((month) => (
                        <div
                            key={month.label}
                            className="relative z-10 grid min-w-0 flex-1 gap-2 text-center"
                        >
                            <div className="flex h-64 items-end justify-center gap-1.5">
                                {series.map((item) => (
                                    <TrendBar
                                        key={`${month.label}-${item.key}`}
                                        color={item.color}
                                        label={item.label}
                                        max={max}
                                        value={month[item.key]}
                                    />
                                ))}
                            </div>
                            <span className="truncate text-xs font-medium text-muted-foreground">
                                {month.label}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
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
            <CardContent>
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

function TopPortsRingCard({ data }: { data: CountMetric[] }) {
    const [hoveredRing, setHoveredRing] = useState<number | null>(null);
    const ports = data.slice(0, 5);
    const total = ports.reduce((sum, item) => sum + item.value, 0);
    const max = Math.max(...ports.map((item) => item.value), 1);
    const ringCount = Math.max(ports.length, 1);
    const strokeWidth = ringCount <= 3 ? 18 : ringCount === 4 ? 15 : 12;
    const ringGap = ringCount <= 3 ? 7 : 6;
    const baseInnerRadius = ringCount <= 3 ? 50 : ringCount === 4 ? 46 : 42;
    const ringData = ports.map((port, index) => ({
        ...port,
        color: portColor(port.label, index),
        maxValue: max,
    }));

    return (
        <Card className={chartCardClassName}>
            <CardHeader>
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
                    <div className="grid gap-5">
                        <div className="flex justify-center">
                            <RingChart
                                baseInnerRadius={baseInnerRadius}
                                data={ringData}
                                hoveredIndex={hoveredRing}
                                onHoverChange={setHoveredRing}
                                ringGap={ringGap}
                                size={252}
                                strokeWidth={strokeWidth}
                            >
                                {ringData.map((port, index) => (
                                    <Ring key={port.label} index={index} />
                                ))}
                                <RingCenter>
                                    {({ item, total: chartTotal }) => (
                                        <div className="flex flex-col items-center justify-center rounded-full text-center">
                                            <p className="text-2xl leading-none font-bold text-[#172033] italic tabular-nums">
                                                <NumberFlow
                                                    value={
                                                        item?.value ??
                                                        chartTotal
                                                    }
                                                />
                                            </p>
                                            <p className="mt-1.5 max-w-20 truncate text-[0.56rem] leading-tight font-black tracking-[0.1em] text-slate-500 uppercase">
                                                {item?.label ?? 'Port Orders'}
                                            </p>
                                        </div>
                                    )}
                                </RingCenter>
                            </RingChart>
                        </div>

                        <div className="grid gap-2">
                            {ports.map((port, index) => (
                                <div
                                    key={`${port.label}-legend`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E3EAF2] bg-white px-3 py-2 text-sm"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: portColor(
                                                    port.label,
                                                    index,
                                                ),
                                            }}
                                        />
                                        <span className="truncate font-medium text-[#172033]">
                                            {port.label}
                                        </span>
                                    </span>
                                    <span className="shrink-0 font-semibold text-slate-500 italic tabular-nums">
                                        <NumberFlow
                                            value={port.value}
                                            format={{
                                                notation: 'compact',
                                                maximumFractionDigits: 1,
                                            }}
                                        />
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

function TrendBar({
    color,
    label,
    value,
    max,
}: {
    color: string;
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
                backgroundColor: color,
                height: `${Math.max((value / max) * 100, 4)}%`,
            }}
        />
    );
}

function TopCustomersBarCard({ data }: { data: ValueMetric[] }) {
    const max = Math.max(...data.map((item) => item.value), 1);

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
                    <div className="grid gap-3">
                        {data.map((customer, index) => {
                            const width = Math.max(
                                (customer.value / max) * 100,
                                4,
                            );

                            return (
                                <div
                                    key={customer.label}
                                    className="grid gap-2 rounded-xl border border-[#E3EAF2] bg-white p-3 ring-1 ring-slate-950/[0.04]"
                                >
                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
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
                                    <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 tabular-nums">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <div className="h-3 overflow-hidden rounded-full bg-slate-200/80">
                                            <div
                                                className="h-full rounded-full bg-[#003049] shadow-[0_6px_14px_rgba(0,48,73,0.24)] transition-[width] duration-200"
                                                style={{
                                                    width: `${width}%`,
                                                }}
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

function ProductMixPieCard({ data }: { data: ValueMetric[] }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const pieData = data.map((item, index) => ({
        ...item,
        id: item.label.toLowerCase().replace(/\s+/g, '-'),
        color: productColor(item.label, index),
        shareValue: total > 0 ? (item.value / total) * 100 : null,
    }));
    const centerRow = pieData.find((item) => item.value > 0) ?? pieData[0];

    return (
        <Card className={chartCardClassName}>
            <CardHeader>
                <CardTitle className={analyticsCardTitleClassName}>
                    Product Mix
                </CardTitle>
                <CardDescription>Derived from BDN Quantities</CardDescription>
            </CardHeader>
            <CardContent>
                {pieData.length === 0 || total <= 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                        No product quantity yet.
                    </p>
                ) : (
                    <div className="grid gap-5">
                        <div className="flex justify-center">
                            <BklitPieChart
                                data={pieData}
                                size={252}
                                innerRadius={68}
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
                                            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border border-slate-200 bg-white/95 text-center shadow-[0_12px_28px_rgba(15,23,42,0.1)]">
                                                <p className="text-xl leading-none font-semibold text-slate-950 italic tabular-nums">
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
                                                <p className="mt-1 text-[0.62rem] font-black tracking-[0.14em] text-slate-500 uppercase">
                                                    Product Share
                                                </p>
                                                <p className="mt-1 max-w-[5.8rem] truncate text-[0.68rem] font-bold text-slate-400">
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
                                    className="flex items-center justify-between gap-3 text-sm"
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
                                    <span className="shrink-0 text-muted-foreground">
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
