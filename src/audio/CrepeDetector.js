import { getNoteFromFrequency } from './utils';

/**
 * Wrapper for ml5.js Pitch Detection (CREPE).
 * Provides a cleaner interface for the React app.
 * Uses window.ml5 loaded via CDN.
 */
export class CrepeDetector {
    constructor(audioContext, stream, updateCallback) {
        this.audioContext = audioContext;
        this.stream = stream;
        this.updateCallback = updateCallback;
        this.pitch = null;
        this.modelLoaded = false;
        this.isDetecting = false;

        // Load the model
        this.loadModel();
    }

    async loadModel() {
        try {
            // Wait for ML5 to load from CDN
            let attempts = 0;
            while (!window.ml5 && attempts < 20) {
                console.log("Waiting for ml5 to load...");
                await new Promise(r => setTimeout(r, 500));
                attempts++;
            }

            if (window.ml5) {
                // "crepe" is the model name for pitch detection in ml5
                // Start pitch detection immediately upon loading
                this.pitch = await window.ml5.pitchDetection('./model/', this.audioContext, this.stream, this.modelLoadedCallback.bind(this));
            } else {
                console.error("ML5 failed to load from CDN.");
            }
        } catch (e) {
            console.error("Failed to load CREPE model:", e);
        }
    }

    modelLoadedCallback() {
        console.log("CREPE Model Loaded!");
        this.modelLoaded = true;
        this.isDetecting = true;
        this.getPitch(); // Start the loop
    }

    getPitch() {
        if (!this.pitch) return;

        this.pitch.getPitch((err, frequency) => {
            if (err) {
                // ml5 often throws "no pitch found" as an error or just null
                // We just continue loop
                // console.error("CREPE Error:", err);
            }

            // Invoke callback with new data
            if (frequency) {
                this.updateCallback(frequency);
            } else {
                this.updateCallback(null);
            }

            // Loop with throttle (30ms = ~30fps)
            if (this.isDetecting) {
                setTimeout(() => this.getPitch(), 30);
            }
        });
    }
}
