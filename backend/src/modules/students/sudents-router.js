const express = require("express");
const router = express.Router();
const studentController = require("./students-controller");
const { cacheMiddleware, invalidateCache } = require("../../middlewares");

// Cache key generators
const cacheKeys = {
  list: (req) => `cache:students:list:${new URLSearchParams(req.query).toString()}`,
  detail: (req) => `cache:students:detail:${req.params.id}`,
};

// GET endpoints with cache (TTL: 5 minutes)
router.get("", 
  cacheMiddleware(300, cacheKeys.list), 
  studentController.handleGetAllStudents
);

router.get("/:id", 
  cacheMiddleware(300, cacheKeys.detail), 
  studentController.handleGetStudentDetail
);

router.get("/:id/report", 
  studentController.handleGeneratePDFReport
); // Don't cache PDF generation

// POST/PUT endpoints with cache invalidation
router.post("", 
  invalidateCache(['cache:students:list*']), 
  studentController.handleAddStudent
);

router.put("/:id", 
  invalidateCache((req) => [
    'cache:students:list*',
    `cache:students:detail:${req.params.id}`
  ]), 
  studentController.handleUpdateStudent
);

router.post("/:id/status", 
  invalidateCache((req) => [
    'cache:students:list*',
    `cache:students:detail:${req.params.id}`
  ]), 
  studentController.handleStudentStatus
);

module.exports = { studentsRoutes: router };
