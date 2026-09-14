export const reels = [
  {
    id: "social",
    label: "Social content",
    caption: "WWDC just happened.",
    blurb: "Casual at home. Native to TikTok, Reels, and Stories — captions already in the frame.",
    image: "/reels/social.jpg",
  },
  {
    id: "courses",
    label: "Online courses",
    caption: "Lesson 04 — keep going.",
    blurb: "Bright room, teaching cadence. The same face that sold a product now holds a ten-minute module.",
    image: "/reels/courses.jpg",
  },
  {
    id: "legal",
    label: "Legal",
    caption: "Not a formula.",
    blurb: "Law library, navy blazer. Authority without a booth day or a second actor.",
    image: "/reels/legal.jpg",
  },
  {
    id: "finance",
    label: "Finance",
    caption: "Zero account minimums.",
    blurb: "Charts behind, papers in reach. A closer who never misses a compliance line.",
    image: "/reels/finance.jpg",
  },
  {
    id: "real-estate",
    label: "Real estate",
    caption: "The kind of house made for hosting.",
    blurb: "Luxury kitchen, hosting energy. One avatar, dressed for the listing.",
    image: "/reels/real-estate.jpg",
  },
] as const;

export const pillars = [
  {
    id: "avatar",
    n: "01",
    name: "AI Avatar Generator",
    lede: "Hyper-real faces that lock. Same identity across every angle, language, and cut.",
    detail:
      "Trained on how a person talks, gestures, and holds a frame. One recording becomes wides, mediums, and close-ups that still read as the same human — no drift, no valley.",
    image: "/product/avatar-face.jpg",
  },
  {
    id: "video-agent",
    n: "02",
    name: "Video Agent",
    lede: "Type the idea. The agent returns a finished video — avatar, B-roll, type, audio.",
    detail:
      "Prompt to picture: A-roll presenter, B-roll, motion graphics, captions. Then it stays editable in Studio — change type, color, and timing without rendering from scratch.",
    image: "/product/agent-prompt.jpg",
  },
  {
    id: "studio",
    n: "03",
    name: "AI Studio",
    lede: "A document that directs. Tone, pace, gesture, and brand in one page.",
    detail:
      "Script-driven control. Voice Director, Voice Mirroring, Gesture Control, Brand Kit, auto captions, and multiplayer comments — video as easy as writing a document.",
    image: "/product/studio.jpg",
  },
  {
    id: "translation",
    n: "04",
    name: "Video Translation",
    lede: "Clone the voice, lock the lips, ship 175+ languages from one recording.",
    detail:
      "Upload a file or paste a YouTube link. Voice clone + phoneme lip-sync, brand glossary, multilingual player. Dub a finished cut or regenerate the project natively in each language.",
    image: "/product/translate.jpg",
  },
] as const;

export const tools = [
  { name: "Text to Video", href: "/#video-agent" },
  { name: "Image to Video", href: "/#video-agent" },
  { name: "AI Avatars", href: "/#avatar" },
  { name: "AI Studio", href: "/#studio" },
  { name: "Video Translate", href: "/#translation" },
  { name: "Audio to Video", href: "/#studio" },
] as const;

export const locales = [
  { id: "en", label: "English", line: "One recording. Every market." },
  { id: "es", label: "Spanish", line: "Una grabación. Todos los mercados." },
  { id: "de", label: "German", line: "Eine Aufnahme. Jeder Markt." },
  { id: "ko", label: "Korean", line: "한 번의 촬영. 모든 시장." },
] as const;
