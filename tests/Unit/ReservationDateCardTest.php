<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\TwigFunction;

/** Verifies the reservation date card's Sunday-first month layout. */
final class ReservationDateCardTest extends TestCase
{
    /** @return iterable<string, array{string, int, int}> */
    public static function dates(): iterable
    {
        yield 'November reference' => ['2026-11-02', 0, 30];
        yield 'six-week month' => ['2026-08-31', 6, 31];
        yield 'leap year' => ['2028-02-29', 2, 29];
        yield 'four-week February' => ['2026-02-01', 0, 28];
        yield 'end of year' => ['2026-12-31', 2, 31];
        yield 'new year' => ['2027-01-01', 5, 31];
    }

    #[DataProvider('dates')]
    public function testCalendarCellsMatchSelectedDate(string $date, int $offset, int $days): void
    {
        $source = file_get_contents(__DIR__.'/../../templates/Reservations/_daily_briefing.html.twig');
        self::assertNotFalse($source);
        $start = strpos($source, '    {% set cardDate');
        self::assertNotFalse($start);
        $end = strpos($source, "\n\n    <section", $start);
        self::assertNotFalse($end);

        $twig = new Environment(new ArrayLoader(), ['strict_variables' => true]);
        $twig->addFunction(new TwigFunction('getLocalizedDate', static fn (): string => 'Full date'));
        $twig->addFunction(new TwigFunction('getLocalizedMonth', static fn (): string => 'Month'));
        $html = $twig->createTemplate(substr($source, $start, $end - $start))->render([
            'overview' => ['date' => new \DateTimeImmutable($date, new \DateTimeZone('UTC'))],
            'weekdayLabels' => [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'],
            'app' => ['request' => ['locale' => 'en']],
        ]);
        preg_match_all('/<span class="lioc-paper-calendar__cell([^"]*)">([^<]*)<\/span>/', $html, $matches, PREG_SET_ORDER);
        self::assertCount(42, $matches);
        $selected = (int) substr($date, -2);

        foreach ($matches as $index => $cell) {
            $day = $index - $offset + 1;
            $valid = $day >= 1 && $day <= $days;
            self::assertSame($valid ? (string) $day : '', $cell[2]);
            self::assertSame($valid && $day === $selected, str_contains($cell[1], '--selected'));
        }
    }
}
