import { usePage } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

/* Hallmark pre-emit critique: P4 H5 E4 S5 R5 V4 */

type PageProps = {
    auth: Auth;
};

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

type WorkspaceHeroProps = {
    eyebrow: string;
    description: string;
    className?: string;
    contentClassName?: string;
    imagePosition?: CSSProperties['objectPosition'];
};

const HERO_BACKGROUNDS: Record<TimeOfDay, string> = {
    // Current asset filename is "morining"; update this path if the file is renamed.
    morning: '/images/hero_background_morining.png',
    afternoon: '/images/hero_background_afternoon.png',
    evening: '/images/hero_background_evening.png',
    night: '/images/hero_background_night.png',
};

const TIME_GREETINGS: Record<TimeOfDay, string[]> = {
    morning: [
        'Good morning',
        'Good morning, {name}',
        'Coffee and Work time?',
        'Back at it!',
        'Back at it, {name}',
    ],
    afternoon: [
        'Good afternoon',
        'Good afternoon, {name}',
        "How's it going?",
        "How's it going, {name}?",
        "What's new?",
        "What's new, {name}?",
    ],
    evening: [
        'Evening',
        'Evening, {name}',
        'Good evening',
        'Good evening, {name}',
        'How was your day?',
        'How was your day, {name}?',
    ],
    night: [
        'Hello, night owl',
        "What's on your mind tonight?",
        "What's on your mind?",
        "What's on your mind, {name}?",
    ],
};

const DAY_GREETINGS: Record<number, string[]> = {
    0: [
        'Happy Sunday',
        'Happy Sunday, {name}',
        'Sunday session?',
        'Sunday session, {name}?',
        'Welcome to the weekend',
        'Welcome to the weekend, {name}',
    ],
    1: ['Happy Monday', 'Happy Monday, {name}'],
    2: ['Happy Tuesday', 'Happy Tuesday, {name}'],
    3: ['Happy Wednesday', 'Happy Wednesday, {name}'],
    4: ['Happy Thursday', 'Happy Thursday, {name}'],
    5: [
        'Happy Friday',
        'Happy Friday, {name}',
        'That Friday feeling',
        'That Friday feeling, {name}',
    ],
    6: [
        'Happy Saturday!',
        'Happy Saturday, {name}',
        'Welcome to the weekend',
        'Welcome to the weekend, {name}',
    ],
};

const GENERAL_GREETINGS = [
    '{name} returns!',
    'Hey there',
    'Hey there, {name}',
    'Hi, how are you?',
    'Hi {name}, how are you?',
    'Welcome',
    'Welcome, {name}',
];

const ANONYMOUS_GREETINGS = [
    'Greetings, whoever you are',
    "Let's chat incognito",
    "You're incognito",
];

export function getTimeOfDay(date = new Date()): TimeOfDay {
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) {
        return 'morning';
    }

    if (hour >= 12 && hour < 17) {
        return 'afternoon';
    }

    if (hour >= 17 && hour < 21) {
        return 'evening';
    }

    return 'night';
}

function stableIndex(seed: string, length: number): number {
    let hash = 0;

    for (const character of seed) {
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }

    return hash % length;
}

export function getWorkspaceGreeting(
    name: string | null | undefined,
    date = new Date(),
): string {
    const displayName = name?.trim();
    const timeOfDay = getTimeOfDay(date);
    const greetings = [
        ...(DAY_GREETINGS[date.getDay()] ?? []),
        ...TIME_GREETINGS[timeOfDay],
        ...GENERAL_GREETINGS,
        ...(displayName ? [] : ANONYMOUS_GREETINGS),
    ].filter((greeting) => displayName || !greeting.includes('{name}'));
    const seed = [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        timeOfDay,
        displayName ?? 'anonymous',
    ].join('-');
    const template = greetings[stableIndex(seed, greetings.length)];

    return template.replace('{name}', displayName ?? '');
}

export function formatWorkspaceDate(date = new Date()): string {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(date);
}

export function WorkspaceHero({
    eyebrow,
    description,
    className,
    contentClassName,
    imagePosition = 'center 45%',
}: WorkspaceHeroProps) {
    const { auth } = usePage<PageProps>().props;
    const now = new Date();
    const displayName = auth.user?.name ?? null;
    const timeOfDay = getTimeOfDay(now);

    return (
        <section
            className={cn(
                'relative min-h-[320px] overflow-hidden rounded-[18px] sm:min-h-[330px] sm:rounded-3xl lg:min-h-[300px] xl:min-h-[320px]',
                className,
            )}
        >
            <img
                src={HERO_BACKGROUNDS[timeOfDay]}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: imagePosition }}
            />
            <div
                className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,31,48,0.76)_0%,rgba(28,39,52,0.51)_38%,rgba(28,39,52,0.16)_68%,rgba(28,39,52,0.04)_100%)]"
                aria-hidden="true"
            />

            <div className="absolute top-4 right-4 z-10 inline-flex min-h-9 items-center gap-2 rounded-[9px] border border-white/25 bg-[#112337]/85 px-3.5 text-[13px] font-medium text-white shadow-[0_6px_18px_rgba(10,20,30,0.14)] sm:top-6 sm:right-6">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatWorkspaceDate(now)}
            </div>

            <div
                className={cn(
                    'relative z-10 flex min-h-[320px] max-w-[680px] flex-col items-start justify-end px-6 pt-24 pb-8 sm:min-h-[330px] sm:justify-center sm:px-9 sm:py-10 lg:min-h-[300px] lg:py-9 xl:min-h-[320px]',
                    contentClassName,
                )}
            >
                <p className="text-sm font-semibold tracking-[0.04em] text-white/95 uppercase">
                    {eyebrow}
                </p>
                <h1 className="mt-3 text-[clamp(1.875rem,2.6vw,2.625rem)] leading-[1.12] font-bold tracking-[-0.025em] text-white">
                    {getWorkspaceGreeting(displayName, now)}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/90">
                    {description}
                </p>
            </div>
        </section>
    );
}
