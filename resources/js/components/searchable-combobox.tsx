import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ComboboxItem {
    value: string; // the value stored on the form (sap_id / imo)
    label: string; // primary text (name)
    sublabel: string; // secondary text, also searchable (SAP ID / IMO)
}

// ---- Searchable dropdown: filters on both label and sublabel ----
// Deliberately custom (no cmdk installed; shadcn Select isn't searchable). Mouse-only.
export function SearchableCombobox({
    items,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyText,
}: {
    items: ComboboxItem[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    emptyText: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const selected = items.find((item) => item.value === value);
    const needle = query.toLowerCase();
    const filtered = items.filter(
        (item) =>
            item.label.toLowerCase().includes(needle) ||
            item.sublabel.toLowerCase().includes(needle),
    );

    return (
        <div className="relative">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setOpen((previous) => !previous)}
            >
                <span className={selected ? '' : 'text-muted-foreground'}>
                    {selected
                        ? `${selected.label} (${selected.sublabel})`
                        : placeholder}
                </span>
                <span className="text-muted-foreground">▾</span>
            </Button>

            {open && (
                <>
                    {/* click-outside backdrop */}
                    <button
                        type="button"
                        aria-hidden
                        tabIndex={-1}
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                        <Input
                            autoFocus
                            placeholder={searchPlaceholder}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="mb-1"
                        />
                        <div className="max-h-48 overflow-y-auto">
                            {filtered.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(item.value);
                                        setQuery('');
                                        setOpen(false);
                                    }}
                                    className="flex w-full flex-col items-start rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                                >
                                    <span>{item.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {item.sublabel}
                                    </span>
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                    {emptyText}
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
