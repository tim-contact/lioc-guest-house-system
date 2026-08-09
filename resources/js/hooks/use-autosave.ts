import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/**
 * Debounced autosave for an Inertia form. A payload is never attempted twice,
 * so a rejected save waits for the next edit instead of retrying forever.
 *
 * `save` receives the exact data being saved: pass it back to
 * `form.setDefaults(submitted)`, or keystrokes made mid-request are marked
 * clean and dropped.
 */
export function useAutosave<T>({
    data,
    dirty,
    processing,
    hasErrors = false,
    save,
    delay = 800,
}: {
    data: T;
    dirty: boolean;
    processing: boolean;
    hasErrors?: boolean;
    save: (data: T) => void;
    delay?: number;
}): { status: AutosaveStatus; flush: () => void } {
    const [hasSaved, setHasSaved] = useState(false);
    const latest = useRef({ data, dirty, save });
    const attempted = useRef<T | null>(null);
    const flushed = useRef(false);

    useEffect(() => {
        latest.current = { data, dirty, save };
    });

    useEffect(() => {
        if (!dirty || processing || data === attempted.current) {
            return;
        }

        const timer = setTimeout(() => {
            attempted.current = data;
            setHasSaved(true);
            latest.current.save(data);
        }, delay);

        return () => clearTimeout(timer);
    }, [data, dirty, processing, delay]);

    useEffect(
        () => () => {
            if (!flushed.current && latest.current.dirty) {
                latest.current.save(latest.current.data);
            }
        },
        [],
    );

    const flush = useCallback(() => {
        flushed.current = true;

        if (latest.current.dirty) {
            attempted.current = latest.current.data;
            latest.current.save(latest.current.data);
        }
    }, []);

    if (processing) {
        return { status: 'saving', flush };
    }

    if (hasErrors) {
        return { status: 'error', flush };
    }

    if (dirty) {
        return { status: 'pending', flush };
    }

    return { status: hasSaved ? 'saved' : 'idle', flush };
}
