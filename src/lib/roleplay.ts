export type RoleplayFlair =
  | "Absurdism"
  | "Aristotelianism"
  | "Classical Greek"
  | "Deontology"
  | "Economics"
  | "Empiricism"
  | "Existentialism"
  | "Islamic Philosophy"
  | "Power"
  | "Platonism"
  | "Politics"
  | "Pragmatism"
  | "Psychoanalysis"
  | "Rationalism"
  | "Social Contract"
  | "Stoicism"
  | "Transcendentalism"
  | "Utilitarianism";

export type RoleplayCharacterProfile = {
  id: string;
  name: string;
  shortName: string;
  imagePath: string;
  flairs: RoleplayFlair[];
  expertise: string;
  shortDescription: string;
  bestFor: string;
  starterPrompts: string[];
  voicePreview: string;
  accent: string;
};

export const ROLEPLAY_FLAIRS: RoleplayFlair[] = [
  "Stoicism",
  "Classical Greek",
  "Power",
  "Existentialism",
  "Utilitarianism",
  "Politics",
  "Rationalism",
  "Platonism",
  "Aristotelianism",
  "Absurdism",
  "Social Contract",
  "Empiricism",
  "Deontology",
  "Psychoanalysis",
  "Pragmatism",
  "Transcendentalism",
  "Economics",
  "Islamic Philosophy",
];

export const ROLEPLAY_FLAIR_THEMES: Record<
  RoleplayFlair | "All",
  { background: string; border: string }
> = {
  All: {
    background: "#565b65",
    border: "#1f2329",
  },
  Stoicism: {
    background: "#ecd37c",
    border: "#7a5c08",
  },
  "Classical Greek": {
    background: "#e8c887",
    border: "#704706",
  },
  Platonism: {
    background: "#abd0f2",
    border: "#245681",
  },
  Aristotelianism: {
    background: "#bedb9b",
    border: "#48672a",
  },
  Existentialism: {
    background: "#ccb3e3",
    border: "#5b3f7a",
  },
  Absurdism: {
    background: "#ecc274",
    border: "#744806",
  },
  Politics: {
    background: "#d99a8e",
    border: "#6c2c24",
  },
  "Social Contract": {
    background: "#a6ccc5",
    border: "#2c6159",
  },
  Utilitarianism: {
    background: "#a0d4df",
    border: "#236a79",
  },
  Empiricism: {
    background: "#b7cce0",
    border: "#385b78",
  },
  Rationalism: {
    background: "#a3d5c2",
    border: "#2a684f",
  },
  Deontology: {
    background: "#cdd2dc",
    border: "#555c6b",
  },
  Psychoanalysis: {
    background: "#c8d38f",
    border: "#566326",
  },
  Pragmatism: {
    background: "#9bcfc8",
    border: "#28615a",
  },
  Transcendentalism: {
    background: "#add594",
    border: "#3f6a24",
  },
  Economics: {
    background: "#a9c5d7",
    border: "#34566d",
  },
  "Islamic Philosophy": {
    background: "#b7d7bd",
    border: "#38613f",
  },
  Power: {
    background: "#df9186",
    border: "#6e2a21",
  },
};

export const ROLEPLAY_PHILOSOPHERS = [
  {
    id: "SOCRATES",
    name: "Socrates",
    shortName: "Socrates",
    imagePath: "/philosophers/socrates.webp",
    flairs: ["Classical Greek"],
    expertise: "Questions, definitions, contradictions, moral clarity.",
    shortDescription:
      "The father of Western philosophy who never wrote a word. Taught by asking questions that made people deeply uncomfortable.",
    bestFor: "Testing a belief you have not examined closely enough.",
    starterPrompts: [
      "Help me examine whether I am living well.",
      "Question my belief that success matters more than virtue.",
      "Show me where my definition of justice breaks down.",
      "Interrogate my fear of looking ignorant.",
    ],
    voicePreview:
      "Let us not hurry. First tell me what you mean, and then we shall see whether you believe it.",
    accent: "#d9b66f",
  },
  {
    id: "PLATO",
    name: "Plato",
    shortName: "Plato",
    imagePath: "/philosophers/plato.webp",
    flairs: ["Platonism", "Classical Greek"],
    expertise: "Forms, justice, education, the soul, political order.",
    shortDescription:
      "Student of Socrates who turned his teacher's questions into a complete vision of reality. Built the foundation of Western thought.",
    bestFor: "Connecting personal confusion to larger ideals and hidden forms.",
    starterPrompts: [
      "What would a just society require from its citizens?",
      "Explain what I am really seeking when I want status.",
      "How should education shape the soul?",
      "Is democracy dangerous when people are poorly formed?",
    ],
    voicePreview:
      "The city and the soul resemble one another more than most people suspect.",
    accent: "#8fb8d8",
  },
  {
    id: "ARISTOTLE",
    name: "Aristotle",
    shortName: "Aristotle",
    imagePath: "/philosophers/aristotle.webp",
    flairs: ["Aristotelianism", "Classical Greek"],
    expertise: "Virtue, character, purpose, politics, practical wisdom.",
    shortDescription:
      "Plato's greatest student who disagreed with almost everything Plato said. Wrote about everything from logic to politics to the nature of happiness.",
    bestFor: "Turning abstract ideals into practiced character.",
    starterPrompts: [
      "How do I become more disciplined without becoming harsh?",
      "What virtue am I missing in this situation?",
      "Help me think through friendship and loyalty.",
      "What does flourishing actually require from daily life?",
    ],
    voicePreview:
      "We must look not only at what is said, but at the kind of life that produces it.",
    accent: "#9dbb79",
  },
  {
    id: "EPICTETUS",
    name: "Epictetus",
    shortName: "Epictetus",
    imagePath: "/philosophers/epictetus.webp",
    flairs: ["Stoicism"],
    expertise: "Control, judgment, discipline, agency, inner freedom.",
    shortDescription:
      "Born into slavery and became one of the most respected philosophers of his time. Taught that freedom begins in the mind, not in circumstances.",
    bestFor: "Anxiety, resentment, discipline, emotional steadiness.",
    starterPrompts: [
      "Help me stop caring so much about what others think.",
      "What is actually in my control here?",
      "Train me to handle failure without self-pity.",
      "I keep blaming circumstances. Correct me.",
    ],
    voicePreview:
      "Begin by separating the thing from your judgment about the thing.",
    accent: "#c9a85d",
  },
  {
    id: "MARCUS_AURELIUS",
    name: "Marcus Aurelius",
    shortName: "Marcus",
    imagePath: "/philosophers/marcus-aurelius.webp",
    flairs: ["Stoicism"],
    expertise: "Duty, mortality, leadership, restraint, moral attention.",
    shortDescription:
      "Ruled the Roman Empire and still found time to question himself daily. Wrote his private thoughts down, never intending anyone to read them.",
    bestFor: "Leadership, stress, mortality, and keeping character under pressure.",
    starterPrompts: [
      "How should I act when people disappoint me?",
      "Help me face mortality without panic.",
      "What should I remember before making a hard decision?",
      "How do I stay decent while pursuing ambition?",
    ],
    voicePreview:
      "You have power over the ruling center. Guard it, and do the work before you.",
    accent: "#bba176",
  },
  {
    id: "SENECA",
    name: "Seneca",
    shortName: "Seneca",
    imagePath: "/philosophers/seneca.webp",
    flairs: ["Stoicism"],
    expertise: "Time, anger, wealth, adversity, moral training.",
    shortDescription:
      "Advisor to emperors, witness to power, and one of the sharpest writers in history. Obsessed with how we spend the one life we are given.",
    bestFor: "Time anxiety, anger, wealth, loss, and self-command.",
    starterPrompts: [
      "Help me stop wasting my time.",
      "What should I do with anger before it controls me?",
      "How should I think about wealth and comfort?",
      "Teach me how to endure a setback with dignity.",
    ],
    voicePreview:
      "No one loses life all at once; we hand it away hour by hour.",
    accent: "#d2a65f",
  },
  {
    id: "NIETZSCHE",
    name: "Friedrich Nietzsche",
    shortName: "Nietzsche",
    imagePath: "/philosophers/nietzsche.webp",
    flairs: ["Existentialism", "Power"],
    expertise: "Values, herd morality, ressentiment, self-overcoming.",
    shortDescription:
      "Declared that old values were collapsing and that humanity needed new ones. One of the most misunderstood and most important thinkers of the modern age.",
    bestFor: "Ambition, resentment, conformity, meaning, and self-creation.",
    starterPrompts: [
      "Tell me where I am living by herd values.",
      "Diagnose my resentment about successful people.",
      "What would self-overcoming require from me?",
      "Am I using morality to hide weakness?",
    ],
    voicePreview:
      "You call it virtue. I ask whether it is courage, or merely obedience with a clean face.",
    accent: "#b6746f",
  },
  {
    id: "KANT",
    name: "Immanuel Kant",
    shortName: "Kant",
    imagePath: "/philosophers/Kant.jpg",
    flairs: ["Deontology"],
    expertise: "Duty, autonomy, universal law, persons as ends.",
    shortDescription:
      "Built one of the most rigorous systems of moral philosophy ever attempted. Believed that reason, not religion or emotion, was the foundation of right action.",
    bestFor: "Moral dilemmas, lying, duty, respect, and principled action.",
    starterPrompts: [
      "Is it ever acceptable to lie for a good outcome?",
      "Help me find the maxim behind my decision.",
      "Am I treating someone as a means rather than an end?",
      "What does duty require when I do not feel like doing it?",
    ],
    voicePreview:
      "The question is not first what you desire, but what principle you can will.",
    accent: "#9aa3b1",
  },
  {
    id: "MACHIAVELLI",
    name: "Niccolo Machiavelli",
    shortName: "Machiavelli",
    imagePath: "/philosophers/machiavelli.webp",
    flairs: ["Politics", "Power"],
    expertise: "Power, politics, deception, strategy, statecraft.",
    shortDescription:
      "Studied power for what it actually is, not what people pretend it to be. Wrote the book that rulers read in private and condemned in public.",
    bestFor: "Politics, negotiation, reputation, conflict, and strategic action.",
    starterPrompts: [
      "How should I handle someone politically dangerous?",
      "When is deception strategically necessary?",
      "Should I be feared, loved, or respected in this situation?",
      "Analyze the power dynamics in my workplace.",
    ],
    voicePreview:
      "You ask what is noble. First ask who benefits when you behave nobly.",
    accent: "#b88a58",
  },
  {
    id: "DOSTOEVSKY",
    name: "Fyodor Dostoevsky",
    shortName: "Dostoevsky",
    imagePath: "/philosophers/dostoevsky.webp",
    flairs: ["Existentialism"],
    expertise: "Freedom, guilt, faith, suffering, resentment, moral psychology.",
    shortDescription:
      "Descended into guilt, freedom, faith, and the underground corners of the human soul. Turned moral psychology into a form of philosophical fire.",
    bestFor: "Guilt, despair, faith, freedom, resentment, and self-deception.",
    starterPrompts: [
      "Why do I keep acting against my own interests?",
      "Help me understand my guilt without excusing it.",
      "What does suffering reveal about freedom?",
      "Am I using intelligence to avoid responsibility?",
    ],
    voicePreview:
      "You say you want freedom, but perhaps you want the right to ruin yourself and call it honesty.",
    accent: "#8f6f64",
  },
  {
    id: "HOBBES",
    name: "Thomas Hobbes",
    shortName: "Hobbes",
    imagePath: "/philosophers/hobbes.webp",
    flairs: ["Social Contract", "Politics"],
    expertise: "Order, fear, sovereignty, security, social contract.",
    shortDescription:
      "Believed human life without order was brutal and short. Argued that strong government was not a cage but a necessity.",
    bestFor: "Security, authority, social conflict, and political order.",
    starterPrompts: [
      "Why do people need authority?",
      "Is freedom worth instability?",
      "Analyze this conflict as a problem of fear.",
      "What happens when trust collapses?",
    ],
    voicePreview:
      "Where there is no common power, fine language cannot keep men from one another.",
    accent: "#7d8790",
  },
  {
    id: "ROUSSEAU",
    name: "Jean-Jacques Rousseau",
    shortName: "Rousseau",
    imagePath: "/philosophers/rousseau.webp",
    flairs: ["Social Contract"],
    expertise: "Freedom, inequality, authenticity, education, civic life.",
    shortDescription:
      "Believed humans were naturally good and that civilization slowly corrupted them. His ideas lit the fuse on the French Revolution.",
    bestFor: "Authenticity, inequality, education, freedom, and social pressure.",
    starterPrompts: [
      "Am I being shaped by society in a corrupt way?",
      "What would real freedom mean here?",
      "How does comparison distort my desires?",
      "Explain inequality without making it sound natural.",
    ],
    voicePreview:
      "Man is not born vain; society teaches him to measure his soul by another's eyes.",
    accent: "#80a97a",
  },
  {
    id: "MILL",
    name: "John Stuart Mill",
    shortName: "Mill",
    imagePath: "/philosophers/mill.webp",
    flairs: ["Utilitarianism"],
    expertise: "Liberty, harm, utility, individuality, moral progress.",
    shortDescription:
      "Fought for individual freedom at a time when few philosophers bothered. Believed that a society was only as good as the liberty it protected.",
    bestFor: "Freedom, speech, social pressure, pleasure, and public ethics.",
    starterPrompts: [
      "Where should personal freedom end?",
      "Is this restriction justified by harm?",
      "How do I decide what produces the most good?",
      "Defend individuality against social pressure.",
    ],
    voicePreview:
      "The worth of a society is seen in the kind of individuality it permits.",
    accent: "#77a7b8",
  },
  {
    id: "HUME",
    name: "David Hume",
    shortName: "Hume",
    imagePath: "/philosophers/hume.webp",
    flairs: ["Empiricism"],
    expertise: "Skepticism, habit, causation, sentiment, human nature.",
    shortDescription:
      "Doubted more carefully than almost anyone before him. Challenged the foundations of religion, causation, and human knowledge itself.",
    bestFor: "Doubt, belief, evidence, emotion, and human nature.",
    starterPrompts: [
      "What evidence would actually justify this belief?",
      "Am I confusing habit with reason?",
      "Explain why emotion matters in morality.",
      "Make me more skeptical without becoming cynical.",
    ],
    voicePreview:
      "Before we ascend into systems, let us ask what experience has really shown.",
    accent: "#8aa0b2",
  },
  {
    id: "SPINOZA",
    name: "Baruch Spinoza",
    shortName: "Spinoza",
    imagePath: "/philosophers/spinoza.jpeg",
    flairs: ["Rationalism"],
    expertise: "Necessity, desire, emotion, freedom, God or nature.",
    shortDescription:
      "Saw God and nature as one and the same thing. Was expelled from his community for ideas that the modern world has largely come to accept.",
    bestFor: "Emotional clarity, determinism, desire, and acceptance.",
    starterPrompts: [
      "Help me understand this emotion instead of being ruled by it.",
      "What would freedom mean if everything has causes?",
      "Explain my desire through your philosophy.",
      "How should I think about God or nature?",
    ],
    voicePreview:
      "An emotion ceases to master us in proportion as we form a clear idea of it.",
    accent: "#76a99a",
  },
  {
    id: "SCHOPENHAUER",
    name: "Arthur Schopenhauer",
    shortName: "Schopenhauer",
    imagePath: "/philosophers/schopenhauer.webp",
    flairs: ["Power"],
    expertise: "Will, suffering, desire, pessimism, art, compassion.",
    shortDescription:
      "Believed the universe was driven by blind, irrational will. Honest about suffering in a way that philosophy rarely allows itself to be.",
    bestFor: "Desire, disappointment, suffering, art, and detachment.",
    starterPrompts: [
      "Why do my desires keep making me miserable?",
      "Explain romantic longing without comforting me.",
      "What role can art play in suffering?",
      "How do I reduce the tyranny of wanting?",
    ],
    voicePreview:
      "Desire promises completion and then begins again under another mask.",
    accent: "#8e8177",
  },
  {
    id: "KIERKEGAARD",
    name: "Soren Kierkegaard",
    shortName: "Kierkegaard",
    imagePath: "/philosophers/kierkegaard.webp",
    flairs: ["Existentialism"],
    expertise: "Anxiety, faith, despair, choice, inwardness.",
    shortDescription:
      "Wrote about what it actually feels like to be a human being trying to live a meaningful life. The first philosopher to take anxiety seriously.",
    bestFor: "Anxiety, faith, identity, commitment, and existential paralysis.",
    starterPrompts: [
      "Why am I afraid to choose?",
      "Explain my anxiety as a spiritual problem.",
      "What does it mean to become myself?",
      "Am I avoiding commitment by thinking too much?",
    ],
    voicePreview:
      "Anxiety is the dizziness of freedom, not merely a defect to be removed.",
    accent: "#9f8ac0",
  },
  {
    id: "CAMUS",
    name: "Albert Camus",
    shortName: "Camus",
    imagePath: "/philosophers/camus.webp",
    flairs: ["Absurdism", "Existentialism"],
    expertise: "Absurdity, revolt, meaning, mortality, dignity.",
    shortDescription:
      "Looked at the absurdity of existence and refused to look away. Argued that the only real philosophical question is whether life is worth living.",
    bestFor: "Meaning, absurdity, death, rebellion, and staying human.",
    starterPrompts: [
      "How do I live if life has no final meaning?",
      "Explain revolt without pretending everything is fine.",
      "What should I do with despair?",
      "How can I be honest and still keep going?",
    ],
    voicePreview:
      "The absurd does not excuse surrender. It asks whether you can live without appeal.",
    accent: "#d0a05f",
  },
  {
    id: "SARTRE",
    name: "Jean-Paul Sartre",
    shortName: "Sartre",
    imagePath: "/philosophers/sartre.webp",
    flairs: ["Existentialism"],
    expertise: "Freedom, bad faith, responsibility, identity, authenticity.",
    shortDescription:
      "Said that existence comes before essence, meaning you are nothing until you make yourself something. Total freedom, total responsibility.",
    bestFor: "Avoidance, identity, responsibility, and authentic choice.",
    starterPrompts: [
      "Where am I acting in bad faith?",
      "Why does freedom feel like a burden?",
      "Am I hiding behind my personality?",
      "What responsibility am I refusing?",
    ],
    voicePreview:
      "You are not merely what has happened to you; you are what you make of it.",
    accent: "#a78076",
  },
  {
    id: "FREUD",
    name: "Sigmund Freud",
    shortName: "Freud",
    imagePath: "/philosophers/freud.webp",
    flairs: ["Psychoanalysis"],
    expertise: "Unconscious motives, repression, desire, civilization.",
    shortDescription:
      "Argued that most of what drives human behavior is buried beneath conscious awareness. Changed how the world thinks about the mind forever.",
    bestFor: "Motivation, repression, conflict, desire, and self-sabotage.",
    starterPrompts: [
      "What unconscious motive might be operating here?",
      "Why do I repeat the same self-defeating pattern?",
      "Analyze my anger as a defense.",
      "What does civilization demand from desire?",
    ],
    voicePreview:
      "Where the explanation is too clean, one should look for what has been repressed.",
    accent: "#8d9a7a",
  },
  {
    id: "THOREAU",
    name: "Henry David Thoreau",
    shortName: "Thoreau",
    imagePath: "/philosophers/thoreau.webp",
    flairs: ["Transcendentalism"],
    expertise: "Simplicity, conscience, nature, civil disobedience.",
    shortDescription:
      "Left society for two years to live deliberately and think clearly. Wrote about nature, conscience, and the cost of living someone else's life.",
    bestFor: "Simplicity, independence, nature, conscience, and refusal.",
    starterPrompts: [
      "Help me simplify my life.",
      "When should I refuse to cooperate?",
      "Am I living deliberately or automatically?",
      "What does nature teach that society makes me forget?",
    ],
    voicePreview:
      "A man is rich in proportion to the number of things he can afford to let alone.",
    accent: "#83a36d",
  },
  {
    id: "WILLIAM_JAMES",
    name: "William James",
    shortName: "James",
    imagePath: "/philosophers/william-james.webp",
    flairs: ["Pragmatism"],
    expertise: "Belief, habit, choice, truth, religious experience.",
    shortDescription:
      "Believed that truth was what worked in practice, not what sounded elegant in theory. The most human and readable of all the great philosophers.",
    bestFor: "Decision, habit, uncertainty, motivation, and practical belief.",
    starterPrompts: [
      "How should I act when certainty is impossible?",
      "Help me change a habit by changing attention.",
      "What belief would be pragmatically worth testing?",
      "Explain truth in terms of consequences.",
    ],
    voicePreview:
      "The question is what difference the belief makes in the stream of life.",
    accent: "#6fa7a0",
  },
  {
    id: "ADAM_SMITH",
    name: "Adam Smith",
    shortName: "Smith",
    imagePath: "/philosophers/adam-smith.webp",
    flairs: ["Economics"],
    expertise: "Markets, sympathy, incentives, moral sentiments, commerce.",
    shortDescription:
      "Explained how markets work and why self-interest can serve the common good. Cared about morality just as much as he cared about economics.",
    bestFor: "Markets, incentives, work, trade, wealth, and moral judgment.",
    starterPrompts: [
      "Analyze this incentive problem.",
      "What does sympathy have to do with morality?",
      "How should I think about markets without worshiping them?",
      "Explain self-interest without making it selfishness.",
    ],
    voicePreview:
      "Commerce rests not only on gain, but on habits of trust and judgment.",
    accent: "#7c9bb0",
  },
  {
    id: "AL_GHAZALI",
    name: "Al Ghazali",
    shortName: "Ghazali",
    imagePath: "/philosophers/al-ghazali.webp",
    flairs: ["Islamic Philosophy"],
    expertise: "Faith, reason, certainty, ethics, skepticism, spiritual discipline.",
    shortDescription:
      "A towering Islamic philosopher, theologian, and mystic who challenged the limits of reason and turned philosophy back toward lived spiritual certainty.",
    bestFor: "Faith, doubt, intellectual pride, spiritual discipline, and moral self-examination.",
    starterPrompts: [
      "How should I handle doubt without losing faith?",
      "Am I trusting reason beyond its proper limits?",
      "Help me examine intellectual pride in myself.",
      "What does spiritual discipline require from daily life?",
    ],
    voicePreview:
      "Reason is a noble lamp, but it does not become the sun by forgetting its limit.",
    accent: "#6f9f73",
  },
] as const satisfies readonly RoleplayCharacterProfile[];

export type RoleplayPhilosopherId =
  (typeof ROLEPLAY_PHILOSOPHERS)[number]["id"];

export type RoleplayCharacterId = RoleplayPhilosopherId;

export function getRoleplayPhilosopherConfig(id: RoleplayPhilosopherId) {
  return ROLEPLAY_PHILOSOPHERS.find((philosopher) => philosopher.id === id);
}

export const getRoleplayCharacterProfile = getRoleplayPhilosopherConfig;

export function isRoleplayPhilosopherId(
  value: unknown,
): value is RoleplayPhilosopherId {
  return ROLEPLAY_PHILOSOPHERS.some((philosopher) => philosopher.id === value);
}

export const isRoleplayCharacterId = isRoleplayPhilosopherId;
