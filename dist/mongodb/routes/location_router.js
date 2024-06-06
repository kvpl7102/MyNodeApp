import express from 'express';
const locationRouter = express.Router();
import { Zipcode } from '../models/zipcode_model.js';
// Endpoint to get Zipcode based on GPS location
locationRouter.post("/location", async (req, res) => {
    if (!req.body.lat || !req.body.long) {
        return res.status(400).send({ error: "Missing latitude and/or longitude" });
    }
    try {
        const { lat, long } = req.body;
        const docs = await Zipcode.find({
            geoCenter: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(long), parseFloat(lat)]
                    }
                }
            }
        }).limit(1);
        if (docs.length === 0) {
            return res.status(404).send({ error: "No zipcode found for this location" });
        }
        const result = {
            zipcode: docs[0].zipcode,
            city: docs[0].city,
        };
        res.send(result);
    }
    catch (err) {
        res.status(500).send(err);
    }
});
export { locationRouter };
//# sourceMappingURL=location_router.js.map