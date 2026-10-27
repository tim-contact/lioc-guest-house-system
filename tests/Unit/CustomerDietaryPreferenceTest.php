<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Customer;
use App\Repository\PostalCodeDataRepository;
use App\Service\CustomerService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Covers dietary input and compatibility with older guest forms. */
final class CustomerDietaryPreferenceTest extends TestCase
{
    public function testCreatesGuestWithTrimmedDietaryDetails(): void
    {
        $service = new CustomerService($this->createStub(EntityManagerInterface::class), $this->createStub(PostalCodeDataRepository::class));
        $request = $this->form('new', ['dietary-preference-new' => '  Jain  ', 'dietary-notes-new' => '  No onions  ']);

        $customer = $service->getCustomerFromForm($request);

        self::assertSame('Jain', $customer->getDietaryPreference());
        self::assertSame('No onions', $customer->getDietaryNotes());
    }

    public function testOlderFormDoesNotEraseDietaryDetails(): void
    {
        $customer = new Customer();
        $customer->setDietaryPreference('Vegetarian');
        $customer->setDietaryNotes('No eggs');
        $repository = $this->createStub(EntityRepository::class);
        $repository->method('find')->willReturn($customer);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($repository);
        $service = new CustomerService($em, $this->createStub(PostalCodeDataRepository::class));

        $updated = $service->getCustomerFromForm($this->form('7'), '7');

        self::assertSame('Vegetarian', $updated->getDietaryPreference());
        self::assertSame('No eggs', $updated->getDietaryNotes());
    }

    public function testRejectsOverlongNotesBeforeSaving(): void
    {
        $service = new CustomerService($this->createStub(EntityManagerInterface::class), $this->createStub(PostalCodeDataRepository::class));
        $this->expectException(BadRequestHttpException::class);

        $service->getCustomerFromForm($this->form('new', ['dietary-notes-new' => str_repeat('x', 1001)]));
    }

    public function testBlankValuesClearDietaryDetails(): void
    {
        $customer = new Customer();
        $customer->setDietaryPreference('Vegetarian');
        $customer->setDietaryNotes('No eggs');
        $repository = $this->createStub(EntityRepository::class);
        $repository->method('find')->willReturn($customer);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('getRepository')->willReturn($repository);
        $service = new CustomerService($em, $this->createStub(PostalCodeDataRepository::class));

        $service->getCustomerFromForm($this->form('7', ['dietary-preference-7' => ' ', 'dietary-notes-7' => '']), '7');

        self::assertNull($customer->getDietaryPreference());
        self::assertNull($customer->getDietaryNotes());
    }

    /** @param array<string, string> $extra */
    private function form(string $id, array $extra = []): Request
    {
        return new Request([], $extra + [
            'salutation-'.$id => 'Mr',
            'firstname-'.$id => 'Guest',
            'lastname-'.$id => 'Example',
            'birthday-'.$id => '',
            'id-type-'.$id => 'customer.id.type.passport',
            'id-'.$id => '',
            'remark-'.$id => '',
        ]);
    }
}
