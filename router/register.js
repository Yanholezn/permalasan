const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.get("/register", (_req, res) => {
    res.render("register");
});

// Menambahkan middleware untuk logging data register
router.post("/register", (req, res, next) => {
    console.log("Register data:", req.body);
    next();
}, authController.register);

module.exports = router;