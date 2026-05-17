import { useVideoConsultation } from "@/hooks/useVideoConsultation";
import {
  btnMediaControl,
  btnPrimary,
  onDarkSurface,
  surfaceMuted,
  textOnDark,
  textOnDarkMuted,
  textOnDarkSubtle,
} from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import type { ConsultationConnectionStatus } from "@/types/consultation";
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect } from "react";

function statusLabel(status: ConsultationConnectionStatus): string {
  switch (status) {
    case "idle":
      return "Ready to join";
    case "connecting":
      return "Connecting…";
    case "joined":
      return "Waiting for the other person";
    case "calling":
      return "Connecting video…";
    case "connected":
      return "Live";
    case "disconnected":
      return "Call ended";
    case "error":
      return "Connection problem";
    default:
      return status;
  }
}

export function VideoConsultRoom({
  appointmentId,
  role,
  peerLabel,
  stageClassName,
  onConnectionChange,
  onBeforeLeave,
}: {
  appointmentId: string;
  role: "doctor" | "patient";
  peerLabel: string;
  /** Override default video stage min-height (e.g. split consult layout). */
  stageClassName?: string;
  onConnectionChange?: (connected: boolean) => void;
  onBeforeLeave?: () => void | Promise<void>;
}) {
  const consult = useVideoConsultation(appointmentId);

  useEffect(() => {
    void consult.joinRoom({ polite: role === "patient", autoOffer: role === "doctor" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per appointment
  }, [appointmentId]);

  useEffect(() => {
    onConnectionChange?.(consult.isConnected);
  }, [consult.isConnected, onConnectionChange]);

  async function handleLeave() {
    await onBeforeLeave?.();
    consult.leaveRoom();
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm", surfaceMuted)}>
        <span
          className={cn(
            "inline-flex items-center gap-2 font-medium",
            consult.isConnected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100",
          )}
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              consult.isConnected
                ? "bg-emerald-500"
                : consult.isJoined
                  ? "bg-amber-400"
                  : "bg-slate-400 dark:bg-slate-500",
            ].join(" ")}
            aria-hidden
          />
          {statusLabel(consult.status)}
        </span>
        {consult.isConnected ? (
          <span className="text-xs text-slate-600 dark:text-slate-400">With {peerLabel}</span>
        ) : null}
      </div>

      {consult.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {consult.error}
        </p>
      ) : null}

      {/* Main stage: remote (peer) large; local picture-in-picture */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg",
          onDarkSurface,
          stageClassName ?? "min-h-[min(70vh,640px)]",
        )}
      >
        <video
          ref={consult.attachRemoteVideo}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!consult.isConnected ? (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center",
              onDarkSurface,
            )}
          >
            {consult.status === "connecting" || consult.status === "calling" ? (
              <Loader2 className="h-12 w-12 animate-spin text-teal-400" aria-hidden />
            ) : (
              <Video className={cn("h-12 w-12", textOnDarkSubtle)} aria-hidden />
            )}
            <p className={cn("text-lg font-semibold", textOnDark)}>Waiting for {peerLabel}</p>
            <p className={cn("max-w-sm text-sm leading-relaxed", textOnDarkMuted)}>
              Ask them to open this video visit from their appointment. The call starts automatically when both are
              here.
            </p>
          </div>
        ) : null}
        <span className="absolute left-4 top-4 rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
          {peerLabel}
        </span>

        <div className="absolute bottom-4 right-4 z-10 w-[min(100%,280px)] overflow-hidden rounded-xl border-2 border-white/25 bg-slate-900 shadow-2xl sm:w-72">
          <video
            ref={consult.attachLocalVideo}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full object-cover mirror"
          />
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            You{consult.cameraOff ? " (off)" : ""}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!consult.isJoined ? (
          <button
            type="button"
            onClick={() => void consult.joinRoom({ polite: role === "patient", autoOffer: role === "doctor" })}
            disabled={consult.status === "connecting"}
            className={btnPrimary}
          >
            {consult.status === "connecting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Join video call
          </button>
        ) : (
          <button type="button" onClick={() => void consult.startCall()} className={btnPrimary}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            {role === "doctor" ? "Reconnect" : "Connect"}
          </button>
        )}
        <button
          type="button"
          onClick={consult.toggleMute}
          className={btnMediaControl}
          aria-label={consult.muted ? "Unmute" : "Mute"}
          aria-pressed={consult.muted}
        >
          {consult.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={consult.toggleCamera}
          className={btnMediaControl}
          aria-label={consult.cameraOff ? "Turn camera on" : "Turn camera off"}
          aria-pressed={consult.cameraOff}
        >
          {consult.cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => void handleLeave()}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400"
        >
          <PhoneOff className="h-5 w-5" aria-hidden />
          End call
        </button>
      </div>
    </div>
  );
}
