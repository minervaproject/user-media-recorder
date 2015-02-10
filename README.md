User Media Recorder
===================

Record audio from `getUserMedia` to either WAV or MP3 blobs.

Example Usage
-------------

```javascript
var timeStarted = null,
    timeEnded   = null,
    worker      = new Worker("/path/to/mp3_worker.js"),
    config      = {
      channels: 2,
      bitrate: 96
    };

var stream = navigator.getUserMedia({audio: true, video: false}, function(stream) {
  var recorder = new UserMediaRecorder(stream, worker);

  var recording = recorder.startRecording(config);
  var timeStarted = new Date().getTime();

  // Sometime later...
  recorder.stopRecording(recording, function(blob) {
    var timeEnded = new Date().getTime();
    window.open(URL.createObjectURL(blob));
    console.log("Length: " + timeEnded - timeStarted);
  });
});
```

API
---

### `new UserMediaRecorder(stream, worker)`

Creates a recorder that records audio from `stream`. Note that each `UserMediaRecorder` instance can only record once. Attempting to call `startRecording` a second time will cause an exception to be thrown.

`workerUrl` should be the path or URL to an encoder web worker (shipped with this library). You may use either `mp3_worker.js` (for recording MP3s) or `wav_worker.js` (for recording WAV files). If using the MP3 worker, `libmp3lame.js` must be available in the same directory as the worker.

* `stream` - the user media stream to record
* `worker` - a Web Worker to use for audio processing; the worker used determines the type of the blob (e.g. `audio/wav` or `audio/mpeg`)

### `UserMediaRecorder#startRecording([config])`

Starts recording the stream, using the given configuration for the recording.

* `config` - an optional object of key/value pairs:
  * `config.mono` - whether or not to record mono audio - defaults to `false`
  * `config.bufferSize` - the buffer size to use for `createScriptProcessor` - defaults to `4096`
  * `config.bitrate` - the bit rate, only used by the MP3 encoder - defaults to `128`

### `UserMediaRecorder#stopRecording(callback)`

Stops recording the stream and calls the callback with the recording.

* `callback(blob)` - a callback that the recorder will call when the audio data is ready. `blob` is a Blob containing the audio data

Known Issues
------------

* WAV encoding doesn't work correctly if `config.mono` is set to `false`
* MP3 recordings that use two channels use only the microphone's left channel for both output channels

Building
--------

To build the redistributable browser build, run `npm run build`.
