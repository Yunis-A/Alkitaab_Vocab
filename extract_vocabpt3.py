from bs4 import BeautifulSoup, NavigableString, Tag
from pathlib import Path
import csv
import sys
import unicodedata

# Usage:
# py extract_vocabpt3.py "New Vocabulary _ Lingco Classroom.html"
# py extract_vocabpt3.py "New Vocabulary _ Lingco Classroom.html" "part3_test.csv"

HTML_FILE = (
    Path(sys.argv[1])
    if len(sys.argv) > 1
    else Path("New Vocabulary _ Lingco Classroom.html")
)

OUTPUT_FILE = (
    Path(sys.argv[2])
    if len(sys.argv) > 2
    else HTML_FILE.with_name(HTML_FILE.stem + "_vocabulary.csv")
)

# Source HTML order: MSA | Shami | Egyptian | English
FIELDNAMES = ["English", "Egyptian", "Shami", "MSA"]

OLD_WORD_COLOR = "rgb(128, 128, 128)"
EXAMPLE_BLUE = "rgb(35, 111, 161)"



def clean_text(text):
    """Normalize Unicode and whitespace while preserving Arabic diacritics."""
    text = unicodedata.normalize("NFC", text)

    # Remove invisible formatting characters.
    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Cf"
    )

    return " ".join(text.split()).strip()


def has_color(node, color):
    """Check whether an HTML element has a particular inline color."""
    return (
        isinstance(node, Tag)
        and color in node.get("style", "").lower()
    )


def is_old_word(node):
    """Identify previously learned vocabulary displayed in gray."""
    return has_color(node, OLD_WORD_COLOR)


def looks_like_example_sentence(text):
    """Heuristic for identifying Arabic example sentences."""
    text = clean_text(text)

    if not text:
        return False

    # Long lines are likely example sentences.
    if len(text) > 65:
        return True

    sentence_indicators = [
        "أنا ", "إني ", "إنه ", "إنها ",
        "اللي ", "عشان ", "لما ", "لأنه ",
        "الرئيس ", "الكاتب ", "التقيت ",
        "بحب ", "كانت ", "كان ", "يقول ",
        "عم ", "بيفكر ", "بفكر ",
        "ساهمت ", "تميزت ", "تؤمن ",
        "قرر الرئيس ", "هي بتحب ",
    ]

    if any(indicator in text for indicator in sentence_indicators):
        return True

    if text.endswith((".", "؟", "!", "؛")):
        return True

    return False


def extract_lines(cell):
    """
    Extract Arabic text from a cell, separating lines at <br> elements.

    Gray vocabulary is ignored. Nested blue Arabic spans are treated as
    examples when they are inside an Arabic span. An outer blue span is
    retained because Lingco sometimes styles both the vocabulary and
    example sentence together.
    """
    lines = []
    current = []

    def walk(node, inside_arabic=False, inside_old=False,
             inside_example=False):

        nonlocal current

        if isinstance(node, NavigableString):
            if inside_arabic and not inside_old and not inside_example:
                current.append(str(node))
            return

        if not isinstance(node, Tag):
            return

        # Ignore non-vocabulary UI elements.
        if node.name in ("svg", "script", "style", "button", "audio"):
            return

        classes = node.get("class", [])

        if any(
            cls in classes
            for cls in ("audio-player", "sr-only")
        ):
            return

        old = inside_old or is_old_word(node)

        # A nested blue Arabic span is usually an example.
        # Do not discard an outer span that also contains the vocabulary.
        nested_example = (
            has_color(node, EXAMPLE_BLUE)
            and node.name == "span"
            and node.get("lang") == "ar"
            and inside_arabic
            and node.find("br") is None
        )

        example = inside_example or nested_example
        arabic = inside_arabic or node.get("lang") == "ar"

        for child in node.children:
            if isinstance(child, Tag) and child.name == "br":
                lines.append(clean_text(" ".join(current)))
                current = []
            else:
                walk(child, arabic, old, example)

    walk(cell)

    lines.append(clean_text(" ".join(current)))

    return [line for line in lines if line]


DIALECT_EXAMPLE_COLORS = ("rgb(132, 63, 161)", "rgb(22, 145, 121)")


def is_example_only(cell):
    """A dialect cell whose single span is colored and has no <br> holds
    only an example sentence (the vocabulary word was left blank)."""
    for span in cell.find_all("span", lang="ar"):
        style = span.get("style", "").lower()
        if any(c in style for c in DIALECT_EXAMPLE_COLORS)                 and span.find("br") is None:
            return True
    return False


def extract_arabic_word(cell, is_dialect=False):
    """Extract the vocabulary word only (first line); drop examples/notes."""
    if is_dialect and is_example_only(cell):
        return ""

    lines = extract_lines(cell)
    return lines[0] if lines else ""


def extract_english(cell):
    """Extract the English meaning without audio-player controls."""
    cell_copy = BeautifulSoup(str(cell), "html.parser")

    for node in cell_copy.find_all(
        ["svg", "script", "style", "button", "audio"]
    ):
        node.decompose()

    for node in cell_copy.find_all(class_=["audio-player", "sr-only"]):
        node.decompose()

    return clean_text(cell_copy.get_text(" ", strip=True))


def main():
    if not HTML_FILE.exists():
        raise FileNotFoundError(
            f"Could not find input HTML file: {HTML_FILE}"
        )

    with HTML_FILE.open("r", encoding="utf-8") as file:
        soup = BeautifulSoup(file, "html.parser")

    vocabulary = []
    skipped_rows = 0

    for row in soup.find_all("tr"):
        cells = row.find_all("td", recursive=False)

        if len(cells) < 4:
            continue

        # HTML column order: MSA | Shami | Egyptian | English
        msa = extract_arabic_word(cells[0])
        shami = extract_arabic_word(
            cells[1],
            is_dialect=True
        )
        egyptian = extract_arabic_word(
            cells[2],
            is_dialect=True
        )
        english = extract_english(cells[3])

        # Skip the Arabic column-label row (المَعنى / المصري / ...).
        if english == "المَعنى":
            continue

        if not msa or not english:
            skipped_rows += 1
            print(
                f"Review skipped row: English={english!r}, "
                f"MSA={msa!r}"
            )
            continue

        vocabulary.append({
            "English": english,
            "Egyptian": egyptian,
            "Shami": shami,
            "MSA": msa,
        })

    # Match "Arabic Vocab.txt": book title, then a lesson header row,
    # pipe-delimited rows, UTF-8 without BOM.
    with OUTPUT_FILE.open("w", encoding="utf-8", newline="\n") as file:
        file.write(f"English|Egyptian|Shami|MSA\n")

        for v in vocabulary:
            row = [v[name] for name in FIELDNAMES]
            file.write("|".join(c.replace("|", "/") for c in row) + "\n")

    print("\nExtraction complete!")
    print(f"Vocabulary entries: {len(vocabulary)}")
    print(f"Skipped rows: {skipped_rows}")
    print(f"Output file: {OUTPUT_FILE.resolve()}")

    print("\nFirst 10 entries:")

    for entry in vocabulary[:10]:
        print(
            f"{entry['English']} | "
            f"{entry['Egyptian']} | "
            f"{entry['Shami']} | "
            f"{entry['MSA']}"
        )


if __name__ == "__main__":
    main()
