-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: fewohbee
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_legacy_cash_journal`
--

DROP TABLE IF EXISTS `_legacy_cash_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_legacy_cash_journal` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cash_year` smallint unsigned NOT NULL,
  `cash_month` smallint unsigned NOT NULL,
  `cash_start` decimal(13,2) NOT NULL,
  `cash_end` decimal(13,2) DEFAULT NULL,
  `is_closed` tinyint(1) NOT NULL,
  `is_booked` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_legacy_cash_journal`
--

LOCK TABLES `_legacy_cash_journal` WRITE;
/*!40000 ALTER TABLE `_legacy_cash_journal` DISABLE KEYS */;
/*!40000 ALTER TABLE `_legacy_cash_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_legacy_cash_journal_entries`
--

DROP TABLE IF EXISTS `_legacy_cash_journal_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_legacy_cash_journal_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cash_journal_id` int DEFAULT NULL,
  `incomes` decimal(13,2) DEFAULT NULL,
  `expenses` decimal(13,2) DEFAULT NULL,
  `inventory` decimal(13,2) DEFAULT NULL,
  `counter_account` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `document_number` int NOT NULL,
  `date` date NOT NULL,
  `remark` tinytext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `IDX_E92E3C1DF3608108` (`cash_journal_id`),
  CONSTRAINT `FK_E92E3C1DF3608108` FOREIGN KEY (`cash_journal_id`) REFERENCES `_legacy_cash_journal` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_legacy_cash_journal_entries`
--

LOCK TABLES `_legacy_cash_journal_entries` WRITE;
/*!40000 ALTER TABLE `_legacy_cash_journal_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `_legacy_cash_journal_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounting_accounts`
--

DROP TABLE IF EXISTS `accounting_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_number` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_cash_account` tinyint(1) NOT NULL DEFAULT '0',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `is_opening_balance_account` tinyint(1) NOT NULL DEFAULT '0',
  `is_bank_account` tinyint(1) NOT NULL DEFAULT '0',
  `is_auto_account` tinyint(1) NOT NULL DEFAULT '0',
  `datev_sachverhalt_l_u_l` smallint DEFAULT NULL,
  `datev_funktionsergaenzung_l_u_l` smallint DEFAULT NULL,
  `chart_preset` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iban` varchar(34) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_account_per_preset` (`account_number`,`chart_preset`),
  KEY `idx_acct_chart_preset` (`chart_preset`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_accounts`
--

LOCK TABLES `accounting_accounts` WRITE;
/*!40000 ALTER TABLE `accounting_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounting_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounting_settings`
--

DROP TABLE IF EXISTS `accounting_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chart_preset` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `advisor_number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fiscal_year_start` smallint NOT NULL DEFAULT '1',
  `account_number_length` smallint NOT NULL DEFAULT '4',
  `dictation_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT 'WD',
  `updated_at` datetime NOT NULL,
  `main_position_label` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `misc_position_label` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_settings`
--

LOCK TABLES `accounting_settings` WRITE;
/*!40000 ALTER TABLE `accounting_settings` DISABLE KEYS */;
INSERT INTO `accounting_settings` VALUES (1,NULL,NULL,NULL,1,4,'WD','2026-09-15 11:42:10',NULL,NULL);
/*!40000 ALTER TABLE `accounting_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `amenity`
--

DROP TABLE IF EXISTS `amenity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amenity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_fa_class` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `booking_com_rma_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `airbnb_amenity_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_AB5B5FD6989D9B62` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amenity`
--

LOCK TABLES `amenity` WRITE;
/*!40000 ALTER TABLE `amenity` DISABLE KEYS */;
INSERT INTO `amenity` VALUES (1,'wifi','fa-solid fa-wifi','room',1,NULL,NULL),(2,'tv','fa-solid fa-tv','room',2,NULL,NULL),(3,'air_conditioning','fa-solid fa-snowflake','room',3,NULL,NULL),(4,'heating','fa-solid fa-temperature-high','room',4,NULL,NULL),(5,'safe','fa-solid fa-shield-halved','room',5,NULL,NULL),(6,'desk','fa-solid fa-keyboard','room',6,NULL,NULL),(7,'balcony','fa-solid fa-door-open','room',7,NULL,NULL),(8,'terrace','fa-solid fa-house','room',8,NULL,NULL),(9,'view_mountain','fa-solid fa-mountain','room',9,NULL,NULL),(10,'view_lake','fa-solid fa-water','room',10,NULL,NULL),(11,'view_garden','fa-solid fa-tree','room',11,NULL,NULL),(12,'private_bathroom','fa-solid fa-toilet','bathroom',1,NULL,NULL),(13,'shower','fa-solid fa-shower','bathroom',2,NULL,NULL),(14,'bathtub','fa-solid fa-bath','bathroom',3,NULL,NULL),(15,'hairdryer','fa-solid fa-wind','bathroom',4,NULL,NULL),(16,'towels','fa-solid fa-hot-tub-person','bathroom',5,NULL,NULL),(17,'kitchenette','fa-solid fa-kitchen-set','kitchen',1,NULL,NULL),(18,'fridge','fa-solid fa-box','kitchen',2,NULL,NULL),(19,'coffee_machine','fa-solid fa-mug-hot','kitchen',3,NULL,NULL),(20,'kettle','fa-solid fa-mug-saucer','kitchen',4,NULL,NULL),(21,'dishwasher','fa-solid fa-sink','kitchen',5,NULL,NULL),(22,'parking','fa-solid fa-square-parking','outdoor',1,NULL,NULL),(23,'pets_allowed','fa-solid fa-paw','outdoor',2,NULL,NULL),(24,'non_smoking','fa-solid fa-ban-smoking','outdoor',3,NULL,NULL),(25,'accessible','fa-solid fa-wheelchair','outdoor',4,NULL,NULL),(26,'crib_available','fa-solid fa-baby','outdoor',5,NULL,NULL),(27,'washing_machine','fa-solid fa-soap','bathroom',6,NULL,NULL);
/*!40000 ALTER TABLE `amenity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_tokens`
--

DROP TABLE IF EXISTS `api_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `token_prefix` varchar(12) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `scopes` json NOT NULL,
  `expires_at` datetime DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
  `last_used_at` datetime DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_2CAD560EB3BC57DA` (`token_hash`),
  KEY `IDX_2CAD560EA76ED395` (`user_id`),
  CONSTRAINT `FK_2CAD560EA76ED395` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_tokens`
--

LOCK TABLES `api_tokens` WRITE;
/*!40000 ALTER TABLE `api_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EUR',
  `currency_symbol` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'â‚¬',
  `invoice_filename_pattern` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Invoice-<number>',
  `customer_salutations` json NOT NULL,
  `notification_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `mail_from_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mail_from_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mail_return_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mail_copy` tinyint(1) DEFAULT NULL,
  `smtp_host` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_encryption` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_password_encrypted` longtext COLLATE utf8mb4_unicode_ci,
  `invoice_number_pattern` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_settings`
--

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
INSERT INTO `app_settings` VALUES (1,'LKR','Rs.','LIOC-Invoice-<number>','[\"Ms\", \"Mr\", \"Family\"]',NULL,'2026-10-22 09:29:47','timothy@lankaioc.com','timothy sahan',NULL,0,NULL,NULL,'starttls',NULL,NULL,NULL);
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appartments`
--

DROP TABLE IF EXISTS `appartments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appartments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `object_id` int DEFAULT NULL,
  `number` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `beds_max` smallint NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_category_id` int DEFAULT NULL,
  `multiple_occupancy` tinyint(1) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `uuid` binary(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_A67E5E3AD17F50A6` (`uuid`),
  KEY `IDX_A67E5E3A232D562B` (`object_id`),
  KEY `IDX_A67E5E3A67333DD` (`room_category_id`),
  CONSTRAINT `FK_A67E5E3A232D562B` FOREIGN KEY (`object_id`) REFERENCES `objects` (`id`),
  CONSTRAINT `FK_A67E5E3A67333DD` FOREIGN KEY (`room_category_id`) REFERENCES `room_category` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appartments`
--

LOCK TABLES `appartments` WRITE;
/*!40000 ALTER TABLE `appartments` DISABLE KEYS */;
INSERT INTO `appartments` VALUES (1,2,'COL-01',2,'Permanently allocated to SVP â€“ Lubes',1,0,1,_binary 'd´\\p\ÄFþ¢\'dÝ˜2´}'),(2,2,'COL-02',2,'General accommodation',1,0,1,_binary '\æ½hAA°€o\Û\ZÐž©\''),(3,2,'COL-03',2,'Permanently allocated to Managing Director',1,0,1,_binary '7½·«,CO2ºüJ\ÏSJrz'),(4,2,'COL-04',1,'General accommodation',2,0,1,_binary '\ZM¿E¡)N<£øýM±3œ'),(5,1,'TRI-102',1,'Company-provided residential accommodation for Lanka IOC expatriate officers.',1,0,1,_binary 'ªš\ëO{\ÇNœª”sþ¸\ØR…'),(6,1,'TRI-201',2,'Company-provided residential accommodation for Lanka IOC expatriate officers.',2,0,1,_binary '\ãŸ\Îr6Gó–ù\âý');
/*!40000 ALTER TABLE `appartments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_csv_profiles`
--

DROP TABLE IF EXISTS `bank_csv_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_csv_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `delimiter` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enclosure` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `encoding` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `header_skip` int NOT NULL DEFAULT '0',
  `has_header_row` tinyint(1) NOT NULL DEFAULT '1',
  `column_map` json NOT NULL,
  `date_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_decimal_separator` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_thousands_separator` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direction_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `iban_source_line` int DEFAULT NULL,
  `period_source_line` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_csv_profiles`
--

LOCK TABLES `bank_csv_profiles` WRITE;
/*!40000 ALTER TABLE `bank_csv_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_csv_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_import_fingerprints`
--

DROP TABLE IF EXISTS `bank_import_fingerprints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_import_fingerprints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bank_account_id` int NOT NULL,
  `booking_entry_id` int DEFAULT NULL,
  `statement_import_id` int DEFAULT NULL,
  `raw_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `committed_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bank_fingerprint` (`bank_account_id`,`raw_hash`),
  KEY `IDX_bank_fingerprint_entry` (`booking_entry_id`),
  KEY `IDX_bank_fingerprint_import` (`statement_import_id`),
  CONSTRAINT `FK_bank_fingerprint_account` FOREIGN KEY (`bank_account_id`) REFERENCES `accounting_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_bank_fingerprint_entry` FOREIGN KEY (`booking_entry_id`) REFERENCES `booking_entries` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_bank_fingerprint_import` FOREIGN KEY (`statement_import_id`) REFERENCES `bank_statement_imports` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_import_fingerprints`
--

LOCK TABLES `bank_import_fingerprints` WRITE;
/*!40000 ALTER TABLE `bank_import_fingerprints` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_import_fingerprints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_import_rules`
--

DROP TABLE IF EXISTS `bank_import_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_import_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bank_account_id` int DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `priority` int NOT NULL DEFAULT '0',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `conditions` json NOT NULL,
  `action` json NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bank_import_rule_enabled` (`is_enabled`),
  KEY `idx_bank_import_rule_priority` (`priority`),
  KEY `IDX_bank_import_rule_account` (`bank_account_id`),
  CONSTRAINT `FK_bank_import_rule_account` FOREIGN KEY (`bank_account_id`) REFERENCES `accounting_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_import_rules`
--

LOCK TABLES `bank_import_rules` WRITE;
/*!40000 ALTER TABLE `bank_import_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_import_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_statement_imports`
--

DROP TABLE IF EXISTS `bank_statement_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_statement_imports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bank_account_id` int NOT NULL,
  `created_by_id` int DEFAULT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  `line_count_total` int NOT NULL DEFAULT '0',
  `line_count_committed` int NOT NULL DEFAULT '0',
  `line_count_ignored` int NOT NULL DEFAULT '0',
  `line_count_duplicate` int NOT NULL DEFAULT '0',
  `file_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `committed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bank_statement_import_account` (`bank_account_id`),
  KEY `idx_bank_statement_import_status` (`status`),
  KEY `IDX_bank_statement_import_user` (`created_by_id`),
  CONSTRAINT `FK_bank_statement_import_account` FOREIGN KEY (`bank_account_id`) REFERENCES `accounting_accounts` (`id`),
  CONSTRAINT `FK_bank_statement_import_user` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_statement_imports`
--

LOCK TABLES `bank_statement_imports` WRITE;
/*!40000 ALTER TABLE `bank_statement_imports` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_statement_imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_batches`
--

DROP TABLE IF EXISTS `booking_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` smallint unsigned NOT NULL,
  `month` smallint unsigned NOT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT '0',
  `is_exported` tinyint(1) NOT NULL DEFAULT '0',
  `cash_start` decimal(13,2) DEFAULT NULL,
  `cash_end` decimal(13,2) DEFAULT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_batches`
--

LOCK TABLES `booking_batches` WRITE;
/*!40000 ALTER TABLE `booking_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_entries`
--

DROP TABLE IF EXISTS `booking_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_batch_id` int NOT NULL,
  `date` date NOT NULL,
  `document_number` int NOT NULL,
  `amount` decimal(13,2) NOT NULL,
  `debit_account_id` int DEFAULT NULL,
  `credit_account_id` int DEFAULT NULL,
  `tax_rate_id` int DEFAULT NULL,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_id` int DEFAULT NULL,
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `counter_account_legacy` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `split_group_uuid` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_booking_batch` (`booking_batch_id`),
  KEY `IDX_debit_account` (`debit_account_id`),
  KEY `IDX_credit_account` (`credit_account_id`),
  KEY `IDX_tax_rate` (`tax_rate_id`),
  KEY `idx_booking_entry_split_group` (`split_group_uuid`),
  CONSTRAINT `FK_be_batch` FOREIGN KEY (`booking_batch_id`) REFERENCES `booking_batches` (`id`),
  CONSTRAINT `FK_be_credit` FOREIGN KEY (`credit_account_id`) REFERENCES `accounting_accounts` (`id`),
  CONSTRAINT `FK_be_debit` FOREIGN KEY (`debit_account_id`) REFERENCES `accounting_accounts` (`id`),
  CONSTRAINT `FK_be_taxrate` FOREIGN KEY (`tax_rate_id`) REFERENCES `tax_rates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_entries`
--

LOCK TABLES `booking_entries` WRITE;
/*!40000 ALTER TABLE `booking_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar`
--

DROP TABLE IF EXISTS `calendar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requires_confirmation` tinyint(1) NOT NULL,
  `ics_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `last_sync_count` int DEFAULT NULL,
  `last_sync_new_count` int DEFAULT NULL,
  `last_sync_updated_count` int DEFAULT NULL,
  `last_sync_unchanged_count` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar`
--

LOCK TABLES `calendar` WRITE;
/*!40000 ALTER TABLE `calendar` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_entry`
--

DROP TABLE IF EXISTS `calendar_entry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_entry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `calendar_id` int NOT NULL,
  `confirmed_by_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_uid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_calendar_entry_date` (`date`),
  KEY `idx_calendar_entry_source` (`calendar_id`,`source_uid`),
  KEY `IDX_CALENDAR_ENTRY_CALENDAR` (`calendar_id`),
  KEY `IDX_CALENDAR_ENTRY_CONFIRMED_BY` (`confirmed_by_id`),
  CONSTRAINT `FK_CALENDAR_ENTRY_CALENDAR` FOREIGN KEY (`calendar_id`) REFERENCES `calendar` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_CALENDAR_ENTRY_CONFIRMED_BY` FOREIGN KEY (`confirmed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_entry`
--

LOCK TABLES `calendar_entry` WRITE;
/*!40000 ALTER TABLE `calendar_entry` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_entry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_sync`
--

DROP TABLE IF EXISTS `calendar_sync`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_sync` (
  `id` int NOT NULL AUTO_INCREMENT,
  `apartment_id` int NOT NULL,
  `uuid` binary(16) NOT NULL COMMENT '(DC2Type:uuid)',
  `is_public` tinyint(1) NOT NULL,
  `last_export` datetime DEFAULT NULL,
  `export_guest_name` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_7EBD762ED17F50A6` (`uuid`),
  UNIQUE KEY `UNIQ_7EBD762E176DFE85` (`apartment_id`),
  KEY `uuid_idx` (`uuid`),
  CONSTRAINT `FK_7EBD762E176DFE85` FOREIGN KEY (`apartment_id`) REFERENCES `appartments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_sync`
--

LOCK TABLES `calendar_sync` WRITE;
/*!40000 ALTER TABLE `calendar_sync` DISABLE KEYS */;
INSERT INTO `calendar_sync` VALUES (1,1,_binary 'Ç˜Á¢M ¾7ƒÂ»ü]D',0,NULL,0),(2,2,_binary 'Zn¼I‘”H¡‚\0@XX­\Ã',0,NULL,0),(3,3,_binary 'Ùšþ¢\Ã)L”®¥²?@ i',0,NULL,0),(4,4,_binary '\"3S\Õ\0K½¿9f¤ˆ\ÕU',0,NULL,0),(5,5,_binary '5s«B\Ô;A\r¹ns¥*¤\Ö',0,NULL,0),(6,6,_binary 'Þ’QB\ÓL£„\ì\Ù\êêºŽ',0,NULL,0);
/*!40000 ALTER TABLE `calendar_sync` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_sync_import`
--

DROP TABLE IF EXISTS `calendar_sync_import`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_sync_import` (
  `id` int NOT NULL AUTO_INCREMENT,
  `apartment_id` int NOT NULL,
  `reservation_origin_id` int NOT NULL,
  `reservation_status_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `conflict_strategy` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_sync_at` datetime DEFAULT NULL,
  `last_sync_error` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `calendar_sync_import_apartment_idx` (`apartment_id`),
  KEY `IDX_3E40D8014CE51253` (`reservation_origin_id`),
  KEY `IDX_3E40D80171B06122` (`reservation_status_id`),
  CONSTRAINT `FK_3E40D8014CE51253` FOREIGN KEY (`reservation_origin_id`) REFERENCES `reservation_origins` (`id`),
  CONSTRAINT `FK_3E40D80171B06122` FOREIGN KEY (`reservation_status_id`) REFERENCES `reservation_status` (`id`),
  CONSTRAINT `FK_3E40D80176DFE85` FOREIGN KEY (`apartment_id`) REFERENCES `appartments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_sync_import`
--

LOCK TABLES `calendar_sync_import` WRITE;
/*!40000 ALTER TABLE `calendar_sync_import` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_sync_import` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_sync_reservation_status`
--

DROP TABLE IF EXISTS `calendar_sync_reservation_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_sync_reservation_status` (
  `calendar_sync_id` int NOT NULL,
  `reservation_status_id` int NOT NULL,
  PRIMARY KEY (`calendar_sync_id`,`reservation_status_id`),
  KEY `IDX_88FEA5C99827BFE5` (`calendar_sync_id`),
  KEY `IDX_88FEA5C971B06122` (`reservation_status_id`),
  CONSTRAINT `FK_88FEA5C971B06122` FOREIGN KEY (`reservation_status_id`) REFERENCES `reservation_status` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_88FEA5C99827BFE5` FOREIGN KEY (`calendar_sync_id`) REFERENCES `calendar_sync` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_sync_reservation_status`
--

LOCK TABLES `calendar_sync_reservation_status` WRITE;
/*!40000 ALTER TABLE `calendar_sync_reservation_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_sync_reservation_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correspondence`
--

DROP TABLE IF EXISTS `correspondence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correspondence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int DEFAULT NULL,
  `reservation_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` datetime NOT NULL,
  `discr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `binary_payload` longblob,
  PRIMARY KEY (`id`),
  KEY `IDX_2A0046B05DA0FB8` (`template_id`),
  KEY `IDX_2A0046B0B83297E7` (`reservation_id`),
  CONSTRAINT `FK_2A0046B05DA0FB8` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`),
  CONSTRAINT `FK_2A0046B0B83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correspondence`
--

LOCK TABLES `correspondence` WRITE;
/*!40000 ALTER TABLE `correspondence` DISABLE KEYS */;
/*!40000 ALTER TABLE `correspondence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correspondence_correspondence`
--

DROP TABLE IF EXISTS `correspondence_correspondence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correspondence_correspondence` (
  `correspondence_source` int NOT NULL,
  `correspondence_target` int NOT NULL,
  PRIMARY KEY (`correspondence_source`,`correspondence_target`),
  KEY `IDX_3F24C58B9042717B` (`correspondence_source`),
  KEY `IDX_3F24C58B89A721F4` (`correspondence_target`),
  CONSTRAINT `FK_3F24C58B89A721F4` FOREIGN KEY (`correspondence_target`) REFERENCES `correspondence` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_3F24C58B9042717B` FOREIGN KEY (`correspondence_source`) REFERENCES `correspondence` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correspondence_correspondence`
--

LOCK TABLES `correspondence_correspondence` WRITE;
/*!40000 ALTER TABLE `correspondence_correspondence` DISABLE KEYS */;
/*!40000 ALTER TABLE `correspondence_correspondence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_phone` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_vat_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_iban` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_addresses`
--

LOCK TABLES `customer_addresses` WRITE;
/*!40000 ALTER TABLE `customer_addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_has_address`
--

DROP TABLE IF EXISTS `customer_has_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_has_address` (
  `customer_id` int NOT NULL,
  `customer_addresses_id` int NOT NULL,
  PRIMARY KEY (`customer_id`,`customer_addresses_id`),
  KEY `IDX_69F42C529395C3F3` (`customer_id`),
  KEY `IDX_69F42C5259CB7F99` (`customer_addresses_id`),
  CONSTRAINT `FK_69F42C5259CB7F99` FOREIGN KEY (`customer_addresses_id`) REFERENCES `customer_addresses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_69F42C529395C3F3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_has_address`
--

LOCK TABLES `customer_has_address` WRITE;
/*!40000 ALTER TABLE `customer_has_address` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_has_address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `salutation` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstname` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birthday` date DEFAULT NULL,
  `id_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idnumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dietary_preference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dietary_notes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Herr','Anonym','Anonym',NULL,NULL,NULL,NULL,NULL,NULL),(2,'Mr','K','Raghu',NULL,'customer.id.type.driving_licence','Managing Director; Indian national; permanently allocated to Colombo Room 03.','',NULL,NULL),(3,'Mr','Prashant','Raut',NULL,'customer.id.type.driving_licence','SVP (Lubes), Lanka IOC PLC; Indian national; permanently allocated to Colombo Room 01.','',NULL,NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctrine_migration_versions`
--

DROP TABLE IF EXISTS `doctrine_migration_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctrine_migration_versions` (
  `version` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctrine_migration_versions`
--

LOCK TABLES `doctrine_migration_versions` WRITE;
/*!40000 ALTER TABLE `doctrine_migration_versions` DISABLE KEYS */;
INSERT INTO `doctrine_migration_versions` VALUES ('DoctrineMigrations\\Version20190802123327','2026-09-14 05:50:09',1509),('DoctrineMigrations\\Version20190831115321','2026-09-14 05:50:10',25),('DoctrineMigrations\\Version20190906160425','2026-09-14 05:50:11',1),('DoctrineMigrations\\Version20190915110513','2026-09-14 05:50:11',0),('DoctrineMigrations\\Version20200201112113','2026-09-14 05:50:11',100),('DoctrineMigrations\\Version20200229105042','2026-09-14 05:50:11',194),('DoctrineMigrations\\Version20210117110810','2026-09-14 05:50:11',117),('DoctrineMigrations\\Version20210207103847','2026-09-14 05:50:11',143),('DoctrineMigrations\\Version20210227203949','2026-09-14 05:50:11',105),('DoctrineMigrations\\Version20211008204004','2026-09-14 05:50:11',35),('DoctrineMigrations\\Version20211016103915','2026-09-14 05:50:11',169),('DoctrineMigrations\\Version20211204122332','2026-09-14 05:50:11',26),('DoctrineMigrations\\Version20220212121500','2026-09-14 05:50:11',389),('DoctrineMigrations\\Version20220820130837','2026-09-14 05:50:12',60),('DoctrineMigrations\\Version20220923121903','2026-09-14 05:50:12',33),('DoctrineMigrations\\Version20250206125900','2026-09-14 05:50:12',44),('DoctrineMigrations\\Version20250311083124','2026-09-14 05:50:12',9),('DoctrineMigrations\\Version20250316194509','2026-09-14 05:50:12',141),('DoctrineMigrations\\Version20250407071506','2026-09-14 05:50:12',18),('DoctrineMigrations\\Version20251119091200','2026-09-14 05:50:12',50),('DoctrineMigrations\\Version20251121120640','2026-09-14 05:50:12',175),('DoctrineMigrations\\Version20260104090000','2026-09-14 05:50:12',65),('DoctrineMigrations\\Version20260107163205','2026-09-14 05:50:12',33),('DoctrineMigrations\\Version20260115120000','2026-09-14 05:50:12',344),('DoctrineMigrations\\Version20260116120000','2026-09-14 05:50:13',31),('DoctrineMigrations\\Version20260121120000','2026-09-14 05:50:13',373),('DoctrineMigrations\\Version20260223090000','2026-09-14 05:50:13',131),('DoctrineMigrations\\Version20260320120000','2026-09-14 05:50:13',67),('DoctrineMigrations\\Version20260321120000','2026-09-14 05:50:13',184),('DoctrineMigrations\\Version20260402073403','2026-09-14 05:50:14',295),('DoctrineMigrations\\Version20260412120000','2026-09-14 05:50:14',59),('DoctrineMigrations\\Version20260413120000','2026-09-14 05:50:14',123),('DoctrineMigrations\\Version20260420120000','2026-09-14 05:50:14',62),('DoctrineMigrations\\Version20260421120000','2026-09-14 05:50:14',210),('DoctrineMigrations\\Version20260422130000','2026-09-14 05:50:14',584),('DoctrineMigrations\\Version20260424190000','2026-09-14 05:50:15',212),('DoctrineMigrations\\Version20260505120000','2026-09-14 05:50:15',230),('DoctrineMigrations\\Version20260513120000','2026-09-14 05:50:15',80),('DoctrineMigrations\\Version20260520120000','2026-09-14 05:50:16',35),('DoctrineMigrations\\Version20260523194549','2026-09-14 05:50:16',39),('DoctrineMigrations\\Version20260526115836','2026-09-14 05:50:16',33),('DoctrineMigrations\\Version20260531120000','2026-09-14 05:50:16',25),('DoctrineMigrations\\Version20260601000000','2026-09-14 05:50:16',3),('DoctrineMigrations\\Version20260601120000','2026-09-14 05:50:16',31),('DoctrineMigrations\\Version20260604120000','2026-09-14 05:50:16',11),('DoctrineMigrations\\Version20260707120000','2026-09-14 05:50:16',121),('DoctrineMigrations\\Version20260711120000','2026-09-14 05:50:16',37),('DoctrineMigrations\\Version20260712110000','2026-09-14 05:50:16',127),('DoctrineMigrations\\Version20260712120000','2026-09-14 05:50:16',140),('DoctrineMigrations\\Version20260728120000','2026-09-14 05:50:16',179),('DoctrineMigrations\\Version20260813090000','2026-09-14 05:50:16',104),('DoctrineMigrations\\Version20260815130000','2026-09-14 05:50:16',14),('DoctrineMigrations\\Version20260817120000','2026-09-14 05:50:16',276),('DoctrineMigrations\\Version20261027063155','2026-10-27 06:37:22',353),('DoctrineMigrations\\Version20261027080000','2026-10-27 07:27:10',40),('DoctrineMigrations\\Version20261028104050','2026-10-28 10:55:56',394);
/*!40000 ALTER TABLE `doctrine_migration_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guest_categories`
--

DROP TABLE IF EXISTS `guest_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `acronym` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_age` smallint DEFAULT NULL,
  `max_age` smallint DEFAULT NULL,
  `is_counted_in_occupancy` tinyint(1) NOT NULL DEFAULT '1',
  `statistical_group` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `system_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_guest_category_system_code` (`system_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guest_categories`
--

LOCK TABLES `guest_categories` WRITE;
/*!40000 ALTER TABLE `guest_categories` DISABLE KEYS */;
INSERT INTO `guest_categories` VALUES (1,'Adult','ADL',18,NULL,1,'adult',10,1,'default_adult'),(2,'Child','CHD',6,17,1,'child',20,1,'default_child'),(3,'Infant','INF',0,5,0,'infant',30,1,'default_infant');
/*!40000 ALTER TABLE `guest_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guest_categories_has_subsidiaries`
--

DROP TABLE IF EXISTS `guest_categories_has_subsidiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest_categories_has_subsidiaries` (
  `guest_category_id` int NOT NULL,
  `subsidiary_id` int NOT NULL,
  PRIMARY KEY (`guest_category_id`,`subsidiary_id`),
  KEY `IDX_gchsub_category` (`guest_category_id`),
  KEY `IDX_gchsub_subsidiary` (`subsidiary_id`),
  CONSTRAINT `FK_gchsub_category` FOREIGN KEY (`guest_category_id`) REFERENCES `guest_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_gchsub_subsidiary` FOREIGN KEY (`subsidiary_id`) REFERENCES `objects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guest_categories_has_subsidiaries`
--

LOCK TABLES `guest_categories_has_subsidiaries` WRITE;
/*!40000 ALTER TABLE `guest_categories_has_subsidiaries` DISABLE KEYS */;
/*!40000 ALTER TABLE `guest_categories_has_subsidiaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guest_category_modifiers`
--

DROP TABLE IF EXISTS `guest_category_modifiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest_category_modifiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `IDX_gcm_category` (`category_id`),
  CONSTRAINT `FK_gcm_category` FOREIGN KEY (`category_id`) REFERENCES `guest_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guest_category_modifiers`
--

LOCK TABLES `guest_category_modifiers` WRITE;
/*!40000 ALTER TABLE `guest_category_modifiers` DISABLE KEYS */;
/*!40000 ALTER TABLE `guest_category_modifiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_issues`
--

DROP TABLE IF EXISTS `inventory_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` int NOT NULL,
  `issued_at` date NOT NULL,
  `reason` varchar(255) NOT NULL,
  `lot_id` int NOT NULL,
  `recorded_by_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_DAA1E328A8CBA5F7` (`lot_id`),
  KEY `IDX_DAA1E328D05A957B` (`recorded_by_id`),
  KEY `idx_inventory_issue_date` (`issued_at`),
  CONSTRAINT `FK_DAA1E328A8CBA5F7` FOREIGN KEY (`lot_id`) REFERENCES `inventory_lots` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_DAA1E328D05A957B` FOREIGN KEY (`recorded_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_issues`
--

LOCK TABLES `inventory_issues` WRITE;
/*!40000 ALTER TABLE `inventory_issues` DISABLE KEYS */;
INSERT INTO `inventory_issues` VALUES (1,4,'2026-10-27','[SAMPLE] Usage',1,NULL),(2,4,'2026-10-27','[SAMPLE] Usage',2,NULL),(3,5,'2026-10-27','[SAMPLE] Usage',5,NULL),(4,5,'2026-10-27','[SAMPLE] Usage',6,NULL);
/*!40000 ALTER TABLE `inventory_issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sku` varchar(40) NOT NULL,
  `name` varchar(120) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `reorder_level` int NOT NULL DEFAULT '0',
  `active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_inventory_item_sku` (`sku`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (1,'SAMPLE-INV-TEA','[SAMPLE] Tea packets','pack',6,1),(2,'SAMPLE-INV-MILK','[SAMPLE] Milk cartons','carton',6,1),(3,'SAMPLE-INV-SOAP','[SAMPLE] Bath soap','bar',6,1),(4,'SAMPLE-INV-RICE','[SAMPLE] Rice packets','pack',4,1);
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_lots`
--

DROP TABLE IF EXISTS `inventory_lots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_lots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` int NOT NULL,
  `unit_cost_minor` bigint NOT NULL,
  `currency` varchar(3) NOT NULL,
  `purchased_at` date NOT NULL,
  `expires_at` date DEFAULT NULL,
  `supplier` varchar(120) DEFAULT NULL,
  `reference` varchar(120) DEFAULT NULL,
  `item_id` int NOT NULL,
  `subsidiary_id` int NOT NULL,
  `recorded_by_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_DBC648E0126F525E` (`item_id`),
  KEY `IDX_DBC648E0D4A7BDA2` (`subsidiary_id`),
  KEY `IDX_DBC648E0D05A957B` (`recorded_by_id`),
  KEY `idx_inventory_lot_property_expiry` (`subsidiary_id`,`expires_at`),
  CONSTRAINT `FK_DBC648E0126F525E` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_DBC648E0D05A957B` FOREIGN KEY (`recorded_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_DBC648E0D4A7BDA2` FOREIGN KEY (`subsidiary_id`) REFERENCES `objects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_lots`
--

LOCK TABLES `inventory_lots` WRITE;
/*!40000 ALTER TABLE `inventory_lots` DISABLE KEYS */;
INSERT INTO `inventory_lots` VALUES (1,20,45000,'LKR','2026-10-27','2026-11-06','[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-TEA',1,1,NULL),(2,20,45000,'LKR','2026-10-27','2026-11-06','[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-TEA',1,2,NULL),(3,4,38000,'LKR','2026-10-27','2026-11-16','[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-MILK',2,1,NULL),(4,4,38000,'LKR','2026-10-27','2026-11-16','[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-MILK',2,2,NULL),(5,24,15000,'LKR','2026-10-27',NULL,'[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-SOAP',3,1,NULL),(6,24,15000,'LKR','2026-10-27',NULL,'[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-SOAP',3,2,NULL),(7,8,65000,'LKR','2026-10-17','2026-10-26','[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-RICE',4,1,NULL),(8,8,65000,'LKR','2026-10-17','2026-10-26','[SAMPLE] Supplier','SAMPLE-INVENTORY-V1-RICE',4,2,NULL);
/*!40000 ALTER TABLE `inventory_lots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_appartments`
--

DROP TABLE IF EXISTS `invoice_appartments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_appartments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_id` int DEFAULT NULL,
  `number` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `beds` smallint NOT NULL,
  `persons` smallint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `vat` decimal(10,2) NOT NULL,
  `includes_vat` tinyint(1) DEFAULT NULL,
  `is_flat_price` tinyint(1) DEFAULT NULL,
  `is_per_room` tinyint(1) NOT NULL DEFAULT '1',
  `revenue_account_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_B1303C092989F1FD` (`invoice_id`),
  KEY `IDX_INVOICE_APPARTMENTS_REVENUE_ACCOUNT` (`revenue_account_id`),
  CONSTRAINT `FK_B1303C092989F1FD` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `FK_INVOICE_APPARTMENTS_REVENUE_ACCOUNT` FOREIGN KEY (`revenue_account_id`) REFERENCES `accounting_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_appartments`
--

LOCK TABLES `invoice_appartments` WRITE;
/*!40000 ALTER TABLE `invoice_appartments` DISABLE KEYS */;
INSERT INTO `invoice_appartments` VALUES (1,1,'COL-03','Permanently allocated to Managing Director',1,1,'2026-10-28','2026-10-30',0.00,0.00,1,0,1,NULL);
/*!40000 ALTER TABLE `invoice_appartments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_positions`
--

DROP TABLE IF EXISTS `invoice_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_positions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_id` int DEFAULT NULL,
  `amount` int NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `vat` decimal(10,2) NOT NULL,
  `includes_vat` tinyint(1) DEFAULT NULL,
  `is_flat_price` tinyint(1) DEFAULT NULL,
  `is_per_room` tinyint(1) NOT NULL DEFAULT '0',
  `revenue_account_id` int DEFAULT NULL,
  `position_group` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_B33014E02989F1FD` (`invoice_id`),
  KEY `IDX_INVOICE_POSITIONS_REVENUE_ACCOUNT` (`revenue_account_id`),
  CONSTRAINT `FK_B33014E02989F1FD` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `FK_INVOICE_POSITIONS_REVENUE_ACCOUNT` FOREIGN KEY (`revenue_account_id`) REFERENCES `accounting_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_positions`
--

LOCK TABLES `invoice_positions` WRITE;
/*!40000 ALTER TABLE `invoice_positions` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_positions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_settings_data`
--

DROP TABLE IF EXISTS `invoice_settings_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_settings_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vat_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_department` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_mail` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_invoice_mail` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_address` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_post_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_city` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_country` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_iban` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_bic` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_terms` longtext COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL,
  `payment_due_days` smallint DEFAULT NULL,
  `creditor_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `einvoice_profile` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en16931',
  `registration_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subsidiary_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_9C8E2C8760602D95` (`subsidiary_id`),
  CONSTRAINT `FK_9C8E2C8760602D95` FOREIGN KEY (`subsidiary_id`) REFERENCES `objects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_settings_data`
--

LOCK TABLES `invoice_settings_data` WRITE;
/*!40000 ALTER TABLE `invoice_settings_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_settings_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `number` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `salutation` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstname` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remark` longtext COLLATE utf8mb4_unicode_ci,
  `payment` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` smallint NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_means` int DEFAULT NULL,
  `card_number` varchar(19) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_iban` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_holder` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mandate_reference` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_vat_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subsidiary_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_date` (`date`),
  KEY `IDX_6A2F2F9560602D95` (`subsidiary_id`),
  KEY `idx_invoice_number` (`number`),
  CONSTRAINT `FK_6A2F2F9560602D95` FOREIGN KEY (`subsidiary_id`) REFERENCES `objects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,'897978','2026-10-27','Mr','K','Raghu',NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL,2);
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logging`
--

DROP TABLE IF EXISTS `logging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logging` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `username` varchar(180) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `entity_class` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_logging_date` (`date`),
  KEY `idx_logging_entity` (`entity_class`,`entity_id`),
  KEY `idx_logging_user` (`user_id`),
  CONSTRAINT `FK_logging_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logging`
--

LOCK TABLES `logging` WRITE;
/*!40000 ALTER TABLE `logging` DISABLE KEYS */;
INSERT INTO `logging` VALUES (1,NULL,NULL,'2026-09-14 05:51:35','App\\Entity\\AppSettings','1','create','{\"currency\": [null, \"EUR\"], \"updatedAt\": [null, \"2026-09-14T05:51:35+00:00\"], \"currencySymbol\": [null, \"â‚¬\"], \"customerSalutations\": [null, \"array(3)\"], \"invoiceFilenamePattern\": [null, \"Invoice-<number>\"]}','127.0.0.1'),(2,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\Role','9','create','{\"name\": [null, \"Admin\"], \"role\": [null, \"ROLE_ADMIN\"]}',NULL),(3,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\User','1','create','{\"email\": [null, \"timothy@lankaioc.com\"], \"active\": [null, true], \"lastname\": [null, \"Sahan\"], \"password\": [\"***redacted***\", \"***redacted***\"], \"username\": [null, \"timothy\"], \"firstname\": [null, \"Timothy\"], \"themePreference\": [null, \"light\"]}',NULL),(4,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\TemplateType','6','create','{\"icon\": [null, \"fa-envelope\"], \"name\": [null, \"TEMPLATE_RESERVATION_EMAIL\"]}',NULL),(5,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\TemplateType','7','create','{\"icon\": [null, \"fa-file-pdf\"], \"name\": [null, \"TEMPLATE_FILE_PDF\"]}',NULL),(6,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\TemplateType','8','create','{\"icon\": [null, \"fa-file-pdf\"], \"name\": [null, \"TEMPLATE_INVOICE_PDF\"]}',NULL),(7,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\TemplateType','9','create','{\"icon\": [null, \"fa-file-pdf\"], \"name\": [null, \"TEMPLATE_RESERVATION_PDF\"]}',NULL),(8,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\TemplateType','10','create','{\"icon\": [null, \"fa-file-pdf\"], \"name\": [null, \"TEMPLATE_CASHJOURNAL_PDF\"]}',NULL),(9,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\TemplateType','11','create','{\"icon\": [null, \"fa-file-pdf\"], \"name\": [null, \"TEMPLATE_GDPR_PDF\"]}',NULL),(10,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\Subsidiary','1','create','{\"name\": [null, \"Lanka IOC Guest House\"]}',NULL),(11,NULL,NULL,'2026-09-14 05:58:25','App\\Entity\\Customer','1','create','{\"lastname\": [null, \"Anonym\"], \"firstname\": [null, \"Anonym\"], \"salutation\": [null, \"Herr\"]}',NULL),(12,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','1','create','{\"name\": [null, \"PDF Buchungsjournal\"], \"text\": [null, \"<!DOCTYPE html>\\n<html lang=\\\"de\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style type=\\\"text/css\\\">\\n        body {\\n            font-family: arial, helvetica, sans-serif;\\n            font-size: 8pt;\\n            color: #24323f;\\n        }\\n\\n        .header-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            margin-bottom: 14px;\\n            border-bottom: 2px solid #17364d;\\n        }\\n\\n        .header-title {\\n            font-size: 18pt;\\n            font-weight: bold;\\n            color: #17364d;\\n            padding-bottom: 8px;\\n        }\\n\\n        .header-period {\\n            text-align: right;\\n            font-size: 10pt;\\n            color: #4b5d6b;\\n            vertical-align: bottom;\\n            padding-bottom: 10px;\\n        }\\n\\n        .journal-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            table-layout: fixed;\\n        }\\n\\n        .journal-table th {\\n            background: #17364d;\\n            color: #ffffff;\\n            font-sâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#10\"]}',NULL),(13,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','2','create','{\"name\": [null, \"Buchungsjournal\"], \"text\": [null, \"<!DOCTYPE html>\\n<html lang=\\\"de\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style type=\\\"text/css\\\">\\n        body {\\n            font-family: Arial, Helvetica, sans-serif;\\n            font-size: 9pt;\\n            color: #24323f;\\n        }\\n\\n        .page {\\n            position: relative;\\n        }\\n\\n        .header-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            margin-bottom: 14px;\\n            border-bottom: 2px solid #17364d;\\n        }\\n\\n        .header-title {\\n            font-size: 18pt;\\n            font-weight: bold;\\n            color: #17364d;\\n            padding-bottom: 8px;\\n        }\\n\\n        .header-period {\\n            text-align: right;\\n            font-size: 10pt;\\n            color: #4b5d6b;\\n            vertical-align: bottom;\\n            padding-bottom: 10px;\\n        }\\n\\n        .journal-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            table-layout: fixed;\\n        }\\n\\n        .journal-table th {\\n            backgrouâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"L\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, true], \"templateType\": [null, \"TemplateType#10\"]}',NULL),(14,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','3','create','{\"name\": [null, \"PDF fÃ¼r DSGVO Export\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n<style type=\\\"text/css\\\">\\n.general {\\n    border-collapse: collapse;\\n    border: 0;\\n    border-spacing: 0;\\n    width: 100%;\\n}\\n\\n.general td {\\n    padding: 4px;\\n    vertical-align: top;\\n}\\n\\n.general .first {\\n    width: 25%;\\n}\\n\\nh1 {\\n    margin: 0;\\n    color: #333333;\\n}\\n</style>\\n</head>\\n<body>\\n<h1>Allgemein</h1>\\n<table class=\\\"general\\\">\\n<tbody>\\n<tr>\\n<td class=\\\"first\\\">Name:</td>\\n<td>[[ customer.salutation ]] [[ customer.firstname ]] [[ customer.lastname ]]</td>\\n</tr>\\n<tr>\\n<td class=\\\"first\\\">Geburtsdatum:</td>\\n<td>[[ customer.birthday ? customer.birthday|date(\'d.m.Y\') : \'\' ]]</td>\\n</tr>\\n<tr>\\n<td class=\\\"first\\\">Bemerkung:</td>\\n<td>[[ customer.remarkF ]]</td>\\n</tr>\\n</tbody>\\n</table>\\n<h1>Adressen</h1>\\n<div data-repeat=\\\"customer.customerAddresses\\\" data-repeat-as=\\\"address\\\">\\n<h6 class=\\\"panel-title\\\">[[ \'customer.contact\'|trans ]] ([[ address.type|trans ]])</h6>\\n<table class=\\\"general\\\">\\n<tbody>\\n<tr data-if=\\\"address.company\\\">\\n<td class=\\\"first\\\">[[ \'customer.company\'|trans ]]:</tdâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, true], \"templateType\": [null, \"TemplateType#11\"]}',NULL),(15,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','4','create','{\"name\": [null, \"PDF Rechnung\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n<style>\\ntable {\\n  border-spacing: 0;\\n  border-collapse: collapse; \\n}\\ntable th,td {\\n  padding-right: 5px;\\n  padding-left: 5px;\\n}\\n</style>\\n</head>\\n<body>\\n<p style=\\\"text-align: center;\\\"><span style=\\\"font-size: 18pt; font-family: arial, helvetica, sans-serif;\\\"><strong>Unterkunft zum sonnigen GemÃ¼t</strong></span></p>\\n<p style=\\\"text-align: right;\\\"><span style=\\\"font-family: arial, helvetica, sans-serif;\\\"><span style=\\\"font-size: 10pt;\\\">Inhaber: Max Mustermann<br /></span><span style=\\\"font-size: 10pt;\\\">MusterstraÃŸe 12, </span><span style=\\\"font-size: 10pt;\\\">12345 Musterhause</span></span><br /><span style=\\\"font-size: 10pt; font-family: arial, helvetica, sans-serif;\\\">Telefon: 123456 789, Mobil: 987654321</span></p>\\n<p><span style=\\\"font-size: 16pt; font-family: arial, helvetica, sans-serif;\\\"><strong>Rechnung</strong></span></p>\\n<p><span style=\\\"font-size: 10pt; font-family: arial, helvetica, sans-serif;\\\">[[invoice.firstname]] [[invoice.lastname]]<br />[[invoice.companâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, true], \"templateType\": [null, \"TemplateType#8\"]}',NULL),(16,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','5','create','{\"name\": [null, \"Housekeeping Tagesansicht\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n\\n    <h2>[[ \'housekeeping.title\'|trans({}, \'Housekâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"L\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, true], \"templateType\": [null, \"TemplateType#1\"]}',NULL),(17,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','6','create','{\"name\": [null, \"Housekeeping Wochenansicht\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n\\n    <h2>Wochenbelegung ([[ simple.meta.periodLabeâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"L\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#1\"]}',NULL),(18,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','7','create','{\"name\": [null, \"Rezeption Checkliste\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .checkbox { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; }\\n        .section-title { font-weight: bold; margin: 14px 0 6px; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</divâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#1\"]}',NULL),(19,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','8','create','{\"name\": [null, \"Mahlzeiten\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .room { font-weight: bold; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n    \\n    <h2>â€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#1\"]}',NULL),(20,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','9','create','{\"name\": [null, \"Monatsreport Kennzahlen\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n\\n    <h2>Monatsreport Auslastâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#1\"]}',NULL),(21,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','10','create','{\"name\": [null, \"Monatsabrechnung Beherbergungsabgaben\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #e8eef2; text-align: left; }\\n        .text-right { text-align: right; }\\n        .muted { color: #666; font-size: 11px; }\\n        .section-title { background: #2e6c80; color: #fff; padding: 6px 8px; margin-top: 14px; font-weight: bold; }\\n        .totals-row { background: #f0f4f7; font-weight: bold; }\\n        .empty-cell { color: #999; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\">\\n        <div class=\\\"muted\\\" style=\\\"text-align: center;\\\">\\n            [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] |\\n            [[ simple.meta.periodLabel ]] |\\n            Erzeugt [[ simple.meta.generatedAt ]]\\n        </div>\\n    </div>\\n    â€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#1\"]}',NULL),(22,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','11','create','{\"name\": [null, \"PDF Meldeschein\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body {\\n            font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif;\\n            font-size: 10pt;\\n            color: #333;\\n            margin: 0;\\n            padding: 20px 30px;\\n            line-height: 1.4;\\n        }\\n        h1 {\\n            font-size: 16pt;\\n            font-weight: 600;\\n            margin: 0 0 4px;\\n            color: #1a1a1a;\\n            letter-spacing: 0.3px;\\n        }\\n        .subtitle {\\n            font-size: 9pt;\\n            color: #888;\\n            margin: 0 0 18px;\\n            padding-bottom: 10px;\\n            border-bottom: 2px solid #2c3e50;\\n        }\\n        .section-header {\\n            font-size: 9pt;\\n            font-weight: 700;\\n            text-transform: uppercase;\\n            letter-spacing: 0.8px;\\n            color: #2c3e50;\\n            margin: 16px 0 6px;\\n            padding: 4px 0;\\n            border-bottom: 1px solid #2c3e50;\\n        }\\n        table {\\n         â€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, true], \"templateType\": [null, \"TemplateType#2\"]}',NULL),(23,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','12','create','{\"name\": [null, \"E-Mail Vorlage fÃ¼r Reservierungen\"], \"text\": [null, \"<!DOCTYPE html>\\n<html>\\n<head>\\n</head>\\n<body>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 10pt;\\\">Sehr geehrte/r [[reservation1.booker.salutation]] [[reservation1.booker.lastname]],</span></p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 10pt;\\\">wir bedanken uns fÃ¼r Ihre Buchung. Im Anhang erhalten Sie die ZimmerreservierungsbestÃ¤tigung mit <strong>allen wichtigen Informationen</strong>.</span></p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 10pt;\\\">Mit freundlichen GrÃ¼ÃŸen</span></p>\\n</body>\\n</html>\\n\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, true], \"templateType\": [null, \"TemplateType#6\"]}',NULL),(24,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\Template','13','create','{\"name\": [null, \"PDF Vorlage fÃ¼r Reservierungen\"], \"text\": [null, \"<style>\\n    table {\\n    border-spacing: 0;\\n    border-collapse: collapse; \\n    }\\n    table th,td {\\n    padding-right: 5px;\\n    padding-left: 5px;\\n    }\\n</style>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Mein Hotel</span><br /><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">HotelstraÃŸe 1</span><br /><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">123456 Hotelhausen</span></p>\\n<p> </p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br />[[address.address]]<br />[[address.zip]] [[address.city]]</span></p>\\n<p> </p>\\n<p> </p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\"><strong>ReservierungsbestÃ¤tigung</strong></span></p>\\n<table style=\\\"width: 100%;\\\">\\n<tbody>\\n<tr style=\\\"background-color: #ced4d9;\\\">\\n<th style=\\\"border-bottom: 1px solid #333333; texâ€¦(truncated)\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"isDefault\": [null, true], \"templateType\": [null, \"TemplateType#9\"]}',NULL),(25,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\GuestCategory','2','create','{\"name\": [null, \"Kind 6â€“17\"], \"active\": [null, true], \"maxAge\": [null, 17], \"minAge\": [null, 6], \"acronym\": [null, \"K6-17\"], \"sortOrder\": [null, 20], \"systemCode\": [null, \"default_child\"], \"statisticalGroup\": [null, \"child\"], \"isCountedInOccupancy\": [null, true]}',NULL),(26,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\GuestCategory','3','create','{\"name\": [null, \"Kleinkind 0â€“5\"], \"active\": [null, true], \"maxAge\": [null, 5], \"minAge\": [null, 0], \"acronym\": [null, \"BABY\"], \"sortOrder\": [null, 30], \"systemCode\": [null, \"default_infant\"], \"statisticalGroup\": [null, \"infant\"], \"isCountedInOccupancy\": [null, false]}',NULL),(27,NULL,NULL,'2026-09-14 05:58:31','App\\Entity\\GuestCategory','4','create','{\"name\": [null, \"Nichtpflichtige Personen\"], \"active\": [null, true], \"acronym\": [null, \"NP\"], \"sortOrder\": [null, 40], \"systemCode\": [null, \"default_exempt\"], \"statisticalGroup\": [null, \"other\"], \"isCountedInOccupancy\": [null, true]}',NULL),(28,1,'timothy','2026-09-14 06:34:31','App\\Entity\\Subsidiary','1','update','{\"name\": [\"Lanka IOC Guest House\", \"Trincomalee - Guest House\"], \"description\": [\"\", \"Guest house at Trincomalee\"]}','127.0.0.1'),(29,1,'timothy','2026-09-14 06:34:50','App\\Entity\\Subsidiary','2','create','{\"name\": [null, \"Colombo - Guest House\"], \"description\": [null, \"Guest house at Colombo\"]}','127.0.0.1'),(30,1,'timothy','2026-09-15 06:07:16','App\\Entity\\RoomCategory','1','create','{\"name\": [null, \"Single Expat Room\"], \"acronym\": [null, \"SER\"], \"details\": [null, \"Single-occupancy room for an expatriate officer\"], \"minFullPayers\": [null, 1]}','127.0.0.1'),(31,1,'timothy','2026-09-15 06:07:47','App\\Entity\\RoomCategory','2','create','{\"name\": [null, \"Double/Family Room\"], \"acronym\": [null, \"DFR\"], \"details\": [null, \"Room for an expatriate officer with an accompanying family member\"], \"minFullPayers\": [null, 2]}','127.0.0.1'),(32,1,'timothy','2026-09-15 06:08:51','App\\Entity\\Appartment','1','create','{\"uuid\": [null, \"UuidV4\"], \"active\": [null, true], \"number\": [null, \"COL-101\"], \"object\": [null, \"Subsidiary#1\"], \"beds_max\": [null, 1], \"description\": [null, \"LIOC Guest House â€“ Colombo\"], \"roomCategory\": [null, \"RoomCategory#1\"], \"multipleOccupancy\": [null, false]}','127.0.0.1'),(33,1,'timothy','2026-09-15 06:08:51','App\\Entity\\CalendarSync','1','create','{\"uuid\": [null, \"UuidV4\"], \"isPublic\": [null, false], \"apartment\": [null, \"Appartment#1\"], \"exportGuestName\": [null, false]}','127.0.0.1'),(34,1,'timothy','2026-09-15 06:10:42','App\\Entity\\Appartment','2','create','{\"uuid\": [null, \"UuidV4\"], \"active\": [null, true], \"number\": [null, \"COL-102\"], \"object\": [null, \"Subsidiary#1\"], \"beds_max\": [null, 1], \"description\": [null, \"LIOC Guest House â€“ Colombo\"], \"roomCategory\": [null, \"RoomCategory#1\"], \"multipleOccupancy\": [null, false]}','127.0.0.1'),(35,1,'timothy','2026-09-15 06:10:42','App\\Entity\\CalendarSync','2','create','{\"uuid\": [null, \"UuidV4\"], \"isPublic\": [null, false], \"apartment\": [null, \"Appartment#2\"], \"exportGuestName\": [null, false]}','127.0.0.1'),(36,1,'timothy','2026-09-15 06:11:13','App\\Entity\\Appartment','3','create','{\"uuid\": [null, \"UuidV4\"], \"active\": [null, true], \"number\": [null, \"COL-201\"], \"object\": [null, \"Subsidiary#1\"], \"beds_max\": [null, 2], \"description\": [null, \"LIOC Guest House â€“ Colombo\"], \"roomCategory\": [null, \"RoomCategory#2\"], \"multipleOccupancy\": [null, false]}','127.0.0.1'),(37,1,'timothy','2026-09-15 06:11:13','App\\Entity\\CalendarSync','3','create','{\"uuid\": [null, \"UuidV4\"], \"isPublic\": [null, false], \"apartment\": [null, \"Appartment#3\"], \"exportGuestName\": [null, false]}','127.0.0.1'),(38,1,'timothy','2026-09-15 06:11:40','App\\Entity\\Appartment','4','create','{\"uuid\": [null, \"UuidV4\"], \"active\": [null, true], \"number\": [null, \"TRI-101\"], \"object\": [null, \"Subsidiary#1\"], \"beds_max\": [null, 1], \"description\": [null, \"LIOC Guest House â€“ Trincomalee\"], \"roomCategory\": [null, \"RoomCategory#1\"], \"multipleOccupancy\": [null, false]}','127.0.0.1'),(39,1,'timothy','2026-09-15 06:11:40','App\\Entity\\CalendarSync','4','create','{\"uuid\": [null, \"UuidV4\"], \"isPublic\": [null, false], \"apartment\": [null, \"Appartment#4\"], \"exportGuestName\": [null, false]}','127.0.0.1'),(40,1,'timothy','2026-09-15 06:13:11','App\\Entity\\Appartment','5','create','{\"uuid\": [null, \"UuidV4\"], \"active\": [null, true], \"number\": [null, \"TRI-102\"], \"object\": [null, \"Subsidiary#1\"], \"beds_max\": [null, 1], \"description\": [null, \"LIOC Guest House â€“ Trincomalee\"], \"roomCategory\": [null, \"RoomCategory#1\"], \"multipleOccupancy\": [null, false]}','127.0.0.1'),(41,1,'timothy','2026-09-15 06:13:11','App\\Entity\\CalendarSync','5','create','{\"uuid\": [null, \"UuidV4\"], \"isPublic\": [null, false], \"apartment\": [null, \"Appartment#5\"], \"exportGuestName\": [null, false]}','127.0.0.1'),(42,1,'timothy','2026-09-15 06:14:32','App\\Entity\\Appartment','6','create','{\"uuid\": [null, \"UuidV4\"], \"active\": [null, true], \"number\": [null, \"TRI-201\"], \"object\": [null, \"Subsidiary#1\"], \"beds_max\": [null, 2], \"description\": [null, \"LIOC Guest House â€“ Trincomalee\"], \"roomCategory\": [null, \"RoomCategory#2\"], \"multipleOccupancy\": [null, false]}','127.0.0.1'),(43,1,'timothy','2026-09-15 06:14:32','App\\Entity\\CalendarSync','6','create','{\"uuid\": [null, \"UuidV4\"], \"isPublic\": [null, false], \"apartment\": [null, \"Appartment#6\"], \"exportGuestName\": [null, false]}','127.0.0.1'),(44,1,'timothy','2026-09-15 06:15:16','App\\Entity\\Appartment','3','update','{\"description\": [\"LIOC Guest House â€“ Colombo\", \"Company-provided residential accommodation for Lanka IOC expatriate officers.\"]}','127.0.0.1'),(45,1,'timothy','2026-09-15 06:15:25','App\\Entity\\Appartment','1','update','{\"description\": [\"LIOC Guest House â€“ Colombo\", \"Company-provided residential accommodation for Lanka IOC expatriate officers.\"]}','127.0.0.1'),(46,1,'timothy','2026-09-15 06:15:34','App\\Entity\\Appartment','2','update','{\"description\": [\"LIOC Guest House â€“ Colombo\", \"Company-provided residential accommodation for Lanka IOC expatriate officers.\"]}','127.0.0.1'),(47,1,'timothy','2026-09-15 06:15:52','App\\Entity\\Appartment','4','update','{\"description\": [\"LIOC Guest House â€“ Trincomalee\", \"Company-provided residential accommodation for Lanka IOC expatriate officers.\"]}','127.0.0.1'),(48,1,'timothy','2026-09-15 06:16:00','App\\Entity\\Appartment','5','update','{\"description\": [\"LIOC Guest House â€“ Trincomalee\", \"Company-provided residential accommodation for Lanka IOC expatriate officers.\"]}','127.0.0.1'),(49,1,'timothy','2026-09-15 06:16:09','App\\Entity\\Appartment','6','update','{\"description\": [\"LIOC Guest House â€“ Trincomalee\", \"Company-provided residential accommodation for Lanka IOC expatriate officers.\"]}','127.0.0.1'),(50,1,'timothy','2026-09-15 06:17:26','App\\Entity\\GuestCategory','1','update','{\"name\": [\"Erwachsene\", \"Adult\"]}','127.0.0.1'),(51,1,'timothy','2026-09-15 06:18:22','App\\Entity\\GuestCategory','1','update','{\"acronym\": [\"ERW\", \"ADL\"]}','127.0.0.1'),(52,1,'timothy','2026-09-15 06:18:56','App\\Entity\\GuestCategory','2','update','{\"name\": [\"Kind 6â€“17\", \"Child\"], \"acronym\": [\"K6-17\", \"CHD\"]}','127.0.0.1'),(53,1,'timothy','2026-09-15 06:19:10','App\\Entity\\GuestCategory','3','update','{\"name\": [\"Kleinkind 0â€“5\", \"Baby\"]}','127.0.0.1'),(54,1,'timothy','2026-09-15 06:19:31','App\\Entity\\GuestCategory','3','update','{\"name\": [\"Baby\", \"Infant\"], \"acronym\": [\"BABY\", \"INF\"]}','127.0.0.1'),(55,1,'timothy','2026-09-15 06:19:37','App\\Entity\\GuestCategory','4','delete','{\"id\": [4, null], \"name\": [\"Nichtpflichtige Personen\", null], \"active\": [true, null], \"acronym\": [\"NP\", null], \"sortOrder\": [40, null], \"systemCode\": [\"default_exempt\", null], \"statisticalGroup\": [\"other\", null], \"isCountedInOccupancy\": [true, null]}','127.0.0.1'),(56,1,'timothy','2026-09-15 06:27:49','App\\Entity\\ReservationOrigin','1','create','{\"name\": [null, \"Expatriate Assignment\"]}','127.0.0.1'),(57,1,'timothy','2026-09-15 06:28:09','App\\Entity\\ReservationOrigin','1','update','{\"color\": [null, \"#0029cc\"]}','127.0.0.1'),(58,1,'timothy','2026-09-15 06:28:36','App\\Entity\\ReservationOrigin','2','create','{\"name\": [null, \"Touring Officer Request\"], \"color\": [null, \"#110de7\"]}','127.0.0.1'),(59,1,'timothy','2026-09-15 06:29:31','App\\Entity\\ReservationOrigin','2','update','{\"color\": [\"#110de7\", \"#e21a03\"]}','127.0.0.1'),(60,1,'timothy','2026-09-15 06:30:12','App\\Entity\\ReservationOrigin','3','create','{\"name\": [null, \"Corporate Guest Request\"], \"color\": [null, \"#b418c9\"]}','127.0.0.1'),(61,1,'timothy','2026-09-15 06:30:40','App\\Entity\\ReservationOrigin','4','create','{\"name\": [null, \"Management Allocation\"], \"color\": [null, \"#0aecf0\"]}','127.0.0.1'),(62,1,'timothy','2026-09-15 09:38:51','App\\Entity\\ReservationStatus','2','create','{\"name\": [null, \"Request Received\"], \"color\": [null, \"#a09c9c\"], \"isBlocking\": [null, true], \"contrastColor\": [null, \"#000000\"]}','127.0.0.1'),(63,1,'timothy','2026-09-15 09:39:09','App\\Entity\\ReservationStatus','3','create','{\"name\": [null, \"Approved\"], \"color\": [null, \"#1b00e6\"], \"isBlocking\": [null, true], \"contrastColor\": [null, \"#ffffff\"]}','127.0.0.1'),(64,1,'timothy','2026-09-15 09:39:36','App\\Entity\\ReservationStatus','4','create','{\"name\": [null, \"Room Allocated\"], \"color\": [null, \"#d22dc5\"], \"isBlocking\": [null, true], \"contrastColor\": [null, \"#ffffff\"]}','127.0.0.1'),(65,1,'timothy','2026-09-15 11:42:10','App\\Entity\\AccountingSettings','1','create','{\"updatedAt\": [null, \"2026-09-15T11:42:10+00:00\"], \"dictationCode\": [null, \"WD\"], \"fiscalYearStart\": [null, 1], \"accountNumberLength\": [null, 4]}','127.0.0.1'),(66,1,'timothy','2026-09-15 11:44:10','App\\Entity\\Price','1','create','{\"vat\": [null, 0.0], \"type\": [null, \"2\"], \"price\": [null, \"0.00\"], \"active\": [null, true], \"friday\": [null, true], \"monday\": [null, true], \"sunday\": [null, true], \"allDays\": [null, true], \"minStay\": [null, \"0\"], \"tuesday\": [null, true], \"saturday\": [null, true], \"thursday\": [null, true], \"isPerRoom\": [null, true], \"wednesday\": [null, true], \"allPeriods\": [null, true], \"description\": [null, \"Company-Provided Accommodation\"], \"includesVat\": [null, true], \"isFlatPrice\": [null, false], \"roomCategory\": [null, \"RoomCategory#1\"], \"numberOfPersons\": [null, \"0\"], \"isBookableOnline\": [null, false], \"isMandatoryOnline\": [null, false], \"isDefaultActiveInReservationCreation\": [null, false]}','127.0.0.1'),(67,1,'timothy','2026-09-15 11:44:37','App\\Entity\\Price','2','create','{\"vat\": [null, 0.0], \"type\": [null, \"2\"], \"price\": [null, \"0.00\"], \"active\": [null, true], \"friday\": [null, true], \"monday\": [null, true], \"sunday\": [null, true], \"allDays\": [null, true], \"minStay\": [null, \"0\"], \"tuesday\": [null, true], \"saturday\": [null, true], \"thursday\": [null, true], \"isPerRoom\": [null, true], \"wednesday\": [null, true], \"allPeriods\": [null, true], \"description\": [null, \"Company-Provided Accommodation\"], \"includesVat\": [null, true], \"isFlatPrice\": [null, false], \"roomCategory\": [null, \"RoomCategory#2\"], \"numberOfPersons\": [null, \"0\"], \"isBookableOnline\": [null, false], \"isMandatoryOnline\": [null, false], \"isDefaultActiveInReservationCreation\": [null, false]}','127.0.0.1'),(68,NULL,NULL,'2026-10-21 05:18:29','App\\Entity\\ResetPasswordRequest','1','create','{\"user\": [null, \"User#1\"], \"selector\": [null, \"bFc0pBpMyIn1AbtpnvUR\"], \"expiresAt\": [null, \"2026-10-21T06:18:29+00:00\"], \"hashedToken\": [\"***redacted***\", \"***redacted***\"], \"requestedAt\": [null, \"2026-10-21T05:18:29+00:00\"]}','127.0.0.1'),(69,NULL,NULL,'2026-10-21 05:36:52','App\\Entity\\User','2','create','{\"email\": [null, \"timothy@lankaioc.com\"], \"active\": [null, true], \"lastname\": [null, \"sahan\"], \"password\": [\"***redacted***\", \"***redacted***\"], \"username\": [null, \"timothy_sahan\"], \"firstname\": [null, \"timothy\"], \"themePreference\": [null, \"light\"]}',NULL),(70,2,'timothy_sahan','2026-10-21 09:24:16','App\\Entity\\RoomCategory','1','update','{\"name\": [\"Single Expat Room\", \"Double Occupancy\"], \"acronym\": [\"SER\", \"DBL\"], \"details\": [\"Single-occupancy room for an expatriate officer\", \"Attached bathroom, A/C, Wi-Fi, TV, kettle, tea/coffee and toiletries\"], \"minFullPayers\": [1, 2]}','127.0.0.1'),(71,2,'timothy_sahan','2026-10-21 09:25:49','App\\Entity\\RoomCategory','2','update','{\"name\": [\"Double/Family Room\", \"Single Occupancy\"], \"acronym\": [\"DFR\", \"SGL\"], \"details\": [\"Room for an expatriate officer with an accompanying family member\", \"Attached bathroom, A/C, Wi-Fi, TV, kettle, tea/coffee and toiletries\"], \"minFullPayers\": [2, 1]}','127.0.0.1'),(72,2,'timothy_sahan','2026-10-21 09:44:05','App\\Entity\\Appartment','1','update','{\"number\": [\"COL-101\", \"COL-01\"], \"object\": [\"Subsidiary#1\", \"Subsidiary#2\"], \"beds_max\": [1, 2], \"description\": [\"Company-provided residential accommodation for Lanka IOC expatriate officers.\", \"Permanently allocated to SVP â€“ Lubes\"]}','127.0.0.1'),(73,2,'timothy_sahan','2026-10-21 09:44:35','App\\Entity\\Appartment','2','update','{\"number\": [\"COL-102\", \"COL-02\"], \"object\": [\"Subsidiary#1\", \"Subsidiary#2\"], \"beds_max\": [1, 2], \"description\": [\"Company-provided residential accommodation for Lanka IOC expatriate officers.\", \"General accommodation\"]}','127.0.0.1'),(74,2,'timothy_sahan','2026-10-21 09:45:01','App\\Entity\\Appartment','3','update','{\"number\": [\"COL-201\", \"COL-03\"], \"object\": [\"Subsidiary#1\", \"Subsidiary#2\"], \"description\": [\"Company-provided residential accommodation for Lanka IOC expatriate officers.\", \"Permanently allocated to Managing Director\"], \"roomCategory\": [\"RoomCategory#2\", \"RoomCategory#1\"]}','127.0.0.1'),(75,2,'timothy_sahan','2026-10-21 09:45:28','App\\Entity\\Appartment','4','update','{\"number\": [\"TRI-101\", \"COL-04\"], \"object\": [\"Subsidiary#1\", \"Subsidiary#2\"], \"description\": [\"Company-provided residential accommodation for Lanka IOC expatriate officers.\", \"General accommodation\"], \"roomCategory\": [\"RoomCategory#1\", \"RoomCategory#2\"]}','127.0.0.1'),(76,2,'timothy_sahan','2026-10-21 09:46:34','App\\Entity\\ReservationOrigin','1','update','{\"name\": [\"Expatriate Assignment\", \"HOD Request\"]}','127.0.0.1'),(77,2,'timothy_sahan','2026-10-21 09:46:43','App\\Entity\\ReservationOrigin','2','update','{\"name\": [\"Touring Officer Request\", \"Managing Director Request\"]}','127.0.0.1'),(78,2,'timothy_sahan','2026-10-21 09:47:00','App\\Entity\\ReservationOrigin','3','update','{\"name\": [\"Corporate Guest Request\", \"Admin Entry\"]}','127.0.0.1'),(79,2,'timothy_sahan','2026-10-21 09:47:16','App\\Entity\\ReservationOrigin','4','update','{\"name\": [\"Management Allocation\", \"Permanent Expatriate Allocation\"]}','127.0.0.1'),(80,2,'timothy_sahan','2026-10-21 09:49:06','App\\Entity\\ReservationStatus','2','update','{\"color\": [\"#a09c9c\", \"#fa5700\"], \"contrastColor\": [\"#000000\", \"#ffffff\"]}','127.0.0.1'),(81,2,'timothy_sahan','2026-10-21 09:49:43','App\\Entity\\ReservationStatus','5','create','{\"name\": [null, \"Checked In\"], \"color\": [null, \"#10e074\"], \"isBlocking\": [null, true], \"contrastColor\": [null, \"#000000\"]}','127.0.0.1'),(82,2,'timothy_sahan','2026-10-21 09:49:59','App\\Entity\\ReservationStatus','6','create','{\"name\": [null, \"Checked Out\"], \"color\": [null, \"#545454\"], \"isBlocking\": [null, true], \"contrastColor\": [null, \"#ffffff\"]}','127.0.0.1'),(83,2,'timothy_sahan','2026-10-22 09:28:39','App\\Entity\\Subsidiary','2','update','{\"name\": [\"Colombo - Guest House\", \"Lanka IOC Guest House Colombo 03\"], \"description\": [\"Guest house at Colombo\", \"Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo 03. Tel: +94 11 701 1720.\"]}','127.0.0.1'),(84,2,'timothy_sahan','2026-10-22 09:29:06','App\\Entity\\Workflow','1','update','{\"isEnabled\": [true, false]}','127.0.0.1'),(85,2,'timothy_sahan','2026-10-22 09:29:07','App\\Entity\\Workflow','2','update','{\"isEnabled\": [true, false]}','127.0.0.1'),(86,2,'timothy_sahan','2026-10-22 09:29:22','App\\Entity\\AppSettings','1','update','{\"currency\": [\"EUR\", \"LKR\"], \"mailCopy\": [null, false], \"mailFromName\": [null, \"timothy sahan\"], \"mailFromEmail\": [null, \"timothy@lankaioc.com\"], \"currencySymbol\": [\"â‚¬\", \"Rs.\"], \"smtpEncryption\": [null, \"starttls\"]}','127.0.0.1'),(87,2,'timothy_sahan','2026-10-22 09:29:47','App\\Entity\\AppSettings','1','update','{\"invoiceFilenamePattern\": [\"Invoice-<number>\", \"LIOC-Invoice-<number>\"]}','127.0.0.1'),(88,2,'timothy_sahan','2026-10-22 09:45:18','App\\Entity\\Customer','2','create','{\"idType\": [null, \"customer.id.type.driving_licence\"], \"lastname\": [null, \"Raghu\"], \"firstname\": [null, \"K\"], \"salutation\": [null, \"Mr\"]}','127.0.0.1'),(89,2,'timothy_sahan','2026-10-22 09:45:40','App\\Entity\\Customer','2','update','{\"remark\": [\"\", \"Managing Director; Indian national; permanently allocated to Colombo Room 03.\"]}','127.0.0.1'),(90,2,'timothy_sahan','2026-10-22 09:46:16','App\\Entity\\Customer','3','create','{\"idType\": [null, \"customer.id.type.driving_licence\"], \"remark\": [null, \"SVP (Lubes), Lanka IOC PLC; Indian national; permanently allocated to Colombo Room 01.\"], \"lastname\": [null, \"Raut\"], \"firstname\": [null, \"Prashant\"], \"salutation\": [null, \"Mr\"]}','127.0.0.1'),(91,2,'timothy_sahan','2026-10-22 09:54:10','App\\Entity\\Reservation','1','create','{\"uuid\": [null, \"UuidV4\"], \"booker\": [null, \"Customer#2\"], \"remark\": [null, \"Permanent allocation â€” Managing Director. Review by 22 October 2027.\"], \"endDate\": [null, \"2027-10-22T00:00:00+00:00\"], \"persons\": [null, 1], \"startDate\": [null, \"2026-10-22T00:00:00+00:00\"], \"appartment\": [null, \"Appartment#3\"], \"isConflict\": [null, false], \"guestCounts\": [null, \"array(1)\"], \"kurtaxeWaived\": [null, false], \"reservationDate\": [null, \"2026-10-22T09:54:10+00:00\"], \"adultRuleOverride\": [null, false], \"isConflictIgnored\": [null, false], \"reservationOrigin\": [null, \"ReservationOrigin#4\"], \"reservationStatus\": [null, \"ReservationStatus#5\"]}','127.0.0.1'),(92,2,'timothy_sahan','2026-10-22 10:50:54','App\\Entity\\Reservation','2','create','{\"uuid\": [null, \"UuidV4\"], \"booker\": [null, \"Customer#3\"], \"remark\": [null, \"Permanent allocation â€” SVP (Lubes). Review by 22 October 2027.\"], \"endDate\": [null, \"2027-10-22T00:00:00+00:00\"], \"persons\": [null, 1], \"startDate\": [null, \"2026-10-22T00:00:00+00:00\"], \"appartment\": [null, \"Appartment#1\"], \"isConflict\": [null, false], \"guestCounts\": [null, \"array(1)\"], \"kurtaxeWaived\": [null, false], \"reservationDate\": [null, \"2026-10-22T10:50:54+00:00\"], \"adultRuleOverride\": [null, false], \"isConflictIgnored\": [null, false], \"reservationOrigin\": [null, \"ReservationOrigin#4\"], \"reservationStatus\": [null, \"ReservationStatus#5\"]}','127.0.0.1'),(93,2,'timothy_sahan','2026-10-23 10:44:04','App\\Entity\\RoomDayStatus','1','create','{\"date\": [null, \"2026-10-23T00:00:00+00:00\"], \"hkStatus\": [null, \"IN_PROGRESS\"], \"updatedAt\": [null, \"2026-10-23T10:44:04+00:00\"], \"updatedBy\": [null, \"User#2\"], \"appartment\": [null, \"Appartment#1\"]}','127.0.0.1'),(94,2,'timothy_sahan','2026-10-23 10:52:01','App\\Entity\\Template','12','update','{\"name\": [\"E-Mail Vorlage fÃ¼r Reservierungen\", \"Reservation Email Template\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n</head>\\n<body>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 10pt;\\\">Sehr geehrte/r [[reservation1.booker.salutation]] [[reservation1.booker.lastname]],</span></p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 10pt;\\\">wir bedanken uns fÃ¼r Ihre Buchung. Im Anhang erhalten Sie die ZimmerreservierungsbestÃ¤tigung mit <strong>allen wichtigen Informationen</strong>.</span></p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 10pt;\\\">Mit freundlichen GrÃ¼ÃŸen</span></p>\\n</body>\\n</html>\\n\", \"<p>Dear [[ reservation1.booker.firstname ]], [[ reservation1.booker.lastname ]]</p><p>We have received your accommodation request, Our team will review it and contact you with the booking decision and stay details. </p><p>This email acknowledges your request; it does not confirm a reservation.</p><p>Kind regards,</p><p>Lanka IOC Guest House. </p>\"], \"subject\": [null, \"Accommodation request received â€“ Lanka IOC Guest Housesk\"]}','127.0.0.1'),(95,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryItem','1','create','{\"sku\": [null, \"SAMPLE-INV-TEA\"], \"name\": [null, \"[SAMPLE] Tea packets\"], \"unit\": [null, \"pack\"], \"active\": [null, true], \"reorderLevel\": [null, 6]}',NULL),(96,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','1','create','{\"item\": [null, \"InventoryItem#1\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 20], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"expiresAt\": [null, \"2026-11-06T00:00:00+00:00\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-TEA\"], \"subsidiary\": [null, \"Subsidiary#1\"], \"purchasedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"unitCostMinor\": [null, 45000]}',NULL),(97,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryIssue','1','create','{\"lot\": [null, \"InventoryLot#1\"], \"reason\": [null, \"[SAMPLE] Usage\"], \"issuedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"quantity\": [null, 4]}',NULL),(98,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','2','create','{\"item\": [null, \"InventoryItem#1\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 20], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"expiresAt\": [null, \"2026-11-06T00:00:00+00:00\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-TEA\"], \"subsidiary\": [null, \"Subsidiary#2\"], \"purchasedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"unitCostMinor\": [null, 45000]}',NULL),(99,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryIssue','2','create','{\"lot\": [null, \"InventoryLot#2\"], \"reason\": [null, \"[SAMPLE] Usage\"], \"issuedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"quantity\": [null, 4]}',NULL),(100,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryItem','2','create','{\"sku\": [null, \"SAMPLE-INV-MILK\"], \"name\": [null, \"[SAMPLE] Milk cartons\"], \"unit\": [null, \"carton\"], \"active\": [null, true], \"reorderLevel\": [null, 6]}',NULL),(101,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','3','create','{\"item\": [null, \"InventoryItem#2\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 4], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"expiresAt\": [null, \"2026-11-16T00:00:00+00:00\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-MILK\"], \"subsidiary\": [null, \"Subsidiary#1\"], \"purchasedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"unitCostMinor\": [null, 38000]}',NULL),(102,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','4','create','{\"item\": [null, \"InventoryItem#2\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 4], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"expiresAt\": [null, \"2026-11-16T00:00:00+00:00\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-MILK\"], \"subsidiary\": [null, \"Subsidiary#2\"], \"purchasedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"unitCostMinor\": [null, 38000]}',NULL),(103,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryItem','3','create','{\"sku\": [null, \"SAMPLE-INV-SOAP\"], \"name\": [null, \"[SAMPLE] Bath soap\"], \"unit\": [null, \"bar\"], \"active\": [null, true], \"reorderLevel\": [null, 6]}',NULL),(104,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','5','create','{\"item\": [null, \"InventoryItem#3\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 24], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-SOAP\"], \"subsidiary\": [null, \"Subsidiary#1\"], \"purchasedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"unitCostMinor\": [null, 15000]}',NULL),(105,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryIssue','3','create','{\"lot\": [null, \"InventoryLot#5\"], \"reason\": [null, \"[SAMPLE] Usage\"], \"issuedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"quantity\": [null, 5]}',NULL),(106,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','6','create','{\"item\": [null, \"InventoryItem#3\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 24], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-SOAP\"], \"subsidiary\": [null, \"Subsidiary#2\"], \"purchasedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"unitCostMinor\": [null, 15000]}',NULL),(107,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryIssue','4','create','{\"lot\": [null, \"InventoryLot#6\"], \"reason\": [null, \"[SAMPLE] Usage\"], \"issuedAt\": [null, \"2026-10-27T00:00:00+00:00\"], \"quantity\": [null, 5]}',NULL),(108,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryItem','4','create','{\"sku\": [null, \"SAMPLE-INV-RICE\"], \"name\": [null, \"[SAMPLE] Rice packets\"], \"unit\": [null, \"pack\"], \"active\": [null, true], \"reorderLevel\": [null, 4]}',NULL),(109,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','7','create','{\"item\": [null, \"InventoryItem#4\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 8], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"expiresAt\": [null, \"2026-10-26T00:00:00+00:00\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-RICE\"], \"subsidiary\": [null, \"Subsidiary#1\"], \"purchasedAt\": [null, \"2026-10-17T00:00:00+00:00\"], \"unitCostMinor\": [null, 65000]}',NULL),(110,NULL,NULL,'2026-10-27 10:05:48','App\\Entity\\InventoryLot','8','create','{\"item\": [null, \"InventoryItem#4\"], \"currency\": [null, \"LKR\"], \"quantity\": [null, 8], \"supplier\": [null, \"[SAMPLE] Supplier\"], \"expiresAt\": [null, \"2026-10-26T00:00:00+00:00\"], \"reference\": [null, \"SAMPLE-INVENTORY-V1-RICE\"], \"subsidiary\": [null, \"Subsidiary#2\"], \"purchasedAt\": [null, \"2026-10-17T00:00:00+00:00\"], \"unitCostMinor\": [null, 65000]}',NULL),(111,2,'timothy_sahan','2026-10-27 10:38:22','App\\Entity\\Invoice','1','create','{\"date\": [null, \"2026-10-27T00:00:00+00:00\"], \"number\": [null, \"897978\"], \"status\": [null, 1], \"lastname\": [null, \"Raghu\"], \"firstname\": [null, \"K\"], \"salutation\": [null, \"Mr\"], \"subsidiary\": [null, \"Subsidiary#2\"], \"paymentMeans\": [null, 10]}','127.0.0.1'),(112,2,'timothy_sahan','2026-10-27 10:38:22','App\\Entity\\InvoiceAppartment','1','create','{\"vat\": [null, 0.0], \"beds\": [null, 1], \"price\": [null, \"0.00\"], \"number\": [null, \"COL-03\"], \"endDate\": [null, \"2026-10-30T00:00:00+00:00\"], \"invoice\": [null, \"Invoice#1\"], \"persons\": [null, 1], \"isPerRoom\": [null, true], \"startDate\": [null, \"2026-10-28T00:00:00+00:00\"], \"description\": [null, \"Permanently allocated to Managing Director\"], \"includesVat\": [null, true], \"isFlatPrice\": [null, false]}','127.0.0.1'),(113,2,'timothy_sahan','2026-10-27 10:52:23','App\\Entity\\Template','12','update','{\"text\": [\"<p>Dear [[ reservation1.booker.firstname ]], [[ reservation1.booker.lastname ]]</p><p>We have received your accommodation request, Our team will review it and contact you with the booking decision and stay details. </p><p>This email acknowledges your request; it does not confirm a reservation.</p><p>Kind regards,</p><p>Lanka IOC Guest House. </p>\", \"<p>Dear [[ reservation1.booker.firstname ]], [[ reservation1.booker.lastname ]]</p><p>We have received your accommodation request, Our team will review it and contact you with the booking decision and stay details.</p><p>This email acknowledges your request; it does not confirm a reservation.</p><p>Kind regards,</p><p>Lanka IOC Guest House.</p>\"]}','127.0.0.1'),(114,2,'timothy_sahan','2026-10-27 11:08:36','App\\Entity\\Template','13','update','{\"name\": [\"PDF Vorlage fÃ¼r Reservierungen\", \"Lanka IOC â€“ Reservation Confirmation\"], \"text\": [\"<style>\\n    table {\\n    border-spacing: 0;\\n    border-collapse: collapse; \\n    }\\n    table th,td {\\n    padding-right: 5px;\\n    padding-left: 5px;\\n    }\\n</style>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Mein Hotel</span><br /><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">HotelstraÃŸe 1</span><br /><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">123456 Hotelhausen</span></p>\\n<p> </p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br />[[address.address]]<br />[[address.zip]] [[address.city]]</span></p>\\n<p> </p>\\n<p> </p>\\n<p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\"><strong>ReservierungsbestÃ¤tigung</strong></span></p>\\n<table style=\\\"width: 100%;\\\">\\n<tbody>\\n<tr style=\\\"background-color: #ced4d9;\\\">\\n<th style=\\\"border-bottom: 1px solid #333333; texâ€¦(truncated)\", \"<style>\\n    table {\\n    border-spacing: 0;\\n    border-collapse: collapse; \\n    }\\n    table th,td {\\n    padding-right: 5px;\\n    padding-left: 5px;\\n    }\\n</style><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Lanka IOC Guest House Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">+94 11 7011 720</span></p><p></p><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br>[[address.address]]<br>[[address.zip]] [[address.city]]</span></p><p></p><p></p><p>Reservation Confirmation</p><table style=\\\"width: 100%;\\\"><colgroup><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col stâ€¦(truncated)\"]}','127.0.0.1'),(115,2,'timothy_sahan','2026-10-27 11:09:12','App\\Entity\\Template','13','update','{\"text\": [\"<style>\\n    table {\\n    border-spacing: 0;\\n    border-collapse: collapse; \\n    }\\n    table th,td {\\n    padding-right: 5px;\\n    padding-left: 5px;\\n    }\\n</style><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Lanka IOC Guest House Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">+94 11 7011 720</span></p><p></p><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br>[[address.address]]<br>[[address.zip]] [[address.city]]</span></p><p></p><p></p><p>Reservation Confirmation</p><table style=\\\"width: 100%;\\\"><colgroup><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col stâ€¦(truncated)\", \"<style>\\n    table {\\n    border-spacing: 0;\\n    border-collapse: collapse; \\n    }\\n    table th,td {\\n    padding-right: 5px;\\n    padding-left: 5px;\\n    }\\n</style><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Lanka IOC Guest House Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">+94 11 7011 720</span></p><p></p><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br>[[address.address]]<br>[[address.zip]] [[address.city]]</span></p><p></p><p></p><p>Reservation Confirmation</p><table style=\\\"width: 100%;\\\"><colgroup><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col stâ€¦(truncated)\"]}','127.0.0.1'),(116,2,'timothy_sahan','2026-10-27 11:35:16','App\\Entity\\Template','13','update','{\"text\": [\"<style>\\n    table {\\n    border-spacing: 0;\\n    border-collapse: collapse; \\n    }\\n    table th,td {\\n    padding-right: 5px;\\n    padding-left: 5px;\\n    }\\n</style><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Lanka IOC Guest House Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">+94 11 7011 720</span></p><p></p><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br>[[address.address]]<br>[[address.zip]] [[address.city]]</span></p><p></p><p></p><p>Reservation Confirmation</p><table style=\\\"width: 100%;\\\"><colgroup><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col stâ€¦(truncated)\", \"<style>\\n    table {\\n    border-spacing: 0;\\n    border-collapse: collapse; \\n    }\\n    table th,td {\\n    padding-right: 5px;\\n    padding-left: 5px;\\n    }\\n</style><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Lanka IOC Guest House Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo - 03</span><br><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">+94 11 7011 720</span></p><p></p><p><span style=\\\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\\\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br>[[address.address]]<br>[[address.zip]] [[address.city]]</span></p><p></p><p></p><p>Reservation Confirmation</p><table style=\\\"width: 100%;\\\"><colgroup><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col style=\\\"min-width: 25px;\\\"><col stâ€¦(truncated)\"]}','127.0.0.1'),(117,2,'timothy_sahan','2026-10-27 11:40:26','App\\Entity\\Template','14','create','{\"name\": [null, \"Lanka IOC - Arrival Information\"], \"text\": [null, \"<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>We look forward to welcoming you to the Lanka IOC Guest House.</p><p>Please refer to your reservation confirmation for your guest house, room, and stay dates.</p><p>If your arrival plans change or you have any questions before your stay, please contact the guest house.</p><p>Kind regards,</p><p>Lanka IOC Guest House.</p>\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"subject\": [null, \"Information for your upcoming stay â€“ Lanka IOC Guest House\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#6\"]}','127.0.0.1'),(118,2,'timothy_sahan','2026-10-28 06:28:26','App\\Entity\\Template','15','create','{\"name\": [null, \"Lanka IOC - Reservation Updated\"], \"text\": [null, \"<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]], </p><p>Your accommadation reservation has been updated.</p><p>Please find the updated reservation confirmation attached. Review the details and contact the guest house if you have any questions.</p><p>Kind regards,</p><p>Lanka IOC Guest House</p>\"], \"hidden\": [null, false], \"params\": [null, \"{\\\"format\\\":\\\"A4\\\",\\\"orientation\\\":\\\"P\\\",\\\"marginLeft\\\":25,\\\"marginRight\\\":20,\\\"marginTop\\\":20,\\\"marginBottom\\\":20,\\\"marginHeader\\\":9,\\\"marginFooter\\\":9}\"], \"subject\": [null, \"Your reservation has been updated â€“ Lanka IOC Guest House\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#6\"]}','127.0.0.1'),(119,2,'timothy_sahan','2026-10-28 06:51:43','App\\Entity\\Template','11','update','{\"name\": [\"PDF Meldeschein\", \"Lanka IOC - Guest Registration Form\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body {\\n            font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif;\\n            font-size: 10pt;\\n            color: #333;\\n            margin: 0;\\n            padding: 20px 30px;\\n            line-height: 1.4;\\n        }\\n        h1 {\\n            font-size: 16pt;\\n            font-weight: 600;\\n            margin: 0 0 4px;\\n            color: #1a1a1a;\\n            letter-spacing: 0.3px;\\n        }\\n        .subtitle {\\n            font-size: 9pt;\\n            color: #888;\\n            margin: 0 0 18px;\\n            padding-bottom: 10px;\\n            border-bottom: 2px solid #2c3e50;\\n        }\\n        .section-header {\\n            font-size: 9pt;\\n            font-weight: 700;\\n            text-transform: uppercase;\\n            letter-spacing: 0.8px;\\n            color: #2c3e50;\\n            margin: 16px 0 6px;\\n            padding: 4px 0;\\n            border-bottom: 1px solid #2c3e50;\\n        }\\n        table {\\n         â€¦(truncated)\", \"<style>\\n        body {\\n            font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif;\\n            font-size: 10pt;\\n            color: #333;\\n            margin: 0;\\n            padding: 20px 30px;\\n            line-height: 1.4;\\n        }\\n        h1 {\\n            font-size: 16pt;\\n            font-weight: 600;\\n            margin: 0 0 4px;\\n            color: #1a1a1a;\\n            letter-spacing: 0.3px;\\n        }\\n        .subtitle {\\n            font-size: 9pt;\\n            color: #888;\\n            margin: 0 0 18px;\\n            padding-bottom: 10px;\\n            border-bottom: 2px solid #2c3e50;\\n        }\\n        .section-header {\\n            font-size: 9pt;\\n            font-weight: 700;\\n            text-transform: uppercase;\\n            letter-spacing: 0.8px;\\n            color: #2c3e50;\\n            margin: 16px 0 6px;\\n            padding: 4px 0;\\n            border-bottom: 1px solid #2c3e50;\\n        }\\n        table {\\n            width: 100%;\\n            border-collapse: collapse;\\n      â€¦(truncated)\"]}','127.0.0.1'),(120,2,'timothy_sahan','2026-10-28 07:02:27','App\\Entity\\Template','5','update','{\"name\": [\"Housekeeping Tagesansicht\", \"Lanka IOC - Daily House Keepig\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n\\n    <h2>[[ \'housekeeping.title\'|trans({}, \'Housekâ€¦(truncated)\", \"<style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style><div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\\\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated[[ simple.meta.generatedAt ]]</p></div></div><div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\"><p>Page {PAGENO} of {nbpg}</p></div></div><p>Lanka IOC Guest House</p><p></p><h2>[[ \'housekeeping.title\'|trans({}, \'Housekeeping\') ]] ([[ simple.views.hoâ€¦(truncated)\"]}','127.0.0.1'),(121,2,'timothy_sahan','2026-10-28 07:02:45','App\\Entity\\Template','5','update','{\"text\": [\"<style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style><div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\\\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated[[ simple.meta.generatedAt ]]</p></div></div><div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\"><p>Page {PAGENO} of {nbpg}</p></div></div><p>Lanka IOC Guest House</p><p></p><h2>[[ \'housekeeping.title\'|trans({}, \'Housekeeping\') ]] ([[ simple.views.hoâ€¦(truncated)\", \"<style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style><div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\\\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</p></div></div><div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\"><p>Page {PAGENO} of {nbpg}</p></div></div><p>Lanka IOC Guest House</p><p></p><h2>[[ \'housekeeping.title\'|trans({}, \'Housekeeping\') ]] ([[ simple.views.hâ€¦(truncated)\"]}','127.0.0.1'),(122,2,'timothy_sahan','2026-10-28 08:36:39','App\\Entity\\Template','6','update','{\"name\": [\"Housekeeping Wochenansicht\", \"Lanka IOC - Weekly Housekeeping Report\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n\\n    <h2>Wochenbelegung ([[ simple.meta.periodLabeâ€¦(truncated)\", \"<style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style><div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\\\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</p></div></div><div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\"><p>Page {PAGENO} of {nbpg}</p></div></div><h2>Weekly Housekeeping Report ([[ simple.meta.periodLabel ]])</h2><table style=\\\"min-width: 50px;\\\"><colgroup><â€¦(truncated)\"]}','127.0.0.1'),(123,2,'timothy_sahan','2026-10-28 09:35:58','App\\Entity\\Template','7','update','{\"name\": [\"Rezeption Checkliste\", \"Lanka IOC - Front Desk Checklist\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .checkbox { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; }\\n        .section-title { font-weight: bold; margin: 14px 0 6px; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</divâ€¦(truncated)\", \"<style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .checkbox { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; }\\n        .section-title { font-weight: bold; margin: 14px 0 6px; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style><div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\\\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | generated [[ simple.meta.generatedAt ]]</p></div></div><div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-aâ€¦(truncated)\"]}','127.0.0.1'),(124,NULL,NULL,'2026-10-28 10:56:06','App\\Entity\\MealOption','1','create','{\"name\": [null, \"Breakfast\"], \"active\": [null, true], \"service\": [null, \"Breakfast\"], \"taxRate\": [null, \"0\"], \"currency\": [null, \"LKR\"], \"priceMinor\": [null, 80000], \"includesTax\": [null, true]}',NULL),(125,NULL,NULL,'2026-10-28 10:56:06','App\\Entity\\MealOption','2','create','{\"name\": [null, \"Vegetarian\"], \"active\": [null, true], \"service\": [null, \"Lunch\"], \"taxRate\": [null, \"0\"], \"currency\": [null, \"LKR\"], \"priceMinor\": [null, 150000], \"includesTax\": [null, true]}',NULL),(126,NULL,NULL,'2026-10-28 10:56:06','App\\Entity\\MealOption','3','create','{\"name\": [null, \"Non-vegetarian\"], \"active\": [null, true], \"service\": [null, \"Lunch\"], \"taxRate\": [null, \"0\"], \"currency\": [null, \"LKR\"], \"priceMinor\": [null, 175000], \"includesTax\": [null, true]}',NULL),(127,NULL,NULL,'2026-10-28 10:56:06','App\\Entity\\MealOption','4','create','{\"name\": [null, \"Vegetarian\"], \"active\": [null, true], \"service\": [null, \"Dinner\"], \"taxRate\": [null, \"0\"], \"currency\": [null, \"LKR\"], \"priceMinor\": [null, 150000], \"includesTax\": [null, true]}',NULL),(128,NULL,NULL,'2026-10-28 10:56:06','App\\Entity\\MealOption','5','create','{\"name\": [null, \"Non-vegetarian\"], \"active\": [null, true], \"service\": [null, \"Dinner\"], \"taxRate\": [null, \"0\"], \"currency\": [null, \"LKR\"], \"priceMinor\": [null, 175000], \"includesTax\": [null, true]}',NULL),(129,NULL,NULL,'2026-10-28 10:56:06','App\\Entity\\MealOption','6','create','{\"name\": [null, \"Plain tea or coffee\"], \"active\": [null, true], \"service\": [null, \"Tea and coffee\"], \"taxRate\": [null, \"0\"], \"currency\": [null, \"LKR\"], \"priceMinor\": [null, 8000], \"includesTax\": [null, true]}',NULL),(130,NULL,NULL,'2026-10-28 10:56:06','App\\Entity\\MealOption','7','create','{\"name\": [null, \"Milk tea or coffee\"], \"active\": [null, true], \"service\": [null, \"Tea and coffee\"], \"taxRate\": [null, \"0\"], \"currency\": [null, \"LKR\"], \"priceMinor\": [null, 10000], \"includesTax\": [null, true]}',NULL),(131,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','16','create','{\"name\": [null, \"Lanka IOC - Reservation Confirmation Email\"], \"text\": [null, \"<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>Thank you for your booking. Your reservation has been confirmed.</p><p>Please find your reservation confirmation attached, with the details of your stay.</p><p>Kind regards,<br>Lanka IOC Guest House</p>\"], \"hidden\": [null, false], \"subject\": [null, \"Your reservation is confirmed - Lanka IOC Guest House\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#6\"]}',NULL),(132,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','17','create','{\"name\": [null, \"Lanka IOC - Reservation Cancellation Email\"], \"text\": [null, \"<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>Your reservation has been cancelled. Please contact us if you have any questions.</p><p>Kind regards,<br>Lanka IOC Guest House</p>\"], \"hidden\": [null, false], \"subject\": [null, \"Reservation cancellation - Lanka IOC Guest House\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#6\"]}',NULL),(133,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','18','create','{\"name\": [null, \"Lanka IOC - Invoice Email\"], \"text\": [null, \"<p>Dear [[ invoice.firstname ]] [[ invoice.lastname ]],</p><p>Please find your invoice attached. Thank you for staying with us.</p><p>Kind regards,<br>Lanka IOC Guest House</p>\"], \"hidden\": [null, false], \"subject\": [null, \"Your invoice - Lanka IOC Guest House\"], \"isDefault\": [null, false], \"templateType\": [null, \"TemplateType#3\"]}',NULL),(134,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','1','update','{\"name\": [\"PDF Buchungsjournal\", \"Lanka IOC - Cash Book\"], \"text\": [\"<!DOCTYPE html>\\n<html lang=\\\"de\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style type=\\\"text/css\\\">\\n        body {\\n            font-family: arial, helvetica, sans-serif;\\n            font-size: 8pt;\\n            color: #24323f;\\n        }\\n\\n        .header-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            margin-bottom: 14px;\\n            border-bottom: 2px solid #17364d;\\n        }\\n\\n        .header-title {\\n            font-size: 18pt;\\n            font-weight: bold;\\n            color: #17364d;\\n            padding-bottom: 8px;\\n        }\\n\\n        .header-period {\\n            text-align: right;\\n            font-size: 10pt;\\n            color: #4b5d6b;\\n            vertical-align: bottom;\\n            padding-bottom: 10px;\\n        }\\n\\n        .journal-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            table-layout: fixed;\\n        }\\n\\n        .journal-table th {\\n            background: #17364d;\\n            color: #ffffff;\\n            font-sâ€¦(truncated)\", \"<!DOCTYPE html>\\n<html lang=\\\"de\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style type=\\\"text/css\\\">\\n        body {\\n            font-family: arial, helvetica, sans-serif;\\n            font-size: 8pt;\\n            color: #24323f;\\n        }\\n\\n        .header-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            margin-bottom: 14px;\\n            border-bottom: 2px solid #17364d;\\n        }\\n\\n        .header-title {\\n            font-size: 18pt;\\n            font-weight: bold;\\n            color: #17364d;\\n            padding-bottom: 8px;\\n        }\\n\\n        .header-period {\\n            text-align: right;\\n            font-size: 10pt;\\n            color: #4b5d6b;\\n            vertical-align: bottom;\\n            padding-bottom: 10px;\\n        }\\n\\n        .journal-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            table-layout: fixed;\\n        }\\n\\n        .journal-table th {\\n            background: #17364d;\\n            color: #ffffff;\\n            font-sâ€¦(truncated)\"]}',NULL),(135,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','2','update','{\"name\": [\"Buchungsjournal\", \"Lanka IOC - Booking Journal\"], \"text\": [\"<!DOCTYPE html>\\n<html lang=\\\"de\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style type=\\\"text/css\\\">\\n        body {\\n            font-family: Arial, Helvetica, sans-serif;\\n            font-size: 9pt;\\n            color: #24323f;\\n        }\\n\\n        .page {\\n            position: relative;\\n        }\\n\\n        .header-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            margin-bottom: 14px;\\n            border-bottom: 2px solid #17364d;\\n        }\\n\\n        .header-title {\\n            font-size: 18pt;\\n            font-weight: bold;\\n            color: #17364d;\\n            padding-bottom: 8px;\\n        }\\n\\n        .header-period {\\n            text-align: right;\\n            font-size: 10pt;\\n            color: #4b5d6b;\\n            vertical-align: bottom;\\n            padding-bottom: 10px;\\n        }\\n\\n        .journal-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            table-layout: fixed;\\n        }\\n\\n        .journal-table th {\\n            backgrouâ€¦(truncated)\", \"<!DOCTYPE html>\\n<html lang=\\\"de\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style type=\\\"text/css\\\">\\n        body {\\n            font-family: Arial, Helvetica, sans-serif;\\n            font-size: 9pt;\\n            color: #24323f;\\n        }\\n\\n        .page {\\n            position: relative;\\n        }\\n\\n        .header-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            margin-bottom: 14px;\\n            border-bottom: 2px solid #17364d;\\n        }\\n\\n        .header-title {\\n            font-size: 18pt;\\n            font-weight: bold;\\n            color: #17364d;\\n            padding-bottom: 8px;\\n        }\\n\\n        .header-period {\\n            text-align: right;\\n            font-size: 10pt;\\n            color: #4b5d6b;\\n            vertical-align: bottom;\\n            padding-bottom: 10px;\\n        }\\n\\n        .journal-table {\\n            width: 100%;\\n            border-collapse: collapse;\\n            table-layout: fixed;\\n        }\\n\\n        .journal-table th {\\n            backgrouâ€¦(truncated)\"]}',NULL),(136,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','3','update','{\"name\": [\"PDF fÃ¼r DSGVO Export\", \"Lanka IOC - Guest Data Export\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n<style type=\\\"text/css\\\">\\n.general {\\n    border-collapse: collapse;\\n    border: 0;\\n    border-spacing: 0;\\n    width: 100%;\\n}\\n\\n.general td {\\n    padding: 4px;\\n    vertical-align: top;\\n}\\n\\n.general .first {\\n    width: 25%;\\n}\\n\\nh1 {\\n    margin: 0;\\n    color: #333333;\\n}\\n</style>\\n</head>\\n<body>\\n<h1>Allgemein</h1>\\n<table class=\\\"general\\\">\\n<tbody>\\n<tr>\\n<td class=\\\"first\\\">Name:</td>\\n<td>[[ customer.salutation ]] [[ customer.firstname ]] [[ customer.lastname ]]</td>\\n</tr>\\n<tr>\\n<td class=\\\"first\\\">Geburtsdatum:</td>\\n<td>[[ customer.birthday ? customer.birthday|date(\'d.m.Y\') : \'\' ]]</td>\\n</tr>\\n<tr>\\n<td class=\\\"first\\\">Bemerkung:</td>\\n<td>[[ customer.remarkF ]]</td>\\n</tr>\\n</tbody>\\n</table>\\n<h1>Adressen</h1>\\n<div data-repeat=\\\"customer.customerAddresses\\\" data-repeat-as=\\\"address\\\">\\n<h6 class=\\\"panel-title\\\">[[ \'customer.contact\'|trans ]] ([[ address.type|trans ]])</h6>\\n<table class=\\\"general\\\">\\n<tbody>\\n<tr data-if=\\\"address.company\\\">\\n<td class=\\\"first\\\">[[ \'customer.company\'|trans ]]:</tdâ€¦(truncated)\", \"<!DOCTYPE html>\\n<html>\\n<head>\\n<style type=\\\"text/css\\\">\\n.general {\\n    border-collapse: collapse;\\n    border: 0;\\n    border-spacing: 0;\\n    width: 100%;\\n}\\n\\n.general td {\\n    padding: 4px;\\n    vertical-align: top;\\n}\\n\\n.general .first {\\n    width: 25%;\\n}\\n\\nh1 {\\n    margin: 0;\\n    color: #333333;\\n}\\n</style>\\n</head>\\n<body>\\n<h1>Guest information</h1>\\n<table class=\\\"general\\\">\\n<tbody>\\n<tr>\\n<td class=\\\"first\\\">Name:</td>\\n<td>[[ customer.salutation ]] [[ customer.firstname ]] [[ customer.lastname ]]</td>\\n</tr>\\n<tr>\\n<td class=\\\"first\\\">Date of birth:</td>\\n<td>[[ customer.birthday ? customer.birthday|date(\'d.m.Y\') : \'\' ]]</td>\\n</tr>\\n<tr>\\n<td class=\\\"first\\\">Notes:</td>\\n<td>[[ customer.remarkF ]]</td>\\n</tr>\\n</tbody>\\n</table>\\n<h1>Addresses</h1>\\n<div data-repeat=\\\"customer.customerAddresses\\\" data-repeat-as=\\\"address\\\">\\n<h6 class=\\\"panel-title\\\">[[ \'customer.contact\'|trans ]] ([[ address.type|trans ]])</h6>\\n<table class=\\\"general\\\">\\n<tbody>\\n<tr data-if=\\\"address.company\\\">\\n<td class=\\\"first\\\">[[ \'customer.company\'|trans ]â€¦(truncated)\"]}',NULL),(137,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','4','update','{\"name\": [\"PDF Rechnung\", \"Lanka IOC - Invoice\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n<style>\\ntable {\\n  border-spacing: 0;\\n  border-collapse: collapse; \\n}\\ntable th,td {\\n  padding-right: 5px;\\n  padding-left: 5px;\\n}\\n</style>\\n</head>\\n<body>\\n<p style=\\\"text-align: center;\\\"><span style=\\\"font-size: 18pt; font-family: arial, helvetica, sans-serif;\\\"><strong>Unterkunft zum sonnigen GemÃ¼t</strong></span></p>\\n<p style=\\\"text-align: right;\\\"><span style=\\\"font-family: arial, helvetica, sans-serif;\\\"><span style=\\\"font-size: 10pt;\\\">Inhaber: Max Mustermann<br /></span><span style=\\\"font-size: 10pt;\\\">MusterstraÃŸe 12, </span><span style=\\\"font-size: 10pt;\\\">12345 Musterhause</span></span><br /><span style=\\\"font-size: 10pt; font-family: arial, helvetica, sans-serif;\\\">Telefon: 123456 789, Mobil: 987654321</span></p>\\n<p><span style=\\\"font-size: 16pt; font-family: arial, helvetica, sans-serif;\\\"><strong>Rechnung</strong></span></p>\\n<p><span style=\\\"font-size: 10pt; font-family: arial, helvetica, sans-serif;\\\">[[invoice.firstname]] [[invoice.lastname]]<br />[[invoice.companâ€¦(truncated)\", \"<!DOCTYPE html>\\n<html><head><meta charset=\\\"UTF-8\\\"><style>\\nbody { font-family: Arial, sans-serif; font-size: 10pt; color: #24323f; }\\nh1 { font-size: 19pt; color: #17364d; }\\ntable { width: 100%; border-collapse: collapse; }\\nth { background: #f2f2f2; text-align: left; }\\nth, td { padding: 7px 5px; border-bottom: 1px solid #ddd; vertical-align: top; }\\n.num { text-align: right; }\\n</style></head><body>\\n<h1>Lanka IOC Guest House</h1>\\n<h2>Invoice</h2>\\n<p><strong>Invoice number:</strong> [[ invoice.number ]]<br>\\n<strong>Invoice date:</strong> [[ invoice.date|date(\'d.m.Y\') ]]</p>\\n<p><strong>Bill to</strong><br>\\n[[ invoice.firstname ]] [[ invoice.lastname ]]<br>\\n[[ invoice.company ]]<br>[[ invoice.address ]]<br>[[ invoice.zip ]] [[ invoice.city ]]</p>\\n<table>\\n<thead><tr><th>Description</th><th class=\\\"num\\\">Quantity</th><th class=\\\"num\\\">Unit price</th><th class=\\\"num\\\">Tax %</th><th class=\\\"num\\\">Total</th></tr></thead>\\n<tbody>\\n<tr data-repeat=\\\"invoice.appartments\\\" data-repeat-as=\\\"appartment\\\">\\n<td>[[ appâ€¦(truncated)\"]}',NULL),(138,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','8','update','{\"name\": [\"Mahlzeiten\", \"Lanka IOC - Breakfast Checklist (Manual)\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .room { font-weight: bold; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n    \\n    <h2>â€¦(truncated)\", \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .room { font-weight: bold; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Page {PAGENO} of {nbpg}</div></div>\\n    \\n    <h2>â€¦(truncated)\"]}',NULL),(139,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','9','update','{\"name\": [\"Monatsreport Kennzahlen\", \"Lanka IOC - Monthly Operations Summary\"], \"text\": [\"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Erzeugt [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Seite {PAGENO} von {nbpg}</div></div>\\n\\n    <h2>Monatsreport Auslastâ€¦(truncated)\", \"<!DOCTYPE html>\\n<html>\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <style>\\n        body { font-family: Arial, sans-serif; font-size: 12px; }\\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\\n        th { background: #f2f2f2; text-align: left; }\\n        .muted { color: #666; font-size: 11px; }\\n    </style>\\n</head>\\n<body>\\n    <div class=\\\"header\\\"><div class=\\\"muted\\\" style=\\\"text-align: center; color: #666; font-size: 11px;\\\">[[ simple.meta.periodLabel ]]<span data-repeat=\\\"simple.meta.occupancyTypeLabelKeys\\\" data-repeat-as=\\\"type\\\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</div></div>\\n    <div class=\\\"footer\\\"><div class=\\\"muted\\\" style=\\\"text-align: right; font-size: 10px;\\\">Page {PAGENO} of {nbpg}</div></div>\\n\\n    <h2>Monthly Occupancy anâ€¦(truncated)\"]}',NULL),(140,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','10','update','{\"hidden\": [false, true]}',NULL),(141,NULL,NULL,'2026-10-28 11:39:56','App\\Entity\\Template','12','update','{\"text\": [\"<p>Dear [[ reservation1.booker.firstname ]], [[ reservation1.booker.lastname ]]</p><p>We have received your accommodation request, Our team will review it and contact you with the booking decision and stay details.</p><p>This email acknowledges your request; it does not confirm a reservation.</p><p>Kind regards,</p><p>Lanka IOC Guest House.</p>\", \"<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>We have received your accommodation request. Our team will review it and contact you with the booking decision and stay details.</p><p>This email acknowledges your request; it does not confirm a reservation.</p><p>Kind regards,<br>Lanka IOC Guest House</p>\"], \"subject\": [\"Accommodation request received â€“ Lanka IOC Guest Housesk\", \"Accommodation request received - Lanka IOC Guest House\"]}',NULL);
/*!40000 ALTER TABLE `logging` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meal_options`
--

DROP TABLE IF EXISTS `meal_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `service` varchar(40) NOT NULL,
  `price_minor` bigint NOT NULL,
  `currency` varchar(3) NOT NULL,
  `tax_rate` decimal(5,2) DEFAULT NULL,
  `includes_tax` tinyint DEFAULT NULL,
  `active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meal_options`
--

LOCK TABLES `meal_options` WRITE;
/*!40000 ALTER TABLE `meal_options` DISABLE KEYS */;
INSERT INTO `meal_options` VALUES (1,'Breakfast','Breakfast',80000,'LKR',0.00,1,1),(2,'Vegetarian','Lunch',150000,'LKR',0.00,1,1),(3,'Non-vegetarian','Lunch',175000,'LKR',0.00,1,1),(4,'Vegetarian','Dinner',150000,'LKR',0.00,1,1),(5,'Non-vegetarian','Dinner',175000,'LKR',0.00,1,1),(6,'Plain tea or coffee','Tea and coffee',8000,'LKR',0.00,1,1),(7,'Milk tea or coffee','Tea and coffee',10000,'LKR',0.00,1,1);
/*!40000 ALTER TABLE `meal_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meal_orders`
--

DROP TABLE IF EXISTS `meal_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(120) NOT NULL,
  `service_name` varchar(40) NOT NULL,
  `meal_date` date NOT NULL,
  `quantity` int NOT NULL,
  `unit_price_minor` bigint NOT NULL,
  `currency` varchar(3) NOT NULL,
  `tax_rate` decimal(5,2) DEFAULT NULL,
  `includes_tax` tinyint DEFAULT NULL,
  `cancelled` tinyint NOT NULL DEFAULT '0',
  `reservation_id` int NOT NULL,
  `property_id` int NOT NULL,
  `guest_id` int NOT NULL,
  `option_id` int NOT NULL,
  `invoice_position_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_8A2540E7CACA4C75` (`invoice_position_id`),
  KEY `IDX_8A2540E7B83297E7` (`reservation_id`),
  KEY `idx_meal_property` (`property_id`),
  KEY `IDX_8A2540E79A4AA658` (`guest_id`),
  KEY `IDX_8A2540E7A7C41D6F` (`option_id`),
  KEY `idx_meal_order_date` (`meal_date`),
  CONSTRAINT `FK_8A2540E79A4AA658` FOREIGN KEY (`guest_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_8A2540E7A7C41D6F` FOREIGN KEY (`option_id`) REFERENCES `meal_options` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_8A2540E7B83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_8A2540E7CACA4C75` FOREIGN KEY (`invoice_position_id`) REFERENCES `invoice_positions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_MEAL_PROPERTY` FOREIGN KEY (`property_id`) REFERENCES `objects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meal_orders`
--

LOCK TABLES `meal_orders` WRITE;
/*!40000 ALTER TABLE `meal_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `meal_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `monthly_stats_snapshots`
--

DROP TABLE IF EXISTS `monthly_stats_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monthly_stats_snapshots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subsidiary_id` int DEFAULT NULL,
  `month` smallint NOT NULL,
  `year` smallint NOT NULL,
  `is_all` tinyint(1) NOT NULL,
  `metrics` json NOT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `updated_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_month_year_subsidiary` (`year`,`month`,`is_all`,`subsidiary_id`),
  KEY `idx_month_year` (`year`,`month`),
  KEY `IDX_snapshot_subsidiary` (`subsidiary_id`),
  CONSTRAINT `FK_snapshot_subsidiary` FOREIGN KEY (`subsidiary_id`) REFERENCES `objects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monthly_stats_snapshots`
--

LOCK TABLES `monthly_stats_snapshots` WRITE;
/*!40000 ALTER TABLE `monthly_stats_snapshots` DISABLE KEYS */;
INSERT INTO `monthly_stats_snapshots` VALUES (1,NULL,9,2026,1,'{\"period\": {\"year\": 2026, \"month\": 9}, \"blocked\": {\"bed_days\": 0, \"room_days\": 0}, \"summary\": {\"guests_total\": 0, \"nights_total\": 0, \"arrivals_total\": 0, \"turnovers_count\": 0, \"departures_total\": 0, \"reservations_total\": 0}, \"tourism\": {\"arrivals_total\": 0, \"overnights_total\": 0, \"arrivals_by_state\": [], \"arrivals_by_country\": [], \"overnights_by_state\": [], \"overnights_by_country\": [], \"overnights_by_guest_category\": [], \"overnights_by_country_and_category\": []}, \"turnover\": {\"total\": 0.0, \"by_status\": {\"1\": 0.0, \"2\": 0.0, \"3\": 0.0, \"4\": 0.0}}, \"warnings\": [], \"by_status\": [], \"inventory\": {\"beds_total\": 10, \"rooms_total\": 6}, \"subsidiary\": null, \"utilization\": {\"daily_percent\": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], \"month_percent\": 0.0}, \"reservation_origin\": []}','2026-10-23 10:36:41','2026-10-23 10:36:41'),(2,1,9,2026,0,'{\"period\": {\"year\": 2026, \"month\": 9}, \"blocked\": {\"bed_days\": 0, \"room_days\": 0}, \"summary\": {\"guests_total\": 0, \"nights_total\": 0, \"arrivals_total\": 0, \"turnovers_count\": 0, \"departures_total\": 0, \"reservations_total\": 0}, \"tourism\": {\"arrivals_total\": 0, \"overnights_total\": 0, \"arrivals_by_state\": [], \"arrivals_by_country\": [], \"overnights_by_state\": [], \"overnights_by_country\": [], \"overnights_by_guest_category\": [], \"overnights_by_country_and_category\": []}, \"warnings\": [], \"by_status\": [], \"inventory\": {\"beds_total\": 3, \"rooms_total\": 2}, \"subsidiary\": 1, \"utilization\": {\"daily_percent\": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], \"month_percent\": 0.0}, \"reservation_origin\": []}','2026-10-23 10:36:41','2026-10-23 10:36:41'),(3,2,9,2026,0,'{\"period\": {\"year\": 2026, \"month\": 9}, \"blocked\": {\"bed_days\": 0, \"room_days\": 0}, \"summary\": {\"guests_total\": 0, \"nights_total\": 0, \"arrivals_total\": 0, \"turnovers_count\": 0, \"departures_total\": 0, \"reservations_total\": 0}, \"tourism\": {\"arrivals_total\": 0, \"overnights_total\": 0, \"arrivals_by_state\": [], \"arrivals_by_country\": [], \"overnights_by_state\": [], \"overnights_by_country\": [], \"overnights_by_guest_category\": [], \"overnights_by_country_and_category\": []}, \"warnings\": [], \"by_status\": [], \"inventory\": {\"beds_total\": 7, \"rooms_total\": 4}, \"subsidiary\": 2, \"utilization\": {\"daily_percent\": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], \"month_percent\": 0.0}, \"reservation_origin\": []}','2026-10-23 10:36:41','2026-10-23 10:36:41'),(4,NULL,10,2026,1,'{\"period\": {\"year\": 2026, \"month\": 10}, \"blocked\": {\"bed_days\": 0, \"room_days\": 0}, \"summary\": {\"guests_total\": 2, \"nights_total\": 20, \"arrivals_total\": 2, \"turnovers_count\": 0, \"departures_total\": 0, \"reservations_total\": 2}, \"tourism\": {\"arrivals_total\": 2, \"overnights_total\": 20, \"arrivals_by_state\": [], \"arrivals_by_country\": {\"unknown\": 2}, \"overnights_by_state\": [], \"overnights_by_country\": {\"unknown\": 20}, \"overnights_by_guest_category\": {\"1\": 20}, \"overnights_by_country_and_category\": {\"unknown\": {\"1\": 20.0}}}, \"turnover\": {\"total\": 0.0, \"by_status\": {\"1\": 0.0, \"2\": 0.0, \"3\": 0.0, \"4\": 0.0}}, \"warnings\": [], \"by_status\": {\"5\": {\"tourism\": {\"arrivals_total\": 2, \"overnights_total\": 20, \"arrivals_by_state\": [], \"arrivals_by_country\": {\"unknown\": 2}, \"overnights_by_state\": [], \"overnights_by_country\": {\"unknown\": 20}, \"overnights_by_guest_category\": {\"1\": 20}, \"overnights_by_country_and_category\": {\"unknown\": {\"1\": 20.0}}}, \"utilization\": {\"stays\": 20}}}, \"inventory\": {\"beds_total\": 10, \"rooms_total\": 6}, \"subsidiary\": null, \"utilization\": {\"daily_percent\": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20], \"month_percent\": 6.451612903225806}, \"reservation_origin\": {\"Permanent Expatriate Allocation\": 2}}','2026-10-23 10:36:41','2026-10-23 10:36:41'),(5,1,10,2026,0,'{\"period\": {\"year\": 2026, \"month\": 10}, \"blocked\": {\"bed_days\": 0, \"room_days\": 0}, \"summary\": {\"guests_total\": 0, \"nights_total\": 0, \"arrivals_total\": 0, \"turnovers_count\": 0, \"departures_total\": 0, \"reservations_total\": 0}, \"tourism\": {\"arrivals_total\": 0, \"overnights_total\": 0, \"arrivals_by_state\": [], \"arrivals_by_country\": [], \"overnights_by_state\": [], \"overnights_by_country\": [], \"overnights_by_guest_category\": [], \"overnights_by_country_and_category\": []}, \"warnings\": [], \"by_status\": [], \"inventory\": {\"beds_total\": 3, \"rooms_total\": 2}, \"subsidiary\": 1, \"utilization\": {\"daily_percent\": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], \"month_percent\": 0.0}, \"reservation_origin\": []}','2026-10-23 10:36:41','2026-10-23 10:36:41'),(6,2,10,2026,0,'{\"period\": {\"year\": 2026, \"month\": 10}, \"blocked\": {\"bed_days\": 0, \"room_days\": 0}, \"summary\": {\"guests_total\": 2, \"nights_total\": 20, \"arrivals_total\": 2, \"turnovers_count\": 0, \"departures_total\": 0, \"reservations_total\": 2}, \"tourism\": {\"arrivals_total\": 2, \"overnights_total\": 20, \"arrivals_by_state\": [], \"arrivals_by_country\": {\"unknown\": 2}, \"overnights_by_state\": [], \"overnights_by_country\": {\"unknown\": 20}, \"overnights_by_guest_category\": {\"1\": 20}, \"overnights_by_country_and_category\": {\"unknown\": {\"1\": 20.0}}}, \"warnings\": [], \"by_status\": {\"5\": {\"tourism\": {\"arrivals_total\": 2, \"overnights_total\": 20, \"arrivals_by_state\": [], \"arrivals_by_country\": {\"unknown\": 2}, \"overnights_by_state\": [], \"overnights_by_country\": {\"unknown\": 20}, \"overnights_by_guest_category\": {\"1\": 20}, \"overnights_by_country_and_category\": {\"unknown\": {\"1\": 20.0}}}, \"utilization\": {\"stays\": 20}}}, \"inventory\": {\"beds_total\": 7, \"rooms_total\": 4}, \"subsidiary\": 2, \"utilization\": {\"daily_percent\": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28.571428571428573, 28.571428571428573, 28.571428571428573, 28.571428571428573, 28.571428571428573, 28.571428571428573, 28.571428571428573, 28.571428571428573, 28.571428571428573, 28.571428571428573], \"month_percent\": 9.216589861751151}, \"reservation_origin\": {\"Permanent Expatriate Allocation\": 2}}','2026-10-23 10:36:41','2026-10-23 10:36:41');
/*!40000 ALTER TABLE `monthly_stats_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objects`
--

DROP TABLE IF EXISTS `objects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number_pattern` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objects`
--

LOCK TABLES `objects` WRITE;
/*!40000 ALTER TABLE `objects` DISABLE KEYS */;
INSERT INTO `objects` VALUES (1,'Trincomalee - Guest House','Guest house at Trincomalee',NULL),(2,'Lanka IOC Guest House Colombo 03','Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo 03. Tel: +94 11 701 1720.',NULL);
/*!40000 ALTER TABLE `objects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_booking_config`
--

DROP TABLE IF EXISTS `online_booking_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_booking_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enabled` tinyint(1) NOT NULL DEFAULT '0',
  `booking_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INQUIRY',
  `subsidiaries_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
  `selected_subsidiary_ids` json DEFAULT NULL,
  `rooms_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
  `selected_room_ids` json DEFAULT NULL,
  `theme_primary_color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#1f6feb',
  `theme_background_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inquiry_reservation_status_id` int DEFAULT NULL,
  `booking_reservation_status_id` int DEFAULT NULL,
  `reservation_origin_id` int DEFAULT NULL,
  `payment_terms` longtext COLLATE utf8mb4_unicode_ci,
  `cancellation_terms` longtext COLLATE utf8mb4_unicode_ci,
  `success_message_text` longtext COLLATE utf8mb4_unicode_ci,
  `custom_css` longtext COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL,
  `booking_horizon_months` smallint DEFAULT NULL,
  `allowed_embedding_origins` longtext COLLATE utf8mb4_unicode_ci,
  `theme` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'modern',
  `mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'search',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_booking_config`
--

LOCK TABLES `online_booking_config` WRITE;
/*!40000 ALTER TABLE `online_booking_config` DISABLE KEYS */;
INSERT INTO `online_booking_config` VALUES (1,0,'INQUIRY','ALL','[]','ALL','[]','#1f6feb',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-14 11:20:13',NULL,NULL,'modern','search');
/*!40000 ALTER TABLE `online_booking_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_booking_min_stay`
--

DROP TABLE IF EXISTS `online_booking_min_stay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_booking_min_stay` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_category_id` int NOT NULL,
  `min_nights_weekday` smallint DEFAULT NULL,
  `min_nights_weekend` smallint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ob_min_stay_room_category` (`room_category_id`),
  KEY `IDX_OB_MIN_STAY_RC` (`room_category_id`),
  CONSTRAINT `FK_OB_MIN_STAY_RC` FOREIGN KEY (`room_category_id`) REFERENCES `room_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_booking_min_stay`
--

LOCK TABLES `online_booking_min_stay` WRITE;
/*!40000 ALTER TABLE `online_booking_min_stay` DISABLE KEYS */;
/*!40000 ALTER TABLE `online_booking_min_stay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_booking_min_stay_override`
--

DROP TABLE IF EXISTS `online_booking_min_stay_override`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_booking_min_stay_override` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_category_id` int DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `min_nights` smallint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_OB_MIN_STAY_OVR_RC` (`room_category_id`),
  CONSTRAINT `FK_OB_MIN_STAY_OVR_RC` FOREIGN KEY (`room_category_id`) REFERENCES `room_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_booking_min_stay_override`
--

LOCK TABLES `online_booking_min_stay_override` WRITE;
/*!40000 ALTER TABLE `online_booking_min_stay_override` DISABLE KEYS */;
/*!40000 ALTER TABLE `online_booking_min_stay_override` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_booking_room_category_limit`
--

DROP TABLE IF EXISTS `online_booking_room_category_limit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_booking_room_category_limit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_category_id` int NOT NULL,
  `max_rooms` smallint DEFAULT NULL,
  `min_occupancy` smallint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ob_room_cat_limit` (`room_category_id`),
  KEY `IDX_OB_RC_LIMIT_RC` (`room_category_id`),
  CONSTRAINT `FK_OB_RC_LIMIT_RC` FOREIGN KEY (`room_category_id`) REFERENCES `room_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_booking_room_category_limit`
--

LOCK TABLES `online_booking_room_category_limit` WRITE;
/*!40000 ALTER TABLE `online_booking_room_category_limit` DISABLE KEYS */;
/*!40000 ALTER TABLE `online_booking_room_category_limit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `postal_code_data`
--

DROP TABLE IF EXISTS `postal_code_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postal_code_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country_code` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `place_name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state_name_short` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `search_zip_idx` (`country_code`,`postal_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `postal_code_data`
--

LOCK TABLES `postal_code_data` WRITE;
/*!40000 ALTER TABLE `postal_code_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `postal_code_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_components`
--

DROP TABLE IF EXISTS `price_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_components` (
  `id` int NOT NULL AUTO_INCREMENT,
  `price_id` int NOT NULL,
  `revenue_account_id` int DEFAULT NULL,
  `description` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vat` decimal(10,2) NOT NULL,
  `allocation_type` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `allocation_value` decimal(10,4) NOT NULL,
  `is_remainder` tinyint(1) NOT NULL,
  `sort_order` smallint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_PRICE_COMPONENTS_PRICE` (`price_id`),
  KEY `IDX_PRICE_COMPONENTS_REVENUE_ACCOUNT` (`revenue_account_id`),
  CONSTRAINT `FK_PRICE_COMPONENTS_PRICE` FOREIGN KEY (`price_id`) REFERENCES `prices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_PRICE_COMPONENTS_REVENUE_ACCOUNT` FOREIGN KEY (`revenue_account_id`) REFERENCES `accounting_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_components`
--

LOCK TABLES `price_components` WRITE;
/*!40000 ALTER TABLE `price_components` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_period`
--

DROP TABLE IF EXISTS `price_period`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_period` (
  `id` int NOT NULL AUTO_INCREMENT,
  `price_id` int NOT NULL,
  `start` date NOT NULL,
  `end` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_8821B69ED614C7E7` (`price_id`),
  CONSTRAINT `FK_8821B69ED614C7E7` FOREIGN KEY (`price_id`) REFERENCES `prices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_period`
--

LOCK TABLES `price_period` WRITE;
/*!40000 ALTER TABLE `price_period` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_period` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prices`
--

DROP TABLE IF EXISTS `prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `price` decimal(10,2) NOT NULL,
  `vat` decimal(10,2) NOT NULL,
  `description` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number_of_persons` smallint DEFAULT NULL,
  `min_stay` smallint DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `season_start` date DEFAULT NULL,
  `season_end` date DEFAULT NULL,
  `monday` tinyint(1) DEFAULT NULL,
  `tuesday` tinyint(1) DEFAULT NULL,
  `wednesday` tinyint(1) DEFAULT NULL,
  `thursday` tinyint(1) DEFAULT NULL,
  `friday` tinyint(1) DEFAULT NULL,
  `saturday` tinyint(1) DEFAULT NULL,
  `sunday` tinyint(1) DEFAULT NULL,
  `all_days` tinyint(1) DEFAULT NULL,
  `type` smallint NOT NULL,
  `all_periods` tinyint(1) NOT NULL,
  `room_category_id` int DEFAULT NULL,
  `includes_vat` tinyint(1) NOT NULL,
  `is_flat_price` tinyint(1) NOT NULL,
  `is_per_room` tinyint(1) NOT NULL DEFAULT '0',
  `is_default_active_in_reservation_creation` tinyint(1) NOT NULL DEFAULT '1',
  `is_bookable_online` tinyint(1) NOT NULL DEFAULT '0',
  `revenue_account_id` int DEFAULT NULL,
  `is_mandatory_online` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `IDX_E4CB6D5967333DD` (`room_category_id`),
  KEY `IDX_PRICES_REVENUE_ACCOUNT` (`revenue_account_id`),
  CONSTRAINT `FK_E4CB6D5967333DD` FOREIGN KEY (`room_category_id`) REFERENCES `room_category` (`id`),
  CONSTRAINT `FK_PRICES_REVENUE_ACCOUNT` FOREIGN KEY (`revenue_account_id`) REFERENCES `accounting_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prices`
--

LOCK TABLES `prices` WRITE;
/*!40000 ALTER TABLE `prices` DISABLE KEYS */;
INSERT INTO `prices` VALUES (1,0.00,0.00,'Company-Provided Accommodation',0,0,1,NULL,NULL,1,1,1,1,1,1,1,1,2,1,1,1,0,1,0,0,NULL,0),(2,0.00,0.00,'Company-Provided Accommodation',0,0,1,NULL,NULL,1,1,1,1,1,1,1,1,2,1,2,1,0,1,0,0,NULL,0);
/*!40000 ALTER TABLE `prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prices_has_reservation_origins`
--

DROP TABLE IF EXISTS `prices_has_reservation_origins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prices_has_reservation_origins` (
  `price_id` int NOT NULL,
  `reservation_origin_id` int NOT NULL,
  PRIMARY KEY (`price_id`,`reservation_origin_id`),
  KEY `IDX_3DE1EC6AD614C7E7` (`price_id`),
  KEY `IDX_3DE1EC6A4CE51253` (`reservation_origin_id`),
  CONSTRAINT `FK_3DE1EC6A4CE51253` FOREIGN KEY (`reservation_origin_id`) REFERENCES `reservation_origins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_3DE1EC6AD614C7E7` FOREIGN KEY (`price_id`) REFERENCES `prices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prices_has_reservation_origins`
--

LOCK TABLES `prices_has_reservation_origins` WRITE;
/*!40000 ALTER TABLE `prices_has_reservation_origins` DISABLE KEYS */;
INSERT INTO `prices_has_reservation_origins` VALUES (1,1),(1,2),(1,3),(1,4),(2,1),(2,2),(2,3),(2,4);
/*!40000 ALTER TABLE `prices_has_reservation_origins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_book`
--

DROP TABLE IF EXISTS `registration_book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_book` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `reservation_id` int DEFAULT NULL,
  `number` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime NOT NULL,
  `salutation` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstname` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `address` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idnumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_4DBB4ED9395C3F3` (`customer_id`),
  KEY `IDX_4DBB4EDB83297E7` (`reservation_id`),
  CONSTRAINT `FK_4DBB4ED9395C3F3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FK_4DBB4EDB83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_book`
--

LOCK TABLES `registration_book` WRITE;
/*!40000 ALTER TABLE `registration_book` DISABLE KEYS */;
/*!40000 ALTER TABLE `registration_book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_origins`
--

DROP TABLE IF EXISTS `reservation_origins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_origins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_origins`
--

LOCK TABLES `reservation_origins` WRITE;
/*!40000 ALTER TABLE `reservation_origins` DISABLE KEYS */;
INSERT INTO `reservation_origins` VALUES (1,'HOD Request','#0029cc'),(2,'Managing Director Request','#e21a03'),(3,'Admin Entry','#b418c9'),(4,'Permanent Expatriate Allocation','#0aecf0');
/*!40000 ALTER TABLE `reservation_origins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_price`
--

DROP TABLE IF EXISTS `reservation_price`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_price` (
  `reservation_id` int NOT NULL,
  `price_id` int NOT NULL,
  PRIMARY KEY (`reservation_id`,`price_id`),
  KEY `IDX_89B7F27EB83297E7` (`reservation_id`),
  KEY `IDX_89B7F27ED614C7E7` (`price_id`),
  CONSTRAINT `FK_89B7F27EB83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_89B7F27ED614C7E7` FOREIGN KEY (`price_id`) REFERENCES `prices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_price`
--

LOCK TABLES `reservation_price` WRITE;
/*!40000 ALTER TABLE `reservation_price` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservation_price` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_status`
--

DROP TABLE IF EXISTS `reservation_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrast_color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_blocking` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_RESERVATION_STATUS_CODE` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_status`
--

LOCK TABLES `reservation_status` WRITE;
/*!40000 ALTER TABLE `reservation_status` DISABLE KEYS */;
INSERT INTO `reservation_status` VALUES (1,'Storniert / No-Show','#6c757d','#ffffff','canceled_noshow',0),(2,'Request Received','#fa5700','#ffffff',NULL,0),(3,'Approved','#1b00e6','#ffffff',NULL,1),(4,'Room Allocated','#d22dc5','#ffffff',NULL,1),(5,'Checked In','#10e074','#000000',NULL,1),(6,'Checked Out','#545454','#ffffff',NULL,0);
/*!40000 ALTER TABLE `reservation_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appartment_id` int DEFAULT NULL,
  `booker_id` int DEFAULT NULL,
  `reservation_origin_id` int DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `persons` smallint NOT NULL,
  `option_date` date DEFAULT NULL,
  `remark` longtext COLLATE utf8mb4_unicode_ci,
  `reservation_date` datetime NOT NULL,
  `reservation_status_id` int NOT NULL,
  `uuid` binary(16) NOT NULL COMMENT '(DC2Type:uuid)',
  `arrival_time` time DEFAULT NULL,
  `departure_time` time DEFAULT NULL,
  `calendar_sync_import_id` int DEFAULT NULL,
  `ref_uid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_conflict` tinyint(1) NOT NULL DEFAULT '0',
  `is_conflict_ignored` tinyint(1) NOT NULL DEFAULT '0',
  `booking_group_uuid` binary(16) DEFAULT NULL COMMENT '(DC2Type:uuid)',
  `guest_counts` json NOT NULL,
  `kurtaxe_waived` tinyint(1) NOT NULL DEFAULT '0',
  `adult_rule_override` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_4DA239D17F50A6` (`uuid`),
  KEY `IDX_4DA2392714DC20` (`appartment_id`),
  KEY `IDX_4DA2398B7E4006` (`booker_id`),
  KEY `IDX_4DA2394CE51253` (`reservation_origin_id`),
  KEY `IDX_4DA23971B06122` (`reservation_status_id`),
  KEY `idx_uuid` (`uuid`),
  KEY `IDX_4DA23927C0C2C8EA` (`calendar_sync_import_id`),
  KEY `idx_reservations_ref_uid` (`ref_uid`),
  KEY `idx_booking_group_uuid` (`booking_group_uuid`),
  KEY `idx_reservation_start_date` (`start_date`),
  KEY `idx_reservation_end_date` (`end_date`),
  CONSTRAINT `FK_4DA2392714DC20` FOREIGN KEY (`appartment_id`) REFERENCES `appartments` (`id`),
  CONSTRAINT `FK_4DA23927C0C2C8EA` FOREIGN KEY (`calendar_sync_import_id`) REFERENCES `calendar_sync_import` (`id`),
  CONSTRAINT `FK_4DA2394CE51253` FOREIGN KEY (`reservation_origin_id`) REFERENCES `reservation_origins` (`id`),
  CONSTRAINT `FK_4DA23971B06122` FOREIGN KEY (`reservation_status_id`) REFERENCES `reservation_status` (`id`),
  CONSTRAINT `FK_4DA2398B7E4006` FOREIGN KEY (`booker_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,3,2,4,'2026-10-22','2027-10-22',1,NULL,'Permanent allocation â€” Managing Director. Review by 22 October 2027.','2026-10-22 09:54:10',5,_binary 'INF…¬2B–·‚\Â9bø\ð',NULL,NULL,NULL,NULL,0,0,NULL,'{\"1\": 1}',0,0),(2,1,3,4,'2026-10-22','2027-10-22',1,NULL,'Permanent allocation â€” SVP (Lubes). Review by 22 October 2027.','2026-10-22 10:50:54',5,_binary ' \Ù-¤/HÜ£Ï™µ\nD¤',NULL,NULL,NULL,NULL,0,0,NULL,'{\"1\": 1}',0,0);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations_has_customers`
--

DROP TABLE IF EXISTS `reservations_has_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations_has_customers` (
  `reservation_id` int NOT NULL,
  `customer_id` int NOT NULL,
  PRIMARY KEY (`reservation_id`,`customer_id`),
  KEY `IDX_34A24A03B83297E7` (`reservation_id`),
  KEY `IDX_34A24A039395C3F3` (`customer_id`),
  CONSTRAINT `FK_34A24A039395C3F3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_34A24A03B83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations_has_customers`
--

LOCK TABLES `reservations_has_customers` WRITE;
/*!40000 ALTER TABLE `reservations_has_customers` DISABLE KEYS */;
INSERT INTO `reservations_has_customers` VALUES (1,2),(2,3);
/*!40000 ALTER TABLE `reservations_has_customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations_has_invoices`
--

DROP TABLE IF EXISTS `reservations_has_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations_has_invoices` (
  `reservation_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  PRIMARY KEY (`reservation_id`,`invoice_id`),
  KEY `IDX_28EF2EA0B83297E7` (`reservation_id`),
  KEY `IDX_28EF2EA02989F1FD` (`invoice_id`),
  CONSTRAINT `FK_28EF2EA02989F1FD` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_28EF2EA0B83297E7` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations_has_invoices`
--

LOCK TABLES `reservations_has_invoices` WRITE;
/*!40000 ALTER TABLE `reservations_has_invoices` DISABLE KEYS */;
INSERT INTO `reservations_has_invoices` VALUES (1,1);
/*!40000 ALTER TABLE `reservations_has_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reset_password_request`
--

DROP TABLE IF EXISTS `reset_password_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reset_password_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `selector` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashed_token` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `expires_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  PRIMARY KEY (`id`),
  KEY `IDX_7CE748AA76ED395` (`user_id`),
  CONSTRAINT `FK_7CE748AA76ED395` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reset_password_request`
--

LOCK TABLES `reset_password_request` WRITE;
/*!40000 ALTER TABLE `reset_password_request` DISABLE KEYS */;
INSERT INTO `reset_password_request` VALUES (1,1,'bFc0pBpMyIn1AbtpnvUR','TYafn75iKaKnF0CsQdELvfD2CFJdxUxnKnGjBbErFPQ=','2026-10-21 05:18:29','2026-10-21 06:18:29');
/*!40000 ALTER TABLE `reset_password_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_B63E2EC757698A6A` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ReadOnly','ROLE_RESERVATIONS_RO'),(2,'Reservations','ROLE_RESERVATIONS'),(3,'Invoices','ROLE_INVOICES'),(4,'Customers','ROLE_CUSTOMERS'),(5,'RegistrationBook','ROLE_REGISTRATIONBOOK'),(6,'Statistics','ROLE_STATISTICS'),(7,'Cashjournal','ROLE_CASHJOURNAL'),(8,'Operations','ROLE_OPERATIONS'),(9,'Admin','ROLE_ADMIN');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_blocks`
--

DROP TABLE IF EXISTS `room_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_blocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appartment_id` int NOT NULL,
  `created_by_id` int DEFAULT NULL,
  `uuid` binary(16) NOT NULL COMMENT '(DC2Type:uuid)',
  `start_date` date NOT NULL COMMENT '(DC2Type:date_immutable)',
  `end_date` date NOT NULL COMMENT '(DC2Type:date_immutable)',
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` longtext COLLATE utf8mb4_unicode_ci,
  `source` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_8FA353B9D17F50A6` (`uuid`),
  KEY `idx_room_blocks_room_dates` (`appartment_id`,`start_date`,`end_date`),
  KEY `IDX_8FA353B92714DC20` (`appartment_id`),
  KEY `IDX_8FA353B9B03A8386` (`created_by_id`),
  CONSTRAINT `FK_8FA353B92714DC20` FOREIGN KEY (`appartment_id`) REFERENCES `appartments` (`id`),
  CONSTRAINT `FK_8FA353B9B03A8386` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_blocks`
--

LOCK TABLES `room_blocks` WRITE;
/*!40000 ALTER TABLE `room_blocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_category`
--

DROP TABLE IF EXISTS `room_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `acronym` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` longtext COLLATE utf8mb4_unicode_ci,
  `ota_room_type_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_full_payers` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_category`
--

LOCK TABLES `room_category` WRITE;
/*!40000 ALTER TABLE `room_category` DISABLE KEYS */;
INSERT INTO `room_category` VALUES (1,'Double Occupancy','DBL','Attached bathroom, A/C, Wi-Fi, TV, kettle, tea/coffee and toiletries',NULL,2),(2,'Single Occupancy','SGL','Attached bathroom, A/C, Wi-Fi, TV, kettle, tea/coffee and toiletries',NULL,1);
/*!40000 ALTER TABLE `room_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_category_amenity`
--

DROP TABLE IF EXISTS `room_category_amenity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_category_amenity` (
  `room_category_id` int NOT NULL,
  `amenity_id` int NOT NULL,
  PRIMARY KEY (`room_category_id`,`amenity_id`),
  KEY `IDX_RCA_ROOM_CATEGORY` (`room_category_id`),
  KEY `IDX_RCA_AMENITY` (`amenity_id`),
  CONSTRAINT `FK_RCA_AMENITY` FOREIGN KEY (`amenity_id`) REFERENCES `amenity` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_RCA_ROOM_CATEGORY` FOREIGN KEY (`room_category_id`) REFERENCES `room_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_category_amenity`
--

LOCK TABLES `room_category_amenity` WRITE;
/*!40000 ALTER TABLE `room_category_amenity` DISABLE KEYS */;
INSERT INTO `room_category_amenity` VALUES (1,1),(1,2),(1,3),(1,12),(1,13),(1,15),(1,16),(1,20),(2,1),(2,2),(2,3),(2,12),(2,13),(2,15),(2,16),(2,20);
/*!40000 ALTER TABLE `room_category_amenity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_category_image`
--

DROP TABLE IF EXISTS `room_category_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_category_image` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_category_id` int NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `tag` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_RCI_ROOM_CATEGORY` (`room_category_id`),
  CONSTRAINT `FK_RCI_ROOM_CATEGORY` FOREIGN KEY (`room_category_id`) REFERENCES `room_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_category_image`
--

LOCK TABLES `room_category_image` WRITE;
/*!40000 ALTER TABLE `room_category_image` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_category_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_day_statuses`
--

DROP TABLE IF EXISTS `room_day_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_day_statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appartment_id` int NOT NULL,
  `assigned_to_id` int DEFAULT NULL,
  `updated_by_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `hk_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` longtext COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_room_day` (`appartment_id`,`date`),
  KEY `IDX_1C76B19393362AA5` (`appartment_id`),
  KEY `IDX_1C76B193F91F2105` (`assigned_to_id`),
  KEY `IDX_1C76B193896DBBDE` (`updated_by_id`),
  CONSTRAINT `FK_1C76B193896DBBDE` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_1C76B19393362AA5` FOREIGN KEY (`appartment_id`) REFERENCES `appartments` (`id`),
  CONSTRAINT `FK_1C76B193F91F2105` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_day_statuses`
--

LOCK TABLES `room_day_statuses` WRITE;
/*!40000 ALTER TABLE `room_day_statuses` DISABLE KEYS */;
INSERT INTO `room_day_statuses` VALUES (1,1,NULL,2,'2026-10-23','IN_PROGRESS',NULL,'2026-10-23 10:44:04');
/*!40000 ALTER TABLE `room_day_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `special_days`
--

DROP TABLE IF EXISTS `special_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_days` (
  `special_days_id` int NOT NULL AUTO_INCREMENT,
  `start` time NOT NULL,
  `end` time NOT NULL,
  `name` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`special_days_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `special_days`
--

LOCK TABLES `special_days` WRITE;
/*!40000 ALTER TABLE `special_days` DISABLE KEYS */;
/*!40000 ALTER TABLE `special_days` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_rates`
--

DROP TABLE IF EXISTS `tax_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(5,2) NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `revenue_account_id` int DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `datev_output_bu_key` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datev_input_bu_key` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chart_preset` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_F7AE5E1D1269BA99` (`revenue_account_id`),
  KEY `idx_tax_chart_preset` (`chart_preset`),
  CONSTRAINT `FK_F7AE5E1D1269BA99` FOREIGN KEY (`revenue_account_id`) REFERENCES `accounting_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_rates`
--

LOCK TABLES `tax_rates` WRITE;
/*!40000 ALTER TABLE `tax_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `tax_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `template_types`
--

DROP TABLE IF EXISTS `template_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `template_types`
--

LOCK TABLES `template_types` WRITE;
/*!40000 ALTER TABLE `template_types` DISABLE KEYS */;
INSERT INTO `template_types` VALUES (1,'TEMPLATE_OPERATIONS_PDF','fa-file-pdf'),(2,'TEMPLATE_REGISTRATION_PDF','fa-file-pdf'),(3,'TEMPLATE_INVOICE_EMAIL','fa-envelope'),(4,'TEMPLATE_GENERAL_EMAIL','fa-envelope'),(5,'TEMPLATE_NEWSLETTER_EMAIL','fa-newspaper'),(6,'TEMPLATE_RESERVATION_EMAIL','fa-envelope'),(7,'TEMPLATE_FILE_PDF','fa-file-pdf'),(8,'TEMPLATE_INVOICE_PDF','fa-file-pdf'),(9,'TEMPLATE_RESERVATION_PDF','fa-file-pdf'),(10,'TEMPLATE_CASHJOURNAL_PDF','fa-file-pdf'),(11,'TEMPLATE_GDPR_PDF','fa-file-pdf');
/*!40000 ALTER TABLE `template_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_type_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `params` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_6F287D8E96F4F7AA` (`template_type_id`),
  CONSTRAINT `FK_6F287D8E96F4F7AA` FOREIGN KEY (`template_type_id`) REFERENCES `template_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
INSERT INTO `templates` VALUES (1,10,'Lanka IOC - Cash Book','<!DOCTYPE html>\n<html lang=\"de\">\n<head>\n    <meta charset=\"UTF-8\">\n    <style type=\"text/css\">\n        body {\n            font-family: arial, helvetica, sans-serif;\n            font-size: 8pt;\n            color: #24323f;\n        }\n\n        .header-table {\n            width: 100%;\n            border-collapse: collapse;\n            margin-bottom: 14px;\n            border-bottom: 2px solid #17364d;\n        }\n\n        .header-title {\n            font-size: 18pt;\n            font-weight: bold;\n            color: #17364d;\n            padding-bottom: 8px;\n        }\n\n        .header-period {\n            text-align: right;\n            font-size: 10pt;\n            color: #4b5d6b;\n            vertical-align: bottom;\n            padding-bottom: 10px;\n        }\n\n        .journal-table {\n            width: 100%;\n            border-collapse: collapse;\n            table-layout: fixed;\n        }\n\n        .journal-table th {\n            background: #17364d;\n            color: #ffffff;\n            font-size: 8pt;\n            font-weight: bold;\n            text-align: left;\n            padding: 7px 5px;\n            border-right: 1px solid #365772;\n            white-space: nowrap;\n        }\n\n        .journal-table th:last-child {\n            border-right: none;\n        }\n\n        .journal-table td {\n            padding: 5px;\n            border-bottom: 1px solid #dce5eb;\n            border-right: 1px solid #edf2f6;\n            vertical-align: top;\n            word-wrap: break-word;\n        }\n\n        .journal-table td:last-child {\n            border-right: none;\n        }\n\n        .journal-table tr:nth-child(even) td {\n            background: #f8fbfd;\n        }\n\n        .center {\n            text-align: center;\n        }\n\n        .num {\n            text-align: right;\n            white-space: nowrap;\n        }\n\n        .nowrap {\n            white-space: nowrap;\n        }\n\n        .totals-table {\n            width: 100%;\n            border-collapse: collapse;\n            margin-top: 12px;\n        }\n\n        .totals-label {\n            text-align: right;\n            color: #4b5d6b;\n            font-weight: bold;\n            padding: 4px 8px 4px 0;\n        }\n\n        .totals-value {\n            width: 20%;\n            text-align: right;\n            color: #17364d;\n            font-weight: bold;\n            padding: 4px 0;\n            white-space: nowrap;\n        }\n\n        .footer {\n            position: fixed;\n            bottom: -12mm;\n            left: 0;\n            right: 0;\n            font-size: 8pt;\n            color: #6c7b88;\n            text-align: right;\n        }\n    </style>\n</head>\n<body>\n<div class=\"footer\">{PAGENO}/{nbpg}</div>\n<table class=\"header-table\">\n    <tr>\n        <td class=\"header-title\">Cash Book</td>\n        <td class=\"header-period\">\n            [[ getLocalizedMonth(journal.cashMonth, \'MMMM\', app.request.locale) ]] [[ journal.cashYear ]]\n        </td>\n    </tr>\n</table>\n\n<table class=\"journal-table\">\n    <tr>\n        <th>#</th>\n        <th class=\"num\">Income</th>\n        <th class=\"num\">Expenses</th>\n        <th class=\"num\">Balance [[ currency ]]</th>\n        <th>Account</th>\n        <th class=\"nowrap\">Invoice no.</th>\n        <th class=\"nowrap\">Document no.</th>\n        <th class=\"nowrap\">Date</th>\n        <th>Notes</th>\n    </tr>\n    <tr data-repeat=\"journal.cashJournalEntries\" data-repeat-as=\"entry\">\n        <td class=\"center\">[[ loop.index ]]</td>\n        <td class=\"num\">[[ entry.incomesF ]]</td>\n        <td class=\"num\">[[ entry.expensesF ]]</td>\n        <td class=\"num\">[[ entry.inventoryF ]]</td>\n        <td>[[ entry.counterAccount ]]</td>\n        <td class=\"nowrap\">[[ entry.invoiceNumber ]]</td>\n        <td class=\"nowrap\">[[ entry.documentNumberF ]]</td>\n        <td class=\"nowrap\">[[ entry.date|date(\'d.m.Y\') ]]</td>\n        <td>[[ entry.remark ]]</td>\n    </tr>\n</table>\n\n<table class=\"totals-table\">\n    <tr>\n        <td class=\"totals-label\">Opening balance:</td>\n        <td class=\"totals-value\">[[ journal.cashStartF ]] [[ currency ]]</td>\n    </tr>\n    <tr>\n        <td class=\"totals-label\">Closing balance:</td>\n        <td class=\"totals-value\">[[ journal.cashEndF ]] [[ currency ]]</td>\n    </tr>\n</table>\n</body>\n</html>\n','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,0,NULL),(2,10,'Lanka IOC - Booking Journal','<!DOCTYPE html>\n<html lang=\"de\">\n<head>\n    <meta charset=\"UTF-8\">\n    <style type=\"text/css\">\n        body {\n            font-family: Arial, Helvetica, sans-serif;\n            font-size: 9pt;\n            color: #24323f;\n        }\n\n        .page {\n            position: relative;\n        }\n\n        .header-table {\n            width: 100%;\n            border-collapse: collapse;\n            margin-bottom: 14px;\n            border-bottom: 2px solid #17364d;\n        }\n\n        .header-title {\n            font-size: 18pt;\n            font-weight: bold;\n            color: #17364d;\n            padding-bottom: 8px;\n        }\n\n        .header-period {\n            text-align: right;\n            font-size: 10pt;\n            color: #4b5d6b;\n            vertical-align: bottom;\n            padding-bottom: 10px;\n        }\n\n        .journal-table {\n            width: 100%;\n            border-collapse: collapse;\n            table-layout: fixed;\n        }\n\n        .journal-table th {\n            background: #17364d;\n            color: #ffffff;\n            font-size: 8pt;\n            font-weight: bold;\n            text-align: left;\n            padding: 8px 7px;\n            border-right: 1px solid #365772;\n        }\n\n        .journal-table th:last-child {\n            border-right: none;\n        }\n\n        .journal-table td {\n            padding: 7px;\n            border-bottom: 1px solid #dce5eb;\n            border-right: 1px solid #edf2f6;\n            vertical-align: top;\n            word-wrap: break-word;\n        }\n\n        .journal-table td:last-child {\n            border-right: none;\n        }\n\n        .journal-table tr:nth-child(even) td {\n            background: #f8fbfd;\n        }\n\n        .num {\n            text-align: right;\n            white-space: nowrap;\n        }\n\n        .center {\n            text-align: center;\n        }\n\n        .footer {\n            position: fixed;\n            bottom: -12mm;\n            left: 0;\n            right: 0;\n            font-size: 8pt;\n            color: #6c7b88;\n        }\n\n        .footer-table {\n            width: 100%;\n            border-collapse: collapse;\n        }\n    </style>\n</head>\n<body>\n    <div class=\"footer\">\n        <table class=\"footer-table\">\n            <tr>\n                <td>Booking Journal | [[ \"now\"|date(\"d.m.Y\") ]]</td>\n                <td style=\"text-align: right;\">{PAGENO}/{nbpg}</td>\n            </tr>\n        </table>\n    </div>\n<div class=\"page\">\n    <table class=\"header-table\">\n        <tr>\n            <td class=\"header-title\">Booking Journal</td>\n            <td class=\"header-period\">\n                [[ getLocalizedMonth(journal.month, \'MMMM\', app.request.locale) ]] [[ journal.year ]]\n            </td>\n        </tr>\n    </table>\n\n    <table class=\"journal-table\">\n        <tr>\n            <th style=\"width: 7%;\">Document</th>\n            <th style=\"width: 9%;\">Date</th>\n            <th style=\"width: 17%;\">Debit account</th>\n            <th style=\"width: 17%;\">Credit account</th>\n            <th style=\"width: 10%;\" class=\"num\">Amount</th>\n            <th style=\"width: 8%;\" class=\"center\">Tax</th>\n            <th style=\"width: 13%;\">Invoice</th>\n            <th style=\"width: 17%;\">Notes</th>\n        </tr>\n        <tr data-repeat=\"journal.entries\" data-repeat-as=\"entry\">\n            <td>[[ entry.documentNumberF ]]</td>\n            <td>[[ entry.date|date(\'d.m.Y\') ]]</td>\n            <td>[[ entry.debitAccount ? entry.debitAccount.label : \'â€“\' ]]</td>\n            <td>[[ entry.creditAccount ? entry.creditAccount.label : \'â€“\' ]]</td>\n            <td class=\"num\">[[ entry.amountF ]] [[ currency ]]</td>\n            <td class=\"center\">[[ entry.taxRate ? entry.taxRate.rate : \'0.00\' ]] %</td>\n            <td>[[ entry.invoiceNumber ?: \'â€“\' ]]</td>\n            <td>[[ entry.remark ?: \'â€“\' ]]</td>\n        </tr>\n    </table>\n</div>\n</body>\n</html>\n','{\"format\":\"A4\",\"orientation\":\"L\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',1,0,NULL),(3,11,'Lanka IOC - Guest Data Export','<!DOCTYPE html>\n<html>\n<head>\n<style type=\"text/css\">\n.general {\n    border-collapse: collapse;\n    border: 0;\n    border-spacing: 0;\n    width: 100%;\n}\n\n.general td {\n    padding: 4px;\n    vertical-align: top;\n}\n\n.general .first {\n    width: 25%;\n}\n\nh1 {\n    margin: 0;\n    color: #333333;\n}\n</style>\n</head>\n<body>\n<h1>Guest information</h1>\n<table class=\"general\">\n<tbody>\n<tr>\n<td class=\"first\">Name:</td>\n<td>[[ customer.salutation ]] [[ customer.firstname ]] [[ customer.lastname ]]</td>\n</tr>\n<tr>\n<td class=\"first\">Date of birth:</td>\n<td>[[ customer.birthday ? customer.birthday|date(\'d.m.Y\') : \'\' ]]</td>\n</tr>\n<tr>\n<td class=\"first\">Notes:</td>\n<td>[[ customer.remarkF ]]</td>\n</tr>\n</tbody>\n</table>\n<h1>Addresses</h1>\n<div data-repeat=\"customer.customerAddresses\" data-repeat-as=\"address\">\n<h6 class=\"panel-title\">[[ \'customer.contact\'|trans ]] ([[ address.type|trans ]])</h6>\n<table class=\"general\">\n<tbody>\n<tr data-if=\"address.company\">\n<td class=\"first\">[[ \'customer.company\'|trans ]]:</td>\n<td>[[ address.company ]]</td>\n</tr>\n<tr>\n<td class=\"first\">[[ \'reservation.preview.customer.address\'|trans ]]:</td>\n<td>[[ address.address ]]<br />[[ address.zip ]] [[ address.city ]]<br />[[ address.country ]]</td>\n</tr>\n<tr>\n<td class=\"first\">[[ \'customer.email\'|trans ]]:</td>\n<td>[[ address.email ? address.email : \'-\' ]]</td>\n</tr>\n<tr>\n<td class=\"first\">[[ \'customer.phone\'|trans ]]:</td>\n<td>[[ address.phone ? address.phone : \'-\' ]]</td>\n</tr>\n<tr>\n<td class=\"first\">[[ \'customer.fax\'|trans ]]:</td>\n<td>[[ address.fax ? address.fax : \'-\' ]]</td>\n</tr>\n<tr>\n<td class=\"first\">[[ \'customer.mobilephone\'|trans ]]:</td>\n<td>[[ address.mobilephone ? address.mobilephone : \'-\' ]]</td>\n</tr>\n</tbody>\n</table>\n</div>\n<h1>Stays</h1>\n<div data-repeat=\"customer.reservations\" data-repeat-as=\"reservation\">\n<h6>[[ reservation.startDate|date(\'d.m.Y\') ]] - [[ reservation.endDate|date(\'d.m.Y\') ]] ([[ reservation.appartment.description ]])</h6>\n<table class=\"general\">\n<tbody>\n<tr>\n<td class=\"first\">Booking source:</td>\n<td>[[ reservation.reservationOrigin.name ]]</td>\n</tr>\n<tr>\n<td class=\"first\">Number of guests:</td>\n<td>[[ reservation.persons ]]</td>\n</tr>\n<tr>\n<td class=\"first\">Invoices:</td>\n<td><span data-repeat=\"reservation.invoices\" data-repeat-as=\"invoice\">[[ invoice.number ]] ([[ invoice.date|date(\'d.m.Y\') ]]), </span></td>\n</tr>\n</tbody>\n</table>\n</div>\n</body>\n</html>\n','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',1,0,NULL),(4,8,'Lanka IOC - Invoice','<!DOCTYPE html>\n<html><head><meta charset=\"UTF-8\"><style>\nbody { font-family: Arial, sans-serif; font-size: 10pt; color: #24323f; }\nh1 { font-size: 19pt; color: #17364d; }\ntable { width: 100%; border-collapse: collapse; }\nth { background: #f2f2f2; text-align: left; }\nth, td { padding: 7px 5px; border-bottom: 1px solid #ddd; vertical-align: top; }\n.num { text-align: right; }\n</style></head><body>\n<h1>Lanka IOC Guest House</h1>\n<h2>Invoice</h2>\n<p><strong>Invoice number:</strong> [[ invoice.number ]]<br>\n<strong>Invoice date:</strong> [[ invoice.date|date(\'d.m.Y\') ]]</p>\n<p><strong>Bill to</strong><br>\n[[ invoice.firstname ]] [[ invoice.lastname ]]<br>\n[[ invoice.company ]]<br>[[ invoice.address ]]<br>[[ invoice.zip ]] [[ invoice.city ]]</p>\n<table>\n<thead><tr><th>Description</th><th class=\"num\">Quantity</th><th class=\"num\">Unit price</th><th class=\"num\">Tax %</th><th class=\"num\">Total</th></tr></thead>\n<tbody>\n<tr data-repeat=\"invoice.appartments\" data-repeat-as=\"appartment\">\n<td>[[ appartment.description ]] ([[ appartment.persons ]] guests)<br>[[ appartment.startDate|date(\'d.m.Y\') ]] - [[ appartment.endDate|date(\'d.m.Y\') ]]</td>\n<td class=\"num\">[[ appartment.amount ]]</td><td class=\"num\">[[ appartment.priceFormated ]] [[ currency ]]</td><td class=\"num\">[[ appartment.vat ]]</td><td class=\"num\">[[ appartment.totalPrice ]] [[ currency ]]</td>\n</tr>\n<tr data-repeat=\"invoice.positions\" data-repeat-as=\"position\">\n<td>[[ position.description ]]</td><td class=\"num\">[[ position.amount ]]</td><td class=\"num\">[[ position.priceFormated ]] [[ currency ]]</td><td class=\"num\">[[ position.vat ]]</td><td class=\"num\">[[ position.totalPrice ]] [[ currency ]]</td>\n</tr>\n</tbody></table>\n<p style=\"text-align:right\"><strong>Total: [[ bruttoFormated ]] [[ currency ]]</strong></p>\n<p data-if=\"invoice.remark\"><strong>Notes:</strong> [[ invoice.remark ]]</p>\n<p>Thank you for staying with us.</p>\n</body></html>','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',1,0,NULL),(5,1,'Lanka IOC - Daily House Keepig','<style>\n        body { font-family: Arial, sans-serif; font-size: 12px; }\n        table { width: 100%; border-collapse: collapse; }\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\n        th { background: #f2f2f2; text-align: left; }\n        .muted { color: #666; font-size: 11px; }\n    </style><div class=\"header\"><div class=\"muted\" style=\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\"simple.meta.occupancyTypeLabelKeys\" data-repeat-as=\"type\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</p></div></div><div class=\"footer\"><div class=\"muted\" style=\"text-align: right; font-size: 10px;\"><p>Page {PAGENO} of {nbpg}</p></div></div><p>Lanka IOC Guest House</p><p></p><h2>[[ \'housekeeping.title\'|trans({}, \'Housekeeping\') ]] ([[ simple.views.housekeepingDay.date|date(\'d.m.Y\') ]])</h2><table style=\"min-width: 175px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><th colspan=\"1\" rowspan=\"1\"><p>[[ \'housekeeping.room\'|trans({}, \'Housekeeping\') ]]</p></th><th colspan=\"1\" rowspan=\"1\"><p>[[ \'housekeeping.occupancy\'|trans({}, \'Housekeeping\') ]]</p></th><th colspan=\"1\" rowspan=\"1\"><p>[[ \'housekeeping.guests\'|trans({}, \'Housekeeping\') ]]</p></th><th colspan=\"1\" rowspan=\"1\"><p>[[ \'housekeeping.reservation\'|trans({}, \'Housekeeping\') ]]</p></th><th colspan=\"1\" rowspan=\"1\"><p>[[ \'housekeeping.status\'|trans({}, \'Housekeeping\') ]]</p></th><th colspan=\"1\" rowspan=\"1\"><p>[[ \'housekeeping.assigned_to\'|trans({}, \'Housekeeping\') ]]</p></th><th colspan=\"1\" rowspan=\"1\" style=\"width: 20%;\"><p>[[ \'housekeeping.note\'|trans({}, \'Housekeeping\') ]]</p></th></tr><tr data-repeat=\"simple.views.housekeepingDay.rows\" data-repeat-as=\"row\"><td colspan=\"1\" rowspan=\"1\"><p>[[ row.room ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.occupancyLabelKey|trans({}, \'Housekeeping\') ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.guests ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.reservationSummary ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.statusLabelKey ? (row.statusLabelKey|trans({}, \'Housekeeping\')) : \'\' ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.assignedTo ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.note ]]</p></td></tr></tbody></table><p></p>','{\"format\":\"A4\",\"orientation\":\"L\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',1,0,NULL),(6,1,'Lanka IOC - Weekly Housekeeping Report','<style>\n        body { font-family: Arial, sans-serif; font-size: 12px; }\n        table { width: 100%; border-collapse: collapse; }\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\n        th { background: #f2f2f2; text-align: left; }\n        .muted { color: #666; font-size: 11px; }\n    </style><div class=\"header\"><div class=\"muted\" style=\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\"simple.meta.occupancyTypeLabelKeys\" data-repeat-as=\"type\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</p></div></div><div class=\"footer\"><div class=\"muted\" style=\"text-align: right; font-size: 10px;\"><p>Page {PAGENO} of {nbpg}</p></div></div><h2>Weekly Housekeeping Report ([[ simple.meta.periodLabel ]])</h2><table style=\"min-width: 50px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><th colspan=\"1\" rowspan=\"1\"><p>Room</p></th><th colspan=\"1\" rowspan=\"1\" data-repeat=\"simple.days\" data-repeat-as=\"day\" style=\"width: 11%;\"><p>[[ day.label ]]</p></th></tr><tr data-repeat=\"simple.views.housekeepingWeek.rows\" data-repeat-as=\"row\"><td colspan=\"1\" rowspan=\"1\"><p>[[ row.apartmentLabel ]]</p></td><td colspan=\"1\" rowspan=\"1\" data-repeat=\"row.cells\" data-repeat-as=\"cell\"><p>[[ cell.occupancyLabelKey ? (cell.occupancyLabelKey|trans({}, \'Housekeeping\')) : \'\' ]] [[ cell.statusLabelKey ? \' / \' ~ (cell.statusLabelKey|trans({}, \'Housekeeping\')) : \'\' ]] [[ cell.guests ? \' / \' ~ cell.guests : \'\' ]]</p></td></tr></tbody></table><p></p>','{\"format\":\"A4\",\"orientation\":\"L\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,0,NULL),(7,1,'Lanka IOC - Front Desk Checklist','<style>\n        body { font-family: Arial, sans-serif; font-size: 12px; }\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\n        th { background: #f2f2f2; text-align: left; }\n        .checkbox { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; }\n        .section-title { font-weight: bold; margin: 14px 0 6px; }\n        .muted { color: #666; font-size: 11px; }\n    </style><div class=\"header\"><div class=\"muted\" style=\"text-align: center; color: rgb(102, 102, 102); font-size: 11px;\"><p>[[ simple.meta.periodLabel ]]<span data-repeat=\"simple.meta.occupancyTypeLabelKeys\" data-repeat-as=\"type\">| [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | generated [[ simple.meta.generatedAt ]]</p></div></div><div class=\"footer\"><div class=\"muted\" style=\"text-align: right; font-size: 10px;\"><p>page {PAGENO} of {nbpg}</p></div></div><h2>Front Desk Checklist</h2><div data-repeat=\"simple.views.frontdesk.sections\" data-repeat-as=\"section\"><div class=\"section-title\"><p>[[ section.titleKey|trans ]]</p></div><table style=\"min-width: 264px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"width: 89px;\"></colgroup><tbody><tr><th colspan=\"1\" rowspan=\"1\"><p>Guest Name</p></th><th colspan=\"1\" rowspan=\"1\"><p>Guests</p></th><th colspan=\"1\" rowspan=\"1\"><p>Room</p></th><th colspan=\"1\" rowspan=\"1\"><p>Stay dates</p></th><th colspan=\"1\" rowspan=\"1\"><p>Invoice Status</p></th><th colspan=\"1\" rowspan=\"1\"><p>Registration Form</p></th><th colspan=\"1\" rowspan=\"1\"><p>Key</p></th><th colspan=\"1\" rowspan=\"1\" colwidth=\"89\"><p>Invoice</p></th></tr><tr data-repeat=\"section.rows\" data-repeat-as=\"row\"><td colspan=\"1\" rowspan=\"1\"><p>[[ row.guest ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.persons ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.room ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.period ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ row.invoiceStatusLabelKey ? (row.invoiceStatusLabelKey|trans) : \'-\' ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p></p></td><td colspan=\"1\" rowspan=\"1\"><p></p></td><td colspan=\"1\" rowspan=\"1\" colwidth=\"89\"><p></p></td></tr><tr data-if=\"section.rows is empty\"><td colspan=\"8\" rowspan=\"1\" colwidth=\"0,0,0,0,0,0,0,89\"><p>-</p></td></tr></tbody></table></div><p></p>','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,0,NULL),(8,1,'Lanka IOC - Breakfast Checklist (Manual)','<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <style>\n        body { font-family: Arial, sans-serif; font-size: 12px; }\n        table { width: 100%; border-collapse: collapse; }\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\n        th { background: #f2f2f2; text-align: left; }\n        .room { font-weight: bold; }\n        .muted { color: #666; font-size: 11px; }\n    </style>\n</head>\n<body>\n    <div class=\"header\"><div class=\"muted\" style=\"text-align: center; color: #666; font-size: 11px;\">[[ simple.meta.periodLabel ]]<span data-repeat=\"simple.meta.occupancyTypeLabelKeys\" data-repeat-as=\"type\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</div></div>\n    <div class=\"footer\"><div class=\"muted\" style=\"text-align: right; font-size: 10px;\">Page {PAGENO} of {nbpg}</div></div>\n    \n    <h2>Breakfast Checklist (Manual)</h2><p>Use this checklist to record breakfast manually. It does not include recorded meal orders or charges.</p>\n    <table>\n        <thead>\n        <tr>\n            <th>Room</th>\n            <th>Guest</th>\n            <th data-repeat=\"simple.days\" data-repeat-as=\"day\">[[ day.label ]]</th>\n        </tr>\n        </thead>\n        <tbody>\n        <tr data-repeat=\"simple.views.mealsChecklist.rows\" data-repeat-as=\"row\">\n            <td>[[ row.room ]]</td>\n            <td>[[ row.guest ]]</td>\n            <td data-repeat=\"row.cells\" data-repeat-as=\"cell\"></td>\n        </tr>\n        </tbody>\n    </table>\n    <p data-if=\"simple.views.mealsChecklist.rows is empty\">-</p>\n    \n</body>\n</html>\n','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,0,NULL),(9,1,'Lanka IOC - Monthly Operations Summary','<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <style>\n        body { font-family: Arial, sans-serif; font-size: 12px; }\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\n        th { background: #f2f2f2; text-align: left; }\n        .muted { color: #666; font-size: 11px; }\n    </style>\n</head>\n<body>\n    <div class=\"header\"><div class=\"muted\" style=\"text-align: center; color: #666; font-size: 11px;\">[[ simple.meta.periodLabel ]]<span data-repeat=\"simple.meta.occupancyTypeLabelKeys\" data-repeat-as=\"type\"> | [[ occupancyLabels[type]|trans({}, \'Housekeeping\') ]]</span> | [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] | Generated [[ simple.meta.generatedAt ]]</div></div>\n    <div class=\"footer\"><div class=\"muted\" style=\"text-align: right; font-size: 10px;\">Page {PAGENO} of {nbpg}</div></div>\n\n    <h2>Monthly Occupancy and Operations Summary</h2>\n    <div>\n    {% set selectedYear = filters.start|date(\'Y\') %}\n    {% set selectedMonth = filters.start|date(\'n\') %}\n    {% set currentStats = null %}\n    {% for entry in statistics.months %}\n        {% if entry.year == selectedYear and entry.month == selectedMonth %}\n            {% set currentStats = entry.metrics %}\n        {% endif %}\n    {% endfor %}\n    {% set summary = currentStats.summary ?? {} %}\n    </div>\n    <div class=\"muted\" style=\"margin-bottom: 10px;\">\n        Period: [[ simple.meta.periodLabel ]]\n    </div>\n\n    <table>\n        <tr>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Reservations</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">[[ summary.reservations_total ?? \'-\' ]]</div>\n                </div>\n            </td>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Guests</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">[[ summary.guests_total ?? \'-\' ]]</div>\n                </div>\n            </td>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Nights</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">[[ summary.nights_total ?? \'-\' ]]</div>\n                </div>\n            </td>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Occupancy</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">\n                        {% if currentStats and currentStats.utilization is defined %}\n                            [[ currentStats.utilization.month_percent|number_format(1, \',\', \'.\') ]] %\n                        {% else %}\n                            -\n                        {% endif %}\n                    </div>\n                </div>\n            </td>\n        </tr>\n        <tr>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Arrivals</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">[[ summary.arrivals_total ?? \'-\' ]]</div>\n                </div>\n            </td>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Departures</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">[[ summary.departures_total ?? \'-\' ]]</div>\n                </div>\n            </td>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Room turnovers</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">[[ summary.turnovers_count ?? \'-\' ]]</div>\n                </div>\n            </td>\n            <td>\n                <div style=\"padding: 10px;\">\n                    <div class=\"muted\">Invoiced amount</div>\n                    <div style=\"font-size: 18px; font-weight: bold;\">\n                        {% if currentStats and currentStats.turnover is defined %}\n                            [[ currentStats.turnover.total|number_format(2, \',\', \'.\') ]]\n                        {% else %}\n                            -\n                        {% endif %}\n                    </div>\n                </div>\n            </td>\n        </tr>\n    </table>\n\n    <h3>Daily overview</h3>\n    <table>\n        <thead>\n        <tr>\n            <th>Date</th>\n            <th>Occupied rooms</th>\n            <th>Guests in house</th>\n            <th>Arrivals</th>\n            <th>Departures</th>\n            <th>Room turnovers</th>\n        </tr>\n        </thead>\n        <tbody>\n        {% for day in rangeView.days %}\n            {% if day|date(\'Y\') == selectedYear and day|date(\'n\') == selectedMonth %}\n                {% set dayKey = day|date(\'Y-m-d\') %}\n                {% set dayView = dayViews[dayKey] ?? null %}\n                {% set rows = dayView ? dayView.rows : [] %}\n                {% set occupiedRooms = 0 %}\n                {% set guestsInhouse = 0 %}\n                {% set arrivals = 0 %}\n                {% set departures = 0 %}\n                {% set turnovers = 0 %}\n                {% for row in rows %}\n                    {% if row.occupancyType != \'FREE\' %}\n                        {% set occupiedRooms = occupiedRooms + 1 %}\n                    {% endif %}\n                    {% if row.guestCount is not null %}\n                        {% set guestsInhouse = guestsInhouse + row.guestCount %}\n                    {% endif %}\n                    {% if row.occupancyType == \'ARRIVAL\' %}\n                        {% set arrivals = arrivals + 1 %}\n                    {% elseif row.occupancyType == \'DEPARTURE\' %}\n                        {% set departures = departures + 1 %}\n                    {% elseif row.occupancyType == \'TURNOVER\' %}\n                        {% set arrivals = arrivals + 1 %}\n                        {% set departures = departures + 1 %}\n                        {% set turnovers = turnovers + 1 %}\n                    {% endif %}\n                {% endfor %}\n                <tr>\n                    <td>[[ day|date(\'d.m.Y\') ]]</td>\n                    <td>[[ occupiedRooms ]]</td>\n                    <td>[[ guestsInhouse ]]</td>\n                    <td>[[ arrivals ]]</td>\n                    <td>[[ departures ]]</td>\n                    <td>[[ turnovers ]]</td>\n                </tr>\n            {% endif %}\n        {% endfor %}\n        </tbody>\n    </table>\n\n    <h3>Highlights</h3>\n    <table>\n        <thead>\n        <tr>\n            <th>Top 5 Zimmer (belegte Nights)</th>\n            <th>Top 5 longest stays</th>\n        </tr>\n        </thead>\n        <tbody>\n        <tr>\n            <td>\n                {% set nightsByApartment = {} %}\n                {% for day in rangeView.days %}\n                    {% if day|date(\'Y\') == selectedYear and day|date(\'n\') == selectedMonth %}\n                        {% set dayKey = day|date(\'Y-m-d\') %}\n                        {% set dayView = dayViews[dayKey] ?? null %}\n                        {% if dayView %}\n                            {% for row in dayView.rows %}\n                                {% if row.occupancyType != \'FREE\' %}\n                                    {% set idKey = \'a\' ~ row.apartment.id %}\n                                    {% set current = nightsByApartment[idKey] ?? 0 %}\n                                    {% set nightsByApartment = nightsByApartment|merge({ (idKey): current + 1 }) %}\n                                {% endif %}\n                            {% endfor %}\n                        {% endif %}\n                    {% endif %}\n                {% endfor %}\n                {% set nightsList = [] %}\n                {% for apartment in rangeView.apartments %}\n                    {% set idKey = \'a\' ~ apartment.id %}\n                    {% if nightsByApartment[idKey] is defined %}\n                        {% set nightsList = nightsList|merge([{\n                            \'label\': apartment.number ~ \' \' ~ apartment.description,\n                            \'nights\': nightsByApartment[idKey]\n                        }]) %}\n                    {% endif %}\n                {% endfor %}\n                {% set nightsList = nightsList|sort((a, b) => b.nights <=> a.nights) %}\n                {% for item in nightsList|slice(0, 5) %}\n                    [[ item.label ]] ([[ item.nights ]])<br>\n                {% else %}\n                    -\n                {% endfor %}\n            </td>\n            <td>\n                {% set stays = [] %}\n                {% for reservation in reservations %}\n                    {% set nights = date_difference(reservation.startDate|date(\'d.m.Y\'), reservation.endDate|date(\'d.m.Y\')) %}\n                    {% set stays = stays|merge([{\n                        \'label\': (reservation.appartment ? reservation.appartment.number : \'-\') ~ \' - \' ~ (reservation.booker ? reservation.booker.lastname : \'\'),\n                        \'nights\': nights\n                    }]) %}\n                {% endfor %}\n                {% set stays = stays|sort((a, b) => b.nights <=> a.nights) %}\n                {% for item in stays|slice(0, 5) %}\n                    [[ item.label ]] ([[ item.nights ]])<br>\n                {% else %}\n                    -\n                {% endfor %}\n            </td>\n        </tr>\n        </tbody>\n    </table>\n\n    <h3>Booking sources</h3>\n    <table>\n        <thead>\n        <tr>\n            <th>Source</th>\n            <th>Count</th>\n        </tr>\n        </thead>\n        <tbody>\n        {% if currentStats and currentStats.reservation_origin is defined %}\n            {% for origin, count in currentStats.reservation_origin %}\n                <tr>\n                    <td>[[ origin ]]</td>\n                    <td>[[ count ]]</td>\n                </tr>\n            {% else %}\n                <tr>\n                    <td colspan=\"2\">-</td>\n                </tr>\n            {% endfor %}\n        {% else %}\n            <tr>\n                <td colspan=\"2\">-</td>\n            </tr>\n        {% endif %}\n        </tbody>\n    </table>\n</body>\n</html>\n','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,0,NULL),(10,1,'Monatsabrechnung Beherbergungsabgaben','<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <style>\n        body { font-family: Arial, sans-serif; font-size: 12px; }\n        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }\n        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }\n        th { background: #e8eef2; text-align: left; }\n        .text-right { text-align: right; }\n        .muted { color: #666; font-size: 11px; }\n        .section-title { background: #2e6c80; color: #fff; padding: 6px 8px; margin-top: 14px; font-weight: bold; }\n        .totals-row { background: #f0f4f7; font-weight: bold; }\n        .empty-cell { color: #999; }\n    </style>\n</head>\n<body>\n    <div class=\"header\">\n        <div class=\"muted\" style=\"text-align: center;\">\n            [[ simple.meta.subsidiaryName ?: (simple.meta.subsidiaryAllLabelKey|trans({}, \'Housekeeping\')) ]] |\n            [[ simple.meta.periodLabel ]] |\n            Erzeugt [[ simple.meta.generatedAt ]]\n        </div>\n    </div>\n    <div class=\"footer\">\n        <div class=\"muted\" style=\"text-align: right; font-size: 10px;\">Seite {PAGENO} von {nbpg}</div>\n    </div>\n\n    <h2>Abrechnung Beherbergungsabgaben â€” [[ filters.start|date(\'m.Y\') ]]</h2>\n\n    [% set selectedYear = filters.start|date(\'Y\') %]\n    [% set selectedMonth = filters.start|date(\'n\') %]\n    [% set currentTaxMonth = touristTax.months|filter(m => m.year == selectedYear and m.month == selectedMonth)|first %]\n    [% set currentTaxes = currentTaxMonth ? currentTaxMonth.taxes : [] %]\n\n    <div data-repeat=\"currentTaxes\" data-repeat-as=\"tax\">\n        <div class=\"section-title\">[[ tax.name ]]</div>\n        <table>\n            <thead>\n                <tr>\n                    <th style=\"width: 20%;\">Anzahl Ãœbernachtungen</th>\n                    <th>GÃ¤ste</th>\n                    <th class=\"text-right\" style=\"width: 18%;\">Preis pro Nacht</th>\n                    <th class=\"text-right\" style=\"width: 18%;\">Summe</th>\n                </tr>\n            </thead>\n            <tbody>\n                <tr data-repeat=\"tax.groups\" data-repeat-as=\"group\">\n                    <td>[[ group.totalNights ]]</td>\n                    <td>\n                        [[ group.label ]]\n                        <span data-if=\"not group.pricePerNightConsistent\" class=\"muted\">(uneinheitliche Preise â€” bitte Konfiguration prÃ¼fen)</span>\n                    </td>\n                    <td class=\"text-right\">[[ group.pricePerNight|number_format(2, \',\', \'.\') ]]</td>\n                    <td class=\"text-right\">[[ group.totalAmount|number_format(2, \',\', \'.\') ]]</td>\n                </tr>\n                <tr data-if=\"tax.groups is empty\">\n                    <td colspan=\"4\" class=\"muted\">Keine Buchungen mit Preis in diesem Zeitraum.</td>\n                </tr>\n                <tr data-if=\"tax.groups is not empty\" class=\"totals-row\">\n                    <td>[[ tax.totalNights ]]</td>\n                    <td colspan=\"2\">Summe</td>\n                    <td class=\"text-right\">[[ tax.totalAmount|number_format(2, \',\', \'.\') ]]</td>\n                </tr>\n            </tbody>\n        </table>\n    </div>\n    <div data-if=\"currentTaxes is empty\" class=\"muted\">Keine gÃ¼ltigen Beherbergungsabgaben fÃ¼r den gewÃ¤hlten Monat konfiguriert.</div>\n\n    [% set currentStatisticsMonth = statistics.months|filter(m => m.year == selectedYear and m.month == selectedMonth)|first %]\n    [% set currentMetrics = currentStatisticsMonth ? currentStatisticsMonth.metrics : null %]\n    [% set countryAndCategory = currentMetrics.tourism.overnights_by_country_and_category ?? {} %]\n    [% set columnTotals = {} %]\n    [% set grandTotal = 0 %]\n\n    <div class=\"section-title\">Ãœbernachtungen nach LÃ¤ndern</div>\n    <table>\n        <thead>\n            <tr>\n                <th>Land</th>\n                <th data-repeat=\"touristTax.guestCategories\" data-repeat-as=\"category\" class=\"text-right\">[[ category.name ]]</th>\n                <th class=\"text-right\">Gesamt</th>\n            </tr>\n        </thead>\n        <tbody>\n            <tr data-repeat=\"countryAndCategory\" data-repeat-key=\"countryCode\" data-repeat-as=\"rowData\">\n                [% set rowTotal = 0 %]\n                <td>[[ statistics.countryNames[countryCode|upper] ?? countryCode ]]</td>\n                <td data-repeat=\"touristTax.guestCategories\" data-repeat-as=\"category\" class=\"text-right\">\n                    [% set categoryTotalKey = \'category_\' ~ category.id %]\n                    [% set v = rowData[category.id] ?? 0 %]\n                    [% set rowTotal = rowTotal + v %]\n                    [% set columnTotals = columnTotals|merge({ (categoryTotalKey): (columnTotals[categoryTotalKey] ?? 0) + v }) %]\n                    [[ v|round(0) ]]\n                </td>\n                [% set grandTotal = grandTotal + rowTotal %]\n                <td class=\"text-right\">[[ rowTotal|round(0) ]]</td>\n            </tr>\n            <tr data-if=\"countryAndCategory is empty\">\n                <td colspan=\"99\" class=\"muted\">Keine Ãœbernachtungen nach LÃ¤ndern in diesem Zeitraum vorhanden.</td>\n            </tr>\n            <tr class=\"totals-row\">\n                <td>Gesamt</td>\n                <td data-repeat=\"touristTax.guestCategories\" data-repeat-as=\"category\" class=\"text-right\">[[ (columnTotals[\'category_\' ~ category.id] ?? 0)|round(0) ]]</td>\n                <td class=\"text-right\">[[ grandTotal|round(0) ]]</td>\n            </tr>\n        </tbody>\n    </table>\n\n    <div class=\"muted\" style=\"margin-top: 14px;\">\n        * Befreiungen richten sich nach den jeweils geltenden lokalen Bestimmungen. Der vorliegende Bericht\n        wird vollstÃ¤ndig aus den in der PMS-Software gepflegten Gastkategorien und Preisen erzeugt; wenn die\n        Konfiguration angepasst wird, Ã¤ndern sich die Zahlen im nÃ¤chsten Berichtsdruck automatisch.\n    </div>\n</body>\n</html>\n','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,1,NULL),(11,2,'Lanka IOC - Guest Registration Form','<style>\n        body {\n            font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif;\n            font-size: 10pt;\n            color: #333;\n            margin: 0;\n            padding: 20px 30px;\n            line-height: 1.4;\n        }\n        h1 {\n            font-size: 16pt;\n            font-weight: 600;\n            margin: 0 0 4px;\n            color: #1a1a1a;\n            letter-spacing: 0.3px;\n        }\n        .subtitle {\n            font-size: 9pt;\n            color: #888;\n            margin: 0 0 18px;\n            padding-bottom: 10px;\n            border-bottom: 2px solid #2c3e50;\n        }\n        .section-header {\n            font-size: 9pt;\n            font-weight: 700;\n            text-transform: uppercase;\n            letter-spacing: 0.8px;\n            color: #2c3e50;\n            margin: 16px 0 6px;\n            padding: 4px 0;\n            border-bottom: 1px solid #2c3e50;\n        }\n        table {\n            width: 100%;\n            border-collapse: collapse;\n        }\n        td, th {\n            padding: 5px 4px;\n            vertical-align: bottom;\n            font-size: 9pt;\n        }\n        .label {\n            color: #666;\n            font-size: 8pt;\n            padding-bottom: 1px;\n            vertical-align: bottom;\n            white-space: nowrap;\n        }\n        .value {\n            border-bottom: 1px solid #bbb;\n            min-height: 14px;\n            padding-bottom: 2px;\n            color: #1a1a1a;\n        }\n        .empty-value {\n            border-bottom: 1px solid #ccc;\n            min-height: 14px;\n            padding-bottom: 2px;\n        }\n        .guests-table th {\n            font-size: 8pt;\n            color: #666;\n            font-weight: 600;\n            text-align: left;\n            padding: 3px 4px;\n            border-bottom: 1px solid #999;\n        }\n        .guests-table td {\n            border-bottom: 1px solid #ccc;\n            height: 20px;\n        }\n        .signature-area {\n            margin-top: 30px;\n        }\n        .signature-line {\n            border-bottom: 1px solid #999;\n            height: 30px;\n        }\n        .hint {\n            font-size: 7pt;\n            color: #999;\n            margin-top: 20px;\n            text-align: center;\n        }\n        /* Reset p tags inserted by Tiptap editor */\n        h1 p, .subtitle p, .section-header p, .hint p,\n        td p, th p {\n            margin: 0;\n            padding: 0;\n            display: inline;\n        }\n    </style><h1>Lanka IOC Guest House</h1><div class=\"subtitle\"><p>Guest Registration Form</p></div><div class=\"section-header\"><p>Personal Details</p></div><table style=\"min-width: 100px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Name / Last name</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\" style=\"width: 32%;\"><p>[[ (reservation1.booker ? reservation1.booker.lastname : \'\') ?: \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>First name</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\" style=\"width: 32%;\"><p>[[ (reservation1.booker ? reservation1.booker.firstname : \'\') ?: \'&nbsp;\'|raw ]]</p></td></tr><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\"><p>Date of birth</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\"><p>[[ (reservation1.booker and reservation1.booker.birthday ? reservation1.booker.birthday|date(\'d.m.Y\') : \'\') ?: \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\" class=\"label\"><p></p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\"><p></p></td></tr><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\"><p>Country of Address</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\"><p>[[ (address ? address.country : \'\') ?: \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\" class=\"label\"><p>ID number</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\"><p>[[ (reservation1.booker ? reservation1.booker.IDNumber : \'\') ?: \'&nbsp;\'|raw ]]</p></td></tr><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\"><p>Phone</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\"><p>[[ (address ? address.phone : \'\') ?: \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\" class=\"label\"><p>Email</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\"><p>[[ (address ? address.email : \'\') ?: \'&nbsp;\'|raw ]]</p></td></tr></tbody></table><div class=\"section-header\"><p>Stay</p></div><table style=\"min-width: 100px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Arrival</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\" style=\"width: 32%;\"><p>[[ (reservation1 ? reservation1.startDate|date(\'d.m.Y\') : \'\') ?: \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Departure</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\" style=\"width: 32%;\"><p>[[ (reservation1 ? reservation1.endDate|date(\'d.m.Y\') : \'\') ?: \'&nbsp;\'|raw ]]</p></td></tr></tbody></table><div class=\"section-header\"><p>Private Address</p></div><table style=\"min-width: 100px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Street</p></td><td colspan=\"3\" rowspan=\"1\" class=\"value\" style=\"width: 82%;\"><p>[[ (address ? address.address : \'\') ?: \'&nbsp;\'|raw ]]</p></td></tr><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>ZIP, City</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\" style=\"width: 32%;\"><p>[[ (address ? address.zip : \'\') ?: \'&nbsp;\'|raw ]]&nbsp;&nbsp;[[ (address ? address.city : \'\') ?: \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Land / Country</p></td><td colspan=\"1\" rowspan=\"1\" class=\"value\" style=\"width: 32%;\"><p>[[ (address ? address.country : \'\') ?: \'&nbsp;\'|raw ]]</p></td></tr></tbody></table><div class=\"section-header\"><p>Billing Address</p></div><table style=\"min-width: 100px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Company</p></td><td colspan=\"3\" rowspan=\"1\" class=\"value\" style=\"width: 82%;\"><p>[[ (address ? address.company : \'\') ?: \'&nbsp;\'|raw ]]</p></td></tr><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Address</p></td><td colspan=\"3\" rowspan=\"1\" class=\"empty-value\" style=\"width: 82%;\"><p>[[ \'&nbsp;\'|raw ]]</p></td></tr></tbody></table><div class=\"section-header\"><p>Accompanying Guests</p></div><table class=\"guests-table\" style=\"min-width: 75px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><th colspan=\"1\" rowspan=\"1\" style=\"width: 35%;\"><p>Name / Last name</p></th><th colspan=\"1\" rowspan=\"1\" style=\"width: 35%;\"><p>First name</p></th><th colspan=\"1\" rowspan=\"1\" style=\"width: 30%;\"><p>Date of birth</p></th></tr><tr><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td></tr><tr><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td></tr><tr><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td></tr><tr><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\"><p>[[ \'&nbsp;\'|raw ]]</p></td></tr></tbody></table><div class=\"signature-area\"><div class=\"section-header\"><p>Signature</p></div><table style=\"min-width: 100px;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Date</p></td><td colspan=\"1\" rowspan=\"1\" class=\"signature-line\" style=\"width: 32%;\"><p>[[ \'&nbsp;\'|raw ]]</p></td><td colspan=\"1\" rowspan=\"1\" class=\"label\" style=\"width: 18%;\"><p>Signature</p></td><td colspan=\"1\" rowspan=\"1\" class=\"signature-line\" style=\"width: 32%;\"><p>[[ \'&nbsp;\'|raw ]]</p></td></tr></tbody></table></div><div class=\"hint\"><p>Please fill in legibly</p></div><p></p>','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',1,0,NULL),(12,6,'Reservation Email Template','<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>We have received your accommodation request. Our team will review it and contact you with the booking decision and stay details.</p><p>This email acknowledges your request; it does not confirm a reservation.</p><p>Kind regards,<br>Lanka IOC Guest House</p>','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',1,0,'Accommodation request received - Lanka IOC Guest House'),(13,9,'Lanka IOC â€“ Reservation Confirmation','<style>\n    table {\n    border-spacing: 0;\n    border-collapse: collapse; \n    }\n    table th,td {\n    padding-right: 5px;\n    padding-left: 5px;\n    }\n</style><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Lanka IOC Guest House Colombo - 03</span><br><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Apartment 9/3, 9th Floor, Platinum One, Bagatalle Road, Colombo - 03</span><br><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">+94 11 7011 720</span></p><p></p><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">[[reservation1.booker.salutation]] [[reservation1.booker.firstname]] [[reservation1.booker.lastname]]<br>[[address.address]]<br>[[address.zip]] [[address.city]]</span></p><p></p><p></p><p>Reservation Confirmation</p><table style=\"width: 100%;\"><colgroup><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"><col style=\"min-width: 25px;\"></colgroup><tbody><tr style=\"background-color: rgb(206, 212, 217);\"><th colspan=\"1\" rowspan=\"1\" style=\"text-align: left; border-bottom: 1px solid rgb(51, 51, 51);\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Arrival</span></p></th><th colspan=\"1\" rowspan=\"1\" style=\"text-align: left; border-bottom: 1px solid rgb(51, 51, 51);\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Departure</span></p></th><th colspan=\"1\" rowspan=\"1\" style=\"text-align: left; border-bottom: 1px solid rgb(51, 51, 51);\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Room</span></p></th><th colspan=\"1\" rowspan=\"1\" style=\"text-align: left; border-bottom: 1px solid rgb(51, 51, 51);\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Guests</span></p></th><th colspan=\"1\" rowspan=\"1\" style=\"text-align: left; border-bottom: 1px solid rgb(51, 51, 51);\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Price</span></p></th></tr><tr data-repeat=\"apartmentPositions\" data-repeat-as=\"position\"><td colspan=\"1\" rowspan=\"1\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">[[position.startDate|date(\'d.m.Y\')]]</span></p></td><td colspan=\"1\" rowspan=\"1\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">[[position.endDate|date(\'d.m.Y\')]]</span></p></td><td colspan=\"1\" rowspan=\"1\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">[[position.description]]</span></p></td><td colspan=\"1\" rowspan=\"1\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">[[position.persons]]</span></p></td><td colspan=\"1\" rowspan=\"1\"><p><span style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">[[position.totalPrice]] â‚¬</span></p></td></tr></tbody></table><p style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\"><span data-repeat=\"miscPositions\" data-repeat-as=\"position\">[[position.description]]: [[position.totalPrice]] LKR<br></span></p><p style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\"><strong>Total: [[totalPrice]] LKR<br></strong></p><p style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">We are pleased to confirm your accommodation reservation as shown above.</p><p style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Please contact the guest house if you need to change your booking or require further information.</p><p style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Kind regards,</p><p style=\"font-family: arial, helvetica, sans-serif; font-size: 11pt;\">Lanka IOC Guest House</p><p></p>','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',1,0,NULL),(14,6,'Lanka IOC - Arrival Information','<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>We look forward to welcoming you to the Lanka IOC Guest House.</p><p>Please refer to your reservation confirmation for your guest house, room, and stay dates.</p><p>If your arrival plans change or you have any questions before your stay, please contact the guest house.</p><p>Kind regards,</p><p>Lanka IOC Guest House.</p>','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,0,'Information for your upcoming stay â€“ Lanka IOC Guest House'),(15,6,'Lanka IOC - Reservation Updated','<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]], </p><p>Your accommadation reservation has been updated.</p><p>Please find the updated reservation confirmation attached. Review the details and contact the guest house if you have any questions.</p><p>Kind regards,</p><p>Lanka IOC Guest House</p>','{\"format\":\"A4\",\"orientation\":\"P\",\"marginLeft\":25,\"marginRight\":20,\"marginTop\":20,\"marginBottom\":20,\"marginHeader\":9,\"marginFooter\":9}',0,0,'Your reservation has been updated â€“ Lanka IOC Guest House'),(16,6,'Lanka IOC - Reservation Confirmation Email','<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>Thank you for your booking. Your reservation has been confirmed.</p><p>Please find your reservation confirmation attached, with the details of your stay.</p><p>Kind regards,<br>Lanka IOC Guest House</p>',NULL,0,0,'Your reservation is confirmed - Lanka IOC Guest House'),(17,6,'Lanka IOC - Reservation Cancellation Email','<p>Dear [[ reservation1.booker.firstname ]] [[ reservation1.booker.lastname ]],</p><p>Your reservation has been cancelled. Please contact us if you have any questions.</p><p>Kind regards,<br>Lanka IOC Guest House</p>',NULL,0,0,'Reservation cancellation - Lanka IOC Guest House'),(18,3,'Lanka IOC - Invoice Email','<p>Dear [[ invoice.firstname ]] [[ invoice.lastname ]],</p><p>Please find your invoice attached. Thank you for staying with us.</p><p>Kind regards,<br>Lanka IOC Guest House</p>',NULL,0,0,'Your invoice - Lanka IOC Guest House');
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tourist_tax_rates`
--

DROP TABLE IF EXISTS `tourist_tax_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tourist_tax_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tourist_tax_id` int NOT NULL,
  `guest_category_id` int NOT NULL,
  `price_per_night` decimal(10,2) NOT NULL,
  `report_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_ttr_tax_category` (`tourist_tax_id`,`guest_category_id`),
  KEY `IDX_ttr_tax` (`tourist_tax_id`),
  KEY `IDX_ttr_category` (`guest_category_id`),
  CONSTRAINT `FK_ttr_category` FOREIGN KEY (`guest_category_id`) REFERENCES `guest_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ttr_tax` FOREIGN KEY (`tourist_tax_id`) REFERENCES `tourist_taxes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tourist_tax_rates`
--

LOCK TABLES `tourist_tax_rates` WRITE;
/*!40000 ALTER TABLE `tourist_tax_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `tourist_tax_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tourist_taxes`
--

DROP TABLE IF EXISTS `tourist_taxes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tourist_taxes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tax_rate_id` int DEFAULT NULL,
  `revenue_account_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `includes_vat` tinyint(1) NOT NULL DEFAULT '1',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `applies_only_to_adult` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `calculation_mode` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'per_night_flat',
  `percentage_rate` decimal(5,2) DEFAULT NULL,
  `percentage_base` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_tt_taxrate` (`tax_rate_id`),
  KEY `IDX_tt_revenue` (`revenue_account_id`),
  CONSTRAINT `FK_tt_revenue` FOREIGN KEY (`revenue_account_id`) REFERENCES `accounting_accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_tt_taxrate` FOREIGN KEY (`tax_rate_id`) REFERENCES `tax_rates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tourist_taxes`
--

LOCK TABLES `tourist_taxes` WRITE;
/*!40000 ALTER TABLE `tourist_taxes` DISABLE KEYS */;
/*!40000 ALTER TABLE `tourist_taxes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tourist_taxes_has_subsidiaries`
--

DROP TABLE IF EXISTS `tourist_taxes_has_subsidiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tourist_taxes_has_subsidiaries` (
  `tourist_tax_id` int NOT NULL,
  `subsidiary_id` int NOT NULL,
  PRIMARY KEY (`tourist_tax_id`,`subsidiary_id`),
  KEY `IDX_tths_tax` (`tourist_tax_id`),
  KEY `IDX_tths_subsidiary` (`subsidiary_id`),
  CONSTRAINT `FK_tths_subsidiary` FOREIGN KEY (`subsidiary_id`) REFERENCES `objects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_tths_tax` FOREIGN KEY (`tourist_tax_id`) REFERENCES `tourist_taxes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tourist_taxes_has_subsidiaries`
--

LOCK TABLES `tourist_taxes_has_subsidiaries` WRITE;
/*!40000 ALTER TABLE `tourist_taxes_has_subsidiaries` DISABLE KEYS */;
/*!40000 ALTER TABLE `tourist_taxes_has_subsidiaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `IDX_54FCD59FA76ED395` (`user_id`),
  KEY `IDX_54FCD59FD60322AC` (`role_id`),
  CONSTRAINT `FK_54FCD59FA76ED395` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_54FCD59FD60322AC` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,9),(2,9);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstname` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastname` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_action` datetime DEFAULT NULL,
  `active` tinyint(1) NOT NULL,
  `theme_preference` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'light',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_1483A5E9F85E0677` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'timothy','Timothy','Sahan','timothy@lankaioc.com','$2y$13$BK3gUe4k7UmZYGASCPwne.Dhb9XH.Ncsuehq7qj0qC3/sB.qKDlKa','2026-09-16 04:11:47',1,'light'),(2,'timothy_sahan','timothy','sahan','timothy@lankaioc.com','$2y$13$EgJvBJmYHZm.1wC.Iu0Kpu7hXSwDoSOWvHUnTteMkff0cP/9/NrPG','2026-11-02 10:35:01',1,'light');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `webauthn_credentials`
--

DROP TABLE IF EXISTS `webauthn_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webauthn_credentials` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_key_credential_id` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transports` json NOT NULL COMMENT '(DC2Type:json)',
  `attestation_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trust_path` json NOT NULL COMMENT '(DC2Type:trust_path)',
  `aaguid` tinytext COLLATE utf8mb4_unicode_ci NOT NULL,
  `credential_public_key` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_handle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `counter` int NOT NULL,
  `other_ui` json DEFAULT NULL COMMENT '(DC2Type:json)',
  `backup_eligible` tinyint(1) DEFAULT NULL,
  `backup_status` tinyint(1) DEFAULT NULL,
  `uv_initialized` tinyint(1) DEFAULT NULL,
  `client_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `webauthn_credentials`
--

LOCK TABLES `webauthn_credentials` WRITE;
/*!40000 ALTER TABLE `webauthn_credentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `webauthn_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_logs`
--

DROP TABLE IF EXISTS `workflow_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workflow_id` int DEFAULT NULL,
  `workflow_name` varchar(150) NOT NULL,
  `trigger_type` varchar(80) NOT NULL,
  `entity_class` varchar(255) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `message` longtext,
  `executed_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_wflog_workflow` (`workflow_id`),
  KEY `idx_wflog_executed_at` (`executed_at`),
  KEY `idx_wflog_dedup` (`workflow_id`,`entity_class`,`entity_id`,`status`),
  CONSTRAINT `FK_B510D6672C7C2CBA` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_logs`
--

LOCK TABLES `workflow_logs` WRITE;
/*!40000 ALTER TABLE `workflow_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflow_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflows`
--

DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` longtext,
  `is_enabled` tinyint NOT NULL DEFAULT '1',
  `is_system` tinyint NOT NULL DEFAULT '0',
  `system_code` varchar(80) DEFAULT NULL,
  `trigger_type` varchar(80) NOT NULL,
  `trigger_config` json NOT NULL,
  `conditions` json NOT NULL,
  `action_type` varchar(80) NOT NULL,
  `action_config` json NOT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQ_EFBFBFC266D9836E` (`system_code`),
  KEY `idx_workflow_trigger_type` (`trigger_type`),
  KEY `idx_workflow_system_code` (`system_code`),
  KEY `idx_workflow_enabled` (`is_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflows`
--

LOCK TABLES `workflows` WRITE;
/*!40000 ALTER TABLE `workflows` DISABLE KEYS */;
INSERT INTO `workflows` VALUES (1,'workflow.system.notify_online_booking.name','workflow.system.notify_online_booking.description',0,1,'notify_online_booking','online_booking.created','[]','[]','send_notification_email','[]',0,'2026-09-14 11:20:14','2026-10-22 09:29:06'),(2,'workflow.system.notify_calendar_import.name','workflow.system.notify_calendar_import.description',0,1,'notify_calendar_import','calendar_import.created','[]','[]','send_notification_email','[]',0,'2026-09-14 11:20:14','2026-10-22 09:29:07'),(3,'workflow.system.confirm_online_booking.name','workflow.system.confirm_online_booking.description',0,1,'confirm_online_booking','online_booking.created','[]','[{\"type\": \"reservation.has_booker_email\", \"config\": {}}]','send_template_email','{\"templateId\": 0, \"attachments\": [], \"recipientType\": \"booker_email\", \"customRecipient\": \"\", \"attachmentPolicy\": \"skip_missing\"}',0,'2026-09-14 11:20:16','2026-09-14 11:20:16');
/*!40000 ALTER TABLE `workflows` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-04 14:32:40
