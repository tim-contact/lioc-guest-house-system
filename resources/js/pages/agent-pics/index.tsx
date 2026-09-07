import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
import { destroy, store, update } from '@/routes/agent-pics';
import type { AgentOption } from '@/types';

// ---- One PIC line, matching what AgentPicController@index sends ----
interface AgentPic {
    id: number;
    agent_id: number;
    agent_name: string;
    name: string;
    mobile: string;
    contact_numbers: string[];
}

interface AgentPicsIndexProps {
    pics: AgentPic[];
    agents: AgentOption[];
}

const picColumns: ExportColumn<AgentPic>[] = [
    { header: 'Agency', value: (pic) => pic.agent_name },
    { header: 'PIC', value: (pic) => pic.name },
    { header: 'Mobile Numbers', value: (pic) => mobileNumbers(pic) },
];

function mobileNumbers(pic: AgentPic): string {
    return pic.contact_numbers.length > 0
        ? pic.contact_numbers.join(', ')
        : pic.mobile;
}

export default function AgentPicsIndex({ pics, agents }: AgentPicsIndexProps) {
    const config: CrudConfig<AgentPic> = {
        title: 'Agents',
        entityLabel: 'PIC',
        filename: 'agent-pics',
        emptyText: 'No PICs yet.',
        pk: (pic) => pic.id,
        defaultSortKey: 'agent_name',
        exportColumns: picColumns,
        editTitle: (pic) => `${pic.name} (${pic.agent_name})`,
        deleteLabel: (pic) => `${pic.name} (${pic.agent_name})`,
        columns: [
            {
                header: 'Agency',
                sortKey: 'agent_name',
                cell: (pic) => pic.agent_name,
                className: 'font-medium',
            },
            { header: 'PIC', sortKey: 'name', cell: (pic) => pic.name },
            {
                header: 'Mobile Numbers',
                sortKey: 'mobile',
                cell: (pic) => mobileNumbers(pic),
            },
        ],
        fields: [
            {
                name: 'agent_id',
                label: 'Agency',
                type: 'select',
                options: agents.map((agent) => ({
                    value: String(agent.id),
                    label: agent.name,
                })),
            },
            { name: 'name', label: 'PIC' },
            { name: 'mobile', label: 'Mobile Numbers' },
        ],
        toFormData: (pic) => ({
            agent_id: pic ? String(pic.agent_id) : '',
            name: pic?.name ?? '',
            mobile: pic?.mobile ?? '',
        }),
        routes: {
            store: () => store(),
            update: (id) => update(Number(id)),
            destroy: (id) => destroy(Number(id)),
        },
    };

    return <ResourceCrudPage rows={pics} config={config} />;
}

AgentPicsIndex.layout = {
    title: 'Agents',
};
