/**
 * Local buddy proxy: chat/TTS passthrough plus optional /v1/stt.
 * If faster-whisper / whisper-stt is not installed, STT returns 501.
 *
 *   node prj/games/blocklegend/tools/buddy-proxy.mjs
 */
import http from 'node:http';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.BL_BUDDY_PORT) || 4210;
const UPSTREAM = process.env.BL_BUDDY_UPSTREAM || '';

function whisperBin() {
    return process.env.BL_WHISPER_BIN || process.env.WHISPER_STT || '';
}

function sttReady() {
    return !!(whisperBin() || process.env.BL_WHISPER_CMD);
}

function send(res, code, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type,x-prompt,authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    res.end(body);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

async function handleStt(req, res) {
    if (!sttReady()) {
        send(res, 501, {
            error: 'stt: faster-whisper / whisper-stt is not installed on this machine'
        });
        return;
    }
    const audio = await readBody(req);
    const bin = whisperBin() || 'whisper';
    const child = spawn(bin, ['--output_format', 'json', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
    child.stdin.end(audio);
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.on('close', (code) => {
        if (code !== 0) {
            send(res, 502, { error: 'stt: whisper failed', text: '' });
            return;
        }
        try {
            const json = JSON.parse(out || '{}');
            send(res, 200, { text: String(json.text || json.transcript || '').trim() });
        } catch (e) {
            send(res, 200, { text: String(out || '').trim() });
        }
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    if (req.method === 'OPTIONS') {
        send(res, 204, {});
        return;
    }
    if (url.pathname === '/v1/stt' || url.pathname === '/stt') {
        if (req.method !== 'POST') {
            send(res, 405, { error: 'stt: POST audio only' });
            return;
        }
        try {
            await handleStt(req, res);
        } catch (e) {
            send(res, 500, { error: 'stt: ' + (e && e.message ? e.message : 'fail') });
        }
        return;
    }
    if (url.pathname === '/health') {
        send(res, 200, { ok: true, stt: sttReady() ? 'ready' : '501' });
        return;
    }
    if (!UPSTREAM) {
        send(res, 404, { error: 'no upstream' });
        return;
    }
    send(res, 404, { error: 'not found' });
});

if (process.argv[1] && process.argv[1].endsWith('buddy-proxy.mjs')) {
    server.listen(PORT, '127.0.0.1', () => {
        process.stdout.write('buddy-proxy on http://127.0.0.1:' + PORT + ' /v1/stt\n');
    });
}

export { server, sttReady };
