#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Super Pipeline — Single-file script for OCR + M2 detections + structured extraction

What it does
- Accepts input as a PDF or an image (scanner or mobile photo).
- For scanner: no special preprocessing required.
- For mobile: optional light preprocessing to help OCR (enable with --mobile).
- Runs OCR (Tesseract) to collect tokens with bounding boxes.
- Runs light-weight detections (M2-like):
  - Checkboxes (square detection, filled vs empty, nearest label yes/no)
  - Signatures (anchor-aware + scribble heuristic)
  - Stamps (red/blue roundish blobs; OCR inside for text)
- Extracts key fields using anchor-based logic with bounded windows, near-text fallbacks, and dedupes.
- Merges across pages and writes a final JSON with complete details.
- Saves per-page overlays with the detected data (checkboxes, signatures, stamps) drawn as boxes.

Outputs
- outdir/docs/<docname>_structured.json     (per-document full JSON with pages, provenance-lite, and extracted fields)
- outdir/overlays/<docname>_p<page>.png     (per-page overlay PNGs with boxes and labels)
- outdir/pages/<docname>_p<page>_ocr.json   (per-page OCR items JSON)
- outdir/manifest.json                      (high-level manifest with all documents processed)

Requirements
- Python 3.8+
- System Tesseract OCR installed and in PATH (https://tesseract-ocr.github.io/)
- pip install:
    pip install opencv-python pillow pytesseract pdf2image numpy

For PDF rendering on some systems you may need Poppler:
- macOS: brew install poppler
- Ubuntu/Debian: sudo apt-get install poppler-utils
On Windows, download Poppler binaries and pass --poppler-path to this script.

Usage
  python super_pipeline.py /path/to/input.pdf --outdir ./sp_output
  python super_pipeline.py /path/to/photo.jpg --outdir ./sp_output --mobile
  python super_pipeline.py /path/to/folder --outdir ./sp_output --mobile

Notes
- This script uses robust heuristics aligned to the notebook logic shared earlier (anchors, bounded windows, near-text fallbacks).
- If your mobile photos are very skewed or low contrast, add --mobile to enable helpful denoise/threshold.
"""

import os, sys, re, json, math, time, unicodedata, argparse, io, traceback
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple, Optional

import numpy as np
from PIL import Image, ImageOps
import cv2

try:
    import pytesseract
    from pytesseract import Output as TesseractOutput
except Exception as e:
    print("ERROR: pytesseract is required. pip install pytesseract")
    raise

# PDF support (optional)
try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except Exception:
    PDF2IMAGE_AVAILABLE = False

# --------------- Utils & Normalization ---------------

DEVANAGARI_DIGITS_TBL = str.maketrans("०१२३४५६७८९", "0123456789")

def normalize(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.translate(DEVANAGARI_DIGITS_TBL)
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("–", "-").replace("—", "-") \
         .replace("’", "'").replace("‘", "'") \
         .replace("”", '"').replace("“", '"')
    s = s.lower()
    s = re.sub(r"[\u200b\u200c\u200d]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def ensure_dir(p: str):
    os.makedirs(p, exist_ok=True)

def quad_from_xywh(x: int, y: int, w: int, h: int) -> List[List[int]]:
    return [[int(x), int(y)], [int(x+w), int(y)], [int(x+w), int(y+h)], [int(x), int(y+h)]]

def rect_from_bbox(bbox: List[List[float]]) -> Tuple[int,int,int,int]:
    xs = [pt[0] for pt in bbox]; ys = [pt[1] for pt in bbox]
    return int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))

# --------------- IO: Load images/pages ---------------

def load_images_from_path(path: str, poppler_path: Optional[str]=None) -> List[Tuple[Image.Image, str]]:
    """
    Returns list of (PIL.Image, page_tag). page_tag is used in filenames like _p1, _p2...
    If path is image -> single image. If PDF -> per page images. If dir -> all files in dir (sorted).
    """
    out = []
    if os.path.isdir(path):
        files = sorted([
            os.path.join(path, f) for f in os.listdir(path)
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".pdf"))
        ])
        for f in files:
            out.extend(load_images_from_path(f, poppler_path))
        return out

    # Single file
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        if not PDF2IMAGE_AVAILABLE:
            raise RuntimeError("pdf2image not available. Install with: pip install pdf2image and install Poppler.")
        imgs = convert_from_path(path, dpi=300, poppler_path=poppler_path)
        for i, im in enumerate(imgs, start=1):
            out.append((im.convert("RGB"), f"p{i}"))
    else:
        im = Image.open(path).convert("RGB")
        out.append((im, "p1"))
    return out

# --------------- Optional mobile preprocessing ---------------

def preprocess_mobile_image(pil_img: Image.Image) -> Image.Image:
    """
    Light preprocessing for mobile photos: auto-contrast, mild denoise, adaptive threshold blend.
    """
    img = np.array(pil_img)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # Auto-contrast on luminance
    yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
    yuv[:,:,0] = cv2.equalizeHist(yuv[:,:,0])
    img = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)

    # Mild denoise
    img = cv2.fastNlMeansDenoisingColored(img, None, 5, 5, 7, 21)

    # Blend with adaptive threshold to sharpen text
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY, 35, 11)
    thr_rgb = cv2.cvtColor(thr, cv2.COLOR_GRAY2BGR)
    blend = cv2.addWeighted(img, 0.7, thr_rgb, 0.3, 0)

    return Image.fromarray(cv2.cvtColor(blend, cv2.COLOR_BGR2RGB))

# --------------- OCR ---------------

def ocr_items_from_image(pil_img: Image.Image, lang: str="eng") -> List[Dict[str,Any]]:
    """
    Use Tesseract to get word-level boxes and confidences, return as items: {text, confidence, bbox}
    """
    img = pil_img
    # Upscale slightly to help OCR on small text
    w, h = img.size
    scale = 1.25 if max(w, h) < 2000 else 1.0
    if scale != 1.0:
        img = img.resize((int(w*scale), int(h*scale)), Image.BILINEAR)

    cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    data = pytesseract.image_to_data(cv, lang=lang, output_type=TesseractOutput.DICT)

    items = []
    n = len(data.get("text", []))
    for i in range(n):
        txt = data["text"][i] or ""
        txt = txt.strip()
        if not txt:
            continue
        conf = data.get("conf", [])[i]
        try:
            conf = float(conf) if conf is not None else None
        except:
            conf = None
        x, y, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
        if w <= 0 or h <= 0:
            continue
        items.append({
            "text": txt,
            "confidence": conf,
            "bbox": quad_from_xywh(x, y, w, h)
        })

    return items

# --------------- M2-like detections: checkboxes, signatures, stamps ---------------

def detect_checkboxes(pil_img: Image.Image, ocr_items: List[Dict[str,Any]]) -> List[Dict[str,Any]]:
    """
    Detect small squares; compute fill ratio; map nearest 'yes'/'no' label from OCR.
    """
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3,3), 0)
    edges = cv2.Canny(blur, 80, 160)
    cnts, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    h, w = gray.shape[:2]

    # Build quick index of OCR words for label assignment
    words = [(rect_from_bbox(it["bbox"]), normalize(it["text"])) for it in ocr_items]

    for c in cnts:
        eps = 0.04 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, eps, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            x, y, bw, bh = cv2.boundingRect(approx)
            if bw < 10 or bh < 10 or bw > 100 or bh > 100:
                continue
            ar = bw / float(bh)
            if ar < 0.7 or ar > 1.3:
                continue
            # fill ratio
            roi = gray[y:y+bh, x:x+bw]
            if roi.size == 0:
                continue
            thr = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
            fill_ratio = float(cv2.countNonZero(thr)) / float(bw*bh + 1e-6)

            # nearest label within proximity
            cx, cy = x + bw//2, y + bh//2
            near_label = None
            min_d = 1e9
            for (rx1, ry1, rx2, ry2), txt in words:
                if not txt:
                    continue
                # only consider words within small radius
                mx, my = (rx1+rx2)//2, (ry1+ry2)//2
                d = (mx-cx)**2 + (my-cy)**2
                if d < min_d and d < (max(w,h)*0.1)**2:
                    near_label = txt
                    min_d = d

            boxes.append({
                "bbox": quad_from_xywh(x,y,bw,bh),
                "filled": True if fill_ratio > 0.25 else False,
                "fill_ratio": float(fill_ratio),
                "near_label": near_label
            })

    # Merge overlapping duplicates (pick highest fill)
    merged = []
    for b in boxes:
        rx1, ry1, rx2, ry2 = rect_from_bbox(b["bbox"])
        keep = True
        for m in merged:
            mx1, my1, mx2, my2 = rect_from_bbox(m["bbox"])
            inter_x1, inter_y1 = max(rx1, mx1), max(ry1, my1)
            inter_x2, inter_y2 = min(rx2, mx2), min(ry2, my2)
            iw, ih = max(0, inter_x2-inter_x1), max(0, inter_y2-inter_y1)
            if iw*ih > 0.3*min((rx2-rx1)*(ry2-ry1), (mx2-mx1)*(my2-my1)):
                # overlap -> keep the one with higher fill_ratio
                if b["fill_ratio"] > m["fill_ratio"]:
                    m.update(b)
                keep = False
                break
        if keep:
            merged.append(b)
    return merged

def detect_signatures(pil_img: Image.Image, ocr_items: List[Dict[str,Any]]) -> List[Dict[str,Any]]:
    """
    Heuristic: search around words containing 'signature' or bottom quarter scribbles.
    """
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]

    cand_regions = []

    # Anchor near 'signature' word(s)
    for it in ocr_items:
        t = normalize(it.get("text",""))
        if "signature" in t or "thumb" in t:
            x1,y1,x2,y2 = rect_from_bbox(it["bbox"])
            # region to the right/below
            rx1 = min(w-1, x2 + 10)
            ry1 = max(0, y1 - 40)
            rx2 = min(w-1, x2 + int(0.25*w))
            ry2 = min(h-1, y2 + 80)
            cand_regions.append((rx1,ry1,rx2,ry2))

    # Bottom quarter fallback
    cand_regions.append((int(0.1*w), int(0.75*h), int(0.9*w), int(0.98*h)))

    sigs = []
    for (x1,y1,x2,y2) in cand_regions:
        if x2<=x1 or y2<=y1: continue
        roi = gray[y1:y2, x1:x2]
        if roi.size == 0:
            continue
        # High-frequency stroke detection by edge density
        edges = cv2.Canny(roi, 80, 180)
        dens = float(cv2.countNonZero(edges)) / float(roi.size)
        if dens > 0.08:  # heuristic
            # bounding rect of non-zero edges
            ys, xs = np.where(edges>0)
            if len(xs)>10 and len(ys)>10:
                bx1, by1 = x1 + int(xs.min()), y1 + int(ys.min())
                bx2, by2 = x1 + int(xs.max()), y1 + int(ys.max())
                # pad slightly
                pad = 6
                bx1, by1 = max(0, bx1-pad), max(0, by1-pad)
                bx2, by2 = min(w-1, bx2+pad), min(h-1, by2+pad)
                sigs.append({"bbox": quad_from_xywh(bx1,by1,bx2-bx1,by2-by1), "fill_ratio": dens})

    # Dedup signature boxes
    merged = []
    for s in sigs:
        rx1, ry1, rx2, ry2 = rect_from_bbox(s["bbox"])
        keep = True
        for m in merged:
            mx1, my1, mx2, my2 = rect_from_bbox(m["bbox"])
            inter_x1, inter_y1 = max(rx1, mx1), max(ry1, my1)
            inter_x2, inter_y2 = min(rx2, mx2), min(ry2, my2)
            iw, ih = max(0, inter_x2-inter_x1), max(0, inter_y2-inter_y1)
            if iw*ih > 0.2*min((rx2-rx1)*(ry2-ry1), (mx2-mx1)*(my2-my1)):
                if s["fill_ratio"] > m["fill_ratio"]:
                    m.update(s)
                keep = False
                break
        if keep:
            merged.append(s)
    return merged

def detect_stamps(pil_img: Image.Image, ocr_lang: str="eng") -> List[Dict[str,Any]]:
    """
    Detect red/blue stamps via HSV masks and circularity, then OCR inside.
    """
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, w = img.shape[:2]

    # Red ranges (two ranges in HSV)
    lower_red1 = np.array([0, 80, 80]); upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 80, 80]); upper_red2 = np.array([180, 255, 255])
    mask_red = cv2.inRange(hsv, lower_red1, upper_red1) | cv2.inRange(hsv, lower_red2, upper_red2)

    # Blue range
    lower_blue = np.array([90, 80, 80]); upper_blue = np.array([130, 255, 255])
    mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)

    stamps = []
    for color_name, mask in [("red", mask_red), ("blue", mask_blue)]:
        # morphology to clean
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
        mask_clean = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        cnts, _ = cv2.findContours(mask_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            area = cv2.contourArea(c)
            if area < 800:  # skip small blobs
                continue
            x,y,bw,bh = cv2.boundingRect(c)
            circ = 0.0
            per = cv2.arcLength(c, True)
            if per > 0:
                circ = 4*math.pi*area / (per*per)
            if circ < 0.2:  # not too elongated
                continue
            roi = img[y:y+bh, x:x+bw]
            roi_rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
            # quick OCR on stamp
            try:
                d = pytesseract.image_to_data(roi_rgb, lang=ocr_lang, output_type=TesseractOutput.DICT)
                words = [d["text"][i] for i in range(len(d["text"])) if (d["text"][i] or "").strip()]
                confs = [float(d["conf"][i]) for i in range(len(d["text"])) if (d["text"][i] or "").strip() and d["conf"][i] != '-1']
                text = " ".join(words)[:200]
                avg_conf = float(np.mean(confs)) if confs else 0.0
            except Exception:
                text, avg_conf = "", 0.0
            stamps.append({
                "color": color_name,
                "bbox": quad_from_xywh(x,y,bw,bh),
                "best": {"text": text, "avg_conf": avg_conf}
            })
    return stamps

# --------------- Overlay rendering ---------------

def draw_overlays(pil_img: Image.Image, m2_page: Dict[str,Any]) -> Image.Image:
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    # Checkboxes
    for b in m2_page.get("checkboxes", []):
        x1,y1,x2,y2 = rect_from_bbox(b["bbox"])
        color = (0,200,0) if b.get("filled") else (0,140,255)
        cv2.rectangle(img, (x1,y1), (x2,y2), color, 2)
        label = f"CHK:{'Y' if b.get('filled') else 'N'}"
        if b.get("near_label"):
            label += f" [{b['near_label'][:10]}]"
        cv2.putText(img, label, (x1, max(0,y1-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)
    # Signatures
    for s in m2_page.get("signatures", []):
        x1,y1,x2,y2 = rect_from_bbox(s["bbox"])
        cv2.rectangle(img, (x1,y1), (x2,y2), (180, 0, 180), 2)
        cv2.putText(img, "SIGN", (x1, max(0,y1-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180,0,180), 1, cv2.LINE_AA)
    # Stamps
    for st in m2_page.get("stamps", []):
        x1,y1,x2,y2 = rect_from_bbox(st["bbox"])
        color = (0,0,220) if st.get("color")=="red" else (220,0,0)
        cv2.rectangle(img, (x1,y1), (x2,y2), color, 2)
        txt = (st.get("best") or {}).get("text","")[:20]
        cv2.putText(img, f"STAMP {st.get('color','')}: {txt}", (x1, max(0,y1-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)

    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

# --------------- Extraction (anchors + parsing) ---------------

ANCHORS = {
       # OLD: "claimant_name": {"labels":[r"\b1\.\s*name of the claimant", r"\bname of the claimant\(s\)"]},
    "claimant_name": {"labels":[r"name\(s\)\s*of\s*holder\(s\)", r"sh\.\s*nek\s*ram"]}, # Using the actual name as a fallback

    # The document doesn't have a separate spouse field, it's part of dependents. We can leave this.
    "spouse_name": {"labels":[r"name\s*of\s*spouse"]}, # This will likely fail, which is OK.

    # This label is for dependents, not father/mother in your doc.
    # Let's target the correct label for Father/Mother
    "father_mother": {"labels":[r"name\s*of\s*father\s*/\s*mother"]},

    # New field for dependents from your document
    "dependents": {"labels":[r"name\s*of\s*dependents"]},

    "address": {"labels":[r"\b4\.\s*address\b"]},
    "village": {"labels":[r"village\s*/\s*gram\s*sabha"]}, # Making it more flexible
    "gram_panchayat": {"labels":[r"gram\s*panchayat\b"]},
    "tehsil_taluka": {"labels":[r"tehsil\s*/\s*taluka"]},
    "district": {"labels":[r"\b8\.\s*district\b"]},

    # These don't exist in your doc, so they can be removed or left to fail safely
    "scheduled_tribe": {"labels":[r"scheduled\s*tribe"]},
    "otfd": {"labels":[r"other\s*traditional\s*forest\s*dweller"]},
    
    "other_members": {"labels":[r"\b10\.\s*name of other members\b", r"\bname of other members\b"]},
}

STOP_LABEL_PAT = re.compile(
    r"\b("
    r"name of|address|village|gram\s*panchayat|gp|tehs?il|taluka|district|"
    r"scheduled|other\s+traditional|nature of claim|evidence|extent of|"
    r"habitation|self[-\s]*cultivation|signature|thumb impression"
    r")\b", re.I
)

def group_by_lines(items: List[Dict[str,Any]], page_h: int, y_tol_ratio: float = 0.02):
    if not items: return []
    y_tol = max(10.0, int(page_h * y_tol_ratio))
    def mid_y(it):
        x1,y1,x2,y2 = rect_from_bbox(it["bbox"])
        return int(0.5*(y1+y2))
    lines = []
    for it in sorted(items, key=mid_y):
        y = mid_y(it); placed=False
        for ln in lines:
            if abs(ln["y"] - y) <= y_tol:
                ln["items"].append(it)
                ln["y_vals"].append(y)
                ln["y"] = int(np.median(ln["y_vals"]))
                placed=True; break
        if not placed:
            lines.append({"y": y, "y_vals":[y], "items":[it]})
    for ln in lines:
        ln["items"].sort(key=lambda it: rect_from_bbox(it["bbox"])[0])
    return lines

def join_items_text(items: List[Dict[str,Any]]) -> str:
    return " ".join([it.get("text","") for it in items]).strip()

def find_anchor_item(items: List[Dict[str,Any]], patterns: List[str]) -> Optional[Dict[str,Any]]:
    for it in items:
        t = normalize(it.get("text",""))
        for pat in patterns:
            if re.search(pat, t, flags=re.I):
                return it
    return None

def collect_right_bounded(items, anchor_rect, page_w, page_h, x_gap=6, right_ratio=0.45, include_next_line=True):
    ax1,ay1,ax2,ay2 = anchor_rect
    lines = group_by_lines(items, page_h)
    am = int(0.5*(ay1+ay2))
    idx=None; best=1e9
    for i,ln in enumerate(lines):
        dy = abs(ln["y"]-am)
        if dy<best: best=dy; idx=i
    max_x = int(ax2 + max(x_gap, page_w*right_ratio))
    collected=[]
    def collect(ln):
        tmp=[]
        for it in ln["items"]:
            x1,_,_,_ = rect_from_bbox(it["bbox"])
            if x1 > ax2 + x_gap and x1 <= max_x:
                tmp.append(it)
        return tmp
    if idx is not None:
        collected += collect(lines[idx])
        if include_next_line and idx+1 < len(lines) and not collected:
            collected += collect(lines[idx+1])
    return collected

def collect_below_same_column(items, anchor_rect, page_w, page_h, x_pad=20, lines_down=2):
    ax1,ay1,ax2,ay2 = anchor_rect
    lines = group_by_lines(items, page_h)
    am = int(0.5*(ay1+ay2))
    idx=None; best=1e9
    for i,ln in enumerate(lines):
        dy = abs(ln["y"]-am)
        if dy<best: best=dy; idx=i
    if idx is None: return []
    xL = max(0, ax1 - x_pad); xR = min(page_w-1, ax2 + int(page_w*0.18))
    out=[]
    for j in range(1, lines_down+1):
        k = idx + j
        if k >= len(lines): break
        for it in lines[k]["items"]:
            x1,_,x2,_ = rect_from_bbox(it["bbox"])
            cx = (x1+x2)//2
            if xL <= cx <= xR:
                out.append(it)
    return out

def cut_at_next_label(text: str) -> str:
    m = STOP_LABEL_PAT.split(text)
    return (m[0].strip() if m else text.strip())

def sanitize_person_value(s: str) -> str:
    t = normalize(s)
    t = re.sub(r"\b(house|address|village|district|taluka|tehs?il|panchayat|gp|pattas?|leases?l?|grants?)\b", " ", t)
    t = re.sub(r"[0-9\[\]\(\)\/:,]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    parts = t.split()
    return " ".join(parts[:3]) if parts else ""

def sanitize_address_value(s: str) -> str:
    t = normalize(s)
    t = re.sub(r"[^a-z0-9 ,/]", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" ,")
    return t

def dedupe_tokens(s: str) -> str:
    toks = s.split()
    out=[]
    for t in toks:
        if not out or out[-1]!=t:
            out.append(t)
    return " ".join(out)

def sanitize_village_value(s: str) -> Optional[str]:
    t = normalize(s)
    t = re.sub(r"\b(gram\s*panchayat|gp)\b.*$", "", t).strip()
    t = dedupe_tokens(t)
    parts = t.split()
    return " ".join(parts[:3]) if parts else None

def sanitize_gp_value(s: str) -> Optional[str]:
    t = normalize(s)
    m = re.search(r"\b([a-z][a-z\s]{0,24})\s+gp\b", t)
    if m:
        return dedupe_tokens((m.group(1).strip() + " gp").strip())
    m = re.search(r"\b([a-z][a-z\s]{0,24})\s+gram\s*panchayat\b", t)
    if m:
        return dedupe_tokens((m.group(1).strip() + " gp").strip())
    base = " ".join(t.split()[:2]).strip()
    return dedupe_tokens((base + " gp").strip()) if base else None

def sanitize_required_suffix(s: str, suffix: str, keep_tokens=4) -> Optional[str]:
    t = normalize(s)
    m = re.search(rf"\b([a-z][a-z\s]{{0,40}}?)\s+{suffix}\b", t)
    if m:
        phrase = (m.group(1).strip() + f" {suffix}").strip()
        return " ".join(phrase.split()[:keep_tokens])
    parts = t.split()
    if len(parts)==1 and parts[0]=="sample":
        return "sample " + suffix
    return " ".join(parts[:keep_tokens]) if parts else None

def parse_parent_names(val: str) -> Tuple[Optional[str], Optional[str]]:
    t = normalize(val)
    parts = re.split(r"\s*/\s*|\s*\|\s*|\s{2,}|,| and ", t)
    parts = [p.strip(" :") for p in parts if p.strip(" :")]
    father, mother = None, None
    if len(parts) >= 2:
        father, mother = parts[0], parts[1]
    elif len(parts) == 1:
        father = parts[0]
    for bad in ["address","house","village","district","taluka","tehsil","panchayat","gp","pattas","lease","grants"]:
        if father and bad in father: father=None
        if mother and bad in mother: mother=None
    return father, mother

def parse_members_tolerant(text: str):
    t = normalize(text)
    t = re.sub(r";", ",", t)
    chunks = [c.strip() for c in re.split(r",", t) if c.strip()]
    members=[]
    for ch in chunks:
        m = re.search(r"([a-z][a-z\s\.]+?)\s*\(\s*(\d{1,3})\s*\)", ch, flags=re.I)
        if m:
            name = re.sub(r"\s+", " ", m.group(1).strip())
            age = int(m.group(2))
            members.append({"name": name, "age": age})
        else:
            m2 = re.search(r"^([a-z][a-z\s\.]+?)\s+(\d{1,3})$", ch, flags=re.I)
            if m2:
                name = re.sub(r"\s+", " ", m2.group(1).strip())
                age = int(m2.group(2))
                members.append({"name": name, "age": age})
            else:
                name = re.sub(r"\(\s*\)", "", ch).strip(" :")
                if name:
                    members.append({"name": name})
    return members

def number_after_keyword_with_ha(lines, keyword_regex, max_chars=40):
    pat_kw = re.compile(keyword_regex, re.I)
    num_pat = re.compile(r"([0-9]+(?:[.,]\s*[0-9]+|\s+[0-9]{2})?)\s*h[aɑ]\b", re.I)
    # same line
    for ln in lines:
        raw = " ".join([it.get("text","") for it in ln["items"]])
        txt = normalize(raw)
        for m in pat_kw.finditer(txt):
            window = txt[m.end(): m.end()+max_chars]
            mnum = num_pat.search(window)
            if mnum:
                token = mnum.group(1)
                token = token.replace(",", ".")
                token = re.sub(r"\s*\.\s*", ".", token)
                token = re.sub(r"(\d)\s+(\d{2})$", r"\1.\2", token)
                try: return float(token)
                except: pass
    # two-line concat
    for i in range(len(lines)-1):
        raw = " ".join([it.get("text","") for it in lines[i]["items"]+lines[i+1]["items"]])
        txt = normalize(raw)
        for m in pat_kw.finditer(txt):
            window = txt[m.end(): m.end()+max_chars]
            mnum = num_pat.search(window)
            if mnum:
                token = mnum.group(1)
                token = token.replace(",", ".")
                token = re.sub(r"\s*\.\s*", ".", token)
                token = re.sub(r"(\d)\s+(\d{2})$", r"\1.\2", token)
                try: return float(token)
                except: pass
    return None

def yes_no_from_near_text(items, anchor_rect, page_w, page_h) -> Optional[bool]:
    ax1,ay1,ax2,ay2 = anchor_rect
    lines = group_by_lines(items, page_h)
    am = int(0.5*(ay1+ay2))
    idx=None; best=1e9
    for i,ln in enumerate(lines):
        dy = abs(ln["y"]-am)
        if dy<best: best=dy; idx=i
    candidates=[]
    def harvest(ln):
        for it in ln["items"]:
            t = normalize(it.get("text",""))
            if re.search(r"\byes\b", t): candidates.append("yes")
            if re.search(r"\bno\b", t):  candidates.append("no")
    if idx is not None:
        harvest(lines[idx])
        if idx+1 < len(lines):
            harvest(lines[idx+1])
    if not candidates: return None
    if "yes" in candidates and "no" not in candidates: return True
    if "no" in candidates and "yes" not in candidates: return False
    return None

def bool_from_checkboxes_near(anchor_rect: Optional[Tuple[int,int,int,int]], m2_page: Dict[str,Any]) -> Optional[bool]:
    if not m2_page or not anchor_rect: return None
    bx1,by1,bx2,by2 = anchor_rect
    cy = int(0.5*(by1+by2))
    boxes = m2_page.get("checkboxes") or []
    close = []
    for b in boxes:
        x1,y1,x2,y2 = rect_from_bbox(b["bbox"])
        my = int(0.5*(y1+y2))
        if abs(my - cy) <= max(12, int((by2-by1)*1.5)):
            close.append(b)
    if len(close) >= 2:
        close.sort(key=lambda rb: rect_from_bbox(rb["bbox"])[0])  # left->right
        left, right = close[0], close[1]
        if left["filled"] ^ right["filled"]:
            return True if left["filled"] else False
    # Try label text on boxes
    for b in close:
        lab = (b.get("near_label") or "")
        if "yes" in lab and b["filled"]: return True
        if "no" in lab and b["filled"]:  return False
    return None

def extract_page_fields(page_meta: Dict[str,Any], items: List[Dict[str,Any]], m2_page: Dict[str,Any]) -> Dict[str,Any]:
    h = int(page_meta.get("height") or 3500)
    w = int(page_meta.get("width") or 2500)
    out = {
        "claimant_name": None, "spouse_name": None, "father_name": None, "mother_name": None,
        "address": None, "village": None, "gram_panchayat": None, "tehsil_taluka": None, "district": None,
        "scheduled_tribe": None, "otfd": None, "other_members": [],
        "habitation_area_ha": None, "self_cultivation_area_ha": None,
        "signature_present": None
    }

    def get_after(key: str) -> Tuple[str, Optional[Tuple[int,int,int,int]]]:
        it = find_anchor_item(items, ANCHORS[key]["labels"])
        if not it: return "", None
        rect = rect_from_bbox(it["bbox"])
        vals = collect_right_bounded(items, rect, w, h, x_gap=6, right_ratio=0.45, include_next_line=True)
        text = cut_at_next_label(join_items_text(vals)) if vals else ""
        if not text:
            # inline after colon
            m = re.search(r":\s*(.*)$", it.get("text",""))
            if m:
                text = m.group(1)
        return text, rect

    claim_raw, _ = get_after("claimant_name")
    spouse_raw, _ = get_after("spouse_name")
    addr_raw, _ = get_after("address")
    village_raw, _ = get_after("village")
    gp_raw, _ = get_after("gram_panchayat")
    tehsil_raw, _ = get_after("tehsil_taluka")
    district_raw, _ = get_after("district")

    # father/mother
    fm_raw, fm_rect = get_after("father_mother")
    if (not fm_raw) and fm_rect is not None:
        below = collect_below_same_column(items, fm_rect, w, h, x_pad=22, lines_down=2)
        fm_raw = join_items_text(below)
    if fm_raw:
        f, m = parse_parent_names(fm_raw)
        out["father_name"] = sanitize_person_value(f or "") or None
        out["mother_name"] = sanitize_person_value(m or "") or None

    # other members
    om_raw, _ = get_after("other_members")
    if om_raw:
        out["other_members"] = parse_members_tolerant(om_raw)

    # sanitize locations and names
    out["claimant_name"] = sanitize_person_value(claim_raw) or None
    out["spouse_name"]   = sanitize_person_value(spouse_raw) or None
    out["address"] = sanitize_address_value(addr_raw) or None
    out["village"] = sanitize_village_value(village_raw)
    out["gram_panchayat"] = sanitize_gp_value(gp_raw)
    out["tehsil_taluka"] = sanitize_required_suffix(tehsil_raw, "taluka", keep_tokens=3)
    out["district"] = sanitize_required_suffix(district_raw, "district", keep_tokens=3)

    # areas
    lines = group_by_lines(items, h)
    out["habitation_area_ha"] = number_after_keyword_with_ha(lines, r"\bhabitation[:\s]*")
    out["self_cultivation_area_ha"] = number_after_keyword_with_ha(lines, r"\bself[-\s]*cultivation[:\s]*")

    # ST/OTFD booleans: prefer checkboxes; else near-text
    st_txt, st_rect = get_after("scheduled_tribe")
    ot_txt, ot_rect = get_after("otfd")
    st_box = bool_from_checkboxes_near(st_rect, m2_page)
    ot_box = bool_from_checkboxes_near(ot_rect, m2_page)
    if st_box is None and st_rect is not None:
        yn = yes_no_from_near_text(items, st_rect, w, h)
        st_box = yn
    if ot_box is None and ot_rect is not None:
        yn = yes_no_from_near_text(items, ot_rect, w, h)
        ot_box = yn
    out["scheduled_tribe"] = st_box
    out["otfd"] = ot_box
    # exclusivity rule
    if out["scheduled_tribe"] is True and out["otfd"] is True:
        out["otfd"] = False

    # signature presence: prefer M2; else OCR "[X]" fallback
    if m2_page.get("signatures"):
        out["signature_present"] = True
    else:
        page_text = normalize("\n".join([i.get("text","") for i in items]))
        if re.search(r"\[\s*[x✓✔]\s*\]", page_text) or re.search(r"\bsignature[^:\n]*:\s*\S", page_text):
            out["signature_present"] = True

    # post-fix: claimant/spouse merged
    if out["claimant_name"] and out["spouse_name"] and normalize(out["claimant_name"]) == normalize(out["spouse_name"]):
        toks = out["claimant_name"].split()
        if len(toks) == 3:
            out["claimant_name"] = " ".join(toks[:2])
            out["spouse_name"] = toks[2]
        elif len(toks) == 4:
            out["claimant_name"] = " ".join(toks[:2])
            out["spouse_name"] = " ".join(toks[2:])

    return out

# --------------- Orchestrator ---------------

def process_document(input_path: str, outdir: str, mobile: bool=False, poppler_path: Optional[str]=None, ocr_lang: str="eng") -> Dict[str,Any]:
    """
    Process a single path (PDF or image). Returns the per-document JSON blob and writes overlays & OCR JSONs.
    """
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    overlays_dir = os.path.join(outdir, "overlays"); ensure_dir(overlays_dir)
    pages_dir = os.path.join(outdir, "pages"); ensure_dir(pages_dir)
    docs_dir = os.path.join(outdir, "docs"); ensure_dir(docs_dir)

    images = load_images_from_path(input_path, poppler_path)
    pages = []
    for idx, (pil_img_raw, tag) in enumerate(images, start=1):
        pil_img = preprocess_mobile_image(pil_img_raw) if mobile else pil_img_raw

        # OCR
        items = ocr_items_from_image(pil_img, lang=ocr_lang)
        h, w = pil_img.size[1], pil_img.size[0]

        # M2 detections
        cb = detect_checkboxes(pil_img, items)
        sigs = detect_signatures(pil_img, items)
        stamps = detect_stamps(pil_img, ocr_lang=ocr_lang)
        m2_page = {"checkboxes": cb, "signatures": sigs, "stamps": stamps}

        # Overlays
        overlay = draw_overlays(pil_img, m2_page)
        overlay_path = os.path.join(overlays_dir, f"{base_name}_{tag}.png")
        overlay.save(overlay_path)

        # Per-page OCR json
        ocr_json_path = os.path.join(pages_dir, f"{base_name}_{tag}_ocr.json")
        with open(ocr_json_path, "w", encoding="utf-8") as f:
            json.dump({"items": items, "width": w, "height": h}, f, ensure_ascii=False, indent=2)

        # Extract fields
        page_meta = {"page_number": idx, "width": w, "height": h}
        fields = extract_page_fields(page_meta, items, m2_page)

        pages.append({
            "page_number": idx,
            "fields": fields,
            "ocr_json_path": ocr_json_path,
            "overlay_path": overlay_path
        })

    # Merge across pages (first non-empty for each field, union for members)
    merged = {
        "claimant_name": None, "spouse_name": None, "father_name": None, "mother_name": None,
        "address": None, "village": None, "gram_panchayat": None, "tehsil_taluka": None, "district": None,
        "scheduled_tribe": None, "otfd": None,
        "other_members": [], "habitation_area_ha": None, "self_cultivation_area_ha": None,
        "signature_present": None
    }
    def pick(cur, new):
        return cur if cur not in [None, "", []] else new
    for pg in pages:
        f = pg["fields"]
        for k in merged.keys():
            if k == "other_members":
                existing = {(m.get("name"), m.get("age")) for m in merged[k]}
                for mm in (f.get(k) or []):
                    key = (mm.get("name"), mm.get("age"))
                    if key not in existing:
                        merged[k].append(mm); existing.add(key)
            else:
                merged[k] = pick(merged[k], f.get(k))

    # Exclusivity ST/OTFD after merge
    if merged["scheduled_tribe"] is True and merged["otfd"] is True:
        merged["otfd"] = False

    doc_blob = {
        "input": input_path,
        "page_count": len(images),
        "pages": pages,
        "extracted": merged
    }
    out_path = os.path.join(docs_dir, f"{base_name}_structured.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(doc_blob, f, ensure_ascii=False, indent=2)
    return doc_blob

def main():
    ap = argparse.ArgumentParser(description="Super Pipeline: OCR + M2 detections + structured extraction")
    ap.add_argument("input", help="Path to a PDF/image or a folder containing PDFs/images")
    ap.add_argument("--outdir", default="./sp_output", help="Output directory (default: ./sp_output)")
    ap.add_argument("--mobile", action="store_true", help="Enable light preprocessing for mobile photos")
    ap.add_argument("--poppler-path", default=None, help="Poppler bin path (only if PDFs fail to render)")
    ap.add_argument("--lang", default="eng", help="Tesseract OCR language (default: eng)")
    args = ap.parse_args()

    t0 = time.time()
    ensure_dir(args.outdir)
    inputs = []
    if os.path.isdir(args.input):
        inputs = sorted([
            os.path.join(args.input, f) for f in os.listdir(args.input)
            if f.lower().endswith((".png",".jpg",".jpeg",".tif",".tiff",".bmp",".pdf"))
        ])
    else:
        inputs = [args.input]

    docs = []
    for p in inputs:
        try:
            print(f"[sp] Processing: {p}")
            blob = process_document(p, outdir=args.outdir, mobile=args.mobile, poppler_path=args.poppler_path, ocr_lang=args.lang)
            print(f"  -> wrote structured JSON for {os.path.basename(p)}")
            docs.append(blob)
        except Exception as e:
            print(f"[sp] ERROR processing {p}: {e}")
            traceback.print_exc()

    man_path = os.path.join(args.outdir, "manifest.json")
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump({"phase":"super_pipeline", "documents": docs}, f, ensure_ascii=False, indent=2)

    print(f"[sp] Done {len(docs)} doc(s) in {time.time()-t0:.1f}s")
    print(f"[sp] Manifest: {man_path}")
    print(f"[sp] Overlays: {os.path.join(args.outdir, 'overlays')}")
    print(f"[sp] Docs JSON: {os.path.join(args.outdir, 'docs')}")

if __name__ == "__main__":
    main()