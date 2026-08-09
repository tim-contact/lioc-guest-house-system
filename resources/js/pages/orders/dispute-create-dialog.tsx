import { useForm } from '@inertiajs/react';
import { store } from '@/actions/App/Http/Controllers/DisputeController';
import { LabeledSelect } from '@/components/edit-panel/fields';
import { LockedEditDialog } from '@/components/edit-panel/locked-edit-dialog';
import type { EnumOption } from '@/types';
import type { OrderEditRow } from './dashboard';

export function DisputeCreateDialog({
    open,
    onOpenChange,
    order,
    typeOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: OrderEditRow;
    typeOptions: EnumOption[];
}) {
    const form = useForm({ type_of_dispute: '' });

    function submit() {
        form.submit(store(order.id), {
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
            title={`Raise Dispute — Order ${order.order_number}`}
            size="sm"
            onSave={submit}
            saving={form.processing}
        >
            <LabeledSelect
                label="Type of Dispute"
                value={form.data.type_of_dispute}
                options={typeOptions}
                onChange={(value) => form.setData('type_of_dispute', value)}
                placeholder="Select type"
                error={form.errors.type_of_dispute}
            />
        </LockedEditDialog>
    );
}
