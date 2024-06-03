import express from 'express';
import axios from 'axios';
const neighborsRouter = express.Router();
import { Zipcode } from '../models/zipcode_model.js';
// Endpoints to get neighbor Zipcode based on flight distance from a given GPS location
neighborsRouter.post("/neighbors-flight", async (req, res) => {
    const { lat, long, radius } = req.body;
    if (!lat || !long || !radius) {
        return res
            .status(400)
            .send({ error: "Missing latitude, longitude, and/or radius" });
    }
    const radiusInRadians = radius / 3963.2;
    try {
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
        res.send(result);
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
    const radiusInRadians = radius / 3963.2; // Convert miles to radians
    // Find potential zip codes within the radius
    const potentialZipCodes = await Zipcode.find({
        geoCenter: {
            $geoWithin: {
                $centerSphere: [[parseFloat(long), parseFloat(lat)], radiusInRadians]
            }
        }
    });
    console.log("----------------------------------------");
    console.log("potentialZipcodes length: " + potentialZipCodes.length, '\n');
    // Calculate driving distances of potential zip codes
    const drivingDistances = await Promise.all(potentialZipCodes.map(zip => {
        const coordinates = zip.geoCenter ? zip.geoCenter.coordinates.reverse() : null;
        const result = axios.post('https://traffic.wearewarp.link/traffic', {
            from: [[lat, long]],
            to: [coordinates]
        });
        return result;
    }));
    console.log("drivingDistances length: " + drivingDistances.length, '\n');
    // Filter zip codes within the radius
    const zipCodesWithinRadius = potentialZipCodes.filter((zip, i) => {
        return drivingDistances[i] && drivingDistances[i].data && drivingDistances[i].data.costs && drivingDistances[i].data.costs[0] && drivingDistances[i].data.costs[0].distance <= radiusInMeters;
    });
    console.log("zipCodesWithinRadius length: " + zipCodesWithinRadius.length, '\n');
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