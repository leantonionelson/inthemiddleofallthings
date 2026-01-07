import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { markdownToTtsText, normaliseForTtsHash } from './markdownToTtsText';
import { bookAudioMap } from '../src/data/bookAudioMap';

type Collection = 'book' | 'meditations' | 'stories';

type ManifestItemStatus = 'ok' | 'pending' | 'failed' | 'orphaned';

type ManifestItem = {
  collection: Collection;
  contentId: string;
  slug: string;
  sourcePath: string;
  audioPath: string;
  sourceSha256: string;
  audioSha256: string | null;
  updatedAt: string | null;
  status: ManifestItemStatus;
  lastError: string | null;
};

type Manifest = {
  version: 1;
  ttsVersion: string;
  generatedAt: string;
  tuning: {
    maxFilesPerRun: number;
    requestsPerMinute: number;
  };
  lastRun: {
    generatedAt: string;
    processed: number;
    generated: number;
    skipped: number;
    failed: number;
    rateLimited: number;
    quotaStopped: boolean;
  };
  items: Record<string, ManifestItem>;
};

const DEFAULT_TTS_VERSION = '2026-01-06-v1';
// Replace your existing constant with this:
const VOICE_STYLE_INSTRUCTION = 
  'Speak with a deep, rich, and resonant Black British accent (London). ' +
  'The voice should sound earthy, soulful, and textured (gravelly). ' +
  'Adopt a philosophical and meditative delivery style: use the slow, rhythmic pacing of a wise lecturer. ' +
  'Allow for significant, thoughtful pauses between ideas to let them land. ' +
  'Avoid a "newsreader" or "assistant" tone; instead, aim for the grounded, storytelling gravitas of a late-night radio host describing the nature of reality.';

// Keep stable across runs unless you intentionally want to regenerate everything.
// Ref: https://ai.google.dev/gemini-api/docs/speech-generation#supported-models
const DEFAULT_MODEL_ID = 'gemini-2.5-flash-preview-tts';
const DEFAULT_VOICE_NAME = 'Charon'; // "Even" (good baseline for calm/low-variation)
const PCM_SAMPLE_RATE_HZ = 24000;
const PCM_CHANNELS = 1;

const PROJECT_ROOT = process.cwd();

const PUBLIC_AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'audio');
const MANIFEST_PATH = path.join(PUBLIC_AUDIO_DIR, 'audio-manifest.json');

const MEDITATIONS_ROOT = path.join(PROJECT_ROOT, 'src', 'meditations');
const STORIES_ROOT = path.join(PROJECT_ROOT, 'src', 'stories');

const ENV_MAX_FILES_PER_RUN = 'MAX_FILES_PER_RUN';
const ENV_REQUESTS_PER_MINUTE = 'REQUESTS_PER_MINUTE';
const ENV_BACKOFF_BASE_MS = 'BACKOFF_BASE_MS';
const ENV_BACKOFF_MAX_MS = 'BACKOFF_MAX_MS';
const ENV_STOP_ON_QUOTA = 'STOP_ON_QUOTA';
const ENV_GEMINI_API_KEY = 'GEMINI_API_KEY';
const ENV_VITE_GEMINI_API_KEY = 'VITE_GEMINI_API_KEY';
const ENV_GEMINI_MODEL_ID = 'GEMINI_TTS_MODEL';
const ENV_GEMINI_VOICE_NAME = 'GEMINI_TTS_VOICE_NAME';
const ENV_TTS_VERSION = 'TTS_VERSION';

function nowIso(): string {
  return new Date().toISOString();
}

function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v == null) return fallback;
  return v.toLowerCase() === 'true' || v === '1' || v.toLowerCase() === 'yes';
}

function parseIntEnv(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

async function readTextIfExists(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

function parseDotEnv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function getGeminiApiKey(): Promise<string | null> {
  if (process.env[ENV_GEMINI_API_KEY]) return process.env[ENV_GEMINI_API_KEY]!;
  if (process.env[ENV_VITE_GEMINI_API_KEY]) return process.env[ENV_VITE_GEMINI_API_KEY]!;

  const envPath = path.join(PROJECT_ROOT, '.env');
  const contents = await readTextIfExists(envPath);
  if (!contents) return null;
  const parsed = parseDotEnv(contents);
  return parsed[ENV_GEMINI_API_KEY] ?? parsed[ENV_VITE_GEMINI_API_KEY] ?? null;
}

function stableStringifyManifest(manifest: Manifest): string {
  // Stable ordering: keep top-level fields ordered; sort item keys.
  const itemsKeys = Object.keys(manifest.items).sort();
  const sortedItems: Record<string, ManifestItem> = {};
  for (const k of itemsKeys) sortedItems[k] = manifest.items[k];

  const stable: Manifest = {
    version: 1,
    ttsVersion: manifest.ttsVersion,
    generatedAt: manifest.generatedAt,
    tuning: manifest.tuning,
    lastRun: manifest.lastRun,
    items: sortedItems,
  };

  return JSON.stringify(stable, null, 2) + '\n';
}

async function loadManifest(params: { ttsVersion: string; maxFilesPerRun: number; requestsPerMinute: number }): Promise<Manifest> {
  const existing = await readTextIfExists(MANIFEST_PATH);
  if (!existing) {
    return {
      version: 1,
      ttsVersion: params.ttsVersion,
      generatedAt: nowIso(),
      tuning: {
        maxFilesPerRun: params.maxFilesPerRun,
        requestsPerMinute: params.requestsPerMinute,
      },
      lastRun: {
        generatedAt: nowIso(),
        processed: 0,
        generated: 0,
        skipped: 0,
        failed: 0,
        rateLimited: 0,
        quotaStopped: false,
      },
      items: {},
    };
  }

  try {
    const parsed = JSON.parse(existing) as Manifest;
    // Backfill if missing (in case manifest format evolves).
    return {
      version: 1,
      ttsVersion: typeof parsed.ttsVersion === 'string' ? parsed.ttsVersion : params.ttsVersion,
      generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : nowIso(),
      tuning: {
        maxFilesPerRun:
          typeof parsed.tuning?.maxFilesPerRun === 'number' ? parsed.tuning.maxFilesPerRun : params.maxFilesPerRun,
        requestsPerMinute:
          typeof parsed.tuning?.requestsPerMinute === 'number' ? parsed.tuning.requestsPerMinute : params.requestsPerMinute,
      },
      lastRun: parsed.lastRun ?? {
        generatedAt: nowIso(),
        processed: 0,
        generated: 0,
        skipped: 0,
        failed: 0,
        rateLimited: 0,
        quotaStopped: false,
      },
      items: parsed.items ?? {},
    };
  } catch {
    // If the manifest is corrupted, start fresh rather than crashing CI.
    return {
      version: 1,
      ttsVersion: params.ttsVersion,
      generatedAt: nowIso(),
      tuning: {
        maxFilesPerRun: params.maxFilesPerRun,
        requestsPerMinute: params.requestsPerMinute,
      },
      lastRun: {
        generatedAt: nowIso(),
        processed: 0,
        generated: 0,
        skipped: 0,
        failed: 0,
        rateLimited: 0,
        quotaStopped: false,
      },
      items: {},
    };
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await ensureDir(PUBLIC_AUDIO_DIR);
  const contents = stableStringifyManifest(manifest);
  await fs.writeFile(MANIFEST_PATH, contents, 'utf8');
}

async function walkMarkdownFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(p);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(p);
      }
    }
  }

  if (await fileExists(rootDir)) {
    await walk(rootDir);
  }

  return results.sort();
}

function slugFromFilename(p: string): string {
  const base = path.basename(p);
  return base.replace(/\.md$/i, '');
}

function makeKey(collection: Collection, slug: string): string {
  return `${collection}/${slug}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyGeminiError(status: number, bodyText: string): { kind: 'rate' | 'quota' | 'auth' | 'other' } {
  if (status === 429) return { kind: 'rate' };
  if (status === 401) return { kind: 'auth' };
  if (status === 403) {
    const b = bodyText.toLowerCase();
    if (b.includes('quota') || b.includes('insufficient') || b.includes('rate limit')) return { kind: 'quota' };
    return { kind: 'auth' };
  }
  return { kind: 'other' };
}

type GeminiTtsError = Error & { httpStatus?: number; errorKind?: 'rate' | 'quota' | 'auth' | 'other' };

type PathSeg = string | number;
function getAt(root: unknown, pathSegs: PathSeg[]): unknown {
  let cur: unknown = root;
  for (const seg of pathSegs) {
    if (typeof seg === 'number') {
      if (!Array.isArray(cur) || seg < 0 || seg >= cur.length) return undefined;
      cur = cur[seg];
      continue;
    }
    if (typeof cur !== 'object' || cur === null) return undefined;
    const rec = cur as Record<string, unknown>;
    cur = rec[seg];
  }
  return cur;
}

async function callGeminiTts(params: {
  apiKey: string;
  modelId: string;
  voiceName: string;
  text: string;
  voiceStyle: string;
}): Promise<{ pcmBytes: Buffer }> {
  // Ref: https://ai.google.dev/gemini-api/docs/speech-generation#rest
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.modelId)}:generateContent`;

  // We include the voice style instruction in-band with the transcript (and in the hash input).
  const promptText = `${params.voiceStyle}\n\n${params.text}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': params.apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: params.voiceName,
            },
          },
        },
      },
      model: params.modelId,
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    const info = classifyGeminiError(res.status, bodyText);
    const err: GeminiTtsError = new Error(`Gemini TTS request failed (${res.status}): ${bodyText.slice(0, 500)}`);
    err.httpStatus = res.status;
    err.errorKind = info.kind;
    throw err;
  }

  // Try to find base64 audio in common Gemini response shapes.
  // If your model returns a different schema, adjust here (and bump ttsVersion if it changes spoken output).
  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    throw new Error('Gemini response was not valid JSON');
  }

  const data = getAt(json, ['candidates', 0, 'content', 'parts', 0, 'inlineData', 'data']);
  if (typeof data === 'string' && data.length > 0) {
    return { pcmBytes: Buffer.from(data, 'base64') };
  }

  throw new Error('Gemini response did not include inline audio PCM data at candidates[0].content.parts[0].inlineData.data');
}

function transcodePcmToMp3(params: { pcmPath: string; outputPath: string }): void {
  // Ref doc: ffmpeg -f s16le -ar 24000 -ac 1 -i out.pcm out.wav
  // We go straight to mp3 at ~160 kbps mono.
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-f',
      's16le',
      '-ar',
      String(PCM_SAMPLE_RATE_HZ),
      '-ac',
      String(PCM_CHANNELS),
      '-i',
      params.pcmPath,
      '-ac',
      '1',
      '-b:a',
      '160k',
      params.outputPath,
    ],
    {
      stdio: 'inherit',
    }
  );
  if (r.error) {
    throw new Error(`ffmpeg failed to start: ${r.error.message}`);
  }
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed with exit code ${r.status ?? 'unknown'}`);
  }
}

async function writePcmAsMp3(params: { pcmBytes: Buffer; outPath: string }): Promise<void> {
  await ensureDir(path.dirname(params.outPath));

  const tmpPcmPath = `${params.outPath}.tmp.pcm`;
  await fs.writeFile(tmpPcmPath, params.pcmBytes);

  try {
    transcodePcmToMp3({ pcmPath: tmpPcmPath, outputPath: params.outPath });
  } finally {
    await fs.rm(tmpPcmPath, { force: true });
  }
}

function computeSourceHash(params: {
  ttsVersion: string;
  modelId: string;
  voiceName: string;
  voiceStyle: string;
  ttsText: string;
}): string {
  const normalised = normaliseForTtsHash(params.ttsText);
  const composite =
    `TTS_VERSION:${params.ttsVersion}\n` +
    `MODEL:${params.modelId}\n` +
    `VOICE_NAME:${params.voiceName}\n` +
    `VOICE_STYLE:${params.voiceStyle}\n` +
    `TEXT:\n${normalised}\n`;
  return sha256Hex(composite);
}

async function main(): Promise<void> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY (or VITE_GEMINI_API_KEY in .env).');
    process.exitCode = 1;
    return;
  }

  const ttsVersion = process.env[ENV_TTS_VERSION] ?? DEFAULT_TTS_VERSION;
  const modelId = process.env[ENV_GEMINI_MODEL_ID] ?? DEFAULT_MODEL_ID;
  const voiceName = process.env[ENV_GEMINI_VOICE_NAME] ?? DEFAULT_VOICE_NAME;

  const maxFilesPerRun = parseIntEnv(process.env[ENV_MAX_FILES_PER_RUN], 10);
  const requestsPerMinute = parseIntEnv(process.env[ENV_REQUESTS_PER_MINUTE], 6);
  const backoffBaseMs = parseIntEnv(process.env[ENV_BACKOFF_BASE_MS], 1500);
  const backoffMaxMs = parseIntEnv(process.env[ENV_BACKOFF_MAX_MS], 45000);
  const stopOnQuota = parseBool(process.env[ENV_STOP_ON_QUOTA], true);

  await ensureDir(PUBLIC_AUDIO_DIR);

  const manifest = await loadManifest({ ttsVersion, maxFilesPerRun, requestsPerMinute });

  // Update manifest tuning from env each run (authoritative).
  manifest.ttsVersion = ttsVersion;
  manifest.tuning.maxFilesPerRun = maxFilesPerRun;
  manifest.tuning.requestsPerMinute = requestsPerMinute;

  const discoveredItems: ManifestItem[] = [];
  const bookOrderIndex = new Map<string, number>();
  for (let i = 0; i < bookAudioMap.length; i++) {
    // Use slug since our manifest keys are `book/<slug>`
    bookOrderIndex.set(bookAudioMap[i]!.slug, i);
  }

  // Book: use the deterministic map (slug/contentId are chapter IDs).
  for (const item of bookAudioMap) {
    const key = makeKey('book', item.slug);
    discoveredItems.push({
      collection: 'book',
      contentId: item.contentId,
      slug: item.slug,
      sourcePath: item.sourcePath,
      audioPath: path.join('public', 'audio', 'book', `${item.slug}.mp3`),
      sourceSha256: '',
      audioSha256: null,
      updatedAt: null,
      status: 'pending',
      lastError: null,
    });
    // Ensure an entry exists so orphan detection can remove stale ones later.
    if (!manifest.items[key]) {
      manifest.items[key] = discoveredItems[discoveredItems.length - 1]!;
    }
  }

  // Meditations + Stories: discover markdown on disk, slug from filename.
  const meditationFiles = await walkMarkdownFiles(path.join(MEDITATIONS_ROOT, 'meditations'));
  for (const p of meditationFiles) {
    const slug = slugFromFilename(p);
    const key = makeKey('meditations', slug);
    const rel = path.relative(PROJECT_ROOT, p).replace(/\\/g, '/');
    const entry: ManifestItem = {
      collection: 'meditations',
      contentId: slug,
      slug,
      sourcePath: rel,
      audioPath: path.join('public', 'audio', 'meditations', `${slug}.mp3`),
      sourceSha256: '',
      audioSha256: null,
      updatedAt: null,
      status: 'pending',
      lastError: null,
    };
    discoveredItems.push(entry);
    if (!manifest.items[key]) manifest.items[key] = entry;
  }

  const storyFiles = await walkMarkdownFiles(path.join(STORIES_ROOT, 'stories'));
  for (const p of storyFiles) {
    const slug = slugFromFilename(p);
    const key = makeKey('stories', slug);
    const rel = path.relative(PROJECT_ROOT, p).replace(/\\/g, '/');
    const entry: ManifestItem = {
      collection: 'stories',
      contentId: slug,
      slug,
      sourcePath: rel,
      audioPath: path.join('public', 'audio', 'stories', `${slug}.mp3`),
      sourceSha256: '',
      audioSha256: null,
      updatedAt: null,
      status: 'pending',
      lastError: null,
    };
    discoveredItems.push(entry);
    if (!manifest.items[key]) manifest.items[key] = entry;
  }

  const discoveredKeys = new Set(discoveredItems.map((i) => makeKey(i.collection, i.slug)));

  // Orphan cleanup: delete MP3 + remove manifest entry entirely if not discovered.
  for (const [key, item] of Object.entries(manifest.items)) {
    if (discoveredKeys.has(key)) continue;
    const absAudioPath = path.join(PROJECT_ROOT, item.audioPath);
    if (await fileExists(absAudioPath)) {
      await fs.rm(absAudioPath, { force: true });
    }
    delete manifest.items[key];
  }

  // Build worklist (needs generation).
  type WorkItem = {
    key: string;
    item: ManifestItem;
    ttsText: string;
    sourceHash: string;
    absAudioPath: string;
  };

  const worklist: WorkItem[] = [];
  let skipped = 0;

  for (const discovered of discoveredItems) {
    const key = makeKey(discovered.collection, discovered.slug);
    const existing = manifest.items[key]!;

    // Keep authoritative fields up to date (paths can move).
    existing.collection = discovered.collection;
    existing.contentId = discovered.contentId;
    existing.slug = discovered.slug;
    existing.sourcePath = discovered.sourcePath;
    existing.audioPath = discovered.audioPath;

    const absSourcePath = path.join(PROJECT_ROOT, existing.sourcePath);
    const absAudioPath = path.join(PROJECT_ROOT, existing.audioPath);

    const markdown = await fs.readFile(absSourcePath, 'utf8');
    const ttsText = markdownToTtsText(markdown);
    const sourceHash = computeSourceHash({
      ttsVersion,
      modelId,
      voiceName,
      voiceStyle: VOICE_STYLE_INSTRUCTION,
      ttsText,
    });

    const mp3Exists = await fileExists(absAudioPath);
    const needs =
      !existing.sourceSha256 ||
      existing.sourceSha256 !== sourceHash ||
      existing.status === 'failed' ||
      !mp3Exists;

    if (!needs) {
      existing.status = 'ok';
      existing.lastError = null;
      skipped += 1;
      continue;
    }

    worklist.push({ key, item: existing, ttsText, sourceHash, absAudioPath });
  }

  // Sort worklist for determinism (stable daily progress).
  // Priority order: book → stories → meditations
  worklist.sort((a, b) => {
    // Collection priority: book (0) > stories (1) > meditations (2)
    const collectionPriority: Record<string, number> = {
      'book': 0,
      'stories': 1,
      'meditations': 2,
    };
    const aPriority = collectionPriority[a.item.collection] ?? 999;
    const bPriority = collectionPriority[b.item.collection] ?? 999;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // For book items, preserve the explicit reading order defined in `bookAudioMap`
    // Order: introduction → part-1-intro → chapters 1-6 → part-2-intro → chapters 7-10 → etc. → outro
    if (a.item.collection === 'book' && b.item.collection === 'book') {
      const ai = bookOrderIndex.get(a.item.slug) ?? Number.MAX_SAFE_INTEGER;
      const bi = bookOrderIndex.get(b.item.slug) ?? Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
    }

    // For stories and meditations, keep a stable lexical order.
    return a.key.localeCompare(b.key);
  });

  const toProcess = worklist.slice(0, maxFilesPerRun);

  let processed = 0;
  let generated = 0;
  let failed = 0;
  let rateLimited = 0;
  let quotaStopped = false;
  let authFailed = false;

  const minDelayMs = Math.ceil((60_000 / Math.max(1, requestsPerMinute)));
  let lastRequestAt = 0;
  let seen429 = 0;

  for (const w of toProcess) {
    processed += 1;
    w.item.status = 'pending';
    w.item.lastError = null;
    w.item.sourceSha256 = w.sourceHash;

    // Respect RPM pacing.
    const now = Date.now();
    const since = now - lastRequestAt;
    if (since < minDelayMs) {
      await sleep(minDelayMs - since);
    }

    try {
      lastRequestAt = Date.now();
      const audioBytes = await callGeminiTts({
        apiKey,
        modelId,
        voiceName,
        text: w.ttsText,
        voiceStyle: VOICE_STYLE_INSTRUCTION,
      });

      await writePcmAsMp3({ pcmBytes: audioBytes.pcmBytes, outPath: w.absAudioPath });

      const finalBytes = await fs.readFile(w.absAudioPath);
      w.item.audioSha256 = sha256Hex(finalBytes);
      w.item.updatedAt = nowIso();
      w.item.status = 'ok';
      w.item.lastError = null;
      generated += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const e = err as GeminiTtsError;
      const httpStatus = e.httpStatus;
      const kind = e.errorKind;

      w.item.status = 'failed';
      w.item.lastError = msg.slice(0, 2000);
      w.item.updatedAt = nowIso();
      failed += 1;

      if (httpStatus === 429 || kind === 'rate') {
        seen429 += 1;
        rateLimited += 1;
        const backoff = Math.min(backoffMaxMs, backoffBaseMs * Math.pow(2, Math.max(0, seen429 - 1)));
        await sleep(backoff);

        if (seen429 >= 2) {
          // Hard stop for this run; mark remaining as pending and exit 0.
          break;
        }
      }

      if ((httpStatus === 403 && (kind === 'quota' || kind === 'auth')) || kind === 'quota') {
        if (stopOnQuota) {
          quotaStopped = true;
          break;
        }
      }

      // Auth issues are unexpected; fail the run so it's visible in CI.
      if (httpStatus === 401 || kind === 'auth') {
        authFailed = true;
        break;
      }
    }
  }

  // Any work not processed in this run remains pending (so tomorrow continues).
  if (quotaStopped || seen429 >= 2) {
    for (const w of worklist.slice(processed)) {
      w.item.status = 'pending';
      if (w.item.lastError == null) w.item.lastError = null;
    }
  }

  manifest.generatedAt = nowIso();
  manifest.lastRun = {
    generatedAt: manifest.generatedAt,
    processed,
    generated,
    skipped,
    failed,
    rateLimited,
    quotaStopped,
  };

  await writeManifest(manifest);

  console.log(
    JSON.stringify(
      {
        generatedAt: manifest.generatedAt,
        discovered: discoveredItems.length,
        queued: worklist.length,
        processed,
        generated,
        skipped,
        failed,
        rateLimited,
        quotaStopped,
      },
      null,
      2
    )
  );

  // Exit behavior: quota/rate stops should be a clean success.
  if (authFailed) {
    process.exitCode = 1;
  } else if (quotaStopped || seen429 >= 2) {
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error('Unexpected error in generate-audio:', err);
  process.exitCode = 1;
});


