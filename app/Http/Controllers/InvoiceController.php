<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $invoices = Order::with('customer')
            ->whereNotNull('invoice_date')
            ->orderBy('payment_due_date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Order $order): array => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer?->name,
                'vessel_name' => $order->vessel_name,
                'invoice_value' => $order->invoice_value,
                'invoice_date' => $order->invoice_date,
                'payment_due_date' => $order->payment_due_date,
                'amount_received' => $order->amount_received,
                'balance_amount' => $order->balance_amount,
                'status' => $order->status->label(),
            ]);

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_value' => ['nullable', 'numeric', 'min:0'],
            'invoice_date' => ['nullable', 'date'],
            'payment_due_date' => ['nullable', 'date', 'after_or_equal:invoice_date'],
        ]);

        $order->update($validated);

        return $this->toast('Invoice saved.');
    }
}
