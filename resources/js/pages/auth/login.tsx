import { Form, Head } from '@inertiajs/react';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const currentYear = new Date().getFullYear();

export default function Login({ status }: Props) {
    const [forgotOpen, setForgotOpen] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    return (
        <>
            <Head title="Log in" />

            <main
                className="relative min-h-svh w-full overflow-x-clip bg-cover bg-center bg-no-repeat px-4 py-3 text-white sm:px-6 lg:bg-[center_center] lg:px-10"
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, rgba(3, 16, 29, 0.32) 0%, rgba(3, 16, 29, 0.12) 45%, rgba(3, 16, 29, 0.42) 100%), url('/images/tanker_background.png')",
                }}
            >
                <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[48%] bg-[linear-gradient(90deg,rgba(3,16,29,0.62),rgba(3,16,29,0.18),rgba(3,16,29,0))] lg:block" />

                <div className="relative z-10 grid min-h-[calc(100svh-1.5rem)] items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
                    <section className="hidden max-w-[560px] pl-4 lg:block xl:pl-12">
                        <img
                            alt="BOSS"
                            className="max-h-[140px] w-[min(72vw,360px)] object-contain"
                            src="/images/boss_logo.png"
                        />
                        <h1 className="text-[clamp(2.4rem,3.2vw,4rem)] leading-[1.05] font-bold tracking-normal text-white">
                            Command every
                            <br />
                            bunkering operation.
                        </h1>
                        <div className="mt-4 h-[3px] w-12 rounded-full bg-[#f36f21]" />
                        <p className="mt-4 text-lg font-medium text-white/82">
                            Secure. Connected. In control.
                        </p>
                    </section>

                    <section className="mx-auto w-full max-w-[520px] lg:mr-[6vw]">
                        <div className="rounded-[22px] border border-[#f36f21]/22 bg-[linear-gradient(145deg,#fff8ef,#f2f1ef_56%,#e4edf4)] px-5 py-4 shadow-[0_28px_70px_rgba(0,10,24,0.38),inset_0_1px_0_rgba(255,255,255,0.72)] sm:px-7 sm:py-5">
                            <div className="flex flex-col items-center text-center">
                                <img
                                    alt="BOSS"
                                    className="max-h-[96px] w-[min(72vw,240px)] object-contain sm:max-h-[105px] sm:w-[260px]"
                                    src="/images/boss_logo.png"
                                />
                                <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-[#31536a] uppercase">
                                    Bunker Operations and Sales System
                                </p>
                                <div className="mt-2 h-[3px] w-12 rounded-full bg-[#f36f21]" />
                                <h2 className="mt-3 text-2xl font-bold tracking-normal text-[#031628] sm:text-[1.625rem]">
                                    Welcome back
                                </h2>
                                <p className="mt-1.5 text-sm text-[#31536a] sm:text-[0.95rem]">
                                    Sign in to continue to BOSS
                                </p>
                            </div>

                            <Form
                                action={store.url()}
                                method="post"
                                resetOnSuccess={['password']}
                                className="mt-4 flex flex-col gap-3"
                            >
                                {({ processing, errors }) => (
                                    <div className="grid gap-3">
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="email"
                                                className="text-sm font-medium text-[#18364b]"
                                            >
                                                Email address
                                            </Label>
                                            <div className="relative">
                                                <Mail
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#486a80]"
                                                />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="name@lankaioc.com"
                                                    className="h-[46px] rounded-[11px] border-[#b6c6d0] bg-white pr-4 pl-10 text-base text-[#031628] placeholder:text-[#6d8797] focus-visible:border-[#f36f21] focus-visible:ring-[3px] focus-visible:ring-[#f36f21]/18 md:text-sm"
                                                />
                                            </div>
                                            <InputError
                                                message={errors.email}
                                                className="text-[#b42318]"
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="password"
                                                className="text-sm font-medium text-[#18364b]"
                                            >
                                                Password
                                            </Label>
                                            <div className="relative [&_button]:rounded-r-[11px] [&_button]:text-[#486a80] [&_button]:transition-colors [&_button]:hover:text-[#f36f21] [&_button]:focus-visible:ring-[#f36f21]/35">
                                                <Lock
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-[#486a80]"
                                                />
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Enter your password"
                                                    onFocus={() =>
                                                        setShowForgotPassword(
                                                            true,
                                                        )
                                                    }
                                                    className="h-[46px] rounded-[11px] border-[#b6c6d0] bg-white pr-11 pl-10 text-base text-[#031628] placeholder:text-[#6d8797] focus-visible:border-[#f36f21] focus-visible:ring-[3px] focus-visible:ring-[#f36f21]/18 md:text-sm"
                                                />
                                            </div>
                                            <InputError
                                                message={errors.password}
                                                className="text-[#b42318]"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                    className="border-[#f36f21]/70 bg-white text-white focus-visible:ring-[#f36f21]/35 data-checked:border-[#f36f21] data-checked:bg-[#f36f21]"
                                                />
                                                <Label
                                                    htmlFor="remember"
                                                    className="text-sm font-medium text-[#18364b]"
                                                >
                                                    Remember me
                                                </Label>
                                            </div>

                                            {showForgotPassword && (
                                                <Dialog
                                                    open={forgotOpen}
                                                    onOpenChange={setForgotOpen}
                                                >
                                                    <button
                                                        type="button"
                                                        className="text-sm font-semibold text-[#f36f21] underline-offset-4 transition-colors hover:text-[#ff944f] hover:underline focus-visible:ring-2 focus-visible:ring-[#f36f21]/45 focus-visible:outline-none"
                                                        tabIndex={5}
                                                        onClick={() =>
                                                            setForgotOpen(true)
                                                        }
                                                    >
                                                        Forgot password?
                                                    </button>
                                                    <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Forgot Password
                                                            </DialogTitle>
                                                            <DialogDescription className="space-y-4 pt-2">
                                                                <p>
                                                                    Please
                                                                    contact the
                                                                    system
                                                                    administrator
                                                                    for password
                                                                    reset
                                                                    assistance:
                                                                </p>
                                                                <div className="space-y-1 text-sm font-medium">
                                                                    <p>
                                                                        <a
                                                                            href="mailto:timothy@lankaioc.com"
                                                                            className="underline hover:no-underline"
                                                                        >
                                                                            timothy@lankaioc.com
                                                                        </a>
                                                                    </p>
                                                                    <p>
                                                                        <a
                                                                            href="mailto:ninuka@lankaioc.com"
                                                                            className="underline hover:no-underline"
                                                                        >
                                                                            ninuka@lankaioc.com
                                                                        </a>
                                                                    </p>
                                                                </div>
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-1 h-[46px] w-full rounded-[11px] bg-[linear-gradient(90deg,#f36f21,#e85c00)] text-base font-bold text-white shadow-[0_10px_24px_rgba(232,92,0,0.24)] transition-[transform,filter,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-[0_14px_30px_rgba(232,92,0,0.32)] hover:brightness-[1.06] focus-visible:ring-2 focus-visible:ring-[#f36f21]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#031628] active:translate-y-0 disabled:translate-y-0 disabled:opacity-65"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && <Spinner />}
                                            Sign in securely
                                        </Button>
                                    </div>
                                )}
                            </Form>

                            {status && (
                                <div className="mt-4 text-center text-sm font-medium text-[#157347]">
                                    {status}
                                </div>
                            )}

                            <div className="mt-4 border-t border-[#c9d4dc] pt-3">
                                <div className="flex items-center justify-center gap-3">
                                    <img
                                        alt="Lanka IOC"
                                        className="size-9 object-contain"
                                        src="/images/lanka-ioc-logo.png"
                                    />
                                    <p className="text-sm font-medium text-[#62808a]">
                                        Powered by{' '}
                                        <span className="font-bold text-[#03045e]">
                                            Lanka
                                        </span>{' '}
                                        <span className="font-bold text-[#f36f21]">
                                            IOC
                                        </span>
                                    </p>
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-[#486a80]">
                                    <ShieldCheck
                                        aria-hidden="true"
                                        className="size-4 text-[#f36f21]"
                                    />
                                    Authorised personnel only
                                </div>
                            </div>
                        </div>

                        <p className="mt-2 text-center text-xs font-medium text-white/72">
                            <span className="whitespace-nowrap">
                                © {currentYear} Lanka IOC PLC. All rights
                                reserved.
                            </span>
                            <span className="mx-2 text-white/40">|</span>
                            <span className="font-semibold whitespace-nowrap text-white/82">
                                Developed by Lanka IOC IT
                            </span>
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}

Login.layout = null;
