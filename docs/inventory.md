# Inventory and purchasing

The Operations > Inventory page is available to administrators at `/operations/inventory` after running migration `Version20261027063155`. Inventory is grouped by property (`Subsidiary`), while item codes and units are shared across properties.

## Daily use

1. Add each stocked item with a unique code, unit, and reorder level.
2. Record each purchase for the receiving property. Enter quantity, unit cost, three-letter currency code, purchase date, and an optional expiry date, supplier, and reference. A purchase creates a new lot; its original cost and quantity are preserved.
3. Record stock used at a property. The service allocates units from the earliest expiring usable lots first. It rejects a request when the property has insufficient unexpired stock.
4. Review the overview for low stock and lots that expire within 30 days or are already expired. The page also shows this month's purchase and usage costs grouped by currency. Costs use the price recorded on the purchase lot; the module does not convert between currencies.

An expiry date is valid through that calendar day. Expired units remain in physical on-hand stock, but do not count as usable stock. The expiry alert is displayed when an administrator opens the page; this version does not send email or scheduled notifications.

Purchase and usage records are append-only through the UI. Correcting a mistaken record currently requires an administrator to handle the data outside this workflow. The page is restricted to `ROLE_ADMIN` because it displays purchase costs across properties. No property-specific authorization is defined for inventory yet.

## Local sample data

After configuring at least one guest house and applying migrations, load the sample inventory into a local development database with:

```bash
php bin/console doctrine:fixtures:load --append --group=inventory
```

The `--append` option preserves existing database records. The fixture creates four clearly marked `[SAMPLE]` items and purchase lots for each configured guest house, including low stock, upcoming expiry, expired stock and usage. Example costs are in LKR and do not change the application currency setting. Re-running the fixture skips its existing sample lots; it does not reset quantities or replace edited data. If a sample item code already belongs to another item, loading stops instead of altering it. Sample transactions appear in inventory totals and are not removable through the current UI, so use this group only in a disposable development database.
