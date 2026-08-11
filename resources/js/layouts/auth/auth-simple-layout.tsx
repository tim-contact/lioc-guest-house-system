import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div
            className="flex min-h-svh flex-col items-center justify-center bg-cover bg-center bg-no-repeat p-6 md:items-end md:justify-center md:p-10"
            style={{ backgroundImage: "url('/images/tanker_background.png')" }}
        >
            {/* Glassmorphism card – right side */}
            <div
                className="w-full max-w-md md:mr-8 lg:mr-16"
                style={{
                    background: 'rgba(255, 255, 255, 0.22)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5.1px)',
                    WebkitBackdropFilter: 'blur(5.1px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
            >
                <div className="flex flex-col gap-6 py-12 px-8">
                    {/* Logo — restrained, let the type carry the brand */}
                    <div className="flex flex-col items-center gap-5">
                        <img
                            src="/images/lanka-ioc-logo.png"
                            alt="Lanka IOC Logo"
                            className="h-24 w-auto"
                        />

                        <div className="space-y-1 text-center">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                                {title}
                            </h1>
                            <p className="text-sm font-light text-slate-950">
                                {description}
                            </p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
