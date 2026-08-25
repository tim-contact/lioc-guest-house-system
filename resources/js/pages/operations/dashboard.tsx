import { Head } from '@inertiajs/react';
import { useState } from 'react';
import OrderDashboard from '@/components/order-dashboard';
import type { OrderRow, RowAction } from '@/components/order-dashboard';
import { PortSummaryCards } from '@/components/port-summary-cards';
import type { AgentOption, AgentPicOption, EnumOption } from '@/types';
import { OrderEditDialog } from './order-edit-dialog';

export interface OpsEditRow extends OrderRow {
    order_number: string;
    vessel_id: string | null;
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
    barges: BargeOption[];
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    supplyLocationOptions: EnumOption[];
}

export default function OperationsDashboard({
    pendingOrders,
    completedOrders,
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

            <div className="p-4 pb-0">
                <PortSummaryCards
                    pendingOrders={pendingOrders}
                    completedOrders={completedOrders}
                />
            </div>

            <OrderDashboard
                pendingOrders={pendingOrders}
                completedOrders={completedOrders}
                pendingActions={rowActions}
                completedActions={rowActions}
            />

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
