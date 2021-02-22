const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    classifier: {
        type: String
    },
    layer: {
        type: String
    },
    tests: {
        type: [{
            trainingSet: Number,
            testSet: Number,
            passed: Number,
            failed: Number,
            accuracy: Number,
            trainingTime: Number,
            testTime: Number
        }]
    },
});

const Tests = mongoose.model("Tests", logSchema);
module.exports = Tests;
