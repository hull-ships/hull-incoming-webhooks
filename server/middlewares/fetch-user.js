/* @flow */
import { Request, Response, Next } from "express";

export default function fetchUser(req: Request, res: Response, next: Next) {
  req.hull.cache.get("webhookRequest").then(result => {
    req.hull.user = result || {};
    return result;
  }).then(() => next());
}
