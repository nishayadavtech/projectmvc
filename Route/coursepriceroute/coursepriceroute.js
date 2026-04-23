const express = require("express");
const router = express.Router();
const coursePriceController = require("../../Controller/coursepricemodal/coursepricemodalcontroller");

router.get("/course-price/:course_id", coursePriceController.getCoursePrice);

module.exports = router;
