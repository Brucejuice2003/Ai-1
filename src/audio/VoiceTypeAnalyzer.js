/**
 * Heuristic Voice Type Classifier
 * Uses fundamental frequency (pitch) to estimate register.
 * NOTE: This is an approximation. Real voice classification requires timbre analysis and physical examination.
 * 
 * Approximate Ranges (very general):
 * - Chest: Lowest part of range (e.g., G2-E4 for men, G3-A4 for women)
 * - Mix: Middle transition (e.g., E4-A4 for men, A4-D5 for women)
 * - Head: Upper part of range (e.g., A4+ for men, D5+ for women)
 * 
 * We will use a "General" preset for now, but really this should be calibrated to the user.
 */

/* eslint-disable no-unused-vars */

export function analyzeVoiceType(pitch, gender = 'male') {
    if (!pitch || pitch < 50) return { type: 'Silence', confidence: 0 };

    // Thresholds for Male voice (approximate)
    // Chest < E4 (329Hz)
    // 330Hz < Mix < A4 (440Hz)
    // Head > 440Hz

    // We can add logic for 'Female' later or make it configurable
    const thresholds = gender === 'female'
        ? { chestHigh: 440, mixHigh: 587 } // A4, D5
        : { chestHigh: 330, mixHigh: 440 }; // E4, A4

    if (pitch < thresholds.chestHigh) {
        return { type: 'Chest Voice', confidence: 0.8, color: 'text-blue-400' };
    } else if (pitch < thresholds.mixHigh) {
        return { type: 'Mixed Voice', confidence: 0.6, color: 'text-purple-400' };
    } else {
        return { type: 'Head Voice', confidence: 0.8, color: 'text-pink-400' };
    }
}
