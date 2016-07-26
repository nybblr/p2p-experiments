var WS = require('ws');
var WSS = WS.Server;
var mdns = require('mdns');

var masterify = stream => {
  stream.server = true;
  return stream;
};

module.exports = ({name, port, timeout = 1000}) => {
  var serviceType = mdns.tcp('ws', name);
  console.log(serviceType);

  return {
    server() {
      return new Promise((resolve, reject) => {
        var ad = mdns.createAdvertisement(serviceType, port);

        var server = new WSS({ port });
        server.on('connection', socket => {
          ad.start();
          resolve(masterify(socket));
        });
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

          var address = `ws://${service.host}:${service.port}`;
          var socket = new WS(address);

          socket.on('open', () => {
            resolve(socket);
          });
        });

        browser.start();
      });
    }
  };
};

