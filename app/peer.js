module.exports = transport => {
  return new Promise((resolve, reject) => {
    transport.client()
      .then(resolve)
      .catch(err => {
        transport.server().then(resolve).catch(reject);
      });
  });
};

// https://gist.github.com/visnup/9801864
