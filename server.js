const express = require("express");
const mongoose = require("mongoose");
const Zipcode = require("./models/zipcode");
const Zipcode_geojson = require("./models/zipcode_geojson");
const app = express();

const uri =
  "mongodb+srv://kinhvi0710:admin123@mynodeapp.vfzn57e.mongodb.net/MyNodeAppDB?retryWrites=true&w=majority&appName=MyNodeApp";

app.use(express.json());


app.get("/", (req, res) => {
  res.send("What's up!!!");
});

// Endpoints to get city and zip code from a given GPS location
app.get("/location", async (req, res) => {
  
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

// Endpoints to get neighbor Zipcode from a given GPS location
app.get("/neighbor", async (req, res) => {
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

mongoose.set("strictQuery", false);
mongoose.connect(uri).then(() => {
  console.log("Connected to the database!");
  
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });

}).catch((err) => {
  console.log("Cannot connect to the database!", err);
  process.exit();
});

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

