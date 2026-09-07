import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { update } from '@/actions/App/Http/Controllers/OperationController';
import { AgentContactFields } from '@/components/agent-contact-fields';
import { DatePicker } from '@/components/date-picker';
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
import { dateOnlyToDate, dateToDateOnly } from '@/lib/utils';
import type {
    AgentOption,
    AgentPicOption,
    SupplyLocationOption,
} from '@/types';
import type { BargeOption, OpsEditRow } from './dashboard';

interface OpsFormData {
    eta_date: string;
    eta_time: string;
    delivery_location_id: string;
    barge_id: string;
    vlsfo_final_qty: string;
    mgo_final_qty: string;
    hsfo_final_qty: string;
    agent_id: string;
    agent_pic_id: string;
    mobile_no: string;
}

export function OrderEditDialog({
    open,
    onOpenChange,
    order,
    barges,
    agents,
    agentPics,
    supplyLocationOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: OpsEditRow;
    barges: BargeOption[];
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    supplyLocationOptions: SupplyLocationOption[];
}) {
    const eta = order.eta ? new Date(order.eta) : null;
    const validEta = eta && !Number.isNaN(eta.getTime()) ? eta : null;
    const canAssignBarge =
        order.delivery_mode === undefined ||
        order.delivery_mode === null ||
        order.delivery_mode === '' ||
        order.delivery_mode === 'barge';

    const form = useForm<OpsFormData>({
        eta_date: validEta ? format(validEta, 'yyyy-MM-dd') : '',
        eta_time: validEta ? format(validEta, 'HH:mm') : '',
        delivery_location_id: order.delivery_location_id
            ? String(order.delivery_location_id)
            : '',
        barge_id: canAssignBarge ? (order.barge_id ?? '') : '',
        vlsfo_final_qty: order.vlsfo_final_qty ?? '',
        mgo_final_qty: order.mgo_final_qty ?? '',
        hsfo_final_qty: order.hsfo_final_qty ?? '',
        agent_id: order.agent_id ? String(order.agent_id) : '',
        agent_pic_id: order.agent_pic_id ? String(order.agent_pic_id) : '',
        mobile_no: order.mobile_no ?? '',
    });
    const isBargeDelivery =
        order.delivery_mode === null || order.delivery_mode === 'barge';

    function submit() {
        form.transform((data) => ({
            ...data,
            barge_id: isBargeDelivery ? data.barge_id : null,
            eta: data.eta_date
                ? `${data.eta_date}T${data.eta_time || '00:00'}`
                : null,
        }));

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
                <FormSection title="Order" cols={3}>
                    <ReadOnlyValue
                        label="Order Number"
                        value={order.order_number}
                    />
                    <ReadOnlyValue
                        label="Vessel Name"
                        value={order.vessel_name}
                    />
                    <ReadOnlyValue label="IMO No" value={order.vessel_id} />
                </FormSection>
            }
        >
            <FormSection title="Delivery">
                <div className="grid gap-1">
                    <Label htmlFor="ops-eta-date">ETA Date</Label>
                    <DatePicker
                        id="ops-eta-date"
                        value={dateOnlyToDate(form.data.eta_date)}
                        onChange={(date) =>
                            form.setData('eta_date', dateToDateOnly(date))
                        }
                        placeholder="Pick a date"
                    />
                </div>
                <LabeledField
                    id="ops-eta-time"
                    label="ETA Time"
                    type="time"
                    value={form.data.eta_time}
                    onChange={(value) => form.setData('eta_time', value)}
                />
                <LabeledSelect
                    label="Supply Location"
                    value={form.data.delivery_location_id}
                    onChange={(value) =>
                        form.setData('delivery_location_id', value)
                    }
                    options={supplyLocationOptions.filter(
                        (option) =>
                            order.port_id === null ||
                            option.port_id === order.port_id,
                    )}
                    placeholder="Select location"
                />

                {isBargeDelivery && (
                    <div className="grid gap-1">
                        <Label>Barge Name</Label>
                        <SearchableCombobox
                            items={[
                                {
                                    value: '',
                                    label: 'No barge',
                                    sublabel: 'Unassigned',
                                },
                                ...barges.map((barge) => ({
                                    value: barge.imo,
                                    label: barge.name,
                                    sublabel: `IMO ${barge.imo}`,
                                })),
                            ]}
                            value={form.data.barge_id}
                            onChange={(value) =>
                                form.setData('barge_id', value)
                            }
                            placeholder="Select barge"
                            searchPlaceholder="Search name or IMO"
                            emptyText="No barges available."
                        />
                    </div>
                )}
            </FormSection>

            <Separator />

            <FormSection title="Final Quantities" cols={3}>
                {FUEL_GRADES.map((grade) => {
                    const field = `${grade.key}_final_qty` as keyof OpsFormData;

                    return (
                        <LabeledField
                            key={field}
                            id={`ops-${grade.key}-final`}
                            label={`${grade.label} Final Qty`}
                            type="number"
                            value={form.data[field]}
                            onChange={(value) => form.setData(field, value)}
                        />
                    );
                })}
            </FormSection>

            <Separator />

            <FormSection title="Agent & Contact" cols={3}>
                <AgentContactFields
                    agents={agents}
                    agentPics={agentPics}
                    values={form.data}
                    onChange={(patch) =>
                        form.setData((data) => ({ ...data, ...patch }))
                    }
                />
            </FormSection>
        </LockedEditDialog>
    );
}
