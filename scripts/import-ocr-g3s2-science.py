#!/usr/bin/env python3
import json
import re
from pathlib import Path


INPUT_FILES = [
    "/Users/kelvinlo/Downloads/OCR_20260316/112下-3下-期中-翰林自然-001.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-001.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-002.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-003.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-004.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-005.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-006.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-007.txt",
    "/Users/kelvinlo/Downloads/OCR_20260316/113下-3下-期中-翰林自然-008.txt",
]


CHOICE_REGEX = re.compile(
    r"(?:^|\n)\s*(?:\*+\s*)?(?:\*+)?(\d+)[\.、]\s*\(\s*([^)]*)\)\s*"
    r"(.+?)\s*①\s*(.+?)\s*②\s*(.+?)\s*③\s*(.+?)\s*④\s*(.+?)"
    r"(?=(?:\n\s*(?:\*+\s*)?(?:\*+)?\d+[\.、]\s*\()|\n---|\n###|\Z)",
    re.S,
)

TRUE_FALSE_REGEX = re.compile(
    r"(?:^|\n)\s*(?:\*+\s*)?(?:\*+)?(\d+)[\.、]\s*\(\s*([VXxOo○ ]*)\)\s*(.+?)"
    r"(?=(?:\n\s*(?:\*+\s*)?(?:\*+)?\d+[\.、]\s*\()|\n---|\n###|\Z)",
    re.S,
)


def _normalize_text(s: str) -> str:
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = s.replace("：", ":")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s


def _cleanup_item(s: str) -> str:
    s = s.strip()
    s = re.sub(r"\*+", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = s.replace("？", "?").replace("。", "").strip()
    return s


def _looks_like_prompt(prompt: str) -> bool:
    if len(prompt) < 12 or len(prompt) > 120:
        return False
    bad_markers = [
        "收到",
        "轉錄",
        "第1頁",
        "第2頁",
        "第3頁",
        "請在",
        "每題",
        "共",
        "答案不只一個",
        "連連看",
        "配合題",
        "科學閱讀",
    ]
    if any(m in prompt for m in bad_markers):
        return False
    science_keywords = ["蔬菜", "種植", "土壤", "陽光", "水", "冰", "毛細", "蒸發", "凝結", "凝固", "融化", "採收", "蚯蚓", "節水", "水蒸氣"]
    return any(k in prompt for k in science_keywords)


def _looks_like_option(opt: str) -> bool:
    if len(opt) < 1 or len(opt) > 40:
        return False
    bad = ["請打", "每題", "共", "轉錄", "第1頁", "第2頁", "第3頁"]
    return not any(m in opt for m in bad)


def parse_questions(text: str, source_name: str):
    text = _normalize_text(text)
    found = []

    for m in CHOICE_REGEX.finditer(text):
        answer_token = _cleanup_item(m.group(2))
        prompt = _cleanup_item(m.group(3))
        choices = [_cleanup_item(m.group(i)) for i in range(4, 8)]
        if not _looks_like_prompt(prompt):
            continue
        if not all(_looks_like_option(c) for c in choices):
            continue
        if len(set(choices)) < 3:
            continue
        answer_idx_match = re.search(r"[1-4]", answer_token)
        if not answer_idx_match:
            continue
        answer_idx = int(answer_idx_match.group(0)) - 1
        if not (0 <= answer_idx < 4):
            continue

        found.append(
            {
                "type": "choice",
                "prompt": prompt + "？" if not prompt.endswith(("?", "？")) else prompt,
                "answer": choices[answer_idx],
                "choices": choices,
                "tags": ["國小三下", "自然", "OCR"],
                "sourceFile": source_name,
            }
        )

    for m in TRUE_FALSE_REGEX.finditer(text):
        answer_token = _cleanup_item(m.group(2)).upper()
        prompt = _cleanup_item(m.group(3))
        if not _looks_like_prompt(prompt):
            continue
        # 過濾看起來像非題目敘述的行
        if "①" in prompt or "②" in prompt:
            continue
        if "V" in answer_token or "O" in answer_token or "○" in answer_token:
            tf_answer = True
        elif "X" in answer_token:
            tf_answer = False
        else:
            continue

        found.append(
            {
                "type": "true-false",
                "prompt": prompt + "。" if not prompt.endswith(("。", "?", "？")) else prompt,
                "answer": tf_answer,
                "tags": ["國小三下", "自然", "OCR"],
                "sourceFile": source_name,
            }
        )
    return found


def dedupe_questions(questions):
    unique = []
    seen = set()
    for q in questions:
        key = (q["type"], q["prompt"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(q)
    return unique


def main():
    all_q = []
    for p in INPUT_FILES:
        path = Path(p)
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        all_q.extend(parse_questions(text, path.name))

    all_q = dedupe_questions(all_q)

    # 補上穩定 id
    choice_id = 1
    tf_id = 1
    for q in all_q:
        if q["type"] == "choice":
            q["id"] = f"sci32-choice-{choice_id:03d}"
            choice_id += 1
        else:
            q["id"] = f"sci32-tf-{tf_id:03d}"
            tf_id += 1

    # 最少保留一批可用題數；若 OCR 萃取少，保底題組
    if len(all_q) < 24:
        all_q.extend(
            [
                {
                    "id": "sci32-choice-fallback-001",
                    "type": "choice",
                    "prompt": "種植蔬菜前，想翻鬆土壤，最適合使用哪一種工具？",
                    "answer": "鏟子",
                    "choices": ["澆水器", "鏟子", "花盆", "紗網"],
                    "tags": ["國小三下", "自然", "fallback"],
                },
                {
                    "id": "sci32-choice-fallback-002",
                    "type": "choice",
                    "prompt": "種植蔬菜時，哪一個澆水方式較正確？",
                    "answer": "降低澆水的位置",
                    "choices": ["用強力水柱澆水", "澆水次數越多越好", "在中午澆水", "降低澆水的位置"],
                    "tags": ["國小三下", "自然", "fallback"],
                },
                {
                    "id": "sci32-tf-fallback-001",
                    "type": "true-false",
                    "prompt": "毛巾和衛生紙會出現毛細現象。",
                    "answer": True,
                    "tags": ["國小三下", "自然", "fallback"],
                },
                {
                    "id": "sci32-tf-fallback-002",
                    "type": "true-false",
                    "prompt": "臺灣一年四季都可買到蔬菜，所以種植不需考慮季節。",
                    "answer": False,
                    "tags": ["國小三下", "自然", "fallback"],
                },
            ]
        )

    output = {
        "subject": "science",
        "textbookId": "tw-g3-s2-science",
        "unit": "三下自然期中題庫（OCR整合）",
        "version": 1,
        "source": "/Users/kelvinlo/Downloads/OCR_20260316/*.txt",
        "questions": all_q,
    }

    out_path = Path("data/science/g3-s2-midterm.json")
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated: {out_path} ({len(all_q)} questions)")


if __name__ == "__main__":
    main()
