const connection = require("../../Model/dbConnect");

exports.getCoursePrice = (req, res) => {
    const { course_id } = req.params;

    coursePriceModel.getCoursePriceById(course_id, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        const { original_price, selling_price } = result[0];

        const discount = Math.round(
            ((original_price - selling_price) / original_price) * 100
        );

        res.json({
            original_price,
            selling_price,
            discount: discount + "%"
        });
    });
};
