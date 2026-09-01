# Perishable-trade commitment hub

This repo is an existing Next.js/Supabase business directory. This work adds a **commitment hub** for perishable trade. It is not a CRM restyle, not Salesforce, and not a deals Kanban.

A commitment is a time-bound trade object: synthetic counterparty (linked to an existing `business`), generic perishable commodity class, volume + unit, Incoterm, ship window, currency, and a closed status machine.

```
draft → internal_ok → send_hold → confirmed
                              └→ killed
```

## HITL and fail-closed

- Leaving `draft` requires an explicit `human_ok: true` flag. Missing or false is rejected.
- There is **no** live email / X / LinkedIn send. `send_hold` means ready to send and **blocked on purpose**.
- Every status change appends an audit row (who / when / from / to). Audit is insert-only.
- No commitment without a `business_id`. Missing ship window is rejected. Illegal transitions are rejected. Creates are always `draft`.

Commodity classes are generic perishable buckets (`chilled_bivalves`, `frozen_finfish`, `chilled_produce`, …), not brand SKUs.

## Run

```bash
npm install
cp env.example .env.local   # optional; without real Supabase the app uses .dev-data/
npm test
npm run seed:commitments    # synthetic counterparties only
npm run dev
```

Open `/commitments`. Seed from the hub if the store is empty.

## API

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/commitments` | List, ordered by ship window |
| POST | `/api/commitments` | Create draft. Fail closed on business / ship window |
| GET | `/api/commitments/[id]` | Detail + audit |
| POST | `/api/commitments/[id]/transition` | `{ to, human_ok? }` |
| POST | `/api/commitments/seed` | Synthetic counterparties + sample drafts |

Status is not a free PATCH field. Transitions go through the machine.

## Inherited directory

Businesses, contacts, and interactions from the original directory remain. They are the counterparty source, not a sales pipeline. Do not treat `/commitments` as HubSpot.

## Schema

See `supabase/migrations/002_commitments.sql`. Postgres enforces the same closed transitions, `human_ok_at` when leaving draft, and append-only `commitment_audit`.
