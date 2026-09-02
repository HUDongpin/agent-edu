import type { Metadata } from "next";
import {
  CourseKitModuleRoute,
  courseKitGenerateStaticParams,
  courseKitMetadata,
} from "@/components/course-kit/CourseRoute";
import { EvidenceGateLab } from "@/components/agentic-quant-trading/EvidenceGateLab";
import { AGENTIC_QUANT_TRADING_COURSE } from "@/lib/agentic-quant-trading";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return courseKitGenerateStaticParams(AGENTIC_QUANT_TRADING_COURSE);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  return courseKitMetadata({
    definition: AGENTIC_QUANT_TRADING_COURSE,
    locale,
    moduleSlug: module,
  });
}

export default async function AgenticQuantTradingModulePage({ params }: Props) {
  const { locale, module } = await params;
  return (
    <CourseKitModuleRoute
      definition={AGENTIC_QUANT_TRADING_COURSE}
      locale={locale}
      moduleSlug={module}
      requireStructuredReceipt
      afterModulesHref={`/${locale}/agentic-quant-trading/assessment/`}
      capstoneHref={`/${locale}/agentic-quant-trading/capstone/`}
      supplement={
        module === "backtest-leakage-costs" ? (
          <EvidenceGateLab locale={locale} />
        ) : undefined
      }
    />
  );
}
