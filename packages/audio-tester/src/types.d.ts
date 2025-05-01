declare module 'bpm-detective' {
    function detect(audioBuffer: Float32Array, sampleRate: number): number;
    export default detect;
}

declare module 'aubiojs' {
    export interface Tempo {
        do(buffer: Float32Array): number;
    }

    export interface AubioInstance {
        Tempo: new (method: string, bufferSize: number, hopSize: number, sampleRate: number) => Tempo;
    }

    export function Aubio(): Promise<AubioInstance>;
}

declare module 'audio-decode' {
    interface AudioBuffer {
        numberOfChannels: number;
        length: number;
        sampleRate: number;
        getChannelData(channel: number): Float32Array;
    }

    function decode(buffer: Buffer): Promise<AudioBuffer>;
    export default decode;
}

declare module 'web-audio-beat-detector' {
    export function getBPM(audioBuffer: AudioBuffer): Promise<number>;
} 