<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** Adds an item catalogue, immutable purchase lots and immutable stock usage. */
final class Version20261027063155 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Inventory items, property-linked purchase lots, and stock usage with expiry and cost data';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE inventory_items (id INT AUTO_INCREMENT NOT NULL, sku VARCHAR(40) NOT NULL, name VARCHAR(120) NOT NULL, unit VARCHAR(30) NOT NULL, reorder_level INT DEFAULT 0 NOT NULL, active TINYINT DEFAULT 1 NOT NULL, UNIQUE INDEX uniq_inventory_item_sku (sku), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE inventory_lots (id INT AUTO_INCREMENT NOT NULL, quantity INT NOT NULL, unit_cost_minor BIGINT NOT NULL, currency VARCHAR(3) NOT NULL, purchased_at DATE NOT NULL, expires_at DATE DEFAULT NULL, supplier VARCHAR(120) DEFAULT NULL, reference VARCHAR(120) DEFAULT NULL, item_id INT NOT NULL, subsidiary_id INT NOT NULL, recorded_by_id INT DEFAULT NULL, INDEX IDX_DBC648E0126F525E (item_id), INDEX IDX_DBC648E0D4A7BDA2 (subsidiary_id), INDEX IDX_DBC648E0D05A957B (recorded_by_id), INDEX idx_inventory_lot_property_expiry (subsidiary_id, expires_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE inventory_issues (id INT AUTO_INCREMENT NOT NULL, quantity INT NOT NULL, issued_at DATE NOT NULL, reason VARCHAR(255) NOT NULL, lot_id INT NOT NULL, recorded_by_id INT DEFAULT NULL, INDEX IDX_DAA1E328A8CBA5F7 (lot_id), INDEX IDX_DAA1E328D05A957B (recorded_by_id), INDEX idx_inventory_issue_date (issued_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE inventory_lots ADD CONSTRAINT FK_DBC648E0126F525E FOREIGN KEY (item_id) REFERENCES inventory_items (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE inventory_lots ADD CONSTRAINT FK_DBC648E0D4A7BDA2 FOREIGN KEY (subsidiary_id) REFERENCES objects (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE inventory_lots ADD CONSTRAINT FK_DBC648E0D05A957B FOREIGN KEY (recorded_by_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE inventory_issues ADD CONSTRAINT FK_DAA1E328A8CBA5F7 FOREIGN KEY (lot_id) REFERENCES inventory_lots (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE inventory_issues ADD CONSTRAINT FK_DAA1E328D05A957B FOREIGN KEY (recorded_by_id) REFERENCES users (id) ON DELETE SET NULL');
    }

    /** Rolling back removes inventory data; run only after exporting records. */
    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE inventory_issues');
        $this->addSql('DROP TABLE inventory_lots');
        $this->addSql('DROP TABLE inventory_items');
    }
}
