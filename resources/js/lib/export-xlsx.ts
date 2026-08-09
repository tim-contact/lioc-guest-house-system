import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
    header: string;
    value: (row: T) => string | number | null;
}

export function exportToXlsx<T>(
    rows: T[],
    columns: ExportColumn<T>[],
    filename: string,
    sheetName = 'Sheet1',
): void {
    const data = rows.map((row) => {
        const record: Record<string, string | number | null> = {};

        for (const col of columns) {
            record[col.header] = col.value(row);
        }

        return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(data, {
        header: columns.map((c) => c.header),
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}
