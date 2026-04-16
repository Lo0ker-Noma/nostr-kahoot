// Minimal Nostr relay WebSocket client
export class NostrRelay {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.subs = new Map(); // subId → callback
    this.ready = false;
    this.queue = [];
    this._connect();
  }

  _connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.ready = true;
        this.queue.forEach(msg => this.ws.send(msg));
        this.queue = [];
        console.log('[Nostr] Connected to', this.url);
      };
      this.ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data);
          const [type, subId, payload] = msg;
          if (type === 'EVENT' && this.subs.has(subId)) {
            this.subs.get(subId)(payload);
          }
        } catch {}
      };
      this.ws.onclose = () => {
        this.ready = false;
        console.log('[Nostr] Disconnected, reconnecting in 3s...');
        setTimeout(() => this._connect(), 3000);
      };
      this.ws.onerror = () => {
        this.ws.close();
      };
    } catch (e) {
      setTimeout(() => this._connect(), 3000);
    }
  }

  _send(data) {
    const msg = JSON.stringify(data);
    if (this.ready && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.queue.push(msg);
    }
  }

  publish(event) {
    this._send(['EVENT', event]);
  }

  subscribe(filter, onEvent) {
    const subId = `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    this.subs.set(subId, onEvent);
    this._send(['REQ', subId, filter]);
    return () => {
      this._send(['CLOSE', subId]);
      this.subs.delete(subId);
    };
  }
}

// Singleton relay instance
let _relay = null;

export function getRelay() {
  if (!_relay) {
    _relay = new NostrRelay('wss://relay.damus.io');
  }
  return _relay;
}

// One-shot metadata fetch for a pubkey (kind 0)
export function fetchNostrProfile(pubkey) {
  return new Promise((resolve) => {
    const fallback = {
      pubkey,
      name: `${pubkey.slice(0, 8)}...`,
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pubkey}`,
      nip05: null,
    };

    try {
      const ws = new WebSocket('wss://relay.damus.io');
      const timer = setTimeout(() => { ws.close(); resolve(fallback); }, 5000);

      ws.onopen = () => {
        ws.send(JSON.stringify(['REQ', 'meta', { kinds: [0], authors: [pubkey], limit: 1 }]));
      };

      ws.onmessage = ({ data }) => {
        try {
          const [type, , event] = JSON.parse(data);
          if (type === 'EVENT' && event?.kind === 0) {
            clearTimeout(timer);
            ws.close();
            const meta = JSON.parse(event.content);
            resolve({
              pubkey,
              name: meta.display_name || meta.name || fallback.name,
              picture: meta.picture || fallback.picture,
              nip05: meta.nip05 || null,
              about: meta.about || '',
            });
          }
        } catch {}
      };

      ws.onerror = () => { clearTimeout(timer); resolve(fallback); };
      ws.onclose = () => {}; // already handled above
    } catch {
      resolve(fallback);
    }
  });
}
