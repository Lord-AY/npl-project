require('dotenv').config()
const mongoose = require('mongoose')
var fs = require('fs');
const Logs = require('./models/logs')


mongoose
    .connect(process.env.MONGO_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(async () => {
        console.log("Mongo Connection Open");
        console.info("<<<<<<<<<< Parsing Apache Log files >>>>>>>>>>>>>")
        var array = fs.readFileSync('logs/Apache_2k.log').toString().split("\n");
        await Logs.deleteMany({ logType: 'Apache' })
        let docs = [];
        for (i in array) {
            let details = array[i].match(/([^[]+(?=]))/g)
            let message = array[i].replace(/\[(.*?)\]/g, '')
            let doc = {
                logMessage: message.trim(), logLevel: details[1], logDate: new Date(details[0]), logType: 'Apache'
            }
            docs.push(doc)
        }
        await Logs.insertMany(docs)
        console.info("<<<<<<<<<< Done Parsing Apache Log files >>>>>>>>>>>>>")
        process.exit(0)
    }).catch((err) => {
        console.log("Mongo Connection Error");
      });