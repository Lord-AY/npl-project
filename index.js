require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
var cors = require('cors')
const creds = require('./logx-304612-f22a0fa2c0b3.json');
const Logs = require('./models/logs')
const Tests = require('./models/test-results')
const natural = require('natural')
const { GoogleSpreadsheet } = require('google-spreadsheet');


mongoose
  .connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
      console.log("Mongo Connection Open");
      app.use(cors("*"))
      app.use(express.json()) 
      let trainingSet = 132
      app.use(express.urlencoded({ extended: false }))
      const classifier = new natural.BayesClassifier()
      let trainingData = await Logs.find({}).limit(trainingSet)
      for (let data of trainingData) {
        classifier.addDocument(data.logMessage, data.logLevel)
      }
      classifier.train();
    //   let testData = await Logs.find({}).skip(trainingSet);
    //   let accurate = 2000-trainingSet, testSet = 2000-trainingSet;
    //   for (let data of testData) {
    //     let levelGuess = classifier.classify(data.logMessage)
    //       if (data.logLevel !== levelGuess) {
    //           accurate--
    //       }
    //     // console.log('\n', classifier.getClassifications(data.logMessage))
    //   }
    //   console.log((accurate/testSet)*100, trainingSet)
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
          let query = req.query.q
          let pres = presentationFormat.classify(query)
          let level = classifier.classify(query)
          console.log(pres)
          if (pres === 'count') {
              let count = await Logs.countDocuments({ logLevel: level })
              return res.json({message: `There are ${count} ${level} messages`})
          } else {
              let count = await Logs.countDocuments({ logLevel: level })
              let countApache = await Logs.countDocuments({ logLevel: level, logType: 'Apache' })
            return res.json({message: `There are ${count} ${level} messages with ${countApache} belonging to Apache`})
          }
          
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


    app.listen(process.env.PORT, () => {
        console.log("App is listening at port "+process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("Mongo Connection Error", err);
  });