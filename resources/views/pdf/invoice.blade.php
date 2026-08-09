<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #111827;
            -webkit-print-color-adjust: exact;
        }

        .title {
            margin: 0 0 24px;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.04em;
        }

        .parties {
            display: flex;
            gap: 24px;
            margin-bottom: 24px;
        }

        .party {
            flex: 1;
            border: 1px dashed #9ca3af;
            padding: 12px;
            min-height: 90px;
        }

        .label {
            margin-bottom: 6px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #6b7280;
        }

        .meta {
            display: flex;
            gap: 24px;
            margin-bottom: 24px;
            padding: 12px;
            background: #f3f4f6;
        }

        .meta div {
            flex: 1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }

        thead th {
            padding: 8px;
            border-bottom: 2px solid #111827;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            text-align: left;
        }

        tbody td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .numeric {
            text-align: right;
        }

        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
        }

        .totals table {
            width: 240px;
            margin: 0;
        }

        .totals td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .totals tr:last-child td {
            border-bottom: none;
            border-top: 2px solid #111827;
            font-weight: 700;
        }

        .notes {
            border: 1px dashed #9ca3af;
            padding: 12px;
            min-height: 70px;
        }
    </style>
</head>
<body>
    <h1 class="title">PLACEHOLDER INVOICE</h1>

    <div class="parties">
        <div class="party">
            <div class="label">From</div>
            Placeholder Seller Block
        </div>
        <div class="party">
            <div class="label">Bill To</div>
            Placeholder Bill-To Block
        </div>
    </div>

    <div class="meta">
        <div>
            <div class="label">Invoice No</div>
            PLACEHOLDER
        </div>
        <div>
            <div class="label">Invoice Date</div>
            PLACEHOLDER
        </div>
        <div>
            <div class="label">Due Date</div>
            PLACEHOLDER
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="numeric">Quantity</th>
                <th class="numeric">Rate</th>
                <th class="numeric">Amount</th>
            </tr>
        </thead>
        <tbody>
            @for ($row = 1; $row <= 3; $row++)
                <tr>
                    <td>Placeholder Product {{ $row }}</td>
                    <td class="numeric">PLACEHOLDER</td>
                    <td class="numeric">PLACEHOLDER</td>
                    <td class="numeric">PLACEHOLDER</td>
                </tr>
            @endfor
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal</td>
                <td class="numeric">PLACEHOLDER</td>
            </tr>
            <tr>
                <td>Total</td>
                <td class="numeric">PLACEHOLDER</td>
            </tr>
        </table>
    </div>

    <div class="notes">
        <div class="label">Notes / Payment Terms</div>
        Placeholder Notes Block
    </div>
</body>
</html>
