<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
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

        $sortKey = (string) $request->input('sort', 'payment_due_date');
        $direction = $request->input('dir') === 'desc' ? 'desc' : 'asc';
        if (! in_array($sortKey, self::sortableColumns(), true)) {
            $sortKey = 'payment_due_date';
            $direction = 'asc';
        }

        $invoices = Order::with('customer')
            ->select('orders.*')
            ->whereNotNull('invoice_date')
            ->tap(fn (Builder $query) => self::applySort($query, $sortKey, $direction))
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
            'filters' => [
                'sort' => $sortKey,
                'dir' => $direction,
            ],
        ]);
    }

    /**
     * @return list<string>
     */
    private static function sortableColumns(): array
    {
        return [
            'order_number',
            'customer_name',
            'vessel_name',
            'invoice_value',
            'invoice_date',
            'payment_due_date',
            'amount_received',
            'balance_amount',
            'status',
        ];
    }

    /**
     * Apply a user-chosen sort. The customer name uses a left join; the
     * balance is computed from the invoice value and amount received.
     */
    private static function applySort(Builder $query, string $sort, string $direction): void
    {
        match ($sort) {
            'customer_name' => $query
                ->leftJoin('customers', 'orders.customer_id', '=', 'customers.sap_id')
                ->orderByRaw("LOWER(customers.name) {$direction} NULLS LAST"),
            'balance_amount' => $query->orderByRaw("(COALESCE(orders.invoice_value, 0) - COALESCE(orders.amount_received, 0)) {$direction} NULLS LAST"),
            'order_number', 'vessel_name', 'status' => $query->orderByRaw("LOWER(orders.{$sort}) {$direction} NULLS LAST"),
            default => $query->orderByRaw("orders.{$sort} {$direction} NULLS LAST"),
        };

        $query->orderBy('orders.id', $direction);
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
