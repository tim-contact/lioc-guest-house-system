import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
import { destroy, store, update } from '@/routes/ports';

// ---- Shape of one port, matching what PortController@index sends ----
interface Port {
    id: number;
    name: string;
}

interface PortsIndexProps {
    ports: Port[];
}

const portColumns: ExportColumn<Port>[] = [
    { header: 'Name', value: (port) => port.name },
];

const config: CrudConfig<Port> = {
    title: 'Ports',
    entityLabel: 'Port',
    filename: 'ports',
    emptyText: 'No ports yet.',
    pk: (port) => port.id,
    defaultSortKey: 'name',
    exportColumns: portColumns,
    editTitle: (port) => port.name,
    deleteLabel: (port) => port.name,
    columns: [
        {
            header: 'Name',
            sortKey: 'name',
            cell: (port) => port.name,
            className: 'font-medium',
        },
    ],
    fields: [{ name: 'name', label: 'Name' }],
    toFormData: (port) => ({
        name: port?.name ?? '',
    }),
    routes: {
        store: () => store(),
        update: (id) => update(Number(id)),
        destroy: (id) => destroy(Number(id)),
    },
};

export default function PortsIndex({ ports }: PortsIndexProps) {
    return <ResourceCrudPage rows={ports} config={config} />;
}

PortsIndex.layout = {
    title: 'Ports',
};
