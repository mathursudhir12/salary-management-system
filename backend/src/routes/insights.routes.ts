/**
 * Insights route.
 *
 * GET /api/insights                           — general stats (always)
 * GET /api/insights?country=India             — + country-specific min/max/avg/headcount
 * GET /api/insights?country=India&jobTitle=X  — + avg salary for that title in that country
 *
 * All five insight functions are always executed concurrently via Promise.all.
 * The country/jobTitle conditional data is appended only when the query params are present.
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  getInsightsByCountry,
  getAvgSalaryByTitleAndCountry,
  getAvgSalaryByTitleForCountry,
  getHeadcountByCountry,
  getTopPaidJobTitles,
  getSalaryDistributionByDepartment,
} from '../services/InsightsService';

const router = Router();

// ── GET /api/insights ─────────────────────────────────────────────────────────

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const country  = typeof req.query.country  === 'string' ? req.query.country  : undefined;
      const jobTitle = typeof req.query.jobTitle === 'string' ? req.query.jobTitle : undefined;

      // ── Always-present aggregations (run concurrently) ──────────────────────
      const [headcountByCountry, topPaidJobTitles, salaryByDepartment] = await Promise.all([
        getHeadcountByCountry(),
        getTopPaidJobTitles(),
        getSalaryDistributionByDepartment(),
      ]);

      const data: Record<string, unknown> = {
        headcountByCountry,
        topPaidJobTitles,
        salaryByDepartment,
      };

      // ── Conditional: country-specific insights ──────────────────────────────
      if (country) {
        const [countryInsights, avgSalaryByTitle] = await Promise.all([
          getInsightsByCountry(country),
          getAvgSalaryByTitleForCountry(country),
        ]);
        data.countryInsights  = countryInsights;
        data.avgSalaryByTitle = avgSalaryByTitle;
      }

      // ── Conditional: avg salary for job title in that country ───────────────
      if (country && jobTitle) {
        data.avgSalaryForTitle = await getAvgSalaryByTitleAndCountry(jobTitle, country);
      }

      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
