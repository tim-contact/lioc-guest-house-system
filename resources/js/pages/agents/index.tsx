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
    contact_numbers: string[];
    email_addresses: string[];
}

interface AgentsIndexProps {
    agents: Agent[];
}

const agentColumns: ExportColumn<Agent>[] = [
    { header: 'Name', value: (agent) => agent.name },
    { header: 'Address', value: (agent) => agent.address },
    { header: 'Contact Numbers', value: (agent) => contactNumbers(agent) },
    { header: 'Mail IDs', value: (agent) => emailAddresses(agent) },
];

function contactNumbers(agent: Agent): string {
    return agent.contact_numbers.length > 0
        ? agent.contact_numbers.join(', ')
        : agent.contact;
}

function emailAddresses(agent: Agent): string {
    return agent.email_addresses.length > 0
        ? agent.email_addresses.join(', ')
        : (agent.mail_id ?? '');
}

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
            header: 'Contact Numbers',
            sortKey: 'contact',
            cell: (agent) => contactNumbers(agent),
        },
        {
            header: 'Mail IDs',
            sortKey: 'mail_id',
            cell: (agent) => emailAddresses(agent) || '—',
        },
    ],
    fields: [
        { name: 'name', label: 'Name' },
        { name: 'address', label: 'Address' },
        { name: 'contact', label: 'Contact Numbers' },
        { name: 'mail_id', label: 'Mail IDs' },
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
