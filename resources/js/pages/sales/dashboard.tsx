import { Head, Link } from '@inertiajs/react';
import { ClipboardList, FileText, Scale, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { creditManagement, disputes, orders } from '@/routes';
import { index as enquiriesIndex } from '@/routes/enquiries';

// `tint` colours the card frame, `accent` the icon and title — kept apart so
// the description stays muted. Spelled out in full so Tailwind sees the classes.
const CARDS: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    tint: string;
    accent: string;
}[] = [
    {
        title: 'Enquiries',
        description: 'View and manage enquiries',
        href: enquiriesIndex().url,
        icon: FileText,
        tint: 'border-info/40 bg-info/10 hover:ring-info/50',
        accent: 'text-info',
    },
    {
        title: 'Orders',
        description: 'View and manage orders',
        href: orders().url,
        icon: ClipboardList,
        tint: 'border-success/40 bg-success/10 hover:ring-success/50',
        accent: 'text-success',
    },
    {
        title: 'Disputes',
        description: 'View and manage disputes',
        href: disputes().url,
        icon: Scale,
        tint: 'border-destructive/40 bg-destructive/10 hover:ring-destructive/50',
        accent: 'text-destructive',
    },
    {
        title: 'Credit Management',
        description: 'View customer credit standing',
        href: creditManagement().url,
        icon: Wallet,
        tint: 'border-warning/40 bg-warning/10 hover:ring-warning/50',
        accent: 'text-warning',
    },
];

export default function SalesDashboard() {
    return (
        <>
            <Head title="Sales Dashboard" />
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-10 overflow-x-auto rounded-xl p-4 pb-40">
                <div className="grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
                    {CARDS.map((card) => (
                        <Link
                            key={card.title}
                            href={card.href}
                            className="block"
                        >
                            <Card
                                className={`h-full cursor-pointer justify-center gap-4 rounded-2xl border py-12 transition hover:scale-[1.03] hover:ring-2 ${card.tint}`}
                            >
                                <CardHeader className="items-center text-center">
                                    <card.icon
                                        className={`mb-2 size-8 ${card.accent}`}
                                    />
                                    <CardTitle
                                        className={`text-xl ${card.accent}`}
                                    >
                                        {card.title}
                                    </CardTitle>
                                    <CardDescription>
                                        {card.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

SalesDashboard.layout = {
    title: 'Sales',
};
