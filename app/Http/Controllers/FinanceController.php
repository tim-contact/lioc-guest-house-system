<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentType;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function index(): Response
    {
        $completedOrders = Order::with(['customer', 'payments'])
            ->whereIn('status', OrderStatus::completedStatuses())
            ->orderBy('payment_due_date')
            ->orderBy('order_number')
            ->get()
            ->map(fn (Order $order): array => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer?->name,
                'vessel_name' => $order->vessel_name,
                'location' => $order->delivery_location?->label(),
                'vlsfo_qty' => $order->vlsfo_bdn_qty ?? $order->vlsfo_final_qty,
                'mgo_qty' => $order->mgo_bdn_qty ?? $order->mgo_final_qty,
                'hsfo_qty' => $order->hsfo_bdn_qty ?? $order->hsfo_final_qty,
                'invoice_value' => $order->invoice_value,
                'invoice_date' => $order->invoice_date,
                'payment_due_date' => $order->payment_due_date,
                'amount_received' => $order->amount_received,
                'payment_receipt_date' => $order->payment_receipt_date,
                'status' => $order->status->label(),
                'paid_in_full' => $order->isPaidInFull(),
                'payments' => $order->payments
                    ->sortByDesc('date')
                    ->values()
                    ->map(fn (Payment $payment): array => [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'date' => $payment->date->toDateString(),
                        'type' => $payment->type->value,
                    ]),
            ]);

        return Inertia::render('finance/dashboard', [
            'completedOrders' => $completedOrders,
            'paymentTypeOptions' => $this->enumOptions(PaymentType::cases()),
        ]);
    }

    public function storePayment(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'type' => ['required', Rule::enum(PaymentType::class)],
        ]);

        $order->payments()->create($validated);
        $order->syncPaymentTotals();

        return $this->toast('Payment added.');
    }

    public function close(Order $order): RedirectResponse
    {
        if ($order->status !== OrderStatus::Delivered || ! $order->isPaidInFull()) {
            return $this->toast('Order cannot be closed until it is delivered and paid in full.', 'error');
        }

        $order->update(['status' => OrderStatus::Closed]);

        return $this->toast('Order closed.');
    }
}
