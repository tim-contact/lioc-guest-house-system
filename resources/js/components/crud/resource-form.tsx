import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { DateTimePicker } from '@/components/date-time-picker';
import { ReadOnlyValue } from '@/components/edit-panel/fields';
import { SummaryBand } from '@/components/edit-panel/summary-band';
import InputError from '@/components/input-error';
import { MoneyInput } from '@/components/money-input';
import { Button } from '@/components/ui/button';
import {
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { CrudConfig, CrudField } from './crud-types';

const controlClass =
    'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80';

function FieldControl({
    field,
    value,
    onChange,
}: {
    field: CrudField;
    value: string;
    onChange: (value: string) => void;
}) {
    if (field.type === 'select') {
        return (
            <select
                id={field.name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(controlClass, 'cursor-pointer')}
            >
                <option value="">—</option>
                {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    if (field.type === 'textarea') {
        return (
            <Textarea
                id={field.name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    if (field.type === 'currency') {
        return <MoneyInput id={field.name} value={value} onChange={onChange} />;
    }

    if (field.type === 'datetime-local') {
        return (
            <DateTimePicker id={field.name} value={value} onChange={onChange} />
        );
    }

    return (
        <Input
            id={field.name}
            type={field.type ?? 'text'}
            step={field.step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

/** Resolves a select field's stored value to its option label for display. */
function fieldDisplayValue(field: CrudField, value: string): string {
    if (field.type === 'select') {
        return (
            field.options?.find((option) => option.value === value)?.label ??
            value
        );
    }

    return value;
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
    const form = useForm<Record<string, string>>(
        config.toFormData?.(row) ?? {},
    );
    const isEdit = row !== null;
    const isLocked = (field: CrudField) => isEdit && !!field.disabledOnEdit;
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

            <div className="max-h-[65vh] overflow-y-auto pr-1">
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
                                        onChange={(value) =>
                                            form.setData(field.name, value)
                                        }
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
