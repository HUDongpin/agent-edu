import { PRODUCT_MANAGEMENT_EN_COPY } from "./copy/en";
import { PRODUCT_MANAGEMENT_COURSE_MANIFEST } from "./manifest";
import { getProductManagementSource } from "./sources";
import {
  PRODUCT_MANAGEMENT_LOCALES,
  PRODUCT_MANAGEMENT_MODULE_SLUGS,
  type MaterializedProductManagementCourse,
  type MaterializedProductManagementModule,
  type ProductManagementCourseCopy,
  type ProductManagementLocale,
  type ProductManagementModuleSlug,
} from "./types";

interface ProductManagementCopyBundle {
  readonly contentLocale: ProductManagementLocale;
  readonly direction: "ltr" | "rtl";
  readonly copy: ProductManagementCourseCopy;
}

/** Add only reviewed, complete translations here. The route shell may be localized sooner. */
export const PRODUCT_MANAGEMENT_COPY_BUNDLES: Partial<
  Record<ProductManagementLocale, ProductManagementCopyBundle>
> = {
  en: {
    contentLocale: "en",
    direction: "ltr",
    copy: PRODUCT_MANAGEMENT_EN_COPY,
  },
};

export const PRODUCT_MANAGEMENT_TRANSLATED_LOCALES = Object.freeze(
  Object.keys(PRODUCT_MANAGEMENT_COPY_BUNDLES) as ProductManagementLocale[],
);

function copyBundleFor(locale: ProductManagementLocale): ProductManagementCopyBundle {
  return PRODUCT_MANAGEMENT_COPY_BUNDLES[locale]
    ?? PRODUCT_MANAGEMENT_COPY_BUNDLES.en!;
}

export function isProductManagementLocale(
  value: string,
): value is ProductManagementLocale {
  return (PRODUCT_MANAGEMENT_LOCALES as readonly string[]).includes(value);
}

export function isProductManagementModuleSlug(
  value: string,
): value is ProductManagementModuleSlug {
  return (PRODUCT_MANAGEMENT_MODULE_SLUGS as readonly string[]).includes(value);
}

function materializeModule(
  slug: ProductManagementModuleSlug,
  copy: ProductManagementCourseCopy,
): MaterializedProductManagementModule {
  const moduleManifest = PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.find(
    (item) => item.slug === slug,
  );
  if (!moduleManifest) {
    throw new Error(`Unknown product-management module: ${slug}`);
  }
  return {
    ...moduleManifest,
    copy: copy.modules[slug],
    sources: moduleManifest.sourceIds.map(getProductManagementSource),
  };
}

export async function loadProductManagementCourse(
  locale: ProductManagementLocale,
): Promise<MaterializedProductManagementCourse> {
  const bundle = copyBundleFor(locale);
  const modules = PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.map((item) =>
    materializeModule(item.slug, bundle.copy)
  );

  return {
    locale,
    contentLocale: bundle.contentLocale,
    contentDirection: bundle.direction,
    manifest: PRODUCT_MANAGEMENT_COURSE_MANIFEST,
    copy: bundle.copy,
    modules,
    phases: PRODUCT_MANAGEMENT_COURSE_MANIFEST.phases.map((phase) => ({
      ...phase,
      copy: bundle.copy.phases[phase.id],
      modules: phase.moduleSlugs.map(
        (slug) => modules.find((item) => item.slug === slug)!,
      ),
    })),
  };
}

export async function getProductManagementModule(
  locale: ProductManagementLocale,
  slug: ProductManagementModuleSlug,
): Promise<MaterializedProductManagementModule> {
  return materializeModule(slug, copyBundleFor(locale).copy);
}
