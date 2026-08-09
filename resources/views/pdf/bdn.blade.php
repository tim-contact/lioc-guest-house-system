<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>eBDN</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Helvetica, Arial, sans-serif;
            font-size: 9px;
            line-height: 1.35;
            color: #111827;
            -webkit-print-color-adjust: exact;
        }

        .serial {
            margin-bottom: 4px;
            font-weight: 700;
        }

        .title {
            margin: 0 0 8px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-align: center;
            text-transform: uppercase;
        }

        .grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .grid td {
            width: 33.33%;
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
            display: flex;
            justify-content: space-between;
            gap: 8px;
            padding: 2px 0;
            border-bottom: 1px dotted #d1d5db;
        }

        .declaration-value {
            font-weight: 700;
            white-space: nowrap;
        }

        .sampling-method {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 6px 0 8px;
            padding: 3px 0;
            border-top: 1px solid #111827;
            font-weight: 700;
        }

        .sampling-method-option {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            font-weight: 400;
        }

        .checkbox {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 10px;
            height: 10px;
            border: 1px solid #111827;
        }

        .checkbox.checked::after {
            content: '\2714';
            font-size: 10px;
            font-weight: 700;
            line-height: 1;
        }

        .seals {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .seals td {
            border: 1px solid #d1d5db;
            padding: 3px 5px;
            vertical-align: middle;
            text-align: left;
        }

        .seals .rotated-label {
            width: 1%;
        }

        .rotated-text {
            /* Explicit height (not auto) makes the vertical text wrap into extra
               columns instead of growing the row height without bound. */
            height: 92px;
            margin: 0 auto;
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            text-align: center;
            font-weight: 700;
            font-size: 7px;
            line-height: 1.1;
            letter-spacing: 0.03em;
        }

        .seals .counter-value {
            width: 40%;
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
        <div class="serial">Serial No: {{ $bdn?->bdn_number }}</div>

        @include('pdf.partials.bdn-confidential', ['section' => 'top'])

        <h1 class="title">Bunker Delivery Note</h1>

        <table class="grid">
            <tr>
                <td><span class="field-label">Delivery Date</span>{{ $bdn?->delivery_date?->format('d M Y') }}</td>
                <td><span class="field-label">Delivery Port</span>{{ $order->port?->name }}</td>
                <td><span class="field-label">Delivery Location</span>{{ $deliveryLocationLabel }}</td>
            </tr>
            <tr>
                <td><span class="field-label">Vessel Name</span>{{ $order->vessel_name }}</td>
                <td><span class="field-label">IMO / Flag No</span>{{ $order->vessel_id }} / {{ $bdn?->vessel_flag }}</td>
                <td><span class="field-label">Gross Tonnage</span>{{ $bdn?->grt }}</td>
            </tr>
            <tr>
                <td><span class="field-label">Vessel's P&amp;I Club</span>{{ $bdn?->pi_club }}</td>
                <td><span class="field-label">Vessel Agent</span>{{ $bdn?->agent?->name }}</td>
                <td><span class="field-label">Owner / Operator</span>{{ $bdn?->owner_operator }}</td>
            </tr>
            <tr>
                <td><span class="field-label">Barge Alongside</span>{{ $bdn?->barge_alongside_at?->format('d M Y H:i') }}</td>
                <td><span class="field-label">Last Port of Call</span>{{ $bdn?->last_port_of_call }}</td>
                <td><span class="field-label">Destination Port</span>{{ $bdn?->destination_port }}</td>
            </tr>
            <tr>
                <td><span class="field-label">Delivery Method</span>{{ $deliveryMethodLabel }}</td>
                <td><span class="field-label">Barge Name</span>{{ $bdn?->barge?->name }}</td>
                <td><span class="field-label">Barge IMO No / Flag</span>{{ $bdn?->barge_id }}</td>
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

        <div class="sampling-method">
            <span>Samples Method:</span>
            @foreach ($samplingMethodOptions as [$case, $label])
                <span class="sampling-method-option">
                    {{ $label }}
                    <span class="checkbox {{ $bdn?->sampling_method === $case ? 'checked' : '' }}"></span>
                </span>
            @endforeach
        </div>

        <table class="seals">
            <tbody>
                @foreach ($sealTypes as $i => [$prefix, $label])
                    <tr>
                        @if ($i === 0)
                            <td class="rotated-label" rowspan="{{ count($sealTypes) }}">
                                <div class="rotated-text">Samples were taken, sealed, distributed as follows</div>
                            </td>
                        @endif
                        <td>{{ $label }} : {{ $bdn?->{"{$prefix}_seal_number"} }}</td>
                        @if ($i === 0)
                            <td class="rotated-label" rowspan="{{ count($sealTypes) }}">
                                <div class="rotated-text">Counter Seal No (if any)</div>
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
