var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

app.post("/urls", (req, res) => {
    const longUrl = req.body.longURL;
    const shortUrl = generateRandomString();
    urlDatabase[shortUrl] = longUrl

    res.redirect(`/urls/${shortUrl}`);
});

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = { urls: urlDatabase };
    res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL]
    };

    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    const shortUrl = req.params.shortURL
    const longURL = urlDatabase[shortUrl]

    res.redirect(longURL);
});


app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

function generateRandomString() {
    return Math.random().toString(36).substring(2, 8);
};

/*
    function addNewUrl(shortUrl,longUrl) {
   urlDatabase[shortUrl] }

*/
