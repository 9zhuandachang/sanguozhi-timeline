import json
import os
import re

def cn2num(cn):
    if cn == '元': return 1
    num_map = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}
    if cn in num_map: return num_map[cn]
    if len(cn) == 2:
        if cn[0] == '十': return 10 + num_map[cn[1]]
        if cn[1] == '十': return num_map[cn[0]] * 10
    if len(cn) == 3:
        return num_map[cn[0]] * 10 + num_map[cn[2]]
    return 1

eras = {
    '初平': 190, '兴平': 194, '建安': 196, '延康': 220,
    '黄初': 220, '太和': 227, '青龙': 233, '景初': 237, '正始': 240, '嘉平': 249, '正元': 254, '甘露': 256, '景元': 260, '咸熙': 264,
    '章武': 221, '建兴': 223, '延熙': 238, '景耀': 258, '炎兴': 263,
    '黄武': 222, '黄龙': 229, '嘉禾': 232, '赤乌': 238, '太元': 251, '神凤': 252
}

def parse_year(text, current_year):
    # Try to match full era name + year
    for era, start_year in eras.items():
        match = re.search(f'{era}([元一二三四五六七八九十]+)年', text)
        if match:
            return start_year + cn2num(match.group(1)) - 1
            
    # Try to match just "N年" if it's at the beginning or after a time word
    match = re.search(r'([元一二三四五六七八九十]+)年', text[:15])
    if match:
        return current_year + cn2num(match.group(1)) - cn2num('元') # Assuming era didn't change
        
    return current_year

def extract_title(text):
    # Get first sentence
    parts = re.split(r'[，。；！？]', text)
    title = parts[0] if parts else text[:10]
    
    # Remove common time prefixes
    time_words = [r'.*年春(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'.*年夏(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'.*年秋(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'.*年冬(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'.*年(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'春(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'夏(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'秋(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'冬(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)',
                  r'.*年']
    for tw in time_words:
        title = re.sub(f'^{tw}', '', title)
        
    title = title.strip('，。、 ')
    if len(title) > 15:
        title = title[:14] + '…'
    if len(title) < 2 and len(parts) > 1:
        title = parts[1][:14]
    
    # Special overrides for "评曰"
    if "评曰" in text[:5]:
        return "陈寿评曰"
        
    return title

files_to_process = [
    {"source": "明帝纪第三", "char": "曹叡", "factions": ["魏"], "start_year": 226},
    {"source": "少帝纪第四", "char": "曹芳", "factions": ["魏"], "start_year": 239},
    {"source": "吴主传第二", "char": "孙权", "factions": ["吴"], "start_year": 200}
]

for cfg in files_to_process:
    source = cfg["source"]
    with open(f"data/volumes/{source}.json", 'r', encoding='utf-8') as f:
        volume = json.load(f)
        
    current_year = cfg["start_year"]
    res = []
    
    for idx, text in enumerate(volume['content']):
        # Find year
        current_year = parse_year(text, current_year)
        
        # dynamic character for 少帝纪第四
        char = cfg["char"]
        if source == "少帝纪第四":
            if current_year >= 260: char = "曹奂"
            elif current_year >= 254: char = "曹髦"
            else: char = "曹芳"
            
        title = extract_title(text)
        if not title: title = "历史事件"
        
        imp = 3
        if "薨" in text or "死" in text or "崩" in text: imp = 4
        if "称帝" in text or "禅位" in text: imp = 5
        if "评曰" in text[:5]: imp = 1
        
        res.append({
            "paragraphIndex": idx,
            "year": current_year,
            "title": title,
            "importance": imp,
            "factions": cfg["factions"],
            "character": char,
            "source": source
        })
        
    out_path = f"frontend/public/data/timeline/{source}_timeline.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
        
    backup_path = f"data/timeline/{source}_timeline.json"
    os.makedirs(os.path.dirname(backup_path), exist_ok=True)
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)

print("Batch 2 generated successfully!")
