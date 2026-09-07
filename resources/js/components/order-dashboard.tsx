import { ChevronDown, Pencil } from 'lucide-react';
import { useState } from 'react';
import { SortableHead } from '@/components/sortable-head';
import { TableFrame } from '@/components/table-frame';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSortable } from '@/hooks/use-sortable';
import { FUEL_GRADES } from '@/lib/domain';
import { shortDate } from '@/lib/utils';

export const PORTS = ['Colombo', 'Trincomalee', 'Galle', 'Hambantota'] as const;

export interface OrderRow {
    id: number;
    vessel_name: string | null;
    customer_name: string | null;
    port: string | null;
    pic?: string | null;
    mobile_no?: string | null;
    vlsfo_qty: string | null;
    mgo_qty: string | null;
    hsfo_qty: string | null;
    vlsfo_final_qty: string | null;
    mgo_final_qty: string | null;
    hsfo_final_qty: string | null;
    vlsfo_quantity_low: string | null;
    mgo_quantity_low: string | null;
    hsfo_quantity_low: string | null;
    vlsfo_quantity_high: string | null;
    mgo_quantity_high: string | null;
    hsfo_quantity_high: string | null;
    eta: string | null;
    laycan_from: string | null;
    status: string;
}

interface Column {
    header: string;
    sortKey: keyof OrderRow;
}

const COLUMNS: Column[] = [
    {
        header: 'Vessel Name',
        sortKey: 'vessel_name',
    },
    {
        header: 'Customer Name',
        sortKey: 'customer_name',
    },
    {
        header: 'PIC',
        sortKey: 'pic',
    },
    ...FUEL_GRADES.map(
        (grade): Column => ({
            header: `${grade.label} QTY`,
            sortKey: `${grade.key}_qty`,
        }),
    ),
    {
        header: 'ETA',
        sortKey: 'eta',
    },
];

export interface RowAction<T> {
    label: string | ((row: T) => string);
    variant: React.ComponentProps<typeof Button>['variant'];
    className?: (row: T) => string | undefined;
    onClick: (row: T) => void;
}

interface OrderDashboardProps<T extends OrderRow> {
    ports?: string[];
    pendingOrders: T[];
    completedOrders: T[];
    pendingActions: RowAction<T>[];
    completedActions: RowAction<T>[];
}

export default function OrderDashboard<T extends OrderRow>({
    ports = [...PORTS],
    pendingOrders,
    completedOrders,
    pendingActions,
    completedActions,
}: OrderDashboardProps<T>) {
    const visiblePorts = ports.length > 0 ? ports : [...PORTS];
    const [selectedPort, setSelectedPort] = useState(visiblePorts[0]);
    const activePort = visiblePorts.includes(selectedPort)
        ? selectedPort
        : visiblePorts[0];

    return (
        <div className="flex flex-col gap-4">
            <Section
                title="Pending Orders"
                ports={visiblePorts}
                selectedPort={activePort}
                onPortChange={setSelectedPort}
                rows={pendingOrders}
                actions={pendingActions}
            />
            <Section
                title="Completed Orders (last 30 days)"
                ports={visiblePorts}
                selectedPort={activePort}
                onPortChange={setSelectedPort}
                rows={completedOrders}
                actions={completedActions}
            />
        </div>
    );
}

function Section<T extends OrderRow>({
    title,
    ports,
    selectedPort,
    onPortChange,
    rows,
    actions,
}: {
    title: string;
    ports: string[];
    selectedPort: string;
    onPortChange: (port: string) => void;
    rows: T[];
    actions: RowAction<T>[];
}) {
    const rowsByPort = ports.map((port) => ({
        port,
        rows: rows.filter((row) => row.port === port),
    }));

    return (
        <Collapsible
            defaultOpen
            className="overflow-hidden rounded-[17px] border border-[#E3EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
        >
            <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F8FAFD] focus-visible:ring-2 focus-visible:ring-[#3155E7]/40 focus-visible:outline-none">
                <ChevronDown className="size-5 shrink-0 text-[#64748B] transition-transform group-data-[state=closed]:-rotate-90" />
                <h2 className="text-xl font-bold tracking-normal text-[#0F172A]">
                    {title}
                </h2>
                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-bold text-[#3155E7] tabular-nums">
                    {rows.length}
                </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <Tabs
                    value={selectedPort}
                    onValueChange={onPortChange}
                    className="gap-4 px-4 pb-4"
                >
                    <TabsList
                        variant="line"
                        className="h-auto! w-full justify-start overflow-x-auto border-b border-[#E7EDF4] pb-2 sm:grid sm:auto-cols-fr sm:grid-flow-col sm:overflow-visible"
                    >
                        {ports.map((port) => (
                            <TabsTrigger
                                key={port}
                                value={port}
                                className="min-w-max rounded-[9px] px-3 py-2 text-sm font-semibold text-[#334155] after:hidden hover:bg-[#F1F5FF] hover:text-[#1D4ED8] sm:min-w-0 sm:px-4 data-active:bg-[linear-gradient(90deg,#1746E8,#315CF4)]! data-active:text-white! data-active:shadow-[0_7px_16px_rgba(37,99,235,0.20)]"
                            >
                                {port}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {rowsByPort.map(({ port, rows: portRows }) => (
                        <TabsContent key={port} value={port}>
                            <PortTable rows={portRows} actions={actions} />
                        </TabsContent>
                    ))}
                </Tabs>
            </CollapsibleContent>
        </Collapsible>
    );
}

function PortTable<T extends OrderRow>({
    rows,
    actions,
}: {
    rows: T[];
    actions: RowAction<T>[];
}) {
    const { sortKey, sortDir, handleSort, sorted } = useSortable(rows, 'eta');

    return (
        <TableFrame className="rounded-[14px] border-[#E3EAF2]">
            <Table>
                <TableHeader className="bg-[#EDF3FA]">
                    <TableRow className="border-[#E7EDF4] hover:bg-[#EDF3FA]">
                        {COLUMNS.map((column) => (
                            <SortableHead
                                key={column.sortKey}
                                label={column.header}
                                sortKey={column.sortKey}
                                currentKey={sortKey}
                                currentDir={sortDir}
                                onSort={handleSort}
                                className="h-11 px-3 font-bold text-[#172033]"
                            />
                        ))}
                        <TableHead className="h-11 px-3 text-right font-bold text-[#172033]">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((row) => (
                        <TableRow
                            key={row.id}
                            className="min-h-[50px] border-[#E7EDF4] bg-white hover:bg-[#F8FAFD]"
                        >
                            <TableCell className="px-3 py-3 font-medium text-[#0F172A]">
                                {row.vessel_name ?? '-'}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-[#334155]">
                                {row.customer_name ?? '-'}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-[#334155]">
                                {picLabel(row)}
                            </TableCell>
                            {FUEL_GRADES.map((grade) => (
                                <TableCell
                                    key={grade.key}
                                    className="px-3 py-3 font-medium text-[#334155] tabular-nums"
                                >
                                    {(row as OrderRow)[`${grade.key}_qty`] ??
                                        '-'}
                                </TableCell>
                            ))}
                            <TableCell className="px-3 py-3 text-[#334155] tabular-nums">
                                {shortDate(row.eta ?? row.laycan_from)}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    {actions.map((action, index) => (
                                        <Button
                                            key={index}
                                            variant={action.variant}
                                            size="sm"
                                            className={
                                                action.className?.(row) ??
                                                'h-8 rounded-lg border border-[#4F75F5] bg-white px-3 text-sm font-semibold text-[#2455E6] shadow-none transition-[background-color,color,box-shadow] duration-200 hover:bg-[#2455E6] hover:text-white hover:shadow-[0_6px_14px_rgba(36,85,230,0.20)] focus-visible:ring-[#3155E7]/40'
                                            }
                                            onClick={() => action.onClick(row)}
                                        >
                                            <Pencil
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            {typeof action.label === 'function'
                                                ? action.label(row)
                                                : action.label}
                                        </Button>
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}

                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={COLUMNS.length + 1}
                                className="px-3 py-8 text-center text-muted-foreground"
                            >
                                No orders.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableFrame>
    );
}

function picLabel(row: OrderRow): string {
    if (!row.pic) {
        return '-';
    }

    return row.mobile_no ? `${row.pic} (${row.mobile_no})` : row.pic;
}
