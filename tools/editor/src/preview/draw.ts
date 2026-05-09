import type { EditorFile } from "../../../shared/editor-types";

export type PreviewTab = "song-select" | "std" | "taiko" | "catch" | "mania";

export function drawPreview(canvas: HTMLCanvasElement, tab: PreviewTab, files: EditorFile[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0d1114";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#161d22";
  ctx.fillRect(38, 38, canvas.width - 76, canvas.height - 76);
  ctx.fillStyle = "#f0f4f5";
  ctx.font = "700 28px Inter, sans-serif";
  ctx.fillText(titleFor(tab), 62, 84);

  if (tab === "song-select") drawSongSelect(ctx);
  if (tab === "std") void drawStd(ctx, files);
  if (tab === "taiko") void drawTaiko(ctx, files);
  if (tab === "catch") void drawCatch(ctx, files);
  if (tab === "mania") void drawMania(ctx, files);
}

function titleFor(tab: PreviewTab) {
  return {
    "song-select": "Song Select",
    std: "osu!standard",
    taiko: "osu!taiko",
    catch: "osu!catch",
    mania: "osu!mania",
  }[tab];
}

function first(files: EditorFile[], patterns: RegExp[]) {
  for (const pattern of patterns) {
    const file = files.find((candidate) => candidate.kind === "image" && pattern.test(candidate.flatPath.toLowerCase()));
    if (file) return file;
  }
  return null;
}

function imagePromise(file: EditorFile | null): Promise<HTMLImageElement | null> {
  if (!file) return Promise.resolve(null);
  const image = new Image();
  image.src = file.url;
  return image.decode().then(() => image).catch(() => null);
}

async function drawAsset(ctx: CanvasRenderingContext2D, file: EditorFile | null, x: number, y: number, width: number, height: number, missingLabel: string) {
  const image = await imagePromise(file);
  if (!image) {
    ctx.strokeStyle = "#3a444b";
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    ctx.fillStyle = "#75828a";
    ctx.font = "700 18px Inter, sans-serif";
    ctx.fillText(missingLabel, x + 14, y + height / 2);
    return;
  }
  ctx.drawImage(image, x, y, width, height);
}

function drawSongSelect(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i === 2 ? "#3b3220" : "#20272d";
    ctx.fillRect(78, 126 + i * 72, 700, 54);
  }
  ctx.fillStyle = "#c9d2d7";
  ctx.font = "700 22px Inter, sans-serif";
  ctx.fillText("Artist - Beatmap Title", 104, 164);
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText("Lazer first editor preview", 104, 226);
  ctx.fillStyle = "#151a1e";
  ctx.fillRect(820, 126, 260, 390);
  ctx.fillStyle = "#e2b85d";
  ctx.font = "700 48px Inter, sans-serif";
  ctx.fillText("S", 934, 250);
  ctx.font = "16px Inter, sans-serif";
  ctx.fillStyle = "#93a0a8";
  ctx.fillText("Result sounds and fonts are checked below.", 862, 326);
}

async function drawStd(ctx: CanvasRenderingContext2D, files: EditorFile[]) {
  ctx.strokeStyle = "#40505a";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(250, 350);
  ctx.bezierCurveTo(420, 180, 580, 480, 760, 280);
  ctx.stroke();
  await drawAsset(ctx, first(files, [/approachcircle/]), 208, 188, 180, 180, "approachcircle");
  await drawAsset(ctx, first(files, [/hitcircle(@2x)?\.png$/]), 240, 220, 116, 116, "hitcircle");
  await drawAsset(ctx, first(files, [/hitcircleoverlay/]), 240, 220, 116, 116, "overlay");
  await drawAsset(ctx, first(files, [/default-1/]), 282, 252, 36, 42, "1");
  await drawAsset(ctx, first(files, [/followpoint/]), 430, 250, 54, 54, "follow");
  await drawAsset(ctx, first(files, [/cursor(@2x)?\.png$/]), 820, 410, 82, 82, "cursor");
}

async function drawTaiko(ctx: CanvasRenderingContext2D, files: EditorFile[]) {
  ctx.fillStyle = "#11181d";
  ctx.fillRect(100, 180, 920, 94);
  ctx.fillStyle = "#202b32";
  ctx.fillRect(100, 274, 920, 116);
  await drawAsset(ctx, first(files, [/taiko-slider/, /taiko-glow/]), 220, 186, 680, 78, "upper playfield");
  await drawAsset(ctx, first(files, [/taiko-bar-left/]), 110, 272, 200, 118, "bar left");
  await drawAsset(ctx, first(files, [/taiko-drum-outer/]), 120, 238, 154, 154, "drum outer");
  await drawAsset(ctx, first(files, [/taiko-drum-inner/]), 144, 262, 106, 106, "drum inner");
  await drawAsset(ctx, first(files, [/taikohitcircle/]), 564, 203, 68, 68, "note");
  await drawAsset(ctx, first(files, [/spinner-warning/, /spinner-circle/]), 820, 108, 130, 130, "shaker");
}

async function drawCatch(ctx: CanvasRenderingContext2D, files: EditorFile[]) {
  ctx.fillStyle = "#10191e";
  ctx.fillRect(120, 126, 880, 426);
  for (const [x, y] of [[300, 170], [520, 230], [710, 150]]) {
    await drawAsset(ctx, first(files, [/fruit-apple/, /fruit-orange/, /fruit-pear/, /fruit-grapes/]), x, y, 64, 64, "fruit");
  }
  await drawAsset(ctx, first(files, [/fruit-drop/, /fruit-droplet/]), 440, 320, 46, 46, "drop");
  await drawAsset(ctx, first(files, [/lighting/]), 492, 430, 160, 80, "lighting");
  await drawAsset(ctx, first(files, [/fruit-catcher-idle/, /fruit-ryuuta/]), 480, 462, 190, 92, "catcher");
}

async function drawMania(ctx: CanvasRenderingContext2D, files: EditorFile[]) {
  ctx.fillStyle = "#0b1013";
  ctx.fillRect(390, 112, 360, 452);
  await drawAsset(ctx, first(files, [/mania-stage-left/, /mania-stage-right/, /mania-stage-bottom/]), 360, 110, 420, 456, "stage");
  const key = first(files, [/mania-key\d/]);
  const note = first(files, [/mania-note\d(@2x)?\.png$/]);
  for (let lane = 0; lane < 4; lane += 1) {
    ctx.fillStyle = lane % 2 ? "#182127" : "#12191e";
    ctx.fillRect(424 + lane * 74, 130, 70, 400);
    await drawAsset(ctx, note, 431 + lane * 74, 180 + lane * 42, 56, 30, "note");
    await drawAsset(ctx, key, 424 + lane * 74, 522, 70, 34, "key");
  }
  await drawAsset(ctx, first(files, [/mania-note\d[lht]/]), 584, 270, 56, 160, "hold");
  await drawAsset(ctx, first(files, [/mania-light/]), 510, 460, 120, 80, "light");
}
