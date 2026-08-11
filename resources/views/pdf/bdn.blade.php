<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>eBDN</title>
    <style>
        .confidential {
            font-size: 8px;
            line-height: 1.35;
            color: #374151;
            page-break-inside: avoid;
        }

        .confidential p {
            margin: 0 0 3px;
            text-align: justify;
        }

        .confidential-lead {
            font-weight: 700;
        }

        .confidential-top {
            margin: 6px 0 8px;
        }

        .confidential-bottom {
            margin-top: 8px;
            padding-top: 4px;
            border-top: 1px solid #d1d5db;
        }

        .confidential-check,
        .confidential-item {
            display: table;
            width: 100%;
            margin-bottom: 2px;
        }

        .confidential-check > span,
        .confidential-item > span {
            display: table-cell;
            vertical-align: top;
        }

        .confidential-check-box {
            width: 14px;
        }

        .confidential-check-box .checkbox {
            margin-left: 0;
        }

        .confidential-list {
            margin: 2px 0 4px 16px;
        }

        .confidential-item-num {
            width: 14px;
        }


        body {
            margin: 0;
            font-family: Helvetica, Arial, sans-serif;
            font-size: 9px;
            line-height: 1.35;
            color: #111827;
        }

        .doc-header {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }

        .doc-header > div {
            display: table-cell;
            vertical-align: top;
        }

        .doc-header p {
            margin: 0;
        }

        .doc-header-serial {
            font-size: 7px;
            line-height: 1.3;
        }

        .doc-header .title {
            margin: 5px 0 0;
        }

        .doc-header-details {
            padding-right: 8px;
            text-align: right;
            font-size: 7px;
            line-height: 1.3;
        }

        .doc-header-name {
            margin-bottom: 2px;
            font-size: 11px;
            font-weight: 700;
        }

        .doc-header-logo {
            width: 80px;
            text-align: right;
        }

        .doc-header-logo img {
            width: 76px;
            height: 76px;
        }

        .serial {
            margin-bottom: 3px;
            font-size: 9px;
            font-weight: 700;
        }

        .title {
            margin: 0 0 8px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-align: left;
            text-transform: uppercase;
        }

        .grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .grid td {
            width: 33.33%;
            height: 22px;
            border: 1px solid #d1d5db;
            padding: 3px 5px;
            vertical-align: top;
        }

        .field-label {
            display: block;
            margin-bottom: 1px;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #6b7280;
        }

        .field-value {
            display: block;
            min-height: 12px;
        }

        /* keeps an empty value from collapsing its line box */
        .field-value::after {
            content: '\00a0';
        }

        .specs {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .specs th,
        .specs td {
            width: 22%;
            border: 1px solid #d1d5db;
            padding: 3px 5px;
            text-align: center;
            overflow-wrap: break-word;
        }

        .specs thead th {
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            background: #f3f4f6;
        }

        .specs td:first-child,
        .specs th:first-child {
            width: 34%;
            text-align: left;
        }

        .declarations {
            margin-top: 2px;
        }

        .declaration-row {
            display: table;
            width: 100%;
            padding: 2px 0;
            border-bottom: 1px dotted #d1d5db;
        }

        .declaration-row > span {
            display: table-cell;
        }

        .declaration-value {
            text-align: right;
            font-weight: 700;
            white-space: nowrap;
        }

        .sampling-method-row {
            font-weight: 700;
        }

        .sampling-method-row > span {
            vertical-align: middle;
        }

        .sampling-method-option {
            display: inline-block;
            margin-left: 10px;
            vertical-align: middle;
            font-weight: 400;
        }

        .checkbox {
            display: inline-block;
            width: 10px;
            height: 10px;
            margin-left: 3px;
            border: 1px solid #111827;
            text-align: center;
            line-height: 8px;
            vertical-align: middle;
        }

        .checkbox.checked::after {
            content: '\2714';
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            font-weight: 700;
            line-height: 1;
        }

        .seals {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 8px;
        }

        .seals td {
            border: 1px solid #d1d5db;
            padding: 3px 5px;
            vertical-align: middle;
            text-align: left;
        }

        .seal-line {
            display: table;
            width: 100%;
        }

        .seal-line > span {
            display: table-cell;
        }

        .seals .rotated-label {
            width: 36px;
            padding: 3px 2px;
            text-align: center;
        }

        .rotate-wrapper {
            /* DOMPDF has no writing-mode support, so vertical text is faked by
               rotating a fixed-width horizontal block. Rotating in place would
               overflow the table cell (a rotated box isn't reflowed), so the
               text is absolutely positioned inside a fixed-height relative
               wrapper matching the cell, anchored at its own bottom-left
               corner and rotated -90deg — that keeps the rotated box pinned
               inside the wrapper's bounds instead of spilling into the row above.
               The text itself wraps to multiple lines (width below is the
               wrap width, becoming the vertical length after rotation; the
               label's own td width is the wrapped block's thickness).
            */
            position: relative;
            height: 50px;
        }

        .rotated-text {
            position: absolute;
            left: 0;
            top: 100%;
            width: 50px;
            height: 32px;
            transform-origin: left top;
            transform: rotate(-90deg);
            text-align: center;
            font-weight: 700;
            font-size: 7px;
            line-height: 1.25;
            letter-spacing: 0.03em;
        }

        .seals .seal-value {
            text-align: right;
        }

        .seals .counter-value {
            width: 40%;
            text-align: right;
        }

        .signatures {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-top: 18px;
        }

        .signatures td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 6px;
        }

        .signature-line {
            height: 26px;
            margin: 0 10px;
            border-bottom: 1px solid #111827;
        }

        .signature-caption {
            padding-top: 2px;
        }

        .signature-caption strong {
            display: block;
            font-size: 8px;
            font-weight: 700;
        }

        .signature-caption span {
            display: block;
            margin-top: 1px;
            font-size: 6.5px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="ebdn">
        @include('pdf.partials.header')

        <table class="grid">
            <tr>
                <td><span class="field-label">Delivery Date</span><span class="field-value">{{ $bdn?->delivery_date?->format('d M Y') }}</span></td>
                <td><span class="field-label">Delivery Port</span><span class="field-value">{{ $order->port?->name }}</span></td>
                <td><span class="field-label">Delivery Location</span><span class="field-value">{{ $deliveryLocationLabel }}</span></td>
            </tr>
            <tr>
                <td><span class="field-label">Vessel Name</span><span class="field-value">{{ $order->vessel_name }}</span></td>
                <td><span class="field-label">IMO / Flag No</span><span class="field-value">{{ $order->vessel_id }} / {{ $bdn?->vessel_flag }}</span></td>
                <td><span class="field-label">Gross Tonnage</span><span class="field-value">{{ $bdn?->grt }}</span></td>
            </tr>
            <tr>
                <td><span class="field-label">Vessel's P&amp;I Club</span><span class="field-value">{{ $bdn?->pi_club }}</span></td>
                <td><span class="field-label">Vessel Agent</span><span class="field-value">{{ $bdn?->agent?->name }}</span></td>
                <td><span class="field-label">Owner / Operator</span><span class="field-value">{{ $bdn?->owner_operator }}</span></td>
            </tr>
            <tr>
                <td><span class="field-label">Barge Alongside</span><span class="field-value">{{ $bdn?->barge_alongside_at?->format('d M Y H:i') }}</span></td>
                <td><span class="field-label">Last Port of Call</span><span class="field-value">{{ $bdn?->last_port_of_call }}</span></td>
                <td><span class="field-label">Destination Port</span><span class="field-value">{{ $bdn?->destination_port }}</span></td>
            </tr>
            <tr>
                <td><span class="field-label">Delivery Method</span><span class="field-value">{{ $deliveryMethodLabel }}</span></td>
                <td><span class="field-label">Barge Name</span><span class="field-value">{{ $bdn?->barge?->name }}</span></td>
                <td><span class="field-label">Barge IMO No / Flag</span><span class="field-value">{{ $bdn?->barge_id }}</span></td>
            </tr>
        </table>

        @php
            $gradeColumns = [
                \App\Enums\FuelGrade::Vlsfo,
                \App\Enums\FuelGrade::Hsfo,
                \App\Enums\FuelGrade::Mgo,
            ];
            $timesheetRows = [
                ['hose_connected_at', 'Hose Connected'],
                ['pumping_started_at', 'Commenced Pumping'],
                ['pumping_ended_at', 'Completed Pumping'],
                ['hose_disconnected_at', 'Hose Disconnected'],
                ['docs_completed_at', 'Documentation Completed'],
                ['cast_off_at', 'Barge Cast Off'],
            ];
        @endphp

        <table class="specs">
            <thead>
                <tr>
                    <th>Bunker Specifications</th>
                    <th>Low Sulphur Fuel Oil</th>
                    <th>Fuel Oil</th>
                    <th>Marine Gas Oil</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Density @ 15&deg;C</td>
                    @foreach ($gradeColumns as $grade)
                        <td>{{ $bdn?->{"{$grade->value}_density_15"} }}</td>
                    @endforeach
                </tr>
                <tr>
                    <td>Sulphur % (w/w) / Flash Point</td>
                    @foreach ($gradeColumns as $grade)
                        @php
                            $sulphur = $bdn?->{"{$grade->value}_sulphur_pct"};
                            $flash = $bdn?->{"{$grade->value}_flash_point"};
                        @endphp
                        <td>
                            @if ($sulphur !== null && $flash !== null)
                                {{ $sulphur }} / {{ $flash }}
                            @else
                                {{ $sulphur ?? $flash }}
                            @endif
                        </td>
                    @endforeach
                </tr>
                <tr>
                    <td>Viscosity @ 50&deg;C</td>
                    @foreach ($gradeColumns as $grade)
                        <td>{{ $bdn?->{"{$grade->value}_viscosity_50"} }}</td>
                    @endforeach
                </tr>
                <tr>
                    <td>Metric Tons</td>
                    @foreach ($gradeColumns as $grade)
                        <td>{{ $bdn?->{"{$grade->value}_metric_ton"} }}</td>
                    @endforeach
                </tr>
                <tr>
                    <td>Kilo Litres</td>
                    @foreach ($gradeColumns as $grade)
                        <td>{{ $bdn?->{"{$grade->value}_kilo_liter"} }}</td>
                    @endforeach
                </tr>
            </tbody>
        </table>

        <table class="specs">
            <tbody>
                @foreach ($timesheetRows as [$field, $label])
                    <tr>
                        <td>{{ $label }}</td>
                        @foreach ($gradeColumns as $grade)
                            @php $at = $bdn?->{"{$grade->value}_{$field}"}; @endphp
                            <td>{{ $at ? $at->format('d.m.Y \a\t H:i').' hrs' : '' }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>

        @include('pdf.partials.bdn-confidential', ['section' => 'top'])

        <div class="declarations">
            @foreach ([
                ["Ship's Chief Engineer Invited to Witness Sounding / Ullages", $bdn?->chief_engineer_invited],
                ["Ship's Chief Engineer Witnessed Sounding / Ullages", $bdn?->chief_engineer_witnessed],
                ["Retained Samples of this Delivery was handed over to Ship's Chief Engineer", $bdn?->retained_samples_handed_over],
            ] as [$label, $value])
                <div class="declaration-row">
                    <span>{{ $label }}</span>
                    <span class="declaration-value">{{ $value === null ? '—' : ($value ? 'Yes' : 'No') }}</span>
                </div>
            @endforeach
        </div>

        @php
            $samplingMethodOptions = [
                [\App\Enums\SamplingMethod::Manifold, 'Manifold'],
                [\App\Enums\SamplingMethod::ContinuousDrip, 'Continuous Drip'],
                [\App\Enums\SamplingMethod::Running, 'Running or Composite'],
                [\App\Enums\SamplingMethod::Others, 'Other'],
            ];
            $sealTypes = [
                ['marpol', 'Samples Seal number of MARPOL'],
                ['vessel', 'Samples Seal number of Vessel'],
                ['barge', 'Samples Seal number Barge'],
                ['retention', 'Samples Seal number Retention'],
            ];
        @endphp

        <table class="seals">
            <tbody>
                <tr>
                    <td colspan="4" class="sampling-method-row">
                        <span>Samples Method:</span>{{--
                        --}}@foreach ($samplingMethodOptions as [$case, $label])<span class="sampling-method-option">{{ $label }}<span class="checkbox {{ $bdn?->sampling_method === $case ? 'checked' : '' }}"></span></span>@endforeach
                    </td>
                </tr>
                @foreach ($sealTypes as $i => [$prefix, $label])
                    <tr>
                        @if ($i === 0)
                            <td class="rotated-label" rowspan="{{ count($sealTypes) }}">
                                <div class="rotate-wrapper"><div class="rotated-text">Samples were taken, sealed, distributed as follows</div></div>
                            </td>
                        @endif
                        <td>
                            <div class="seal-line">
                                <span>{{ $label }} :</span>
                                <span class="seal-value">{{ $bdn?->{"{$prefix}_seal_number"} }}</span>
                            </div>
                        </td>
                        @if ($i === 0)
                            <td class="rotated-label" rowspan="{{ count($sealTypes) }}">
                                <div class="rotate-wrapper"><div class="rotated-text">Counter Seal No (if any)</div></div>
                            </td>
                        @endif
                        <td class="counter-value">{{ $bdn?->{"{$prefix}_counter_seal_number"} }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        @include('pdf.partials.bdn-confidential', ['section' => 'bottom'])

        <table class="signatures">
            <tr>
                <td><div class="signature-line"></div></td>
                <td><div class="signature-line"></div></td>
                <td><div class="signature-line"></div></td>
            </tr>
            <tr>
                <td class="signature-caption">
                    <strong>Name &amp; Signature</strong>
                    <span>representative (signature &amp; stamp)</span>
                </td>
                <td class="signature-caption">
                    <strong>Master / Chief Officer</strong>
                    <span>Supplier vessel (signature &amp; stamp)</span>
                </td>
                <td class="signature-caption">
                    <strong>Name &amp; Signature of Master of Vessel</strong>
                    <span>or his authorised representative with Vessel's Stamp</span>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
