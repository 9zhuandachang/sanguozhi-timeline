import json
import os

def split_json():
    input_file = 'data/sanguozhi.json'
    output_dir = 'data/volumes'
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Found {len(data)} volumes. Splitting...")
    
    for item in data:
        volume_name = item.get('volume', 'unknown_volume')
        # Clean the filename to avoid invalid characters
        safe_name = "".join([c for c in volume_name if c.isalnum() or c in (' ', '-', '_')])
        
        output_file = os.path.join(output_dir, f"{safe_name}.json")
        with open(output_file, 'w', encoding='utf-8') as out_f:
            json.dump(item, out_f, ensure_ascii=False, indent=2)
            
    print(f"Successfully split into {len(data)} files in {output_dir}/")

if __name__ == "__main__":
    split_json()
