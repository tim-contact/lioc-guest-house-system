import { router, useForm } from '@inertiajs/react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExportColumn } from '@/lib/export-xlsx';
import { destroy, store, update } from '@/routes/ports';

interface SupplyLocation {
    id: number;
    port_id: number;
    name: string;
}

// ---- Shape of one port, matching what PortController@index sends ----
interface Port {
    id: number;
    name: string;
    supply_locations: SupplyLocation[];
}

interface PortsIndexProps {
    ports: Port[];
}

const portColumns: ExportColumn<Port>[] = [
    { header: 'Name', value: (port) => port.name },
    {
        header: 'Supply Locations',
        value: (port) =>
            port.supply_locations.map((location) => location.name).join(', '),
    },
];

function storeSupplyLocation(port: Port): string {
    return `/ports/${port.id}/supply-locations`;
}

function updateSupplyLocation(port: Port, location: SupplyLocation): string {
    return `/ports/${port.id}/supply-locations/${location.id}`;
}

function destroySupplyLocation(port: Port, location: SupplyLocation): string {
    return `/ports/${port.id}/supply-locations/${location.id}`;
}

function SupplyLocationsCell({ port }: { port: Port }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const createForm = useForm({ name: '' });
    const editForm = useForm({ name: '' });

    function startEditing(location: SupplyLocation) {
        setEditingId(location.id);
        editForm.setData('name', location.name);
        editForm.clearErrors();
    }

    function submitCreate(event: React.FormEvent) {
        event.preventDefault();

        createForm.post(storeSupplyLocation(port), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    }

    function submitEdit(event: React.FormEvent, location: SupplyLocation) {
        event.preventDefault();

        editForm.patch(updateSupplyLocation(port, location), {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    return (
        <div className="flex min-w-80 flex-col gap-2">
            <div className="flex flex-col gap-1">
                {port.supply_locations.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                        No supply locations
                    </span>
                ) : (
                    port.supply_locations.map((location) =>
                        editingId === location.id ? (
                            <form
                                key={location.id}
                                onSubmit={(event) =>
                                    submitEdit(event, location)
                                }
                                className="flex items-center gap-1"
                            >
                                <Input
                                    value={editForm.data.name}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    className="h-7"
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    size="icon-sm"
                                    title="Save supply location"
                                    disabled={editForm.processing}
                                >
                                    <Check />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    title="Cancel edit"
                                    onClick={() => setEditingId(null)}
                                >
                                    <X />
                                </Button>
                            </form>
                        ) : (
                            <div
                                key={location.id}
                                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1"
                            >
                                <span className="text-sm">
                                    {location.name}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        title="Edit supply location"
                                        onClick={() => startEditing(location)}
                                    >
                                        <Pencil />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-xs"
                                        title="Delete supply location"
                                        onClick={() =>
                                            router.delete(
                                                destroySupplyLocation(
                                                    port,
                                                    location,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>
                        ),
                    )
                )}
            </div>

            <form onSubmit={submitCreate} className="flex items-start gap-1">
                <div className="flex-1">
                    <Input
                        value={createForm.data.name}
                        onChange={(event) =>
                            createForm.setData('name', event.target.value)
                        }
                        placeholder="Add supply location"
                        className="h-7"
                    />
                    {createForm.errors.name && (
                        <p className="mt-1 text-xs text-destructive">
                            {createForm.errors.name}
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    size="icon-sm"
                    title="Add supply location"
                    disabled={createForm.processing}
                >
                    <Plus />
                </Button>
            </form>
        </div>
    );
}

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
        {
            header: 'Supply Locations',
            cell: (port) => <SupplyLocationsCell port={port} />,
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
