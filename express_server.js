const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(cookieSession({ name: "session", keys: ["Key1", "Key2"] }));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    userId: "user3RandomID"
  },
  "u2kd8c": {
    longUrl: "http://www.msn.com",
    userId: "user3RandomID"
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    userId: "userRandomID"
  }
};

const usersDb = {

  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "test@test.com",
    password: bcrypt.hashSync("test", 10)
  }

};

function generateRandomString() {
  return Math.random()
    .toString(36)
    .substring(2, 8);
}

const createUser = (email, password) => {
  const user_id = generateRandomString();

  const newUser = {
    id: user_id,
    email: email,
    password: password
  };

  usersDb[user_id] = newUser;
  return user_id;
};

const getUserIdByEmail = email => {
  for (const userId in usersDb) {
    if (usersDb[userId].email === email) {
      return userId;
    }
  }
  return false;
};

function createNewUrlObjInDB(shortUrl, longUrl, userId) {
  urlDatabase[shortUrl] = {
    longUrl: longUrl,
    userId: userId
  };
}
function urlsForUser(userId) {
  var filteredUrls = {};

  for (var urlKey in urlDatabase) {
    if (userId === urlDatabase[urlKey].userId) {
      filteredUrls[urlKey] = urlDatabase[urlKey];
    }
  }
  return filteredUrls;
}

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const emailPasswordEmpty = !email || !password;
  const userId = getUserIdByEmail(email);

  if (emailPasswordEmpty) {
    res.status(403).send("Please fill out the required feild");
  } else if (!userId) {
    res.status(403).send("Wrong User Info!");
  } else {
    const hashedPassword = usersDb[userId]["password"]
    const compSync = bcrypt.compareSync(password, hashedPassword);
    if (compSync) {
      req.session["user_id"] = userId;
      res.redirect("/urls");
    } else {
      res.status(400).send("wrong credentials!");
    }
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const emailPasswordEmpty = !password || !email;

  if (emailPasswordEmpty) {
    res.status(400).send("please fill out the required field");
  } else if (getUserIdByEmail(email)) {
    res.status(400).send("Account already exist. Please Login!");
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = createUser(email, hashedPassword);
    req.session["user_id"] = userId;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const longUrl = req.body.longURL;
  const shortUrl = generateRandomString();

  createNewUrlObjInDB(shortUrl, longUrl, userId);
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  let templateVars = { urls: urlsForUser(userId), loggedUser: usersDb[userId] };
  if (!userId) {
    res.redirect("/login");
  } else {
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  let templateVars = { loggedUser: usersDb[req.session.user_id] };
  if (!userId) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/login", (req, res) => {
  let templateVars = { loggedUser: usersDb[req.session.user_id] };
  res.render("url_login", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { loggedUser: usersDb[req.session.user_id] };
  res.render("register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    longUrl: urlDatabase[req.params.shortURL],
    shortUrl: req.params.shortUrl,
    user: usersDb[req.session.user_id],
    loggedUser: usersDb[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortUrl = req.params.shortURL;
  res.redirect(urlDatabase[shortUrl].longUrl);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(usersDb);
});

app.post("/urls/:shortUrl", (req, res) => {
  urlDatabase[req.params.shortUrl] = req.body.longURL;
  res.redirect("/urls");

  if (req.session["user_id"] === urlDatabase[shortUrl].userId) {
    urlDatabase[shortUrl].longUrl = longUrl;
  }
});


app.post("/urls/:shortUrl/update", (req, res) => {
  const shortUrl = req.params.shortUrl;
  const longUrl = req.body.longURL;

  if (req.session["user_id"] === urlDatabase[shortUrl].userId) {
    urlDatabase[shortUrl].longUrl = longUrl;
  }
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});