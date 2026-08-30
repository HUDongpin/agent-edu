import type { Page, Request } from "@playwright/test";

/**
 * Next's production Link runtime probes visible same-origin routes with HEAD,
 * then fetches static-export RSC segment files. These requests are product
 * navigation work, but they are not business/data calls made by an
 * interactive course widget.
 *
 * Keep this classifier deliberately narrow: a request must carry Next's own
 * prefetch headers, or be a same-origin HEAD for an href that is actually in
 * the rendered document. External requests and ordinary same-origin
 * fetch/XHR calls never match.
 */
export function isNextLinkPrefetchRequest(
  request: Request,
  expectedOrigin: string,
  renderedLinkTargets: ReadonlySet<string> = new Set(),
): boolean {
  const target = new URL(request.url());
  if (target.origin !== expectedOrigin) return false;

  const headers = request.headers();
  const isRscSegmentPrefetch = request.resourceType() === "fetch"
    && request.method() === "GET"
    && headers.rsc === "1"
    && headers["next-router-prefetch"] === "1"
    && headers["next-router-segment-prefetch"] !== undefined;
  if (isRscSegmentPrefetch) return true;

  return request.method() === "HEAD"
    && request.resourceType() === "fetch"
    && target.search === ""
    && renderedLinkTargets.has(documentUrl(target));
}

export function documentUrl(value: URL | string): string {
  const url = typeof value === "string" ? new URL(value) : value;
  url.hash = "";
  return url.href;
}

export async function renderedDocumentLinkTargets(page: Page): Promise<Set<string>> {
  return new Set(await page.locator("a[href]").evaluateAll((links) => (
    links.map((link) => {
      const url = new URL((link as HTMLAnchorElement).href);
      url.hash = "";
      return url.href;
    })
  )));
}

export function isExpectedNextPrefetchCancellation(reason: string): boolean {
  return reason === "net::ERR_ABORTED"
    || reason === "NS_BINDING_ABORTED"
    || reason === "Load request cancelled";
}

function isStaticRscDataUrl(url: URL): boolean {
  return url.searchParams.has("_rsc")
    && /(?:^|\/)__next(?:[.$])[^/]*\.txt$/.test(url.pathname);
}

export function isExpectedWebKitRscPrefetchPageError(
  error: Error,
  expectedOrigin: string,
  observedNextPrefetchUrls: ReadonlySet<string>,
): boolean {
  const prefix = "Fetch API cannot load ";
  const suffix = " due to access control checks.";
  if (!error.message.startsWith(prefix) || !error.message.endsWith(suffix)) return false;

  const rawUrl = error.message.slice(prefix.length, -suffix.length);
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return false;
  }

  return target.origin === expectedOrigin
    && isStaticRscDataUrl(target)
    && observedNextPrefetchUrls.has(target.href);
}
