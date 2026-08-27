#!/usr/bin/env python3
"""Generate deterministic, original fictional PDFs for Course 17 page audits."""

from __future__ import annotations

from pathlib import Path

import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph, Table, TableStyle
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/courses/ai-research/primary"
FONT_DIRECTORY = Path(reportlab.__file__).resolve().parent / "fonts"
FONT_REGULAR = "CourseVera"
FONT_BOLD = "CourseVeraBold"
pdfmetrics.registerFont(TTFont(FONT_REGULAR, FONT_DIRECTORY / "Vera.ttf"))
pdfmetrics.registerFont(TTFont(FONT_BOLD, FONT_DIRECTORY / "VeraBd.ttf"))

PAPERS = {
    "REC-001": {
        "title": "Optional explanations and first-draft revision in two fictional seminar sections",
        "team": "Fictional Team Alder",
        "pages": 9,
        "special": {
            4: (
                "Method - assignment",
                "Section assignment followed the existing timetable; no random allocation was performed. "
                "The explanation section and comparison section were already intact before the authored exercise began. "
                "Baseline revision scores differed, so this comparison cannot identify a causal effect.",
            ),
            7: (
                "Results - Table 2",
                "The fictional available-case summaries are shown below. The means are descriptive and retain their group denominators.",
            ),
            9: (
                "Limitations",
                "The groups differed at baseline and the analysis does not identify a causal effect. "
                "The tiny authored sample cannot establish effectiveness, fairness, generalisation, or policy relevance.",
            ),
        },
    },
    "REC-002": {
        "title": "Learners interpreting machine explanations during study-plan revision",
        "team": "Fictional Team Birch",
        "pages": 11,
        "special": {
            5: (
                "Method - sampling",
                "Twelve volunteers who had opened at least one explanation were interviewed using a fictional semi-structured guide. "
                "Volunteers were not sampled to estimate prevalence and no non-user interviews were available.",
            ),
            8: (
                "Findings - Theme 2: inspect, do not defer",
                "Participants described the explanation as a reason to inspect the suggestion, not as proof that it was correct. "
                "Several authored accounts described rejecting a suggestion after checking task requirements.",
            ),
            11: (
                "Limitations",
                "Volunteer accounts do not establish prevalence, effectiveness, or the experiences of non-users. "
                "The themes are fictional teaching material and cannot be transferred to a real population.",
            ),
        },
    },
    "REC-005": {
        "title": "A fictional randomised comparison of explanation access during revision",
        "team": "Fictional Team Elm",
        "pages": 13,
        "special": {
            6: (
                "Method - allocation",
                "A seeded fictional random-number list allocated 80 participant codes equally before the interface opened. "
                "The list, seed, and assignment receipt were frozen before any fictional outcome was inspected.",
            ),
            10: (
                "Results - Table 3: primary outcome",
                "Available cases and the authored interval are shown below. Missing outcomes remain visible and no subgroup effect was preregistered.",
            ),
            13: (
                "Limitations",
                "Six participant codes lacked the primary outcome; no subgroup effect was preregistered. "
                "The synthetic result cannot establish a real effect, mechanism, safety claim, or decision threshold.",
            ),
        },
    },
}

STYLES = getSampleStyleSheet()
BODY = ParagraphStyle(
    "body",
    parent=STYLES["BodyText"],
    fontName=FONT_REGULAR,
    fontSize=10.5,
    leading=15,
    textColor=colors.HexColor("#23333A"),
    spaceAfter=8,
)
TITLE = ParagraphStyle(
    "title",
    parent=STYLES["Title"],
    fontName=FONT_BOLD,
    fontSize=19,
    leading=23,
    textColor=colors.HexColor("#102A43"),
    alignment=TA_CENTER,
)
HEADING = ParagraphStyle(
    "heading",
    parent=STYLES["Heading2"],
    fontName=FONT_BOLD,
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#0E7490"),
)
TABLE_HEADER = ParagraphStyle(
    "table-header",
    parent=BODY,
    fontName=FONT_BOLD,
    fontSize=7.4,
    leading=9,
    textColor=colors.white,
    spaceAfter=0,
)
TABLE_BODY = ParagraphStyle(
    "table-body",
    parent=BODY,
    fontName=FONT_REGULAR,
    fontSize=7.6,
    leading=9.2,
    textColor=colors.HexColor("#23333A"),
    spaceAfter=0,
)
BOUNDARY_STRONG = ParagraphStyle(
    "boundary-strong",
    parent=BODY,
    fontName=FONT_BOLD,
    fontSize=8.2,
    leading=10.2,
    textColor=colors.HexColor("#614A00"),
    spaceAfter=0,
)
BOUNDARY_BODY = ParagraphStyle(
    "boundary-body",
    parent=BODY,
    fontName=FONT_REGULAR,
    fontSize=8.1,
    leading=10,
    textColor=colors.HexColor("#614A00"),
    spaceAfter=0,
)


def draw_paragraph(canvas: Canvas, text: str, style: ParagraphStyle, x: float, y: float, width: float) -> float:
    paragraph = Paragraph(text, style)
    _, height = paragraph.wrap(width, 240 * mm)
    paragraph.drawOn(canvas, x, y - height)
    return y - height


def draw_header(canvas: Canvas, record_id: str, page: int, total: int) -> None:
    width, height = A4
    canvas.setFillColor(colors.HexColor("#E7F5F8"))
    canvas.rect(0, height - 18 * mm, width, 18 * mm, fill=1, stroke=0)
    label = "AICOURSE ORIGINAL FICTIONAL PRIMARY OBJECT - NOT A REAL STUDY"
    canvas.setFont(FONT_BOLD, 8.5)
    canvas.setFillColor(colors.HexColor("#0E5A6B"))
    canvas.drawCentredString(width / 2, height - 10.8 * mm, label)
    canvas.setStrokeColor(colors.HexColor("#9AC8D3"))
    canvas.line(18 * mm, 17 * mm, width - 18 * mm, 17 * mm)
    canvas.setFont(FONT_REGULAR, 8)
    canvas.setFillColor(colors.HexColor("#52636B"))
    canvas.drawString(18 * mm, 11 * mm, f"{record_id} | CC0 fictional teaching object")
    footer = f"Page {page} of {total}"
    canvas.drawRightString(width - 18 * mm, 11 * mm, footer)


def draw_table(canvas: Canvas, record_id: str, page: int, y: float) -> None:
    if record_id == "REC-001" and page == 7:
        raw_data = [
            ["group", "n", "revision_quality mean", "SD"],
            ["optional explanation", "28", "3.4", "0.6"],
            ["suggestion only", "25", "3.1", "0.7"],
        ]
        col_widths = [45 * mm, 18 * mm, 74 * mm, 27 * mm]
        caption = "Table 2. Descriptive revision-quality summaries"
    elif record_id == "REC-005" and page == 10:
        raw_data = [
            ["group", "allocated", "available", "mean", "SD"],
            ["optional explanation", "40", "36", "3.6", "0.5"],
            ["suggestion only", "40", "38", "3.3", "0.6"],
            ["mean difference", "-", "74", "0.30", "fictional 95% interval 0.05 to 0.55"],
        ]
        col_widths = [42 * mm, 24 * mm, 27 * mm, 22 * mm, 49 * mm]
        caption = "Table 3. Primary fictional outcome with attrition visible"
    else:
        return
    data = [
        [
            Paragraph(escape(str(cell)).replace("revision_quality", "revision quality"), TABLE_HEADER if row_index == 0 else TABLE_BODY)
            for cell in row
        ]
        for row_index, row in enumerate(raw_data)
    ]
    canvas.setFont(FONT_BOLD, 9.5)
    canvas.setFillColor(colors.HexColor("#23333A"))
    canvas.drawString(24 * mm, y, caption)
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0E7490")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9AC8D3")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F8FA")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    _, table_height = table.wrap(170 * mm, 80 * mm)
    table.drawOn(canvas, 20 * mm, y - 6 * mm - table_height)


def generic_content(record_id: str, page: int) -> tuple[str, str]:
    sections = [
        "Abstract and scope",
        "Background",
        "Protocol and questions",
        "Method",
        "Measures and evidence boundaries",
        "Analysis plan",
        "Results",
        "Interpretation",
        "Limitations",
        "Audit notes",
        "Disclosure",
        "Reproduction notes",
        "Conclusion",
    ]
    heading = sections[min(page - 1, len(sections) - 1)]
    body = (
        f"This is page {page} of an entirely fictional record created for Course 17. "
        "It exists so learners can distinguish a locator from primary evidence, preserve denominators, and calibrate claims to design. "
        "No person, institution, publication, observation, quotation, or result is real. "
        "Any extraction must name this PDF, the exact page, the relevant table or paragraph, and a verification decision."
    )
    return heading, body


def generate(record_id: str, paper: dict[str, object]) -> Path:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    path = OUTPUT / f"{record_id}.pdf"
    canvas = Canvas(str(path), pagesize=A4, invariant=1, pageCompression=1)
    canvas.setTitle(str(paper["title"]))
    canvas.setAuthor("aicourse.top - original fictional teaching object")
    canvas.setSubject("Course 17 page-grounded evidence verification")
    canvas.setKeywords("fictional, synthetic, CC0, evidence verification")
    total = int(paper["pages"])
    for page in range(1, total + 1):
        draw_header(canvas, record_id, page, total)
        width, height = A4
        y = height - 31 * mm
        if page == 1:
            y = draw_paragraph(canvas, str(paper["title"]), TITLE, 23 * mm, y, width - 46 * mm)
            canvas.setFont(FONT_REGULAR, 10)
            canvas.setFillColor(colors.HexColor("#52636B"))
            team = f"{paper['team']} | Entirely fictional | Local identifier {record_id}"
            canvas.drawCentredString(width / 2, y - 7 * mm, team)
            y -= 20 * mm
        special = paper["special"]
        heading, body = special.get(page, generic_content(record_id, page))  # type: ignore[union-attr]
        y = draw_paragraph(canvas, str(heading), HEADING, 24 * mm, y, width - 48 * mm) - 4 * mm
        y = draw_paragraph(canvas, str(body), BODY, 24 * mm, y, width - 48 * mm) - 6 * mm
        draw_table(canvas, record_id, page, y)
        canvas.setFillColor(colors.HexColor("#FFF5D6"))
        canvas.roundRect(24 * mm, 25 * mm, width - 48 * mm, 34 * mm, 3 * mm, fill=1, stroke=0)
        note = "Verification boundary: use this PDF page as the primary object; extracted JSON and RAG chunks are locators only."
        draw_paragraph(canvas, note, BOUNDARY_STRONG, 29 * mm, 53 * mm, width - 58 * mm)
        draw_paragraph(
            canvas,
            "Not citable as real research. No factual, causal, legal, or policy claim is authorised.",
            BOUNDARY_BODY,
            29 * mm,
            38 * mm,
            width - 58 * mm,
        )
        canvas.showPage()
    canvas.save()
    return path


def main() -> None:
    for record_id, paper in PAPERS.items():
        print(generate(record_id, paper))


if __name__ == "__main__":
    main()
