import { useForm } from '@inertiajs/react';
import { updateDetails } from '@/actions/App/Http/Controllers/EnquiryController';
import { SearchableCombobox } from '@/components/searchable-combobox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AgentOption, EnumOption } from '@/types';
import type { EnquiryRow } from './enquiry-card';

interface DetailsFormData {
    agent_id: string;
    sampling: string;
    supply_location: string;
    quality_claim: string;
    instructions: string;
    barging_cost: string;
    generate_order: boolean;
}

export function AdditionalDetailsDialog({
    open,
    onOpenChange,
    enquiry,
    agents,
    supplyLocationOptions,
    samplingOptions,
    qualityClaimOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    enquiry: EnquiryRow;
    agents: AgentOption[];
    supplyLocationOptions: EnumOption[];
    samplingOptions: EnumOption[];
    qualityClaimOptions: EnumOption[];
}) {
    const form = useForm<DetailsFormData>({
        agent_id: enquiry.agent_id ? String(enquiry.agent_id) : '',
        sampling: enquiry.sampling || 'barge_manifold',
        supply_location: enquiry.supply_location ?? '',
        quality_claim: enquiry.quality_claim ?? '',
        instructions: enquiry.instructions ?? '',
        barging_cost:
            enquiry.barging_cost != null ? String(enquiry.barging_cost) : '0',
        generate_order: false,
    });

    function submit(generateOrder: boolean) {
        form.transform((data) => ({
            ...data,
            agent_id: data.agent_id || null,
            supply_location: data.supply_location || null,
            quality_claim: data.quality_claim || null,
            instructions: data.instructions || null,
            barging_cost: data.barging_cost || 0,
            generate_order: generateOrder,
        }));

        form.submit(updateDetails(enquiry.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Additional Details</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="grid gap-1">
                        <Label>Agent</Label>
                        <SearchableCombobox
                            items={[
                                {
                                    value: '',
                                    label: 'To be appointed by LIOC',
                                    sublabel: 'Default',
                                },
                                ...agents.map((agent) => ({
                                    value: String(agent.id),
                                    label: agent.name,
                                    sublabel: agent.address ?? '',
                                })),
                            ]}
                            value={form.data.agent_id}
                            onChange={(value) =>
                                form.setData('agent_id', value)
                            }
                            placeholder="Select agent"
                            searchPlaceholder="Search name or address"
                            emptyText="No agents available."
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label>Sampling</Label>
                        <Select
                            value={form.data.sampling}
                            onValueChange={(value) =>
                                form.setData('sampling', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {samplingOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1">
                        <Label>Supply Location</Label>
                        <Select
                            value={form.data.supply_location}
                            onValueChange={(value) =>
                                form.setData('supply_location', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {supplyLocationOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1">
                        <Label>Quality Claim</Label>
                        <Select
                            value={form.data.quality_claim}
                            onValueChange={(value) =>
                                form.setData('quality_claim', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select window" />
                            </SelectTrigger>
                            <SelectContent>
                                {qualityClaimOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor={`instructions-${enquiry.id}`}>
                            Other Instructions
                        </Label>
                        <Textarea
                            id={`instructions-${enquiry.id}`}
                            value={form.data.instructions}
                            onChange={(e) =>
                                form.setData('instructions', e.target.value)
                            }
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor={`barging-cost-${enquiry.id}`}>
                            Barging Cost
                        </Label>
                        <Input
                            id={`barging-cost-${enquiry.id}`}
                            type="number"
                            value={form.data.barging_cost}
                            onChange={(e) =>
                                form.setData('barging_cost', e.target.value)
                            }
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={form.processing}
                        onClick={() => submit(false)}
                    >
                        Save
                    </Button>
                    <Button
                        type="button"
                        disabled={form.processing}
                        onClick={() => submit(true)}
                    >
                        Generate Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
