import { motion } from 'motion/react';
import {
    createContext,
    useCallback,
    useContext,
    useId,
    useMemo,
    useState,
} from 'react';
import type { ReactNode } from 'react';

type RingData = {
    label: string;
    value: number;
    maxValue: number;
    color?: string;
};

type RingChartContextValue = {
    center: number;
    data: RingData[];
    hoveredIndex: number | null;
    id: string;
    radiusForIndex: (index: number) => number;
    setHoveredIndex: (index: number | null) => void;
    size: number;
    strokeWidth: number;
    total: number;
};

type RingChartProps = {
    baseInnerRadius?: number;
    children: ReactNode;
    className?: string;
    data: RingData[];
    hoveredIndex?: number | null;
    onHoverChange?: (index: number | null) => void;
    ringGap?: number;
    size?: number;
    strokeWidth?: number;
};

type RingProps = {
    animate?: boolean;
    color?: string;
    index: number;
    lineCap?: 'round' | 'butt';
    showGlow?: boolean;
};

type RingCenterProps = {
    children?: (props: { item: RingData | null; total: number }) => ReactNode;
    className?: string;
    defaultLabel?: string;
    formatValue?: (value: number) => string;
};

const RingChartContext = createContext<RingChartContextValue | null>(null);

function useRingChart() {
    const context = useContext(RingChartContext);

    if (!context) {
        throw new Error('Ring chart components must be used inside RingChart.');
    }

    return context;
}

export function RingChart({
    data,
    size = 300,
    strokeWidth = 12,
    ringGap = 6,
    baseInnerRadius = 60,
    hoveredIndex: controlledHoveredIndex,
    onHoverChange,
    className = '',
    children,
}: RingChartProps) {
    const generatedId = useId();
    const [uncontrolledHoveredIndex, setUncontrolledHoveredIndex] = useState<
        number | null
    >(null);
    const hoveredIndex = controlledHoveredIndex ?? uncontrolledHoveredIndex;
    const center = size / 2;
    const total = data.reduce((sum, item) => sum + Number(item.value ?? 0), 0);

    const setHoveredIndex = useCallback(
        (index: number | null) => {
            setUncontrolledHoveredIndex(index);
            onHoverChange?.(index);
        },
        [onHoverChange],
    );

    const radiusForIndex = useCallback(
        (index: number) =>
            baseInnerRadius +
            (data.length - 1 - index) * (strokeWidth + ringGap),
        [baseInnerRadius, data.length, ringGap, strokeWidth],
    );

    const context = useMemo(
        () => ({
            center,
            data,
            hoveredIndex,
            id: generatedId.replace(/:/g, ''),
            radiusForIndex,
            setHoveredIndex,
            size,
            strokeWidth,
            total,
        }),
        [
            center,
            data,
            generatedId,
            hoveredIndex,
            radiusForIndex,
            setHoveredIndex,
            size,
            strokeWidth,
            total,
        ],
    );

    return (
        <RingChartContext.Provider value={context}>
            <div
                className={`relative inline-flex items-center justify-center ${className}`.trim()}
                style={{ height: size, width: size }}
            >
                <svg
                    aria-label="Ring chart"
                    className="h-full w-full overflow-visible"
                    role="img"
                    viewBox={`0 0 ${size} ${size}`}
                >
                    <defs>
                        <filter
                            id={`${context.id}-ring-glow`}
                            x="-30%"
                            y="-30%"
                            width="160%"
                            height="160%"
                        >
                            <feDropShadow
                                dx="0"
                                dy="9"
                                floodColor="#0f172a"
                                floodOpacity="0.2"
                                stdDeviation="6"
                            />
                        </filter>
                    </defs>
                    {children}
                </svg>
            </div>
        </RingChartContext.Provider>
    );
}

export function Ring({
    index,
    color,
    animate = true,
    showGlow = true,
    lineCap = 'round',
}: RingProps) {
    const {
        center,
        data,
        hoveredIndex,
        id,
        radiusForIndex,
        setHoveredIndex,
        strokeWidth,
    } = useRingChart();
    const item = data[index];

    if (!item) {
        return null;
    }

    const radius = radiusForIndex(index);
    const circumference = 2 * Math.PI * radius;
    const progress =
        item.maxValue > 0 ? Math.min(item.value / item.maxValue, 1) : 0;
    const isHovered = hoveredIndex === index;
    const resolvedColor =
        color ?? item.color ?? `var(--chart-${(index % 5) + 1})`;

    return (
        <motion.g
            aria-label={`${item.label}: ${item.value}`}
            className="cursor-pointer outline-none"
            initial={animate ? { scale: 0.96, opacity: 0 } : false}
            animate={{
                scale: isHovered ? 1.035 : 1,
                opacity: 1,
            }}
            onBlur={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            role="listitem"
            style={{
                transformBox: 'view-box',
                transformOrigin: `${center}px ${center}px`,
            }}
            tabIndex={0}
            transition={{ duration: 0.18, ease: 'easeOut' }}
        >
            <circle
                cx={center}
                cy={center}
                fill="none"
                r={radius}
                stroke="var(--border)"
                strokeOpacity={0.7}
                strokeWidth={strokeWidth}
            />
            <motion.circle
                animate={{
                    strokeDashoffset: circumference * (1 - progress),
                }}
                cx={center}
                cy={center}
                fill="none"
                filter={showGlow && isHovered ? `url(#${id}-ring-glow)` : ''}
                initial={
                    animate
                        ? { strokeDashoffset: circumference }
                        : { strokeDashoffset: circumference * (1 - progress) }
                }
                r={radius}
                stroke={resolvedColor}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeLinecap={lineCap}
                strokeWidth={strokeWidth}
                style={{ rotate: -90, transformOrigin: 'center' }}
                transition={{ delay: index * 0.08, duration: 0.7 }}
            />
            <circle
                cx={center}
                cy={center}
                fill="none"
                pointerEvents="stroke"
                r={radius}
                stroke="transparent"
                strokeWidth={strokeWidth + 10}
            />
        </motion.g>
    );
}

export function RingCenter({
    children,
    className = '',
    defaultLabel = 'Total',
    formatValue = (value) => value.toLocaleString(),
}: RingCenterProps) {
    const { center, data, hoveredIndex, total } = useRingChart();
    const item = hoveredIndex === null ? null : (data[hoveredIndex] ?? null);

    return (
        <foreignObject
            height={center}
            pointerEvents="none"
            width={center}
            x={center / 2}
            y={center / 2}
        >
            <div
                className={`pointer-events-none flex h-full w-full flex-col items-center justify-center text-center ${className}`.trim()}
            >
                {children ? (
                    children({ item, total })
                ) : (
                    <>
                        <span className="text-2xl font-semibold tabular-nums">
                            {formatValue(item?.value ?? total)}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                            {item?.label ?? defaultLabel}
                        </span>
                    </>
                )}
            </div>
        </foreignObject>
    );
}
