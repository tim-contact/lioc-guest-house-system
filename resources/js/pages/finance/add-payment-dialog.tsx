import { useForm } from '@inertiajs/react';
import { storePayment } from '@/actions/App/Http/Controllers/FinanceController';
import {
    LabeledField,
    LabeledSelect,
    ReadOnlyValue,
} from '@/components/edit-panel/fields';
import { FormSection } from '@/components/edit-panel/form-section';
import { LockedEditDialog } from '@/components/edit-panel/locked-edit-dialog';
import {
    dateToDateOnly,
    formatMoney,
    optionLabel,
    shortDate,
} from '@/lib/utils';
import type { EnumOption } from '@/types';
import type { CompletedRow, PaymentRow } from './dashboard';

interface PaymentFormData {
    amount: string;
    date: string;
    type: string;
}

export function AddPaymentDialog({
    open,
    onOpenChange,
    order,
    paymentTypeOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: CompletedRow;
    paymentTypeOptions: EnumOption[];
}) {
    const form = useForm<PaymentFormData>({
        amount: '',
        date: dateToDateOnly(new Date()),
        type: 'regular',
    });

    function submit() {
        form.submit(storePayment(order.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <LockedEditDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Add Payment — Order ${order.order_number}`}
            onSave={submit}
            saving={form.processing}
            summary={
                <FormSection title="Invoice">
                    <ReadOnlyValue
                        label="Invoice Value"
                        value={formatMoney(order.invoice_value)}
                    />
                    <ReadOnlyValue
                        label="Amount Received"
                        value={formatMoney(order.amount_received)}
                    />
                </FormSection>
            }
        >
            <FormSection title="Payment" cols={3}>
                <LabeledField
                    id="payment-amount"
                    label="Amount"
                    type="currency"
                    value={form.data.amount}
                    onChange={(value) => form.setData('amount', value)}
                />
                <LabeledField
                    id="payment-date"
                    label="Date"
                    type="date"
                    value={form.data.date}
                    onChange={(value) => form.setData('date', value)}
                />
                <LabeledSelect
                    label="Type"
                    value={form.data.type}
                    options={paymentTypeOptions}
                    onChange={(value) => form.setData('type', value)}
                    error={form.errors.type}
                />
            </FormSection>

            <PaymentHistory
                payments={order.payments}
                paymentTypeOptions={paymentTypeOptions}
            />
        </LockedEditDialog>
    );
}

function PaymentHistory({
    payments,
    paymentTypeOptions,
}: {
    payments: PaymentRow[];
    paymentTypeOptions: EnumOption[];
}) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Payment History
            </h3>

            {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No payments recorded.
                </p>
            ) : (
                <div className="max-h-48 overflow-y-auto rounded-md border">
                    <div className="divide-y">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                            >
                                <span>{shortDate(payment.date)}</span>
                                <span className="text-muted-foreground">
                                    {optionLabel(
                                        paymentTypeOptions,
                                        payment.type,
                                    )}
                                </span>
                                <span className="tabular-nums">
                                    {formatMoney(payment.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
