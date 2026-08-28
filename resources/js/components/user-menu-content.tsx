import { Link, router } from '@inertiajs/react';
import { ArrowRight, LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

const menuItemClass =
    'group/profile-dropdown-item grid min-h-14 w-full grid-cols-[2.5rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-[0.85rem] px-2.5 py-2.5 text-left transition-[background-color,color] duration-200 hover:bg-[#625bff]/[0.05] focus:bg-[#625bff]/[0.05] data-[highlighted]:bg-[#625bff]/[0.05]';

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm text-[#172033]">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-950/[0.06]" />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild className={menuItemClass}>
                    <Link
                        className="cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef0f3] text-[#111827] transition-[background-color,color] duration-200 group-hover/profile-dropdown-item:bg-[#dbeafe] group-hover/profile-dropdown-item:text-[#03045e] group-focus/profile-dropdown-item:bg-[#dbeafe] group-focus/profile-dropdown-item:text-[#03045e] group-data-[highlighted]/profile-dropdown-item:bg-[#dbeafe] group-data-[highlighted]/profile-dropdown-item:text-[#03045e]">
                            <Settings className="size-5" />
                        </span>
                        <span className="grid min-w-0 gap-0.5">
                            <span className="truncate text-[0.94rem] leading-5 font-semibold text-[#172033]">
                                Settings
                            </span>
                            <span className="truncate text-[0.8rem] leading-4 text-[#8490a6]">
                                Manage profile and security
                            </span>
                        </span>
                        <ArrowRight className="size-4 text-[#625bff] opacity-0 transition-[opacity,transform] duration-200 group-hover/profile-dropdown-item:translate-x-0.5 group-hover/profile-dropdown-item:opacity-100 group-focus/profile-dropdown-item:translate-x-0.5 group-focus/profile-dropdown-item:opacity-100 group-data-[highlighted]/profile-dropdown-item:translate-x-0.5 group-data-[highlighted]/profile-dropdown-item:opacity-100" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-950/[0.06]" />
            <DropdownMenuItem asChild className={menuItemClass}>
                <Link
                    className="cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef0f3] text-[#111827] transition-[background-color,color] duration-200 group-hover/profile-dropdown-item:bg-[#dbeafe] group-hover/profile-dropdown-item:text-[#03045e] group-focus/profile-dropdown-item:bg-[#dbeafe] group-focus/profile-dropdown-item:text-[#03045e] group-data-[highlighted]/profile-dropdown-item:bg-[#dbeafe] group-data-[highlighted]/profile-dropdown-item:text-[#03045e]">
                        <LogOut className="size-5" />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                        <span className="truncate text-[0.94rem] leading-5 font-semibold text-[#172033]">
                            Log out
                        </span>
                        <span className="truncate text-[0.8rem] leading-4 text-[#8490a6]">
                            End your current session
                        </span>
                    </span>
                    <ArrowRight className="size-4 text-[#625bff] opacity-0 transition-[opacity,transform] duration-200 group-hover/profile-dropdown-item:translate-x-0.5 group-hover/profile-dropdown-item:opacity-100 group-focus/profile-dropdown-item:translate-x-0.5 group-focus/profile-dropdown-item:opacity-100 group-data-[highlighted]/profile-dropdown-item:translate-x-0.5 group-data-[highlighted]/profile-dropdown-item:opacity-100" />
                </Link>
            </DropdownMenuItem>
        </>
    );
}
