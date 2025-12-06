const YOUTUBE_API_ENDPOINT = "https://www.googleapis.com/youtube/v3";

export const YouTubeService = {
    // Search Videos
    searchVideos: async (query, apiKey) => {
        if (!apiKey) throw new Error("No API Key provided");

        const url = `${YOUTUBE_API_ENDPOINT}/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "YouTube search failed");
        }

        const data = await response.json();

        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle, // Best approximation
            cover: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            description: item.snippet.description
        }));
    },

    // Get Trending Music Videos
    getTrendingVideos: async (apiKey) => {
        if (!apiKey) throw new Error("No API Key provided");

        // videoCategoryId=10 is "Music"
        const url = `${YOUTUBE_API_ENDPOINT}/videos?part=snippet&chart=mostPopular&regionCode=US&videoCategoryId=10&maxResults=10&key=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "YouTube trending fetch failed");
        }

        const data = await response.json();

        return data.items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            cover: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            description: item.snippet.description
        }));
    }
};
