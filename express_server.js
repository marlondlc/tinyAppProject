const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const uuidv4 = require("uuid/v4");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

var urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.post("/login", (req, res) => {
  const email = req.body.email;
  const passwordForm = req.body.password;
  const emailPasswordEmpty = !email || !passwordForm;
  const userId = getUserIdByEmail(email);

  if (emailPasswordEmpty) {
    res.status(403).send("Please fill out the required feild");
  } else if (!userId) {
    res.status(403).send("wrong credentials!");
  } else if (usersDb[userId].password === passwordForm) {
    res.cookie("user_id", userId);
    res.redirect("/urls");
  } else {
    res.status(400).send("wrong credentials!");
  }
});

app.post("/logout", (req, res) => {
  //req.session = null;
  res.clearCookie("userid");
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const longUrl = req.body.longURL;
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = longUrl;

  res.redirect(`/urls/${shortUrl}`);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const emailPasswordEmpty = !password || !email;

  if (emailPasswordEmpty) {
    res.status(400).send("please fill out the required field");
  } else if (getUserIdByEmail(email)) {
    res.status(400).send("Email already exist. Please Login!");
  } else {
    const userId = createUser(email, password);
    res.cookie("user_id", userId); // this needs to be changed to req.session.user_id = userId
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.userid; //retriving userId from the cookies
  let templateVars = { urls: urlDatabase, loggedUser: usersDb[userId] }; // provide the whole user obj to "loggedUser"
  res.render("urls_index", templateVars);
  //might be here where you add what dom did at w2d3 (10:40am - video)
});

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, loggedUser: req.cookies.user_id };
  res.render("urls_new", templateVars);
});

app.get("/login", (req, res) => {
  //bring me to below page.
  let templateVars = { urls: urlDatabase, loggedUser: req.cookies.user };
  res.render("url_login", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, loggedUser: req.cookies.user };
  res.render("register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    loggedUser: req.cookies.user
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  const longURL = urlDatabase[shortUrl];

  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

function generateRandomString() {
  return Math.random()
    .toString(36)
    .substring(2, 8);
}

const createUser = (email, password) => {
  // this is being used in "app.post('register', (req,res).."
  // if you need to understand this refer to notes below

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
