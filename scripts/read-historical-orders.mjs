import XLSX from 'xlsx';

try {
    const workbook = XLSX.readFile(process.argv[2], { cellDates: false });
    const sheet = workbook.Sheets.Orders;
    if (!sheet) throw new Error('The workbook must contain an Orders sheet.');

    const cells = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const headers = (cells.shift() ?? []).map((value) =>
        String(value ?? '').trim(),
    );
    if (
        !headers.length ||
        new Set(headers).size !== headers.length ||
        headers.includes('')
    ) {
        throw new Error('Orders headers must be nonempty and unique.');
    }
    for (const header of [
        'order_date',
        'customer_sap_id',
        'vessel_name',
        'delivery_date',
    ]) {
        if (!headers.includes(header))
            throw new Error(`Missing Orders column: ${header}`);
    }
    if (cells.length > 50000)
        throw new Error('The importer supports at most 50,000 worksheet rows.');

    const dateFields = new Set([
        'order_date',
        'delivery_date',
        'payment_due_date',
    ]);
    const rows = [];
    for (const [index, values] of cells.entries()) {
        if (
            values.every(
                (value) => value === null || String(value).trim() === '',
            )
        )
            continue;
        const row = Object.fromEntries(
            headers.map((header, column) => {
                let value = values[column] ?? null;
                if (dateFields.has(header) && typeof value === 'number') {
                    const date = XLSX.SSF.parse_date_code(value, {
                        date1904: Boolean(workbook.Workbook?.WBProps?.date1904),
                    });
                    if (!date)
                        throw new Error(`Row ${index + 2}: invalid ${header}.`);
                    value = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                }
                return [header, value];
            }),
        );
        rows.push({ row: index + 2, values: row });
    }
    process.stdout.write(JSON.stringify(rows));
} catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
}
