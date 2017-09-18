import mongoose from "mongoose";
export const schema = new mongoose.Schema({
  webhookData: Object,
  result: Object,
  date: Date
}, {
  capped: {
    size: 16777216,
    max: 100,
    autoIndexId: true
  }
});
