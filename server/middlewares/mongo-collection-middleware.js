// @flow
import type { $Response, NextFunction } from "express";
import type { THullRequest } from "hull";

module.exports = function MongoCollectionMiddleware(model: Object) {
  return (req: THullRequest, res: $Response, next: NextFunction) => {
    req.hull.service = req.hull.service || {};
    req.hull.service.WebhookModel = model;
    return next();
  };
};
