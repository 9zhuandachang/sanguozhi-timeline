import requests
from bs4 import BeautifulSoup
import time
import json
import os

BASE_URL = "https://www.gushiwen.cn"
BOOK_URL = f"{BASE_URL}/guwen/book.aspx?id=54"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

def crawl_book():
    print(f"Fetching book index from {BOOK_URL}...")
    response = requests.get(BOOK_URL, headers=HEADERS)
    response.encoding = 'utf-8'
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # The chapters are usually inside <div class="bookcont">
    chapters = []
    
    for a_tag in soup.find_all('a'):
        href = a_tag.get('href', '')
        if 'bookv_' in href:
            title = a_tag.text.strip()
            link = BASE_URL + href
            if not any(c['title'] == title for c in chapters):
                chapters.append({'title': title, 'link': link})
                
    print(f"Found {len(chapters)} chapters. Starting to crawl...")
    
    all_data = []
    
    for idx, chapter in enumerate(chapters):
        print(f"[{idx+1}/{len(chapters)}] Crawling {chapter['title']}...")
        chapter_res = requests.get(chapter['link'], headers=HEADERS)
        chapter_res.encoding = 'utf-8'
        chapter_soup = BeautifulSoup(chapter_res.text, 'html.parser')
        
        content_div = chapter_soup.find('div', class_='contson')
        if content_div:
            paragraphs = [p.text.strip() for p in content_div.find_all('p')]
            # if no p tags, it might just be text inside the div
            if not paragraphs:
                paragraphs = [line.strip() for line in content_div.text.split('\n') if line.strip()]
                
            all_data.append({
                "volume": chapter['title'],
                "content": paragraphs
            })
        else:
            print(f"Warning: Could not find content for {chapter['title']}")
            all_data.append({
                "volume": chapter['title'],
                "content": []
            })
            
        time.sleep(1) # Control request frequency
        
    os.makedirs('data', exist_ok=True)
    with open('data/sanguozhi.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
        
    print("Crawling complete! Data saved to data/sanguozhi.json")

if __name__ == "__main__":
    crawl_book()
