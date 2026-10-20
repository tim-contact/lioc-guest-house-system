<?php

namespace App\Http\Controllers;

use App\Enums\PaymentType;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Builder;
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

        $sortKey = (string) $request->input('sort', 'date');
        $direction = $request->input('dir') === 'asc' ? 'asc' : 'desc';
        if (! in_array($sortKey, self::sortableColumns(), true)) {
            $sortKey = 'date';
            $direction = 'desc';
        }

        $payments = Payment::with(['order.customer', 'order.port'])
            ->select('payments.*')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $searchPattern = "%{$search}%";

                $query
                    ->whereRaw('LOWER(payments.order_number) LIKE ?', [$searchPattern])
                    ->orWhereHas('order', fn ($order) => $order
                        ->whereRaw('LOWER(vessel_name) LIKE ?', [$searchPattern])
                        ->orWhereHas('customer', fn ($customer) => $customer->whereRaw('LOWER(name) LIKE ?', [$searchPattern])));
            }))
            ->tap(fn (Builder $query) => self::applySort($query, $sortKey, $direction))
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Payment $payment): array => [
                'id' => $payment->id,
                'order_number' => $payment->order_number,
                'customer_name' => $payment->order?->customer?->name,
                'vessel_name' => $payment->order?->vessel_name,
                'port_name' => $payment->order?->port?->name,
                'amount' => $payment->amount,
                'date' => $payment->date?->toDateString(),
                'type' => $payment->type->value,
            ]);

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'paymentTypeOptions' => $this->enumOptions(PaymentType::cases()),
            'canManagePayments' => false,
            'filters' => [
                'search' => $search,
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
            'amount',
            'date',
            'type',
        ];
    }

    /**
     * Apply a user-chosen sort. Relation columns use left joins so their names
     * can be ordered without switching to eager subqueries.
     */
    private static function applySort(Builder $query, string $sort, string $direction): void
    {
        match ($sort) {
            'vessel_name' => $query
                ->leftJoin('orders', 'orders.order_number', '=', 'payments.order_number')
                ->orderByRaw("LOWER(orders.vessel_name) {$direction} NULLS LAST"),
            'customer_name' => $query
                ->leftJoin('orders', 'orders.order_number', '=', 'payments.order_number')
                ->leftJoin('customers', 'orders.customer_id', '=', 'customers.sap_id')
                ->orderByRaw("LOWER(customers.name) {$direction} NULLS LAST"),
            'order_number', 'type' => $query->orderByRaw("LOWER(payments.{$sort}) {$direction} NULLS LAST"),
            default => $query->orderByRaw("payments.{$sort} {$direction} NULLS LAST"),
        };

        $query->orderBy('payments.id', $direction);
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
