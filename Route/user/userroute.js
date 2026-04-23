const express = require("express");
const userRouter = express.Router();
const {
  getuser,
  getusercount,
  postuser,
  loginUser,
  signupUser,
  deleteuser,
  putuser,
  patchuserstatus,
  changePassword,
} = require("../../Controller/user/userController");

const authenticate  = require("../../Middleware/authMiddleware");

userRouter.get("/viewitem", authenticate, getuser);
userRouter.get("/getusercount", authenticate, getusercount);
userRouter.post("/additem", authenticate, postuser);
userRouter.post("/loginUser", loginUser);
userRouter.delete("/deleteitem/:userid", authenticate, deleteuser);
userRouter.put("/user/:userid", putuser);
userRouter.patch("/userstatus/:userid", patchuserstatus);
userRouter.post("/changepassword", authenticate, changePassword);
userRouter.post("/signup", signupUser);

module.exports = userRouter;
