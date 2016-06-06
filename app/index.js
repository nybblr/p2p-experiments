var peer = require('./peer');

// var transport = require('./transports/socket')('chat.sock');
var transport = require('./transports/mdns')({ port: 4321, name: 'nybblr' });
// var transport = require('./transports/webrtc')();

var resolver = require('./resolvers/ot');

peer(transport).then(stream => {
  console.log('started');
  console.log(stream.server ? 'master' : 'slave');
  window.stream = stream;

  resolver(stream);
});
