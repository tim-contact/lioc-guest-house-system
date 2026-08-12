import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn, formatMoney } from '@/lib/utils';

/**
 * Currency entry field: raw digits while focused, comma-grouped once blurred.
 * `type="text"` because a number input rejects the separators.
 */
export function MoneyInput({
    id,
    value,
    onChange,
    placeholder,
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <Input
            id={id}
            type="text"
            inputMode="decimal"
            className={cn('tabular-nums', className)}
            value={focused || value === '' ? value : formatMoney(value)}
            onChange={(e) => onChange(e.target.value.replaceAll(',', ''))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
        />
    );
}
