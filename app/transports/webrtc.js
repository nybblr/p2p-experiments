var {shrink, expand} = require('../utils/shrink');
require('../vendor/adapter');

var shrinkDesc = desc => shrink(desc.sdp);
var expandDesc = (string, type) =>
  new RTCSessionDescription({type, sdp: expand(string)});

var gets = () => {
  return new Promise((resolve, reject) => {
    window.resolve = resolve;
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
      console.log('ICE candidate (pc2)', e);
      if (e.candidate == null) {
        iced = true;
        resolve(peerConnection.localDescription);
      }
    };
  });
};

icedDescription();

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
    console.log('created local offer', desc);
  });

  return icedDescription();
};

var handleAnswer = answer => {
  console.log('Received remote answer: ', answer);
  peerConnection.setRemoteDescription(answer);
};

peerConnection.ondatachannel = e => {
  var channel = e.channel || e;
  console.log('Received datachannel (pc2)', arguments)
  window.channel = channel;
  channel.onopen = e => {
    console.log('data channel connect');
  };
  channel.onmessage = e => {
    console.log('Got message (pc2)', e.data);
  };
};

var handleOffer = offer => {
  peerConnection.setRemoteDescription(offer);
};

var createAnswer = () => {
  peerConnection.createAnswer().then(answer => {
    console.log('Created local answer: ', answer);
    peerConnection.setLocalDescription(answer);
  });

  return icedDescription();
};


window.go = master => {
  if (master) {
    var channel = initDataChannel();
    window.channel = channel;
    createOffer().then(offer => {
      var offerStr = shrinkDesc(offer);
      console.log(offerStr);
      gets().then(answerStr => {
        var answer = expandDesc(answerStr, 'answer');
        handleAnswer(answer);
      });
    });
  } else {
    gets().then(offerStr => {
      var offer = expandDesc(offerStr, 'offer');
      handleOffer(offer);
      createAnswer().then(answer => {
        var answerStr = shrinkDesc(answer);
        console.log(answerStr);
      });
    });
  }
};
