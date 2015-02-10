var UserMediaRecorder = require("./index.js");

var button = document.getElementById("btn");
var button2 = document.getElementById("btn2");

var recorder;
var worker = new Worker("/webworkers/mp3_worker.js");
var config = {
  mono: true
};

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
navigator.getUserMedia({audio: true, video: false}, function(stream) {
  recorder = new UserMediaRecorder(stream, worker);
  startRecording();
  setTimeout(function() {
    startRecording();
  }, 1500);
}, function(e) {
  console.error(e);
});

function startRecording() {
  console.log("starting");
  var recording = recorder.startRecording(config);
  setTimeout(function() {
    console.log("stopping");
    recorder.stopRecording(recording, function(blob) {
      var url = URL.createObjectURL(blob);
      console.log(url);
      window.open(url);
    });
  }, 3000);
};
