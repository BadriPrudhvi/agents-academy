# Lesson rubric & Definition of Done

Content is the product. Every lesson is authored against this rubric and must
pass the content linter (`pnpm lint:content`) before it can be marked
`published`. This is the first-class content-quality system from the plan.

## The rubric (maps 1:1 to the `Lesson` schema)

| Field | Requirement |
| --- | --- |
| `title` / `summary` | Concrete, jargon-free. Summary ≤ 160 chars. |
| `outcomes` | 2–4 observable "you can…" statements. Verbs, not topics. |
| `whyItMatters` | One paragraph connecting the lesson to real agent work. |
| `prerequisites` | Explicit. Lesson slugs or short phrases. |
| `timeEstimateMin` | Honest estimate (5–20 min per lesson). |
| `competencies` | ≥ 1 skill tag for the mastery map. |
| `misconceptions` | ≥ 1 documented belief + correction. Drives tutor feedback. |
| `blocks` | Concept → worked example → **interactive lab** → retrieval check. |
| `labs` | Every `codelab` block resolves to a lab with a graded challenge. |
| `quizzes` | Every `quiz` block resolves; answer explanation targets a misconception. |
| `recap` | 2–4 takeaways that mirror the outcomes. |

## Pedagogy sequencing (cognitive load)

1. **Concept** — the mental model first, in plain language.
2. **Worked example** — annotated, correct code the learner reads.
3. **Faded scaffolding** — the lab: correct code with TODOs to complete.
4. **Independent challenge** — graded by hidden checks.
5. **Retrieval practice** — a quiz that forces recall, with misconception-aware feedback.

## Definition of Done (gates `status: "published"`)

- [ ] All rubric fields present and within limits (enforced by `lint:content`).
- [ ] Every `codelab`/`quiz` block resolves to a defined lab/quiz.
- [ ] Each lab has ≥ 1 grading check; the **reference solution passes all checks**
      and the **starter fails at least one** (enforced by `lint:content`).
- [ ] Technical review: code is accurate against current Agents SDK APIs.
- [ ] Instructional review: outcomes ↔ recap ↔ challenge are aligned.
- [ ] Accessibility: headings nest correctly; no info conveyed by color alone.
- [ ] `pnpm build` and `pnpm lint:content` are green.

## Review pipeline

draft → technical review (code runs, checks pass in CI) → instructional review
(clarity, load, outcome alignment) → accessibility review → `published`.

## Doc-drift check (future)

A scheduled job re-fetches the cited Cloudflare docs and flags lessons whose
APIs changed, so the curriculum tracks a fast-moving platform.
