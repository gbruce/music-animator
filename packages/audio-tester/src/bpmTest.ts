import fs from 'fs';
import path from 'path';
import { Aubio } from 'aubiojs';
import bpmDetective from 'bpm-detective';
import audioDecode from 'audio-decode';

async function loadAudioFile(filePath: string): Promise<{ audioBuffer: Float32Array; sampleRate: number }> {
    console.log('Reading audio file...');
    const audioData = fs.readFileSync(filePath);
    console.log('Decoding audio data...');
    const audioBuffer = await audioDecode(audioData);
    
    console.log('Converting to mono...');
    // Convert to mono if necessary by averaging all channels
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const monoBuffer = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let channel = 0; channel < numberOfChannels; channel++) {
            sum += audioBuffer.getChannelData(channel)[i];
        }
        monoBuffer[i] = sum / numberOfChannels;
    }
    
    return {
        audioBuffer: monoBuffer,
        sampleRate: audioBuffer.sampleRate
    };
}

async function detectBPMWithAubio(audioBuffer: Float32Array, sampleRate: number): Promise<number> {
    console.log('Initializing Aubio...');
    const aubio = await Aubio();
    console.log('Creating Tempo detector...');
    const tempo = new aubio.Tempo(
        'default',
        2048,
        512,
        sampleRate
    );

    console.log('Processing audio with Aubio...');
    const bpms: number[] = [];
    for (let i = 0; i < audioBuffer.length; i += 512) {
        const slice = audioBuffer.slice(i, i + 2048);
        if (slice.length < 2048) break;
        
        const bpm = tempo.do(slice);
        if (bpm > 0) bpms.push(bpm);
    }

    // Calculate average BPM
    if (bpms.length === 0) {
        throw new Error('No valid BPM detected');
    }
    
    const avgBpm = bpms.reduce((a, b) => a + b, 0) / bpms.length;
    return avgBpm;
}

async function detectBPMWithDetective(audioBuffer: Float32Array, sampleRate: number): Promise<number> {
    console.log('Processing audio with BPM Detective...');
    const result = bpmDetective(audioBuffer, sampleRate);
    if (typeof result !== 'number' || isNaN(result) || result <= 0) {
        throw new Error('Invalid BPM detected');
    }
    return result;
}

async function main() {
    try {
        if (process.argv.length < 3) {
            console.error('Please provide an audio file path');
            process.exit(1);
        }

        const audioFilePath = process.argv[2];
        if (!fs.existsSync(audioFilePath)) {
            console.error('Audio file not found:', audioFilePath);
            process.exit(1);
        }

        console.log('Loading audio file:', path.basename(audioFilePath));
        console.log('----------------------------------------');

        const { audioBuffer, sampleRate } = await loadAudioFile(audioFilePath);
        console.log('Audio file loaded successfully');
        console.log('Sample rate:', sampleRate);
        console.log('Duration:', audioBuffer.length / sampleRate, 'seconds');
        console.log('Buffer length:', audioBuffer.length, 'samples');
        console.log('----------------------------------------');

        // Test a small portion of the buffer
        console.log('First 5 samples:', audioBuffer.slice(0, 5));
        console.log('----------------------------------------');

        try {
            const aubioBPM = await detectBPMWithAubio(audioBuffer, sampleRate);
            console.log('Aubio BPM:', aubioBPM.toFixed(2));
        } catch (error) {
            console.error('Aubio error:', error instanceof Error ? error.message : error);
            if (error instanceof Error && error.stack) {
                console.error('Stack trace:', error.stack);
            }
        }

        try {
            const detectiveBPM = await detectBPMWithDetective(audioBuffer, sampleRate);
            console.log('BPM Detective:', detectiveBPM.toFixed(2));
        } catch (error) {
            console.error('BPM Detective error:', error instanceof Error ? error.message : error);
            if (error instanceof Error && error.stack) {
                console.error('Stack trace:', error.stack);
            }
        }

        // Note: web-audio-beat-detector is removed as it requires a browser environment
        console.log('\nNote: web-audio-beat-detector is not available in Node.js environment');
        
    } catch (error) {
        console.error('Error in main:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
});

main().catch(error => {
    console.error('Unhandled error in main:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
}); 