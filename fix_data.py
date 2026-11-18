import json
import os
import re

num_map = {'元': 1, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}

def cn2num(cn):
    if not cn or cn == '元':
        return 1
    if len(cn) == 1:
        return num_map.get(cn, 1)
    if len(cn) == 2:
        if cn[0] == '十':
            return 10 + num_map.get(cn[1], 0)
        if cn[1] == '十':
            return num_map.get(cn[0], 0) * 10
    if len(cn) == 3:
        return num_map.get(cn[0], 0) * 10 + num_map.get(cn[2], 0)
    return 1

han_eras = {'熹平': 172, '光和': 178, '中平': 184, '初平': 190, '兴平': 194, '建安': 196, '延康': 220}
faction_eras = {
    '魏': {**han_eras, '黄初': 220, '太和': 227, '青龙': 233, '景初': 237, '正始': 240, '嘉平': 249, '正元': 254, '甘露': 256, '景元': 260, '咸熙': 264},
    '蜀': {**han_eras, '章武': 221, '建兴': 223, '延熙': 238, '景耀': 258, '炎兴': 263},
    '吴': {**han_eras, '黄武': 222, '黄龙': 229, '嘉禾': 232, '赤乌': 238, '太元': 251, '神凤': 252, '建兴': 252, '五凤': 254, '太平': 256, '永安': 258, '元兴': 264, '甘露': 265, '宝鼎': 266, '建衡': 269, '凤凰': 272, '天册': 275, '天玺': 276, '天纪': 277}
}
all_era_names = sorted({k for d in faction_eras.values() for k in d.keys()}, key=len, reverse=True)

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

GANZHI_RE = r'[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥](?:朔|晦|日)?'
TIME_PREFIX_RE = re.compile(
    rf'^(?:'
    rf'(?:{"|".join(all_era_names)})?(?:[元一二三四五六七八九十]+年|末|初|中)|'
    rf'[春夏秋冬]|'
    rf'闰?(?:正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|腊月|十有一月|十有二月)|'
    rf'{GANZHI_RE}|'
    rf'是岁|是年|是月|是春|是夏|是秋|是冬|其年|初|先是|既而|寻|顷之'
    rf')+$'
)

LEADING_STRIP_RE = re.compile(
    rf'^(?:'
    rf'(?:{"|".join(all_era_names)})?(?:[元一二三四五六七八九十]+年|末|初)'
    rf'|[春夏秋冬]'
    rf'|闰?(?:正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|腊月|十有一月|十有二月)'
    rf'|{GANZHI_RE}'
    rf'|是岁|是年|是月|是春|是夏|是秋|是冬|其年'
    rf')+'
)

def parse_year(text, current_year, current_era_start, faction):
    eras = faction_eras.get(faction, han_eras)
    for era, start_year in eras.items():
        match = re.search(f'{era}([元一二三四五六七八九十]+)年', text[:35])
        if match:
            return start_year + cn2num(match.group(1)) - 1, start_year
        if f'{era}末' in text[:15]:
            return start_year + 5, start_year

    match = re.search(r'^([元一二三四五六七八九十]+)年', text[:15])
    if match and current_era_start >= 170:
        return current_era_start + cn2num(match.group(1)) - 1, current_era_start

    return current_year, current_era_start

def clean_clause(clause):
    c = clause.strip('，。；！？、：“”‘’ ')
    c = LEADING_STRIP_RE.sub('', c).strip('，。；！？、：“”‘’ ')
    c = c.replace('“', '').replace('”', '')
    return c

def extract_title(text):
    if "评曰" in text[:8]:
        return "陈寿史臣评赞"

    parts = [p.strip() for p in re.split(r'[，。；！？]', text) if p.strip()]
    candidate = ""

    for p in parts:
        if TIME_PREFIX_RE.match(p):
            continue
        cleaned = clean_clause(p)
        if cleaned in ("诏曰", "策曰", "令曰", "制曰", "下诏曰"):
            continue
        if cleaned.startswith(("诏曰：", "策曰：", "令曰：", "下诏曰：")):
            cleaned = cleaned.split("：", 1)[1].strip()
        if len(cleaned) >= 3 and not TIME_PREFIX_RE.match(cleaned):
            candidate = cleaned
            break

    if not candidate:
        for p in parts:
            cleaned = clean_clause(p)
            if len(cleaned) >= 2 and not TIME_PREFIX_RE.match(cleaned):
                candidate = cleaned
                break

    if not candidate:
        candidate = text[:16].strip('，。；！？、：“” ')

    if len(candidate) > 18:
        candidate = candidate[:17] + '…'
    return candidate

vol_dir = "frontend/public/data/volumes" if os.path.exists("frontend/public/data/volumes") else "data/volumes"

for cfg in files_to_process:
    source = cfg["source"]
    faction = cfg["factions"][0]
    with open(f"{vol_dir}/{source}.json", 'r', encoding='utf-8') as f:
        volume = json.load(f)

    current_year = cfg["start_year"]
    current_era_start = cfg["start_era"]
    res = []

    for idx, text in enumerate(volume['content']):
        current_year, current_era_start = parse_year(text, current_year, current_era_start, faction)

        char = cfg["char"]
        if source == "少帝纪第四":
            if current_year >= 260:
                char = "曹奂"
            elif current_year >= 254:
                char = "曹髦"
        elif source == "孙破虏讨逆传第一":
            if current_year >= 192:
                char = "孙策"

        importance = 1
        if len(text) > 120:
            importance = 2
        if any(k in text for k in ["薨", "崩", "践阼", "即皇帝位", "赤壁", "官渡", "禅位", "受禅", "定蜀", "益州平", "夷陵", "定荆州"]):
            importance = 3

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
