const db = require("./in-memory-db");

module.exports = {
    getPosts: () => {
        return db.getPosts();
    },

    createPost: (title, body, authorId) => {
        return db.createPost(title, body, authorId);
    },

    getPost: id => {
        return db.getPost(id);
    },

    deletePost: id => {
        return db.deletePost(id);
    }
}