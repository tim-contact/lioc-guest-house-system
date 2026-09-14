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

        .seals th,
        .seals td {
            border: 1px solid #d1d5db;
            padding: 3px 5px;
            vertical-align: middle;
            text-align: left;
        }

        .seals th {
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            background: #f3f4f6;
        }

        .seals th:first-child,
        .seals td:first-child {
            width: 25%;
        }

        .seals th:not(:first-child),
        .seals td:not(:first-child) {
            width: 25%;
            text-align: center;
        }

        .sample-heading {
            text-align: left;
        }

        .product-seal-heading {
            display: block;
            font-size: 8px;
            color: #111827;
        }

        .product-seal-subheading {
            display: block;
            margin-top: 1px;
            font-size: 6px;
            font-weight: 400;
            letter-spacing: 0;
            text-transform: none;
            color: #6b7280;
        }

        .seal-type-label {
            font-weight: 700;
        }

        .seal-entry {
            line-height: 1.25;
            white-space: nowrap;
        }

        .seal-entry strong {
            font-weight: 700;
        }

        .seal-entry .counter-label {
            margin-left: 8px;
            font-size: 6px;
            color: #6b7280;
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

        @php
            $effectiveDeliveryMethod = $bdn?->delivery_method ?? $order->delivery_mode;
            $effectiveDeliveryMethodLabel = $deliveryMethodLabel
                ?? ($effectiveDeliveryMethod !== null ? \Illuminate\Support\Str::headline($effectiveDeliveryMethod->name) : null);
            $isBargeDelivery = $effectiveDeliveryMethod === null || $effectiveDeliveryMethod === \App\Enums\DeliveryMode::Barge;
            $isTruckDelivery = $effectiveDeliveryMethod === \App\Enums\DeliveryMode::Truck;
            $carrierLabel = match ($effectiveDeliveryMethod) {
                \App\Enums\DeliveryMode::Truck => 'Truck Number / Reference',
                \App\Enums\DeliveryMode::Pipeline => 'Pipeline Reference',
                default => 'Barge Name',
            };
            $carrierValue = match ($effectiveDeliveryMethod) {
                \App\Enums\DeliveryMode::Truck => $bdn?->truck_number,
                \App\Enums\DeliveryMode::Pipeline => 'Pipeline',
                default => $bdn?->barge?->name,
            };
            $sampleCarrierLabel = match ($effectiveDeliveryMethod) {
                \App\Enums\DeliveryMode::Truck => 'Samples Seal number Truck',
                \App\Enums\DeliveryMode::Pipeline => 'Samples Seal number Pipeline',
                default => 'Samples Seal number Barge',
            };
        @endphp

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
                <td><span class="field-label">Delivery Method</span><span class="field-value">{{ $effectiveDeliveryMethodLabel }}</span></td>
                <td><span class="field-label">{{ $carrierLabel }}</span><span class="field-value">{{ $carrierValue }}</span></td>
                @if ($isBargeDelivery)
                    <td><span class="field-label">Barge IMO No / Flag</span><span class="field-value">{{ $bdn?->barge_id }}</span></td>
                @elseif ($isTruckDelivery)
                    <td><span class="field-label">Transport Type</span><span class="field-value">Truck</span></td>
                @else
                    <td><span class="field-label">Transport Type</span><span class="field-value">Pipeline</span></td>
                @endif
            </tr>
        </table>

        @php
            $gradeColumns = [
                \App\Enums\FuelGrade::Vlsfo,
                \App\Enums\FuelGrade::Hsfo,
                \App\Enums\FuelGrade::Mgo,
            ];
            $orderedGradeValues = collect($gradeColumns)
                ->filter(fn (\App\Enums\FuelGrade $grade): bool => (float) ($order->{"{$grade->value}_final_qty"} ?? 0) > 0)
                ->map(fn (\App\Enums\FuelGrade $grade): string => $grade->value)
                ->all();
            $hasOrderedGradeScope = count($orderedGradeValues) > 0;
            $shouldShowGrade = fn (\App\Enums\FuelGrade $grade): bool => ! $hasOrderedGradeScope
                || in_array($grade->value, $orderedGradeValues, true);
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
                        <td>{{ $shouldShowGrade($grade) ? $bdn?->{"{$grade->value}_density_15"} : '' }}</td>
                    @endforeach
                </tr>
                <tr>
                    <td>Sulphur % (w/w) / Flash Point</td>
                    @foreach ($gradeColumns as $grade)
                        @php
                            $sulphur = $shouldShowGrade($grade) ? $bdn?->{"{$grade->value}_sulphur_pct"} : null;
                            $flash = $shouldShowGrade($grade) ? $bdn?->{"{$grade->value}_flash_point"} : null;
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
                        <td>{{ $shouldShowGrade($grade) ? $bdn?->{"{$grade->value}_viscosity_50"} : '' }}</td>
                    @endforeach
                </tr>
                <tr>
                    <td>Metric Tons</td>
                    @foreach ($gradeColumns as $grade)
                        <td>{{ $shouldShowGrade($grade) ? $bdn?->{"{$grade->value}_metric_ton"} : '' }}</td>
                    @endforeach
                </tr>
                <tr>
                    <td>Kilo Litres</td>
                    @foreach ($gradeColumns as $grade)
                        <td>{{ $shouldShowGrade($grade) ? $bdn?->{"{$grade->value}_kilo_liter"} : '' }}</td>
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
                            @php $at = $shouldShowGrade($grade) ? $bdn?->{"{$grade->value}_{$field}"} : null; @endphp
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
                ['barge', $sampleCarrierLabel],
                ['retention', 'Samples Seal number Retention'],
            ];
            $productNames = [
                'vlsfo' => ['VLSFO', 'Low Sulphur fuel oil'],
                'hsfo' => ['HSFO', 'Fuel oil'],
                'mgo' => ['MGO', 'Marine gas oil'],
            ];
        @endphp

        <table class="seals">
            <thead>
                <tr>
                    <th class="sample-heading">Sample Seal Numbers</th>
                    @foreach ($gradeColumns as $grade)
                        <th>
                            <span class="product-seal-heading">{{ $productNames[$grade->value][0] }}</span>
                            <span class="product-seal-subheading">{{ $productNames[$grade->value][1] }}</span>
                        </th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="{{ count($gradeColumns) + 1 }}" class="sampling-method-row">
                        <span>Samples Method:</span>{{--
                        --}}@foreach ($samplingMethodOptions as [$case, $label])<span class="sampling-method-option">{{ $label }}<span class="checkbox {{ $bdn?->sampling_method === $case ? 'checked' : '' }}"></span></span>@endforeach
                    </td>
                </tr>
                @foreach ($sealTypes as [$prefix, $label])
                    <tr>
                        <td class="seal-type-label">{{ $label }}</td>
                        @foreach ($gradeColumns as $grade)
                            @php
                                $productSeal = $shouldShowGrade($grade)
                                    ? data_get($bdn?->product_sample_seals, "{$grade->value}.{$prefix}", [])
                                    : [];
                                $sealNumber = $shouldShowGrade($grade)
                                    ? ($productSeal['seal_number'] ?? $bdn?->{"{$prefix}_seal_number"})
                                    : null;
                                $counterSealNumber = $shouldShowGrade($grade)
                                    ? ($productSeal['counter_seal_number'] ?? $bdn?->{"{$prefix}_counter_seal_number"})
                                    : null;
                            @endphp
                            <td>
                                <div class="seal-entry">
                                    @if ($shouldShowGrade($grade))
                                        <strong>Seal</strong> {{ $sealNumber ?: '-' }}
                                        <span class="counter-label">Counter</span> {{ $counterSealNumber ?: '-' }}
                                    @endif
                                </div>
                            </td>
                        @endforeach
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
                    <span>LIOC representative (signature &amp; stamp)</span>
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
