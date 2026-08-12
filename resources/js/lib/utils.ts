import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import type { DateRange } from 'react-day-picker';
import { twMerge } from 'tailwind-merge';
import type { EnumOption } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
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
