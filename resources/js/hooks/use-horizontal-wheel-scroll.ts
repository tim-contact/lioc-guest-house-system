import { useEffect } from 'react';

const HORIZONTAL_SCROLL_SELECTOR = '[data-horizontal-wheel-scroll]';

function canScrollHorizontally(element: HTMLElement) {
    return element.scrollWidth > element.clientWidth;
}

function findScrollableAncestor(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return null;
    }

    let element: HTMLElement | null = target;

    while (element) {
        if (canScrollHorizontally(element)) {
            return element;
        }

        element = element.parentElement;
    }

    return null;
}

function findFallbackTarget() {
    const scrollTargets = document.querySelectorAll<HTMLElement>(
        HORIZONTAL_SCROLL_SELECTOR,
    );

    return (
        Array.from(scrollTargets).find((element) =>
            canScrollHorizontally(element),
        ) ?? null
    );
}

export function useHorizontalWheelScroll() {
    useEffect(() => {
        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey || event.deltaY === 0) {
                return;
            }

            const target =
                findScrollableAncestor(event.target) ?? findFallbackTarget();

            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollLeft += event.deltaY;
        };

        window.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            window.removeEventListener('wheel', onWheel);
        };
    }, []);
}
