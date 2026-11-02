<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Customer;
use App\Entity\MealOption;
use App\Entity\MealOrder;
use App\Entity\Reservation;
use App\Entity\Subsidiary;
use App\Repository\MealOptionRepository;
use App\Repository\MealOrderRepository;
use App\Repository\ReservationRepository;
use App\Repository\SubsidiaryRepository;
use App\Service\MealService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Contracts\Translation\TranslatorInterface;

/** Handles the operations meal register and administrator menu settings. */
#[Route('/operations/meals')]
#[IsGranted('ROLE_OPERATIONS')]
final class MealController extends AbstractController
{
    #[Route('', name: 'operations.meals', methods: ['GET'])]
    public function index(Request $request, SubsidiaryRepository $properties, ReservationRepository $reservations, MealOptionRepository $options, MealOrderRepository $orders, MealService $service): Response
    {
        try {
            $date = $this->parseDate($request->query->getString('date', (new \DateTimeImmutable('today'))->format('Y-m-d')));
        } catch (\InvalidArgumentException $exception) {
            throw new BadRequestHttpException('Invalid date.', $exception);
        }
        $propertyId = $request->query->getString('subsidiary', 'all');
        $property = 'all' === $propertyId ? null : $properties->find(ctype_digit($propertyId) ? (int) $propertyId : 0);
        if ('all' !== $propertyId && !$property instanceof Subsidiary) {
            throw $this->createNotFoundException();
        }

        $dayOrders = $orders->findForDay($date, $property);

        return $this->render('Meals/index.html.twig', [
            'date' => $date,
            'property' => $property,
            'properties' => $properties->findAll(),
            'reservations' => $service->eligibleReservations($reservations->findForHousekeepingRange($date, $date->modify('+1 day'), $property, 'all')),
            'options' => $options->findActive(),
            'allOptions' => $this->isGranted('ROLE_ADMIN') ? $options->findBy([], ['service' => 'ASC', 'name' => 'ASC']) : [],
            'orders' => $dayOrders,
            'summary' => $service->summarize($dayOrders),
        ]);
    }

    #[Route('/orders', name: 'operations.meals.order.create', methods: ['POST'])]
    public function createOrder(Request $request, EntityManagerInterface $em, MealService $service, TranslatorInterface $translator): Response
    {
        $this->assertCsrf($request, 'meal_order');
        try {
            $parts = explode(':', $request->request->getString('guestReservation'));
            if (2 !== count($parts) || !ctype_digit($parts[0]) || !ctype_digit($parts[1])) {
                throw new \InvalidArgumentException('meals.error.guest_invalid');
            }
            $reservation = $em->getRepository(Reservation::class)->find((int) $parts[0]);
            $guest = $em->getRepository(Customer::class)->find((int) $parts[1]);
            $option = $em->getRepository(MealOption::class)->find($request->request->getInt('option'));
            if (!$reservation instanceof Reservation || !$guest instanceof Customer || !$option instanceof MealOption) {
                throw new \InvalidArgumentException('meals.error.selection_invalid');
            }
            $service->record($reservation, $guest, $option, $this->parseDate($request->request->getString('date')), $request->request->getInt('quantity'));
            $this->addFlash('success', $translator->trans('meals.flash.recorded', [], 'Meals'));
        } catch (\InvalidArgumentException|\DomainException $exception) {
            $this->addFlash('danger', $translator->trans($exception->getMessage(), [], 'Meals'));
        }

        try {
            $redirectDate = $this->parseDate($request->request->getString('date'))->format('Y-m-d');
        } catch (\InvalidArgumentException) {
            $redirectDate = (new \DateTimeImmutable('today'))->format('Y-m-d');
        }

        $propertyId = $request->request->getString('subsidiary', 'all');
        return $this->redirectToRoute('operations.meals', ['date' => $redirectDate, 'subsidiary' => ctype_digit($propertyId) ? $propertyId : 'all']);
    }

    #[Route('/orders/{id}/cancel', name: 'operations.meals.order.cancel', methods: ['POST'])]
    public function cancelOrder(MealOrder $order, Request $request, MealService $service, TranslatorInterface $translator): Response
    {
        $this->assertCsrf($request, 'meal_cancel_'.$order->getId());
        try {
            $service->cancel($order);
            $this->addFlash('success', $translator->trans('meals.flash.cancelled', [], 'Meals'));
        } catch (\DomainException $exception) {
            $this->addFlash('danger', $translator->trans($exception->getMessage(), [], 'Meals'));
        }

        $propertyId = $request->request->getString('subsidiary', 'all');
        return $this->redirectToRoute('operations.meals', ['date' => $order->getMealDate()->format('Y-m-d'), 'subsidiary' => ctype_digit($propertyId) ? $propertyId : 'all']);
    }

    #[Route('/options', name: 'operations.meals.option.create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function createOption(Request $request, MealService $service, TranslatorInterface $translator): Response
    {
        $this->assertCsrf($request, 'meal_option');
        try {
            [$name, $period, $minor, $currency, $tax, $included] = $this->readOption($request);
            $service->saveOption(new MealOption($name, $period, $minor, $currency, $tax, $included));
            $this->addFlash('success', $translator->trans('meals.flash.option_saved', [], 'Meals'));
        } catch (\InvalidArgumentException $exception) {
            $this->addFlash('danger', $translator->trans($exception->getMessage(), [], 'Meals'));
        }

        return $this->redirectToRoute('operations.meals');
    }

    #[Route('/options/{id}', name: 'operations.meals.option.update', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateOption(MealOption $option, Request $request, MealService $service, TranslatorInterface $translator): Response
    {
        $this->assertCsrf($request, 'meal_option_'.$option->getId());
        try {
            [$name, $period, $minor, $currency, $tax, $included] = $this->readOption($request);
            $option->update($name, $period, $minor, $currency, $tax, $included);
            $option->setActive($request->request->getBoolean('active'));
            $service->saveOption($option);
            $this->addFlash('success', $translator->trans('meals.flash.option_saved', [], 'Meals'));
        } catch (\InvalidArgumentException $exception) {
            $this->addFlash('danger', $translator->trans($exception->getMessage(), [], 'Meals'));
        }

        return $this->redirectToRoute('operations.meals');
    }

    private function assertCsrf(Request $request, string $id): void
    {
        if (!$this->isCsrfTokenValid($id, $request->request->getString('_token'))) {
            throw $this->createAccessDeniedException();
        }
    }

    /** @return array{string, string, int, string, ?string, ?bool} */
    private function readOption(Request $request): array
    {
        $value = trim($request->request->getString('price'));
        if (!preg_match('/^(\d{1,8})(?:\.(\d{1,2}))?$/', $value, $parts)) {
            throw new \InvalidArgumentException('meals.error.option_invalid');
        }
        $minor = (int) $parts[1] * 100 + (int) str_pad($parts[2] ?? '0', 2, '0');
        $tax = trim($request->request->getString('taxRate'));
        $mode = $request->request->getString('taxMode');
        if ('' !== $tax && !in_array($mode, ['included', 'added'], true)) {
            throw new \InvalidArgumentException('meals.error.tax_invalid');
        }

        return [$request->request->getString('name'), $request->request->getString('service'), $minor, $request->request->getString('currency'), '' === $tax ? null : $tax, '' === $tax ? null : 'included' === $mode];
    }

    private function parseDate(string $value): \DateTimeImmutable
    {
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (!$date || $date->format('Y-m-d') !== $value) {
            throw new \InvalidArgumentException('meals.error.date_invalid');
        }

        return $date;
    }
}
