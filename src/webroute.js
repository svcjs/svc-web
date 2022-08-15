import { Route } from 'svc-route'
import tpl from './webtpl'
import $ from './webutils'
import modules from './webmodules'

/*
global location
global XMLHttpRequest
 */

function _$ (selector) {
  return $(selector, document.querySelector('#SUBVIEW_' + this.parentPathName.replace(/\./, '_')))

  let nodes = this.$.all(selector)
  // console.info(selector, nodes)
  if (nodes.length > 0) return nodes[0]
  return document.querySelector('#SUBVIEW_' + this.parentPathName.replace(/\./, '_'))
}

function _filterNodes (nodes, from) {
  // 在路由中排除SUBVIEW和module
  let fixedNodes = []
  for (let node of nodes) {
    if (_isValidNode(node, from)) fixedNodes.push(node)
  }
  return fixedNodes
}

function _isValidNode (node, from) {
  // 判断node是否在SUBVIEW和module中
  let findNode = node
  while (findNode && findNode !== from) {
    // console.info((findNode.id && findNode.id.startsWith('SUBVIEW_')), '|', findNode.hasAttribute('module'), '|', findNode)
    if ((findNode.id && findNode.id.startsWith('SUBVIEW_')) || (findNode !== node && findNode.hasAttribute('module'))) {
      return false
    }
    findNode = findNode.parentNode
  }
  return true
}

function _$all (selector, callback) {
  let from = document.querySelector('#SUBVIEW_' + this.parentPathName.replace(/\./, '_'))
  if (callback && callback instanceof Function) {
    let realCallback = callback
    callback = function (node) {
      if (_isValidNode(node, from)) {
        realCallback(node)
      }
    }
  }
  let nodes = $.all(selector, callback, from)
  if (!callback) nodes = _filterNodes(nodes, from)
  return nodes
}

function _moveNodes (to, from) {
  while (from.childNodes.length > 0) {
    to.appendChild(from.childNodes[0])
  }
}

function _go (path, args) {
  if (path.startsWith('/')) {
    return this.route.go(path, args)
  } else {
    let urls = $.copy(this.urls)
    let a = path.split('/')
    for (let p of a) {
      if (p === '..') {
        urls.splice(urls.length - 1, 1)
      } else if (p !== '.') {
        urls.push(p)
      }
    }
    return this.route.go(urls, args)
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
      this.route.makeRoute()
    }
  }

  return this.refreshView()
}

function _refreshView (target, isMake) {
  return new Promise((resolve, reject) => {
    let refreshViewCallbacks = []
    refreshViewCallbacks.push([resolve, reject])
    setTimeout(function () {
      try {
        let datas = this.datas || {}
        datas.data = this.data
        if (target) {
          if (target.data) {
            for (let k in target.data) {
              datas[k] = target.data[k]
            }
          }
          if (isMake) {
            tpl.make(target, datas)
          } else {
            tpl.refresh(target, datas)
          }
        } else {
          tpl.make(this.$(), datas)
        }
        for (let callbacks of refreshViewCallbacks) {
          callbacks[0]()
        }
        if (this.makeEvents) this.makeEvents()
        if (this.onRefreshed) this.onRefreshed()
      } catch (err) {
        console.error(err)
        for (let callbacks of refreshViewCallbacks) {
          callbacks[1](err)
        }
      }
    }.bind(this), 0)
  })
}

function _makeEvents () {
  // console.info(888, this.$.all('[events]'), this)
  tpl.makeEvents(this.$.all('[events]'), this)
}

function _getView () {
  return window._cachedViews[this.pathName] || {}
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
      } else {
        setTimeout(function () {
          that.go(-1)
        })
      }
    })
    window.addEventListener('hashchange', () => {
      this.go(location.hash.substr(1))
    })
  }

  makeRoute (paths) {
    if (!paths) paths = this._routeHistories[this._routeHistoryPos]
    if (!paths) return
    // 预处理
    let parentView = this.Root
    let availablePaths = []
    let samePos = -1
    if (window._cachedViews === undefined) window._cachedViews = { ROOT: this.Root }
    let currentUrls = []
    for (let i = 0; i < paths.length; i++) {
      let path = paths[i]
      path.view = _getView.bind(path)
      currentUrls.push(path.url)
      let prevPath = this._prevPaths[i]
      let view = window._cachedViews[path.pathName]
      if (!view) {
        if (parentView.getSubView) {
          view = parentView.getSubView(path.name)
        } else if (parentView.subViews) {
          view = parentView.subViews[path.name]
        }
        if (!view) break
        // 生成dom节点
        view.dom = document.createElement('div')
        if (view.html) {
          // if (/\.html\s*$/.test(view.html)) {
          //   // let xhr = new XMLHttpRequest()
          //   // xhr.open('GET', view.html, false)
          //   // xhr.send()
          //   // view.html = xhr.responseText
          //   view.html = await new Promise(resolve => {
          //     var xhr = new XMLHttpRequest()
          //     xhr.open('GET', view.html)
          //     xhr.onload = function () {
          //       resolve(xhr.responseText || view.html + ' not exists')
          //     }
          //     xhr.onerror = function () {
          //       resolve(view.html + ' not exists')
          //     }
          //     xhr.send()
          //   })
          // }
          view.dom.innerHTML = view.html.replace(/\$this/g, 'window._cachedViews[\'' + path.pathName + '\']').replace('id="SUBVIEW"', 'id="SUBVIEW_' + path.pathName.replace(/\./, '_') + '"')
        }
        window._cachedViews[path.pathName] = view
        view.route = this
        view.parent = parentView
        view.nextPath = paths.length - 1 > i ? paths[i + 1] : null
        view.$ = _$.bind(view)
        view.$.all = _$all.bind(view)
        view.setData = _setData.bind(view)
        view.refreshView = _refreshView.bind(view)
        view.makeEvents = _makeEvents.bind(view)
        view.go = _go.bind(view)

        // 新路由节点调用 onCreate
        if (!view.data) {
          view.data = {}
        }
        if (view.onCreate) {
          view.onCreate({ path, prevPath, paths: availablePaths })
        }
      }
      availablePaths.push(path)
      view.pathName = path.pathName
      view.paths = $.copy(availablePaths)
      view.urls = $.copy(currentUrls)

      parentView = view
      if (prevPath && prevPath.url === path.url && samePos === i - 1) {
        samePos = i
      }
    }
    // 旧路由中不一样的部分调用 canHide，确认允许跳转
    for (let i = this._prevPaths.length - 1; i > samePos; i--) {
      let path = i === -1 ? { pathName: 'ROOT' } : this._prevPaths[i]
      let view = i === -1 ? this.Root : window._cachedViews[path.pathName]
      if (view.canHide) {
        if (!view.canHide(path, paths)) {
          return false
        }
      }
    }

    // 旧路由中不一样的部分调用 onHide
    for (let i = this._prevPaths.length - 1; i > samePos; i--) {
      let path = i === -1 ? { pathName: 'ROOT' } : this._prevPaths[i]
      let view = i === -1 ? this.Root : window._cachedViews[path.pathName]
      let prevPath = (i === 0 ? { pathName: 'ROOT' } : this._prevPaths[i - 1]) || null
      // let prevView = prevPath ? _cachedViews[prevPath.pathName] : null
      if (view.stateRegisters) {
        for (let bindKey in view.stateRegisters) {
          this.states.unbind(bindKey, view.stateRegisters[bindKey])
        }
      }
      if (view.stateBinds) {
        this.states.unbind(view.stateBinds, view)
      }

      if (view.onHide) view.onHide({ path, prevPath, paths: availablePaths })
      if (prevPath) {
        let container = document.querySelector('#SUBVIEW_' + prevPath.pathName.replace(/\./, '_'))
        if (container) {
          _moveNodes(view.dom, container)
        }
      }
    }

    // 新路由中不一样的部分调用 onShow
    for (let i = Math.min(0, samePos); i < availablePaths.length; i++) {
      let path = i === -1 ? { pathName: 'ROOT' } : availablePaths[i]
      let view = window._cachedViews[path.pathName]
      let prevPath = i > 1 ? availablePaths[i - 1] : null
      let nextPath = i < availablePaths.length - 1 ? availablePaths[i + 1] : null
      let nextView = nextPath ? window._cachedViews[nextPath.pathName] : null
      let oldPath = this._prevPaths[i] || {}

      // 路由中未变化的部分
      if (i < samePos) {
        if (view.onCheckShowed) view.onCheckShowed({ oldPath, path, prevPath, paths: availablePaths, nextPath, nextView })
        continue
      }

      if (nextView) {
        nextView.parentPathName = path.pathName
        if (view.data) {
          // 默认维护 subName
          view.data.subName = nextPath.name
        }
        // nextView.$ = this.$
        // console.info(999, '#SUBVIEW_' + path.pathName.replace(/\./, '_'), document.querySelector('#SUBVIEW_' + path.pathName.replace(/\./, '_')))
        let container = document.querySelector('#SUBVIEW_' + path.pathName.replace(/\./, '_'))
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

      // 路由中未变化的部分
      if (i == samePos) {
        if (view.onCheckShowed) view.onCheckShowed({ oldPath, path, prevPath, paths: availablePaths, nextPath, nextView })
      }

      if (i > samePos) {
        if (!view.created) {
          view.created = true
          if (view.onCreated) view.onCreated({ path, prevPath, paths: availablePaths, nextPath, nextView })
          modules.make(view)  // 处理模块
        }

        // console.info(' *******************\n', oldPath, path)
        // 路由变化触发 onShow
        if (view.onShow) view.onShow({ oldPath, path, prevPath, paths: availablePaths, nextPath, nextView })

        // 自动绑定state，并触发一次所有绑定事件
        if (view.stateRegisters) {
          for (let bindKey in view.stateRegisters) {
            let bindTarget = view.stateRegisters[bindKey]
            this.states.bind(bindKey, bindTarget)
            // console.info(111, bindKey, typeof bindTarget, bindTarget.setData, typeof bindTarget.setData)
            if (typeof bindTarget === 'function') {
              bindTarget(this.states.get(bindKey))
            } else if (bindTarget instanceof Array && bindTarget.length === 2) {
              if (typeof bindTarget[1] === 'function') {
                bindTarget[1].call(bindTarget[0], this.states.get(bindKey))
              } else if (typeof bindTarget[0][bindTarget[1]] === 'function') {
                bindTarget[0][bindTarget[1]].call(bindTarget[0], this.states.get(bindKey))
              }
            } else if (typeof bindTarget === 'object' && typeof bindTarget.setData === 'function') {
              bindTarget.setData(this.states.get(bindKey))
            }
          }
        }

        // console.info('>>>', view.pathName, view.stateBinds)
        if (view.stateBinds) {
          this.states.bind(view.stateBinds, view)
          for (let bind of view.stateBinds) {
            if (typeof bind === 'string') {
              view.data[bind] = this.states.state[bind]
            } else if (bind instanceof Array && bind.length === 2) {
              view.data[bind[1]] = this.states.state[bind[0]]
            }
          }
        }
      }

      if (view.refreshView) view.refreshView()
    }

    this._prevPaths = availablePaths
    return true
  }
}
