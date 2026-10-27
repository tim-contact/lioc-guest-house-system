<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\InventoryItem;
use App\Entity\Subsidiary;
use App\Entity\User;
use App\Repository\InventoryItemRepository;
use App\Repository\SubsidiaryRepository;
use App\Service\InventoryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Contracts\Translation\TranslatorInterface;

/** Admin-only inventory entry points; input is validated before domain writes. */
#[Route('/operations/inventory')]
#[IsGranted('ROLE_ADMIN')]
final class InventoryController extends AbstractController
{
    #[Route('', name: 'operations.inventory', methods: ['GET'])]
    public function index(
        Request $request,
        SubsidiaryRepository $subsidiaryRepository,
        InventoryItemRepository $itemRepository,
        InventoryService $inventoryService,
    ): Response {
        $subsidiaries = $subsidiaryRepository->findAll();
        $subsidiaryId = $request->query->getString('subsidiary', 'all');
        $subsidiary = 'all' === $subsidiaryId ? null : $subsidiaryRepository->find(ctype_digit($subsidiaryId) ? (int) $subsidiaryId : 0);
        if ('all' !== $subsidiaryId && !$subsidiary instanceof Subsidiary) {
            throw $this->createNotFoundException();
        }
        $today = new \DateTimeImmutable('today');

        return $this->render('Inventory/index.html.twig', [
            'subsidiaries' => $subsidiaries,
            'selectedSubsidiary' => $subsidiary,
            'items' => $itemRepository->findActive(),
            'overview' => $inventoryService->overview($subsidiary, $today),
            'today' => $today,
        ]);
    }

    #[Route('/items', name: 'operations.inventory.item.create', methods: ['POST'])]
    public function createItem(Request $request, InventoryService $inventoryService, TranslatorInterface $translator): Response
    {
        $this->assertCsrf($request, 'inventory_item');
        try {
            $inventoryService->createItem(
                $request->request->getString('sku'),
                $request->request->getString('name'),
                $request->request->getString('unit'),
                $request->request->getInt('reorderLevel'),
            );
            $this->addFlash('success', $translator->trans('inventory.flash.item_created', [], 'Inventory'));
        } catch (\InvalidArgumentException $exception) {
            $this->addFlash('danger', $translator->trans($exception->getMessage(), [], 'Inventory'));
        }

        return $this->redirectToRoute('operations.inventory');
    }

    #[Route('/purchases', name: 'operations.inventory.purchase.create', methods: ['POST'])]
    public function recordPurchase(
        Request $request,
        InventoryItemRepository $itemRepository,
        SubsidiaryRepository $subsidiaryRepository,
        InventoryService $inventoryService,
        TranslatorInterface $translator,
    ): Response {
        $this->assertCsrf($request, 'inventory_purchase');
        try {
            $inventoryService->recordPurchase(
                $this->findItem($request, $itemRepository),
                $this->findSubsidiary($request, $subsidiaryRepository),
                $request->request->getInt('quantity'),
                $this->parseMinorAmount($request->request->getString('unitCost')),
                $request->request->getString('currency'),
                $this->parseDate($request->request->getString('purchasedAt')),
                $this->parseOptionalDate($request->request->getString('expiresAt')),
                $request->request->getString('supplier'),
                $request->request->getString('reference'),
                $this->currentUser(),
            );
            $this->addFlash('success', $translator->trans('inventory.flash.purchase_recorded', [], 'Inventory'));
        } catch (\InvalidArgumentException $exception) {
            $this->addFlash('danger', $translator->trans($exception->getMessage(), [], 'Inventory'));
        }

        return $this->redirectToRoute('operations.inventory', ['subsidiary' => $request->request->getString('subsidiary', 'all')]);
    }

    #[Route('/issues', name: 'operations.inventory.issue.create', methods: ['POST'])]
    public function issueStock(
        Request $request,
        InventoryItemRepository $itemRepository,
        SubsidiaryRepository $subsidiaryRepository,
        InventoryService $inventoryService,
        TranslatorInterface $translator,
    ): Response {
        $this->assertCsrf($request, 'inventory_issue');
        try {
            $inventoryService->issueStock(
                $this->findItem($request, $itemRepository),
                $this->findSubsidiary($request, $subsidiaryRepository),
                $request->request->getInt('quantity'),
                $this->parseDate($request->request->getString('issuedAt')),
                $request->request->getString('reason'),
                $this->currentUser(),
            );
            $this->addFlash('success', $translator->trans('inventory.flash.issue_recorded', [], 'Inventory'));
        } catch (\InvalidArgumentException $exception) {
            $this->addFlash('danger', $translator->trans($exception->getMessage(), [], 'Inventory'));
        }

        return $this->redirectToRoute('operations.inventory', ['subsidiary' => $request->request->getString('subsidiary', 'all')]);
    }

    private function assertCsrf(Request $request, string $key): void
    {
        if (!$this->isCsrfTokenValid($key, $request->request->getString('_token'))) {
            throw $this->createAccessDeniedException();
        }
    }

    private function currentUser(): ?User
    {
        $user = $this->getUser();

        return $user instanceof User ? $user : null;
    }

    private function findItem(Request $request, InventoryItemRepository $repository): InventoryItem
    {
        $item = $repository->find($request->request->getInt('item'));
        if (!$item instanceof InventoryItem) {
            throw new \InvalidArgumentException('inventory.error.item_required');
        }

        return $item;
    }

    private function findSubsidiary(Request $request, SubsidiaryRepository $repository): Subsidiary
    {
        $subsidiary = $repository->find($request->request->getInt('subsidiary'));
        if (!$subsidiary instanceof Subsidiary) {
            throw new \InvalidArgumentException('inventory.error.subsidiary_required');
        }

        return $subsidiary;
    }

    /** Accept at most two decimal places and avoid floating-point money arithmetic. */
    private function parseMinorAmount(string $value): int
    {
        if (!preg_match('/^(\d{1,10})(?:\.(\d{1,2}))?$/', trim($value), $parts)) {
            throw new \InvalidArgumentException('inventory.error.cost_invalid');
        }

        return ((int) $parts[1]) * 100 + (int) str_pad($parts[2] ?? '0', 2, '0');
    }

    private function parseDate(string $value): \DateTimeImmutable
    {
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (!$date || $date->format('Y-m-d') !== $value) {
            throw new \InvalidArgumentException('inventory.error.date_invalid');
        }

        return $date;
    }

    private function parseOptionalDate(string $value): ?\DateTimeImmutable
    {
        return '' === $value ? null : $this->parseDate($value);
    }
}
