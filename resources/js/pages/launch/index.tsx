import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Power, Rocket, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    screen as launchScreen,
    update as updateLaunchMode,
} from '@/routes/launch';

/* Hallmark pre-emit critique: P4 H5 E4 S5 R5 V4 */

interface LaunchIndexProps {
    launchModeEnabled: boolean;
}

export default function LaunchIndex({ launchModeEnabled }: LaunchIndexProps) {
    const nextState = !launchModeEnabled;

    return (
        <>
            <Head title="Launch Mode" />

            <main className="min-h-[calc(100dvh-4rem)] bg-background px-4 py-6 text-[#102a4c] sm:px-6 lg:px-8">
                <section className="mx-auto flex max-w-4xl flex-col gap-5">
                    <div className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-white shadow-[0_10px_28px_rgba(38,42,48,0.06),0_2px_5px_rgba(38,42,48,0.04)]">
                        <div className="grid gap-5 bg-[linear-gradient(135deg,#102a4c_0%,#164a73_58%,#1e7b83_100%)] p-5 text-white sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                            <div className="flex min-w-0 items-center gap-4">
                                <span
                                    className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/14 text-white ring-1 ring-white/20"
                                    aria-hidden="true"
                                >
                                    <Rocket className="size-7" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-[0.08em] text-white/75 uppercase">
                                        Webapp launch
                                    </p>
                                    <h1 className="mt-1 text-2xl leading-tight font-bold sm:text-3xl">
                                        Launch mode is{' '}
                                        {launchModeEnabled ? 'on' : 'off'}
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">
                                        Use this authenticated control before
                                        launch day to switch the application
                                        into or out of launch mode.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-white/18 bg-white/92 px-4 py-3 text-[#102a4c] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                                <div className="flex items-center gap-2 text-xs font-medium text-[#657185]">
                                    <ShieldCheck className="size-4 text-[#15803d]" />
                                    Current status
                                </div>
                                <div className="mt-1 text-2xl font-bold">
                                    {launchModeEnabled ? 'Enabled' : 'Disabled'}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 bg-[#faf9f7] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div>
                                <p className="text-sm font-semibold text-[#102a4c]">
                                    Launch mode variable
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[#657185]">
                                    Stored as{' '}
                                    <span className="font-mono text-xs text-[#3f4a5f]">
                                        launchModeEnabled
                                    </span>
                                    .
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    variant="outline"
                                    className="min-h-11 gap-2"
                                    asChild
                                >
                                    <Link href={launchScreen()}>
                                        <ExternalLink className="size-4" />
                                        Open launch screen
                                    </Link>
                                </Button>
                                <Button
                                    onClick={() =>
                                        router.patch(updateLaunchMode().url, {
                                            enabled: nextState,
                                        })
                                    }
                                    className="min-h-11 gap-2"
                                    variant={
                                        launchModeEnabled
                                            ? 'destructive'
                                            : 'default'
                                    }
                                >
                                    <Power className="size-4" />
                                    Turn {nextState ? 'on' : 'off'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

LaunchIndex.layout = {
    title: 'Launch Mode',
};
