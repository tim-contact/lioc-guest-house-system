import { CalendarClock, CircleDollarSign, ReceiptText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';

export interface FinanceSummaryBucket {
    label: string;
    count: number;
    amount: number;
}

function CommandMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="truncate text-xs font-semibold tracking-[0.035em] text-slate-200/82 uppercase">
                {label}
            </p>
            <p className="mt-1 text-[clamp(1.45rem,2vw,2rem)] leading-tight font-bold text-white tabular-nums">
                {value}
            </p>
        </div>
    );
}

export function FinanceSummaryCards({
    summary,
}: {
    summary: FinanceSummaryBucket[];
}) {
    return (
        <Card className="relative overflow-hidden rounded-[18px] border border-[rgba(96,165,250,0.24)] bg-[linear-gradient(120deg,rgba(8,43,91,0.98),rgba(5,39,84,0.98),rgba(6,51,108,0.96))] py-0 text-white shadow-[0_14px_32px_rgba(15,45,90,0.16)]">
            <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.08]" />
            <CardHeader className="relative flex flex-row items-center gap-3 border-b border-white/14 px-5 py-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                    <ReceiptText className="size-6 text-white" />
                </span>
                <div className="min-w-0">
                    <CardTitle className="text-xs font-bold tracking-[0.14em] text-slate-200 uppercase">
                        Invoices Pending
                    </CardTitle>
                    <p className="mt-1 text-sm font-medium text-slate-300">
                        Finance collection summary
                    </p>
                </div>
            </CardHeader>
            <CardContent className="relative grid grid-cols-1 gap-5 p-5 md:grid-cols-3 md:divide-x md:divide-white/14">
                {summary.map((summary) => (
                    <div
                        key={summary.label}
                        className="min-w-0 space-y-3 md:pl-5 md:first:pl-0"
                    >
                        <div className="flex items-center gap-2">
                            {summary.label === 'Total Invoices Pending' ? (
                                <CircleDollarSign className="size-4 text-[#2DD4BF]" />
                            ) : (
                                <CalendarClock className="size-4 text-[#F36F21]" />
                            )}
                            <span className="text-xs font-bold tracking-[0.035em] text-slate-100 uppercase">
                                {summary.label}
                            </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                            <CommandMetric
                                label="Invoices"
                                value={String(summary.count)}
                            />
                            <CommandMetric
                                label="Amount Pending"
                                value={formatMoney(summary.amount)}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
