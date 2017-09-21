import mongoose from "mongoose";

export function schema(collectionSize) {
  return new mongoose.Schema({
    connectorId: String,
    webhookData: Object,
    result: Object,
    date: Date
  }, {
    capped: {
      size: collectionSize,
      autoIndexId: true
    }
  }).index({ connectorId: 1 });
}
