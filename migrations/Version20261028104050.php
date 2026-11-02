<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/** Adds configurable meals and guest orders with invoice links. */
final class Version20261028104050 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create meal options and guest meal orders';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE meal_options (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, service VARCHAR(40) NOT NULL, price_minor BIGINT NOT NULL, currency VARCHAR(3) NOT NULL, tax_rate NUMERIC(5, 2) DEFAULT NULL, includes_tax TINYINT DEFAULT NULL, active TINYINT DEFAULT 1 NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE meal_orders (id INT AUTO_INCREMENT NOT NULL, item_name VARCHAR(120) NOT NULL, service_name VARCHAR(40) NOT NULL, meal_date DATE NOT NULL, quantity INT NOT NULL, unit_price_minor BIGINT NOT NULL, currency VARCHAR(3) NOT NULL, tax_rate NUMERIC(5, 2) DEFAULT NULL, includes_tax TINYINT DEFAULT NULL, cancelled TINYINT DEFAULT 0 NOT NULL, reservation_id INT NOT NULL, property_id INT NOT NULL, guest_id INT NOT NULL, option_id INT NOT NULL, invoice_position_id BIGINT DEFAULT NULL, INDEX IDX_8A2540E7B83297E7 (reservation_id), INDEX idx_meal_property (property_id), INDEX IDX_8A2540E79A4AA658 (guest_id), INDEX IDX_8A2540E7A7C41D6F (option_id), UNIQUE INDEX UNIQ_8A2540E7CACA4C75 (invoice_position_id), INDEX idx_meal_order_date (meal_date), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE meal_orders ADD CONSTRAINT FK_8A2540E7B83297E7 FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE meal_orders ADD CONSTRAINT FK_MEAL_PROPERTY FOREIGN KEY (property_id) REFERENCES objects (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE meal_orders ADD CONSTRAINT FK_8A2540E79A4AA658 FOREIGN KEY (guest_id) REFERENCES customers (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE meal_orders ADD CONSTRAINT FK_8A2540E7A7C41D6F FOREIGN KEY (option_id) REFERENCES meal_options (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE meal_orders ADD CONSTRAINT FK_8A2540E7CACA4C75 FOREIGN KEY (invoice_position_id) REFERENCES invoice_positions (id) ON DELETE RESTRICT');
    }

    /** Rolling back removes all recorded meal data. */
    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE meal_orders');
        $this->addSql('DROP TABLE meal_options');
    }
}
