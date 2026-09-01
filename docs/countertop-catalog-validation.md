# Countertop Catalog and Labor Validation — 2026-08-07

The running countertop builder displays **242 MSI** slabs imported into the backend catalog. Its searchable selector shows the corrected MSI natural-stone classifications, including distinct Granite, Marble, Quartzite, and Soapstone collections; discontinued guide records are retained with an availability-check label rather than silently omitted.

The active backend labor record displays a $35.00 per-square-foot material/labor takeoff rate, $5.00 per-linear-foot non-eased edge rate, and $100.00 each for both standard sink and vanity-sink cutouts. The builder exposes quantity inputs for both cutout categories on every measured countertop run.

The normalized import currently contains **447 unique selectable slab records**: 242 MSI and 205 Cosentino. Duplicate source-guide rows are collapsed into a single catalog record by the database uniqueness rule.

Searching for `Taj Mahal 3cm` returned four MSI Quartzite catalog options. Selecting the polished 30 mm option attached its stored $48.05 reference and `3cm loose supplier price` basis to the takeoff. A 21.00 sq ft run with one standard sink and one vanity sink showed $735.00 for material/labor plus $200.00 for the two cutouts, for a live $935.00 total before non-eased edge work.

Changing that same run to a Beveled edge added $50.00 for 10.00 linear feet, creating a verified $985.00 live total. The Cosentino supplier selector exposed all 205 unique backend records across Dekton, Scalea, Sensa, Silestone, and Ēclos collections.
