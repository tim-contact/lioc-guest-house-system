import { Head } from '@inertiajs/react';
import { useState } from 'react';
import OrderDashboard from '@/components/order-dashboard';
import type { OrderRow, RowAction } from '@/components/order-dashboard';
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

    const rowActions: RowAction<OpsEditRow>[] = [
        { label: 'Edit', variant: 'default', onClick: setEditing },
    ];

    return (
        <>
            <Head title="Operations" />

            <main className="min-h-[calc(100svh-4.25rem)] overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.045),transparent_32%),#F4F7FA] px-3 py-4 sm:px-4 md:px-6">
                <div className="flex w-full flex-col gap-4">
                    <PortSummaryCards
                        ports={ports}
                        pendingOrders={pendingOrders}
                        completedOrders={completedOrders}
                    />

                    <OrderDashboard
                        ports={ports}
                        pendingOrders={pendingOrders}
                        completedOrders={completedOrders}
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
