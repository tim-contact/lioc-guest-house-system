import { ChevronDown, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { shortDate, shortDateTime } from '@/lib/utils';
import { ebdn } from '@/routes/bdns';

export const PORTS = ['Colombo', 'Trincomalee', 'Galle', 'Hambantota'] as const;

export interface OrderRow {
    id: number;
    vessel_name: string | null;
    vessel_id?: string | null;
    barge_id?: string | null;
    barge_name?: string | null;
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
    vlsfo_bdn_qty?: string | null;
    mgo_bdn_qty?: string | null;
    hsfo_bdn_qty?: string | null;
    vlsfo_quantity_low: string | null;
    mgo_quantity_low: string | null;
    hsfo_quantity_low: string | null;
    vlsfo_quantity_high: string | null;
    mgo_quantity_high: string | null;
    hsfo_quantity_high: string | null;
    product_type?: string | null;
    compliance_checked?: boolean;
    nomination_received?: boolean;
    eta: string | null;
    delivery_date?: string | null;
    has_bdn?: boolean;
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

export type OrderStatusMarker = 'compliance' | 'nomination';

interface OrderDashboardProps<T extends OrderRow> {
    ports?: string[];
    pendingOrders: T[];
    completedOrders: T[];
    pendingActions: RowAction<T>[];
    completedActions: RowAction<T>[];
    statusMarkers?: OrderStatusMarker[];
    showOperationsDetails?: boolean;
}

export default function OrderDashboard<T extends OrderRow>({
    ports = [...PORTS],
    pendingOrders,
    completedOrders,
    pendingActions,
    completedActions,
    statusMarkers = ['compliance', 'nomination'],
    showOperationsDetails = false,
}: OrderDashboardProps<T>) {
    const visiblePorts = ports.length > 0 ? ports : [...PORTS];
    const [selectedPort, setSelectedPort] = useState(visiblePorts[0]);
    const activePort = visiblePorts.includes(selectedPort)
        ? selectedPort
        : visiblePorts[0];

    useEffect(() => {
        const targetId = window.location.hash.slice(1);

        if (!['pending-orders', 'completed-orders'].includes(targetId)) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            document.getElementById(targetId)?.scrollIntoView({
                block: 'start',
            });
        });

        return () => window.cancelAnimationFrame(frameId);
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <Section
                id="pending-orders"
                title="Pending Orders"
                ports={visiblePorts}
                selectedPort={activePort}
                onPortChange={setSelectedPort}
                rows={pendingOrders}
                actions={pendingActions}
                quantitySource="ordered"
                statusMarkers={statusMarkers}
                showOperationsDetails={showOperationsDetails}
            />
            <Section
                id="completed-orders"
                title="Completed Orders (last 30 days)"
                ports={visiblePorts}
                selectedPort={activePort}
                onPortChange={setSelectedPort}
                rows={completedOrders}
                actions={completedActions}
                quantitySource="bdn"
                statusMarkers={statusMarkers}
                showOperationsDetails={showOperationsDetails}
            />
        </div>
    );
}

function Section<T extends OrderRow>({
    id,
    title,
    ports,
    selectedPort,
    onPortChange,
    rows,
    actions,
    quantitySource,
    statusMarkers,
    showOperationsDetails,
}: {
    id: string;
    title: string;
    ports: string[];
    selectedPort: string;
    onPortChange: (port: string) => void;
    rows: T[];
    actions: RowAction<T>[];
    quantitySource: 'ordered' | 'bdn';
    statusMarkers: OrderStatusMarker[];
    showOperationsDetails: boolean;
}) {
    const rowsByPort = ports.map((port) => ({
        port,
        rows: rows.filter((row) => row.port === port),
    }));

    return (
        <Collapsible
            id={id}
            defaultOpen
            className="scroll-mt-24 overflow-hidden rounded-[17px] border border-[#E3EAF2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
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
                            <PortTable
                                rows={portRows}
                                actions={actions}
                                quantitySource={quantitySource}
                                statusMarkers={statusMarkers}
                                showOperationsDetails={showOperationsDetails}
                            />
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
    quantitySource,
    statusMarkers,
    showOperationsDetails,
}: {
    rows: T[];
    actions: RowAction<T>[];
    quantitySource: 'ordered' | 'bdn';
    statusMarkers: OrderStatusMarker[];
    showOperationsDetails: boolean;
}) {
    const dateKey = quantitySource === 'bdn' ? 'delivery_date' : 'eta';
    const { sortKey, sortDir, handleSort, sorted } = useSortable(
        rows,
        dateKey,
        'asc',
        (row, key) =>
            quantitySource === 'ordered' && key === 'eta'
                ? (row.eta ?? row.laycan_from)
                : row[key],
    );
    const hasActions =
        actions.length > 0 ||
        (quantitySource === 'bdn' && rows.some((row) => row.has_bdn));
    const baseColumns: Column[] = COLUMNS.map((column) =>
        column.sortKey === 'eta'
            ? {
                  header: quantitySource === 'bdn' ? 'Completed date' : 'ETA',
                  sortKey: dateKey,
              }
            : column,
    );
    const columns: Column[] = showOperationsDetails
        ? [
              ...baseColumns.slice(0, 2),
              { header: 'Barge', sortKey: 'barge_name' },
              ...baseColumns.slice(2),
          ]
        : baseColumns;

    return (
        <TableFrame className="rounded-[14px] border-[#E3EAF2]">
            <Table>
                <TableHeader className="bg-[#EDF3FA]">
                    <TableRow className="border-[#E7EDF4] hover:bg-[#EDF3FA]">
                        {columns.map((column) => (
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
                        {hasActions && (
                            <TableHead className="h-11 px-3 text-right font-bold text-[#172033]">
                                Actions
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((row) => (
                        <TableRow
                            key={row.id}
                            className="min-h-[50px] border-[#E7EDF4] bg-white hover:bg-[#F8FAFD]"
                        >
                            <TableCell className="px-3 py-3 font-medium text-[#0F172A]">
                                <VesselNameCell
                                    row={row}
                                    statusMarkers={statusMarkers}
                                    showImo={showOperationsDetails}
                                />
                            </TableCell>
                            <TableCell className="px-3 py-3 text-[#334155]">
                                <div className="flex min-w-0 items-center gap-2">
                                    {statusMarkers.includes('nomination') && (
                                        <BooleanStatusIcon
                                            checked={
                                                row.nomination_received === true
                                            }
                                            kind="nomination"
                                        />
                                    )}
                                    <span className="min-w-0 truncate">
                                        {row.customer_name ?? '-'}
                                    </span>
                                </div>
                            </TableCell>
                            {showOperationsDetails && (
                                <TableCell className="px-3 py-3 text-[#334155]">
                                    {row.barge_name ?? row.barge_id ?? '-'}
                                </TableCell>
                            )}
                            <TableCell className="px-3 py-3 text-[#334155]">
                                {picLabel(row)}
                            </TableCell>
                            {FUEL_GRADES.map((grade) => (
                                <TableCell
                                    key={grade.key}
                                    className="px-3 py-3 font-medium text-[#334155] tabular-nums"
                                >
                                    <ProductQuantityCell
                                        quantity={quantityValueFor(
                                            row,
                                            grade.key,
                                            quantitySource,
                                        )}
                                        productType={row.product_type ?? null}
                                    />
                                </TableCell>
                            ))}
                            <TableCell className="px-3 py-3 text-[#334155] tabular-nums">
                                {quantitySource === 'bdn'
                                    ? shortDate(row.delivery_date ?? null)
                                    : row.eta
                                      ? shortDateTime(row.eta)
                                      : shortDate(row.laycan_from)}
                            </TableCell>
                            {hasActions && (
                                <TableCell className="px-3 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        {quantitySource === 'bdn' &&
                                            row.has_bdn && (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <a
                                                        href={ebdn(row.id).url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        eBDN
                                                    </a>
                                                </Button>
                                            )}
                                        {actions.map((action, index) => (
                                            <Button
                                                key={index}
                                                variant={action.variant}
                                                size="sm"
                                                className={
                                                    action.className?.(row) ??
                                                    'h-8 rounded-lg border border-[#4F75F5] bg-white px-3 text-sm font-semibold text-[#2455E6] shadow-none transition-[background-color,color,box-shadow] duration-200 hover:bg-[#2455E6] hover:text-white hover:shadow-[0_6px_14px_rgba(36,85,230,0.20)] focus-visible:ring-[#3155E7]/40'
                                                }
                                                onClick={() =>
                                                    action.onClick(row)
                                                }
                                            >
                                                <Pencil
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                                {typeof action.label ===
                                                'function'
                                                    ? action.label(row)
                                                    : action.label}
                                            </Button>
                                        ))}
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}

                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length + (hasActions ? 1 : 0)}
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

function VesselNameCell({
    row,
    statusMarkers,
    showImo,
}: {
    row: OrderRow;
    statusMarkers: OrderStatusMarker[];
    showImo: boolean;
}) {
    return (
        <div className="flex min-w-0 items-center gap-2">
            {statusMarkers.includes('compliance') && (
                <BooleanStatusIcon
                    checked={row.compliance_checked === true}
                    kind="compliance"
                />
            )}
            <div className="min-w-0">
                <span className="block truncate">{row.vessel_name ?? '-'}</span>
                {showImo && row.vessel_id && (
                    <span className="mt-0.5 block text-xs font-normal text-slate-500 tabular-nums">
                        IMO {row.vessel_id}
                    </span>
                )}
            </div>
        </div>
    );
}

function BooleanStatusIcon({
    checked,
    kind,
}: {
    checked: boolean;
    kind: 'compliance' | 'nomination';
}) {
    const label =
        kind === 'nomination'
            ? checked
                ? 'Nomination received'
                : 'Nomination not received'
            : checked
              ? 'Compliance checked'
              : 'Compliance not checked';
    const icon =
        kind === 'nomination'
            ? checked
                ? '/images/icons/nomination_received_true.png'
                : '/images/icons/nomination_received_false.png'
            : checked
              ? '/images/icons/compliance_check_true.png'
              : '/images/icons/compliance_check_false.png';

    return (
        <span
            className="inline-grid size-5 shrink-0 place-items-center"
            title={label}
            aria-label={label}
            role="img"
        >
            <img src={icon} alt="" className="size-5 object-contain" />
        </span>
    );
}

function quantityKeyFor(
    productKey: string,
    quantitySource: 'ordered' | 'bdn',
): keyof OrderRow {
    return (
        quantitySource === 'bdn' ? `${productKey}_bdn_qty` : `${productKey}_qty`
    ) as keyof OrderRow;
}

function quantityValueFor(
    row: OrderRow,
    productKey: string,
    quantitySource: 'ordered' | 'bdn',
): string | null {
    const value = row[quantityKeyFor(productKey, quantitySource)];

    if (value === null || value === undefined) {
        return null;
    }

    return String(value);
}

function ProductQuantityCell({
    quantity,
    productType,
}: {
    quantity: string | null;
    productType: string | null;
}) {
    const showProductType = productType && hasOrderedQuantity(quantity);

    return (
        <div className="grid gap-1">
            <span>{quantity ?? '-'}</span>
            {showProductType && (
                <span className="w-fit rounded-full bg-blue-50 px-1.5 py-px text-[9px] leading-none font-bold tracking-[0.08em] text-blue-600 uppercase">
                    {productTypeLabelFor(productType)}
                </span>
            )}
        </div>
    );
}

function hasOrderedQuantity(value: string | null): boolean {
    if (!value) {
        return false;
    }

    const quantities = value.match(/\d+(?:\.\d+)?/g) ?? [];

    return quantities.some((quantity) => Number(quantity) > 0);
}

function productTypeLabelFor(value: string): string {
    if (value === 'bonded') {
        return 'Bonded';
    }

    if (value === 'duty_paid') {
        return 'Duty paid';
    }

    return value;
}

function picLabel(row: OrderRow): string {
    if (!row.pic) {
        return '-';
    }

    return row.mobile_no ? `${row.pic} (${row.mobile_no})` : row.pic;
}
