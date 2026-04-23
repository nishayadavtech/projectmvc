// const connection = require("../../Model/dbConnect");

// // ================= ADD TO CART =================
// const addToCart = (req, res) => {
//   const { course_id, user_id } = req.body;

//   if (!course_id || !user_id) {
//     return res.status(400).json({ message: "Missing data" });
//   }

//   const sql = `
//     INSERT INTO cart (course_id, user_id)
//     VALUES (?, ?)
//   `;

//   connection.query(sql, [course_id, user_id], (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ message: "DB Error" });
//     }
//     res.json({ message: "Added to cart successfully" });
//   });
// };

// // ================= GET CART =================
// const getCart = (req, res) => {
//   const sql = `
//     SELECT cart.cartid, course.course_name, course.image_url
//     FROM cart
//     JOIN course ON cart.course_id = course.course_id
//   `;

//   connection.query(sql, (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ message: "DB Error" });
//     }
//     res.json(result);
//   });
// };

// // ================= REMOVE FROM CART =================
// const removeFromCart = (req, res) => {
//   const { cartid } = req.params;

//   const sql = `DELETE FROM cart WHERE cartid = ?`;

//   connection.query(sql, [cartid], (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(500).json({ message: "DB Error" });
//     }
//     res.json({ message: "Removed successfully" });
//   });
// };


// module.exports = {
//   addToCart,
//   getCart,
//   removeFromCart,
// };


const connection = require("../../Model/dbConnect");

function attachFullImageUrl(rows, req) {
  if (!Array.isArray(rows)) return [];

  const base = `${req.protocol}://${req.get("host")}`;

  return rows.map((row) => {
    if (!row.image_url) return row;

    if (/^https?:\/\//i.test(row.image_url)) {
      return row;
    }

    const imagePath = row.image_url.startsWith("/")
      ? row.image_url
      : `/${row.image_url}`;

    return { ...row, image_url: `${base}${imagePath}` };
  });
}

function normalizePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) ? price : 0;
}

function mapCartRows(rows, req) {
  return attachFullImageUrl(rows, req).map((row) => {
    const originalPrice = normalizePrice(row.original_price);
    const discountPrice = normalizePrice(row.discount_price);
    const finalPrice = discountPrice > 0 ? discountPrice : originalPrice;

    return {
      ...row,
      original_price: originalPrice,
      discount_price: discountPrice,
      final_price: finalPrice,
    };
  });
}

function fetchCartByUserId(user_id, req, res) {
  const sql = `
    SELECT
      cart.cartid,
      cart.course_id,
      cart.user_id,
      course.course_name,
      course.description,
      course.duration,
      course.image_url,
      cp.original_price,
      cp.discount_price
    FROM cart
    JOIN course ON cart.course_id = course.course_id
    LEFT JOIN course_prices cp ON cart.course_id = cp.course_id
    WHERE cart.user_id = ?
    ORDER BY cart.cartid DESC
  `;

  connection.query(sql, [user_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "DB Error",
      });
    }

    const items = mapCartRows(result, req);
    return res.json(items);
  });
}

/* ================= ADD TO CART ================= */
const addToCart = (req, res) => {
  const { course_id, user_id } = req.body;

  if (!course_id || !user_id) {
    return res.status(400).json({
      success: false,
      message: "Missing data",
    });
  }

  const checkSql = `
    SELECT cartid
    FROM cart
    WHERE course_id = ? AND user_id = ?
  `;

  connection.query(checkSql, [course_id, user_id], (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "DB Error",
      });
    }

    if (rows.length > 0) {
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        message: "Course already in cart",
      });
    }

    const insertSql = `
      INSERT INTO cart (course_id, user_id)
      VALUES (?, ?)
    `;

    connection.query(insertSql, [course_id, user_id], (insertErr, result) => {
      if (insertErr) {
        console.log(insertErr);
        return res.status(500).json({
          success: false,
          message: "DB Error",
        });
      }

      return res.status(201).json({
        success: true,
        cartid: result.insertId,
        message: "Added to cart successfully",
      });
    });
  });
};

/* ================= GET CART ================= */
const getCart = (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required",
    });
  }

  return fetchCartByUserId(user_id, req, res);
};

/* ================= REMOVE ================= */
const removeFromCart = (req, res) => {
  const { cartid } = req.params;

  const sql = `DELETE FROM cart WHERE cartid = ?`;

  connection.query(sql, [cartid], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "DB Error",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.json({
      success: true,
      message: "Removed successfully",
    });
  });
};

const viewCart = (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required",
    });
  }

  return fetchCartByUserId(user_id, req, res);
};

const getCartSummary = (req, res) => {
  const user_id = req.params.user_id || req.query.user_id;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required",
    });
  }

  const sql = `
    SELECT
      cp.original_price,
      cp.discount_price
    FROM cart
    LEFT JOIN course_prices cp ON cart.course_id = cp.course_id
    WHERE cart.user_id = ?
  `;

  connection.query(sql, [user_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "DB Error",
      });
    }

    const totalAmount = result.reduce((sum, row) => {
      const originalPrice = normalizePrice(row.original_price);
      const discountPrice = normalizePrice(row.discount_price);
      return sum + (discountPrice > 0 ? discountPrice : originalPrice);
    }, 0);

    return res.json({
      success: true,
      cartCount: result.length,
      totalAmount,
    });
  });
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  viewCart,
  getCartSummary,
};
