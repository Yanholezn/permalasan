const express = require("express");
const router = express.Router();

router.get("/project", (req, res) => {
    res.render("project", { username: req.query.username });z
});

router.get("/Home", (req, res) => {
    const homeTitle = req.query.title || "Homepage";
    res.render("Home", {homeTitle})
});

module.exports = router;