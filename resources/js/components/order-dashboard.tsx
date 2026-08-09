import { ChevronDown } from 'lucide-react';
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
import { shortDate } from '@/lib/utils';

export const PORTS = ['Colombo', 'Trincomalee', 'Galle', 'Hambantota'] as const;

const COLUMNS = [
    'Vessel Name',
    'Customer Name',
    'MGO QTY',
    'VLSFO QTY',
    'HSFO QTY',
    'ETA',
] as const;

export interface OrderRow {
    id: number;
    vessel_name: string | null;
    customer_name: string | null;
    port: string | null;
    mgo_qty: string | null;
    vlsfo_qty: string | null;
    hsfo_qty: string | null;
    mgo_final_qty: string | null;
    vlsfo_final_qty: string | null;
    hsfo_final_qty: string | null;
    mgo_quantity_low: string | null;
    vlsfo_quantity_low: string | null;
    hsfo_quantity_low: string | null;
    mgo_quantity_high: string | null;
    vlsfo_quantity_high: string | null;
    hsfo_quantity_high: string | null;
    eta: string | null;
    laycan_from: string | null;
    status: string;
}

export interface RowAction<T> {
    label: string | ((row: T) => string);
    variant: React.ComponentProps<typeof Button>['variant'];
    className?: (row: T) => string | undefined;
    onClick: (row: T) => void;
}

interface OrderDashboardProps<T extends OrderRow> {
    pendingOrders: T[];
    completedOrders: T[];
    pendingActions: RowAction<T>[];
    completedActions: RowAction<T>[];
}

export default function OrderDashboard<T extends OrderRow>({
    pendingOrders,
    completedOrders,
    pendingActions,
    completedActions,
}: OrderDashboardProps<T>) {
    return (
        <div className="flex flex-col gap-6 p-4">
            <Section
                title="Pending Orders"
                rows={pendingOrders}
                actions={pendingActions}
            />
            <Section
                title="Completed Orders (last 30 days)"
                rows={completedOrders}
                actions={completedActions}
            />
        </div>
    );
}

function Section<T extends OrderRow>({
    title,
    rows,
    actions,
}: {
    title: string;
    rows: T[];
    actions: RowAction<T>[];
}) {
    const rowsByPort = PORTS.map((port) => ({
        port,
        rows: rows.filter((row) => row.port === port),
    }));

    return (
        <Collapsible defaultOpen className="flex flex-col gap-4">
            <CollapsibleTrigger className="group flex w-full items-center gap-2 text-left">
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                <h2 className="text-xl font-semibold tracking-tight">
                    {title}
                </h2>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2">
                <Tabs defaultValue={PORTS[0]} className="gap-4">
                    <TabsList
                        variant="line"
                        className="h-auto! w-full border-b"
                    >
                        {PORTS.map((port) => (
                            <TabsTrigger
                                key={port}
                                value={port}
                                className="px-2 py-2.5 text-sm font-medium after:bg-info hover:bg-info/5 hover:text-info sm:px-4 sm:text-base data-active:bg-info/10! data-active:font-semibold data-active:text-info!"
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
    return (
        <TableFrame>
            <Table>
                <TableHeader>
                    <TableRow>
                        {COLUMNS.map((column) => (
                            <TableHead key={column}>{column}</TableHead>
                        ))}
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell>{row.vessel_name ?? '—'}</TableCell>
                            <TableCell>{row.customer_name ?? '—'}</TableCell>
                            <TableCell>{row.mgo_qty ?? '—'}</TableCell>
                            <TableCell>{row.vlsfo_qty ?? '—'}</TableCell>
                            <TableCell>{row.hsfo_qty ?? '—'}</TableCell>
                            <TableCell>
                                {shortDate(row.eta ?? row.laycan_from)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {actions.map((action, index) => (
                                        <Button
                                            key={index}
                                            variant={action.variant}
                                            size="sm"
                                            className={action.className?.(row)}
                                            onClick={() => action.onClick(row)}
                                        >
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
                                className="text-center text-muted-foreground"
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
