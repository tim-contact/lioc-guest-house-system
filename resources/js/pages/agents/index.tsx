import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
import { destroy, store, update } from '@/routes/agents';

// ---- Shape of one agency, matching what AgentController@index sends ----
interface Agent {
    id: number;
    name: string;
    address: string;
    contact: string;
    mail_id: string | null;
}

interface AgentsIndexProps {
    agents: Agent[];
}

const agentColumns: ExportColumn<Agent>[] = [
    { header: 'Name', value: (agent) => agent.name },
    { header: 'Address', value: (agent) => agent.address },
    { header: 'Contact', value: (agent) => agent.contact },
    { header: 'Mail ID', value: (agent) => agent.mail_id ?? '' },
];

const config: CrudConfig<Agent> = {
    title: 'Agencies',
    entityLabel: 'Agency',
    filename: 'agencies',
    emptyText: 'No agencies yet.',
    pk: (agent) => agent.id,
    defaultSortKey: 'name',
    exportColumns: agentColumns,
    editTitle: (agent) => agent.name,
    deleteLabel: (agent) => `${agent.name} (${agent.address})`,
    columns: [
        {
            header: 'Name',
            sortKey: 'name',
            cell: (agent) => agent.name,
            className: 'font-medium',
        },
        {
            header: 'Address',
            sortKey: 'address',
            cell: (agent) => agent.address,
        },
        {
            header: 'Contact',
            sortKey: 'contact',
            cell: (agent) => agent.contact,
        },
        {
            header: 'Mail ID',
            sortKey: 'mail_id',
            cell: (agent) => agent.mail_id ?? '—',
        },
    ],
    fields: [
        { name: 'name', label: 'Name' },
        { name: 'address', label: 'Address' },
        { name: 'contact', label: 'Contact' },
        { name: 'mail_id', label: 'Mail ID' },
    ],
    toFormData: (agent) => ({
        name: agent?.name ?? '',
        address: agent?.address ?? '',
        contact: agent?.contact ?? '',
        mail_id: agent?.mail_id ?? '',
    }),
    routes: {
        store: () => store(),
        update: (id) => update(Number(id)),
        destroy: (id) => destroy(Number(id)),
    },
};

export default function AgentsIndex({ agents }: AgentsIndexProps) {
    return <ResourceCrudPage rows={agents} config={config} />;
}

AgentsIndex.layout = {
    title: 'Agencies',
};
