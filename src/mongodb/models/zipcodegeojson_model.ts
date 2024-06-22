import mongoose, { Document, Schema } from 'mongoose';

interface IGeoJson {
  type: string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  bbox: number[];
}

interface IZipcode extends Document {
  _id: {
    $oid: string;
  };
  center: {
    latitude: number;
    longitude: number;
  };
  zcta: string;
  state: string;
  city: string;
  zipcode: string;
  geojson: IGeoJson;
}

const GeoJsonSchema: Schema = new Schema({
  type: String,
  properties: Schema.Types.Mixed,
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], 
      required: true
    }
  },
  bbox: [Number]
});

GeoJsonSchema.index({ geometry: '2dsphere' });

const ZipcodeGeoJSONSchema: Schema = new Schema({
  _id: {
    $oid: String
  },
  center: {
    latitude: Number,
    longitude: Number
  },
  zcta: String,
  state: String,
  city: String,
  zipcode: String,
  geojson: GeoJsonSchema
});

const ZipcodeGeoJSON = mongoose.model<IZipcode>('ZipcodeGeoJSON', ZipcodeGeoJSONSchema, 'zipcodes_geojson');

export { ZipcodeGeoJSON };