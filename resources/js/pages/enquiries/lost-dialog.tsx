import { useForm } from '@inertiajs/react';
import { markLost } from '@/actions/App/Http/Controllers/EnquiryController';
import { MoneyInput } from '@/components/money-input';
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
import { FUEL_GRADES } from '@/lib/domain';
import { emptyToNull } from '@/lib/utils';

interface LostFormData {
    lost_to: string;
    lost_port: string;
    vlsfo_lost_price: string;
    mgo_lost_price: string;
    hsfo_lost_price: string;
}

export function LostDialog({
    open,
    onOpenChange,
    enquiryId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    enquiryId: number;
}) {
    const form = useForm<LostFormData>({
        lost_to: '',
        lost_port: '',
        vlsfo_lost_price: '',
        mgo_lost_price: '',
        hsfo_lost_price: '',
    });

    function submit() {
        form.transform(emptyToNull);

        form.submit(markLost(enquiryId), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mark enquiry as lost?</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="grid gap-1">
                        <Label htmlFor={`lost-to-${enquiryId}`}>Lost To</Label>
                        <Input
                            id={`lost-to-${enquiryId}`}
                            value={form.data.lost_to}
                            onChange={(e) =>
                                form.setData('lost_to', e.target.value)
                            }
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor={`lost-port-${enquiryId}`}>
                            Lost To Port
                        </Label>
                        <Input
                            id={`lost-port-${enquiryId}`}
                            value={form.data.lost_port}
                            onChange={(e) =>
                                form.setData('lost_port', e.target.value)
                            }
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {FUEL_GRADES.map((product) => {
                            const field =
                                `${product.key}_lost_price` as keyof LostFormData;

                            return (
                                <div key={product.key} className="grid gap-1">
                                    <Label htmlFor={`${field}-${enquiryId}`}>
                                        {product.label} Price
                                    </Label>
                                    <MoneyInput
                                        id={`${field}-${enquiryId}`}
                                        value={form.data[field]}
                                        onChange={(value) =>
                                            form.setData(field, value)
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={form.processing}
                        onClick={submit}
                    >
                        Mark Lost
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
