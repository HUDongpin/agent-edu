import assert from "node:assert/strict";
import test from "node:test";
import { GITHUB_FINAL_QUIZ } from "../lib/github";
import {
  selectGithubJourney,
  type GithubJourneyLesson,
} from "../components/github/course-journey";

const lessons = [
  { slug: "start-secure", href: "/en/github/start-secure/" },
  { slug: "repository-readme", href: "/en/github/repository-readme/" },
  { slug: "teaching-capstone", href: "/en/github/teaching-capstone/" },
] as const satisfies readonly GithubJourneyLesson[];

const completedLessons = Object.fromEntries(
  lessons.map((lesson) => [`github.lesson.${lesson.slug}`, true]),
);
const passedQuiz = {
  "github.quiz.best": 10,
  "github.quiz.passed": true,
  "github.quiz.version": GITHUB_FINAL_QUIZ.bankVersion,
};

test("GitHub journey selects the first incomplete lesson", () => {
  assert.deepEqual(selectGithubJourney(lessons, {}), {
    completed: 0,
    total: 5,
    percent: 0,
    courseCompleted: false,
    nextHref: "/en/github/start-secure/",
  });
  assert.equal(selectGithubJourney(lessons, {
    "github.lesson.start-secure": true,
  }).nextHref, "/en/github/repository-readme/");
});

test("GitHub journey advances from assessment to anchored capstone", () => {
  const assessment = selectGithubJourney(lessons, completedLessons);
  assert.equal(assessment.completed, 3);
  assert.equal(assessment.nextHref, "#github-final-quiz-title");

  const capstone = selectGithubJourney(lessons, {
    ...completedLessons,
    ...passedQuiz,
  });
  assert.equal(capstone.completed, 4);
  assert.equal(
    capstone.nextHref,
    "/en/github/teaching-capstone/#github-capstone",
  );
});

test("GitHub journey returns to Lesson 1 for fully complete review", () => {
  assert.deepEqual(selectGithubJourney(lessons, {
    ...completedLessons,
    ...passedQuiz,
    "github.capstone.v1": true,
  }), {
    completed: 5,
    total: 5,
    percent: 100,
    courseCompleted: true,
    nextHref: "/en/github/start-secure/",
  });
});
