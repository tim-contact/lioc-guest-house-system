import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import OrderDashboard from '@/components/order-dashboard';
import type { OrderRow, RowAction } from '@/components/order-dashboard';
import {
    ALL_PORTS_VALUE,
    filterPortScopedRows,
    PortScopedOrderSearch,
} from '@/components/port-scoped-order-search';
import type { PortSearchState } from '@/components/port-scoped-order-search';
import { PortSummaryCards } from '@/components/port-summary-cards';
import type {
    AgentOption,
    AgentPicOption,
    SupplyLocationOption,
} from '@/types';
import { OrderEditDialog } from './order-edit-dialog';

export interface OpsEditRow extends OrderRow {
    order_number: string;
    vessel_id: string | null;
    port_id: number | null;
    delivery_mode: string | null;
    delivery_location_id: number | null;
    delivery_location: string | null;
    barge_id: string | null;
    agent_id: number | null;
    agent_pic_id: number | null;
    mobile_no: string | null;
}

export interface BargeOption {
    imo: string;
    name: string;
}

interface OperationsDashboardProps {
    pendingOrders: OpsEditRow[];
    completedOrders: OpsEditRow[];
    ports: string[];
    barges: BargeOption[];
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    supplyLocationOptions: SupplyLocationOption[];
}

export default function OperationsDashboard({
    pendingOrders,
    completedOrders,
    ports,
    barges,
    agents,
    agentPics,
    supplyLocationOptions,
}: OperationsDashboardProps) {
    const [editing, setEditing] = useState<OpsEditRow | null>(null);
    const [filters, setFilters] = useState<PortSearchState>({
        query: '',
        port: ALL_PORTS_VALUE,
    });

    const rowActions: RowAction<OpsEditRow>[] = [
        { label: 'Edit', variant: 'default', onClick: setEditing },
    ];

    const visiblePorts = useMemo(
        () =>
            filters.port === ALL_PORTS_VALUE
                ? ports
                : ports.filter((port) => port === filters.port),
        [filters.port, ports],
    );
    const filteredPendingOrders = useMemo(
        () => filterPortScopedRows(pendingOrders, filters),
        [filters, pendingOrders],
    );
    const filteredCompletedOrders = useMemo(
        () => filterPortScopedRows(completedOrders, filters),
        [completedOrders, filters],
    );
    const resultCount =
        filteredPendingOrders.length + filteredCompletedOrders.length;

    return (
        <>
            <Head title="Operations" />

            <main className="min-h-[calc(100svh-4.25rem)] overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.045),transparent_32%),#F4F7FA] px-3 py-4 sm:px-4 md:px-6">
                <div className="flex w-full flex-col gap-4">
                    <PortScopedOrderSearch
                        ports={ports}
                        value={filters}
                        onChange={setFilters}
                        resultCount={resultCount}
                    />

                    <PortSummaryCards
                        ports={visiblePorts}
                        pendingOrders={filteredPendingOrders}
                        completedOrders={filteredCompletedOrders}
                    />

                    <OrderDashboard
                        ports={visiblePorts}
                        pendingOrders={filteredPendingOrders}
                        completedOrders={filteredCompletedOrders}
                        pendingActions={rowActions}
                        completedActions={rowActions}
                    />
                </div>
            </main>

            {editing && (
                <OrderEditDialog
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                    order={editing}
                    barges={barges}
                    agents={agents}
                    agentPics={agentPics}
                    supplyLocationOptions={supplyLocationOptions}
                />
            )}
        </>
    );
}

OperationsDashboard.layout = {
    title: 'Operations',
};
