#!/usr/bin/env python3
"""Synchronize League HQ headlines and social cover metadata from published Bugle."""
from pathlib import Path
from html import escape, unescape
import re
ROOT = Path(__file__).resolve().parents[1]
def one(pattern, value):
    m = re.search(pattern, value, re.S)
    if not m:
        raise ValueError("Missing required Bugle field: " + pattern)
    return m.group(1)
def issue():
    src = (ROOT / "stories/index.html").read_text()
    grid = one(r'<section class="comic-grid"[^>]*>(.*?)</section>', src)
    cards = []
    for item in re.findall(r'<article\b.*?</article>', grid, re.S):
        card = dict(url=one(r'<a href="\./([^"]+)"', item),
                    image=one(r'<img src="\./([^"]+)"', item),
                    number=one(r'STORY NO\. (\d+)', item),
                    title=unescape(one(r'<strong class="story-title">([^<]+)</strong>', item)),
                    sub=unescape(one(r'<span class="story-sub">([^<]+)</span>', item)))
        for field in ("url", "image"):
            if not (ROOT / "stories" / card[field]).is_file():
                raise FileNotFoundError(card[field])
        cards.append(card)
    if len(cards) != 4 or len({c["number"] for c in cards}) != 4:
        raise ValueError("Expected exactly four unique stories")
    return dict(cards=cards, label=unescape(one(r'<div class="issue-bar">.*?<strong>(.*?)</strong>', src)), serial=one(r'<div class="mast-top">.*?<span>ISSUE ([^<]+)</span>',src), date=one(r'<div class="issue-bar">.*?<strong>.*?</strong><span>([^<]+)</span>',src))
def sync():
    d=issue()
    cards=d["cards"]
    path=ROOT/"index.html"
    src=path.read_text()
    panel=[]
    rows=[]
    for i,c in enumerate(cards):
        title,sub=escape(c["title"]),escape(c["sub"])
        url,image,number=c["url"],c["image"],c["number"]
        panel.append(f'<a class="bugle-newstand-card{" bugle-newstand-lead" if i==0 else ""}" href="./stories/{url}" aria-label="Read {title}"><div class="bugle-newstand-art"><img src="./stories/{image}" alt="{title} comic artwork" loading="{"eager" if i==0 else "lazy"}"><span>{"THE MAIN EVENT · " if i==0 else ""}NO. {number}</span></div><div class="bugle-newstand-caption"><h3>{title}</h3><p>{sub}</p><b>READ STORY →</b></div></a>')
        top_label = '<span class="bugle-top-story-label">TOP STORY</span>' if i==0 else ""
        rows.append(f'<div class="bugle-story-list-entry{" bugle-top-story-entry" if i==0 else ""}" data-story-number="{int(number)}"><a href="./stories/{url}"><span class="bugle-serial">NO. {number}</span>{top_label}<strong class="bugle-top-story-title">{title}</strong><img src="./stories/{image}" alt="{title} comic artwork" loading="lazy" style="display:block;width:100%;height:auto;max-height:350px;object-fit:contain;margin:8px 0;border:2px solid #171717"><small class="bugle-top-story-score">{sub}</small></a><button class="bugle-share-list-button" type="button" data-bugle-story-url="./stories/{url}" data-bugle-story-title="{title}">SHARE STORY ↗</button></div>')
    def replace(pattern, fn):
        nonlocal src
        src,n=re.subn(pattern,fn,src,count=1,flags=re.S)
        if n!=1: raise ValueError("Missing HQ target: "+pattern)
    replace(r'(<div class="bugle-newstand-grid">).*?(</div></div><div class="bugle-notify-signup")',lambda m:m[1]+"\n"+"\n".join(panel)+"\n"+m[2])
    replace(r'(<nav class="hp-top-stories-list"[^>]*>).*?</nav>',lambda m:m[1]+"".join(rows)+"</nav>")
    replace(r'(<header class="bugle-newstand-head"><div><small>).*?(</small>.*?<p>).*?(</p>)',lambda m:m[1]+"AVENGERS PREGAME FFL · ISSUE "+escape(d["serial"])+m[2]+escape(d["label"])+m[3])
    replace(r'(<div class="hp-story-top"><span>LEAGUE HEADLINES</span><span>).*?(</span>)',lambda m:m[1]+"04 STORIES · "+escape(d["label"])+m[2])
    replace(r'(<div class="bugle-notify-signup"[^>]*>.*?<p>).*?(</p>)',lambda m:m[1]+"Four featured stories: "+" · ".join(escape(c["title"]) for c in cards)+m[2])
    replace(r'(<div class="bugle-full-issue-action"[^>]*><strong[^>]*>).*?(</strong><p[^>]*>).*?(</p><button[^>]*>).*?(</button>)',lambda m:m[1]+"ISSUE "+escape(d["serial"])+" · "+escape(d["label"])+m[2]+"Read the four latest stories, with verified results and upcoming matchups."+m[3]+"SHARE ALL FOUR STORIES ↗"+m[4])
    replace(r'(<div class="bugle-dateline"><span>[^<]*</span><span>).*?(</span>)',lambda m:m[1]+escape(d["label"])+" · ISSUE "+escape(d["serial"])+" · STORIES NO. "+cards[0]["number"]+"–"+cards[-1]["number"]+" · UPDATED "+escape(d["date"])+m[2])
    replace(r'SHARE THE FULL WEEK \d+ BUGLE',lambda m:"SHARE THE FULL BUGLE") if re.search(r'SHARE THE FULL WEEK \d+ BUGLE',src) else None
    replace(r'const BUGLE_SHARE_TEXT="[^"]*";',lambda m:'const BUGLE_SHARE_TEXT="Alright, fuckers. Another week, another Pregame Bugle. Issue '+d["serial"]+'. '+d["label"]+'.";')
    src=re.sub(r"url.searchParams.set\('issue','[^']*'\)",lambda m:"url.searchParams.set('issue','"+d["serial"]+"-"+cards[-1]["number"]+"')",src,count=1)
    path.write_text(src)
if __name__=="__main__":
    sync()
