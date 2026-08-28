import {
    createContext,
    useCallback,
    useContext,
    useId,
    useMemo,
    useState,
} from 'react';
import type { ReactNode } from 'react';

type PieDatum = {
    id?: string;
    label: string;
    value: number;
    color?: string;
    shareValue?: number | null;
};

type PieSliceDatum = PieDatum & {
    index: number;
    startAngle: number;
    endAngle: number;
    path: string;
};

type PieChartContextValue = {
    center: number;
    data: PieDatum[];
    hoveredIndex: number | null;
    id: string;
    innerRadius: number;
    setHoveredIndex: (index: number | null) => void;
    slices: PieSliceDatum[];
    total: number;
};

type PieChartProps = {
    children: ReactNode;
    className?: string;
    data: PieDatum[];
    endAngle?: number;
    hoveredIndex?: number | null;
    innerRadius?: number;
    onHoverChange?: (index: number | null) => void;
    padAngle?: number;
    size?: number;
    startAngle?: number;
};

type PieSliceProps = {
    animate?: boolean;
    color?: string;
    fill?: string;
    hoverEffect?: 'grow' | 'translate';
    hoverOffset?: number;
    index: number;
    showGlow?: boolean;
};

type PieCenterProps = {
    children?: (props: { item: PieDatum | null; total: number }) => ReactNode;
    className?: string;
    defaultLabel?: string;
};

const PieChartContext = createContext<PieChartContextValue | null>(null);

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
    return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
    };
}

function arcPath({
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
}: {
    cx: number;
    cy: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
}) {
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    const outerStart = polarPoint(cx, cy, outerRadius, startAngle);
    const outerEnd = polarPoint(cx, cy, outerRadius, endAngle);
    const innerStart = polarPoint(cx, cy, innerRadius, endAngle);
    const innerEnd = polarPoint(cx, cy, innerRadius, startAngle);

    if (innerRadius <= 0) {
        return [
            `M ${cx} ${cy}`,
            `L ${outerStart.x} ${outerStart.y}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
            'Z',
        ].join(' ');
    }

    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerStart.x} ${innerStart.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
        'Z',
    ].join(' ');
}

function usePieChart() {
    const context = useContext(PieChartContext);

    if (!context) {
        throw new Error('Pie chart components must be used inside PieChart.');
    }

    return context;
}

export function BklitPieChart({
    data,
    size = 280,
    innerRadius = 0,
    padAngle = 0,
    startAngle = -Math.PI / 2,
    endAngle = (3 * Math.PI) / 2,
    hoveredIndex: controlledHoveredIndex,
    onHoverChange,
    className = '',
    children,
}: PieChartProps) {
    const generatedId = useId();
    const [uncontrolledHoveredIndex, setUncontrolledHoveredIndex] = useState<
        number | null
    >(null);
    const hoveredIndex = controlledHoveredIndex ?? uncontrolledHoveredIndex;
    const total = data.reduce((sum, item) => sum + Number(item.value ?? 0), 0);
    const center = size / 2;

    const setHoveredIndex = useCallback(
        (index: number | null) => {
            setUncontrolledHoveredIndex(index);
            onHoverChange?.(index);
        },
        [onHoverChange],
    );

    const slices = useMemo(() => {
        const outerRadius = size / 2 - 18;
        const availableAngle = endAngle - startAngle;

        return data.map((item, index) => {
            const ratio = total > 0 ? Number(item.value ?? 0) / total : 0;
            const previousRatio =
                total > 0
                    ? data
                          .slice(0, index)
                          .reduce(
                              (sum, row) => sum + Number(row.value ?? 0),
                              0,
                          ) / total
                    : 0;
            const sliceAngle = availableAngle * ratio;
            const sliceStartAngle =
                startAngle + availableAngle * previousRatio + padAngle / 2;
            const sliceEndAngle = sliceStartAngle + sliceAngle - padAngle;

            return {
                ...item,
                index,
                startAngle: sliceStartAngle,
                endAngle: Math.max(sliceStartAngle, sliceEndAngle),
                path: arcPath({
                    cx: center,
                    cy: center,
                    innerRadius,
                    outerRadius,
                    startAngle: sliceStartAngle,
                    endAngle: Math.max(sliceStartAngle, sliceEndAngle),
                }),
            };
        });
    }, [
        center,
        data,
        endAngle,
        innerRadius,
        padAngle,
        size,
        startAngle,
        total,
    ]);

    const context = useMemo(
        () => ({
            center,
            data,
            hoveredIndex,
            id: generatedId.replace(/:/g, ''),
            innerRadius,
            setHoveredIndex,
            slices,
            total,
        }),
        [
            center,
            data,
            generatedId,
            hoveredIndex,
            innerRadius,
            setHoveredIndex,
            slices,
            total,
        ],
    );

    return (
        <PieChartContext.Provider value={context}>
            <div
                className={`relative inline-flex items-center justify-center ${className}`.trim()}
                style={{ height: size, width: size }}
            >
                <svg
                    aria-label="Product mix donut chart"
                    className="h-full w-full overflow-visible"
                    role="img"
                    viewBox={`0 0 ${size} ${size}`}
                    style={{
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <defs>
                        <filter
                            id={`${context.id}-slice-glow`}
                            x="-30%"
                            y="-30%"
                            width="160%"
                            height="160%"
                        >
                            <feDropShadow
                                dx="0"
                                dy="10"
                                floodColor="#0f172a"
                                floodOpacity="0.16"
                                stdDeviation="7"
                            />
                        </filter>
                    </defs>
                    {children}
                </svg>
            </div>
        </PieChartContext.Provider>
    );
}

export function PieSlice({
    index,
    color,
    fill,
    animate = true,
    showGlow = true,
    hoverEffect = 'translate',
    hoverOffset = 8,
}: PieSliceProps) {
    const { data, hoveredIndex, id, setHoveredIndex, slices } = usePieChart();
    const slice = slices[index];

    if (!slice) {
        return null;
    }

    const isHovered = hoveredIndex === index;
    const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
    const midAngle = (slice.startAngle + slice.endAngle) / 2;
    const translate =
        isHovered && hoverEffect === 'translate'
            ? `translate(${Math.cos(midAngle) * hoverOffset}px, ${Math.sin(midAngle) * hoverOffset}px)`
            : undefined;

    return (
        <path
            d={slice.path}
            fill={
                fill ??
                color ??
                data[index]?.color ??
                `var(--chart-${(index % 5) + 1})`
            }
            filter={
                isHovered && showGlow ? `url(#${id}-slice-glow)` : undefined
            }
            opacity={isDimmed ? 0.56 : 1}
            role="presentation"
            style={{
                outline: 'none',
                transform:
                    hoverEffect === 'grow' && isHovered
                        ? 'scale(1.025)'
                        : translate,
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transition: animate
                    ? 'opacity 180ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 180ms ease'
                    : undefined,
                WebkitTapHighlightColor: 'transparent',
            }}
            tabIndex={0}
            onBlur={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
        />
    );
}

export function PieCenter({
    defaultLabel = 'Total',
    className = '',
    children,
}: PieCenterProps) {
    const { center, data, hoveredIndex, innerRadius, total } = usePieChart();
    const item = hoveredIndex === null ? null : data[hoveredIndex];

    if (innerRadius <= 0) {
        return null;
    }

    return (
        <foreignObject
            height={innerRadius * 2}
            width={innerRadius * 2}
            x={center - innerRadius}
            y={center - innerRadius}
        >
            <div
                className={`flex h-full w-full items-center justify-center ${className}`.trim()}
            >
                {children ? (
                    children({ item, total })
                ) : (
                    <div className="text-center">
                        <p className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
                            {item?.label ?? defaultLabel}
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-950">
                            {item?.value ?? total}
                        </p>
                    </div>
                )}
            </div>
        </foreignObject>
    );
}
