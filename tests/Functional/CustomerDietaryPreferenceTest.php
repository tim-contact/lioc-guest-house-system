<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Customer;
use App\Entity\User;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/** Exercises the existing guest form with dietary fields and CSRF protection. */
final class CustomerDietaryPreferenceTest extends WebTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        self::ensureKernelShutdown();
    }

    public function testGuestDietaryDetailsAreSavedAndDisplayed(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get(ManagerRegistry::class)->getManager();
        $admin = $em->getRepository(User::class)->findOneBy(['username' => 'test-admin']);
        self::assertInstanceOf(User::class, $admin);
        $client->loginUser($admin);
        $crawler = $client->request('GET', '/customers/new');
        self::assertResponseIsSuccessful();
        $token = $crawler->filter('input[name="_csrf_token"]')->first()->attr('value');
        self::assertNotNull($token);
        $lastname = 'Dietary'.bin2hex(random_bytes(5));

        $client->request('POST', '/customers/create', [
            '_csrf_token' => $token,
            'salutation-new' => 'Mr',
            'firstname-new' => 'Test',
            'lastname-new' => $lastname,
            'birthday-new' => '',
            'id-type-new' => 'customer.id.type.passport',
            'id-new' => '',
            'remark-new' => '',
            'dietary-preference-new' => 'Jain',
            'dietary-notes-new' => 'No onions',
        ]);
        self::assertResponseIsSuccessful();
        $customer = $em->getRepository(Customer::class)->findOneBy(['lastname' => $lastname]);
        self::assertInstanceOf(Customer::class, $customer);
        self::assertSame('Jain', $customer->getDietaryPreference());
        self::assertSame('No onions', $customer->getDietaryNotes());

        $client->request('GET', '/customers/'.$customer->getId().'/get');
        self::assertResponseIsSuccessful();
        self::assertSelectorTextContains('body', 'Jain');
        self::assertSelectorTextContains('body', 'No onions');
    }

    public function testGuestCreationWithMissingCsrfTokenDoesNotPersist(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get(ManagerRegistry::class)->getManager();
        $admin = $em->getRepository(User::class)->findOneBy(['username' => 'test-admin']);
        self::assertInstanceOf(User::class, $admin);
        $client->loginUser($admin);
        $lastname = 'NoToken'.bin2hex(random_bytes(5));

        $client->request('POST', '/customers/create', ['lastname-new' => $lastname, 'dietary-notes-new' => 'Private']);

        self::assertNull($em->getRepository(Customer::class)->findOneBy(['lastname' => $lastname]));
    }
}
