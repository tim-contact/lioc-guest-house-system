<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\InventoryItem;
use App\Entity\InventoryIssue;
use App\Entity\InventoryLot;
use App\Entity\Role;
use App\Entity\Subsidiary;
use App\Entity\User;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/** Covers inventory access control, CSRF protection and item persistence. */
final class InventoryControllerTest extends WebTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        self::ensureKernelShutdown();
    }

    public function testOverviewRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request('GET', '/operations/inventory');

        self::assertResponseRedirects();
    }

    public function testOperationsRoleCannotAccessInventoryCosts(): void
    {
        $client = static::createClient();
        $client->loginUser($this->createUserWithRole('ROLE_OPERATIONS'));

        $client->request('GET', '/operations/inventory');

        self::assertResponseStatusCodeSame(403);
    }

    public function testCreatingItemRequiresCsrfToken(): void
    {
        $client = static::createClient();
        $client->loginUser($this->createUserWithRole('ROLE_ADMIN'));
        $sku = 'TEST'.strtoupper(bin2hex(random_bytes(4)));

        $client->request('POST', '/operations/inventory/items', [
            'sku' => $sku,
            'name' => 'Test item',
            'unit' => 'piece',
            'reorderLevel' => 2,
        ]);

        self::assertResponseStatusCodeSame(403);
        self::assertNull(static::getContainer()->get(ManagerRegistry::class)->getRepository(InventoryItem::class)->findOneBy(['sku' => $sku]));
    }

    public function testAdminCanCreateInventoryItem(): void
    {
        $client = static::createClient();
        $client->loginUser($this->createUserWithRole('ROLE_ADMIN'));
        $crawler = $client->request('GET', '/operations/inventory');
        self::assertResponseIsSuccessful();
        $token = $crawler->filter('form[action="/operations/inventory/items"] input[name="_token"]')->attr('value');
        self::assertNotNull($token);
        $sku = 'TEST'.strtoupper(bin2hex(random_bytes(4)));

        $client->request('POST', '/operations/inventory/items', [
            '_token' => $token,
            'sku' => $sku,
            'name' => 'Test item',
            'unit' => 'piece',
            'reorderLevel' => 2,
        ]);

        self::assertResponseRedirects('/operations/inventory');
        $item = static::getContainer()->get(ManagerRegistry::class)->getRepository(InventoryItem::class)->findOneBy(['sku' => $sku]);
        self::assertInstanceOf(InventoryItem::class, $item);
        self::assertSame(2, $item->getReorderLevel());
    }

    public function testAdminCanRecordPurchaseAndUsageForOneProperty(): void
    {
        $client = static::createClient();
        $client->loginUser($this->createUserWithRole('ROLE_ADMIN'));
        $em = static::getContainer()->get(ManagerRegistry::class)->getManager();
        $item = new InventoryItem('SOAP'.strtoupper(bin2hex(random_bytes(4))), 'Soap', 'bar', 2);
        $property = new Subsidiary();
        $property->setName('Inventory test property');
        $property->setDescription('Inventory test property');
        $em->persist($item);
        $em->persist($property);
        $em->flush();

        $crawler = $client->request('GET', '/operations/inventory');
        self::assertResponseIsSuccessful();
        $purchaseToken = $crawler->filter('form[action="/operations/inventory/purchases"] input[name="_token"]')->attr('value');
        $issueToken = $crawler->filter('form[action="/operations/inventory/issues"] input[name="_token"]')->attr('value');
        self::assertNotNull($purchaseToken);
        self::assertNotNull($issueToken);
        $today = (new \DateTimeImmutable('today'))->format('Y-m-d');

        $client->request('POST', '/operations/inventory/purchases', [
            '_token' => $purchaseToken,
            'item' => $item->getId(),
            'subsidiary' => $property->getId(),
            'quantity' => 10,
            'unitCost' => '25.50',
            'currency' => 'LKR',
            'purchasedAt' => $today,
            'expiresAt' => (new \DateTimeImmutable('today'))->modify('+20 days')->format('Y-m-d'),
        ]);
        self::assertResponseRedirects();
        $lot = $em->getRepository(InventoryLot::class)->findOneBy(['item' => $item, 'subsidiary' => $property]);
        self::assertInstanceOf(InventoryLot::class, $lot);
        self::assertSame(2550, $lot->getUnitCostMinor());

        $client->request('POST', '/operations/inventory/issues', [
            '_token' => $issueToken,
            'item' => $item->getId(),
            'subsidiary' => $property->getId(),
            'quantity' => 3,
            'issuedAt' => $today,
            'reason' => 'Guest rooms',
        ]);
        self::assertResponseRedirects();
        $issues = $em->getRepository(InventoryIssue::class)->findBy(['lot' => $lot]);
        self::assertCount(1, $issues);
        self::assertSame(3, $issues[0]->getQuantity());
    }

    private function createUserWithRole(string $roleCode): User
    {
        $container = static::getContainer();
        $em = $container->get(ManagerRegistry::class)->getManager();
        $role = $em->getRepository(Role::class)->findOneBy(['role' => $roleCode]);
        self::assertInstanceOf(Role::class, $role);

        $user = new User();
        $user->setUsername('inventory_test_'.bin2hex(random_bytes(6)));
        $user->setFirstname('Inventory');
        $user->setLastname('Tester');
        $user->setEmail(sprintf('inventory+%s@example.com', bin2hex(random_bytes(6))));
        $user->setActive(true);
        $user->setPassword($container->get(UserPasswordHasherInterface::class)->hashPassword($user, 'ChangeMe123!'));
        $user->setRoleEntities([$role]);
        $em->persist($user);
        $em->flush();

        return $user;
    }
}
