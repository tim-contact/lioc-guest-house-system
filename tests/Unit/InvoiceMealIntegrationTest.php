<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Appartment;
use App\Entity\AppSettings;
use App\Entity\Customer;
use App\Entity\MealOption;
use App\Entity\MealOrder;
use App\Entity\Reservation;
use App\Entity\ReservationStatus;
use App\Entity\Subsidiary;
use App\Repository\MealOrderRepository;
use App\Service\AppSettingsService;
use App\Service\InvoiceService;
use App\Service\MealBillingService;
use App\Service\PriceService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Contracts\Translation\TranslatorInterface;

/** Ensures meals are added to invoice drafts without changing reservation price previews. */
final class InvoiceMealIntegrationTest extends TestCase
{
    public function testInvoicePrefillIncludesMealsButReservationPreviewDoesNot(): void
    {
        $property = new Subsidiary();
        $property->setId(1);
        $room = new Appartment();
        $room->setObject($property);
        $guest = new Customer();
        $reservation = new Reservation();
        $reservation->setId(42);
        $reservation->setAppartment($room);
        $reservation->setStartDate(new \DateTime('2026-11-01'));
        $reservation->setEndDate(new \DateTime('2026-11-02'));
        $reservation->setPersons(1);
        $reservation->setReservationStatus(new ReservationStatus());
        $reservation->addCustomer($guest);
        $order = new MealOrder($reservation, $guest, new MealOption('Breakfast', 'Breakfast', 80000, 'LKR', '0', true), new \DateTimeImmutable('2026-11-01'), 1);
        $order->setId(7);

        $reservationRepo = $this->createStub(EntityRepository::class);
        $reservationRepo->method('find')->willReturn($reservation);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($reservationRepo);
        $orders = $this->createStub(MealOrderRepository::class);
        $orders->method('findUnbilledForReservations')->willReturn([$order]);
        $settings = $this->createStub(AppSettingsService::class);
        $settings->method('getSettings')->willReturn((new AppSettings())->setCurrency('LKR'));
        $billing = new MealBillingService($em, $orders, $settings);
        $prices = $this->createStub(PriceService::class);
        $prices->method('getPricesForReservationDays')->willReturn([1 => []]);
        $invoices = new InvoiceService($em, $prices, $this->createStub(TranslatorInterface::class), $settings, null, null, null, $billing);

        $invoiceStack = $this->requestStack();
        $invoices->prefillMiscPositionsWithReservationIds([42], $invoiceStack, true);
        $invoiceLines = $invoiceStack->getSession()->get('invoicePositionsMiscellaneous');
        self::assertCount(1, $invoiceLines);
        self::assertSame(7, $invoiceLines[0]->getSourceMealOrderId());

        $previewStack = $this->requestStack();
        $invoices->prefillMiscPositionsWithReservations([$reservation], $previewStack, true);
        self::assertCount(0, $previewStack->getSession()->get('invoicePositionsMiscellaneous', []));
    }

    private function requestStack(): RequestStack
    {
        $request = new Request();
        $request->setSession(new Session(new MockArraySessionStorage()));
        $stack = new RequestStack();
        $stack->push($request);

        return $stack;
    }
}
