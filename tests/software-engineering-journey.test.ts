import assert from "node:assert/strict";
import test from "node:test";
import {
  SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG,
  SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_LESSON_SLUGS,
  softwareEngineeringNextHref,
} from "../lib/software-engineering";

const coreComplete = [...SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS];

test("Course 8 recommends one canonical core-assessment-capstone journey", () => {
  assert.equal(
    softwareEngineeringNextHref("en", {
      completedLessonSlugs: [],
      assessmentComplete: false,
      capstoneComplete: false,
    }),
    "/en/software-engineering/agentic-engineering-system/",
  );
  assert.equal(
    softwareEngineeringNextHref("en", {
      completedLessonSlugs: coreComplete,
      assessmentComplete: false,
      capstoneComplete: false,
    }),
    "/en/software-engineering/#final-assessment",
  );
  assert.equal(
    softwareEngineeringNextHref("en", {
      completedLessonSlugs: coreComplete,
      assessmentComplete: true,
      capstoneComplete: false,
    }),
    `/en/software-engineering/${SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG}/`,
  );
  assert.equal(
    softwareEngineeringNextHref("en", {
      completedLessonSlugs: [...SOFTWARE_ENGINEERING_LESSON_SLUGS],
      assessmentComplete: true,
      capstoneComplete: false,
    }),
    `/en/software-engineering/${SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG}/#capstone-checklist`,
  );
  assert.equal(
    softwareEngineeringNextHref("en", {
      completedLessonSlugs: [...SOFTWARE_ENGINEERING_LESSON_SLUGS],
      assessmentComplete: true,
      capstoneComplete: true,
    }),
    "/en/software-engineering/agentic-engineering-system/",
  );
});

test("Course 8 resumes valid in-progress drafts before linear recommendations", () => {
  assert.equal(
    softwareEngineeringNextHref("/en/", {
      completedLessonSlugs: [],
      assessmentComplete: false,
      capstoneComplete: false,
      assessmentDraftActive: true,
    }),
    "/en/software-engineering/#final-assessment",
  );
  assert.equal(
    softwareEngineeringNextHref("en", {
      completedLessonSlugs: [],
      assessmentComplete: false,
      capstoneComplete: false,
      capstoneDraftActive: true,
    }),
    `/en/software-engineering/${SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG}/#capstone-checklist`,
  );
});
