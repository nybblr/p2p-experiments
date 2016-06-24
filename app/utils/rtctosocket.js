const EventEmitter = require('events');

class RTCSocket extends EventEmitter {
  constructor(channel) {
    super();

    this.channel = channel;

    channel.onopen    = (...args) => this.emit('open', ...args);
    channel.onclose   = (...args) => this.emit('close', ...args);
    channel.onmessage = (event) => this.emit('message', event.data);
    channel.onerror   = (...args) => this.emit('error', ...args);
  }

  send(...args) {
    this.channel.send(...args);
  }

  close(...args) {
    this.channel.close(...args);
  }
}

module.exports = channel => {
  return new RTCSocket(channel);
};
