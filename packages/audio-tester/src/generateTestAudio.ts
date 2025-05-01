import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate a test audio file with a specific BPM
function generateTestAudio(bpm: number, durationSeconds: number = 10): Float32Array {
    const sampleRate = 44100;
    const samplesPerBeat = Math.floor(60 / bpm * sampleRate);
    const totalSamples = sampleRate * durationSeconds;
    const buffer = new Float32Array(totalSamples);

    // Generate a sine wave with pulses at the BPM rate
    for (let i = 0; i < totalSamples; i++) {
        // Create a strong beat at each BPM interval
        const beatPosition = i % samplesPerBeat;
        const beatProgress = beatPosition / samplesPerBeat;
        
        // Generate a short pulse at the start of each beat
        if (beatProgress < 0.1) {
            const pulsePhase = beatProgress * Math.PI * 20; // 10 cycles during the pulse
            buffer[i] = Math.sin(pulsePhase) * (1 - beatProgress * 10);
        }
    }

    return buffer;
}

// Save the audio data as a WAV file
function saveAsWav(buffer: Float32Array, filePath: string, sampleRate: number = 44100): void {
    // WAV header
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // "RIFF" chunk descriptor
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));

    // File size (will be filled later)
    view.setUint32(4, 36 + buffer.length * 2, true);

    // "WAVE" format
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));

    // "fmt " sub-chunk
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));

    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 for mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // "data" sub-chunk
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));

    view.setUint32(40, buffer.length * 2, true); // Subchunk2Size

    // Create the final buffer
    const audioData = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        // Convert Float32 to Int16
        const sample = Math.max(-1, Math.min(1, buffer[i]));
        audioData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    // Combine header and audio data
    const finalBuffer = Buffer.concat([
        Buffer.from(header),
        Buffer.from(audioData.buffer)
    ]);

    // Write to file
    fs.writeFileSync(filePath, finalBuffer);
}

// Main function
function main() {
    const targetBpm = 120; // A common BPM for testing
    const durationSeconds = 10;
    const outputFile = path.join(__dirname, '..', 'test-120bpm.wav');

    console.log(`Generating ${durationSeconds} seconds of audio at ${targetBpm} BPM...`);
    const audioBuffer = generateTestAudio(targetBpm, durationSeconds);
    
    console.log(`Saving to ${outputFile}...`);
    saveAsWav(audioBuffer, outputFile);
    
    console.log('Done! You can now test this file with the BPM detection script:');
    console.log(`npm run test-bpm ${path.relative(process.cwd(), outputFile)}`);
}

main(); 