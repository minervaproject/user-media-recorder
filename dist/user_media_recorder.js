!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.UserMediaRecorder=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],2:[function(require,module,exports){
var assign = require("object-assign");

var AudioContext = window.AudioContext || window.webkitAudioContext;

function UserMediaRecorder(stream, workerUrl, config) {
  this.config = assign({
    mono: false,
    bitrate: 128, // only used by mp3 encoder
    bufferSize: 4096,
  }, config || {});

  this.config.channels = this.config.mono ? 1 : 2;

  this.worker = new Worker(workerUrl);
  this.stream = stream;
  this.buffer = null;
  this.endRecordingCallback = function() {};

  this._onAudioProcess = this._onAudioProcess.bind(this);
}

UserMediaRecorder.prototype.startRecording = function(callback) {
  if (callback) callback();
  this.recording = true;

  UserMediaRecorder.audioContext = UserMediaRecorder.audioContext || new AudioContext();
  input = UserMediaRecorder.audioContext.createMediaStreamSource(this.stream);
  node = input.context.createScriptProcessor(this.config.bufferSize, this.config.channels, this.config.channels);
  input.connect(node);
  node.connect(UserMediaRecorder.audioContext.destination);

  node.addEventListener("audioprocess", this._onAudioProcess);

  this.worker.addEventListener("message", this._handleWorkerMessage.bind(this));

  this.worker.postMessage({
    command: "init",
    config: {
      samplerate: UserMediaRecorder.audioContext.sampleRate,
      channels: this.config.channels,
      bitrate: this.config.bitrate
    }
  });
};

UserMediaRecorder.prototype.stopRecording = function(callback) {
  if (!this.recording) return;
  this.endRecordingCallback = callback || function() {};

  this.recording = false;
  this.worker.postMessage({
    command: "end"
  });
};

UserMediaRecorder.prototype._onAudioProcess = function(evt) {
  var audioData = this._getAudioData(evt.inputBuffer);

  if (!this.recording) return;
  this.worker.postMessage({
    command: "encode",
    buffer: audioData
  });
};

UserMediaRecorder.prototype._getAudioData = function(inputBuffer) {
  var channelLeft;
  if (this.stream.ended) return [];
  channelLeft = inputBuffer.getChannelData(0);
  // Clone buffer data so that it can't change under us.
  channelLeft = new Float32Array(channelLeft);
  return channelLeft;
};

UserMediaRecorder.prototype._handleWorkerMessage = function(evt) {
  var data = evt.data;
  switch (data.command) {
  case "init":
    this.type = data.type;
    break;
  case "data":
    this.appendToBuffer(data.buffer);
    break;
  case "end":
    this.appendToBuffer(data.buffer);
    var view;
    try {
      view = new DataView(this.buffer);
      var blob = new Blob([view], {type: this.type});
      this.endRecordingCallback(blob);
    } catch (e) {
      this.endRecordingCallback(null);
      throw e;
    } finally {
      this.worker.terminate();
    }
    break;
  }
};

UserMediaRecorder.prototype.appendToBuffer = function(buffer) {
  if (!this.buffer) {
    this.buffer = buffer;
  } else {
    var tmp = new Uint8Array(this.buffer.byteLength + buffer.byteLength);
    tmp.set(new Uint8Array(this.buffer), 0);
    tmp.set(new Uint8Array(buffer), this.buffer.byteLength);
    this.buffer = tmp.buffer;
  }
};

module.exports = UserMediaRecorder;

},{"object-assign":1}]},{},[2])(2)
});