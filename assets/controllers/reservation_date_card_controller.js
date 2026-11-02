import { Controller } from '@hotwired/stimulus';

/* stimulusFetch: 'lazy' */

/**
 * Keeps a ledger that was showing today in sync with the server's UTC day.
 */
export default class extends Controller {
    static values = { displayed: String, serverTime: Number };

    connect() {
        this.clockOffset = this.serverTimeValue * 1000 - Date.now();
        this.renderedToday = new Date(this.serverTimeValue * 1000).toISOString().slice(0, 10);
        this.checkDay = this.checkDay.bind(this);
        document.addEventListener('visibilitychange', this.checkDay);
        this.scheduleNextDay();
    }

    disconnect() {
        window.clearTimeout(this.timer);
        document.removeEventListener('visibilitychange', this.checkDay);
    }

    /** Refresh only when the ledger still shows the day that was today at render time. */
    checkDay() {
        const now = new Date(Date.now() + this.clockOffset);
        const currentDay = now.toISOString().slice(0, 10);
        const input = document.getElementById('start');

        if (currentDay !== this.renderedToday && this.displayedValue === this.renderedToday && input?.value === this.displayedValue) {
            this.renderedToday = currentDay;
            input.value = currentDay;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        this.scheduleNextDay();
    }

    scheduleNextDay() {
        window.clearTimeout(this.timer);
        const now = new Date(Date.now() + this.clockOffset);
        const nextDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
        this.timer = window.setTimeout(this.checkDay, Math.max(1, nextDay - now.getTime() + 100));
    }
}
