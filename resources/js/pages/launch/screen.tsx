import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { GLSLHills } from '@/components/ui/glsl-hills';
import { Button } from '@/components/ui/button';
import { analytics as reportsAnalytics } from '@/routes/reports';

/* Hallmark pre-emit critique: P4 H5 E4 S5 R5 V4 */

function formatLaunchDate(date: Date) {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
        .format(date)
        .replace(/\//g, '.');
}

export default function LaunchScreen() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentDate, setCurrentDate] = useState(() =>
        formatLaunchDate(new Date()),
    );
    const [isLaunching, setIsLaunching] = useState(false);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentDate(formatLaunchDate(new Date()));
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isLaunching) {
            return;
        }

        void videoRef.current?.play();
    }, [isLaunching]);

    const handleLaunch = () => {
        setIsLaunching(true);
    };

    const handleLaunchComplete = () => {
        router.visit(reportsAnalytics());
    };

    return (
        <>
            <Head title="Launch" />

            <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#05070b] px-5 py-28 text-white sm:py-32">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(95,142,255,0.24),transparent_34%),linear-gradient(180deg,#060914_0%,#0b1020_46%,#030407_100%)]" />
                <div className="absolute inset-0 opacity-90">
                    <GLSLHills />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent_0%,rgba(3,4,7,0.78)_58%,#030407_100%)]" />

                <section className="relative z-10 flex max-w-5xl flex-col items-center text-center">
                    <img
                        src="/images/lanka-ioc-logo.png"
                        alt="Lanka IOC"
                        className="mb-8 h-[4.5rem] w-auto object-contain drop-shadow-[0_16px_34px_rgba(0,0,0,0.34)] sm:h-[5.5rem]"
                    />
                    <h1 className="max-w-4xl text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] font-semibold tracking-normal">
                        Ready for launch
                    </h1>

                    <Button
                        size="lg"
                        onClick={handleLaunch}
                        className="mt-10 min-h-12 rounded-full px-6 text-base shadow-[0_18px_42px_rgba(79,70,229,0.35)]"
                    >
                        Launch now
                        <ArrowRight className="size-5" />
                    </Button>
                </section>

                <footer className="absolute right-5 bottom-5 left-5 z-20 text-center text-sm font-medium text-white/58 sm:bottom-7">
                    {currentDate}
                </footer>

                {isLaunching && (
                    <div className="absolute inset-0 z-30 bg-black">
                        <video
                            ref={videoRef}
                            src="/images/launch_video_bunkering.mp4"
                            className="h-full w-full object-cover"
                            playsInline
                            onEnded={handleLaunchComplete}
                        />
                    </div>
                )}
            </main>
        </>
    );
}

LaunchScreen.layout = null;
