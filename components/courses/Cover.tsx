import styles from "./Cover.module.css";

/**
 * Course covers, generated rather than drawn.
 *
 * Top-level catalogue courses use an original "warm research notebook" system:
 * quiet editorial surfaces, compact workbench UI and restrained category accents.
 * Module motifs retain the lighter-weight geometric system used by legacy cards.
 * Everything stays inline, theme-aware and resolution-free.
 */
export default function Cover({ id, hue }: { id: string; hue: string }) {
  const motif: Record<string, React.ReactNode> = {
    // A three-stage agent loop inside a calm research workspace.
    agentic: (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="8" cy="132" r="44" fill="var(--course-cover-accent)" opacity=".14" />
        <path
          d="M-7 95 C24 76 40 82 58 67"
          fill="none"
          stroke="var(--course-cover-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".55"
        />

        <rect x="20" y="13" width="151" height="114" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M20 35.5 H171" stroke="var(--course-cover-line)" />
        <circle cx="31" cy="24" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="39" cy="24" r="2.2" fill="var(--course-cover-muted)" opacity=".48" />
        <circle cx="47" cy="24" r="2.2" fill="var(--course-cover-muted)" opacity=".28" />
        <rect x="115" y="20.5" width="43" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="28" y="43" width="30" height="76" rx="8" fill="var(--course-cover-panel)" />
        <rect x="35" y="51" width="16" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".76" />
        <rect x="35" y="62" width="11" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".48" />
        <rect x="35" y="72" width="15" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".36" />
        <rect x="35" y="82" width="12" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".36" />
        <circle cx="43" cy="108" r="7" fill="var(--course-cover-accent)" />
        <path d="M39.5 108 H46.5 M43 104.5 V111.5" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.2" strokeLinecap="round" />

        <rect x="66" y="43" width="94" height="18" rx="6" fill="var(--course-cover-panel)" />
        <circle cx="76" cy="52" r="3.2" fill="var(--course-cover-accent)" />
        <rect x="84" y="48.5" width="30" height="3" rx="1.5" fill="var(--course-cover-ink)" opacity=".72" />
        <rect x="84" y="54" width="48" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".38" />

        <path d="M81 78 H104 M122 78 H145" stroke="var(--course-cover-line)" strokeWidth="1.5"
          strokeLinecap="round" />
        <path d="M141.5 74.5 145 78 141.5 81.5" fill="none" stroke="var(--course-cover-muted)"
          strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="67" y="67" width="23" height="22" rx="6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <rect x="99" y="67" width="23" height="22" rx="6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <rect x="131" y="67" width="23" height="22" rx="6" fill="var(--course-cover-accent)" />
        <circle cx="78.5" cy="78" r="3.5" fill="none" stroke="var(--course-cover-ink)" strokeWidth="1.3" />
        <path d="M107 78 110 81 115 74.5" fill="none" stroke="var(--course-cover-ink)"
          strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M138 78 H147 M144 75 147 78 144 81" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="66" y="98" width="94" height="20" rx="8" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <rect x="75" y="106.5" width="48" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="149" cy="108" r="6" fill="var(--course-cover-ink)" />
        <path d="M146 108 H152 M150 106 152 108 150 110" fill="none" stroke="var(--course-cover-surface)"
          strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // A split editor-and-tool workbench for inspect, change and verify.
    codex: (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="181" cy="18" r="39" fill="var(--course-cover-accent)" opacity=".82" />
        <path d="M151 0 C155 23 166 37 190 42" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.2" opacity=".6" />

        <rect x="17" y="14" width="155" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M17 36 H172" stroke="var(--course-cover-line)" />
        <circle cx="28" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="36" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".48" />
        <circle cx="44" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".28" />
        <rect x="124" y="21.5" width="35" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="25" y="43" width="31" height="76" rx="8" fill="var(--course-cover-panel)" />
        <rect x="32" y="51" width="17" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".76" />
        <rect x="32" y="64" width="12" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".44" />
        <rect x="32" y="74" width="17" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".34" />
        <rect x="32" y="84" width="14" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".34" />
        <rect x="32" y="104" width="17" height="7" rx="3.5" fill="var(--course-cover-accent)" />

        <rect x="64" y="43" width="99" height="55" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <path d="M64 55 H163" stroke="var(--course-cover-line)" />
        <rect x="72" y="48" width="20" height="3" rx="1.5" fill="var(--course-cover-ink)" opacity=".7" />
        <circle cx="153" cy="49.5" r="2" fill="var(--course-cover-accent)" />
        <path d="M75 64 H91 M96 64 H132" stroke="var(--course-cover-muted)" strokeWidth="2.4"
          strokeLinecap="round" opacity=".56" />
        <path d="M75 72 H84 M89 72 H145" stroke="var(--course-cover-muted)" strokeWidth="2.4"
          strokeLinecap="round" opacity=".4" />
        <path d="M75 80 H103 M108 80 H137" stroke="var(--course-cover-muted)" strokeWidth="2.4"
          strokeLinecap="round" opacity=".48" />
        <rect x="72" y="87" width="83" height="5" rx="2.5" fill="var(--course-cover-panel)" />
        <rect x="72" y="87" width="58" height="5" rx="2.5" fill="var(--course-cover-accent)" opacity=".82" />

        <rect x="64" y="105" width="99" height="14" rx="7" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <circle cx="74" cy="112" r="3" fill="var(--course-cover-accent)" />
        <rect x="81" y="110.5" width="46" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".46" />
        <path d="M148 112 151 115 157 108.5" fill="none" stroke="var(--course-cover-ink)"
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // A grounded conversation becomes a reviewable brief with an evidence trail.
    claude: (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="181" cy="126" r="42" fill="var(--course-cover-accent)" opacity=".13" />
        <path d="M147 140 C154 118 169 105 190 101" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="1.5" opacity=".55" />

        <rect x="18" y="13" width="154" height="114" rx="13"
          fill="var(--course-cover-surface)" stroke="var(--course-cover-line)" />
        <path d="M18 35.5 H172" stroke="var(--course-cover-line)" />
        <circle cx="29" cy="24" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="37" cy="24" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="45" cy="24" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />
        <rect x="122" y="21" width="37" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="26" y="43" width="88" height="76" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <circle cx="37" cy="55" r="4" fill="var(--course-cover-accent)" />
        <rect x="46" y="50" width="57" height="11" rx="5.5" fill="var(--course-cover-panel)" />
        <path d="M51 55.5 H91" stroke="var(--course-cover-muted)" strokeWidth="2.2"
          strokeLinecap="round" opacity=".5" />

        <rect x="36" y="68" width="68" height="23" rx="7" fill="var(--course-cover-accent)" opacity=".14" />
        <path d="M43 75 H69 M74 75 H95 M43 82 H58 M63 82 H88"
          stroke="var(--course-cover-accent)" strokeWidth="2.3" strokeLinecap="round" opacity=".82" />
        <circle cx="106" cy="79.5" r="4" fill="var(--course-cover-ink)" />

        <rect x="34" y="99" width="72" height="12" rx="6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M42 105 H79" stroke="var(--course-cover-muted)" strokeWidth="2.1"
          strokeLinecap="round" opacity=".42" />
        <circle cx="98" cy="105" r="4" fill="var(--course-cover-accent)" />
        <path d="M96.2 105 H99.8 M98.6 103.6 100 105 98.6 106.4" fill="none"
          stroke="var(--course-cover-accent-ink)" strokeWidth=".9" strokeLinecap="round"
          strokeLinejoin="round" />

        <rect x="122" y="43" width="41" height="76" rx="8" fill="var(--course-cover-panel)" />
        <rect x="130" y="51" width="24" height="3.5" rx="1.75"
          fill="var(--course-cover-ink)" opacity=".7" />
        <path d="M131 65 134 68 139 62.5 M131 80 134 83 139 77.5 M131 95 134 98 139 92.5"
          fill="none" stroke="var(--course-cover-accent)" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d="M144 65.5 H155 M144 80.5 H155 M144 95.5 H155"
          stroke="var(--course-cover-muted)" strokeWidth="2.2" strokeLinecap="round" opacity=".45" />
        <rect x="130" y="106" width="25" height="6" rx="3" fill="var(--course-cover-accent)" />
      </>
    ),
    // A host negotiates one explicit client boundary with each capability server.
    mcp: (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="178" cy="16" r="42" fill="var(--course-cover-accent)" opacity=".17" />
        <rect x="17" y="14" width="156" height="112" rx="13" fill="var(--course-cover-surface)" stroke="var(--course-cover-line)" />
        <path d="M17 36 H173" stroke="var(--course-cover-line)" />
        <circle cx="29" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="37" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".45" />
        <circle cx="45" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".25" />
        <rect x="124" y="21.5" width="36" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="27" y="51" width="48" height="55" rx="9" fill="var(--course-cover-editor)" stroke="var(--course-cover-line)" />
        <rect x="35" y="60" width="22" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".74" />
        <path d="M36 74 H66 M36 82 H60 M36 90 H64" stroke="var(--course-cover-muted)" strokeWidth="2.2" strokeLinecap="round" opacity=".42" />
        <rect x="35" y="96" width="31" height="5" rx="2.5" fill="var(--course-cover-accent)" opacity=".75" />

        <path d="M77 78 H95" stroke="var(--course-cover-accent)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="87" cy="78" r="9" fill="var(--course-cover-surface)" stroke="var(--course-cover-accent)" />
        <path d="M83 78 H91 M87 74 V82" stroke="var(--course-cover-accent)" strokeWidth="1.3" strokeLinecap="round" />

        <rect x="99" y="45" width="63" height="67" rx="9" fill="var(--course-cover-editor)" stroke="var(--course-cover-line)" />
        <rect x="108" y="54" width="23" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".72" />
        <rect x="108" y="66" width="45" height="10" rx="5" fill="var(--course-cover-panel)" />
        <circle cx="115" cy="71" r="2.5" fill="var(--course-cover-accent)" />
        <path d="M122 71 H145" stroke="var(--course-cover-muted)" strokeWidth="2" strokeLinecap="round" opacity=".44" />
        <rect x="108" y="80" width="45" height="10" rx="5" fill="var(--course-cover-panel)" />
        <path d="M114 85 H146" stroke="var(--course-cover-muted)" strokeWidth="2" strokeLinecap="round" opacity=".38" />
        <rect x="108" y="94" width="45" height="10" rx="5" fill="var(--course-cover-accent)" opacity=".15" />
        <path d="M114 99 117 102 122 96" fill="none" stroke="var(--course-cover-accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M128 99 H146" stroke="var(--course-cover-accent)" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      </>
    ),
    // One manager fans out bounded work, joins evidence, then crosses a release gate.
    "agent-orchestration": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="176" cy="18" r="41" fill="var(--course-cover-accent)" opacity=".14" />
        <rect x="17" y="14" width="156" height="112" rx="13" fill="var(--course-cover-surface)" stroke="var(--course-cover-line)" />
        <path d="M17 36 H173" stroke="var(--course-cover-line)" />
        <circle cx="29" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="37" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".45" />
        <circle cx="45" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".25" />
        <rect x="123" y="21.5" width="37" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="27" y="66" width="30" height="27" rx="7" fill="var(--course-cover-accent)" />
        <path d="M35 79.5 H49 M45.5 76 49 79.5 45.5 83" fill="none" stroke="var(--course-cover-accent-ink)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M58 79.5 H73 M86 66 V55 H103 M86 93 V104 H103" fill="none" stroke="var(--course-cover-accent)" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="73" y="67" width="26" height="25" rx="7" fill="var(--course-cover-editor)" stroke="var(--course-cover-accent)" />
        <circle cx="86" cy="79.5" r="4.5" fill="var(--course-cover-accent)" />

        <rect x="104" y="44" width="27" height="22" rx="6" fill="var(--course-cover-panel)" stroke="var(--course-cover-line)" />
        <rect x="104" y="68" width="27" height="22" rx="6" fill="var(--course-cover-panel)" stroke="var(--course-cover-line)" />
        <rect x="104" y="92" width="27" height="22" rx="6" fill="var(--course-cover-panel)" stroke="var(--course-cover-line)" />
        <circle cx="117.5" cy="55" r="3" fill="var(--course-cover-accent)" />
        <circle cx="117.5" cy="79" r="3" fill="var(--course-cover-accent)" opacity=".72" />
        <circle cx="117.5" cy="103" r="3" fill="var(--course-cover-accent)" opacity=".48" />

        <path d="M132 55 H141 V79 H151 M132 79 H151 M132 103 H141 V79" fill="none" stroke="var(--course-cover-muted)" strokeWidth="1.4" strokeLinecap="round" />
        <rect x="149" y="67" width="14" height="25" rx="5" fill="var(--course-cover-surface)" stroke="var(--course-cover-accent)" />
        <path d="M153 79 155.5 81.5 160 76" fill="none" stroke="var(--course-cover-accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M26 112 H164" stroke="var(--course-cover-line)" />
        <rect x="27" y="116" width="77" height="4" rx="2" fill="var(--course-cover-panel)" />
        <rect x="27" y="116" width="54" height="4" rx="2" fill="var(--course-cover-accent)" opacity=".8" />
        <circle cx="156" cy="118" r="5" fill="var(--course-cover-accent)" />
      </>
    ),
    // One parameter synchronizes a unit circle, projection, sine plot, and review pipeline.
    "math-animation": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="181" cy="15" r="42" fill="var(--course-cover-accent)" opacity=".13" />
        <path d="M0 119 C25 108 42 116 59 140" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="1.4" opacity=".46" />

        <rect x="17" y="13" width="156" height="114" rx="13"
          fill="var(--course-cover-surface)" stroke="var(--course-cover-line)" />
        <path d="M17 35 H173" stroke="var(--course-cover-line)" />
        <circle cx="28" cy="24" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="36" cy="24" r="2.2" fill="var(--course-cover-muted)" opacity=".45" />
        <circle cx="44" cy="24" r="2.2" fill="var(--course-cover-muted)" opacity=".25" />
        <rect x="122" y="21" width="38" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="26" y="43" width="138" height="53" rx="8"
          fill="var(--course-cover-editor)" stroke="var(--course-cover-line)" />
        <path d="M32 56 H158 M32 69 H158 M32 82 H158 M45 49 V90 M58 49 V90 M71 49 V90 M84 49 V90 M97 49 V90 M110 49 V90 M123 49 V90 M136 49 V90 M149 49 V90"
          stroke="var(--course-cover-line)" strokeWidth=".55" opacity=".34" />

        <circle cx="56" cy="70" r="18" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-muted)" strokeWidth="1.2" />
        <path d="M35 70 H77 M56 49 V91" stroke="var(--course-cover-line)" strokeWidth=".9" />
        <path d="M56 70 L68.7 57.3" stroke="var(--course-cover-accent)" strokeWidth="1.8"
          strokeLinecap="round" />
        <path d="M68.7 57.3 V70" stroke="var(--course-cover-accent)" strokeWidth="1"
          strokeDasharray="2.5 2.5" />
        <circle cx="68.7" cy="57.3" r="3.5" fill="var(--course-cover-accent)" />

        <path d="M87 70 H157" stroke="var(--course-cover-line)" strokeWidth="1" />
        <path d="M87 70 C96 52 105 52 114 70 S132 88 141 70 S150 52 159 70"
          fill="none" stroke="var(--course-cover-accent)" strokeWidth="1.8"
          strokeLinecap="round" />
        <path d="M68.7 57.3 H100.5" stroke="var(--course-cover-accent)" strokeWidth="1"
          strokeDasharray="3 3" opacity=".72" />
        <circle cx="100.5" cy="57.3" r="3.2" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="1.6" />

        <path d="M34 109 H155" stroke="var(--course-cover-line)" strokeWidth="1.4"
          strokeLinecap="round" />
        <path d="M53 109 H68 M87 109 H102 M121 109 H136" stroke="var(--course-cover-accent)"
          strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="42" cy="109" r="7" fill="var(--course-cover-panel)"
          stroke="var(--course-cover-line)" />
        <circle cx="76" cy="109" r="7" fill="var(--course-cover-panel)"
          stroke="var(--course-cover-line)" />
        <circle cx="110" cy="109" r="7" fill="var(--course-cover-panel)"
          stroke="var(--course-cover-line)" />
        <circle cx="144" cy="109" r="7" fill="var(--course-cover-accent)" />
        <path d="M140.5 109 143 111.5 148 106" fill="none"
          stroke="var(--course-cover-accent-ink)" strokeWidth="1.3"
          strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // Evidence moves from a scoped brief through verification to a defensible offer.
    "make-money-with-codex": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="178" cy="128" r="42" fill="var(--course-cover-accent)" opacity=".2" />
        <path d="M151 140 C159 119 174 108 190 107" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="1.4" opacity=".68" />

        <rect x="18" y="14" width="154" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M18 36 H172" stroke="var(--course-cover-line)" />
        <circle cx="29" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="37" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".48" />
        <circle cx="45" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".28" />
        <rect x="119" y="22" width="40" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="27" y="44" width="54" height="68" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <rect x="35" y="52" width="23" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".75" />
        <rect x="35" y="64" width="38" height="10" rx="4" fill="var(--course-cover-panel)" />
        <circle cx="41" cy="69" r="2.3" fill="var(--course-cover-accent)" />
        <path d="M47 69 H65" stroke="var(--course-cover-muted)" strokeWidth="2.2"
          strokeLinecap="round" opacity=".46" />
        <rect x="35" y="79" width="38" height="10" rx="4" fill="var(--course-cover-panel)" />
        <path d="M40 84 H67" stroke="var(--course-cover-muted)" strokeWidth="2.2"
          strokeLinecap="round" opacity=".38" />
        <rect x="35" y="94" width="38" height="10" rx="4" fill="var(--course-cover-accent)" opacity=".16" />
        <path d="M40 99 43 102 48 96" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M53 99 H67" stroke="var(--course-cover-accent)" strokeWidth="2.2"
          strokeLinecap="round" opacity=".78" />

        <path d="M85 78 H101" stroke="var(--course-cover-accent)" strokeWidth="2"
          strokeLinecap="round" />
        <path d="M97 74 101 78 97 82" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="105" y="44" width="57" height="68" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <rect x="113" y="52" width="24" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".72" />
        <path d="M115 91 125 82 135 85 151 65" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="115" cy="91" r="2.6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" />
        <circle cx="125" cy="82" r="2.6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" />
        <circle cx="135" cy="85" r="2.6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" />
        <circle cx="151" cy="65" r="3.2" fill="var(--course-cover-accent)" />
        <rect x="113" y="99" width="41" height="7" rx="3.5" fill="var(--course-cover-panel)" />
        <rect x="113" y="99" width="31" height="7" rx="3.5" fill="var(--course-cover-accent)" opacity=".8" />
      </>
    ),
    // A buyer brief passes through evidence gates before it becomes an accepted delivery.
    "claude-income": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="14" cy="16" r="37" fill="var(--course-cover-accent)" opacity=".16" />
        <path d="M0 42 C20 35 31 22 37 0" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="1.4" opacity=".58" />

        <rect x="18" y="14" width="154" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M18 36 H172" stroke="var(--course-cover-line)" />
        <circle cx="29" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="37" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".48" />
        <circle cx="45" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".28" />
        <rect x="120" y="22" width="39" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="27" y="45" width="43" height="62" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <circle cx="39" cy="58" r="5" fill="var(--course-cover-accent)" />
        <path d="M48 56 H62 M48 61 H58" stroke="var(--course-cover-ink)" strokeWidth="2.2"
          strokeLinecap="round" opacity=".65" />
        <path d="M35 73 H62 M35 81 H57 M35 89 H61" stroke="var(--course-cover-muted)"
          strokeWidth="2.2" strokeLinecap="round" opacity=".4" />
        <rect x="34" y="97" width="28" height="4" rx="2" fill="var(--course-cover-panel)" />

        <path d="M73 76 H83" stroke="var(--course-cover-accent)" strokeWidth="1.8"
          strokeLinecap="round" />
        <path d="M79 72 83 76 79 80" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="86" y="45" width="25" height="62" rx="8" fill="var(--course-cover-panel)"
          stroke="var(--course-cover-line)" />
        <circle cx="98.5" cy="60" r="6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" />
        <path d="M95.5 60 98 62.5 102 57.5" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M98.5 69 V82" stroke="var(--course-cover-line)" strokeWidth="1.6" />
        <circle cx="98.5" cy="91" r="6" fill="var(--course-cover-accent)" />
        <path d="M95.5 91 98 93.5 102 88.5" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M114 76 H124" stroke="var(--course-cover-accent)" strokeWidth="1.8"
          strokeLinecap="round" />
        <path d="M120 72 124 76 120 80" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="127" y="45" width="35" height="62" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <path d="M136 58 H153 M136 66 H151 M136 74 H154" stroke="var(--course-cover-muted)"
          strokeWidth="2.2" strokeLinecap="round" opacity=".42" />
        <rect x="135" y="84" width="19" height="14" rx="7" fill="var(--course-cover-accent)" />
        <path d="M140 91 143 94 149 87" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M38 116 H152" stroke="var(--course-cover-line)" strokeWidth="1.2" />
        <circle cx="70" cy="116" r="2.5" fill="var(--course-cover-accent)" />
        <circle cx="111" cy="116" r="2.5" fill="var(--course-cover-accent)" />
      </>
    ),
    // A vague request becomes a structured prompt, then a checked response.
    prompts: (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="178" cy="127" r="43" fill="var(--course-cover-accent)" opacity=".13" />
        <path d="M148 139 C158 119 174 108 190 107" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="1.5" opacity=".5" />

        <rect x="19" y="14" width="152" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M19 36 H171" stroke="var(--course-cover-line)" />
        <circle cx="30" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="38" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="46" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />
        <rect x="119" y="22" width="39" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="28" y="44" width="83" height="70" rx="9" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <rect x="36" y="51" width="28" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".72" />

        <rect x="36" y="62" width="67" height="12" rx="4" fill="var(--course-cover-panel)" />
        <circle cx="43" cy="68" r="2.5" fill="var(--course-cover-accent)" />
        <path d="M49 68 H72 M77 68 H96" stroke="var(--course-cover-muted)" strokeWidth="2.1"
          strokeLinecap="round" opacity=".46" />

        <rect x="36" y="78" width="67" height="12" rx="4" fill="var(--course-cover-panel)" />
        <circle cx="43" cy="84" r="2.5" fill="var(--course-cover-accent)" opacity=".76" />
        <path d="M49 84 H62 M67 84 H96" stroke="var(--course-cover-muted)" strokeWidth="2.1"
          strokeLinecap="round" opacity=".4" />

        <rect x="36" y="94" width="67" height="12" rx="4" fill="var(--course-cover-accent)" opacity=".16" />
        <circle cx="43" cy="100" r="2.5" fill="var(--course-cover-accent)" />
        <path d="M49 100 H78 M83 100 H96" stroke="var(--course-cover-accent)" strokeWidth="2.1"
          strokeLinecap="round" opacity=".76" />

        <path d="M112 79 H123" stroke="var(--course-cover-accent)" strokeWidth="2"
          strokeLinecap="round" />
        <path d="M119 75 123 79 119 83" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="126" y="44" width="36" height="70" rx="9" fill="var(--course-cover-panel)"
          stroke="var(--course-cover-line)" />
        <circle cx="144" cy="57" r="6" fill="var(--course-cover-accent)" />
        <path d="M141 57 143.5 59.5 148 54.5" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M134 71 H154 M134 79 H151 M134 87 H156 M134 95 H148" stroke="var(--course-cover-muted)"
          strokeWidth="2.3" strokeLinecap="round" opacity=".42" />
        <rect x="134" y="103" width="20" height="4" rx="2" fill="var(--course-cover-accent)" opacity=".7" />
      </>
    ),
    // A repository history turns one proposal into an accepted release.
    github: (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="177" cy="16" r="38" fill="var(--course-cover-accent)" opacity=".13" />
        <path d="M148 0 C155 22 168 35 190 39" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="1.5" opacity=".52" />

        <rect x="19" y="14" width="152" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M19 36 H171" stroke="var(--course-cover-line)" />
        <circle cx="30" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="38" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="46" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />
        <rect x="119" y="22" width="39" height="6" rx="3" fill="var(--course-cover-panel)" />

        <path d="M40 53 V103" stroke="var(--course-cover-line)" strokeWidth="2" />
        <path d="M40 66 C40 76 55 76 62 76 H75" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 92 C40 84 56 84 63 84 H75" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="53" r="5" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="2" />
        <circle cx="40" cy="103" r="5" fill="var(--course-cover-accent)" />
        <circle cx="76" cy="80" r="6" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="2" />

        <rect x="91" y="47" width="62" height="58" rx="9" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <rect x="100" y="56" width="25" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".7" />
        <rect x="100" y="68" width="43" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".4" />
        <rect x="100" y="77" width="34" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".34" />
        <rect x="100" y="88" width="43" height="9" rx="4.5" fill="var(--course-cover-accent)" opacity=".16" />
        <path d="M108 92.5 112 96.5 119 88.5" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="124" y="91" width="12" height="3" rx="1.5" fill="var(--course-cover-accent)" opacity=".78" />
      </>
    ),
    // A controlled delivery loop surrounds an inspectable change and its release gate.
    "software-engineering": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="171" cy="16" r="40" fill="var(--course-cover-accent)" opacity=".13" />
        <path d="M149 0 C154 19 168 34 190 38" fill="none"
          stroke="var(--course-cover-accent)" strokeWidth="1.5" opacity=".5" />

        <rect x="18" y="14" width="154" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M18 36 H172" stroke="var(--course-cover-line)" />
        <circle cx="29" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="37" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="45" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />
        <rect x="119" y="22" width="39" height="6" rx="3" fill="var(--course-cover-panel)" />

        <path d="M43 77 C43 55 61 44 82 44 M108 44 C130 44 147 57 147 77
          M147 87 C147 108 129 118 108 118 M82 118 C60 118 43 105 43 85"
          fill="none" stroke="var(--course-cover-accent)" strokeWidth="2" strokeLinecap="round" />
        <path d="M78 40 84 44 78 48 M151 73 147 79 143 73
          M112 122 106 118 112 114 M39 89 43 83 47 89"
          fill="none" stroke="var(--course-cover-accent)" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round" />

        <circle cx="43" cy="81" r="5" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="2" />
        <circle cx="95" cy="44" r="5" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="2" />
        <circle cx="147" cy="81" r="5" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="2" />
        <circle cx="95" cy="118" r="5" fill="var(--course-cover-accent)" />

        <rect x="63" y="59" width="64" height="43" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <path d="M63 71 H127" stroke="var(--course-cover-line)" />
        <rect x="71" y="65" width="18" height="2.8" rx="1.4" fill="var(--course-cover-ink)" opacity=".72" />
        <path d="M72 79 H88 M93 79 H116 M72 86 H82 M87 86 H111"
          stroke="var(--course-cover-muted)" strokeWidth="2.3" strokeLinecap="round" opacity=".48" />
        <rect x="72" y="92" width="46" height="4" rx="2" fill="var(--course-cover-panel)" />
        <rect x="72" y="92" width="35" height="4" rx="2" fill="var(--course-cover-accent)" opacity=".82" />
        <path d="M112 91.5 115 94.5 121 88" fill="none" stroke="var(--course-cover-ink)"
          strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // An inline-edit canvas: source, selection and a precise insertion point.
    cursor: (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <path d="M0 16 H54 C69 16 79 7 87 0" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.4" opacity=".52" />
        <circle cx="12" cy="14" r="27" fill="var(--course-cover-accent)" opacity=".12" />

        <rect x="20" y="14" width="151" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M20 36 H171" stroke="var(--course-cover-line)" />
        <circle cx="31" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="39" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="47" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />
        <rect x="120" y="22" width="38" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="28" y="43" width="31" height="76" rx="8" fill="var(--course-cover-panel)" />
        <rect x="35" y="51" width="16" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".74" />
        <rect x="35" y="63" width="11" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".4" />
        <rect x="35" y="73" width="15" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".32" />
        <rect x="35" y="83" width="12" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".32" />
        <rect x="35" y="103" width="17" height="8" rx="4" fill="var(--course-cover-accent)" />

        <rect x="67" y="44" width="94" height="74" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <rect x="75" y="52" width="26" height="3" rx="1.5" fill="var(--course-cover-ink)" opacity=".7" />
        <path d="M75 64 H90 M96 64 H144" stroke="var(--course-cover-muted)" strokeWidth="2.5"
          strokeLinecap="round" opacity=".46" />
        <path d="M75 73 H105 M111 73 H151" stroke="var(--course-cover-muted)" strokeWidth="2.5"
          strokeLinecap="round" opacity=".38" />
        <rect x="72" y="80" width="83" height="18" rx="5" fill="var(--course-cover-accent)" opacity=".15" />
        <path d="M77 86 H96 M102 86 H142 M77 93 H115" stroke="var(--course-cover-accent)"
          strokeWidth="2.5" strokeLinecap="round" opacity=".82" />
        <path d="M120 78 V100" stroke="var(--course-cover-accent)" strokeWidth="1.6" />
        <circle cx="120" cy="78" r="2.2" fill="var(--course-cover-accent)" />
        <path d="M75 108 H102 M108 108 H134" stroke="var(--course-cover-muted)" strokeWidth="2.5"
          strokeLinecap="round" opacity=".38" />
        <circle cx="151" cy="108" r="5.5" fill="var(--course-cover-ink)" />
        <path d="M148.5 108 H153.5 M151.5 106 153.5 108 151.5 110" fill="none"
          stroke="var(--course-cover-surface)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // Source fragments converge on a claim, then leave with a citation trail.
    "ai-research": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="175" cy="128" r="43" fill="var(--course-cover-accent)" opacity=".13" />
        <path d="M146 137 C157 118 170 108 190 105" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.4" opacity=".55" />

        <rect x="19" y="15" width="152" height="112" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M19 37 H171" stroke="var(--course-cover-line)" />
        <circle cx="30" cy="26" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="38" cy="26" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="46" cy="26" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />
        <rect x="113" y="23" width="45" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="28" y="46" width="43" height="29" rx="7" fill="var(--course-cover-panel)" />
        <rect x="35" y="53" width="22" height="3" rx="1.5" fill="var(--course-cover-ink)" opacity=".7" />
        <rect x="35" y="61" width="29" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".38" />
        <rect x="35" y="67" width="18" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".3" />
        <rect x="28" y="84" width="43" height="29" rx="7" fill="var(--course-cover-panel)" />
        <rect x="35" y="91" width="27" height="3" rx="1.5" fill="var(--course-cover-ink)" opacity=".64" />
        <rect x="35" y="99" width="21" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".36" />
        <rect x="35" y="105" width="29" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".28" />

        <path d="M72 60 C84 60 87 66 94 72 M72 98 C84 98 87 91 94 84" fill="none"
          stroke="var(--course-cover-line)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="104" cy="78" r="15" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="2" />
        <circle cx="104" cy="78" r="5" fill="var(--course-cover-accent)" opacity=".85" />
        <path d="M115 89 124 98" stroke="var(--course-cover-accent)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M121 78 H142" stroke="var(--course-cover-line)" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="130" y="51" width="31" height="55" rx="8" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <circle cx="139" cy="62" r="3.5" fill="var(--course-cover-accent)" />
        <rect x="146" y="60.5" width="9" height="3" rx="1.5" fill="var(--course-cover-ink)" opacity=".66" />
        <rect x="137" y="74" width="17" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".42" />
        <rect x="137" y="82" width="14" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".34" />
        <rect x="137" y="90" width="18" height="2.5" rx="1.25" fill="var(--course-cover-muted)" opacity=".34" />
        <path d="M137 99 H154" stroke="var(--course-cover-accent)" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    // A lesson board turns a prompt into guided practice and visible feedback.
    "ai-teaching": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <path d="M0 118 C28 109 40 118 63 140" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.5" opacity=".52" />
        <circle cx="9" cy="137" r="40" fill="var(--course-cover-accent)" opacity=".12" />

        <rect x="20" y="14" width="151" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M20 36 H171" stroke="var(--course-cover-line)" />
        <circle cx="31" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="39" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="47" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />

        <rect x="29" y="44" width="132" height="42" rx="9" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <rect x="37" y="52" width="34" height="4" rx="2" fill="var(--course-cover-ink)" opacity=".72" />
        <rect x="37" y="63" width="25" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".42" />
        <rect x="37" y="71" width="42" height="3" rx="1.5" fill="var(--course-cover-muted)" opacity=".32" />
        <path d="M95 74 111 58 123 68 147 50" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="111" cy="58" r="3" fill="var(--course-cover-surface)" stroke="var(--course-cover-accent)" />
        <circle cx="123" cy="68" r="3" fill="var(--course-cover-surface)" stroke="var(--course-cover-accent)" />
        <circle cx="147" cy="50" r="3.6" fill="var(--course-cover-accent)" />

        <rect x="29" y="95" width="39" height="23" rx="7" fill="var(--course-cover-panel)" />
        <rect x="76" y="95" width="39" height="23" rx="7" fill="var(--course-cover-panel)" />
        <rect x="123" y="95" width="38" height="23" rx="7" fill="var(--course-cover-accent)" />
        <circle cx="39" cy="106.5" r="4" fill="none" stroke="var(--course-cover-ink)" strokeWidth="1.3" />
        <path d="M47 106.5 H60" stroke="var(--course-cover-muted)" strokeWidth="2.4" strokeLinecap="round" opacity=".48" />
        <path d="M85 106.5 H106" stroke="var(--course-cover-muted)" strokeWidth="2.4" strokeLinecap="round" opacity=".48" />
        <path d="M134 106.5 139 111 150 100" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // A visible gate separates a reviewed path from an unsafe branch.
    "responsible-ai": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="179" cy="129" r="44" fill="var(--course-cover-accent)" opacity=".12" />
        <path d="M151 140 C160 119 176 108 190 107" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.5" opacity=".52" />

        <rect x="20" y="14" width="151" height="113" rx="13" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-line)" />
        <path d="M20 36 H171" stroke="var(--course-cover-line)" />
        <circle cx="31" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="39" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="47" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />
        <rect x="117" y="22" width="41" height="6" rx="3" fill="var(--course-cover-panel)" />

        <rect x="29" y="44" width="132" height="74" rx="10" fill="var(--course-cover-editor)"
          stroke="var(--course-cover-line)" />
        <path d="M38 81 H76" stroke="var(--course-cover-muted)" strokeWidth="3" strokeLinecap="round" opacity=".5" />
        <circle cx="45" cy="81" r="7" fill="var(--course-cover-panel)" stroke="var(--course-cover-line)" />
        <path d="M52 81 H76" stroke="var(--course-cover-accent)" strokeWidth="2" strokeLinecap="round" />

        <rect x="77" y="55" width="28" height="52" rx="9" fill="var(--course-cover-surface)"
          stroke="var(--course-cover-accent)" strokeWidth="1.8" />
        <path d="M85 68 H97 M85 75 H97" stroke="var(--course-cover-muted)" strokeWidth="2.2"
          strokeLinecap="round" opacity=".48" />
        <circle cx="91" cy="92" r="6" fill="var(--course-cover-accent)" />
        <path d="M88 92 90.5 94.5 95 89" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M105 81 H119 C129 81 132 69 140 61" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="2" strokeLinecap="round" />
        <path d="M105 86 H120 C130 86 132 99 140 106" fill="none" stroke="var(--course-cover-line)"
          strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3.5 4" />
        <circle cx="145" cy="57" r="9" fill="var(--course-cover-accent)" />
        <path d="M140.5 57 144 60.5 150 53.5" fill="none" stroke="var(--course-cover-accent-ink)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="145" cy="109" r="8" fill="var(--course-cover-panel)" stroke="var(--course-cover-line)" />
        <path d="M141.5 105.5 148.5 112.5 M148.5 105.5 141.5 112.5" stroke="var(--course-cover-muted)"
          strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
    // A bounded agent desk reads a synthetic tape, proposes a paper order, and
    // can proceed only after the deterministic risk gate accepts the receipt.
    "agentic-quant-trading": (
      <>
        <rect width="190" height="140" fill="var(--course-cover-bg)" />
        <circle cx="178" cy="18" r="42" fill="var(--course-cover-accent)" opacity=".13" />
        <rect x="18" y="14" width="154" height="113" rx="13"
          fill="var(--course-cover-surface)" stroke="var(--course-cover-line)" />
        <path d="M18 36 H172" stroke="var(--course-cover-line)" />
        <circle cx="29" cy="25" r="2.2" fill="var(--course-cover-accent)" />
        <circle cx="37" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".46" />
        <circle cx="45" cy="25" r="2.2" fill="var(--course-cover-muted)" opacity=".26" />

        <rect x="27" y="45" width="73" height="66" rx="8"
          fill="var(--course-cover-editor)" stroke="var(--course-cover-line)" />
        <path d="M36 96 H91" stroke="var(--course-cover-line)" />
        <path d="M42 61 V78 M38 66 H46 M55 53 V71 M51 58 H59 M68 68 V91 M64 74 H72 M82 57 V81 M78 62 H86"
          fill="none" stroke="var(--course-cover-accent)" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="38" y="99" width="23" height="4" rx="2" fill="var(--course-cover-muted)" opacity=".42" />
        <rect x="67" y="99" width="22" height="4" rx="2" fill="var(--course-cover-accent)" opacity=".78" />

        <path d="M101 77 H113" stroke="var(--course-cover-accent)" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M109 73 113 77 109 81" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="115" y="46" width="47" height="65" rx="9"
          fill="var(--course-cover-panel)" stroke="var(--course-cover-line)" />
        <circle cx="127" cy="59" r="5" fill="var(--course-cover-accent)" />
        <path d="M136 57.5 H153 M136 62.5 H148" stroke="var(--course-cover-muted)"
          strokeWidth="2.2" strokeLinecap="round" opacity=".48" />
        <rect x="123" y="72" width="31" height="16" rx="6"
          fill="var(--course-cover-surface)" stroke="var(--course-cover-accent)" />
        <path d="M129 80 133 84 140 76" fill="none" stroke="var(--course-cover-accent)"
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M145 80 H150" stroke="var(--course-cover-muted)" strokeWidth="2" strokeLinecap="round" />
        <rect x="123" y="95" width="31" height="7" rx="3.5" fill="var(--course-cover-accent)" />
        <path d="M130 98.5 H147" stroke="var(--course-cover-accent-ink)" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
    // steps descending — "a list of steps"
    handbook: (
      <>
        <rect x="24" y="96" width="46" height="14" rx="4" fill="currentColor" opacity=".28" />
        <rect x="24" y="74" width="76" height="14" rx="4" fill="currentColor" opacity=".46" />
        <rect x="24" y="52" width="106" height="14" rx="4" fill="currentColor" opacity=".66" />
        <rect x="24" y="30" width="136" height="14" rx="4" fill="currentColor" />
      </>
    ),
    // a rising bar chart — "watch the number move"
    lab: (
      <>
        <rect x="26" y="80" width="22" height="30" rx="4" fill="currentColor" opacity=".3" />
        <rect x="56" y="62" width="22" height="48" rx="4" fill="currentColor" opacity=".5" />
        <rect x="86" y="44" width="22" height="66" rx="4" fill="currentColor" opacity=".72" />
        <rect x="116" y="26" width="22" height="84" rx="4" fill="currentColor" />
        <path d="M28 74 L67 56 L97 38 L127 22" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" opacity=".55" strokeDasharray="5 5" />
      </>
    ),
    // a loop with a node — the agent loop
    build: (
      <>
        <path d="M50 40 h60 a26 26 0 0 1 0 52 h-60 a26 26 0 0 1 0-52 z"
          fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        <circle cx="50" cy="66" r="11" fill="currentColor" />
        <circle cx="110" cy="66" r="7" fill="currentColor" opacity=".5" />
      </>
    ),
    // interlocking blocks — tools
    tools: (
      <>
        <rect x="30" y="36" width="52" height="40" rx="7" fill="currentColor" opacity=".75" />
        <rect x="92" y="60" width="52" height="40" rx="7" fill="currentColor" opacity=".45" />
        <path d="M82 56 h10 v20 h-10 z" fill="currentColor" opacity=".9" />
      </>
    ),
    // a falling stack — cost coming down
    cost: (
      <>
        <rect x="28" y="30" width="26" height="80" rx="5" fill="currentColor" />
        <rect x="64" y="52" width="26" height="58" rx="5" fill="currentColor" opacity=".66" />
        <rect x="100" y="74" width="26" height="36" rx="5" fill="currentColor" opacity=".42" />
        <rect x="136" y="90" width="26" height="20" rx="5" fill="currentColor" opacity=".26" />
      </>
    ),
    // a gate in a path — human in the loop
    hitl: (
      <>
        <path d="M24 68 h44" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <path d="M122 68 h44" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity=".45" />
        <rect x="80" y="36" width="30" height="64" rx="8" fill="currentColor" />
        <circle cx="95" cy="58" r="6" fill="var(--card)" />
      </>
    ),
  };

  const variantClasses: Record<string, string> = {
    agentic: styles.agentic,
    codex: styles.codex,
    claude: styles.claude,
    grok: styles.grok,
    mcp: styles.engineering,
    "make-money-with-codex": styles.codexIncome,
    "claude-income": styles.claudeIncome,
    prompts: styles.agentic,
    github: styles.agentic,
    "software-engineering": styles.engineering,
    cursor: styles.cursor,
    "ai-research": styles.research,
    "ai-teaching": styles.teaching,
    "product-management": styles.claudeIncome,
    "agent-orchestration": styles.engineering,
    "math-animation": styles.mathAnimation,
    "responsible-ai": styles.responsible,
    "agentic-quant-trading": styles.engineering,
  };
  const motifId = id === "rag" ? "ai-research" : id === "ai-tutor" ? "ai-teaching" : id;
  const variantClass = variantClasses[motifId] ?? styles.legacy;
  const artwork = id === "grok"
    ? motif.agentic
    : id === "product-management"
      ? motif.claude
      : motif[motifId] ?? motif.handbook;

  return (
    <div
      className={`cover ${styles.root} ${variantClass}`}
      style={{ color: hue }}
      data-course-cover={id}
      aria-hidden="true"
    >
      <svg viewBox="0 0 190 140" preserveAspectRatio="xMidYMid meet" focusable="false">
        {artwork}
      </svg>
    </div>
  );
}
