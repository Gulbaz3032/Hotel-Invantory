import { Router } from "express";
import {
  addStock,
  createItem,
  getInventoryReport,
  useStock
} from "../controllers/inventoryController.js";

const router = Router();


router.post("/item", createItem);
router.post("/add", addStock);
router.post("/use", useStock);
router.get("/report", getInventoryReport);

export default router;
