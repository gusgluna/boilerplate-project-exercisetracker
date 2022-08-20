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
const Exercise = require("./models/exercise");
//</Import models>

//Routes
//<route: /api/users>
app.post("/api/users", (req, res) => {
  const userName = req.body.username;
  const newUsername = new User({
    username: userName,
  });

  newUsername.save((error, data) => {
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ username: data.username, _id: data._id });
  });
});

app.get("/api/users", (req, res) => {
  User.find({}).exec((error, results) => {
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).send(results);
  });
});
//<>

//<route: /api/users/:_id/exercises>
app.post(
  "/api/users/:_id/exercises",
  (req, res, next) => {
    const userId = req.params._id;
    User.findOne({ _id: userId }).exec((error, result) => {
      res.locals.userName = result.username;
      next();
    });
  },
  (req, res) => {
    const exerciseDate =
      req.body.date == "" ? new Date() : new Date(req.body.date);

    const newExercise = new Exercise({
      _idUsername: req.params._id,
      username: res.locals.userName,
      description: req.body.description,
      duration: req.body.duration,
      date: exerciseDate,
    });

    newExercise.save((error, data) => {
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({
        _id: data._idUsername,
        username: data.username,
        date: data.date.toDateString(),
        duration: data.duration,
        description: data.description,
      });
    });
  }
);

//</>

//<route: /api/users/:_id/logs>
app.get("/api/users/:_id/logs", (req, res) => {
  if (req.params._id == "") return res.status(400).json({ error: "id" });
  Exercise.find({ _idUsername: req.params._id }).exec((error, results) => {
    const logs = results.map((result) => {
      return {
        description: result.description,
        duration: result.duration,
        date: result.date,
      };
    });
    const logsSorted = logs.sort(
      (objA, objB) => Number(objB.date) - Number(objA.date)
    );
    const logsSortedDateString = logsSorted.map((log) => {
      return {
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString(),
      };
    });
    return res.status(200).json({
      _id: req.params._id,
      username: results[0].username,
      count: results.length,
      log: logsSortedDateString,
    });
  });
});
//</>

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
