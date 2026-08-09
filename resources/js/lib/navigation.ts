import {
    Banknote,
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
            { title: 'Admin Dashboard', href: admin(), icon: LayoutGrid },
            {
                title: 'Users',
                href: usersIndex(),
                icon: Users,
                description: 'Manage user accounts',
            },
            {
                title: 'Enquiries',
                href: enquiriesEdit(),
                icon: FileText,
                description: 'View and manage enquiries',
            },
            {
                title: 'Customers',
                href: customersIndex(),
                icon: Users,
                description: 'View and manage customers',
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
                title: 'Barges',
                href: bargesEdit(),
                icon: Ship,
                description: 'View and manage barges',
            },
            {
                title: 'Orders',
                href: ordersTable(),
                icon: ClipboardList,
                description: 'View all order details',
            },
            {
                title: 'Disputes',
                href: disputesTable(),
                icon: Scale,
                description: 'View and manage disputes',
            },
            {
                title: 'BDNs',
                href: bdnsIndex(),
                icon: FileCheck,
                description: 'View bunker delivery notes',
            },
            {
                title: 'Invoices',
                href: invoicesIndex(),
                icon: Receipt,
                description: 'View and correct invoices',
            },
            {
                title: 'Payments',
                href: paymentsIndex(),
                icon: CreditCard,
                description: 'View, edit and delete payments',
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
            },
            { title: 'Enquiries', href: enquiriesIndex(), icon: FileText },
            { title: 'Orders', href: orders(), icon: ClipboardList },
            { title: 'Disputes', href: disputes(), icon: Scale },
            {
                title: 'Credit Management',
                href: creditManagement(),
                icon: Wallet,
            },
        ],
    },
    { title: 'Operations', href: operations(), icon: Wrench },
    { title: 'Surveyor', href: surveyor(), icon: ClipboardCheck },
    { title: 'Finance', href: finance(), icon: Banknote },
];

/**
 * Return only the nav groups visible to the given user type.
 * Privileged roles (super_admin, master) see everything.
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
