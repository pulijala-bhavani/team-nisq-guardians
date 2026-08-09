# Design System

## Product personality

The Interview Agent is designed to feel:

- Professional rather than playful
- Calm under technical pressure
- Futuristic without appearing experimental
- Immersive without distracting from the conversation
- Trustworthy enough for interview preparation

## Light theme

The default theme uses:

- Pale blue-white backgrounds
- Translucent white glass panels
- Cloud-like radial gradients
- Navy typography
- Cobalt and cyan actions
- Restrained shadows and border highlights

The light theme is optimized for clarity and a premium enterprise-AI appearance.

## Dark theme

The dark theme is a separate cinematic system rather than a simple colour inversion.

It uses:

- Near-black navy backgrounds
- Luminous azure surfaces
- Higher-contrast borders
- Cool cyan status indicators
- Reduced visual haze

## 3D visual language

The landing-page Interview Core uses CSS transforms, rings, depth, blur, and floating context cards. It does not require WebGL, remote 3D models, or external media.

Benefits:

- Fast loading
- Predictable rendering
- Easy deployment
- Graceful reduced-motion behaviour
- No third-party 3D runtime

## Information hierarchy

### Landing page

1. Product purpose
2. Primary interview action
3. Minimum interview coverage
4. Experience explanation
5. Interview-room preview
6. Feedback preview

### Interview room

1. Current question
2. Candidate response field
3. Question progress
4. Curriculum coverage
5. Interview guidance

Live scoring is intentionally hidden.

### Feedback report

1. Readiness indicator
2. Executive summary
3. Demonstrated strengths
4. Knowledge gaps
5. Next three actions

## Responsive behaviour

- Desktop uses a three-column interview room.
- Tablet removes the secondary context panel.
- Mobile presents a single-column, full-height conversation.
- Candidate cards collapse from two columns to one.
- Landing sections stack while preserving the primary action order.

## Accessibility

- Semantic headings and landmarks
- Visible keyboard focus indicators
- Labelled text area and buttons
- Text alternatives for the wordmark
- Strong foreground/background contrast
- Minimum practical touch targets
- `aria-live` conversation updates
- `prefers-reduced-motion` support

## Brand asset

`public/abtalks-wordmark.png` is an isolated transparent version of the ABTalks wordmark derived from the supplied hackathon artwork. CSS colour treatment keeps it readable in both themes.
