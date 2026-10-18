# scripts/assemble_pollution.py
import json
from build_pollution_air import air_pollution_studies
from build_pollution_water import water_pollution_studies
from build_pollution_noise import noise_pollution_studies
from build_pollution_plastic import plastic_pollution_studies
from build_pollution_industrial import industrial_pollution_studies

all_pollution = (
    air_pollution_studies +
    water_pollution_studies +
    noise_pollution_studies +
    plastic_pollution_studies +
    industrial_pollution_studies
)

print(f"Total Pollution case studies assembled: {len(all_pollution)}")

counts = {}
for s in all_pollution:
    sub = s["subcategory"]
    counts[sub] = counts.get(sub, 0) + 1

for sub, count in counts.items():
    print(f"  - {sub}: {count} studies")

import os
out_path = os.path.join(os.path.dirname(__file__), "..", "data", "pollution.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(all_pollution, f, indent=2, ensure_ascii=False)

print("Successfully written to data/pollution.json")
