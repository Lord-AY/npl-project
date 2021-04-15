const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    username: {
        type: String
    },
    password: {
        type: String
    }
});

const Users = mongoose.model("Users", userSchema);
module.exports = Users;
