import type { StressLevel } from "@/lib/api";

export type EegDemoDataset = {
  id: string;
  name: string;
  description: string;
  samples: number[];
  attention: number;
  meditation: number;
  poorSignal: number;
  expectedStress: StressLevel;
};

type WaveConfig = {
  seed: number;
  alphaAmp: number;
  betaAmp: number;
  noiseAmp: number;
  driftAmp: number;
  spikeChance?: number;
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildWaveform(config: WaveConfig, length = 512): number[] {
  const rand = mulberry32(config.seed);
  const samples: number[] = [];
  for (let i = 0; i < length; i++) {
    const t = i + config.seed * 11;
    let value = Math.sin(t * 0.11) * config.alphaAmp;
    value += Math.sin(t * 0.41) * config.betaAmp;
    value += Math.sin(t * 0.015) * config.driftAmp;
    value += (rand() - 0.5) * config.noiseAmp;
    if (config.spikeChance && rand() < config.spikeChance) {
      value += (rand() - 0.5) * 90;
    }
    samples.push(Number(value.toFixed(2)));
  }
  return samples;
}

const DEMO_PROFILES: Array<Omit<EegDemoDataset, "samples">> = [
  { id: "calm-morning", name: "Calm morning", description: "Relaxed alpha rhythm with low noise.", attention: 42, meditation: 78, poorSignal: 0, expectedStress: "Low" },
  { id: "deep-meditation", name: "Deep meditation", description: "Slow drift with very stable contact.", attention: 35, meditation: 88, poorSignal: 0, expectedStress: "Low" },
  { id: "post-nap", name: "Post-nap recovery", description: "Gentle waveform after rest.", attention: 48, meditation: 72, poorSignal: 0, expectedStress: "Low" },
  { id: "light-reading", name: "Light reading", description: "Mild focus without tension spikes.", attention: 58, meditation: 61, poorSignal: 0, expectedStress: "Low" },
  { id: "steady-focus", name: "Steady focus", description: "Balanced attention during routine work.", attention: 66, meditation: 54, poorSignal: 0, expectedStress: "Medium" },
  { id: "commute-wait", name: "Commute wait", description: "Neutral boredom signal with mild beta.", attention: 52, meditation: 49, poorSignal: 0, expectedStress: "Medium" },
  { id: "office-meeting", name: "Office meeting", description: "Moderate cognitive load.", attention: 71, meditation: 41, poorSignal: 0, expectedStress: "Medium" },
  { id: "exam-prep", name: "Exam preparation", description: "Higher beta with intermittent spikes.", attention: 74, meditation: 36, poorSignal: 0, expectedStress: "Medium" },
  { id: "deadline-pressure", name: "Deadline pressure", description: "Volatile waveform under time stress.", attention: 81, meditation: 28, poorSignal: 0, expectedStress: "High" },
  { id: "traffic-anxiety", name: "Traffic anxiety", description: "Irregular bursts and elevated noise.", attention: 77, meditation: 22, poorSignal: 0, expectedStress: "High" },
  { id: "conflict-stress", name: "Conflict stress", description: "Sharp spikes with unstable rhythm.", attention: 84, meditation: 18, poorSignal: 0, expectedStress: "High" },
  { id: "panic-spike", name: "Panic spike", description: "High-amplitude bursts in short bursts.", attention: 88, meditation: 12, poorSignal: 0, expectedStress: "High" },
  { id: "caffeine-jitters", name: "Caffeine jitters", description: "Fast beta with restless noise.", attention: 79, meditation: 25, poorSignal: 0, expectedStress: "High" },
  { id: "sleep-deprived", name: "Sleep deprived", description: "Drifting focus with noisy baseline.", attention: 63, meditation: 31, poorSignal: 0, expectedStress: "Medium" },
  { id: "workout-cooldown", name: "Workout cooldown", description: "Settling heart-rate influence on EEG.", attention: 55, meditation: 58, poorSignal: 0, expectedStress: "Medium" },
  { id: "creative-flow", name: "Creative flow", description: "Relaxed but engaged alpha-beta mix.", attention: 69, meditation: 63, poorSignal: 0, expectedStress: "Low" },
  { id: "noisy-contact", name: "Loose electrode", description: "Valid samples but poor headset contact.", attention: 60, meditation: 45, poorSignal: 48, expectedStress: "Medium" },
  { id: "recovery-breathing", name: "Recovery breathing", description: "Calming pattern after stress event.", attention: 46, meditation: 81, poorSignal: 0, expectedStress: "Low" },
];

const WAVE_CONFIGS: Record<string, WaveConfig> = {
  "calm-morning": { seed: 11, alphaAmp: 48, betaAmp: 8, noiseAmp: 10, driftAmp: 14 },
  "deep-meditation": { seed: 17, alphaAmp: 52, betaAmp: 5, noiseAmp: 6, driftAmp: 20 },
  "post-nap": { seed: 23, alphaAmp: 44, betaAmp: 9, noiseAmp: 9, driftAmp: 12 },
  "light-reading": { seed: 29, alphaAmp: 40, betaAmp: 14, noiseAmp: 11, driftAmp: 10 },
  "steady-focus": { seed: 31, alphaAmp: 34, betaAmp: 22, noiseAmp: 14, driftAmp: 11 },
  "commute-wait": { seed: 37, alphaAmp: 28, betaAmp: 18, noiseAmp: 16, driftAmp: 13 },
  "office-meeting": { seed: 41, alphaAmp: 30, betaAmp: 26, noiseAmp: 18, driftAmp: 12 },
  "exam-prep": { seed: 43, alphaAmp: 26, betaAmp: 30, noiseAmp: 22, driftAmp: 14, spikeChance: 0.03 },
  "deadline-pressure": { seed: 47, alphaAmp: 22, betaAmp: 34, noiseAmp: 28, driftAmp: 16, spikeChance: 0.05 },
  "traffic-anxiety": { seed: 53, alphaAmp: 20, betaAmp: 36, noiseAmp: 32, driftAmp: 18, spikeChance: 0.06 },
  "conflict-stress": { seed: 59, alphaAmp: 18, betaAmp: 40, noiseAmp: 34, driftAmp: 20, spikeChance: 0.08 },
  "panic-spike": { seed: 61, alphaAmp: 16, betaAmp: 44, noiseAmp: 38, driftAmp: 22, spikeChance: 0.1 },
  "caffeine-jitters": { seed: 67, alphaAmp: 24, betaAmp: 38, noiseAmp: 30, driftAmp: 15, spikeChance: 0.04 },
  "sleep-deprived": { seed: 71, alphaAmp: 30, betaAmp: 24, noiseAmp: 26, driftAmp: 17, spikeChance: 0.03 },
  "workout-cooldown": { seed: 73, alphaAmp: 36, betaAmp: 20, noiseAmp: 20, driftAmp: 16 },
  "creative-flow": { seed: 79, alphaAmp: 42, betaAmp: 18, noiseAmp: 12, driftAmp: 13 },
  "noisy-contact": { seed: 83, alphaAmp: 32, betaAmp: 22, noiseAmp: 40, driftAmp: 14, spikeChance: 0.02 },
  "recovery-breathing": { seed: 89, alphaAmp: 46, betaAmp: 10, noiseAmp: 8, driftAmp: 18 },
};

export const EEG_DEMO_DATASETS: EegDemoDataset[] = DEMO_PROFILES.map((profile) => ({
  ...profile,
  samples: buildWaveform(WAVE_CONFIGS[profile.id] ?? { seed: 1, alphaAmp: 30, betaAmp: 20, noiseAmp: 15, driftAmp: 12 }),
}));

export function pickRandomDemoDataset(): EegDemoDataset {
  const index = Math.floor(Math.random() * EEG_DEMO_DATASETS.length);
  return EEG_DEMO_DATASETS[index] ?? EEG_DEMO_DATASETS[0];
}
