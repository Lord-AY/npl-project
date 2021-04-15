const {existsSync, mkdirSync } = require("fs")
exports.uploadFiles = async function (req, res, next) {
    try {
        const files = [];
        const reqFiles = req.files.file;
        let path = './log-files'
        if (!existsSync(path)) {
            mkdirSync(path)
        }
        if (Array.isArray(reqFiles)) {
            for (let file of reqFiles) {
                await file.mv(path + '/' + file.name)
                files.push(path + '/' + file.name)
            }
        } else {
            await reqFiles.mv(path + '/' + reqFiles.name)
            files.push(path + '/' + reqFiles.name)
        }
        req.body.files = files;
        next()
    } catch (error) {
        res.status(400).send({
          message: error.message
      })
    }
}