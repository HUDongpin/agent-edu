import assert from "node:assert/strict";
import test from "node:test";
import { materialiseCourseKit } from "../lib/course-kit/locale";
import { COURSE_KIT_DEFINITIONS } from "../lib/course-kit/registry";
import {
  COURSE_KIT_ZH_HANS_SOURCE_PRESENTATION_TRANSLATIONS,
  materialiseCourseKitSourcePresentation,
} from "../lib/course-kit/source-presentation";

const ENGLISH_DEFAULT_TRANSFORMATION =
  "Claims were bounded, paraphrased, and integrated into original course instruction; no source prose, image, notebook, assignment, or quiz was copied.";
const ENGLISH_LINK_ONLY_RIGHTS =
  "Link-only evidence: no source asset is redistributed; only original paraphrase and citation metadata are published.";
const ENGLISH_LICENCE_RIGHTS =
  "Reuse is limited by the recorded licence and to original paraphrase; no third-party source asset is redistributed.";

test("Course Kit Simplified Chinese source registers localise learner-facing provenance and reuse prose", () => {
  for (const definition of COURSE_KIT_DEFINITIONS) {
    const course = materialiseCourseKit(definition, "zh-Hans");
    for (const source of course.sources) {
      assert.notEqual(source.transformation, ENGLISH_DEFAULT_TRANSFORMATION);
      assert.notEqual(source.rightsBoundary, ENGLISH_LINK_ONLY_RIGHTS);
      assert.notEqual(source.rightsBoundary, ENGLISH_LICENCE_RIGHTS);
      assert.match(source.transformation, /主张已经限定边界并转述为原创课程讲解/u);
      assert.match(source.rightsBoundary, /未再分发任何第三方来源资产/u);
    }
  }
});

test("Course Kit source presentation records source-language and translated LTR semantics", () => {
  const course = materialiseCourseKit(COURSE_KIT_DEFINITIONS[0], "zh-Hans");
  const source = course.sources[0] as typeof course.sources[number] & {
    readonly presentationLocales?: Readonly<Record<string, string>>;
  };

  assert.equal(source.presentationLocales?.title, "en");
  assert.equal(source.presentationLocales?.publisher, "en");
  assert.equal(source.presentationLocales?.conceptDomain, "en");
  assert.equal(source.presentationLocales?.supports, "zh-Hans");
  assert.equal(source.presentationLocales?.boundary, "zh-Hans");
  assert.equal(source.presentationLocales?.transformation, "zh-Hans");
  assert.equal(source.presentationLocales?.rightsBoundary, "zh-Hans");
  assert.equal(source.presentationLocales?.licence, "zh-Hans");
});

test("every Course 16–21 licence statement has an exact Simplified Chinese presentation translation", () => {
  for (const definition of COURSE_KIT_DEFINITIONS) {
    const course = materialiseCourseKit(definition, "zh-Hans");
    for (const sourceRecord of definition.sources) {
      if (!sourceRecord.licence) continue;
      assert.ok(
        Object.hasOwn(
          COURSE_KIT_ZH_HANS_SOURCE_PRESENTATION_TRANSLATIONS,
          sourceRecord.licence,
        ),
        `${definition.manifest.id}/${sourceRecord.id} is missing an exact licence translation`,
      );
      const presented = course.sources.find(
        (candidate) => candidate.id === sourceRecord.id,
      );
      assert.ok(presented);
      assert.notEqual(presented.licence, sourceRecord.licence);
      assert.equal(presented.presentationLocales.licence, "zh-Hans");
    }
  }
});

test("reported version and jurisdiction prose is translated without translating source titles", () => {
  const expectedTranslations = new Map([
    ["responsible-ai", "algorithmic-impact-assessment"],
    ["ai-research", "grade-book-current"],
    ["deep-learning", "dl04-pytorch-optim-2-13"],
    ["production-ai", "pa04-openlineage"],
  ]);

  for (const [courseId, sourceId] of expectedTranslations) {
    const definition = COURSE_KIT_DEFINITIONS.find(
      (candidate) => candidate.manifest.id === courseId,
    );
    assert.ok(definition);
    const original = definition.sources.find((candidate) => candidate.id === sourceId);
    assert.ok(original);
    const source = materialiseCourseKit(definition, "zh-Hans").sources.find(
      (candidate) => candidate.id === sourceId,
    );
    assert.ok(source);
    assert.equal(source.title, original.title);
    assert.equal(source.presentationLocales.title, "en");
    if (original.revision) {
      assert.notEqual(source.revision, original.revision);
      assert.equal(source.presentationLocales.revision, "zh-Hans");
    }
    if (original.jurisdiction) {
      assert.notEqual(source.jurisdiction, original.jurisdiction);
      assert.equal(source.presentationLocales.jurisdiction, "zh-Hans");
    }
  }
});

test("unknown source metadata is preserved in English instead of receiving a blanket translation", () => {
  const source = {
    ...COURSE_KIT_DEFINITIONS[0].sources[0],
    transformation: "Unreviewed transformation statement.",
    rightsBoundary: "Unreviewed rights boundary.",
    licence: "Unreviewed licence statement.",
    revision: "Unreviewed revision statement.",
    jurisdiction: "Unreviewed jurisdiction statement.",
  };
  const presented = materialiseCourseKitSourcePresentation(
    source,
    { supports: "经审校的支持说明。", boundary: "经审校的证据边界。" },
    "zh-Hans",
  );

  assert.equal(presented.transformation, source.transformation);
  assert.equal(presented.rightsBoundary, source.rightsBoundary);
  assert.equal(presented.licence, source.licence);
  assert.equal(presented.revision, source.revision);
  assert.equal(presented.jurisdiction, source.jurisdiction);
  assert.equal(presented.presentationLocales.transformation, "en");
  assert.equal(presented.presentationLocales.rightsBoundary, "en");
  assert.equal(presented.presentationLocales.licence, "en");
  assert.equal(presented.presentationLocales.revision, "en");
  assert.equal(presented.presentationLocales.jurisdiction, "en");
});
