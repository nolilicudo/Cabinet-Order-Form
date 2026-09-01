# Countertop Catalog Sources

The backend countertop catalog is imported from the supplier price guides supplied to this project. Each imported slab records its supplier, collection, material name, finish, thickness where stated, source item identifier where stated, normalized supplier price reference, price basis, and source document label.

| Supplier | Supplied source | Catalog treatment |
|---|---|---|
| MSI | `MSINaturalStonePricelistUTSLOct2025.pdf` and `QZ2025DE-UTSL-Oct'25.pdf` | Natural-stone rows use their listed loose 3 cm price. Quartz colors inherit the job-pack rate shown for their pricing group. |
| Cosentino | `LP47_GN_2026_USA_EN_USD_lite(1).pdf` | Ēclos, Silestone, Dekton, Scalea, and Sensa entries are normalized with the source’s stated full-slab or per-square-foot reference basis. |

Supplier pricing is retained as a **reference field** and does not overwrite the active takeoff labor calculation. The active backend rate record is **Standard countertop labor**: $35.00 per square foot, $5.00 per linear foot for non-eased edges, and $100.00 each for standard sink and vanity-sink cutouts.

## Supplier Image References

The catalog stores a material-specific image URL where an official MSI asset can be resolved, plus a supplier material-page URL and an explicit fallback label for every record. For example, the official MSI Alpine Valley product page is [https://www.msisurfaces.com/granite/alpine-valley/](https://www.msisurfaces.com/granite/alpine-valley/), and its verified official image asset is [https://cdn.msisurfaces.com/images/colornames/videos/alpine-valley-granite.jpg](https://cdn.msisurfaces.com/images/colornames/videos/alpine-valley-granite.jpg). The verified MSI Calacatta Laza product page uses the official image asset [https://cdn.msisurfaces.com/images/quartz-countertops/products/roomscenes/medium/calacatta-laza-quartz-vignette-2.jpg](https://cdn.msisurfaces.com/images/quartz-countertops/products/roomscenes/medium/calacatta-laza-quartz-vignette-2.jpg).

Cosentino material-page links follow the official color-page pattern, for example [https://www.cosentino.com/usa/colors/dekton/rem/](https://www.cosentino.com/usa/colors/dekton/rem/). If an individual material image is not linked from the source catalog, the application displays a clearly labeled supplier visual reference rather than presenting it as the slab’s actual photo.
