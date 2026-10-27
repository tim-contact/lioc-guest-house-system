<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Service\CSRFProtectionService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;

/** Checks the legacy token service rejects missing and incorrect tokens. */
final class CSRFProtectionServiceTest extends TestCase
{
    public function testMissingTokensAreRejectedAndMatchingTokenAccepted(): void
    {
        $request = new Request();
        $request->setSession(new Session(new MockArraySessionStorage()));
        $stack = new RequestStack();
        $stack->push($request);
        $service = new CSRFProtectionService($stack);

        self::assertFalse($service->validateCSRFToken($request));
        $token = $service->getCSRFTokenForForm();
        $request->request->set('_csrf_token', 'incorrect');
        self::assertFalse($service->validateCSRFToken($request));
        $request->request->set('_csrf_token', $token);
        self::assertTrue($service->validateCSRFToken($request));
    }
}
