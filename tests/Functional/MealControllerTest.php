<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Appartment;
use App\Entity\Customer;
use App\Entity\Log;
use App\Entity\MealOption;
use App\Entity\MealOrder;
use App\Entity\Reservation;
use App\Entity\ReservationStatus;
use App\Entity\Subsidiary;
use App\Entity\User;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Uid\Uuid;

/** Covers access control, CSRF and persistence of a guest meal. */
final class MealControllerTest extends WebTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        self::ensureKernelShutdown();
    }

    public function testRegisterRequiresAuthentication(): void
    {
        $client = static::createClient();
        $client->request('GET', '/operations/meals');
        self::assertResponseRedirects();
    }

    public function testOrderRequiresCsrf(): void
    {
        $client = static::createClient();
        $client->loginUser($this->admin());
        $client->request('POST', '/operations/meals/orders', ['date' => '2026-11-01']);
        self::assertResponseStatusCodeSame(403);
    }

    public function testGuestMealIsRecordedAndShown(): void
    {
        $client = static::createClient();
        $client->loginUser($this->admin());
        $em = static::getContainer()->get(ManagerRegistry::class)->getManager();
        $property = new Subsidiary();
        $property->setName('Meal test guest house');
        $property->setDescription('Meal test guest house');
        $room = new Appartment();
        $room->setNumber('M'.random_int(10000, 99999));
        $room->setDescription('Test room');
        $room->setBedsMax(2);
        $room->setObject($property);
        $guest = new Customer();
        $guest->setSalutation('Mr');
        $guest->setFirstname('Meal');
        $guest->setLastname('Guest');
        $status = $em->getRepository(ReservationStatus::class)->findOneBy(['isBlocking' => true]);
        self::assertInstanceOf(ReservationStatus::class, $status);
        $today = new \DateTimeImmutable('today');
        $reservation = new Reservation();
        $reservation->setAppartment($room);
        $reservation->setStartDate(\DateTime::createFromImmutable($today));
        $reservation->setEndDate(\DateTime::createFromImmutable($today->modify('+2 days')));
        $reservation->setPersons(1);
        $reservation->setReservationStatus($status);
        $reservation->setUuid(Uuid::v4());
        $reservation->setBooker($guest);
        $reservation->addCustomer($guest);
        $option = new MealOption('Functional test lunch', 'Lunch', 150000, 'LKR', '0', true);
        foreach ([$property, $room, $guest, $reservation, $option] as $entity) {
            $em->persist($entity);
        }
        $em->flush();

        $crawler = $client->request('GET', '/operations/meals', ['date' => $today->format('Y-m-d'), 'subsidiary' => $property->getId()]);
        self::assertResponseIsSuccessful();
        $token = $crawler->filter('form[action="/operations/meals/orders"] input[name="_token"]')->attr('value');
        self::assertNotNull($token);
        $client->request('POST', '/operations/meals/orders', [
            '_token' => $token,
            'date' => $today->format('Y-m-d'),
            'subsidiary' => $property->getId(),
            'guestReservation' => $reservation->getId().':'.$guest->getId(),
            'option' => $option->getId(),
            'quantity' => 1,
        ]);
        self::assertResponseRedirects();
        $order = static::getContainer()->get(ManagerRegistry::class)->getRepository(MealOrder::class)->findOneBy(['reservation' => $reservation, 'guest' => $guest, 'option' => $option]);
        self::assertInstanceOf(MealOrder::class, $order);
        self::assertSame(150000, $order->getUnitPriceMinor());
        self::assertSame('LKR', $order->getCurrency());
        $client->request('GET', '/operations/meals', ['date' => $today->format('Y-m-d'), 'subsidiary' => $property->getId()]);
        self::assertResponseIsSuccessful();
        self::assertSelectorTextContains('body', 'Functional test lunch');
        self::assertSelectorTextContains('body', 'Meal Guest');
        $logs = static::getContainer()->get(ManagerRegistry::class)->getRepository(Log::class)->findBy(['entityClass' => MealOrder::class, 'entityId' => (string) $order->getId()]);
        self::assertNotEmpty($logs);
        foreach ($logs as $log) {
            self::assertStringNotContainsString('Functional test lunch', json_encode($log->getChanges(), JSON_THROW_ON_ERROR));
        }
    }

    private function admin(): User
    {
        $user = static::getContainer()->get(ManagerRegistry::class)->getRepository(User::class)->findOneBy(['username' => 'test-admin']);
        self::assertInstanceOf(User::class, $user);

        return $user;
    }
}
