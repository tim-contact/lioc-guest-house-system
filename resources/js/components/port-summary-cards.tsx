import { Stat } from '@/components/edit-panel/fields';
import { PORTS } from '@/components/order-dashboard';
import type { OrderRow } from '@/components/order-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FUEL_GRADES } from '@/lib/domain';
import type { FuelGradeKey } from '@/lib/domain';
import { cn } from '@/lib/utils';

interface Summary {
    count: number;
    volumes: Record<FuelGradeKey, number>;
}

function formatVolume(value: number): string {
    return value === 0
        ? '—'
        : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

/** The final quantity once known, else the upper or lower ordered bound. */
function orderVolume(row: OrderRow, product: FuelGradeKey): number {
    const quantity =
        row[`${product}_final_qty`] ??
        row[`${product}_quantity_high`] ??
        row[`${product}_quantity_low`];

    const parsed = Number(quantity ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function summarise(rows: OrderRow[]): Summary {
    return {
        count: rows.length,
        volumes: Object.fromEntries(
            FUEL_GRADES.map((product) => [
                product.key,
                rows.reduce(
                    (total, row) => total + orderVolume(row, product.key),
                    0,
                ),
            ]),
        ) as Record<FuelGradeKey, number>,
    };
}

function SummarySection({
    label,
    summary,
    className,
}: {
    label: string;
    summary: Summary;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <span className="text-xs font-medium text-gold">{label}</span>
            <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">Orders</span>
                    <span className="font-medium tabular-nums">
                        {summary.count}
                    </span>
                </div>
                {FUEL_GRADES.map((product) => (
                    <div
                        key={product.key}
                        className="flex items-baseline justify-between gap-2"
                    >
                        <span className="text-muted-foreground">
                            Volume {product.label}
                        </span>
                        <span className="font-medium tabular-nums">
                            {formatVolume(summary.volumes[product.key])}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** The same figures as SummarySection, sized for the All Ports banner. */
function SummaryStats({
    label,
    summary,
    className,
}: {
    label: string;
    summary: Summary;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <span className="text-xs font-medium text-gold">{label}</span>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <Stat label="Orders" value={String(summary.count)} />
                {FUEL_GRADES.map((product) => (
                    <Stat
                        key={product.key}
                        label={`Volume ${product.label}`}
                        value={formatVolume(summary.volumes[product.key])}
                    />
                ))}
            </div>
        </div>
    );
}

export function PortSummaryCards({
    pendingOrders,
    completedOrders,
}: {
    pendingOrders: OrderRow[];
    completedOrders: OrderRow[];
}) {
    const total = {
        pending: summarise(pendingOrders),
        completed: summarise(completedOrders),
    };

    const byPort = PORTS.map((port) => ({
        label: port,
        pending: summarise(
            pendingOrders.filter((order) => order.port === port),
        ),
        completed: summarise(
            completedOrders.filter((order) => order.port === port),
        ),
    }));

    return (
        <div className="flex flex-col gap-4 pl-2">
            <Card className="gap-0 rounded-2xl bg-gold/10 py-4 shadow-none ring-gold/30">
                <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <CardTitle className="text-xl font-medium text-gold sm:text-2xl">
                        All Ports
                    </CardTitle>
                    <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        <SummaryStats label="Pending" summary={total.pending} />
                        <SummaryStats
                            label="Completed"
                            summary={total.completed}
                            className="border-t border-gold-border/70 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
                {byPort.map((summary) => (
                    <Card
                        key={summary.label}
                        className="gap-3 rounded-2xl border-gold-border/70 bg-gold-surface py-5 shadow-none"
                    >
                        <CardHeader>
                            <CardTitle className="text-xl font-medium text-gold sm:text-2xl">
                                {summary.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <SummarySection
                                label="Pending"
                                summary={summary.pending}
                            />
                            <SummarySection
                                label="Completed"
                                summary={summary.completed}
                                className="border-t border-gold-border/70 pt-3"
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
