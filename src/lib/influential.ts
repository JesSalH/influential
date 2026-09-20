export const reels = [
    {
        id: "social",
        label: "Social content",
        caption: "WWDC just happened.",
        blurb: "Casual at home. Native to TikTok, Reels, and Stories — captions already in the frame.",
        image: "/reels/social.jpg",
        video: "/loops/social.mp4",
    },
    {
        id: "courses",
        label: "Online courses",
        caption: "Lesson 04 — keep going.",
        blurb: "Bright room, teaching cadence. The same face that sold a product now holds a ten-minute module.",
        image: "/reels/courses.jpg",
        video: "/loops/courses.mp4",
    },
    {
        id: "legal",
        label: "Legal",
        caption: "Not a formula.",
        blurb: "Law library, navy blazer. Authority without a booth day or a second actor.",
        image: "/reels/legal.jpg",
        video: "/loops/legal.mp4",
    },
    {
        id: "finance",
        label: "Finance",
        caption: "Zero account minimums.",
        blurb: "Charts behind, papers in reach. A closer who never misses a compliance line.",
        image: "/reels/finance.jpg",
        video: "/loops/finance.mp4",
    },
    {
        id: "real-estate",
        label: "Real estate",
        caption: "The kind of house made for hosting.",
        blurb: "Luxury kitchen, hosting energy. One avatar, dressed for the listing.",
        image: "/reels/real-estate.jpg",
        video: "/loops/real-estate.mp4",
    },
] as const;

export const pillars = [
    {
        id: "avatar",
        n: "01",
        name: "AI Avatar Generator",
        lede: "Hyper-real faces that lock. Same identity across every angle, language, and cut.",
        detail: "Trained on how a person talks, gestures, and holds a frame. One recording becomes wides, mediums, and close-ups that still read as the same human — no drift, no valley.",
        image: "/product/avatar-face.jpg",
    },
    {
        id: "video-agent",
        n: "02",
        name: "Video Agent",
        lede: "Type the idea. The agent returns a finished video — avatar, B-roll, type, audio.",
        detail: "Prompt to picture: A-roll presenter, B-roll, motion graphics, captions. Then it stays editable in Studio — change type, color, and timing without rendering from scratch.",
        image: "/product/agent-prompt.jpg",
    },
    {
        id: "studio",
        n: "03",
        name: "AI Studio",
        lede: "A document that directs. Tone, pace, gesture, and brand in one page.",
        detail: "Script-driven control. Voice Director, Voice Mirroring, Gesture Control, Brand Kit, auto captions, and multiplayer comments — video as easy as writing a document.",
        image: "/product/studio.jpg",
    },
    {
        id: "translation",
        n: "04",
        name: "Video Translation",
        lede: "Clone the voice, lock the lips, ship 175+ languages from one recording.",
        detail: "Upload a file or paste a YouTube link. Voice clone + phoneme lip-sync, brand glossary, multilingual player. Dub a finished cut or regenerate the project natively in each language.",
        image: "/product/translate.jpg",
    },
] as const;

export const tools = [
    {
        name: "Text to Video",
        href: "/#video-agent",
        jump: "Video Agent",
        blurb: "Write a script or a one-line brief. The agent returns a finished cut: avatar, voice, B-roll, type.",
    },
    {
        name: "Image to Video",
        href: "/#video-agent",
        jump: "Video Agent",
        blurb: "Start from a still. Lip-sync, motion, and a spoken line — the photo becomes a take.",
    },
    {
        name: "AI Avatars",
        href: "/#avatar",
        jump: "Avatar Generator",
        blurb: "Lock a face that holds. Same identity across angles, runtimes, and languages.",
    },
    {
        name: "AI Studio",
        href: "/#studio",
        jump: "AI Studio",
        blurb: "A document that directs. Tone, gesture, captions, and brand live on the page.",
    },
    {
        name: "Video Translate",
        href: "/#translation",
        jump: "Translation",
        blurb: "One recording, 175+ languages. Voice cloned, lips locked, no reshoot.",
    },
    {
        name: "Audio to Video",
        href: "/#studio",
        jump: "AI Studio",
        blurb: "Drop a podcast or a voice-over. A presenter appears on camera and speaks the file.",
    },
] as const;

export const locales = [
    { id: "en", label: "English", line: "One recording. Every market." },
    { id: "es", label: "Spanish", line: "Una grabación. Todos los mercados." },
    { id: "de", label: "German", line: "Eine Aufnahme. Jeder Markt." },
    { id: "ko", label: "Korean", line: "한 번의 촬영. 모든 시장." },
] as const;

export const STUDIO_URL = "https://video.influentiallabs.studio/";

export const selfServe = [
    {
        n: "01",
        t: "Image editing",
        d: "Upload a photo. Describe the change. 10 coins — refunded if it fails.",
    },
    {
        n: "02",
        t: "Image to video",
        d: "A still plus a clip. Review the take. 50 coins, charged only if you accept.",
    },
    {
        n: "03",
        t: "Long scenes",
        d: "A timed script up to 60s. From 80 coins. Nothing billed until you keep it.",
    },
    {
        n: "04",
        t: "Talking video",
        d: "Portrait + audio, lip-synced. 15 coins per 10s. Review before you pay.",
    },
] as const;
