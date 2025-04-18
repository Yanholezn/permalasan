const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";
const todoController = require("../controllers/todoControllers");

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    const token = req.cookies?.token;
    
    if (!token) {
        // Check if refresh token exists
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            // Redirect to refresh token endpoint
            return res.redirect("/refresh-token");
        }
        return res.redirect("/");
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            // Token expired or invalid
            res.clearCookie("token");
            
            // Check if refresh token exists before redirecting
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                return res.redirect("/refresh-token");
            }
            return res.redirect("/");
        }

        req.user = decoded;
        next();
    });
};

router.get("/home", isAuthenticated, (req, res) => {
    const username = req.user.username;
    res.render("home", { username });
});

router.get("/projects", isAuthenticated, todoController.getAllProjects);
router.post("/projects", isAuthenticated, todoController.createProject);
router.get("/projects/:id", isAuthenticated, todoController.getProject);
router.put("/projects/:id", isAuthenticated, todoController.updateProject);
router.delete("/projects/:id", isAuthenticated, todoController.deleteProject);
// Add this route to match your frontend code
router.delete("/project/:id", isAuthenticated, todoController.deleteProject);

router.get("/project", isAuthenticated, (req, res) => {
    const taskTitle = req.query.title || "list task";
    res.render("project", { taskTitle });
});

router.get("/archive", isAuthenticated, (req, res) => {
    const archiveTitle = req.query.title || "archived task";
    res.render("archive", {archiveTitle})
});

module.exports = router;