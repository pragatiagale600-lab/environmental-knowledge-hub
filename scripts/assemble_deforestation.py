# scripts/assemble_deforestation.py
import json
from build_deforestation_events import deforestation_events
from build_deforestation_campaigns import tree_plantation_campaigns
from build_deforestation_movements import forest_movements
from build_deforestation_awards import award_winning_studies

all_deforestation = (
    deforestation_events +
    tree_plantation_campaigns +
    forest_movements +
    award_winning_studies
)

print(f"Total Deforestation & Tree Plantation case studies assembled: {len(all_deforestation)}")

counts = {}
for s in all_deforestation:
    sub = s["subcategory"]
    counts[sub] = counts.get(sub, 0) + 1

for sub, count in counts.items():
    print(f"  - {sub}: {count} studies")

with open("data/deforestation.json", "w", encoding="utf-8") as f:
    json.dump(all_deforestation, f, indent=2, ensure_ascii=False)

print("Successfully written to data/deforestation.json")
