# Dataset upload & deletion

## Upload

- Maximum CSV size: 200 MB.
- CSV headers are flexible: unknown columns are accepted.
- Duplicate/blank headers are rejected.
- The complete original row is preserved in `dataset_records.raw_data`.
- Legacy typed columns are populated when their fields exist; otherwise safe fallback values are used.
- Legacy string and numeric storage is deliberately unbounded enough for heterogeneous source files.
- Failed persistence cleans up partial record/column inserts while retaining the dataset row with `FAILED` status and a diagnostic reason.

## Permanent deletion

`DELETE /api/datasets/:id` is restricted to ADMIN/SUPERADMIN users by the application authorization layer.

The deletion is transactional and removes:

1. matching candidates belonging to matching runs involving the dataset;
2. those matching runs;
3. the dataset itself;
4. dataset columns and records through database cascade;
5. assignments tied to those records through database cascade.

Audit log rows are intentionally retained for traceability.
