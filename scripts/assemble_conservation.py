# scripts/assemble_conservation.py
import json
import os
from build_conservation_rivers_forests import river_restoration_studies, forest_restoration_studies
from build_conservation_wildlife_community import wildlife_conservation_studies, community_initiatives_studies

all_conservation = (
    river_restoration_studies +
    forest_restoration_studies +
    wildlife_conservation_studies +
    community_initiatives_studies
)

print(f"Total Conservation case studies assembled: {len(all_conservation)}")

counts = {}
for s in all_conservation:
    sub = s["subcategory"]
    counts[sub] = counts.get(sub, 0) + 1

for sub, count in counts.items():
    print(f"  - {sub}: {count} studies")

out_path = os.path.join(os.path.dirname(__file__), "..", "data", "conservation.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(all_conservation, f, indent=2, ensure_ascii=False)

print("Successfully written to data/conservation.json")
