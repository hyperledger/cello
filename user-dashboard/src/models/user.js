const mongoose = require('mongoose');
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
logger.setLevel(logLevel);

const userSchema = new mongoose.Schema({
  name: String,
  userId: String,
  exampleCodes: []
})

userSchema.statics.findOneOrCreate = function findOneOrCreate(condition, callback) {
    const self = this
    self.findOne(condition, (err, result) => {
        return result ? callback(err, result) : self.create(condition, (err, result) => { return callback(err, result) })
    })
}

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
