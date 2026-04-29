"""
PDF ingestion using PyMuPDF. Extracts text blocks and tables with page metadata.
Tables are serialized to markdown so the LLM can reason over structured data.
"""
import fitz  # PyMuPDF
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator


@dataclass
class ParsedBlock:
    text: str
    page: int
    block_type: str          # "text" | "table"
    bbox: tuple[float, ...]  # bounding box for citation anchoring
    source: str              # filename


def _table_to_markdown(table: fitz.table.Table) -> str:
    """Serialize a PyMuPDF table to GitHub-flavored markdown."""
    rows = table.extract()
    if not rows:
        return ""

    header = rows[0]
    separator = ["---"] * len(header)
    body = rows[1:]

    lines = [
        "| " + " | ".join(str(c or "").strip() for c in header) + " |",
        "| " + " | ".join(separator) + " |",
    ]
    for row in body:
        lines.append("| " + " | ".join(str(c or "").strip() for c in row) + " |")

    return "\n".join(lines)


def parse_pdf(file_path: str | Path) -> list[ParsedBlock]:
    """
    Parse a PDF into a list of ParsedBlocks — one per text block or table.
    Tables are detected first per page; remaining text is extracted around them.
    """
    path = Path(file_path)
    doc = fitz.open(str(path))
    blocks: list[ParsedBlock] = []

    for page_num, page in enumerate(doc, start=1):
        # --- Tables ---
        table_bboxes: list[fitz.Rect] = []
        for table in page.find_tables():
            md = _table_to_markdown(table)
            if md.strip():
                bbox = tuple(table.bbox)
                blocks.append(
                    ParsedBlock(
                        text=f"[TABLE]\n{md}\n[/TABLE]",
                        page=page_num,
                        block_type="table",
                        bbox=bbox,
                        source=path.name,
                    )
                )
                table_bboxes.append(fitz.Rect(table.bbox))

        # --- Text blocks (skip areas covered by tables) ---
        raw_blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, type)
        for x0, y0, x1, y1, text, _, btype in raw_blocks:
            if btype != 0:  # skip images
                continue
            text = text.strip()
            if not text:
                continue
            rect = fitz.Rect(x0, y0, x1, y1)
            if any(rect.intersects(tb) for tb in table_bboxes):
                continue
            blocks.append(
                ParsedBlock(
                    text=text,
                    page=page_num,
                    block_type="text",
                    bbox=(x0, y0, x1, y1),
                    source=path.name,
                )
            )

    doc.close()
    return blocks
