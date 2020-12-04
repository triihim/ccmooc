const express = require("express");
const cookieParser = require("cookie-parser");
const {authenticate, authenticator, requireAuthentication, logout} = require("./auth");
const path = require("path");
const auth = require("./auth");
const app = express();

const port = 3000;

app.use(cookieParser());
app.use(authenticator);
app.use(express.static(path.join(__dirname, "static")));
app.use(express.urlencoded({extended: true}));

app.get("/login", (req, res) => {
    console.log("GET /login")
    if(req.isLoggedIn) return res.redirect("/");
    return res.sendFile(path.join(__dirname, "/pages/login.html"));
});


app.post("/login", async (req, res) => {
    console.log("POST /login")
    try {
        ({username, password} = req.body);
        const sessionId = await authenticate(username, password);
        res.cookie("sessionId", sessionId, { httpOnly: true });
        return res.redirect("/")
    } catch (error) {
        return res.sendStatus(500);
    }
});

app.get("/logout", (req, res) => {
    console.log("GET /logout")
    try {
        logout(req.session);
        return res.redirect("/");
    } catch(error) {
        return res.sendStatus(500);
    }
});
  
app.get("/", requireAuthentication, (req, res) => {
    console.log("GET /")
    return res.sendFile(path.join(__dirname, "/pages/posts.html"));
});

app.listen(port, () => { console.log(`App running at http://localhost:${port}` )});