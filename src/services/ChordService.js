// Generate common chord progressions based on song key
// This provides chord progressions for songs that don't have them in the database

const KEY_TO_CHORDS = {
    // Major keys - I, IV, V, vi progression (most common)
    'C Major': ['C', 'F', 'G', 'Am'],
    'D Major': ['D', 'G', 'A', 'Bm'],
    'E Major': ['E', 'A', 'B', 'C#'],
    'F Major': ['F', 'Bb', 'C', 'Dm'],
    'G Major': ['G', 'C', 'D', 'Em'],
    'A Major': ['A', 'D', 'E', 'F#'],
    'B Major': ['B', 'E', 'F#', 'G#'],
    'Bb Major': ['Bb', 'Eb', 'F', 'Gm'],
    'Eb Major': ['Eb', 'Ab', 'Bb', 'Cm'],
    'Ab Major': ['Ab', 'Db', 'Eb', 'Fm'],
    'Db Major': ['Db', 'Gb', 'Ab', 'Bbm'],
    'Gb Major': ['Gb', 'B', 'Db', 'Ebm'],
    'F# Major': ['F#', 'B', 'C#', 'D#'],
    'C# Major': ['C#', 'F#', 'G#', 'A#'],

    // Minor keys - i, iv, v, VI progression (common in minor)
    'A Minor': ['Am', 'Dm', 'Em', 'F'],
    'E Minor': ['Em', 'Am', 'Bm', 'C'],
    'B Minor': ['Bm', 'Em', 'F#', 'G'],
    'F# Minor': ['F#', 'Bm', 'C#', 'D'],
    'C# Minor': ['C#', 'F#', 'G#', 'A'],
    'G# Minor': ['G#', 'C#', 'D#', 'E'],
    'D# Minor': ['D#', 'G#', 'A#', 'B'],
    'D Minor': ['Dm', 'Gm', 'Am', 'Bb'],
    'G Minor': ['Gm', 'Cm', 'Dm', 'Eb'],
    'C Minor': ['C', 'Fm', 'Gm', 'Ab'],
    'F Minor': ['Fm', 'Bbm', 'Cm', 'Db'],
    'Bb Minor': ['Bbm', 'Ebm', 'Fm', 'Gb'],
    'Eb Minor': ['Ebm', 'Abm', 'Bbm', 'B'],
    'Ab Minor': ['Abm', 'Dbm', 'Ebm', 'E'],
};

/**
 * Generate chord progression for a song based on its key
 * @param {string} key - The musical key (e.g., "C Major", "A Minor")
 * @returns {string[]} Array of chord names
 */
export function generateChordProgression(key) {
    // Return predefined progression if available
    if (KEY_TO_CHORDS[key]) {
        return KEY_TO_CHORDS[key];
    }

    // Fallback: return generic C Major progression
    return ['C', 'G', 'Am', 'F'];
}

/**
 * Add chord progression to a song object if it doesn't have one
 * @param {object} song - Song object with at least a 'key' property
 * @returns {object} Song object with chords added
 */
export function addChordsToSong(song) {
    // If song already has chords, return as is
    if (song.chords && song.chords.length > 0) {
        return song;
    }

    // If song has a valid key, generate chords
    if (song.key && song.key !== 'Unknown' && song.key !== '-') {
        return {
            ...song,
            chords: generateChordProgression(song.key)
        };
    }

    // No valid key, return without chords
    return song;
}

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNoteIndex(note) {
    let n = note.toUpperCase();
    let idx = NOTES_SHARP.indexOf(n);
    if (idx !== -1) return idx;
    return NOTES_FLAT.indexOf(n);
}

export function transposeChord(chord, semitones) {
    if (!chord) return chord;

    // Split root from quality (e.g., "Cm" -> "C", "m")
    // Regex matches the note name (A-G, optional # or b)
    const match = chord.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return chord; // fallback

    const root = match[1];
    const quality = match[2];

    let idx = getNoteIndex(root);
    if (idx === -1) return chord;

    let newIdx = (idx + semitones) % 12;
    if (newIdx < 0) newIdx += 12; // Handle negative wrapping

    // Decide whether to return sharp or flat based on direction or just stick to one
    // For simplicity, we can default to Sharps unless the original was flat?
    // Let's use a heuristic: if we are transposing down, maybe flats?
    // Actually, simple lookup is safer. 
    // Let's default to Sharps for now, or Flats if the target key is typically flat.
    // Ideally we'd know the target key.

    // Simple approach: Use Flat if original was flat, Sharp if original was sharp or natural?
    // But Bb + 1 = B (natural).
    // Let's just pick one set for now. Guitarists often prefer Sharps over Flats except F, Bb, Eb using flat names.
    // Let's strict map for standard keys.
    const useFlats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(chord) || root.includes('b');

    // Better logic: If we transposed, just pull from the list that makes sense.
    // Let's default to the list corresponding to the new root if it's black key?
    // This is complex to get perfect without Key context.
    // Let's try to preserve the existing notation style or default to standard guitar keys.
    const newNote = useFlats ? NOTES_FLAT[newIdx] : NOTES_SHARP[newIdx];

    return newNote + quality;
}

export function transposeProgression(chords, semitones) {
    if (!chords) return [];
    return chords.map(c => transposeChord(c, semitones));
}
