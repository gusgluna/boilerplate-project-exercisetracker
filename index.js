const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// <DB Connection>
const dbURI = process.env["MONGO_URI"];
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));
//</DB Connection>

//<Import models>
const User = require("./models/user");
//</Import models>

app.post("/api/users", (req, res) => {
  const userName = req.body.username;
  // console.log(userName);
  const newUsername = new User({
    username: userName,
  });

  newUsername.save((error, data) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json({ username: data.username, _id: data._id });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
