import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    close,
    destroy,
    reopen,
    update,
} from '@/actions/App/Http/Controllers/DisputeController';
import { DatePicker } from '@/components/date-picker';
import {
    LabeledField,
    LabeledSelect,
    ReadOnlyValue,
} from '@/components/edit-panel/fields';
import { FormSection } from '@/components/edit-panel/form-section';
import { LockedEditDialog } from '@/components/edit-panel/locked-edit-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { DISPUTE_PARAMETER_FIELDS } from '@/lib/domain';
import {
    dateOnlyToDate,
    dateToDateOnly,
    emptyToNull,
    formatMoney,
    shortDate,
} from '@/lib/utils';
import type { EnumOption } from '@/types';

export interface DisputeRow {
    id: number;
    created_at: string | null;
    type_of_dispute: string | null;
    type_of_dispute_label: string | null;
    dispute_value: string | null;
    value_as_per_supply: string | null;
    value_as_per_claim: string | null;
    value_as_per_testing: string | null;
    testing_date: string | null;
    proposed_action_plan: string | null;
    action_status: string | null;
    dispute_closure_remark: string | null;
    dispute_status: 'open' | 'closed';
    order_number: string | null;
    order_date: string | null;
    order_status: string | null;
    customer_name: string | null;
    vessel_name: string | null;
    vessel_id: string | null;
    port: string | null;
    delivery_location: string | null;
    vlsfo_qty: string | null;
    mgo_qty: string | null;
    hsfo_qty: string | null;
    invoice_value: string | null;
    amount_received: string | null;
    balance_amount: number | null;
}

interface DisputeFormData {
    type_of_dispute: string;
    dispute_value: string;
    value_as_per_supply: string;
    value_as_per_claim: string;
    value_as_per_testing: string;
    testing_date: string;
    proposed_action_plan: string;
    action_status: string;
    dispute_closure_remark: string;
}

export function DisputeEditDialog({
    open,
    onOpenChange,
    dispute,
    disputeTypeOptions,
    proposedActionPlanOptions,
    actionStatusOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dispute: DisputeRow;
    disputeTypeOptions: EnumOption[];
    proposedActionPlanOptions: EnumOption[];
    actionStatusOptions: EnumOption[];
}) {
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const form = useForm<DisputeFormData>({
        type_of_dispute: dispute.type_of_dispute ?? '',
        dispute_value: dispute.dispute_value ?? '',
        value_as_per_supply: dispute.value_as_per_supply ?? '',
        value_as_per_claim: dispute.value_as_per_claim ?? '',
        value_as_per_testing: dispute.value_as_per_testing ?? '',
        testing_date: dispute.testing_date ?? '',
        proposed_action_plan: dispute.proposed_action_plan ?? '',
        action_status: dispute.action_status ?? '',
        dispute_closure_remark: dispute.dispute_closure_remark ?? '',
    });

    const isClosed = dispute.dispute_status === 'closed';

    function submit() {
        form.transform(emptyToNull);

        form.submit(update(dispute.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
                onOpenChange(false);
            },
        });
    }

    function submitClose() {
        form.transform(emptyToNull);

        form.submit(close(dispute.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
                onOpenChange(false);
            },
        });
    }

    function submitReopen() {
        router.patch(
            reopen(dispute.id).url,
            {},
            { preserveScroll: true, onSuccess: () => onOpenChange(false) },
        );
    }

    return (
        <>
            <LockedEditDialog
                open={open}
                onOpenChange={onOpenChange}
                title={
                    <span className="flex items-center gap-2">
                        Dispute — Order {dispute.order_number ?? dispute.id}
                        <Badge
                            variant={isClosed ? 'secondary' : 'destructive'}
                            className="capitalize"
                        >
                            {dispute.dispute_status}
                        </Badge>
                    </span>
                }
                size="xl"
                onSave={submit}
                saving={form.processing}
                summary={
                    <>
                        <FormSection title="Order" cols={3}>
                            <ReadOnlyValue
                                label="Order Number"
                                value={dispute.order_number}
                            />
                            <ReadOnlyValue
                                label="Order Date"
                                value={shortDate(dispute.order_date)}
                            />
                            <ReadOnlyValue
                                label="Order Status"
                                value={dispute.order_status}
                            />
                            <ReadOnlyValue
                                label="Customer"
                                value={dispute.customer_name}
                            />
                            <ReadOnlyValue
                                label="Vessel Name"
                                value={dispute.vessel_name}
                            />
                            <ReadOnlyValue
                                label="IMO No"
                                value={dispute.vessel_id}
                            />
                            <ReadOnlyValue label="Port" value={dispute.port} />
                            <ReadOnlyValue
                                label="Supply Location"
                                value={dispute.delivery_location}
                            />
                        </FormSection>

                        <FormSection title="Delivered Quantities" cols={3}>
                            <ReadOnlyValue
                                label="VLSFO"
                                value={dispute.vlsfo_qty}
                            />
                            <ReadOnlyValue
                                label="MGO"
                                value={dispute.mgo_qty}
                            />
                            <ReadOnlyValue
                                label="HSFO"
                                value={dispute.hsfo_qty}
                            />
                        </FormSection>

                        <FormSection title="Invoice" cols={3}>
                            <ReadOnlyValue
                                label="Invoice Value"
                                value={formatMoney(dispute.invoice_value)}
                            />
                            <ReadOnlyValue
                                label="Amount Received"
                                value={formatMoney(dispute.amount_received)}
                            />
                            <ReadOnlyValue
                                label="Balance"
                                value={formatMoney(dispute.balance_amount)}
                            />
                        </FormSection>
                    </>
                }
                footerExtra={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            className="mr-auto text-destructive hover:text-destructive"
                            onClick={() => setConfirmingDelete(true)}
                        >
                            Delete
                        </Button>
                        {isClosed ? (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.processing}
                                onClick={submitReopen}
                            >
                                Reopen
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={form.processing}
                                onClick={submitClose}
                            >
                                Close Dispute
                            </Button>
                        )}
                    </>
                }
            >
                <FormSection title="Dispute">
                    <LabeledSelect
                        label="Type of Dispute"
                        value={form.data.type_of_dispute}
                        options={disputeTypeOptions}
                        onChange={(value) =>
                            form.setData('type_of_dispute', value)
                        }
                        placeholder="Select type of dispute"
                        error={form.errors.type_of_dispute}
                    />
                    <LabeledSelect
                        label="Proposed Action Plan"
                        value={form.data.proposed_action_plan}
                        options={proposedActionPlanOptions}
                        onChange={(value) =>
                            form.setData('proposed_action_plan', value)
                        }
                        placeholder="Select proposed action plan"
                        clearable
                        error={form.errors.proposed_action_plan}
                    />
                </FormSection>

                <Separator />

                <FormSection title="Dispute Parameter Value">
                    {DISPUTE_PARAMETER_FIELDS.map(({ field, label }) => (
                        <LabeledField
                            key={field}
                            id={`dispute-${field}`}
                            label={label}
                            type="number"
                            step="0.001"
                            value={form.data[field]}
                            onChange={(value) => form.setData(field, value)}
                            placeholder="N/A"
                        />
                    ))}
                    <div className="grid gap-1">
                        <Label htmlFor="dispute-testing-date">
                            Testing Date
                        </Label>
                        <DatePicker
                            id="dispute-testing-date"
                            value={dateOnlyToDate(form.data.testing_date)}
                            onChange={(date) =>
                                form.setData(
                                    'testing_date',
                                    dateToDateOnly(date),
                                )
                            }
                        />
                    </div>
                </FormSection>

                <Separator />

                <FormSection title="Resolution">
                    <LabeledField
                        id="dispute-value"
                        label="Dispute Value (USD)"
                        type="currency"
                        value={form.data.dispute_value}
                        onChange={(value) =>
                            form.setData('dispute_value', value)
                        }
                        placeholder="N/A"
                    />
                    <LabeledSelect
                        label="Action Status"
                        value={form.data.action_status}
                        options={actionStatusOptions}
                        onChange={(value) =>
                            form.setData('action_status', value)
                        }
                        placeholder="Select action status"
                        clearable
                        error={form.errors.action_status}
                    />

                    <div className="grid gap-1 sm:col-span-2">
                        <Label htmlFor="dispute-closure-remark">
                            Dispute Closure Remark
                        </Label>
                        <Textarea
                            id="dispute-closure-remark"
                            value={form.data.dispute_closure_remark}
                            onChange={(e) =>
                                form.setData(
                                    'dispute_closure_remark',
                                    e.target.value,
                                )
                            }
                            placeholder="Required to close the dispute"
                        />
                        {form.errors.dispute_closure_remark && (
                            <p className="text-sm text-destructive">
                                {form.errors.dispute_closure_remark}
                            </p>
                        )}
                    </div>
                </FormSection>
            </LockedEditDialog>

            <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete dispute</DialogTitle>
                        <DialogDescription>
                            Delete the dispute for order{' '}
                            {dispute.order_number ?? dispute.id}? This cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmingDelete(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                router.delete(destroy(dispute.id).url, {
                                    onSuccess: () => {
                                        setConfirmingDelete(false);
                                        onOpenChange(false);
                                    },
                                })
                            }
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
