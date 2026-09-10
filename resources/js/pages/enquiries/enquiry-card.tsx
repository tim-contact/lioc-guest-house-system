import { router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    CircleDollarSign,
    Fuel,
    MapPin,
    RotateCcw,
    Save,
    Ship,
    Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/EnquiryController';
import {
    store as addCustomer,
    update as updateCustomer,
} from '@/actions/App/Http/Controllers/EnquiryCustomerController';
import Dot from '@/components/animata/background/dot';
import { DateRangePicker } from '@/components/date-range-picker';
import { DetailRow } from '@/components/edit-panel/fields';
import { MoneyInput } from '@/components/money-input';
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
    cn,
    dateToDateOnly,
    emptyToNull,
    formatMoney,
    portColorClasses,
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
    sanctions_screening_status?: string | null;
    sanctions_screened_at?: string | null;
    sanctions_screening_error?: string | null;
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

export interface CustomerCredit {
    credit_limit: string | null;
    credit_available: number | null;
}

export interface PortOption {
    id: number;
    name: string;
}

const ENQUIRY_STATUS_STYLE: Record<string, { card: string; badge: string }> = {
    open: {
        card: 'shadow-none',
        badge: 'border-sky-700 bg-sky-700 text-white shadow-none',
    },
    completing: {
        card: 'shadow-none',
        badge: 'border-amber-700 bg-amber-600 text-white shadow-none',
    },
};

const NEUTRAL_ENQUIRY_STATUS_STYLE = {
    card: 'shadow-none',
    badge: 'border-slate-700 bg-slate-700 text-white shadow-none',
};

function isSanctioned(enquiry: EnquiryRow): boolean {
    return enquiry.sanctions_screening_status === 'possible_match';
}

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
    creditByCustomer,
    otherCustomerIds,
    maxQuantities,
    totalBasis,
    setTotalBasis,
    setStatus,
    onDirtyChange,
    onCustomerIdChange,
    creditTermsOptions,
}: {
    customer: EnquiryCustomerRow;
    customers: CustomerOption[];
    creditByCustomer: Record<string, CustomerCredit>;
    creditTermsOptions: EnumOption[];
    otherCustomerIds: Set<string>;
    maxQuantities: Record<FuelGradeKey, string>;
    totalBasis: TotalBasis;
    setTotalBasis: (basis: TotalBasis) => void;
    setStatus: (row: EnquiryCustomerRow, status: 'fixed' | 'pending') => void;
    onDirtyChange: (id: number, dirty: boolean) => void;
    onCustomerIdChange: (id: number, customerId: string) => void;
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

    useEffect(() => {
        onCustomerIdChange(customer.id, form.data.customer_id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.customer_id, customer.id]);

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
            className={`relative z-[1] flex flex-col gap-4 rounded-xl border bg-white p-4 text-sm shadow-[0_2px_8px_rgba(16,24,40,0.06)] transition ${
                customer.status === 'fixed'
                    ? 'border-success/25 bg-success/5'
                    : customer.status === 'lost'
                      ? 'border-destructive/25 bg-destructive/5'
                      : 'border-slate-200'
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand">
                    <CircleDollarSign className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <SearchableCombobox
                        items={pickable.map((c) => ({
                            value: c.sap_id,
                            label: c.name,
                            sublabel: c.sap_id,
                        }))}
                        value={form.data.customer_id}
                        onChange={(value) =>
                            form.setData({
                                ...form.data,
                                customer_id: value,
                                credit_terms: '',
                            })
                        }
                        placeholder="Select customer"
                        searchPlaceholder="Search name or SAP ID"
                        emptyText="No customers available."
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label className="text-xs font-medium text-slate-500">
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
                        value={formatMoney(
                            creditByCustomer[form.data.customer_id]
                                ?.credit_available ?? null,
                        )}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70">
                <Table>
                    <TableHeader className="bg-slate-100/90">
                        <TableRow className="border-b-0 hover:bg-transparent">
                            <TableHead className="h-7 w-24 text-xs text-slate-500">
                                Product
                            </TableHead>
                            {FUEL_GRADES.map((product) => (
                                <TableHead
                                    key={product.key}
                                    className="h-7 min-w-20 text-xs font-semibold text-slate-700"
                                >
                                    {product.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {PRICE_ROWS.map((row) => (
                            <TableRow
                                key={row.key}
                                className="border-b-0 hover:bg-transparent"
                            >
                                <TableCell className="p-2 text-xs text-slate-500">
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
                                            className="p-2"
                                        >
                                            <MoneyInput
                                                className="h-7 rounded-sm"
                                                value={form.data[field]}
                                                onChange={(value) =>
                                                    form.setData(field, value)
                                                }
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                        <TableRow className="border-b-0 hover:bg-transparent">
                            <TableCell className="p-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-full justify-between px-1 text-xs text-slate-500"
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
                                        className="p-2 text-xs font-semibold text-slate-800 tabular-nums"
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
                    <Save className="size-3.5" />
                    Save
                </Button>
                {customer.status === 'fixed' || customer.status === 'lost' ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(customer, 'pending')}
                    >
                        <RotateCcw className="size-3.5" />
                        Revert
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-600/90"
                        onClick={() => setStatus(customer, 'fixed')}
                    >
                        <Trophy className="size-3.5" />
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
    creditByCustomer,
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
    creditByCustomer: Record<string, CustomerCredit>;
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
    // Live (including unsaved) customer_id per row, so duplicate picks are
    // caught across sibling blocks before anyone saves.
    const [liveCustomerIds, setLiveCustomerIds] = useState<
        Record<number, string>
    >({});
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

    const handleCustomerIdChange = useCallback(
        (id: number, customerId: string) => {
            setLiveCustomerIds((previous) => ({
                ...previous,
                [id]: customerId,
            }));
        },
        [],
    );

    // Once any customer is fixed the stem is committed: the losing quotes drop out of view.
    const isFixed = enquiry.customers.some((c) => c.status === 'fixed');
    const visibleCustomers = isFixed
        ? enquiry.customers.filter((c) => c.status === 'fixed')
        : enquiry.customers;

    // Customers not yet on this enquiry (including unsaved picks) are the only ones addable.
    const existing = new Set(
        enquiry.customers.map((c) => liveCustomerIds[c.id] ?? c.customer_id),
    );
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
    const portColor = portColorClasses(form.data.port_id || enquiry.port);

    return (
        <Card
            size="sm"
            className={`relative z-10 overflow-hidden rounded-[14px] border-0 shadow-none ring-0 ${portColor.card} ${statusStyle.card}`}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-35"
            >
                <Dot
                    color={portColor.patternColor}
                    size={1}
                    spacing={13}
                    className="h-full w-full"
                    style={{ backgroundColor: 'transparent' }}
                >
                    <div className="h-full w-full" />
                </Dot>
            </div>
            <CardHeader className="relative z-[1] pt-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div
                            className={cn(
                                'mb-2 flex items-center gap-2 text-xs font-semibold',
                                portColor.mutedForeground,
                            )}
                        >
                            <span>Enquiry #{enquiry.id}</span>
                            <span
                                className={cn(
                                    'size-1 rounded-full',
                                    portColor.surfaceDot,
                                )}
                            />
                            <span>{shortDate(enquiry.created_at)}</span>
                        </div>
                        <CardTitle
                            className={cn(
                                'flex min-w-0 items-center gap-2 text-lg font-bold',
                                portColor.foreground,
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1',
                                    portColor.surfaceIcon,
                                )}
                            >
                                <Ship className="size-4" />
                            </span>
                            <span className="truncate">
                                {enquiry.vessel_name || 'Untitled vessel'}
                            </span>
                        </CardTitle>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {isSanctioned(enquiry) ? (
                            <Badge
                                variant="outline"
                                className="h-6 animate-[sanctioned-soft-blink_1.5s_linear_infinite] rounded-md border-red-600 bg-red-600 px-2.5 text-[0.68rem] font-bold tracking-normal text-white uppercase shadow-none"
                            >
                                Sanctioned
                            </Badge>
                        ) : null}
                        <Badge
                            variant="outline"
                            className={`h-6 rounded-md px-2.5 font-semibold capitalize ${statusStyle.badge}`}
                        >
                            {enquiry.status}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-[1] flex flex-col gap-5">
                {/* ---- Core details ---- */}
                <form onSubmit={saveCore} className="flex flex-col gap-5">
                    <div className="relative z-[1] grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-[0_2px_8px_rgba(16,24,40,0.05)] sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label
                                htmlFor={`vessel-name-${enquiry.id}`}
                                className="text-xs font-medium text-slate-500"
                            >
                                Vessel Name
                            </Label>
                            <Input
                                id={`vessel-name-${enquiry.id}`}
                                className="h-8 rounded-sm border-slate-300 bg-white"
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

                        <div className="grid gap-2">
                            <Label
                                htmlFor={`imo-${enquiry.id}`}
                                className="text-xs font-medium text-slate-500"
                            >
                                IMO
                            </Label>
                            <Input
                                id={`imo-${enquiry.id}`}
                                className="h-8 rounded-sm border-slate-300 bg-white"
                                value={form.data.imo}
                                onChange={(e) =>
                                    form.setData('imo', e.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs font-medium text-slate-500">
                                <MapPin className="size-3.5" />
                                Port
                            </Label>
                            <NoneSelect
                                className="rounded-sm border-slate-300 bg-white"
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

                        <div className="grid gap-2">
                            <Label className="text-xs font-medium text-slate-500">
                                <CalendarDays className="size-3.5" />
                                Delivery Laycan
                            </Label>
                            <DateRangePicker
                                size="lg"
                                className="rounded-sm border-slate-300 bg-white"
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

                    <Separator className={portColor.surfaceDivider} />

                    {/* ---- Product grid ---- */}
                    <div className="relative z-[1]">
                        <div className="mb-2 flex items-center gap-2 px-1">
                            <Fuel
                                className={cn('size-4', portColor.foreground)}
                            />
                            <span
                                className={cn(
                                    'text-sm font-bold',
                                    portColor.foreground,
                                )}
                            >
                                Product requirements
                            </span>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(16,24,40,0.05)]">
                            <Table className="mb-4">
                                <TableHeader className="bg-slate-100/80">
                                    <TableRow className="rounded-sm border-b-0 hover:bg-transparent [&>th]:pb-3">
                                        <TableHead className="h-9 w-24 pt-1 pb-1 pl-5 text-xs text-slate-500">
                                            Product
                                        </TableHead>
                                        {FUEL_GRADES.map((product) => (
                                            <TableHead
                                                key={product.key}
                                                className="h-9 min-w-32 pt-3 pb-1 pl-3 text-xs font-semibold text-slate-700"
                                            >
                                                {product.label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="[&>tr:first-child>td]:pt-4">
                                    {gridRows(
                                        productTypeOptions,
                                        deliveryModeOptions,
                                    ).map((row) => (
                                        <TableRow
                                            key={row.attr}
                                            className="rounded-sm border-b-0 hover:bg-transparent"
                                        >
                                            <TableCell className="px-4 py-3 text-xs text-slate-500">
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
                                                        className="p-2"
                                                    >
                                                        {row.options ? (
                                                            <NoneSelect
                                                                size="sm"
                                                                className="rounded-sm border-slate-300 bg-white"
                                                                value={
                                                                    form.data[
                                                                        field
                                                                    ]
                                                                }
                                                                onChange={(
                                                                    value,
                                                                ) =>
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
                                                                className="h-7 rounded-sm border-slate-300 bg-white"
                                                                value={
                                                                    form.data[
                                                                        field
                                                                    ]
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
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!form.isDirty || form.processing}
                            className="border border-[#1739c9] bg-[#1739c9] font-semibold text-white shadow-none hover:bg-[#0f2ea5] focus-visible:ring-[#1739c9]/35 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
                        >
                            <Save className="size-3.5" />
                            Save
                        </Button>
                        {!isFixed && (
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="border border-[#b42318] bg-[#b42318] font-semibold text-white shadow-none hover:bg-[#8f1d15] focus-visible:ring-[#b42318]/35"
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
                            .map((c) => liveCustomerIds[c.id] ?? c.customer_id),
                    );

                    return (
                        <CustomerBlock
                            creditTermsOptions={creditTermsOptions}
                            key={customer.id}
                            customer={customer}
                            customers={customers}
                            creditByCustomer={creditByCustomer}
                            otherCustomerIds={otherCustomerIds}
                            maxQuantities={maxQuantities}
                            totalBasis={totalBasis}
                            setTotalBasis={setTotalBasis}
                            setStatus={setStatus}
                            onDirtyChange={handleCustomerDirtyChange}
                            onCustomerIdChange={handleCustomerIdChange}
                        />
                    );
                })}

                {/* ---- Add customer, or (once fixed) additional operational details ---- */}
                {isFixed ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-300 bg-white hover:bg-slate-50"
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
                                className="w-full border-slate-300 bg-white hover:bg-slate-50"
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
