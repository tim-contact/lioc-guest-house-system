import type { ReactNode } from 'react';
import type { ExportColumn } from '@/lib/export-xlsx';
import type { EnumOption } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

export type CrudFormValue = boolean | string | string[];
export type CrudFormData = Record<string, CrudFormValue>;

export type CrudFieldType =
    | 'text'
    | 'email'
    | 'number'
    | 'currency'
    | 'date'
    | 'datetime-local'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'password'
    | 'textarea'
    | 'string-list';

export interface CrudField {
    name: string;
    label: string;
    type?: CrudFieldType;
    step?: string;
    options?: EnumOption[] | ((data: CrudFormData) => EnumOption[]);
    disabledOnEdit?: boolean;
    disabledWhen?: (data: CrudFormData) => boolean;
    resetOnChange?: string[];
    section?: string;
    placeholder?: string;
    addLabel?: string;
    itemType?: 'text' | 'email' | 'tel';
}

export interface CrudColumn<T> {
    header: string;
    /** Omit to render a non-sortable header. */
    sortKey?: keyof T & string;
    cell: (row: T) => ReactNode;
    align?: 'right';
    className?: string;
    headerClassName?: string;
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
    /** Omit on a read-only page, or one whose editing lives in `rowActions`. */
    fields?: CrudField[];
    formColumns?: 1 | 2;
    dialogClassName?: string;
    /** Initial form values; called with null for the create form. */
    toFormData?: (row: T | null) => CrudFormData;
    /** Optional page-specific form used inside the create/edit dialogs. */
    form?: (props: { row: T | null; onDone: () => void }) => ReactNode;
    /** Extra buttons rendered before Edit/Delete in each row's Actions cell. */
    rowActions?: (row: T) => ReactNode;
    /** Optional controls rendered beside the page actions above the table. */
    toolbar?: ReactNode;
    /** Optional replacement for the default current-page Excel export button. */
    exportControl?: ReactNode;
    editTitle?: (row: T) => string;
    /** Names the row in the delete confirmation; defaults to its primary key. */
    deleteLabel?: (row: T) => string;
    /** Defaults to true. Set false to hide the "+ Add" button and the create dialog. */
    canCreate?: boolean;
    /** Defaults to true. Set false to hide the per-row Edit button and dialog. */
    canEdit?: boolean;
    /** Defaults to true. Set false to hide the per-row Delete button and dialog. */
    canDelete?: boolean;
    /** Render a denser table (tighter row padding and smaller text) to fit more rows on screen. */
    dense?: boolean;
    /** Optional page-specific table layout classes. */
    tableClassName?: string;
    routes?: {
        store?: () => RouteDefinition<'post'>;
        update?: (
            id: string | number,
        ) => RouteDefinition<'put'> | RouteDefinition<'patch'>;
        destroy?: (id: string | number) => RouteDefinition<'delete'>;
    };
}
