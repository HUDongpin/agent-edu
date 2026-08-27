/**
 * Remove HTML comments with index-based scanning.
 *
 * A previous release audit used a nested, backtracking regular expression to
 * allow comments around text nodes.  Next.js export HTML can contain enough
 * adjacent comments and whitespace to make that expression effectively
 * unbounded.  This scanner is linear in the size of the markup.
 */
export function stripHtmlComments(markup) {
  let cursor = 0;
  let result = "";

  while (cursor < markup.length) {
    const commentStart = markup.indexOf("<!--", cursor);
    if (commentStart === -1) {
      result += markup.slice(cursor);
      break;
    }

    result += markup.slice(cursor, commentStart);
    const commentEnd = markup.indexOf("-->", commentStart + 4);
    if (commentEnd === -1) break;
    cursor = commentEnd + 3;
  }

  return result;
}

export function findSerializedEmptyText(markup) {
  const withoutComments = stripHtmlComments(markup);
  return />\s*(undefined|null)\s*</i.exec(withoutComments)?.[1] ?? "";
}
