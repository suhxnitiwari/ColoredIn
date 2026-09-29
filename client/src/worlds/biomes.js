import * as A from './art.jsx';

// One world per STREAMS group, in stream order. The stream flows down through
// each world and drops over a waterfall into the next.
//   near  – scenery placed beside the stream, opposite each career stop
//   edges – bigger scenery in the side margins on wide screens
//   critters – small animals and details sprinkled along the banks
export const BIOMES = [
  {
    key: 'rainforest', name: 'Rainforest', emoji: '🌴',
    bg: '#bfe6c6', far: '#8fd09f', bank: '#6fbf84', water: '#58bfbf', light: '#9fe3e0',
    cliff: { rock: '#8d6e5a', dark: '#6f5444', lip: '#5cc27a' },
    near: [A.Monstera, A.JungleTree, A.Palm, A.Hibiscus, A.Monstera, A.Palm],
    edges: [A.JungleTree, A.Palm, A.JungleTree, A.Monstera],
    critters: [A.Toucan, A.Parrot, A.Monkey, A.Butterfly],
    particles: 'butterflies',
  },
  {
    key: 'desert', name: 'Desert', emoji: '🌵',
    bg: '#fbe3b4', far: '#f3cf92', bank: '#e8c180', water: '#5fb8d9', light: '#a7def0',
    cliff: { rock: '#d9955f', dark: '#b8773f', lip: '#f2cf8e' },
    near: [A.Saguaro, A.BarrelCactus, A.Saguaro, A.Palm, A.BarrelCactus],
    edges: [A.Mesa, A.Saguaro, A.Dune, A.Mesa],
    critters: [A.Lizard, A.Tumbleweed, A.BarrelCactus],
    particles: null,
  },
  {
    key: 'autumn', name: 'Autumn Forest', emoji: '🍂',
    bg: '#fde0c4', far: '#f6c49a', bank: '#d9a36f', water: '#5fa8d9', light: '#a7d3f0',
    cliff: { rock: '#9a7b62', dark: '#7d624c', lip: '#e0945a' },
    near: [A.AutumnTree, A.Mushroom, A.AutumnTree, A.Pumpkin],
    edges: [A.AutumnTree, A.AutumnTree, A.AutumnTree],
    critters: [A.Fox, A.Owl, A.Mushroom],
    particles: 'leaves',
  },
  {
    key: 'mountains', name: 'Mountains', emoji: '🏔️',
    bg: '#dce9f2', far: '#c2d4e4', bank: '#a9b6c4', water: '#4fa3d9', light: '#a3d4f2',
    cliff: { rock: '#7f8c9c', dark: '#667384', lip: '#8fcf9c' },
    near: [A.Pine, A.Pine, A.Pine],
    edges: [A.Mountain, A.Pine, A.Mountain],
    critters: [A.Goat, A.Bunny, A.Rock],
    particles: null,
  },
  {
    key: 'garden', name: 'Blossom Garden', emoji: '🌸',
    bg: '#fde3ee', far: '#f9cde0', bank: '#a8dcb0', water: '#6fbfe0', light: '#b6e3f5',
    cliff: { rock: '#b59a9a', dark: '#997f7f', lip: '#9fdcaa' },
    near: [A.BlossomTree, A.Tulips, A.Sunflower, A.BlossomTree],
    edges: [A.BlossomTree, A.Rainbow, A.BlossomTree],
    critters: [A.Bunny, A.Butterfly, A.Tulips],
    particles: 'petals',
  },
  {
    key: 'tundra', name: 'Snowy Tundra', emoji: '❄️',
    bg: '#eaf3fa', far: '#d6e7f4', bank: '#ffffff', water: '#7cc4e8', light: '#c6e8f7',
    cliff: { rock: '#a8c3d8', dark: '#8eaac0', lip: '#ffffff' },
    near: [A.Pine, A.Snowman, A.Igloo, A.Pine],
    edges: [A.Pine, A.IceHill, A.Pine],
    critters: [A.Penguin, A.Penguin, A.Bunny],
    particles: 'snow',
    snowy: true,
  },
  {
    key: 'beach', name: 'Sunny Beach', emoji: '🏖️',
    bg: '#fdf0d2', far: '#f7e2b4', bank: '#f0d49a', water: '#4fc3d9', light: '#a7e6f0',
    cliff: { rock: '#d9b27a', dark: '#bf955c', lip: '#f2cf8e' },
    near: [A.Palm, A.Umbrella, A.Sandcastle, A.Palm],
    edges: [A.Palm, A.Lighthouse, A.Palm],
    critters: [A.Crab, A.Shell, A.Starfish],
    particles: 'gulls',
  },
];

// Where the journey begins: a cliff under open sky.
export const SKY = {
  key: 'sky', bg: '#dff1ff', cliff: { rock: '#8d7a6a', dark: '#6f5f52', lip: '#5cc27a' },
};

export const biomeFor = (index) => BIOMES[index % BIOMES.length];
