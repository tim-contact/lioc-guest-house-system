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
import { cn, dateOnlyToDate, dateToDateOnly } from '@/lib/utils';
import { TimeField } from './time-field';

interface DateTimePickerProps {
    id?: string;
    /** 'yyyy-mm-ddThh:mm', or '' when unset. */
    value: string;
    onChange: (value: string) => void;
    enterAdvances?: boolean;
    placeholder?: string;
}

export function DateTimePicker({
    id,
    value,
    onChange,
    enterAdvances = false,
    placeholder = 'Pick date & time',
}: DateTimePickerProps) {
    const [open, setOpen] = useState(false);
    const [datePart = '', timePart = ''] = value.split('T');
    const date = dateOnlyToDate(datePart);

    const commit = (nextDate: string, nextTime: string) =>
        onChange(nextDate ? `${nextDate}T${nextTime || '00:00'}` : '');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    data-bdn-enter-next={enterAdvances ? 'true' : undefined}
                    className={cn(
                        'w-full justify-between font-normal',
                        !date && 'text-muted-foreground',
                    )}
                >
                    {date
                        ? `${format(date, 'dd/MM/yyyy')} ${timePart}`.trim()
                        : placeholder}
                    <CalendarIcon className="size-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(next) => commit(dateToDateOnly(next), timePart)}
                    autoFocus
                />
                <div className="border-t p-3">
                    <TimeField
                        value={timePart}
                        onChange={(next) =>
                            commit(datePart || dateToDateOnly(new Date()), next)
                        }
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
