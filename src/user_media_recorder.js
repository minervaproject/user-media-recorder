var UserMediaRecording = require("./user_media_recording");

var AudioContext = window.AudioContext || window.webkitAudioContext;
var cachedAudioContext = null;

function uuid() {
  var d = (window.performance && window.performance.now && window.performance.now()) ||
          (Date.now && Date.now()) ||
          new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r&0x7|0x8)).toString(16);
  });
  return uuid;
}

function UserMediaRecorder(stream, worker) {
  this.stream = stream;
  this.worker = worker;
}

UserMediaRecorder.prototype.startRecording = function(config) {
  cachedAudioContext = cachedAudioContext || new AudioContext();
  var recording = new UserMediaRecording(uuid(), this.stream, cachedAudioContext, this.worker, config);
  recording.startRecording();
  return recording;
};

UserMediaRecorder.prototype.stopRecording = function(recording, callback) {
  recording.stopRecording(callback);
};

module.exports = UserMediaRecorder;
