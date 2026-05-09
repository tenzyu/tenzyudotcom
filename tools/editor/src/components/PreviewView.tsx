import { useEffect, useRef } from "react";
import type { ProjectFilesResponse } from "../../../shared/editor-types";
import { AudioPreview } from "./AudioPreview";
import { drawPreview, type PreviewTab } from "../preview/draw";

const tabs: Array<[PreviewTab, string]> = [
  ["song-select", "Song Select"],
  ["std", "Std"],
  ["taiko", "Taiko"],
  ["catch", "Catch"],
  ["mania", "Mania"],
];

type Props = {
  files: ProjectFilesResponse;
  tab: PreviewTab;
  onTab: (tab: PreviewTab) => void;
};

export function PreviewView({ files, tab, onTab }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawPreview(canvasRef.current, tab, files.project);
  }, [files.project, tab]);

  const audio = files.project.filter((file) => file.kind === "audio" && relevantAudio(file.flatPath.toLowerCase(), tab)).slice(0, 8);

  return (
    <section className="previewShell">
      <div className="previewTabs">
        {tabs.map(([id, text]) => <button key={id} className={`tab${tab === id ? " active" : ""}`} onClick={() => onTab(id)}>{text}</button>)}
      </div>
      <div className="previewStage">
        <div className={`lazerPreview ${tab}`}>
          <canvas ref={canvasRef} width={1180} height={660} />
        </div>
        <div className="previewAudioRack">
          <strong>Audio</strong>
          {audio.map((file) => <AudioPreview key={file.path} file={file} label={file.name} />)}
          {!audio.length && <span className="muted">No matching audio in project.</span>}
        </div>
      </div>
    </section>
  );
}

function relevantAudio(name: string, tab: PreviewTab) {
  if (tab === "taiko") return name.includes("taiko") || name.includes("drum") || name.includes("hit");
  if (tab === "std") return name.includes("hit") || name.includes("slider") || name.includes("spinner") || name.includes("combobreak");
  if (tab === "catch") return name.includes("hit") || name.includes("combobreak") || name.includes("applause");
  if (tab === "mania") return name.includes("hit") || name.includes("key") || name.includes("combobreak");
  return name.includes("count") || name.includes("ready") || name.includes("go") || name.includes("applause") || name.includes("rank");
}
