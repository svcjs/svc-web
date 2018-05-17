import { Route } from 'svc-route'
import Tpl from './webtpl'

/*
global location
global XMLHttpRequest
 */

let tpl = new Tpl()

function _$ (selector) {
  return document.querySelector('#SUBVIEW_' + this.parentPathName + ' ' + (selector || ''))
}

function _moveNodes (to, from) {
  while (from.childNodes.length > 0) {
    to.appendChild(from.childNodes[0])
  }
}

function _setData (values) {
  let routeChanged = false
  let path = null
  for (let key in values) {
    this.data[key] = values[key]
    // 绑定的参数反向同步到路由
    if (this.routeBinds && this.routeBinds.indexOf(key) !== -1) {
      // 查找当前路由节点
      if (path === null) {
        for (let p of this.route._routeHistories[this.route._routeHistoryPos]) {
          if (p.pathName === this.pathName) {
            path = p
          }
        }
      }
      // 比较数据是否变更
      if (path) {
        if (path.args[key] !== this.data[key]) {
          path.args[key] = this.data[key]
          routeChanged = true
        }
      }
    }

    // 数据变化后反向同步到路由
    if (routeChanged) {
      this.route.remakeRouteUrl()
      location.hash = '#' + this.route.routeUrl
    }
  }
  return this.refreshView()
}

function _refreshView () {
  return new Promise((resolve, reject) => {
    if (!this._refreshViewCallbacks) this._refreshViewCallbacks = []
    this._refreshViewCallbacks.push([resolve, reject])
    if (!this._refreshViewTID) {
      setTimeout(function () {
        try {
          let datas = this.datas || {}
          datas.data = this.data
          tpl.make(this.$(), datas)
          for (let callbacks of this._refreshViewCallbacks) {
            callbacks[0]()
          }
        } catch (err) {
          for (let callbacks of this._refreshViewCallbacks) {
            callbacks[1](err)
          }
        } finally {
          this._refreshViewTID = 0
          this._refreshViewCallbacks = []
        }
      }.bind(this), 0)
    }
  })
}

export default class extends Route {
  constructor (states) {
    super()

    this.states = states
    this._prevPaths = []
  }

  bindHash () {
    let that = this
    this.bind('*', (paths) => {
      if (that.makeRoute(paths)) {
        location.hash = '#' + this.routeUrl
      }else{
        this.go(-1)
      }
    })
    window.addEventListener('hashchange', () => {
      this.go(location.hash.substr(1))
    })
  }

  makeRoute (paths) {
    // 预处理
    let parentView = this.Root
    let availablePaths = []
    let samePos = -1
    if (window._cachedViews === undefined) window._cachedViews = {ROOT: this.Root}
    for (let i = 0; i < paths.length; i++) {
      let path = paths[i]
      let prevPath = this._prevPaths[i]
      let view = window._cachedViews[path.pathName]
      if (!view) {
        if (parentView.getSubView) view = parentView.getSubView(path.name)
        if (!view) break
        // 生成dom节点
        view.dom = document.createElement('div')
        if (view.html) {
          if (/\.html\s*$/.test(view.html)) {
            let xhr = new XMLHttpRequest()
            xhr.open('GET', view.html, false)
            xhr.send()
            view.html = xhr.responseText
          }
          view.dom.innerHTML = view.html.replace(/\$this/g, 'window._cachedViews[\'' + path.pathName + '\']').replace('id="SUBVIEW"', 'id="SUBVIEW_' + path.pathName + '"')
        }
        window._cachedViews[path.pathName] = view
        // 新路由节点调用 onCreate
        if (view.onCreate) {
          view.onCreate(path)
        }
        if (!view.data) {
          view.data = {}
        }
        view.route = this
        view.$ = _$
        view.setData = _setData
        view.refreshView = _refreshView
      }
      view.pathName = path.pathName
      availablePaths.push(path)
      parentView = view
      if (prevPath && prevPath.url === path.url && samePos === i - 1) {
        samePos = i
      }
    }

    // 旧路由中不一样的部分调用 canHide，确认允许跳转
    for (let i = this._prevPaths.length - 1; i > samePos; i--) {
      let path = i === -1 ? {pathName: 'ROOT'} : this._prevPaths[i]
      let view = i === -1 ? this.Root : window._cachedViews[path.pathName]
      if (view.canHide) {
        if (!view.canHide(path, paths)) {
          return false
        }
      }
    }

    // 旧路由中不一样的部分调用 onHide
    for (let i = this._prevPaths.length - 1; i > samePos; i--) {
      let path = i === -1 ? {pathName: 'ROOT'} : this._prevPaths[i]
      let view = i === -1 ? this.Root : window._cachedViews[path.pathName]
      let prevPath = (i === 0 ? {pathName: 'ROOT'} : this._prevPaths[i - 1]) || null
      // let prevView = prevPath ? _cachedViews[prevPath.pathName] : null
      if (view.stateRegisters) {
        for (let bind of view.stateRegisters) {
          if (bind instanceof Array && bind.length >= 2) {
            this.states.unbind(bind[0], bind[1])
          }
        }
      }
      if (view.stateRegisters) {
        this.states.unbind(view.stateBinds, view)
      }

      if (view.onHide) view.onHide(path)
      if (prevPath) {
        let container = document.querySelector('#SUBVIEW_' + prevPath.pathName)
        if (container) {
          _moveNodes(view.dom, container)
        }
      }
    }

    // 新路由中不一样的部分调用 onShow
    for (let i = samePos; i < availablePaths.length; i++) {
      let path = i === -1 ? {pathName: 'ROOT'} : availablePaths[i]
      let view = window._cachedViews[path.pathName]
      let nextPath = availablePaths[i + 1] || null
      let nextView = nextPath ? window._cachedViews[nextPath.pathName] : null
      if (nextView) {
        nextView.parentPathName = path.pathName
        if (view.data) {
          // 默认维护 subName
          view.data.subName = nextPath.name
        }
        // nextView.$ = this.$
        let container = document.querySelector('#SUBVIEW_' + path.pathName)
        if (container) {
          _moveNodes(container, nextView.dom)
        }
      }

      // 路由参数并入 view.data
      if (view.routeBinds) {
        for (let k of view.routeBinds) {
          view.data[k] = path.args[k]
        }
      }

      if (i > samePos) {
        if (view.onShow) view.onShow(path, nextPath, nextView)
        // 自动绑定state，并触发一次所有绑定事件
        if (view.stateRegisters) {
          for (let bind of view.stateRegisters) {
            if (bind instanceof Array && bind.length >= 2) {
              this.states.bind(bind[0], bind[1])
              if (typeof bind[1] === 'function') {
                bind[1](this.states.get(bind[0]))
              } else if (typeof bind[1] === 'object' && typeof bind[1].setData === 'function') {
                bind[1].setData(this.states.get(bind[0]))
              }
            }
          }
        }
        if (view.stateBinds) {
          this.states.bind(view.stateBinds, view)
          for (let bind of view.stateBinds) {
            view.data[bind] = this.states.state[bind]
          }
        }
      }

      if (view.refreshView) view.refreshView()
    }

    this._prevPaths = availablePaths

    return true
  }
}
