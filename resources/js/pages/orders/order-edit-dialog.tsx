import { useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/OrderController';
import { AgentContactFields } from '@/components/agent-contact-fields';
import { DateRangePicker } from '@/components/date-range-picker';
import { LabeledSelect } from '@/components/edit-panel/fields';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FUEL_GRADES } from '@/lib/domain';
import {
    cn,
    dateToDateOnly,
    productColor,
    shortDate,
    toDateRange,
} from '@/lib/utils';
import type {
    AgentOption,
    AgentPicOption,
    EnumOption,
    SupplyLocationOption,
} from '@/types';
import {
    Building2,
    CalendarDays,
    CircleCheck,
    ContactRound,
    Fuel,
    Hash,
    PencilLine,
    Save,
    Ship,
    ShipWheel,
    TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CustomerOption, OrderEditRow, PortOption } from './dashboard';

interface OrderFormData {
    customer_id: string;
    port_id: string;
    vlsfo_quantity_low: string;
    mgo_quantity_low: string;
    hsfo_quantity_low: string;
    vlsfo_quantity_high: string;
    mgo_quantity_high: string;
    hsfo_quantity_high: string;
    vlsfo_final_qty: string;
    mgo_final_qty: string;
    hsfo_final_qty: string;
    agent_id: string;
    agent_pic_id: string;
    mobile_no: string;
    delivery_mode: string;
    delivery_location_id: string;
    laycan_from: string;
    laycan_to: string;
    compliance_checked: boolean;
}

type QuantityFieldKey = Extract<
    keyof OrderFormData,
    `${string}_quantity_low` | `${string}_quantity_high` | `${string}_final_qty`
>;

type SectionKey = 'customer' | 'products' | 'agent' | 'delivery';

interface ProductState {
    included: boolean;
    complete: boolean;
    color: string;
}

function fieldHasValue(value: string): boolean {
    return value.trim() !== '';
}

function SectionStatus({ complete }: { complete: boolean }) {
    const Icon = complete ? CircleCheck : TriangleAlert;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                complete
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700',
            )}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {complete ? 'Valid' : 'Needs attention'}
        </span>
    );
}

function PanelSection({
    active,
    children,
    icon: Icon,
    id,
    title,
    complete,
    onFocus,
}: {
    active: boolean;
    children: ReactNode;
    icon: LucideIcon;
    id: string;
    title: string;
    complete: boolean;
    onFocus: () => void;
}) {
    return (
        <section
            id={id}
            className={cn(
                'scroll-mt-24 rounded-xl border bg-blue-50/45 p-3.5 transition-colors',
                active
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                    : complete
                      ? 'border-blue-200'
                      : 'border-blue-200/80',
            )}
            onFocus={onFocus}
            onMouseEnter={onFocus}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#172033]">
                    <Icon className="size-4 text-blue-700" aria-hidden="true" />
                    {title}
                </h3>
                <SectionStatus complete={complete} />
            </div>
            {children}
        </section>
    );
}

function SingleFieldGrid({ children }: { children: ReactNode }) {
    return (
        <div className="grid gap-4 text-sm [&_label]:text-xs [&_label]:font-medium [&_label]:text-slate-500">
            {children}
        </div>
    );
}

function AgentFieldGrid({ children }: { children: ReactNode }) {
    return (
        <div className="grid gap-4 text-sm md:grid-cols-[1.2fr_0.9fr_0.75fr] [&_label]:text-xs [&_label]:font-medium [&_label]:text-slate-500">
            {children}
        </div>
    );
}

function DeliveryFieldGrid({ children }: { children: ReactNode }) {
    return (
        <div className="grid gap-4 text-sm md:grid-cols-3 [&_label]:text-xs [&_label]:font-medium [&_label]:text-slate-500">
            {children}
        </div>
    );
}

function QuantityValue({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-white backdrop-blur-sm">
            <span className="text-[11px] font-medium text-white/70">
                {label}
            </span>
            <div className="mt-1 text-sm font-semibold text-white tabular-nums">
                {value ? `${value} MT` : 'N/A'}
            </div>
        </div>
    );
}

function QuantityInput({
    disabled = false,
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}) {
    return (
        <div className="grid gap-1">
            <Label className="text-white/75" htmlFor={id}>
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type="number"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="N/A"
                    disabled={disabled}
                    className="border-white/30 bg-white pr-12 text-[#172033] placeholder:text-slate-400 disabled:border-white/10 disabled:bg-white/20 disabled:text-white/60"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    MT
                </span>
            </div>
        </div>
    );
}

export function OrderEditDialog({
    open,
    onOpenChange,
    order,
    customers,
    ports,
    agents,
    agentPics,
    deliveryModeOptions,
    supplyLocationOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: OrderEditRow;
    customers: CustomerOption[];
    ports: PortOption[];
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    deliveryModeOptions: EnumOption[];
    supplyLocationOptions: SupplyLocationOption[];
}) {
    const [activeSection, setActiveSection] = useState<SectionKey>('customer');
    const form = useForm<OrderFormData>({
        customer_id: order.customer_id ?? '',
        port_id: order.port_id ? String(order.port_id) : '',
        vlsfo_quantity_low: order.vlsfo_quantity_low ?? '',
        mgo_quantity_low: order.mgo_quantity_low ?? '',
        hsfo_quantity_low: order.hsfo_quantity_low ?? '',
        vlsfo_quantity_high: order.vlsfo_quantity_high ?? '',
        mgo_quantity_high: order.mgo_quantity_high ?? '',
        hsfo_quantity_high: order.hsfo_quantity_high ?? '',
        vlsfo_final_qty: order.vlsfo_final_qty ?? '',
        mgo_final_qty: order.mgo_final_qty ?? '',
        hsfo_final_qty: order.hsfo_final_qty ?? '',
        agent_id: order.agent_id ? String(order.agent_id) : '',
        agent_pic_id: order.agent_pic_id ? String(order.agent_pic_id) : '',
        mobile_no: order.mobile_no ?? '',
        delivery_mode: order.delivery_mode ?? '',
        delivery_location_id: order.delivery_location_id
            ? String(order.delivery_location_id)
            : '',
        laycan_from: order.laycan_from ? order.laycan_from.slice(0, 10) : '',
        laycan_to: order.laycan_to ? order.laycan_to.slice(0, 10) : '',
        compliance_checked: order.compliance_checked === true,
    });

    const laycanRange = toDateRange(form.data.laycan_from, form.data.laycan_to);
    const selectedPortId = Number(form.data.port_id);
    const productStates = FUEL_GRADES.reduce(
        (states, product, index) => {
            const lowValue = form.data[`${product.key}_quantity_low`];
            const highValue = form.data[`${product.key}_quantity_high`];
            const finalValue = form.data[`${product.key}_final_qty`];
            const included =
                fieldHasValue(lowValue) ||
                fieldHasValue(highValue) ||
                fieldHasValue(finalValue);

            states[product.key] = {
                included,
                complete: !included || fieldHasValue(finalValue),
                color: productColor(product.label, index),
            };

            return states;
        },
        {} as Record<(typeof FUEL_GRADES)[number]['key'], ProductState>,
    );
    const sectionStatus: Record<SectionKey, boolean> = {
        customer: fieldHasValue(form.data.customer_id),
        products:
            FUEL_GRADES.some(
                (product) => productStates[product.key].included,
            ) &&
            FUEL_GRADES.every((product) => productStates[product.key].complete),
        agent: fieldHasValue(form.data.agent_id),
        delivery:
            fieldHasValue(form.data.port_id) &&
            fieldHasValue(form.data.delivery_mode) &&
            fieldHasValue(form.data.delivery_location_id) &&
            fieldHasValue(form.data.laycan_from) &&
            fieldHasValue(form.data.laycan_to),
    };
    const sections: {
        key: SectionKey;
        label: string;
        icon: LucideIcon;
    }[] = [
        { key: 'customer', label: 'Customer', icon: Building2 },
        { key: 'products', label: 'Products', icon: Fuel },
        { key: 'agent', label: 'Agent', icon: ContactRound },
        { key: 'delivery', label: 'Delivery', icon: Ship },
    ];

    function activateSection(section: SectionKey) {
        setActiveSection(section);
        document
            .getElementById(`order-edit-${section}`)
            ?.scrollIntoView({ block: 'nearest' });
    }

    function submit() {
        form.submit(update(order.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="h-[100dvh] max-h-[100dvh] w-screen max-w-none rounded-none sm:h-auto sm:max-h-[90vh] sm:max-w-[940px] sm:rounded-xl"
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogHeader className="sticky top-0 z-10 gap-2 border-b border-[#E3EAF2] bg-popover pb-3">
                    <div className="flex items-start gap-3 pr-10">
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                            <PencilLine className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-base font-semibold">
                                Edit Order {order.order_number}
                            </DialogTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                    <CalendarDays
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    {shortDate(order.order_date)}
                                </span>
                                <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-[#172033]">
                                    <ShipWheel
                                        className="size-3.5 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">
                                        {order.vessel_name || 'Unnamed vessel'}
                                    </span>
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Hash
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    IMO {order.vessel_id || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid min-h-0 gap-3 overflow-hidden md:grid-cols-[128px_minmax(0,1fr)]">
                    <nav
                        className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible"
                        aria-label="Order edit sections"
                    >
                        {sections.map((section) => {
                            const active = activeSection === section.key;
                            const complete = sectionStatus[section.key];
                            const Icon = section.icon;

                            return (
                                <button
                                    key={section.key}
                                    type="button"
                                    className={cn(
                                        'flex h-10 min-w-[7.5rem] items-center justify-between gap-2 rounded-xl border px-2.5 text-left text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:outline-none md:min-w-0',
                                        active
                                            ? 'border-blue-500 bg-blue-50 text-blue-800'
                                            : complete
                                              ? 'border-blue-200 bg-blue-50/60 text-blue-700'
                                              : 'border-blue-200/80 bg-blue-50/35 text-blue-600',
                                    )}
                                    onClick={() => activateSection(section.key)}
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <Icon
                                            className={cn(
                                                'size-4 shrink-0',
                                                active
                                                    ? 'text-blue-700'
                                                    : 'text-blue-400',
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className="truncate">
                                            {section.label}
                                        </span>
                                    </span>
                                    {complete ? (
                                        <CircleCheck
                                            className="size-4 shrink-0 text-emerald-600"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <TriangleAlert
                                            className="size-4 shrink-0 text-amber-500"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="grid min-w-0 gap-3 overflow-x-hidden overflow-y-auto pr-0.5">
                        <PanelSection
                            icon={Building2}
                            id="order-edit-customer"
                            title="Customer"
                            active={activeSection === 'customer'}
                            complete={sectionStatus.customer}
                            onFocus={() => setActiveSection('customer')}
                        >
                            <SingleFieldGrid>
                                <div className="grid gap-1">
                                    <Label>Customer</Label>
                                    <SearchableCombobox
                                        items={customers.map((customer) => ({
                                            value: customer.sap_id,
                                            label: customer.name,
                                            sublabel: customer.sap_id,
                                        }))}
                                        value={form.data.customer_id}
                                        onChange={(value) =>
                                            form.setData('customer_id', value)
                                        }
                                        placeholder="Select customer"
                                        searchPlaceholder="Search name or SAP ID"
                                        emptyText="No customers available."
                                    />
                                </div>
                                <label className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-sm font-semibold text-blue-800">
                                    <Checkbox
                                        checked={form.data.compliance_checked}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'compliance_checked',
                                                checked === true,
                                            )
                                        }
                                    />
                                    Compliance checked
                                </label>
                            </SingleFieldGrid>
                        </PanelSection>

                        <PanelSection
                            icon={Fuel}
                            id="order-edit-products"
                            title="Product quantities"
                            active={activeSection === 'products'}
                            complete={sectionStatus.products}
                            onFocus={() => setActiveSection('products')}
                        >
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {FUEL_GRADES.map((product) => {
                                    const lowField =
                                        `${product.key}_quantity_low` as QuantityFieldKey;
                                    const highField =
                                        `${product.key}_quantity_high` as QuantityFieldKey;
                                    const finalField =
                                        `${product.key}_final_qty` as QuantityFieldKey;
                                    const productState =
                                        productStates[product.key];
                                    const StatusIcon = productState.complete
                                        ? CircleCheck
                                        : TriangleAlert;

                                    return (
                                        <div
                                            key={product.key}
                                            className={cn(
                                                'overflow-hidden rounded-xl border p-3 text-white shadow-sm',
                                                productState.included
                                                    ? 'border-white/15'
                                                    : 'border-slate-200 bg-slate-500 opacity-70',
                                            )}
                                            style={
                                                productState.included
                                                    ? {
                                                          backgroundColor:
                                                              productState.color,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <h4 className="flex items-center gap-2 text-sm font-bold text-white">
                                                    <Fuel
                                                        className="size-4 text-white"
                                                        aria-hidden="true"
                                                    />
                                                    {product.label}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold',
                                                        !productState.included
                                                            ? 'border-white/20 bg-white/15 text-white/75'
                                                            : productState.complete
                                                              ? 'border-white/20 bg-white/20 text-white'
                                                              : 'border-amber-200/60 bg-amber-200/20 text-amber-50',
                                                    )}
                                                >
                                                    {productState.included && (
                                                        <StatusIcon
                                                            className="size-3.5"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {!productState.included
                                                        ? 'Not included'
                                                        : productState.complete
                                                          ? 'Valid'
                                                          : 'Needs final'}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid gap-3 text-sm [&_label]:text-xs [&_label]:font-medium">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <QuantityValue
                                                        label="Minimum"
                                                        value={
                                                            form.data[lowField]
                                                        }
                                                    />
                                                    <QuantityValue
                                                        label="Maximum"
                                                        value={
                                                            form.data[highField]
                                                        }
                                                    />
                                                </div>
                                                <QuantityInput
                                                    id={`order-${finalField}`}
                                                    label="Final quantity"
                                                    value={
                                                        form.data[finalField]
                                                    }
                                                    onChange={(value) =>
                                                        form.setData(
                                                            finalField,
                                                            value,
                                                        )
                                                    }
                                                    disabled={
                                                        !productState.included
                                                    }
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </PanelSection>

                        <PanelSection
                            icon={ContactRound}
                            id="order-edit-agent"
                            title="Agent and contact"
                            active={activeSection === 'agent'}
                            complete={sectionStatus.agent}
                            onFocus={() => setActiveSection('agent')}
                        >
                            <AgentFieldGrid>
                                <AgentContactFields
                                    agents={agents}
                                    agentPics={agentPics}
                                    values={form.data}
                                    onChange={(patch) =>
                                        form.setData((data) => ({
                                            ...data,
                                            ...patch,
                                        }))
                                    }
                                />
                            </AgentFieldGrid>
                        </PanelSection>

                        <PanelSection
                            icon={Ship}
                            id="order-edit-delivery"
                            title="Delivery details"
                            active={activeSection === 'delivery'}
                            complete={sectionStatus.delivery}
                            onFocus={() => setActiveSection('delivery')}
                        >
                            <DeliveryFieldGrid>
                                <div className="grid gap-1">
                                    <Label>Port of Delivery</Label>
                                    <SearchableCombobox
                                        items={ports.map((port) => ({
                                            value: String(port.id),
                                            label: port.name,
                                            sublabel: `Port #${port.id}`,
                                        }))}
                                        value={form.data.port_id}
                                        onChange={(value) =>
                                            form.setData('port_id', value)
                                        }
                                        placeholder="Select port"
                                        searchPlaceholder="Search port"
                                        emptyText="No ports available."
                                    />
                                </div>

                                <LabeledSelect
                                    label="Mode of Delivery"
                                    value={form.data.delivery_mode}
                                    onChange={(value) =>
                                        form.setData('delivery_mode', value)
                                    }
                                    options={deliveryModeOptions}
                                    placeholder="Select mode"
                                />

                                <LabeledSelect
                                    label="Supply Location"
                                    value={form.data.delivery_location_id}
                                    onChange={(value) =>
                                        form.setData(
                                            'delivery_location_id',
                                            value,
                                        )
                                    }
                                    options={supplyLocationOptions.filter(
                                        (option) =>
                                            form.data.port_id === '' ||
                                            option.port_id === selectedPortId,
                                    )}
                                    placeholder="Select location"
                                />

                                <div className="grid gap-1">
                                    <Label>Laycan</Label>
                                    <DateRangePicker
                                        value={laycanRange}
                                        onChange={(range) => {
                                            form.setData(
                                                'laycan_from',
                                                dateToDateOnly(range?.from),
                                            );
                                            form.setData(
                                                'laycan_to',
                                                dateToDateOnly(range?.to),
                                            );
                                        }}
                                        placeholder="Pick laycan"
                                    />
                                </div>
                            </DeliveryFieldGrid>
                        </PanelSection>
                    </div>
                </div>

                <DialogFooter className="sticky bottom-0 z-10 bg-popover">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!form.isDirty || form.processing}
                        onClick={submit}
                    >
                        <Save className="size-4" aria-hidden="true" />
                        {form.processing ? 'Saving…' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
