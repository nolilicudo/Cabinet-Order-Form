# Grouped Slab Selector Validation — 2026-08-07

The revised selector groups the MSI catalog into the simple browse families **Granite**, **Marble**, **Quartz**, **Quartzite**, and **Soapstone** while retaining a search field that filters across all 242 imported MSI slab records. The material cards display a supplier slab visual reference and explicitly advise confirmation of the actual supplier lot, veining, and availability.

Selecting the **Alpine Valley** material card opened a separate finish and thickness step. Choosing its **Polished · 30 mm** option then applied the slab to the estimate ledger with its saved MSI $14.50 reference and `3cm loose supplier price` basis. The Save action remains disabled until both a material and a finish have been selected.

The Cosentino catalog presents its 205 imported records through concise **Dekton**, **Scalea**, **Sensa**, and **Silestone** groups, each using the Cosentino supplier visual reference. Searching all Cosentino records for `Rem` returned the Dekton **Rem** slab while retaining additional matching material names, confirming the family filters do not limit full-text catalog search.

The visual catalog now resolves material-specific official MSI images where the imported source URL is available. The browser verified that **Alpine Valley** renders its official MSI image and carries it into the material-to-finish step with an **Open supplier page** action. Missing or failed image URLs explicitly switch to the supplier reference image and display an `Official MSI image unavailable — supplier reference shown` label; this was observed for **Alabaster Gold** and **Alabaster White** rather than presenting the fallback as the selected slab’s actual photo.
