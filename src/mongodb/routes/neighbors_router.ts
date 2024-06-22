import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const neighborsRouter = express.Router();
import { Zipcode } from '../models/zipcode_model.js';
import { ZipcodeGeoJSON } from '../models/zipcodegeojson_model.js';

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

// Helper function to get the response from the traffic API
async function getTrafficResponse(from: any[], to: any[]): Promise<any>{
  try {
    let drivingDistances: any[] = [];
    const response = await axios.post('https://traffic.wearewarp.link/traffic', {
      from: [from],
      to: [to]
    });

    if (response && response.data && response.data.costs) {
      drivingDistances = drivingDistances.concat( response.data.costs.filter((cost: { distance: any; }) => cost != null).map((cost: { distance: any; }) => cost.distance));
      return drivingDistances;
    }

  } catch (error) {
    console.log("Error fetching traffic data");
  }
}

// Helper function to determine if all coordinates of a zipcode is within the radius of a given GPS location
async function allWithinRadius(centerCoordinates: any[], bboxArray: any[], radius: any) {
  const bboxBottomLeft = [bboxArray[1], bboxArray[0]];
  const bboxTopRight = [bboxArray[3], bboxArray[2]];
  const bboxTopLeft = [bboxArray[3], bboxArray[0]];
  const bboxBottomRight = [bboxArray[1], bboxArray[2]];

  const distances = await Promise.all([
    getTrafficResponse(centerCoordinates, bboxBottomLeft),
    getTrafficResponse(centerCoordinates, bboxTopRight),
    getTrafficResponse(centerCoordinates, bboxTopLeft),
    getTrafficResponse(centerCoordinates, bboxBottomRight),
  ]);

  return distances.every(response => response <= radius);
}

// Helper function to determine if at least one point in the zipcode area is within the radius of a given GPS location
async function oneWithinRadius(centerCoordinates: any[], bboxArray: any[], radius: any) {
  const bboxBottomLeft = [bboxArray[1], bboxArray[0]];
  const bboxTopRight = [bboxArray[3], bboxArray[2]];
  const bboxTopLeft = [bboxArray[3], bboxArray[0]];
  const bboxBottomRight = [bboxArray[1], bboxArray[2]];

  const distances = await Promise.all([
    getTrafficResponse(centerCoordinates, bboxBottomLeft),
    getTrafficResponse(centerCoordinates, bboxTopRight),
    getTrafficResponse(centerCoordinates, bboxTopLeft),
    getTrafficResponse(centerCoordinates, bboxBottomRight),
  ]);

  // Check if at least one distance is within the radius
  return distances.some(response => response <= radius);
} 

// Endpoints to get neighbor Zipcode based on driving distance from a given GPS location
neighborsRouter.post("/neighbors-driving", async (req, res) => {
  const { lat, long, radius } = req.body;
  const { mode } = req.query;
  if (!lat || !long || !radius) {
    return res.status(400).send({ error: "Missing latitude, longitude, and/or radius" });
  }

  if (mode !== 'all' && mode !== 'one') {
    return res.status(400).send({ error: "Invalid mode. Mode should be 'all' or 'one'" });
  } 

  const givenCoordinates = [parseFloat(lat), parseFloat(long)];
  
  const radiusInMeters = radius * 1609.34; // Convert miles to meters

  const APPROXIMATION_FACTOR = 1.5; // Factor to account for driving distance

  /* 
    Pre-filter zipcodes with geospacial query with driving distance approximation
  */
  console.time("preFilteredZipCodes");
  const preFilteredZipCodes = await ZipcodeGeoJSON.find({ 'geojson.geometry': {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(long), parseFloat(lat)]
        },
        $maxDistance: radiusInMeters * APPROXIMATION_FACTOR // Approximation factor to account for driving distance
      }
    }
  }, { zipcode: 1, city: 1, 'geojson.bbox': 1 });
  console.timeEnd("preFilteredZipCodes");

  /* 
    Filter zipcodes based on driving distance 
  */
  console.time("filteredZipCodes");
  const filteredZipCodes = [];
  const batchSize = 100; // Set the batch size for processing
  if (mode === 'all') {
    for (let i = 0; i < preFilteredZipCodes.length; i += batchSize) {
    const batch = preFilteredZipCodes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (zipCode) => {
        if (await allWithinRadius(givenCoordinates, zipCode.geojson.bbox, radiusInMeters)) {
          return zipCode;
        }
      })
    );
    filteredZipCodes.push(...batchResults.filter((result) => result !== undefined));
    } 
  } else if (mode === 'one') {
     for (let i = 0; i < preFilteredZipCodes.length; i += batchSize) {
    const batch = preFilteredZipCodes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (zipCode) => {
        if (await oneWithinRadius(givenCoordinates, zipCode.geojson.bbox, radiusInMeters)) {
          return zipCode;
        }
      })
    );
    filteredZipCodes.push(...batchResults.filter((result) => result !== undefined));
    }
  }
  
  console.timeEnd("filteredZipCodes");
  
  /* 
    Filter out null values and return the zipcode and city
  */
  console.time("result");
  const result = filteredZipCodes
      .filter((doc) => doc != null)
      .map((doc) => {
        if (doc) {
          return {
            zipcode: doc.zipcode,
            city: doc.city,
          };
        }
      });

  res.send(result);
  console.timeEnd("result");

})



export { neighborsRouter };