# Visual Cabinet Catalog Source Notes

## U.S. Cabinet Depot Capital Framed

**Source file:** `/home/ubuntu/upload/USCD_Framed_Cabinet_Image_Catalog_2026-08-05.pdf`.

The source is a 57-page, landscape visual SKU catalog titled **“USCD Framed Cabinet Image Catalog.”** Its first page identifies the document as a **Shaker White SKU reference**, with **341 orderable items** and prices checked on **August 5, 2026**. Each catalog page uses visual cabinet tiles with a SKU, price, plain-language cabinet type, and dimensional description.

Verified examples include `SW-BT9` (Tray Base; 9 in. W × 34-1/2 in. H × 24 in. D), `SW-B12FH` (Single Full Height Door Base; 12 in. W × 34-1/2 in. H × 24 in. D), `SW-B15FH`, `SW-B18FH`, `SW-B21FH`, and `SW-B24FH`. The catalog also communicates order logic such as multi-box kit notes, blind-base filler requirements, transfer/availability warnings, and installation constraints. The SKU and dimensional descriptions align with the source-backed U.S. Cabinet Depot product data already imported into the application.

## Woodoo Cabinetry

**Source file:** `/home/ubuntu/upload/Woodoo_Cabinetry_SKU_Image_Catalog_2026-08-05.pdf`.

### Updated complete visual catalog

**Updated source file:** `/home/ubuntu/upload/Woodoo_Cabinetry_Complete_SKU_Image_Catalog_2026-08-05.pdf`.

The updated source contains **108 landscape pages**, identifies **3,230 orderable finish-specific SKUs** across **323 item bodies**, and includes wall/upper, tall/full-height, vanity, panel, accessory, and finish selections. Its opening reference lists the Woodoo door and finish codes, and its product pages pair orderable configured SKU labels with individual cabinet drawings. Embedded image extraction produced 607 assets; cover/door photography appears before the cabinet assets, while a verified later asset is a clean white-background line drawing suitable for a Quick Select card. These images are descriptive only; the existing Woodoo MSRP database remains the sole source of unit prices.

The source is a 69-page, landscape visual SKU catalog titled **“Woodoo Cabinetry SKU Image Catalog.”** It identifies **620 orderable SKUs**, **62 cabinet bodies**, and **10 door-style and finish combinations**. Each visual tile includes the fully configured SKU, an MSRP reference, the door-style/finish pairing, and a plain-language cabinet description with dimensions.

Verified examples include `B1212-1201` (Standard Shaker — Frosty White; Base Single Door; 12 in. W × 34-1/2 in. H × 12 in. D), `B1212-1202` (Standard Shaker — Premium Oak), `B1212-1601` (Beveled Edge — Frosty White), and `B1212-1801` (Flat Door — Frosty White). The visual catalog’s source line identifies **Woodoo Cabinetry.xlsx** and **MSMV Woodoo Pricing.xlsx**. The images and labels will map to the existing Woodoo MSRP product/configuration records, preserving database pricing rather than deriving prices from the visual catalog.

## Mapping Principle

Visual catalog assets are descriptive references only. Source pricing remains attached to the existing Woodoo MSRP price configurations and U.S. Cabinet Depot product/finish price records. Images, layout labels, cabinet descriptions, and dimensions will enrich selection; they will not create or estimate unit prices.

## Extracted Image Assets

The visual PDFs contain extractable embedded cabinet assets. The Woodoo catalog yielded 1,240 image files because each layout image includes a corresponding mask; the usable line-art cabinet layouts are 386 × 620 px PNGs. A verified representative image shows a clean cabinet perspective drawing on white, suitable for a product card. The U.S. Cabinet Depot catalog yielded 341 extracted 100 × 100 px JPEG-derived cabinet thumbnails, one per orderable source item.

Generated sprite-sheet verification confirms that both suppliers’ assets render clearly as cabinet-layout line art on white. Woodoo sheets use 150 × 190 px cells and retain useful detail for taller cabinet bodies. U.S. Cabinet Depot sheets use 120 × 120 px cells and show the related cabinet layout clearly enough for a quick-selection card. The generated U.S. Cabinet Depot mapping covers all 341 source products; the current Woodoo mapping covers 44 parsed cabinet-body layouts from 440 configured visual SKUs. Further Woodoo visual parsing is needed to cover the remaining product bodies before treating the mapping as complete.
