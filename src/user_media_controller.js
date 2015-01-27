var _ = require("underscore");
var streamEnabled = false, mediaStream, audioContext, input, node, audioCallbacks=[], analyser;

/**
  * Chrome limits the number of AudioContexts you can create to 6;
  * this is not a problem unless GC doesn't kick in to release them.
  * As a workaround, we open the stream and a single AudioContext only once,
  * and instances of UserMediaController add event listeners to the audio
  * processing event of the node while they are active (and remove them
  * when they are done). [BT]
  */

function getAudioData(inputBuffer) {
  var channelLeft;
  if (mediaStream.ended) return [];
  channelLeft = inputBuffer.getChannelData(0);
  // Clone buffer data so that it can't change under us.
  channelLeft = new Float32Array(channelLeft);
  return channelLeft;
}

function UserMediaController(config) {
  con.log("[user-media-controller] Constructor");
  config = config || {};
  this.callback = config.callback || function() {};
}

UserMediaController.prototype.startListening = function() {
  UserMediaController.startListening(this.callback);
  UserMediaController.setupStream();
};

UserMediaController.prototype.stopListening = function() {
  UserMediaController.stopListening(this.callback);
};

// Class Methods

UserMediaController.setupStream = function() {
  if (!streamEnabled) {
    con.log("[user-media-controller] setupStream");
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia);
    navigator.getUserMedia({audio: true, video: false}, function (stream) {
      streamEnabled = true;
      mediaStream = stream;
      audioContext = audioContext || new window.webkitAudioContext();
      analyser = audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.3;
      analyser.fftSize = 1024;
      input = audioContext.createMediaStreamSource(mediaStream);
      // Larger buffers sizes reduced glitches but did not eliminate them, but
      // at very large values the end of clips got cut off. Allowing Chrome to
      // pick always resulted in a value of 512, which was too glitchy. Trying
      // a middle-of-the-road value. [BT]
      node = input.context.createScriptProcessor(4096, 1, 1);
      input.connect(analyser);
      input.connect(node);
      node.connect(audioContext.destination);

      if (audioCallbacks.length > 0) {
        node.addEventListener("audioprocess", UserMediaController.onAudioProcess);
      }
      con.log("[user-media-controller] Successfully set up stream");
    }, function(e) {
      con.error("[user-media-controller] Could not get audio stream:");
      con.error(e && e.stack);
    });
  }
};

UserMediaController.isEnabled = function() {
  return streamEnabled;
};

UserMediaController.analyser = function() {
  return analyser;
};

UserMediaController.sampleRate = function() {
  return audioContext.sampleRate;
};

UserMediaController.startListening = function(callback) {
  if (audioCallbacks.length === 0 && this.isEnabled()) {
    node.addEventListener("audioprocess", UserMediaController.onAudioProcess);
  }
  if (audioCallbacks.indexOf(callback) === -1) {
    con.log("[user-media-controller] startListening");
    audioCallbacks.push(callback);
  }
};

UserMediaController.stopListening = function(callback) {
  var idx = audioCallbacks.indexOf(callback);
  if (idx !== -1) {
    con.log("[user-media-controller] stopListening");
    audioCallbacks.splice(idx, 1);
  }
  if (audioCallbacks.length === 0 && this.isEnabled()) {
    node.removeEventListener("audioprocess", UserMediaController.onAudioProcess);
  }
};

UserMediaController.onAudioProcess = function(evt) {
  var audioData = getAudioData(evt.inputBuffer);
  _.each(audioCallbacks, function(cb) {
    cb(audioData);
  });
};

UserMediaController.tearDownStream = function() {
  if (streamEnabled) {
    con.log("[user-media-controller] tearDownStream");
    mediaStream && mediaStream.stop();
    streamEnabled = false;
    input.disconnect(0);
    node.disconnect(0);
    input = node = null;
  }
};

module.exports = UserMediaController;
