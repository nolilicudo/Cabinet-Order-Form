# Visual Selection Validation

## Initial desktop review

The new `/quick-select` page renders the recommended Guided Start, Visual Gallery, and Layout Checklist options above a supplier picker. The Woodoo selection flow shows source-priced visual cards with layout thumbnails, SKU, plain-language cabinet type, dimensions when available, source-selected door style and finish, and an add action. The selected-cabinet panel remains visible while browsing.

The legacy `/catalog` and `/uscd` routes continue to render their established source-price selection workflows. The new Quick Select entry point is available in the persistent navigation and is intended to be the beginner-friendly path; it hands selected Woodoo or U.S. Cabinet Depot items to their existing order/package editor without accepting manually typed unit prices.

## Updated complete Woodoo catalog

The refreshed Woodoo source mapped **323 of 323** catalog product bodies to updated cabinet drawings across nine deployment-safe sprite sheets. Runtime inspection of Quick Select confirmed that its rendered visual cards now load `woodoo-complete-layout-*` assets. The desktop presentation retains the grouped source-priced size controls and the guided supplier, room, door-style, finish, and cabinet-group filters.

The mobile Quick Select view keeps its selected-cabinet tray and Continue control reachable without obscuring the guided flow. A refreshed visual-card selection for `B09FH` completed a non-persistent handoff to `/orders/new`, where the selected line retained the exact **B09FH** SKU, **Shaker / White** configuration, and **$50.84** source price.
