var toStream = require('data-channel');
var {shrink, expand} = require('../utils/shrink');
var gets = require('../utils/gets');
require('../vendor/adapter');

var shrinkDesc = desc => shrink(desc.sdp);
var expandDesc = (string, type) =>
  new RTCSessionDescription({type, sdp: expand(string)});

var config = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
var connection = {
  'optional': [{'DtlsSrtpKeyAgreement': true}]
};

var iced = false;

var icedDescription = pc => {
  return new Promise((resolve, reject) => {
    if (iced) {
      resolve(pc.localDescription);
      return;
    }
    pc.onicecandidate = e => {
      if (e.candidate == null) {
        iced = true;
        resolve(pc.localDescription);
      }
    };
  });
};

var initDataChannel = pc => {
  return pc.createDataChannel('RTCDataChannel', {reliable: true});
};

var createOffer = pc => {
  pc.createOffer().then(desc => {
    pc.setLocalDescription(desc);
  });

  return icedDescription(pc);
};

var createAnswer = pc => {
  pc.createAnswer().then(answer => {
    pc.setLocalDescription(answer);
  });

  return icedDescription(pc);
};

var masterify = stream => {
  stream.server = true;
  return stream;
};

module.exports = () => {
  var pc = new RTCPeerConnection(config, connection);
  icedDescription(pc);

  return {
    server() {
      return new Promise((resolve, reject) => {
        var channel = initDataChannel(pc);
        resolve(masterify(toStream(channel)));

        createOffer(pc).then(offer => {
          var offerStr = shrinkDesc(offer);
          console.log(offerStr);
          gets().then(answerStr => {
            var answer = expandDesc(answerStr, 'answer');
            pc.setRemoteDescription(answer);
          }, reject);
        }, reject);
      })
    },

    client() {
      return new Promise((resolve, reject) => {
        pc.ondatachannel = e => {
          var channel = e.channel || e;
          resolve(toStream(channel));
        };

        gets().then(offerStr => {
          var offer = expandDesc(offerStr, 'offer');
          pc.setRemoteDescription(offer);
          createAnswer(pc).then(answer => {
            var answerStr = shrinkDesc(answer);
            console.log(answerStr);
          }, reject);
        }, reject);
      });
    }
  };
};
