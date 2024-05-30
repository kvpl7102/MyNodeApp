const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const Zipcode = require("./models/zipcode");
const Zipcode_geojson = require("./models/zipcode_geojson");
const app = express();

const uri =
  "mongodb+srv://kinhvi0710:admin123@mynodeapp.vfzn57e.mongodb.net/MyNodeAppDB?retryWrites=true&w=majority&appName=MyNodeApp";

app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("What's up!!!");
// });

// Endpoints to get city and zip code from a given GPS location
app.post("/location", async (req, res) => {
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
  } catch (err) {
    res.status(500).send(err);
  }
});

// Endpoints to get neighbor Zipcode based on flight distance from a given GPS location
app.post("/neighbors-flight", async (req, res) => {
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
  } catch (err) {
    res.status(500).send(err);
  }
});

// Helper function to fetch driving distances in batches
async function fetchDrivingDistances(fromCoordinates, toCoordinates) {
  const startTrafficApiTime = Date.now();
  try {
    const response = await axios.post(
      "https://traffic.wearewarp.link/traffic",
      {
        from: [fromCoordinates],
        to: [toCoordinates],
      }
    );
    // console.log(
    //   `Traffic API call duration: ${Date.now() - startTrafficApiTime}ms`
    // );
    return response.data.costs[0].distance;
  } catch (error) {
    console.error("Error fetching driving distances:", error);
    return null;
  }
}

// Endpoints to get neighbor Zipcode based on driving distance from a given GPS location
app.post("/neighbors-driving", async (req, res) => {
  
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
  console.log("potentialZipcodes length: " +  potentialZipCodes.length,'\n');

  // Calculate driving distances of potential zip codes
  const drivingDistances = await Promise.all(potentialZipCodes.map(zip => {
    return axios.post('https://traffic.wearewarp.link/traffic', {
      from: [[lat, long]],
      to: [zip.geoCenter.coordinates.reverse()]
    });
  }));

  console.log("drivingDistances length: " + drivingDistances.length,'\n');

  // Filter zip codes within the radius
  const zipCodesWithinRadius = potentialZipCodes.filter((zip, i) => {
    return drivingDistances[i] && drivingDistances[i].data && drivingDistances[i].data.costs && drivingDistances[i].data.costs[0] && drivingDistances[i].data.costs[0].distance <= radiusInMeters;
  });

  console.log("zipCodesWithinRadius length: " + zipCodesWithinRadius.length,'\n');  

  // Extract the zip code and city from the results
  const result = zipCodesWithinRadius.map(zip => ({
    zipcode: zip.zipcode,
    city: zip.city
  }));

  // Send the response
  res.send(result);
  
});

// Connect to the database and start the server
mongoose.set("strictQuery", false);
mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to the database!");

    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

// Update coordinates in the collection to be in the geojson format
async function updateGeoCenters() {
  const zipcodes = await Zipcode.find();

  for (const zipcode of zipcodes) {
    const { center } = zipcode;
    if (center && center.latitude && center.longitude) {
      zipcode.geoCenter = {
        type: "Point",
        coordinates: [center.longitude, center.latitude],
      };
      await zipcode.save();
    }
  }

  // console.log("GeoCenters updated successfully");
  // mongoose.connection.close();
}

updateGeoCenters().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});

// connect();
