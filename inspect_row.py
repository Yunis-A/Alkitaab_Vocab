from bs4 import BeautifulSoup
from pathlib import Path

html_file = Path("المفردات الجديدة ١ _ Lingco Classroom.html")

soup = BeautifulSoup(
html_file.read_text(encoding="utf-8"),
"html.parser"
)

for row in soup.find_all("tr"):
    cells = row.find_all("td", recursive=False)

    if len(cells) < 4:
        continue

    english = cells[3].get_text(" ", strip=True)

    if "complication" in english.lower():
        for i, cell in enumerate(cells):
            print(f"\n--- CELL {i} ---")
            print(cell.prettify())
