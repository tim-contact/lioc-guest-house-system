import { useState } from 'react';
import type { CrudColumn, CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import { DateRangeExport } from '@/components/date-range-export';
import { DisputeEditDialog } from '@/components/dispute-edit-dialog';
import type { DisputeRow } from '@/components/dispute-edit-dialog';
import { Button } from '@/components/ui/button';
import { DISPUTE_PARAMETER_FIELDS } from '@/lib/domain';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney, optionLabel, shortDate } from '@/lib/utils';
import type { EnumOption } from '@/types';

interface DisputesTableProps {
    disputes: DisputeRow[];
    disputeTypeOptions: EnumOption[];
    proposedActionPlanOptions: EnumOption[];
    actionStatusOptions: EnumOption[];
}

export default function DisputesTable({
    disputes,
    disputeTypeOptions,
    proposedActionPlanOptions,
    actionStatusOptions,
}: DisputesTableProps) {
    const [editing, setEditing] = useState<DisputeRow | null>(null);

    const exportColumns: ExportColumn<DisputeRow>[] = [
        { header: 'Order Number', value: (d) => d.order_number ?? '' },
        { header: 'Order Date', value: (d) => d.order_date ?? '' },
        { header: 'Customer', value: (d) => d.customer_name ?? '' },
        { header: 'Vessel', value: (d) => d.vessel_name ?? '' },
        { header: 'Port', value: (d) => d.port ?? '' },
        { header: 'Supply Location', value: (d) => d.delivery_location ?? '' },
        {
            header: 'Type of Dispute',
            value: (d) => d.type_of_dispute_label ?? '',
        },
        { header: 'Dispute Value', value: (d) => d.dispute_value ?? '' },
        ...DISPUTE_PARAMETER_FIELDS.map(
            ({ field, label }): ExportColumn<DisputeRow> => ({
                header: label,
                value: (d) => d[field] ?? '',
            }),
        ),
        { header: 'Testing Date', value: (d) => d.testing_date ?? '' },
        {
            header: 'Proposed Action Plan',
            value: (d) =>
                optionLabel(proposedActionPlanOptions, d.proposed_action_plan),
        },
        {
            header: 'Action Status',
            value: (d) => optionLabel(actionStatusOptions, d.action_status),
        },
        {
            header: 'Closure Remark',
            value: (d) => d.dispute_closure_remark ?? '',
        },
        { header: 'Status', value: (d) => d.dispute_status },
        { header: 'Invoice Value', value: (d) => d.invoice_value ?? '' },
        { header: 'Amount Received', value: (d) => d.amount_received ?? '' },
        { header: 'Balance', value: (d) => d.balance_amount ?? '' },
        { header: 'Created', value: (d) => d.created_at ?? '' },
    ];

    const config: CrudConfig<DisputeRow> = {
        title: 'Disputes',
        entityLabel: 'Dispute',
        filename: 'disputes',
        emptyText: 'No disputes yet.',
        pk: (dispute) => dispute.id,
        defaultSortKey: 'created_at',
        canCreate: false,
        canEdit: false,
        canDelete: false,
        exportColumns,
        exportControl: (
            <DateRangeExport
                url="/disputes/all/export"
                columns={exportColumns}
                filename="disputes"
                dateLabel="dispute creation date"
            />
        ),
        rowActions: (dispute) => (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(dispute)}
            >
                Edit
            </Button>
        ),
        columns: [
            {
                header: 'Order Number',
                sortKey: 'order_number',
                cell: (d) => d.order_number ?? '—',
                className: 'font-medium',
            },
            {
                header: 'Order Date',
                sortKey: 'order_date',
                cell: (d) => shortDate(d.order_date),
            },
            {
                header: 'Customer',
                sortKey: 'customer_name',
                cell: (d) => d.customer_name ?? '—',
            },
            {
                header: 'Vessel',
                sortKey: 'vessel_name',
                cell: (d) => d.vessel_name ?? '—',
            },
            { header: 'Port', sortKey: 'port', cell: (d) => d.port ?? '—' },
            {
                header: 'Type',
                sortKey: 'type_of_dispute_label',
                cell: (d) => d.type_of_dispute_label ?? '—',
            },
            {
                header: 'Dispute Value',
                sortKey: 'dispute_value',
                align: 'right',
                cell: (d) => formatMoney(d.dispute_value),
            },
            ...DISPUTE_PARAMETER_FIELDS.map(
                ({ field, label }): CrudColumn<DisputeRow> => ({
                    header: label,
                    sortKey: field,
                    align: 'right',
                    cell: (d) => d[field] ?? '—',
                }),
            ),
            {
                header: 'Testing Date',
                sortKey: 'testing_date',
                cell: (d) => shortDate(d.testing_date),
            },
            {
                header: 'Proposed Action Plan',
                sortKey: 'proposed_action_plan',
                cell: (d) =>
                    optionLabel(
                        proposedActionPlanOptions,
                        d.proposed_action_plan,
                    ),
            },
            {
                header: 'Action Status',
                sortKey: 'action_status',
                cell: (d) => optionLabel(actionStatusOptions, d.action_status),
            },
            {
                header: 'Status',
                sortKey: 'dispute_status',
                cell: (d) => d.dispute_status,
                className: 'capitalize',
            },
            {
                header: 'Invoice Value',
                sortKey: 'invoice_value',
                align: 'right',
                cell: (d) => formatMoney(d.invoice_value),
            },
            {
                header: 'Balance',
                sortKey: 'balance_amount',
                align: 'right',
                cell: (d) => formatMoney(d.balance_amount),
            },
        ],
    };

    return (
        <>
            <ResourceCrudPage rows={disputes} config={config} />

            {editing && (
                <DisputeEditDialog
                    open
                    onOpenChange={(open) => !open && setEditing(null)}
                    dispute={editing}
                    disputeTypeOptions={disputeTypeOptions}
                    proposedActionPlanOptions={proposedActionPlanOptions}
                    actionStatusOptions={actionStatusOptions}
                />
            )}
        </>
    );
}

DisputesTable.layout = {
    title: 'Disputes',
};
