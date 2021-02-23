/* @flow */
import { Request, Response } from "express";

export default function removeOldWebhooks(WebhookModel: Object) {
  return (req: Request, res: Response) => {
    const { client, ship = {} } = req.hull;
    const query = WebhookModel.find({ connectorId: ship.id }).sort({ date: -1 }).limit(10);

    query.lean().exec((err, docs) => {
      if (err) {
        client.logger.debug("mongo.query.error", { errors: err });
        res.status(500).json({});
      } else if (docs && docs.length >= 10) {
        // docs should exist and be equal to or greater (shoudn't happen)
        // than 100, otherwise we don't need to trim
        const lastWebhook = docs[docs.length - 1];
        const removeOldWebhooksQuery = WebhookModel.remove({ connectorId: ship.id, date: { $lt: lastWebhook.date } });
        removeOldWebhooksQuery.lean().exec(() => {
          res.status(200).json({ result: "groomed" });
        });
      } else {
        res.status(200).json({ result: "not enough webhooks to groom" });
      }
      return Promise.resolve();
    });
  };
}
