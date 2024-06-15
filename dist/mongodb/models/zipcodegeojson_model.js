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
            type: [[[Number]]], // Array of arrays of arrays of numbers
            required: true
        },
        bbox: [Number]
    }
});
GeoJsonSchema.index({ geometry: '2dsphere' });
const ZipcodeSchema = new Schema({
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
const Zipcode = mongoose.model('Zipcode', ZipcodeSchema, 'zipcodes_geojson');
//# sourceMappingURL=zipcodegeojson_model.js.map