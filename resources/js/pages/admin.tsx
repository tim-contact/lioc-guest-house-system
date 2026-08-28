import { Head, Link, usePage } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { ArrowRight, CalendarDays, FileText, LayoutGrid } from 'lucide-react';
import { navGroups } from '@/lib/navigation';
import type { Auth, NavItem } from '@/types';

/* Hallmark pre-emit critique: P4 H5 E4 S5 R5 V4 */
// Adjust this value to manually reposition the banner image crop.
const HERO_BACKGROUND_POSITION = 'center 45%';

const CARD_STYLES = [
    {
        accent: '#1269cf',
        accentSoft: '#e8f2ff',
        accentBorder: '#91bff2',
        focusRing: 'rgba(18, 105, 207, 0.3)',
    },
    {
        accent: '#139957',
        accentSoft: '#e6f6ed',
        accentBorder: '#8ccfac',
        focusRing: 'rgba(19, 153, 87, 0.3)',
    },
    {
        accent: '#7c5cc4',
        accentSoft: '#f0ecfb',
        accentBorder: '#b9a8e0',
        focusRing: 'rgba(124, 92, 196, 0.28)',
    },
    {
        accent: '#eb8a00',
        accentSoft: '#fff2dc',
        accentBorder: '#f3c179',
        focusRing: 'rgba(235, 138, 0, 0.3)',
    },
    {
        accent: '#e33438',
        accentSoft: '#fdebec',
        accentBorder: '#f0a2a4',
        focusRing: 'rgba(227, 52, 56, 0.28)',
    },
];

const adminGroup = navGroups.find((group) => group.title === 'Admin');
const cards =
    adminGroup && 'items' in adminGroup
        ? adminGroup.items.filter((item) => item.description)
        : [];

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

function AdminHero() {
    const { auth } = usePage<PageProps>().props;
    const displayName = auth.user?.name ?? 'Super Admin';

    return (
        <section
            className="relative mx-auto min-h-[320px] w-full max-w-[1500px] overflow-hidden rounded-[18px] border border-white/45 bg-cover bg-no-repeat shadow-[0_18px_44px_rgba(38,42,48,0.10)] sm:min-h-[330px] sm:rounded-3xl lg:min-h-[300px] xl:min-h-[320px]"
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

            <div className="relative z-10 flex min-h-[320px] max-w-[720px] flex-col items-start justify-end px-6 pt-24 pb-8 sm:min-h-[330px] sm:justify-center sm:px-9 sm:py-10 lg:min-h-[300px] lg:py-9 xl:min-h-[320px]">
                <p className="text-sm font-semibold tracking-[0.04em] text-white/95 uppercase">
                    Admin workspace
                </p>
                <h1 className="mt-3 text-[clamp(1.875rem,2.6vw,2.625rem)] leading-[1.12] font-bold tracking-[-0.025em] text-white">
                    Good morning, {displayName}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/90">
                    Manage users, master data, sales records and operational
                    setup from one secure place.
                </p>
            </div>
        </section>
    );
}

function AdminCard({ card, index }: { card: NavItem; index: number }) {
    const style = CARD_STYLES[index % CARD_STYLES.length];
    const Icon = card.icon ?? FileText;

    return (
        <Link
            href={card.href}
            prefetch
            aria-label={`Open ${card.title}`}
            className="group relative flex min-h-[220px] min-w-0 flex-col overflow-hidden rounded-[10px] border border-[#e2e0dc] bg-white px-5 pt-6 pb-5 text-left no-underline shadow-[0_10px_28px_rgba(38,42,48,0.06),0_2px_5px_rgba(38,42,48,0.04)] transition-[transform,border-color,box-shadow] duration-200 ease-out outline-none hover:-translate-y-[3px] hover:border-[var(--module-accent)] hover:shadow-[0_16px_36px_rgba(38,42,48,0.10),0_3px_8px_rgba(38,42,48,0.05)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--module-focus-ring)] motion-reduce:transform-none motion-reduce:transition-none lg:min-h-[190px] lg:px-5 lg:pt-5 lg:pb-4 xl:min-h-[200px]"
            style={
                {
                    '--module-accent': style.accent,
                    '--module-accent-soft': style.accentSoft,
                    '--module-focus-ring': style.focusRing,
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
                {card.title}
            </span>
            <span className="mt-2 block text-sm leading-6 text-[#657185] lg:leading-5">
                {card.description}
            </span>

            <span
                className="mt-auto ml-auto grid size-[42px] place-items-center rounded-full border bg-white text-[var(--module-accent)] transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 lg:size-10"
                style={{ borderColor: style.accentBorder }}
                aria-hidden="true"
            >
                <ArrowRight className="size-5 stroke-[2.1]" />
            </span>
        </Link>
    );
}

function AdminQuickAccess() {
    return (
        <section className="mt-8 sm:mt-10 lg:mt-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl leading-snug font-bold text-[#102a4c]">
                        Admin access
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-[#657185]">
                        Open the core administrative modules.
                    </p>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-[#e2e0dc] bg-white px-3 py-2 text-sm font-medium text-[#657185] shadow-[0_8px_22px_rgba(38,42,48,0.04)] sm:inline-flex">
                    <LayoutGrid className="size-4 text-[#1269cf]" />
                    {cards.length} modules
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-4 lg:grid-cols-4 lg:gap-5 xl:gap-6">
                {cards.map((card, index) => (
                    <AdminCard key={card.title} card={card} index={index} />
                ))}
            </div>
        </section>
    );
}

export default function Admin() {
    return (
        <>
            <Head title="Admin" />

            <div className="min-h-[calc(100dvh-2.75rem)] bg-background font-sans text-[#102a4c]">
                <main className="mx-auto w-full max-w-[1480px] px-4 py-5 pb-10 sm:px-6 sm:py-6 sm:pb-10 lg:px-8 lg:py-6 lg:pb-10">
                    <AdminHero />
                    <AdminQuickAccess />
                </main>
            </div>
        </>
    );
}

Admin.layout = {
    title: 'Admin',
};
