// Injected into youtube.com/tv. Polls the local service and types into the focused text field.
(function () {
    let seen = 0;

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
            const s = await (await fetch('http://localhost:8099/state')).json();
            if (s.seq === seen) return;
            seen = s.seq;
            const el = field();
            if (!el) return;
            const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
            setter.call(el, s.text);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            if (s.submit) { fire(el, 'keydown', 'Enter'); fire(el, 'keyup', 'Enter'); }
        } catch (e) {}
    }, 400);
})();
