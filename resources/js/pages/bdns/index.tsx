import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { PaginationMeta } from '@/components/pagination-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SortDir } from '@/hooks/use-sortable';
import { QUALITY_FIELDS, SEALS, TIMESHEET_FIELDS } from '@/lib/bdn-fields';
import { FUEL_GRADES } from '@/lib/domain';
import type { ExportColumn } from '@/lib/export-xlsx';
import { optionLabel, shortDate, shortDateTime } from '@/lib/utils';
import type { EnumOption } from '@/types';

interface Bdn {
    id: number;
    order_id: number;
    bdn_number: string | null;
    order_number: string | null;
    customer_name: string | null;
    vessel_name: string | null;
    delivery_date: string | null;
    delivery_location: string | null;
    vessel_flag: string | null;
    grt: string | null;
    pi_club: string | null;
    agent_id: number | null;
    agent_name: string | null;
    owner_operator: string | null;
    last_port_of_call: string | null;
    destination_port: string | null;
    delivery_method: string | null;
    barge_id: number | null;
    barge_name: string | null;
    barge_alongside_at: string | null;
    chief_engineer_invited: boolean | null;
    chief_engineer_witnessed: boolean | null;
    retained_samples_handed_over: boolean | null;
    sampling_location: string | null;
    sampling_method: string | null;
    created_at: string | null;
    updated_at: string | null;
    [key: string]: string | number | boolean | null | undefined;
}

interface BdnsIndexProps {
    bdns: PaginationMeta & {
        data: Bdn[];
    };
    filters: {
        vessel: string;
        sort: keyof Bdn & string;
        dir: SortDir;
    };
    deliveryModeOptions: EnumOption[];
    samplingLocationOptions: EnumOption[];
    samplingMethodOptions: EnumOption[];
}

function yesNo(value: boolean | null): string {
    return value === null || value === undefined ? '—' : value ? 'Yes' : 'No';
}

/** Read a dynamic (grade/timesheet/quality/seal) field, excluding the boolean declarations. */
function field(bdn: Bdn, key: string): string | number {
    const value = bdn[key];

    return typeof value === 'boolean' || value === null || value === undefined
        ? ''
        : value;
}

export default function BdnsIndex({
    bdns,
    filters,
    deliveryModeOptions,
    samplingLocationOptions,
    samplingMethodOptions,
}: BdnsIndexProps) {
    const rows = bdns.data;
    const [vesselSearch, setVesselSearch] = useState(filters.vessel);
    const sortKey = filters.sort;
    const sortDir = filters.dir;

    const handleSort = (key: keyof Bdn & string) => {
        const nextDir = key === sortKey && sortDir === 'asc' ? 'desc' : 'asc';
        visitBdns(vesselSearch, bdns.per_page, key, nextDir);
    };
    const exportColumns: ExportColumn<Bdn>[] = [
        { header: 'BDN Number', value: (b) => b.bdn_number ?? '' },
        { header: 'Order Number', value: (b) => b.order_number ?? '' },
        { header: 'Customer', value: (b) => b.customer_name ?? '' },
        { header: 'Vessel', value: (b) => b.vessel_name ?? '' },
        { header: 'Vessel Flag', value: (b) => b.vessel_flag ?? '' },
        { header: 'GRT', value: (b) => b.grt ?? '' },
        { header: 'PI Club', value: (b) => b.pi_club ?? '' },
        { header: 'Delivery Date', value: (b) => b.delivery_date ?? '' },
        {
            header: 'Delivery Location',
            value: (b) => b.delivery_location ?? '',
        },
        {
            header: 'Delivery Method',
            value: (b) => optionLabel(deliveryModeOptions, b.delivery_method),
        },
        { header: 'Owner/Operator', value: (b) => b.owner_operator ?? '' },
        {
            header: 'Last Port of Call',
            value: (b) => b.last_port_of_call ?? '',
        },
        { header: 'Destination Port', value: (b) => b.destination_port ?? '' },
        { header: 'Barge', value: (b) => b.barge_name ?? b.barge_id ?? '' },
        {
            header: 'Barge Alongside At',
            value: (b) => b.barge_alongside_at ?? '',
        },
        { header: 'Agent', value: (b) => b.agent_name ?? '' },
        ...FUEL_GRADES.flatMap((grade): ExportColumn<Bdn>[] => [
            ...TIMESHEET_FIELDS.map(
                (timesheet): ExportColumn<Bdn> => ({
                    header: `${grade.label} ${timesheet.label}`,
                    value: (b) => field(b, `${grade.key}_${timesheet.field}`),
                }),
            ),
            ...QUALITY_FIELDS.map(
                (quality): ExportColumn<Bdn> => ({
                    header: `${grade.label} ${quality.label}`,
                    value: (b) => field(b, `${grade.key}_${quality.field}`),
                }),
            ),
        ]),
        {
            header: 'Chief Engineer Invited',
            value: (b) => yesNo(b.chief_engineer_invited),
        },
        {
            header: 'Chief Engineer Witnessed',
            value: (b) => yesNo(b.chief_engineer_witnessed),
        },
        {
            header: 'Retained Samples Handed Over',
            value: (b) => yesNo(b.retained_samples_handed_over),
        },
        {
            header: 'Sampling Location',
            value: (b) =>
                optionLabel(samplingLocationOptions, b.sampling_location),
        },
        {
            header: 'Sampling Method',
            value: (b) => optionLabel(samplingMethodOptions, b.sampling_method),
        },
        ...SEALS.flatMap((seal): ExportColumn<Bdn>[] => [
            {
                header: `${seal.name} Seal Number`,
                value: (b) => field(b, `${seal.prefix}_seal_number`),
            },
            {
                header: `${seal.name} Counter Seal Number`,
                value: (b) => field(b, `${seal.prefix}_counter_seal_number`),
            },
        ]),
        { header: 'Created At', value: (b) => b.created_at ?? '' },
        { header: 'Updated At', value: (b) => b.updated_at ?? '' },
    ];

    const config: CrudConfig<Bdn> = {
        title: 'BDNs',
        entityLabel: 'BDN',
        filename: 'bdns',
        emptyText: 'No BDNs yet.',
        pk: (bdn) => bdn.id,
        defaultSortKey: 'created_at',
        canCreate: false,
        canEdit: false,
        canDelete: false,
        dense: true,
        exportColumns,
        toolbar: (
            <form
                className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center"
                onSubmit={(event) => {
                    event.preventDefault();
                    visitBdns(vesselSearch, bdns.per_page, sortKey, sortDir);
                }}
            >
                <div className="relative min-w-0 flex-1">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748B]"
                        aria-hidden="true"
                    />
                    <Input
                        aria-label="Search BDNs by vessel name"
                        className="h-10 rounded-xl border-[#D8E2EE] bg-[#F8FAFD] pl-9 text-[#0F172A] placeholder:text-[#64748B]"
                        onChange={(event) =>
                            setVesselSearch(event.target.value)
                        }
                        placeholder="Search by vessel name"
                        value={vesselSearch}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button type="submit" className="h-10 rounded-xl">
                        Search
                    </Button>
                    {filters.vessel !== '' && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-xl border-[#D8E2EE]"
                            onClick={() => {
                                setVesselSearch('');
                                visitBdns('', bdns.per_page, sortKey, sortDir);
                            }}
                        >
                            <X />
                            Clear
                        </Button>
                    )}
                </div>
            </form>
        ),
        columns: [
            {
                header: 'BDN Number',
                sortKey: 'bdn_number',
                cell: (b) => b.bdn_number ?? '—',
                className: 'font-medium',
            },
            {
                header: 'Order Number',
                sortKey: 'order_number',
                cell: (b) => b.order_number ?? '—',
            },
            {
                header: 'Customer',
                sortKey: 'customer_name',
                cell: (b) => b.customer_name ?? '—',
            },
            {
                header: 'Vessel',
                sortKey: 'vessel_name',
                cell: (b) => b.vessel_name ?? '—',
            },
            {
                header: 'Delivery Date',
                sortKey: 'delivery_date',
                cell: (b) => shortDate(b.delivery_date),
            },
            {
                header: 'Delivery Location',
                sortKey: 'delivery_location',
                cell: (b) => b.delivery_location ?? 'â€”',
            },
            {
                header: 'Barge',
                sortKey: 'barge_name',
                cell: (b) => b.barge_name ?? b.barge_id ?? '—',
            },
            {
                header: 'Agent',
                sortKey: 'agent_name',
                cell: (b) => b.agent_name ?? '—',
            },
            {
                header: 'VLSFO MT',
                sortKey: 'vlsfo_metric_ton',
                align: 'right',
                cell: (b) => b.vlsfo_metric_ton ?? '—',
            },
            {
                header: 'MGO MT',
                sortKey: 'mgo_metric_ton',
                align: 'right',
                cell: (b) => b.mgo_metric_ton ?? '—',
            },
            {
                header: 'HSFO MT',
                sortKey: 'hsfo_metric_ton',
                align: 'right',
                cell: (b) => b.hsfo_metric_ton ?? '—',
            },
            {
                header: 'Sampling Method',
                sortKey: 'sampling_method',
                cell: (b) =>
                    optionLabel(samplingMethodOptions, b.sampling_method),
            },
            {
                header: 'Created At',
                sortKey: 'created_at',
                cell: (b) => shortDateTime(b.created_at),
            },
        ],
    };

    return (
        <ResourceCrudPage
            rows={rows}
            config={config}
            pagination={bdns}
            sort={{ key: sortKey, direction: sortDir }}
            onSort={handleSort}
        />
    );
}

function visitBdns(
    vessel: string,
    perPage: number,
    sortKey?: string,
    dir?: SortDir,
) {
    const params: Record<string, string> = {};
    const trimmedVessel = vessel.trim();

    if (trimmedVessel !== '') {
        params.vessel = trimmedVessel;
    }

    if (perPage !== 25) {
        params.per_page = String(perPage);
    }

    if (sortKey && sortKey !== 'created_at') {
        params.sort = sortKey;
    }

    if (dir && dir !== 'desc') {
        params.dir = dir;
    }

    router.get('/bdns', params, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
    });
}

BdnsIndex.layout = {
    title: 'BDNs',
};
