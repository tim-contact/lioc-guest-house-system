import XLSX from 'xlsx';

const cleanHeader = (value) =>
    String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
const empty = (value) =>
    value === null || value === undefined || String(value).trim() === '';

function dateValue(value, workbook, row, field) {
    if (typeof value !== 'number') return value;
    const date = XLSX.SSF.parse_date_code(value, {
        date1904: Boolean(workbook.Workbook?.WBProps?.date1904),
    });
    if (!date) throw new Error(`Row ${row}: invalid ${field}.`);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
}

function operationsHeaderIndex(cells) {
    return cells.slice(0, 20).findIndex((row) => {
        const labels = row.map(cleanHeader);
        return [
            'customer vessel',
            'customer',
            'product',
            'present eta/etb',
            'date of booking',
            'unit rate (usd/mt)',
        ].every((label) => labels.includes(label));
    });
}

function readOperations(sheet, cells, headerIndex, workbook) {
    const headers = [...cells[headerIndex]];
    for (const merge of sheet['!merges'] ?? []) {
        if (merge.s.r === headerIndex && merge.e.r === headerIndex) {
            for (let column = merge.s.c + 1; column <= merge.e.c; column++) {
                headers[column] = headers[merge.s.c];
            }
        }
    }
    const labels = headers.map(cleanHeader);
    const subheaders = (cells[headerIndex + 1] ?? []).map(cleanHeader);
    const columns = {};
    const singleColumns = {
        'customer vessel': 'vessel_name',
        customer: 'customer_name',
        'present eta/etb': 'delivery_date',
        'delivery location': 'supply_location_name',
        'date of booking': 'order_date',
        imo: 'vessel_imo',
        'agent name': 'agent_name',
        mobile: 'mobile_no',
        port: 'port_name',
        'port name': 'port_name',
        'customer sap id': 'customer_sap_id',
        sap_id: 'customer_sap_id',
        'barge imo': 'barge_imo',
        'barge name': 'barge_name',
        'order number': 'order_number',
        'bdn number': 'bdn_number',
    };
    for (const [column, label] of labels.entries()) {
        let field = singleColumns[label];
        if (label.startsWith('mode of delivery')) field = 'delivery_mode';
        if (label.startsWith('pdt type')) field = 'product_type';
        if (label.startsWith('credit period / payment terms'))
            field = 'credit_terms';
        if (label === 'product' || label === 'unit rate (usd/mt)') {
            const grade = {
                mgo: 'mgo',
                lsfo: 'vlsfo',
                vlsfo: 'vlsfo',
                hsfo: 'hsfo',
            }[subheaders[column]];
            if (!grade)
                throw new Error(
                    `Unrecognized product subheader in column ${XLSX.utils.encode_col(column)}.`,
                );
            field = `${grade}_${label === 'product' ? 'delivered_mt' : 'rate_usd_per_mt'}`;
        }
        if (field) {
            if (Object.hasOwn(columns, field))
                throw new Error(`Duplicate mapped column: ${field}`);
            columns[field] = column;
        }
    }
    for (const field of [
        'vessel_name',
        'customer_name',
        'delivery_date',
        'order_date',
        'delivery_mode',
        'product_type',
        'credit_terms',
        'mgo_delivered_mt',
        'vlsfo_delivered_mt',
        'mgo_rate_usd_per_mt',
        'vlsfo_rate_usd_per_mt',
    ]) {
        if (!Object.hasOwn(columns, field))
            throw new Error(`Missing operations column: ${field}`);
    }
    const rows = [];
    for (let index = headerIndex + 2; index < cells.length; index++) {
        const values = cells[index];
        if (Object.values(columns).every((column) => empty(values[column]))) {
            if (
                values.every(empty) ||
                sheet['!merges']?.some(
                    (merge) =>
                        merge.s.r === index &&
                        merge.s.c === 0 &&
                        merge.e.c >= 5,
                )
            )
                continue;
            throw new Error(
                `Row ${index + 1}: unrecognized nonempty row; review it before importing.`,
            );
        }
        const row = Object.fromEntries(
            Object.entries(columns).map(([field, column]) => [
                field,
                values[column] ?? null,
            ]),
        );
        const mode = cleanHeader(row.delivery_mode);
        if (['tt', 'truck', 'tank truck'].includes(mode))
            row.delivery_mode = 'truck';
        else if (['pl', 'pipeline'].includes(mode))
            row.delivery_mode = 'pipeline';
        else if (mode && mode !== 'barge') {
            row.delivery_mode = 'barge';
            row.barge_name ??= values[columns.delivery_mode];
        }
        row.order_date = dateValue(
            row.order_date,
            workbook,
            index + 1,
            'order_date',
        );
        row.delivery_date = dateValue(
            row.delivery_date,
            workbook,
            index + 1,
            'delivery_date',
        );
        row.currency = 'USD';
        rows.push({ row: index + 1, values: row });
    }
    return rows;
}

try {
    const workbook = XLSX.readFile(process.argv[2], { cellDates: false });
    let sheet = workbook.Sheets.Orders;
    if (!sheet) {
        const candidates = workbook.SheetNames.filter((name) => {
            if (/examples|instructions|field guide|allowed values/i.test(name))
                return false;
            return (
                operationsHeaderIndex(
                    XLSX.utils.sheet_to_json(workbook.Sheets[name], {
                        header: 1,
                        defval: null,
                    }),
                ) >= 0
            );
        });
        if (candidates.length !== 1)
            throw new Error(
                'Provide an Orders sheet or exactly one recognized operations-template sheet.',
            );
        sheet = workbook.Sheets[candidates[0]];
    }

    const cells = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (cells.length > 50002)
        throw new Error('The importer supports at most 50,000 worksheet rows.');
    const headerIndex = operationsHeaderIndex(cells);
    if (headerIndex >= 0) {
        process.stdout.write(
            JSON.stringify(readOperations(sheet, cells, headerIndex, workbook)),
        );
    } else {
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
            throw new Error(
                'The importer supports at most 50,000 worksheet rows.',
            );

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
                        value = dateValue(value, workbook, index + 2, header);
                    }
                    return [header, value];
                }),
            );
            rows.push({ row: index + 2, values: row });
        }
        process.stdout.write(JSON.stringify(rows));
    }
} catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
}
