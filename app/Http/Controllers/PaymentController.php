<?php

namespace App\Http\Controllers;

use App\Enums\PaymentType;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $payments = Payment::with('order.customer')
            ->orderByDesc('date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Payment $payment): array => [
                'id' => $payment->id,
                'order_number' => $payment->order_number,
                'customer_name' => $payment->order?->customer?->name,
                'vessel_name' => $payment->order?->vessel_name,
                'amount' => $payment->amount,
                'date' => $payment->date->toDateString(),
                'type' => $payment->type->value,
            ]);

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'paymentTypeOptions' => $this->enumOptions(PaymentType::cases()),
        ]);
    }

    public function update(Request $request, Payment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'type' => ['required', Rule::enum(PaymentType::class)],
        ]);

        $payment->update($validated);
        $payment->order?->syncPaymentTotals();

        return $this->toast('Payment saved.');
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        $order = $payment->order;

        $payment->delete();
        $order?->syncPaymentTotals();

        return $this->toast('Payment deleted.');
    }
}
