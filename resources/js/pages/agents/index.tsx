import { ChevronDown, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import { Button } from '@/components/ui/button';
import type { ExportColumn } from '@/lib/export-xlsx';
import { cn } from '@/lib/utils';
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
    { header: 'Contact details', value: (agent) => contactDetails(agent) },
];

type ContactKind = 'phone' | 'email';

interface ContactEntry {
    kind: ContactKind;
    value: string;
}

function isPresent(value: string | null): value is string {
    return typeof value === 'string' && value.length > 0;
}

function contactValues(agent: Agent | null): string[] {
    const values =
        agent && agent.contact_numbers.length > 0
            ? agent.contact_numbers
            : [agent?.contact ?? ''].filter(isPresent);

    return values.length > 0 ? values : [''];
}

function emailValues(agent: Agent | null): string[] {
    const values =
        agent && agent.email_addresses.length > 0
            ? agent.email_addresses
            : [agent?.mail_id ?? null].filter(isPresent);

    return values.length > 0 ? values : [''];
}

function phoneEntries(agent: Agent): ContactEntry[] {
    const values =
        agent.contact_numbers.length > 0
            ? agent.contact_numbers
            : [agent.contact].filter(isPresent);

    return values.map((value) => ({ kind: 'phone', value }));
}

function emailEntries(agent: Agent): ContactEntry[] {
    const values =
        agent.email_addresses.length > 0
            ? agent.email_addresses
            : [agent.mail_id].filter(isPresent);

    return values.map((value) => ({ kind: 'email', value }));
}

function contactEntries(agent: Agent): ContactEntry[] {
    return [...phoneEntries(agent), ...emailEntries(agent)];
}

function primaryContactEntries(agent: Agent): ContactEntry[] {
    return [phoneEntries(agent)[0], emailEntries(agent)[0]].filter(
        Boolean,
    ) as ContactEntry[];
}

function additionalContactEntries(agent: Agent): ContactEntry[] {
    return [...phoneEntries(agent).slice(1), ...emailEntries(agent).slice(1)];
}

function contactDetails(agent: Agent): string {
    const entries = contactEntries(agent);

    return entries
        .map(
            (entry) =>
                `${entry.kind === 'phone' ? 'Phone' : 'Email'}: ${entry.value}`,
        )
        .join(', ');
}

function ContactDetailsCell({ agent }: { agent: Agent }) {
    const [expanded, setExpanded] = useState(false);
    const primaryEntries = primaryContactEntries(agent);
    const additionalEntries = additionalContactEntries(agent);

    if (primaryEntries.length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <div className="flex max-w-[22rem] flex-col gap-1.5">
            {primaryEntries.map((entry) => (
                <ContactRow
                    key={`${entry.kind}-primary-${entry.value}`}
                    entry={entry}
                />
            ))}

            {expanded &&
                additionalEntries.map((entry) => (
                    <ContactRow
                        key={`${entry.kind}-extra-${entry.value}`}
                        entry={entry}
                    />
                ))}

            {additionalEntries.length > 0 && (
                <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 w-fit px-1.5 text-xs font-semibold text-[#2455E6] hover:bg-[#EEF2FF] hover:text-[#1746E8]"
                    onClick={() => setExpanded((current) => !current)}
                >
                    <ChevronDown
                        className={cn(
                            'size-3 transition-transform',
                            expanded && 'rotate-180',
                        )}
                    />
                    {expanded
                        ? 'Show less'
                        : `+${additionalEntries.length} more`}
                </Button>
            )}
        </div>
    );
}

function ContactRow({ entry }: { entry: ContactEntry }) {
    const Icon = entry.kind === 'phone' ? Phone : Mail;
    const label = entry.kind === 'phone' ? 'Phone' : 'Email';

    return (
        <div className="flex min-w-0 items-center gap-2">
            <span
                className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-white',
                    entry.kind === 'phone' ? 'bg-[#0F766E]' : 'bg-[#2455E6]',
                )}
                title={label}
            >
                <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 truncate text-sm text-[#334155]">
                {entry.value}
            </span>
        </div>
    );
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
            header: 'Contact details',
            sortKey: 'contact',
            cell: (agent) => <ContactDetailsCell agent={agent} />,
        },
    ],
    fields: [
        { name: 'name', label: 'Name' },
        { name: 'address', label: 'Address' },
        {
            name: 'contact_numbers',
            label: 'Contact Numbers',
            type: 'string-list',
            itemType: 'tel',
            placeholder: 'Enter contact number',
            addLabel: 'Add contact number',
            section: 'Contact details',
        },
        {
            name: 'email_addresses',
            label: 'Email IDs',
            type: 'string-list',
            itemType: 'email',
            placeholder: 'Enter email address',
            addLabel: 'Add email ID',
            section: 'Contact details',
        },
    ],
    toFormData: (agent) => ({
        name: agent?.name ?? '',
        address: agent?.address ?? '',
        contact_numbers: contactValues(agent),
        email_addresses: emailValues(agent),
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
