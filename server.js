const express = require('express');
const moogoose = require('mongoose');
const app = express();
const uri =
  "mongodb+srv://kinhvi0710:admin123@mynodeapp.vfzn57e.mongodb.net/?retryWrites=true&w=majority&appName=MyNodeApp";

// Routes
app.get('/', (req, res) => {
  res.send('Hello World');
});

async function connect() {
    try {
        await moogoose.connect(uri);
        console.log('Connected succesfully to MongoDB');
    }
    catch (err) {
        console.log('Error connecting to the database' + err);
    }
}

connect();

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


