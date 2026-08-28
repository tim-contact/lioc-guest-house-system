import { useState } from 'react';
import { Input } from '@/components/ui/input';

function digitsToTime(digits: string): string {
    const hour = digits.slice(0, 2);
    const minute = digits.slice(2, 4);

    if (hour.length < 2) {
        return hour;
    }

    const clampedHour = String(Math.min(Number(hour), 23)).padStart(2, '0');

    if (!minute) {
        return clampedHour;
    }

    if (minute.length < 2) {
        return `${clampedHour}:${minute}`;
    }

    const clampedMinute = String(Math.min(Number(minute), 59)).padStart(2, '0');

    return `${clampedHour}:${clampedMinute}`;
}

/**
 * 24-hour `HH:mm` time entry. A digit-only mask rather than a native
 * `type="time"` input, since the native widget's AM/PM vs 24h display
 * follows the browser/OS locale and can't be forced.
 */
export function TimeField({
    id,
    value,
    onChange,
    placeholder = 'HH:mm',
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}) {
    const [draft, setDraft] = useState<string | null>(null);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
        const formatted = digitsToTime(digits);

        setDraft(formatted);

        if (digits.length === 4 || digits.length === 0) {
            onChange(formatted);
        }
    }

    return (
        <Input
            id={id}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            className={className}
            value={draft ?? value}
            onChange={handleChange}
            onBlur={() => setDraft(null)}
            maxLength={5}
        />
    );
}
