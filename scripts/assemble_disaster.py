# scripts/assemble_disaster.py
import json
from build_disaster_floods import disaster_studies as flood_studies
from build_disaster_landslides import landslide_studies
from build_disaster_cyclones import cyclone_studies
from build_disaster_earthquakes import earthquake_studies
from build_disaster_tsunamis import tsunami_studies
from build_disaster_fires import forest_fire_studies

all_disasters = (
    flood_studies +
    landslide_studies +
    cyclone_studies +
    earthquake_studies +
    tsunami_studies +
    forest_fire_studies
)

print(f"Total disaster case studies assembled: {len(all_disasters)}")

# Breakdown check
counts = {}
for s in all_disasters:
    sub = s["subcategory"]
    counts[sub] = counts.get(sub, 0) + 1

for sub, count in counts.items():
    print(f"  - {sub}: {count} studies")

with open("data/disaster.json", "w", encoding="utf-8") as f:
    json.dump(all_disasters, f, indent=2, ensure_ascii=False)

print("Successfully written to data/disaster.json")
