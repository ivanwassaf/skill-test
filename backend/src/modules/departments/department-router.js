const express = require("express");
const router = express.Router();
const departmentController = require("./department-controller");
const { cacheMiddleware, invalidateCache, cachePatterns } = require("../../middlewares/cache-middleware");

// GET with cache (10 minutes - departments rarely change)
router.get("", 
  cacheMiddleware(600, () => 'cache:departments:list'),
  departmentController.handleGetAllDepartments
);

router.get("/:id", 
  cacheMiddleware(600, (req) => `cache:departments:detail:${req.params.id}`),
  departmentController.handleGetDepartmentById
);

// POST/PUT/DELETE with cache invalidation
router.post("", 
  invalidateCache(['cache:departments:*']),
  departmentController.handleAddNewDepartment
);

router.put("/:id", 
  invalidateCache(['cache:departments:*']),
  departmentController.handleUpdateDepartmentById
);

router.delete("/:id", 
  invalidateCache(['cache:departments:*']),
  departmentController.handleDeleteDepartmentById
);

module.exports = { departmentRoutes: router };
