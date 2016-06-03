var {shrink, expand} = require('../utils/shrink');
require('../vendor/adapter');

var shrinkDesc = desc => shrink(desc.sdp);
var expandDesc = (string, type) =>
  new RTCSessionDescription({type, sdp: expand(string)});

var gets = () => {
  return new Promise((resolve, reject) => {
    window.resolve = resolve;
    window.reject = reject;
  });
};



var config = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
var connection = {
  'optional': [{'DtlsSrtpKeyAgreement': true}]
};
var peerConnection = new RTCPeerConnection(config, connection);
window.pc = peerConnection;

var iced = false;

var icedDescription = () => {
  return new Promise((resolve, reject) => {
    if (iced) {
      resolve(peerConnection.localDescription);
      return;
    }
    peerConnection.onicecandidate = e => {
      if (e.candidate == null) {
        iced = true;
        resolve(peerConnection.localDescription);
      }
    };
  });
};

var initDataChannel = function () {
  var channel = peerConnection.createDataChannel('RTCDataChannel', {reliable: true})
  channel.onopen = function (e) {
    console.log('data channel connect')
  }
  channel.onmessage = function (e) {
    if (e.data.charCodeAt(0) == 2) { return; }
    console.log(e.data);
  }
  return channel;
};

var createOffer = () => {
  peerConnection.createOffer().then(desc => {
    peerConnection.setLocalDescription(desc);
  });

  return icedDescription();
};

var handleAnswer = answer => {
  peerConnection.setRemoteDescription(answer);
};

var handleOffer = offer => {
  peerConnection.setRemoteDescription(offer);
};

var createAnswer = () => {
  peerConnection.createAnswer().then(answer => {
    peerConnection.setLocalDescription(answer);
  });

  return icedDescription();
};

module.exports = () => {
  icedDescription();

  return {
    server() {
      return new Promise((resolve, reject) => {
        var channel = initDataChannel();
        channel.server = true;

        createOffer().then(offer => {
          var offerStr = shrinkDesc(offer);
          console.log(offerStr);
          gets().then(answerStr => {
            var answer = expandDesc(answerStr, 'answer');
            handleAnswer(answer);
          }, reject);
        }, reject);

        channel.onopen = e => {
          resolve(channel);
        };
        channel.onerror = err => {
          reject(err);
        };
      })
    },

    client() {
      return new Promise((resolve, reject) => {
        peerConnection.ondatachannel = e => {
          var channel = e.channel || e;
          channel.onopen = e => {
            resolve(channel);
          };
          channel.onerror = err => {
            reject(err);
          };
          channel.onmessage = e => {
            console.log('Got message (pc2)', e.data);
          };
        };

        gets().then(offerStr => {
          var offer = expandDesc(offerStr, 'offer');
          handleOffer(offer);
          createAnswer().then(answer => {
            var answerStr = shrinkDesc(answer);
            console.log(answerStr);
          }, reject);
        }, reject);
      });
    }
  };
};

