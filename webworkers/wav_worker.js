var buffers,
    length = 0,
    channels = 2,
    sampleRate = 44100;

function concatBuffers(buffers, totalLength) {
  var buf;
  var result = new Float32Array(totalLength);
  var offset = 0;
  var lng = buffers.length;
  for (var i = 0; i < lng; i++) {
    var buf = buffers[i];
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

function writeUTFBytes(view, offset, string) {
  var lng = string.length;
  for (var i = 0; i < lng; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

this.addEventListener("message", function(evt) {
  var data = evt.data;

  switch (data.command) {
  case "init":
    buffers = [];
    sampleRate = data.config.samplerate || sampleRate;
    channels = data.config.channels || 2;
    this.postMessage({command: "init", type: "audio/wav"});
    this.postMessage({command: "rate", rate: sampleRate});
    break;
  case "encode":
    buffers.push(new Float32Array(data.buffer));
    length += data.buffer.length;
    break;
  case "end":
    var pcmBuffer = concatBuffers(buffers, length);
    var wavBuffer = new ArrayBuffer(44 + pcmBuffer.length * 2);
    var view = new DataView(wavBuffer);

    // RIFF chunk descriptor
    writeUTFBytes(view, 0, "RIFF");
    view.setUint32(4, 44 + pcmBuffer.length * 2, true);
    writeUTFBytes(view, 8, 'WAVE');

    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);

    view.setUint16(22, channels, true); // one channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);

    // data sub-chunk
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, pcmBuffer.length * 2, true);

    // PCM samples
    var lng = pcmBuffer.length;
    var index = 44;
    volume = 1;
    for (var i = 0; i < lng; i++) {
      view.setInt16(index, pcmBuffer[i] * (0x7FFF * volume), true);
      index += 2;
    }
    this.postMessage({command: "end", buffer: wavBuffer});
    break;
  }
});
