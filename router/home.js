const express = require("express");
const router = express.Router();

router.get("/home", (req, res) => {
    res.render("home", { username: req.query.username });
});

router.get("/project", (req, res) => {
    const taskTitle = req.query.title || "list task";
    res.render("project", { taskTitle });
});

router.get("/archive", (req, res) => {
    const archiveTitle = req.query.title || "archived task";
    res.render("archive", {archiveTitle})
});

module.exports = router;