// Read-aloud: ElevenLabs audio from the server when configured,
// otherwise the browser's own speech synthesis.
let current;

export function stopSpeaking() {
  if (current) { current.pause(); current = null; }
  window.speechSynthesis?.cancel();
}

function browserSpeak(text) {
  const synth = window.speechSynthesis;
  if (!synth) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.1;
    const voices = synth.getVoices().filter((v) => v.lang.startsWith('en'));
    u.voice = voices.find((v) => /samantha|female|zira|google us english/i.test(v.name)) || voices[0] || null;
    u.onend = resolve;
    u.onerror = resolve;
    synth.speak(u);
  });
}

/** Speak a coloring page's title and description. Resolves when finished. */
export async function speakPage(page, text) {
  stopSpeaking();
  const src = page.audio_url || `/api/pages/${page.id}/speech`;
  try {
    const audio = new Audio(src);
    current = audio;
    await audio.play();
    await new Promise((resolve) => { audio.onended = resolve; audio.onpause = resolve; });
  } catch {
    current = null;
    await browserSpeak(text || `${page.title}. ${page.job_description}`);
  }
}

export function speak(text) {
  stopSpeaking();
  return browserSpeak(text);
}
