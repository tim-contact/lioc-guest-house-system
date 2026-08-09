import { Head, Link } from '@inertiajs/react';
import { login, register } from '@/routes';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
                <h1 className="text-2xl font-semibold">Bunkering System</h1>
                <div className="flex gap-3">
                    <Link
                        href={login()}
                        className="rounded-md border px-5 py-2 text-sm hover:bg-muted"
                    >
                        Log in
                    </Link>
                    <Link
                        href={register()}
                        className="rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </>
    );
}
