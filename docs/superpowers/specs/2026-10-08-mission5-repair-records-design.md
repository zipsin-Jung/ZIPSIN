# Mission 5 Repair Records Design

## Scope

Implement `M5-REC-001~006` from `docs/14-mission5-repair-records-spec.md` as a separate educational flow at `/records`. Preserve the existing landing page and sales demo. The new flow stores only fictional, non-sensitive repair records.

## Architecture

Next.js App Router Server Components read through a server-only Supabase client. Server Actions validate `FormData`, coordinate private Storage uploads and database mutations, revalidate affected paths, and redirect only after successful mutations. UI components own interaction state but never receive the service role key.

The database table is `repair_records`; the private bucket is `repair-images`. List state lives in `page`, `query`, and `status` URL parameters. Record images use generated UUID object names and short-lived signed URLs.

## Components and routes

- `/records`: paginated searchable/filterable list, empty and no-results states.
- `/records/new`: shared record form in create mode.
- `/records/[id]`: detail, no-image state, edit/delete actions.
- `/records/[id]/edit`: shared form prefilled in edit mode.
- route-level `loading.tsx`, `error.tsx`, and record `not-found.tsx` cover asynchronous states.
- `lib/repairs/schema.ts` owns validation and enum labels.
- `lib/repairs/repository.ts` owns database and Storage operations.
- `app/records/actions.ts` owns mutation orchestration and redirects.

## Data and recovery

Create uploads a validated image first, inserts its path with the row, and removes the object if the insert fails. Update uploads a replacement first, updates the row, then removes the previous object; failed row updates remove the new object. Delete removes the row and then its attached object; a file cleanup failure is logged without restoring a row that has already been deleted.

## Security boundary

The service role key is server-only. RLS stays enabled so browser clients cannot access tables or Storage directly. Because the app has no authentication, the server actions are still publicly callable through the UI; this is an educational limitation, not access control. Every screen warns against real data. Production use is forbidden until authentication, ownership checks, and RLS policies are added.

## Verification

Unit tests cover validation, query parsing, file constraints, form-state mapping, and partial-failure cleanup. Static checks, type checking, tests, coverage, and a production build are reported separately. Browser QA covers desktop/mobile and the complete CRUD/upload cycle when valid Supabase credentials are available. Local success is not evidence of deployment success.
