import {
    destroy,
    editStore,
    editUpdate,
} from '@/actions/App/Http/Controllers/EnquiryController';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import { DateRangeExport } from '@/components/date-range-export';
import type { PaginationMeta } from '@/components/pagination-controls';
import { FUEL_GRADES } from '@/lib/domain';
import type { ExportColumn } from '@/lib/export-xlsx';
import { optionLabel, shortDate, str, toDateInput } from '@/lib/utils';
import type { EnumOption, SupplyLocationOption } from '@/types';

interface Enquiry {
    id: number;
    created_at: string;
    vessel_name: string | null;
    imo: string | null;
    port_id: number | null;
    laycan_from: string | null;
    laycan_to: string | null;
    eta: string | null;
    status: string;
    agent_id: number | null;
    sampling: string;
    supply_location_id: number | null;
    supply_location: string | null;
    quality_claim: string | null;
    instructions: string | null;
    barging_cost: string | null;
    lost_to: string | null;
    lost_port: string | null;
    vlsfo_quantity_low: string | null;
    vlsfo_quantity_high: string | null;
    vlsfo_product_type: string | null;
    vlsfo_delivery_mode: string | null;
    vlsfo_lost_price: string | null;
    mgo_quantity_low: string | null;
    mgo_quantity_high: string | null;
    mgo_product_type: string | null;
    mgo_delivery_mode: string | null;
    mgo_lost_price: string | null;
    hsfo_quantity_low: string | null;
    hsfo_quantity_high: string | null;
    hsfo_product_type: string | null;
    hsfo_delivery_mode: string | null;
    hsfo_lost_price: string | null;
}

interface EnquiriesEditProps {
    enquiries: PaginationMeta & {
        data: Enquiry[];
    };
    ports: { id: number; name: string }[];
    agents: { id: number; name: string }[];
    statusOptions: EnumOption[];
    samplingOptions: EnumOption[];
    supplyLocationOptions: SupplyLocationOption[];
    qualityClaimOptions: EnumOption[];
    productTypeOptions: EnumOption[];
    deliveryModeOptions: EnumOption[];
}

export default function EnquiriesEdit({
    enquiries,
    ports,
    agents,
    statusOptions,
    samplingOptions,
    supplyLocationOptions,
    qualityClaimOptions,
    productTypeOptions,
    deliveryModeOptions,
}: EnquiriesEditProps) {
    const rows = enquiries.data;

    const portOptions = ports.map((port) => ({
        value: String(port.id),
        label: port.name,
    }));
    const agentOptions = agents.map((agent) => ({
        value: String(agent.id),
        label: agent.name,
    }));

    const exportColumns: ExportColumn<Enquiry>[] = [
        { header: 'Enquiry #', value: (enquiry) => enquiry.id },
        { header: 'Vessel', value: (enquiry) => enquiry.vessel_name ?? '' },
        { header: 'IMO', value: (enquiry) => enquiry.imo ?? '' },
        {
            header: 'Port',
            value: (enquiry) =>
                portOptions.find((p) => p.value === String(enquiry.port_id))
                    ?.label ?? '',
        },
        {
            header: 'Date Entered',
            value: (enquiry) => shortDate(enquiry.created_at),
        },
        {
            header: 'Laycan From',
            value: (enquiry) => enquiry.laycan_from ?? '',
        },
        { header: 'Laycan To', value: (enquiry) => enquiry.laycan_to ?? '' },
        { header: 'ETA', value: (enquiry) => enquiry.eta ?? '' },
        {
            header: 'Status',
            value: (enquiry) => optionLabel(statusOptions, enquiry.status, ''),
        },
        {
            header: 'Agent',
            value: (enquiry) =>
                agentOptions.find((a) => a.value === String(enquiry.agent_id))
                    ?.label ?? '',
        },
        {
            header: 'Sampling',
            value: (enquiry) =>
                optionLabel(samplingOptions, enquiry.sampling, ''),
        },
        {
            header: 'Supply Location',
            value: (enquiry) =>
                enquiry.supply_location ??
                optionLabel(
                    supplyLocationOptions,
                    enquiry.supply_location_id
                        ? String(enquiry.supply_location_id)
                        : null,
                    '',
                ),
        },
        {
            header: 'Quality Claim',
            value: (enquiry) =>
                optionLabel(qualityClaimOptions, enquiry.quality_claim, ''),
        },
        {
            header: 'Other Instructions',
            value: (enquiry) => enquiry.instructions ?? '',
        },
        {
            header: 'Barging Cost',
            value: (enquiry) => enquiry.barging_cost ?? '',
        },
        { header: 'Lost To', value: (enquiry) => enquiry.lost_to ?? '' },
        { header: 'Lost To Port', value: (enquiry) => enquiry.lost_port ?? '' },
        ...FUEL_GRADES.flatMap((product): ExportColumn<Enquiry>[] => [
            {
                header: `${product.label} Minimum Quantity`,
                value: (enquiry) =>
                    enquiry[`${product.key}_quantity_low`] ?? '',
            },
            {
                header: `${product.label} Maximum Quantity`,
                value: (enquiry) =>
                    enquiry[`${product.key}_quantity_high`] ?? '',
            },
            {
                header: `${product.label} Product Type`,
                value: (enquiry) =>
                    optionLabel(
                        productTypeOptions,
                        enquiry[`${product.key}_product_type`],
                        '',
                    ),
            },
            {
                header: `${product.label} Delivery Mode`,
                value: (enquiry) =>
                    optionLabel(
                        deliveryModeOptions,
                        enquiry[`${product.key}_delivery_mode`],
                        '',
                    ),
            },
            {
                header: `${product.label} Lost Price`,
                value: (enquiry) => enquiry[`${product.key}_lost_price`] ?? '',
            },
        ]),
    ];

    const config: CrudConfig<Enquiry> = {
        title: 'Enquiries',
        entityLabel: 'Enquiry',
        filename: 'enquiries',
        emptyText: 'No enquiries yet.',
        pk: (enquiry) => enquiry.id,
        defaultSortKey: 'id',
        formColumns: 2,
        dialogClassName: 'sm:max-w-2xl',
        exportColumns,
        exportControl: (
            <DateRangeExport
                url="/enquiries/edit/export"
                columns={exportColumns}
                filename="enquiries"
                dateLabel="enquiry date"
            />
        ),
        editTitle: (enquiry) => enquiry.vessel_name ?? `#${enquiry.id}`,
        deleteLabel: (enquiry) =>
            `${enquiry.vessel_name ?? 'enquiry'} (#${enquiry.id})`,
        columns: [
            {
                header: 'Enquiry #',
                sortKey: 'id',
                cell: (enquiry) => enquiry.id,
                className: 'font-medium',
            },
            {
                header: 'Vessel',
                sortKey: 'vessel_name',
                cell: (enquiry) => enquiry.vessel_name,
            },
            {
                header: 'Date Entered',
                sortKey: 'created_at',
                cell: (enquiry) => shortDate(enquiry.created_at),
            },
            {
                header: 'Status',
                sortKey: 'status',
                cell: (enquiry) =>
                    statusOptions.find((o) => o.value === enquiry.status)
                        ?.label ?? enquiry.status,
            },
        ],
        fields: [
            { name: 'vessel_name', label: 'Vessel Name', section: 'Core' },
            { name: 'imo', label: 'IMO', section: 'Core' },
            {
                name: 'port_id',
                label: 'Port',
                type: 'select',
                options: portOptions,
                resetOnChange: ['supply_location_id'],
                section: 'Core',
            },
            {
                name: 'laycan_from',
                label: 'Laycan From',
                type: 'date',
                section: 'Core',
            },
            {
                name: 'laycan_to',
                label: 'Laycan To',
                type: 'date',
                section: 'Core',
            },
            { name: 'eta', label: 'ETA', type: 'date', section: 'Core' },
            {
                name: 'status',
                label: 'Status',
                type: 'select',
                options: statusOptions,
                section: 'Core',
            },
            {
                name: 'agent_id',
                label: 'Agent',
                type: 'select',
                options: agentOptions,
                section: 'Details',
            },
            {
                name: 'sampling',
                label: 'Sampling',
                type: 'select',
                options: samplingOptions,
                section: 'Details',
            },
            {
                name: 'supply_location_id',
                label: 'Supply Location',
                type: 'select',
                options: (data) =>
                    data.port_id
                        ? supplyLocationOptions.filter(
                              (option) =>
                                  Number(option.port_id) ===
                                  Number(data.port_id),
                          )
                        : [],
                disabledWhen: (data) => !data.port_id,
                section: 'Details',
            },
            {
                name: 'quality_claim',
                label: 'Quality Claim',
                type: 'select',
                options: qualityClaimOptions,
                section: 'Details',
            },
            {
                name: 'instructions',
                label: 'Other Instructions',
                type: 'textarea',
                section: 'Details',
            },
            {
                name: 'barging_cost',
                label: 'Barging Cost',
                type: 'currency',
                section: 'Details',
            },
            { name: 'lost_to', label: 'Lost To', section: 'Details' },
            { name: 'lost_port', label: 'Lost To Port', section: 'Details' },
            ...FUEL_GRADES.flatMap((product) => [
                {
                    name: `${product.key}_quantity_low`,
                    label: 'Minimum Quantity',
                    type: 'number' as const,
                    step: '0.001',
                    section: product.label,
                },
                {
                    name: `${product.key}_quantity_high`,
                    label: 'Maximum Quantity',
                    type: 'number' as const,
                    step: '0.001',
                    section: product.label,
                },
                {
                    name: `${product.key}_product_type`,
                    label: 'Product Type',
                    type: 'select' as const,
                    options: productTypeOptions,
                    section: product.label,
                },
                {
                    name: `${product.key}_delivery_mode`,
                    label: 'Delivery Mode',
                    type: 'select' as const,
                    options: deliveryModeOptions,
                    section: product.label,
                },
                {
                    name: `${product.key}_lost_price`,
                    label: 'Lost Price',
                    type: 'currency' as const,
                    section: product.label,
                },
            ]),
        ],
        toFormData: (enquiry) => ({
            vessel_name: str(enquiry?.vessel_name),
            imo: str(enquiry?.imo),
            port_id: str(enquiry?.port_id),
            laycan_from: toDateInput(enquiry?.laycan_from),
            laycan_to: toDateInput(enquiry?.laycan_to),
            eta: toDateInput(enquiry?.eta),
            status: enquiry?.status ?? 'open',
            agent_id: str(enquiry?.agent_id),
            sampling: enquiry?.sampling ?? 'barge_manifold',
            supply_location_id: str(enquiry?.supply_location_id),
            quality_claim: str(enquiry?.quality_claim),
            instructions: str(enquiry?.instructions),
            barging_cost: str(enquiry?.barging_cost ?? '0'),
            lost_to: str(enquiry?.lost_to),
            lost_port: str(enquiry?.lost_port),
            ...Object.fromEntries(
                FUEL_GRADES.flatMap((product) => [
                    [
                        `${product.key}_quantity_low`,
                        str(enquiry?.[`${product.key}_quantity_low`]),
                    ],
                    [
                        `${product.key}_quantity_high`,
                        str(enquiry?.[`${product.key}_quantity_high`]),
                    ],
                    [
                        `${product.key}_product_type`,
                        str(enquiry?.[`${product.key}_product_type`]),
                    ],
                    [
                        `${product.key}_delivery_mode`,
                        str(enquiry?.[`${product.key}_delivery_mode`]),
                    ],
                    [
                        `${product.key}_lost_price`,
                        str(enquiry?.[`${product.key}_lost_price`]),
                    ],
                ]),
            ),
        }),
        routes: {
            store: () => editStore(),
            update: (id) => editUpdate(Number(id)),
            destroy: (id) => destroy(Number(id)),
        },
    };

    return (
        <ResourceCrudPage rows={rows} config={config} pagination={enquiries} />
    );
}

EnquiriesEdit.layout = {
    title: 'Enquiries',
};
