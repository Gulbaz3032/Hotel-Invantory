import type { Request } from "express";

export const getDailyReports = async (req: Request, res: Response) => {
    const { date } = req.query;
    
}