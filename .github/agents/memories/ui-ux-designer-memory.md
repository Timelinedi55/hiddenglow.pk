# UI/UX Designer Memory

## Color System History

### Original Colors (Pre-update)
| Token | Hex | Usage |
|-------|-----|-------|
| brand-nude | #F5E9E2 | Backgrounds, hover |
| brand-blush | #E8CFC5 | Secondary buttons, accents |
| brand-cream | #FFF8F5 | Page background |
| brand-dark | #2B2B2B | Text, primary buttons |
| brand-dark-light | #4A4A4A | Secondary text |

### New Colors (Requested — Pending Implementation)
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #E86A8A | Buttons, CTAs, links |
| Secondary | #F4A6B5 | Soft accents, badges |
| Accent | #C94A6A | Hover states, emphasis |
| Background | #FFF6F8 | Page/section backgrounds |
| Text Primary | #2B2B2B | Headings, body text |
| Text Secondary | #6B6B6B | Captions, meta text |
| Gradient | linear-gradient(135deg, #F4A6B5, #E86A8A) | Hero sections, CTAs |

### Distribution Rule
- 70% white/cream (#FFFFFF, #FFF6F8)
- 20% soft pink (#F4A6B5, #E86A8A)
- 10% accent (#C94A6A)

## Component Patterns

### Cards
- Use `surface-card` class: rounded-[1.75rem], subtle shadow, white bg
- Product cards: image on top, name + price below, hover scale effect

### Buttons  
- `btn-primary`: Main CTA — filled background, white text
- `btn-secondary`: Soft action — lighter background
- `btn-outline`: Alternative CTA — bordered, transparent bg

### Layout
- Container: max-w-7xl with responsive padding
- Product page: 2-col grid on desktop, stacked on mobile
- Shop grid: 2-col mobile, 3-col tablet, 4-col desktop

## Design Decisions Log

- (Record design changes and rationale here)

## Known Issues

- Product page needs mobile responsiveness improvements
- Product page needs better conversion optimization elements
- Sticky mobile CTA bar exists but may need refinement
