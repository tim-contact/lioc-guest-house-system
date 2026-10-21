import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cancel as cancelOrder } from '@/routes/orders';

interface CancellationOrder {
    id: number;
    order_number: string | null;
    vessel_name: string | null;
}

interface CancellationFormData {
    cancellation_charge: string;
    cancellation_reason: string;
}

export function CancelOrderDialog({
    order,
    open,
    onOpenChange,
}: {
    order: CancellationOrder;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm<CancellationFormData>({
        cancellation_charge: '',
        cancellation_reason: '',
    });

    function submit(): void {
        form.submit(cancelOrder(order.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Cancel order</DialogTitle>
                    <DialogDescription>
                        Record the cancellation details for{' '}
                        {order.order_number ??
                            order.vessel_name ??
                            'this order'}
                        .
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="cancellation-charge">
                            Cancellation charge
                        </Label>
                        <Input
                            id="cancellation-charge"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={form.data.cancellation_charge}
                            onChange={(event) =>
                                form.setData(
                                    'cancellation_charge',
                                    event.target.value,
                                )
                            }
                            aria-invalid={Boolean(
                                form.errors.cancellation_charge,
                            )}
                        />
                        {form.errors.cancellation_charge && (
                            <p className="text-sm text-destructive">
                                {form.errors.cancellation_charge}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="cancellation-reason">
                            Cancellation reason
                        </Label>
                        <Textarea
                            id="cancellation-reason"
                            rows={4}
                            maxLength={2000}
                            value={form.data.cancellation_reason}
                            onChange={(event) =>
                                form.setData(
                                    'cancellation_reason',
                                    event.target.value,
                                )
                            }
                            aria-invalid={Boolean(
                                form.errors.cancellation_reason,
                            )}
                        />
                        {form.errors.cancellation_reason && (
                            <p className="text-sm text-destructive">
                                {form.errors.cancellation_reason}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Keep order
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={form.processing}
                        onClick={submit}
                    >
                        Cancel order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
