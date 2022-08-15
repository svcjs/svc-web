import tpl from './webtpl'
import $ from './webutils'

function _$ (selector) {
  return $(selector, this.dom)
}

function _$all (selector, callback) {
  return $.all(selector, callback, this.dom)
}

function _makeEvents () {
  // console.info(999, this.$.all('[events]'), this)
  tpl.makeEvents(this.$.all('[events]'), this)
}

function setData (data) {
  for (let k in data) {
    this.data[k] = data[k]
  }
  if (this.onSetData) this.onSetData()
  return this.refreshView()
}

function refreshView (target, isMake) {
  if (this.onRefresh) this.onRefresh()
  return new Promise((resolve) => {
    setTimeout(function () {
      if (target) {
        let datas = { data: this.data || {} }
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
        tpl.make(this.dom, { data: this.data || {} })
      }
      if (this.makeEvents) this.makeEvents()
      if (this.onRefreshed) this.onRefreshed()
      resolve()
    }.bind(this), 0)
  })
}

let _modules = {}

export default {

  register: function (name, module) {
    if (typeof name === 'object') {
      for (let k in name) {
        _modules[k] = name[k]
      }
    } else {
      _modules[name] = module
    }
  },

  unregister: function (name) {
    delete _modules[name]
  },

  make: (target) => {
    target.$.all('[module]', node => {
      if (!node.getAttribute) return
      let moduleName = node.getAttribute('module')
      let moduleClassName = moduleName
      if (moduleName.indexOf(':') !== -1) {
        let a = moduleName.split(':')
        moduleName = a[0]
        moduleClassName = a[1]
      }

      let moduleClass = _modules[moduleClassName]
      if (moduleClass) {
        let module = new moduleClass()

        // 从属性中设置默认data
        for (let k in module.data) {
          let v = node.getAttribute(k)
          if (v) module.data[k] = v
          if (k === 'title') node.removeAttribute(k)
        }

        // 从调用方获得data
        if (!target.modules) target.modules = {}
        if (!target.modules[moduleName]) target.modules[moduleName] = {}
        if (target.modules[moduleName].data) {
          for (let k in target.modules[moduleName].data) {
            module.data[k] = target.modules[moduleName].data[k]
          }
        }

        // 从调用方获得事件
        if (target.modules[moduleName].event) {
          for (let k in target.modules[moduleName].event) {
            let eventFunc = target.modules[moduleName].event[k]
            if (eventFunc instanceof Function) {
              module[k] = eventFunc
            } else if (typeof eventFunc === 'string' && target[eventFunc]) {
              // if(k==='save2')console.info('~~~makeModule', k, eventFunc, target, module)
              module[k] = target[eventFunc].bind(target)
            }
          }
        }

        // 取出要替换的dom
        let optionDoms = {}
        $.all('[moduleOption]', optionDom => {
          let optionName = optionDom.getAttribute('moduleOption')
          optionDoms[optionName] = optionDom
        }, node)

        if (target.modules[moduleName].moduleOptions) {
          for (let k in target.modules[moduleName].moduleOptions) {
            let div = document.createElement('div')
            div.innerHTML = target.modules[moduleName].moduleOptions[k]
            optionDoms[k] = div
          }
        }

        // 替换dom
        node.innerHTML = module.html
        for (let optionName in optionDoms) {
          let optionDom = optionDoms[optionName]
          let oldDom = node.querySelector('[moduleOption="' + optionName + '"]')
          if (oldDom) {
            oldDom.parentNode.insertBefore(optionDom, oldDom)
            // 合并属性
            for (let k of oldDom.getAttributeNames()) {
              if (k === 'moduleoption') {
                // 忽略
              } else if (k === 'class') {
                // 合并样式
                let a1 = optionDom.className ? optionDom.className.split(/\s+/) : []
                let a2 = oldDom.className.split(/\s+/)
                for (let cls of a2) {
                  if (a1.indexOf(cls) === -1) {
                    a1.push(cls)
                  }
                }
                optionDom.className = a1.join(' ')
              } else if (k === 'style') {
                // 拼接样式
                optionDom.setAttribute(k, (optionDom.hasAttribute(k) ? optionDom.getAttribute(k) + ';' : '') + oldDom.getAttribute(k))
              } else {
                if (!optionDom.hasAttribute(k)) optionDom.setAttribute(k, oldDom.getAttribute(k))
              }
            }
            oldDom.parentNode.removeChild(oldDom)
          }
        }
        module.dom = node
        module.$ = _$.bind(module)
        module.$.all = _$all.bind(module)
        module.makeEvents = _makeEvents.bind(module)
        module.setData = setData.bind(module)
        module.refreshView = refreshView.bind(module)

        tpl.makeSubs(module.dom, { data: module.data })
        if (module.onCreate) module.onCreate()

        target.modules[moduleName] = module
      }
    })
  },

}
