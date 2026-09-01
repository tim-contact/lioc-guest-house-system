<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentType;
use App\Models\Order;
use App\Models\Payment;
use Carbon\CarbonInterface;
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

        $completedOrders = Order::with(['customer', 'deliveryLocation', 'payments'])
            ->whereIn('status', OrderStatus::completedStatuses())
            ->orderBy('payment_due_date')
            ->orderBy('order_number')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Order $order): array => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer?->name,
                'vessel_name' => $order->vessel_name,
                'location' => $order->deliveryLocation?->name,
                'vlsfo_qty' => $order->vlsfo_bdn_qty ?? $order->vlsfo_final_qty,
                'mgo_qty' => $order->mgo_bdn_qty ?? $order->mgo_final_qty,
                'hsfo_qty' => $order->hsfo_bdn_qty ?? $order->hsfo_final_qty,
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
            ]);

        return Inertia::render('finance/dashboard', [
            'completedOrders' => $completedOrders,
            'financeSummary' => $this->financeSummary(),
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
