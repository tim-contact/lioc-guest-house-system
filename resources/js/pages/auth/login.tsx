import { Form, Head } from '@inertiajs/react';
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

export default function Login({ status, canResetPassword }: Props) {
    const [forgotOpen, setForgotOpen] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    return (
        <>
            <Head title="Log in" />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Email */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-xs font-semibold tracking-wide text-slate-900"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder=""
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-xs font-semibold tracking-wide text-slate-900"
                                >
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder=""
                                    onFocus={() => setShowForgotPassword(true)}
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Forgot password — hidden on first paint, revealed after password field interaction */}
                            {showForgotPassword && (
                                <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                                    <button
                                        type="button"
                                        className="self-start text-xs font-medium text-slate-700 underline decoration-slate-400 underline-offset-4 transition-colors hover:text-slate-950 hover:decoration-slate-700"
                                        tabIndex={5}
                                        onClick={() => setForgotOpen(true)}
                                    >
                                        Forgot your password?
                                    </button>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Forgot Password</DialogTitle>
                                            <DialogDescription className="space-y-4 pt-2">
                                                <p>
                                                    Please contact the system
                                                    administrator for password
                                                    reset assistance:
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

                            {/* Remember me */}
                            <div className="flex items-center space-x-3 pt-1">
                                <Checkbox 
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-medium text-slate-800"
                                >
                                    Remember me
                                </Label>
                            </div>

                            {/* Submit — restrained deep green accent */}
                            <Button
                                type="submit"
                                className="mt-2 w-full bg-orange-900 text-white hover:bg-orange-800 focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-2 text-center text-sm font-medium text-green-700">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
