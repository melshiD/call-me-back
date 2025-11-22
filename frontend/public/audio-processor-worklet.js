// Audio Worklet Processor for Browser Voice
// Converts Float32 audio to Int16 PCM and sends to main thread

class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const channelData = input[0]; // Mono channel

      if (channelData && channelData.length > 0) {
        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          // Clamp to [-1, 1] and scale to Int16 range
          const sample = Math.max(-1, Math.min(1, channelData[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Send PCM data to main thread
        this.port.postMessage(pcm16.buffer);
      }
    }

    // Keep processor alive
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
