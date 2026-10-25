from pathlib import Path
import csv
import sys
import unicodedata

from bs4 import BeautifulSoup


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


def clean_text(text):
    """Remove invisible formatting characters and normalize whitespace."""
    text = unicodedata.normalize("NFC", text)

    # Remove invisible Unicode formatting characters, such as
    # zero-width spaces and directional formatting marks.
    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Cf"
    )

    return " ".join(text.split()).strip()


def get_arabic(cell):
    """Extract new vocabulary, excluding gray previously learned words."""
    parts = []

    for span in cell.find_all("span", lang="ar"):
        # Skip previously learned vocabulary, which Lingco displays in gray.
        if span.get("style") and "rgb(126, 140, 141)" in span["style"]:
            continue

        text = clean_text(span.get_text("", strip=True))

        if text and text not in parts:
            parts.append(text)

    return " ".join(parts)



def get_english(cell):
    """Extract the English meaning, excluding Arabic and audio controls."""
    cell_copy = BeautifulSoup(str(cell), "html.parser")

    # Remove Arabic spans and audio-player elements.
    for element in cell_copy.select(
        'span[lang="ar"], .audio-player-small, svg'
    ):
        element.decompose()

    return clean_text(cell_copy.get_text(" ", strip=True))


rows = table.find_all("tr")
vocabulary = []

for row in rows[1:]:
    cells = row.find_all("td", recursive=False)

    if len(cells) != 4:
        print(f"Skipping row with {len(cells)} cells.")
        continue

    # This page's order is MSA, Shami, Egyptian, English.
    msa = get_arabic(cells[0])
    shami = get_arabic(cells[1])
    egyptian = get_arabic(cells[2])
    english = get_english(cells[3])

    vocabulary.append({
        "English": english,
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
