// The seven STREAMS groups, in stream order.
export const categories = [
  { name: 'Science & Discovery', icon: '🔬', color: '#2fa9a9', description: 'Exploring space and dinosaurs, doing experiments, and caring for people and animals.' },
  { name: 'Technology & Inventing', icon: '🤖', color: '#4a90e2', description: 'Coding games and apps, building robots, and inventing brand-new things.' },
  { name: 'Reading, Writing & Words', icon: '📚', color: '#c060d8', description: 'Using words to tell stories, share news and make things fair.' },
  { name: 'Engineering, Building & Fixing', icon: '🛠️', color: '#8b2b9e', description: 'Designing, building and fixing the things we use every day.' },
  { name: 'Arts & Creativity', icon: '🎨', color: '#f28c38', description: 'Making music, movies, food and cartoons that people love.' },
  { name: 'Math & Money', icon: '💰', color: '#3fae8f', description: 'Using numbers to run businesses, grow money and win games.' },
  { name: 'Supporters', icon: '🤝', color: '#e85d75', description: 'Helping, protecting and leading the people in our communities.' },
].map((c, i) => ({ ...c, sort_order: i }));

const S1 = 'Science & Discovery';
const T = 'Technology & Inventing';
const R = 'Reading, Writing & Words';
const E = 'Engineering, Building & Fixing';
const A = 'Arts & Creativity';
const M = 'Math & Money';
const S2 = 'Supporters';

// [category, title, description, fun fact, drawing (if one exists yet)]
const rows = [
  [S1, 'Astronaut', 'An astronaut travels into space! She does science experiments, fixes spacecraft, and looks back at Earth from way up high.', 'Astronauts on the space station see about 16 sunrises every day.', 'astronaut'],
  [S1, 'Astronomer', 'An astronomer studies the stars, planets, and moon. She uses giant telescopes to look deep into space and discover new things in the night sky.', 'Some telescopes live in round buildings whose roofs open up to the sky.'],
  [S1, 'Paleontologist', 'A paleontologist digs up dinosaur bones and fossils. She carefully brushes away the dirt and puts the bones together to learn how dinosaurs lived.', 'Some dinosaur bones are taller than a grown-up person!'],
  [S1, 'Lab Scientist', 'A lab scientist does experiments to discover new things. She uses microscopes and test tubes to find cures and answer big questions.', 'Microscopes show tiny things that are too small to see with just your eyes.'],
  [S1, 'Heart Surgeon', "A heart surgeon is a doctor who fixes hearts. She uses careful hands and special tools to help people's hearts beat strong and healthy.", 'Your heart beats about 100,000 times every day!'],
  [S1, 'Pediatrician', 'A pediatrician is a doctor just for kids. She gives checkups, listens to your heart, and helps you grow up healthy and strong.', "A doctor's stethoscope lets her hear your heartbeat."],
  [S1, 'Nurse', 'A nurse takes care of people when they are sick or hurt. She checks how they are feeling, gives medicine, and helps them get better.', 'Nurses often wear comfy clothes called scrubs.'],
  [S1, 'Veterinarian', 'A veterinarian is a doctor for animals. She takes care of puppies, kittens, horses, and more, and helps them get healthy.', 'Some vets take care of zoo animals like giraffes and elephants!'],

  [T, 'Coder', 'A coder writes instructions for computers, called code. She tells computers what to do so they can run games, websites, and apps.', 'One of the very first computer programmers was a woman named Ada Lovelace.'],
  [T, 'Video Game Designer', 'A video game designer dreams up games! She creates the characters, worlds, and puzzles, then tests them to make sure they are super fun.', 'Some video games take hundreds of people years to make.'],
  [T, 'App Maker', 'An app maker builds the apps you tap on phones and tablets. She designs the buttons and screens and writes code to make them work.', 'Every app on a tablet was made by people who learned to code.'],
  [T, 'Robot Engineer', 'A robot engineer builds robots! She designs robots that help in hospitals, explore other planets, and even clean floors.', 'Robots are rolling around on Mars right now, exploring the planet.'],
  [T, 'Inventor', "An inventor comes up with brand-new ideas and builds them. She tests her inventions, fixes what doesn't work, and tries again until it's just right.", 'Windshield wipers on cars were invented by a woman named Mary Anderson.'],
  [T, 'Toy Designer', 'A toy designer dreams up new toys and games. She draws her ideas, builds models, and tests them to make sure they are fun and safe.', 'Toy designers build lots of practice versions before a toy reaches the store.'],

  [R, 'Lawyer', 'A lawyer knows all about the rules, called laws. She reads, writes, and speaks up to make sure people are treated fairly.', 'Lawyers read lots of books to learn how laws work.', 'lawyer'],
  [R, 'Judge', 'A judge is in charge of the courtroom. She listens carefully to both sides, follows the laws, and makes fair decisions.', 'Judges often wear long black robes.'],
  [R, 'Journalist', 'A journalist finds out what is happening in the world and tells everyone. She asks questions, writes stories, and shares the news.', 'Journalists ask who, what, when, where, why, and how.'],
  [R, 'Podcast Host', 'A podcast host makes shows that people listen to. She talks about fun topics, tells stories, and interviews interesting guests.', 'You can listen to podcasts in the car, at home, or on a walk!'],
  [R, 'Editor-in-Chief', 'An editor-in-chief is the boss of a magazine or newspaper. She decides which stories to share and helps writers make their words shine.', 'Editors read every story carefully to catch mistakes.'],

  [E, 'Mechanical Engineer', 'A mechanical engineer designs and builds machines that move, like robots, cars, and roller coasters. She uses tools and math to make them work!', 'Mechanical engineers help design the rides at amusement parks.', 'mechanical-engineer'],
  [E, 'Electrical Engineer', 'An electrical engineer works with electricity. She builds circuits that make lights glow, phones ring, and computers turn on.', 'The tiny paths on a circuit board are like roads for electricity.', 'electrical-engineer'],
  [E, 'Biomedical Engineer', 'A biomedical engineer invents tools that help doctors and keep people healthy, like special microscopes and machines that listen to your heart.', 'Biomedical engineers helped invent robot arms and legs that help people move.', 'biomedical-engineer'],
  [E, 'Civil Engineer', 'A civil engineer designs bridges, roads, and tunnels. She makes sure they are strong and safe for cars, trains, and people to use every day.', "Some bridges are built to sway a tiny bit in the wind so they don't break."],
  [E, 'Architect', 'An architect designs buildings, like homes, schools, and skyscrapers. She draws plans that show builders exactly how to make them.', 'Architects often build tiny models of a building before the real one is made.'],
  [E, 'Construction Worker', 'A construction worker builds the buildings and roads we use. She uses big machines, tools, and teamwork to make plans come to life.', "Hard hats protect builders' heads on busy construction sites."],

  [A, 'Pop Star', 'A pop star writes and sings songs that people love to sing along to. She plays instruments, practices a lot, and performs on big stages.', 'Music can make your heart beat faster or help you feel calm.', 'musician'],
  [A, 'Dancer', 'A dancer tells stories with her body. She practices every day to learn new moves and performs on stages, in music videos, and in movies.', 'Dancers practice the same moves again and again until they know them by heart.'],
  [A, 'Movie Director', 'A movie director is the leader of a movie. She tells the actors what to do, picks where the camera goes, and turns a story into a film.', 'Directors say "Action!" to start filming and "Cut!" to stop.'],
  [A, 'Orchestra Conductor', 'An orchestra conductor leads a big group of musicians. She waves a small stick called a baton to help everyone play together at just the right time.', 'A big orchestra can have about 100 musicians!'],
  [A, 'Head Chef', 'A head chef is the boss of a restaurant kitchen. She creates new recipes, leads the cooks, and makes sure every plate looks and tastes delicious.', "A chef's tall white hat is called a toque."],
  [A, 'Animator', 'An animator brings drawings to life! She makes characters move and talk in cartoons and movies, one picture at a time.', "Cartoons are lots of pictures shown really fast, so they look like they're moving."],

  [M, 'CEO', 'A CEO is the top boss of a company. She makes big decisions, leads a team, and helps the company grow and do great things.', 'CEO stands for Chief Executive Officer.'],
  [M, 'Business Owner', 'A business owner starts her own company, like a bakery, shop, or toy store. She comes up with ideas, counts the money, and takes care of customers.', "Lots of big companies started as a tiny idea at someone's kitchen table."],
  [M, 'Fashion Brand Founder', 'A fashion brand founder starts her own clothing company. She designs outfits, picks fabrics, and runs the business that sells them around the world.', 'Designers often sketch hundreds of ideas before sewing one dress.', 'fashion-designer'],
  [M, 'Banker', 'A banker helps people save and take care of their money. She helps families buy homes and helps businesses grow.', 'Banks keep money safe in super-strong rooms called vaults.'],
  [M, 'Economist', 'An economist studies how people earn, spend, and share money. She uses math to help cities and countries make smart choices.', 'Economists study why things cost what they cost.'],

  [S2, 'Firefighter', 'A firefighter is brave and strong. She puts out fires, rescues people, and teaches everyone how to stay safe.', 'Firefighter gear keeps them safe even when it is very, very hot.', 'firefighter'],
  [S2, 'Pilot', 'A pilot flies airplanes. She checks the weather, reads the controls in the cockpit, and takes people safely all around the world.', 'Pilots talk to air traffic controllers who help guide every plane.', 'pilot'],
  [S2, 'Police Officer', 'A police officer helps keep our neighborhoods safe. She helps people who are lost or in trouble and makes sure everyone follows the rules.', 'Some police officers work with helper dogs or ride horses!'],
  [S2, 'Paramedic', 'A paramedic rides in an ambulance to help people who are hurt or sick. She gives care right away and gets them to the hospital quickly.', 'Ambulances have flashing lights and sirens so cars know to move over.'],
  [S2, 'Mayor', 'A mayor is the leader of a town or city. She listens to people, makes plans for parks and schools, and helps the city grow.', 'Towns and cities have mayors, and countries have presidents.'],
];

export const pages = rows.map(([category, title, job_description, fun_fact, drawing]) => ({
  category, title, job_description, fun_fact, image_url: drawing ? `/pages/${drawing}.png` : null,
}));
