import {
    destroy,
    update,
} from '@/actions/App/Http/Controllers/DisputeController';
import type { CrudColumn, CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { DisputeRow } from '@/components/dispute-edit-dialog';
import { DISPUTE_PARAMETER_FIELDS } from '@/lib/domain';
import type { ExportColumn } from '@/lib/export-xlsx';
import { formatMoney, optionLabel, shortDate, str } from '@/lib/utils';
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
        formColumns: 2,
        exportColumns,
        editTitle: (dispute) => dispute.order_number ?? `#${dispute.id}`,
        deleteLabel: (dispute) =>
            dispute.order_number ?? `dispute #${dispute.id}`,
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
        fields: [
            {
                name: 'type_of_dispute',
                label: 'Type of Dispute',
                type: 'select',
                options: disputeTypeOptions,
            },
            {
                name: 'dispute_value',
                label: 'Dispute Value',
                type: 'number',
                step: '0.01',
            },
            ...DISPUTE_PARAMETER_FIELDS.map(({ field, label }) => ({
                name: field,
                label,
                type: 'number' as const,
                step: '0.001',
            })),
            { name: 'testing_date', label: 'Testing Date', type: 'date' },
            {
                name: 'proposed_action_plan',
                label: 'Proposed Action Plan',
                type: 'select',
                options: proposedActionPlanOptions,
            },
            {
                name: 'action_status',
                label: 'Action Status',
                type: 'select',
                options: actionStatusOptions,
            },
            {
                name: 'dispute_closure_remark',
                label: 'Closure Remark',
                type: 'textarea',
            },
        ],
        toFormData: (dispute) => ({
            type_of_dispute: str(dispute?.type_of_dispute),
            dispute_value: str(dispute?.dispute_value),
            value_as_per_supply: str(dispute?.value_as_per_supply),
            value_as_per_claim: str(dispute?.value_as_per_claim),
            value_as_per_testing: str(dispute?.value_as_per_testing),
            testing_date: str(dispute?.testing_date),
            proposed_action_plan: str(dispute?.proposed_action_plan),
            action_status: str(dispute?.action_status),
            dispute_closure_remark: str(dispute?.dispute_closure_remark),
        }),
        routes: {
            update: (id) => update(Number(id)),
            destroy: (id) => destroy(Number(id)),
        },
    };

    return <ResourceCrudPage rows={disputes} config={config} />;
}

DisputesTable.layout = {
    title: 'Disputes',
};
