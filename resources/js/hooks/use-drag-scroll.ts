import { useEffect, useRef } from 'react';

const DRAG_THRESHOLD_PX = 6;
const INTERACTIVE_SELECTOR =
    'input, textarea, select, button, a, [role="button"], [contenteditable="true"]';

/**
 * Lets the user click-and-drag the row's background to scroll it horizontally.
 * Mouse only — touch already scrolls natively, and hijacking touch here would fight it.
 * Ignores presses that start on an interactive control so card inputs/buttons/selects
 * keep working normally. Regions marked `data-drag-scroll-ignore` are inert; a
 * `data-drag-scroll-handle` inside such a region drags again.
 */
export function useDragScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        let accepted = false;
        let dragging = false;
        let startX = 0;
        let startScrollLeft = 0;

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement;

            if (
                event.pointerType !== 'mouse' ||
                event.button !== 0 ||
                target.closest(INTERACTIVE_SELECTOR) ||
                (target.closest('[data-drag-scroll-ignore]') &&
                    !target.closest('[data-drag-scroll-handle]'))
            ) {
                return;
            }

            startX = event.clientX;
            startScrollLeft = element.scrollLeft;
            accepted = true;
            dragging = false;
            element.setPointerCapture(event.pointerId);
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!accepted || event.buttons !== 1) {
                return;
            }

            const delta = event.clientX - startX;

            if (!dragging) {
                if (Math.abs(delta) < DRAG_THRESHOLD_PX) {
                    return;
                }

                dragging = true;
                element.classList.add(
                    'cursor-grabbing',
                    '[&_*]:cursor-grabbing',
                    'select-none',
                );
            }

            element.scrollLeft = startScrollLeft - delta;
        };

        const endDrag = () => {
            accepted = false;
            dragging = false;
            element.classList.remove(
                'cursor-grabbing',
                '[&_*]:cursor-grabbing',
                'select-none',
            );
        };

        element.addEventListener('pointerdown', onPointerDown);
        element.addEventListener('pointermove', onPointerMove);
        element.addEventListener('pointerup', endDrag);
        element.addEventListener('pointercancel', endDrag);

        return () => {
            element.removeEventListener('pointerdown', onPointerDown);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerup', endDrag);
            element.removeEventListener('pointercancel', endDrag);
        };
    }, []);

    return ref;
}
