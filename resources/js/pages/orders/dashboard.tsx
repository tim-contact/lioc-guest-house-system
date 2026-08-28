import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import type { DisputeRow } from '@/components/dispute-edit-dialog';
import { DisputeEditDialog } from '@/components/dispute-edit-dialog';
import OrderDashboard from '@/components/order-dashboard';
import type { OrderRow, RowAction } from '@/components/order-dashboard';
import { PortSummaryCards } from '@/components/port-summary-cards';
import { cancel as cancelOrder } from '@/routes/orders';
import type {
    AgentOption,
    AgentPicOption,
    EnumOption,
    SupplyLocationOption,
} from '@/types';
import { DisputeCreateDialog } from './dispute-create-dialog';
import { DisputePickerDialog } from './dispute-picker-dialog';
import { OrderEditDialog } from './order-edit-dialog';

export interface OrderEditRow extends OrderRow {
    order_number: string;
    order_date: string | null;
    customer_id: string | null;
    vessel_id: string | null;
    port_id: number | null;
    delivery_location_id: number | null;
    agent_id: number | null;
    agent_pic_id: number | null;
    mobile_no: string | null;
    delivery_mode: string | null;
    laycan_to: string | null;
    disputes: DisputeRow[];
}

export interface CustomerOption {
    sap_id: string;
    name: string;
}

export interface PortOption {
    id: number;
    name: string;
}

interface OrdersDashboardProps {
    pendingOrders: OrderEditRow[];
    completedOrders: OrderEditRow[];
    customers: CustomerOption[];
    ports: PortOption[];
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    deliveryModeOptions: EnumOption[];
    supplyLocationOptions: SupplyLocationOption[];
    disputeTypeOptions: EnumOption[];
    proposedActionPlanOptions: EnumOption[];
    actionStatusOptions: EnumOption[];
}

export default function OrdersDashboard({
    pendingOrders,
    completedOrders,
    customers,
    ports,
    agents,
    agentPics,
    deliveryModeOptions,
    supplyLocationOptions,
    disputeTypeOptions,
    proposedActionPlanOptions,
    actionStatusOptions,
}: OrdersDashboardProps) {
    const [editing, setEditing] = useState<OrderEditRow | null>(null);
    const [picking, setPicking] = useState<OrderEditRow | null>(null);
    const [creating, setCreating] = useState<OrderEditRow | null>(null);
    const [editingDispute, setEditingDispute] = useState<DisputeRow | null>(
        null,
    );

    const disputeAction: RowAction<OrderEditRow> = {
        label: (row) =>
            row.disputes.length
                ? `Disputed (${row.disputes.length})`
                : 'Dispute',
        variant: 'destructive',
        className: (row) =>
            row.disputes.length
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : undefined,
        onClick: (row) =>
            row.disputes.length ? setPicking(row) : setCreating(row),
    };

    const pendingActions: RowAction<OrderEditRow>[] = [
        { label: 'Edit', variant: 'default', onClick: setEditing },
        {
            label: 'Cancel',
            variant: 'destructive',
            onClick: (row) =>
                router.patch(
                    cancelOrder(row.id).url,
                    {},
                    { preserveScroll: true },
                ),
        },
        disputeAction,
    ];

    const completedActions: RowAction<OrderEditRow>[] = [disputeAction];

    return (
        <>
            <Head title="Orders" />

            <div className="p-4 pb-0">
                <PortSummaryCards orders={pendingOrders} />
            </div>

            <OrderDashboard
                pendingOrders={pendingOrders}
                completedOrders={completedOrders}
                pendingActions={pendingActions}
                completedActions={completedActions}
            />

            {editing && (
                <OrderEditDialog
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                    order={editing}
                    customers={customers}
                    ports={ports}
                    agents={agents}
                    agentPics={agentPics}
                    deliveryModeOptions={deliveryModeOptions}
                    supplyLocationOptions={supplyLocationOptions}
                />
            )}

            {picking && (
                <DisputePickerDialog
                    open
                    onOpenChange={(open) => !open && setPicking(null)}
                    order={picking}
                    onSelect={(dispute) => {
                        setPicking(null);
                        setEditingDispute(dispute);
                    }}
                    onCreate={() => {
                        setCreating(picking);
                        setPicking(null);
                    }}
                />
            )}

            {editingDispute && (
                <DisputeEditDialog
                    open
                    onOpenChange={(open) => !open && setEditingDispute(null)}
                    dispute={editingDispute}
                    disputeTypeOptions={disputeTypeOptions}
                    proposedActionPlanOptions={proposedActionPlanOptions}
                    actionStatusOptions={actionStatusOptions}
                />
            )}

            {creating && (
                <DisputeCreateDialog
                    open
                    onOpenChange={(open) => !open && setCreating(null)}
                    order={creating}
                    typeOptions={disputeTypeOptions}
                />
            )}
        </>
    );
}

OrdersDashboard.layout = {
    title: 'Orders',
};
