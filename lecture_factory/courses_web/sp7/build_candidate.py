#!/usr/bin/env python3
"""Build only the isolated sp7 candidate after verifying every real audio cache."""
import sys
sys.dont_write_bytecode = True
import hashlib
import json
import shutil
import time
import wave
from pathlib import Path

COURSE = Path(__file__).resolve().parent
ROOT = COURSE.parents[2]
WORK = ROOT / 'work/special-series/sp7'
STAGE = WORK / 'neural-stage'
sys.path.insert(0, str(COURSE.parents[1]))
import build_web
import make_audio_neural

def prepare_pcm_audio(verified):
    """Measure actual decoded samples and encode the course once to avoid MP3 seam drift."""
    directory = WORK / 'assembly' / str(time.time_ns())
    directory.mkdir(parents=True)
    ffmpeg = make_audio_neural.ffmpeg_exe()
    page_durations = {}
    full_wav = directory / 'course.wav'
    with wave.open(str(full_wav), 'wb') as joined:
        joined.setnchannels(1)
        joined.setsampwidth(2)
        joined.setframerate(make_audio_neural.SAMPLE_RATE)
        for n, files in verified:
            wav = directory / f'page{n}.wav'
            frames = make_audio_neural.decode_to_wav(ffmpeg, files[0], wav)
            page_durations[f'page{n}.mp3'] = frames / make_audio_neural.SAMPLE_RATE
            with wave.open(str(wav), 'rb') as source:
                while chunk := source.readframes(8192): joined.writeframesraw(chunk)
            joined.writeframesraw(b'\x00\x00' * round(build_web.PAGE_GAP * make_audio_neural.SAMPLE_RATE))
    full_mp3 = directory / 'audio.mp3'
    make_audio_neural.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(full_wav),
                          '-ac', '1', '-ar', str(make_audio_neural.SAMPLE_RATE), '-c:a', 'libmp3lame',
                          '-b:a', make_audio_neural.BITRATE, str(full_mp3)], '整课真实PCM音轨编码', timeout=120)
    actual = make_audio_neural.decoded_duration(ffmpeg, full_mp3)
    expected = sum(page_durations.values()) + len(verified) * build_web.PAGE_GAP
    expected_frames = round(expected * make_audio_neural.SAMPLE_RATE)
    actual_frames = make_audio_neural.decode_to_wav(ffmpeg, full_mp3, directory/'decoded-course-check.wav')
    if abs(actual - expected) > .08:
        raise RuntimeError(f'Full decoded audio {actual:.6f}s differs from PCM schedule {expected:.6f}s')
    if abs(actual_frames - expected_frames) > round(.08 * make_audio_neural.SAMPLE_RATE):
        raise RuntimeError('Full audio PCM frame count differs from its measured schedule')
    (directory/'pcm-checks.json').write_text(json.dumps({'sample_rate':make_audio_neural.SAMPLE_RATE,
        'expected_pcm_frames':expected_frames,'actual_decoded_frames':actual_frames,
        'frame_delta':actual_frames-expected_frames,'expected_seconds':expected,'actual_seconds':actual,
        'tolerance_seconds_entire_course_only':.08,'page_durations':page_durations},indent=2))
    return directory, full_mp3, page_durations, actual

def main():
    doc = make_audio_neural.verify_authorized_text()
    verified = []
    for page in doc['pages']:
        n = page['id']
        files = [STAGE / 'audio' / f'page{n}.mp3', STAGE / f'page{n}.times.json', STAGE / f'page{n}.neural.json']
        if not all(p.is_file() for p in files):
            raise RuntimeError(f'page {n}: real MP3, times, and neural manifest all required; no fallback TTS permitted')
        sentences, _ = build_web.split_sentences(page['narration'])
        times = json.loads(files[1].read_text())
        manifest = json.loads(files[2].read_text())
        payload = {k:manifest[k] for k in make_audio_neural.SETTINGS_KEYS}
        signature = hashlib.sha256(json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        if manifest.get('sha256') != signature or manifest.get('voice') != 'zh-CN-YunxiNeural':
            raise RuntimeError(f'page {n}: neural signature invalid')
        expected = {'engine': 'node-edge-tts', 'voice': make_audio_neural.VOICE,
                    'volume': '+30%', 'format': make_audio_neural.FORMAT,
                    'sample_rate': make_audio_neural.SAMPLE_RATE,
                    'gaps': make_audio_neural.page_gaps(page),
                    'tempo': manifest.get('tempo'), 'sentences': sentences}
        if not isinstance(expected['tempo'], (int, float)) or not .9 <= expected['tempo'] <= 1.12:
            raise RuntimeError(f'page {n}: tempo outside the permitted classroom range')
        if payload != expected:
            raise RuntimeError(f'page {n}: manifest settings differ from the independent expected recipe')
        if [t['text'] for t in times] != sentences or manifest['sentences'] != sentences:
            raise RuntimeError(f'page {n}: narration/cache text mismatch')
        duration = make_audio_neural.verify_page_cache(*files, payload, make_audio_neural.ffmpeg_exe())
        if not times or any(t['end'] <= t['start'] for t in times) or times[-1]['end'] > duration + .08:
            raise RuntimeError(f'page {n}: measured timeline invalid')
        verified.append((n, files))
    # Atomic preflight above: only after all pages pass can any audio be promoted.
    assembly, full_mp3, page_durations, actual_total = prepare_pcm_audio(verified)
    backup = WORK / 'cache-history' / str(time.time_ns())
    for n, files in verified:
        for source, target in zip(files, [COURSE/'audio'/files[0].name, COURSE/files[1].name, COURSE/files[2].name]):
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists() and target.read_bytes() != source.read_bytes():
                saved = backup / ('audio' if target.parent.name == 'audio' else '') / target.name
                saved.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, saved)
            shutil.copy2(source, target)
    target = WORK / 'public/weblec/sp7'
    if target.exists() and any(target.iterdir()):
        shutil.copytree(target, WORK/'candidate-history'/str(time.time_ns())/'public/weblec/sp7')
    target.mkdir(parents=True, exist_ok=True)
    for source in (COURSE/'assets').rglob('*'):
        if source.is_file():
            dst = target / source.relative_to(COURSE/'assets')
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, dst)
    shutil.copy2(ROOT/'lecture_factory/assets/logo_gewu.png', target/'logo.png')
    build_web.WEB_PUBLIC = str(WORK/'public/weblec')
    build_web.sys.argv = ['isolated-sp7-build', str(COURSE)]
    original_probe = build_web.gen_audio.probe
    def measured_probe(path):
        return page_durations.get(Path(path).name) or original_probe(path)
    build_web.gen_audio.probe = measured_probe
    try:
        build_web.main()
    finally:
        build_web.gen_audio.probe = original_probe
    shutil.copy2(target/'audio.mp3', assembly/'original-mp3-copy-concat.mp3')
    shutil.copy2(full_mp3, target/'audio.mp3')
    lecture = json.loads((target/'weblec.json').read_text())
    lecture['duration'] = round(actual_total, 3)
    lecture['voice'] = make_audio_neural.VOICE
    lecture['audio_engine'] = 'node-edge-tts'
    lecture['timing_basis'] = 'measured-neural-PCM-samples'
    lecture['real_audio_duration'] = actual_total
    (target/'weblec.json').write_text(json.dumps(lecture,ensure_ascii=False,indent=1)+'\n')
    sys.path.insert(0, str(WORK/'pipeline'))
    from align_quiz_times import align_quiz_times
    align_quiz_times(COURSE, target/'weblec.json', WORK/'review/quiz-time-alignment.json')
    import validate_weblec
    if not validate_weblec.run(str(target/'weblec.json')):
        raise RuntimeError('Final actual-audio candidate validation failed')
    (WORK/'pipeline/audio-preflight.json').write_text(json.dumps({'all_pages_verified': True,'pages':len(verified),'candidate_public':str(target),'shared_public_written':False,'assembly':str(assembly),'pcm_checks':json.loads((assembly/'pcm-checks.json').read_text()),'actual_audio_duration_seconds':actual_total,'page_durations_pcm':page_durations,'course_audio_sha256':make_audio_neural.file_digest(target/'audio.mp3'),'timing_basis':'measured-neural-PCM-samples'},ensure_ascii=False,indent=2))

if __name__ == '__main__':
    main()
