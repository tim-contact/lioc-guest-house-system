import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronDown, Menu } from 'lucide-react';
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
import { useCurrentUrl } from '@/hooks/use-current-url';
import { visibleNavGroups } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';

const entryClass =
    'group relative flex h-10 items-center gap-[6px] rounded-lg border border-transparent px-3 text-[0.95rem] font-medium text-[#3f4a5f] transition-[background-color,border-color,color] duration-200 after:absolute after:right-3 after:bottom-0.5 after:left-3 after:h-0.5 after:origin-center after:scale-x-75 after:rounded-full after:bg-[linear-gradient(90deg,#3f37ff_0%,#5b4dff_50%,#766bff_100%)] after:opacity-0 after:shadow-[0_4px_10px_rgba(79,70,229,0.45)] after:transition-[opacity,transform] after:duration-200 hover:text-[#4f46e5] focus-visible:ring-2 focus-visible:ring-[#4f46e5]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none data-[state=open]:font-semibold data-[state=open]:text-[#172033] data-[state=open]:after:scale-x-100 data-[state=open]:after:opacity-100';

const activeEntryClass =
    'font-semibold text-[#172033] after:scale-x-100 after:opacity-100';

const menuPanelClass =
    'z-[1100] w-[22rem] max-w-[calc(100vw-2rem)] rounded-[1.2rem] border border-slate-950/[0.06] bg-white/[0.98] p-3.5 text-slate-950 shadow-[0_22px_50px_rgba(15,23,42,0.18)] backdrop-blur-sm';

const menuItemClass =
    'group grid min-h-14 w-full grid-cols-[2.5rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-[0.85rem] px-2.5 py-2.5 text-left transition-[background-color,color] duration-200 outline-none hover:bg-[#625bff]/[0.05] focus:bg-[#625bff]/[0.05] data-[highlighted]:bg-[#625bff]/[0.05] data-disabled:pointer-events-none data-disabled:opacity-50';

export function AppHeader({ title }: { title?: string }) {
    const { auth } = usePage().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const userType = auth.user?.type ?? '';
    const filteredGroups = visibleNavGroups(userType);

    // When a user sees only one nav group and it has sub-items,
    // flatten it — a single-word dropdown is pointless.
    const soleGroup =
        filteredGroups.length === 1 && 'items' in filteredGroups[0]
            ? filteredGroups[0]
            : null;

    const isGroupActive = (group: NavGroup) =>
        'items' in group
            ? group.items.some((item) => isCurrentOrParentUrl(item.href))
            : isCurrentOrParentUrl(group.href);

    const renderItemIcon = (item: NavItem, className?: string) =>
        item.icon ? <item.icon className={cn('size-5', className)} /> : null;

    const mobileLink = (item: NavItem) => {
        const active = isCurrentOrParentUrl(item.href);

        return (
            <Link
                key={item.title}
                href={item.href}
                prefetch
                onClick={() => setMobileNavOpen(false)}
                aria-current={
                    isCurrentOrParentUrl(item.href) ? 'page' : undefined
                }
                className={cn(
                    'group flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#3f4a5f] transition-colors hover:bg-[#4f46e5]/[0.05] hover:text-[#172033] focus-visible:ring-2 focus-visible:ring-[#4f46e5]/45 focus-visible:outline-none',
                    isCurrentOrParentUrl(item.href) &&
                        'bg-[#4f46e5]/[0.05] text-[#172033] ring-1 ring-slate-950/[0.06]',
                )}
            >
                <span
                    className={cn(
                        'nav-dropdown-icon flex size-10 items-center justify-center rounded-xl bg-[#eef0f3] text-[#111827] transition-[background-color,color] duration-200',
                        'group-hover:bg-[#dbeafe] group-hover:text-[#03045e]',
                        'group-focus:bg-[#dbeafe] group-focus:text-[#03045e]',
                        'group-data-[highlighted]:bg-[#dbeafe] group-data-[highlighted]:text-[#03045e]',
                        active &&
                            'bg-[#254dff] text-white group-hover:bg-[#254dff] group-hover:text-white group-focus:bg-[#254dff] group-focus:text-white group-data-[highlighted]:bg-[#254dff] group-data-[highlighted]:text-white',
                    )}
                >
                    {renderItemIcon(item)}
                </span>
                <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-semibold">{item.title}</span>
                    {item.description && (
                        <span className="truncate text-xs text-[#8490a6]">
                            {item.description}
                        </span>
                    )}
                </span>
            </Link>
        );
    };

    const desktopDropdownLink = (item: NavItem) => {
        const active = isCurrentOrParentUrl(item.href);

        return (
            <DropdownMenuItem
                key={item.title}
                asChild
                className={cn(menuItemClass, active && 'bg-[#625bff]/[0.05]')}
            >
                <Link
                    href={item.href}
                    prefetch
                    aria-current={active ? 'page' : undefined}
                >
                    <span
                        className={cn(
                            'nav-dropdown-icon flex size-10 items-center justify-center rounded-xl bg-[#eef0f3] text-[#111827] transition-[background-color,color] duration-200',
                            'group-hover:bg-[#dbeafe] group-hover:text-[#03045e]',
                            'group-focus:bg-[#dbeafe] group-focus:text-[#03045e]',
                            'group-data-[highlighted]:bg-[#dbeafe] group-data-[highlighted]:text-[#03045e]',
                            active &&
                                'bg-[#254dff] text-white group-hover:bg-[#254dff] group-hover:text-white group-focus:bg-[#254dff] group-focus:text-white group-data-[highlighted]:bg-[#254dff] group-data-[highlighted]:text-white',
                        )}
                    >
                        {renderItemIcon(item)}
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                        <span className="truncate text-[0.94rem] leading-5 font-semibold text-[#172033]">
                            {item.title}
                        </span>
                        {item.description && (
                            <span className="truncate text-[0.8rem] leading-4 text-[#8490a6]">
                                {item.description}
                            </span>
                        )}
                    </span>
                    <ArrowRight
                        className={cn(
                            'nav-dropdown-arrow size-4 text-[#625bff] opacity-0 transition-[opacity,transform] duration-200',
                            'group-hover:translate-x-0.5 group-hover:opacity-100',
                            'group-focus:translate-x-0.5 group-focus:opacity-100',
                            'group-data-[highlighted]:translate-x-0.5 group-data-[highlighted]:opacity-100',
                            active && 'translate-x-0.5 opacity-100',
                        )}
                    />
                </Link>
            </DropdownMenuItem>
        );
    };

    return (
        <header className="sticky top-0 z-[1000] shrink-0 overflow-visible border-b border-slate-950/[0.07] bg-[rgba(250,251,253,0.94)] text-[#172033] shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-[14px]">
            <div className="mx-auto grid h-16 w-full max-w-[1600px] grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2 overflow-visible px-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] sm:px-4 md:h-[4.25rem] md:grid-cols-[4rem_minmax(0,1fr)_4rem] md:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-0 lg:px-10">
                <div className="flex min-w-0 items-center gap-4">
                    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-11 rounded-lg text-[#172033] hover:bg-[#4f46e5]/[0.07] hover:text-[#4f46e5] focus-visible:ring-[#4f46e5]/45 lg:hidden"
                                aria-label="Open navigation menu"
                            >
                                <Menu />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="z-[1100] max-h-dvh w-80 overflow-hidden border-slate-950/[0.06] bg-white/[0.98] text-[#172033] shadow-[0_22px_50px_rgba(15,23,42,0.18)] backdrop-blur-sm"
                        >
                            <SheetHeader className="shrink-0">
                                <SheetTitle className="text-[#172033]">
                                    Navigation
                                </SheetTitle>
                            </SheetHeader>
                            <nav
                                aria-label="Mobile main navigation"
                                className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain px-4 pb-6 [-webkit-overflow-scrolling:touch]"
                            >
                                {filteredGroups.map((group) => (
                                    <div
                                        key={group.title}
                                        className="mb-5 flex flex-col gap-1 last:mb-0"
                                    >
                                        {'items' in group ? (
                                            <>
                                                <span className="px-2 text-xs font-medium tracking-wide text-[#8490a6]">
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
                        <div className="hidden min-w-0 items-center gap-3 xl:flex">
                            <img
                                src="/images/lanka-ioc-logo.png"
                                alt="Lanka IOC"
                                className="h-9 w-auto shrink-0 object-contain"
                            />
                            <span className="hidden max-w-36 truncate text-sm font-semibold text-[#3f4a5f] xl:block">
                                {title}
                            </span>
                            <Separator
                                orientation="vertical"
                                className="hidden h-7 bg-slate-950/[0.08] xl:block"
                            />
                        </div>
                    )}

                    <nav
                        aria-label="Main navigation"
                        className="hidden min-w-0 items-center gap-2.5 lg:flex lg:gap-3"
                    >
                        {soleGroup
                            ? soleGroup.items.map((item) => (
                                  <Link
                                      key={item.title}
                                      href={item.href}
                                      prefetch
                                      aria-current={
                                          isCurrentOrParentUrl(item.href)
                                              ? 'page'
                                              : undefined
                                      }
                                      className={cn(
                                          entryClass,
                                          isCurrentOrParentUrl(item.href) &&
                                              activeEntryClass,
                                      )}
                                  >
                                      {item.icon && (
                                          <item.icon className="size-3.5 text-[#4f46e5]" />
                                      )}
                                      {item.title}
                                  </Link>
                              ))
                            : filteredGroups.map((group) =>
                                  'items' in group ? (
                                      <DropdownMenu
                                          key={group.title}
                                          modal={false}
                                      >
                                          <DropdownMenuTrigger
                                              className={cn(
                                                  entryClass,
                                                  isGroupActive(group) &&
                                                      activeEntryClass,
                                              )}
                                          >
                                              {group.title}
                                              <ChevronDown className="size-3.5 opacity-75 transition-[color,transform] duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#4f46e5]" />
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                              sideOffset={8}
                                              align="start"
                                              className={menuPanelClass}
                                          >
                                              {group.items.map(
                                                  desktopDropdownLink,
                                              )}
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  ) : (
                                      <Link
                                          key={group.title}
                                          href={group.href}
                                          prefetch
                                          aria-current={
                                              isCurrentOrParentUrl(group.href)
                                                  ? 'page'
                                                  : undefined
                                          }
                                          className={cn(
                                              entryClass,
                                              isCurrentOrParentUrl(
                                                  group.href,
                                              ) && activeEntryClass,
                                          )}
                                      >
                                          {group.title}
                                      </Link>
                                  ),
                              )}
                    </nav>
                </div>

                <Link
                    href="/"
                    aria-label="Bunkering Operations System home"
                    className="flex h-11 min-w-0 items-center justify-center overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-[#4f46e5]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none md:h-[3.25rem] lg:min-w-[8.75rem]"
                >
                    <img
                        src="/images/boss_logo.png"
                        alt="Bunkering Operations System"
                        className="h-auto w-[6.25rem] max-w-full object-contain sm:w-[7rem] md:w-[8rem] lg:w-[8.5rem]"
                    />
                </Link>

                {auth.user && (
                    <div className="flex min-w-0 justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-10 max-w-10 rounded-lg border border-[#90e0ef]/70 bg-[#cbeef3] p-0 text-[#172033] hover:bg-[#7bd8e9] hover:text-[#172033] focus-visible:ring-[#90e0ef]/55 data-[state=open]:bg-[#7bd8e9] md:h-10 md:w-auto md:max-w-48 md:pr-3 md:pl-1.5 [&_[data-slot=avatar-fallback]]:bg-[#172033] [&_[data-slot=avatar-fallback]]:text-white md:[&_[data-slot=avatar]]:mr-1"
                                    data-test="user-menu-button"
                                >
                                    <UserInfo
                                        user={auth.user}
                                        size="sm"
                                        textClassName="hidden md:grid"
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={10}
                                className={cn(menuPanelClass, 'min-w-60')}
                            >
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                {!auth.user && <div />}
            </div>
        </header>
    );
}
