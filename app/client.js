var socket = require('./transports/socket');

module.exports = path => {
  var promise = socket.client(path);

  return promise;
};
