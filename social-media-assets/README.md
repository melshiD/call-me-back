# CallbackApp.AI - Social Media Assets

Campaign assets to drive Devpost votes for the AI Champion Ship 2025 hackathon.

## Quick Start

1. Open the HTML files in your browser
2. Take screenshots at the sizes indicated
3. Post with the copy from `SOCIAL_MEDIA_COPY.md`

---

## Asset Files

| File | Platform | Size | Description |
|------|----------|------|-------------|
| `twitter-vote-cta.html` | Twitter/X | 1200x675 | Main tweet graphic with phone mockup + vote CTA |
| `instagram-carousel.html` | Instagram | 1080x1080 (x5) | 5-slide carousel: Hook → Problem → Solution → Tech → Vote |
| `instagram-stories.html` | IG Stories | 1080x1920 (x3) | 3 vertical stories with animations |
| `instagram-square-post.html` | Instagram | 1080x1080 (x3) | 3 standalone square post options |
| `SOCIAL_MEDIA_COPY.md` | All | - | Ready-to-post captions, hashtags, thread formats |

---

## How to Export

### Option 1: Browser Screenshot (Quickest)

1. Open HTML file in Chrome/Firefox
2. Right-click → Inspect → Toggle device toolbar
3. Set dimensions (1200x675 for Twitter, 1080x1080 for IG, etc.)
4. Screenshot the element

### Option 2: html2canvas / Puppeteer

```bash
# Install puppeteer
npm install puppeteer

# Create screenshot script
node screenshot.js
```

### Option 3: Figma Import

Copy/paste the designs into Figma for further customization.

---

## Recommended Posting Schedule

| Day | Platform | Asset | Copy Section |
|-----|----------|-------|--------------|
| 1 | Twitter | `twitter-vote-cta.html` | "Hook + Vote CTA - Option 1" |
| 1 | Instagram | `instagram-carousel.html` | "For Carousel Post" |
| 1 | IG Stories | `instagram-stories.html` | Stories 1-3 |
| 2 | Twitter | Thread | "Thread Format" |
| 2 | IG Stories | Story 3 (Vote CTA) | Story urgency reminder |
| 3 | Instagram | `instagram-square-post.html` Option 2 | "For Single Image Post" |
| 3 | Twitter | Demo video + text | "Demo Teaser" |
| 4 | Twitter | Final push | "Option 4 - Emotional Hook" |
| 4 | IG Stories | All 3 stories | Final push |

---

## Key Links

- **Vote Link**: `liquidmetal.devpost.com`
- **Live App**: `callbackapp.ai`
- **Demo Video**: `https://youtu.be/Yli46cSjd3E`

---

## Brand Colors (CSS Variables)

```css
--gold: #F5A623;
--gold-bright: #FFB940;
--teal: #00D4AA;
--dark: #0A0A0A;
```

---

## Hashtags

**Primary**: `#AIChampionShip #AI #Hackathon #VoiceAI #BuildInPublic`

**Secondary**: `#TechStartup #IndieHacker #Devpost #FutureTech`

---

## Tips for Maximum Impact

1. **Post at peak times**: 9am, 12pm, 6pm in your target timezone
2. **Engage with comments**: Every reply is a chance to ask for a vote
3. **Story frequency**: Post stories daily to stay top-of-mind
4. **Use the carousel**: Higher engagement than single images
5. **Tag the hackathon**: #AIChampionShip for visibility
6. **Personal story**: Share your journey, not just the product

---

Good luck! Go get those votes!
