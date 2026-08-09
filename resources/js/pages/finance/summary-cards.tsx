import { addWeeks, endOfWeek, isWithinInterval, startOfWeek } from 'date-fns';
import { Stat } from '@/components/edit-panel/fields';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dateOnlyToDate, formatMoney } from '@/lib/utils';
import type { CompletedRow } from './dashboard';

interface Bucket {
    label: string;
    count: number;
    amount: number;
}

function balance(row: CompletedRow): number {
    const invoiceValue = Number(row.invoice_value ?? 0);
    const amountReceived = Number(row.amount_received ?? 0);
    const value = invoiceValue - amountReceived;

    return Number.isFinite(value) ? value : 0;
}

function bucket(label: string, rows: CompletedRow[]): Bucket {
    return {
        label,
        count: rows.length,
        amount: rows.reduce((total, row) => total + balance(row), 0),
    };
}

function dueWithin(
    rows: CompletedRow[],
    start: Date,
    end: Date,
): CompletedRow[] {
    return rows.filter((row) => {
        const due = row.payment_due_date
            ? dateOnlyToDate(row.payment_due_date)
            : undefined;

        return due ? isWithinInterval(due, { start, end }) : false;
    });
}

export function FinanceSummaryCards({
    completedOrders,
}: {
    completedOrders: CompletedRow[];
}) {
    const pending = completedOrders.filter((row) => !row.paid_in_full);

    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(thisWeekStart, 1);
    const nextWeekEnd = addWeeks(thisWeekEnd, 1);

    const buckets = [
        bucket('Total Invoices Pending', pending),
        bucket(
            'Pending This Week',
            dueWithin(pending, thisWeekStart, thisWeekEnd),
        ),
        bucket(
            'Pending Next Week',
            dueWithin(pending, nextWeekStart, nextWeekEnd),
        ),
    ];

    return (
        <Card className="gap-0 rounded-2xl bg-info/10 py-4 shadow-none ring-info/30">
            <CardHeader>
                <CardTitle className="text-xl font-medium text-info sm:text-2xl">
                    Invoices Pending
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-info/20">
                {buckets.map((summary) => (
                    <div
                        key={summary.label}
                        className="flex flex-col gap-2 sm:pl-6 sm:first:pl-0"
                    >
                        <span className="text-xs font-medium tracking-wide text-info/70 uppercase">
                            {summary.label}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                            <Stat
                                label="Invoices"
                                value={String(summary.count)}
                            />
                            <Stat
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
