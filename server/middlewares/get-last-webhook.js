/* @flow */
import { Request, Response, Next } from "express";

export default function getLastWebhook(req: Request, res: Response, next: Next) {
  req.hull.cache.get("webhookRequest").then(result => {
    req.hull.lastWebhook = result || {};
    return result;
  }).then(() => next());
}
