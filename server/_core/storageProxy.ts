// Storage proxy: serves stored files via a 307 redirect to a presigned R2 URL.
// Route: GET /storage/:key(*)
// This keeps S3 credentials off the client and allows short-lived links.

import type { Express } from "express";
import { storageGetSignedUrl } from "../storage";

export function registerStorageProxy(app: Express) {
  app.get("/storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const signedUrl = await storageGetSignedUrl(key);
      res.set("Cache-Control", "no-store");
      res.redirect(307, signedUrl);
    } catch (err) {
      console.error("[StorageProxy] failed to generate presigned URL:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
