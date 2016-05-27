var peer = require('./peer');

var textOT = require('ottypes').text
var gulf = require('gulf');
var bindEditor = require('gulf-textarea');
var textarea = document.querySelector('textarea#doc');
var textareaDoc = bindEditor(textarea);
var text = 'hello';

peer('chat.sock').then(stream => {
  console.log('started');
  console.log(stream.server ? 'master' : 'slave');
  window.stream = stream;

  var textareaMaster = textareaDoc.masterLink();

  if (stream.server) {
    // master
    gulf.Document.create(new gulf.MemoryAdapter, textOT, text, (err, doc) => {
      var slave1 = doc.slaveLink();
      stream.pipe(slave1).pipe(stream);

      var slave2 = doc.slaveLink();
      textareaMaster.pipe(slave2).pipe(textareaMaster);
    });
  } else {
    // slave
    textareaMaster.pipe(stream).pipe(textareaMaster);
  }
});
