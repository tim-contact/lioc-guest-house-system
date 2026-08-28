import { Head, Link } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { ArrowRight, FileText, LayoutGrid } from 'lucide-react';
import { WorkspaceHero } from '@/components/workspace-hero';
import { navGroups } from '@/lib/navigation';
import type { NavItem } from '@/types';

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
                    <WorkspaceHero
                        eyebrow="Admin workspace"
                        description="Manage users, master data, sales records and operational setup from one secure place."
                        imagePosition={HERO_BACKGROUND_POSITION}
                        className="mx-auto w-full max-w-[1500px] border border-white/45 shadow-[0_18px_44px_rgba(38,42,48,0.10)]"
                        contentClassName="max-w-[720px]"
                    />
                    <AdminQuickAccess />
                </main>
            </div>
        </>
    );
}

Admin.layout = {
    title: 'Admin',
};
