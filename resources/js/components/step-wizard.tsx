import { Check } from 'lucide-react';

export interface StepWizardStep {
    key: string;
    label: string;
    shortLabel?: string;
}

interface StepWizardProps {
    steps: readonly StepWizardStep[];
    currentStep: number;
    onStepClick: (step: number) => void;
    totalSteps?: number;
    mobileMeta?: string;
    variant?: 'default' | 'compact';
}

export default function StepWizard({
    steps,
    currentStep,
    onStepClick,
    totalSteps,
    mobileMeta,
    variant = 'default',
}: StepWizardProps) {
    const count = totalSteps ?? steps.length;
    const currentLabel = steps[currentStep]?.label ?? 'Current step';
    const nextLabel = steps[currentStep + 1]?.label ?? 'Review & finish';
    const progress = Math.max(
        0,
        Math.min(100, Math.round(((currentStep + 1) / count) * 100)),
    );
    const circleRadius = 28;
    const circumference = 2 * Math.PI * circleRadius;
    const dashOffset = circumference - (progress / 100) * circumference;
    const mobileHeaderText =
        mobileMeta ?? `Step ${currentStep + 1} of ${count}`;

    if (variant === 'compact') {
        return (
            <nav
                className="grid h-[52px] grid-cols-4 gap-1 border-t border-[#E3EAF2] bg-white px-2 py-1.5 sm:gap-1.5 sm:px-3"
                aria-label="BDN steps"
            >
                {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={() => onStepClick(index)}
                            aria-current={isActive ? 'step' : undefined}
                            className={
                                isActive
                                    ? 'flex h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#172033] px-1 text-[10px] leading-none font-bold text-white transition sm:flex-row sm:gap-2 sm:px-3 sm:text-xs'
                                    : 'flex h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-[#E3EAF2] bg-[#F8FAFD] px-1 text-[10px] leading-none font-bold text-slate-600 transition hover:bg-white sm:flex-row sm:gap-2 sm:px-3 sm:text-xs'
                            }
                        >
                            <span
                                className={
                                    isActive
                                        ? 'flex size-5 items-center justify-center rounded-full bg-white text-[11px] text-[#172033]'
                                        : isCompleted
                                          ? 'flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'
                                          : 'flex size-5 items-center justify-center rounded-full bg-white text-[11px] text-slate-500'
                                }
                            >
                                {isCompleted ? (
                                    <Check className="size-3" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span className="max-w-full truncate">
                                <span className="sm:hidden">
                                    {step.shortLabel ?? step.label}
                                </span>
                                <span className="hidden sm:inline">
                                    {step.label}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </nav>
        );
    }

    return (
        <div>
            <div className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1fb77a_0%,#17a46f_55%,#0d9364_100%)] px-4 py-4 text-white shadow-[0_18px_36px_rgba(21,128,61,0.18)] md:hidden">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
                            {mobileHeaderText}
                        </p>
                        <h2 className="mt-2 text-xl leading-tight font-semibold text-white">
                            {currentLabel}
                        </h2>
                        <p className="mt-2 text-sm leading-5 text-white/80">
                            Next: {nextLabel}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            {steps.map((step, index) => {
                                const isActive = index === currentStep;
                                const isCompleted = index < currentStep;

                                return (
                                    <button
                                        key={step.key}
                                        type="button"
                                        onClick={() => onStepClick(index)}
                                        className={
                                            isActive
                                                ? 'h-2.5 w-8 rounded-full bg-white transition'
                                                : isCompleted
                                                  ? 'h-2.5 w-2.5 rounded-full bg-amber-300 transition'
                                                  : 'h-2.5 w-2.5 rounded-full bg-white/35 transition'
                                        }
                                        aria-label={`Go to ${step.label}`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative shrink-0">
                        <svg
                            className="h-20 w-20 -rotate-90"
                            viewBox="0 0 72 72"
                            aria-hidden="true"
                        >
                            <circle
                                cx="36"
                                cy="36"
                                r={circleRadius}
                                fill="none"
                                stroke="rgba(255,255,255,0.18)"
                                strokeWidth="7"
                            />
                            <circle
                                cx="36"
                                cy="36"
                                r={circleRadius}
                                fill="none"
                                stroke="#fbbf24"
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                                <span className="text-[11px] font-semibold text-white">
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-[#E3EAF2] bg-white shadow-sm md:block">
                <div className="flex flex-col gap-2 border-b border-[#E3EAF2] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">
                            Progress
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#172033]">
                            Step {currentStep + 1} of {count}
                        </p>
                    </div>
                    <p className="text-[11px] font-bold tracking-[0.16em] text-slate-500 uppercase">
                        Tap a step
                    </p>
                </div>

                <div className="flex gap-2 overflow-x-auto px-3 py-3 md:snap-x md:snap-mandatory lg:gap-0 lg:px-0 lg:py-0">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <button
                                key={step.key}
                                type="button"
                                onClick={() => onStepClick(index)}
                                className={
                                    isActive
                                        ? 'group flex min-w-[220px] snap-start items-center gap-3 rounded-2xl border border-[#172033] bg-[#172033] px-4 py-4 text-left text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition sm:min-w-[240px] lg:min-w-0 lg:flex-1 lg:rounded-none lg:border-0 lg:px-5 first:lg:rounded-bl-2xl last:lg:rounded-br-2xl'
                                        : 'group flex min-w-[220px] snap-start items-center gap-3 rounded-2xl border border-[#E3EAF2] bg-white px-4 py-4 text-left transition hover:bg-[#F8FAFD] sm:min-w-[240px] lg:min-w-0 lg:flex-1 lg:rounded-none lg:border-0 lg:px-5 first:lg:rounded-bl-2xl last:lg:rounded-br-2xl'
                                }
                            >
                                <span
                                    className={
                                        isActive
                                            ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#172033] sm:h-8 sm:w-8'
                                            : isCompleted
                                              ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 sm:h-8 sm:w-8'
                                              : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F8FAFD] text-xs font-semibold text-slate-500 sm:h-8 sm:w-8'
                                    }
                                >
                                    {isCompleted ? (
                                        <Check className="size-3.5" />
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span className="min-w-0">
                                    <span
                                        className={
                                            isActive
                                                ? 'block text-[10px] font-bold tracking-[0.16em] text-white/70 uppercase'
                                                : 'block text-[10px] font-bold tracking-[0.16em] text-slate-500 uppercase'
                                        }
                                    >
                                        Step {index + 1}
                                    </span>
                                    <span
                                        className={
                                            isActive
                                                ? 'block truncate text-sm font-semibold text-white sm:text-[15px]'
                                                : 'block truncate text-sm font-semibold text-[#172033] sm:text-[15px]'
                                        }
                                    >
                                        {step.label}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
