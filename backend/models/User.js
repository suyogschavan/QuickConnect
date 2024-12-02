const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  signUpOn: { type: Date, default: Date.now },
  guid: { type: String, default: uuidv4, unique: true, required: true },
});

module.exports = mongoose.model("User", userSchema);
