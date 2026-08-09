import { cn } from '@/lib/utils';

export function FormSection({
    title,
    cols = 2,
    children,
}: {
    title?: string;
    cols?: 2 | 3;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3">
            {title && (
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {title}
                </h3>
            )}
            <div
                className={cn(
                    'grid gap-4',
                    cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
                )}
            >
                {children}
            </div>
        </div>
    );
}
