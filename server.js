const express = require("express");
const cookieParser = require("cookie-parser");
const {authenticate, authenticator, requireAuthentication, logout, register} = require("./auth");
const {getPosts, getPost, deletePost, createPost} = require("./posts");
const fs = require("fs");
const path = require("path");
const app = express();

const port = 3000;

app.use(cookieParser());
app.use(authenticator);
app.use(express.static(path.join(__dirname, "static")));
app.use(express.urlencoded({extended: true}));

app.get("/login", (req, res) => {
    if(req.isLoggedIn) return res.redirect("/");
    return res.sendFile(path.join(__dirname, "/pages/login.html"));
});


app.post("/login", async (req, res) => {
    try {
        ({username, password} = req.body);
        const sessionId = await authenticate(username, password);
        res.cookie("sessionId", sessionId, { httpOnly: true });
        return res.redirect("/")
    } catch (error) {
        return res.status(500).send(error);
    }
});

app.get("/logout", (req, res) => {
    try {
        logout(req.session);
        return res.redirect("/");
    } catch(error) {
        return res.status(500).send(error);
    }
});

app.get("/register", (req, res) => {
    return res.sendFile(path.join(__dirname, "/pages/register.html"));
});

app.post("/register", async (req, res) => {
    try {
        // Flaw: short and simple passwords allowed.
        ({username, password} = req.body);
        if((username.length < 3) || 
           (username.indexOf(" ") > -1) ||
           (password.length < 3) ||
           (password.indexOf(" ") > -1)) {
            throw new Error("Invalid username or password");
        } else {
            await register(username, password);
            return res.redirect("/");
        }
    } catch(error) {
        return res.status(500).send(error);
    }
});

app.get("/posts", requireAuthentication, async (req, res) => {
    try {
        const posts = await getPosts();
        return res.json(posts);
    } catch(error) {
        return res.status(500).send(error);
    }
});

app.get("/posts/create", requireAuthentication, (req, res) => {
    return res.sendFile(path.join(__dirname, "/pages/createpost.html"));
});

app.post("/posts/create", requireAuthentication, async (req, res) => {
    ({title, body} = req.body);
    // Flaw: XSS possibility because the form fields are inserted without escaping potential script tags.
    // Flaw: CRSF possibility because there is no CSRF token validation.
    try {
        if(title.trim().length < 3 || body.trim().length < 3) {
            throw new Error("Invalid blog post");
        } else {
            await createPost(title.trim(), body.trim(), req.session.userId);
            return res.redirect("/");
        }
    } catch(error) {
        return res.status(500).send(error);
    }
});

app.get("/posts/:postId", requireAuthentication, async (req, res) => {
    const postId = req.params.postId;
    if(!postId) {
        return res.sendStatus(404);
    } else {
        try {
            const post = await getPost(postId);
            if(!!post) {
                fs.readFile("./pages/post.html", "utf8", (err, content) => {
                    if(err) {
                        return res.sendStatus(500);
                    } else {
                        return res.send(content
                            .replace(/{title}/g, post.title)
                            .replace(/{author}/g, post.author)
                            .replace(/{body}/g, post.body));
                    }
                });
            } else {
                throw new Error("Post not found");
            }
        } catch(error) {
            return res.status(500).send(error);
        }
    }
});

app.delete("/posts/:postId", requireAuthentication, async (req, res) => {
    // Flaw: the post deletion endpoint requires authentication properly, but does not enforce admin role as it should.
    try {
        if(!req.params.postId) {
            throw new Error("No post id specified");
        } else {
            await deletePost(req.params.postId)
            return res.redirect("/");
        }
    } catch(error) {
        return res.status(500).send(error);
    }

});

app.get("/", requireAuthentication, (req, res) => {
    return res.sendFile(path.join(__dirname, "/pages/posts.html"));
});

app.listen(port, () => { console.log(`App running at http://localhost:${port}` )});