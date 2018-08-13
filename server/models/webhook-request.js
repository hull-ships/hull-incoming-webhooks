// @flow
import type { TWebhookRequest } from "../types";

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

module.exports = function WebhookRequest({
  mongoUrl,
  collectionSize,
  collectionName,
}: TWebhookRequest) {
  const fields = {
    connectorId: String,
    webhookData: Object,
    result: Object,
    date: Date,
  };

  const options = {
    capped: {
      size: collectionSize,
      autoIndexId: true,
    },
  };

  mongoose.Promise = global.Promise;

  // $FlowFixMe Error do not fit with mongoose doc (http://mongoosejs.com/docs/guide.html#capped)
  const schema = new Schema(fields, options).index({ connectorId: 1, _id: -1 });

  mongoose.connect(
    mongoUrl,
    { useNewUrlParser: true }
  );

  return mongoose.model(collectionName, schema);
};
