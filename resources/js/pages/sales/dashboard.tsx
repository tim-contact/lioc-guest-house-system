import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
    ArrowRight,
    CalendarDays,
    ClipboardList,
    FileText,
    Scale,
    Wallet,
} from 'lucide-react';
import { creditManagement, disputes, orders } from '@/routes';
import { index as enquiriesIndex } from '@/routes/enquiries';
import type { Auth } from '@/types';

/* Hallmark pre-emit critique: P4 H5 E4 S5 R5 V4 */
// Adjust this value to manually reposition the banner image crop.
const HERO_BACKGROUND_POSITION = 'center 45%';

const MODULES: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    accent: string;
    accentSoft: string;
    accentBorder: string;
    focusRing: string;
}[] = [
    {
        title: 'Enquiries',
        description: 'View and manage enquiries',
        href: enquiriesIndex().url,
        icon: FileText,
        accent: '#1269cf',
        accentSoft: '#e8f2ff',
        accentBorder: '#91bff2',
        focusRing: 'rgba(18, 105, 207, 0.3)',
    },
    {
        title: 'Orders',
        description: 'View and manage orders',
        href: orders().url,
        icon: ClipboardList,
        accent: '#139957',
        accentSoft: '#e6f6ed',
        accentBorder: '#8ccfac',
        focusRing: 'rgba(19, 153, 87, 0.3)',
    },
    {
        title: 'Disputes',
        description: 'View and manage disputes',
        href: disputes().url,
        icon: Scale,
        accent: '#e33438',
        accentSoft: '#fdebec',
        accentBorder: '#f0a2a4',
        focusRing: 'rgba(227, 52, 56, 0.28)',
    },
    {
        title: 'Credit Management',
        description: 'View customer credit standing',
        href: creditManagement().url,
        icon: Wallet,
        accent: '#eb8a00',
        accentSoft: '#fff2dc',
        accentBorder: '#f3c179',
        focusRing: 'rgba(235, 138, 0, 0.3)',
    },
];

type PageProps = {
    auth: Auth;
};

function formatBannerDate(): string {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(new Date());
}

function WorkspaceHero() {
    const { auth } = usePage<PageProps>().props;
    const displayName = auth.user?.name ?? 'Super Admin';

    return (
        <section
            className="relative min-h-[320px] overflow-hidden rounded-[18px] bg-cover bg-no-repeat sm:min-h-[330px] sm:rounded-3xl lg:-mx-20 lg:min-h-[300px] xl:min-h-[320px]"
            style={{
                backgroundImage:
                    "linear-gradient(90deg, rgba(18,31,48,0.76) 0%, rgba(28,39,52,0.51) 38%, rgba(28,39,52,0.16) 68%, rgba(28,39,52,0.04) 100%), url('/images/oil_tanker_dreamy_background.png')",
                backgroundPosition: HERO_BACKGROUND_POSITION,
            }}
        >
            <div className="absolute top-4 right-4 z-10 inline-flex min-h-9 items-center gap-2 rounded-[9px] border border-white/25 bg-[#112337]/85 px-3.5 text-[13px] font-medium text-white shadow-[0_6px_18px_rgba(10,20,30,0.14)] sm:top-6 sm:right-6">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatBannerDate()}
            </div>

            <div className="relative z-10 flex min-h-[320px] max-w-[680px] flex-col items-start justify-end px-6 pt-24 pb-8 sm:min-h-[330px] sm:justify-center sm:px-9 sm:py-10 lg:min-h-[300px] lg:py-9 xl:min-h-[320px]">
                <p className="text-sm font-semibold tracking-[0.04em] text-white/95 uppercase">
                    Sales workspace
                </p>
                <h1 className="mt-3 text-[clamp(1.875rem,2.6vw,2.625rem)] leading-[1.12] font-bold tracking-[-0.025em] text-white">
                    Good morning, {displayName}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/90">
                    Manage enquiries, orders, disputes and customer credit from
                    one place.
                </p>
            </div>
        </section>
    );
}

function ModuleCard({
    title,
    description,
    href,
    icon: Icon,
    accent,
    accentSoft,
    accentBorder,
    focusRing,
}: (typeof MODULES)[number]) {
    return (
        <Link
            href={href}
            prefetch
            aria-label={`Open ${title}`}
            className="group relative flex min-h-[220px] min-w-0 flex-col overflow-hidden rounded-[10px] border border-[#e2e0dc] bg-white px-5 pt-6 pb-5 text-left no-underline shadow-[0_10px_28px_rgba(38,42,48,0.06),0_2px_5px_rgba(38,42,48,0.04)] transition-[transform,border-color,box-shadow] duration-200 ease-out outline-none hover:-translate-y-[3px] hover:border-[var(--module-accent)] hover:shadow-[0_16px_36px_rgba(38,42,48,0.10),0_3px_8px_rgba(38,42,48,0.05)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--module-focus-ring)] motion-reduce:transform-none motion-reduce:transition-none sm:min-h-[240px] sm:px-6 sm:pt-7 sm:pb-5 lg:min-h-[190px] lg:px-5 lg:pt-5 lg:pb-4 xl:min-h-[200px]"
            style={
                {
                    '--module-accent': accent,
                    '--module-accent-soft': accentSoft,
                    '--module-accent-border': accentBorder,
                    '--module-focus-ring': focusRing,
                } as CSSProperties
            }
        >
            <span
                className="absolute top-0 right-0 left-0 h-[5px] bg-[var(--module-accent)]"
                aria-hidden="true"
            />

            <span
                className="grid size-[68px] place-items-center rounded-[15px] bg-[var(--module-accent-soft)] text-[var(--module-accent)] lg:size-14 lg:rounded-xl"
                aria-hidden="true"
            >
                <Icon className="size-8 stroke-[1.9] lg:size-7" />
            </span>

            <span className="mt-[26px] block text-xl leading-snug font-bold text-[#102a4c] lg:mt-4 lg:text-lg">
                {title}
            </span>
            <span className="mt-2 block text-sm leading-6 text-[#657185] lg:leading-5">
                {description}
            </span>

            <span
                className="mt-auto ml-auto grid size-[42px] place-items-center rounded-full border bg-white text-[var(--module-accent)] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 lg:size-10"
                style={{ borderColor: accentBorder }}
                aria-hidden="true"
            >
                <ArrowRight className="size-5 stroke-[2.1]" />
            </span>
        </Link>
    );
}

function QuickAccessSection() {
    return (
        <section className="mt-8 sm:mt-10 lg:mt-7">
            <h2 className="text-xl leading-snug font-bold text-[#102a4c]">
                Quick access
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#657185]">
                Manage the main areas of the sales workspace.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-4 lg:grid-cols-4 lg:gap-5 xl:gap-6">
                {MODULES.map((module) => (
                    <ModuleCard key={module.title} {...module} />
                ))}
            </div>
        </section>
    );
}

export default function SalesDashboard() {
    return (
        <>
            <Head title="Sales Dashboard" />

            <div className="min-h-[calc(100dvh-2.75rem)] bg-[#f2f1ef] font-sans text-[#102a4c] lg:h-[calc(100dvh-2.75rem)] lg:overflow-hidden">
                <main className="mx-auto h-full w-full max-w-[1480px] px-4 py-5 pb-10 sm:px-6 sm:py-6 sm:pb-10 lg:px-8 lg:py-6 lg:pb-6">
                    <WorkspaceHero />
                    <QuickAccessSection />
                </main>
            </div>
        </>
    );
}

SalesDashboard.layout = {
    title: 'Sales',
};
