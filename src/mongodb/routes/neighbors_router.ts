import express from 'express';
import mongoose from 'mongoose';
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
  } catch (err) {
    res.status(500).send(err);
  }
});


// Endpoints to get neighbor Zipcode based on driving distance from a given GPS location


export { neighborsRouter };