import mongoose from "mongoose";

export default function ({ mongoUrl, collectionName }) {
  const fields = {
    connectorId: String,
    webhookData: Object,
    result: Object,
    date: Date
  };

  const options = {};

  mongoose.Promise = global.Promise;

  const schema = new mongoose.Schema(fields, options)
                             .index({ connectorId: 1, _id: -1 })
                             .index({ connectorId: 1, date: -1 });

  mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true });
  return mongoose.model(collectionName, schema);
}
