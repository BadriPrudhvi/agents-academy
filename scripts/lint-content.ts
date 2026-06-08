/* ============================================================================
 * Content linter — the executable half of the lesson Definition of Done.
 * Run: pnpm lint:content
 *
 * Validates every authored lesson against the rubric AND the grading invariant:
 *   - the reference solution passes ALL checks
 *   - the starter fails AT LEAST ONE check
 * Exits non-zero on any failure so it can gate CI.
 * ========================================================================== */
import { allLessons } from "../src/lib/content/index.ts";
import { mockRunner } from "../src/lib/runner/mock.ts";
import type { Lesson } from "../src/lib/content/types.ts";

// Minimal ambient for the script runtime (avoids pulling @types/node into the app).
declare const process: { exit(code: number): void };

let errors = 0;
const fail = (slug: string, msg: string) => {
  errors++;
  console.error(`  ✗ [${slug}] ${msg}`);
};

async function lintLesson(l: Lesson) {
  console.log(`• ${l.slug}`);

  // ── Rubric field checks ──
  if (l.summary.length > 160) fail(l.slug, `summary too long (${l.summary.length} > 160)`);
  if (l.outcomes.length < 2 || l.outcomes.length > 4) fail(l.slug, "outcomes must be 2–4");
  if (!l.whyItMatters.trim()) fail(l.slug, "missing whyItMatters");
  if (l.competencies.length < 1) fail(l.slug, "needs ≥1 competency");
  if (l.misconceptions.length < 1) fail(l.slug, "needs ≥1 misconception");
  if (l.recap.length < 2 || l.recap.length > 4) fail(l.slug, "recap must be 2–4 items");
  if (l.timeEstimateMin < 1) fail(l.slug, "timeEstimateMin must be set");

  // ── Block references resolve ──
  for (const b of l.blocks) {
    if (b.kind === "codelab" && !l.labs[b.labId]) fail(l.slug, `codelab references missing lab '${b.labId}'`);
    if (b.kind === "watch" && !l.labs[b.labId]) fail(l.slug, `watch references missing lab '${b.labId}'`);
    if (b.kind === "agentSim" && !l.sims?.[b.simId]) fail(l.slug, `agentSim references missing sim '${b.simId}'`);
    if (b.kind === "agentBuilder" && !l.builders?.[b.builderId]) fail(l.slug, `agentBuilder references missing builder '${b.builderId}'`);
    if (b.kind === "agentStudio" && !l.studios?.[b.studioId]) fail(l.slug, `agentStudio references missing studio '${b.studioId}'`);
    if (b.kind === "quiz" && !l.quizzes[b.quizId]) fail(l.slug, `quiz references missing quiz '${b.quizId}'`);
  }

  // ── AgentSim integrity (no-code interactive) ──
  for (const sim of Object.values(l.sims ?? {})) {
    if (!sim.toolName.trim()) fail(l.slug, `sim '${sim.id}' missing toolName`);
    if (sim.toolPreview.columns.length < 1 || sim.toolPreview.rows.length < 1) {
      fail(l.slug, `sim '${sim.id}' needs a visible toolPreview table`);
    }
    if (sim.goals.length < 1) fail(l.slug, `sim '${sim.id}' needs at least one goal`);
    for (const goal of sim.goals) {
      if (!goal.program.trim()) fail(l.slug, `sim '${sim.id}' goal '${goal.id}' missing server-side program`);
      if (!goal.expectedAnswer.trim()) fail(l.slug, `sim '${sim.id}' goal '${goal.id}' missing expectedAnswer`);
      if (goal.steps.length < 3) fail(l.slug, `sim '${sim.id}' goal '${goal.id}' needs at least 3 steps`);
      if (!goal.chatbotGuess.trim()) fail(l.slug, `sim '${sim.id}' goal '${goal.id}' missing chatbotGuess`);
    }
  }

  // ── AgentBuilder integrity (no-code-to-code bridge) ──
  for (const builder of Object.values(l.builders ?? {})) {
    if (!builder.title.trim()) fail(l.slug, `builder '${builder.id}' missing title`);
    if (!builder.intro.trim()) fail(l.slug, `builder '${builder.id}' missing intro`);
    if (builder.steps.length < 4) fail(l.slug, `builder '${builder.id}' needs at least 4 steps`);
    for (const step of builder.steps) {
      if (!step.label.trim()) fail(l.slug, `builder '${builder.id}' step '${step.id}' missing label`);
      if (!step.plain.trim()) fail(l.slug, `builder '${builder.id}' step '${step.id}' missing plain-language explanation`);
      if (!step.code.trim()) fail(l.slug, `builder '${builder.id}' step '${step.id}' missing code`);
      if (!step.output.trim()) fail(l.slug, `builder '${builder.id}' step '${step.id}' missing run output`);
    }
  }

  // ── AgentStudio integrity (unified build + run interactive) ──
  for (const studio of Object.values(l.studios ?? {})) {
    if (!studio.title.trim()) fail(l.slug, `studio '${studio.id}' missing title`);
    if (!studio.toolCatalog.trim()) fail(l.slug, `studio '${studio.id}' missing toolCatalog (needed for AI codegen)`);
    if (!studio.starterProgram.trim()) fail(l.slug, `studio '${studio.id}' missing starterProgram`);
    if (studio.toolPreview.columns.length < 1 || studio.toolPreview.rows.length < 1) {
      fail(l.slug, `studio '${studio.id}' needs a visible toolPreview table`);
    }
    if (studio.capabilities.length < 2) fail(l.slug, `studio '${studio.id}' needs at least 2 capabilities`);
    if (studio.goals.length < 1) fail(l.slug, `studio '${studio.id}' needs at least one goal`);
    for (const g of studio.goals) {
      if (!g.program.includes("export default")) fail(l.slug, `studio '${studio.id}' goal '${g.id}' program must export a default function`);
    }
  }

  // ── Quiz integrity ──
  for (const q of Object.values(l.quizzes)) {
    if (q.answerIndex < 0 || q.answerIndex >= q.options.length) fail(l.slug, `quiz '${q.id}' answerIndex out of range`);
    if (!q.explanation.trim()) fail(l.slug, `quiz '${q.id}' missing explanation`);
  }

  // ── Grading invariant ──
  for (const lab of Object.values(l.labs)) {
    if (lab.challenge.checks.length < 1) {
      fail(l.slug, `lab '${lab.id}' has no checks`);
      continue;
    }
    const editable = lab.files.find((f) => !f.readOnly);
    if (!editable) {
      fail(l.slug, `lab '${lab.id}' has no editable file`);
      continue;
    }

    const solutionFiles = lab.files.map((f) =>
      f.path === editable.path ? { path: f.path, contents: lab.challenge.solutionHint } : { path: f.path, contents: f.contents },
    );
    const starterFiles = lab.files.map((f) => ({ path: f.path, contents: f.contents }));

    const sol = await mockRunner.run(
      { lessonSlug: l.slug, labId: lab.id, action: "check", files: solutionFiles },
      { language: lab.language, runCmd: lab.runCmd, files: lab.files, checks: lab.challenge.checks },
    );
    const start = await mockRunner.run(
      { lessonSlug: l.slug, labId: lab.id, action: "check", files: starterFiles },
      { language: lab.language, runCmd: lab.runCmd, files: lab.files, checks: lab.challenge.checks },
    );

    if (!sol.grade?.passed) fail(l.slug, `lab '${lab.id}': reference solution does NOT pass all checks`);
    if (start.grade?.passed) fail(l.slug, `lab '${lab.id}': starter already passes (challenge is trivial)`);
  }
}

const lessons = allLessons();
console.log(`Linting ${lessons.length} lesson(s)…\n`);
for (const l of lessons) await lintLesson(l);

if (errors > 0) {
  console.error(`\n✗ ${errors} content error(s).`);
  process.exit(1);
}
console.log("\n✓ All lessons pass the rubric + grading invariant.");
