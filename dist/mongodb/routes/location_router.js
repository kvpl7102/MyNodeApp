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
            "center.latitude": lat,
            "center.longitude": long,
        });
        const result = docs.map((doc) => {
            return {
                zipcode: doc.zipcode,
                city: doc.city,
            };
        });
        res.send(result);
    }
    catch (err) {
        res.status(500).send(err);
    }
});
export { locationRouter };
//# sourceMappingURL=location_router.js.map