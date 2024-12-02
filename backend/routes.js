const express = require("express");
const auth = require("./middleware/auth");
const router = express.Router();
const controller = require("./controller.js");

router.get("/allRequests", auth, controller.getAllRequests);
router.post("/request", auth, controller.pushRequest);
router.post("/signup", controller.signup);
router.post("/signin", controller.signin);
router.post("/validateToken", controller.validateToken);
router.get("/getRequests", auth, controller.getRequests);
router.get("/checkListName", auth, controller.checkListName);
router.get("/getFromListName", auth, controller.getfromListName);
router.get("/connections/count", auth, controller.getConnectionsCount);
router.get("/getGroupedConnections", auth, controller.getGroupedConnections);

module.exports = router;
