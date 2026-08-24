import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { DateRangePicker } from '@/components/date-range-picker';
import { NoneSelect } from '@/components/none-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDragScroll } from '@/hooks/use-drag-scroll';
import { dateToDateOnly, toDateRange } from '@/lib/utils';
import { store } from '@/routes/enquiries';
import type { AgentOption, EnumOption } from '@/types';
import { EnquiryCard } from './enquiry-card';
import type {
    CustomerCredit,
    CustomerOption,
    EnquiryRow,
    PortOption,
} from './enquiry-card';

interface EnquiriesIndexProps {
    enquiries: EnquiryRow[];
    customers: CustomerOption[];
    creditByCustomer: Record<string, CustomerCredit>;
    ports: PortOption[];
    agents: AgentOption[];
    supplyLocationOptions: EnumOption[];
    productTypeOptions: EnumOption[];
    deliveryModeOptions: EnumOption[];
    creditTermsOptions: EnumOption[];
    samplingOptions: EnumOption[];
    qualityClaimOptions: EnumOption[];
}

export default function EnquiriesIndex({
    enquiries,
    customers,
    creditByCustomer,
    ports,
    agents,
    supplyLocationOptions,
    productTypeOptions,
    deliveryModeOptions,
    creditTermsOptions,
    samplingOptions,
    qualityClaimOptions,
}: EnquiriesIndexProps) {
    const [creating, setCreating] = useState(false);
    const rowRef = useDragScroll<HTMLDivElement>();

    return (
        <>
            <Head title="Enquiries" />

            <div className="flex min-h-0 flex-1 flex-col gap-5 bg-[#f6f9fc] p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
                            Enquiries
                        </h1>
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                            {enquiries.length}
                        </span>
                    </div>
                    <Button
                        onClick={() => setCreating(true)}
                        className="w-full bg-[#315cfd] text-white shadow-[0_1px_2px_rgba(49,92,253,0.24)] hover:bg-[#254be6] sm:w-auto"
                    >
                        + New Enquiry
                    </Button>
                </div>

                {enquiries.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                        No enquiries yet.
                    </div>
                ) : (
                    <div
                        ref={rowRef}
                        tabIndex={0}
                        aria-label="Enquiries"
                        className="flex min-h-0 flex-1 cursor-grab items-start gap-4 overflow-x-auto overflow-y-hidden px-1 pt-1 pb-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:gap-5"
                    >
                        {enquiries.map((enquiry) => (
                            <div
                                key={enquiry.id}
                                className="w-[36rem] shrink-0 cursor-auto"
                            >
                                <EnquiryCard
                                    enquiry={enquiry}
                                    customers={customers}
                                    creditByCustomer={creditByCustomer}
                                    ports={ports}
                                    agents={agents}
                                    supplyLocationOptions={
                                        supplyLocationOptions
                                    }
                                    productTypeOptions={productTypeOptions}
                                    deliveryModeOptions={deliveryModeOptions}
                                    creditTermsOptions={creditTermsOptions}
                                    samplingOptions={samplingOptions}
                                    qualityClaimOptions={qualityClaimOptions}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <CreateEnquiryForm
                        ports={ports}
                        onDone={() => setCreating(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

// ---- Minimal "New Enquiry" form (products filled in later on the card) ----
function CreateEnquiryForm({
    ports,
    onDone,
}: {
    ports: PortOption[];
    onDone: () => void;
}) {
    const form = useForm({
        vessel_name: '',
        imo: '',
        port_id: '',
        laycan_from: '',
        laycan_to: '',
    });

    function create(event: React.FormEvent) {
        event.preventDefault();
        form.submit(store(), { onSuccess: onDone });
    }

    return (
        <form onSubmit={create} className="flex flex-col gap-4">
            <DialogHeader>
                <DialogTitle>New Enquiry</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
                <Label htmlFor="create-vessel-name">Vessel Name</Label>
                <Input
                    id="create-vessel-name"
                    value={form.data.vessel_name}
                    onChange={(e) =>
                        form.setData('vessel_name', e.target.value)
                    }
                />
                {form.errors.vessel_name && (
                    <p className="text-sm text-destructive">
                        {form.errors.vessel_name}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="create-imo">IMO</Label>
                <Input
                    id="create-imo"
                    value={form.data.imo}
                    onChange={(e) => form.setData('imo', e.target.value)}
                />
            </div>

            <div className="grid gap-2">
                <Label>Port</Label>
                <NoneSelect
                    value={form.data.port_id}
                    onChange={(value) => form.setData('port_id', value)}
                    options={ports.map((port) => ({
                        value: String(port.id),
                        label: port.name,
                    }))}
                    noneLabel="No port"
                />
            </div>

            <div className="grid gap-2">
                <Label>Delivery Laycan</Label>
                <DateRangePicker
                    value={toDateRange(
                        form.data.laycan_from,
                        form.data.laycan_to,
                    )}
                    onChange={(range) => {
                        form.setData({
                            ...form.data,
                            laycan_from: dateToDateOnly(range?.from),
                            laycan_to: dateToDateOnly(range?.to),
                        });
                    }}
                    placeholder="Pick delivery window"
                />
            </div>

            <DialogFooter>
                <Button type="submit" disabled={form.processing}>
                    Create
                </Button>
            </DialogFooter>
        </form>
    );
}

EnquiriesIndex.layout = {
    title: 'Enquiries',
};
