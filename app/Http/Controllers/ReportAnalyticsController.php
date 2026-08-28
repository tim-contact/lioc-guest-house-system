<?php

namespace App\Http\Controllers;

use App\Enums\DisputeStatus;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Models\Dispute;
use App\Models\Enquiry;
use App\Models\Order;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ReportAnalyticsController extends Controller
{
    public function index(): Response
    {
        $enquiries = Enquiry::with('port')->get();
        $orders = Order::with(['customer', 'port'])->get();
        $disputes = Dispute::with('order.port')->get();
        $completedStatuses = [OrderStatus::Delivered->value, OrderStatus::Closed->value];

        $totalEnquiries = $enquiries->count();
        $totalOrders = $orders->count();
        $completedOrders = $orders
            ->filter(fn (Order $order): bool => in_array($order->status->value, $completedStatuses, true))
            ->count();

        return Inertia::render('reports/analytics', [
            'summary' => [
                'enquiries' => $totalEnquiries,
                'orders' => $totalOrders,
                'completed' => $completedOrders,
                'conversionRate' => $this->rate($totalOrders, $totalEnquiries),
                'completionRate' => $this->rate($completedOrders, $totalOrders),
                'invoiceValue' => round((float) $orders->sum('invoice_value'), 2),
                'amountReceived' => round((float) $orders->sum('amount_received'), 2),
                'outstanding' => round((float) $orders->sum(fn (Order $order): float => max($order->balance_amount, 0)), 2),
            ],
            'funnel' => [
                [
                    'label' => 'Enquiries',
                    'value' => $totalEnquiries,
                    'displayValue' => number_format($totalEnquiries),
                ],
                [
                    'label' => 'Orders',
                    'value' => $totalOrders,
                    'displayValue' => number_format($totalOrders),
                ],
                [
                    'label' => 'Completed',
                    'value' => $completedOrders,
                    'displayValue' => number_format($completedOrders),
                ],
            ],
            'portStatusMetrics' => $this->portStatusMetrics($orders, $disputes, $completedStatuses),
            'monthlyTrend' => $this->monthlyTrend($enquiries, $orders, $completedStatuses),
            'topPorts' => $this->topPorts($orders),
            'topCustomers' => $this->topCustomers($orders),
            'productMix' => $this->productMix($orders),
        ]);
    }

    private function rate(int $part, int $total): float
    {
        if ($total === 0) {
            return 0;
        }

        return round(($part / $total) * 100, 1);
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  Collection<int, Dispute>  $disputes
     * @param  list<string>  $completedStatuses
     * @return list<array{portKey: string, label: string, pendingDeliveries: int, completedDeliveries: int, pendingDisputes: int, total: int}>
     */
    private function portStatusMetrics(Collection $orders, Collection $disputes, array $completedStatuses): array
    {
        $ports = collect();

        $orders->each(function (Order $order) use ($ports, $completedStatuses): void {
            $portKey = (string) ($order->port_id ?? 'unassigned');
            $port = $ports->get($portKey, [
                'portKey' => $portKey,
                'label' => $order->port?->name ?? 'Unassigned',
                'pendingDeliveries' => 0,
                'completedDeliveries' => 0,
                'pendingDisputes' => 0,
                'total' => 0,
            ]);

            if ($order->status === OrderStatus::Pending) {
                $port['pendingDeliveries']++;
            }

            if (in_array($order->status->value, $completedStatuses, true)) {
                $port['completedDeliveries']++;
            }

            $port['total'] = $port['pendingDeliveries'] + $port['completedDeliveries'] + $port['pendingDisputes'];
            $ports->put($portKey, $port);
        });

        $disputes
            ->filter(fn (Dispute $dispute): bool => $dispute->dispute_status === DisputeStatus::Open)
            ->each(function (Dispute $dispute) use ($ports): void {
                $order = $dispute->order;
                $portKey = (string) ($order?->port_id ?? 'unassigned');
                $port = $ports->get($portKey, [
                    'portKey' => $portKey,
                    'label' => $order?->port?->name ?? 'Unassigned',
                    'pendingDeliveries' => 0,
                    'completedDeliveries' => 0,
                    'pendingDisputes' => 0,
                    'total' => 0,
                ]);

                $port['pendingDisputes']++;
                $port['total'] = $port['pendingDeliveries'] + $port['completedDeliveries'] + $port['pendingDisputes'];
                $ports->put($portKey, $port);
            });

        return $ports
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Enquiry>  $enquiries
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return list<array{label: string, enquiries: int, orders: int, completed: int}>
     */
    private function monthlyTrend(Collection $enquiries, Collection $orders, array $completedStatuses): array
    {
        $start = CarbonImmutable::now()->startOfMonth()->subMonths(5);

        return collect(range(0, 5))
            ->map(function (int $offset) use ($start, $enquiries, $orders, $completedStatuses): array {
                $month = $start->addMonths($offset);
                $key = $month->format('Y-m');

                return [
                    'label' => $month->format('M'),
                    'enquiries' => $enquiries
                        ->filter(fn (Enquiry $enquiry): bool => $enquiry->created_at?->format('Y-m') === $key)
                        ->count(),
                    'orders' => $orders
                        ->filter(fn (Order $order): bool => $order->order_date?->format('Y-m') === $key)
                        ->count(),
                    'completed' => $orders
                        ->filter(fn (Order $order): bool => $order->order_date?->format('Y-m') === $key
                            && in_array($order->status->value, $completedStatuses, true))
                        ->count(),
                ];
            })
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return list<array{label: string, value: int}>
     */
    private function topPorts(Collection $orders): array
    {
        return $orders
            ->groupBy(fn (Order $order): string => $order->port?->name ?? 'Unassigned')
            ->map(fn (Collection $rows, string $name): array => [
                'label' => $name,
                'value' => $rows->count(),
            ])
            ->sortByDesc('value')
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return list<array{label: string, value: float}>
     */
    private function topCustomers(Collection $orders): array
    {
        return $orders
            ->groupBy(fn (Order $order): string => $order->customer?->name ?? 'Unassigned')
            ->map(fn (Collection $rows, string $name): array => [
                'label' => $name,
                'value' => round((float) $rows->sum('invoice_value'), 2),
            ])
            ->sortByDesc('value')
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return list<array{label: string, value: float}>
     */
    private function productMix(Collection $orders): array
    {
        return collect(FuelGrade::cases())
            ->map(function (FuelGrade $grade) use ($orders): array {
                $key = $grade->value;

                return [
                    'label' => $grade->label(),
                    'value' => round((float) $orders->sum(
                        fn (Order $order): float => (float) ($order->{"{$key}_bdn_qty"} ?? $order->{"{$key}_final_qty"} ?? 0),
                    ), 3),
                ];
            })
            ->all();
    }
}
