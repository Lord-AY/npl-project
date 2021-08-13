require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
var cors = require('cors')
const {unlinkSync, readFileSync } = require("fs")
const creds = require('./logx-304612-f22a0fa2c0b3.json');
const Logs = require('./models/logs')
const User = require('./models/user')
const Tests = require('./models/test-results')
const {uploadFiles} = require('./uploader')
const natural = require('natural')
const fileUpload = require('express-fileupload')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const crypto = require('crypto')

mongoose
  .connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
      console.log("Mongo Connection Open");
      app.use(cors("*"))
      app.use(fileUpload())
      app.use(express.json()) 
      let trainingSet = 132
      app.use(express.urlencoded({ extended: false }))
      const classifier = new natural.BayesClassifier()
      let trainingData = await Logs.find({}).limit(trainingSet)
      for (let data of trainingData) {
        classifier.addDocument(data.logMessage, data.logLevel)
      }
      classifier.train();
    let presTrainingData =[{
        message: "How Many", level: "count"
    },
    {
        message: "HOW MANY", level: "count"
      },
      {
        message: "HOW Many", level: "count"
        },
        {
            message: "DESCRIPTION", level: "detail"
        },{
            message: "DETAIL", level: "detail"
          },
    {
      message: "how many", level: "count"
        },
        {
          message: "How many", level: "count"
        },
        {
          message: "how Many", level: "count"
        },
        
        {
          message: "How MANY", level: "count"
      },{
          message: "How Many", level: "count"
      },{
          message: "Describe", level: "detail"
      },{
          message: "DESCRIBE", level: "detail"
      },{
          message: "describe", level: "detail"
      },{
          message: "Description", level: "detail"
        },
        {
          message: "description", level: "detail"
        },
         {
          message: "description", level: "detail"
      },{
          message: "Detail", level: "detail"
      },
        {
          message: "deatils", level: "detail"
        }]
      
      const presentationFormat = new natural.BayesClassifier();
      for (let data of presTrainingData) {
        presentationFormat.addDocument(data.message, data.level)
    }
    presentationFormat.addDocument('How many', 'count');
    presentationFormat.addDocument('number', 'count');
    presentationFormat.addDocument('describe', 'detail');
    presentationFormat.addDocument('description', 'detail');
    presentationFormat.addDocument('detail', 'detail');
      

    presentationFormat.train();
      app.get("/", async (req, res) => {
          const query = req.query.q
          const pres = presentationFormat.classify(query)
          const level = classifier.classify(query)
          // console.log(pres)
          if (pres === 'count') {
              let count = await Logs.countDocuments({ logLevel: level })
              console.log(level);
              console.log(await Logs.find({logLevel:level}))
              return res.json({message: `There are ${count} ${level} messages`})
          } else {
              let count = await Logs.countDocuments({ logLevel: level })
              let countApache = await Logs.countDocuments({ logLevel: level, logType: 'Apache' })
            return res.json({message: `There are ${count} ${level} messages with ${countApache} belonging to Apache`})
          }
          
      })

      app.get("/stats", async (req, res) => {
          let [errorCount, infoCount] = await Promise.all([
            await Logs.countDocuments({ logLevel: 'error' }),
            await Logs.countDocuments({ logLevel: 'notice' })
          ])
          
          return res.json({
              stats: {
                  errorCount,
                  infoCount
              }
          })
        
    })

    app.get("/save-to-sheets", async (req, res) => {
        try {
            let docID = "1LRqiw6r4v88Tmukm6ijDuVZrHsiek3CKx-oM9ybfHV0";
            const doc = new GoogleSpreadsheet(docID);
            await doc.useServiceAccountAuth({ client_email: creds.client_email, private_key: creds.private_key });
            await doc.loadInfo()
            let sheet = await doc.addSheet({ title: "Bayes Processing", headerValues: ["trainingSet", "testSet", "passed", "failed", "accuracy", "trainingTime", "testTime"] });
            let results = await Tests.findOne({ layer: "processing", classifier: "bayes" })
            await sheet.addRows(results.tests);

            sheet = await doc.addSheet({title: "Logistics Regression Processing", headerValues: ["trainingSet", "testSet", "passed", "failed", "accuracy", "trainingTime", "testTime"]})
            results = await Tests.findOne({layer: "processing", classifier: "logistics-regression"})
            await sheet.addRows(results.tests);

            res.send({done: true}) 
        } catch (error) {
            console.log(error)
            res.status(400).json({message: error.message})
        }
    })

      app.post("/login", async (req, res) => {
          let { password, username } = req.body
          if (!username || !password) {
              return res.status(401).json({
                  message: "username and password are required"
              })
          }
          let hashedPassword = await crypto.createHash('sha256').update(password, 'utf8').digest('hex')
          let account = await User.findOne({
              username, password: hashedPassword
          })
          if (!account) {
            return res.status(401).json({
                message: "username and password dont match any accounts"
            })
          }

          return res.status(200).json({
              message: "logged in successfully",
              token: crypto.createHash('sha256').update(account._id.toString(), 'utf8').digest('hex'),
              account
          })

      })

      app.post("/reset-password", async (req, res) => {
        let { password, username } = req.body
        if (!username || !password) {
            return res.status(401).json({
                message: "username and password are required"
            })
        }
        let hashedPassword = await crypto.createHash('sha256').update(password, 'utf8').digest('hex')
        let account = await User.findOne({
            username
        })
        if (!account) {
          return res.status(401).json({
              message: "Provided username dont match any accounts"
          })
        }
          account.password = hashedPassword
          await account.save()

        return res.status(200).json({
            message: "Password Updated"
        })

      })
      
      app.post("/update-username", async (req, res) => {
        let { name, username, id } = req.body
        if (!username || !name) {
            return res.status(200).json({
                message: "update complete"
            })
        }
        let account = await User.findOne({
            _id: id
        })
        if (!account) {
          return res.status(401).json({
              message: "Provided user id dont match any accounts"
          })
        }
          account.name = name
          account.username = username
          await account.save()

        return res.status(200).json({
            message: "Account Updated",
            account
        })

    })

      app.post("/upload-log-file", uploadFiles, async (req, res) => {
          let {files} = req.body
        console.info("<<<<<<<<<< Parsing Apache Log files >>>>>>>>>>>>>")
          for (let doc of files) {
            var array = readFileSync(doc).toString().split("\n");
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
              unlinkSync(doc)
        }
          console.info("<<<<<<<<<< Done Parsing Apache Log files >>>>>>>>>>>>>")
          return res.status(200).json({
            message: "Upload complete"
        })
      })
    app.listen(process.env.PORT, () => {
        console.log("App is listening at port "+process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("Mongo Connection Error", err);
  });