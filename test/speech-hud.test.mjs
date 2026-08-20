/**
 * 语音 HUD：孩子按 V 后必须看得见状态，失败要看见听到了什么。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../data/speech-hud.js';

const H = globalThis.BlockLegendSpeechHud;
assert.ok(H, 'BlockLegendSpeechHud must be injected');

test('空闲：提示按 V，不暂停世界', () => {
    const hud = H.hudOf('idle');
    assert.equal(hud.cls, 'is-idle');
    assert.match(hud.line, /按 V/);
    assert.equal(hud.pause, false);
});

test('聆听中：点名目标词', () => {
    const hud = H.hudOf('listening', { want: 'slime' });
    assert.equal(hud.cls, 'is-listening');
    assert.match(hud.line, /听你说/);
    assert.match(hud.line, /slime/);
    assert.equal(hud.pause, false);
});

test('处理中：想一下，仍不暂停', () => {
    const hud = H.hudOf('processing', { want: 'tree' });
    assert.equal(hud.cls, 'is-processing');
    assert.match(hud.line, /想一下/);
    assert.equal(hud.pause, false);
});

test('说中：绿勾 + 目标词', () => {
    const hud = H.hudOf('matched', { want: 'slime', heard: 'slime' });
    assert.equal(hud.cls, 'is-matched');
    assert.match(hud.line, /slime/);
    assert.equal(hud.pause, false);
});

test('念错：必须写出听到的文本，并保留目标词', () => {
    const hud = H.hudOf('not-matched', { want: 'slime', heard: 'parden' });
    assert.equal(hud.cls, 'is-miss');
    assert.match(hud.line, /听到/);
    assert.match(hud.line, /parden/);
    assert.equal(hud.want, 'slime');
    assert.equal(hud.pause, false);
});

test('超时：没听清再试', () => {
    const hud = H.hudOf('timeout');
    assert.equal(hud.cls, 'is-timeout');
    assert.match(hud.line, /没听清/);
    assert.equal(hud.pause, false);
});

test('麦克风被拒 / 不支持：导向拼写', () => {
    const blocked = H.hudOf('mic-blocked');
    const none = H.hudOf('unsupported');
    assert.match(blocked.line, /拼写|T/);
    assert.match(none.line, /拼写|T/);
    assert.equal(blocked.pause, false);
    assert.equal(none.pause, false);
});

test('连续失败 2 次才建议切拼写', () => {
    assert.equal(H.suggestSpell(0), false);
    assert.equal(H.suggestSpell(1), false);
    assert.equal(H.suggestSpell(2), true);
    assert.equal(H.suggestSpell(3), true);
});
