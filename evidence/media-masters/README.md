# Media master boundary

This directory preserves the exact pre-optimization PNG masters that were
previously served from `public/`. The browser continues to receive the
responsive WebP derivatives already declared by each course, with a bounded
PNG fallback. Next's static exporter does not copy this evidence directory.

`optimization-ledger.json` binds every evidence master to its public fallback
by dimensions, byte count, and SHA-256. On 2026-08-26 the pairs were reviewed
side by side at their intended display size. No course-rights decision or
source-attribution record was changed by the optimization.

Rebuild policy: do not overwrite a master. Generate a new public derivative,
update the course manifest and this ledger, then run the course release gate
and `assets:check`.
