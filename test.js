var UserMediaRecorder = require("./index.js");

var button = document.getElementById("btn");
var button2 = document.getElementById("btn2");

var recorder = null;
button.addEventListener("click", function() {
  var timeStarted = null,
      timeEnded   = null;

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  var stream = navigator.getUserMedia({audio: true, video: false}, function(stream) {
    recorder = new UserMediaRecorder(stream, "/webworkers/mp3_worker.js", {
      mono: true
    });

    recorder.startRecording(function() {
      console.log("start");
      timeStarted = new Date();
    });

  }, function(e) {
    console.error(e);
  });
});

button2.addEventListener("click", function() {
  if (!recorder) return;

  recorder.stopRecording(function(blob) {
    console.log("stop", blob);
    timeEnded = new Date();
    window.open(URL.createObjectURL(blob));
    recorder = null;
  });
});
