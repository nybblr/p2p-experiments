const net = require('net');

module.exports = path => {
  return {
    server() {
      return new Promise((resolve, reject) => {
        var server = net.createServer(client => {
          resolve(client);
        })
          .on('error', (err) => { reject(err); })
          .listen(path);
      })
    },

    client() {
      return new Promise((resolve, reject) => {
        var client = net.createConnection({ path }, () => {
          resolve(client);
        })
          .on('error', (err) => { reject(err); })
      });
    }
  };
};

