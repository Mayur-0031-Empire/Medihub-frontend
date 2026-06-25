import { PageLoader } from "@/components/common/PageLoader";
import { predictEegStress, type EegStressPrediction, type StressLevel } from "@/lib/api";
import { pickRandomDemoDataset, type EegDemoDataset } from "@/lib/eeg/demoDatasets";
import { userFacingError } from "@/lib/userMessages";
import { Activity, Brain, Play, Square, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SAMPLE_RATE = 128;
const SERIAL_SAMPLE_RATE = 512;
const SERIAL_BAUD_RATE = 57600;
const BUFFER_SIZE = 512;
const PREDICT_WINDOW = 256;
const DEMO_CHUNK_SIZE = 8;

function stressColor(level?: StressLevel): string {
  if (level === "High") return "bg-red-500";
  if (level === "Medium") return "bg-amber-400";
  return "bg-teal-500";
}

function stressPercent(prediction: EegStressPrediction | null): number {
  if (!prediction) return 0;
  if (typeof prediction.score === "number") return Math.max(0, Math.min(100, prediction.score));
  const base = prediction.stressLevel === "High" ? 82 : prediction.stressLevel === "Medium" ? 55 : 24;
  return Math.round(base * Math.max(0.35, Math.min(1, prediction.confidence || 0.7)));
}

function pointsFor(samples: number[], width = 720, height = 240): string {
  if (samples.length === 0) return "";
  const visible = samples.slice(-BUFFER_SIZE);
  const maxAbs = Math.max(20, ...visible.map((v) => Math.abs(v)));
  return visible
    .map((value, index) => {
      const x = (index / Math.max(1, visible.length - 1)) * width;
      const y = height / 2 - (value / maxAbs) * (height * 0.42);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

type ThinkGearPacket = {
  raw: number[];
  attention?: number;
  meditation?: number;
  poorSignal?: number;
};

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
      if (code === 0x80 && data.length === 2) {
        packet.raw.push(signedInt16(data[0], data[1]));
      }
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
    const expected = (~sum) & 0xff;
    pending.splice(0, frameLength);

    if (checksum === expected) {
      packets.push(parsePayload(payload));
    }
  }

  return packets;
}

export function StressMonitorPage() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  const [running, setRunning] = useState(false);
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialStatus, setSerialStatus] = useState("Use Chrome or Edge on desktop, pair the headset first, then connect.");
  const [samples, setSamples] = useState<number[]>([]);
  const [prediction, setPrediction] = useState<EegStressPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [activeDemo, setActiveDemo] = useState<EegDemoDataset | null>(null);
  const [sampleRate, setSampleRate] = useState(SAMPLE_RATE);
  const [attention, setAttention] = useState<number | null>(null);
  const [meditation, setMeditation] = useState<number | null>(null);
  const [poorSignal, setPoorSignal] = useState<number | null>(null);

  const samplesRef = useRef<number[]>([]);
  const predictingRef = useRef(false);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);
  const serialPendingRef = useRef<number[]>([]);
  const serialStopRef = useRef(false);
  const attentionRef = useRef<number | null>(null);
  const meditationRef = useRef<number | null>(null);
  const poorSignalRef = useRef<number | null>(null);
  const demoCursorRef = useRef(0);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

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
    setSerialStatus(`Demo: ${dataset.name} — ${dataset.description}`);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || !activeDemo) return;
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
  }, [running, activeDemo]);

  useEffect(() => {
    if (!running && !serialConnected) return;
    const id = window.setInterval(async () => {
      if (predictingRef.current) return;
      const windowSamples = samplesRef.current.slice(-PREDICT_WINDOW);
      if (windowSamples.length < 64) return;
      predictingRef.current = true;
      setPredicting(true);
      setError(null);
      try {
        const payload = await predictEegStress({
          samples: windowSamples,
          appointmentId,
          attention: attentionRef.current,
          meditation: meditationRef.current,
          poorSignal: poorSignalRef.current ?? 0,
          sampleRate,
        });
        setPrediction(payload.prediction);
      } catch (err) {
        setError(userFacingError(err, "Could not predict stress level."));
      } finally {
        predictingRef.current = false;
        setPredicting(false);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, serialConnected, appointmentId, sampleRate]);

  const disconnectSerial = async () => {
    serialStopRef.current = true;
    try {
      await serialReaderRef.current?.cancel?.();
    } catch (_error) {
      // The reader can already be closed by the browser.
    }
    try {
      serialReaderRef.current?.releaseLock?.();
    } catch (_error) {
      // Ignore release failures from already-released readers.
    }
    try {
      await serialPortRef.current?.close?.();
    } catch (_error) {
      // Ignore close failures from already-closed ports.
    }
    serialReaderRef.current = null;
    serialPortRef.current = null;
    serialPendingRef.current = [];
    setSerialConnected(false);
    setSampleRate(SAMPLE_RATE);
    setSerialStatus("Headset disconnected.");
  };

  const connectSerial = async () => {
    const serial = (navigator as any).serial;
    if (!serial) {
      setError("Direct headset connection needs Web Serial. Use desktop Chrome or Edge over http://localhost/127.0.0.1.");
      return;
    }

    setError(null);
    stopDemo();
    setSamples([]);
    setPrediction(null);
    setSerialStatus("Select the MindWave/NeuroSky COM port from the browser prompt.");

    try {
      const port = await serial.requestPort();
      await port.open({ baudRate: SERIAL_BAUD_RATE });
      serialPortRef.current = port;
      serialStopRef.current = false;
      setSampleRate(SERIAL_SAMPLE_RATE);
      setSerialConnected(true);
      setSerialStatus("Connected. Waiting for raw EEG samples...");

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
              setSerialStatus(`Live headset stream: ${rawSamples.length} new sample${rawSamples.length === 1 ? "" : "s"}.`);
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("No port selected") || (err as { name?: string })?.name === "NotFoundError") {
        setSerialStatus("Connection cancelled. Click Connect headset again and select the MindWave/NeuroSky COM port from the browser popup.");
      } else {
        setError(userFacingError(err, "Could not connect to the headset serial port."));
      }
    } finally {
      await disconnectSerial();
    }
  };

  const points = useMemo(() => pointsFor(samples), [samples]);
  const percent = stressPercent(prediction);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-7 w-7 text-teal-600" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">EEG stress monitor</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Stream NeuroSky single-channel EEG samples, visualize the waveform, and estimate stress with the MediHub EEG model.
            This is a wellness estimate, not a medical diagnosis.
          </p>
          {appointmentId ? (
            <p className="mt-2 max-w-2xl rounded-xl bg-teal-50 px-3 py-2 text-xs leading-relaxed text-teal-900">
              Consultation mode: predictions are linked to appointment <span className="font-mono">{appointmentId}</span> so your
              doctor can view them live during the visit.
            </p>
          ) : null}
          <p className="mt-2 max-w-2xl rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            Start demo picks one of 18 preset EEG recordings at random. For a real headset, pair it in Windows first, then use
            Connect headset in Chrome or Edge.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={serialConnected ? disconnectSerial : connectSerial}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {serialConnected ? <Square className="h-4 w-4" aria-hidden /> : <Activity className="h-4 w-4" aria-hidden />}
            {serialConnected ? "Disconnect headset" : "Connect headset"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (running) {
                stopDemo();
                return;
              }
              startDemo();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            {running ? <Square className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {running ? "Stop demo" : "Start demo"}
          </button>
        </div>
      </div>

      {activeDemo ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-sm text-teal-950">
          <p className="font-semibold">Active demo: {activeDemo.name}</p>
          <p className="mt-1 text-xs text-teal-900">{activeDemo.description}</p>
          <p className="mt-2 text-xs text-teal-800">
            Typical profile: {activeDemo.expectedStress} stress · attention {activeDemo.attention} · meditation{" "}
            {activeDemo.meditation}
            {activeDemo.poorSignal > 0 ? ` · poor signal ${activeDemo.poorSignal}` : ""}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Activity className="h-4 w-4 text-teal-600" aria-hidden />
              Raw EEG waveform
            </div>
            <span className="text-xs text-slate-500">{samples.length} samples buffered</span>
          </div>
          <div className="bg-slate-950 p-3">
            <svg viewBox="0 0 720 240" className="h-64 w-full" role="img" aria-label="Live EEG waveform chart">
              <line x1="0" x2="720" y1="120" y2="120" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
              <polyline points={points} fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" aria-hidden />
            <h2 className="font-semibold text-slate-900">Stress estimate</h2>
          </div>
          <div className="mt-5">
            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full ${stressColor(prediction?.stressLevel)} transition-all duration-300`} style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">{prediction?.stressLevel ?? "Waiting"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{prediction?.label ?? "No prediction yet"}</p>
              </div>
              <p className="text-sm font-semibold text-slate-600">{percent}%</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Confidence</dt>
              <dd className="font-semibold text-slate-900">{prediction ? `${Math.round(prediction.confidence * 100)}%` : "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Attention</dt>
              <dd className="font-semibold text-slate-900">{attention ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Meditation</dt>
              <dd className="font-semibold text-slate-900">{meditation ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Poor signal</dt>
              <dd className="font-semibold text-slate-900">{poorSignal ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Source</dt>
              <dd className="font-semibold capitalize text-slate-900">{prediction?.source ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Sample rate</dt>
              <dd className="font-semibold text-slate-900">{sampleRate} Hz</dd>
            </div>
          </dl>

          <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">{serialStatus}</p>
          {predicting ? <PageLoader label="Predicting..." className="mt-5" /> : null}
          {prediction?.message ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">{prediction.message}</p> : null}
          {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}
