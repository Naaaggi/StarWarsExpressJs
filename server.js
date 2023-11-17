const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

const db = new sqlite3.Database("./users.db");

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS users");
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)"
  );
  db.run('INSERT INTO users (username, password) VALUES ("admin", "admin")');
});

const generateAccessToken = (username) => {
  return jwt.sign(username, "q0GcJXPtkf10D0xqPl3DeQrallnKdcGOB1jqCT0Gqso=", {
    expiresIn: "500s",
  });
};

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
    if (existingUser) {
      // User already exists, return a User alreay exists error
      return res.status(409).send("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, password) VALUES ("${username}", "${hashedPassword}")`
    );
    res.status(200).send("User created.");
  } catch {
    res.status(500).send("Error registering new user please try again.");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = "${username}"`,
    async (err, row) => {
      if (row) {
        const user = {
          username: row.username,
          password: row.password,
        };

        try {
          if (await bcrypt.compare(password, user.password)) {
            const accessToken = generateAccessToken(user);
            res.status(200).json({ accessToken });
          } else {
            res.status(403).send("Wrong password");
          }
        } catch {
          res.status(500).send("Error logging in");
        }
      } else {
        res.status(404).send("User not found");
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
