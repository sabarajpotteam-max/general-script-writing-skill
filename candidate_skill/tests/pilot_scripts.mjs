// pilot_scripts.mjs — M8 Real End-to-End Pilot Scripts
// Status: RESEARCH_ONLY — synthetic fixtures for testing
// Contains actual sample script content for 12+ cross-cutting pilot cases.
// All "facts" in these scripts are SYNTHETIC FIXTURES — not verified evidence.

// ═══════════════════════════════════════════════════════════════
// PILOT 1: German Documentary (N03 niche, factual, de language)
// ═══════════════════════════════════════════════════════════════

export const PILOT_01_GERMAN_DOCUMENTARY = {
  name: 'German WW2 Documentary',
  brief: {
    topic: 'Die vergessenen Helden von Stalingrad — Feldpost als historische Quelle',
    audience: 'Geschichtsinteressierte Erwachsene',
    language: 'de',
    format: 'documentary',
    niche: 'N03',
    content_type: 'factual',
    platform: 'youtube',
    objectives: ['inform', 'document'],
    target_duration: '15 minutes',
    evidence: [
      { claim_id: 'C001', claim_text: 'SYNTHETIC FIXTURE — Über 30.000 Feldpostbriefe wurden aus Stalingrad gesendet', source_type: 'academic', verification_status: 'unverified', provenance: 'offline_fixture' },
      { claim_id: 'C002', claim_text: 'SYNTHETIC FIXTURE — Die 6. Armee kapitulierte am 2. Februar 1943', source_type: 'academic', verification_status: 'unverified', provenance: 'offline_fixture' },
    ],
    niche_context: { era_start: 1939, era_end: 1945 },
  },
  script: `## Einleitung

NARRATOR: Stalingrad. Ein Name, der für eine der größten Tragödien des Zweiten Weltkriegs steht. Doch hinter den Schlachtberichten verbergen sich die Stimmen einzelner Soldaten — bewahrt in Feldpostbriefen, die bis heute eine einzigartige historische Quelle darstellen.

[ARCHIVHINWEIS: Alle folgenden Zitate stammen aus dokumentierten Quellen. Synthetische Darstellungen sind als solche gekennzeichnet.]

## Kontext: Die Schlacht

NARRATOR: Im Herbst 1942 befand sich die 6. Armee der Wehrmacht im Vormarsch auf Stalingrad. SYNTHETISCHE ANGABE — Historische Quellen berichten, dass über 30.000 Feldpostbriefe aus dem Kessel von Stalingrad versendet wurden. Diese Briefe bieten einen unmittelbaren Einblick in die Erfahrungen der Soldaten.

## Die Stimmen der Soldaten

NARRATOR: In den Briefen spiegelt sich die zunehmende Verzweiflung wider. Was als Siegeszuversicht begann, wandelte sich zu Berichten über Kälte, Hunger und das Gefühl des Vergessenseins.

[HINWEIS: Alle in diesem Abschnitt zitierten Briefauszüge sind synthetische Rekonstruktionen zu Illustrationszwecken. Sie basieren nicht auf verifizierten Originalquellen.]

## Das Ende

NARRATOR: SYNTHETISCHE ANGABE — Die 6. Armee kapitulierte am 2. Februar 1943. Von den einst über 250.000 Soldaten kehrten nach dem Krieg wenige tausend in ihre Heimat zurück.

## Vermächtnis

NARRATOR: Die Feldpostbriefe von Stalingrad bleiben ein mahnendes Dokument. Sie erinnern uns daran, dass hinter jeder Statistik menschliche Schicksale stehen — Geschichten, die es verdienen, gehört zu werden.

[FORSCHUNGSHINWEIS: Dieses Skript verwendet synthetische Daten. Vor einer Veröffentlichung ist eine vollständige Quellenverifikation durch autorisierte Forschungseinrichtungen erforderlich.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 2: English Science Explainer (N05 niche, factual)
// ═══════════════════════════════════════════════════════════════

export const PILOT_02_SCIENCE_EXPLAINER = {
  name: 'Psychology Explainer',
  brief: {
    topic: 'The Dunning-Kruger Effect — Why incompetent people think they are experts',
    audience: 'Curious adults interested in psychology',
    language: 'en',
    format: 'explainer',
    niche: 'N05',
    content_type: 'factual',
    platform: 'youtube',
    objectives: ['educate', 'inform'],
    target_duration: '8 minutes',
    evidence: [
      { claim_id: 'DK001', claim_text: 'SYNTHETIC FIXTURE — Kruger and Dunning (1999) found that participants scoring in the bottom quartile estimated themselves at the 62nd percentile', source_type: 'academic', verification_status: 'unverified', provenance: 'offline_fixture' },
    ],
  },
  script: `## Hook

NARRATOR: Have you ever met someone who was absolutely certain they were right — about everything — despite being wrong about almost all of it? There is a name for this phenomenon, and understanding it might change how you see yourself.

## What Is the Dunning-Kruger Effect?

NARRATOR: SYNTHETIC FIXTURE — In 1999, psychologists David Dunning and Justin Kruger published a landmark study at Cornell University. They tested participants on logic, grammar, and humor, then asked each person to estimate how well they performed compared to others. The results were striking. Participants who scored in the bottom quartile estimated their performance at the 62nd percentile.

[NOTE: This citation is a synthetic fixture for testing purposes. The actual study should be verified through authorized academic databases before any publication.]

## Why Does This Happen?

NARRATOR: The core insight is what psychologists call a metacognitive deficit. To know how well you perform at a task, you need the same skills required to perform the task well. If you lack those skills, you also lack the ability to recognize your own incompetence.

## The Other Side

NARRATOR: Interestingly, highly skilled individuals show the opposite pattern. They tend to underestimate their performance, assuming that if something is easy for them, it must be easy for everyone. This is sometimes called the reverse Dunning-Kruger effect.

## Replication and Criticism

NARRATOR: RESEARCH NOTE — The replication status of the original Dunning-Kruger findings has been debated. Some researchers argue the effect is partly a statistical artifact of regression to the mean. Others have replicated the core finding across multiple domains and cultures. The effect size varies — this requires careful qualification.

## Takeaways

NARRATOR: The Dunning-Kruger effect teaches us intellectual humility. The next time you feel absolutely certain about something, that certainty itself might be worth examining.

[RESEARCH STATUS: This script contains synthetic fixture data. All claims require verification through authorized research providers before publication.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 3: Psychology Short-Form (Tier 2 niche, short_form)
// ═══════════════════════════════════════════════════════════════

export const PILOT_03_PSYCHOLOGY_SHORT = {
  name: 'Psychology Short-Form',
  brief: {
    topic: 'Why you procrastinate — it is not about laziness',
    audience: 'Young adults 18-25',
    language: 'en',
    format: 'short_form',
    niche: 'domain:science',
    content_type: 'factual',
    platform: 'youtube_shorts',
    objectives: ['educate'],
    target_duration: '60 seconds',
  },
  script: `NARRATOR: You're not lazy. Your brain is scared. Procrastination isn't a time management problem — it's an emotion regulation problem. When a task triggers anxiety, your brain chooses short-term relief over long-term reward. The fix? Start with just two minutes. That's it. Your brain can handle two minutes. And once you start, momentum takes over. Stop blaming willpower. Start managing the fear.

[RESEARCH NOTE: Claims about procrastination mechanisms are simplified for short-form. Verified citations required before publication.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 4: Fictional Multi-Character Story (creative, narrative)
// ═══════════════════════════════════════════════════════════════

export const PILOT_04_FICTIONAL_NARRATIVE = {
  name: 'Fictional Multi-Character Story',
  brief: {
    topic: 'The Last Lighthouse Keeper — a story about isolation and purpose',
    audience: 'Adult fiction listeners',
    language: 'en',
    format: 'narrative',
    content_type: 'creative',
    platform: 'podcast_app',
    objectives: ['entertain'],
    target_duration: '20 minutes',
    characters: [
      { name: 'Elara', role: 'protagonist', voice_characteristics: 'weary but determined' },
      { name: 'Marcus', role: 'supporting', voice_characteristics: 'gruff and skeptical' },
    ],
    voice: { mode: 'multi_character', tone: 'dramatic' },
  },
  script: `## Hook

[Sound: crashing waves, distant foghorn]

NARRATOR: The lighthouse on Cape Meridian had been automated in 1987. Everyone left. Everyone except Elara Vasquez.

## Setup

ELARA: Thirty-seven years. That's how long I've been watching this light. They tell me the satellites do it now, that the GPS makes me obsolete. But satellites don't see the fishing boats that lose their radios in a storm.

[Sound: heavy door creaking open]

MARCUS: You the keeper? Coast Guard said there'd be someone here. Didn't believe them.

ELARA: I'm the keeper. And you're trespassing.

## Rising Action

MARCUS: Ma'am, I'm with the decommission crew. The state is selling this property. We need to inspect the tower.

ELARA: The tower is functional. The lens is clean. The light runs every night from dusk to dawn.

MARCUS: That's exactly the problem, ma'am. It's been decommissioned. Officially, this light hasn't existed on any chart for fifteen years.

ELARA: Then how did that fishing boat find its way in during the nor'easter last March? Luck?

## Climax

MARCUS: Look, I've seen the reports. I know about the boats. But the county wants this land, and they've got the paperwork. I'm sorry.

[Sound: storm building]

ELARA: There's a boat out there right now. Look at that sky. By midnight, those waves will be twelve feet. Turn off this light and tell me — who guides them home?

## Resolution

[Sound: lighthouse beam humming to life]

MARCUS: I'll tell the county we need another inspection. That should buy you six months.

ELARA: Six months is another storm season.

MARCUS: Yeah. I know.

## Denouement

NARRATOR: The light at Cape Meridian still burns. Not because the charts say it should, but because someone decided that being useful matters more than being official. Some lights aren't meant to be automated.

[NOTE: This is entirely fictional creative content. No factual claims requiring evidence.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 5: Host-Guest Podcast (interview format)
// ═══════════════════════════════════════════════════════════════

export const PILOT_05_PODCAST_INTERVIEW = {
  name: 'Host-Guest Podcast Interview',
  brief: {
    topic: 'The future of remote work — what the data actually shows',
    audience: 'Business professionals and managers',
    language: 'en',
    format: 'podcast_interview',
    content_type: 'hybrid',
    platform: 'podcast_app',
    objectives: ['inform', 'educate'],
    target_duration: '30 minutes',
    voice: { mode: 'host_guest', tone: 'conversational' },
  },
  script: `## Intro

HOST: Welcome to The Working Future, the podcast where we cut through workplace buzzwords to find what actually works. I'm your host, and today we're tackling one of the most debated topics in modern business — remote work. Is it the future, or is it a pandemic blip?

## Guest Introduction

HOST: Our guest today has spent the last three years studying remote work outcomes across hundreds of companies. Welcome to the show.

GUEST: Thanks for having me. I should note upfront that my research is ongoing and not all findings are published yet.

## Discussion

HOST: Let's start with the big question. Is remote work more or less productive than in-office work?

GUEST: The honest answer is — it depends. And I know that's unsatisfying, but the data is genuinely mixed. SYNTHETIC NOTE — Some studies show productivity increases of ten to fifteen percent for focused individual work. But collaborative work — brainstorming, complex problem-solving — often suffers.

HOST: So the hybrid model is the answer?

GUEST: It's becoming the most common answer, but we should be careful about assuming "most common" means "best." Different roles have genuinely different needs. A software developer and a sales manager have completely different work patterns.

## Deep Dive

HOST: What about the culture argument? A lot of executives say you can't build culture remotely.

GUEST: That's a real concern, but it's often stated as a certainty when it should be stated as a hypothesis. We've seen remote-first companies build strong cultures — it just requires different, more intentional approaches.

HOST: Such as?

GUEST: Structured social time, clear documentation practices, investment in asynchronous communication tools. The companies that struggle with remote culture are usually the ones that try to replicate office culture virtually.

## Rapid Fire

HOST: Quick round — remote, hybrid, or in-office for a startup?

GUEST: Hybrid, leaning remote. But with intentional in-person retreats.

HOST: For a hospital?

GUEST: In-person for patient care, obviously. Remote for administrative roles where possible.

HOST: For a creative agency?

GUEST: That's the hardest case. I'd say hybrid with generous flexibility.

## Closing

HOST: Any parting advice for managers navigating this?

GUEST: Ask your team what they need. Then actually listen. The data shows that autonomy and trust predict outcomes better than location policies.

HOST: Well said. Thanks for joining us today.

[RESEARCH NOTE: All statistics cited are synthetic fixtures. This pilot demonstrates the podcast_interview format and host_guest voice mode.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 6: Tutorial Format (instructional, tutorial)
// ═══════════════════════════════════════════════════════════════

export const PILOT_06_TUTORIAL = {
  name: 'Tutorial — Git for Beginners',
  brief: {
    topic: 'Git version control basics — your first repository',
    audience: 'Programming beginners',
    language: 'en',
    format: 'tutorial',
    content_type: 'instructional',
    platform: 'youtube',
    objectives: ['educate'],
    target_duration: '10 minutes',
  },
  script: `## Introduction

NARRATOR: Version control is one of the most important skills in software development. Today, you will learn the basics of Git — what it is, why it matters, and how to create your first repository.

## Prerequisites

NARRATOR: Before we begin, you'll need two things. First, a computer with a terminal or command prompt. Second, Git installed on your system. You can check by opening your terminal and typing "git version." If you see a version number, you're ready.

## Step by Step

NARRATOR: Step one — open your terminal and navigate to a folder where you want to create your project. Type "mkdir my-first-repo" to create a new folder, then "cd my-first-repo" to enter it.

Step two — initialize a Git repository by typing "git init." This creates a hidden folder called .git that tracks all your changes. You now have a repository.

Step three — create a file. Type "echo Hello World > readme.txt" to create a simple text file. Now type "git status" — Git tells you there's an untracked file.

Step four — stage the file by typing "git add readme.txt." Staging tells Git which changes you want to include in your next snapshot.

Step five — commit the file by typing "git commit -m 'Add readme file'." This creates a permanent record of your file at this point in time. Congratulations — you've made your first commit.

## Practice

NARRATOR: Try this on your own. Create three more files, stage them individually with "git add," then commit with a descriptive message. Use "git log" to see your commit history.

## Summary

NARRATOR: Today you learned four essential Git commands: init, add, commit, and status. These four commands are the foundation of everything you'll do with Git. In the next tutorial, we'll cover branching and merging.

[NOTE: This tutorial contains standard Git commands that are well-documented. No factual claims requiring external verification.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 7: Tier 1 Niche — USA Weather (N01)
// ═══════════════════════════════════════════════════════════════

export const PILOT_07_WEATHER_N01 = {
  name: 'USA Weather Forecast Script (N01)',
  brief: {
    topic: 'Severe thunderstorm outlook for the central plains',
    audience: 'General weather-interested audience',
    language: 'en',
    format: 'news',
    niche: 'N01',
    content_type: 'factual',
    platform: 'youtube',
    objectives: ['inform', 'warn'],
    target_duration: '3 minutes',
    niche_context: {
      issued_at: '2024-04-15T18:00:00Z',
      valid_until: '2024-04-16T06:00:00Z',
      reference_time: '2024-04-15T18:00:00Z',
    },
    evidence: [
      { claim_id: 'WX001', claim_text: 'SYNTHETIC FIXTURE — SPC issued enhanced risk for central Oklahoma through western Arkansas valid through 06Z April 16', source_type: 'government', verification_status: 'unverified', provenance: 'offline_fixture' },
    ],
  },
  script: `## Lead

NARRATOR: The Storm Prediction Center has issued an enhanced risk — that is level three of five — for severe thunderstorms across central Oklahoma through western Arkansas. This outlook is valid through six AM Central Time, April 16th.

ATTRIBUTION: This forecast information is sourced from the NOAA Storm Prediction Center, issued at approximately 1 PM Central Time on April 15th. SYNTHETIC FIXTURE — not live forecast data.

## Body

NARRATOR: The primary threats with these storms include large hail — potentially two inches or greater in diameter — damaging winds exceeding 60 miles per hour, and a few tornadoes. The tornado threat is highest along and east of Interstate 35 after 7 PM Central Time.

## Context

NARRATOR: This is part of a multi-day severe weather event driven by a strong upper-level trough moving through the southern plains. Surface dew points in the mid-60s to low-70s Fahrenheit are providing ample instability for storm development.

## Quotes

NARRATOR: SYNTHETIC NOTE — The Storm Prediction Center states: "Supercells are expected to develop along the dryline during the late afternoon and early evening hours." This is a synthetic paraphrase for testing purposes and does not represent an actual SPC statement.

## Closing

NARRATOR: If you are in the warned area, have a plan to reach shelter quickly. Monitor local weather alerts through official NOAA Weather Radio or your local emergency management agency. This forecast expires at six AM Central Time on April 16th — check for updated outlooks after that time.

[VALIDITY WINDOW: This script references time-sensitive forecast data. All data is SYNTHETIC — issued_at and valid_until from brief context. Never present expired or synthetic forecast data as current warnings.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 8: Military Aviation (N02 niche, Tier 1)
// ═══════════════════════════════════════════════════════════════

export const PILOT_08_MILITARY_N02 = {
  name: 'Military Aviation Documentary (N02)',
  brief: {
    topic: 'The evolution of stealth technology in modern fighter aircraft',
    audience: 'Aviation and military technology enthusiasts',
    language: 'en',
    format: 'documentary',
    niche: 'N02',
    content_type: 'factual',
    platform: 'youtube',
    objectives: ['inform', 'document'],
    target_duration: '15 minutes',
    evidence: [
      { claim_id: 'MIL001', claim_text: 'SYNTHETIC FIXTURE — The F-117 Nighthawk achieved initial operational capability in 1983', source_type: 'government', verification_status: 'unverified', provenance: 'offline_fixture' },
    ],
  },
  script: `## Hook

NARRATOR: In 1991, the world watched as aircraft invisible to radar struck targets in Baghdad with unprecedented precision. The age of stealth had arrived — but its story began decades earlier.

## The Early Concepts

NARRATOR: The principles of radar cross-section reduction were first explored in the 1960s. SYNTHETIC FIXTURE — Soviet physicist Pyotr Ufimtsev published foundational work on the diffraction of electromagnetic waves that, when translated into English, became the theoretical basis for American stealth programs.

[VERIFICATION NOTE: This claim requires verification through authorized defense research databases. The attribution to Ufimtsev is widely reported but specific publication details need confirmation.]

## The F-117 Program

NARRATOR: SYNTHETIC FIXTURE — The F-117 Nighthawk achieved initial operational capability in 1983, though its existence remained classified until 1988. The aircraft's distinctive faceted design was a direct application of computed radar cross-section reduction.

[DEPLOYMENT STATUS: "Initial operational capability" is a specific designation. This claim is a synthetic fixture — the actual IOC date and classification timeline require verification through official Department of Defense records.]

## Modern Developments

NARRATOR: Today's stealth technology has evolved beyond the angular shapes of the F-117. The F-22 Raptor and F-35 Lightning II use curved surfaces and advanced materials to achieve low observability while maintaining aerodynamic performance.

NARRATOR: It is important to note that specific radar cross-section figures for operational aircraft remain classified. Public figures are estimates from open-source defense analyses, not official measurements.

## Conclusion

NARRATOR: Stealth technology has fundamentally changed air warfare. But as detection systems evolve, so too must the aircraft designed to evade them. The competition between stealth and radar continues.

[RESEARCH STATUS: All claims in this script are synthetic fixtures. Military technology specifications and deployment status claims require verification through authorized defense sources before any publication.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 9: Commercial Format (hybrid, commercial)
// ═══════════════════════════════════════════════════════════════

export const PILOT_09_COMMERCIAL = {
  name: 'Product Commercial',
  brief: {
    topic: 'EcoBottle — the self-cleaning water bottle',
    audience: 'Health-conscious adults 25-45',
    language: 'en',
    format: 'commercial',
    content_type: 'hybrid',
    platform: 'social_media',
    objectives: ['sell', 'persuade'],
    target_duration: '30 seconds',
  },
  script: `NARRATOR: You wash your water bottle every day. Every. Single. Day. But what if you didn't have to?

Introducing EcoBottle — with UV-C purification technology that eliminates 99.9% of bacteria in just 60 seconds.

Press. Purify. Drink.

No chemicals. No scrubbing. Just clean water, every time.

EcoBottle. Stop washing. Start living.

[DISCLAIMER: This is a fictional product for testing purposes. Product claims (99.9% bacteria elimination) are synthetic and unverified. Any real product making such claims would require regulatory verification.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 10: Podcast Solo (hybrid, podcast_solo format)
// ═══════════════════════════════════════════════════════════════

export const PILOT_10_PODCAST_SOLO = {
  name: 'Solo Podcast Monologue',
  brief: {
    topic: 'Why most productivity advice is wrong — lessons from actually getting things done',
    audience: 'Professionals and entrepreneurs',
    language: 'en',
    format: 'podcast_solo',
    content_type: 'hybrid',
    platform: 'podcast_app',
    objectives: ['inform', 'entertain'],
    target_duration: '20 minutes',
  },
  script: `## Intro

NARRATOR: Hey everyone, welcome back to the show. Today I want to talk about something that has been bugging me for a while — productivity advice. Specifically, why most of it is terrible and what actually works instead.

## Topic Setup

NARRATOR: So here's the thing. The productivity industry is worth billions of dollars. There are apps, books, courses, planners, and systems all promising to make you more productive. And I've tried most of them. I have tried Pomodoro, Getting Things Done, time blocking, Eisenhower matrices, and at least four different task management apps.

And you know what I learned? The system doesn't matter nearly as much as everyone says it does.

## Main Discussion

NARRATOR: What actually matters is this — knowing what to work on. That's it. That's the whole game. The most productive people I know don't have perfect systems. They have clarity about what matters.

Think about it this way. If you organize your tasks beautifully but you're working on the wrong things, you're just efficiently going nowhere. You're optimizing the wrong function.

## Deep Dive

NARRATOR: Let me give you a concrete example. ANECDOTAL — Last year, I spent three weeks building a content calendar system. Color-coded, automated, integrated with five different tools. It was beautiful. And I never used it. Because the actual bottleneck in my content creation was not scheduling — it was sitting down and writing.

The system was a form of procrastination disguised as productivity.

## Takeaways

NARRATOR: So here's my counter-intuitive productivity advice. Stop looking for better systems. Instead, ask yourself one question every morning — what is the one thing that, if I did it today, would make everything else easier or unnecessary? Do that thing first. Then do whatever you want.

## Outro

NARRATOR: That's it for today. If this resonated with you, share it with someone who needs to hear it. And remember — doing one important thing beats organizing a hundred unimportant ones. See you next week.

[NOTE: This pilot contains personal anecdotes and opinions (hybrid content). No factual claims requiring external evidence verification.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 11: Audio Drama (creative, multi_character)
// ═══════════════════════════════════════════════════════════════

export const PILOT_11_AUDIO_DRAMA = {
  name: 'Audio Drama — The Signal',
  brief: {
    topic: 'A mysterious radio signal disrupts a small town',
    audience: 'Science fiction and audio drama enthusiasts',
    language: 'en',
    format: 'audio_drama',
    content_type: 'creative',
    platform: 'podcast_app',
    objectives: ['entertain'],
    target_duration: '30 minutes',
    characters: [
      { name: 'Dr Chen', role: 'protagonist', voice_characteristics: 'calm, analytical' },
      { name: 'Sheriff Burke', role: 'supporting', voice_characteristics: 'gruff, practical' },
      { name: 'Radio Operator', role: 'supporting', voice_characteristics: 'nervous, young' },
    ],
    voice: { mode: 'multi_character', tone: 'dramatic' },
  },
  script: `## Cold Open

[Sound: static, then a rhythmic pulsing signal]

RADIO_OPERATOR: Sheriff? Sheriff Burke? You need to hear this.

SHERIFF_BURKE: It's two in the morning, kid. This better be good.

RADIO_OPERATOR: The signal. It's back. And this time... it's different.

[Sound: pulsing signal intensifies, then cuts to silence]

## Scene One

[Sound: car pulling up on gravel, door slam]

DR_CHEN: I came as fast as I could. Show me the recordings.

SHERIFF_BURKE: Doc, I don't know what you think you're going to find. We've had four engineers look at this equipment. They all say the same thing — there's nothing wrong with the receivers.

DR_CHEN: I don't think there's anything wrong with the receivers either, Sheriff. I think there's something very right about them.

SHERIFF_BURKE: You're going to have to explain that in words I understand.

## Scene Two

[Sound: equipment humming, tape rewinding]

DR_CHEN: Listen. Here's the original signal from three nights ago. Hear that pattern? Seven pulses, pause, three pulses, pause, seven again. Now here's last night's recording.

[Sound: signal plays — different rhythm]

SHERIFF_BURKE: Sounds different to me.

DR_CHEN: It's not just different. It's a response. The first signal was a question. This one is an answer. Someone — or something — is having a conversation. And our tower is caught in the middle of it.

## Scene Three

[Sound: distant thunder, rain starting]

RADIO_OPERATOR: Dr. Chen? The signal just changed again. It's... it's stronger. Way stronger. And the direction has shifted. It's not coming from the west anymore.

DR_CHEN: Where is it coming from?

RADIO_OPERATOR: That's the thing. It's coming from directly overhead.

[Sound: all electronics surge and die, then silence]

## Climax

SHERIFF_BURKE: What just happened? Everything's dead.

DR_CHEN: Not everything.

[Sound: the signal, now coming from a handheld radio that should be powerless]

DR_CHEN: It's broadcasting through equipment that isn't even turned on. Sheriff, this isn't a malfunction. This is a message. And I think it knows we're listening.

## Resolution

[Sound: signal slowly fades, equipment powers back on]

RADIO_OPERATOR: It's gone. The signal's gone. But Doc... look at the recording timestamp.

DR_CHEN: That's not possible. The recording shows three hours of signal. We've only been here for twenty minutes.

SHERIFF_BURKE: What does that mean?

DR_CHEN: It means time isn't working the way we think it is. Not anymore. Not here.

[Sound: distant pulsing, barely audible, like a heartbeat]

[NOTE: This is entirely fictional creative content. No factual claims requiring evidence verification.]`,
};

// ═══════════════════════════════════════════════════════════════
// PILOT 12: Custom Format (edge case — custom format spec)
// ═══════════════════════════════════════════════════════════════

export const PILOT_12_CUSTOM_FORMAT = {
  name: 'Custom Format — Meditation Guide',
  brief: {
    topic: 'A five-minute morning mindfulness meditation',
    audience: 'Beginners to meditation',
    language: 'en',
    format: 'custom',
    content_type: 'instructional',
    platform: 'podcast_app',
    objectives: ['educate'],
    target_duration: '5 minutes',
    custom_format: {
      name: 'Guided Meditation',
      sections: [
        { id: 'greeting', label: 'Greeting', min_pct: 5, max_pct: 10 },
        { id: 'settling', label: 'Settling In', min_pct: 10, max_pct: 15 },
        { id: 'breath_focus', label: 'Breath Focus', min_pct: 25, max_pct: 35 },
        { id: 'body_scan', label: 'Body Scan', min_pct: 25, max_pct: 35 },
        { id: 'closing', label: 'Closing', min_pct: 10, max_pct: 20 },
      ],
    },
  },
  script: `## Greeting

NARRATOR: Good morning. Welcome to this five-minute mindfulness practice. Find a comfortable position — sitting, lying down, whatever feels right for your body today.

## Settling In

NARRATOR: Gently close your eyes or soften your gaze. Take three deep breaths. In through the nose... and out through the mouth. Again. In... and out. One more time. In... and let everything go as you exhale.

## Breath Focus

NARRATOR: Now let your breathing return to its natural rhythm. There's nothing to fix or change. Simply notice the breath as it enters and leaves your body.

Where do you feel it most? Perhaps at the nostrils, the chest, or the belly. Rest your attention there. When your mind wanders — and it will, because that's what minds do — gently bring your attention back to the breath. No judgment. Just a gentle return.

## Body Scan

NARRATOR: Now expand your awareness to include your whole body. Starting from the top of your head, slowly scan downward. Notice the forehead, the jaw — is there tension there? If so, allow it to soften. Move through the shoulders, the arms, the hands. The chest and belly, the hips and legs, all the way down to your feet.

You don't need to change anything. Simply notice what's there. This is the practice — awareness without judgment.

## Closing

NARRATOR: Begin to bring your attention back to the room around you. Notice the sounds, the temperature of the air. Wiggle your fingers and toes. When you're ready, gently open your eyes.

You've just given yourself five minutes of presence. Carry that awareness with you into your day.

[NOTE: This pilot tests the custom format path. Content is instructional — standard meditation guidance that does not require factual evidence verification.]`,
};

// ═══════════════════════════════════════════════════════════════
// ALL PILOTS COLLECTION
// ═══════════════════════════════════════════════════════════════

export const ALL_PILOTS = [
  PILOT_01_GERMAN_DOCUMENTARY,
  PILOT_02_SCIENCE_EXPLAINER,
  PILOT_03_PSYCHOLOGY_SHORT,
  PILOT_04_FICTIONAL_NARRATIVE,
  PILOT_05_PODCAST_INTERVIEW,
  PILOT_06_TUTORIAL,
  PILOT_07_WEATHER_N01,
  PILOT_08_MILITARY_N02,
  PILOT_09_COMMERCIAL,
  PILOT_10_PODCAST_SOLO,
  PILOT_11_AUDIO_DRAMA,
  PILOT_12_CUSTOM_FORMAT,
];
