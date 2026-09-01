import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationMeta {
    current_page: number;
    first_page_url: string | null;
    from: number | null;
    last_page: number;
    last_page_url: string | null;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export function PaginationControls({
    pagination,
}: {
    pagination: PaginationMeta;
}) {
    const visit = (url: string | null) => {
        if (!url) {
            return;
        }

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const changePageSize = (perPage: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('per_page', perPage);
        url.searchParams.delete('page');

        router.visit(`${url.pathname}${url.search}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="tabular-nums">
                {pagination.total > 0
                    ? `Showing ${pagination.from} to ${pagination.to} of ${pagination.total}`
                    : 'No results'}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Select
                    value={String(pagination.per_page)}
                    onValueChange={changePageSize}
                >
                    <SelectTrigger className="h-8 min-w-24 bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 25, 50, 100].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                                {size} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                    {pagination.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            type="button"
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            onClick={() => visit(link.url)}
                            className={cn(
                                'min-w-8',
                                link.active && 'pointer-events-none',
                            )}
                        >
                            {paginationLabel(link.label)}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function paginationLabel(label: string) {
    return label
        .replace('&laquo; Previous', 'Prev')
        .replace('Next &raquo;', 'Next');
}
