#!/usr/bin/env python3
"""
Sportsphere — App Store screenshot generator
=============================================
Generates 10 placeholder screenshots at iPhone 6.7" dimensions (1290x2796)
with the Sportsphere brand (navy #0A1628 bg + gold #F5C518 + orange #FF6B35).

These are PLACEHOLDERS. The user should replace them with real screenshots
captured from a development build on a real device (see store/SCREENSHOTS.md).
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os

# ─── Brand colors ────────────────────────────────────────────────────────────
NAVY    = (10, 22, 40)        # #0A1628
NAVY_2  = (16, 32, 56)        # elevated surface
GOLD    = (245, 197, 24)      # #F5C518
ORANGE  = (255, 107, 53)      # #FF6B35
WHITE   = (255, 255, 255)
WHITE_60 = (255, 255, 255, 153)
WHITE_30 = (255, 255, 255, 77)
WHITE_15 = (255, 255, 255, 38)

# ─── Dimensions ──────────────────────────────────────────────────────────────
W, H = 1290, 2796   # iPhone 6.7" (15 Pro Max)

# ─── Fonts ───────────────────────────────────────────────────────────────────
FONT_DIR_OUTFIT = "/home/z/my-project/work/sportsphere-v3/mobile/node_modules/@expo-google-fonts/outfit"
FONT_DIR_INTER  = "/home/z/my-project/work/sportsphere-v3/mobile/node_modules/@expo-google-fonts/inter"

def font(weight: str = "700Bold", size: int = 64):
    """Outfit font for headings, Inter for body."""
    path = f"{FONT_DIR_OUTFIT}/{weight}/Outfit_{weight}.ttf"
    return ImageFont.truetype(path, size)

def font_inter(weight: str = "600SemiBold", size: int = 48):
    path = f"{FONT_DIR_INTER}/{weight}/Inter_{weight}.ttf"
    return ImageFont.truetype(path, size)

# ─── Helpers ─────────────────────────────────────────────────────────────────
def draw_brand_block(draw, x, y, monogram_size=140):
    """Draw the Sportsphere 'S' monogram + wordmark."""
    # Gold circle
    draw.ellipse([x, y, x + monogram_size, y + monogram_size], fill=GOLD)
    # Black 'S' in the middle (we fake it with a smaller navy circle + a horizontal bar)
    inner = monogram_size // 3
    cx = x + monogram_size // 2
    cy = y + monogram_size // 2
    # draw.text with 'S' would need a font that has 'S' — Inter does
    f = font_inter("900Black", monogram_size // 2)
    try:
        draw.text((cx - inner // 2 - 4, cy - inner // 2 - 8), "S", font=f, fill=NAVY)
    except Exception:
        draw.rectangle([cx - inner//2, cy - inner//4, cx + inner//2, cy + inner//4], fill=NAVY)
    # Wordmark
    f_word = font("800ExtraBold", 56)
    draw.text((x + monogram_size + 28, y + 18), "SPORTSPHERE", font=f_word, fill=WHITE)
    # Tagline
    f_tag = font_inter("400Regular", 32)
    draw.text((x + monogram_size + 32, y + 84), "Where sports fans connect & compete", font=f_tag, fill=WHITE_60)
    return y + monogram_size

def draw_caption(draw, text, y=240):
    """Big caption at the top of the screen."""
    f = font("800ExtraBold", 88)
    draw.text((72, y), text, font=f, fill=WHITE)
    return y + 120

def draw_device_frame(img, draw):
    """Draw a faux phone screen frame (status bar + bottom safe area)."""
    # Status bar — time + indicators
    f_status = font_inter("600SemiBold", 36)
    draw.text((72, 50), "9:41", font=f_status, fill=WHITE)
    # battery, signal, wifi (simplified as small rects on right)
    draw.rectangle([W - 200, 70, W - 72, 90], fill=WHITE_60)
    draw.rectangle([W - 280, 70, W - 220, 90], fill=WHITE_60)
    draw.rectangle([W - 360, 70, W - 300, 90], fill=WHITE_60)

def draw_footer(draw, idx, total=10):
    """Bottom safe area with screen number."""
    f = font_inter("400Regular", 28)
    label = f"{idx:02d} / {total:02d}"
    bbox = draw.textbbox((0, 0), label, font=f)
    w = bbox[2] - bbox[0]
    draw.text(((W - w) // 2, H - 90), label, font=f, fill=WHITE_30)

def draw_card(draw, x, y, w, h, title, subtitle, accent=GOLD):
    """A faux card with title + subtitle (used to suggest feed items)."""
    # Card background
    draw.rounded_rectangle([x, y, x + w, y + h], radius=32, fill=NAVY_2)
    # Accent stripe
    draw.rounded_rectangle([x, y, x + 12, y + h], radius=6, fill=accent)
    # Title
    f_t = font("700Bold", 44)
    draw.text((x + 36, y + 24), title, font=f_t, fill=WHITE)
    # Subtitle
    f_s = font_inter("400Regular", 32)
    draw.text((x + 36, y + 84), subtitle, font=f_s, fill=WHITE_60)
    # Faux avatar
    draw.ellipse([x + 36, y + h - 60, x + 84, y + h - 12], fill=accent)
    draw.text((x + 100, y + h - 56), "@player_handle", font=font_inter("500Medium", 28), fill=WHITE_60)
    return y + h

def draw_tab_bar(draw, active_idx=0):
    """Faux bottom tab bar with 5 tabs."""
    bar_y = H - 240
    draw.rectangle([0, bar_y, W, H], fill=NAVY_2)
    # Top border
    draw.rectangle([0, bar_y, W, bar_y + 2], fill=WHITE_15)
    labels = ["Home", "Scores", "Create", "Activity", "Profile"]
    icons  = ["H", "S", "+", "A", "P"]
    tab_w = W // 5
    for i, (ic, lb) in enumerate(zip(icons, labels)):
        cx = i * tab_w + tab_w // 2
        is_active = (i == active_idx)
        color = GOLD if is_active else WHITE_60
        f_ic = font("800ExtraBold", 56)
        bbox = draw.textbbox((0, 0), ic, font=f_ic)
        ic_w = bbox[2] - bbox[0]
        draw.text((cx - ic_w // 2, bar_y + 36), ic, font=f_ic, fill=color)
        f_lb = font_inter("500Medium", 24)
        bbox = draw.textbbox((0, 0), lb, font=f_lb)
        lb_w = bbox[2] - bbox[0]
        draw.text((cx - lb_w // 2, bar_y + 116), lb, font=f_lb, fill=color)

def new_canvas():
    img = Image.new("RGB", (W, H), NAVY)
    return img, ImageDraw.Draw(img)

# ─── Screenshots ─────────────────────────────────────────────────────────────
def shot_01_login(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_brand_block(d, 72, y, monogram_size=180)
    y += 200
    y = draw_caption(d, "Sign in or")
    y = draw_caption(d, "create an account")
    # Email field
    d.rounded_rectangle([72, y, W - 72, y + 140], radius=24, fill=NAVY_2)
    d.text((108, y + 50), "Email or @handle", font=font_inter("400Regular", 40), fill=WHITE_60)
    y += 180
    # Password field
    d.rounded_rectangle([72, y, W - 72, y + 140], radius=24, fill=NAVY_2)
    d.text((108, y + 50), "Password", font=font_inter("400Regular", 40), fill=WHITE_60)
    y += 200
    # Sign-in button
    d.rounded_rectangle([72, y, W - 72, y + 160], radius=32, fill=GOLD)
    bbox = d.textbbox((0, 0), "Sign In", font=font("800ExtraBold", 48))
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, y + 50), "Sign In", font=font("800ExtraBold", 48), fill=NAVY)
    y += 240
    # Sub text
    f = font_inter("400Regular", 36)
    d.text((72, y), "New here?", font=f, fill=WHITE_60)
    d.text((280, y), "Create an account", font=font_inter("600SemiBold", 36), fill=ORANGE)
    draw_footer(d, 1)
    img.save(out)

def shot_02_feed(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_brand_block(d, 72, y, monogram_size=120)
    y += 60
    # Filter chips
    chips = ["For You", "Trending", "Spotlight"]
    cx = 72
    for i, c in enumerate(chips):
        is_active = (i == 0)
        f = font_inter("600SemiBold", 36)
        bbox = d.textbbox((0, 0), c, font=f)
        w = bbox[2] - bbox[0] + 64
        color = GOLD if is_active else WHITE_60
        bg = GOLD if is_active else NAVY_2
        text_color = NAVY if is_active else WHITE_60
        d.rounded_rectangle([cx, y, cx + w, y + 80], radius=40, fill=bg)
        d.text((cx + 32, y + 18), c, font=f, fill=text_color)
        cx += w + 16
    y += 120
    # Feed cards
    cards = [
        ("Lions clinch playoff spot", "@pro_scout · 2h", GOLD),
        ("Poll: MVP of the season?", "@analyst_dm · 4h", ORANGE),
        ("Highlight: 90th minute goal", "@journalist_kt · 6h", GOLD),
        ("Coach interview: rebuilding", "@head_coach · 9h", ORANGE),
    ]
    for title, sub, accent in cards:
        y = draw_card(d, 72, y, W - 144, 240, title, sub, accent)
        y += 24
    draw_tab_bar(d, active_idx=0)
    draw_footer(d, 2)
    img.save(out)

def shot_03_trending(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_caption(d, "Trending")
    y = draw_brand_block(d, 72, y, monogram_size=120)
    y += 60
    # Filter chips - Trending active
    chips = ["For You", "Trending", "Spotlight"]
    cx = 72
    for i, c in enumerate(chips):
        is_active = (i == 1)
        f = font_inter("600SemiBold", 36)
        bbox = d.textbbox((0, 0), c, font=f)
        w = bbox[2] - bbox[0] + 64
        bg = GOLD if is_active else NAVY_2
        text_color = NAVY if is_active else WHITE_60
        d.rounded_rectangle([cx, y, cx + w, y + 80], radius=40, fill=bg)
        d.text((cx + 32, y + 18), c, font=f, fill=text_color)
        cx += w + 16
    y += 120
    cards = [
        ("Breaking: trade deadline deal", "@journalist_kt · 1h", ORANGE),
        ("Hot take: rookie of the year", "@analyst_dm · 3h", GOLD),
        ("Viral: 60-yard field goal", "@creator_xyz · 5h", ORANGE),
        ("Poll: best defender", "@pro_scout · 7h", GOLD),
    ]
    for title, sub, accent in cards:
        y = draw_card(d, 72, y, W - 144, 240, title, sub, accent)
        y += 24
    draw_tab_bar(d, active_idx=0)
    draw_footer(d, 3)
    img.save(out)

def shot_04_scores(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_caption(d, "Scores")
    y = draw_brand_block(d, 72, y, monogram_size=120)
    y += 60
    # Category chips
    cats = ["All", "Team", "Indiv.", "Olympic"]
    cx = 72
    for i, c in enumerate(cats):
        is_active = (i == 0)
        f = font_inter("600SemiBold", 32)
        bbox = d.textbbox((0, 0), c, font=f)
        w = bbox[2] - bbox[0] + 48
        bg = GOLD if is_active else NAVY_2
        text_color = NAVY if is_active else WHITE_60
        d.rounded_rectangle([cx, y, cx + w, y + 72], radius=36, fill=bg)
        d.text((cx + 24, y + 16), c, font=f, fill=text_color)
        cx += w + 12
    y += 100
    # Sport grid 4x3
    sports = [
        ("Football", "F", GOLD),
        ("Basketball", "B", ORANGE),
        ("Tennis", "T", GOLD),
        ("Cricket", "C", ORANGE),
        ("Rugby", "R", GOLD),
        ("Hockey", "H", ORANGE),
        ("Volleyball", "V", GOLD),
        ("Handball", "Hb", ORANGE),
        ("Baseball", "Bb", GOLD),
        ("Golf", "G", ORANGE),
        ("Boxing", "Bx", GOLD),
        ("MMA", "M", ORANGE),
    ]
    grid_x = 72
    grid_y = y
    cell_w = (W - 144 - 36) // 3
    cell_h = 280
    for i, (name, ic, accent) in enumerate(sports):
        col = i % 3
        row = i // 3
        x = grid_x + col * (cell_w + 18)
        cy = grid_y + row * (cell_h + 18)
        d.rounded_rectangle([x, cy, x + cell_w, cy + cell_h], radius=28, fill=NAVY_2)
        # Icon circle
        d.ellipse([x + 32, cy + 36, x + 124, cy + 128], fill=accent)
        f_ic = font("800ExtraBold", 56)
        bbox = d.textbbox((0, 0), ic, font=f_ic)
        ic_w = bbox[2] - bbox[0]
        d.text((x + 78 - ic_w // 2, cy + 48), ic, font=f_ic, fill=NAVY)
        # Name
        d.text((x + 32, cy + 160), name, font=font("700Bold", 32), fill=WHITE)
        # Tag
        d.rounded_rectangle([x + 32, cy + 210, x + 130, cy + 248], radius=12, fill=accent)
        d.text((x + 44, cy + 217), "LIVE", font=font_inter("600SemiBold", 22), fill=NAVY)
    draw_tab_bar(d, active_idx=1)
    draw_footer(d, 4)
    img.save(out)

def shot_05_create(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_caption(d, "Create")
    y = draw_brand_block(d, 72, y, monogram_size=120)
    y += 80
    # Post composer
    d.rounded_rectangle([72, y, W - 72, y + 500], radius=32, fill=NAVY_2)
    # Faux avatar
    d.ellipse([108, y + 36, 108 + 96, y + 132], fill=GOLD)
    d.text((228, y + 60), "@your_handle", font=font_inter("600SemiBold", 36), fill=WHITE)
    # Composer text
    d.text((108, y + 180), "Share your take...", font=font_inter("400Regular", 44), fill=WHITE_60)
    # Hashtag chips
    d.rounded_rectangle([108, y + 280, 320, y + 340], radius=20, fill=NAVY)
    d.text((128, y + 290), "#football", font=font_inter("600SemiBold", 28), fill=GOLD)
    d.rounded_rectangle([340, y + 280, 540, y + 340], radius=20, fill=NAVY)
    d.text((360, y + 290), "#playoffs", font=font_inter("600SemiBold", 28), fill=GOLD)
    # Type chips
    types = [("Post", True), ("Prediction", False), ("Poll", False), ("Highlight", False)]
    cx = 108
    for label, active in types:
        f = font_inter("600SemiBold", 30)
        bbox = d.textbbox((0, 0), label, font=f)
        w = bbox[2] - bbox[0] + 48
        bg = GOLD if active else NAVY
        tc = NAVY if active else WHITE_60
        d.rounded_rectangle([cx, y + 400, cx + w, y + 456], radius=16, fill=bg)
        d.text((cx + 24, y + 408), label, font=f, fill=tc)
        cx += w + 12
    y += 580
    # Breaking news toggle
    d.rounded_rectangle([72, y, W - 72, y + 120], radius=24, fill=NAVY_2)
    d.text((108, y + 40), "Breaking news", font=font_inter("600SemiBold", 36), fill=WHITE)
    # Toggle on
    d.rounded_rectangle([W - 200, y + 32, W - 108, y + 88], radius=28, fill=ORANGE)
    d.ellipse([W - 156, y + 36, W - 116, y + 84], fill=WHITE)
    y += 160
    # Publish button
    d.rounded_rectangle([72, y, W - 72, y + 160], radius=32, fill=GOLD)
    bbox = d.textbbox((0, 0), "Publish", font=font("800ExtraBold", 48))
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, y + 50), "Publish", font=font("800ExtraBold", 48), fill=NAVY)
    draw_tab_bar(d, active_idx=2)
    draw_footer(d, 5)
    img.save(out)

def shot_06_activity(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_caption(d, "Activity")
    y = draw_brand_block(d, 72, y, monogram_size=120)
    y += 60
    # Unread badge
    d.ellipse([W - 200, y, W - 144, y + 56], fill=ORANGE)
    d.text((W - 184, y + 8), "5", font=font("800ExtraBold", 36), fill=NAVY)
    y += 100
    # Notifications
    notifs = [
        ("follow",   "@pro_scout started following you",       "2m",  GOLD),
        ("like",     "@analyst_dm liked your post",            "12m", ORANGE),
        ("comment",  "@journalist_kt replied to your comment", "1h",  GOLD),
        ("mention",  "@head_coach mentioned you",              "3h",  ORANGE),
        ("rank",     "You moved up 5 places — now rank #42",   "6h",  GOLD),
        ("verify",   "Your verification was approved",         "1d",  ORANGE),
    ]
    icon_map = {"follow": "+", "like": "♥", "comment": "C", "mention": "@", "rank": "▲", "verify": "✓"}
    for kind, text, ts, accent in notifs:
        d.rounded_rectangle([72, y, W - 72, y + 160], radius=24, fill=NAVY_2)
        # Icon
        d.ellipse([100, y + 36, 100 + 88, y + 124], fill=accent)
        ic = icon_map.get(kind, "?")
        f_ic = font("800ExtraBold", 44)
        bbox = d.textbbox((0, 0), ic, font=f_ic)
        ic_w = bbox[2] - bbox[0]
        d.text((144 - ic_w // 2, y + 46), ic, font=f_ic, fill=NAVY)
        # Text
        d.text((216, y + 36), text, font=font_inter("500Medium", 32), fill=WHITE)
        d.text((216, y + 86), ts, font=font_inter("400Regular", 26), fill=WHITE_60)
        y += 180
    draw_tab_bar(d, active_idx=3)
    draw_footer(d, 6)
    img.save(out)

def shot_07_profile(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    # Cover band
    d.rectangle([0, y, W, y + 280], fill=NAVY_2)
    # Avatar
    d.ellipse([72, y + 80, 72 + 200, y + 280], fill=GOLD)
    f_ic = font("800ExtraBold", 120)
    d.text((132, y + 120), "S", font=f_ic, fill=NAVY)
    # Name + handle
    d.text((300, y + 110), "Your Name", font=font("800ExtraBold", 56), fill=WHITE)
    d.text((300, y + 180), "@your_handle · Fan", font=font_inter("500Medium", 36), fill=WHITE_60)
    # Verified badge
    d.ellipse([W - 280, y + 120, W - 220, y + 180], fill=ORANGE)
    d.text((W - 264, y + 130), "✓", font=font("800ExtraBold", 36), fill=NAVY)
    y += 360
    # Bio
    d.text((72, y), "Die-hard fan. Armchair analyst.", font=font_inter("400Regular", 36), fill=WHITE)
    y += 80
    # Stats row
    stats = [("428", "Posts"), ("1.2K", "Followers"), ("312", "Following")]
    sx = 72
    for value, label in stats:
        d.text((sx, y), value, font=font("800ExtraBold", 56), fill=GOLD)
        d.text((sx, y + 80), label, font=font_inter("400Regular", 30), fill=WHITE_60)
        sx += 280
    y += 180
    # Sports chips
    d.text((72, y), "Favourite Sports", font=font("700Bold", 36), fill=WHITE)
    y += 60
    sports = ["Football", "Basketball", "Tennis"]
    cx = 72
    for s in sports:
        f = font_inter("600SemiBold", 32)
        bbox = d.textbbox((0, 0), s, font=f)
        w = bbox[2] - bbox[0] + 48
        d.rounded_rectangle([cx, y, cx + w, y + 72], radius=36, fill=NAVY_2)
        d.text((cx + 24, y + 16), s, font=f, fill=GOLD)
        cx += w + 12
    y += 120
    # Performance card CTA
    d.rounded_rectangle([72, y, W - 72, y + 200], radius=32, fill=NAVY_2)
    d.rectangle([72, y, 84, y + 200], fill=ORANGE)
    d.text((108, y + 32), "Performance Card", font=font("700Bold", 44), fill=WHITE)
    d.text((108, y + 92), "View tier, rank & form →", font=font_inter("400Regular", 32), fill=WHITE_60)
    y += 240
    # Logout button
    d.rounded_rectangle([72, y, W - 72, y + 140], radius=28, fill=NAVY_2)
    bbox = d.textbbox((0, 0), "Log out", font=font("700Bold", 40))
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, y + 44), "Log out", font=font("700Bold", 40), fill=ORANGE)
    draw_tab_bar(d, active_idx=4)
    draw_footer(d, 7)
    img.save(out)

def shot_08_leaderboard(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_caption(d, "Leaderboard")
    y = draw_brand_block(d, 72, y, monogram_size=120)
    y += 60
    # Dimension chips
    dims = ["Overall", "Form", "Improvement", "Consistency"]
    cx = 72
    for i, c in enumerate(dims):
        is_active = (i == 0)
        f = font_inter("600SemiBold", 30)
        bbox = d.textbbox((0, 0), c, font=f)
        w = bbox[2] - bbox[0] + 40
        bg = GOLD if is_active else NAVY_2
        tc = NAVY if is_active else WHITE_60
        d.rounded_rectangle([cx, y, cx + w, y + 68], radius=34, fill=bg)
        d.text((cx + 20, y + 16), c, font=f, fill=tc)
        cx += w + 10
    y += 100
    # Top 3 podium
    podium = [
        (1, "Alex M.",   "12,840 pts", "Diamond",   GOLD),
        (2, "Sam K.",    "11,560 pts", "Platinum",  WHITE),
        (3, "Jordan P.", "10,920 pts", "Platinum",  ORANGE),
    ]
    for rank, name, pts, tier, color in podium:
        d.rounded_rectangle([72, y, W - 72, y + 200], radius=32, fill=NAVY_2)
        # Rank pill
        d.ellipse([108, y + 40, 108 + 120, y + 160], fill=color)
        f_rank = font("800ExtraBold", 64)
        bbox = d.textbbox((0, 0), str(rank), font=f_rank)
        rw = bbox[2] - bbox[0]
        d.text((168 - rw // 2, y + 50), str(rank), font=f_rank, fill=NAVY)
        # Name + tier
        d.text((260, y + 40), name, font=font("700Bold", 44), fill=WHITE)
        d.rounded_rectangle([260, y + 100, 260 + 200, y + 144], radius=18, fill=color)
        d.text((280, y + 108), tier, font=font_inter("600SemiBold", 28), fill=NAVY)
        # Points
        d.text((W - 360, y + 50), pts, font=font("800ExtraBold", 36), fill=GOLD)
        # Rank movement
        d.text((W - 360, y + 100), "▲ 2", font=font_inter("600SemiBold", 28), fill=GOLD)
        y += 220
    # Other ranks
    others = [
        (4,  "Taylor R.",  "10,210 pts", "Gold"),
        (5,  "Morgan L.",  "9,840 pts",  "Gold"),
        (6,  "Casey B.",   "9,420 pts",  "Gold"),
        (7,  "Riley D.",   "8,990 pts",  "Silver"),
        (8,  "Quinn A.",   "8,560 pts",  "Silver"),
    ]
    for rank, name, pts, tier in others:
        d.rounded_rectangle([72, y, W - 72, y + 140], radius=24, fill=NAVY_2)
        d.text((108, y + 36), f"#{rank}", font=font("800ExtraBold", 36), fill=WHITE_60)
        d.text((260, y + 36), name, font=font("600SemiBold", 36), fill=WHITE)
        d.text((W - 360, y + 40), pts, font=font_inter("600SemiBold", 30), fill=WHITE_60)
        y += 160
    draw_footer(d, 8)
    img.save(out)

def shot_09_player_detail(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    # Player header
    d.rectangle([0, y, W, y + 320], fill=NAVY_2)
    d.ellipse([72, y + 80, 72 + 180, y + 260], fill=GOLD)
    f_ic = font("800ExtraBold", 100)
    d.text((124, y + 110), "P", font=f_ic, fill=NAVY)
    d.text((280, y + 100), "Alex M.", font=font("800ExtraBold", 56), fill=WHITE)
    d.text((280, y + 170), "@pro_player · Football", font=font_inter("500Medium", 32), fill=WHITE_60)
    # Verified + Pro
    d.ellipse([W - 360, y + 100, W - 300, y + 160], fill=ORANGE)
    d.text((W - 344, y + 110), "✓", font=font("800ExtraBold", 32), fill=NAVY)
    d.rounded_rectangle([W - 280, y + 100, W - 108, y + 160], radius=18, fill=GOLD)
    d.text((W - 264, y + 110), "PRO", font=font("800ExtraBold", 28), fill=NAVY)
    # Follow button
    d.rounded_rectangle([W - 280, y + 200, W - 108, y + 270], radius=28, fill=GOLD)
    d.text((W - 240, y + 215), "Following", font=font("700Bold", 32), fill=NAVY)
    y += 380
    # Performance card
    d.text((72, y), "Performance Card", font=font("700Bold", 44), fill=WHITE)
    y += 80
    d.rounded_rectangle([72, y, W - 72, y + 360], radius=32, fill=NAVY_2)
    d.rectangle([72, y, 84, y + 360], fill=GOLD)
    # Tier + rank
    d.text((108, y + 36), "Tier", font=font_inter("500Medium", 30), fill=WHITE_60)
    d.text((108, y + 80), "Diamond", font=font("800ExtraBold", 56), fill=GOLD)
    d.text((108, y + 170), "Global Rank", font=font_inter("500Medium", 30), fill=WHITE_60)
    d.text((108, y + 210), "#1", font=font("800ExtraBold", 72), fill=WHITE)
    # Points
    d.text((W - 460, y + 36), "Total Points", font=font_inter("500Medium", 30), fill=WHITE_60)
    d.text((W - 460, y + 80), "12,840", font=font("800ExtraBold", 56), fill=GOLD)
    # Form / Consistency / Improvement
    d.text((W - 460, y + 170), "Form", font=font_inter("500Medium", 28), fill=WHITE_60)
    d.text((W - 460, y + 210), "94", font=font("800ExtraBold", 56), fill=WHITE)
    d.text((W - 260, y + 170), "Cons.", font=font_inter("500Medium", 28), fill=WHITE_60)
    d.text((W - 260, y + 210), "88", font=font("800ExtraBold", 56), fill=WHITE)
    d.text((W - 460, y + 290), "Percentile: 99th", font=font_inter("500Medium", 26), fill=WHITE_60)
    y += 400
    # Recent events ledger
    d.text((72, y), "Recent Events", font=font("700Bold", 36), fill=WHITE)
    y += 60
    events = [
        ("Match vs Tigers", "+120 pts", "2h ago",   GOLD),
        ("Verified by coach", "+50 pts", "1d ago",  ORANGE),
        ("Match vs Lions",   "+95 pts",  "3d ago",  GOLD),
        ("Verified by scout","+50 pts",  "5d ago",  ORANGE),
    ]
    for title, pts, ts, accent in events:
        d.rounded_rectangle([72, y, W - 72, y + 120], radius=20, fill=NAVY_2)
        d.rectangle([72, y, 80, y + 120], fill=accent)
        d.text((108, y + 24), title, font=font_inter("600SemiBold", 32), fill=WHITE)
        d.text((108, y + 72), ts, font=font_inter("400Regular", 26), fill=WHITE_60)
        d.text((W - 280, y + 36), pts, font=font("800ExtraBold", 32), fill=accent)
        y += 140
    draw_footer(d, 9)
    img.save(out)

def shot_10_register(out):
    img, d = new_canvas()
    draw_device_frame(img, d)
    y = 240
    y = draw_brand_block(d, 72, y, monogram_size=180)
    y += 200
    y = draw_caption(d, "Create your")
    y = draw_caption(d, "free account")
    # Form fields
    fields = ["Full name", "Email", "@handle", "Password"]
    for label in fields:
        d.rounded_rectangle([72, y, W - 72, y + 140], radius=24, fill=NAVY_2)
        d.text((108, y + 50), label, font=font_inter("400Regular", 40), fill=WHITE_60)
        y += 180
    # Sport picker
    d.text((72, y), "Pick 1–3 favourite sports", font=font("700Bold", 40), fill=WHITE)
    y += 80
    sports = [("Football", True), ("Basketball", True), ("Tennis", True), ("Cricket", False), ("Rugby", False), ("Hockey", False)]
    cx = 72
    cy = y
    for i, (s, selected) in enumerate(sports):
        col = i % 3
        row = i // 3
        x = 72 + col * ((W - 144 - 24) // 3 + 12)
        sy = y + row * 100
        bg = GOLD if selected else NAVY_2
        tc = NAVY if selected else WHITE_60
        d.rounded_rectangle([x, sy, x + (W - 144 - 24) // 3, sy + 80], radius=40, fill=bg)
        f = font_inter("600SemiBold", 32)
        bbox = d.textbbox((0, 0), s, font=f)
        sw = bbox[2] - bbox[0]
        cell_w = (W - 144 - 24) // 3
        d.text((x + (cell_w - sw) // 2, sy + 20), s, font=f, fill=tc)
    y += 240
    # Create button
    d.rounded_rectangle([72, y, W - 72, y + 160], radius=32, fill=GOLD)
    bbox = d.textbbox((0, 0), "Create Account", font=font("800ExtraBold", 44))
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, y + 50), "Create Account", font=font("800ExtraBold", 44), fill=NAVY)
    draw_footer(d, 10)
    img.save(out)

# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    out_dir = Path("/home/z/my-project/work/sportsphere-v3/mobile/store/screenshots/ios/iphone-67")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Android phone (1080x1920 — same content, smaller)
    android_dir = Path("/home/z/my-project/work/sportsphere-v3/mobile/store/screenshots/android/phone")
    android_dir.mkdir(parents=True, exist_ok=True)

    shots = [
        ("01-Login.png",          shot_01_login),
        ("02-Feed-For-You.png",   shot_02_feed),
        ("03-Feed-Trending.png",  shot_03_trending),
        ("04-Scores.png",         shot_04_scores),
        ("05-Create.png",         shot_05_create),
        ("06-Activity.png",       shot_06_activity),
        ("07-Profile.png",        shot_07_profile),
        ("08-Leaderboard.png",    shot_08_leaderboard),
        ("09-Player-Detail.png",  shot_09_player_detail),
        ("10-Register.png",       shot_10_register),
    ]

    for filename, fn in shots:
        ios_path = out_dir / filename
        fn(str(ios_path))
        # Resize for Android (1080x1920)
        img = Image.open(ios_path)
        android_img = img.resize((1080, 1920), Image.LANCZOS)
        android_img.save(android_dir / filename)
        print(f"  ✓ {filename} (iOS 1290x2796 + Android 1080x1920)")

    print(f"\n✅ Generated {len(shots)} screenshots in 2 sizes (iOS 6.7\" + Android phone)")
    print(f"   iOS:     {out_dir}")
    print(f"   Android: {android_dir}")

if __name__ == "__main__":
    main()
