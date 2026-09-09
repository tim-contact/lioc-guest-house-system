import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { update } from '@/actions/App/Http/Controllers/OperationController';
import { AgentContactFields } from '@/components/agent-contact-fields';
import { DatePicker } from '@/components/date-picker';
import { LabeledField, LabeledSelect } from '@/components/edit-panel/fields';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { Button } from '@/components/ui/button';
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

function CompactSection({
    children,
    title,
}: {
    children: React.ReactNode;
    title: string;
}) {
    return (
        <section className="rounded-xl border border-[#E3EAF2] bg-white p-4">
            <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                {title}
            </h3>
            <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2 [&_label]:text-xs [&_label]:font-medium [&_label]:text-slate-500">
                {children}
            </div>
        </section>
    );
}

function QuantityField({
    id,
    label,
    orderedQuantity,
    productType,
    value,
    onChange,
}: {
    id: string;
    label: string;
    orderedQuantity: string | null;
    productType: string | null;
    value: string;
    onChange: (value: string) => void;
}) {
    const showProductType = productType && hasOrderedQuantity(orderedQuantity);

    return (
        <div className="grid gap-1.5 rounded-xl border border-[#E3EAF2] bg-[#F8FAFC] p-3">
            <div className="grid gap-1">
                <Label htmlFor={id}>{label}</Label>
                {showProductType && (
                    <span className="w-fit rounded-full bg-blue-50 px-1.5 py-px text-[9px] leading-none font-bold tracking-[0.08em] text-blue-600 uppercase">
                        {productTypeLabelFor(productType)}
                    </span>
                )}
            </div>
            <div className="relative">
                <Input
                    id={id}
                    type="number"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="pr-12"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    MT
                </span>
            </div>
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

function orderedQuantityFor(
    order: OpsEditRow,
    productKey: string,
): string | null {
    const value = order[`${productKey}_qty` as keyof OpsEditRow];

    if (value === null || value === undefined) {
        return null;
    }

    return String(value);
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

function deliveryModeLabel(value: string | null): string {
    if (!value) {
        return 'Barge';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[760px]"
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogHeader className="gap-2">
                    <DialogTitle className="pr-10 text-base font-semibold">
                        Edit Order {order.order_number}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                        <span className="font-semibold text-foreground">
                            {order.vessel_name || 'Unnamed vessel'}
                        </span>
                        <span>IMO {order.vessel_id || '—'}</span>
                        <span>{order.port || 'No port'}</span>
                        <span>{deliveryModeLabel(order.delivery_mode)}</span>
                    </div>
                </DialogHeader>

                <div className="grid gap-4">
                    <CompactSection title="Delivery">
                        <div className="grid gap-1">
                            <Label htmlFor="ops-eta-date">ETA Date</Label>
                            <DatePicker
                                id="ops-eta-date"
                                value={dateOnlyToDate(form.data.eta_date)}
                                onChange={(date) =>
                                    form.setData(
                                        'eta_date',
                                        dateToDateOnly(date),
                                    )
                                }
                                placeholder="Pick a date"
                            />
                        </div>
                        <LabeledField
                            id="ops-eta-time"
                            label="ETA Time"
                            type="time"
                            value={form.data.eta_time}
                            onChange={(value) =>
                                form.setData('eta_time', value)
                            }
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
                    </CompactSection>

                    <CompactSection title="Final Quantities">
                        {FUEL_GRADES.filter((grade) =>
                            hasOrderedQuantity(
                                orderedQuantityFor(order, grade.key),
                            ),
                        ).map((grade) => {
                            const field =
                                `${grade.key}_final_qty` as keyof OpsFormData;
                            const orderedQuantity = orderedQuantityFor(
                                order,
                                grade.key,
                            );

                            return (
                                <QuantityField
                                    key={field}
                                    id={`ops-${grade.key}-final`}
                                    label={`${grade.label} Final Qty`}
                                    orderedQuantity={orderedQuantity}
                                    productType={order.product_type}
                                    value={form.data[field]}
                                    onChange={(value) =>
                                        form.setData(field, value)
                                    }
                                />
                            );
                        })}
                    </CompactSection>

                    <CompactSection title="Agent & Contact">
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
                            contactNumberReadOnly
                        />
                    </CompactSection>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={form.processing}
                        onClick={submit}
                    >
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
