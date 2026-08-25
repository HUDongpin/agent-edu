# Course audit evidence

This directory contains the repository inputs that deterministic course gates
actually read: research boundaries, provenance records, publication-rights
records, source-verification reports, and synthetic capture recipes. They are
versioned evidence, not website assets, and `.vercelignore` must not exclude
them while `build:release` runs those gates.

Generated render pages, contact sheets, browser screenshots, temporary staging
copies, and superseded reports do not belong here. The release source contract
rejects tracked files under `outputs/`; that directory is reserved for ignored,
local generation only.
