import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { exportToXlsx, type ExportColumn } from '@/lib/export-xlsx';

export function DateRangeExport<T>({
    url,
    columns,
    filename,
    dateLabel,
    filters = {},
}: {
    url: string;
    columns: ExportColumn<T>[];
    filename: string;
    dateLabel: string;
    filters?: Record<string, string>;
}) {
    const [open, setOpen] = useState(false);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit() {
        if (!from || !to || to < from) {
            setError('Select a valid date range.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const query = new URLSearchParams({
                ...filters,
                date_from: from,
                date_to: to,
            });
            const response = await fetch(`${url}?${query}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) throw new Error('Unable to export records.');
            const payload = (await response.json()) as { rows: T[] };
            if (payload.rows.length === 0) {
                setError('No records found for this date range.');
                return;
            }
            exportToXlsx(payload.rows, columns, `${filename}-${from}-to-${to}`);
            setOpen(false);
        } catch {
            setError('Unable to export records. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button variant="outline" onClick={() => setOpen(true)}>
                <FileSpreadsheet className="size-4" /> Export to Excel
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export {filename}</DialogTitle>
                    <DialogDescription>
                        Filter by {dateLabel}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor={`${filename}-from`}>From</Label>
                        <Input
                            id={`${filename}-from`}
                            type="date"
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${filename}-to`}>To</Label>
                        <Input
                            id={`${filename}-to`}
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </div>
                </div>
                {error && (
                    <p className="text-sm text-destructive" role="alert">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    <Button type="button" onClick={submit} disabled={loading}>
                        {loading ? 'Exporting...' : 'Export'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
