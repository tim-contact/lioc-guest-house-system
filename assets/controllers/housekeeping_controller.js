import { Controller } from '@hotwired/stimulus';
import { request as httpRequest, serializeForm as httpSerializeForm } from '../js/http.js';

/* stimulusFetch: 'lazy' */

export default class extends Controller {
    static targets = ['form', 'spinner', 'content', 'selectedDate', 'export'];
    static values = { saved: String, error: String };

    connect() {
        const isPreview = document.documentElement.hasAttribute('data-turbo-preview');
        // Skip heavy init when Turbo preview is rendered
        if (isPreview) {
            this.spin()
            return;
        } else {
            this.stopSpin();
        }
    }

    submitFilters(event) {
        this.spin();
        if (event) {
            event.preventDefault();
        }

        if (this.hasContentTarget) {
            // AJAX mode
            // Use the server-rendered route instead of deriving the request
            // endpoint from document.location. The response is inserted as a
            // trusted, Twig-escaped HTML partial by the shared HTTP helper.
            const action = this.formTarget.getAttribute('action');
            if (!action) {
                console.warn('[housekeeping] filter form has no action');
                this.stopSpin();
                return;
            }
            const query = httpSerializeForm(this.formTarget);
            const separator = action.includes('?') ? '&' : '?';
            const url = query ? `${action}${separator}${query}` : action;

            httpRequest({
                url,
                method: 'GET',
                target: this.contentTarget,
                loader: false,
                onSuccess: (html) => {
                    this.contentTarget.innerHTML = html;
                    this.syncNavigation();
                },
                onComplete: () => {
                    this.stopSpin();
                },
                onError: (message) => {
                    console.warn('[housekeeping] filter failed', message);
                    this.stopSpin();
                },
            });
        } else {
            // Fallback: full page reload
            if (this.formTarget && typeof this.formTarget.requestSubmit === 'function') {
                this.formTarget.requestSubmit();
            } else if (this.formTarget) {
                this.formTarget.submit();
            }
        }
    }

    // Keep the heading, export and view links aligned with AJAX filter changes.
    syncNavigation() {
        const summary = this.contentTarget.querySelector('[data-hk-date]');
        if (summary && this.hasSelectedDateTarget) this.selectedDateTarget.textContent = summary.dataset.hkDate;
        const params = new URLSearchParams(httpSerializeForm(this.formTarget));
        this.element.querySelectorAll('[data-hk-view]').forEach((link) => {
            const url = new URL(link.href, window.location.href);
            const viewParams = new URLSearchParams(params);
            viewParams.set('view', link.dataset.hkView);
            url.search = viewParams.toString();
            link.href = url.toString();
        });
        if (this.hasExportTarget) {
            const url = new URL(this.exportTarget.href, window.location.href);
            params.set('range', params.get('view') || 'day');
            params.delete('view');
            url.search = params.toString();
            this.exportTarget.href = url.toString();
        }
    }

    spin() {
        if (this.hasSpinnerTarget) {
            this.spinnerTarget.classList.add('fa-spin');
        }
    }

    stopSpin() {
        if (this.hasSpinnerTarget) {
            this.spinnerTarget.classList.remove('fa-spin');
        }
    }

    clearFeedback(event) {
        const form = event.target.form;
        if (!form) return;
        const feedback = this.element.querySelector('[data-hk-feedback="' + form.id + '"]');
        if (feedback) feedback.textContent = '';
    }

    async saveRow(event) {
        event.preventDefault();
        const form = event.target;
        const submitter = event.submitter || this.element.querySelector('button[form="' + form.id + '"]');
        const feedback = this.element.querySelector('[data-hk-feedback="' + form.id + '"]');
        if (feedback) feedback.textContent = '';

        if (submitter) {
            submitter.disabled = true;
        }

        httpRequest({
            url: form.action,
            method: form.method || 'POST',
            data: httpSerializeForm(form),
            loader: false,
            onSuccess: (text) => {
                try {
                    const result = JSON.parse(text);
                    if (!result.ok) throw new Error('Save failed');
                    const wasOpen = form.dataset.hkOpen === '1';
                    const isOpen = result.hkStatus === 'OPEN';
                    const count = this.element.querySelector('[data-housekeeping-open-count]');
                    if (count && wasOpen !== isOpen) count.textContent = String(Number(count.textContent) + (isOpen ? 1 : -1));
                    form.dataset.hkOpen = isOpen ? '1' : '0';
                    if (feedback) { feedback.textContent = this.savedValue; feedback.classList.remove('is-error'); }
                } catch (error) {
                    if (feedback) { feedback.textContent = this.errorValue; feedback.classList.add('is-error'); }
                }
            },
            onComplete: () => {
                if (submitter) {
                    submitter.disabled = false;
                }
            },
            onError: (message) => {
                console.warn('[housekeeping] save failed', message);
                if (feedback) { feedback.textContent = this.errorValue; feedback.classList.add('is-error'); }
            },
        });
    }
}
