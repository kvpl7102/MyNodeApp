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
    geoCenter: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    market: String,
    id: String,
    timezone: String,
  },
  { strict: false }
);

ZipcodeSchema.index({ geoCenter: '2dsphere' });

const Zipcode = mongoose.model("Zipcode", ZipcodeSchema, "zipcodes");

module.exports = Zipcode;
