import { Tag } from './tags';

export type QuoteTone = 'soft' | 'direct' | 'cosmic' | 'scientific' | 'neutral';
export type QuoteSourceType = 'book' | 'meditation' | 'story' | 'learn';
export type QuoteCategory = 'classical' | 'modern' | 'poet-mystic' | 'physics' | 'complexity' | 'consciousness';

export interface PhilosopherQuote {
  id: string; // For tracking, A/B, future favorites
  quote: string; // 50-400 characters
  author: string; // Philosopher/scientist name
  category: QuoteCategory; // Category for quota system
  tags: Tag[]; // Using canonical Tag type
  secondaryTags?: Tag[]; // Secondary tags for multi-theme matching
  tone?: QuoteTone; // Optional tone category
  preferredTargetId?: string; // Manual override escape hatch
  preferredSourceType?: QuoteSourceType; // Manual override
  lastSeenAt?: string; // ISO date string - lightweight rotation
  lastSeenOrder?: number; // Order in which quote was last seen (for rotation bias)
  showCount?: number; // Frequency tracking
  disabled?: boolean; // Temporarily turn off without deletion
}

export const philosopherQuotes: PhilosopherQuote[] = [
  // Marcus Aurelius - Presence and Stoicism
  {
    id: 'marcus-aurelius-01',
    quote: 'You have power over your mind—not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
    category: 'classical',
    tags: ['presence', 'awareness', 'choice', 'resistance'],
    tone: 'direct'
  },
  {
    id: 'marcus-aurelius-02',
    quote: 'The happiness of your life depends upon the quality of your thoughts.',
    author: 'Marcus Aurelius',
    category: 'classical',
    tags: ['consciousness', 'awareness', 'mindfulness'],
    tone: 'neutral'
  },
  {
    id: 'marcus-aurelius-03',
    quote: 'Waste no more time arguing about what a good man should be. Be one.',
    author: 'Marcus Aurelius',
    category: 'classical',
    tags: ['presence', 'becoming', 'transformation'],
    tone: 'direct'
  },
  {
    id: 'marcus-aurelius-04',
    quote: 'Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.',
    author: 'Marcus Aurelius',
    category: 'classical',
    tags: ['perspective', 'awareness', 'consciousness'],
    tone: 'neutral'
  },
  
  // Albert Einstein - Physics and Perspective
  {
    id: 'einstein-01',
    quote: 'The most beautiful experience we can have is the mysterious. It is the fundamental emotion that stands at the cradle of true art and true science.',
    author: 'Albert Einstein',
    category: 'physics',
    tags: ['mystery', 'consciousness', 'transcendence'],
    tone: 'cosmic'
  },
  {
    id: 'einstein-02',
    quote: 'Time is an illusion. The distinction between past, present, and future is only a stubbornly persistent one.',
    author: 'Albert Einstein',
    category: 'physics',
    tags: ['time', 'relativity', 'perspective', 'consciousness'],
    tone: 'scientific'
  },
  {
    id: 'einstein-03',
    quote: 'Reality is merely an illusion, albeit a very persistent one.',
    author: 'Albert Einstein',
    category: 'physics',
    tags: ['consciousness', 'perspective', 'mystery'],
    tone: 'cosmic'
  },
  {
    id: 'einstein-04',
    quote: 'The important thing is not to stop questioning. Curiosity has its own reason for existing.',
    author: 'Albert Einstein',
    category: 'physics',
    tags: ['awareness', 'consciousness', 'mystery'],
    tone: 'scientific'
  },
  
  // Carl Jung - Consciousness and Identity
  {
    id: 'jung-01',
    quote: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.',
    author: 'Carl Jung',
    category: 'modern',
    tags: ['consciousness', 'awareness', 'identity', 'self'],
    tone: 'direct'
  },
  {
    id: 'jung-02',
    quote: 'What you resist, persists.',
    author: 'Carl Jung',
    category: 'modern',
    tags: ['resistance', 'presence', 'awareness'],
    tone: 'direct'
  },
  {
    id: 'jung-03',
    quote: 'The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.',
    author: 'Carl Jung',
    category: 'modern',
    tags: ['relationships', 'transformation', 'becoming'],
    tone: 'neutral'
  },
  {
    id: 'jung-04',
    quote: 'I am not what happened to me, I am what I choose to become.',
    author: 'Carl Jung',
    category: 'modern',
    tags: ['identity', 'becoming', 'choice', 'transformation'],
    tone: 'direct'
  },
  
  // Lao Tzu - Presence and Flow
  {
    id: 'lao-tzu-01',
    quote: 'The journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    category: 'classical',
    tags: ['presence', 'now', 'becoming', 'transformation'],
    tone: 'soft'
  },
  {
    id: 'lao-tzu-02',
    quote: 'When I let go of what I am, I become what I might be.',
    author: 'Lao Tzu',
    category: 'classical',
    tags: ['self', 'identity', 'becoming', 'transformation'],
    tone: 'soft'
  },
  {
    id: 'lao-tzu-03',
    quote: 'Nature does not hurry, yet everything is accomplished.',
    author: 'Lao Tzu',
    category: 'classical',
    tags: ['time', 'presence', 'now', 'awareness'],
    tone: 'soft'
  },
  {
    id: 'lao-tzu-04',
    quote: 'The wise find pleasure in water; the virtuous find pleasure in hills. The wise are active; the virtuous are tranquil.',
    author: 'Lao Tzu',
    category: 'classical',
    tags: ['presence', 'awareness', 'consciousness'],
    tone: 'soft'
  },
  
  // Friedrich Nietzsche - Becoming and Transformation
  {
    id: 'nietzsche-01',
    quote: 'He who has a why to live can bear almost any how.',
    author: 'Friedrich Nietzsche',
    category: 'modern',
    tags: ['meaning', 'choice', 'resistance', 'becoming'],
    tone: 'direct'
  },
  {
    id: 'nietzsche-02',
    quote: 'One must still have chaos in oneself to be able to give birth to a dancing star.',
    author: 'Friedrich Nietzsche',
    category: 'modern',
    tags: ['chaos', 'becoming', 'transformation', 'emergence'],
    secondaryTags: ['complexity'],
    tone: 'cosmic'
  },
  {
    id: 'nietzsche-03',
    quote: 'Become who you are.',
    author: 'Friedrich Nietzsche',
    category: 'modern',
    tags: ['identity', 'becoming', 'self'],
    tone: 'direct'
  },
  {
    id: 'nietzsche-04',
    quote: 'The individual has always had to struggle to keep from being overwhelmed by the tribe.',
    author: 'Friedrich Nietzsche',
    category: 'modern',
    tags: ['identity', 'self', 'resistance', 'relationships'],
    tone: 'direct'
  },
  
  // Rumi - Presence and Transcendence
  {
    id: 'rumi-01',
    quote: 'The wound is the place where the Light enters you.',
    author: 'Rumi',
    category: 'poet-mystic',
    tags: ['transformation', 'transcendence', 'becoming'],
    tone: 'soft'
  },
  {
    id: 'rumi-02',
    quote: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.',
    author: 'Rumi',
    category: 'poet-mystic',
    tags: ['transformation', 'self', 'becoming', 'presence'],
    tone: 'soft'
  },
  {
    id: 'rumi-03',
    quote: 'What you seek is seeking you.',
    author: 'Rumi',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'consciousness', 'mystery'],
    tone: 'cosmic'
  },
  
  // Heraclitus - Change and Flow
  {
    id: 'heraclitus-01',
    quote: 'No man ever steps in the same river twice, for it\'s not the same river and he\'s not the same man.',
    author: 'Heraclitus',
    category: 'classical',
    tags: ['change', 'time', 'impermanence', 'becoming'],
    tone: 'cosmic'
  },
  {
    id: 'heraclitus-02',
    quote: 'The only constant in life is change.',
    author: 'Heraclitus',
    category: 'classical',
    tags: ['change', 'time', 'impermanence'],
    tone: 'direct'
  },
  
  // Richard Feynman - Science and Mystery
  {
    id: 'feynman-01',
    quote: 'I think nature\'s imagination is so much greater than man\'s, she\'s never going to let us relax.',
    author: 'Richard Feynman',
    category: 'physics',
    tags: ['mystery', 'consciousness', 'complexity'],
    secondaryTags: ['emergence'],
    tone: 'scientific'
  },
  {
    id: 'feynman-02',
    quote: 'The first principle is that you must not fool yourself—and you are the easiest person to fool.',
    author: 'Richard Feynman',
    category: 'physics',
    tags: ['awareness', 'consciousness', 'self'],
    tone: 'direct'
  },
  
  // Alan Watts - Presence and Consciousness
  {
    id: 'watts-01',
    quote: 'The only way to make sense out of change is to plunge into it, move with it, and join the dance.',
    author: 'Alan Watts',
    category: 'modern',
    tags: ['change', 'presence', 'now', 'awareness'],
    tone: 'soft'
  },
  {
    id: 'watts-02',
    quote: 'This is the real secret of life—to be completely engaged with what you are doing in the here and now.',
    author: 'Alan Watts',
    category: 'modern',
    tags: ['presence', 'now', 'awareness', 'mindfulness'],
    tone: 'soft'
  },
  {
    id: 'watts-03',
    quote: 'You are that vast thing that you see far, far off with great telescopes.',
    author: 'Alan Watts',
    category: 'modern',
    tags: ['consciousness', 'self', 'transcendence', 'cosmic'],
    tone: 'cosmic'
  },
  
  // Viktor Frankl - Meaning and Choice
  {
    id: 'frankl-01',
    quote: 'Between stimulus and response there is a space. In that space is our power to choose our response.',
    author: 'Viktor Frankl',
    category: 'modern',
    tags: ['choice', 'presence', 'awareness', 'consciousness'],
    tone: 'direct'
  },
  {
    id: 'frankl-02',
    quote: 'Everything can be taken from a man but one thing: the last of the human freedoms—to choose one\'s attitude.',
    author: 'Viktor Frankl',
    category: 'modern',
    tags: ['choice', 'resistance', 'presence'],
    tone: 'direct'
  },
  
  // Thich Nhat Hanh - Mindfulness and Presence
  {
    id: 'thich-nhat-hanh-01',
    quote: 'The present moment is the only time over which we have dominion.',
    author: 'Thich Nhat Hanh',
    category: 'modern',
    tags: ['presence', 'now', 'mindfulness', 'awareness'],
    tone: 'soft'
  },
  {
    id: 'thich-nhat-hanh-02',
    quote: 'Walk as if you are kissing the Earth with your feet.',
    author: 'Thich Nhat Hanh',
    category: 'modern',
    tags: ['presence', 'mindfulness', 'embodiment', 'awareness'],
    tone: 'soft'
  },
  
  // David Bohm - Physics and Consciousness
  {
    id: 'bohm-01',
    quote: 'The ability to perceive or think differently is more important than the knowledge gained.',
    author: 'David Bohm',
    category: 'consciousness',
    tags: ['perspective', 'consciousness', 'awareness'],
    tone: 'scientific'
  },
  {
    id: 'bohm-02',
    quote: 'Reality is what we take to be true. What we take to be true is what we believe.',
    author: 'David Bohm',
    category: 'consciousness',
    tags: ['consciousness', 'perspective', 'awareness'],
    tone: 'scientific'
  },
  
  // Niels Bohr - Quantum Physics and Complementarity
  {
    id: 'bohr-01',
    quote: 'The opposite of a fact is falsehood, but the opposite of one profound truth may very well be another profound truth.',
    author: 'Niels Bohr',
    category: 'physics',
    tags: ['perspective', 'mystery', 'consciousness'],
    tone: 'scientific'
  },
  
  // Werner Heisenberg - Uncertainty and Observation
  {
    id: 'heisenberg-01',
    quote: 'What we observe is not nature itself, but nature exposed to our method of questioning.',
    author: 'Werner Heisenberg',
    category: 'physics',
    tags: ['perspective', 'consciousness', 'awareness', 'mystery'],
    tone: 'scientific'
  },
  
  // Erwin Schrödinger - Consciousness and Physics
  {
    id: 'schrodinger-01',
    quote: 'The total number of minds in the universe is one.',
    author: 'Erwin Schrödinger',
    category: 'physics',
    tags: ['consciousness', 'transcendence', 'mystery'],
    secondaryTags: ['awareness'],
    tone: 'cosmic'
  },
  
  // Ilya Prigogine - Complexity and Time
  {
    id: 'prigogine-01',
    quote: 'The future is not given. It is constructed in the process of becoming.',
    author: 'Ilya Prigogine',
    category: 'complexity',
    tags: ['time', 'becoming', 'complexity', 'emergence'],
    tone: 'scientific'
  },
  
  // Stuart Kauffman - Complexity and Emergence
  {
    id: 'kauffman-01',
    quote: 'We are the children of complexity, and we are beginning to understand it.',
    author: 'Stuart Kauffman',
    category: 'complexity',
    tags: ['complexity', 'emergence', 'consciousness'],
    tone: 'scientific'
  },
  
  // John Archibald Wheeler - Physics and Observation
  {
    id: 'wheeler-01',
    quote: 'We are participators in bringing into being not only the near and here but the far away and long ago.',
    author: 'John Archibald Wheeler',
    category: 'physics',
    tags: ['consciousness', 'perspective', 'time', 'mystery'],
    tone: 'cosmic'
  },
  
  // Jiddu Krishnamurti - Awareness and Freedom
  {
    id: 'krishnamurti-01',
    quote: 'The ability to observe without evaluating is the highest form of intelligence.',
    author: 'Jiddu Krishnamurti',
    category: 'modern',
    tags: ['awareness', 'consciousness', 'presence', 'mindfulness'],
    tone: 'soft'
  },
  {
    id: 'krishnamurti-02',
    quote: 'Freedom is not a reaction; freedom is not a choice. It is man\'s pretence that because he has choice he is free.',
    author: 'Jiddu Krishnamurti',
    category: 'modern',
    tags: ['choice', 'awareness', 'consciousness'],
    tone: 'direct'
  },
  
  // Pema Chödrön - Presence and Acceptance
  {
    id: 'pema-chodron-01',
    quote: 'You are the sky. Everything else—it\'s just the weather.',
    author: 'Pema Chödrön',
    category: 'modern',
    tags: ['presence', 'awareness', 'consciousness', 'self'],
    tone: 'soft'
  },
  {
    id: 'pema-chodron-02',
    quote: 'Nothing ever goes away until it has taught us what we need to know.',
    author: 'Pema Chödrön',
    category: 'modern',
    tags: ['presence', 'awareness', 'transformation', 'becoming'],
    tone: 'soft'
  },
  
  // Ramana Maharshi - Self and Awareness
  {
    id: 'ramana-maharshi-01',
    quote: 'The Self is always present. In your waking, dreaming, and sleeping states, the Self is always there.',
    author: 'Ramana Maharshi',
    category: 'modern',
    tags: ['self', 'awareness', 'consciousness', 'presence'],
    tone: 'soft'
  },
  
  // Epictetus - Stoicism and Choice
  {
    id: 'epictetus-01',
    quote: 'It\'s not what happens to you, but how you react to it that matters.',
    author: 'Epictetus',
    category: 'classical',
    tags: ['choice', 'resistance', 'presence', 'awareness'],
    tone: 'direct'
  },
  
  // Seneca - Time and Presence
  {
    id: 'seneca-01',
    quote: 'We are not given a short life but we make it short, and we are not ill-supplied but wasteful of it.',
    author: 'Seneca',
    category: 'classical',
    tags: ['time', 'presence', 'now', 'awareness'],
    tone: 'direct'
  },
  
  // Baruch Spinoza - Nature and Unity
  {
    id: 'spinoza-01',
    quote: 'The highest activity a human being can attain is learning for understanding, because to understand is to be free.',
    author: 'Baruch Spinoza',
    category: 'classical',
    tags: ['awareness', 'consciousness', 'transcendence'],
    tone: 'neutral'
  },
  
  // Immanuel Kant - Reason and Morality
  {
    id: 'kant-01',
    quote: 'Two things fill the mind with ever new and increasing admiration and awe: the starry heavens above me and the moral law within me.',
    author: 'Immanuel Kant',
    category: 'classical',
    tags: ['transcendence', 'mystery', 'consciousness'],
    tone: 'cosmic'
  },
  
  // William James - Consciousness and Experience
  {
    id: 'james-01',
    quote: 'The greatest discovery of my generation is that a human being can alter his life by altering his attitudes.',
    author: 'William James',
    category: 'modern',
    tags: ['consciousness', 'choice', 'transformation', 'becoming'],
    tone: 'direct'
  },
  
  // Henri Bergson - Time and Duration
  {
    id: 'bergson-01',
    quote: 'The present contains nothing more than the past, and what is found in the effect was already in the cause.',
    author: 'Henri Bergson',
    category: 'modern',
    tags: ['time', 'causality', 'consciousness'],
    tone: 'scientific'
  },
  
  // Martin Heidegger - Being and Time
  {
    id: 'heidegger-01',
    quote: 'Time is not a thing. Thus nothing which is, but rather the condition of the possibility of all Being.',
    author: 'Martin Heidegger',
    category: 'modern',
    tags: ['time', 'being', 'consciousness', 'mystery'],
    tone: 'cosmic'
  },
  
  // Stephen Hawking - Physics and Cosmology
  {
    id: 'hawking-01',
    quote: 'The universe doesn\'t allow perfection.',
    author: 'Stephen Hawking',
    category: 'physics',
    tags: ['mystery', 'consciousness', 'transcendence'],
    tone: 'scientific'
  },
  {
    id: 'hawking-02',
    quote: 'Intelligence is the ability to adapt to change.',
    author: 'Stephen Hawking',
    category: 'physics',
    tags: ['change', 'adaptation', 'consciousness'],
    tone: 'direct'
  },
  
  // Carl Sagan - Complexity and Cosmos
  {
    id: 'sagan-01',
    quote: 'The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.',
    author: 'Carl Sagan',
    category: 'complexity',
    tags: ['consciousness', 'transcendence', 'mystery'],
    tone: 'cosmic'
  },
  {
    id: 'sagan-02',
    quote: 'Somewhere, something incredible is waiting to be known.',
    author: 'Carl Sagan',
    category: 'complexity',
    tags: ['mystery', 'awareness', 'consciousness'],
    tone: 'scientific'
  },
  
  // Antonio Damasio - Consciousness and Neuroscience
  {
    id: 'damasio-01',
    quote: 'We are not thinking machines. We are feeling machines that think.',
    author: 'Antonio Damasio',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'emotion'],
    tone: 'scientific'
  },
  {
    id: 'damasio-02',
    quote: 'The self is a process, not a thing.',
    author: 'Antonio Damasio',
    category: 'consciousness',
    tags: ['self', 'identity', 'becoming', 'consciousness'],
    tone: 'scientific'
  },
  
  // Francisco Varela - Consciousness and Embodiment
  {
    id: 'varela-01',
    quote: 'The mind is not in the head, but in the relationship between the organism and its environment.',
    author: 'Francisco Varela',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'embodiment'],
    tone: 'scientific'
  },
  
  // V.S. Ramachandran - Neuroscience and Perception
  {
    id: 'ramachandran-01',
    quote: 'The boundary between self and other is more porous than we imagine.',
    author: 'V.S. Ramachandran',
    category: 'consciousness',
    tags: ['self', 'consciousness', 'awareness', 'relationships'],
    tone: 'scientific'
  },
  
  // Mary Oliver - Poetry and Presence
  {
    id: 'mary-oliver-01',
    quote: 'Tell me, what is it you plan to do with your one wild and precious life?',
    author: 'Mary Oliver',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'meaning', 'now'],
    tone: 'soft'
  },
  {
    id: 'mary-oliver-02',
    quote: 'You do not have to be good. You do not have to walk on your knees for a hundred miles through the desert, repenting.',
    author: 'Mary Oliver',
    category: 'poet-mystic',
    tags: ['presence', 'self', 'awareness', 'transformation'],
    tone: 'soft'
  },
  
  // Rabindranath Tagore - Poetry and Transcendence
  {
    id: 'tagore-01',
    quote: 'Let me not pray to be sheltered from dangers, but to be fearless in facing them.',
    author: 'Rabindranath Tagore',
    category: 'poet-mystic',
    tags: ['presence', 'resistance', 'transformation', 'becoming'],
    tone: 'soft'
  },
  {
    id: 'tagore-02',
    quote: 'The butterfly counts not months but moments, and has time enough.',
    author: 'Rabindranath Tagore',
    category: 'poet-mystic',
    tags: ['time', 'presence', 'now', 'awareness'],
    tone: 'soft'
  },
  
  // Murray Gell-Mann - Complexity and Emergence
  {
    id: 'gell-mann-01',
    quote: 'The study of complex adaptive systems is the study of how simple rules can lead to complex behavior.',
    author: 'Murray Gell-Mann',
    category: 'complexity',
    tags: ['complexity', 'emergence', 'systems', 'patterns'],
    tone: 'scientific'
  },
  {
    id: 'gell-mann-02',
    quote: 'Effective complexity is the length of a concise description of the regularities of an entity.',
    author: 'Murray Gell-Mann',
    category: 'complexity',
    tags: ['complexity', 'information', 'patterns'],
    tone: 'scientific'
  },
  
  // James Gleick - Chaos and Complexity
  {
    id: 'gleick-01',
    quote: 'Chaos is a science of process rather than state, of becoming rather than being.',
    author: 'James Gleick',
    category: 'complexity',
    tags: ['chaos', 'becoming', 'time', 'change'],
    tone: 'scientific'
  },
  {
    id: 'gleick-02',
    quote: 'In chaos theory, small differences in initial conditions yield widely diverging outcomes.',
    author: 'James Gleick',
    category: 'complexity',
    tags: ['chaos', 'sensitivity', 'change', 'emergence'],
    tone: 'scientific'
  },
  
  // Mitchell Waldrop - Complexity and Emergence
  {
    id: 'waldrop-01',
    quote: 'Complexity is the study of the behavior of macroscopic collections of simple units that are endowed with the potential to evolve.',
    author: 'Mitchell Waldrop',
    category: 'complexity',
    tags: ['complexity', 'emergence', 'evolution', 'systems'],
    tone: 'scientific'
  },
  
  // Brian Arthur - Complexity and Economics
  {
    id: 'arthur-01',
    quote: 'Complexity is not a theory but a movement in the sciences that studies how the interacting elements in a system create overall patterns.',
    author: 'W. Brian Arthur',
    category: 'complexity',
    tags: ['complexity', 'systems', 'patterns', 'emergence'],
    tone: 'scientific'
  },
  
  // Hafiz - Poetry and Mysticism
  {
    id: 'hafiz-01',
    quote: 'I wish I could show you when you are lonely or in darkness the astonishing light of your own being.',
    author: 'Hafiz',
    category: 'poet-mystic',
    tags: ['self', 'awareness', 'consciousness', 'transcendence'],
    tone: 'soft'
  },
  {
    id: 'hafiz-02',
    quote: 'The words you speak become the house you live in.',
    author: 'Hafiz',
    category: 'poet-mystic',
    tags: ['awareness', 'consciousness', 'transformation', 'becoming'],
    tone: 'soft'
  },
  {
    id: 'hafiz-03',
    quote: 'Stay close to anything that makes you glad you are alive.',
    author: 'Hafiz',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'now', 'meaning'],
    tone: 'soft'
  },
  
  // Walt Whitman - Poetry and Presence
  {
    id: 'whitman-01',
    quote: 'I am large, I contain multitudes.',
    author: 'Walt Whitman',
    category: 'poet-mystic',
    tags: ['self', 'identity', 'consciousness', 'transcendence'],
    tone: 'cosmic'
  },
  {
    id: 'whitman-02',
    quote: 'To me, every hour of the day and night is an unspeakably perfect miracle.',
    author: 'Walt Whitman',
    category: 'poet-mystic',
    tags: ['presence', 'now', 'awareness', 'mystery'],
    tone: 'soft'
  },
  {
    id: 'whitman-03',
    quote: 'Be curious, not judgmental.',
    author: 'Walt Whitman',
    category: 'poet-mystic',
    tags: ['awareness', 'consciousness', 'presence'],
    tone: 'direct'
  },
  
  // Emily Dickinson - Poetry and Transcendence
  {
    id: 'dickinson-01',
    quote: 'The brain is wider than the sky.',
    author: 'Emily Dickinson',
    category: 'poet-mystic',
    tags: ['consciousness', 'transcendence', 'mystery'],
    tone: 'cosmic'
  },
  {
    id: 'dickinson-02',
    quote: 'Forever is composed of nows.',
    author: 'Emily Dickinson',
    category: 'poet-mystic',
    tags: ['time', 'presence', 'now', 'eternity'],
    tone: 'soft'
  },
  
  // John Muir - Nature and Presence
  {
    id: 'muir-01',
    quote: 'The mountains are calling and I must go.',
    author: 'John Muir',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'transcendence', 'mystery'],
    tone: 'soft'
  },
  {
    id: 'muir-02',
    quote: 'In every walk with nature one receives far more than he seeks.',
    author: 'John Muir',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'mystery', 'transcendence'],
    tone: 'soft'
  },
  
  // More Physics Scientists
  // Max Planck - Quantum Physics
  {
    id: 'planck-01',
    quote: 'Science cannot solve the ultimate mystery of nature. And that is because, in the last analysis, we ourselves are part of the mystery that we are trying to solve.',
    author: 'Max Planck',
    category: 'physics',
    tags: ['mystery', 'consciousness', 'awareness'],
    tone: 'scientific'
  },
  {
    id: 'planck-02',
    quote: 'When you change the way you look at things, the things you look at change.',
    author: 'Max Planck',
    category: 'physics',
    tags: ['perspective', 'consciousness', 'awareness'],
    tone: 'scientific'
  },
  
  // Paul Dirac - Quantum Physics
  {
    id: 'dirac-01',
    quote: 'The underlying physical laws necessary for the mathematical theory of a large part of physics and the whole of chemistry are thus completely known.',
    author: 'Paul Dirac',
    category: 'physics',
    tags: ['mystery', 'consciousness', 'transcendence'],
    tone: 'scientific'
  },
  
  // More Consciousness Scientists
  // Gerald Edelman - Neuroscience and Consciousness
  {
    id: 'edelman-01',
    quote: 'Consciousness is not a thing but a process.',
    author: 'Gerald Edelman',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'becoming'],
    tone: 'scientific'
  },
  {
    id: 'edelman-02',
    quote: 'The brain is not a computer, and the world is not a piece of tape.',
    author: 'Gerald Edelman',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'mystery'],
    tone: 'scientific'
  },
  
  // Christof Koch - Consciousness Research
  {
    id: 'koch-01',
    quote: 'Consciousness is the way information feels when it is being processed.',
    author: 'Christof Koch',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'information'],
    tone: 'scientific'
  },
  
  // Giulio Tononi - Integrated Information Theory
  {
    id: 'tononi-01',
    quote: 'Consciousness is integrated information.',
    author: 'Giulio Tononi',
    category: 'consciousness',
    tags: ['consciousness', 'information', 'awareness'],
    tone: 'scientific'
  },
  
  // More Classical Philosophers
  // Plato - Classical Philosophy
  {
    id: 'plato-01',
    quote: 'The unexamined life is not worth living.',
    author: 'Plato',
    category: 'classical',
    tags: ['awareness', 'consciousness', 'self'],
    tone: 'direct'
  },
  {
    id: 'plato-02',
    quote: 'We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.',
    author: 'Plato',
    category: 'classical',
    tags: ['awareness', 'consciousness', 'transformation'],
    tone: 'direct'
  },
  
  // Aristotle - Classical Philosophy
  {
    id: 'aristotle-01',
    quote: 'Knowing yourself is the beginning of all wisdom.',
    author: 'Aristotle',
    category: 'classical',
    tags: ['self', 'awareness', 'consciousness'],
    tone: 'direct'
  },
  {
    id: 'aristotle-02',
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
    category: 'classical',
    tags: ['becoming', 'transformation', 'habits'],
    tone: 'direct'
  },
  
  // Confucius - Classical Philosophy
  {
    id: 'confucius-01',
    quote: 'The man who moves a mountain begins by carrying away small stones.',
    author: 'Confucius',
    category: 'classical',
    tags: ['presence', 'now', 'becoming', 'transformation'],
    tone: 'soft'
  },
  {
    id: 'confucius-02',
    quote: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    category: 'classical',
    tags: ['presence', 'becoming', 'transformation'],
    tone: 'soft'
  },
  
  // More Modern Philosophers
  // Joseph Campbell - Mythology and Meaning
  {
    id: 'campbell-01',
    quote: 'Follow your bliss and the universe will open doors where there were only walls.',
    author: 'Joseph Campbell',
    category: 'modern',
    tags: ['meaning', 'becoming', 'transformation', 'mystery'],
    tone: 'soft'
  },
  {
    id: 'campbell-02',
    quote: 'The cave you fear to enter holds the treasure you seek.',
    author: 'Joseph Campbell',
    category: 'modern',
    tags: ['resistance', 'transformation', 'becoming'],
    tone: 'direct'
  },
  
  // Eckhart Tolle - Presence and Awareness
  {
    id: 'tolle-01',
    quote: 'Realize deeply that the present moment is all you ever have.',
    author: 'Eckhart Tolle',
    category: 'modern',
    tags: ['presence', 'now', 'awareness'],
    tone: 'soft'
  },
  {
    id: 'tolle-02',
    quote: 'The primary cause of unhappiness is never the situation but your thoughts about it.',
    author: 'Eckhart Tolle',
    category: 'modern',
    tags: ['awareness', 'consciousness', 'presence'],
    tone: 'direct'
  },
  
  // Ram Dass - Presence and Consciousness
  {
    id: 'ram-dass-01',
    quote: 'Be here now.',
    author: 'Ram Dass',
    category: 'modern',
    tags: ['presence', 'now', 'awareness'],
    tone: 'soft'
  },
  {
    id: 'ram-dass-02',
    quote: 'The quieter you become, the more you can hear.',
    author: 'Ram Dass',
    category: 'modern',
    tags: ['presence', 'awareness', 'mindfulness'],
    tone: 'soft'
  },
  
  // More Physics - Roger Penrose
  {
    id: 'penrose-01',
    quote: 'Consciousness is not computation. It is something beyond computation.',
    author: 'Roger Penrose',
    category: 'physics',
    tags: ['consciousness', 'mystery', 'transcendence'],
    tone: 'scientific'
  },
  
  // More Complexity - Benoit Mandelbrot
  {
    id: 'mandelbrot-01',
    quote: 'Clouds are not spheres, mountains are not cones, coastlines are not circles, and bark is not smooth.',
    author: 'Benoit Mandelbrot',
    category: 'complexity',
    tags: ['complexity', 'patterns', 'mystery'],
    tone: 'scientific'
  },
  {
    id: 'mandelbrot-02',
    quote: 'Fractals are the geometry of nature.',
    author: 'Benoit Mandelbrot',
    category: 'complexity',
    tags: ['complexity', 'patterns', 'emergence'],
    tone: 'scientific'
  },
  
  // More Classical Philosophers
  // Buddha - Classical Philosophy
  {
    id: 'buddha-01',
    quote: 'The mind is everything. What you think you become.',
    author: 'Buddha',
    category: 'classical',
    tags: ['consciousness', 'awareness', 'becoming'],
    tone: 'soft'
  },
  {
    id: 'buddha-02',
    quote: 'Peace comes from within. Do not seek it without.',
    author: 'Buddha',
    category: 'classical',
    tags: ['presence', 'awareness', 'self'],
    tone: 'soft'
  },
  {
    id: 'buddha-03',
    quote: 'You will not be punished for your anger; you will be punished by your anger.',
    author: 'Buddha',
    category: 'classical',
    tags: ['awareness', 'consciousness', 'choice'],
    tone: 'direct'
  },
  
  // Socrates - Classical Philosophy
  {
    id: 'socrates-01',
    quote: 'I know that I know nothing.',
    author: 'Socrates',
    category: 'classical',
    tags: ['awareness', 'consciousness', 'mystery'],
    tone: 'direct'
  },
  {
    id: 'socrates-02',
    quote: 'The only true wisdom is in knowing you know nothing.',
    author: 'Socrates',
    category: 'classical',
    tags: ['awareness', 'consciousness', 'mystery'],
    tone: 'direct'
  },
  
  // Epictetus - More quotes
  {
    id: 'epictetus-02',
    quote: 'No man is free who is not master of himself.',
    author: 'Epictetus',
    category: 'classical',
    tags: ['self', 'choice', 'awareness'],
    tone: 'direct'
  },
  {
    id: 'epictetus-03',
    quote: 'We cannot choose our external circumstances, but we can always choose how we respond to them.',
    author: 'Epictetus',
    category: 'classical',
    tags: ['choice', 'resistance', 'awareness'],
    tone: 'direct'
  },
  
  // More Modern Philosophers
  // Simone de Beauvoir - Modern Philosophy
  {
    id: 'beauvoir-01',
    quote: 'One is not born, but rather becomes, a woman.',
    author: 'Simone de Beauvoir',
    category: 'modern',
    tags: ['becoming', 'identity', 'transformation'],
    tone: 'direct'
  },
  {
    id: 'beauvoir-02',
    quote: 'Change your life today. Don\'t gamble on the future, act now, without delay.',
    author: 'Simone de Beauvoir',
    category: 'modern',
    tags: ['presence', 'now', 'transformation'],
    tone: 'direct'
  },
  
  // Jean-Paul Sartre - Modern Philosophy
  {
    id: 'sartre-01',
    quote: 'Existence precedes essence.',
    author: 'Jean-Paul Sartre',
    category: 'modern',
    tags: ['becoming', 'identity', 'self'],
    tone: 'direct'
  },
  {
    id: 'sartre-02',
    quote: 'We are our choices.',
    author: 'Jean-Paul Sartre',
    category: 'modern',
    tags: ['choice', 'identity', 'becoming'],
    tone: 'direct'
  },
  
  // Søren Kierkegaard - Modern Philosophy
  {
    id: 'kierkegaard-01',
    quote: 'Life can only be understood backwards; but it must be lived forwards.',
    author: 'Søren Kierkegaard',
    category: 'modern',
    tags: ['time', 'presence', 'now', 'awareness'],
    tone: 'direct'
  },
  {
    id: 'kierkegaard-02',
    quote: 'The function of prayer is not to influence God, but rather to change the nature of the one who prays.',
    author: 'Søren Kierkegaard',
    category: 'modern',
    tags: ['transformation', 'becoming', 'awareness'],
    tone: 'soft'
  },
  
  // More Poets/Mystics
  // Kahlil Gibran - Poetry and Mysticism
  {
    id: 'gibran-01',
    quote: 'Your pain is the breaking of the shell that encloses your understanding.',
    author: 'Kahlil Gibran',
    category: 'poet-mystic',
    tags: ['transformation', 'becoming', 'awareness'],
    tone: 'soft'
  },
  {
    id: 'gibran-02',
    quote: 'Work is love made visible.',
    author: 'Kahlil Gibran',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'meaning'],
    tone: 'soft'
  },
  {
    id: 'gibran-03',
    quote: 'The deeper that sorrow carves into your being, the more joy you can contain.',
    author: 'Kahlil Gibran',
    category: 'poet-mystic',
    tags: ['transformation', 'becoming', 'presence'],
    tone: 'soft'
  },
  
  // Rainer Maria Rilke - Poetry and Presence
  {
    id: 'rilke-01',
    quote: 'Be patient toward all that is unsolved in your heart and try to love the questions themselves.',
    author: 'Rainer Maria Rilke',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'mystery'],
    tone: 'soft'
  },
  {
    id: 'rilke-02',
    quote: 'The only journey is the one within.',
    author: 'Rainer Maria Rilke',
    category: 'poet-mystic',
    tags: ['self', 'awareness', 'consciousness'],
    tone: 'soft'
  },
  
  // Pablo Neruda - Poetry and Presence
  {
    id: 'neruda-01',
    quote: 'I want to do with you what spring does with the cherry trees.',
    author: 'Pablo Neruda',
    category: 'poet-mystic',
    tags: ['presence', 'now', 'transformation'],
    tone: 'soft'
  },
  
  // More Physics Scientists
  // Werner Heisenberg - More quotes
  {
    id: 'heisenberg-02',
    quote: 'Not only is the Universe stranger than we think, it is stranger than we can think.',
    author: 'Werner Heisenberg',
    category: 'physics',
    tags: ['mystery', 'consciousness', 'transcendence'],
    tone: 'cosmic'
  },
  
  // Erwin Schrödinger - More quotes
  {
    id: 'schrodinger-02',
    quote: 'Consciousness cannot be accounted for in physical terms. For consciousness is absolutely fundamental.',
    author: 'Erwin Schrödinger',
    category: 'physics',
    tags: ['consciousness', 'mystery', 'transcendence'],
    tone: 'scientific'
  },
  
  // Richard Feynman - More quotes
  {
    id: 'feynman-03',
    quote: 'I would rather have questions that can\'t be answered than answers that can\'t be questioned.',
    author: 'Richard Feynman',
    category: 'physics',
    tags: ['awareness', 'mystery', 'consciousness'],
    tone: 'scientific'
  },
  {
    id: 'feynman-04',
    quote: 'Nature uses only the longest threads to weave her patterns, so that each small piece of her fabric reveals the organization of the entire tapestry.',
    author: 'Richard Feynman',
    category: 'physics',
    tags: ['complexity', 'patterns', 'emergence'],
    secondaryTags: ['mystery'],
    tone: 'scientific'
  },
  
  // Albert Einstein - More quotes
  {
    id: 'einstein-05',
    quote: 'Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.',
    author: 'Albert Einstein',
    category: 'physics',
    tags: ['consciousness', 'awareness', 'transcendence'],
    tone: 'scientific'
  },
  {
    id: 'einstein-06',
    quote: 'A human being is a part of the whole called by us universe, a part limited in time and space.',
    author: 'Albert Einstein',
    category: 'physics',
    tags: ['consciousness', 'self', 'transcendence'],
    tone: 'cosmic'
  },
  
  // More Complexity Scientists
  // Ilya Prigogine - More quotes
  {
    id: 'prigogine-02',
    quote: 'The future is uncertain... but this uncertainty is at the very heart of human creativity.',
    author: 'Ilya Prigogine',
    category: 'complexity',
    tags: ['time', 'becoming', 'complexity', 'emergence'],
    tone: 'scientific'
  },
  
  // Stuart Kauffman - More quotes
  {
    id: 'kauffman-02',
    quote: 'Life exists at the edge of chaos.',
    author: 'Stuart Kauffman',
    category: 'complexity',
    tags: ['chaos', 'complexity', 'emergence', 'becoming'],
    tone: 'scientific'
  },
  {
    id: 'kauffman-03',
    quote: 'We are the products of editing, rather than of authorship.',
    author: 'Stuart Kauffman',
    category: 'complexity',
    tags: ['becoming', 'evolution', 'complexity'],
    tone: 'scientific'
  },
  
  // Carl Sagan - More quotes
  {
    id: 'sagan-03',
    quote: 'We are a way for the cosmos to know itself.',
    author: 'Carl Sagan',
    category: 'complexity',
    tags: ['consciousness', 'self', 'transcendence'],
    tone: 'cosmic'
  },
  {
    id: 'sagan-04',
    quote: 'The cosmos is all that is or ever was or ever will be.',
    author: 'Carl Sagan',
    category: 'complexity',
    tags: ['transcendence', 'mystery', 'eternity'],
    tone: 'cosmic'
  },
  
  // More Consciousness Scientists
  // David Bohm - More quotes
  {
    id: 'bohm-03',
    quote: 'Thought creates the world and then says \'I didn\'t do it.\'',
    author: 'David Bohm',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'perspective'],
    tone: 'scientific'
  },
  
  // Antonio Damasio - More quotes
  {
    id: 'damasio-03',
    quote: 'We are not necessarily thinking machines. We are feeling machines that think.',
    author: 'Antonio Damasio',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'emotion'],
    tone: 'scientific'
  },
  
  // Francisco Varela - More quotes
  {
    id: 'varela-02',
    quote: 'The mind is not in the head, but in the relationship between the organism and its environment.',
    author: 'Francisco Varela',
    category: 'consciousness',
    tags: ['consciousness', 'awareness', 'embodiment', 'relationships'],
    tone: 'scientific'
  },
  
  // V.S. Ramachandran - More quotes
  {
    id: 'ramachandran-02',
    quote: 'The boundary between self and other is more porous than we imagine.',
    author: 'V.S. Ramachandran',
    category: 'consciousness',
    tags: ['self', 'consciousness', 'awareness', 'relationships'],
    tone: 'scientific'
  },
  
  // More Modern Philosophers
  // James Baldwin - Modern Philosophy
  {
    id: 'baldwin-01',
    quote: 'Not everything that is faced can be changed, but nothing can be changed until it is faced.',
    author: 'James Baldwin',
    category: 'modern',
    tags: ['awareness', 'transformation', 'presence'],
    tone: 'direct'
  },
  
  // Maya Angelou - Modern Philosophy/Poetry
  {
    id: 'angelou-01',
    quote: 'We may encounter many defeats but we must not be defeated.',
    author: 'Maya Angelou',
    category: 'modern',
    tags: ['resistance', 'becoming', 'transformation'],
    tone: 'direct'
  },
  {
    id: 'angelou-02',
    quote: 'I\'ve learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.',
    author: 'Maya Angelou',
    category: 'modern',
    tags: ['relationships', 'awareness', 'presence'],
    tone: 'soft'
  },
  
  // More Classical - More Marcus Aurelius
  {
    id: 'marcus-aurelius-05',
    quote: 'Dwell on the beauty of life. Watch the stars, and see yourself running with them.',
    author: 'Marcus Aurelius',
    category: 'classical',
    tags: ['presence', 'awareness', 'transcendence'],
    tone: 'cosmic'
  },
  {
    id: 'marcus-aurelius-06',
    quote: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
    author: 'Marcus Aurelius',
    category: 'classical',
    tags: ['awareness', 'consciousness', 'presence'],
    tone: 'direct'
  },
  
  // More Lao Tzu
  {
    id: 'lao-tzu-05',
    quote: 'A journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    category: 'classical',
    tags: ['presence', 'now', 'becoming'],
    tone: 'soft'
  },
  {
    id: 'lao-tzu-06',
    quote: 'When you are content to be simply yourself and don\'t compare or compete, everybody will respect you.',
    author: 'Lao Tzu',
    category: 'classical',
    tags: ['self', 'awareness', 'presence'],
    tone: 'soft'
  },
  
  // More Rumi
  {
    id: 'rumi-04',
    quote: 'Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.',
    author: 'Rumi',
    category: 'poet-mystic',
    tags: ['presence', 'awareness', 'meaning'],
    tone: 'soft'
  },
  {
    id: 'rumi-05',
    quote: 'The wound is the place where the Light enters you.',
    author: 'Rumi',
    category: 'poet-mystic',
    tags: ['transformation', 'transcendence', 'becoming'],
    tone: 'soft'
  },
  
  // More Jung
  {
    id: 'jung-05',
    quote: 'Who looks outside, dreams; who looks inside, awakes.',
    author: 'Carl Jung',
    category: 'modern',
    tags: ['awareness', 'consciousness', 'self'],
    tone: 'direct'
  },
  {
    id: 'jung-06',
    quote: 'The privilege of a lifetime is to become who you truly are.',
    author: 'Carl Jung',
    category: 'modern',
    tags: ['becoming', 'identity', 'self'],
    tone: 'direct'
  },
  
  // More Nietzsche
  {
    id: 'nietzsche-05',
    quote: 'And those who were seen dancing were thought to be insane by those who could not hear the music.',
    author: 'Friedrich Nietzsche',
    category: 'modern',
    tags: ['perspective', 'awareness', 'consciousness'],
    tone: 'direct'
  },
  
  // More Alan Watts
  {
    id: 'watts-04',
    quote: 'The meaning of life is just to be alive. It is so plain and so obvious and so simple.',
    author: 'Alan Watts',
    category: 'modern',
    tags: ['presence', 'now', 'meaning'],
    tone: 'soft'
  },
  {
    id: 'watts-05',
    quote: 'This is the real secret of life—to be completely engaged with what you are doing in the here and now.',
    author: 'Alan Watts',
    category: 'modern',
    tags: ['presence', 'now', 'awareness'],
    tone: 'soft'
  }
];

