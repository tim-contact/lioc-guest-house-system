import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    id?: string;
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    size?: 'default' | 'sm';
}

export function DatePicker({
    id,
    value,
    onChange,
    placeholder = 'Pick a date',
    size = 'default',
}: DatePickerProps) {
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
                        !value && 'text-muted-foreground',
                    )}
                >
                    {value ? format(value, 'dd/MM/yyyy') : placeholder}
                    <CalendarIcon className="size-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange(date);
                        setOpen(false);
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
