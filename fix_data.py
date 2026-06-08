import json
import re

num_map = {'元':1, '一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10}
def cn2num(cn):
    if not cn: return 1
    if cn == '元': return 1
    if len(cn) == 1: return num_map.get(cn, 1)
    if len(cn) == 2:
        if cn[0] == '十': return 10 + num_map.get(cn[1], 0)
        if cn[1] == '十': return num_map.get(cn[0], 0) * 10
    if len(cn) == 3:
        return num_map.get(cn[0], 0) * 10 + num_map.get(cn[2], 0)
    return 1

eras = {
    '中平': 184, '初平': 190, '兴平': 194, '建安': 196, '延康': 220,
    '黄初': 220, '太和': 227, '青龙': 233, '景初': 237, '正始': 240, '嘉平': 249, '正元': 254, '甘露': 256, '景元': 260, '咸熙': 264,
    '章武': 221, '建兴': 223, '延熙': 238, '景耀': 258, '炎兴': 263,
    '黄武': 222, '黄龙': 229, '嘉禾': 232, '赤乌': 238, '太元': 251, '神凤': 252, '建平': 252, '五凤': 254, '太平': 256, '永安': 258, '元兴': 264, '甘露': 265, '宝鼎': 266, '建衡': 269, '凤凰': 272, '天册': 275, '天玺': 276, '天纪': 277
}

files_to_process = [
    {"source": "武帝纪第一", "char": "曹操", "factions": ["魏"], "start_year": 155, "start_era": 155},
    {"source": "文帝纪第二", "char": "曹丕", "factions": ["魏"], "start_year": 187, "start_era": 187},
    {"source": "明帝纪第三", "char": "曹叡", "factions": ["魏"], "start_year": 226, "start_era": 226},
    {"source": "少帝纪第四", "char": "曹芳", "factions": ["魏"], "start_year": 239, "start_era": 239},
    {"source": "先主传第二", "char": "刘备", "factions": ["蜀"], "start_year": 161, "start_era": 161},
    {"source": "后主传第三", "char": "刘禅", "factions": ["蜀"], "start_year": 223, "start_era": 223},
    {"source": "孙破虏讨逆传第一", "char": "孙坚", "factions": ["吴"], "start_year": 155, "start_era": 155},
    {"source": "吴主传第二", "char": "孙权", "factions": ["吴"], "start_year": 200, "start_era": 200}
]

def parse_year(text, current_year, current_era_start):
    for era, start_year in eras.items():
        match = re.search(f'{era}([元一二三四五六七八九十]+)年', text)
        if match:
            return start_year + cn2num(match.group(1)) - 1, start_year
            
    match = re.search(r'^([元一二三四五六七八九十]+)年', text[:15])
    if match:
        return current_era_start + cn2num(match.group(1)) - 1, current_era_start
        
    return current_year, current_era_start

def extract_title(text):
    parts = re.split(r'[，。；！？]', text)
    title = parts[0] if parts else text[:10]
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
    if "评曰" in text[:5]:
        return "陈寿评曰"
    return title

for cfg in files_to_process:
    source = cfg["source"]
    with open(f"data/volumes/{source}.json", 'r', encoding='utf-8') as f:
        volume = json.load(f)
        
    current_year = cfg["start_year"]
    current_era_start = cfg["start_era"]
    res = []
    
    for idx, text in enumerate(volume['content']):
        current_year, current_era_start = parse_year(text, current_year, current_era_start)
        
        char = cfg["char"]
        if source == "少帝纪第四":
            if current_year >= 260: char = "曹奂"
            elif current_year >= 254: char = "曹髦"
        elif source == "孙破虏讨逆传第一":
            if current_year >= 192: char = "孙策"
            
        importance = 1
        if len(text) > 100: importance = 2
        if "薨" in text or "崩" in text or "践阼" in text or "即皇帝位" in text: importance = 3
        
        if len(text) > 10:
            res.append({
                "paragraphIndex": idx,
                "year": current_year,
                "title": extract_title(text),
                "importance": importance,
                "factions": cfg["factions"],
                "character": char,
                "source": source
            })
            
    with open(f"frontend/public/data/timeline/{source}_timeline.json", 'w', encoding='utf-8') as out:
        json.dump(res, out, ensure_ascii=False, indent=2)

print("Regeneration complete!")
