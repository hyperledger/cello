const mongoose = require('mongoose');
import rimraf from 'rimraf'
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
logger.setLevel(logLevel);

const chainCode = new mongoose.Schema({
  name: String,
  userId: String,
  chainCodeName: String,
  uploadTime: { type: Date, default: Date.now },
  chain: {type: mongoose.Schema.Types.ObjectId, ref: "chain"},
  status: {
    type: String,
    default: 'uploaded',
    enum: ['uploaded', 'installed', 'instantiated', 'error', 'instantiating']
  },
  path: String
})

chainCode.post('remove', function(doc) {
  rimraf(doc.path, function () { logger.info(`delete chain code directory ${doc.path}`); });
});

const ChainCode = mongoose.model('ChainCode', chainCode);

module.exports = ChainCode;
