// @flow
import { Request, Response, Next } from "express";
import mongoose from "mongoose";
import _ from "lodash";

import { schema } from "../mongo/db-schema";

export default function (mongoConnectionUrl: string, mongoCappedCollectionSize: number) {
  return (req: Request, res: Response, next: Next) => {
    const { ship } = req.hull;
    req.hull.service = req.hull.service || {};

    const collectionName = `${_.get(ship, "id")}-webhook-requests`;

    const mongoConnection = mongoose.connect(mongoConnectionUrl, { useMongoClient: true });

    req.hull.service.WebhookModel = _.get(mongoConnection.models, collectionName) || mongoConnection.model(collectionName, schema(mongoCappedCollectionSize));

    return next();
  };
}
