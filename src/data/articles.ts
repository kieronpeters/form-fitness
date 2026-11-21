import type { Article } from '../types';

export const ARTICLES: Article[] = [
  {
    slug: 'progressive-overload-without-guesswork',
    title: 'Progressive overload, without the guesswork',
    category: 'Training',
    readMinutes: 6,
    featured: true,
    accent: 'lime',
    excerpt:
      'You do not need a new programme every month. You need one clear rule for when to add weight, when to add reps, and when to leave it alone.',
    sections: [
      {
        heading: 'The principle in one sentence',
        paragraphs: [
          'Progressive overload simply means asking your body to do slightly more over time. More weight, more reps at the same weight, more quality sets, or better execution all count. The mistake is trying to increase everything at once, every week.',
          'Pick one variable per training block and let the others hold steady. For most people in a gym, the cleanest progression is a double progression: stay at the same load until you hit the top of your rep range on every working set, then add a small amount of weight and build back up.',
        ],
      },
      {
        heading: 'A practical double-progression rule',
        paragraphs: [
          'Say your programme asks for 3 × 8–10 on a bench press. If you get 8, 8, 7 at 70 kg, keep 70 kg next week. If you get 10, 10, 10 with two reps still in reserve, move to 72.5 kg and accept that you will be back at 8 reps.',
          'This prevents the classic trap of adding weight every session until form collapses, then spending a month recovering. It also gives every set a job: accumulate honest reps before you earn the next load.',
        ],
        bullets: [
          'Small jumps for upper-body lifts: 1–2.5 kg, or one dumbbell size.',
          'Small jumps for lower-body lifts: 2.5–5 kg.',
          'If you miss the bottom of the range two weeks in a row, reduce load by about 10% and rebuild.',
          'Keep a rep in reserve on most sets; save true failure for the last set of an isolation exercise.',
        ],
      },
      {
        heading: 'When progress stalls',
        paragraphs: [
          'A stall is information, not failure. Check sleep, calories, stress and your last few weeks of volume before you change the programme. A single bad session is noise. Three flat weeks with good recovery is a signal to adjust.',
          'The first lever should usually be recovery, then volume, then exercise selection. Changing exercises every week feels productive but makes progress impossible to measure. Give a lift six to eight weeks before you judge it.',
        ],
      },
      {
        heading: 'Make it visible',
        paragraphs: [
          'Log the load, reps, and a simple effort rating. FORM derives estimated one-rep maxes and personal records from those numbers so you can see whether the trend is actually moving. Chasing a chart is not the goal — it is just a clearer view of the work.',
        ],
      },
    ],
    tips: [
      'Use the same exercise for long enough to compare sessions.',
      'Add load only when the top of the rep range is clean on every set.',
      'Deload before you are forced to, not after.',
    ],
    sources: [
      { label: 'ACSM — Progression models in resistance training', url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/' },
      { label: 'Stronger by Science — training resources', url: 'https://www.strongerbyscience.com/' },
    ],
    videoLinks: [
      { label: 'Renaissance Periodization — training science', url: 'https://www.youtube.com/@RenaissancePeriodization' },
      { label: 'Jeff Nippard — evidence-based lifting', url: 'https://www.youtube.com/@JeffNippard' },
    ],
  },
  {
    slug: 'split-that-survives-real-life',
    title: 'Build a weekly split that survives real life',
    category: 'Training',
    readMinutes: 5,
    accent: 'blue',
    excerpt:
      'The best split is the one you can repeat on a bad week. Start with the number of days you will actually train, then distribute the work.',
    sections: [
      {
        heading: 'Start with your real week',
        paragraphs: [
          'Do not choose a six-day programme because it looks impressive. Count the days you can reliably get to the gym for the next eight weeks, then subtract one for the week that goes sideways. If the answer is three, build a three-day plan and add optional accessory work later.',
          'A split is just a way to distribute weekly volume. Two to three sessions per muscle group per week is a useful default for most people, but frequency is a consequence of your schedule, not a moral obligation.',
        ],
      },
      {
        heading: 'Three reliable structures',
        paragraphs: [
          'Full body three times per week is the most forgiving structure: one press, one pull, one squat or hinge, plus accessories. Upper/lower four days gives each muscle two exposures and a little more room for specialisation. Push/pull/legs works well at five or six days, but only if the sessions are short enough to recover from.',
        ],
        bullets: [
          '3 days: full body A / B / A, rotating the first lift each week.',
          '4 days: upper / lower / upper / lower, with different rep targets.',
          '5 days: push / pull / legs / upper accessory / lower volume.',
          '2 days: two full-body sessions with three or four sets per muscle group.',
        ],
      },
      {
        heading: 'Protect the first lift',
        paragraphs: [
          'Put the exercise you care most about at the start of the session, when your technique and energy are best. If a session gets cut short, you have still done the most important work. Accessories are negotiable; the main lift usually is not.',
        ],
      },
      {
        heading: 'Plan the week, not just the workout',
        paragraphs: [
          'Use the calendar to place each training day, then decide how it will repeat. A repeating weekly schedule removes daily decisions. When life interrupts, drag the session to another day instead of abandoning the week. The goal is not a perfect plan; it is a plan you can repair.',
        ],
      },
    ],
    tips: [
      'Leave one rest day between heavy lower-body sessions when possible.',
      'If you miss a day, do not stack two hard sessions back-to-back to catch up.',
      'Schedule the week before it starts, not on the morning of.',
    ],
    sources: [
      { label: 'WHO — Physical activity guidance', url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity' },
      { label: 'Barbell Medicine — training resources', url: 'https://www.barbellmedicine.com/' },
    ],
    videoLinks: [
      { label: 'Jeff Nippard — programme design', url: 'https://www.youtube.com/@JeffNippard' },
      { label: 'MegSquats — strength training', url: 'https://www.youtube.com/@MegSquats' },
    ],
  },
  {
    slug: 'rest-between-sets',
    title: 'The honest guide to rest between sets',
    category: 'Training',
    readMinutes: 4,
    accent: 'coral',
    excerpt:
      'Rest is not laziness. It is the difference between training a muscle and training your ability to breathe through a set.',
    sections: [
      {
        heading: 'Why rest matters',
        paragraphs: [
          'Short rests make a session feel harder, but they also reduce the reps you can perform with quality. For compound lifts, that trade-off usually costs more than it gives. For isolation work, a shorter rest is often fine because the systemic fatigue is lower.',
          'A practical default: 2–3 minutes for heavy compounds, 60–90 seconds for isolation and pump work. If your next set loses more than one or two reps compared with the last, you probably rested too little.',
        ],
      },
      {
        heading: 'Use the timer, then use your judgment',
        paragraphs: [
          'Start the rest timer when you finish a set, but treat it as a floor, not a rule. If you are still breathing hard at the end of the timer, take another 30 seconds. If you feel fully recovered early, do not add time just because the clock says so.',
          'Supersets are the exception: pairing a push and a pull, or an upper and a lower, lets one muscle rest while the other works. They are a tool for saving time, not a requirement.',
        ],
      },
      {
        heading: 'Rest is part of the plan',
        paragraphs: [
          'Write rest targets into your programme so you are not negotiating with yourself mid-set. FORM starts the timer automatically when you complete a set; adjust it by 15 seconds if the session calls for something different.',
        ],
      },
    ],
    tips: [
      'Long rests are cheap; sloppy reps are expensive.',
      'If time is tight, cut sets before you cut rest on heavy compounds.',
      'Hydrate and walk around between sets instead of scrolling.',
    ],
    sources: [
      { label: 'PubMed — rest interval research', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=interset+rest+hypertrophy' },
      { label: 'Squat University — lifting health', url: 'https://squatuniversity.com/' },
    ],
    videoLinks: [
      { label: 'Squat University — lifting health', url: 'https://www.youtube.com/@SquatUniversity' },
      { label: 'Renaissance Periodization — rest periods', url: 'https://www.youtube.com/@RenaissancePeriodization' },
    ],
  },
  {
    slug: 'protein-how-much',
    title: 'Protein: how much, when, and does it matter?',
    category: 'Nutrition',
    readMinutes: 5,
    accent: 'violet',
    excerpt:
      'Most people do not need a perfect protein timing protocol. They need enough total protein, spread across the day, from foods they enjoy.',
    sections: [
      {
        heading: 'The amount',
        paragraphs: [
          'A sensible target for people who lift is roughly 1.6–2.2 grams of protein per kilogram of body weight per day. Going above that is not harmful for healthy kidneys, but it rarely adds much muscle. When you are in a calorie deficit, leaning toward the upper end helps preserve lean mass.',
          'For a 78 kg person, that is about 125–170 grams per day. If you weigh more, use a goal body weight rather than your current weight as a starting point.',
        ],
      },
      {
        heading: 'The distribution',
        paragraphs: [
          'Aim for three to four meals containing a meaningful protein source rather than trying to fit it all into dinner. A common target is 25–40 grams per meal. This is a practical habit, not a magic window — total daily intake matters most.',
          'Training does increase protein needs slightly, but the “anabolic window” is measured in hours, not seconds. A protein-containing meal within a few hours of training is enough.',
        ],
      },
      {
        heading: 'Food first, supplements second',
        paragraphs: [
          'Chicken, fish, eggs, dairy, tofu, tempeh, lentils and beans all do the job. Whey or plant protein powder is convenient when you are short on time or appetite, not a requirement. Check the label for protein per serving, not just the front of the tub.',
        ],
        bullets: [
          'Greek yogurt or skyr with fruit is an easy 20+ gram breakfast.',
          'A palm-sized portion of meat or fish is roughly 25–35 grams.',
          'Beans and lentils contribute protein plus fibre and carbs.',
          'Protein powder is useful when whole foods are impractical.',
        ],
      },
    ],
    tips: [
      'Anchor each meal with a protein source before adding extras.',
      'Keep a quick protein option at home for busy days.',
      'If you are vegetarian, combine sources across the day rather than at every meal.',
    ],
    sources: [
      { label: 'Examine — protein overview', url: 'https://examine.com/supplements/protein/' },
      { label: 'PubMed — protein intake and resistance training', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=protein+intake+resistance+training' },
    ],
    videoLinks: [
      { label: 'Layne Norton — nutrition science', url: 'https://www.youtube.com/@BioLayne' },
      { label: 'Jeff Nippard — nutrition for lifters', url: 'https://www.youtube.com/@JeffNippard' },
    ],
  },
  {
    slug: 'eating-without-tracking-everything',
    title: 'Eating for training without tracking every gram',
    category: 'Nutrition',
    readMinutes: 4,
    accent: 'lime',
    excerpt:
      'Tracking can be a useful short-term tool, but it is not the only way to eat with intent. Use structure, portions and a weekly average.',
    sections: [
      {
        heading: 'Build the plate',
        paragraphs: [
          'Start with a protein source, then add vegetables, then a measured portion of carbohydrate and a little fat. This order does most of the work: it makes the satisfying parts of a meal intentional instead of accidental.',
          'A simple week: three or four repeatable breakfasts, two or three lunch templates, and a handful of dinners you can cook without thinking. Repetition is not boring if the food is good; it is a decision you no longer have to make.',
        ],
      },
      {
        heading: 'Use portions, not perfection',
        paragraphs: [
          'A palm of protein, a fist of vegetables, a cupped hand of carbs, and a thumb of fat is a reasonable starting point for many people. Adjust based on hunger and how your training feels, not just the scale.',
          'Look at weekly averages. One high-calorie meal does not undo a week of consistent meals, and one perfect day does not fix a week of under-eating.',
        ],
      },
      {
        heading: 'Keep a diary you will actually use',
        paragraphs: [
          'Logging does not need to be all-or-nothing. Track for a few days to learn portion sizes, or log only the meals that tend to drift. The food diary in FORM is designed for quick entry — search a food, choose a meal, adjust the servings, and move on.',
        ],
      },
    ],
    tips: [
      'Plan the next meal while you are still full from the last one.',
      'Keep frozen vegetables and a quick protein in the freezer.',
      'Use the weekly average, not a single day, to judge the plan.',
    ],
    sources: [
      { label: 'Precision Nutrition — portion guidance', url: 'https://www.precisionnutrition.com/' },
      { label: 'Nutrition.gov — food and nutrition information', url: 'https://www.nutrition.gov/' },
    ],
    videoLinks: [
      { label: 'Renaissance Periodization — nutrition habits', url: 'https://www.youtube.com/@RenaissancePeriodization' },
      { label: 'Layne Norton — diet myths', url: 'https://www.youtube.com/@BioLayne' },
    ],
  },
  {
    slug: 'sleep-is-a-training-variable',
    title: 'Sleep is a training variable',
    category: 'Recovery',
    readMinutes: 4,
    accent: 'blue',
    excerpt:
      'You cannot out-supplement a short night. Sleep is where adaptation happens, and it is the first thing to fix when training feels flat.',
    sections: [
      {
        heading: 'The target',
        paragraphs: [
          'Most adults need seven to nine hours of sleep. If you are training hard, sleeping less than seven hours for several nights usually shows up as poorer coordination, higher perceived effort and slower recovery.',
          'Consistency matters as much as duration. A stable sleep and wake time helps your body clock, even on weekends. If you can only improve one thing, move your bedtime earlier rather than your wake-up time later.',
        ],
      },
      {
        heading: 'A wind-down that works',
        paragraphs: [
          'Give yourself 30–60 minutes of lower light and lower stimulation before bed. Dim screens, finish arguments with the internet, and keep the room cool and dark. Caffeine has a long half-life; for many people, a 2pm coffee is still active at 9pm.',
          'Alcohol may help you fall asleep, but it fragments sleep later in the night. If you drink, keep it away from hard training days and notice the pattern rather than arguing with it.',
        ],
      },
      {
        heading: 'Track the pattern, not the score',
        paragraphs: [
          'A sleep tracker is most useful for spotting patterns over weeks, not for judging a single night. Log sleep in your diary alongside energy, soreness and mood. If sleep and energy are both trending down while training volume goes up, that is a reason to deload, not to push harder.',
        ],
      },
    ],
    tips: [
      'Keep a consistent wake time, even after a bad night.',
      'Move caffeine earlier rather than adding more.',
      'Treat a wind-down routine as part of training, not an indulgence.',
    ],
    sources: [
      { label: 'Sleep Foundation — sleep and exercise', url: 'https://www.sleepfoundation.org/' },
      { label: 'PubMed — sleep and athletic recovery', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=sleep+athletic+recovery' },
    ],
    videoLinks: [
      { label: 'Matt Walker — sleep science', url: 'https://www.youtube.com/@MattWalker' },
      { label: 'Huberman Lab — sleep protocols', url: 'https://www.youtube.com/@hubermanlab' },
    ],
  },
  {
    slug: 'deloads-doing-less',
    title: 'Deloads: doing less to gain more',
    category: 'Recovery',
    readMinutes: 4,
    accent: 'violet',
    excerpt:
      'A deload is not a break from training. It is a planned reduction in fatigue so the next block can do its job.',
    sections: [
      {
        heading: 'When to deload',
        paragraphs: [
          'You do not need to wait until you are broken. Signs that a deload is due include joints that ache more than usual, sleep and motivation dropping, loads feeling heavier at the same reps, and three or more weeks of stalled progress.',
          'A common rhythm is three to six weeks of building followed by one easier week. Beginners can often go longer; experienced lifters pushing heavy loads may need one sooner.',
        ],
      },
      {
        heading: 'How to deload',
        paragraphs: [
          'Keep the same exercises and movement patterns, but reduce volume by roughly 30–50% and keep intensity moderate. One option: same weight, two-thirds of the sets. Another: same sets, 70–80% of the weight. Both work; choose whichever keeps you honest.',
          'Do not turn a deload into a week off the couch and then jump straight back into a personal best. The point is to reduce fatigue while maintaining the habit and the skill.',
        ],
        bullets: [
          'Cut sets before cutting exercises.',
          'Keep at least one or two hard-ish sets so the body does not detrain.',
          'Sleep and eat normally; a deload is not a diet week.',
          'Return to normal volume gradually, not all at once.',
        ],
      },
      {
        heading: 'Use the data',
        paragraphs: [
          'Look at your weekly volume, session duration and how the main lifts feel. If volume has climbed for a month while performance is flat, an easier week is probably overdue. FORM makes it easy to see that trend without a spreadsheet.',
        ],
      },
    ],
    tips: [
      'Schedule deloads in advance so they do not feel like failure.',
      'Reduce volume first, intensity second.',
      'Keep moving; recovery is active, not passive.',
    ],
    sources: [
      { label: 'Stronger by Science — deloading', url: 'https://www.strongerbyscience.com/' },
      { label: 'PubMed — fatigue and resistance training', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=deload+resistance+training' },
    ],
    videoLinks: [
      { label: 'Barbell Medicine — fatigue management', url: 'https://www.youtube.com/@BarbellMedicine' },
      { label: 'Dr. Mike Israetel — deloads', url: 'https://www.youtube.com/@RenaissancePeriodization' },
    ],
  },
  {
    slug: 'consistency-beats-intensity',
    title: 'Consistency beats intensity (and how to build it)',
    category: 'Mindset',
    readMinutes: 4,
    accent: 'coral',
    excerpt:
      'The people who get strong are not the ones with the most perfect plan. They are the ones who keep showing up when the plan gets boring.',
    sections: [
      {
        heading: 'Make the minimum obvious',
        paragraphs: [
          'Define a floor for a successful week: two workouts, or even one. A floor is not a lack of ambition; it is a promise you can keep when work, family and sleep compete for your attention. On a good week you do more. On a bad week you still do something.',
          'Put the session in the calendar and decide what you will do if it moves. A workout that can be rescheduled is more valuable than a perfect plan that collapses on contact.',
        ],
      },
      {
        heading: 'Reduce friction',
        paragraphs: [
          'Pack your bag the night before, know your first three exercises, and keep a short version of every session ready. The fewer decisions between you and the gym, the more likely you are to go. The same applies to food: keep a default breakfast and a default lunch.',
          'Track streaks because they are motivating, but do not let a broken streak become a reason to stop. One missed week is a data point, not a verdict.',
        ],
      },
      {
        heading: 'Reward the behaviour',
        paragraphs: [
          'Celebrate the session you did not feel like doing, not just the personal best. Progress photos, a simple note about how you felt, and a weekly review make the invisible work visible. Over a few months, that is what compounds.',
        ],
      },
    ],
    tips: [
      'Set a weekly floor you can hit even on your worst week.',
      'Prepare your kit and your first exercise the night before.',
      'Review the week on Sunday and schedule the next one.',
    ],
    sources: [
      { label: 'PubMed — exercise adherence', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=exercise+adherence' },
      { label: 'WHO — physical activity', url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity' },
    ],
    videoLinks: [
      { label: 'Alan Thrall — training mindset', url: 'https://www.youtube.com/@AlanThrall' },
      { label: 'MegSquats — staying consistent', url: 'https://www.youtube.com/@MegSquats' },
    ],
  },
  {
    slug: 'warm-ups-that-work',
    title: 'Warm-ups that actually warm you up',
    category: 'Training',
    readMinutes: 3,
    accent: 'gold',
    excerpt:
      'You do not need twenty minutes of stretching. You need a little blood flow, a few rehearsal sets, and a clear first working weight.',
    sections: [
      {
        heading: 'The three-part warm-up',
        paragraphs: [
          'Start with three to five minutes of easy movement — a bike, a brisk walk, a rower. Then do a few dynamic drills for the joints you are about to use: hip openers before squats, shoulder circles before pressing, ankle rocks before lunges.',
          'Finish with ramp-up sets on the first exercise: an empty bar or very light set, then two or three progressively heavier sets with fewer reps. The goal is to rehearse the pattern, not to fatigue the muscle before the work sets.',
        ],
      },
      {
        heading: 'Make it specific',
        paragraphs: [
          'A warm-up should look like the session. On a heavy squat day, spend more time on hips and ankles. On an upper-body day, add band pull-aparts and a light press. If something feels tight, give it 30 seconds of gentle movement and reassess rather than forcing a deep stretch.',
          'Keep the warm-up short enough that it does not become the workout. Five to eight minutes is plenty for most sessions.',
        ],
      },
      {
        heading: 'The first working set is part of the warm-up',
        paragraphs: [
          'Treat the first set of your main lift as a bridge between warming up and training. It should feel crisp, not maximal. FORM lets you mark warm-up sets separately so they do not distort your volume and personal-record stats.',
        ],
      },
    ],
    tips: [
      'Warm up the movement you are about to train.',
      'Ramp up with sets, not static stretching.',
      'If you are short on time, warm up the main lift and skip the extras.',
    ],
    sources: [
      { label: 'PubMed — warm-up and performance', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=warm-up+resistance+performance' },
      { label: 'ExRx — exercise directory', url: 'https://exrx.net/' },
    ],
    videoLinks: [
      { label: 'Squat University — warm-ups', url: 'https://www.youtube.com/@SquatUniversity' },
      { label: 'Omar Isuf — training basics', url: 'https://www.youtube.com/@OmarIsuf' },
    ],
  },
];

export const ARTICLE_MAP: Record<string, Article> = Object.fromEntries(ARTICLES.map((article) => [article.slug, article]));

export const ARTICLE_CATEGORIES = ['All', 'Training', 'Nutrition', 'Recovery', 'Mindset'] as const;
