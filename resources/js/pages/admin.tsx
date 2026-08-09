import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { navGroups } from '@/lib/navigation';

const adminGroup = navGroups.find((group) => group.title === 'Admin');
const cards =
    adminGroup && 'items' in adminGroup
        ? adminGroup.items.filter((item) => item.description)
        : [];

export default function Admin() {
    return (
        <>
            <Head title="Admin" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
                    {cards.map(({ href, icon: Icon, title, description }) => (
                        <Link key={title} href={href} className="block">
                            <Card className="h-full cursor-pointer justify-center gap-3 py-8 transition hover:ring-2 hover:ring-primary/40">
                                <CardHeader className="items-center text-center">
                                    {Icon && (
                                        <Icon className="mb-2 size-8 text-primary" />
                                    )}
                                    <CardTitle className="text-lg">
                                        {title}
                                    </CardTitle>
                                    <CardDescription>
                                        {description}
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

Admin.layout = {
    title: 'Admin',
};
