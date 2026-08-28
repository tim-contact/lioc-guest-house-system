import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import type { DateRange } from 'react-day-picker';
import { extendTailwindMerge } from 'tailwind-merge';
import type { EnumOption } from '@/types';

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            colors: [
                'input',
                'ring',
                'background',
                'foreground',
                'border',
                'destructive',
                'primary',
                'secondary',
                'muted',
                'accent',
                'popover',
                'card',
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const PORT_COLOR_CLASSES = [
    {
        card: 'bg-sky-100',
        accent: 'from-sky-300/70 to-sky-100/20',
        color: '#0284c7',
        icon: 'bg-white/70 text-sky-950',
        foreground: 'text-sky-950',
        mutedForeground: 'text-sky-950/72',
        subtleForeground: 'text-sky-950/58',
        surfaceIcon: 'bg-white/75 text-sky-950 ring-sky-200/70',
        surfaceDivider: 'bg-sky-900/12',
        surfaceDot: 'bg-sky-950/45',
        patternColor: 'rgba(12, 74, 110, 0.12)',
    },
    {
        card: 'bg-emerald-100',
        accent: 'from-emerald-300/70 to-emerald-100/20',
        color: '#059669',
        icon: 'bg-white/70 text-[#052e24]',
        foreground: 'text-[#052e24]',
        mutedForeground: 'text-[#052e24]/72',
        subtleForeground: 'text-[#052e24]/58',
        surfaceIcon: 'bg-white/75 text-[#052e24] ring-emerald-200/70',
        surfaceDivider: 'bg-[#052e24]/12',
        surfaceDot: 'bg-[#052e24]/45',
        patternColor: 'rgba(5, 46, 36, 0.11)',
    },
    {
        card: 'bg-amber-100',
        accent: 'from-amber-300/75 to-amber-100/20',
        color: '#f59e0b',
        icon: 'bg-white/70 text-[#3b2400]',
        foreground: 'text-[#3b2400]',
        mutedForeground: 'text-[#3b2400]/72',
        subtleForeground: 'text-[#3b2400]/58',
        surfaceIcon: 'bg-white/75 text-[#3b2400] ring-amber-200/75',
        surfaceDivider: 'bg-[#3b2400]/12',
        surfaceDot: 'bg-[#3b2400]/45',
        patternColor: 'rgba(59, 36, 0, 0.1)',
    },
    {
        card: 'bg-rose-100',
        accent: 'from-rose-300/70 to-rose-100/20',
        color: '#e11d48',
        icon: 'bg-white/70 text-rose-950',
        foreground: 'text-rose-950',
        mutedForeground: 'text-rose-950/72',
        subtleForeground: 'text-rose-950/58',
        surfaceIcon: 'bg-white/75 text-rose-950 ring-rose-200/70',
        surfaceDivider: 'bg-rose-950/12',
        surfaceDot: 'bg-rose-950/45',
        patternColor: 'rgba(136, 19, 55, 0.11)',
    },
    {
        card: 'bg-violet-100',
        accent: 'from-violet-300/70 to-violet-100/20',
        color: '#7c3aed',
        icon: 'bg-white/70 text-violet-950',
        foreground: 'text-violet-950',
        mutedForeground: 'text-violet-950/72',
        subtleForeground: 'text-violet-950/58',
        surfaceIcon: 'bg-white/75 text-violet-950 ring-violet-200/70',
        surfaceDivider: 'bg-violet-950/12',
        surfaceDot: 'bg-violet-950/45',
        patternColor: 'rgba(76, 29, 149, 0.11)',
    },
    {
        card: 'bg-cyan-100',
        accent: 'from-cyan-300/70 to-cyan-100/20',
        color: '#0891b2',
        icon: 'bg-white/70 text-[#083344]',
        foreground: 'text-[#083344]',
        mutedForeground: 'text-[#083344]/72',
        subtleForeground: 'text-[#083344]/58',
        surfaceIcon: 'bg-white/75 text-[#083344] ring-cyan-200/70',
        surfaceDivider: 'bg-[#083344]/12',
        surfaceDot: 'bg-[#083344]/45',
        patternColor: 'rgba(8, 51, 68, 0.1)',
    },
    {
        card: 'bg-lime-100',
        accent: 'from-lime-300/70 to-lime-100/20',
        color: '#65a30d',
        icon: 'bg-white/70 text-[#1a2e05]',
        foreground: 'text-[#1a2e05]',
        mutedForeground: 'text-[#1a2e05]/72',
        subtleForeground: 'text-[#1a2e05]/58',
        surfaceIcon: 'bg-white/75 text-[#1a2e05] ring-lime-200/70',
        surfaceDivider: 'bg-[#1a2e05]/12',
        surfaceDot: 'bg-[#1a2e05]/45',
        patternColor: 'rgba(26, 46, 5, 0.1)',
    },
    {
        card: 'bg-fuchsia-100',
        accent: 'from-fuchsia-300/70 to-fuchsia-100/20',
        color: '#c026d3',
        icon: 'bg-white/70 text-fuchsia-950',
        foreground: 'text-fuchsia-950',
        mutedForeground: 'text-fuchsia-950/72',
        subtleForeground: 'text-fuchsia-950/58',
        surfaceIcon: 'bg-white/75 text-fuchsia-950 ring-fuchsia-200/70',
        surfaceDivider: 'bg-fuchsia-950/12',
        surfaceDot: 'bg-fuchsia-950/45',
        patternColor: 'rgba(112, 26, 117, 0.11)',
    },
] as const;

const NEUTRAL_PORT_COLOR_CLASSES = {
    card: 'bg-slate-100',
    accent: 'from-slate-300/70 to-slate-100/20',
    color: '#334155',
    icon: 'bg-white/70 text-slate-950',
    foreground: 'text-slate-950',
    mutedForeground: 'text-slate-950/72',
    subtleForeground: 'text-slate-950/58',
    surfaceIcon: 'bg-white/75 text-slate-950 ring-slate-200/70',
    surfaceDivider: 'bg-slate-950/12',
    surfaceDot: 'bg-slate-950/45',
    patternColor: 'rgba(15, 23, 42, 0.1)',
} as const;

export const PORT_COLORS = {
    Colombo: PORT_COLOR_CLASSES[0].color,
    Galle: PORT_COLOR_CLASSES[1].color,
    Hambanthota: PORT_COLOR_CLASSES[2].color,
    Hambantota: PORT_COLOR_CLASSES[2].color,
    Trincomalee: PORT_COLOR_CLASSES[3].color,
    Kankesanthurai: PORT_COLOR_CLASSES[4].color,
} as const;

export const PORT_ICON_PATHS = {
    Colombo: '/images/icons/location_blue.png',
    Galle: '/images/icons/location_green.png',
    Hambanthota: '/images/icons/location_orange.png',
    Hambantota: '/images/icons/location_orange.png',
    Trincomalee: '/images/icons/location_red.png',
    Kankesanthurai: '/images/icons/location_violet.png',
} as const;

const PORT_CLASS_ALIASES = {
    Colombo: PORT_COLOR_CLASSES[0],
    Galle: PORT_COLOR_CLASSES[1],
    Hambanthota: PORT_COLOR_CLASSES[2],
    Hambantota: PORT_COLOR_CLASSES[2],
    Trincomalee: PORT_COLOR_CLASSES[3],
    Kankesanthurai: PORT_COLOR_CLASSES[4],
} as const;

function matchedPortEntry<T>(
    portLabel: string | null | undefined,
    entries: Record<string, T>,
): T | null {
    const normalizedPort = String(portLabel ?? '').toUpperCase();
    const matchedPort = Object.entries(entries).find(([port]) =>
        normalizedPort.includes(port.toUpperCase()),
    );

    return matchedPort?.[1] ?? null;
}

function stableColorIndex(value: string): number {
    let hash = 0;

    for (const character of value) {
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }

    return hash % PORT_COLOR_CLASSES.length;
}

export function portColorClasses(portKey: string | number | null | undefined) {
    if (portKey === null || portKey === undefined || portKey === '') {
        return NEUTRAL_PORT_COLOR_CLASSES;
    }

    const matchedPortClasses = matchedPortEntry(portKey, PORT_CLASS_ALIASES);

    if (matchedPortClasses) {
        return matchedPortClasses;
    }

    return PORT_COLOR_CLASSES[stableColorIndex(String(portKey))];
}

const FALLBACK_PORT_COLORS = Object.values(PORT_COLORS);
const FALLBACK_PORT_ICON_PATHS = Object.values(PORT_ICON_PATHS);

export function portColor(
    portLabel: string | null | undefined,
    fallbackIndex = 0,
): string {
    const matchedPortColor = matchedPortEntry(portLabel, PORT_COLORS);

    return (
        matchedPortColor ??
        FALLBACK_PORT_COLORS[fallbackIndex % FALLBACK_PORT_COLORS.length]
    );
}

export function portIconPath(
    portLabel: string | null | undefined,
    fallbackIndex = 0,
): string {
    const matchedPortIcon = matchedPortEntry(portLabel, PORT_ICON_PATHS);

    return (
        matchedPortIcon ??
        FALLBACK_PORT_ICON_PATHS[
            fallbackIndex % FALLBACK_PORT_ICON_PATHS.length
        ]
    );
}

export const PRODUCT_COLORS = {
    VLSFO: '#2a9d8f',
    MGO: '#e76f51',
    HSFO: '#5f0f40',
} as const;

const FALLBACK_PRODUCT_COLORS = Object.values(PRODUCT_COLORS);

export function productColor(
    productLabel: string | null | undefined,
    fallbackIndex = 0,
): string {
    const normalizedProduct = String(productLabel ?? '').toUpperCase();
    const matchedProduct = Object.entries(PRODUCT_COLORS).find(([product]) =>
        normalizedProduct.includes(product),
    );

    return (
        matchedProduct?.[1] ??
        FALLBACK_PRODUCT_COLORS[fallbackIndex % FALLBACK_PRODUCT_COLORS.length]
    );
}

export const ANALYTICS_STAGE_COLORS = {
    enquiries: '#16697a',
    orders: '#489fb5',
    completed: '#82c0cc',
} as const;

const ANALYTICS_STAGE_ALIASES = {
    enquiry: ANALYTICS_STAGE_COLORS.enquiries,
    enquiries: ANALYTICS_STAGE_COLORS.enquiries,
    order: ANALYTICS_STAGE_COLORS.orders,
    orders: ANALYTICS_STAGE_COLORS.orders,
    complete: ANALYTICS_STAGE_COLORS.completed,
    completed: ANALYTICS_STAGE_COLORS.completed,
} as const;

const FALLBACK_ANALYTICS_STAGE_COLORS = Object.values(ANALYTICS_STAGE_COLORS);

export function analyticsStageColor(
    stageLabel: string | null | undefined,
    fallbackIndex = 0,
): string {
    const normalizedStage = String(stageLabel ?? '').toLowerCase();
    const matchedStage = Object.entries(ANALYTICS_STAGE_ALIASES).find(
        ([stage]) => normalizedStage.includes(stage),
    );

    return (
        matchedStage?.[1] ??
        FALLBACK_ANALYTICS_STAGE_COLORS[
            fallbackIndex % FALLBACK_ANALYTICS_STAGE_COLORS.length
        ]
    );
}

/**
 * Resolve a stored enum value to its display label, falling back to the raw value.
 * `fallback` covers a null value — pass '' for spreadsheet cells, where the
 * default em dash would be noise.
 */
export function optionLabel(
    options: EnumOption[],
    value: string | null,
    fallback = '—',
): string {
    return (
        options.find((option) => option.value === value)?.label ??
        value ??
        fallback
    );
}

/** Replace empty-string form values with null so cleared fields blank out server-side. */
export function emptyToNull<T extends object>(
    data: T,
): { [K in keyof T]: T[K] | null } {
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
            key,
            value === '' ? null : value,
        ]),
    ) as { [K in keyof T]: T[K] | null };
}

/**
 * Format a decimal string as money (2dp), or an em dash when absent.
 * The locale is pinned so grouping doesn't vary with the browser's.
 */
export function formatMoney(value: string | number | null): string {
    if (value === null || value === '') {
        return '—';
    }

    const number = Number(value);

    return Number.isNaN(number)
        ? String(value)
        : number.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Format an ISO datetime or 'yyyy-mm-dd' date as a short date, or an em dash when absent.
 * Date-only strings are parsed as local midnight so they don't shift a day in negative-offset timezones.
 */
export function shortDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly
        ? new Date(
              Number(dateOnly[1]),
              Number(dateOnly[2]) - 1,
              Number(dateOnly[3]),
          )
        : new Date(value);

    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format an ISO datetime as a short date + time, or an em dash when absent.
 */
export function shortDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

/** Coerce a nullable form value to a string, defaulting to ''. */
export function str(value: string | number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
}

/** Trim an ISO timestamp/date down to the `YYYY-MM-DD` a date input expects. */
export function toDateInput(value: string | null | undefined): string {
    return value ? value.slice(0, 10) : '';
}

/** Trim an ISO timestamp down to the `YYYY-MM-DDTHH:mm` a datetime-local input expects. */
export function toDateTimeInput(value: string | null | undefined): string {
    return value ? value.slice(0, 16) : '';
}

/** 'yyyy-mm-dd' (or '') <-> local midnight Date, avoiding UTC/local timezone day shifts. */
export function dateOnlyToDate(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

export function dateToDateOnly(date: Date | undefined): string {
    if (!date) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/** Build a picker range from 'yyyy-mm-dd' bounds, or undefined when the start is unset. */
export function toDateRange(from: string, to: string): DateRange | undefined {
    if (!from) {
        return undefined;
    }

    return { from: dateOnlyToDate(from), to: dateOnlyToDate(to) };
}
