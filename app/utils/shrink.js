const zlib = require('zlib');

var deflate = string => zlib.deflateSync(string);
var inflate = string => zlib.inflateSync(string);

var safe64 = string =>
  string.replace(/[+\/]/g, m => m == '+' ? '-' : '_');
var unsafe64 = string =>
  string.replace(/[-_]/g, m => m == '-' ? '+' : '/');

var encode = buffer =>
  safe64(buffer.toString('base64'));
var decode = string =>
  Buffer.from(unsafe64(string), 'base64');

exports.shrink = string => encode(deflate(string));
exports.expand = string => inflate(decode(string)).toString();
