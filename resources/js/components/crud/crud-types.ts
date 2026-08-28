import type { ReactNode } from 'react';
import type { ExportColumn } from '@/lib/export-xlsx';
import type { EnumOption } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

export type CrudFieldType =
    | 'text'
    | 'email'
    | 'number'
    | 'date'
    | 'datetime-local'
    | 'select'
    | 'password'
    | 'textarea';

export interface CrudField {
    name: string;
    label: string;
    type?: CrudFieldType;
    step?: string;
    options?: EnumOption[] | ((data: Record<string, string>) => EnumOption[]);
    disabledOnEdit?: boolean;
    disabledWhen?: (data: Record<string, string>) => boolean;
    resetOnChange?: string[];
    section?: string;
}

export interface CrudColumn<T> {
    header: string;
    /** Omit to render a non-sortable header. */
    sortKey?: keyof T & string;
    cell: (row: T) => ReactNode;
    align?: 'right';
    className?: string;
}

export interface CrudConfig<T> {
    title: string;
    entityLabel: string;
    filename: string;
    emptyText: string;
    pk: (row: T) => string | number;
    defaultSortKey: keyof T & string;
    columns: CrudColumn<T>[];
    exportColumns: ExportColumn<T>[];
    fields: CrudField[];
    formColumns?: 1 | 2;
    dialogClassName?: string;
    /** Initial form values; called with null for the create form. */
    toFormData: (row: T | null) => Record<string, string>;
    editTitle?: (row: T) => string;
    /** Names the row in the delete confirmation; defaults to its primary key. */
    deleteLabel?: (row: T) => string;
    /** Defaults to true. Set false to hide the "+ Add" button and the create dialog. */
    canCreate?: boolean;
    /** Defaults to true. Set false to hide the per-row Edit button and dialog. */
    canEdit?: boolean;
    /** Defaults to true. Set false to hide the per-row Delete button and dialog. */
    canDelete?: boolean;
    routes: {
        store?: () => RouteDefinition<'post'>;
        update?: (
            id: string | number,
        ) => RouteDefinition<'put'> | RouteDefinition<'patch'>;
        destroy?: (id: string | number) => RouteDefinition<'delete'>;
    };
}
