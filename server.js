/*
    API backend bot
*/

const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/apiRoutes");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));
app.use("/", apiRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}/widget`);
});
