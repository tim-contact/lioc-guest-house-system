import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToXlsx } from '@/lib/export-xlsx';
import type { ExportColumn } from '@/lib/export-xlsx';

interface ExportButtonProps<T> {
    rows: T[];
    columns: ExportColumn<T>[];
    filename: string;
}

export function ExportButton<T>({
    rows,
    columns,
    filename,
}: ExportButtonProps<T>) {
    return (
        <Button
            variant="outline"
            onClick={() => exportToXlsx(rows, columns, filename)}
            disabled={rows.length === 0}
        >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
        </Button>
    );
}
