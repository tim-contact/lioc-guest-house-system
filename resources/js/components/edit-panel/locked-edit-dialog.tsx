import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SummaryBand } from './summary-band';

const SIZES = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
} as const;

export function LockedEditDialog({
    open,
    onOpenChange,
    title,
    size = 'md',
    onSave,
    saving = false,
    footerExtra,
    summary,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: React.ReactNode;
    size?: keyof typeof SIZES;
    onSave?: () => void;
    saving?: boolean;
    footerExtra?: React.ReactNode;
    summary?: React.ReactNode;
    children?: React.ReactNode;
}) {
    const header = (
        <DialogHeader>
            <DialogTitle className="pr-10">{title}</DialogTitle>
        </DialogHeader>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(SIZES[size])}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {summary ? (
                    <SummaryBand>
                        {header}
                        {summary}
                    </SummaryBand>
                ) : (
                    header
                )}

                <div className="flex flex-col gap-4">{children}</div>

                <DialogFooter>
                    {footerExtra}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                            onSave ? onSave() : onOpenChange(false)
                        }
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
