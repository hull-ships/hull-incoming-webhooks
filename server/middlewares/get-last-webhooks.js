/* @flow */
import { Request, Response, Next } from "express";
import moment from "moment";
import _ from "lodash";

export default function getLastWebhooks(req: Request, res: Response, next: Next) {
  const { client, service } = req.hull;
  service.WebhookModel.find({}).lean().exec((err, docs) => {
    if (err) {
      client.logger.debug("mongo.query.error", { errors: err });
      req.hull.lastWebhooks = [];
    }
    req.hull.lastWebhooks = _.map(docs, webhook => {
      return _.set(_.omit(webhook, ["_id", "__v"]), "date", moment(webhook.date).format("MMM Do YYYY, h:mm:ss A"));
    }) || [];
    return next();
  });
}
