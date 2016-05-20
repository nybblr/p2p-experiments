var server = require('./server');
var client = require('./client');

module.exports = path => {
  return new Promise((resolve, reject) => {
    client(path)
      .then(resolve)
      .catch(err => {
        server(path).then(resolve).catch(reject);
      });
  });
};

// https://gist.github.com/visnup/9801864
