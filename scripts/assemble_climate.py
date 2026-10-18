# scripts/assemble_climate.py
import json
import os
from build_climate_heat_glaciers import heatwave_studies, glacier_change_studies
from build_climate_sea_extremes import sea_level_rise_studies, extreme_weather_studies

all_climate = (
    heatwave_studies +
    glacier_change_studies +
    sea_level_rise_studies +
    extreme_weather_studies
)

print(f"Total Climate Change case studies assembled: {len(all_climate)}")

counts = {}
for s in all_climate:
    sub = s["subcategory"]
    counts[sub] = counts.get(sub, 0) + 1

for sub, count in counts.items():
    print(f"  - {sub}: {count} studies")

out_path = os.path.join(os.path.dirname(__file__), "..", "data", "climate-change.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(all_climate, f, indent=2, ensure_ascii=False)

print("Successfully written to data/climate-change.json")
