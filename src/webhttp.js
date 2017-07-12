export default class {
  constructor (url) {
    this.baseUrl = url
    this.upHeaders = {}
    this.transmitHeaders = []
  }

  post (url, data) {
    url = this.baseUrl + (url.charAt(0) === '/' ? '' : '/') + url
    let that = this
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Content-Type', 'application/json')
      for (let key in that.upHeaders) {
        xhr.setRequestHeader(key, that.upHeaders[key])
      }
      xhr.onload = function () {
        that.xhr = xhr
        if (this.status === 200) {
          for (let key of that.transmitHeaders) {
            let value = xhr.getResponseHeader(key)
            if (value) {
              that.upHeaders[key] = value
            }
          }
          resolve(JSON.parse(this.responseText))
        } else {
          resolve({code: this.status, message: this.statusText})
        }
      }
      xhr.onerror = function (err) {
        reject(err)
      }

      if (!data) data = {}
      xhr.send(JSON.stringify(data))
    })
  }
}
