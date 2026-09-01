# Countertop Planning Design

The upgraded builder will preserve the existing MSI and Cosentino catalog workflow and add a fabrication-planning layer that is intentionally separate from supplier slab-price references. The estimator remains based on the active backend labor rates, while the planner makes the physical coverage assumptions visible before an order is approved.

| Planning area | Data captured | Calculation or behavior |
|---|---|---|
| **Slab coverage** | Slab length, slab width, thickness, and a configurable planning waste percentage | Reports usable square footage, minimum slab count, planned coverage, and leftover/waste allowance. A warning is shown if a single run exceeds the selected slab length. |
| **Seams** | Run type, length, depth, and seam preference | Draws each run in a simple two-dimensional plan and adds seam markers when the run exceeds usable slab length. The output identifies seams that need field review. |
| **Edges** | One shared edge profile, separate perimeter/island profiles, or individual run profiles | Applies the selected mode consistently and provides a per-run-type labor breakout. |
| **Windows and sinks** | Window sill height off finished floor, sink/vanity cutout counts, and a default-off integrated-sink flag | Retains field-verification context and keeps integrated sinks distinct from priced standard and vanity cutouts. |
| **Trim** | Trim footage and an editable job-specific trim labor allowance | Makes trim scope visible without inventing a supplier rate; the allowance is transparent in the pricing summary. |
| **Templates** | Blank single-wall, L-shaped, galley, and island run structures | Adds useful project structure without creating customer names, dimensions, or fictional order data. |

> **Planning limitation:** The slab count and seam overlay are a pre-fabrication planning aid. Final slab layout, vein matching, yield, and seam locations require supplier and fabricator confirmation against the actual lot and templates.
