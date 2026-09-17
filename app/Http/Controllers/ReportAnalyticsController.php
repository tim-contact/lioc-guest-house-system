<?php

namespace App\Http\Controllers;

use App\Enums\DisputeStatus;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Models\Barge;
use App\Models\Dispute;
use App\Models\Enquiry;
use App\Models\Order;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ReportAnalyticsController extends Controller
{
    public function index(): Response
    {
        $enquiries = Enquiry::with('port')->get();
        $orders = Order::with(['customer', 'port'])->get();
        $disputes = Dispute::with(['order.customer', 'order.port'])->get();
        $completedStatuses = [OrderStatus::Delivered->value, OrderStatus::Closed->value];
        $currentMonthVolumeOrders = $orders->filter(
            fn (Order $order): bool => $this->isCurrentMonthVolumeOrder($order, $completedStatuses),
        );
        $currentMonthEnquiries = $enquiries->filter(
            fn (Enquiry $enquiry): bool => $enquiry->created_at?->isCurrentMonth() === true,
        );
        $currentMonthOrders = $orders->filter(
            fn (Order $order): bool => $this->isCurrentMonthConfirmedOrder($order),
        );
        $currentMonthCompletedOrders = $orders->filter(
            fn (Order $order): bool => $this->isCurrentMonthCompletedOrder($order, $completedStatuses),
        );
        $last30DaysInvoiceOrders = $orders->filter(
            fn (Order $order): bool => $order->invoice_date?->greaterThanOrEqualTo(CarbonImmutable::now()->subDays(30)->startOfDay()) === true,
        );

        $currentMonthEnquiryCount = $currentMonthEnquiries->count();
        $currentMonthOrderCount = $currentMonthOrders->count();
        $currentMonthCompletedCount = $currentMonthCompletedOrders->count();

        return Inertia::render('reports/analytics', [
            'summary' => [
                'enquiries' => $currentMonthEnquiryCount,
                'orders' => $currentMonthOrderCount,
                'completed' => $currentMonthCompletedCount,
                'conversionRate' => $this->rate($currentMonthOrderCount, $currentMonthEnquiryCount),
                'completionRate' => $this->rate($currentMonthCompletedCount, $currentMonthOrderCount),
                'currentMonthVolume' => $this->totalProductVolume($currentMonthVolumeOrders),
                'invoiceValue' => round((float) $orders->sum('invoice_value'), 2),
                'amountReceived' => round((float) $orders->sum('amount_received'), 2),
                'outstanding' => round((float) $orders->sum(fn (Order $order): float => max($order->balance_amount, 0)), 2),
            ],
            'funnel' => [
                [
                    'label' => 'Enquiries',
                    'value' => $currentMonthEnquiryCount,
                    'displayValue' => number_format($currentMonthEnquiryCount),
                ],
                [
                    'label' => 'Orders',
                    'value' => $currentMonthOrderCount,
                    'displayValue' => number_format($currentMonthOrderCount),
                ],
                [
                    'label' => 'Completed',
                    'value' => $currentMonthCompletedCount,
                    'displayValue' => number_format($currentMonthCompletedCount),
                ],
            ],
            'portStatusMetrics' => $this->portStatusMetrics($orders, $disputes, $completedStatuses, currentMonthOnly: true),
            'monthlyProductVolumes' => $this->monthlyProductVolumes($orders, $completedStatuses),
            'topCustomers' => $this->topCustomers($last30DaysInvoiceOrders),
            'bargeUtilization' => $this->bargeUtilization($orders, $completedStatuses),
            'pendingDisputesByPort' => $this->pendingDisputesByPort($disputes),
            'productDemandComparison' => $this->productDemandComparison($orders, $completedStatuses),
            'productDemandByPort' => $this->productDemandByPort($orders, $completedStatuses),
            'cyLyProductSales' => $this->cyLyProductSales($orders, $completedStatuses),
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
     * @param  list<string>  $completedStatuses
     */
    private function isCurrentMonthVolumeOrder(Order $order, array $completedStatuses): bool
    {
        if ($order->status === OrderStatus::Pending) {
            return $order->order_date?->isCurrentMonth() === true;
        }

        return $order->invoice_date?->isCurrentMonth() === true
            && in_array($order->status->value, $completedStatuses, true);
    }

    private function isCurrentMonthConfirmedOrder(Order $order): bool
    {
        return $order->order_date?->isCurrentMonth() === true;
    }

    /**
     * @param  list<string>  $completedStatuses
     */
    private function isCurrentMonthCompletedOrder(Order $order, array $completedStatuses): bool
    {
        return $order->invoice_date?->isCurrentMonth() === true
            && in_array($order->status->value, $completedStatuses, true);
    }

    /**
     * @param  Collection<int, Order>  $orders
     */
    private function totalProductVolume(Collection $orders): float
    {
        return round((float) $orders->sum(function (Order $order): float {
            return collect(FuelGrade::keys())->sum(
                fn (string $grade): float => $this->productVolume($order, $grade),
            );
        }), 3);
    }

    private function productVolume(Order $order, string $grade): float
    {
        return (float) ($order->{"{$grade}_bdn_qty"} ?? $order->{"{$grade}_final_qty"} ?? 0);
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  Collection<int, Dispute>  $disputes
     * @param  list<string>  $completedStatuses
     * @return list<array{portKey: string, label: string, pendingDeliveries: int, completedDeliveries: int, pendingDisputes: int, total: int}>
     */
    private function portStatusMetrics(Collection $orders, Collection $disputes, array $completedStatuses, bool $currentMonthOnly = false): array
    {
        $ports = collect();

        $orders->each(function (Order $order) use ($ports, $completedStatuses, $currentMonthOnly): void {
            if ($currentMonthOnly && ! $this->isCurrentMonthPortStatusOrder($order, $completedStatuses)) {
                return;
            }

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
     * @param  list<string>  $completedStatuses
     */
    private function isCurrentMonthPortStatusOrder(Order $order, array $completedStatuses): bool
    {
        if ($order->status === OrderStatus::Pending) {
            return $order->order_date?->isCurrentMonth() === true;
        }

        return $order->invoice_date?->isCurrentMonth() === true
            && in_array($order->status->value, $completedStatuses, true);
    }

    /**
     * @param  Collection<int, Dispute>  $disputes
     * @return list<array{portKey: string, label: string, count: int, disputes: list<array{id: int, orderNumber: string|null, customerName: string, vesselName: string, disputeType: string, actionStatus: string|null, createdAt: string|null}>}>
     */
    private function pendingDisputesByPort(Collection $disputes): array
    {
        return $disputes
            ->filter(fn (Dispute $dispute): bool => $dispute->dispute_status === DisputeStatus::Open)
            ->groupBy(fn (Dispute $dispute): string => (string) ($dispute->order?->port_id ?? 'unassigned'))
            ->map(function (Collection $portDisputes, string $portKey): array {
                /** @var Dispute|null $firstDispute */
                $firstDispute = $portDisputes->first();

                /** @var list<array{id: int, orderNumber: string|null, customerName: string, vesselName: string, disputeType: string, actionStatus: string|null, createdAt: string|null}> $rows */
                $rows = $portDisputes
                    ->sortByDesc('created_at')
                    ->map(function (Dispute $dispute): array {
                        $order = $dispute->order;

                        return [
                            'id' => $dispute->id,
                            'orderNumber' => $order?->order_number,
                            'customerName' => $order?->customer?->name ?? 'Unassigned customer',
                            'vesselName' => $order?->vessel_name ?? 'Unassigned vessel',
                            'disputeType' => $dispute->type_of_dispute?->label() ?? 'General dispute',
                            'actionStatus' => $dispute->action_status?->value,
                            'createdAt' => $dispute->created_at?->format('d M Y'),
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'portKey' => $portKey,
                    'label' => $firstDispute?->order?->port?->name ?? 'Unassigned',
                    'count' => count($rows),
                    'disputes' => $rows,
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return list<array{label: string, vlsfo: float, hsfo: float, mgo: float, total: float}>
     */
    private function monthlyProductVolumes(Collection $orders, array $completedStatuses): array
    {
        $start = CarbonImmutable::now()->startOfMonth()->subMonths(5);

        return collect(range(0, 5))
            ->map(function (int $offset) use ($start, $orders, $completedStatuses): array {
                $month = $start->addMonths($offset);
                $monthOrders = $orders->filter(
                    fn (Order $order): bool => $this->isVolumeOrderForMonth($order, $completedStatuses, $month),
                );
                $volumes = collect(FuelGrade::keys())
                    ->mapWithKeys(fn (string $grade): array => [
                        $grade => round((float) $monthOrders->sum(
                            fn (Order $order): float => $this->productVolume($order, $grade),
                        ), 3),
                    ])
                    ->all();

                return [
                    'label' => $month->format('M'),
                    'vlsfo' => $volumes['vlsfo'],
                    'hsfo' => $volumes['hsfo'],
                    'mgo' => $volumes['mgo'],
                    'total' => round(array_sum($volumes), 3),
                ];
            })
            ->all();
    }

    /**
     * @param  list<string>  $completedStatuses
     */
    private function isVolumeOrderForMonth(Order $order, array $completedStatuses, CarbonImmutable $month): bool
    {
        $key = $month->format('Y-m');

        if ($order->status === OrderStatus::Pending) {
            return $order->order_date?->format('Y-m') === $key;
        }

        return $order->invoice_date?->format('Y-m') === $key
            && in_array($order->status->value, $completedStatuses, true);
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return list<array{key: string, label: string, months: list<array{label: string, currentYear: float, lastYear: float}>}>
     */
    private function cyLyProductSales(Collection $orders, array $completedStatuses): array
    {
        $currentYear = CarbonImmutable::now()->year;
        $lastYear = $currentYear - 1;

        return collect(FuelGrade::cases())
            ->map(fn (FuelGrade $grade): array => [
                'key' => $grade->value,
                'label' => $grade->label(),
                'months' => collect(range(1, 12))
                    ->map(fn (int $month): array => [
                        'label' => CarbonImmutable::create($currentYear, $month, 1)->format('M'),
                        'currentYear' => $this->productSalesQuantityForMonth($orders, $completedStatuses, $grade, $currentYear, $month),
                        'lastYear' => $this->productSalesQuantityForMonth($orders, $completedStatuses, $grade, $lastYear, $month),
                    ])
                    ->all(),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     */
    private function productSalesQuantityForMonth(Collection $orders, array $completedStatuses, FuelGrade $grade, int $year, int $month): float
    {
        $key = $grade->value;

        return round((float) $orders
            ->filter(fn (Order $order): bool => $order->invoice_date?->year === $year
                && $order->invoice_date?->month === $month
                && in_array($order->status->value, $completedStatuses, true))
            ->sum(fn (Order $order): float => $this->productVolume($order, $key)), 3);
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return list<array{key: string, label: string, current: array{total: float, rebond: float}, lastYear: array{total: float, rebond: float}}>
     */
    private function productDemandComparison(Collection $orders, array $completedStatuses): array
    {
        $now = CarbonImmutable::now();

        return collect([
            FuelGrade::Vlsfo,
            FuelGrade::Mgo,
            FuelGrade::Hsfo,
        ])
            ->map(fn (FuelGrade $grade): array => [
                'key' => $grade->value,
                'label' => $grade->label(),
                'current' => $this->productDemandForPeriod(
                    $orders,
                    $completedStatuses,
                    $grade,
                    $now->year,
                    $now->month,
                ),
                'lastYear' => $this->productDemandForPeriod(
                    $orders,
                    $completedStatuses,
                    $grade,
                    $now->year - 1,
                    $now->month,
                ),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return list<array{portKey: string, label: string, data: list<array{key: string, label: string, current: array{total: float, rebond: float}, lastYear: array{total: float, rebond: float}}>}>
     */
    private function productDemandByPort(Collection $orders, array $completedStatuses): array
    {
        return $orders
            ->groupBy(fn (Order $order): string => (string) ($order->port_id ?? 'unassigned'))
            ->map(function (Collection $portOrders, string $portKey) use ($completedStatuses): array {
                /** @var Order|null $firstOrder */
                $firstOrder = $portOrders->first();

                return [
                    'portKey' => $portKey,
                    'label' => $firstOrder?->port?->name ?? 'Unassigned',
                    'data' => $this->productDemandComparison($portOrders, $completedStatuses),
                ];
            })
            ->sortBy('label')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return list<array{imo: string, label: string, periods: array{currentMonth: array{pending: int, completed: int, total: int}, last30Days: array{pending: int, completed: int, total: int}}}>
     */
    private function bargeUtilization(Collection $orders, array $completedStatuses): array
    {
        $bargeImos = ['8923844', '9021291', '8530570'];
        $bargeNames = Barge::whereIn('imo', $bargeImos)
            ->pluck('name', 'imo');

        return collect($bargeImos)
            ->map(fn (string $imo): array => [
                'imo' => $imo,
                'label' => $bargeNames->get($imo, $imo),
                'periods' => [
                    'currentMonth' => $this->bargeUtilizationForPeriod(
                        $orders,
                        $completedStatuses,
                        $imo,
                        'currentMonth',
                    ),
                    'last30Days' => $this->bargeUtilizationForPeriod(
                        $orders,
                        $completedStatuses,
                        $imo,
                        'last30Days',
                    ),
                ],
            ])
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return array{pending: int, completed: int, total: int}
     */
    private function bargeUtilizationForPeriod(Collection $orders, array $completedStatuses, string $imo, string $period): array
    {
        $periodOrders = $orders->where('barge_id', $imo);
        $pending = $periodOrders
            ->filter(fn (Order $order): bool => $order->status === OrderStatus::Pending
                && $this->isOrderInUtilizationPeriod($order->order_date, $period))
            ->count();
        $completed = $periodOrders
            ->filter(fn (Order $order): bool => in_array($order->status->value, $completedStatuses, true)
                && $this->isOrderInUtilizationPeriod($order->invoice_date, $period))
            ->count();

        return [
            'pending' => $pending,
            'completed' => $completed,
            'total' => $pending + $completed,
        ];
    }

    private function isOrderInUtilizationPeriod(?CarbonInterface $date, string $period): bool
    {
        if ($date === null) {
            return false;
        }

        if ($period === 'last30Days') {
            return $date->greaterThanOrEqualTo(CarbonImmutable::now()->subDays(30)->startOfDay());
        }

        return $date->isCurrentMonth();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $completedStatuses
     * @return array{total: float, rebond: float}
     */
    private function productDemandForPeriod(Collection $orders, array $completedStatuses, FuelGrade $grade, int $year, int $month): array
    {
        $key = $grade->value;
        $periodOrders = $orders->filter(fn (Order $order): bool => $order->invoice_date?->year === $year
            && $order->invoice_date?->month === $month
            && in_array($order->status->value, $completedStatuses, true));
        $rebondOrders = $periodOrders->filter(
            fn (Order $order): bool => $order->product_type === ProductType::Bonded,
        );

        return [
            'total' => round((float) $periodOrders->sum(
                fn (Order $order): float => $this->productVolume($order, $key),
            ), 3),
            'rebond' => round((float) $rebondOrders->sum(
                fn (Order $order): float => $this->productVolume($order, $key),
            ), 3),
        ];
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
}
