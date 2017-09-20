// @flow
import { Request, Response, Next } from "express";
import mongoose from "mongoose";
import _ from "lodash";

import { schema } from "../mongo/db-schema";

export default function (mongoConnectionUrl: string, dbName: string) {
  return (req: Request, res: Response, next: Next) => {
    const { ship } = req.hull;
    req.hull.service = req.hull.service || {};

    const collectionName = `${_.get(ship, "id")}-webhook-requests`;

    const mongoConnection = mongoose.connect(`${mongoConnectionUrl}/${dbName}`, { useMongoClient: true });
    req.hull.service.WebhookModel = mongoConnection.model(collectionName, schema);
    return next();
  };
}
