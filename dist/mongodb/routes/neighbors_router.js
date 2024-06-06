import express from 'express';
import axios from 'axios';
const neighborsRouter = express.Router();
import { Zipcode } from '../models/zipcode_model.js';
// Endpoints to get neighbor Zipcode based on flight distance from a given GPS location
neighborsRouter.post("/neighbors-flight", async (req, res) => {
    const locations = req.body;
    if (!Array.isArray(locations)) {
        return res.status(400).send({ error: "Input should be an array of locations" });
    }
    try {
        let results = [];
        for (let location of locations) {
            const { lat, long, radius } = location;
            if (!lat || !long || !radius) {
                results.push({ error: "Missing latitude, longitude, and/or radius for one of the locations" });
                continue;
            }
            const radiusInRadians = radius / 3963.2;
            const docs = await Zipcode.find({
                geoCenter: {
                    $geoWithin: {
                        $centerSphere: [[parseFloat(long), parseFloat(lat)], radiusInRadians],
                    },
                },
            });
            const result = docs.map((doc) => {
                return {
                    zipcode: doc.zipcode,
                    city: doc.city,
                };
            });
            results.push(result);
        }
        res.send(results);
    }
    catch (err) {
        res.status(500).send(err);
    }
});
// Endpoints to get neighbor Zipcode based on driving distance from a given GPS location
neighborsRouter.post("/neighbors-driving", async (req, res) => {
    const { lat, long, radius } = req.body;
    if (!lat || !long || !radius) {
        return res.status(400).send({ error: "Missing latitude, longitude, and/or radius" });
    }
    const radiusInMeters = radius * 1609.34; // Convert miles to meters
    // Find potential zip codes within a larger radius to account for driving distance
    const potentialZipCodes = await Zipcode.find({
        geoCenter: {
            $nearSphere: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(long), parseFloat(lat)]
                },
                $maxDistance: radiusInMeters
            }
        }
    });
    // Calculate driving distances of potential zip codes
    let drivingDistances = [];
    for (let i = 0; i < potentialZipCodes.length; i += 100) {
        const batch = potentialZipCodes.slice(i, i + 100);
        const from = Array(batch.length).fill([lat, long]);
        const to = batch.map(zip => [zip.center.latitude, zip.center.longitude]);
        const response = await axios.post('https://traffic.wearewarp.link/traffic', {
            from: from,
            to: to
        });
        drivingDistances = drivingDistances.concat(response.data.costs.map((cost) => cost.distance));
    }
    // Filter zip codes within the radius
    const zipCodesWithinRadius = potentialZipCodes.filter((zip, i) => {
        return drivingDistances[i] <= radiusInMeters;
    });
    // Extract the zip code and city from the results
    const result = zipCodesWithinRadius.map(zip => ({
        zipcode: zip.zipcode,
        city: zip.city
    }));
    // Send the response
    res.send(result);
});
export { neighborsRouter };
//# sourceMappingURL=neighbors_router.js.map