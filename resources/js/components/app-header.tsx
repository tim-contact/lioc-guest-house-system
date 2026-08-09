import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { navGroups, visibleNavGroups } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

const entryClass =
    'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-brand/70 transition-colors hover:bg-brand/10 hover:text-brand';

export function AppHeader({ title }: { title?: string }) {
    const { auth } = usePage().props;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const userType = auth.user?.type ?? '';
    const filteredGroups = visibleNavGroups(userType);

    // When a user sees only one nav group and it has sub-items,
    // flatten it — a single-word dropdown is pointless.
    const soleGroup = filteredGroups.length === 1 && 'items' in filteredGroups[0]
        ? filteredGroups[0] : null;

    const mobileLink = (item: NavItem) => (
        <Link
            key={item.title}
            href={item.href}
            prefetch
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
        >
            {item.icon && <item.icon className="size-4" />}
            {item.title}
        </Link>
    );

    return (
        <header className="sticky top-0 z-50 flex h-11 shrink-0 items-center gap-1 border-b border-brand-border/50 bg-brand-surface/60 px-4 backdrop-blur-md md:px-6">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                    <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 px-4 pb-6">
                        {filteredGroups.map((group) => (
                            <div
                                key={group.title}
                                className="flex flex-col gap-1"
                            >
                                {'items' in group ? (
                                    <>
                                        <span className="px-2 text-xs font-medium text-muted-foreground">
                                            {group.title}
                                        </span>
                                        {group.items.map(mobileLink)}
                                    </>
                                ) : (
                                    mobileLink(group)
                                )}
                            </div>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>

            {title && (
                <>
                    <span className="mr-3 truncate text-sm font-semibold text-brand">
                        {title}
                    </span>
                    <Separator
                        orientation="vertical"
                        className="mr-3 hidden self-stretch bg-brand-border/40 md:block"
                    />
                </>
            )}

            <nav className="hidden items-center gap-1 md:flex">
                {soleGroup
                    ? soleGroup.items.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={entryClass}
                        >
                            {item.icon && <item.icon className="size-3.5" />}
                            {item.title}
                        </Link>
                    ))
                    : filteredGroups.map((group) =>
                    'items' in group ? (
                        <DropdownMenu key={group.title} modal={false}>
                            <DropdownMenuTrigger
                                className={cn(
                                    'group outline-none',
                                    entryClass,
                                    'data-[state=open]:bg-brand/15 data-[state=open]:text-brand',
                                )}
                            >
                                {group.title}
                                <ChevronDown className="size-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                sideOffset={6}
                                className="w-56 border border-brand-border bg-brand-surface/90 backdrop-blur-md"
                            >
                                {group.items.map((item) => (
                                    <DropdownMenuItem
                                        key={item.title}
                                        asChild
                                        className="gap-2 px-2 py-1.5 focus:bg-brand/10 focus:text-brand [&_svg]:text-brand/70"
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            {item.title}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link
                            key={group.title}
                            href={group.href}
                            prefetch
                            className={entryClass}
                        >
                            {group.title}
                        </Link>
                    ),
                )}
            </nav>

            {auth.user && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-8 max-w-40 rounded-full pr-2.5 pl-1 text-brand/80 hover:bg-brand/10 hover:text-brand"
                            data-test="user-menu-button"
                        >
                            <UserInfo user={auth.user} size="sm" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-56">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </header>
    );
}
