const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SPOTIFY_API_ENDPOINT = "https://api.spotify.com/v1";
const REDIRECT_URI = window.location.origin; // e.g. http://localhost:5173

// Key mapping: 0=C, 1=C#, 2=D, ...
const KEY_MAP = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const MODE_MAP = ["Minor", "Major"]; // 0=Minor, 1=Major

export const SpotifyService = {
    // 1. Authorize (Redirects user to Spotify)
    authorize: (clientId) => {
        if (!clientId) {
            alert("Please enter a valid Client ID.");
            return;
        }
        localStorage.setItem("spotify_client_id", clientId); // Save for later

        const scopes = ["user-read-private", "user-read-email"];
        const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(" "))}&response_type=token&show_dialog=true`;

        window.location.href = authUrl;
    },

    // 2. Parse Token from URL Hash (Call this on app load/return)
    getTokenFromUrl: () => {
        const hash = window.location.hash;
        if (!hash) return null;

        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("access_token");
        if (token) {
            // Clear the hash to clean up URL
            window.location.hash = "";
            return token;
        }
        return null;
    },

    // 3. Search Tracks
    searchTracks: async (query, token) => {
        if (!token) throw new Error("No access token provided");

        const response = await fetch(`${SPOTIFY_API_ENDPOINT}/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Token expired");
            throw new Error("Search failed");
        }

        const data = await response.json();
        return data.tracks.items;
    },

    // 4. Get Audio Features (Key & BPM)
    getAudioFeatures: async (trackId, token) => {
        if (!token) throw new Error("No access token provided");

        const response = await fetch(`${SPOTIFY_API_ENDPOINT}/audio-features/${trackId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch audio features");

        const data = await response.json();

        // Convert to readable format
        // Key: Integer 0-11
        // Mode: 0 (Minor), 1 (Major)
        // Tempo: Float
        const keyName = KEY_MAP[data.key] || "?";
        const modeName = MODE_MAP[data.mode] || "";

        return {
            key: `${keyName} ${modeName}`,
            bpm: Math.round(data.tempo),
            rawKey: data.key,
            rawMode: data.mode
        };
    },

    // 5. Search Cover Art (Public - No Auth Required)
    searchCoverArt: async (title, artist) => {
        try {
            // Clean up the search terms
            const cleanTitle = title.replace(/\s*\(.*?\)\s*/g, '').trim();
            const cleanArtist = artist.replace(/\s(ft\.|feat\.|\&).*$/i, '').trim();

            const query = `${cleanTitle} ${cleanArtist}`;

            // Use Spotify's public search (works without auth for basic searches)
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
                {
                    headers: {
                        'Authorization': 'Bearer BQD...' // This will be replaced with client credentials flow
                    }
                }
            );

            if (!response.ok) {
                // Fallback to iTunes if Spotify fails
                return null;
            }

            const data = await response.json();

            if (data.tracks && data.tracks.items.length > 0) {
                // Try to find best match
                const match = data.tracks.items.find(track =>
                    track.name.toLowerCase().includes(cleanTitle.toLowerCase()) &&
                    track.artists[0].name.toLowerCase().includes(cleanArtist.toLowerCase())
                ) || data.tracks.items[0];

                // Get the largest image (usually 640x640)
                if (match.album.images && match.album.images.length > 0) {
                    return match.album.images[0].url; // Largest image
                }
            }

            return null;
        } catch (error) {
            console.warn('Spotify cover art search failed:', error);
            return null;
        }
    }
};
