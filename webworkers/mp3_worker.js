importScripts("libmp3lame.js");

var jobs = {};

this.addEventListener("message", function(evt) {
  var data = evt.data,
      uuid = data.uuid;

  switch (data.command) {
  case "init":
    if (!data.config) data.config = {};

    var mp3codec = Lame.init();
    Lame.set_mode(mp3codec, data.config.mode || Lame.JOINT_STEREO);
    Lame.set_num_channels(mp3codec, data.config.channels || 2);
    Lame.set_out_samplerate(mp3codec, data.config.samplerate || 44100);
    Lame.set_bitrate(mp3codec, data.config.bitrate || 128);
    Lame.init_params(mp3codec);

    jobs[uuid] = {
      mp3codec: mp3codec
    };

    this.postMessage({command: "init", uuid: uuid, type: "audio/mpeg"});
    break;
  case "encode":
    var mp3codec = jobs[uuid].mp3codec;
    var mp3data = Lame.encode_buffer_ieee_float(mp3codec, data.buffer, data.buffer);
    this.postMessage({command: "data", uuid: uuid, buffer: mp3data.data});
    break;
  case "end":
    var mp3codec = jobs[uuid].mp3codec;
    var mp3data = Lame.encode_flush(mp3codec);
    this.postMessage({command: "end", uuid: uuid, buffer: mp3data.data});
    Lame.close(mp3codec);
    delete jobs[uuid];
    break;
  }
});
