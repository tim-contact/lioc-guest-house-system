import { Stat } from '@/components/edit-panel/fields';
import { PORTS } from '@/components/order-dashboard';
import type { OrderRow } from '@/components/order-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FUEL_GRADES } from '@/lib/domain';
import type { FuelGradeKey } from '@/lib/domain';

interface Summary {
    label: string;
    count: number;
    volumes: Record<FuelGradeKey, number>;
}

function formatVolume(value: number): string {
    return value === 0
        ? '—'
        : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

/** The delivered quantity once known, else the upper bound of the ordered range. */
function orderVolume(row: OrderRow, product: FuelGradeKey): number {
    const quantity =
        row[`${product}_final_qty`] ??
        row[`${product}_quantity_high`] ??
        row[`${product}_quantity_low`];

    const parsed = Number(quantity ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function summarise(label: string, rows: OrderRow[]): Summary {
    return {
        label,
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

export function PortSummaryCards({ orders }: { orders: OrderRow[] }) {
    const total = summarise('All Ports', orders);

    const byPort = PORTS.map((port) =>
        summarise(
            port,
            orders.filter((order) => order.port === port),
        ),
    );

    return (
        <div className="flex flex-col gap-4 pl-2">
            <Card className="gap-0 rounded-2xl bg-gold/10 py-4 shadow-none ring-gold/30">
                <CardContent className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
                    <CardTitle className="text-xl font-medium text-gold sm:text-2xl">
                        {total.label}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        <Stat
                            label="Pending orders"
                            value={String(total.count)}
                        />
                        {FUEL_GRADES.map((product) => (
                            <Stat
                                key={product.key}
                                label={`Volume ${product.label}`}
                                value={formatVolume(total.volumes[product.key])}
                            />
                        ))}
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
                        <CardContent className="flex flex-col gap-1.5 text-sm">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-muted-foreground">
                                    Pending orders
                                </span>
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
                                        {formatVolume(
                                            summary.volumes[product.key],
                                        )}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
