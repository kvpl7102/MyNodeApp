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


// Endpoints to get neighbor Zipcode based on driving distance from a given GPS location
neighborsRouter.post("/neighbors-driving", async (req, res) => {
  
  const { lat, long, radius } = req.body;
  if (!lat || !long || !radius) {
    return res.status(400).send({ error: "Missing latitude, longitude, and/or radius" });
  }
  
  const radiusInMeters = radius * 1609.34; // Convert miles to meters

  // console.time("fetchZipcodes");
  const potentialZipCodes = await ZipcodeGeoJSON.aggregate([
    {
        $project: {
          _id: 0,
          center: 1,
          zipcode: 1,
          geojson: 1
        }
      }
  ]);
  // console.timeEnd("fetchZipcodes");

  // Find potential zip codes within a larger radius to account for driving distance
  // const potentialZipCodes = await Zipcode.find({
  //   geoCenter: {
  //     $nearSphere: {
  //       $geometry: {
  //         type: "Point",
  //         coordinates: [parseFloat(long), parseFloat(lat)]
  //       },
  //       $maxDistance: radiusInMeters
  //     }
  //   }
  // });

  /*
    Determine if at least one point in the zipcode area is within the radius of the given GPS location  
  */
  let drivingDistances: any[] = [];
  let batchLength = 100;
  for (let i = 0; i < potentialZipCodes.length; i += batchLength) {
    const batch = potentialZipCodes.slice(i, i + batchLength);
    const from = Array(batch.length).fill([lat, long]);
    const to = batch.map(zip => [zip.center.latitude, zip.center.longitude]);

    const response = await axios.post('https://traffic.wearewarp.link/traffic', {
      from: from,
      to: to
    });


    if (response && response.data && response.data.costs) {
      drivingDistances = drivingDistances.concat( response.data.costs.filter((cost: { distance: any; }) => cost != null).map((cost: { distance: any; }) => cost.distance));
    }
  }

  // Filter zip codes within the radius
  const zipCodesWithinRadius = potentialZipCodes.filter((zip, i) => {
    return drivingDistances[i] <= radiusInMeters;
  });

  // Extract the zip code and city from the results
  const result = zipCodesWithinRadius.map(zip => ({
    zipcode: zip.zipcode
  }));


  /*
    Determine if all points in the zipcode area are inside the radius of the given GPS location 
  */ 
  let drivingDistancesAll: any[] = [];
  for (let i = 0; i < potentialZipCodes.length; i += batchLength) {
    const batch = potentialZipCodes.slice(i, i + batchLength);
    const from = Array(batch.length).fill([lat, long]);
    const bottomLeft = batch.map(zip => [zip.geojson.bbox[1], zip.geojson.bbox[0]]);
    const topRight = batch.map(zip => [zip.geojson.bbox[3], zip.geojson.bbox[2]]);

    const responseBottomleft = await axios.post('https://traffic.wearewarp.link/traffic', {
      from: from,
      to: bottomLeft
    });

    if (responseBottomleft && responseBottomleft.data && responseBottomleft.data.costs) {
      drivingDistancesAll = drivingDistancesAll.concat( responseBottomleft.data.costs.filter((cost: { distance: any; }) => cost != null).map((cost: { distance: any; }) => cost.distance));
    }

  }

  // Send the response
  res.send(result);
})



export { neighborsRouter };