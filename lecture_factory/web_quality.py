"""Shared, deterministic source-side quality helpers for web lecture authors."""
import json
import os
import re
from build_web import split_sentences


def add_diagnostic(pages, page_id, anchor, question, options, answer, feedback, explain):
    """Attach a sentence-end multiple-choice check without disturbing reveal cues."""
    page = next(pg for pg in pages if pg['id'] == page_id)
    if len(options) != len(feedback) or len(options) < 2:
        raise ValueError('诊断题选项与逐项反馈必须一一对应')
    if type(answer) is not int or not 0 <= answer < len(options):
        raise ValueError('诊断题正确答案索引非法')
    if not question.strip() or any(not item.strip() for item in [*options, *feedback, explain]):
        raise ValueError('诊断题题干、选项、反馈和解析均不能为空')
    page.setdefault('interactions', []).append({
        'type': 'choice',
        'after_sentence': anchor,
        'q': question,
        'options': options,
        'answer': answer,
        'feedbackPerOption': feedback,
        'explain': explain,
        'pause_offset': 0.1,
        'pause_margin': 0.5,
    })
    sentences, _ = split_sentences(page['narration'])
    if anchor != sentences[-1]:
        overrides = page.setdefault('sentence_gap_overrides', [])
        if not any(item.get('after_sentence') == anchor for item in overrides):
            overrides.append({'after_sentence': anchor, 'gap_seconds': 1.2})


def tighten_boxes(pages, specifications):
    """Apply reviewed box coordinates without changing element order or annotation keys."""
    for (page_id, element_index), geometry in specifications.items():
        page = next(pg for pg in pages if pg['id'] == page_id)
        element = page['elements'][element_index]
        if element.get('type') != 'box':
            raise ValueError(f'版式目标不是 box：{page_id}:{element_index}')
        x, y, w, h = geometry
        if min(w, h) <= 0:
            raise ValueError(f'版式尺寸非法：{page_id}:{element_index}')
        element.update({'x': x, 'y': y, 'w': w, 'h': h})


def apply_annotations(author_file, pages):
    """Merge canonical hotspot/QA metadata and reject stale element references."""
    course_dir = os.path.dirname(os.path.abspath(author_file))
    annotation_path = os.path.join(course_dir, 'annotations.json')
    with open(annotation_path, encoding='utf-8') as source:
        annotations = json.load(source)
    valid_keys = {f"{pg['id']}:{index}" for pg in pages for index in range(len(pg['elements']))}
    orphan_keys = sorted(set(annotations) - valid_keys)
    if orphan_keys:
        raise ValueError(f'知识点标注指向不存在的元素：{orphan_keys}')
    for page in pages:
        for index, element in enumerate(page['elements']):
            metadata = annotations.get(f'{page["id"]}:{index}')
            if metadata:
                element.update(metadata)
    return len(annotations)
