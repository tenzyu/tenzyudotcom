import { useEffect, useRef, useState } from "react";
import type { EditorFile } from "../../../shared/editor-types";
import { formatTime } from "../format";

let activeAudio: HTMLAudioElement | null = null;

type Props = {
  file: EditorFile;
  label: string;
};

export function AudioPreview({ file, label }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const audio = new Audio(file.url);
    audioRef.current = audio;
    audio.preload = "metadata";
    audio.onloadedmetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.ontimeupdate = () => setTime(audio.currentTime);
    audio.onplay = () => {
      if (activeAudio && activeAudio !== audio) activeAudio.pause();
      activeAudio = audio;
      setPlaying(true);
    };
    audio.onpause = () => setPlaying(false);
    audio.onerror = () => setUnsupported(true);
    return () => {
      audio.pause();
      if (activeAudio === audio) activeAudio = null;
    };
  }, [file.url]);

  const ratio = duration ? Math.min(1, time / duration) : 0;
  return (
    <div className="miniPreview audioPreview">
      <button
        type="button"
        disabled={unsupported}
        onClick={(event) => {
          event.stopPropagation();
          const audio = audioRef.current;
          if (!audio) return;
          if (audio.paused) void audio.play().catch(() => setUnsupported(true));
          else audio.pause();
        }}
      >
        {unsupported ? "Unsupported" : playing ? "Pause" : "Play"}
      </button>
      <div className="audioLabel">
        <strong>{label}</strong>
        <span>{file.name}</span>
      </div>
      <div className="audioMeter">
        <span style={{ width: `${Math.max(4, ratio * 100)}%` }} />
      </div>
      <span className="audioDuration">{duration ? formatTime(duration) : "--:--"}</span>
    </div>
  );
}
