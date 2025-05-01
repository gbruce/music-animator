import fs from 'fs';
import path from 'path';
import bpmDetective from 'bpm-detective';
import audioDecode from 'audio-decode';

async function main() {
    try {
        if (process.argv.length < 3) {
            console.error('Please provide an audio file path');
            process.exit(1);
        }

        const audioFilePath = process.argv[2];
        console.log('Testing file:', audioFilePath);

        if (!fs.existsSync(audioFilePath)) {
            console.error('Audio file not found:', audioFilePath);
            process.exit(1);
        }

        console.log('Reading file...');
        const audioData = fs.readFileSync(audioFilePath);
        console.log('File size:', audioData.length, 'bytes');

        console.log('Decoding audio...');
        const audioBuffer = await audioDecode(audioData);
        console.log('Audio decoded successfully');
        console.log('Channels:', audioBuffer.numberOfChannels);
        console.log('Sample rate:', audioBuffer.sampleRate);
        console.log('Duration:', audioBuffer.length / audioBuffer.sampleRate, 'seconds');

        // Convert to mono if necessary
        const monoBuffer = new Float32Array(audioBuffer.length);
        for (let i = 0; i < audioBuffer.length; i++) {
            let sum = 0;
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                sum += audioBuffer.getChannelData(channel)[i];
            }
            monoBuffer[i] = sum / audioBuffer.numberOfChannels;
        }

        console.log('Detecting BPM...');
        const bpm = bpmDetective(monoBuffer, audioBuffer.sampleRate);
        console.log('Detected BPM:', bpm);

    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Unhandled error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
}); 