import {
    Banknote,
    BarChart3,
    ClipboardCheck,
    ClipboardList,
    Contact,
    CreditCard,
    FileCheck,
    FileText,
    Handshake,
    LayoutGrid,
    MapPin,
    Receipt,
    Scale,
    Ship,
    TrendingUp,
    Users,
    Wallet,
    Wrench,
} from 'lucide-react';
import { edit as enquiriesEdit } from '@/actions/App/Http/Controllers/EnquiryController';
import { table as ordersTable } from '@/actions/App/Http/Controllers/OrderController';
import { index as reportsAnalytics } from '@/actions/App/Http/Controllers/ReportAnalyticsController';
import {
    admin,
    creditManagement,
    disputes,
    finance,
    operations,
    orders,
    salesDashboard,
    surveyor,
} from '@/routes';
import { index as agentPicsIndex } from '@/routes/agent-pics';
import { index as agentsIndex } from '@/routes/agents';
import { edit as bargesEdit } from '@/routes/barges';
import { index as bdnsIndex } from '@/routes/bdns';
import { index as customersIndex } from '@/routes/customers';
import { table as disputesTable } from '@/routes/disputes';
import { index as enquiriesIndex } from '@/routes/enquiries';
import { index as invoicesIndex } from '@/routes/invoices';
import { index as paymentsIndex } from '@/routes/payments';
import { index as portsIndex } from '@/routes/ports';
import { edit as surveyorsEdit } from '@/routes/surveyors';
import { index as usersIndex } from '@/routes/users';
import type { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
    {
        title: 'Admin',
        items: [
            {
                title: 'Admin Dashboard',
                href: admin(),
                icon: LayoutGrid,
                description: 'Overview of system activity',
            },
            {
                title: 'Reports',
                href: reportsAnalytics(),
                icon: BarChart3,
                description: 'Analytics and conversion metrics',
            },

            {
                title: 'Agencies',
                href: agentsIndex(),
                icon: Handshake,
                description: 'View and manage agencies',
            },
            {
                title: 'Agents',
                href: agentPicsIndex(),
                icon: Contact,
                description: 'View and manage agency PICs',
            },
            {
                title: 'Barges',
                href: bargesEdit(),
                icon: Ship,
                description: 'View and manage barges',
            },
            {
                title: 'BDNs',
                href: bdnsIndex(),
                icon: FileCheck,
                description: 'View bunker delivery notes',
            },
            {
                title: 'Customers',
                href: customersIndex(),
                icon: Users,
                description: 'View and manage customers',
            },
            {
                title: 'Disputes',
                href: disputesTable(),
                icon: Scale,
                description: 'View and manage disputes',
            },
            {
                title: 'Enquiries',
                href: enquiriesEdit(),
                icon: FileText,
                description: 'View and manage enquiries',
            },
            {
                title: 'Invoices',
                href: invoicesIndex(),
                icon: Receipt,
                description: 'View and correct invoices',
            },
            {
                title: 'Orders',
                href: ordersTable(),
                icon: ClipboardList,
                description: 'View all order details',
            },
            {
                title: 'Payments',
                href: paymentsIndex(),
                icon: CreditCard,
                description: 'View, edit and delete payments',
            },
            {
                title: 'Ports',
                href: portsIndex(),
                icon: MapPin,
                description: 'View and manage ports',
            },
            {
                title: 'Surveyors',
                href: surveyorsEdit(),
                icon: ClipboardCheck,
                description: 'View and manage surveyors',
            },
            {
                title: 'Users',
                href: usersIndex(),
                icon: Users,
                description: 'Manage user accounts',
            },
        ],
    },
    {
        title: 'Sales',
        items: [
            {
                title: 'Sales Dashboard',
                href: salesDashboard(),
                icon: TrendingUp,
                description: 'Track sales pipeline activity',
            },
            {
                title: 'Enquiries',
                href: enquiriesIndex(),
                icon: FileText,
                description: 'Create and manage enquiries',
            },
            {
                title: 'Orders',
                href: orders(),
                icon: ClipboardList,
                description: 'Review active order work',
            },
            {
                title: 'Disputes',
                href: disputes(),
                icon: Scale,
                description: 'Track customer dispute cases',
            },
            {
                title: 'Credit Management',
                href: creditManagement(),
                icon: Wallet,
                description: 'Review limits and balances',
            },
        ],
    },
    {
        title: 'Operations',
        href: operations(),
        icon: Wrench,
        description: 'Coordinate operational work',
    },
    {
        title: 'Surveyor',
        href: surveyor(),
        icon: ClipboardCheck,
        description: 'Review surveyor assignments',
    },
    {
        title: 'Finance',
        items: [
            {
                title: 'Finance Dashboard',
                href: finance(),
                icon: Banknote,
                description: 'Monitor finance activity',
            },
            {
                title: 'Past Payments',
                href: paymentsIndex(),
                icon: CreditCard,
                description: 'View recorded payments',
            },
        ],
    },
];

/**
 * Return only the nav groups visible to the given user type.
 * Privileged roles (super_admin, master) see all groups.
 * Other roles see only their own section.
 */
export function visibleNavGroups(userType: string): NavGroup[] {
    // Privileged users see all groups.
    if (userType === 'super_admin' || userType === 'master') {
        return navGroups;
    }

    // Map role to nav section title.
    const roleSection: Record<string, string> = {
        sales: 'Sales',
        operations: 'Operations',
        surveyor: 'Surveyor',
        finance: 'Finance',
    };

    const sectionTitle = roleSection[userType];

    if (!sectionTitle) {
        return [];
    }

    return navGroups.filter((group) => group.title === sectionTitle);
}
