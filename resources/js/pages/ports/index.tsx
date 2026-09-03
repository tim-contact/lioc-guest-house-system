import { Head, router, useForm } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ExportButton } from '@/components/export-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ExportColumn } from '@/lib/export-xlsx';
import { cn } from '@/lib/utils';
import { destroy, store, update } from '@/routes/ports';
import {
    destroy as destroySupplyLocation,
    store as storeSupplyLocation,
    update as updateSupplyLocation,
} from '@/routes/ports/supply-locations';

interface SupplyLocation {
    id: number;
    port_id: number;
    name: string;
}

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

export default function PortsIndex({ ports }: PortsIndexProps) {
    const [openPortIds, setOpenPortIds] = useState<number[]>(
        ports.slice(0, 1).map((port) => port.id),
    );
    const createForm = useForm({ name: '' });

    const togglePort = (portId: number, isOpen: boolean) => {
        setOpenPortIds((current) =>
            isOpen
                ? [...new Set([...current, portId])]
                : current.filter((id) => id !== portId),
        );
    };

    const submitCreate = (event: FormEvent) => {
        event.preventDefault();

        createForm.post(store().url, {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    return (
        <>
            <Head title="Ports" />

            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-5 md:px-8 md:py-6">
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-foreground">
                            Ports
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage ports and their supply locations from one
                            compact workspace.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setOpenPortIds(ports.map((port) => port.id))
                            }
                            disabled={ports.length === 0}
                        >
                            Expand all
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenPortIds([])}
                            disabled={openPortIds.length === 0}
                        >
                            Collapse all
                        </Button>
                        <ExportButton
                            rows={ports}
                            columns={portColumns}
                            filename="ports"
                        />
                    </div>
                </div>

                <form
                    onSubmit={submitCreate}
                    className="flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-background/70 p-3 sm:flex-row sm:items-start"
                >
                    <div className="min-w-0 flex-1">
                        <Input
                            value={createForm.data.name}
                            onChange={(event) =>
                                createForm.setData('name', event.target.value)
                            }
                            placeholder="Add a new port"
                            aria-label="Port name"
                        />
                        {createForm.errors.name && (
                            <p className="mt-1 text-xs text-destructive">
                                {createForm.errors.name}
                            </p>
                        )}
                    </div>
                    <Button type="submit" disabled={createForm.processing}>
                        <Plus />
                        Add port
                    </Button>
                </form>

                <div className="flex flex-col gap-3">
                    {ports.map((port) => (
                        <PortAccordionItem
                            key={port.id}
                            port={port}
                            isOpen={openPortIds.includes(port.id)}
                            onOpenChange={(isOpen) =>
                                togglePort(port.id, isOpen)
                            }
                        />
                    ))}

                    {ports.length === 0 && (
                        <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                            No ports yet.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function PortAccordionItem({
    port,
    isOpen,
    onOpenChange,
}: {
    port: Port;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const [isEditingPort, setIsEditingPort] = useState(false);
    const [isDeletingPort, setIsDeletingPort] = useState(false);
    const editForm = useForm({ name: port.name });

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();

        editForm.put(update(port.id).url, {
            preserveScroll: true,
            onSuccess: () => setIsEditingPort(false),
        });
    };

    const cancelEdit = () => {
        editForm.setData('name', port.name);
        editForm.clearErrors();
        setIsEditingPort(false);
    };

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={onOpenChange}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
            <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MapPin className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate font-heading text-base font-semibold">
                                {port.name}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">
                                    {port.supply_locations.length}{' '}
                                    {port.supply_locations.length === 1
                                        ? 'location'
                                        : 'locations'}
                                </Badge>
                            </span>
                        </span>
                        <ChevronDown
                            className={cn(
                                'size-4 shrink-0 text-muted-foreground transition-transform',
                                isOpen && 'rotate-180',
                            )}
                        />
                    </button>
                </CollapsibleTrigger>

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPort(true)}
                    >
                        <Pencil />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeletingPort(true)}
                    >
                        <Trash2 />
                        Delete
                    </Button>
                </div>
            </div>

            <CollapsibleContent>
                <div className="border-t border-border bg-muted/20 px-4 py-4">
                    {isEditingPort && (
                        <form
                            onSubmit={submitEdit}
                            className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-start"
                        >
                            <div className="min-w-0 flex-1">
                                <Input
                                    value={editForm.data.name}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    aria-label="Port name"
                                    autoFocus
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {editForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={editForm.processing}
                                >
                                    <Check />
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEdit}
                                >
                                    <X />
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    <SupplyLocationsPanel port={port} />
                </div>
            </CollapsibleContent>

            <Dialog open={isDeletingPort} onOpenChange={setIsDeletingPort}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete port</DialogTitle>
                        <DialogDescription>
                            Delete {port.name}? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeletingPort(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() =>
                                router.delete(destroy(port.id).url, {
                                    preserveScroll: true,
                                    onSuccess: () => setIsDeletingPort(false),
                                })
                            }
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Collapsible>
    );
}

function SupplyLocationsPanel({ port }: { port: Port }) {
    const createForm = useForm({ name: '' });

    const submitCreate = (event: FormEvent) => {
        event.preventDefault();

        createForm.post(storeSupplyLocation(port.id).url, {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-foreground">
                    Supply locations
                </h2>
                <span className="text-xs text-muted-foreground">
                    {port.supply_locations.length || 'No'} configured
                </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                {port.supply_locations.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                        No supply locations have been added for this port.
                    </div>
                ) : (
                    port.supply_locations.map((location) => (
                        <SupplyLocationRow
                            key={location.id}
                            port={port}
                            location={location}
                        />
                    ))
                )}
            </div>

            <form
                onSubmit={submitCreate}
                className="flex flex-col gap-2 sm:flex-row sm:items-start"
            >
                <div className="min-w-0 flex-1">
                    <Input
                        value={createForm.data.name}
                        onChange={(event) =>
                            createForm.setData('name', event.target.value)
                        }
                        placeholder="Add supply location"
                        aria-label="Supply location name"
                    />
                    {createForm.errors.name && (
                        <p className="mt-1 text-xs text-destructive">
                            {createForm.errors.name}
                        </p>
                    )}
                </div>
                <Button type="submit" disabled={createForm.processing}>
                    <Plus />
                    Add location
                </Button>
            </form>
        </div>
    );
}

function SupplyLocationRow({
    port,
    location,
}: {
    port: Port;
    location: SupplyLocation;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const editForm = useForm({ name: location.name });

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();

        editForm.patch(
            updateSupplyLocation({
                port: port.id,
                supply_location: location.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => setIsEditing(false),
            },
        );
    };

    const cancelEdit = () => {
        editForm.setData('name', location.name);
        editForm.clearErrors();
        setIsEditing(false);
    };

    return (
        <div className="border-b border-border last:border-b-0">
            {isEditing ? (
                <form
                    onSubmit={submitEdit}
                    className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-start"
                >
                    <div className="min-w-0 flex-1">
                        <Input
                            value={editForm.data.name}
                            onChange={(event) =>
                                editForm.setData('name', event.target.value)
                            }
                            aria-label="Supply location name"
                            autoFocus
                        />
                        {editForm.errors.name && (
                            <p className="mt-1 text-xs text-destructive">
                                {editForm.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={editForm.processing}
                        >
                            <Check />
                            Save
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelEdit}
                        >
                            <X />
                            Cancel
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate text-sm">
                        {location.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="Edit supply location"
                            onClick={() => setIsEditing(true)}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            title="Delete supply location"
                            onClick={() => setIsDeleting(true)}
                        >
                            <Trash2 />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete supply location</DialogTitle>
                        <DialogDescription>
                            Delete {location.name}? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleting(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() =>
                                router.delete(
                                    destroySupplyLocation({
                                        port: port.id,
                                        supply_location: location.id,
                                    }).url,
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => setIsDeleting(false),
                                    },
                                )
                            }
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

PortsIndex.layout = {
    title: 'Ports',
};
