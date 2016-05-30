var net = require('net');
var mdns = require('mdns');

module.exports = ({name, port, timeout = 1000}) => {
  var serviceType = mdns.tcp('stream', name);
  console.log(serviceType);

  return {
    server() {
      return new Promise((resolve, reject) => {
        var ad = mdns.createAdvertisement(serviceType, port);

        var server = net.createServer(client => {
          resolve(client);
        })
          .on('error', (err) => { reject(err); })
          .listen(port, () => { ad.start(); });
      })
    },

    client() {
      return new Promise((resolve, reject) => {
        var browser = mdns.createBrowser(serviceType);

        var id = setTimeout(() => {
          browser.stop();
          var err = new Error('Timed out looking for zeroconf service.');
          console.log(err);
          reject(err)
        }, timeout);

        browser.on('serviceUp', service => {
          console.log("service up: ", service);
          clearTimeout(id);
          browser.stop();

          var client = net.createConnection(service, () => {
            resolve(client);
          })
            .on('error', (err) => { reject(err); })
        });

        browser.start();
      });
    }
  };
};

