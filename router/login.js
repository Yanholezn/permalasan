const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();
const jwt = require("jsonwebtoken"); 
const SECRET_KEY = "your_secret_key";

router.get("/", (_req, res) => {
    res.render("login");
});

router.get("/Register", (_req, res) => {
    res.render("register");
});

router.post("/login", authController.login);

router.get("/refresh-token", authController.refreshToken);

router.get("/logout", authController.logout);

const isAuthenticated = (req, res, next) => {
    if (!req.cookies) {
        console.log('Warning: req.cookies is undefined. Make sure cookie-parser is properly configured.');
        return res.redirect("/");
    }
    
    const token = req.cookies.token;
    
    if (!token) {
        // Check if refresh token exists
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            // Redirect to refresh token endpoint
            return res.redirect("/refresh-token");
        }
        return res.redirect("/");
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            // Token expired or invalid
            if (req.cookies) {
                res.clearCookie("token");
                
                // Check if refresh token exists before redirecting
                const refreshToken = req.cookies.refreshToken;
                if (refreshToken) {
                    return res.redirect("/refresh-token");
                }
            }
            return res.redirect("/");
        }

        req.user = decoded;
        next();
    });
};

// Protected home route
router.get("/home", isAuthenticated, (req, res) => {
    res.render("home", { username: req.user.username });
});

// Add route for user profile if needed
router.get("/profile", isAuthenticated, authController.getUserProfile);

module.exports = router;