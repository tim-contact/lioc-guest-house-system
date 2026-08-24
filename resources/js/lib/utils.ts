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
        card: 'bg-sky-50',
        accent: 'from-sky-500 to-blue-600',
        icon: 'bg-sky-100 text-sky-700',
    },
    {
        card: 'bg-emerald-50',
        accent: 'from-emerald-500 to-teal-600',
        icon: 'bg-emerald-100 text-emerald-700',
    },
    {
        card: 'bg-amber-50',
        accent: 'from-amber-500 to-orange-600',
        icon: 'bg-amber-100 text-amber-800',
    },
    {
        card: 'bg-rose-50',
        accent: 'from-rose-500 to-red-600',
        icon: 'bg-rose-100 text-rose-700',
    },
    {
        card: 'bg-violet-50',
        accent: 'from-violet-500 to-indigo-600',
        icon: 'bg-violet-100 text-violet-700',
    },
    {
        card: 'bg-cyan-50',
        accent: 'from-cyan-500 to-sky-600',
        icon: 'bg-cyan-100 text-cyan-700',
    },
    {
        card: 'bg-lime-50',
        accent: 'from-lime-500 to-green-600',
        icon: 'bg-lime-100 text-lime-800',
    },
    {
        card: 'bg-fuchsia-50',
        accent: 'from-fuchsia-500 to-pink-600',
        icon: 'bg-fuchsia-100 text-fuchsia-700',
    },
] as const;

const NEUTRAL_PORT_COLOR_CLASSES = {
    card: 'bg-white',
    accent: 'from-slate-400 to-slate-700',
    icon: 'bg-slate-100 text-slate-700',
} as const;

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

    return PORT_COLOR_CLASSES[stableColorIndex(String(portKey))];
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

