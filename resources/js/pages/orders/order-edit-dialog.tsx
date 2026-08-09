import { useForm } from '@inertiajs/react';
import { update } from '@/actions/App/Http/Controllers/OrderController';
import { AgentContactFields } from '@/components/agent-contact-fields';
import { DateRangePicker } from '@/components/date-range-picker';
import {
    LabeledField,
    LabeledSelect,
    ReadOnlyValue,
} from '@/components/edit-panel/fields';
import { FormSection } from '@/components/edit-panel/form-section';
import { LockedEditDialog } from '@/components/edit-panel/locked-edit-dialog';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FUEL_GRADES } from '@/lib/domain';
import { dateToDateOnly, shortDate, toDateRange } from '@/lib/utils';
import type { AgentOption, AgentPicOption, EnumOption } from '@/types';
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
    laycan_from: string;
    laycan_to: string;
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
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: OrderEditRow;
    customers: CustomerOption[];
    ports: PortOption[];
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    deliveryModeOptions: EnumOption[];
}) {
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
        laycan_from: order.laycan_from ? order.laycan_from.slice(0, 10) : '',
        laycan_to: order.laycan_to ? order.laycan_to.slice(0, 10) : '',
    });

    const laycanRange = toDateRange(form.data.laycan_from, form.data.laycan_to);

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
        <LockedEditDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Edit Order ${order.order_number}`}
            size="xl"
            onSave={submit}
            saving={form.processing}
            summary={
                <>
                    <FormSection title="Order" cols={3}>
                        <ReadOnlyValue
                            label="Order Number"
                            value={order.order_number}
                        />
                        <ReadOnlyValue
                            label="Order Date"
                            value={shortDate(order.order_date)}
                        />
                        <ReadOnlyValue
                            label="Vessel Name"
                            value={order.vessel_name}
                        />
                        <ReadOnlyValue label="IMO No" value={order.vessel_id} />
                    </FormSection>

                    <FormSection title="Quantities" cols={3}>
                        {(['quantity_low', 'quantity_high'] as const).flatMap(
                            (bound) =>
                                FUEL_GRADES.map((product) => {
                                    const field =
                                        `${product.key}_${bound}` as keyof OrderFormData;

                                    return (
                                        <LabeledField
                                            key={field}
                                            id={`order-${field}`}
                                            label={`${product.label} ${bound === 'quantity_low' ? 'Min' : 'Max'} Qty`}
                                            type="number"
                                            value={form.data[field]}
                                            onChange={(value) =>
                                                form.setData(field, value)
                                            }
                                            placeholder="N/A"
                                        />
                                    );
                                }),
                        )}
                    </FormSection>
                </>
            }
        >
            <FormSection title="Customer">
                <div className="grid gap-1">
                    <Label>Customer</Label>
                    <SearchableCombobox
                        items={customers.map((customer) => ({
                            value: customer.sap_id,
                            label: customer.name,
                            sublabel: customer.sap_id,
                        }))}
                        value={form.data.customer_id}
                        onChange={(value) => form.setData('customer_id', value)}
                        placeholder="Select customer"
                        searchPlaceholder="Search name or SAP ID"
                        emptyText="No customers available."
                    />
                </div>
            </FormSection>

            <Separator />

            <FormSection title="Final Quantities" cols={3}>
                {FUEL_GRADES.map((product) => {
                    const field =
                        `${product.key}_final_qty` as keyof OrderFormData;

                    return (
                        <LabeledField
                            key={field}
                            id={`order-${field}`}
                            label={`${product.label} Final Qty`}
                            type="number"
                            value={form.data[field]}
                            onChange={(value) => form.setData(field, value)}
                            placeholder="N/A"
                        />
                    );
                })}
            </FormSection>

            <Separator />

            <FormSection title="Agent" cols={3}>
                <AgentContactFields
                    agents={agents}
                    agentPics={agentPics}
                    values={form.data}
                    onChange={(patch) =>
                        form.setData((data) => ({ ...data, ...patch }))
                    }
                />
            </FormSection>

            <Separator />

            <FormSection title="Delivery" cols={3}>
                <div className="grid gap-1">
                    <Label>Port of Delivery</Label>
                    <SearchableCombobox
                        items={ports.map((port) => ({
                            value: String(port.id),
                            label: port.name,
                            sublabel: `Port #${port.id}`,
                        }))}
                        value={form.data.port_id}
                        onChange={(value) => form.setData('port_id', value)}
                        placeholder="Select port"
                        searchPlaceholder="Search port"
                        emptyText="No ports available."
                    />
                </div>

                <LabeledSelect
                    label="Mode of Delivery"
                    value={form.data.delivery_mode}
                    onChange={(value) => form.setData('delivery_mode', value)}
                    options={deliveryModeOptions}
                    placeholder="Select mode"
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
            </FormSection>
        </LockedEditDialog>
    );
}
