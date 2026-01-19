const express = require("express");
const router = express.Router();
const classesController = require("./classes-controller");
const { checkApiAccess } = require("../../middlewares");
const { cacheMiddleware, invalidateCache } = require("../../middlewares/cache-middleware");

// GET with cache (10 minutes)
router.get("", 
  checkApiAccess, 
  cacheMiddleware(600, () => 'cache:classes:list'),
  classesController.handleFetchAllClasses
);

router.get("/:id", 
  checkApiAccess, 
  cacheMiddleware(600, (req) => `cache:classes:detail:${req.params.id}`),
  classesController.handleFetchClassDetail
);

// POST/PUT/DELETE with cache invalidation
router.post("", 
  checkApiAccess, 
  invalidateCache(['cache:classes:*']),
  classesController.handleAddClass
);

router.put("/:id", 
  checkApiAccess, 
  invalidateCache(['cache:classes:*']),
  classesController.handleUpdateClass
);

router.delete("/:id", 
  checkApiAccess, 
  invalidateCache(['cache:classes:*']),
  classesController.handleDeleteClass
);

module.exports = { classesRoutes: router };
