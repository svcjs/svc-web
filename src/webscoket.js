export default class {
  constructor(url, {onopen, onmessage, onerror, onclose, pingTimeout}) {
    this.url = url
    this.onopen = onopen || null
    this.onmessage = onmessage || null
    this.onerror = onerror || null
    this.onclose = onclose || null
    this.pingTimeout = pingTimeout || 5000
    this.conn = null
    this.running = false
    this.reconnecting = false
    this.checkerId = 0
    this.checkerIndex = 0
    this.lastPingTime = 0
  }

  start() {
    if (!this.running) {
      this.running = true
      this.connect()
      this.checkerId = setInterval(this.check.bind(this), 1000)
    }
  }

  stop() {
    if (this.running) {
      this.running = false
      if (this.conn) this.conn.close()
      clearInterval(this.checkerId)
      this.conn = null
    }
  }

  check() {
    if (!this.running) return

    this.checkerIndex++
    if (this.conn) {
      if (this.lastPingTime && new Date().getTime() - this.lastPingTime >= this.pingTimeout) {
        if (this.conn && this.conn.readyState !== WebSocket.CLOSED && this.conn.readyState !== WebSocket.CLOSING) this.conn.close()
        this.connect()
        this.lastPingTime = 0
      }

      if (this.checkerIndex >= 3) {
        if (this.conn.readyState === WebSocket.OPEN) {
          if (this.lastPingTime === 0) {
            this.lastPingTime = new Date().getTime()
            this.conn.send('PING')
          }
        } else if (this.conn.readyState === WebSocket.CLOSED && !this.reconnecting) {
          this.connect()
        }
      }
    }
    if (this.checkerIndex >= 3) this.checkerIndex = 0
  }

  connect() {
    if (!this.running) return
    if (this.conn && (this.conn.readyState === WebSocket.OPEN || this.conn.readyState === WebSocket.CONNECTING)) return

    this.reconnecting = false
    let conn = new WebSocket(this.url)
    this.conn = conn
    this.conn.onopen = this.onopen
    this.conn.onmessage = e => {
      this.lastPingTime = 0
      if (e.data !== 'PONG' && this.onmessage) {
        this.onmessage(e)
      }
    }
    this.conn.onerror = this.onerror
    this.conn.onclose = () => {
      if (this.running && this.conn === conn) {
        if (this.onclose) this.onclose()
        setTimeout(this.connect.bind(this), 1000)
        this.reconnecting = true
      }
    }
  }
}
