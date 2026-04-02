# Timed Debate Mode with Guided Setup

## Summary
Add a first-class `DEBATE` mode with a guided pre-debate flow: tone selection, time selection, topic choice, side assignment, dramatic topic reveal, then debate start. Timed debates may be `15 min`, `20 min`, `30 min`, or `1 hour`, with a `No timer` option. Debate behavior must adapt to the selected duration: shorter debates are sharper and compressed, longer debates are more layered and intellectually deep. When a timed debate ends, the debate is finished permanently, and the session shifts into a closed result state with a neutral winner decision and a `Show summary` action.

## Key Changes
### Debate setup flow
- The new chat screen gets a mode switch: `Socratic` / `Debate`.
- Selecting `Debate` launches a centered, premium setup flow instead of dropping straight into the normal composer.
- Setup steps run in this order:
  1. `Tone`: `Ruthless, Respectful`, `Blunt, Aggressive`, `Tough, Polished`
  2. `Time`: `15 min`, `20 min`, `30 min`, `1 hour`, `No timer`
  3. `Topic source`: user enters a topic or asks AI to generate suggestions
  4. `Topic confirmation`: if AI-generated, show 2-3 philosophy topics and let the user pick one
  5. `Side selection`: user chooses their side; AI takes the opposite side
  6. `Topic reveal`: chosen topic appears with a dramatic reveal animation
  7. `Ready state`: show “Ready to begin?” with a clear start action
- Add a small info icon beside the time options explaining that duration changes the debate style and depth, not just the clock.

### Time-aware debate behavior
- Debate configuration must shape prompt behavior, pacing, and response style.
- `15 min`
  - fast, direct, minimal drift
  - short rebuttals
  - aggressive focus on the core claim
- `20 min`
  - still tight, but with more room for examples and counterexamples
- `30 min`
  - balanced mode with enough space for layered argument and refinement
- `1 hour`
  - deep intellectual debate
  - more historical context, conceptual distinctions, and developed argumentative arcs
- `No timer`
  - long-form debate behavior without countdown pressure
- The timer selection should influence prompt instructions and debate-state transitions, not only model choice.

### Topic handling
- User may provide a topic, but it must be philosophy-related.
- Validation should first use lightweight philosophy-domain checks and then use an LLM classification pass if the result is ambiguous.
- Non-philosophy topics are rejected with a short explanation and acceptable reframing examples.
- If the user does not provide a topic, the AI generates 2-3 philosophy debate topics from the app’s corpus/themes, and the user chooses one.
- Suggested topics should be thesis-shaped and robust enough for the selected duration.

### Debate runtime
- Once started, the debate moves into a live session page with debate-specific UI.
- Timed debates show a visible premium timer in the main chat area or top bar.
- When time reaches zero:
  - hard stop the debate
  - mark the session as completed
  - generate a neutral winner decision
  - show a short verdict summary
  - do not allow rematch, continue, or restart actions inside that session
- After ending, the session remains viewable as a completed debate transcript with a `Show summary` button only.
- To start another debate, the user must create a new chat from the normal new-chat entry point.

### Future-proof result storage
- Even though detailed coaching is out of scope for v1, store debate outcome data now so a richer feedback feature can be added later.
- Persist enough structured data to support future reports:
  - topic
  - user side
  - AI side
  - selected tone
  - selected duration
  - winner
  - short verdict summary
  - debate transcript boundaries
  - timestamps and timer completion state

## UI
### Setup experience
- Build the setup as a smooth center-screen flow matching the current premium, minimal aesthetic.
- `Tone` and `Time` options should use polished segmented-card or chip-card controls, suitable for `shadcn/ui`.
- The time selector includes a subtle info icon with a small popover or tooltip.
- The topic step should support:
  - input field for custom topic
  - alternate action to generate suggestions
  - inline validation if the topic is not philosophy-related
- The topic reveal should be cinematic but restrained: fade, blur resolve, strong typography, slight scale or slide motion.

### In-session debate UI
- Debate sessions should display a distinct badge and styling treatment compared with Socratic chats.
- Sidebar should differentiate debate chats clearly:
  - dedicated icon in both collapsed and expanded states
  - optional small badge or accent in expanded mode
  - same visual language as the current sidebar
- Active debate sessions should surface:
  - topic
  - tone
  - timer state if applicable
- Ended debate sessions should:
  - keep the transcript visible
  - show the winner/verdict state
  - show a `Show summary` button
  - hide or disable further message input

## Backend and Interfaces
- Extend `SessionMode` with `DEBATE`.
- Add debate-specific persisted configuration:
  - `debateTone`
  - `debateDurationPreset`
  - `debateHasTimer`
  - `debateTopic`
  - `userDebateSide`
  - `aiDebateSide`
  - `debateStatus`
  - `debateStartedAt`
  - `debateEndedAt`
- Add result metadata for future feedback:
  - `debateWinner`
  - `debateVerdictSummary`
  - optional structured `debateMeta` JSON if needed
- API changes:
  - setup/session creation path must support debate configuration before first debate turn
  - `POST /api/v1/chat/messages` should respect persisted debate config for debate sessions
  - add timer-expiry handling path so end-of-debate verdicts are generated consistently
  - ended debate sessions should reject new debate turns

## AI Orchestration
- Add a dedicated debate prompt path.
- Debate prompt must take explicit inputs:
  - tone
  - duration preset
  - timer/no-timer mode
  - topic
  - user side
  - AI side
- Duration preset changes prompt behavior:
  - concise and surgical for short debates
  - expansive and analytical for long debates
- End-of-timer verdict generation should use a separate neutral judging instruction set so the winner summary is not biased by the AI’s debating voice.

## Test Plan
- Select `Debate` on the new chat screen and verify the guided setup appears instead of the normal default flow.
- Verify tone selection, time selection, info icon, and topic-selection flow all work smoothly.
- Enter a non-philosophy topic and verify it is rejected with a useful explanation.
- Generate topic suggestions and verify the user can select one.
- Confirm side assignment is captured and restored.
- Start timed debates for all presets and verify the timer renders and the AI pacing changes appropriately.
- Let a timed debate expire and verify the session hard-stops into a completed state with winner decision, short summary, and only a `Show summary` action.
- Verify `No timer` debates do not render countdown behavior.
- Verify debate sessions appear visually distinct in the sidebar in both collapsed and expanded states.
- Confirm ended debate sessions cannot continue receiving new debate messages.
- Confirm Socratic mode remains unchanged.

## Assumptions
- Debate setup occurs before the first debate message rather than inline inside the existing composer.
- AI-generated topics are selected from 2-3 suggestions, not auto-started without user confirmation.
- The user explicitly chooses their side and the AI takes the opposite side.
- Timer countdown should be visible to the user throughout timed debates.
- When a debate ends, that session is permanently done; any new debate starts from a new chat.
