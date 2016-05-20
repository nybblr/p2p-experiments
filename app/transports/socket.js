const net = require('net');

exports.server = path => {
  return new Promise((resolve, reject) => {
    var server = net.createServer(client => {
      resolve([server, client]);
    })
      .on('error', (err) => { reject(err); })
      .listen(path);
  })
};

exports.client = path => {
  return new Promise((resolve, reject) => {
    var client = net.createConnection({ path }, () => {
      resolve(client);
    })
      .on('error', (err) => { reject(err); })
  });
};
