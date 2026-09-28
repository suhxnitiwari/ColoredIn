export const categories = [
  { name: 'Engineering & Building', color: '#8b2b9e', description: 'Designing and building the machines, bridges, and gadgets we use every day.' },
  { name: 'Science & Discovery', color: '#58bfbf', description: 'Asking big questions and exploring oceans, stars, and everything in between.' },
  { name: 'Community Helpers', color: '#ff8fb3', description: 'Keeping people safe, informed, and cared for in our towns and cities.' },
  { name: 'Arts', color: '#b867d3', description: 'Making music, stories, pictures, and clothes that people love.' },
  { name: 'Healthcare', color: '#3fae8f', description: 'Helping people and animals feel healthy and strong.' },
  { name: 'Technology & Math', color: '#581a66', description: 'Writing code, building robots, and solving puzzles with numbers.' },
  { name: 'Business', color: '#e39a3b', description: 'Starting companies, sharing great ideas, and helping businesses grow.' },
].map((c, i) => ({ ...c, sort_order: i }));

export const pages = [
  {
    title: 'Mechanical Engineer', category: 'Engineering & Building', image_url: '/pages/mechanical-engineer.png',
    job_description: 'A mechanical engineer designs and builds machines that move, like robots, cars, and roller coasters. She uses tools and math to make them work!',
    fun_fact: 'Mechanical engineers help design the rides at amusement parks.',
  },
  {
    title: 'Biomedical Engineer', category: 'Engineering & Building', image_url: '/pages/biomedical-engineer.png',
    job_description: 'A biomedical engineer invents tools that help doctors and keep people healthy, like special microscopes and machines that listen to your heart.',
    fun_fact: 'Biomedical engineers helped invent robot arms and legs that help people move.',
  },
  {
    title: 'Electrical Engineer', category: 'Engineering & Building', image_url: '/pages/electrical-engineer.png',
    job_description: 'An electrical engineer works with electricity. She builds circuits that make lights glow, phones ring, and computers turn on.',
    fun_fact: 'The tiny paths on a circuit board are like roads for electricity.',
  },
  {
    title: 'Astronaut', category: 'Science & Discovery', image_url: '/pages/astronaut.png',
    job_description: 'An astronaut travels into space! She does science experiments, fixes spacecraft, and looks back at Earth from way up high.',
    fun_fact: 'Astronauts on the space station see about 16 sunrises every day.',
  },
  {
    title: 'Pilot', category: 'Community Helpers', image_url: '/pages/pilot.png',
    job_description: 'A pilot flies airplanes. She checks the weather, reads the controls in the cockpit, and takes people safely all around the world.',
    fun_fact: 'Pilots talk to air traffic controllers who help guide every plane.',
  },
  {
    title: 'Firefighter', category: 'Community Helpers', image_url: '/pages/firefighter.png',
    job_description: 'A firefighter is brave and strong. She puts out fires, rescues people, and teaches everyone how to stay safe.',
    fun_fact: 'Firefighter gear keeps them safe even when it is very, very hot.',
  },
  {
    title: 'Teacher', category: 'Community Helpers', image_url: '/pages/teacher.png',
    job_description: 'A teacher helps kids learn to read, count, and discover new things. She makes the classroom a happy place to grow.',
    fun_fact: 'Every job in the world started with someone who had a teacher.',
  },
  {
    title: 'Lawyer', category: 'Community Helpers', image_url: '/pages/lawyer.png',
    job_description: 'A lawyer knows all about the rules, called laws. She reads, writes, and speaks up to make sure people are treated fairly.',
    fun_fact: 'Lawyers read lots of books to learn how laws work.',
  },
  {
    title: 'Musician', category: 'Arts', image_url: '/pages/musician.png',
    job_description: 'A musician makes music! She writes songs, plays instruments like the guitar, and sings to share feelings with the world.',
    fun_fact: 'Music can make your heart beat faster or help you feel calm.',
  },
  {
    title: 'Fashion Designer', category: 'Arts', image_url: '/pages/fashion-designer.png',
    job_description: 'A fashion designer draws and sews clothes. She picks colors and fabrics to make outfits that people love to wear.',
    fun_fact: 'Designers often sketch hundreds of ideas before sewing one dress.',
  },
];
