const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  viewCart,
  removeFromCart,
  getCartSummary,
} = require("../../Controller/cart/cartController");

router.post("/addtocart", addToCart);
router.get("/viewcart", getCart);
router.get("/viewcart/:user_id", viewCart);
router.get("/summary/:user_id", getCartSummary);
router.delete("/:cartid", removeFromCart);

/* Optional: base route check */
router.get("/", (req, res) => {
  res.send("Cart API Running");
});

module.exports = router;

