const sio = require('socket.io');
let io = null;
const log4js = require('log4js');
const logger = log4js.getLogger(__filename.slice(__dirname.length + 1));
const logLevel = process.env.DEV === "True" ? "DEBUG" : "INFO"
logger.setLevel(logLevel);

exports.io = function () {
  return io;
};

exports.initialize = function(server) {
  io = sio(server);

  io.on('connection', function(socket) {
    socket.on('join', function (data) {
      logger.debug(`join ${data.id}`)
      socket.join(data.id)
    })
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      logger.debug(data);
    });
  });
};