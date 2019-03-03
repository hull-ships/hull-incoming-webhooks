// @flow
import { Request, Response, Next } from "express";

export default function(model: Object) {
  return (req: Request, res: Response, next: Next) => {
    req.hull.service = req.hull.service || {};
    req.hull.service.Model = model;
    return next();
  };
}
