/** Full-bleed context strip at the top of a dialog; mirrors `DialogFooter`. */
export function SummaryBand({ children }: { children: React.ReactNode }) {
    return (
        <div className="-mx-4 -mt-4 flex flex-col gap-4 rounded-t-xl border-b-2 border-brand-border bg-brand-surface p-4 shadow-sm">
            {children}
        </div>
    );
}
