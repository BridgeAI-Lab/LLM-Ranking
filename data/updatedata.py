import json
import sys

def merge_json(old_path, updated_path, output_path):
    with open(old_path, "r") as f:
        old_data = json.load(f)

    with open(updated_path, "r") as f:
        updated_data = json.load(f)

    for llm_name, updates in updated_data.items():
        if llm_name not in old_data:
            old_data[llm_name] = updates  # Add new model entirely
        else:
            for key, val in updates.items():
                if isinstance(val, dict) and isinstance(old_data[llm_name].get(key), dict):
                    old_data[llm_name].setdefault(key, {})  # Ensure the nested dict exists
                    for subkey, subval in val.items():
                        old_data[llm_name][key][subkey] = subval
                else:
                    old_data[llm_name][key] = val

    with open(output_path, "w") as f:
        json.dump(old_data, f, indent=4)

    print(f"Merged data saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python updatedata.py data.json updated_data.json output.json")
    else:
        merge_json(sys.argv[1], sys.argv[2], sys.argv[3])
