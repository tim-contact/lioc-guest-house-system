import { MoneyInput } from '@/components/money-input';
import { NoneSelect } from '@/components/none-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { EnumOption } from '@/types';

// Disabled inputs still read as content, not greyed-out controls.
const READ_ONLY_CLASSES =
    'disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-100';

/** Labelled editable input, the standard field layout inside edit dialogs. */
export function LabeledField({
    id,
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    step,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: React.HTMLInputTypeAttribute | 'currency';
    placeholder?: string;
    step?: string;
}) {
    return (
        <div className="grid gap-1">
            <Label htmlFor={id}>{label}</Label>
            {type === 'currency' ? (
                <MoneyInput
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                />
            ) : (
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    step={step}
                />
            )}
        </div>
    );
}

/**
 * Labelled enum select. `clearable` adds the leading "none" row so a value that
 * has been set can be blanked again, which a bare shadcn Select cannot do.
 */
export function LabeledSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    clearable = false,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: EnumOption[];
    placeholder?: string;
    clearable?: boolean;
    error?: string;
}) {
    return (
        <div className="grid gap-1">
            <Label>{label}</Label>
            {clearable ? (
                <NoneSelect
                    value={value}
                    onChange={onChange}
                    options={options}
                    placeholder={placeholder}
                />
            ) : (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

/** Labelled non-editable value as plain text, for use inside a `ReadOnlyBand`. */
export function ReadOnlyValue({
    label,
    value,
}: {
    label: string;
    value: string | null;
}) {
    return (
        <div className="grid gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-medium break-words">{value || '—'}</span>
        </div>
    );
}

/** Label above a figure, for the stat rows on summary cards. */
export function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-lg font-medium tabular-nums">{value}</span>
        </div>
    );
}

/** Label and value on one line, for the detail lists inside cards. */
export function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}

/** Labelled non-editable value, shown as a muted disabled input. */
export function ReadOnlyField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="grid gap-1">
            <Label>{label}</Label>
            <Input
                className={READ_ONLY_CLASSES}
                value={value}
                readOnly
                disabled
            />
        </div>
    );
}
