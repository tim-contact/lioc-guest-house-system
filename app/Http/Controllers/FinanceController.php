<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentType;
use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderService;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
        $search = self::cleanSearchText($request->input('search', ''));
        $sort = (string) $request->input('sort', 'payment_due_date');
        $direction = $request->input('dir') === 'desc' ? 'desc' : 'asc';
        $sort = in_array($sort, self::sortableColumns(), true) ? $sort : 'payment_due_date';

        $completedOrders = Order::with(['customer', 'deliveryLocation', 'payments'])
            ->select('orders.*')
            ->when($sort === 'customer_name', fn ($query) => $query->leftJoin('customers', 'orders.customer_id', '=', 'customers.sap_id'))
            ->when($sort === 'location', fn ($query) => $query->leftJoin('supply_locations', 'orders.delivery_location_id', '=', 'supply_locations.id'))
            ->whereIn('status', OrderStatus::completedStatuses())
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $searchPattern = "%{$search}%";

                $query
                    ->whereRaw('LOWER(vessel_name) LIKE ?', [$searchPattern])
                    ->orWhereHas('customer', fn ($customer) => $customer->whereRaw('LOWER(name) LIKE ?', [$searchPattern]));
            }))
            ->tap(fn (Builder $query) => self::applySort($query, $sort, $direction))
            ->orderBy('order_number')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Order $order): array => $this->financeOrderRow($order));

        return Inertia::render('finance/dashboard', [
            'completedOrders' => $completedOrders,
            'financeSummary' => $this->financeSummary(),
            'paymentTypeOptions' => $this->enumOptions(PaymentType::cases()),
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'dir' => $direction,
            ],
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_date_from' => ['nullable', 'date'],
            'order_date_to' => ['nullable', 'date', 'after_or_equal:order_date_from'],
            'eta_from' => ['nullable', 'date'],
            'eta_to' => ['nullable', 'date', 'after_or_equal:eta_from'],
        ]);

        $orders = Order::with(['customer', 'deliveryLocation', 'payments'])
            ->whereIn('status', OrderStatus::completedStatuses())
            ->when($validated['order_date_from'] ?? null, fn ($query, string $date) => $query->whereDate('order_date', '>=', $date))
            ->when($validated['order_date_to'] ?? null, fn ($query, string $date) => $query->whereDate('order_date', '<=', $date))
            ->when($validated['eta_from'] ?? null, fn ($query, string $date) => $query->whereDate('eta', '>=', $date))
            ->when($validated['eta_to'] ?? null, fn ($query, string $date) => $query->whereDate('eta', '<=', $date))
            ->orderBy('order_number')
            ->get()
            ->map(fn (Order $order): array => $this->financeOrderRow($order))
            ->values();

        return response()->json([
            'rows' => $orders,
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

    public function updateAgentFees(Request $request, Order $order): RedirectResponse
    {
        abort_unless($order->status === OrderStatus::Delivered, 403);

        $validated = $request->validate([
            'agent_fees' => ['nullable', 'numeric', 'min:0'],
        ]);

        $order->update(['agent_fees' => $validated['agent_fees'] ?? 0]);
        OrderService::reprice($order);

        return $this->toast('Agent fees updated.');
    }

    private static function cleanSearchText(mixed $value): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim((string) $value)) ?? '');
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
            'location',
            'vlsfo_qty',
            'mgo_qty',
            'hsfo_qty',
            'invoice_value',
            'barging_cost',
            'agent_fees',
            'invoice_date',
            'payment_due_date',
            'paid_in_full',
            'amount_received',
            'amount_remaining',
            'payment_receipt_date',
            'status',
        ];
    }

    private static function applySort(Builder $query, string $sort, string $direction): void
    {
        match ($sort) {
            'customer_name' => $query->orderByRaw("LOWER(customers.name) {$direction} NULLS LAST"),
            'location' => $query->orderByRaw("LOWER(supply_locations.name) {$direction} NULLS LAST"),
            'order_number', 'vessel_name', 'status' => $query->orderByRaw("LOWER(orders.{$sort}) {$direction} NULLS LAST"),
            'vlsfo_qty' => $query->orderByRaw("COALESCE(orders.vlsfo_bdn_qty, orders.vlsfo_final_qty) {$direction} NULLS LAST"),
            'mgo_qty' => $query->orderByRaw("COALESCE(orders.mgo_bdn_qty, orders.mgo_final_qty) {$direction} NULLS LAST"),
            'hsfo_qty' => $query->orderByRaw("COALESCE(orders.hsfo_bdn_qty, orders.hsfo_final_qty) {$direction} NULLS LAST"),
            'barging_cost' => $query->orderBy("orders.{$sort}", $direction),
            'agent_fees' => $query->orderBy("orders.{$sort}", $direction),
            'paid_in_full' => $query->orderByRaw('(orders.invoice_value > 0 AND COALESCE(orders.invoice_value, 0) - COALESCE(orders.amount_received, 0) <= 0) '.$direction),
            'amount_remaining' => $query->orderByRaw("(COALESCE(orders.invoice_value, 0) - COALESCE(orders.amount_received, 0)) {$direction}"),
            default => $query->orderBy("orders.{$sort}", $direction),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function financeOrderRow(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_date' => $order->order_date?->toDateString(),
            'customer_name' => $order->customer?->name,
            'vessel_name' => $order->vessel_name,
            'eta' => $order->eta?->toDateTimeString(),
            'location' => $order->deliveryLocation?->name,
            'vlsfo_qty' => $order->vlsfo_bdn_qty ?? $order->vlsfo_final_qty,
            'mgo_qty' => $order->mgo_bdn_qty ?? $order->mgo_final_qty,
            'hsfo_qty' => $order->hsfo_bdn_qty ?? $order->hsfo_final_qty,
            'barging_cost' => $order->barging_cost,
            'agent_fees' => $order->agent_fees,
            'invoice_value' => $order->invoice_value,
            'invoice_date' => $order->invoice_date,
            'payment_due_date' => $order->payment_due_date,
            'amount_received' => $order->amount_received,
            'amount_remaining' => $order->balance_amount,
            'payment_receipt_date' => $order->payment_receipt_date,
            'status' => $order->status->label(),
            'paid_in_full' => $order->isPaidInFull(),
            'can_close' => $order->canBeClosed(),
            'payments' => $order->payments
                ->sortByDesc('date')
                ->values()
                ->map(fn (Payment $payment): array => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'date' => $payment->date->toDateString(),
                    'type' => $payment->type->value,
                ]),
        ];
    }

    public function close(Order $order): RedirectResponse
    {
        if (! $order->canBeClosed()) {
            return $this->toast('Order cannot be closed until it is delivered and has no balance outstanding.', 'error');
        }

        $order->update(['status' => OrderStatus::Closed]);

        return $this->toast('Order closed.');
    }

    /**
     * @return array<int, array{label: string, count: int, amount: float}>
     */
    private function financeSummary(): array
    {
        $thisWeekStart = Carbon::now()->startOfWeek(CarbonInterface::MONDAY)->startOfDay();
        $thisWeekEnd = $thisWeekStart->copy()->endOfWeek(CarbonInterface::SUNDAY)->endOfDay();
        $nextWeekStart = $thisWeekStart->copy()->addWeek();
        $nextWeekEnd = $thisWeekEnd->copy()->addWeek();

        return [
            $this->summaryBucket('Total Invoices Pending'),
            $this->summaryBucket('Pending This Week', $thisWeekStart, $thisWeekEnd),
            $this->summaryBucket('Pending Next Week', $nextWeekStart, $nextWeekEnd),
        ];
    }

    /**
     * @return array{label: string, count: int, amount: float}
     */
    private function summaryBucket(string $label, ?Carbon $start = null, ?Carbon $end = null): array
    {
        $query = Order::query()
            ->whereIn('status', OrderStatus::completedStatuses())
            ->whereRaw('(COALESCE(invoice_value, 0) - COALESCE(amount_received, 0)) > 0')
            ->when($start && $end, fn ($query) => $query->whereBetween('payment_due_date', [
                $start->toDateString(),
                $end->toDateString(),
            ]));

        return [
            'label' => $label,
            'count' => (clone $query)->count(),
            'amount' => (float) (clone $query)->sum(DB::raw('COALESCE(invoice_value, 0) - COALESCE(amount_received, 0)')),
        ];
    }
}
