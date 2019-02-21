import mongoose from "mongoose";

export default function ({ mongoUrl, collectionSize, collectionName }) {
  const fields = {
    connectorId: String,
    webhookData: Object,
    result: Object,
    date: Date
  };

  const options = {
    capped: {
      size: collectionSize,
      autoIndexId: true
    }
  };

  mongoose.Promise = global.Promise;

  const schema = new mongoose.Schema(fields, options)
    .index({ connectorId: 1, _id: -1 });

  const connection = mongoose.connect(mongoUrl, { useMongoClient: true });
  return connection.model(collectionName, schema);
}
