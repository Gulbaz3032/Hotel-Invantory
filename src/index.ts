import express from "express";
import dotenv from "dotenv";
import { dbConn } from "./config/db.js";
import inventoryRouter from "./routes/inventoryRoute.js";
import categoryRouter from "./routes/categoryRoutes.js";
import reportRouter from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
dbConn();

app.use("/api/hotel", inventoryRouter);
app.use("/api/category", categoryRouter);
app.use("/api/reports", reportRouter);

app.listen(port, () => {
  console.log(`Your Port is running on ${port}`);
});
