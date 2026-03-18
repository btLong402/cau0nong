# Payments Module

## Purpose

Handle Phase 3 payment concerns for settlements, including VietQR generation metadata and payment history queries.

## Public Exports

- `createPaymentsService`
- `PaymentsService`
- `createPaymentsRepository`
- `PaymentsRepository`
- `PaymentListResult`, `SettlementPaymentSummary`, `GeneratedVietQR`

## Responsibilities

- Generate deterministic VietQR payload/content from settlement data.
- Persist generated VietQR rows into `vietqr_payments`.
- Query month-level payment history for admin views.

## Non-Goals

- No external payment gateway reconciliation in this phase.
- No schema migration in Phase 3 MVP.
