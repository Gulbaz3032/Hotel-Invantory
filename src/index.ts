import express from "express";
import dotenv from "dotenv"
import { dbConn } from "./config/db.js";
dotenv.config();

const port = process.env.PORT

const app = express();

app.use(express.json());
dbConn()

app.listen(port, () => {
    console.log(`Your Port is running on ${port}`)
});
