import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

interface FlashPageProps {
    flash?: {
        toast?: FlashToast | null;
    };
    [key: string]: unknown;
}

/**
 * Shows a Sonner toast whenever the server flashes one via
 * `back()->with('toast', ['type' => ..., 'message' => ...])`.
 */
export function useFlashToast(): void {
    const data = usePage<FlashPageProps>().props.flash?.toast;

    useEffect(() => {
        if (data) {
            toast[data.type](data.message);
        }
    }, [data]);
}
