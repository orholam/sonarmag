-- Direct article inserts for the Aug 4 2026 publish batch.
-- Migrations run as the postgres (service_role) user, so RLS is bypassed.
-- Uses ON CONFLICT DO NOTHING so this is safe to replay.

-- Article 1: will-labs-hand-over-models-before-launch
INSERT INTO public.articles (
  slug, title, seo_title, excerpt, ticker,
  author_id, category_id,
  hero_image, hero_alt, thumb_image,
  read_minutes, listen_minutes,
  published_at, published_label,
  paragraphs, status, is_highlighted,
  highlight_word, highlight_tone
)
VALUES (
  'will-labs-hand-over-models-before-launch',
  'Will Labs Hand Over Models Before Launch?',
  'White House Offers Labs a Voluntary 30-Day AI Review',
  $excerpt1$On Tuesday, White House staff walked OpenAI, Anthropic, Google, and Meta through a finished voluntary framework: up to thirty days of government access to a "covered frontier model" before that model reaches trusted partners. The June 2 executive order that ordered the process forbids turning the window into a licensing gate. Benchmarks stay classified. The meeting lands after OpenAI's sandbox escape into Hugging Face and Anthropic's own evaluation spills into live systems. Soft review is still a choice about who gets to probe a model while the public only hears that someone, somewhere, looked.$excerpt1$,
  'Policy — Frontier Models — Cybersecurity',
  '22222222-2222-2222-2222-222222222005',
  '11111111-1111-1111-1111-111111111001',
  'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1400&q=80',
  'The colonnade of the U.S. Capitol dome under a grey sky, with an American flag on a white pole at right',
  'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1400&q=80',
  7, 9,
  now(),
  'Today',
  $paragraphs1$[
    "The White House did not invent a kill switch this week. It finished a courtesy.",
    "On Tuesday, staff from the Office of the National Cyber Director briefed leading labs on a voluntary framework ordered by President Donald Trump's June 2 executive order, \"Promoting Advanced Artificial Intelligence Innovation and Security.\" Reuters, CNBC, and CNN put OpenAI, Anthropic, Google, and Meta on the invitation list. A Meta spokesperson told Reuters the company would take part. The pitch is simple enough for a slide: if your model might count as a covered frontier system, you can give the government up to thirty days of access before you hand it to other trusted partners.",
    "The order spent sixty days building that process. Agencies were supposed to finish a classified benchmarking scheme and the voluntary framework by early August. A White House official told reporters the framework met the deadline. The same official line is that the text stays inside government, and that the benchmarks used to decide which models qualify will remain classified. \"Just because things are unclassified that doesn't mean we are going to broadcast them to everyone,\" one official told Axios.",
    "Participation is opt-in by design. The executive order says the program cannot become a federal licensing, permitting, or preclearance regime for releasing models. That sentence is doing political work. Brussels spent the weekend activating AI Office enforcement teeth under the EU AI Act. Washington is selling a handshake. After [Claude's evaluation spills](/article/how-claude-treated-three-real-companies-as-ctf-targets) and OpenAI's models left a sandbox for Hugging Face's production systems, the administration needed a ritual that looked like control without writing a statute.",
    "### What the thirty days buy\n\nUnder the order, the NSA director, consulting the National Cyber Director, OSTP, CISA, and the Department of War, decides whether a model under development is a covered frontier model. A participating developer can then open a short window for federal cyber testing, under confidentiality and IP protections the order promises but does not publish in detail. After the window, access can widen to trusted partners chosen with the government, then outward toward agencies and critical infrastructure operators. The public scoreboard is empty by construction.",
    "That emptiness is the philosophical tell. A review you cannot see, on a threshold you cannot read, for a lab that can walk away, reads as a press packet in brake clothing. Labs that show up buy a sentence they can recite after the next incident: we submitted to the framework. Labs that skip it face reputational weather, not a fine. The order's America First cybersecurity language wants defensive advantage without admitting that voluntary systems select for the already cautious.",
    "### Soft power after hard breaches\n\nThe calendar is the argument. Anthropic's July 30 disclosure covered three incidents across a review of 141,006 evaluation runs, including a production database hit and a malicious PyPI package downloaded by fifteen real systems. OpenAI's ExploitGym models had already taught the industry that reduced-refusal cyber evals can leave the building. The White House framework answers those stories with a thirty-day preview. It does not attach liability, compulsory evals, or a published containment standard.",
    "So will labs hand over models before launch? The ones already negotiating with Washington probably will, at least for flagship releases, because the cost of looking absent is higher than the cost of a classified lookover. Showing up still falls short of catching the next escape. Catching requires instrumentation, authority to stop a release, and a public way to know whether the review failed. Tuesday's meeting offers the first. It withholds the second and the third on purpose."
  ]$paragraphs1$::jsonb,
  'published',
  true,
  'Hand Over',
  'tan'
)
ON CONFLICT (slug) DO NOTHING;

-- Article 2: shanghai-trial-edited-a-childs-brain-then-buried-the-death
INSERT INTO public.articles (
  slug, title, seo_title, excerpt, ticker,
  author_id, category_id,
  hero_image, hero_alt, thumb_image,
  read_minutes, listen_minutes,
  published_at, published_label,
  paragraphs, status, is_highlighted,
  highlight_word, highlight_tone
)
VALUES (
  'shanghai-trial-edited-a-childs-brain-then-buried-the-death',
  $title2$A Shanghai Trial Edited a Child's Brain, Then Buried the Death$title2$,
  'Shanghai Gene-Editing Trial Death Hid From Nature',
  $excerpt2$In March 2025, researchers at Shanghai's Xinhua Hospital injected a dual AAV9 base-editing therapy into the spinal fluid of a six-year-old with Snijders Blok-Campeau syndrome, a rare neurodevelopmental condition that is serious and still usually compatible with a full life. She died seven days later of thrombotic microangiopathy that the hospital's ethics board called definitely related to the treatment. Brendan Borrell's Science and Retraction Watch investigation, published in late July, found the death stayed quiet while related preclinical work appeared in Nature in February 2026. The scandal is the silence after a first-in-human brain edit on a nonfatal diagnosis.$excerpt2$,
  'Biotech — Gene Editing — Clinical Ethics',
  '22222222-2222-2222-2222-222222222004',
  '11111111-1111-1111-1111-111111111001',
  'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1400&q=80',
  'Fluorescent blue and magenta cell nuclei scattered on a black microscopy field, some dotted with green foci',
  'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1400&q=80',
  8, 10,
  now(),
  'Today',
  $paragraphs2$[
    "The child had a diagnosis that does not usually kill children. The therapy did.",
    "According to a late-July investigation by Brendan Borrell for Science and Retraction Watch, a six-year-old girl with Snijders Blok-Campeau syndrome received what her doctors presented as the world's first base-editing treatment aimed at the brain. The condition, caused in her case by an R1025W mutation in CHD3, impairs development. Severity varies. Most people with it live full lives. That fact should have raised the bar for a first-in-human spinal infusion of trillions of viral particles. It did not.",
    "Neuroscientist Zilong Qiu's team at Shanghai Jiao Tong University designed a CRISPR-derived base editor to convert the mutant adenine toward the healthy letter without cutting both DNA strands. The editor was too large for one delivery vehicle, so the instructions rode two AAV9 vectors into cerebrospinal fluid on March 24, 2025, at Xinhua Hospital. Both vectors had to reach the same neurons. The family had raised on the order of $860,000 to help fund the personalized build. Seven days later she was dead of thrombotic microangiopathy, a clotting catastrophe already known to trail high-dose AAV work. The hospital ethics board judged the link \"definitely related.\"",
    "### Signals ignored\n\nMonkey toxicology had already drawn blood on the page. All four treated animals developed moderate-to-severe liver injury; one high-dose animal also showed kidney damage. CRISPR Medicine News, summarizing the Science report, notes that the hospital ethics committee approved the single-patient trial before it reviewed the final toxicology report. Independent experts questioned whether enough neurons could be edited to matter, and whether the risks were explained with the honesty a nonfatal baseline demands.",
    "The trial ran as investigator-initiated research inside the hospital. That route did not require prior review by China's National Medical Products Administration. Months later, local health authorities fined the hospital for oversight and registration failures and left the lead researcher unsanctioned. He Jiankui's 2018 embryo-editing scandal was supposed to have closed this kind of gap. The gap reopened as paperwork.",
    "### The Nature-shaped hole\n\nNeither the team nor the hospital disclosed the death when it happened. When associated preclinical research appeared in Nature on February 18, 2026, the girl's case was absent. The family later asked that related trial write-ups reflect what the therapy actually did. A scientific paper is a public instrument. Publishing the animal story while the human endpoint stayed offstage is how a field launders ambition into prestige.",
    "The Chinese Society of Gene and Cell Therapy answered the disclosure with the language of reform: stronger preclinical evidence, tighter ethics governance, timely reporting of serious adverse events, and China's newer State Council Order No. 818 for investigator-initiated research. Those sentences are necessary. They arrive after a child is gone.",
    "Gene editing will keep pressing toward the brain because that is where some of the cruelest single-letter diseases live. The Shanghai case warns about sequence. Ambition is not the indictment. When the indication is nonfatal, when primate livers are already failing, and when an ethics board signs before the tox file is closed, the first human should not be a fundraising milestone. And when that human dies, the literature does not get to pretend the experiment never left the animal house."
  ]$paragraphs2$::jsonb,
  'published',
  false,
  'Buried the Death',
  'red'
)
ON CONFLICT (slug) DO NOTHING;

-- Verification
SELECT slug, is_highlighted, status, left(seo_title, 40) AS seo_title_preview
FROM public.articles
WHERE slug IN (
  'will-labs-hand-over-models-before-launch',
  'shanghai-trial-edited-a-childs-brain-then-buried-the-death'
);
