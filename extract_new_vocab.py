from pathlib import Path
import csv
import sys

from bs4 import BeautifulSoup


# Usage:
# py extract_new_vocab.py "New Vocabulary _ Lingco Classroom.html"
# Optionally specify an output CSV as the second argument.

if len(sys.argv) < 2:
    html_file = Path("New Vocabulary _ Lingco Classroom.html")
else:
    html_file = Path(sys.argv[1])

output_file = (
    Path(sys.argv[2])
    if len(sys.argv) >= 3
    else html_file.with_name(html_file.stem + "_vocabulary.csv")
)

if not html_file.exists():
    print(f"Error: Could not find {html_file}")
    sys.exit(1)

soup = BeautifulSoup(
    html_file.read_text(encoding="utf-8"),
    "html.parser"
)

table = soup.find("table")

if table is None:
    print("Error: No HTML table found.")
    sys.exit(1)


def get_arabic(cell):
    """Extract Arabic text while excluding transliteration and audio controls."""
    arabic_spans = cell.find_all("span", lang="ar")

    if not arabic_spans:
        return ""

    # Usually the innermost Arabic span contains the actual text.
    # Joining the spans also handles cases where Arabic is split across spans.
    parts = []

    for span in arabic_spans:
        text = span.get_text("", strip=True)
        if text and text not in parts:
            parts.append(text)

    return " ".join(parts)


def get_meaning(cell):
    """Extract the English meaning and its explanatory notes."""
    paragraphs = cell.find_all("p")
    parts = []

    for paragraph in paragraphs:
        text = paragraph.get_text(" ", strip=True)
        if text:
            parts.append(text)

    if not parts:
        return cell.get_text(" ", strip=True)

    return " ".join(parts)


rows = table.find_all("tr")
vocabulary = []

for row in rows[1:]:  # Skip the column-header row
    cells = row.find_all("td", recursive=False)

    if len(cells) != 4:
        print(f"Skipping row with {len(cells)} cells.")
        continue

    meaning = get_meaning(cells[0])
    egyptian = get_arabic(cells[1])
    shami = get_arabic(cells[2])
    msa = get_arabic(cells[3])

    vocabulary.append({
        "English": meaning,
        "Egyptian": egyptian,
        "Shami": shami,
        "MSA": msa,
    })


with output_file.open("w", newline="", encoding="utf-8-sig") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=["English", "Egyptian", "Shami", "MSA"],
        delimiter="|"

    )
    writer.writeheader()
    writer.writerows(vocabulary)

print(f"Extracted {len(vocabulary)} vocabulary entries.")
print(f"Saved to: {output_file}")
