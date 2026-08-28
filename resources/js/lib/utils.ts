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
        card: 'bg-sky-600',
        accent: 'from-white/80 to-white/20',
        color: '#0284c7',
        icon: 'bg-white/20 text-white',
    },
    {
        card: 'bg-emerald-600',
        accent: 'from-white/80 to-white/20',
        color: '#059669',
        icon: 'bg-white/20 text-white',
    },
    {
        card: 'bg-amber-500',
        accent: 'from-white/80 to-white/20',
        color: '#f59e0b',
        icon: 'bg-white/25 text-white',
    },
    {
        card: 'bg-rose-600',
        accent: 'from-white/80 to-white/20',
        color: '#e11d48',
        icon: 'bg-white/20 text-white',
    },
    {
        card: 'bg-violet-600',
        accent: 'from-white/80 to-white/20',
        color: '#7c3aed',
        icon: 'bg-white/20 text-white',
    },
    {
        card: 'bg-cyan-600',
        accent: 'from-white/80 to-white/20',
        color: '#0891b2',
        icon: 'bg-white/20 text-white',
    },
    {
        card: 'bg-lime-600',
        accent: 'from-white/80 to-white/20',
        color: '#65a30d',
        icon: 'bg-white/20 text-white',
    },
    {
        card: 'bg-fuchsia-600',
        accent: 'from-white/80 to-white/20',
        color: '#c026d3',
        icon: 'bg-white/20 text-white',
    },
] as const;

const NEUTRAL_PORT_COLOR_CLASSES = {
    card: 'bg-slate-700',
    accent: 'from-white/80 to-white/20',
    color: '#334155',
    icon: 'bg-white/20 text-white',
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
