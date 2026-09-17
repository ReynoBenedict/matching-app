# Upload CSV fix

The legacy `dataset_records` table previously declared most legacy fields as `NOT NULL`. That made flexible CSV uploads fail when a CSV did not contain those legacy columns: the upload transformer intentionally supplied `DEFAULT`/empty values, but PostgreSQL cannot use `DEFAULT` for a NOT NULL column without a default value.

The schema now keeps only `dataset_id`, `raw_data`, and `idsbr` required. Legacy fields are nullable so arbitrary CSV schemas can be persisted safely while the complete original row remains in `raw_data`.

After updating the code on a fresh development database:

```powershell
npm run db:push
npm run db:seed
```

For an existing database, making columns nullable is a non-destructive schema change. Do not truncate `dataset_records` just to apply this change.
