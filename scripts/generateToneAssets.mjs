import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const soundsDir = join(rootDir, 'src', 'assets', 'sounds');
const tickPath = join(rootDir, 'src', 'assets', 'tick.wav');
const toneSampleRate = 12_000;
const tickSampleRate = 48_000;
const toneDurationSeconds = 120;

const frequencies = [174, 285, 396, 417, 528, 639, 741, 852, 963];

function createWavBuffer(samples, sampleRate) {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(clamped * 0x7fff), 44 + index * 2);
  }

  return buffer;
}

function buildTone(frequency) {
  const totalSamples = toneSampleRate * toneDurationSeconds + 1;
  const samples = new Float32Array(totalSamples);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / toneSampleRate;
    const fundamental = Math.sin(2 * Math.PI * frequency * time);
    const overtone = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.18;
    const shimmer = Math.sin(2 * Math.PI * frequency * 3 * time) * 0.08;
    samples[index] = (fundamental * 0.72 + overtone + shimmer) * 0.58;
  }

  return createWavBuffer(samples, toneSampleRate);
}

function buildTick() {
  const totalSamples = Math.round(tickSampleRate * 0.05);
  const samples = new Float32Array(totalSamples);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / tickSampleRate;
    const envelope = Math.exp(-time * 42);
    const click = Math.sin(2 * Math.PI * 1800 * time) * 0.7;
    const tail = Math.sin(2 * Math.PI * 920 * time) * 0.28;
    samples[index] = (click + tail) * envelope * 0.7;
  }

  return createWavBuffer(samples, tickSampleRate);
}

mkdirSync(soundsDir, { recursive: true });

for (const frequency of frequencies) {
  writeFileSync(join(soundsDir, `${frequency}hz.wav`), buildTone(frequency));
}

writeFileSync(tickPath, buildTick());
