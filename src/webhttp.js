export default class {

  constructor (url, transmitHeaders, defaultResponder) {
    this.baseUrl = url || ''
    this.upHeaders = {}
    this.transmitHeaders = transmitHeaders || []
    this.responders = {}
    if (defaultResponder && defaultResponder instanceof Function) {
      this.responders.default = defaultResponder
    } else {
      this.responders.default = r => {
        console.error('no responder for ' + r.argot, r, this.responders)
      }
    }
  }

  setUpHeaders (k, v) {
    this.upHeaders[k] = v
  }

  registerResponder (k, v) {
    this.responders[k] = v
  }

  unregisterResponder (k) {
    delete this.responders[k]
  }

  get ({ path, headers, context, timeout }) {
    return this.request('GET', { path, headers, context, timeout })
  }

  post ({ path, data, headers, context, timeout }) {
    return this.request('POST', { path, data, headers, context, timeout })
  }

  put ({ path, data, headers, context, timeout }) {
    return this.request('PUT', { path, data, headers, context, timeout })
  }

  delete ({ path, data, headers, context, timeout }) {
    return this.request('DELETE', { path, data, headers, context, timeout })
  }

  //
  // mustPost ({ path, data, headers, context, timeout }) {
  //   return this.request('POST', { path, data, headers, context, timeout, must: true })
  // }
  //
  // mustPut ({ path, data, headers, context, timeout }) {
  //   return this.request('PUT', { path, data, headers, context, timeout, must: true })
  // }
  //
  // mustDelete ({ path, data, headers, context, timeout }) {
  //   return this.request('DELETE', { path, data, headers, context, timeout, must: true })
  // }

  head ({ path, data, headers, context, timeout }) {
    return this.request('HEAD', { path, data, headers, context, timeout })
  }

  request (method, { path, data, headers, context, timeout }) {
    if (!timeout) timeout = 30000
    let ac = new AbortController()
    let option = {
      signal: ac.signal,
      method: method || 'GET',
      headers: headers || {},
    }

    for (let k in this.upHeaders) {
      option.headers[k] = this.upHeaders[k]
    }

    if (data) {
      if (data instanceof HTMLFormElement) {
        option.body = new FormData(data)
      } else if (data instanceof FormData) {
        option.body = data
      } else if (typeof data === 'string') {
        option.body = data
        option.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        option.headers['Content-Length'] = option.body.length
      } else {
        option.body = JSON.stringify(data)
        option.headers['Content-Type'] = 'application/json'
        option.headers['Content-Length'] = option.body.length
      }
    }

    // TODO must
    let request = { method, path, data, headers, context, timeout }
    let response = {
      headers: {},
      status: 0,
    }

    let timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject({ ok: false, message: 'Timeout', argot: 'HintBadNetwork', _request: request, _response: response, _context: context })
        ac.abort()
      }, timeout)
    })

    let requestPromise = fetch(path, option).then(r => {
      response.status = r.status
      response.headers = r.headers
      for (let key of this.transmitHeaders) {
        let value = r.headers.get(key)
        if (value) {
          this.upHeaders[key] = value
        }
      }
      return r.text()
    })

    // 成功才会调用 resolve, 其他情况一律交给 responder 处理
    return new Promise((resolve, reject) => {
      Promise.race([timeoutPromise, requestPromise]).then(text => {
        let r
        try {
          r = JSON.parse(text)
        } catch (e) {
          r = { ok: false, message: text, argot: 'BadResponse' }
        }

        if (!r) r = { ok: false, message: '', argot: 'BadResponse' }
        r._request = request
        r._response = response
        r._context = context

        if (r.ok) {
          resolve(r)
        } else {
          if (r.argot) {
            setTimeout(() => {
              if (!this._getResponder(r.argot)(r)) reject(r)
            })
          } else {
            reject(r)
          }
        }
      }).catch(e => {
        let r = { ok: false, message: e.toString(), argot: 'HintBadNetwork', _request: request, _response: response, _context: context }
        if (r.argot) {
          setTimeout(() => {
            if (!this._getResponder(r.argot)(r)) reject(r)
          })
        } else {
          reject(r)
        }
      })
    })
  }

  _getResponder (argot) {
    let responder = this.responders[argot]
    if (!responder) responder = this.responders.default
    return responder
  }
}
