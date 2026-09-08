import { curveCatmullRom } from '@visx/curve';
import { line } from '@visx/shape';
import { useId, useMemo, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

type ProductComparisonPoint = {
    label: string;
    currentYear: number | null;
    lastYear: number | null;
};

type ProductComparisonLineChartProps = {
    currentColor: string;
    data: ProductComparisonPoint[];
    max: number;
    productLabel: string;
};

type SeriesKey = 'currentYear' | 'lastYear';

type SeriesConfig = {
    color: string;
    key: SeriesKey;
    label: string;
};

type ChartPoint = {
    label: string;
    value: number | null;
    x: number;
    y: number | null;
};

type VisibleSeries = Record<SeriesKey, boolean>;

const compactNumber = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const chartWidth = 1420;
const mainHeight = 420;
const brushHeight = 72;
const chartInsetX = 4;
const plotAreaWidth = chartWidth - chartInsetX * 2;
const mainPadding = {
    top: 24,
    right: 0,
    bottom: 48,
    left: 0,
};
const brushPadding = {
    top: 4,
    right: 0,
    bottom: 4,
    left: 0,
};

export function ProductComparisonLineChart({
    currentColor,
    data,
    max,
    productLabel,
}: ProductComparisonLineChartProps) {
    const generatedId = useId().replace(/:/g, '');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [highlightedSeries, setHighlightedSeries] =
        useState<SeriesKey | null>(null);
    const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
        currentYear: true,
        lastYear: true,
    });
    const series = useMemo<SeriesConfig[]>(
        () => [
            {
                color: currentColor,
                key: 'currentYear',
                label: 'Current Year',
            },
            {
                color: '#94A3B8',
                key: 'lastYear',
                label: 'Last Year',
            },
        ],
        [currentColor],
    );
    const currentPoints = pointsFor(
        data,
        max,
        mainHeight,
        mainPadding,
        'currentYear',
    );
    const lastYearPoints = pointsFor(
        data,
        max,
        mainHeight,
        mainPadding,
        'lastYear',
    );
    const brushCurrentPoints = pointsFor(
        data,
        max,
        brushHeight,
        brushPadding,
        'currentYear',
    );
    const brushLastYearPoints = pointsFor(
        data,
        max,
        brushHeight,
        brushPadding,
        'lastYear',
    );
    const selectedSummary =
        selectedIndex === null
            ? `${productLabel} sales comparison chart. Use left and right arrow keys to inspect months.`
            : `${formatLongDate(selectedIndex)}. ${series
                  .filter((item) => visibleSeries[item.key])
                  .map((item) => {
                      const value = data[selectedIndex]?.[item.key];

                      return `${item.label}: ${formatValue(value)}`;
                  })
                  .join(', ')}.`;

    const toggleSeries = (key: SeriesKey) => {
        setVisibleSeries((current) => {
            const visibleCount = Object.values(current).filter(Boolean).length;

            if (current[key] && visibleCount <= 1) {
                return current;
            }

            return {
                ...current,
                [key]: !current[key],
            };
        });
    };

    return (
        <div className="flex w-full flex-col gap-2" style={{ height: 540 }}>
            <div className="flex justify-end px-2">
                <div className="flex w-full flex-row flex-wrap gap-x-4 gap-y-2">
                    {series.map((item) => (
                        <ChartLegendItem
                            active={visibleSeries[item.key]}
                            color={item.color}
                            highlighted={highlightedSeries === item.key}
                            key={item.key}
                            label={item.label}
                            onBlur={() => setHighlightedSeries(null)}
                            onClick={() => toggleSeries(item.key)}
                            onFocus={() => setHighlightedSeries(item.key)}
                            onPointerEnter={() =>
                                setHighlightedSeries(item.key)
                            }
                            onPointerLeave={() => setHighlightedSeries(null)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex size-full min-h-0 min-w-0 flex-col gap-3">
                <div className="min-h-0 min-w-0 flex-1">
                    <div className="relative size-full">
                        <LineChartSvg
                            ariaLabel={`CY vs LY ${productLabel} sales line chart`}
                            chartId={`${generatedId}-main`}
                            currentColor={currentColor}
                            currentPoints={currentPoints}
                            data={data}
                            height={mainHeight}
                            highlightedSeries={highlightedSeries}
                            lastYearPoints={lastYearPoints}
                            max={max}
                            productLabel={productLabel}
                            selectedIndex={selectedIndex}
                            series={series}
                            setSelectedIndex={setSelectedIndex}
                            showAxes
                            visibleSeries={visibleSeries}
                        />
                        <p className="sr-only" aria-live="polite">
                            {selectedSummary}
                        </p>
                    </div>
                </div>

                <div
                    className="min-h-0 shrink-0"
                    style={{ height: brushHeight }}
                >
                    <div className="relative size-full">
                        <LineChartSvg
                            ariaLabel={`CY vs LY ${productLabel} sales brush preview`}
                            chartId={`${generatedId}-brush`}
                            currentColor={currentColor}
                            currentPoints={brushCurrentPoints}
                            data={data}
                            height={brushHeight}
                            highlightedSeries={highlightedSeries}
                            lastYearPoints={brushLastYearPoints}
                            max={max}
                            productLabel={productLabel}
                            series={series}
                            showBrush
                            visibleSeries={visibleSeries}
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-[2]"
                        >
                            <span
                                className="absolute shrink-0 rounded-lg bg-[#3155E7]"
                                style={{
                                    top: 24,
                                    left: 6,
                                    width: 4,
                                    height: 24,
                                }}
                            />
                            <span
                                className="absolute shrink-0 rounded-lg bg-[#3155E7]"
                                style={{
                                    top: 24,
                                    right: 6,
                                    width: 4,
                                    height: 24,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChartLegendItem({
    active,
    color,
    highlighted,
    label,
    onBlur,
    onClick,
    onFocus,
    onPointerEnter,
    onPointerLeave,
}: {
    active: boolean;
    color: string;
    highlighted: boolean;
    label: string;
    onBlur: () => void;
    onClick: () => void;
    onFocus: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={`w-auto shrink-0 cursor-pointer rounded-lg px-2 py-1.5 text-left transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#3155E7]/35 focus-visible:outline-none ${
                active
                    ? highlighted
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    : 'opacity-45 hover:opacity-70'
            }`}
            onBlur={onBlur}
            onClick={onClick}
            onFocus={onFocus}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
        >
            <span className="flex items-center gap-3">
                <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-xs font-medium text-slate-600 tabular-nums">
                    {label}
                </span>
            </span>
        </button>
    );
}

function LineChartSvg({
    ariaLabel,
    chartId,
    currentColor,
    currentPoints,
    data,
    height,
    highlightedSeries,
    lastYearPoints,
    max,
    productLabel,
    selectedIndex = null,
    series,
    setSelectedIndex,
    showAxes = false,
    showBrush = false,
    visibleSeries,
}: {
    ariaLabel: string;
    chartId: string;
    currentColor: string;
    currentPoints: ChartPoint[];
    data: ProductComparisonPoint[];
    height: number;
    highlightedSeries: SeriesKey | null;
    lastYearPoints: ChartPoint[];
    max: number;
    productLabel: string;
    selectedIndex?: number | null;
    series: SeriesConfig[];
    setSelectedIndex?: (index: number | null) => void;
    showAxes?: boolean;
    showBrush?: boolean;
    visibleSeries: VisibleSeries;
}) {
    const clipId = `${chartId}-clip`;
    const dotPatternId = `${chartId}-dots`;
    const currentGradientId = `${chartId}-current-gradient`;
    const lastYearGradientId = `${chartId}-last-gradient`;
    const fadeMaskId = `${chartId}-fade`;
    const plotHeight = height - (showBrush ? 8 : 48);
    const plotWidth = plotAreaWidth;
    const activePoint =
        selectedIndex === null ? null : currentPoints[selectedIndex];
    const activeRows =
        selectedIndex === null
            ? []
            : series
                  .filter((item) => visibleSeries[item.key])
                  .map((item) => ({
                      ...item,
                      point:
                          item.key === 'currentYear'
                              ? currentPoints[selectedIndex]
                              : lastYearPoints[selectedIndex],
                      value: data[selectedIndex]?.[item.key] ?? null,
                  }));
    const activeMarkerY = activeRows
        .map((row) => row.point?.y)
        .filter(isFiniteNumber)
        .reduce<number | null>(
            (highestPoint, y) =>
                highestPoint === null ? y : Math.min(highestPoint, y),
            null,
        );
    const tooltip = activePoint
        ? tooltipPosition(
              activePoint.x,
              activeMarkerY ?? plotHeight / 2,
              activeRows.length,
              plotWidth,
              plotHeight,
          )
        : null;

    const selectNearestPoint = (event: PointerEvent<SVGRectElement>) => {
        if (!setSelectedIndex || data.length === 0) {
            return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        const pointerX =
            ((event.clientX - bounds.left) / bounds.width) * plotWidth;
        const step = plotWidth / Math.max(data.length - 1, 1);
        const index = clamp(Math.round(pointerX / step), 0, data.length - 1);

        setSelectedIndex(index);
    };

    const handleKeyDown = (event: KeyboardEvent<SVGRectElement>) => {
        if (!setSelectedIndex || data.length === 0) {
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            setSelectedIndex(
                selectedIndex === null
                    ? 0
                    : Math.min(selectedIndex + 1, data.length - 1),
            );
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setSelectedIndex(
                selectedIndex === null ? 0 : Math.max(selectedIndex - 1, 0),
            );
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setSelectedIndex(null);
        }
    };

    return (
        <svg
            aria-label={ariaLabel}
            className="h-full w-full"
            role="img"
            viewBox={`0 0 ${chartWidth} ${height}`}
        >
            <defs>
                <clipPath id={clipId}>
                    <rect height={plotHeight + 20} width={plotWidth} />
                </clipPath>
                <linearGradient id={`${fadeMaskId}-gradient`} x1="0%" x2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="10%" stopColor="white" stopOpacity="1" />
                    <stop offset="90%" stopColor="white" stopOpacity="1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <mask id={fadeMaskId}>
                    <rect
                        fill={`url(#${fadeMaskId}-gradient)`}
                        height={height}
                        width={chartWidth}
                    />
                </mask>
                <pattern
                    id={dotPatternId}
                    height="10"
                    patternUnits="userSpaceOnUse"
                    width="10"
                >
                    <circle cx="5" cy="5" fill="#CBD5E1" r="1.5" />
                </pattern>
                <LineGradient id={currentGradientId} color={currentColor} />
                <LineGradient id={lastYearGradientId} color="#94A3B8" />
            </defs>

            <rect fill="transparent" height={height} width={chartWidth} />
            <g transform={`translate(${chartInsetX},${showBrush ? 4 : 8})`}>
                <rect
                    fill={`url(#${dotPatternId})`}
                    height={plotHeight}
                    mask={`url(#${fadeMaskId})`}
                    opacity={showBrush ? 0.35 : 0.85}
                    width={plotWidth}
                />
                {showAxes &&
                    Array.from({ length: 5 }).map((_, index) => {
                        const y = (plotHeight / 4) * index;

                        return (
                            <line
                                key={`chart-grid-${index}`}
                                stroke="#E2E8F0"
                                strokeDasharray="5 7"
                                strokeWidth="1"
                                x1="0"
                                x2={plotWidth}
                                y1={y}
                                y2={y}
                            />
                        );
                    })}
                <g clipPath={`url(#${clipId})`}>
                    {visibleSeries.lastYear && (
                        <path
                            d={smoothLinePath(lastYearPoints)}
                            fill="none"
                            opacity={seriesOpacity(
                                'lastYear',
                                highlightedSeries,
                            )}
                            stroke={`url(#${lastYearGradientId})`}
                            strokeLinecap="round"
                            strokeWidth={showBrush ? 2 : 3}
                        />
                    )}
                    {visibleSeries.currentYear && (
                        <path
                            d={smoothLinePath(currentPoints)}
                            fill="none"
                            opacity={seriesOpacity(
                                'currentYear',
                                highlightedSeries,
                            )}
                            stroke={`url(#${currentGradientId})`}
                            strokeLinecap="round"
                            strokeWidth={showBrush ? 2 : 3.5}
                        />
                    )}
                </g>
                {showAxes &&
                    data.map((month, index) => (
                        <text
                            key={`cy-ly-label-${month.label}`}
                            fill="#64748B"
                            fontSize="12"
                            fontWeight="700"
                            textAnchor="middle"
                            x={currentPoints[index]?.x ?? 0}
                            y={height - 18}
                        >
                            {month.label}
                        </text>
                    ))}
                {showAxes && (
                    <>
                        <text
                            fill="#94A3B8"
                            fontSize="11"
                            fontWeight="700"
                            textAnchor="start"
                            x="0"
                            y="4"
                        >
                            {compactNumber.format(max)}
                        </text>
                        <text
                            fill="#94A3B8"
                            fontSize="11"
                            fontWeight="700"
                            textAnchor="start"
                            x="0"
                            y={plotHeight + 4}
                        >
                            0
                        </text>
                    </>
                )}
                {showAxes && activePoint && tooltip && (
                    <g className="transition-transform duration-150 ease-out">
                        <line
                            stroke="#64748B"
                            strokeOpacity="0.5"
                            strokeWidth="1"
                            x1={activePoint.x}
                            x2={activePoint.x}
                            y1="0"
                            y2={plotHeight}
                        />
                        {activeRows.map((row) =>
                            !row.point || row.point.y === null ? null : (
                                <circle
                                    key={`marker-${row.key}`}
                                    cx={activePoint.x}
                                    cy={row.point.y}
                                    fill={row.color}
                                    r="4.5"
                                    stroke="#F8FAFC"
                                    strokeWidth="2"
                                />
                            ),
                        )}
                        <foreignObject
                            className="overflow-visible transition-[x,y] duration-150 ease-out"
                            height={tooltip.height}
                            width={tooltip.width}
                            x={tooltip.x}
                            y={tooltip.y}
                        >
                            <div className="rounded-lg border border-slate-200/80 bg-white/95 px-3 py-2 text-xs backdrop-blur-sm">
                                <p className="mb-1.5 font-bold text-[#172033]">
                                    {formatLongDate(selectedIndex ?? 0)}
                                </p>
                                <div className="grid gap-1.5">
                                    {activeRows.map((row) => (
                                        <div
                                            key={`tooltip-${row.key}`}
                                            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
                                        >
                                            <span
                                                className="size-2 rounded-full"
                                                style={{
                                                    backgroundColor: row.color,
                                                }}
                                            />
                                            <span className="truncate text-slate-500">
                                                {row.label}
                                            </span>
                                            <span className="text-right font-semibold text-[#172033] tabular-nums">
                                                {formatValue(row.value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </foreignObject>
                        <g
                            className="transition-transform duration-150 ease-out"
                            transform={`translate(${clamp(activePoint.x - 24, 0, plotWidth - 48)}, ${height - 37})`}
                        >
                            <rect
                                fill="#020617"
                                height="24"
                                rx="12"
                                width="48"
                            />
                            <text
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="11"
                                fontWeight="700"
                                textAnchor="middle"
                                x="24"
                                y="12"
                            >
                                {formatShortDate(selectedIndex ?? 0)}
                            </text>
                        </g>
                    </g>
                )}
                {showAxes && (
                    <rect
                        aria-label="Interactive plot area. Use arrow keys to inspect monthly values."
                        className="cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-[#3155E7]/35"
                        fill="transparent"
                        height={plotHeight}
                        onKeyDown={handleKeyDown}
                        onPointerCancel={() => setSelectedIndex?.(null)}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(
                                event.pointerId,
                            );
                            selectNearestPoint(event);
                        }}
                        onPointerLeave={() => setSelectedIndex?.(null)}
                        onPointerMove={selectNearestPoint}
                        role="application"
                        tabIndex={0}
                        width={plotWidth}
                        x="0"
                        y="0"
                    />
                )}
            </g>
        </svg>
    );
}

function LineGradient({ color, id }: { color: string; id: string }) {
    return (
        <linearGradient
            gradientUnits="userSpaceOnUse"
            id={id}
            x1="0"
            x2={plotAreaWidth}
            y1="0"
            y2="0"
        >
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="15%" stopColor={color} stopOpacity="1" />
            <stop offset="85%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
    );
}

function pointsFor(
    data: ProductComparisonPoint[],
    max: number,
    height: number,
    padding: typeof mainPadding,
    key: SeriesKey,
): ChartPoint[] {
    const plotWidth = plotAreaWidth - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    return data.map((month, index) => {
        const value = month[key];

        return {
            label: month.label,
            value,
            x:
                padding.left +
                (plotWidth / Math.max(data.length - 1, 1)) * index,
            y: isFiniteNumber(value)
                ? padding.top + plotHeight - (value / max) * plotHeight
                : null,
        };
    });
}

function smoothLinePath(points: ChartPoint[]): string {
    return (
        line<ChartPoint>({
            curve: curveCatmullRom,
            defined: (point) => point.y !== null,
            x: (point) => point.x,
            y: (point) => point.y ?? 0,
        })(points) ?? ''
    );
}

function tooltipPosition(
    x: number,
    markerY: number,
    rowCount: number,
    plotWidth: number,
    plotHeight: number,
) {
    const width = 172;
    const height = 48 + rowCount * 24;
    const offset = 14;
    const hasRightSpace = x + offset + width <= plotWidth;
    const maxY = Math.max(plotHeight - height - 8, 8);

    return {
        height,
        width,
        x: clamp(
            hasRightSpace ? x + offset : x - width - offset,
            0,
            plotWidth - width,
        ),
        y: clamp(markerY - height - 12, 8, maxY),
    };
}

function seriesOpacity(key: SeriesKey, highlightedSeries: SeriesKey | null) {
    if (highlightedSeries === null) {
        return 1;
    }

    return highlightedSeries === key ? 1 : 0.24;
}

function formatValue(value: number | null | undefined): string {
    return isFiniteNumber(value) ? compactNumber.format(value) : '-';
}

function formatLongDate(index: number): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
    }).format(dateForIndex(index));
}

function formatShortDate(index: number): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
    }).format(dateForIndex(index));
}

function dateForIndex(index: number): Date {
    return new Date(new Date().getFullYear(), index, 1);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}
