var peer = require('./peer');

var textOT = require('ottypes').text
var gulf = require('gulf');
var text = 'hello';

// var doc = require('gulf-textarea')(
//   document.querySelector('textarea#doc')
// );
require('codemirror/mode/javascript/javascript');
var cm = require('codemirror')(document.body);
var doc = require('gulf-codemirror')(cm);

// var transport = require('./transports/socket')('chat.sock');
var transport = require('./transports/mdns')({ port: 4321, name: 'nybblr' });
// var transport = require('./transports/webrtc')();

peer(transport).then(stream => {
  console.log('started');
  console.log(stream.server ? 'master' : 'slave');
  window.stream = stream;

  var textareaMaster = doc.masterLink();

  if (stream.server) {
    // master
    gulf.Document.create(new gulf.MemoryAdapter, textOT, text, (err, master) => {
      var slave1 = master.slaveLink();
      stream.pipe(slave1).pipe(stream);

      var slave2 = master.slaveLink();
      textareaMaster.pipe(slave2).pipe(textareaMaster);
    });
  } else {
    // slave
    textareaMaster.pipe(stream).pipe(textareaMaster);
  }
});
