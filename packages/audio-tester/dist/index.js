/**
 * Audio Tester
 * A utility for testing audio file processing and manipulation
 */
class AudioTester {
    config;
    constructor(config) {
        this.config = config;
    }
    getConfig() {
        return { ...this.config };
    }
}
const defaultConfig = {
    sampleRate: 44100,
    channels: 2,
    format: 'wav'
};
const main = async () => {
    console.log('Audio Tester initialized');
    const tester = new AudioTester(defaultConfig);
    console.log('Config:', tester.getConfig());
};
main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
export {};
//# sourceMappingURL=index.js.map