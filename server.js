"use strict";

var express = require("express");
var mongoose = require("mongoose");

var cors = require("cors");

var app = express();

var port = process.env.PORT || 4000;

app.use(cors());
require("dotenv").config();

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/hello", function (req, res) {
  res.json({
    greeting: "hello API",
  });
});

const uri = `mongodb+srv://wan:${process.env.PW}@belajarmongodb.xf7lx.mongodb.net/UrlShort?retryWrites=true&w=majority`;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let urlSchema = new mongoose.Schema({
  original: {
    type: String,
    required: true,
  },
  short: String,
});

let Url = mongoose.model("Url", urlSchema);

let bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.post("/api/shorturl", (request, response) => {
  // console.log(request.body);
  let inputUrl = request.body.url;

  let urlRegex = new RegExp(
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
  );

  if (!inputUrl.match(urlRegex)) {
    response.json(
      {
        status: "failed",
        message: "invalid url",
      },
      400
    );
    return false;
  }

  // generate random string for short url
  function generateRandomString(inputNumber) {
    let randomString = "";
    let possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < inputNumber; i++) {
      randomString += possible.charAt(
        Math.floor(Math.random() * possible.length)
      );
    }
    return randomString;
  }

  // insert to database
  let newUrl = new Url({
    original: inputUrl,
    short: generateRandomString(4),
  });

  newUrl.save((err, data) => {
    if (err) {
      response.status(500).json({
        status: "failed",
        message: "failed to insert to database",
      });
    } else {
      response.json({
        status: "success",
        data: data,
      });
    }
  });
});

app.get("/:input", (request, response) => {
  let input = request.params.input;

  Url.findOne({ short: input })
    .then((data) => {
      console.log(data);
      if (data) {
        response.redirect(data.original);
      } else {
        response.sendFile(process.cwd() + "/views/notfound.html");
      }
    })
    .catch((err) => {
      console.log(err);
      response.sendFile(process.cwd() + "/views/notfound.html");
    });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
