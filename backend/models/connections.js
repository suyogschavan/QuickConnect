const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
  userGuid: { type: String, require: true, ref: "User" },
  name: { type: String, required: true },
  url: { type: String, required: true },
  listName: { type: String, required: true },
  connectionNote: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ConnectionRequests", connectionRequestSchema);
