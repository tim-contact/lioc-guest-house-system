import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
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

SurveyorsEdit.layout = {
    title: 'Surveyors',
};
