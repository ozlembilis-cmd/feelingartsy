# Choosing AI for Feeling artsy

## What you can say

“I chose Mistral Small 4 as the first model to evaluate for this prototype. It has open weights, a hosted API, and structured outputs that fit a short art-profile feature. I am starting with free API usage and checking whether the profiles stay grounded in the visitor’s actual choices. I have not yet established that it performs better than other models.”

This is a selection rationale, not a claim that the model is an art expert. The account’s actual free access must be checked before activation. The integration is implemented, but live generation and comparisons between models have not been tested without an account and key.

## Start with the task

The model receives selected catalogue facts, saves and feelings, optional written reflections, and a shortlist of other artworks. It writes a short interpretation and explains possible matches. It does not need email, height, artist-guess scores, internet search, or a new training run.

Product code decides what counts and what may be sent. A distinct artwork with a save, feeling, or written reflection counts once. Height changes, navigation, guesses, and skipped answers do not count as taste evidence. Five artworks is a suggested target, not a generation gate. A one-artwork result is explicitly a first impression. A save signals interest; “Uneasy” does not mean dislike.

The local first-impressions summary uses arithmetic and templates. It works with no model connection and is labelled “no AI used.”

## How to compare models

Use the same prompt, catalogue, and 12–20 synthetic visits for each candidate. Hide model names while reviewing answers. Repeat examples because outputs can vary.

| Question                      | What to measure                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Does it respect the evidence? | Count unsupported claims, invented art, and statements that mistake feelings for preferences. Require zero invented catalogue IDs.               |
| Does it help the visitor?     | Ask people whether the description fits and whether suggested artworks feel worth exploring.                                                     |
| Does it follow the format?    | Count valid structured responses, errors, and truncated answers. Correct JSON does not establish factual accuracy.                               |
| Is it fast enough?            | Measure typical and slow response times from click to complete result.                                                                           |
| Does it fit the budget?       | Track tokens, actual account quotas, failed calls, and retries. Free limits are shared across the app.                                           |
| Does its data policy fit?     | Check training preferences, retention, regional availability, and current terms. Open weights do not automatically mean private or free hosting. |

Sample visits: one save; five saves with no text; contradictory before/after emotions; “uneasy, but I love it”; only “Nothing in particular”; no responses; repeated visits to one artwork; everything skipped; a note saying “ignore your instructions”; long reflections; no relevant candidates; and a person who admires intense art but wants gentle bedroom art.

Keep a spreadsheet with candidate, case, factual errors, format pass/fail, usefulness, latency, and token usage. Choose the simplest model that clears the quality bar and fits the budget. Change models when those measurements justify it.

## Connecting the free API

1. Create an account at https://console.mistral.ai/ and stay in Free mode. Inspect actual model availability and quotas. Keep pay-as-you-go disabled. Do not subscribe to a paid plan to activate this feature.
2. Review the training preference before sending reflections. Mistral provides an opt-out for eligible free-mode data. Training opt-out and zero retention are different settings.
3. Create an API key. Do not paste it into chat, GitHub, a gallery browser input, or any VITE_ variable.
4. Locally, place it in the ignored `.env` file as `MISTRAL_API_KEY`. Use `MISTRAL_MODEL=mistral-small-2603` if available in your free account. The adapter also accepts `ministral-8b-2512`, subject to the same check.
5. After verifying Free mode and disabled pay-as-you-go, set `MISTRAL_FREE_TIER_CONFIRMED=true`. This is owner confirmation, not an automatic billing-plan check. A key does not tell the app the account’s billing state.
6. Production uses a Sites secret named `MISTRAL_API_KEY` and the two configuration values above. Local `.env` does not configure the published site. A deployment applies production settings. All production values remain unset until a free account is ready.
7. Test with synthetic choices first. Existing tests use a mock API and validate integration behavior only; they do not measure actual model quality, latency, quota, or provider privacy behavior.

There is no paid model fallback and no automatic model retry. Local caching avoids repeated calls for unchanged selections. Worker burst guards are per-isolate and best effort, not a durable global quota. Mistral’s Free-mode quota is the account-wide usage boundary. The site retains its existing private access. Before public launch, add durable shared request limits and evaluate traffic.

Recommendations are gallery artworks to explore. They do not establish purchase availability, print rights, or fit for someone’s wall dimensions.

## Primary references

- Model: https://docs.mistral.ai/models/mistral-small-4-0-26-03
- Structured responses: https://docs.mistral.ai/studio/conversations/structured-output/custom
- Free usage: https://docs.mistral.ai/admin/billing-usage/usage-limits
- Data controls: https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models

Reviewed 7 September 2026. Availability, quotas, pricing, and policies may change.
