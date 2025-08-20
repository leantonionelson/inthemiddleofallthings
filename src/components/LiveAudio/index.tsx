/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session} from '@google/genai';
import {createBlob, decode, decodeAudioData} from './utils';

export class GdmLiveAudio extends HTMLElement {
  private isRecording = false;
  private status = '';
  private error = '';

  private client!: GoogleGenAI;
  private session!: Session;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 16000});
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 24000});
  private inputNode = this.inputAudioContext.createGain();
  private outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream!: MediaStream;
  private sourceNode!: MediaStreamAudioSourceNode;
  private scriptProcessorNode!: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.initClient();
  }

  connectedCallback() {
    this.render();
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);

    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Connected to AI');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData;

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data || ''),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () =>{
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if(interrupted) {
              for(const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Connection closed: ' + e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Orus'}},
            // languageCode: 'en-GB'
          },
        },
      });
    } catch (e) {
      console.error(e);
      this.updateError('Failed to connect to AI service');
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.updateStatusDisplay();
  }

  private updateError(msg: string) {
    this.error = msg;
    this.updateStatusDisplay();
  }

  private updateStatusDisplay() {
    const statusElement = this.shadowRoot?.querySelector('#status');
    if (statusElement) {
      statusElement.textContent = this.error || this.status;
    }
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('Microphone access granted. Starting capture...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        this.session.sendRealtimeInput({media: createBlob(pcmData)});
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🔴 Recording... Speak to the book');
      this.updateButtons();
    } catch (err: any) {
      console.error('Error starting recording:', err);
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.updateStatus('Stopping recording...');

    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null as any;
    this.sourceNode = null as any;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null as any;
    }

    this.updateStatus('Ready to listen. Tap start to speak again.');
    this.updateButtons();
  }

  private reset() {
    this.session?.close();
    this.initSession();
    this.updateStatus('Session reset. Ready to begin.');
  }

  private updateButtons() {
    const startButton = this.shadowRoot?.querySelector('#startButton') as HTMLButtonElement;
    const stopButton = this.shadowRoot?.querySelector('#stopButton') as HTMLButtonElement;
    const resetButton = this.shadowRoot?.querySelector('#resetButton') as HTMLButtonElement;

    if (startButton) startButton.style.display = this.isRecording ? 'none' : 'block';
    if (stopButton) stopButton.style.display = this.isRecording ? 'block' : 'none';
    if (resetButton) resetButton.style.display = this.isRecording ? 'none' : 'block';
  }

  private render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          font-family: Inter, system-ui, sans-serif;
        }

        #status {
          position: absolute;
          bottom: 5vh;
          left: 0;
          right: 0;
          z-index: 10;
          text-align: center;
          color: white;
          font-family: Inter, system-ui, sans-serif;
        }

        .controls {
          z-index: 10;
          position: absolute;
          bottom: 10vh;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
        }

        .controls button {
          outline: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          width: 64px;
          height: 64px;
          cursor: pointer;
          font-size: 24px;
          padding: 0;
          margin: 0;
          transition: background 0.2s ease;
        }

        .controls button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .controls button[style*="display: none"] {
          display: none !important;
        }

        #visual-container {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
      </style>

      <div id="visual-container">
        <gdm-live-audio-visuals-3d></gdm-live-audio-visuals-3d>
      </div>

      <div class="controls">
        <button id="resetButton">
          <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#ffffff">
            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
          </svg>
        </button>
        <button id="startButton">
          <svg viewBox="0 0 100 100" width="32px" height="32px" fill="#c80000" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" />
          </svg>
        </button>
        <button id="stopButton" style="display: none;">
          <svg viewBox="0 0 100 100" width="32px" height="32px" fill="#000000" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="100" height="100" rx="15" />
          </svg>
        </button>
      </div>

      <div id="status">${this.error || this.status || 'Initializing...'}</div>
    `;

    // Add event listeners
    const startButton = this.shadowRoot.querySelector('#startButton');
    const stopButton = this.shadowRoot.querySelector('#stopButton');
    const resetButton = this.shadowRoot.querySelector('#resetButton');

    startButton?.addEventListener('click', () => this.startRecording());
    stopButton?.addEventListener('click', () => this.stopRecording());
    resetButton?.addEventListener('click', () => this.reset());

    // Set up the 3D visualization
    const visualContainer = this.shadowRoot.querySelector('#visual-container gdm-live-audio-visuals-3d') as any;
    if (visualContainer) {
      visualContainer.inputNode = this.inputNode;
      visualContainer.outputNode = this.outputNode;
    }
  }
}

// Register the custom element
customElements.define('gdm-live-audio', GdmLiveAudio); 