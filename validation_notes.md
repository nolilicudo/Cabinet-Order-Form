# PIN Session Regression Validation

- On a direct visit to `/orders/new` with the Woodoo PIN session cleared, the application displayed the PIN gate and did not mount the protected catalog.
- After submitting the valid Woodoo PIN, `/orders/new` loaded successfully and displayed the source-priced cabinet catalog with 80 configurations shown.
- The prior `Enter the Woodoo site PIN to continue.` catalog-query error did not recur during the locked-route or unlock-route checks.

## Confirmed Root Cause and Resolution

The original dashboard shell mounted page routes immediately while the asynchronous `pin.status` request was still pending. The new-order page mounted its catalog query during that window, so the server correctly rejected the request before the PIN session had been established or recognized. The new `PinGate` now resolves the server-side PIN session before it renders any protected route. As a result, the new-order page and its catalog query do not mount until authentication is confirmed; a missing session renders the PIN screen instead.

After restarting the development service, a direct visit to `/orders/new` with the persisted PIN session loaded the full catalog successfully. The browser console contained no new PIN-session or protected-query errors.

## Public-access Conversion Validation

After retiring the Woodoo PIN gate, direct unauthenticated visits to `/`, `/orders/new`, `/orders/1/view`, and `/catalog` all rendered successfully. The dashboard, order-detail view, new-order builder, and imported MSRP catalog loaded without a PIN prompt or an authorization error.
