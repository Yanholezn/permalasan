const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "your_secret_key";
const REFRESH_SECRET = "your_refresh_secret_key";

exports.register = async (req, res) => {
    const { username, password, email } = req.body;
    console.log("Processing register for:", { username, email });

    if (!username || !password || !email) {
        console.log("Validation error: Data tidak lengkap");
        return res.render("register", { error: "Username, password, dan email harus diisi!" });
    }

    try {
        const [results] = await db.execute("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
        
        if (results.length > 0) {
            console.log("Username/email sudah ada:", results[0]);
            return res.render("register", { error: "Username atau email sudah digunakan." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password berhasil di-hash");
        
        const sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
        await db.execute(sql, [username, hashedPassword, email]);
        
        console.log("User berhasil di-register");
        res.redirect("/");
    } catch (error) {
        console.error("Error saat registrasi:", error);
        return res.render("register", { error: "Terjadi kesalahan pada server." });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username dan password harus diisi!" });
    }

    try {
        // Check whether login is via username or email
        const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
        const [results] = await db.execute(sql, [username, username]);
        
        if (results.length === 0) {
            return res.status(401).json({ error: "Username atau email tidak ditemukan" });
        }

        const user = results[0];

        // Verify password with bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Password salah" });
        }

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
        await db.execute("UPDATE users SET refresh_token = ? WHERE id_user = ?", [refreshToken, user.id_user]);

        // Set cookies
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

        res.json({
            message: "Login berhasil",
            user: {
                id: user.id_user,
                username: user.username,
                email: user.email
            },
            token: accessToken,
            refreshToken: refreshToken
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        res.clearCookie("token");
        res.clearCookie("refreshToken");    
        return res.json({ message: "Logout berhasil" });
    }
    
    try {
        const sql = "UPDATE users SET refresh_token = '' WHERE refresh_token = ?";
        await db.execute(sql, [refreshToken]);
        
        res.clearCookie("token");
        res.clearCookie("refreshToken");
        
        return res.json({ message: "Logout berhasil" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ error: "Gagal logout" });
    }
};

exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token tidak ditemukan" });
    }
    
    try {
        const [results] = await db.execute("SELECT * FROM users WHERE refresh_token = ?", [refreshToken]);
        
        if (results.length === 0) {
            return res.status(403).json({ error: "Refresh token tidak valid" });
        }
        
        const user = results[0];
        
        jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: "Refresh token tidak valid" });
            }
            
            const newAccessToken = jwt.sign(
                { id: user.id_user, username: user.username }, 
                SECRET_KEY, 
                { expiresIn: "15m" }
            );
            
            res.cookie("token", newAccessToken, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 60 * 1000
            });
            
            res.json({
                message: "Token berhasil diperbarui",
                token: newAccessToken
            });
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
};

exports.getUserProfile = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [results] = await db.execute("SELECT id_user, username, email FROM users WHERE id_user = ?", [userId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: "User tidak ditemukan" });
        }
        
        res.json({
            user: results[0]
        });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
};

exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Password lama dan baru harus diisi" });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password baru harus minimal 6 karakter" });
    }
    
    try {
        const [results] = await db.execute("SELECT * FROM users WHERE id_user = ?", [userId]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: "User tidak ditemukan" });
        }
        
        const user = results[0];
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Password lama salah" });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await db.execute(
            "UPDATE users SET password = ? WHERE id_user = ?",
            [hashedPassword, userId]
        );
        
        res.json({ message: "Password berhasil diperbarui" });
    } catch (error) {
        console.error("Password handling error:", error);
        return res.status(500).json({ error: "Gagal memproses password" });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { username, email } = req.body;
    
    if (!username && !email) {
        return res.status(400).json({ error: "Tidak ada data yang diperbarui" });
    }
    
    // Check if email is valid when provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Format email tidak valid" });
        }
    }
    
    try {
        // Check if username or email already exists
        let query = "SELECT * FROM users WHERE";
        let params = [];
        
        if (username && email) {
            query += " (username = ? OR email = ?) AND id_user != ?";
            params = [username, email.toLowerCase(), userId];
        } else if (username) {
            query += " username = ? AND id_user != ?";
            params = [username, userId];
        } else {
            query += " email = ? AND id_user != ?";
            params = [email.toLowerCase(), userId];
        }
        
        const [results] = await db.execute(query, params);
        
        if (results.length > 0) {
            return res.status(400).json({ error: "Username atau email sudah digunakan" });
        }
        
        // Build update query
        let updateFields = [];
        let updateParams = [];
        
        if (username) {
            updateFields.push("username = ?");
            updateParams.push(username);
        }
        
        if (email) {
            updateFields.push("email = ?");
            updateParams.push(email.toLowerCase());
        }
        
        updateParams.push(userId);
        
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id_user = ?`;
        await db.execute(updateQuery, updateParams);
        
        res.json({ message: "Profil berhasil diperbarui" });
    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({ error: "Gagal memperbarui profil" });
    }
};

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: "Token tidak ditemukan, silakan login" });
    }
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Token tidak valid atau kadaluarsa" });
        }
        
        req.user = decoded;
        next();
    });
};