require('dotenv').config();
const mysql = require('mysql2');

// Menggunakan connection pool untuk koneksi yang lebih stabil
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  debug: false
});

// Menggunakan promise-wrapper untuk async/await
const promisePool = pool.promise();

// Test koneksi
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
  // Lepas koneksi
  connection.release();
});

module.exports = promisePool;