# scripts/verify_all_data.py
import json
import glob
import os

data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
categories_path = os.path.join(data_dir, "categories.json")

with open(categories_path, "r", encoding="utf-8") as f:
    cat_data = json.load(f)

expected_subcategories = {}
for cat in cat_data["categories"]:
    for sub in cat["subcategories"]:
        expected_subcategories[sub["id"]] = {
            "name": sub["name"],
            "category": cat["id"],
            "category_name": cat["title"],
            "count": 0
        }

json_files = [
    "disaster.json",
    "deforestation.json",
    "pollution.json",
    "climate-change.json",
    "conservation.json"
]

all_studies = []
all_ids = set()
duplicates = []
missing_fields = []

required_fields = [
    "id", "title", "category", "subcategory", "verificationStatus",
    "lastVerifiedDate", "year", "dateDetails", "location", "summary",
    "timeline", "causes", "impact", "responseAndRescue", "media", "references"
]

for jf in json_files:
    file_path = os.path.join(data_dir, jf)
    if not os.path.exists(file_path):
        print(f"ERROR: Missing file {jf}")
        continue
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        print(f"File {jf}: {len(data)} case studies")
        for item in data:
            all_studies.append(item)
            item_id = item.get("id")
            if item_id in all_ids:
                duplicates.append(item_id)
            all_ids.add(item_id)

            sub_id = item.get("subcategory")
            if sub_id in expected_subcategories:
                expected_subcategories[sub_id]["count"] += 1
            else:
                print(f"WARNING: Unknown subcategory '{sub_id}' in study {item_id}")

            for rf in required_fields:
                if rf not in item:
                    missing_fields.append((item_id, rf))

print("\n" + "="*60)
print(f"GRAND TOTAL CASE STUDIES: {len(all_studies)}")
print(f"UNIQUE IDS: {len(all_ids)}")
print(f"DUPLICATES: {len(duplicates)}")
print(f"MISSING REQUIRED FIELDS: {len(missing_fields)}")
print("="*60)

subcats_below_target = []
print("\nSUBCATEGORY BREAKDOWN:")
for sub_id, info in expected_subcategories.items():
    status = "OK" if info["count"] >= 10 else "INCOMPLETE"
    if info["count"] < 10:
        subcats_below_target.append((sub_id, info["count"]))
    print(f"[{status:10}] {info['category_name']} -> {info['name']} ({sub_id}): {info['count']} studies")

print("="*60)
if len(subcats_below_target) == 0 and len(duplicates) == 0 and len(missing_fields) == 0:
    print("ALL 23 SUBCATEGORIES HAVE AT LEAST 10 CASE STUDIES (100% COMPLETE AND VERIFIED)!")
else:
    print(f"Issues found: {len(subcats_below_target)} subcategories below target.")
