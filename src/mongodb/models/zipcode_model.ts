/*
    This file contains the schema for the zipcode collection in the database.
*/
import mongoose, { Schema } from "mongoose";

interface IZipcode extends Document {
  _id: Schema.Types.ObjectId,
  zipcode: string,
  state: string,
  city: string,
  zcta: string,
  center: {
    latitude: number,
    longitude: number,
  },
  geoCenter: {
    type: string,
    coordinates: number[],
  },
  market: string,
  id: string,
  timezone: string,
}

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
      type: String,
      coordinates: [Number],
    },
    market: String,
    id: String,
    timezone: String,
  },
  { strict: false }
);

ZipcodeSchema.index({ geoCenter: '2dsphere' });

const Zipcode = mongoose.model<IZipcode>("Zipcode", ZipcodeSchema, "zipcodes");

export { Zipcode };
