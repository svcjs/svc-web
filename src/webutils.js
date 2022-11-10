let $ = (id, from, inRoute) => {
  if (!from) from = document.body
  if (typeof from === 'string') from = $(from)
  if (!id) return from
  if (typeof id !== 'string') return id

  if (inRoute && from) {
    let nodes = $.all(id, from, inRoute)
    if (nodes.length > 0) return nodes[0]
    return null
  }

  return from.querySelector(id)
}

$.all = (id, callback, from, inRoute) => {
  if (!from) from = document.body
  if (typeof from === 'string') from = $(from)
  if (callback instanceof HTMLElement) {
    from = callback
    callback = null
  }

  // let nodes = from.querySelectorAll(id)
  let nodes = []
  if (typeof id === 'string') {
    nodes = from.querySelectorAll(id)
  } else {
    nodes = [id]
  }
  // for (let node of nodes) {
  //   if (id === '[events]' && node.getAttribute('events') === 'dragover,drop') {
  //     console.info(' ###', node.getAttribute('events'), node)
  //   }
  // }

  // 在路由中排除SUBVIEW
  if (inRoute && from) {
    let fixedNodes = []
    for (let node of nodes) {
      let ok = true
      let findNode = node
      while (findNode && findNode !== from) {
        if (findNode.id && findNode.id.startsWith('SUBVIEW_')) {
          ok = false
          break
        }
        findNode = findNode.parentNode
      }
      if (ok) fixedNodes.push(node)
    }
    nodes = fixedNodes
  }

  if (callback && callback instanceof Function) {
    for (let node of nodes) {
      callback(node)
    }
  } else {
    return nodes
  }
}

$.clear = node => {
  if (typeof node === 'string') node = $(node)
  while (node.childNodes.length) node.removeChild(node.childNodes[0])
}

$.show = (id, from) => {
  $.all(id, node => {
    let display = node.getAttribute('display') || 'block'
    if (display === 'visibility') {
      node.style.visibility = 'visible'
    } else {
      node.style.display = display
    }
    let renderBox = node.hasAttribute('renderBox') ? node : $('[renderBox]', node)
    if (renderBox && renderBox.renderAction) renderBox.renderAction() // 动态渲染对象触发一次滚动
  }, from)
}

$.hide = (id, from) => {
  $.all(id, node => {
    let display = node.getAttribute('display') || 'block'
    if (display === 'visibility') {
      node.style.visibility = 'hidden'
    } else {
      node.style.display = 'none'
    }
  }, from)
}

$.childs = (id, from) => {
  if (id instanceof HTMLElement) {
    return [id]
  } else {
    return $.all(id, null, from)
  }
}

$.hasClass = (id, className, from) => {
  for (let node of $.childs(id, from)) {
    let a = node.className.split(/\s+/)
    if (a.indexOf(className) !== -1) {
      return true
    }
  }
  return false
}

$.addClass = (id, classNames, from) => {
  for (let node of $.childs(id, from)) {
    let a = node.className.split(/\s+/)
    for (let className of classNames.split(' ')) {
      if (a.indexOf(className) === -1) {
        a.push(className)
      }
    }
    node.className = a.join(' ')
  }
}

$.addClassAutoRemove = (id, className, from, delay) => {
  return new Promise(resolve => {
    $.addClass(id, className, from)
    setTimeout(() => {
      $.removeClass(id, className, from)
      resolve()
    }, delay || 1000)
  })
}

$.removeClass = (id, classNames, from) => {
  for (let node of $.childs(id, from)) {
    let a = node.className.split(/\s+/)
    for (let className of classNames.split(' ')) {
      let pos = a.indexOf(className)
      if (pos !== -1) {
        a.splice(pos, 1)
      }
    }
    node.className = a.join(' ')
  }
}

$.toggleClass = (id, className, from) => {
  for (let node of $.childs(id, from)) {
    let a = node.className.split(/\s+/)
    let pos = a.indexOf(className)
    if (pos !== -1) {
      a.splice(pos, 1)
      node.className = a.join(' ')
    } else {
      a.push(className)
      node.className = a.join(' ')
    }
  }
}

$.keysBy = (obj, ...fieldAndValues) => {
  let keys = []
  for (let k in obj) {
    let match = true
    if (fieldAndValues.length === 1) {
      // 查找一位数组
      if (obj[k] != fieldAndValues[0]) {
        match = false
      }
    } else {
      // 查找二维数组
      for (let i = 0; i < fieldAndValues.length; i += 2) {
        if (obj[k][fieldAndValues[i]] != fieldAndValues[i + 1]) {
          match = false
          break
        }
      }
    }
    if (match) {
      keys.push(k)
    }
  }
  return keys
}

$.listBy = (obj, ...fieldAndValues) => {
  let list = obj instanceof Array ? [] : {}
  let keys = $.keysBy(obj, ...fieldAndValues)
  for (let k of keys) {
    if (obj instanceof Array) {
      list.push(obj[k])
    } else {
      list[k] = obj[k]
    }
  }
  return list
}

$.hasBy = (obj, ...fieldAndValues) => {
  let keys = $.keysBy(obj, ...fieldAndValues)
  return keys.length > 0
}

$.getBy = (obj, ...fieldAndValues) => {
  let keys = $.keysBy(obj, ...fieldAndValues)
  if (keys.length > 0) return obj[keys[0]]
  return null
}

$.setBy = (obj, value, ...fieldAndValues) => {
  let keys = $.keysBy(obj, ...fieldAndValues)
  if (keys.length > 0) obj[keys[0]] = value
}

$.indexBy = (obj, ...fieldAndValues) => {
  let keys = $.keysBy(obj, ...fieldAndValues)
  if (keys.length > 0) {
    return obj instanceof Array ? $.int(keys[0]) : keys[0]
  }
  return -1
}

$.removeBy = (obj, ...fieldAndValues) => {
  let keys = $.keysBy(obj, ...fieldAndValues)
  let n = 0
  for (let i = keys.length - 1; i >= 0; i--) {
    let k = keys[i]
    if (obj instanceof Array) {
      obj.splice(k, 1)
    } else {
      delete obj[k]
    }
    n++
  }
  return n
}

$.removeArrayItem = (list, item) => {
  let pos = list.indexOf(item)
  if (pos !== -1) list.splice(pos, 1)
}

$.len = (obj) => {
  if (obj instanceof Array) {
    return obj.length
  } else {
    let n = 0
    for (let k in obj) n++
    return n
  }
}

$.mergeBy = (olds, news, ...fields) => {
  if (!olds) return news
  for (let newItem of news) {
    let fieldAndValues = []
    for (let field of fields) {
      fieldAndValues.push(field, newItem[field])
    }
    let oldIndex = $.indexBy(olds, ...fieldAndValues)
    if (oldIndex === -1) {
      olds.push(newItem)
    } else {
      olds[oldIndex] = newItem
    }
  }
  return olds
}

$.sortBy = (obj, field, isReverse = false) => {
  let list = obj instanceof Array ? [] : {}
  let sortedKeys = {}
  let sortArr = []
  for (let k in obj) {
    if (!sortedKeys[obj[k][field]]) {
      sortedKeys[obj[k][field]] = true
      sortArr.push(obj[k][field])
    }
  }
  sortArr.sort((a, b) => {
    if (a == b) return 0
    if (typeof a === 'number' && typeof b === 'number') {
      return isReverse ? b - a : a - b
    } else {
      return (isReverse ? a < b : a > b) ? 1 : -1
    }
  })
  for (let sortKey of sortArr) {
    for (let k in obj) {
      if (obj instanceof Array) {
        if (obj[k][field] == sortKey) list.push(obj[k])
      } else {
        if (obj[k][field] == sortKey) list[k] = obj[k]
      }
    }
  }
  return list
}

$.inSet = (v1, v2) => {
  if (!(v1 instanceof Array)) v1 = String(v1).split(/,\s*/)
  return v1.indexOf(String(v2)) !== -1
}

$.copy = (obj) => {
  let newObj
  if (obj instanceof Array) {
    newObj = []
    for (let o of obj) {
      if (typeof o === 'object') o = $.copy(o)
      newObj.push(o)
    }
  } else {
    newObj = {}
    for (let k in obj) {
      let v = obj[k]
      if (typeof v === 'object') v = $.copy(v)
      newObj[k] = v
    }
  }

  return newObj
}

$.domIndex = (dom) => {
  if (dom && dom.parentNode) {
    let nodes = dom.parentNode.children
    let index = -1
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] === dom) {
        index = i
        break
      }
    }
    return index
  }
  return -1
}

let _loaded = false
let _tasks = []

addEventListener('load', () => {
  _loaded = true
  for (let task of _tasks) {
    task()
  }
})

$.runWhenLoaded = (task, override) => {
  if (_loaded) {
    task()
  } else {
    if (override && _tasks.length) _tasks = [] // 覆盖之前的任务
    _tasks.push(task)
  }
}

$.formatDate = function (date, fmt, timezone) {
  let ret
  if (!date) return ''

  // console.info(11, date, fmt)
  const opt = {
    'YYYY': date.getFullYear().toString(),        // 年
    'YY': date.getFullYear().toString().substring(2),        // 年
    'm+': (date.getMonth() + 1).toString(),     // 月
    'd+': date.getDate().toString(),            // 日
    'H+': date.getHours().toString(),           // 时
    'h+': (date.getHours() % 12).toString(),      // 12时制
    'APM': (date.getHours() > 12 ? 'PM' : 'AM'),      // 12时制
    'M+': date.getMinutes().toString(),         // 分
    'S+': date.getSeconds().toString(),         // 秒
    'YW': 'W' + Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 0))) / (24 * 60 * 60 * 1000) / 7),           // 第几周
  }
  for (let k in opt) {
    ret = new RegExp('(' + k + ')').exec(fmt)
    if (ret) {
      fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, '0')))
    }

  }
  // console.info(111, fmt)
  return fmt
}

$.parseDate = function (str) {
  // 2006-01-02 15:03:04
  if (str.length === 19) {
    return new Date(parseInt(str.substr(0, 4)), parseInt(str.substr(5, 2)) - 1, parseInt(str.substr(8, 2)), parseInt(str.substr(11, 2)), parseInt(str.substr(14, 2)), parseInt(str.substr(17, 2)))
  } else if (str.length === 10) {
    return new Date(parseInt(str.substr(0, 4)), parseInt(str.substr(5, 2)) - 1, parseInt(str.substr(8, 2)))
  } else if (str.length === 7) {
    return new Date(parseInt(str.substr(0, 4)), parseInt(str.substr(5, 2)) - 1, 1)
  } else if (str.length === 8) {
    let date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(str.substr(0, 2)), parseInt(str.substr(3, 2)), parseInt(str.substr(6, 2)))
  } else if (str.length === 5) {
    let date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(str.substr(0, 2)), parseInt(str.substr(3, 2)), 0)
  }
}

$.offsetPosition = (node, excludeSelf) => {
  let x = 0
  let y = 0
  if (excludeSelf) node = node.offsetParent
  while (node && node !== document.body) {
    let position = getComputedStyle(node).position
    if (position === 'relative' || position === 'absolute' || position === 'fixed' || position === 'sticky') break
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent
  }
  return { x, y }
}

$.fixedPosition = (node, excludeSelf) => {
  let x = 0
  let y = 0
  if (excludeSelf) node = node.offsetParent
  while (node && node !== document.body) {
    if (node.scrollTop) y -= node.scrollTop
    if (node.scrollLeft) x -= node.scrollLeft
    let position = getComputedStyle(node).position
    // console.info(991, position, node.scrollTop, node.offsetTop)
    x += node.offsetLeft
    y += node.offsetTop
    // console.info(992, node.scrollTop, node.offsetTop)
    node = node.offsetParent
  }
  // console.info(999, x, y)
  return { x, y }
}

// let popupInited = false
let popupTargets = []
// let popupClassName = ''
// let savedOverflow = null
// $.popup = (view, event, direct) => {
//   $.showPopup(view)
//
//   if (!direct) direct = 'right'
//   // let { x, y } = $.offsetPosition(node)
//   // let fixedXY = $.offsetPosition(view, true)
//   // view.style.top = (y - fixedXY.y + node.clientHeight) + 'px'
//   // x -= fixedXY.x
//   // savedOverflow = view.offsetParent.style.overflow
//   // view.offsetParent.style.overflow = 'visible'
//
//   // let subMenuParent = view.offsetParent
//   // if (x + view.clientWidth > subMenuParent.clientWidth) x = subMenuParent.clientWidth - view.clientWidth
//   // view.style.left = x + 'px'
//   let offsetX = 0
//   if (direct === 'left') offsetX = view.clientWidth * -1
//   view.style.left = (event.pageX + offsetX) + 'px'
//   view.style.top = event.pageY + 'px'
// }

window.addEventListener('click', event => {
  if (popupTargets.length > 0) {
    let target = event.target
    let outViews = []
    for (let o of popupTargets) outViews.push(o)
    while (target) {
      let pos = outViews.indexOf(target)
      if (pos !== -1) {
        outViews.splice(pos, 1)
      }
      target = target.parentNode
      if (target.nodeName === 'BODY') break
    }

    for (let i = outViews.length - 1; i >= 0; i--) {
      let view = outViews[i]
      // $.removeClass(view, view.getAttribute('show') || 'd-block')
      $.hide(view)
      popupTargets.splice(popupTargets.indexOf(view), 1)
    }
  }
})

$.showPopup = (view) => {
  // if (popupTargets.length > 0) $.closePopup()
  // let showClass = view.getAttribute('show')
  // if (showClass) {
  //   $.addClass(view, showClass)
  // } else {
  // }
  return new Promise(resolve => {
    setTimeout(() => {
      // 延后设置，防止显示的点击事件直接触发关闭
      $.show(view)
      popupTargets.push(view)
      resolve()
    })
  })
  // if (!popupInited) {
  //   // setTimeout(() => {
  //   //
  //   // })
  //   popupInited = true
  // }
}

$.closePopup = (view) => {
  if (!view && popupTargets.length > 0) view = popupTargets[popupTargets.length - 1]
  if (view) {
    // let showClass = view.getAttribute('show')
    // if (showClass) {
    //   $.removeClass(view, showClass)
    // } else {
    $.hide(view)
    // }
    let pos = popupTargets.indexOf(view)
    if (pos !== -1) popupTargets.splice(pos, 1)
  }
}

$.copyToClipBoard = function (content) {
  let dom = document.createElement('textarea')
  dom.style.position = 'absolute'
  dom.style.opacity = '0'
  dom.value = content
  document.body.appendChild(dom)
  dom.select()
  document.execCommand('copy')
  document.body.removeChild(dom)
}

$.json = function (value) {
  try {
    return JSON.stringify(value)
  } catch (err) {
    return value
  }
}

$.unJson = function (value) {
  try {
    return JSON.parse(value)
  } catch (err) {
    return value
  }
}

let storagePrefix = ''
$.storage = {
  init: function (prefix) {
    storagePrefix = prefix
  },
  get: function (key) {
    if (key instanceof Array) {
      let o = {}
      for (let k of key) {
        o[k] = $.unJson(localStorage[storagePrefix + k])
      }
      return o
    } else {
      return $.unJson(localStorage[storagePrefix + key])
    }
  },
  set: function (key, value) {
    if (typeof key !== 'string') {
      for (let k in key) {
        localStorage[storagePrefix + k] = $.json(key[k]) || ''
      }
    } else {
      localStorage[storagePrefix + key] = $.json(value) || ''
    }
  },
}

function followScrollX (event) {
  if (event.currentTarget.followScrollX) {
    event.currentTarget.followScrollX.scrollLeft = event.currentTarget.scrollLeft
  }
}

$.fixTable = function (target) {
  if (target) {
    let tables = $.all('table', target)
    if (tables.length === 2) {
      let headerCols = $.all('th, td', tables[0])
      let bodyCols = $.all('tr:first-child th, tr:first-child td', tables[1])
      if (headerCols.length && bodyCols.length) {
        for (let i = 0; i < headerCols.length; i++) {
          if (bodyCols[i]) headerCols[i].style.width = getComputedStyle(bodyCols[i]).width
        }
      }

      // 让表头跟着一起滚动
      if (!tables[1].parentNode.followScrollX) {
        tables[1].parentNode.followScrollX = tables[0].parentNode
        tables[1].parentNode.addEventListener('scroll', followScrollX)
      }
    }
  }
}

$.fixAllTables = function (from) {
  $.all('.fixedTable', target => {
    $.fixTable(target)
  }, from)
}

let windowResizingTask = 0
let startedFixTable = false
$.startFixTable = function () {
  if (startedFixTable) return
  startedFixTable = true
  window.addEventListener('resize', event => {
    if (windowResizingTask) clearTimeout(windowResizingTask)
    windowResizingTask = setTimeout($.fixAllTables, 100)
  })
}

$.findDomAttribute = function (target, attr, parent) {
  if (!parent) parent = document.body
  while (target && target !== parent) {
    if (target.hasAttribute(attr)) return target.getAttribute(attr)
    target = target.parentNode
  }
  return ''
}

$.findDomProperty = function (target, property, parent) {
  if (!parent) parent = document.body
  while (target && target !== parent) {
    if (target[property]) return target[property]
    target = target.parentNode
  }
  return {}
}

$.findDomByAttribute = function (target, attr, parent) {
  if (!parent) parent = document.body
  while (target && target !== parent) {
    if (target.hasAttribute(attr)) return target
    target = target.parentNode
  }
  return null
}

$.findDomByProperty = function (target, property, parent) {
  if (!parent) parent = document.body
  while (target && target !== parent) {
    if (target[property]) return target
    target = target.parentNode
  }
  return null
}

$.findDomByClass = function (target, className, parent) {
  if (!parent) parent = document.body
  while (target && target !== parent) {
    if ($.hasClass(target, className)) return target
    target = target.parentNode
  }
  return ''
}

$.findDomByTagName = function (target, tagName, parent) {
  if (!parent) parent = document.body
  while (target && target !== parent) {
    if (target.tagName === tagName.toUpperCase()) return target
    target = target.parentNode
  }
  return ''
}

$.int = function (input) {
  if (input instanceof Number) return input
  try {
    return parseInt(input)
  } catch (err) {
    return 0
  }
}

$.float = function (input) {
  if (input instanceof Number) return input
  try {
    return parseFloat(input)
  } catch (err) {
    return 0.0
  }
}

let timers = {}
$.timer = function (name, isNew) {
  if (timers[name] && !isNew) return timers[name]
  let timer = {
    name: name,
    startTime: new Date().getTime(),
    trace: function (name) {
      let lastTime = new Date().getTime()
      let totalDuration = lastTime - this.startTime
      let lastDuration = this.lastTime ? lastTime - this.lastTime : totalDuration
      this.lastTime = lastTime
      console.info('###', this.name, name, lastTime, lastDuration, totalDuration)
    },
  }
  timers[name] = timer
  console.info('###', name, timer.startTime)
  return timer
}

export default $
