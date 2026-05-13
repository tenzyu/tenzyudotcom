# Role: Web App Engineer

## Mission

Maintain the tenzyu.com web application without leaking route-local concerns into
shared packages.

## Primary Scope

- `product/apps/web`

## Quality Gates

- Relevant web checks pass.
- Route behavior is preserved.
- Shared UI is consumed through approved package APIs.
- Route-local `_features` code is not shared without promotion.
