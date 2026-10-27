<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** Adds optional dietary details to guest profiles. */
final class Version20261027080000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add optional dietary preference and notes to guests';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE customers ADD dietary_preference VARCHAR(100) DEFAULT NULL, ADD dietary_notes VARCHAR(1000) DEFAULT NULL');
    }

    /** Rolling back removes the saved dietary details. */
    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE customers DROP dietary_preference, DROP dietary_notes');
    }
}
