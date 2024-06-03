import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { locationRouter } from './mongodb/routes/location_router.js';
import { neighborsRouter } from './mongodb/routes/neighbors_router.js';
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(locationRouter);
app.use(neighborsRouter);
app.get('/', (req, res) => {
    res.send('Hello World');
});
// Connect to MongoDB database
const Connection_URL = "mongodb+srv://kinhvi0710:admin123@mynodeapp.vfzn57e.mongodb.net/MyNodeAppDB?retryWrites=true&w=majority&appName=MyNodeApp";
const PORT = 8080;
mongoose.connect(Connection_URL).then(() => {
    console.log("Connected to database");
    app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
}).catch((error) => {
    console.log("error connecting to database", error);
});
//# sourceMappingURL=index.js.map