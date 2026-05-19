import { getMedihubSocketUrl } from "@/lib/config";
import {
  createConsultationSocket,
  joinConsultationRoom,
  leaveConsultationRoom,
} from "@/lib/socket/consultation";
import { getRtcConfiguration } from "@/lib/webrtc/iceServers";
import type {
  ConsultationConnectionStatus,
  WebRtcAnswerPayload,
  WebRtcIcePayload,
  WebRtcOfferPayload,
} from "@/types/consultation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

function matchesAppointment(payload: { appointmentId?: string }, appointmentId: string): boolean {
  return !payload.appointmentId || payload.appointmentId === appointmentId;
}

export function useVideoConsultation(appointmentId: string) {
  const [status, setStatus] = useState<ConsultationConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const politeRef = useRef(false);
  /** Bumps on unmount to cancel in-flight join (React Strict Mode / fast navigation). */
  const joinGenerationRef = useRef(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const attachLocalVideo = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
    }
  }, []);

  const attachRemoteVideo = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
    }
  }, []);

  const stopMedia = useCallback(() => {
    for (const track of localStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    remoteStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const closePeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 960 },
        height: { ideal: 540 },
        frameRate: { ideal: 24, max: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  const emitIce = useCallback(
    (socket: Socket, pc: RTCPeerConnection) => {
      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        socket.emit("webrtc:ice-candidate", {
          appointmentId,
          candidate: ev.candidate.toJSON(),
        } satisfies WebRtcIcePayload);
      };
    },
    [appointmentId],
  );

  const tuneSenderForConsult = useCallback(async (sender: RTCRtpSender, track: MediaStreamTrack) => {
    const params = sender.getParameters();
    params.encodings = params.encodings?.length ? params.encodings : [{}];
    if (track.kind === "video") {
      params.encodings[0].maxBitrate = 650_000;
      params.encodings[0].maxFramerate = 24;
      params.degradationPreference = "maintain-framerate";
    } else if (track.kind === "audio") {
      params.encodings[0].maxBitrate = 64_000;
    }
    try {
      await sender.setParameters(params);
    } catch {
      /* Some browsers reject sender tuning after negotiation starts. */
    }
  }, []);

  const ensurePeerConnection = useCallback(
    async (socket: Socket) => {
      if (pcRef.current) return pcRef.current;

      const stream = await ensureLocalMedia();
      const pc = new RTCPeerConnection(getRtcConfiguration());
      pcRef.current = pc;

      for (const track of stream.getTracks()) {
        const sender = pc.addTrack(track, stream);
        void tuneSenderForConsult(sender, track);
      }

      pc.ontrack = (ev) => {
        const [remote] = ev.streams;
        if (!remote) return;
        remoteStreamRef.current = remote;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
        }
        setStatus("connected");
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setError(null);
          setStatus("connected");
        }
        if (s === "connecting" || s === "disconnected") {
          setStatus("calling");
        }
        if (s === "failed") {
          setError("Peer connection lost.");
          setStatus("error");
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          try {
            pc.restartIce();
          } catch {
            /* Older browsers may not support ICE restart. */
          }
        }
      };

      emitIce(socket, pc);
      return pc;
    },
    [emitIce, ensureLocalMedia, tuneSenderForConsult],
  );

  const sendOffer = useCallback(
    async (socket: Socket) => {
      const pc = await ensurePeerConnection(socket);
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", {
          appointmentId,
          offer: pc.localDescription?.toJSON() ?? offer,
        } satisfies WebRtcOfferPayload);
        setStatus("calling");
      } finally {
        makingOfferRef.current = false;
      }
    },
    [appointmentId, ensurePeerConnection],
  );

  const handleRemoteOffer = useCallback(
    async (socket: Socket, payload: WebRtcOfferPayload) => {
      if (!matchesAppointment(payload, appointmentId) || !payload.offer) return;

      const pc = await ensurePeerConnection(socket);
      const offerCollision = makingOfferRef.current || pc.signalingState !== "stable";
      ignoreOfferRef.current = !politeRef.current && offerCollision;

      if (ignoreOfferRef.current) return;

      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", {
        appointmentId,
        answer: pc.localDescription?.toJSON() ?? answer,
      } satisfies WebRtcAnswerPayload);
      setStatus("calling");
    },
    [appointmentId, ensurePeerConnection],
  );

  const handleRemoteAnswer = useCallback(
    async (payload: WebRtcAnswerPayload) => {
      if (!matchesAppointment(payload, appointmentId) || !payload.answer) return;
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      setStatus("connected");
    },
    [appointmentId],
  );

  const handleRemoteIce = useCallback(
    async (payload: WebRtcIcePayload) => {
      if (!matchesAppointment(payload, appointmentId) || !payload.candidate) return;
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch {
        /* ignore stale candidates */
      }
    },
    [appointmentId],
  );

  const bindSignaling = useCallback(
    (socket: Socket) => {
      socket.on("webrtc:offer", (payload: WebRtcOfferPayload) => {
        void handleRemoteOffer(socket, payload);
      });
      socket.on("webrtc:answer", (payload: WebRtcAnswerPayload) => {
        void handleRemoteAnswer(payload);
      });
      socket.on("webrtc:ice-candidate", (payload: WebRtcIcePayload) => {
        void handleRemoteIce(payload);
      });

      const peerJoinedEvents = [
        "consultation:peer-joined",
        "consultation:user-joined",
        "consultation:participant-joined",
      ] as const;
      for (const evt of peerJoinedEvents) {
        socket.on(evt, () => {
          if (!pcRef.current || pcRef.current.signalingState === "stable") {
            void sendOffer(socket);
          }
        });
      }
    },
    [handleRemoteAnswer, handleRemoteIce, handleRemoteOffer, sendOffer],
  );

  const teardownSocket = useCallback(
    (socket: Socket, notifyLeave: boolean) => {
      socket.removeAllListeners();
      if (notifyLeave && socket.connected) {
        leaveConsultationRoom(socket, appointmentId);
      }
      if (socket.connected || socket.active) {
        socket.disconnect();
      }
    },
    [appointmentId],
  );

  const joinRoom = useCallback(
    async (options?: { polite?: boolean; autoOffer?: boolean }) => {
      if (!appointmentId) return;
      const generation = ++joinGenerationRef.current;
      setError(null);
      setStatus("connecting");
      politeRef.current = options?.polite ?? false;

      const previous = socketRef.current;
      if (previous) {
        teardownSocket(previous, true);
        socketRef.current = null;
      }

      const socket = await createConsultationSocket();
      socketRef.current = socket;

      bindSignaling(socket);

      try {
        await new Promise<void>((resolve, reject) => {
          const onConnect = () => {
            socket.off("connect_error", onError);
            resolve();
          };
          const onError = (err: Error) => {
            socket.off("connect", onConnect);
            const host = getMedihubSocketUrl() || "the API server";
            reject(
              new Error(
                `Cannot reach the consultation server (${host}). ${err.message}. Ensure the backend is running, exposes Socket.IO, and allows your dev origin in CORS.`,
              ),
            );
          };
          if (socket.connected) {
            resolve();
            return;
          }
          socket.once("connect", onConnect);
          socket.once("connect_error", onError);
        });

        if (generation !== joinGenerationRef.current) {
          teardownSocket(socket, false);
          return;
        }

        const ack = await joinConsultationRoom(socket, appointmentId);
        if (generation !== joinGenerationRef.current) {
          teardownSocket(socket, false);
          return;
        }

        setRoomName(ack.roomName ?? `appointment:${appointmentId}`);
        setStatus("joined");

        if (options?.autoOffer) {
          await sendOffer(socket);
        }
      } catch (err) {
        teardownSocket(socket, false);
        socketRef.current = null;
        setStatus("disconnected");
        setError(err instanceof Error ? err.message : "Could not connect to the consultation server.");
        throw err;
      }
    },
    [appointmentId, bindSignaling, sendOffer, teardownSocket],
  );

  const startCall = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      await joinRoom({ polite: false, autoOffer: true });
      return;
    }
    await sendOffer(socket);
  }, [joinRoom, sendOffer]);

  const leaveRoom = useCallback(() => {
    joinGenerationRef.current += 1;
    const socket = socketRef.current;
    if (socket) {
      teardownSocket(socket, true);
    }
    socketRef.current = null;
    closePeer();
    stopMedia();
    setRoomName(null);
    setStatus("disconnected");
  }, [appointmentId, closePeer, stopMedia, teardownSocket]);

  const toggleMute = useCallback(() => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (!audio) return;
    audio.enabled = !audio.enabled;
    setMuted(!audio.enabled);
  }, []);

  const toggleCamera = useCallback(() => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (!video) return;
    video.enabled = !video.enabled;
    setCameraOff(!video.enabled);
  }, []);

  useEffect(() => {
    return () => {
      joinGenerationRef.current += 1;
      const socket = socketRef.current;
      if (socket) {
        teardownSocket(socket, true);
      }
      socketRef.current = null;
      closePeer();
      stopMedia();
    };
  }, [appointmentId, closePeer, stopMedia, teardownSocket]);

  return {
    status,
    error,
    roomName,
    muted,
    cameraOff,
    joinRoom,
    startCall,
    leaveRoom,
    toggleMute,
    toggleCamera,
    attachLocalVideo,
    attachRemoteVideo,
    isJoined: status === "joined" || status === "calling" || status === "connected",
    isConnected: status === "connected",
  };
}
