import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { EnumOption } from '@/types';

// shadcn Select can't hold an empty-string value, so "none" uses this sentinel.
const NONE = '__none__';

/** A Select whose empty value ('') is represented by a leading "none" row. */
export function NoneSelect({
    value,
    onChange,
    options,
    placeholder,
    noneLabel = '—',
    size,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    options: EnumOption[];
    placeholder?: string;
    noneLabel?: string;
    size?: 'sm' | 'default';
    className?: string;
}) {
    return (
        <Select
            value={value || NONE}
            onValueChange={(next) => onChange(next === NONE ? '' : next)}
        >
            <SelectTrigger size={size} className={cn('w-full', className)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={NONE}>{noneLabel}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
