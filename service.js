// Runs on the TV (TizenBrew Node service). Phone opens http://<tv-ip>:8099 and types;
// the injected userScript polls /state and writes the text into YouTube's focused field.
const http = require('http');

const PORT = 8099;
let state = { seq: 0, text: '', submit: false };
let polls = { count: 0, last: 0, from: '' };

const PAGE = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1">
<body style="font:18px sans-serif;margin:16px">
<h3>TV keyboard</h3>
<textarea id=t rows=3 style="width:100%;font:inherit" autofocus></textarea>
<p><button onclick="send(true)">Search / Enter</button> <button onclick="t.value='';send(false)">Clear</button></p>
<script>
const t=document.getElementById('t');
function send(submit){fetch('/text',{method:'POST',body:JSON.stringify({text:t.value,submit})})}
t.oninput=()=>send(false);
</script>`;

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method === 'POST' && req.url === '/text') {
        let body = '';
        req.on('data', (c) => { body += c; if (body.length > 10000) req.destroy(); });
        req.on('end', () => {
            try {
                const d = JSON.parse(body);
                state = { seq: state.seq + 1, text: String(d.text), submit: !!d.submit };
            } catch (e) {}
            res.end('ok');
        });
        return;
    }
    if (req.url === '/state') {
        polls = { count: polls.count + 1, last: Date.now(), from: req.socket.remoteAddress };
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(state));
    }
    if (req.url === '/debug') return res.end(JSON.stringify({ polls, now: Date.now() }));
    res.setHeader('Content-Type', 'text/html');
    res.end(PAGE);
}).listen(PORT, '0.0.0.0');
