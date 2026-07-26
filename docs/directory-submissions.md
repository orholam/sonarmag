# Sonar Mag directory submissions

Track every listing attempt here so agents **do not re-submit**.

Site: `https://www.sonarmag.com`  
RSS: `https://www.sonarmag.com/rss.xml`  
Contact email for forms: `adam@inkboxmail.com` (Inkbox @adam)  
Name: Adam / Sonar Mag

## Done / submitted

| Date (UTC) | Directory | Submit URL | Status | Notes |
| --- | --- | --- | --- | --- |
| 2026-07-25 | Active Search Results | https://www.activesearchresults.com/addwebsite.php | done | Confirmed via email link; membership activated |
| 2026-07-25 | Viesearch | https://viesearch.com/submit | done | Email confirmed; free plan is waiting list / CSRF on plan POST |
| 2026-07-25 | IndieBlog.page | https://indieblog.page/suggest | done | Feed already suggested (`rss.xml`); do not re-POST |
| 2026-07-25 | Blogroll.org | https://blogroll.org/submit-a-blog | pending review | POST `add-a-website` → 302 home; manual curation; leave honeypot `ihatebots` empty; submit button value `Take a look at this Manu!` |
| 2026-07-25 | Indie Aisle | https://indieaisle.com/directory/ | pending review | POST `form/` with `enablesubmit=go` (JS sets after 5s); thanks page |
| 2026-07-25 | Directory Index | https://directory-index.com/ | live | Listing: https://directory-index.com/technology/sonar-mag/ — needs screenshot ≥800×600 + seo_text ≥100 chars |
| 2026-07-25 | FreeBacklink.org | https://freebacklink.org/submit | pending review | Math captcha + email verify done; in moderation queue (~48h). Edit link kept in Inkbox verify mail. |
| 2026-07-25 | Submission.Directory | mailto:hello@submission.directory | emailed | Pitch sent from adam@inkboxmail.com |
| 2026-07-25 | Rankify | https://rankify.in/website-directory/submit | live | POST `/api/directory/submit` with logo PNG; leave honeypot `company_website` empty; category News & Media |

## Blocked / failed (do not keep retrying blindly)

| Date (UTC) | Directory | Submit URL | Status | Notes |
| --- | --- | --- | --- | --- |
| 2026-07-25 | Search My Site | https://searchmysite.net/admin/add/ | blocked | Basic tier POST returns HTTP 500 |
| 2026-07-25 | Zearches | https://zearches.com/ | blocked | Mod_Security / throttle from agent IP |
| 2026-07-25 | Feedspot | https://www.feedspot.com/ | blocked | Cloudflare 403 from agent IP |
| 2026-07-25 | ooh.directory | https://ooh.directory/suggest/ | blocked | reCAPTCHA |
| 2026-07-25 | Blogs Are Back | https://www.blogsareback.com/submit | blocked | reCAPTCHA |
| 2026-07-25 | ExactSeek | https://www.exactseek.com/add.html | blocked | captcha |
| 2026-07-25 | Blogarama | https://www.blogarama.com/members/register | blocked | hCaptcha; account required |
| 2026-07-25 | Webwiki | https://www.webwiki.com/submit | blocked | HTTP 403 from agent IP |
| 2026-07-25 | Blogscroll | https://github.com/blogscroll/blogscroll/issues/new | needs human | Requires GitHub auth + issue template (FAQ checkboxes) |
| 2026-07-25 | blogs.hn | https://github.com/surprisetalk/blogs.hn | skip | Personal blogs only; magazine is wrong fit |
| 2026-07-25 | personalsit.es | https://github.com/xdesro/personalsit.es | skip | Personal sites only |
| 2026-07-25 | theindex.fyi | https://theindex.fyi/submit | skip | Indexes/directories only, not individual blogs |
| 2026-07-25 | OnToplist | https://www.ontoplist.com/ | skip | Paid listings |

## Do not use for magazine listings

Product Hunt, SaaSHub, Capterra, G2, Futurepedia, AI-tool directories — wrong category.

## Agent checklist

1. Read this file first. If a row exists for a directory, **do not submit again**.
2. For **email-only** pitches, also read gitignored `docs/directory-outreach.local.md` and **do not re-mail** those addresses.
3. Use `adam@inkboxmail.com` + Inkbox for any verification mail (`inkbox email get -i adam <id>` for full body/links).
4. After every attempt, append a row here the same turn.
