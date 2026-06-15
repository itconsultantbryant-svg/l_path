/**
 * LibertyPath Chatbot Knowledge Base
 * Company Profile content and suggested questions for the platform chatbot.
 */

/** Common typos/misspellings -> correct word (lowercase) for smarter matching */
const TYPO_MAP = {
  depost: 'deposit', deposite: 'deposit', depoit: 'deposit', depos: 'deposit',
  pakage: 'package', pakages: 'packages', packge: 'package', packege: 'package', pacakge: 'package',
  withdral: 'withdrawal', withdrawl: 'withdrawal', withdaw: 'withdrawal', withdrwal: 'withdrawal',
  refferal: 'referral', referal: 'referral', referrel: 'referral', refferral: 'referral',
  regiter: 'register', registr: 'register', regstration: 'registration', registartion: 'registration',
  libertypth: 'libertypath', 'liberty path': 'libertypath',
  platfrom: 'platform', platorm: 'platform', platoform: 'platform',
  witdraw: 'withdraw', withdrawel: 'withdrawal',
  taske: 'task', taks: 'task',
  earnigs: 'earnings', earnning: 'earnings', earing: 'earnings',
  purchse: 'purchase', purcahse: 'purchase', purchace: 'purchase',
  detials: 'details', detais: 'details', deatils: 'details',
  informaton: 'information', informtion: 'information', inforamtion: 'information',
  quetion: 'question', qustion: 'question', quetsion: 'question',
  waht: 'what', whta: 'what', wat: 'what', wats: 'whats', wht: 'what',
  tehy: 'they', taht: 'that', thier: 'their', abot: 'about', bou: 'about',
  recieve: 'receive', recieved: 'received', reciving: 'receiving',
  proccess: 'process', proces: 'process', ammount: 'amount', amout: 'amount',
  withdarwal: 'withdrawal', hw: 'how', ho: 'how',
  pakcage: 'package'
};

/** Participation packages with exact details (from platform). */
export const PACKAGES = [
  { name: 'Starter', price: 500, durationDays: 42, dailyReward: 25, maxReward: 1050 },
  { name: 'Starter Pro', price: 1000, durationDays: 37, dailyReward: 55, maxReward: 2035 },
  { name: 'Growth', price: 2500, durationDays: 37, dailyReward: 150, maxReward: 5550 },
  { name: 'Growth Pro', price: 3500, durationDays: 35, dailyReward: 200, maxReward: 7000 },
  { name: 'Pro', price: 5000, durationDays: 70, dailyReward: 180, maxReward: 12600 },
  { name: 'VIP', price: 10000, durationDays: 65, dailyReward: 400, maxReward: 26000 },
  { name: 'VIP-1', price: 15000, durationDays: 70, dailyReward: 540, maxReward: 37800 },
  { name: 'VIP-2', price: 20000, durationDays: 80, dailyReward: 720, maxReward: 57600 },
  { name: 'VIP-3', price: 35000, durationDays: 70, dailyReward: 1260, maxReward: 88000 },
  { name: 'VVIP', price: 50000, durationDays: 70, dailyReward: 1800, maxReward: 126000 },
  { name: 'VVIP-1', price: 75000, durationDays: 50, dailyReward: 3000, maxReward: 150000 },
  { name: 'VVIP-2', price: 100000, durationDays: 70, dailyReward: 3600, maxReward: 252000 },
  { name: 'VVIP-3', price: 150000, durationDays: 100, dailyReward: 5400, maxReward: 540000 }
];

/** Package name variants for matching user input (lowercase) -> official name. Order matters: longer names first. */
const PACKAGE_ALIASES = [
  ['starter pro', 'Starter Pro'], ['stater pro', 'Starter Pro'], ['stratrer pro', 'Starter Pro'],
  ['growth pro', 'Growth Pro'], ['growht pro', 'Growth Pro'], ['groth pro', 'Growth Pro'],
  ['vvip 3', 'VVIP-3'], ['vvip-3', 'VVIP-3'], ['vvip3', 'VVIP-3'],
  ['vvip 2', 'VVIP-2'], ['vvip-2', 'VVIP-2'], ['vvip2', 'VVIP-2'],
  ['vvip 1', 'VVIP-1'], ['vvip-1', 'VVIP-1'], ['vvip1', 'VVIP-1'],
  ['vip 3', 'VIP-3'], ['vip-3', 'VIP-3'], ['vip3', 'VIP-3'],
  ['vip 2', 'VIP-2'], ['vip-2', 'VIP-2'], ['vip2', 'VIP-2'],
  ['vip 1', 'VIP-1'], ['vip-1', 'VIP-1'], ['vip1', 'VIP-1'],
  ['vvip', 'VVIP'], ['vip', 'VIP'], ['starter', 'Starter'], ['stater', 'Starter'], ['stratrer', 'Starter'],
  ['growth', 'Growth'], ['growht', 'Growth'], ['groth', 'Growth'], ['pro', 'Pro']
];

export const DEPOSIT_CTA = '\n\n**Ready to get started?** Choose a package that fits your goal, go to Wallet or Packages on the platform, and complete your deposit. Your rewards are clearly defined—no surprises. If you tell me a package name (e.g. Starter, Growth Pro, VIP), I can give you its exact details.';

/** Full referral system details for when user asks about referrals. */
const REFERRAL_FULL_CONTENT = `**How the referral system works**

LibertyPath's referral program is **activity-based**: you earn commissions only when the people you refer **actively participate** and complete tasks on the platform—not just when they register. This keeps the system fair and sustainable for everyone.

**Commission structure (up to 5 levels)**
• **Level 1** (direct referrals): You earn a percentage of their task-based earnings when they complete daily tasks.
• **Level 2–5**: You can also earn on activity from your referrals' referrals (multi-level), with rates set by the platform to keep the system balanced.
• Commission limits may apply per transaction or per day to ensure fairness; check the platform for current limits.

**How you benefit**
• Share your unique referral link or code with friends, family, or your network.
• When they register using your link and **complete tasks** on the platform, you earn commissions on their activity.
• The more referred users who stay active, the more you can earn—so guiding them on how to use the platform helps both of you.
• You can run multiple packages yourself and refer others at the same time, increasing your total earning potential.

**How to get started**
1. Go to **Dashboard → Referrals** (or **Invite Friends**).
2. Copy your **referral link** or **referral code**.
3. Share it via WhatsApp, social media, or any channel you prefer.
4. When someone signs up with your link and completes tasks, your commission is credited according to the referral terms.

**Why it's designed this way**
The program rewards real engagement, not just sign-ups. This means your earnings are tied to actual platform activity, which supports long-term stability and trust. If you have more questions about referral rates or limits, you can ask in our **WhatsApp group**—just ask me for the WhatsApp link.`;

/** Returns the full referral system response for any referral-related question. */
export function getReferralFullResponse() {
  return `**Referral Program – Full details**\n\n${REFERRAL_FULL_CONTENT}`;
}

/** Persuasive fallback when no answer is found; always refers to WhatsApp. */
export function getPersuasiveFallback(whatsappUrl, corrected = '') {
  const intro = corrected
    ? `I interpreted your question as: "${corrected}". I don't have a specific answer for that in my knowledge base, but I'd love to help.\n\n`
    : '';
  return (
    intro +
    `**Here’s what I can do for you:**\n\n` +
    `• Answer questions about the platform, packages, tasks, withdrawals, and referrals.\n` +
    `• Give you exact details for any participation package.\n` +
    `• Share the official WhatsApp link so you can join our community.\n\n` +
    `**For more details or personal support**, join our **WhatsApp chatroom**. Our team and other members are there to help with anything—registration, deposits, referrals, or technical issues. It’s the best place to get quick, clear answers.\n\n` +
    `**Join the WhatsApp group here:** ${whatsappUrl}\n\nAsk me **"What is the WhatsApp link?"** and I’ll send you the join link right away. You can also try one of the suggested questions below—I’m here to help you get the most out of LibertyPath.`
  );
}

export const SUGGESTED_QUESTIONS = [
  'What is LibertyPath?',
  'How do I register?',
  'How does the platform work?',
  'How do I purchase a package?',
  'How do I deposit?',
  'How do I complete tasks?',
  'How does the referral program work?',
  'How do I withdraw my earnings?',
  'What is the WhatsApp link?',
  'Show me the platform logo',
  'Who we are',
  'Mission and vision',
  'Is LibertyPath secure?',
  'How do I set my withdrawal PIN?',
  'When are withdrawals processed?',
  'Support and contact',
  'Is LibertyPath legit?',
  'Long-term stability',
  'Trust and transparency',
  'What packages are available?',
  'Tell me about the Starter package',
  'Why should I deposit?'
];

export const KNOWLEDGE_SECTIONS = [
  {
    id: 'overview',
    title: 'Executive Overview',
    keywords: ['overview', 'executive', 'what is libertypath', 'about libertypath', 'company', 'introduction', 'libertypath', 'legit', 'legitimate', 'real', 'scam', 'trustworthy'],
    content: `LibertyPath Ltd. is a technology-driven participation and rewards platform developed to provide individuals with structured opportunities to earn daily income through active engagement. Established on March 24, 2023, in Monrovia, Liberia, the platform was founded with the goal of creating a reliable, transparent, and sustainable system where participation directly translates into measurable financial rewards.

The platform operates on a clearly defined participation model rather than an investment structure. Earnings are generated strictly through completing tasks and engaging with platform activities linked to active packages. By focusing on participation instead of speculative returns, LibertyPath provides a predictable environment where users understand exactly how their income is generated.`
  },
  {
    id: 'who-we-are',
    title: 'Who We Are',
    keywords: ['who we are', 'who are you', 'company', 'team', 'organization', 'digital'],
    content: `LibertyPath Ltd. is a forward-thinking digital platform organization committed to empowering individuals through technology-enabled participation systems. Our team consists of experienced professionals in platform development, user engagement design, digital reward systems, and secure financial processing.

We specialize in building structured environments where users can perform simple tasks, maintain daily participation, and receive consistent rewards based on their activity level and package selection. LibertyPath operates entirely online, supported by secure servers, monitoring systems, and technical frameworks designed to maintain uninterrupted platform performance.`
  },
  {
    id: 'mission',
    title: 'Mission Statement',
    keywords: ['mission', 'mission statement', 'goal', 'purpose'],
    content: `Our mission is to make daily participation rewarding, transparent, and reliable for every member of our community. LibertyPath was founded on the belief that consistent effort should always produce measurable results. We provide a structured pathway where users can engage in clearly defined tasks and receive rewards according to established package terms.

We strive to ensure that all participants have equal access to opportunities regardless of experience level. We provide clear guidelines, defined reward structures, and predictable withdrawal timelines so users always know what to expect.`
  },
  {
    id: 'vision',
    title: 'Vision Statement',
    keywords: ['vision', 'vision statement', 'future', 'long term'],
    content: `LibertyPath's vision is to become a leading participation and rewards platform recognized for reliability, fairness, and user empowerment. We envision a future where individuals across different regions can access structured earning opportunities without barriers or uncertainty.

We aim to expand our platform capabilities, introduce new participation features, and continuously improve user experience while maintaining our commitment to integrity and accountability. Our vision is rooted in permanence—we are committed to operating continuously and serving users without interruption.`
  },
  {
    id: 'how-it-works',
    title: 'How the Platform Works',
    keywords: ['how does it work', 'how platform works', 'how to use', 'process', 'workflow', 'steps', 'register', 'registration', 'sign up', 'create account', 'get started'],
    content: `The LibertyPath platform is simple to follow:

1. Create an account – Register and access your personal dashboard (control center for packages, tasks, earnings, and withdrawals).
2. Select participation package(s) – Each package defines earning potential, duration, and reward limits.
3. Complete daily tasks – Tasks are straightforward and achievable. Complete them within the platform.
4. Earn rewards – After tasks are completed successfully, rewards are credited to your wallet according to the package structure.
5. Withdraw – Monitor your balance and request withdrawals when eligible. Withdrawal requests are processed within 24 hours on business days; weekend requests are handled on the next working day.`
  },
  {
    id: 'packages',
    title: 'Participation Packages',
    keywords: ['package', 'packages', 'purchase', 'buy', 'earning', 'participation package'],
    content: `Participation packages form the foundation of LibertyPath's earning system. Each package is a structured plan that provides access to daily tasks and associated rewards. Packages have clearly defined durations, daily earning allocations, and maximum reward limits.

You may activate multiple packages simultaneously to increase earning potential. All rewards are governed by the duration and cap of each package. Packages are not speculative tools—they are structured participation frameworks that reward consistent engagement. To purchase a package, go to Dashboard → Packages (or Wallet), choose a package, and complete the deposit process.`
  },
  {
    id: 'why-deposit',
    title: 'Why Deposit on LibertyPath?',
    keywords: ['why deposit', 'why should i deposit', 'convince me', 'should i deposit', 'is it safe to deposit', 'why pay', 'reason to deposit'],
    content: `Depositing on LibertyPath unlocks a **clear, predictable earning path**—not speculation. When you deposit, you choose a participation package with fixed terms: you know the duration, daily reward, and maximum reward upfront. There are no hidden conditions.

**Why it makes sense:** (1) Your rewards are tied to simple daily tasks you can complete in minutes. (2) Withdrawals are processed within 24 hours on business days—you get your earnings out when you need them. (3) The platform has been operating since 2023 with a long-term commitment to stability. (4) You can start with a lower-tier package like Starter (500 LRD) to see how it works, then scale up when you’re comfortable.

Every package is designed so that consistent participation leads to measurable rewards. Choose a package that fits your goal, complete your deposit via Wallet or Packages, and start earning.`
  },
  {
    id: 'deposit',
    title: 'Deposits & Purchasing Packages',
    keywords: ['deposit', 'deposits', 'pay', 'payment', 'mtn', 'orange', 'ussd', 'how to pay'],
    content: `To purchase a participation package, you need to make a deposit. Go to Wallet (or Dashboard → Purchase Package). Select a package, then choose a payment method (MTN or Orange). Use the USSD code or number provided to complete payment, then submit your deposit request with the payment reference. Deposits are reviewed and approved by the team; once approved, your package becomes active and you can start completing daily tasks.`
  },
  {
    id: 'tasks',
    title: 'Completing Tasks',
    keywords: ['task', 'tasks', 'complete', 'daily', 'how to complete'],
    content: `Once you have an active package, daily tasks are assigned within the platform. Tasks are designed to be straightforward and achievable. Complete them as required by your package; after successful completion, rewards are credited to your wallet according to the package structure.

Go to Dashboard → Complete Tasks (or the Tasks page) to see and complete your daily tasks. Consistency is key—regular participation leads to predictable rewards.`
  },
  {
    id: 'referral',
    title: 'Referral Program',
    keywords: ['referral', 'referrals', 'invite', 'commission', 'refer'],
    content: REFERRAL_FULL_CONTENT
  },
  {
    id: 'withdrawals',
    title: 'Withdrawals',
    keywords: ['withdraw', 'withdrawal', 'earnings', 'cash out', 'payment', 'when', 'how long', 'withdrawal processed', 'processing time'],
    content: `After completing tasks, rewards are credited to your wallet. You can request a withdrawal when eligible. Withdrawal requests are processed within 24 hours on business days; weekend requests are handled on the next working day (e.g., Monday).

You must set a Withdrawal PIN in your Profile before requesting a withdrawal. Go to Wallet, enter the amount, account details (number, name), and your Withdrawal PIN to submit a request.`
  },
  {
    id: 'withdrawal-pin',
    title: 'Withdrawal PIN',
    keywords: ['pin', 'withdrawal pin', 'set pin', 'security pin'],
    content: `For your security, you must set a Withdrawal PIN before requesting any withdrawal. Go to Profile (or Wallet → Withdrawal PIN Setup), enter a 4–8 digit PIN and confirm it. Save it securely—you will need to enter this PIN each time you request a withdrawal. You can update your PIN anytime from Profile.`
  },
  {
    id: 'guarantee',
    title: 'Guarantee and Commitment',
    keywords: ['guarantee', 'commitment', 'promise', 'reliable'],
    content: `LibertyPath is committed to honoring all legitimate earnings generated through active participation. Once you complete required tasks within an active package, rewards are credited and remain available for withdrawal subject to platform policies. We provide technical support, maintain platform stability, and monitor systems to ensure smooth operation. Our responsibility includes protecting user experience, maintaining security, and ensuring all legitimate participation is rewarded as promised.`
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    keywords: ['security', 'privacy', 'safe', 'secure', 'data', 'protect'],
    content: `Security is a top priority. We use industry-standard measures to protect user accounts, personal information, and financial data. Systems have multiple layers of protection to prevent unauthorized access and ensure safe transactions. We do not sell personal data and only share information with trusted service providers required for platform functionality. You can access, update, or request deletion of your information.`
  },
  {
    id: 'support',
    title: 'Support & Communication',
    keywords: ['support', 'help', 'contact', 'communication', 'assistance'],
    content: `LibertyPath maintains a dedicated support system for questions about participation, withdrawals, or account management. Our support team provides clear guidance and timely responses. Assistance is available for both new users learning the platform and experienced participants. We provide accessible contact channels and respond promptly so every participant feels supported. You can also join our official WhatsApp group for announcements and community support—ask the chatbot for the WhatsApp link.`
  },
  {
    id: 'principles',
    title: 'Core Principles',
    keywords: ['principles', 'values', 'transparency', 'integrity'],
    content: `LibertyPath operates on: Transparency (all rules, reward structures, and withdrawal processes are clearly explained); Consistency (daily earning opportunities without irregularity); Integrity (strict participation guidelines and fairness); Security (industry-standard safeguards); and Reliability (honoring earned rewards and maintaining system stability).`
  },
  {
    id: 'transparency-trust',
    title: 'Transparency & Trust',
    keywords: ['trust', 'transparency', 'trust philosophy', 'legitimate', 'credibility'],
    content: `LibertyPath believes trust is built through performance, not persuasion. We focus on demonstrating credibility through consistent operation, accurate reward crediting, and dependable withdrawal processing. We encourage participants to evaluate LibertyPath based on actual experience—how the system functions, how tasks are completed, and how rewards are delivered. This results-driven approach promotes informed decision-making and ensures users rely on observable performance.`
  },
  {
    id: 'online-operations',
    title: 'Online Operations',
    keywords: ['online', 'office', 'physical', 'digital only', 'regulatory', 'operate'],
    content: `LibertyPath has been operating fully online since 2023. The platform was built as a fully digital system—registration, participation, task completion, reward tracking, and withdrawals are handled electronically through secure infrastructure. We do not maintain a physical office; this digital-only model reflects many modern global platforms that prioritize accessibility and efficiency. Operating online allows uninterrupted service and lets users participate anytime, from anywhere.`
  },
  {
    id: 'long-term',
    title: 'Long-Term Plan & Stability',
    keywords: ['long term', 'stability', 'permanent', 'closure', 'future', 'sustainable'],
    content: `LibertyPath was created with a long-term vision and is structured to operate permanently without intention of closure. Our strategy focuses on continuous improvement, infrastructure expansion, and sustainable growth. We are committed to strengthening systems, introducing new features, and expanding participation opportunities while maintaining stability. Sustainability is a central priority—every update is planned so that growth does not compromise system stability. Our commitment is a continuous promise to remain operational, reliable, and supportive.`
  },
  {
    id: 'financial-freedom',
    title: 'Unlocking Your Financial Freedom',
    keywords: ['financial freedom', 'empowerment', 'income', 'earn', 'growth'],
    content: `LibertyPath is built on the belief that financial empowerment should be accessible to everyone willing to participate consistently. The platform transforms daily engagement into a pathway for building income, discipline, and long-term financial progress. Financial freedom is built through consistent effort and clear systems. We provide the structure so participation leads to measurable rewards—helping you plan, manage earnings, and set achievable goals. The system serves as both an earning tool and a personal development framework.`
  },
  {
    id: 'compliance',
    title: 'Compliance & Participation Integrity',
    keywords: ['compliance', 'integrity', 'rules', 'guidelines', 'fraud', 'suspension', 'fair'],
    content: `To ensure fairness and sustainability, LibertyPath enforces clear participation guidelines. Tasks must be completed legitimately and according to platform rules. Any attempt to manipulate the system, submit false activity, or engage in fraudulent behavior may result in account suspension or termination. These policies protect honest participants and maintain balance. When everyone follows the same rules, rewards can be distributed fairly and consistently. We monitor activity to ensure compliance and prevent abuse.`
  },
  {
    id: 'why-participate',
    title: 'Why Participate?',
    keywords: ['why', 'benefits', 'advantages', 'reasons'],
    content: `LibertyPath offers a structured and predictable earning system. Results are tied directly to your activity—you know what is required to earn and how rewards are calculated. The platform is user-friendly and accessible. Fast withdrawal processing, transparent guidelines, and consistent reward crediting build confidence. We foster a supportive community where participants can grow together through simplicity, transparency, and reliability.`
  }
];

/**
 * Correct common typos in a message. Returns { corrected, wasCorrected }.
 */
export function normalizeQuery(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return { corrected: '', wasCorrected: false };
  let text = userMessage.trim();
  const words = text.split(/\s+/);
  let wasCorrected = false;
  const correctedWords = words.map((w) => {
    const lower = w.toLowerCase().replace(/[^\w-]/g, '');
    if (TYPO_MAP[lower]) {
      wasCorrected = true;
      return TYPO_MAP[lower];
    }
    return w;
  });
  const corrected = correctedWords.join(' ').toLowerCase().trim();
  return { corrected: corrected || text.toLowerCase().trim(), wasCorrected };
}

/**
 * Find which package the user is asking about (e.g. "starter", "vip-2", "growth pro").
 * Returns the package object or null.
 */
export function getPackageByQuery(normalizedQuery) {
  if (!normalizedQuery) return null;
  const q = normalizedQuery.replace(/\s+/g, ' ').trim();
  for (const [alias, officialName] of PACKAGE_ALIASES) {
    if (q.includes(alias) || q === alias) {
      const pkg = PACKAGES.find((p) => p.name === officialName);
      if (pkg) return pkg;
    }
  }
  for (const pkg of PACKAGES) {
    const nameLower = pkg.name.toLowerCase();
    if (q.includes(nameLower) || q === nameLower) return pkg;
  }
  return null;
}

/**
 * Format a single package's exact details for the bot response.
 */
export function formatPackageDetails(pkg) {
  if (!pkg) return '';
  return (
    `**${pkg.name}** (exact details)\n\n` +
    `• **Price:** ${pkg.price.toLocaleString()} LRD\n` +
    `• **Duration:** ${pkg.durationDays} days\n` +
    `• **Daily reward:** ${pkg.dailyReward.toLocaleString()} LRD per day\n` +
    `• **Maximum reward:** ${pkg.maxReward.toLocaleString()} LRD total\n\n` +
    `You earn ${pkg.dailyReward.toLocaleString()} LRD each day for ${pkg.durationDays} days by completing your daily tasks, up to a maximum of ${pkg.maxReward.toLocaleString()} LRD for this package.`
  );
}

/**
 * Check if the user is asking for a list of all packages (e.g. "list packages", "all packages").
 */
export function isAskingForPackageList(normalizedQuery) {
  if (!normalizedQuery) return false;
  const listPatterns = [
    /list\s+(all\s+)?(pakage|package)s?/i,
    /all\s+(pakage|package)s?/i,
    /what\s+(pakage|package)s?\s+(do\s+you\s+have|are\s+there|available)/i,
    /show\s+(me\s+)?(all\s+)?(pakage|package)s?/i,
    /(pakage|package)s?\s+(available|offered)/i,
    /every\s+(pakage|package)/i
  ];
  return listPatterns.some((re) => re.test(normalizedQuery));
}

/**
 * Get formatted list of all packages (summary) for bot response.
 */
export function getPackagesListResponse() {
  const lines = PACKAGES.map(
    (p) =>
      `• **${p.name}** – ${p.price.toLocaleString()} LRD | ${p.durationDays} days | ${p.dailyReward.toLocaleString()} LRD/day | max ${p.maxReward.toLocaleString()} LRD`
  );
  return (
    `**All participation packages (exact details):**\n\n` +
    lines.join('\n') +
    `\n\nAsk me for a specific package by name (e.g. "Tell me about Starter" or "VIP-2 details") and I’ll give you the exact breakdown.` +
    DEPOSIT_CTA
  );
}

/**
 * Find the best matching knowledge section(s) for a user message.
 * Uses normalized/corrected message for matching.
 */
export function findRelevantSections(normalizedMessage) {
  if (!normalizedMessage || typeof normalizedMessage !== 'string') return [];
  const normalized = normalizedMessage.toLowerCase().trim();
  const results = [];

  for (const section of KNOWLEDGE_SECTIONS) {
    let score = 0;
    for (const kw of section.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length + 1;
      }
    }
    if (score > 0) results.push({ ...section, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 2).map(({ id, title, content }) => ({ id, title, content }));
}
