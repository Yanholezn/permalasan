const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const PORT = 4000;

const loginRouter = require("./router/login");
const homeRouter = require("./router/home");
const projectRouter = require("./router/project");
const archiveRouter = require("./router/archive");
const registerRouter = require("./router/register");


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")))

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", loginRouter);
app.use("/", homeRouter);
app.use("/", projectRouter);
app.use("/", archiveRouter);
app.use("/", registerRouter);

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});