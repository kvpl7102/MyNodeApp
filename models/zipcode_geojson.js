const mongoose = require("mongoose");

const ZipcodeGeojsonSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    center: {
      latitude: Number,
      longitude: Number,
    },
    zcta: String,
    state: String,
    city: String,
    zipcode: String,
    geojson: {
      type: {
        type: String,
        // enum: ["Feature"], 
      },
      properties: Object,
      geometry: {
        type: {
          type: String,
        //   enum: ["MultiPolygon", "Polygon"],
        },
        coordinates: { type: [[Number]] },
      },
      bbox: [Number],
    },
  },
  { strict: false }
);

ZipcodeGeojsonSchema.index({ "geojson.geometry": "2dsphere" });

const Zipcode_geojson = mongoose.model("Zipcode_geojson", ZipcodeGeojsonSchema, "zipcodes_geojson");

module.exports = Zipcode_geojson;
