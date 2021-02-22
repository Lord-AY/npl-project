require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const Logs = require('../models/logs')
const Test = require('../models/test-results')
const natural = require('natural')
const creds = require('../logx-304612-f22a0fa2c0b3.json');
const { GoogleSpreadsheet } = require('google-spreadsheet');



const addToSheet = async function(rows, title) {
    let docID = "1LRqiw6r4v88Tmukm6ijDuVZrHsiek3CKx-oM9ybfHV0";
            const doc = new GoogleSpreadsheet(docID);
            await doc.useServiceAccountAuth({ client_email: creds.client_email, private_key: creds.private_key });
            await doc.loadInfo()
    let sheet = doc.sheetsByTitle[title];
    await sheet.delete()
    sheet = await doc.addSheet({ title, headerValues: ["trainingSet", "testSet", "passed", "failed", "accuracy"] })
    
            await sheet.addRows(rows);
}

mongoose
  .connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
      console.log("Mongo Connection Open");
    //   await Test.deleteMany({})
      let totalData = 2000;
      let classifier = new natural.BayesClassifier()
      let rows = [], data = null
    //   for (let index = 2; index < totalData; index += 2) {
    //       let trainingData = await Logs.find({}).limit(index)
    //       for (let data of trainingData) {
    //         classifier.addDocument(data.logMessage, data.logLevel)
    //       }
    //       let trainStart = process.hrtime()
    //       classifier.train();
    //       let trainStop = process.hrtime(trainStart)
    //     let testData = await Logs.find({}).skip(index);
    //       let accurate = testData.length, testSet = 2000 - index;
    //       let testStart = process.hrtime()
    //     for (let data of testData) {
    //         let levelGuess = classifier.classify(data.logMessage)
    //         if (data.logLevel !== levelGuess) {
    //             accurate--
    //         }
    //     }
    //     let testStop = process.hrtime(testStart)
    //       rows.push({
    //         trainingSet: index,
    //         testSet,
    //         passed: accurate,
    //         failed: testSet-accurate,
    //           accuracy: (accurate / testSet) * 100,
    //           trainingTime: trainStop[1] / 1000000,
    //           testTime: testStop[1]/1000000
    //       })
    //   }
    //   await Test.create({
    //       tests: rows,
    //       classifier: "bayes",
    //       layer: 'processing'
    //   })
    //   rows = []
    //   console.info("done with bayes processing")

      classifier = new natural.LogisticRegressionClassifier()
      totalData = 300
      for (let index = 5; index < totalData; index += 10) {
          console.log(index)
        let trainingData = await Logs.find({}).limit(index)
        for (let data of trainingData) {
            classifier.addDocument(data.logMessage, data.logLevel)
        }
          let trainStart = process.hrtime()
        classifier.train();
          let trainStop = process.hrtime(trainStart)
        let testData = await Logs.find({}).skip(index);
        let accurate = testData.length, testSet = 2000-index;
          let testStart = process.hrtime()
        for (let data of testData) {
            let levelGuess = classifier.classify(data.logMessage)
            if (data.logLevel !== levelGuess) {
                accurate--
            }
        }
        let testStop = process.hrtime(testStart)
          
        rows.push({
            trainingSet: index,
            testSet,
            passed: accurate,
            failed: testSet-accurate,
            accuracy: (accurate / testSet) * 100,
            trainingTime: trainStop[1] / 1000000,
              testTime: testStop[1]/1000000
          } )
      }
      await Test.create({
        tests: rows,
        classifier: "logistics-regression",
        layer: 'processing'
    })
      rows = []
      console.info("done with logistics processing")

      let presTrainingData = [{
          message: "How Many", level: "count"
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
          }];
      
      let presentationClassifier = new natural.LogisticRegressionClassifier()
      for (let data of presTrainingData) {
        presentationClassifier.addDocument(data.message, data.level)
    }
      let trainStart = process.hrtime()
    presentationClassifier.train();
      let trainStop = process.hrtime(trainStart)
    let testData = [{
        message: "HOW MANY", level: "count"
      },
      {
        message: "HOW Many", level: "count"
        },
        {
            message: "DESCRIPTION", level: "detail"
        },{
            message: "DETAIL", level: "detail"
          }]
    let accurate = testData.length, testSet = testData.length;
      let testStart = process.hrtime()
    for (let data of testData) {
        let levelGuess = presentationClassifier.classify(data.message)
        if (data.level !== levelGuess) {
            accurate--
        }
    }
    let testStop = process.hrtime(testStart)
    rows.push({
        trainingSet: presTrainingData.length,
        testSet,
        passed: accurate,
        failed: testSet-accurate,
        accuracy: (accurate / testSet) * 100,
        trainingTime: trainStop[1] / 1000000,
          testTime: testStop[1]/1000000
      })
      await Test.create({
        tests: rows,
        classifier: "logistics-regression",
        layer: 'presentation'
    })
    rows = []
      console.info("done with logistics presentation")


      presentationClassifier = new natural.BayesClassifier()
      for (let data of presTrainingData) {
            presentationClassifier.addDocument(data.message, data.level)
        }
           trainStart = process.hrtime()
        presentationClassifier.train();
           trainStop = process.hrtime(trainStart)
           testData = [{
            message: "HOW MANY", level: "count"
          },
          {
            message: "HOW Many", level: "count"
            },
            {
                message: "DESCRIPTION", level: "detail"
            },{
                message: "DETAIL", level: "detail"
              }]
         accurate = testData.length, testSet = testData.length;
           testStart = process.hrtime()
        for (let data of testData) {
            let levelGuess = presentationClassifier.classify(data.message)
            if (data.level !== levelGuess) {
                accurate--
            }
        }
         testStop = process.hrtime(testStart)
         rows.push({
                trainingSet: presTrainingData.length,
                testSet,
                passed: accurate,
                failed: testSet-accurate,
             accuracy: (accurate / testSet) * 100,
             trainingTime: trainStop[1] / 1000000,
             testTime: testStop[1]/1000000
              })

      await Test.create({
        tests: rows,
        classifier: "bayes",
        layer: 'presentation'
    })
    rows = []
      console.info("done with bayes presentation")
  })
  .catch((err) => {
    console.log("Mongo Connection Error", err);
  });