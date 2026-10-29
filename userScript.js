// Injected into youtube.com/tv. Polls the local service and types into the focused text field.
(function () {
    const API = 'http://127.0.0.1:8099';
    let seen = 0;

    // Small status banner so a failure is visible on the TV (remove once it works).
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;background:#000c;color:#0f0;font:16px monospace;padding:4px 8px';
    bar.textContent = 'PhoneKB: starting';
    (document.body || document.documentElement).appendChild(bar);

    function field() {
        const a = document.activeElement;
        if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return a;
        // ponytail: YouTube TV may keep focus off the <input>; fall back to the first visible one
        return document.querySelector('input:not([type=hidden]), textarea');
    }

    function fire(el, type, key) {
        el.dispatchEvent(new KeyboardEvent(type, { key, code: key, keyCode: 13, which: 13, bubbles: true }));
    }

    setInterval(async () => {
        try {
            const s = await (await fetch(API + '/state')).json();
            if (s.seq === seen) { bar.textContent = 'PhoneKB: connected'; return; }
            seen = s.seq;
            const el = field();
            if (!el) {
                const tags = new Set();
                document.querySelectorAll('*').forEach((n) => {
                    const t = n.tagName.toLowerCase();
                    if (/search|text|input|keyboard/.test(t + ' ' + n.className)) tags.add(t + (n.className ? '.' + String(n.className).split(' ')[0] : ''));
                });
                bar.textContent = 'PhoneKB: no field. inputs=' + document.querySelectorAll('input').length +
                    ' editable=' + document.querySelectorAll('[contenteditable]').length +
                    ' url=' + location.pathname + ' tags=' + [...tags].slice(0, 8).join(' ');
                seen = 0;
                return;
            }
            const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
            setter.call(el, s.text);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            if (s.submit) { fire(el, 'keydown', 'Enter'); fire(el, 'keyup', 'Enter'); }
            bar.textContent = 'PhoneKB: typed "' + s.text + '" into ' + el.tagName;
        } catch (e) {
            bar.textContent = 'PhoneKB error: ' + e.message;
        }
    }, 400);
})();
