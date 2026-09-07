import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/BdnController';
import { DatePicker } from '@/components/date-picker';
import { DateTimePicker } from '@/components/date-time-picker';
import {
    LabeledField,
    ReadOnlyField,
    ReadOnlyValue,
} from '@/components/edit-panel/fields';
import { FormSection } from '@/components/edit-panel/form-section';
import { SummaryBand } from '@/components/edit-panel/summary-band';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAutosave } from '@/hooks/use-autosave';
import type { AutosaveStatus } from '@/hooks/use-autosave';
import { QUALITY_FIELDS, SEALS, TIMESHEET_FIELDS } from '@/lib/bdn-fields';
import { cn, dateOnlyToDate, dateToDateOnly } from '@/lib/utils';
import { complete } from '@/routes/surveyor';
import type { AgentOption, EnumOption, SupplyLocationOption } from '@/types';
import type { BargeOption, PendingRow } from './dashboard';

const DECLARATIONS = [
    {
        field: 'chief_engineer_invited',
        label: "Ship's Chief Engineer Invited to Witness Sounding / Ullages",
    },
    {
        field: 'chief_engineer_witnessed',
        label: "Ship's Chief Engineer Witnessed Sounding / Ullages",
    },
    {
        field: 'retained_samples_handed_over',
        label: "Retained Samples of this Delivery was handed over to Ship's Chief Engineer",
    },
] as const;

const STATUS_LABELS: Record<AutosaveStatus, string> = {
    idle: 'Changes save automatically',
    pending: 'Unsaved changes…',
    saving: 'Saving…',
    saved: 'All changes saved',
    error: 'Could not save.',
};

export interface BdnRow {
    bdn_number: string | null;
    [field: string]: string | number | boolean | null;
}

type BdnFormData = Record<string, string>;

/** Booleans become '1'/'0' so Laravel's boolean rule accepts them; '' means unset. */
function text(value: BdnRow[string] | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }

    return String(value);
}

function buildFormData(order: PendingRow): BdnFormData {
    const bdn = order.bdn;

    const data: BdnFormData = {
        // The date cast serialises a full ISO string; the pickers want the day.
        delivery_date:
            text(bdn?.delivery_date).slice(0, 10) ||
            (order.eta ?? '').slice(0, 10),
        delivery_location_id:
            text(bdn?.delivery_location_id) ||
            (order.delivery_location_id
                ? String(order.delivery_location_id)
                : ''),
        vessel_flag: text(bdn?.vessel_flag),
        grt: text(bdn?.grt),
        pi_club: text(bdn?.pi_club),
        agent_id: text(bdn?.agent_id) || text(order.agent_id),
        owner_operator: text(bdn?.owner_operator),
        last_port_of_call: text(bdn?.last_port_of_call),
        destination_port: text(bdn?.destination_port),
        delivery_method:
            text(bdn?.delivery_method) || (order.delivery_mode ?? ''),
        barge_id:
            order.delivery_mode === null || order.delivery_mode === 'barge'
                ? text(bdn?.barge_id) || (order.barge_id ?? '')
                : '',
        barge_alongside_at: text(bdn?.barge_alongside_at),
        chief_engineer_invited: text(bdn?.chief_engineer_invited),
        chief_engineer_witnessed: text(bdn?.chief_engineer_witnessed),
        retained_samples_handed_over: text(bdn?.retained_samples_handed_over),
        sampling_location: text(bdn?.sampling_location),
        sampling_method: text(bdn?.sampling_method),
    };

    for (const { value: grade } of order.grades) {
        for (const { field } of [...TIMESHEET_FIELDS, ...QUALITY_FIELDS]) {
            data[`${grade}_${field}`] = text(bdn?.[`${grade}_${field}`]);
        }
    }

    for (const { prefix } of SEALS) {
        data[`${prefix}_seal_number`] = text(bdn?.[`${prefix}_seal_number`]);
        data[`${prefix}_counter_seal_number`] = text(
            bdn?.[`${prefix}_counter_seal_number`],
        );
    }

    return data;
}

function DateTimeField({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-1">
            <Label htmlFor={id}>{label}</Label>
            <DateTimePicker id={id} value={value} onChange={onChange} />
        </div>
    );
}

function LabeledSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: EnumOption[];
    placeholder: string;
}) {
    return (
        <div className="grid gap-1">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function BdnDialog({
    open,
    onOpenChange,
    order,
    barges,
    agents,
    supplyLocationOptions,
    deliveryMethodOptions,
    samplingLocationOptions,
    samplingMethodOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: PendingRow;
    barges: BargeOption[];
    agents: AgentOption[];
    supplyLocationOptions: SupplyLocationOption[];
    deliveryMethodOptions: EnumOption[];
    samplingLocationOptions: EnumOption[];
    samplingMethodOptions: EnumOption[];
}) {
    const form = useForm<BdnFormData>(buildFormData(order));
    const [confirming, setConfirming] = useState(false);

    // Defaults have to be the payload that was sent, not the current data,
    // or keystrokes made mid-request are marked clean and never saved.
    const saveBdn = (submitted: BdnFormData, onSaved?: () => void) =>
        form.submit(update(order.id), {
            preserveScroll: true,
            preserveState: true,
            only: ['pendingOrders'],
            onSuccess: () => {
                form.setDefaults(submitted);
                onSaved?.();
            },
        });

    const { status, flush } = useAutosave({
        data: form.data,
        dirty: form.isDirty,
        processing: form.processing,
        hasErrors: form.hasErrors,
        save: saveBdn,
    });

    function close() {
        flush();
        onOpenChange(false);
    }

    function completeOrder() {
        router.patch(
            complete(order.id).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
            },
        );
    }

    function submit() {
        setConfirming(false);

        // Inertia runs one visit at a time, so an unsaved BDN has to finish
        // saving before the completion patch starts or it would cancel it.
        if (form.isDirty) {
            saveBdn(form.data, completeOrder);

            return;
        }

        completeOrder();
    }

    const set = (field: string) => (value: string) =>
        form.setData(field, value);

    const selectedBarge = barges.find(
        (barge) => barge.imo === form.data.barge_id,
    );
    const isBargeDelivery =
        form.data.delivery_method === '' ||
        form.data.delivery_method === 'barge';
    const errorMessage = Object.values(form.errors)[0];

    return (
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
            <DialogContent
                className="sm:max-w-4xl"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <SummaryBand>
                    <DialogHeader>
                        <DialogTitle>
                            Bunker Delivery Note —{' '}
                            {order.bdn?.bdn_number ?? order.order_number}
                        </DialogTitle>
                        <p
                            className={cn(
                                'text-xs',
                                status === 'error'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {status === 'error'
                                ? (errorMessage ?? STATUS_LABELS.error)
                                : STATUS_LABELS[status]}
                        </p>
                    </DialogHeader>

                    <FormSection cols={3}>
                        <ReadOnlyValue
                            label="Delivery Port"
                            value={order.port}
                        />
                        <ReadOnlyValue
                            label="Vessel Name"
                            value={order.vessel_name}
                        />
                        <ReadOnlyValue label="IMO No" value={order.vessel_id} />
                    </FormSection>
                </SummaryBand>

                <div className="flex flex-col gap-6">
                    <FormSection cols={3}>
                        <div className="grid gap-1">
                            <Label htmlFor="bdn-delivery-date">
                                Delivery Date
                            </Label>
                            <DatePicker
                                id="bdn-delivery-date"
                                value={dateOnlyToDate(form.data.delivery_date)}
                                onChange={(date) =>
                                    form.setData(
                                        'delivery_date',
                                        dateToDateOnly(date),
                                    )
                                }
                            />
                        </div>
                        <LabeledSelect
                            label="Delivery Location"
                            value={form.data.delivery_location_id}
                            onChange={set('delivery_location_id')}
                            options={supplyLocationOptions.filter(
                                (option) =>
                                    order.port_id === null ||
                                    option.port_id === order.port_id,
                            )}
                            placeholder="Select location"
                        />
                        <LabeledField
                            id="bdn-vessel-flag"
                            label="Flag"
                            value={form.data.vessel_flag}
                            onChange={set('vessel_flag')}
                        />

                        <LabeledField
                            id="bdn-grt"
                            label="GRT"
                            type="number"
                            value={form.data.grt}
                            onChange={set('grt')}
                        />
                        <LabeledField
                            id="bdn-pi-club"
                            label="P&I Club"
                            value={form.data.pi_club}
                            onChange={set('pi_club')}
                        />
                        <LabeledField
                            id="bdn-owner-operator"
                            label="Owner / Operator"
                            value={form.data.owner_operator}
                            onChange={set('owner_operator')}
                        />

                        <div className="grid gap-1">
                            <Label>Vessel Agent</Label>
                            <SearchableCombobox
                                items={[
                                    {
                                        value: '',
                                        label: 'No agent',
                                        sublabel: 'Unassigned',
                                    },
                                    ...agents.map((agent) => ({
                                        value: String(agent.id),
                                        label: agent.name,
                                        sublabel: agent.address ?? '',
                                    })),
                                ]}
                                value={form.data.agent_id}
                                onChange={set('agent_id')}
                                placeholder="Select agent"
                                searchPlaceholder="Search name or address"
                                emptyText="No agents available."
                            />
                        </div>
                        <LabeledField
                            id="bdn-last-port"
                            label="Last Port of Call"
                            value={form.data.last_port_of_call}
                            onChange={set('last_port_of_call')}
                        />
                        <LabeledField
                            id="bdn-destination-port"
                            label="Destination Port"
                            value={form.data.destination_port}
                            onChange={set('destination_port')}
                        />

                        <LabeledSelect
                            label="Delivery Method"
                            value={form.data.delivery_method}
                            onChange={(value) => {
                                form.setData((data) => ({
                                    ...data,
                                    delivery_method: value,
                                    barge_id:
                                        value === 'barge' || value === ''
                                            ? data.barge_id
                                            : '',
                                }));
                            }}
                            options={deliveryMethodOptions}
                            placeholder="Select method"
                        />
                        {isBargeDelivery && (
                            <>
                                <div className="grid gap-1">
                                    <Label>Barge Name</Label>
                                    <SearchableCombobox
                                        items={barges.map((barge) => ({
                                            value: barge.imo,
                                            label: barge.name,
                                            sublabel: `IMO ${barge.imo}`,
                                        }))}
                                        value={form.data.barge_id}
                                        onChange={set('barge_id')}
                                        placeholder="Select barge"
                                        searchPlaceholder="Search name or IMO"
                                        emptyText="No barges available."
                                    />
                                </div>
                                <ReadOnlyField
                                    label="Barge IMO No"
                                    value={selectedBarge?.imo ?? ''}
                                />

                                <DateTimeField
                                    id="bdn-barge-alongside"
                                    label="Barge Alongside"
                                    value={form.data.barge_alongside_at}
                                    onChange={set('barge_alongside_at')}
                                />
                            </>
                        )}
                    </FormSection>

                    <Separator />

                    {order.grades.map((grade) => (
                        <FormSection key={grade.value} title={grade.label}>
                            {TIMESHEET_FIELDS.map((row) => (
                                <DateTimeField
                                    key={row.field}
                                    id={`bdn-${grade.value}-${row.field}`}
                                    label={row.label}
                                    value={
                                        form.data[`${grade.value}_${row.field}`]
                                    }
                                    onChange={set(
                                        `${grade.value}_${row.field}`,
                                    )}
                                />
                            ))}
                        </FormSection>
                    ))}

                    <Separator />

                    {order.grades.map((grade) => (
                        <FormSection key={grade.value} title={grade.label}>
                            {QUALITY_FIELDS.map((row) => (
                                <LabeledField
                                    key={row.field}
                                    id={`bdn-${grade.value}-${row.field}`}
                                    label={row.label}
                                    type="number"
                                    step={row.step}
                                    value={
                                        form.data[`${grade.value}_${row.field}`]
                                    }
                                    onChange={set(
                                        `${grade.value}_${row.field}`,
                                    )}
                                />
                            ))}
                        </FormSection>
                    ))}

                    <Separator />

                    <div className="flex flex-col gap-3">
                        {DECLARATIONS.map((declaration) => (
                            <div
                                key={declaration.field}
                                className="flex items-center justify-between gap-4"
                            >
                                <Label className="font-normal">
                                    {declaration.label}
                                </Label>
                                <Select
                                    value={form.data[declaration.field]}
                                    onValueChange={set(declaration.field)}
                                >
                                    <SelectTrigger className="w-28">
                                        <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Yes</SelectItem>
                                        <SelectItem value="0">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <FormSection>
                        <LabeledSelect
                            label="Location of Sampling"
                            value={form.data.sampling_location}
                            onChange={set('sampling_location')}
                            options={samplingLocationOptions}
                            placeholder="Select location"
                        />
                        <LabeledSelect
                            label="Method of Sampling"
                            value={form.data.sampling_method}
                            onChange={set('sampling_method')}
                            options={samplingMethodOptions}
                            placeholder="Select method"
                        />
                    </FormSection>

                    <div className="overflow-x-auto">
                        <div className="min-w-lg space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-56 shrink-0" />
                                <div className="flex-1 text-xs font-medium text-muted-foreground">
                                    Barge Seal Number
                                </div>
                                <div className="flex-1 text-xs font-medium text-muted-foreground">
                                    Counter Seal Number (If Any)
                                </div>
                            </div>
                            {SEALS.map((seal) => (
                                <div
                                    key={seal.prefix}
                                    className="flex items-center gap-3"
                                >
                                    <Label className="w-56 shrink-0 font-normal">
                                        {seal.label}
                                    </Label>
                                    <Input
                                        className="flex-1"
                                        value={
                                            form.data[
                                                `${seal.prefix}_seal_number`
                                            ]
                                        }
                                        onChange={(e) =>
                                            form.setData(
                                                `${seal.prefix}_seal_number`,
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <Input
                                        className="flex-1"
                                        value={
                                            form.data[
                                                `${seal.prefix}_counter_seal_number`
                                            ]
                                        }
                                        onChange={(e) =>
                                            form.setData(
                                                `${seal.prefix}_counter_seal_number`,
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={close}>
                        Close
                    </Button>
                    <Button type="button" onClick={() => setConfirming(true)}>
                        Submit
                    </Button>
                </DialogFooter>

                <Dialog open={confirming} onOpenChange={setConfirming}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Submit BDN{' '}
                                {order.bdn?.bdn_number ?? order.order_number}?
                            </DialogTitle>
                            <DialogDescription>
                                This marks the order as delivered and generates
                                the invoice from the BDN quantities and rates.
                                It cannot be undone from this page.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setConfirming(false)}
                            >
                                Cancel
                            </Button>
                            <Button disabled={form.processing} onClick={submit}>
                                Submit
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
