# Same-Layout Style Comparison Validation

Browser validation of the local Quick Select route confirmed that a Woodoo base-cabinet layout can be compared across the source-backed door-style and finish configurations before adding it to an order. For the 9-inch base cabinet layout, the comparison panel displayed ten available configurations, including Shaker White at $50.84, Beveled White at $58.80, Eyed Edge White at $33.56, Shaker Walnut at $144.27, and Eyed Edge Oak at $91.06. Each comparison entry retained an individual source price and exposed an add action.

The U.S. Cabinet Depot path uses the same family-card interaction: related SKU sizes are grouped into one layout card and each size retains its active-finish source price for the package handoff. The grouped 3 Drawer Base Cabinet handoff was verified end-to-end: selecting `SW-3DB12` in Quick Select opened the U.S. Cabinet Depot package builder with the same `SW-3DB12` source SKU, the selected `Shaker White` finish, and its direct source price of `$191.04` preserved in the package line. The package card now renders the explicit `Quick Select handoff` detail beside the selected line, while the finish comparison panel independently shows `Shaker White` at the same `$191.04` direct source price.

Browser DOM verification captured the rendered package-item text exactly as: `Quick Select handoff · SW-3DB12 · Shaker White · $191.04 direct source price`.

Focused same-layout comparison coverage verifies that all source rows are retained and ordered by style and finish. The documented fixture values are: **Shaker / White — $50.84**, **Beveled / White — $58.80**, **Eyed Edge / White — $33.56**, **Shaker / Walnut — $144.27**, and **Eyed Edge / Oak — $91.06**. The exact grouped U.S. Cabinet Depot handoff test asserts `SW-3DB12`, `Shaker White`, and `$191.04` through package hydration.

Browser comparison-panel verification for the 9-inch Base Cabinet visibly rendered source-priced choices including **Beveled / Bisque — $58.80**, **Beveled / Oak — $101.50**, **Beveled / White — $58.80**, **Eyed Edge / Oak — $91.06**, **Eyed Edge / Walnut — $118.66**, **Eyed Edge / White — $33.56**, **Shaker / Bisque — $50.84**, and **Shaker / Oak — $104.30**.

After preserving the drawer-count token in the U.S. Cabinet Depot layout-family key, Quick Select visibly rendered a separate **2 Drawer Base Cabinet** card with `SW-2DB24`, `SW-2DB30`, and `SW-2DB36`, and a distinct **3 Drawer Base Cabinet** card with `SW-3DB12` through `SW-3DB36`. Each card retained its own source-priced size list.
