var socket = require('./transports/socket');

module.exports = path => {
  var promise = socket.server(path);

  return promise.then(([server, client]) => client);
};
