<?php

namespace App\Http\Controllers;

use App\Enums\PaymentType;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
        $search = self::cleanSearchText($request->input('search', ''));

        $payments = Payment::with('order.customer')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $searchPattern = "%{$search}%";

                $query
                    ->whereRaw('LOWER(order_number) LIKE ?', [$searchPattern])
                    ->orWhereHas('order', fn ($order) => $order
                        ->whereRaw('LOWER(vessel_name) LIKE ?', [$searchPattern])
                        ->orWhereHas('customer', fn ($customer) => $customer->whereRaw('LOWER(name) LIKE ?', [$searchPattern])));
            }))
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
            'canManagePayments' => false,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    private static function cleanSearchText(mixed $value): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim((string) $value)) ?? '');
    }

    public function update(): RedirectResponse
    {
        abort(403);
    }

    public function destroy(): RedirectResponse
    {
        abort(403);
    }
}
