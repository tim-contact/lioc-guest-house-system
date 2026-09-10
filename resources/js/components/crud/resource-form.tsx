import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { DateTimePicker } from '@/components/date-time-picker';
import { ReadOnlyValue } from '@/components/edit-panel/fields';
import { SummaryBand } from '@/components/edit-panel/summary-band';
import InputError from '@/components/input-error';
import { MoneyInput } from '@/components/money-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { CrudConfig, CrudField, CrudFormData } from './crud-types';

const controlClass =
    'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80';

function FieldControl({
    field,
    value,
    formData,
    disabled,
    onChange,
}: {
    field: CrudField;
    value: boolean | string | string[];
    formData: CrudFormData;
    disabled: boolean;
    onChange: (value: boolean | string | string[]) => void;
}) {
    if (field.type === 'checkbox') {
        return (
            <div className="flex h-8 items-center rounded-lg border border-input px-2.5">
                <Checkbox
                    checked={value === true || value === '1'}
                    disabled={disabled}
                    onCheckedChange={(checked) => onChange(checked === true)}
                />
            </div>
        );
    }

    if (field.type === 'select') {
        const options =
            typeof field.options === 'function'
                ? field.options(formData)
                : field.options;

        return (
            <select
                id={field.name}
                value={Array.isArray(value) ? value[0] : String(value)}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className={cn(controlClass, 'cursor-pointer')}
            >
                <option value="">—</option>
                {options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    if (field.type === 'multiselect') {
        const options =
            typeof field.options === 'function'
                ? field.options(formData)
                : field.options;
        const selected = Array.isArray(value)
            ? value
            : typeof value === 'string' && value
              ? [value]
              : [];
        const toggleValue = (optionValue: string, checked: boolean): void => {
            onChange(
                checked
                    ? [...selected, optionValue]
                    : selected.filter(
                          (selectedValue) => selectedValue !== optionValue,
                      ),
            );
        };

        return (
            <div
                id={field.name}
                className="max-h-48 overflow-y-auto rounded-lg border border-input bg-transparent p-2"
            >
                {options?.map((option) => (
                    <label
                        key={option.value}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        <Checkbox
                            checked={selected.includes(option.value)}
                            disabled={disabled}
                            onCheckedChange={(checked) =>
                                toggleValue(option.value, checked === true)
                            }
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>
        );
    }

    if (field.type === 'textarea') {
        return (
            <Textarea
                id={field.name}
                value={Array.isArray(value) ? value.join(', ') : String(value)}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    if ((field.type as string) === 'currency') {
        return (
            <MoneyInput
                id={field.name}
                value={Array.isArray(value) ? value[0] : String(value)}
                onChange={onChange}
            />
        );
    }

    if (field.type === 'datetime-local') {
        return (
            <DateTimePicker
                id={field.name}
                value={Array.isArray(value) ? value[0] : String(value)}
                onChange={onChange}
            />
        );
    }

    return (
        <Input
            id={field.name}
            type={field.type ?? 'text'}
            step={field.step}
            value={Array.isArray(value) ? value.join(', ') : String(value)}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

/** Resolves a select field's stored value to its option label for display. */
function fieldDisplayValue(
    field: CrudField,
    value: boolean | string | string[],
): string {
    if (field.type === 'checkbox') {
        return value === true || value === '1' ? 'Yes' : 'No';
    }

    if (field.type === 'select' || field.type === 'multiselect') {
        const options =
            typeof field.options === 'function'
                ? field.options({})
                : field.options;
        const values = Array.isArray(value) ? value : [value];

        return values
            .filter(Boolean)
            .map(
                (selectedValue) =>
                    options?.find((option) => option.value === selectedValue)
                        ?.label ?? selectedValue,
            )
            .join(', ');
    }

    return Array.isArray(value) ? value.join(', ') : String(value);
}

/** Consecutive fields sharing a `section` are grouped under one heading. */
function groupFields(
    fields: CrudField[],
): { name: string; fields: CrudField[] }[] {
    const groups: { name: string; fields: CrudField[] }[] = [];

    for (const field of fields) {
        const name = field.section ?? '';
        const last = groups[groups.length - 1];

        if (last && last.name === name) {
            last.fields.push(field);
        } else {
            groups.push({ name, fields: [field] });
        }
    }

    return groups;
}

export function ResourceForm<T>({
    config,
    row,
    onDone,
}: {
    config: CrudConfig<T>;
    row: T | null;
    onDone: () => void;
}) {
    const form = useForm<CrudFormData>(config.toFormData?.(row) ?? {});
    const isEdit = row !== null;
    const isLocked = (field: CrudField) => isEdit && !!field.disabledOnEdit;
    const isDisabled = (field: CrudField) => !!field.disabledWhen?.(form.data);
    const fields = config.fields ?? [];
    const lockedFields = fields.filter(isLocked);
    const editableFields = fields.filter((field) => !isLocked(field));
    const gridClass =
        config.formColumns === 2 ? 'grid grid-cols-2 gap-3' : 'grid gap-3';

    function submit(event: FormEvent) {
        event.preventDefault();

        const action = isEdit
            ? config.routes?.update?.(config.pk(row))
            : config.routes?.store?.();

        if (!action) {
            return;
        }

        form.submit(action, { onSuccess: onDone });
    }

    const header = (
        <DialogHeader>
            <DialogTitle>
                {isEdit
                    ? `Edit ${config.editTitle ? config.editTitle(row) : config.entityLabel}`
                    : `New ${config.entityLabel}`}
            </DialogTitle>
        </DialogHeader>
    );

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            {lockedFields.length > 0 ? (
                <SummaryBand>
                    {header}
                    <div className={gridClass}>
                        {lockedFields.map((field) => (
                            <ReadOnlyValue
                                key={field.name}
                                label={field.label}
                                value={fieldDisplayValue(
                                    field,
                                    form.data[field.name] ?? '',
                                )}
                            />
                        ))}
                    </div>
                </SummaryBand>
            ) : (
                header
            )}

            <div>
                {groupFields(editableFields).map((section) => (
                    <div key={section.name} className="mb-4 last:mb-0">
                        {section.name && (
                            <p className="mb-2 text-sm font-semibold text-muted-foreground">
                                {section.name}
                            </p>
                        )}
                        <div className={gridClass}>
                            {section.fields.map((field) => (
                                <div key={field.name} className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        {field.label}
                                    </Label>
                                    <FieldControl
                                        field={field}
                                        value={form.data[field.name] ?? ''}
                                        formData={form.data}
                                        disabled={isDisabled(field)}
                                        onChange={(value) => {
                                            const nextData: CrudFormData = {
                                                ...form.data,
                                                [field.name]: value,
                                            };

                                            field.resetOnChange?.forEach(
                                                (name) => {
                                                    nextData[name] = '';
                                                },
                                            );

                                            form.setData(nextData);
                                        }}
                                    />
                                    <InputError
                                        message={form.errors[field.name]}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <DialogFooter>
                <Button type="submit" disabled={form.processing}>
                    {isEdit ? 'Save' : 'Create'}
                </Button>
            </DialogFooter>
        </form>
    );
}
