import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Shown on the admin dashboard card; unused by the header dropdown. */
    description?: string;
    /** Optional override for links that are more restricted than their group. */
    roles?: string[];
};

export type NavGroup = NavItem | { title: string; items: NavItem[] };
