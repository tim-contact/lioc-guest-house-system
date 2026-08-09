import type { DisputeRow } from '@/components/dispute-edit-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatMoney } from '@/lib/utils';
import type { OrderEditRow } from './dashboard';

export function DisputePickerDialog({
    open,
    onOpenChange,
    order,
    onSelect,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: OrderEditRow;
    onSelect: (dispute: DisputeRow) => void;
    onCreate: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Disputes — Order {order.order_number}
                    </DialogTitle>
                </DialogHeader>

                <div className="divide-y rounded-md border">
                    {order.disputes.map((dispute) => (
                        <button
                            key={dispute.id}
                            type="button"
                            onClick={() => onSelect(dispute)}
                            className="flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left text-sm hover:bg-muted/50"
                        >
                            <span className="flex flex-col">
                                <span className="font-medium">
                                    {dispute.type_of_dispute_label ?? '—'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Dispute #{dispute.id}
                                </span>
                            </span>
                            <span className="flex items-center gap-3">
                                <span className="tabular-nums">
                                    {formatMoney(dispute.dispute_value)}
                                </span>
                                <Badge
                                    variant={
                                        dispute.dispute_status === 'closed'
                                            ? 'secondary'
                                            : 'destructive'
                                    }
                                    className="capitalize"
                                >
                                    {dispute.dispute_status}
                                </Badge>
                            </span>
                        </button>
                    ))}
                </div>

                <Button type="button" variant="outline" onClick={onCreate}>
                    Raise new dispute
                </Button>
            </DialogContent>
        </Dialog>
    );
}
