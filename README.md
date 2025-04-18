# Todo List Application

Aplikasi todo list dengan fitur login, register, dan manajemen task.

## Cara Setup

1. Pastikan MySQL sudah terinstall dan berjalan
2. Buat database dengan menjalankan file `database.sql`:
   ```
   mysql -u root -p < database.sql
   ```
   atau buka MySQL dan import file SQL nya secara manual.

3. Install dependency dengan menjalankan:
   ```
   npm install
   ```

4. Setup file .env:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password_anda
   DB_NAME=todo_list
   ```

5. Jalankan aplikasi:
   ```
   npm start
   ```
   atau
   ```
   nodemon index.js
   ```

6. Buka browser dan akses `http://localhost:4000`

## Fitur

- Login dan Register
- Manajemen Proyek
- Manajemen Task
- Archive Task

## Struktur Database

### User Table

| Field         | Type         | Description            |
|---------------|--------------|------------------------|
| id_user       | int(5)       | Primary Key, Auto Increment |
| username      | varchar(200) | Unique                 |
| password      | varchar(200) | Encrypted with bcrypt  |
| email         | varchar(45)  | Unique                 |
| refresh_token | text         | JWT Refresh Token      | 