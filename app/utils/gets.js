var gets = () => {
  return new Promise((resolve, reject) => {
    window.resolve = resolve;
    window.reject = reject;
  });
};

module.exports = gets;
