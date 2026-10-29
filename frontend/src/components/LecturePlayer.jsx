import React, { useRef, useState, useEffect, useCallback } from 'react';
import { progressApi } from '../api/client.js';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS = [0, 15, 30, 45, 60]; // minutes, 0 = off

export default function LecturePlayer({
  lecture,
  initialPosition = 0,
  onEnded = null,
  isAuthenticated = false,
}) {
  const mediaRef = useRef(null);
  const containerRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState(0); // seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSkipFeedback, setShowSkipFeedback] = useState(null); // -15, +15, -5, +5

  const isAudio = lecture.type === 'audio';

  // ---------- Media events ----------
  const onLoadedMetadata = () => {
    const media = mediaRef.current;
    if (!media) return;
    setDuration(media.duration || 0);
    if (initialPosition > 0 && initialPosition < media.duration) {
      media.currentTime = initialPosition;
    }
    media.playbackRate = speed;
  };

  const onTimeUpdate = () => {
    const media = mediaRef.current;
    if (!media) return;
    setCurrentTime(media.currentTime);
  };

  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onEndedMedia = () => {
    setPlaying(false);
    if (onEnded) onEnded();
  };

  // ---------- Controls ----------
  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) media.play();
    else media.pause();
  }, []);

  const seek = useCallback((seconds) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(media.duration, media.currentTime + seconds));
    showFeedback(seconds > 0 ? `+${seconds}` : `${seconds}`);
  }, []);

  const showFeedback = (text) => {
    setShowSkipFeedback(text);
    setTimeout(() => setShowSkipFeedback(null), 700);
  };

  const setPlaybackSpeed = (s) => {
    setSpeed(s);
    if (mediaRef.current) mediaRef.current.playbackRate = s;
    setShowSpeedMenu(false);
  };

  const changeVolume = (v) => {
    setVolume(v);
    setMuted(v === 0);
    if (mediaRef.current) {
      mediaRef.current.volume = v;
      mediaRef.current.muted = v === 0;
    }
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !media.muted;
    setMuted(media.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ---------- Progress bar click ----------
  const progressRef = useRef(null);
  const handleProgressClick = (e) => {
    const media = mediaRef.current;
    if (!media || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    media.currentTime = percent * media.duration;
  };

  // ---------- Sleep timer ----------
  useEffect(() => {
    if (sleepRemaining <= 0) return;
    const interval = setInterval(() => {
      setSleepRemaining((s) => {
        if (s <= 1) {
          if (mediaRef.current) mediaRef.current.pause();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepRemaining]);

  const startSleep = (minutes) => {
    setShowSleepMenu(false);
    if (minutes === 0) {
      setSleepRemaining(0);
      return;
    }
    setSleepRemaining(minutes * 60);
  };

  // ---------- Heartbeat (save progress every 10s) ----------
  useEffect(() => {
    if (!isAuthenticated || !lecture) return;
    let lastTime = 0;

    const interval = setInterval(() => {
      const media = mediaRef.current;
      if (!media || media.paused || media.ended) return;
      const current = media.currentTime;
      if (Math.abs(current - lastTime) < 1) return;

      progressApi.heartbeat(lecture.id, {
        positionSeconds: current,
        rangeStart: lastTime,
        rangeEnd: current,
        durationSeconds: media.duration || lecture.durationSeconds,
      }).catch(() => {});

      lastTime = current;
    }, 10000);

    return () => clearInterval(interval);
  }, [lecture, isAuthenticated]);

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    const handler = (e) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(15);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-15);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          if (!isAudio) toggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, seek, volume, isAudio, toggleFullscreen]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className={`relative overflow-hidden rounded-3xl bg-[#073A35] shadow-2xl ${
        isFullscreen ? 'w-full h-full' : ''
      }`}
    >
      {/* Video element (hidden for audio) */}
      {!isAudio && (
        <video
          ref={mediaRef}
          src={lecture.mediaUrl}
          className={`w-full ${isFullscreen ? 'h-full object-contain' : 'aspect-video'}`}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEndedMedia}
          onClick={togglePlay}
          playsInline
        />
      )}

      {/* Audio element (hidden) */}
      {isAudio && (
        <audio
          ref={mediaRef}
          src={lecture.mediaUrl}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEndedMedia}
        />
      )}

      {/* Audio visual cover (large, when audio) */}
      {isAudio && !isFullscreen && (
        <div className="relative p-10 sm:p-16 text-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #50D3B8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-[#0D9E84] to-[#087A4D] text-white shadow-[0_0_60px_rgba(13,158,132,0.5)]">
              <HeadphonesIcon className="h-14 w-14" />
            </div>
            <p className="mt-6 text-xs text-[#8BCBBC]">درس صوتي</p>
            <h2 className="mt-2 font-amiri text-2xl font-bold text-white line-clamp-2">
              {lecture.titleArabic || lecture.title}
            </h2>
            <p className="mt-2 text-xs text-[#5DD8C0]">
              {lecture.bookArabic || lecture.book}
            </p>
          </div>
        </div>
      )}

      {/* Skip feedback overlay */}
      {showSkipFeedback && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/60 px-6 py-3 text-white font-bold text-lg backdrop-blur-sm animate-pulse">
            {showSkipFeedback}
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className={`${isAudio ? '' : 'absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent'} p-4`}>
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/20 hover:h-2.5 transition-all"
        >
          <div
            className="absolute inset-y-0 right-0 rounded-full bg-[#0D9E84]"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition"
            style={{ right: `calc(${progressPercent}% - 8px)` }}
          />
        </div>

        {/* Time + buttons */}
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs text-white/80 font-mono" dir="ltr">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span className="text-white/50">{formatTime(duration)}</span>
          </div>

          {/* Main controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Prev 5s */}
            <button
              onClick={() => seek(-5)}
              className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition"
              title="رجوع 5 ثوان"
            >
              <RewindIcon />
            </button>

            {/* Prev 15s */}
            <button
              onClick={() => seek(-15)}
              className="grid h-10 w-10 place-items-center rounded-full text-white/90 hover:bg-white/10 hover:text-white transition"
              title="رجوع 15 ثانية"
            >
              <Rewind15Icon />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#073A35] shadow-lg hover:scale-105 transition-transform"
              title={playing ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Next 15s */}
            <button
              onClick={() => seek(15)}
              className="grid h-10 w-10 place-items-center rounded-full text-white/90 hover:bg-white/10 hover:text-white transition"
              title="تقدّم 15 ثانية"
            >
              <Forward15Icon />
            </button>

            {/* Next 5s */}
            <button
              onClick={() => seek(5)}
              className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition"
              title="تقدّم 5 ثوان"
            >
              <ForwardIcon />
            </button>
          </div>

          {/* Right side: speed, sleep, volume, fullscreen */}
          <div className="flex items-center gap-1">
            {/* Sleep timer */}
            <div className="relative">
              <button
                onClick={() => setShowSleepMenu((s) => !s)}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                  sleepRemaining > 0
                    ? 'bg-[#0D9E84] text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="مؤقت النوم"
              >
                <SleepIcon />
                {sleepRemaining > 0 && (
                  <span className="font-mono" dir="ltr">
                    {formatTime(sleepRemaining)}
                  </span>
                )}
              </button>
              {showSleepMenu && (
                <div className="absolute bottom-full mb-2 right-0 rounded-xl bg-white shadow-2xl border border-[#E0E8E5] p-2 min-w-[140px] z-20">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-[#9AAEAA]">مؤقت النوم</p>
                  {SLEEP_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => startSleep(m)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-right text-xs font-bold transition ${
                        sleepRemaining === m * 60
                          ? 'bg-[#EAF7F3] text-[#0B8D77]'
                          : 'text-[#4A5F5A] hover:bg-[#F8FBFA]'
                      }`}
                    >
                      {m === 0 ? 'إيقاف' : `${m} دقيقة`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((s) => !s)}
                className="rounded-lg px-2 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition"
                title="سرعة التشغيل"
              >
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 right-0 rounded-xl bg-white shadow-2xl border border-[#E0E8E5] p-2 min-w-[100px] z-20">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        speed === s
                          ? 'bg-[#EAF7F3] text-[#0B8D77]'
                          : 'text-[#4A5F5A] hover:bg-[#F8FBFA]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition"
                title={muted ? 'إلغاء الكتم' : 'كتم الصوت'}
              >
                {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-20 accent-[#0D9E84]"
              />
            </div>

            {/* Fullscreen (video only) */}
            {!isAudio && (
              <button
                onClick={toggleFullscreen}
                className="grid h-9 w-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition"
                title="شاشة كاملة"
              >
                <FullscreenIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Icons
   ========================================================= */

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 me-0.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}

function RewindIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M11 12 22 19V5zM2 12l9 7V5z" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M13 12 2 5v14zM22 12l-9 7V5z" />
    </svg>
  );
}

function Rewind15Icon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="9" y="16" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">15</text>
    </svg>
  );
}

function Forward15Icon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="9" y="16" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">15</text>
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" strokeLinecap="round" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" strokeLinejoin="round" />
      <path d="m22 9-6 6M16 9l6 6" strokeLinecap="round" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" strokeLinecap="round" />
    </svg>
  );
}

function SleepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeadphonesIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M18 19h1a1 1 0 0 0 1-1v-4h-4v4a1 1 0 0 0 1 1h1ZM6 19H5a1 1 0 0 1-1-1v-4h4v4a1 1 0 0 1-1 1H6Z" />
    </svg>
  );
}