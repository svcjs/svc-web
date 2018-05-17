function _setVarsValue (vars, value, datas) {
  let data = datas
  for (let i = 0; i < vars.length - 1; i++) {
    data = data[vars[i]]
    if (!data) return
  }
  data[vars[vars.length - 1]] = value
}

// function _makeString (str, datas) {
//   let defines = ''
//   for (let key in datas) {
//     defines += 'let ' + key + ' = datas["' + key + '"];'
//   }
//   str = str.replace(/\{(.+?)\}/g, function (full, part1) {
//     try {
//       let result = eval(defines + 'eval(part1)')
//       if (result === undefined || result === null) return ''
//       return result
//     } catch (err) {
//       return full
//     }
//   })
//   return str
// }

function _makeString (str, datas) {
  let args = []
  let values = []
  for (let key in datas) {
    args.push(key)
    values.push(datas[key])
  }
  let lastArgsIndex = args.length
  args.push('return null')

  str = str.replace(/\{(.+?)\}/g, function (full, part1) {
    try {
      args[lastArgsIndex] = 'return ' + part1
      let func = Function.constructor.apply(null, args)
      let result = func.apply(null, values)
      if (result === undefined || result === null) return ''
      return result
    } catch (err) {
      return full
    }
  })
  return str
}

export default class {
  refresh (node, datas) {
    // 仅处理属性
    if (node.vars) {
      for (let key in node.vars) {
        let newValue = _makeString(node.vars[key], datas)
        if (key === 'className' || key === 'data') {
          node[key] = newValue
        } else {
          node.setAttribute(key, newValue)
        }
      }
    }
    this.make(node, datas)
  }

  make (targetNode, datas) {
    let nodes = []
    for (let node of targetNode.childNodes) {
      nodes.push(node)
    }
    for (let node of nodes) {
      if (node.isTplMaked) {
        node.parentElement.removeChild(node)
        continue
      }

      // 初始化循环和条件
      if (node.attributes && (node.attributes.each || node.attributes['if'])) {
        let which = node.attributes.each ? 'each' : 'if'
        let cdom = document.createComment('')
        if (node.attributes.each) {
          cdom.eachs = {index: 'index', item: 'item', items: ''}
          let eachs = node.getAttribute('each').split(/\s*,\s*|\s+in\s+/i).reverse()
          cdom.eachs.items = eachs[0]
          if (eachs.length > 1) cdom.eachs.item = eachs[1]
          if (eachs.length > 2) cdom.eachs.index = eachs[2]
        } else {
          cdom['ifs'] = node.getAttribute('if')
        }
        node.removeAttribute(which)
        cdom.htmlTpl = node.outerHTML
        cdom.parentTagName = node.parentElement.tagName
        node.parentElement.insertBefore(cdom, node)
        node.parentElement.removeChild(node)
        node = cdom // 让下面可以立刻处理
      }

      // 初始化属性
      if (node.vars === undefined) {
        node.vars = false
        let vars = {}
        if (node.attributes) {
          // 待处理列表
          // for (let attr of node.attributes) {
          for (let i in node.attributes) {
            let attr = node.attributes[i]
            if (attr.value && attr.value.indexOf('{') !== -1 && attr.value.indexOf('}') !== -1) {
              if (attr.name === 'class') {
                vars['className'] = attr.value
                node.className = ''
              } else {
                vars[attr.name] = attr.value
                node.setAttribute(attr.name, '')
              }
              if (!node.vars) node.vars = vars
            }
          }
        }

        // 处理 TextNode
        if (node.data && node.data.indexOf('{') !== -1 && node.data.indexOf('}') !== -1) {
          vars['data'] = node.data
          node.data = ''
          if (!node.vars) node.vars = vars
        }
      }

      // 处理属性
      if (node.vars) {
        for (let key in node.vars) {
          let newValue = _makeString(node.vars[key], datas)
          if (key === 'className' || key === 'data') {
            node[key] = newValue
          } else {
            node.setAttribute(key, newValue)
          }
        }
      }

      // 初始化数据绑定 bind
      if (node.binds === undefined) {
        node.binds = false
        if (node.attributes && node.attributes.bind) {
          node.binds = node.attributes.bind.value.split('.')
          switch (node.tagName) {
            case 'INPUT':
            case 'TEXTAREA':
              node.addEventListener('change', (e) => {
                let v = null
                if (node.type === 'checkbox') {
                  v = e.target.getAttribute('checked') === null
                } else if (node.type === 'radio') {
                  if (e.target.checked !== null) {
                    v = e.target.value
                  }
                } else {
                  v = e.target.value
                }
                if (v !== null) {
                  _setVarsValue(e.target.binds, v, node.bindDatas)
                  let onbind = e.target.getAttribute('onbind')
                  if (onbind) {
                    let func = Function.constructor.apply(null, [onbind])
                    func(e)
                  }
                }
              })
              break
          }
        }
      }

      // 处理属性
      if (node.binds) {
        node.bindDatas = {}
        for (let k in datas) {
          node.bindDatas[k] = datas[k]
        }
        switch (node.tagName) {
          case 'INPUT':
          case 'TEXTAREA':
            let data = datas
            for (let k of node.binds) {
              data = data[k]
              if (!data) break
            }
            if (node.type === 'checkbox') {
              if (data === true || data === 'true' || data === 1) {
                node.setAttribute('checked', '')
              } else {
                node.removeAttribute('checked')
              }
            }
            if (node.type === 'radio') {
              if (data === node.value) {
                node.checked = true
              } else {
                node.checked = false
              }
            } else {
              node.value = data || ''
            }
        }
      }

      // 不处理SUBVIEW
      if (node.id && node.id.startsWith('SUBVIEW_')) {
        continue
      }

      // 处理条件判断
      if (node['ifs']) {
        let isShow = _makeString('{' + node['ifs'] + '}', datas)
        if (isShow && isShow.charAt(0) !== '{' && isShow !== 'false' && isShow !== '0' && isShow !== 'undefined' && isShow !== 'null') {
          let dom = document.createElement(node.parentTagName || 'div')
          dom.innerHTML = node.htmlTpl
          this.make(dom, datas)
          dom.firstChild.isTplMaked = true
          node.parentElement.insertBefore(dom.firstChild, node)
          // this.make(node.previousSibling, datas)
        }
        continue
      }

      // 处理循环
      if (node.eachs) {
        if (node.eachs.items) {
          // 根据 items 找到数据
          let itemsArr = node.eachs.items.split('.')
          let itemsData = datas
          for (let itemsA of itemsArr) {
            itemsData = itemsData[itemsA]
            if (itemsData === undefined) break
          }
          // 处理数据
          if (itemsData) {
            for (let index in itemsData) {
              let dom = document.createElement(node.parentTagName || 'div')
              dom.innerHTML = node.htmlTpl
              datas[node.eachs.index] = index
              datas[node.eachs.item] = itemsData[index]
              this.make(dom, datas)
              dom.firstChild.isTplMaked = true
              node.parentElement.insertBefore(dom.firstChild, node)
              // this.make(node.previousSibling, datas)
            }
          }
        }
        continue
      }

      // 递归处理子集
      this.make(node, datas)
    }
  }
}
