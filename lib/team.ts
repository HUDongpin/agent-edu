/**
 * The people behind the course.
 *
 * Facts are drawn from the published profiles at pedanova.tech/team and
 * 3dena.com/team; the wording here is our own rather than copied. Portraits
 * are generated monograms, not photographs: hotlinking someone's headshot
 * would add an external request to a site that makes a point of having none,
 * and re-hosting a photo is not ours to do.
 */

export interface Person {
  id: string;
  name: string;
  /** Roman initials, used when there is no photograph. */
  initials: string;
  /** Self-hosted portrait. Absent where no published photo exists. */
  photo?: string;
  /** CSS object-position, so a circular crop lands on the face. */
  focus?: string;
  hue: string;
  /** Areas of work — keys into messages, so they translate. */
  areas: string[];
  links: { label: string; href: string }[];
}

export const CREATOR: Person = {
  id: "peter",
  name: "Dr. Peter HU Dongpin",
  initials: "PH",
  photo: "/team/peter.jpg",
  focus: "center 22%",
  hue: "var(--brand)",
  areas: ["tel", "analytics", "aied", "appdev"],
  links: [
    { label: "hudongpin.com", href: "https://hudongpin.com" },
    { label: "PedaNova", href: "https://www.pedanova.tech/team/" },
    { label: "3D ENA", href: "https://www.3dena.com/team" },
    { label: "GitHub", href: "https://github.com/HUDongpin" },
  ],
};

export const TEAM: Person[] = [
  {
    id: "hwang",
    name: "Prof. Gwo-Jen Hwang",
    initials: "GH",
    photo: "/team/hwang.jpg",
    focus: "center 18%",
    hue: "var(--violet)",
    areas: ["aied", "mobile", "game", "flipped"],
    links: [{ label: "3D ENA", href: "https://www.3dena.com/team" }],
  },
  {
    id: "tu",
    name: "Dr. Yun-Fang Tu",
    initials: "YT",
    photo: "/team/tu.jpg",
    focus: "center 20%",
    hue: "var(--green)",
    areas: ["genai", "digital", "edm", "network"],
    links: [{ label: "3D ENA", href: "https://www.3dena.com/team" }],
  },
  {
    id: "yu",
    name: "Mr. YU Jianxing",
    initials: "YJ",
    photo: "/team/yu.jpg",
    focus: "center 14%",
    hue: "var(--gold-mark)",
    areas: ["ena", "qe", "discourse", "software"],
    links: [{ label: "3D ENA", href: "https://www.3dena.com/team" }],
  },
];
