import mongoose, { Schema } from 'mongoose';
const GeoJsonSchema = new Schema({
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
const ZipcodeGeoJSONSchema = new Schema({
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
const ZipcodeGeoJSON = mongoose.model('ZipcodeGeoJSON', ZipcodeGeoJSONSchema, 'zipcodes_geojson');
export { ZipcodeGeoJSON };
//# sourceMappingURL=zipcodegeojson_model.js.map