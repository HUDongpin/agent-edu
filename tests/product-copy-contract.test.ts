import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const EXPECTED = {
  en: {
    home: "No learner account is required. Progress stays in this browser on this device.",
    next: "Courses in preparation and longer-term topics on the roadmap.",
  },
  es: {
    home: "No necesitas una cuenta de estudiante. El progreso se guarda en este navegador y en este dispositivo.",
    next: "Cursos en preparación y temas a más largo plazo incluidos en la hoja de ruta.",
  },
  fr: {
    home: "Aucun compte apprenant n’est requis. La progression reste enregistrée dans ce navigateur, sur cet appareil.",
    next: "Des cours en préparation et des thèmes à plus long terme inscrits à la feuille de route.",
  },
  de: {
    home: "Ein Lernkonto ist nicht erforderlich. Der Fortschritt bleibt in diesem Browser auf diesem Gerät gespeichert.",
    next: "Kurse in Vorbereitung und längerfristige Themen auf der Roadmap.",
  },
  "zh-Hans": {
    home: "无需学习者账号。进度只保存在这台设备的当前浏览器中。",
    next: "正在筹备的课程，以及列入长期路线图的主题。",
  },
  "zh-Hant": {
    home: "無需學習者帳號。進度只會保存在這台裝置的目前瀏覽器中。",
    next: "正在籌備的課程，以及列入長期路線圖的主題。",
  },
  ja: {
    home: "学習者アカウントは不要です。進捗はこの端末の現在のブラウザ内にだけ保存されます。",
    next: "準備中のコースと、長期ロードマップに掲載されたテーマです。",
  },
  ko: {
    home: "학습자 계정은 필요 없습니다. 진행 기록은 이 기기의 현재 브라우저에만 저장됩니다.",
    next: "준비 중인 강좌와 장기 로드맵에 포함된 주제입니다.",
  },
  ar: {
    home: "لا تحتاج إلى حساب متعلّم. يُحفظ تقدّمك في هذا المتصفح على هذا الجهاز فقط.",
    next: "دورات قيد الإعداد وموضوعات أطول مدى ضمن خارطة الطريق.",
  },
} as const;

test("platform copy does not promise global progress export or hard-code the old release count", () => {
  const forbiddenExport = /export|exportar|exporter|exportier|导出|匯出|書き出|エクスポート|내보내|صدّر|تصدير/iu;
  const oldReleaseCount = /two released courses|dos cursos publicados|deux cours publiés|beiden veröffentlichten Kurse|两门已发布课程|兩門已發布課程|2コース|두 코스|الدورتين المنشورتين/iu;

  for (const [locale, expected] of Object.entries(EXPECTED)) {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    assert.equal(messages["home.method3d"], expected.home, `${locale} home.method3d`);
    assert.doesNotMatch(messages["home.method3d"], forbiddenExport, `${locale} export promise`);
    assert.equal(messages["cat.nextLede"], expected.next, `${locale} cat.nextLede`);
    assert.doesNotMatch(messages["cat.nextLede"], oldReleaseCount, `${locale} old course count`);
  }
});
