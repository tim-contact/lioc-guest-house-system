import { useFlashToast } from '@/hooks/use-flash-toast';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';

export default function AppLayout({
    title,
    children,
}: {
    title?: string;
    children: React.ReactNode;
}) {
    useFlashToast();

    return <AppLayoutTemplate title={title}>{children}</AppLayoutTemplate>;
}
