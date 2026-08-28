import { router, useForm } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/EnquiryController';
import {
    store as addCustomer,
    update as updateCustomer,
} from '@/actions/App/Http/Controllers/EnquiryCustomerController';
import { DateRangePicker } from '@/components/date-range-picker';
import { DetailRow } from '@/components/edit-panel/fields';
import { NoneSelect } from '@/components/none-select';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FUEL_GRADES } from '@/lib/domain';
import type { FuelGradeKey } from '@/lib/domain';
import {
    dateToDateOnly,
    emptyToNull,
    formatMoney,
    shortDate,
    toDateRange,
} from '@/lib/utils';
import { updateStatus } from '@/routes/enquiry-customers';
import type { AgentOption, EnumOption, SupplyLocationOption } from '@/types';
import { AdditionalDetailsDialog } from './additional-details-dialog';
import { LostDialog } from './lost-dialog';

export interface EnquiryCustomerRow {
    id: number;
    customer_id: string;
    name: string | null;
    credit_limit: string | null;
    credit_available: number | null;
    credit_terms: string | null;
    status: string; // pending | fixed | lost
    vlsfo_initial_offer: string | null;
    vlsfo_feedback_price: string | null;
    vlsfo_fixing_counter: string | null;
    mgo_initial_offer: string | null;
    mgo_feedback_price: string | null;
    mgo_fixing_counter: string | null;
    hsfo_initial_offer: string | null;
    hsfo_feedback_price: string | null;
    hsfo_fixing_counter: string | null;
}

export interface EnquiryRow {
    id: number;
    created_at: string;
    vessel_name: string | null;
    imo: string | null;
    port_id: number | null;
    port: string | null;
    laycan_from: string | null;
    laycan_to: string | null;
    status: string;
    agent_id: number | null;
    sampling: string; // barge_manifold | vessel_manifold
    supply_location_id: number | null;
    supply_location: string | null;
    quality_claim: string | null; // 14_days | 30_days
    instructions: string | null;
    barging_cost: string | null;
    customers: EnquiryCustomerRow[];
    // Product details, flattened per product (vlsfo/mgo/hsfo).
    vlsfo_quantity_low: string | null;
    vlsfo_quantity_high: string | null;
    vlsfo_product_type: string | null; // bonded | duty_paid
    vlsfo_delivery_mode: string | null; // barge | truck | pipeline
    mgo_quantity_low: string | null;
    mgo_quantity_high: string | null;
    mgo_product_type: string | null;
    mgo_delivery_mode: string | null;
    hsfo_quantity_low: string | null;
    hsfo_quantity_high: string | null;
    hsfo_product_type: string | null;
    hsfo_delivery_mode: string | null;
}

export interface CustomerOption {
    sap_id: string;
    name: string;
}

export interface PortOption {
    id: number;
    name: string;
}

const ENQUIRY_STATUS_STYLE: Record<string, { ring: string; badge: string }> = {
    open: {
        ring: 'ring-[3px] ring-info/40',
        badge: 'bg-info/20 text-info font-semibold',
    },
    completing: {
        ring: 'ring-[3px] ring-warning/40',
        badge: 'bg-warning/20 text-warning font-semibold',
    },
};

const NEUTRAL_ENQUIRY_STATUS_STYLE = {
    ring: 'ring-[3px] ring-foreground/40',
    badge: '',
};

const PRICE_ROWS = [
    { key: 'initial_offer', label: 'Initial Offer' },
    { key: 'feedback_price', label: 'Feedback' },
    { key: 'fixing_counter', label: 'Fixing Counter' },
] as const;

type PriceRowKey = (typeof PRICE_ROWS)[number]['key'];

/** Which price the stem totals are multiplied out from; 'latest' resolves per product. */
type TotalBasis = 'latest' | PriceRowKey;

const TOTAL_BASES: { key: TotalBasis; label: string }[] = [
    { key: 'latest', label: 'Latest' },
    ...PRICE_ROWS.map((row) => ({
        key: row.key as TotalBasis,
        label: row.label,
    })),
];

// Newest quote first: 'latest' takes whichever of these is filled in first.
const LATEST_PRICE_ORDER = [
    'fixing_counter',
    'feedback_price',
    'initial_offer',
] as const;

function priceField(product: FuelGradeKey, row: PriceRowKey) {
    return `${product}_${row}` as keyof CustomerFormData;
}

/** The price row a product's total is drawn from, or null when no price is filled in. */
function resolveBasis(
    data: CustomerFormData,
    product: FuelGradeKey,
    basis: TotalBasis,
): PriceRowKey | null {
    if (basis !== 'latest') {
        return data[priceField(product, basis)] === '' ? null : basis;
    }

    return (
        LATEST_PRICE_ORDER.find(
            (row) => data[priceField(product, row)] !== '',
        ) ?? null
    );
}

type ProductAttr =
    | 'quantity_low'
    | 'quantity_high'
    | 'product_type'
    | 'delivery_mode';

function productField(product: FuelGradeKey, attr: ProductAttr) {
    return `${product}_${attr}` as keyof CoreFormData;
}

/** price × maximum quantity for one product, or null when either side is missing. */
function stemTotal(price: string, maxQuantity: string): string | null {
    const total = Number(price) * Number(maxQuantity);

    if (price === '' || maxQuantity === '' || !Number.isFinite(total)) {
        return null;
    }

    return String(total);
}

// One row per product attribute in the core product grid; `options` marks a
// select (vs. a numeric input).
function gridRows(
    productTypeOptions: EnumOption[],
    deliveryModeOptions: EnumOption[],
): { label: string; attr: ProductAttr; options?: EnumOption[] }[] {
    return [
        { label: 'Minimum Qty', attr: 'quantity_low' },
        { label: 'Maximum Qty', attr: 'quantity_high' },
        { label: 'Type', attr: 'product_type', options: productTypeOptions },
        { label: 'Mode', attr: 'delivery_mode', options: deliveryModeOptions },
    ];
}

interface CoreFormData {
    vessel_name: string;
    imo: string;
    port_id: string;
    laycan_from: string;
    laycan_to: string;
    vlsfo_quantity_low: string;
    vlsfo_quantity_high: string;
    vlsfo_product_type: string;
    vlsfo_delivery_mode: string;
    mgo_quantity_low: string;
    mgo_quantity_high: string;
    mgo_product_type: string;
    mgo_delivery_mode: string;
    hsfo_quantity_low: string;
    hsfo_quantity_high: string;
    hsfo_product_type: string;
    hsfo_delivery_mode: string;
}

interface CustomerFormData {
    customer_id: string;
    credit_terms: string;
    vlsfo_initial_offer: string;
    vlsfo_feedback_price: string;
    vlsfo_fixing_counter: string;
    mgo_initial_offer: string;
    mgo_feedback_price: string;
    mgo_fixing_counter: string;
    hsfo_initial_offer: string;
    hsfo_feedback_price: string;
    hsfo_fixing_counter: string;
}

function CustomerBlock({
    customer,
    customers,
    otherCustomerIds,
    maxQuantities,
    totalBasis,
    setTotalBasis,
    setStatus,
    onDirtyChange,
    creditTermsOptions,
}: {
    customer: EnquiryCustomerRow;
    customers: CustomerOption[];
    creditTermsOptions: EnumOption[];
    otherCustomerIds: Set<string>;
    maxQuantities: Record<FuelGradeKey, string>;
    totalBasis: TotalBasis;
    setTotalBasis: (basis: TotalBasis) => void;
    setStatus: (row: EnquiryCustomerRow, status: 'fixed' | 'pending') => void;
    onDirtyChange: (id: number, dirty: boolean) => void;
}) {
    const form = useForm<CustomerFormData>({
        customer_id: customer.customer_id,
        credit_terms: customer.credit_terms ?? '',
        vlsfo_initial_offer: customer.vlsfo_initial_offer ?? '',
        vlsfo_feedback_price: customer.vlsfo_feedback_price ?? '',
        vlsfo_fixing_counter: customer.vlsfo_fixing_counter ?? '',
        mgo_initial_offer: customer.mgo_initial_offer ?? '',
        mgo_feedback_price: customer.mgo_feedback_price ?? '',
        mgo_fixing_counter: customer.mgo_fixing_counter ?? '',
        hsfo_initial_offer: customer.hsfo_initial_offer ?? '',
        hsfo_feedback_price: customer.hsfo_feedback_price ?? '',
        hsfo_fixing_counter: customer.hsfo_fixing_counter ?? '',
    });

    useEffect(() => {
        onDirtyChange(customer.id, form.isDirty);

        return () => onDirtyChange(customer.id, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.isDirty, customer.id]);

    // Anyone not already on this enquiry, plus whoever is currently picked for this block.
    const pickable = customers.filter(
        (c) =>
            !otherCustomerIds.has(c.sap_id) ||
            c.sap_id === form.data.customer_id,
    );

    function save(event: React.FormEvent) {
        event.preventDefault();

        form.transform((data) => ({
            ...emptyToNull(data),
            customer_id: data.customer_id,
        }));

        form.submit(updateCustomer(customer.id), {
            preserveScroll: true,
            onSuccess: () => form.setDefaults(),
        });
    }

    return (
        <form
            onSubmit={save}
            className={`flex flex-col gap-2 rounded-md border-l-4 py-2.5 pr-3 pl-3 text-sm transition ${
                customer.status === 'fixed'
                    ? 'border-l-success bg-success/15'
                    : customer.status === 'lost'
                      ? 'border-l-destructive bg-destructive/15'
                      : 'border-l-border bg-muted/10'
            }`}
        >
            <SearchableCombobox
                items={pickable.map((c) => ({
                    value: c.sap_id,
                    label: c.name,
                    sublabel: c.sap_id,
                }))}
                value={form.data.customer_id}
                onChange={(value) => form.setData('customer_id', value)}
                placeholder="Select customer"
                searchPlaceholder="Search name or SAP ID"
                emptyText="No customers available."
            />

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">
                        Credit Terms
                    </Label>
                    <NoneSelect
                        size="sm"
                        value={form.data.credit_terms}
                        onChange={(value) =>
                            form.setData('credit_terms', value)
                        }
                        options={creditTermsOptions}
                    />
                </div>
                <div className="grid content-end">
                    <DetailRow
                        label="Credit Available"
                        value={formatMoney(customer.credit_available)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto rounded-md border bg-muted/70">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="h-7 w-24 text-xs">
                                Product
                            </TableHead>
                            {FUEL_GRADES.map((product) => (
                                <TableHead
                                    key={product.key}
                                    className="h-7 min-w-20 text-xs"
                                >
                                    {product.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {PRICE_ROWS.map((row) => (
                            <TableRow key={row.key}>
                                <TableCell className="p-1 text-xs text-muted-foreground">
                                    {row.label}
                                </TableCell>
                                {FUEL_GRADES.map((product) => {
                                    const field = priceField(
                                        product.key,
                                        row.key,
                                    );

                                    return (
                                        <TableCell
                                            key={product.key}
                                            className="p-1"
                                        >
                                            <Input
                                                type="number"
                                                className="h-7"
                                                value={form.data[field]}
                                                onChange={(e) =>
                                                    form.setData(
                                                        field,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell className="p-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-full justify-between px-1 text-xs text-muted-foreground"
                                        >
                                            {`Total: ${
                                                TOTAL_BASES.find(
                                                    (basis) =>
                                                        basis.key ===
                                                        totalBasis,
                                                )?.label
                                            }`}
                                            <ChevronDown className="size-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {TOTAL_BASES.map((basis) => (
                                            <DropdownMenuItem
                                                key={basis.key}
                                                onSelect={() =>
                                                    setTotalBasis(basis.key)
                                                }
                                            >
                                                {basis.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            {FUEL_GRADES.map((product) => {
                                const row = resolveBasis(
                                    form.data,
                                    product.key,
                                    totalBasis,
                                );
                                const total = row
                                    ? stemTotal(
                                          form.data[
                                              priceField(product.key, row)
                                          ],
                                          maxQuantities[product.key],
                                      )
                                    : null;

                                return (
                                    <TableCell
                                        key={product.key}
                                        className="p-1 px-2 text-xs font-medium tabular-nums"
                                        title={
                                            totalBasis === 'latest' && row
                                                ? `${PRICE_ROWS.find((priceRow) => priceRow.key === row)?.label} × ${maxQuantities[product.key] || '—'}`
                                                : undefined
                                        }
                                    >
                                        {formatMoney(total)}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <div className="mt-1 flex items-center justify-end gap-2">
                <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={!form.isDirty || form.processing}
                >
                    Save
                </Button>
                {customer.status === 'fixed' || customer.status === 'lost' ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(customer, 'pending')}
                    >
                        Revert
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setStatus(customer, 'fixed')}
                    >
                        Fixed
                    </Button>
                )}
            </div>
        </form>
    );
}

export function EnquiryCard({
    enquiry,
    customers,
    ports,
    agents,
    supplyLocationOptions,
    productTypeOptions,
    deliveryModeOptions,
    creditTermsOptions,
    samplingOptions,
    qualityClaimOptions,
}: {
    enquiry: EnquiryRow;
    customers: CustomerOption[];
    ports: PortOption[];
    agents: AgentOption[];
    supplyLocationOptions: SupplyLocationOption[];
    productTypeOptions: EnumOption[];
    deliveryModeOptions: EnumOption[];
    creditTermsOptions: EnumOption[];
    samplingOptions: EnumOption[];
    qualityClaimOptions: EnumOption[];
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [picked, setPicked] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
    const [lostOpen, setLostOpen] = useState(false);
    const [dirtyCustomerIds, setDirtyCustomerIds] = useState<Set<number>>(
        new Set(),
    );
    // Shared across this card's customers so their totals stay comparable.
    const [totalBasis, setTotalBasis] = useState<TotalBasis>('latest');

    const handleCustomerDirtyChange = useCallback(
        (id: number, dirty: boolean) => {
            setDirtyCustomerIds((previous) => {
                const next = new Set(previous);

                if (dirty) {
                    next.add(id);
                } else {
                    next.delete(id);
                }

                return next;
            });
        },
        [],
    );

    // Once any customer is fixed the stem is committed: the losing quotes drop out of view.
    const isFixed = enquiry.customers.some((c) => c.status === 'fixed');
    const visibleCustomers = isFixed
        ? enquiry.customers.filter((c) => c.status === 'fixed')
        : enquiry.customers;

    // Customers not yet on this enquiry are the only ones addable.
    const existing = new Set(enquiry.customers.map((c) => c.customer_id));
    const available = customers.filter((c) => !existing.has(c.sap_id));

    const form = useForm<CoreFormData>({
        vessel_name: enquiry.vessel_name ?? '',
        imo: enquiry.imo ?? '',
        port_id: enquiry.port_id ? String(enquiry.port_id) : '',
        laycan_from: enquiry.laycan_from
            ? enquiry.laycan_from.slice(0, 10)
            : '',
        laycan_to: enquiry.laycan_to ? enquiry.laycan_to.slice(0, 10) : '',
        vlsfo_quantity_low: enquiry.vlsfo_quantity_low ?? '',
        vlsfo_quantity_high: enquiry.vlsfo_quantity_high ?? '',
        vlsfo_product_type: enquiry.vlsfo_product_type ?? '',
        vlsfo_delivery_mode: enquiry.vlsfo_delivery_mode ?? '',
        mgo_quantity_low: enquiry.mgo_quantity_low ?? '',
        mgo_quantity_high: enquiry.mgo_quantity_high ?? '',
        mgo_product_type: enquiry.mgo_product_type ?? '',
        mgo_delivery_mode: enquiry.mgo_delivery_mode ?? '',
        hsfo_quantity_low: enquiry.hsfo_quantity_low ?? '',
        hsfo_quantity_high: enquiry.hsfo_quantity_high ?? '',
        hsfo_product_type: enquiry.hsfo_product_type ?? '',
        hsfo_delivery_mode: enquiry.hsfo_delivery_mode ?? '',
    });

    const laycanRange = toDateRange(form.data.laycan_from, form.data.laycan_to);

    // Live (including unsaved) maximum quantities the customer totals multiply out.
    const maxQuantities = Object.fromEntries(
        FUEL_GRADES.map((product) => [
            product.key,
            form.data[productField(product.key, 'quantity_high')],
        ]),
    ) as Record<FuelGradeKey, string>;

    const hasUnsavedChanges = form.isDirty || dirtyCustomerIds.size > 0;

    function submitDetails() {
        if (hasUnsavedChanges) {
            setConfirmSubmitOpen(true);
        } else {
            setDetailsOpen(true);
        }
    }

    function setProductField(
        product: (typeof FUEL_GRADES)[number]['key'],
        attr: ProductAttr,
        value: string,
    ) {
        form.setData(productField(product, attr), value);
    }

    function saveCore(event: React.FormEvent) {
        event.preventDefault();

        form.transform(emptyToNull);

        form.submit(update(enquiry.id), {
            preserveScroll: true,
            onSuccess: () => form.setDefaults(),
        });
    }

    function setStatus(row: EnquiryCustomerRow, status: 'fixed' | 'pending') {
        router.patch(
            updateStatus(row.id).url,
            { status },
            { preserveScroll: true },
        );
    }

    function submitAddCustomer() {
        if (!picked) {
            return;
        }

        router.post(
            addCustomer(enquiry.id).url,
            { customer_id: picked },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPicked('');
                    setAddOpen(false);
                },
            },
        );
    }

    const statusStyle =
        ENQUIRY_STATUS_STYLE[enquiry.status] ?? NEUTRAL_ENQUIRY_STATUS_STYLE;

    return (
        <Card size="sm" className={statusStyle.ring}>
            <CardHeader data-drag-scroll-handle className="cursor-grab">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <CardTitle>
                            {enquiry.vessel_name || 'Untitled vessel'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Enquiry #{enquiry.id} ·{' '}
                            {shortDate(enquiry.created_at)}
                        </p>
                    </div>
                    <Badge
                        variant="secondary"
                        className={`capitalize ${statusStyle.badge}`}
                    >
                        {enquiry.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {/* ---- Core details ---- */}
                <form onSubmit={saveCore} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label htmlFor={`vessel-name-${enquiry.id}`}>
                                Vessel Name
                            </Label>
                            <Input
                                id={`vessel-name-${enquiry.id}`}
                                className="h-7"
                                value={form.data.vessel_name}
                                onChange={(e) =>
                                    form.setData('vessel_name', e.target.value)
                                }
                            />
                            {form.errors.vessel_name && (
                                <p className="text-sm text-destructive">
                                    {form.errors.vessel_name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor={`imo-${enquiry.id}`}>IMO</Label>
                            <Input
                                id={`imo-${enquiry.id}`}
                                className="h-7"
                                value={form.data.imo}
                                onChange={(e) =>
                                    form.setData('imo', e.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label>Port</Label>
                            <NoneSelect
                                size="sm"
                                value={form.data.port_id}
                                onChange={(value) =>
                                    form.setData('port_id', value)
                                }
                                options={ports.map((port) => ({
                                    value: String(port.id),
                                    label: port.name,
                                }))}
                                noneLabel="No port"
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label>Delivery Laycan</Label>
                            <DateRangePicker
                                size="sm"
                                value={laycanRange}
                                onChange={(range) => {
                                    form.setData({
                                        ...form.data,
                                        laycan_from: dateToDateOnly(
                                            range?.from,
                                        ),
                                        laycan_to: dateToDateOnly(range?.to),
                                    });
                                }}
                                placeholder="Pick delivery window"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* ---- Product grid ---- */}
                    <div className="overflow-x-auto rounded-md border bg-muted/70">
                        <Table>
                            <TableHeader className="bg-muted">
                                <TableRow>
                                    <TableHead className="h-7 w-24 text-xs">
                                        Product
                                    </TableHead>
                                    {FUEL_GRADES.map((product) => (
                                        <TableHead
                                            key={product.key}
                                            className="h-7 min-w-28 text-xs"
                                        >
                                            {product.label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gridRows(
                                    productTypeOptions,
                                    deliveryModeOptions,
                                ).map((row) => (
                                    <TableRow key={row.attr}>
                                        <TableCell className="p-1.5 text-xs text-muted-foreground">
                                            {row.label}
                                        </TableCell>
                                        {FUEL_GRADES.map((product) => {
                                            const field = productField(
                                                product.key,
                                                row.attr,
                                            );

                                            return (
                                                <TableCell
                                                    key={product.key}
                                                    className="p-1.5"
                                                >
                                                    {row.options ? (
                                                        <NoneSelect
                                                            size="sm"
                                                            value={
                                                                form.data[field]
                                                            }
                                                            onChange={(value) =>
                                                                setProductField(
                                                                    product.key,
                                                                    row.attr,
                                                                    value,
                                                                )
                                                            }
                                                            options={
                                                                row.options
                                                            }
                                                        />
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            className="h-7"
                                                            value={
                                                                form.data[field]
                                                            }
                                                            onChange={(e) =>
                                                                setProductField(
                                                                    product.key,
                                                                    row.attr,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!form.isDirty || form.processing}
                        >
                            Save
                        </Button>
                        {!isFixed && (
                            <Button
                                type="button"
                                size="sm"
                                className="bg-destructive text-foreground hover:bg-destructive/90"
                                onClick={() => setLostOpen(true)}
                            >
                                Lost
                            </Button>
                        )}
                    </div>
                </form>

                {/* ---- Customer quote blocks ---- */}
                {visibleCustomers.map((customer) => {
                    const otherCustomerIds = new Set(
                        enquiry.customers
                            .filter((c) => c.id !== customer.id)
                            .map((c) => c.customer_id),
                    );

                    return (
                        <CustomerBlock
                            creditTermsOptions={creditTermsOptions}
                            key={customer.id}
                            customer={customer}
                            customers={customers}
                            otherCustomerIds={otherCustomerIds}
                            maxQuantities={maxQuantities}
                            totalBasis={totalBasis}
                            setTotalBasis={setTotalBasis}
                            setStatus={setStatus}
                            onDirtyChange={handleCustomerDirtyChange}
                        />
                    );
                })}

                {/* ---- Add customer, or (once fixed) additional operational details ---- */}
                {isFixed ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={submitDetails}
                    >
                        Add additional details & submit
                    </Button>
                ) : (
                    <Popover open={addOpen} onOpenChange={setAddOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                + Add Customer
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-72">
                            <div className="flex flex-col gap-2">
                                <SearchableCombobox
                                    items={available.map((customer) => ({
                                        value: customer.sap_id,
                                        label: customer.name,
                                        sublabel: customer.sap_id,
                                    }))}
                                    value={picked}
                                    onChange={setPicked}
                                    placeholder="Select customer"
                                    searchPlaceholder="Search name or SAP ID"
                                    emptyText="No more customers to add."
                                />
                                <Button
                                    type="button"
                                    onClick={submitAddCustomer}
                                    disabled={!picked}
                                >
                                    Add
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </CardContent>

            <AdditionalDetailsDialog
                samplingOptions={samplingOptions}
                qualityClaimOptions={qualityClaimOptions}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                enquiry={enquiry}
                agents={agents}
                supplyLocationOptions={supplyLocationOptions}
            />

            <Dialog
                open={confirmSubmitOpen}
                onOpenChange={setConfirmSubmitOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unsaved changes</DialogTitle>
                        <DialogDescription>
                            This enquiry has unsaved edits that won&apos;t be
                            included if you continue. Go back and save them
                            first, or proceed anyway?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmSubmitOpen(false)}
                        >
                            Go back
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setConfirmSubmitOpen(false);
                                setDetailsOpen(true);
                            }}
                        >
                            Proceed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <LostDialog
                open={lostOpen}
                onOpenChange={setLostOpen}
                enquiryId={enquiry.id}
            />
        </Card>
    );
}
