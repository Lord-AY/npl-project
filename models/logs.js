const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    logLevel: {
        type: String
    },
    logType: {
        type: String
    },
    logMessage: {
        type: String
    },
    logDate: {
        type: Date
    }
});

const Logs = mongoose.model("Logs", logSchema);
module.exports = Logs;
