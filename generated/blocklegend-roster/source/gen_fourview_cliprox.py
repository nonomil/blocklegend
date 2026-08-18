# -*- coding: utf-8 -*-
"""Generate one BlockLegend 2x2 four-view sheet via Cliprox gpt-image-2.

Reads the API key from CLIPROX_API_KEY or cliprox.local.env. Never prints the key.

Usage:
  python prj/assets/generated/blocklegend-roster/source/gen_fourview_cliprox.py husk
"""
from __future__ import print_function

import argparse
import base64
import json
import os
import sys
import time

try:
    from urllib.error import HTTPError, URLError
    from urllib.request import Request, urlopen
except ImportError:
    from urllib2 import HTTPError, Request, URLError, urlopen

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET_DIR = os.path.normpath(os.path.join(HERE, '..', 'four-view'))
PROMPT_DIR = os.path.join(HERE, 'prompts')
DEFAULT_ENV = r"G:\StudyCode\宠物积分系统\docs\生图\生图接口资源key\cliprox.local.env"
DEFAULT_BASE = 'https://rn6.nonom.top/v1'


def load_env_file(path):
    vals = {}
    if not os.path.isfile(path):
        return vals
    with open(path, 'r', encoding='utf-8') as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, val = line.split('=', 1)
            vals[key.strip()] = val.strip().strip('"').strip("'")
    return vals


def resolve_auth():
    env = load_env_file(os.environ.get('CLIPROX_ENV_FILE', DEFAULT_ENV))
    key = os.environ.get('CLIPROX_API_KEY') or env.get('CLIPROX_API_KEY') or env.get('API_KEY')
    base = os.environ.get('CLIPROX_API_BASE') or env.get('CLIPROX_API_BASE') or env.get('API_BASE') or DEFAULT_BASE
    if not key:
        print('error: CLIPROX_API_KEY missing', file=sys.stderr)
        return None, None
    return key, base.rstrip('/')


def generate(model_id):
    key, base = resolve_auth()
    if not key:
        return 2
    prompt_path = os.path.join(PROMPT_DIR, model_id + '-4view.txt')
    if not os.path.isfile(prompt_path):
        print('error: missing prompt ' + prompt_path, file=sys.stderr)
        return 3
    with open(prompt_path, 'r', encoding='utf-8') as fh:
        prompt = fh.read().strip()
    payload = json.dumps({
        'model': 'gpt-image-2',
        'prompt': prompt,
        'n': 1,
        'size': '1024x1024',
        'response_format': 'b64_json'
    }).encode('utf-8')
    url = base + '/images/generations'
    req = Request(url, data=payload, headers={
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    })
    t0 = time.time()
    try:
        resp = urlopen(req, timeout=180)
        body = resp.read()
        status = getattr(resp, 'status', 200)
    except HTTPError as exc:
        err = exc.read()[:400]
        print('http %s in %.1fs' % (exc.code, time.time() - t0), file=sys.stderr)
        print(err, file=sys.stderr)
        return 1
    except URLError as exc:
        print('error: request failed: %s' % exc, file=sys.stderr)
        return 4
    print('http %s in %.1fs' % (status, time.time() - t0))
    data = json.loads(body.decode('utf-8'))
    if data.get('error'):
        print('error: ' + str(data.get('error')), file=sys.stderr)
        return 5
    items = data.get('data') or []
    if not items:
        print('error: no data[0]', file=sys.stderr)
        return 5
    item = items[0]
    raw = None
    if item.get('b64_json'):
        raw = base64.b64decode(item['b64_json'])
    if not raw:
        print('error: no b64_json', file=sys.stderr)
        return 6
    if not (raw.startswith(b'\x89PNG') or raw.startswith(b'\xff\xd8')):
        print('error: not PNG/JPEG header', file=sys.stderr)
        return 7
    if not os.path.isdir(SHEET_DIR):
        os.makedirs(SHEET_DIR)
    dest = os.path.join(SHEET_DIR, model_id + '-4view.png')
    with open(dest, 'wb') as out:
        out.write(raw)
    print('saved %s (%d bytes)' % (dest, len(raw)))
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('model')
    args = ap.parse_args()
    return generate(args.model)


if __name__ == '__main__':
    sys.exit(main())
