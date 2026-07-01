import {
  fetchAppointmentEegStress,
  fetchEegModelStatus,
  predictEegStress,
  type EegModelStatus,
  type EegStressPayload,
  type EegStressPrediction,
  type StressLevel,
} from "@/lib/api";
import { pickRandomDemoDataset, type EegDemoDataset } from "@/lib/eeg/demoDatasets";
import { userFacingError } from "@/lib/userMessages";
import { Activity, Brain, Loader2, Play, Square, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLE_RATE = 128;
const SERIAL_SAMPLE_RATE = 512;
const SERIAL_BAUD_RATE = 57600;
const BUFFER_SIZE = 256;
const PREDICT_WINDOW = 256;
const DEMO_CHUNK_SIZE = 8;

type ThinkGearPacket = {
  raw: number[];
  attention?: number;
  meditation?: number;
  poorSignal?: number;
};

function stressColor(level?: StressLevel): string {
  if (level === "High") return "bg-red-500";
  if (level === "Medium") return "bg-amber-400";
  return "bg-teal-500";
}

function stressPercent(prediction: EegStressPrediction | null | undefined): number {
  if (!prediction) return 0;
  if (typeof prediction.score === "number") return Math.max(0, Math.min(100, prediction.score));
  const base = prediction.stressLevel === "High" ? 82 : prediction.stressLevel === "Medium" ? 55 : 24;
  return Math.round(base * Math.max(0.35, Math.min(1, prediction.confidence || 0.7)));
}

function pointsFor(samples: number[], width = 420, height = 118): string {
  const visible = samples.slice(-BUFFER_SIZE);
  if (visible.length === 0) return "";
  const maxAbs = Math.max(20, ...visible.map((value) => Math.abs(value)));
  return visible
    .map((value, index) => {
      const x = (index / Math.max(1, visible.length - 1)) * width;
      const y = height / 2 - (value / maxAbs) * (height * 0.4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function signedInt16(msb: number, lsb: number): number {
  const value = (msb << 8) | lsb;
  return value > 32767 ? value - 65536 : value;
}

function parsePayload(payload: number[]): ThinkGearPacket {
  const packet: ThinkGearPacket = { raw: [] };
  let index = 0;

  while (index < payload.length) {
    const code = payload[index++];
    if (code >= 0x80) {
      const length = payload[index++];
      const data = payload.slice(index, index + length);
      index += length;
      if (code === 0x80 && data.length === 2) packet.raw.push(signedInt16(data[0], data[1]));
      continue;
    }

    const value = payload[index++];
    if (code === 0x02) packet.poorSignal = value;
    if (code === 0x04) packet.attention = value;
    if (code === 0x05) packet.meditation = value;
  }

  return packet;
}

function parseThinkGearBytes(pending: number[], bytes: Uint8Array): ThinkGearPacket[] {
  pending.push(...bytes);
  const packets: ThinkGearPacket[] = [];

  while (pending.length >= 4) {
    const syncIndex = pending.findIndex((value, index) => value === 0xaa && pending[index + 1] === 0xaa);
    if (syncIndex < 0) {
      pending.splice(0, Math.max(0, pending.length - 1));
      break;
    }
    if (syncIndex > 0) pending.splice(0, syncIndex);
    if (pending.length < 4) break;

    const payloadLength = pending[2];
    if (payloadLength > 169) {
      pending.shift();
      continue;
    }

    const frameLength = payloadLength + 4;
    if (pending.length < frameLength) break;

    const payload = pending.slice(3, 3 + payloadLength);
    const checksum = pending[3 + payloadLength];
    const sum = payload.reduce((total, value) => (total + value) & 0xff, 0);
    pending.splice(0, frameLength);

    if (checksum === (~sum & 0xff)) packets.push(parsePayload(payload));
  }

  return packets;
}

export function ConsultStressPanel({
  appointmentId,
  role,
  live,
}: {
  appointmentId: string;
  role: "patient" | "doctor";
  live?: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [serialConnected, setSerialConnected] = useState(false);
  const [status, setStatus] = useState(
    role === "patient" ? "Connect headset or start demo to share stress data." : "Waiting for patient stress stream.",
  );
  const [samples, setSamples] = useState<number[]>([]);
  const [prediction, setPrediction] = useState<EegStressPrediction | null>(null);
  const [payload, setPayload] = useState<EegStressPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<EegModelStatus | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [activeDemo, setActiveDemo] = useState<EegDemoDataset | null>(null);
  const [sampleRate, setSampleRate] = useState(SAMPLE_RATE);
  const [attention, setAttention] = useState<number | null>(null);
  const [meditation, setMeditation] = useState<number | null>(null);
  const [poorSignal, setPoorSignal] = useState<number | null>(null);

  const samplesRef = useRef<number[]>([]);
  const predictingRef = useRef(false);
  const demoCursorRef = useRef(0);
  const attentionRef = useRef<number | null>(null);
  const meditationRef = useRef<number | null>(null);
  const poorSignalRef = useRef<number | null>(null);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);
  const serialPendingRef = useRef<number[]>([]);
  const serialStopRef = useRef(false);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  const displaySamples = role === "doctor" ? payload?.samples ?? [] : samples;
  const displayPrediction = role === "doctor" ? payload?.prediction : prediction;
  const displayMetadata = role === "doctor" ? payload?.metadata : null;
  const percent = stressPercent(displayPrediction);
  const points = useMemo(() => pointsFor(displaySamples), [displaySamples]);
  const modelReady = modelStatus?.status === "ready";
  const modelMessage = modelStatus?.message ?? "Model is loading.";

  const appendSamples = (incoming: number[]) => {
    if (incoming.length === 0) return;
    setSamples((prev) => [...prev, ...incoming].slice(-BUFFER_SIZE));
  };

  const stopDemo = () => {
    setRunning(false);
    setActiveDemo(null);
    demoCursorRef.current = 0;
    setSampleRate(SAMPLE_RATE);
  };

  const startDemo = () => {
    if (serialConnected) void disconnectSerial();
    const dataset = pickRandomDemoDataset();
    setActiveDemo(dataset);
    demoCursorRef.current = 0;
    setSamples([]);
    setPrediction(null);
    setError(null);
    attentionRef.current = dataset.attention;
    meditationRef.current = dataset.meditation;
    poorSignalRef.current = dataset.poorSignal;
    setAttention(dataset.attention);
    setMeditation(dataset.meditation);
    setPoorSignal(dataset.poorSignal);
    setSampleRate(SAMPLE_RATE);
    setStatus(`Demo running: ${dataset.name}`);
    setRunning(true);
  };

  const disconnectSerial = async () => {
    serialStopRef.current = true;
    try {
      await serialReaderRef.current?.cancel?.();
    } catch {
      // Already closed by the browser.
    }
    try {
      serialReaderRef.current?.releaseLock?.();
    } catch {
      // Ignore released readers.
    }
    try {
      await serialPortRef.current?.close?.();
    } catch {
      // Ignore closed ports.
    }
    serialReaderRef.current = null;
    serialPortRef.current = null;
    serialPendingRef.current = [];
    setSerialConnected(false);
    setSampleRate(SAMPLE_RATE);
    setStatus("Headset disconnected.");
  };

  const connectSerial = async () => {
    const serial = (navigator as any).serial;
    if (!serial) {
      setError("Direct headset connection needs desktop Chrome or Edge.");
      return;
    }

    setError(null);
    stopDemo();
    setSamples([]);
    setPrediction(null);
    setStatus("Select the MindWave/NeuroSky COM port from the browser prompt.");

    try {
      const rememberedPorts = await serial.getPorts?.();
      const port = rememberedPorts?.length === 1 ? rememberedPorts[0] : await serial.requestPort();
      await port.open({ baudRate: SERIAL_BAUD_RATE });
      serialPortRef.current = port;
      serialStopRef.current = false;
      setSampleRate(SERIAL_SAMPLE_RATE);
      setSerialConnected(true);
      setStatus("Connected. Waiting for raw EEG samples...");

      while (port.readable && !serialStopRef.current) {
        const reader = port.readable.getReader();
        serialReaderRef.current = reader;
        try {
          while (true) {
            if (serialStopRef.current) break;
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;
            const packets = parseThinkGearBytes(serialPendingRef.current, value);
            const rawSamples: number[] = [];
            for (const packet of packets) {
              rawSamples.push(...packet.raw);
              if (typeof packet.attention === "number") {
                attentionRef.current = packet.attention;
                setAttention(packet.attention);
              }
              if (typeof packet.meditation === "number") {
                meditationRef.current = packet.meditation;
                setMeditation(packet.meditation);
              }
              if (typeof packet.poorSignal === "number") {
                poorSignalRef.current = packet.poorSignal;
                setPoorSignal(packet.poorSignal);
              }
            }
            if (rawSamples.length > 0) {
              appendSamples(rawSamples);
              setStatus(`Live headset stream: ${rawSamples.length} new samples.`);
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("No port selected") || (err as { name?: string })?.name === "NotFoundError") {
        setStatus("Connection cancelled. Click Connect headset again and select the headset COM port.");
      } else {
        setError(userFacingError(err, "Could not connect to the headset serial port."));
      }
    } finally {
      if (serialPortRef.current || serialConnected) await disconnectSerial();
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const data = await fetchEegModelStatus();
        if (!cancelled) setModelStatus(data);
      } catch (err) {
        if (!cancelled) {
          setModelStatus({ status: "error", message: userFacingError(err, "Could not load EEG model status.") });
        }
      }
    }

    void loadStatus();
    const id = window.setInterval(() => void loadStatus(), modelReady ? 15000 : 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [modelReady]);

  useEffect(() => {
    if (role !== "patient" || !running || !activeDemo) return;
    const id = window.setInterval(() => {
      const source = activeDemo.samples;
      const chunk: number[] = [];
      for (let i = 0; i < DEMO_CHUNK_SIZE; i++) {
        chunk.push(source[demoCursorRef.current % source.length]);
        demoCursorRef.current += 1;
      }
      appendSamples(chunk);
    }, 62);
    return () => window.clearInterval(id);
  }, [activeDemo, role, running]);

  useEffect(() => {
    if (role !== "patient" || (!running && !serialConnected)) return;
    const id = window.setInterval(async () => {
      if (predictingRef.current) return;
      const windowSamples = samplesRef.current.slice(-PREDICT_WINDOW);
      if (windowSamples.length < 64) return;
      predictingRef.current = true;
      setPredicting(true);
      setError(null);
      try {
        const result = await predictEegStress({
          samples: windowSamples,
          appointmentId,
          attention: attentionRef.current,
          meditation: meditationRef.current,
          poorSignal: poorSignalRef.current ?? 0,
          sampleRate,
        });
        setPrediction(result.prediction);
      } catch (err) {
        setError(userFacingError(err, "Could not predict stress level."));
      } finally {
        predictingRef.current = false;
        setPredicting(false);
      }
    }, 1500);
    return () => window.clearInterval(id);
  }, [appointmentId, role, running, sampleRate, serialConnected]);

  useEffect(() => {
    if (role !== "doctor") return;
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchAppointmentEegStress(appointmentId);
        if (cancelled) return;
        setPayload(data);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(userFacingError(err, "Could not load patient stress data."));
      }
    }
    void load();
    const id = window.setInterval(() => void load(), live ? 2500 : 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [appointmentId, live, role]);

  useEffect(() => {
    return () => {
      if (serialConnected) void disconnectSerial();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only
  }, [serialConnected]);

  return (
    <section className="rounded-2xl border border-teal-200/80 bg-white p-4 shadow-sm dark:border-teal-900/60 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Brain className="h-4 w-4 text-teal-600" aria-hidden />
            Live stress analysis
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {role === "patient"
              ? "Start analysis here so the doctor can see your stress level during the call."
              : "Live patient stress data appears here when the patient starts analysis."}
          </p>
        </div>
        {role === "patient" ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={serialConnected ? disconnectSerial : connectSerial}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {serialConnected ? <Square className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
              {serialConnected ? "Disconnect" : "Connect headset"}
            </button>
            <button
              type="button"
              onClick={() => (running ? stopDemo() : startDemo())}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              {running ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {running ? "Stop demo" : "Start analysis"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-xs font-semibold text-white">EEG waveform</span>
            <span className="text-[11px] text-slate-300">{displaySamples.length} samples</span>
          </div>
          <svg viewBox="0 0 420 118" className="h-32 w-full">
            <line x1="0" x2="420" y1="59" y2="59" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
            <polyline points={points} fill="none" stroke="#2dd4bf" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              Estimate
            </span>
            {predicting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" aria-hidden /> : null}
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white dark:bg-slate-800">
            <div className={`h-full ${stressColor(displayPrediction?.stressLevel)} transition-all`} style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{displayPrediction?.stressLevel ?? "Waiting"}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {displayPrediction?.label ?? "No prediction yet"}
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{percent}%</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <span>Attention: {role === "doctor" ? displayMetadata?.attention ?? "-" : attention ?? "-"}</span>
            <span>Meditation: {role === "doctor" ? displayMetadata?.meditation ?? "-" : meditation ?? "-"}</span>
            <span>Signal: {role === "doctor" ? displayMetadata?.poorSignal ?? "-" : poorSignal ?? "-"}</span>
            <span>Rate: {role === "doctor" ? displayMetadata?.sampleRate ?? "-" : sampleRate} Hz</span>
          </div>
        </div>
      </div>

      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {role === "doctor" && payload?.metadata?.receivedAt
          ? `Updated ${new Date(payload.metadata.receivedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
          : `${status}${modelReady ? " Model is ready to predict." : ` ${modelMessage}`}`}
      </p>
      {displayPrediction?.message ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {displayPrediction.message}
        </p>
      ) : null}
      {error ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950/50 dark:text-red-200">{error}</p> : null}
    </section>
  );
}
