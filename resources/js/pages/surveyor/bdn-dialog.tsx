import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { update } from '@/actions/App/Http/Controllers/BdnController';
import { DateTimePicker } from '@/components/date-time-picker';
import StepWizard from '@/components/step-wizard';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogClose,
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
import { useAutosave } from '@/hooks/use-autosave';
import type { AutosaveStatus } from '@/hooks/use-autosave';
import { QUALITY_FIELDS, SEALS, TIMESHEET_FIELDS } from '@/lib/bdn-fields';
import { cn, optionLabel } from '@/lib/utils';
import { complete } from '@/routes/surveyor';
import type { AgentOption, EnumOption, SupplyLocationOption } from '@/types';
import { AlertCircle, CheckCircle2, ChevronDown, X } from 'lucide-react';
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
    idle: 'Saved just now',
    pending: 'Unsaved changes…',
    saving: 'Saving…',
    saved: 'Saved just now',
    error: 'Unable to save',
};

const STEPS = [
    {
        key: 'delivery',
        label: 'Vessel & Delivery',
        shortLabel: 'Delivery',
        description: 'Vessel, location, barge and timing details',
    },
    {
        key: 'products',
        label: 'Products',
        shortLabel: 'Products',
        description: 'Timesheets, quality values and delivered quantities',
    },
    {
        key: 'sampling',
        label: 'Sampling & Confirmation',
        shortLabel: 'Sampling',
        description: 'Chief engineer, sampling and seal details',
    },
    {
        key: 'review',
        label: 'Review & Generate',
        shortLabel: 'Review',
        description: 'Check missing fields before final BDN generation',
    },
] as const;

const PRODUCT_UNITS: Record<string, string> = {
    density_15: 'kg/L',
    sulphur_pct: '%',
    viscosity_50: 'cSt',
    flash_point: '°C',
    kilo_liter: 'KL',
    metric_ton: 'MT',
};

const TRUCK_REFERENCE_OPTIONS = ['Road Tanker', 'Barge Truck'];

type StepKey = (typeof STEPS)[number]['key'];

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
        truck_number: text(bdn?.truck_number),
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
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <DateTimePicker
                id={id}
                value={value}
                onChange={onChange}
                enterAdvances
            />
        </div>
    );
}

function LabeledSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: EnumOption[];
    placeholder: string;
    required?: boolean;
}) {
    return (
        <div className="grid gap-1.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    data-bdn-enter-next="true"
                    className="h-10 w-full rounded-xl border-[#D8E2EE] bg-white"
                    aria-required={required}
                >
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

function FieldLabel({
    children,
    required = false,
    htmlFor,
}: {
    children: ReactNode;
    required?: boolean;
    htmlFor?: string;
}) {
    return (
        <Label
            htmlFor={htmlFor}
            className="text-xs font-semibold text-slate-500"
        >
            {children}
            {required && (
                <span className="ml-1 text-[#E9563D]" aria-hidden="true">
                    *
                </span>
            )}
        </Label>
    );
}

function TextInputField({
    id,
    label,
    value,
    onChange,
    type = 'text',
    step,
    unit,
    list,
    required = false,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: React.HTMLInputTypeAttribute;
    step?: string;
    unit?: string;
    list?: string;
    required?: boolean;
}) {
    return (
        <div className="grid gap-1.5">
            <FieldLabel htmlFor={id} required={required}>
                {label}
            </FieldLabel>
            <div className="relative">
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    step={step}
                    list={list}
                    aria-required={required}
                    data-bdn-enter-next="true"
                    className={cn(
                        'h-10 rounded-xl border-[#D8E2EE] bg-white',
                        unit && 'pr-14',
                    )}
                />
                {unit && (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

function ReadOnlyData({
    label,
    value,
    required = false,
}: {
    label: string;
    value?: string | null;
    required?: boolean;
}) {
    return (
        <div className="rounded-xl border border-[#E3EAF2] bg-[#F8FAFD] px-3 py-2.5">
            <FieldLabel required={required}>{label}</FieldLabel>
            <p className="mt-1 min-h-5 text-sm font-semibold break-words text-[#172033]">
                {value || '—'}
            </p>
        </div>
    );
}

function BorderedSection({
    children,
    compact = false,
    description,
    title,
}: {
    children: ReactNode;
    compact?: boolean;
    description?: string;
    title: string;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl border border-[#E3EAF2] bg-white shadow-sm',
                compact ? 'p-3' : 'p-4',
            )}
        >
            <div className={cn('grid', description ? 'gap-1' : 'gap-0')}>
                <h3 className="text-sm font-bold text-[#172033]">{title}</h3>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function FieldGrid({ children }: { children: ReactNode }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {children}
        </div>
    );
}

function SaveStatus({
    label,
    status,
}: {
    label: string;
    status: AutosaveStatus;
}) {
    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold',
                status === 'error'
                    ? 'bg-red-50 text-destructive'
                    : status === 'saving' || status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700',
            )}
        >
            <span
                className={cn(
                    'size-2 rounded-full',
                    status === 'error'
                        ? 'bg-destructive'
                        : status === 'saving' || status === 'pending'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500',
                )}
            />
            {label}
        </span>
    );
}

function CompletionBadge({ complete }: { complete: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                complete
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700',
            )}
        >
            {complete ? (
                <CheckCircle2 className="size-3.5" />
            ) : (
                <AlertCircle className="size-3.5" />
            )}
            {complete ? 'Complete' : 'Needs input'}
        </span>
    );
}

function YesNoControl({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const options = [
        { label: 'Yes', value: '1' },
        { label: 'No', value: '0' },
        { label: 'N/A', value: '' },
    ];

    return (
        <div className="grid gap-2 rounded-xl border border-[#E3EAF2] bg-[#F8FAFD] p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <FieldLabel>{label}</FieldLabel>
            <div className="grid grid-cols-3 rounded-xl border border-[#D8E2EE] bg-white p-1">
                {options.map((option) => {
                    const active = value === option.value;

                    return (
                        <button
                            key={option.label}
                            type="button"
                            className={cn(
                                'h-9 rounded-lg px-3 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#3155E7]/35 focus-visible:outline-none',
                                active
                                    ? 'bg-[#172033] text-white'
                                    : 'text-slate-500 hover:bg-[#F8FAFD]',
                            )}
                            onClick={() => onChange(option.value)}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ReviewItem({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="grid gap-0.5">
            <span className="text-xs font-semibold text-slate-500">
                {label}
            </span>
            <span className="min-h-5 text-sm font-semibold break-words text-[#172033]">
                {value || '—'}
            </span>
        </div>
    );
}

function productComplete(data: BdnFormData, grade: string): boolean {
    return ['density_15', 'kilo_liter', 'metric_ton'].every(
        (field) => data[`${grade}_${field}`]?.trim() !== '',
    );
}

function requiredFields(
    order: PendingRow,
    data: BdnFormData,
    isBargeDelivery: boolean,
): string[] {
    const missing: string[] = [];

    if (data.delivery_date.trim() === '') {
        missing.push('Delivery Date');
    }

    if (data.delivery_location_id.trim() === '') {
        missing.push('Delivery Location');
    }

    if (data.delivery_method.trim() === '') {
        missing.push('Delivery Method');
    }

    if (isBargeDelivery && data.barge_id.trim() === '') {
        missing.push('Barge Name');
    }

    order.grades.forEach((grade) => {
        if (!productComplete(data, grade.value)) {
            missing.push(`${grade.label} density, KL and MT`);
        }
    });

    return missing;
}

function formatDateOnly(value: string): string {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}`;
}

function focusNextBdnField(event: KeyboardEvent<HTMLElement>) {
    if (
        event.key !== 'Enter' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
    ) {
        return;
    }

    const target = event.target as HTMLElement | null;

    const currentField = target?.closest<HTMLElement>(
        '[data-bdn-enter-next="true"]',
    );

    if (!currentField) {
        return;
    }

    const fields = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(
            '[data-bdn-enter-next="true"]',
        ),
    ).filter(
        (field) =>
            !field.hasAttribute('disabled') &&
            field.getAttribute('aria-disabled') !== 'true' &&
            field.offsetParent !== null,
    );
    const currentIndex = fields.findIndex((field) => field === currentField);
    const nextField = fields[currentIndex + 1];

    if (!nextField) {
        return;
    }

    event.preventDefault();
    nextField.focus();

    if (nextField instanceof HTMLInputElement) {
        nextField.select();
    }
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
    const [activeStep, setActiveStep] = useState<StepKey>('delivery');
    const [openProduct, setOpenProduct] = useState(
        order.grades[0]?.value ?? '',
    );

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

    function setQualityField(grade: string, field: string, value: string) {
        const nextData = {
            ...form.data,
            [`${grade}_${field}`]: value,
        };

        if (field === 'density_15' || field === 'kilo_liter') {
            const density = Number(
                field === 'density_15'
                    ? value
                    : nextData[`${grade}_density_15`],
            );
            const kiloLiter = Number(
                field === 'kilo_liter'
                    ? value
                    : nextData[`${grade}_kilo_liter`],
            );

            if (Number.isFinite(density) && Number.isFinite(kiloLiter)) {
                nextData[`${grade}_metric_ton`] = String(
                    Math.round(density * kiloLiter * 1000) / 1000,
                );
            }
        }

        form.setData(nextData);
    }

    const selectedBarge = barges.find(
        (barge) => barge.imo === form.data.barge_id,
    );
    const selectedAgent = agents.find(
        (agent) => String(agent.id) === form.data.agent_id,
    );
    const deliveryLocationLabel = optionLabel(
        supplyLocationOptions,
        form.data.delivery_location_id,
    );
    const deliveryMethodLabel = optionLabel(
        deliveryMethodOptions,
        form.data.delivery_method,
    );
    const isBargeDelivery =
        form.data.delivery_method === '' ||
        form.data.delivery_method === 'barge';
    const isTruckDelivery = form.data.delivery_method === 'truck';
    const errorMessage = Object.values(form.errors)[0];
    const missingFields = requiredFields(order, form.data, isBargeDelivery);
    const activeStepIndex = STEPS.findIndex((step) => step.key === activeStep);
    const isFirstStep = activeStepIndex === 0;
    const isLastStep = activeStepIndex === STEPS.length - 1;
    const visibleStatusLabel =
        status === 'error'
            ? (errorMessage ?? STATUS_LABELS.error)
            : STATUS_LABELS[status];

    function goToStep(offset: number) {
        const nextStep = STEPS[activeStepIndex + offset];

        if (nextStep) {
            setActiveStep(nextStep.key);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
            <DialogContent
                className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[90dvh] sm:max-w-6xl sm:rounded-2xl"
                onInteractOutside={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                <div className="sticky top-0 z-20 border-b border-[#D8E2EE] bg-[#F8FAFD]">
                    <DialogHeader className="gap-0 px-4 py-2 sm:px-5">
                        <div className="flex min-h-12 items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-sm leading-tight font-bold text-[#172033] sm:text-base">
                                    Bunker Delivery Note{' '}
                                    <span className="block font-semibold break-all text-slate-500 sm:inline sm:break-normal">
                                        #
                                        {order.bdn?.bdn_number ??
                                            order.order_number}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Complete the bunker delivery note in four
                                    steps.
                                </DialogDescription>
                                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                    <span className="truncate text-[#172033]">
                                        {order.vessel_name}
                                    </span>
                                    <span className="hidden sm:inline">
                                        IMO {order.vessel_id || '—'}
                                    </span>
                                    <span className="hidden md:inline">
                                        {order.port}
                                    </span>
                                </div>
                            </div>
                            <SaveStatus
                                status={status}
                                label={visibleStatusLabel}
                            />
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0"
                                >
                                    <X className="size-4" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogHeader>

                    <StepWizard
                        steps={STEPS}
                        currentStep={activeStepIndex}
                        onStepClick={(step) => setActiveStep(STEPS[step].key)}
                        variant="compact"
                    />
                </div>

                <div
                    className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
                    onKeyDownCapture={focusNextBdnField}
                >
                    {activeStep === 'delivery' && (
                        <div className="grid gap-4">
                            <BorderedSection
                                title="Vessel particulars"
                                description="Ship and voyage details used on the final BDN."
                            >
                                <FieldGrid>
                                    <ReadOnlyData
                                        label="Delivery Date"
                                        required
                                        value={formatDateOnly(
                                            form.data.delivery_date,
                                        )}
                                    />
                                    <TextInputField
                                        id="bdn-vessel-flag"
                                        label="Flag"
                                        value={form.data.vessel_flag}
                                        onChange={set('vessel_flag')}
                                    />
                                    <TextInputField
                                        id="bdn-grt"
                                        label="GRT"
                                        type="number"
                                        value={form.data.grt}
                                        onChange={set('grt')}
                                    />
                                    <TextInputField
                                        id="bdn-pi-club"
                                        label="P&I Club"
                                        value={form.data.pi_club}
                                        onChange={set('pi_club')}
                                    />
                                    <TextInputField
                                        id="bdn-owner-operator"
                                        label="Owner / Operator"
                                        value={form.data.owner_operator}
                                        onChange={set('owner_operator')}
                                    />
                                    <ReadOnlyData
                                        label="Vessel Agent"
                                        value={
                                            selectedAgent?.name ??
                                            (form.data.agent_id
                                                ? form.data.agent_id
                                                : 'No agent')
                                        }
                                    />
                                    <TextInputField
                                        id="bdn-last-port"
                                        label="Last Port of Call"
                                        value={form.data.last_port_of_call}
                                        onChange={set('last_port_of_call')}
                                    />
                                    <TextInputField
                                        id="bdn-destination-port"
                                        label="Destination Port"
                                        value={form.data.destination_port}
                                        onChange={set('destination_port')}
                                    />
                                </FieldGrid>
                            </BorderedSection>

                            <BorderedSection
                                title="Delivery location and method"
                                description="Where and how the bunker delivery was completed."
                            >
                                <FieldGrid>
                                    <ReadOnlyData
                                        label="Delivery Location"
                                        required
                                        value={deliveryLocationLabel}
                                    />
                                    <ReadOnlyData
                                        label="Delivery Method"
                                        required
                                        value={deliveryMethodLabel}
                                    />
                                </FieldGrid>
                            </BorderedSection>

                            {isBargeDelivery && (
                                <BorderedSection
                                    title="Barge information"
                                    description="Barge identity and alongside timing."
                                >
                                    <FieldGrid>
                                        <ReadOnlyData
                                            label="Barge Name"
                                            required
                                            value={
                                                selectedBarge?.name ??
                                                form.data.barge_id
                                            }
                                        />
                                        <ReadOnlyData
                                            label="Barge IMO No"
                                            value={selectedBarge?.imo ?? ''}
                                        />
                                        <DateTimeField
                                            id="bdn-barge-alongside"
                                            label="Barge Alongside"
                                            value={form.data.barge_alongside_at}
                                            onChange={set('barge_alongside_at')}
                                        />
                                    </FieldGrid>
                                </BorderedSection>
                            )}

                            {isTruckDelivery && (
                                <BorderedSection
                                    title="Truck information"
                                    description="Truck identity used in place of the barge name on truck deliveries."
                                >
                                    <FieldGrid>
                                        <TextInputField
                                            id="bdn-truck-number"
                                            label="Truck Number / Reference"
                                            value={form.data.truck_number}
                                            onChange={set('truck_number')}
                                            list="bdn-truck-reference-options"
                                        />
                                    </FieldGrid>
                                    <datalist id="bdn-truck-reference-options">
                                        {TRUCK_REFERENCE_OPTIONS.map(
                                            (option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                />
                                            ),
                                        )}
                                    </datalist>
                                </BorderedSection>
                            )}
                        </div>
                    )}

                    {activeStep === 'products' && (
                        <div className="grid gap-3">
                            {order.grades.map((grade) => {
                                const open = openProduct === grade.value;
                                const complete = productComplete(
                                    form.data,
                                    grade.value,
                                );

                                return (
                                    <Collapsible
                                        key={grade.value}
                                        open={open}
                                        onOpenChange={(next) =>
                                            setOpenProduct(
                                                next ? grade.value : '',
                                            )
                                        }
                                    >
                                        <div className="overflow-hidden rounded-2xl border border-[#E3EAF2] bg-white shadow-sm">
                                            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F8FAFD] focus-visible:ring-2 focus-visible:ring-[#3155E7]/35 focus-visible:outline-none">
                                                <span>
                                                    <span className="block text-sm font-bold text-[#172033]">
                                                        {grade.label}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Timesheet and product
                                                        quality
                                                    </span>
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <CompletionBadge
                                                        complete={complete}
                                                    />
                                                    <ChevronDown
                                                        className={cn(
                                                            'size-4 text-slate-400 transition-transform',
                                                            open &&
                                                                'rotate-180',
                                                        )}
                                                    />
                                                </span>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="grid gap-4 border-t border-[#E3EAF2] p-4">
                                                    <BorderedSection
                                                        title="Operational timestamps"
                                                        compact
                                                    >
                                                        <FieldGrid>
                                                            {TIMESHEET_FIELDS.map(
                                                                (row) => (
                                                                    <DateTimeField
                                                                        key={
                                                                            row.field
                                                                        }
                                                                        id={`bdn-${grade.value}-${row.field}`}
                                                                        label={
                                                                            row.label
                                                                        }
                                                                        value={
                                                                            form
                                                                                .data[
                                                                                `${grade.value}_${row.field}`
                                                                            ]
                                                                        }
                                                                        onChange={set(
                                                                            `${grade.value}_${row.field}`,
                                                                        )}
                                                                    />
                                                                ),
                                                            )}
                                                        </FieldGrid>
                                                    </BorderedSection>

                                                    <BorderedSection
                                                        title="Product measurements"
                                                        compact
                                                    >
                                                        <FieldGrid>
                                                            {QUALITY_FIELDS.map(
                                                                (row) => (
                                                                    <TextInputField
                                                                        key={
                                                                            row.field
                                                                        }
                                                                        id={`bdn-${grade.value}-${row.field}`}
                                                                        label={
                                                                            row.label
                                                                        }
                                                                        type="number"
                                                                        step={
                                                                            row.step
                                                                        }
                                                                        unit={
                                                                            PRODUCT_UNITS[
                                                                                row
                                                                                    .field
                                                                            ]
                                                                        }
                                                                        value={
                                                                            form
                                                                                .data[
                                                                                `${grade.value}_${row.field}`
                                                                            ]
                                                                        }
                                                                        onChange={(
                                                                            value,
                                                                        ) =>
                                                                            setQualityField(
                                                                                grade.value,
                                                                                row.field,
                                                                                value,
                                                                            )
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </FieldGrid>
                                                    </BorderedSection>
                                                </div>
                                            </CollapsibleContent>
                                        </div>
                                    </Collapsible>
                                );
                            })}
                        </div>
                    )}

                    {activeStep === 'sampling' && (
                        <div className="grid gap-4">
                            <BorderedSection
                                title="Chief engineer confirmations"
                                description="Use N/A when the confirmation does not apply."
                            >
                                <div className="grid gap-3">
                                    {DECLARATIONS.map((declaration) => (
                                        <YesNoControl
                                            key={declaration.field}
                                            label={declaration.label}
                                            value={form.data[declaration.field]}
                                            onChange={set(declaration.field)}
                                        />
                                    ))}
                                </div>
                            </BorderedSection>

                            <BorderedSection
                                title="Sampling location and method"
                                description="Sampling details recorded against this delivery."
                            >
                                <FieldGrid>
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
                                </FieldGrid>
                            </BorderedSection>

                            <BorderedSection
                                title="Barge and counter-seal numbers"
                                description="Seal numbers for each retained sample."
                            >
                                <div className="grid gap-3">
                                    {SEALS.map((seal) => (
                                        <div
                                            key={seal.prefix}
                                            className="grid gap-3 rounded-xl border border-[#E3EAF2] bg-[#F8FAFD] p-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-end"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-[#172033]">
                                                    {seal.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {seal.label}
                                                </p>
                                            </div>
                                            <TextInputField
                                                id={`${seal.prefix}-seal-number`}
                                                label="Barge Seal Number"
                                                value={
                                                    form.data[
                                                        `${seal.prefix}_seal_number`
                                                    ]
                                                }
                                                onChange={set(
                                                    `${seal.prefix}_seal_number`,
                                                )}
                                            />
                                            <TextInputField
                                                id={`${seal.prefix}-counter-seal-number`}
                                                label="Counter Seal Number"
                                                value={
                                                    form.data[
                                                        `${seal.prefix}_counter_seal_number`
                                                    ]
                                                }
                                                onChange={set(
                                                    `${seal.prefix}_counter_seal_number`,
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </BorderedSection>
                        </div>
                    )}

                    {activeStep === 'review' && (
                        <div className="grid gap-4">
                            <BorderedSection
                                title="Missing required fields"
                                description="The draft can still be saved, but complete these before generating the final BDN."
                            >
                                {missingFields.length === 0 ? (
                                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                                        <CheckCircle2 className="size-4" />
                                        Required fields are complete.
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        {missingFields.map((field) => (
                                            <div
                                                key={field}
                                                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
                                            >
                                                <AlertCircle className="size-4" />
                                                {field}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </BorderedSection>

                            <BorderedSection title="BDN summary">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <ReviewItem
                                        label="Delivery Date"
                                        value={formatDateOnly(
                                            form.data.delivery_date,
                                        )}
                                    />
                                    <ReviewItem
                                        label="Delivery Method"
                                        value={deliveryMethodLabel}
                                    />
                                    <ReviewItem
                                        label="Delivery Location"
                                        value={deliveryLocationLabel}
                                    />
                                    <ReviewItem
                                        label={
                                            isTruckDelivery ? 'Truck' : 'Barge'
                                        }
                                        value={
                                            isTruckDelivery
                                                ? form.data.truck_number
                                                : (selectedBarge?.name ??
                                                  form.data.barge_id)
                                        }
                                    />
                                    <ReviewItem
                                        label="Sampling Location"
                                        value={optionLabel(
                                            samplingLocationOptions,
                                            form.data.sampling_location,
                                        )}
                                    />
                                    <ReviewItem
                                        label="Sampling Method"
                                        value={optionLabel(
                                            samplingMethodOptions,
                                            form.data.sampling_method,
                                        )}
                                    />
                                </div>
                            </BorderedSection>

                            <BorderedSection title="Product summary">
                                <div className="grid gap-2">
                                    {order.grades.map((grade) => (
                                        <div
                                            key={`${grade.value}-review`}
                                            className="grid gap-2 rounded-xl border border-[#E3EAF2] bg-[#F8FAFD] p-3 sm:grid-cols-3"
                                        >
                                            <ReviewItem
                                                label="Product"
                                                value={grade.label}
                                            />
                                            <ReviewItem
                                                label="KL"
                                                value={
                                                    form.data[
                                                        `${grade.value}_kilo_liter`
                                                    ]
                                                }
                                            />
                                            <ReviewItem
                                                label="MT"
                                                value={
                                                    form.data[
                                                        `${grade.value}_metric_ton`
                                                    ]
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </BorderedSection>
                        </div>
                    )}
                </div>

                <DialogFooter className="sticky bottom-0 z-20 flex-col gap-2 border-t border-[#D8E2EE] bg-white px-4 py-3 sm:flex-row sm:px-5">
                    <Button type="button" variant="outline" onClick={close}>
                        Save draft
                    </Button>
                    <div className="flex flex-1 justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isFirstStep}
                            onClick={() => goToStep(-1)}
                        >
                            Back
                        </Button>
                        {isLastStep ? (
                            <Button
                                type="button"
                                disabled={
                                    form.processing || missingFields.length > 0
                                }
                                title={
                                    missingFields.length > 0
                                        ? 'Complete the missing required fields before generating the BDN.'
                                        : undefined
                                }
                                onClick={() => setConfirming(true)}
                            >
                                Generate BDN
                            </Button>
                        ) : (
                            <Button type="button" onClick={() => goToStep(1)}>
                                Continue
                            </Button>
                        )}
                    </div>
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
