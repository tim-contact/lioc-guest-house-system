import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const ALL_PORTS_VALUE = '__all_ports__';

export interface PortSearchState {
    query: string;
    port: string;
}

export interface PortSearchableRow {
    vessel_name: string | null;
    customer_name: string | null;
    port: string | null;
}

interface PortScopedOrderSearchProps {
    ports?: string[];
    value: PortSearchState;
    onChange: (value: PortSearchState) => void;
    resultCount?: number;
    showPortSelect?: boolean;
    className?: string;
}

export function PortScopedOrderSearch({
    ports,
    value,
    onChange,
    resultCount,
    showPortSelect = true,
    className,
}: PortScopedOrderSearchProps) {
    const hasFilters =
        value.query.trim().length > 0 ||
        (showPortSelect && value.port !== ALL_PORTS_VALUE);

    return (
        <div
            className={[
                'flex flex-col gap-3 rounded-[17px] border border-[#E3EAF2] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:flex-row md:items-center',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                    value={value.query}
                    onChange={(event) =>
                        onChange({ ...value, query: event.target.value })
                    }
                    placeholder="Search by vessel or customer"
                    className="h-10 rounded-xl border-[#D8E2EE] bg-[#F8FAFD] pl-9 text-[#0F172A] placeholder:text-[#64748B]"
                    aria-label="Search orders by vessel or customer"
                />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {showPortSelect && (
                    <Select
                        value={value.port}
                        onValueChange={(port) => onChange({ ...value, port })}
                    >
                        <SelectTrigger className="h-10 min-w-48 rounded-xl border-[#D8E2EE] bg-[#F8FAFD]">
                            <SelectValue placeholder="Select port" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_PORTS_VALUE}>
                                All ports
                            </SelectItem>
                            {(ports ?? []).map((port) => (
                                <SelectItem key={port} value={port}>
                                    {port}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {typeof resultCount === 'number' && (
                    <span className="rounded-full bg-[#EEF2FF] px-3 py-2 text-xs font-bold text-[#3155E7] tabular-nums">
                        {resultCount} results
                    </span>
                )}

                {hasFilters && (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-[#D8E2EE]"
                        onClick={() =>
                            onChange({
                                query: '',
                                port: ALL_PORTS_VALUE,
                            })
                        }
                    >
                        <X />
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}

export function filterPortScopedRows<T extends PortSearchableRow>(
    rows: T[],
    filters: PortSearchState,
): T[] {
    const query = filters.query.trim().toLowerCase();

    return rows.filter((row) => {
        const matchesPort =
            filters.port === ALL_PORTS_VALUE || row.port === filters.port;
        const matchesQuery =
            query.length === 0 ||
            [row.vessel_name, row.customer_name].some((value) =>
                (value ?? '').toLowerCase().includes(query),
            );

        return matchesPort && matchesQuery;
    });
}
