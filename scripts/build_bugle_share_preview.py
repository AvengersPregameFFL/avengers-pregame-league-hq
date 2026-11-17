#!/usr/bin/env python3
"""Generate the social sharing cover for The Pregame Bugle from the four published images."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "stories" / "bugle-share-cover.png"
ART = [
    ("JUGS KEEP ROLLING", ROOT / "stories/39D20C8D-2F51-4AB1-A895-1330C9CD7323.png"),
    ("SCHEDULE FRAUD", ROOT / "stories/BCC151EE-FEBF-4143-89F6-914C3F93CB4C.png"),
    ("LIFE ALERT!", ROOT / "stories/F24B5F75-848B-4041-B9F0-701439E2B309.png"),
    ("SHITTY MEETS SHITTIER", ROOT / "AFAA7B84-6BBF-4B0E-99C4-C27A95352134.png"),
]
W, H = 1200, 630
canvas = Image.new("RGB", (W, H), "#160f21")
d = ImageDraw.Draw(canvas)
bold = "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf"
titlefont = ImageFont.truetype(bold, 42)
subfont = ImageFont.truetype(bold, 21)
labelfont = ImageFont.truetype(bold, 25)
d.rectangle((0,0,W,77),fill="#f4dec1")
d.rectangle((0,0,W,8), fill="#181116")
d.text((22,17),"THE PREGAME BUGLE",fill="#ba1929",font=titlefont,stroke_width=1,stroke_fill="#171011")
d.text((886,29),"WEEK 11  |  2026",fill="#171011",font=subfont)
# Comic page gutters and colorful panel edges. Each of the four art images is present.
panel_positions=[(14,88,590,341),(610,88,1186,341),(14,353,590,616),(610,353,1186,616)]
for (label,path),rect in zip(ART,panel_positions):
    if not path.is_file():
        raise FileNotFoundError(path)
    x0,y0,x1,y1=rect
    d.rectangle((x0-5,y0-5,x1+5,y1+5),fill="#040308")
    art=Image.open(path).convert("RGB")
    # Cover the panel to provide four legible comic previews; published story itself stays uncropped.
    crop=ImageOps.fit(art,(x1-x0,y1-y0),method=Image.Resampling.LANCZOS,centering=(0.5,0.38))
    canvas.paste(crop,(x0,y0))
    d.rectangle((x0,y1-42,x1,y1),fill="#110d13")
    d.rectangle((x0,y1-43,x1,y1-39),fill="#ffd52a")
    d.text((x0+13,y1-35),label,fill="#fff1d5",font=labelfont)
canvas.save(DEST,"PNG",optimize=True)
print(f"Created {DEST} ({DEST.stat().st_size:,} bytes)")
