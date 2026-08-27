# Machine Learning fixture notice

Notice version: `machine-learning-notice.v2`  
Fixture version: `machine-learning-fixture.v1`  
Issued: 2026-08-26

The CSV, recommendation-events JSON, and schema in this directory were authored specifically for aicourse.top. Every identifier, cohort, feature value, outcome, user, item, event, exposure, timestamp, partition, and relationship is fictional. No value was sampled, transformed, simulated from, or otherwise derived from a real learner, institution, intervention, public microdata file, recommender log, benchmark dataset, or third-party course asset.

The data files are dedicated to the public domain under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). The dedication covers the original fixture data and metadata in this directory. It does not change the licence of course software, scikit-learn, research papers, standards, product names, or linked websites.

The fixed `partition` column exists to test evidence isolation: 20 rows are training, 5 validation, and 5 holdout. It must never be used as a feature. The tiny hand-authored table deliberately makes some patterns easy to inspect and therefore cannot benchmark realistic model performance. The interaction log is equally artificial and has incomplete exposure by design. Neither resource supports prediction, ranking, profiling, triage, personalization, intervention, or deployment involving real people.

See `provenance.v1.json` for byte-level checksums, generation method, rights assertions, known artificialities, and non-claims.

The `lab/` directory is an original, course-specific offline CPU teaching pack. Its standard-library logistic pipeline, independent validator, schemas, environment lock, artifact template, and documentation were authored for this course. No third-party notebook, assignment, quiz, source code, trained model, learner data, or product screenshot is embedded. Fixture data remain CC0-1.0; lab code and course copy are not included in that data dedication and follow the repository's applicable terms. `checksums.sha256` and `provenance.v1.json` cover every published lab payload file.
