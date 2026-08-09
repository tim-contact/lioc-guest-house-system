import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
    id?: string;
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
    size?: 'default' | 'sm';
}

/** Label a range as "Jul 1 – Jul 15", or a single day, or the placeholder. */
function label(range: DateRange | undefined, placeholder: string): string {
    if (!range?.from) {
        return placeholder;
    }

    if (!range.to) {
        return format(range.from, 'PP');
    }

    return `${format(range.from, 'PP')} – ${format(range.to, 'PP')}`;
}

export function DateRangePicker({
    id,
    value,
    onChange,
    placeholder = 'Pick date range',
    size = 'default',
}: DateRangePickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    size={size}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value?.from && 'text-muted-foreground',
                    )}
                >
                    {label(value, placeholder)}
                    <CalendarIcon className="size-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={value}
                    onSelect={onChange}
                    numberOfMonths={2}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
