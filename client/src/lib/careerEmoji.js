// Friendly emoji stand-ins for careers whose drawings aren't ready yet.
const EMOJI = {
  Astronaut: '🚀', Astronomer: '🔭', Paleontologist: '🦕', 'Lab Scientist': '🧪', 'Heart Surgeon': '❤️',
  Pediatrician: '🩺', Nurse: '🩹', Veterinarian: '🐶',
  Coder: '👩‍💻', 'Video Game Designer': '🎮', 'App Maker': '📱', 'Robot Engineer': '🤖', Inventor: '💡', 'Toy Designer': '🧸',
  Lawyer: '📚', Judge: '⚖️', Journalist: '📰', 'Podcast Host': '🎙️', 'Editor-in-Chief': '✍️',
  'Mechanical Engineer': '⚙️', 'Electrical Engineer': '⚡', 'Biomedical Engineer': '🔬', 'Civil Engineer': '🌉', Architect: '📐', 'Construction Worker': '👷‍♀️',
  'Pop Star': '🎤', Dancer: '💃', 'Movie Director': '🎬', 'Orchestra Conductor': '🎻', 'Head Chef': '👩‍🍳', Animator: '✏️',
  CEO: '💼', 'Business Owner': '🏪', 'Fashion Brand Founder': '👗', Banker: '🏦', Economist: '📈',
  Firefighter: '🚒', Pilot: '✈️', 'Police Officer': '👮‍♀️', Paramedic: '🚑', Mayor: '🏛️',
};

export const careerEmoji = (page) => EMOJI[page.title] ?? page.category?.icon ?? '✨';
