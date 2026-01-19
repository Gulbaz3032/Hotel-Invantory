import { Router } from "express";
import {
  addStock,
  createItem,
  getItems,
  getInventoryReport,
  useStock
} from "../controllers/inventoryController.js";
import { getDailyReports } from "../controllers/dailyReportController.js";
import { getMonthlyUsageReport } from "../controllers/monthlyReportController.js";

const router = Router();



router.post("/item", createItem);
router.get("/item", getItems);
router.post("/add", addStock);
router.post("/use", useStock);
router.get("/report", getInventoryReport);

// Daily reports

router.get("/daily-usages", getDailyReports)
router.get("/monthly-usage", getMonthlyUsageReport);

export default router;
