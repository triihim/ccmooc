const db = require("./in-memory-db");
// TODO: Remove logs
const authenticate = async (username, password) => {
    console.log("Authenticating", username, password);
    const user = await db.getUserByUsername(username);
    if(user.password.normalize() === password.normalize()) {
        // Flaw: passwords are stored in plaintext.
        const session = await db.createSession(user.rowid);
        console.log("Authentication successful. Created session", session);
        return session.rowid; // Flaw: sequential and predictable session id.
    } else {
        console.log("Invalid password")
        throw new Error("Invalid password");
    }
}

const logout = async (session) => {
    return await db.deleteSessionById(session.rowid);
}

const authenticator = async (req, res, next) => {
    req.session = null;
    req.isLoggedIn = false;
    if(!!req.cookies.sessionId) {
        try {
            const session = await db.getSessionById(+req.cookies.sessionId);
            if(!session) throw new Error("No such session");
            console.log("Authenticator found session", session)
            req.session = session;
            req.isLoggedIn = true;
            next();
        } catch(error) {
            console.log("Authenticator could not find session");
            res.cookie("sessionId", null, { maxAge: 0 });
            next();
        }
    } else {
        console.log("Authenticator has nothing to authenticate");
        next();
    }
};

const requireAuthentication = (req, res, next) => {
    if(req.isLoggedIn) {
        console.log("Session is logged in", req.session);
        next();
    } else {
        console.log("Not logged in. Redirecting");
        return res.redirect("/login");
    }
}

module.exports = {
    authenticate: authenticate,
    authenticator: authenticator,
    requireAuthentication: requireAuthentication,
    logout: logout
}