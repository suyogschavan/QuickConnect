const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const routes = require("./routes");

dotenv.config();
const URI = process.env.URI;
const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use("/api", routes);

mongoose
  .connect(URI)
  .then(() => console.log("MongoDB connected "))
  .catch((err) => console.log("Database cannot be connected. Error: ", err));

app.listen(PORT, () => console.log("Listening on http://localhost:3000"));
