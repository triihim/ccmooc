const db = require("./in-memory-db");

// TODO: Remove logs

const authenticate = async (username, password) => {
    const user = await db.getUserByUsername(username);
    if(user.password.normalize() === password.normalize()) {
        // Flaw: passwords are stored in plaintext.
        const session = await db.createSession(user.rowid);
        return session.rowid; // Flaw: sequential and predictable session id.
    } else {
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
            req.session = session;
            req.isLoggedIn = true;
            next();
        } catch(error) {
            res.cookie("sessionId", null, { maxAge: 0 });
            next();
        }
    } else {
        next();
    }
};

const requireAuthentication = (req, res, next) => {
    if(req.isLoggedIn) {
        next();
    } else {
        return res.redirect("/login");
    }
};

const register = async (username, password) => {
    return await db.createUser(username, password);
}

module.exports = {
    authenticate: authenticate,
    authenticator: authenticator,
    requireAuthentication: requireAuthentication,
    register: register,
    logout: logout
}