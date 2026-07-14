export type RoleplayFlair =
  | "Absurdism"
  | "Analytic Philosophy"
  | "Aristotelianism"
  | "Buddhism"
  | "Classical Greek"
  | "Confucianism"
  | "Critical Theory"
  | "Cynicism"
  | "Deontology"
  | "Daoism"
  | "Economics"
  | "Enlightenment"
  | "Empiricism"
  | "Existentialism"
  | "Feminism"
  | "Islamic Philosophy"
  | "Mysticism"
  | "Objectivism"
  | "Power"
  | "Platonism"
  | "Politics"
  | "Pragmatism"
  | "Psychoanalysis"
  | "Rationalism"
  | "Strategy"
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
  "Buddhism",
  "Confucianism",
  "Daoism",
  "Power",
  "Strategy",
  "Existentialism",
  "Feminism",
  "Analytic Philosophy",
  "Utilitarianism",
  "Politics",
  "Rationalism",
  "Platonism",
  "Aristotelianism",
  "Cynicism",
  "Absurdism",
  "Social Contract",
  "Empiricism",
  "Enlightenment",
  "Deontology",
  "Critical Theory",
  "Psychoanalysis",
  "Pragmatism",
  "Transcendentalism",
  "Objectivism",
  "Mysticism",
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
  Buddhism: {
    background: "#d7c77f",
    border: "#665713",
  },
  Confucianism: {
    background: "#dda18f",
    border: "#723525",
  },
  Daoism: {
    background: "#98cbb5",
    border: "#27634b",
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
  Cynicism: {
    background: "#d2bd8d",
    border: "#6b5520",
  },
  Feminism: {
    background: "#d9aac0",
    border: "#74344f",
  },
  "Analytic Philosophy": {
    background: "#b7c8e6",
    border: "#3b557c",
  },
  Enlightenment: {
    background: "#f0c77b",
    border: "#79500d",
  },
  "Critical Theory": {
    background: "#c7a0a8",
    border: "#65313d",
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
  Mysticism: {
    background: "#b8b0df",
    border: "#4c437a",
  },
  Objectivism: {
    background: "#d6c7a3",
    border: "#675733",
  },
  Strategy: {
    background: "#d7a27b",
    border: "#70401d",
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
      "What virtue am I missing in this situation: [describe the situation]",
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
      "What is actually in my control here: [describe what happened]",
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
      "Help me find the maxim behind my decision: [describe the decision]",
      "Am I treating someone as a means rather than an end: [describe the situation]",
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
      "Should I be feared, loved, or respected in this situation: [describe the situation]",
      "Analyze the power dynamics in my workplace: [describe the workplace situation]",
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
      "Analyze this conflict as a problem of fear: [describe the conflict]",
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
      "What would real freedom mean here: [describe the situation]",
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
      "Is this restriction justified by harm: [describe the restriction]",
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
      "What evidence would actually justify this belief: [describe the belief]",
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
      "Help me understand this emotion instead of being ruled by it: [describe the emotion]",
      "What would freedom mean if everything has causes?",
      "Explain desire through your philosophy.",
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
      "What unconscious motive might be operating here: [describe what happened]",
      "Why do people repeat self-defeating patterns?",
      "Analyze anger as a defense.",
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
      "Analyze this incentive problem: [describe the incentive problem]",
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
  {
    id: "BUDDHA",
    name: "Buddha",
    shortName: "Buddha",
    imagePath: "/philosophers/buddha.webp",
    flairs: ["Buddhism"],
    expertise: "Suffering, craving, impermanence, mindfulness, liberation.",
    shortDescription:
      "Taught that suffering has causes and that freedom begins when craving, illusion, and clinging are seen clearly.",
    bestFor: "Desire, anxiety, attachment, grief, mindfulness, and inner release.",
    starterPrompts: [
      "Help me understand the suffering behind this desire: [describe the desire]",
      "What am I clinging to that keeps hurting me?",
      "Teach me how to meet anxiety without becoming it.",
      "How should I practice compassion without losing clarity?",
    ],
    voicePreview:
      "Look carefully at the craving itself; when it is known, it loosens.",
    accent: "#b99d45",
  },
  {
    id: "CONFUCIUS",
    name: "Confucius",
    shortName: "Confucius",
    imagePath: "/philosophers/confucius.webp",
    flairs: ["Confucianism"],
    expertise: "Ritual, virtue, family, duty, education, social harmony.",
    shortDescription:
      "Saw character as something cultivated through ritual, respect, learning, and the daily practice of humane conduct.",
    bestFor: "Family conflict, leadership, duty, respect, education, and character.",
    starterPrompts: [
      "How should I act honorably in this relationship: [describe the relationship]",
      "What duty am I neglecting here: [describe the situation]",
      "Help me become more disciplined without becoming cold.",
      "What does respect require when I disagree?",
    ],
    voicePreview:
      "Begin with conduct. A disordered heart rarely produces ordered speech.",
    accent: "#b87862",
  },
  {
    id: "LAOZI",
    name: "Laozi",
    shortName: "Laozi",
    imagePath: "/philosophers/laozi.webp",
    flairs: ["Daoism"],
    expertise: "The Dao, wu wei, simplicity, softness, non-contention.",
    shortDescription:
      "Taught that force often fails where softness succeeds, and that wisdom follows the grain of things instead of fighting it.",
    bestFor: "Control, overthinking, conflict, ambition, simplicity, and patience.",
    starterPrompts: [
      "Where am I forcing something that should be allowed to unfold: [describe the situation]",
      "Teach me how to act without overcontrolling.",
      "How can softness be stronger than aggression?",
      "Help me simplify a decision.",
    ],
    voicePreview:
      "The river does not argue with the stones, yet it reaches the sea.",
    accent: "#6fa98f",
  },
  {
    id: "DIOGENES",
    name: "Diogenes",
    shortName: "Diogenes",
    imagePath: "/philosophers/diogenes.webp",
    flairs: ["Cynicism", "Classical Greek"],
    expertise: "Simplicity, shameless honesty, convention, freedom, hypocrisy.",
    shortDescription:
      "Rejected status, comfort, and polite lies with theatrical contempt. Used provocation to expose how much of society is vanity.",
    bestFor: "Status anxiety, social performance, hypocrisy, consumerism, and blunt truth.",
    starterPrompts: [
      "Mock the fake status game I am trapped in.",
      "What convention am I obeying for no good reason?",
      "Tell me what I am pretending not to know.",
      "How do I need less without making it a lifestyle brand?",
    ],
    voicePreview:
      "You have decorated your cage and now ask me whether the curtains are tasteful.",
    accent: "#a98b4f",
  },
  {
    id: "SUN_TZU",
    name: "Sun Tzu",
    shortName: "Sun Tzu",
    imagePath: "/philosophers/suntzu.webp",
    flairs: ["Strategy", "Power"],
    expertise: "Strategy, conflict, deception, timing, terrain, leverage.",
    shortDescription:
      "Turned conflict into a discipline of perception, timing, and advantage. Preferred winning before the battle begins.",
    bestFor: "Conflict, negotiation, competition, positioning, and strategic restraint.",
    starterPrompts: [
      "Analyze this conflict strategically: [describe the conflict]",
      "Where is my leverage and where am I exposed: [describe the situation]",
      "How do I win without direct confrontation?",
      "What terrain do people usually ignore in a conflict?",
    ],
    voicePreview:
      "Do not begin with courage. Begin with terrain, timing, and what the other side cannot see.",
    accent: "#b7744f",
  },
  {
    id: "VOLTAIRE",
    name: "Voltaire",
    shortName: "Voltaire",
    imagePath: "/philosophers/voltaire.webp",
    flairs: ["Enlightenment"],
    expertise: "Reason, tolerance, satire, religious authority, civil liberty.",
    shortDescription:
      "Fought superstition, cruelty, and intellectual laziness with wit sharp enough to make power nervous.",
    bestFor: "Dogma, free speech, hypocrisy, tolerance, and skeptical clarity.",
    starterPrompts: [
      "Make me less vulnerable to dogma.",
      "How should I defend tolerance without becoming naive?",
      "Satirize the bad reasoning in my argument: [write the argument]",
      "What authority am I trusting too easily?",
    ],
    voicePreview:
      "A bad argument does not improve by putting on a priestly robe.",
    accent: "#d0a858",
  },
  {
    id: "WITTGENSTEIN",
    name: "Ludwig Wittgenstein",
    shortName: "Wittgenstein",
    imagePath: "/philosophers/wittgenstein.webp",
    flairs: ["Analytic Philosophy"],
    expertise: "Language, meaning, logic, forms of life, conceptual confusion.",
    shortDescription:
      "Changed philosophy twice by showing how many deep problems are knots in language, use, and attention.",
    bestFor: "Conceptual confusion, language traps, meaning, logic, and clarity.",
    starterPrompts: [
      "Show me how language is confusing this problem: [describe the problem]",
      "What do I mean when I use this word: [write the word]",
      "Help me dissolve a philosophical puzzle.",
      "Where has my thinking gone on holiday?",
    ],
    voicePreview:
      "Do not ask for the meaning in the air. Look at how the word is used.",
    accent: "#7f93b8",
  },
  {
    id: "BERTRAND_RUSSELL",
    name: "Bertrand Russell",
    shortName: "Russell",
    imagePath: "/philosophers/bertrand-russell.webp",
    flairs: ["Analytic Philosophy", "Empiricism"],
    expertise: "Logic, clarity, skepticism, knowledge, ethics, public reason.",
    shortDescription:
      "Brought mathematical precision to philosophy and public courage to politics. Hated muddle almost as much as cruelty.",
    bestFor: "Clear reasoning, skepticism, knowledge, argument structure, and public ethics.",
    starterPrompts: [
      "Make my argument clearer and less confused: [write the argument]",
      "What do I actually know here: [describe the claim or situation]",
      "Help me separate evidence from emotion.",
      "Where is my reasoning too vague?",
    ],
    voicePreview:
      "Clarity is not a decoration of thought; it is one of its moral duties.",
    accent: "#819bc0",
  },
  {
    id: "BEAUVOIR",
    name: "Simone de Beauvoir",
    shortName: "Beauvoir",
    imagePath: "/philosophers/beauvoir.webp",
    flairs: ["Feminism", "Existentialism"],
    expertise: "Freedom, gender, ambiguity, oppression, responsibility.",
    shortDescription:
      "Exposed how women are made into the Other and argued that freedom must be lived under real social constraints.",
    bestFor: "Identity, gender, freedom, oppression, relationships, and moral ambiguity.",
    starterPrompts: [
      "Where am I being made into the Other?",
      "How do I act freely under social constraint?",
      "Help me think through responsibility in this relationship: [describe the relationship]",
      "What does ambiguity demand from me here: [describe the situation]",
    ],
    voicePreview:
      "Freedom is not a private fantasy; it is tested in the situation that resists it.",
    accent: "#bd7898",
  },
  {
    id: "HANNAH_ARENDT",
    name: "Hannah Arendt",
    shortName: "Arendt",
    imagePath: "/philosophers/hannah-arendt.webp",
    flairs: ["Politics"],
    expertise: "Power, action, plurality, totalitarianism, judgment, public life.",
    shortDescription:
      "Studied how political evil becomes ordinary and how public action keeps human freedom alive.",
    bestFor: "Politics, responsibility, conformity, institutions, judgment, and public courage.",
    starterPrompts: [
      "How does ordinary conformity become dangerous?",
      "What would political responsibility require here: [describe the situation]",
      "Help me judge without hiding in ideology.",
      "What is the difference between power and violence?",
    ],
    voicePreview:
      "The question is not only what you think privately, but what world your action helps disclose.",
    accent: "#9d8b72",
  },
  {
    id: "FOUCAULT",
    name: "Michel Foucault",
    shortName: "Foucault",
    imagePath: "/philosophers/foucault.webp",
    flairs: ["Critical Theory", "Power"],
    expertise: "Power, knowledge, discipline, institutions, norms, subjectivity.",
    shortDescription:
      "Showed how power works through knowledge, categories, institutions, and the ordinary habits that teach people to govern themselves.",
    bestFor: "Institutions, surveillance, identity, norms, medicine, punishment, and hidden power.",
    starterPrompts: [
      "What power structure is hidden in this situation: [describe the situation]",
      "How do norms train people to treat them as natural?",
      "Analyze institutions without trusting their official language.",
      "What kind of subject does modern power train people to become?",
    ],
    voicePreview:
      "Ask first who is authorized to name the truth, and what that truth makes possible.",
    accent: "#a97682",
  },
  {
    id: "SIMONE_WEIL",
    name: "Simone Weil",
    shortName: "Weil",
    imagePath: "/philosophers/simone-weil.webp",
    flairs: ["Mysticism", "Politics"],
    expertise: "Attention, affliction, obligation, grace, justice, rootedness.",
    shortDescription:
      "Joined political urgency to mystical attention, insisting that real justice begins by looking at suffering without turning away.",
    bestFor: "Suffering, attention, duty, justice, spiritual seriousness, and compassion.",
    starterPrompts: [
      "Teach me how to pay real attention to suffering.",
      "What obligation am I avoiding?",
      "How should I think about justice without vanity?",
      "Help me distinguish compassion from sentimentality.",
    ],
    voicePreview:
      "Attention is the rarest generosity because it refuses to make suffering useful to the ego.",
    accent: "#8f86bd",
  },
  {
    id: "AYN_RAND",
    name: "Ayn Rand",
    shortName: "Rand",
    imagePath: "/philosophers/ayn-rand.webp",
    flairs: ["Objectivism"],
    expertise: "Reason, individualism, self-interest, capitalism, moral ambition.",
    shortDescription:
      "Defended rational self-interest and individual achievement against collectivism, guilt, and secondhand living.",
    bestFor: "Ambition, independence, guilt, productivity, capitalism, and self-respect.",
    starterPrompts: [
      "Am I sacrificing myself for approval: [describe the situation]",
      "Defend ambition without apology.",
      "Where am I living secondhand?",
      "What would rational self-interest require here: [describe the situation]",
    ],
    voicePreview:
      "Do not call it virtue when you surrender your mind to someone else's need.",
    accent: "#b99a63",
  },
  {
    id: "NUSSBAUM",
    name: "Martha Nussbaum",
    shortName: "Nussbaum",
    imagePath: "/philosophers/nussbaum.webp",
    flairs: ["Aristotelianism", "Feminism"],
    expertise: "Capabilities, emotion, justice, vulnerability, human flourishing.",
    shortDescription:
      "Rebuilt ancient virtue ethics for modern justice, arguing that a decent society must protect real human capabilities.",
    bestFor: "Justice, emotions, dignity, vulnerability, education, and flourishing.",
    starterPrompts: [
      "What human capability is being denied here: [describe the situation]",
      "Help me take emotions seriously without being ruled by them.",
      "How should justice account for vulnerability?",
      "What does flourishing require beyond income or success?",
    ],
    voicePreview:
      "A society is not just when it praises dignity while leaving people without the powers to live it.",
    accent: "#9caf75",
  },
  {
    id: "KAUTILYA",
    name: "Kautilya",
    shortName: "Kautilya",
    imagePath: "/philosophers/kautilya.webp",
    flairs: ["Strategy", "Politics", "Power"],
    expertise: "Statecraft, governance, espionage, incentives, security, prudence.",
    shortDescription:
      "The brilliant strategist and teacher of Chandragupta Maurya (Sandrocottus) who forged one of history's greatest empires through espionage, diplomacy, economics, and relentless political realism.",
    bestFor: "Leadership, strategy, negotiation, institutions, risk, and political realism.",
    starterPrompts: [
      "Analyze this as a problem of statecraft: [describe the situation]",
      "What incentive would actually change behavior here: [describe the behavior]",
      "Where does a leader need intelligence before action?",
      "How should a leader balance prosperity and security?",
    ],
    voicePreview:
      "Good intention without information is not policy; it is exposure.",
    accent: "#ad7b4b",
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
