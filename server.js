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
  
  if (!req.query.lat || !req.query.long) {
    return res.status(400).send({ error: "Missing latitude and/or longitude" });
  }
  
  try {
    const { lat, long } = req.query;
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

// connect();

