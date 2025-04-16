const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.get("/Register", (_req, res) => {
    res.render("register");
});

router.post("/Register", authController.register);

module.exports = router;