import { Router } from "express";
import { addStock, getInventoryReport, useStock } from "../controllers/inventoryController.js";

const router = Router();

router.post("/add", addStock);
router.post("/use", useStock);
router.post("/use", );
router.get("/report", getInventoryReport);

export default router;