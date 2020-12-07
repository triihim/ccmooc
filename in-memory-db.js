const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(":memory:");

// Initial setup of in-memory database.
db.serialize(() => {
    db.run("CREATE TABLE User (username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, isAdmin INTEGER NOT NULL)");
    db.run("CREATE TABLE Post (title TEXT NOT NULL, body TEXT NOT NULL, authorId ID NOT NULL, FOREIGN KEY (authorId) REFERENCES User(ROWID))");
    db.run("CREATE TABLE Session (userId INTEGER NOT NULL, FOREIGN KEY (userId) REFERENCES User(ROWID))");
    db.run("INSERT INTO User VALUES ('admin', '1234', 1)"); // Flaw: Storing plaintext password.
    db.run("INSERT INTO Post VALUES ('My first blog post', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 1)")
});

module.exports = {

    // Flaws: SQL Injection risk. All queries should be replaced with parameterized versions.

    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT ROWID, * FROM User WHERE username = '${username}'`, (err, res) => err ? reject(err) : resolve(res[0]));
        });
    },

    createUser: (username, password) => {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO User VALUES ('${username}', '${password}', 0)`, (err, res) => err ? reject(err) : resolve(res));
        });
    },  

    createSession: (userId) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(`INSERT INTO Session VALUES (${userId})`, (err) => err ? reject(err) : null);
                db.get(`SELECT ROWID, * FROM Session WHERE userId = ${userId}`, (err, row) => err ? reject(err) : resolve(row));
            })
        });
    },

    deleteSessionById: (sessionId) => {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM Session WHERE ROWID = ${+sessionId}`, (err) => err ? reject(err) : resolve());
        });
    },

    getSessionById: (sessionId) => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT ROWID, * FROM Session WHERE ROWID = ${+sessionId}`, (err, row) => err ? reject(err) : resolve(row));
        });
    },

    getPosts: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT p.ROWID, u.username, p.title, p.body FROM Post p JOIN User u ON p.authorId = u.ROWID", (err, rows) => err ? reject(err) : resolve(rows));
        });
    },

    getPost: id => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT p.title, p.body, u.username as author FROM Post p JOIN User u on p.authorId = u.ROWID WHERE p.ROWID = ${id}`, (err, row) => err ? reject(err) : resolve(row));
        });
    },

    deletePost: id => {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM Post WHERE ROWID = ${id}`, (err, row) => err ? reject(err) : resolve());
        });
    },

    createPost: (title, body, authorId) => {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO Post VALUES ('${title}', '${body}', ${authorId})`, (err) => err ? reject(err) : resolve());
        });
    }

}