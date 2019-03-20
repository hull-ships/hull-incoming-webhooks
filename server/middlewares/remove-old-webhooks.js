/* @flow */
import { Request, Response } from "express";
import moment from "moment";
import _ from "lodash";

export default function removeOldWebhooks(WebhookModel: Object) {
  return (req: Request, res: Response) => {
    const { client, ship = {} } = req.hull;
    const query = WebhookModel.find({ connectorId: ship.id }).sort({ date: -1 }).limit(5);

    query.lean().exec((err, docs) => {
      if (err) {
        client.logger.debug("mongo.query.error", { errors: err });
        res.status(500).json({});
      }

      // docs should exist and be equal to or greater (shoudn't happen)
      // than 100, otherwise we don't need to trim
      if (docs && docs.length >= 5) {
        const lastWebhook = docs[docs.length - 1];
        const removeOldWebhooks = WebhookModel.remove({ connectorId: ship.id, date: { $lt: lastWebhook.date } });
        removeOldWebhooks.lean().exec((err, docs) => {
          return res.status(200).json({ result: "groomed" });
        });
      } else {
        return res.status(200).json( { result: "not enough webhooks to groom" });
      }
    });
  };
}
