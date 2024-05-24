/*
    This file contains the schema for the zipcode collection in the database.
*/
const mongoose = require("mongoose");

const ZipcodeSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    zipcode: String,
    state: String,
    city: String,
    zcta: String,
    center: {
      latitude: Number,
      longitude: Number,
    },
    market: String,
    id: String,
    timezone: String,
  },
  { strict: false }
);

const Zipcode = mongoose.model("Zipcode", ZipcodeSchema, "zipcodes");

module.exports = Zipcode;
