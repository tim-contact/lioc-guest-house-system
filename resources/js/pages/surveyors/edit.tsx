import { useForm } from '@inertiajs/react';
import {
    Check,
    Search,
    Ship,
    Truck,
    Waves,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ExportColumn } from '@/lib/export-xlsx';
import { cn } from '@/lib/utils';
import { destroy, store, update } from '@/routes/surveyors';

interface Surveyor {
    id: number;
    survey_company: string;
    name: string;
    mail_id: string | null;
    contact: string | null;
    barge_id: string | null;
    barge_ids: string[];
    delivery_modes: string[];
    user_id: string | null;
    user_name?: string | null;
    user_email?: string | null;
}

interface AvailableUser {
    id: string;
    name: string;
    email: string;
    already_linked: boolean;
}

interface SurveyorsEditProps {
    surveyors: Surveyor[];
    barges: { imo: string; name: string }[];
    deliveryModeOptions: { value: string; label: string }[];
    availableUsers: AvailableUser[];
}

interface Option {
    value: string;
    label: string;
}

export default function SurveyorsEdit({
    surveyors,
    barges,
    deliveryModeOptions,
    availableUsers,
}: SurveyorsEditProps) {
    const bargeOptions = barges.map((barge) => ({
        value: barge.imo,
        label: barge.name,
    }));

    const bargeName = (imo: string | null): string =>
        bargeOptions.find((barge) => barge.value === imo)?.label ?? '—';
    const bargeNames = (imos: string[]): string =>
        imos.length > 0
            ? imos.map((imo) => bargeName(imo)).join(', ')
            : bargeName(null);
    const deliveryModeNames = (modes: string[]): string =>
        modes.length > 0
            ? modes
                  .map(
                      (mode) =>
                          deliveryModeOptions.find(
                              (option) => option.value === mode,
                          )?.label ?? mode,
                  )
                  .join(', ')
            : '—';

    const userOptions = availableUsers.map((user) => ({
        value: user.id,
        label: `${user.name} (${user.email})`,
    }));

    const exportColumns: ExportColumn<Surveyor>[] = [
        {
            header: 'Survey Company',
            value: (surveyor) => surveyor.survey_company,
        },
        { header: 'Name', value: (surveyor) => surveyor.name },
        { header: 'Mail ID', value: (surveyor) => surveyor.mail_id ?? '' },
        { header: 'Contact', value: (surveyor) => surveyor.contact ?? '' },
        {
            header: 'Barges',
            value: (surveyor) => bargeNames(surveyor.barge_ids),
        },
        {
            header: 'Truck/Pipeline',
            value: (surveyor) => deliveryModeNames(surveyor.delivery_modes),
        },
        {
            header: 'Login User',
            value: (surveyor) => surveyor.user_name ?? '—',
        },
    ];

    const config: CrudConfig<Surveyor> = {
        title: 'Surveyors',
        entityLabel: 'Surveyor',
        filename: 'surveyors',
        emptyText: 'No surveyors yet.',
        pk: (surveyor) => surveyor.id,
        defaultSortKey: 'survey_company',
        exportColumns,
        dialogClassName: 'sm:max-w-5xl',
        form: ({ row, onDone }) => (
            <SurveyorForm
                row={row}
                onDone={onDone}
                bargeOptions={bargeOptions}
                deliveryModeOptions={deliveryModeOptions}
                userOptions={userOptions}
            />
        ),
        editTitle: (surveyor) => surveyor.name,
        deleteLabel: (surveyor) =>
            `${surveyor.name} (${surveyor.survey_company})`,
        columns: [
            {
                header: 'Survey Company',
                sortKey: 'survey_company',
                cell: (surveyor) => surveyor.survey_company,
                className: 'font-medium',
            },
            {
                header: 'Name',
                sortKey: 'name',
                cell: (surveyor) => surveyor.name,
            },
            {
                header: 'Mail ID',
                sortKey: 'mail_id',
                cell: (surveyor) => surveyor.mail_id ?? '—',
            },
            {
                header: 'Contact',
                sortKey: 'contact',
                cell: (surveyor) => surveyor.contact ?? '—',
            },
            {
                header: 'Barges',
                sortKey: 'barge_id',
                cell: (surveyor) => bargeNames(surveyor.barge_ids),
            },
            {
                header: 'Truck/Pipeline',
                cell: (surveyor) => deliveryModeNames(surveyor.delivery_modes),
            },
            {
                header: 'Login User',
                cell: (surveyor) =>
                    surveyor.user_name
                        ? `${surveyor.user_name} (${surveyor.user_email})`
                        : '—',
            },
        ],
        fields: [
            { name: 'survey_company', label: 'Survey Company' },
            { name: 'name', label: 'Name' },
            { name: 'mail_id', label: 'Mail ID', type: 'email' },
            { name: 'contact', label: 'Contact' },
            {
                name: 'barge_ids',
                label: 'Barges',
                type: 'multiselect',
                options: bargeOptions,
            },
            {
                name: 'delivery_modes',
                label: 'Truck/Pipeline Deliveries',
                type: 'multiselect',
                options: deliveryModeOptions,
            },
            {
                name: 'user_id',
                label: 'Login User',
                type: 'select',
                options: userOptions,
            },
        ],
        toFormData: (surveyor) => ({
            survey_company: surveyor?.survey_company ?? '',
            name: surveyor?.name ?? '',
            mail_id: surveyor?.mail_id ?? '',
            contact: surveyor?.contact ?? '',
            barge_id: surveyor?.barge_id ?? '',
            barge_ids: surveyor?.barge_ids ?? [],
            delivery_modes: surveyor?.delivery_modes ?? [],
            user_id: surveyor?.user_id ?? '',
        }),
        routes: {
            store: () => store(),
            update: (id) => update(Number(id)),
            destroy: (id) => destroy(Number(id)),
        },
    };

    return <ResourceCrudPage rows={surveyors} config={config} />;
}

function SurveyorForm({
    row,
    onDone,
    bargeOptions,
    deliveryModeOptions,
    userOptions,
}: {
    row: Surveyor | null;
    onDone: () => void;
    bargeOptions: Option[];
    deliveryModeOptions: Option[];
    userOptions: Option[];
}) {
    const isEdit = row !== null;
    const form = useForm({
        survey_company: row?.survey_company ?? '',
        name: row?.name ?? '',
        mail_id: row?.mail_id ?? '',
        contact: row?.contact ?? '',
        barge_id: row?.barge_id ?? '',
        barge_ids: row?.barge_ids ?? [],
        delivery_modes: row?.delivery_modes ?? [],
        user_id: row?.user_id ?? '',
    });

    const selectedBarges = bargeOptions.filter((barge) =>
        form.data.barge_ids.includes(barge.value),
    );

    function submit(event: FormEvent) {
        event.preventDefault();

        const action = isEdit ? update(row.id) : store();

        form.submit(action, {
            onSuccess: onDone,
        });
    }

    function setTextField(
        field: 'survey_company' | 'name' | 'mail_id' | 'contact' | 'user_id',
        value: string,
    ) {
        form.setData(field, value);
    }

    function setSelectedValues(
        field: 'barge_ids' | 'delivery_modes',
        values: string[],
    ) {
        form.setData(field, values);
    }

    return (
        <form
            onSubmit={submit}
            className="flex max-h-[calc(100dvh-2rem)] flex-col"
        >
            <div className="min-h-0 overflow-y-auto px-1 pb-4">
                <DialogHeader className="px-1 pb-4">
                    <DialogTitle>
                        {isEdit ? `Edit ${row.name}` : 'New Surveyor'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <FormPanel
                        title="Surveyor information"
                        description="Core contact details and linked login user."
                    >
                        <FormField
                            id="survey-company"
                            label="Survey Company"
                            error={form.errors.survey_company}
                        >
                            <Input
                                id="survey-company"
                                value={form.data.survey_company}
                                className="border-[#D8E2EE] bg-white"
                                onChange={(event) =>
                                    setTextField(
                                        'survey_company',
                                        event.target.value,
                                    )
                                }
                            />
                        </FormField>

                        <FormField
                            id="surveyor-name"
                            label="Name"
                            error={form.errors.name}
                        >
                            <Input
                                id="surveyor-name"
                                value={form.data.name}
                                className="border-[#D8E2EE] bg-white"
                                onChange={(event) =>
                                    setTextField('name', event.target.value)
                                }
                            />
                        </FormField>

                        <FormField
                            id="surveyor-mail"
                            label="Mail ID"
                            error={form.errors.mail_id}
                        >
                            <Input
                                id="surveyor-mail"
                                type="email"
                                value={form.data.mail_id}
                                className="border-[#D8E2EE] bg-white"
                                onChange={(event) =>
                                    setTextField('mail_id', event.target.value)
                                }
                            />
                        </FormField>

                        <FormField
                            id="surveyor-contact"
                            label="Contact"
                            error={form.errors.contact}
                        >
                            <Input
                                id="surveyor-contact"
                                value={form.data.contact}
                                className="border-[#D8E2EE] bg-white"
                                onChange={(event) =>
                                    setTextField('contact', event.target.value)
                                }
                            />
                        </FormField>

                        <FormField
                            id="surveyor-user"
                            label="Login User"
                            error={form.errors.user_id}
                        >
                            <select
                                id="surveyor-user"
                                value={form.data.user_id}
                                onChange={(event) =>
                                    setTextField('user_id', event.target.value)
                                }
                                className="h-8 w-full min-w-0 rounded-lg border border-[#D8E2EE] bg-white px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <option value="">—</option>
                                {userOptions.map((user) => (
                                    <option key={user.value} value={user.value}>
                                        {user.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </FormPanel>

                    <FormPanel
                        title="Delivery assignments"
                        description="Choose delivery methods first, then assign one or more barges."
                    >
                        <DeliveryMethodPicker
                            options={deliveryModeOptions}
                            selected={form.data.delivery_modes}
                            onChange={(values) =>
                                setSelectedValues('delivery_modes', values)
                            }
                            error={form.errors.delivery_modes}
                        />

                        <BargeMultiSelect
                            options={bargeOptions}
                            selected={form.data.barge_ids}
                            selectedOptions={selectedBarges}
                            onChange={(values) =>
                                setSelectedValues('barge_ids', values)
                            }
                            error={form.errors.barge_ids}
                        />
                    </FormPanel>
                </div>
            </div>

            <DialogFooter className="sticky bottom-0 z-10 -mx-4 mt-4 -mb-4 border-t bg-popover/95 backdrop-blur">
                <Button type="button" variant="outline" onClick={onDone}>
                    Cancel
                </Button>
                <Button type="submit" disabled={form.processing}>
                    <Check />
                    {isEdit ? 'Save changes' : 'Create surveyor'}
                </Button>
            </DialogFooter>
        </form>
    );
}

function FormPanel({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="min-w-0 rounded-2xl border border-[#E3EAF2] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="mb-4">
                <h2 className="text-base font-semibold text-[#0F172A]">
                    {title}
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">{description}</p>
            </div>
            <div className="grid gap-5">{children}</div>
        </section>
    );
}

function FormField({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2.5">
            <Label htmlFor={id} className="text-xs font-medium text-[#64748B]">
                {label}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function DeliveryMethodPicker({
    options,
    selected,
    onChange,
    error,
}: {
    options: Option[];
    selected: string[];
    onChange: (values: string[]) => void;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>Delivery methods</Label>
            <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => {
                    const checked = selected.includes(option.value);
                    const Icon = deliveryModeIcon(option.value);

                    return (
                        <label
                            key={option.value}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors',
                                checked
                                    ? 'border-[#2455E6] bg-[#EEF2FF] text-[#172033]'
                                    : 'border-[#D8E2EE] bg-[#F8FAFD] text-[#334155] hover:border-[#B8C7DA]',
                            )}
                        >
                            <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                    onChange(
                                        nextChecked === true
                                            ? [...selected, option.value]
                                            : selected.filter(
                                                  (value) =>
                                                      value !== option.value,
                                              ),
                                    )
                                }
                            />
                            <span
                                className={cn(
                                    'flex size-8 shrink-0 items-center justify-center rounded-lg text-white',
                                    option.value === 'truck'
                                        ? 'bg-[#F36F21]'
                                        : 'bg-[#0F766E]',
                                )}
                            >
                                <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="font-medium">{option.label}</span>
                        </label>
                    );
                })}
            </div>
            <InputError message={error} />
        </div>
    );
}

function BargeMultiSelect({
    options,
    selected,
    selectedOptions,
    onChange,
    error,
}: {
    options: Option[];
    selected: string[];
    selectedOptions: Option[];
    onChange: (values: string[]) => void;
    error?: string;
}) {
    const [query, setQuery] = useState('');
    const filteredOptions = useMemo(() => {
        const normalisedQuery = query.trim().toLowerCase();

        if (!normalisedQuery) {
            return options;
        }

        return options.filter((option) =>
            [option.label, option.value].some((value) =>
                value.toLowerCase().includes(normalisedQuery),
            ),
        );
    }, [options, query]);

    const removeBarge = (imo: string) => {
        onChange(selected.filter((value) => value !== imo));
    };

    const toggleBarge = (imo: string, checked: boolean) => {
        onChange(
            checked
                ? [...selected, imo]
                : selected.filter((value) => value !== imo),
        );
    };

    return (
        <div className="grid gap-2">
            <Label>Assigned barges</Label>

            <div className="min-h-11 rounded-xl border border-[#D8E2EE] bg-[#F8FAFD] p-2">
                {selectedOptions.length === 0 ? (
                    <p className="px-1 py-1 text-sm text-[#64748B]">
                        No barges selected.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {selectedOptions.map((barge) => (
                            <Badge
                                key={barge.value}
                                variant="outline"
                                className="h-7 gap-1.5 rounded-full border-[#B8C7DA] bg-white pr-1 pl-2 text-[#172033]"
                            >
                                <Ship className="size-3.5 text-[#2455E6]" />
                                <span className="max-w-44 truncate">
                                    {barge.label}
                                </span>
                                <button
                                    type="button"
                                    className="flex size-5 items-center justify-center rounded-full text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#2455E6] focus-visible:ring-2 focus-visible:ring-[#2455E6]/40 focus-visible:outline-none"
                                    onClick={() => removeBarge(barge.value)}
                                    aria-label={`Remove ${barge.label}`}
                                >
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748B]" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search barges"
                    className="h-10 rounded-xl border-[#D8E2EE] bg-white pl-9"
                />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-[#D8E2EE] bg-white p-2">
                {filteredOptions.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-[#64748B]">
                        No barges found.
                    </p>
                ) : (
                    filteredOptions.map((barge) => {
                        const checked = selected.includes(barge.value);

                        return (
                            <label
                                key={barge.value}
                                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-[#334155] transition-colors hover:bg-[#F8FAFD]"
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(nextChecked) =>
                                        toggleBarge(
                                            barge.value,
                                            nextChecked === true,
                                        )
                                    }
                                />
                                <Ship className="size-4 shrink-0 text-[#2455E6]" />
                                <span className="min-w-0 flex-1 truncate">
                                    {barge.label}
                                </span>
                                <span className="text-xs text-[#64748B]">
                                    {barge.value}
                                </span>
                            </label>
                        );
                    })
                )}
            </div>
            <InputError message={error} />
        </div>
    );
}

function deliveryModeIcon(value: string): LucideIcon {
    return value === 'truck' ? Truck : Waves;
}

SurveyorsEdit.layout = {
    title: 'Surveyors',
};
