import fs from 'fs';
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
        // Test reading some samples
        const channel0 = audioBuffer.getChannelData(0);
        console.log('First 5 samples from channel 0:', Array.from(channel0.slice(0, 5)));
    }
    catch (error) {
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
//# sourceMappingURL=simpleTest.js.map