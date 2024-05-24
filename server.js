const express = require("express");
const mongoose = require("mongoose");
const Zipcode = require("./models/zipcode");
const app = express();

const uri =
  "mongodb+srv://kinhvi0710:admin123@mynodeapp.vfzn57e.mongodb.net/MyNodeAppDB?retryWrites=true&w=majority&appName=MyNodeApp";

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));



// app.get("/", (req, res) => {
//   res.send("What's up!!!");
// });

// Endpoints to get city and zip code from a given GPS location
app.get("/location", (req, res) => {
  
  
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

// connect();

