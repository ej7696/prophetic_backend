const mongoose = require("mongoose");
require("dotenv").config();

let MongoURI = process.env.MONGODB_URI;

mongoose
  .connect(MongoURI)
  .then(() => {
    console.log("DATABASE CONNECTED");
  })
  .catch((err) => console.log("DATABASE CONNECTION FAILED", err));
