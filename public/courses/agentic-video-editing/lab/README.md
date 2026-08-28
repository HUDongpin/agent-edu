# Course 22 v2 offline artifact validator

The `guided-v2` directory is a course-owned, fully offline synthetic-media project. It contains a generated playable MP4, generated tone audio, an actual CPU FFmpeg candidate render, horizontal and 9:16 delivery variants, and a course-authored WebVTT file—but no personal data, provider call, credential, network requirement, or publication authority. Its fixed assets, `30000/1001` frame rate, two delivery targets, eleven M1–M9 artifacts, parent hashes, runtime-bound ffprobe records, and output bytes form one executable lineage.

Download `course22-guided-v2.zip` to get the complete working tree. Course maintainers can regenerate the synthetic bytes, ledger, and deterministic archive inventory with `npm run agentic-video-editing:fixture:generate`; that generation step requires local `ffmpeg`, `ffprobe`, and `zip`, but running the committed validator requires no network, key, provider, or GPU.

Run the complete offline contract from the repository root:

```bash
node --import tsx public/courses/agentic-video-editing/lab/validate.mts
```

Request the exact receipt used by a module command:

```bash
node --import tsx public/courses/agentic-video-editing/lab/validate.mts \
  --guided-project path/to/guided-working-copy \
  --module declarative-edit-plan \
  --artifact-id edit-plan \
  --artifact artifacts/05-edit-plan.json
```

Validate a learner final directory that uses the same filenames and payload schemas but a new project ID, `capstone-*` artifact IDs, learner-authorized media, real delivery files, `release-decision.json`, and `production-dossier.json`:

```bash
node --import tsx public/courses/agentic-video-editing/lab/validate.mts \
  --learner-final path/to/learner-project
```

The learner dossier must bind twelve explicit evidence IDs: eleven fresh M1–M9 artifacts plus the exact release decision. The selected final output must be a locally ffprobe-readable 1080×1920 MP4 between 45 and 60 seconds, and its exact SHA-256 must agree across the variant receipt, M9 candidate review, and M10 decision. A named human may choose either `publish` or `do-not-publish`; a well-supported `do-not-publish` is a valid course outcome. Validator success checks local bytes, streams, dimensions, duration, lineage, paths, authority declarations, and structured semantics. It does not authenticate a human identity, prove the truth of rights claims, assess real audiovisual meaning, or grant publication authority.
