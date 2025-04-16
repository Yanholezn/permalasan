const connection = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "your_secret_key";
const REFRESH_SECRET = "your_refresh_secret_key";

exports.register = (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.render("register", { error: "Tidak boleh ada yang kosong!" });
    }

    connection.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], async (err, results) => {
        if (err) {
            return res.render("register", { error: "Terjadi kesalahan pada server." });
        }

        if (results.length > 0) {
            return res.render("register", { error: "Username atau email sudah digunakan." });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Get the next id (alternatively, you could set up auto-increment)
        connection.query("SELECT MAX(id_user) as max_id FROM users", (err, result) => {
            if (err) {
                return res.render("register", { error: "Gagal mendapatkan ID." });
            }
            
            const nextId = (result[0].max_id || 0) + 1;
            const sql = "INSERT INTO users (id_user, username, password, email, refresh_token) VALUES (?, ?, ?, ?, '')";
            
            connection.query(sql, [nextId, username, hashedPassword, email], (err) => {
                if (err) {
                    return res.render("register", { error: "Gagal menyimpan data pengguna." });
                }
                res.redirect("/");
            });
        });
    });
}; 


exports.login = async (req, res) => {
    const { username, password } = req.body;

    // Check whether login is via username or email
    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    connection.query(sql, [username, username], (err, results) => {
        if (err) return res.status(500).send("Server error");
        if (results.length === 0) {
            return res.status(400).json({ error: "Username atau email tidak ditemukan" });
        }

        const user = results[0];

        // Verify password with bcrypt
        bcrypt.compare(password, user.password, async (err, isMatch) => {
            if (err) return res.status(500).send("Error saat cek password");
            if (!isMatch) return res.status(400).json({ error: "Password salah" });

            // Create access token
            const accessToken = jwt.sign(
                { id: user.id_user, username: user.username }, 
                SECRET_KEY, 
                { expiresIn: '15m' }
            );

            // Create refresh token
            const refreshToken = jwt.sign(
                { id: user.id_user, username: user.username }, 
                REFRESH_SECRET, 
                { expiresIn: '7d' }
            );

            // Save refresh token to database
            connection.query("UPDATE users SET refresh_token = ? WHERE id_user = ?", [refreshToken, user.id_user], (updateErr) => {
                if (updateErr) return res.status(500).send("Error saat update refresh token");

                // Send cookies for access token and refresh token
                res.cookie("token", accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 15 * 60 * 1000 // 15 minutes
                });

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
                res.redirect("/home");
            });
        });
    });
};

exports.logout = (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        res.clearCookie("token");
        res.clearCookie("refreshToken");    
        return res.redirect("/");
    }
    
    const sql = "UPDATE users SET refresh_token = '' WHERE refresh_token = ?";
    connection.query(sql, [refreshToken], (err, result) => {
        if (err) return res.status(500).json({ error: "Gagal logout" });
        
        res.clearCookie("token");
        res.clearCookie("refreshToken");
        
        return res.redirect("/");
    });
};

exports.refreshToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).send("Refresh token not found");
    }
    
    connection.query("SELECT * FROM users WHERE refresh_token = ?", [refreshToken], (err, results) => {
        if (err) return res.status(500).send("Database error");
        if (results.length === 0) return res.status(403).send("Invalid refresh token");
        
        const user = results[0];
        
        jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).send("Invalid refresh token");
            }
            
            const newToken = jwt.sign(
                { id: user.id_user, username: user.username }, 
                SECRET_KEY, 
                { expiresIn: "15m" }
            );
            
            res.cookie("token", newToken, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });
            
            res.redirect("/home");
        });
    });
};

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).redirect("/");
    }
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).redirect("/");
        }
        
        req.user = decoded;
        next();
    });
};

// Get user profile data
exports.getUserProfile = (req, res) => {
    const userId = req.user.id;
    
    connection.query("SELECT id_user, username, email FROM users WHERE id_user = ?", [userId], (err, results) => {
        if (err) return res.status(500).send("Database error");
        if (results.length === 0) return res.status(404).send("User not found");
        
        res.json(results[0]);
    });
};