const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const connection = require("../../Model/dbConnect");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_S2wFC8cGw4pUpL",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YZMXR5po7GmsLpLPbQkUOobL",
});

function normalizePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) ? price : 0;
}

function getFinalPrice(row) {
  const originalPrice = normalizePrice(row.original_price);
  const discountPrice = normalizePrice(row.discount_price);
  return discountPrice > 0 ? discountPrice : originalPrice;
}

function fetchCheckoutItems(studentId, courseId, callback) {
  const params = [studentId];
  let sql = `
    SELECT
      c.course_id,
      c.course_name,
      cp.original_price,
      cp.discount_price
    FROM cart cart
    INNER JOIN course c ON cart.course_id = c.course_id
    LEFT JOIN course_prices cp ON c.course_id = cp.course_id
    WHERE cart.user_id = ?
  `;

  if (courseId) {
    sql += " AND cart.course_id = ?";
    params.push(courseId);
  }

  sql += " ORDER BY cart.cartid DESC";

  connection.query(sql, params, callback);
}

function savePaymentRecords(studentId, courseIds, paymentDetails, callback) {
  if (!courseIds.length) {
    return callback(null);
  }

  const values = courseIds.map((courseId) => [
    courseId,
    studentId,
    paymentDetails.payment_id,
    paymentDetails.order_id,
    paymentDetails.signature,
  ]);

  const sql = `
    INSERT INTO payments (course_id, student_id, payment_id, order_id, signature)
    VALUES ?
  `;

  connection.query(sql, [values], callback);
}

function removePurchasedCartItems(studentId, courseIds, callback) {
  if (!courseIds.length) {
    return callback(null);
  }

  const sql = `
    DELETE FROM cart
    WHERE user_id = ? AND course_id IN (?)
  `;

  connection.query(sql, [studentId, courseIds], callback);
}

const createOrder = async (req, res) => {
  const studentId = req.body.student_id || req.body.user_id;
  const courseId = req.body.course_id || null;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "student_id is required",
    });
  }

  fetchCheckoutItems(studentId, courseId, async (err, rows) => {
    if (err) {
      console.log("PAYMENT FETCH ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch course price",
      });
    }

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No payable course found in cart",
      });
    }

    const items = rows.map((row) => ({
      ...row,
      final_price: getFinalPrice(row),
    }));

    const amount = items.reduce((sum, item) => sum + item.final_price, 0);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price",
      });
    }

    try {
      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `student_${studentId}_${Date.now()}`,
        notes: {
          student_id: String(studentId),
          course_ids: items.map((item) => item.course_id).join(","),
        },
      });

      return res.json({
        success: true,
        order,
        amount,
        cartCount: items.length,
        items,
      });
    } catch (createErr) {
      console.log("PAYMENT ERROR:", createErr);
      return res.status(500).json({
        success: false,
        message: "Unable to create order",
      });
    }
  });
};

router.post("/create-order", createOrder);

router.post("/payment/create-order", createOrder);

router.post("/verify", (req, res) => {
  const studentId = req.body.student_id || req.body.user_id;
  const courseId = req.body.course_id || null;
  const razorpayOrderId = req.body.razorpay_order_id;
  const razorpayPaymentId = req.body.razorpay_payment_id;
  const razorpaySignature = req.body.razorpay_signature;

  if (!studentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: "Missing payment verification data",
    });
  }

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET || "YZMXR5po7GmsLpLPbQkUOobL"
    )
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment signature",
    });
  }

  fetchCheckoutItems(studentId, courseId, (err, rows) => {
    if (err) {
      console.log("VERIFY FETCH ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch purchased courses",
      });
    }

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No course found to complete payment",
      });
    }

    const courseIds = rows.map((row) => row.course_id);

    savePaymentRecords(
      studentId,
      courseIds,
      {
        payment_id: razorpayPaymentId,
        order_id: razorpayOrderId,
        signature: razorpaySignature,
      },
      (saveErr) => {
        if (saveErr) {
          console.log("PAYMENT SAVE ERROR:", saveErr);
          return res.status(500).json({
            success: false,
            message: "Unable to save payment",
          });
        }

        removePurchasedCartItems(studentId, courseIds, (deleteErr) => {
          if (deleteErr) {
            console.log("CART CLEANUP ERROR:", deleteErr);
            return res.status(500).json({
              success: false,
              message: "Payment saved but cart cleanup failed",
            });
          }

          return res.json({
            success: true,
            message: "Payment verified successfully",
            purchasedCourseIds: courseIds,
          });
        });
      }
    );
  });
});

module.exports = router;
