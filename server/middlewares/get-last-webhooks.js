/* @flow */
import { Request, Response } from "express";
import moment from "moment";
import _ from "lodash";

export default function getLastWebhooks(WebhookModel: Object) {
  return (req: Request, res: Response) => {
    const { client, ship = {} } = req.hull;
    const query = WebhookModel.find({ connectorId: ship.id })
      .sort({ date: -1 })
      .limit(100);

    query.lean().exec((err, docs) => {
      if (err) {
        client.logger.debug("mongo.query.error", { errors: err });
        res.status(500).json({ lastWebhooks: [] });
      }

      const lastWebhooks =
        _.map(docs, webhook =>
          _.set(
            _.omit(webhook, ["_id", "__v", "connectorId"]),
            "date",
            moment(webhook.date).format("MMM Do YYYY, h:mm:ss A")
          )
        ) || [];

      return res.status(200).json({ lastWebhooks });
    });
  };
}
