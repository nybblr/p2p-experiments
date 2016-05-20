var peer = require('./peer');

peer('chat.sock').then(stream => {
  console.log('started');
  window.stream = stream;
});
