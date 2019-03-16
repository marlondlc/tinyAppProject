const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const uuidv4 = require("uuid/v4");
//const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(cookieSession({ name: "session", keys: ["Key1", "Key2"] }));

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
//app.use(cookieParser());

var urlDatabase = {
  b2xVn2: {
    //check if it should be strings "" when i save it
    //shortUrl: "b2xVn2",
    longUrl: "http://www.lighthouselabs.ca",
    userId: "user3RandomID"
  },
  u2kd8c: {
    //shortUrl: "u2kd8c",
    longUrl: "http://www.msn.com",
    userId: "user3RandomID"
  },
  "9sm5xK": {
    //shortUrl: "9sm5xK",
    longUrl: "http://www.google.com",
    userId: "userRandomID" //urldb[shorturl].userId
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
    password: "test"
  }
};

function generateRandomString() {
  return Math.random()
    .toString(36)
    .substring(2, 8);
}

const createUser = (email, password) => {
  const user_id = uuidv4();

  const newUser = {
    id: user_id,
    email: email,
    password: password
  };

  usersDb[user_id] = newUser;
  return user_id;
};

const getUserIdByEmail = email => {
  //email(parameter) is coming from req.body.email
  for (const userId in usersDb) {
    if (usersDb[userId].email === email) {
      return userId; //same as saying true
    }
  }
  return false;
};

function addNewUrl(shortUrl, longUrl, userId) {
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
  //console.log("this is the filtered : ", filteredUrls);
  return filteredUrls;
}

app.post("/login", (req, res) => {
  const email = req.body.email;
  const passwordForm = req.body.password;
  const emailPasswordEmpty = !email || !passwordForm;
  const userId = getUserIdByEmail(email);
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const compSync = bcrypt.compareSync(passwordForm, hashedPassword); // ask about this

  if (emailPasswordEmpty) {
    res.status(403).send("Please fill out the required feild");
  } else if (!userId) {
    res.status(403).send("Wrong User Info!");
  } else if (usersDb[userId].password === passwordForm) {
    req.session["user_id"] = userId;
    res.redirect("/urls");
  } else {
    res.status(400).send("wrong credentials!");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.clearCookie("user_id"); // is this needed?
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userId = req.session["user_id"];
  const longUrl = req.body.longURL;
  const shortUrl = generateRandomString();
  //urlDatabase[shortUrl] = { longUrl: longUrl, userId: userId }; // function below is doing the same
  addNewUrl(shortUrl, longUrl, userId);
  res.redirect("/urls");
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
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const userId = createUser(email, hashedPassword);
    req.session["user_id"] = userId; // this needs to be changed to req.session.user_id = userId
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  let templateVars = { urls: urlsForUser(userId), loggedUser: usersDb[userId] };
  //   if (!userId) {
  //     res.redirect("/login");
  //   } else {
  res.render("urls_index", templateVars);
  //}
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
  res.render("urls_show", templateVars); //loggedUser: req.session.user_id put within template var
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

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
  if (req.session["user_id"] === urlDatabase[shortUrl].userId) {
    urlDatabase[shortUrl].longUrl = longUrl;
  }
});

// app.post("/urls/:shortUrl", (req, res) => {
//   const shortUrl = req.params.shortUrl;
//   const longUrl = req.body.longURL;

//   res.redirect("/urls");
// });

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/*
NOTES:


//functions to create:

//creates a new user and adds it of userDB
//return the user id so we can set it in the cookies
const createUSer = ( name, email, password) => {

//generate a user ID:
const user_id = object.key('user').length + 1;

//create a new user object:
const newUSer = {
    id: userId,
    name: name;
    email: email,
    password: password
};

//addd the user object to userDB:
userDB[userId] = newUser;


}


1- app.get('/register', (req,res) => {

res.render('register' , { loggedUser: null });
})

//this will create a new user in the 
2- app.post('/register', (req,res) => {
const name = req.body.name;
const eamil = req.body.name;
const password = req.body.password;

//es6 version =
const {name,email,password} = req.body

// createUSer in the global scope (function above)
const userId = createUser(name,email,password);

//set the cookie with the user_id
res.cookie(user_id,userId) // this needs to be changed to req.session.user_id = userId

//once the above is done, redirect me to: (hompage)
res.redirect('/quotes');
})

3- app.get ('login, (req,res) = {
var templeteVars = .....
res.render('login', templeteVar)

})

4- app.post('/login',(req,res) => {

//extract the login info from the form

//authenticate the user
//create a function authenticate that will return false or the user id
//check if a user with that email and password exist in th userDB
//if userId is truthy, set the cookie and redirect
//if userId is falsy, send error messaage
})



1 - created a register route
GET: display the register form
POST:
    -extract the user info from the form with req.body
    -create a user in the DB with those info
    -set the user Id in the cookies
    redirect to another page

2 - pass the username in templeteVars
    -For each EJS that uses the variable called username"loggedUser for me"
    -the username must be passed in the TempleteVar of all the endpoints.

*/
