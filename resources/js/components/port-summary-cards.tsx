import { Anchor, CheckCircle2, Clock3, Ship } from 'lucide-react';
import type { OrderRow } from '@/components/order-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FUEL_GRADES } from '@/lib/domain';
import type { FuelGradeKey } from '@/lib/domain';
import { cn } from '@/lib/utils';

interface Summary {
    count: number;
    volumes: Record<FuelGradeKey, number>;
}

function formatVolume(value: number): string {
    return value === 0
        ? '-'
        : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

/** Use delivered quantity for completed orders, then fall back to the ordered quantity. */
function orderVolume(
    row: OrderRow,
    product: FuelGradeKey,
    quantitySource: 'ordered' | 'bdn',
): number {
    const quantity =
        (quantitySource === 'bdn' ? row[`${product}_bdn_qty`] : null) ??
        row[`${product}_final_qty`] ??
        row[`${product}_quantity_high`] ??
        row[`${product}_quantity_low`];

    const parsed = Number(quantity ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function summarise(
    rows: OrderRow[],
    quantitySource: 'ordered' | 'bdn',
): Summary {
    return {
        count: rows.length,
        volumes: Object.fromEntries(
            FUEL_GRADES.map((product) => [
                product.key,
                rows.reduce(
                    (total, row) =>
                        total + orderVolume(row, product.key, quantitySource),
                    0,
                ),
            ]),
        ) as Record<FuelGradeKey, number>,
    };
}

function CommandMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 border-l border-white/20 pl-3">
            <p className="text-xs leading-tight font-semibold tracking-[0.035em] text-slate-200/82 uppercase">
                {label}
            </p>
            <p className="mt-1.5 text-xl leading-tight font-bold whitespace-nowrap text-white tabular-nums">
                {value}
            </p>
        </div>
    );
}

function CompactStatusRow({
    label,
    summary,
    tone,
}: {
    label: string;
    summary: Summary;
    tone: 'pending' | 'completed';
}) {
    const Icon = tone === 'pending' ? Clock3 : CheckCircle2;
    const toneClassName =
        tone === 'pending' ? 'text-orange-700' : 'text-teal-700';

    return (
        <TableRow
            className={cn(
                'border-slate-200/70',
                tone === 'pending'
                    ? 'bg-orange-50 hover:bg-orange-50'
                    : 'bg-teal-50 hover:bg-teal-50',
            )}
        >
            <TableHead
                scope="row"
                className={cn(
                    'h-auto px-1.5 py-1.5 text-[10px] font-bold',
                    toneClassName,
                )}
            >
                <div className="flex items-center gap-1">
                    <Icon className="size-3 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                </div>
            </TableHead>
            <TableCell className="px-1.5 py-1.5 text-right text-[11px] font-bold text-[#0F172A] tabular-nums">
                {summary.count}
            </TableCell>
            {FUEL_GRADES.map((product) => (
                <TableCell
                    key={product.key}
                    className="px-1.5 py-1.5 text-right text-[11px] font-semibold text-[#0F172A] tabular-nums"
                >
                    {formatVolume(summary.volumes[product.key])}
                </TableCell>
            ))}
        </TableRow>
    );
}

function CommandSummaryStats({
    label,
    summary,
    tone,
    className,
}: {
    label: string;
    summary: Summary;
    tone: 'pending' | 'completed';
    className?: string;
}) {
    const Icon = tone === 'pending' ? Clock3 : CheckCircle2;
    const accentClassName =
        tone === 'pending' ? 'text-[#F36F21]' : 'text-[#2DD4BF]';

    return (
        <div className={cn('min-w-0 space-y-3', className)}>
            <div className="flex items-center gap-2">
                <Icon className={cn('size-4', accentClassName)} />
                <span
                    className={cn(
                        'text-xs font-bold tracking-[0.035em] uppercase',
                        accentClassName,
                    )}
                >
                    {label}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 xl:grid-cols-4">
                <CommandMetric label="Orders" value={String(summary.count)} />
                {FUEL_GRADES.map((product) => (
                    <CommandMetric
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
    ports,
    pendingOrders,
    completedOrders,
}: {
    ports: string[];
    pendingOrders: OrderRow[];
    completedOrders: OrderRow[];
}) {
    const total = {
        pending: summarise(pendingOrders, 'ordered'),
        completed: summarise(completedOrders, 'bdn'),
    };

    const byPort = ports.map((port) => ({
        label: port,
        pending: summarise(
            pendingOrders.filter((order) => order.port === port),
            'ordered',
        ),
        completed: summarise(
            completedOrders.filter((order) => order.port === port),
            'bdn',
        ),
    }));

    return (
        <div className="flex flex-col gap-4 pb-4">
            <Card className="relative overflow-hidden rounded-[18px] border border-[rgba(96,165,250,0.24)] bg-[linear-gradient(120deg,rgba(8,43,91,0.98),rgba(5,39,84,0.98),rgba(6,51,108,0.96))] py-0 text-white shadow-[0_14px_32px_rgba(15,45,90,0.16)]">
                <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.08]" />
                <CardContent className="relative grid gap-5 p-5 md:grid-cols-[minmax(150px,0.7fr)_minmax(0,2.3fr)_minmax(0,2.3fr)] md:items-center">
                    <div className="flex items-center gap-3">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <Ship className="size-6 text-white" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-xs font-bold tracking-[0.14em] text-slate-200 uppercase">
                                All Ports
                            </CardTitle>
                            <p className="mt-1 text-sm font-medium text-slate-300">
                                Operations summary
                            </p>
                        </div>
                    </div>
                    <CommandSummaryStats
                        label="Pending"
                        summary={total.pending}
                        tone="pending"
                        className="border-t border-white/14 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-5"
                    />
                    <CommandSummaryStats
                        label="Completed"
                        summary={total.completed}
                        tone="completed"
                        className="border-t border-white/14 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-5"
                    />
                </CardContent>
            </Card>

            <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-2">
                {byPort.map((summary) => {
                    const hasActivity =
                        summary.pending.count > 0 ||
                        summary.completed.count > 0;

                    return (
                        <Card
                            key={summary.label}
                            className={cn(
                                'min-w-0 gap-2 rounded-[17px] border border-[#E3EAF2] bg-white py-3 shadow-[0_8px_24px_rgba(15,23,42,0.055),0_1px_2px_rgba(15,23,42,0.04)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.25)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)] motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                                hasActivity &&
                                    'border-t-[3px] border-t-[#2563EB]',
                            )}
                        >
                            <CardHeader className="px-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[#2455E6]">
                                            <Anchor className="size-4" />
                                        </span>
                                        <CardTitle className="truncate text-base font-bold text-[#0F172A]">
                                            {summary.label}
                                        </CardTitle>
                                    </div>
                                    <span
                                        className={cn(
                                            'size-2.5 shrink-0 rounded-full',
                                            hasActivity
                                                ? 'bg-[#2563EB]'
                                                : 'bg-[#CBD5E1]',
                                        )}
                                        aria-label={
                                            hasActivity
                                                ? 'Contains order activity'
                                                : 'No current order activity'
                                        }
                                        role="img"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="min-w-0 px-3">
                                <Table
                                    className="table-auto"
                                    aria-label={`${summary.label} order summary`}
                                >
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200/70 bg-slate-50 hover:bg-slate-50">
                                            <TableHead
                                                scope="col"
                                                className="h-7 px-1.5 text-[10px] text-slate-500"
                                            >
                                                Status
                                            </TableHead>
                                            <TableHead
                                                scope="col"
                                                className="h-7 px-1.5 text-right text-[10px] text-slate-500"
                                            >
                                                Orders
                                            </TableHead>
                                            {FUEL_GRADES.map((product) => (
                                                <TableHead
                                                    key={product.key}
                                                    scope="col"
                                                    className="h-7 px-1.5 text-right text-[10px] text-slate-500"
                                                >
                                                    {product.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <CompactStatusRow
                                            label="Pending"
                                            summary={summary.pending}
                                            tone="pending"
                                        />
                                        <CompactStatusRow
                                            label="Completed"
                                            summary={summary.completed}
                                            tone="completed"
                                        />
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
