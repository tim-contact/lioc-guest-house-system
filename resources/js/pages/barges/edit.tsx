import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import { FUEL_GRADES } from '@/lib/domain';
import type { ExportColumn } from '@/lib/export-xlsx';
import { optionLabel } from '@/lib/utils';
import { destroy, store, update } from '@/routes/barges';
import type { EnumOption } from '@/types';

const CAPACITIES = FUEL_GRADES.map((grade) => ({
    key: `${grade.key}_capacity` as const,
    label: grade.label,
}));

interface Barge {
    imo: string;
    name: string;
    vlsfo_capacity: string | null;
    mgo_capacity: string | null;
    hsfo_capacity: string | null;
    status: string;
}

interface BargesEditProps {
    barges: Barge[];
    statusOptions: EnumOption[];
}

export default function BargesEdit({ barges, statusOptions }: BargesEditProps) {
    const exportColumns: ExportColumn<Barge>[] = [
        { header: 'IMO', value: (barge) => barge.imo },
        { header: 'Name', value: (barge) => barge.name },
        ...CAPACITIES.map((capacity) => ({
            header: `${capacity.label} Capacity`,
            value: (barge: Barge) => barge[capacity.key] ?? '',
        })),
        {
            header: 'Status',
            value: (barge) => optionLabel(statusOptions, barge.status),
        },
    ];

    const config: CrudConfig<Barge> = {
        title: 'Barges',
        entityLabel: 'Barge',
        filename: 'barges',
        emptyText: 'No barges yet.',
        pk: (barge) => barge.imo,
        defaultSortKey: 'name',
        formColumns: 2,
        exportColumns,
        editTitle: (barge) => barge.name,
        deleteLabel: (barge) => `${barge.name} (${barge.imo})`,
        columns: [
            {
                header: 'IMO',
                sortKey: 'imo',
                cell: (barge) => barge.imo,
                className: 'font-medium',
            },
            { header: 'Name', sortKey: 'name', cell: (barge) => barge.name },
            ...CAPACITIES.map((capacity) => ({
                header: `${capacity.label} Cap.`,
                sortKey: capacity.key,
                align: 'right' as const,
                cell: (barge: Barge) => barge[capacity.key] ?? '—',
            })),
            {
                header: 'Status',
                sortKey: 'status',
                cell: (barge) => optionLabel(statusOptions, barge.status),
            },
        ],
        fields: [
            { name: 'imo', label: 'IMO', type: 'number' },
            { name: 'name', label: 'Name' },
            ...CAPACITIES.map((capacity) => ({
                name: capacity.key,
                label: `${capacity.label} Capacity`,
                type: 'number' as const,
                step: '0.001',
            })),
            {
                name: 'status',
                label: 'Status',
                type: 'select',
                options: statusOptions,
            },
        ],
        toFormData: (barge) => ({
            imo: barge?.imo ?? '',
            name: barge?.name ?? '',
            ...Object.fromEntries(
                CAPACITIES.map((capacity) => [
                    capacity.key,
                    barge?.[capacity.key] ?? '',
                ]),
            ),
            status: barge?.status ?? 'available',
        }),
        routes: {
            store: () => store(),
            update: (id) => update(String(id)),
            destroy: (id) => destroy(String(id)),
        },
    };

    return <ResourceCrudPage rows={barges} config={config} />;
}

BargesEdit.layout = {
    title: 'Barges',
};
