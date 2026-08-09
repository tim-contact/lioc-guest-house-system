import { AppHeader } from '@/components/app-header';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({ children, title }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppHeader title={title} />
            <main className="flex flex-1 flex-col overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
