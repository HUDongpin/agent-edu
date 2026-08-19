/**
 * Structured data.
 *
 * Only claims that are already true and already on the page: the courses are
 * real, free, self-paced and online, and the people are named on /about/.
 * Nothing here invents a rating, an enrolment count or a schedule — a rich
 * result built on a claim the page cannot back is worse than no rich result.
 *
 * `soon` courses are deliberately excluded: lib/courses.ts shows them greyed
 * out because they do not exist yet, and telling a crawler otherwise would
 * undo the honesty that file is written around.
 */

/** `<` is escaped so a string in the data can never close the script tag. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
