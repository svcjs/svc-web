import $ from './webutils'

function _setVarsValue (vars, value, datas) {
  let data = datas
  for (let i = 0; i < vars.length - 1; i++) {
    data = data[vars[i]]
    if (!data) return
  }
  data[vars[vars.length - 1]] = value
}

function makeString (str, datas, thisArg) {
  let str1 = str

  // // 处理动态属性
  // let p1 = str.indexOf('[')
  // let p2 = str.indexOf(']')
  // if (p1 !== -1 && p2 !== -1 && p2 > p1) {
  //   // 预处理循环中的动态变量
  //   str = str.replace(/\[[^\[]+?]/g, word => {
  //     console.info('===', str, word)
  //     let r = makeString('{' + word.substring(1, word.length - 1) + '}', datas)
  //     if (!r) {
  //       console.info('  ===1', word)
  //       return word
  //     }
  //     if (/^\d+$/.test(r)) {
  //       console.info('  ===2', '[' + r + ']')
  //       return '[' + r + ']'
  //     }
  //     console.info('  ===3', '.' + r)
  //     return '.' + r
  //   })
  // }

  // if (s1.indexOf('!r.isHeader?') !== -1) console.info('        .1', str)
  // if (str1.indexOf("!='table'") !== -1) console.info('        ====1', str)
  if (str.indexOf('{') !== -1) {
    str = makeStringOnce(str, datas, thisArg)
  }
  // if (s1.indexOf('!r.isHeader?') !== -1) console.info('        .2', str)
  // if (str1.indexOf("!='table'") !== -1) console.info('        ====2', str)

  // if (s1.indexOf('依赖') !== -1) console.info('  >', str)
  if (str.indexOf('{') !== -1) {
    str = makeStringOnce(str, datas, thisArg)
  }
  // if (str1.indexOf("!='table'") !== -1) console.info('        ====3', str)

  // if (s1.indexOf('依赖') !== -1) console.info('    >', str)
  if (str.indexOf('{') !== -1) {
    str = makeStringOnce(str, datas, thisArg)
  }

  if (str.indexOf('__TEMP_NMT_TAG__') !== -1) str = str.replace(/__TEMP_NMT_TAG__/g, '{')
  // if (s1.indexOf('依赖') !== -1) console.info('      >', str)
  // if (str1.indexOf("!='table'") !== -1) console.info('        ====4', str)

  return str
}

function makeStringOnce (str, datas, thisArg) {
  let args = ['$']
  let values = [$]
  for (let key in datas) {
    args.push(key)
    values.push(datas[key])
  }
  let lastArgsIndex = args.length
  args.push('return null')

  let str1 = str
  // if(str1.indexOf("!='table'") !== -1) console.info(111,str)
  str = str.replace(/\{([^{]*?)\}/g, function (full, part1) {
    // if (str1.indexOf("!='table'") !== -1) console.info(111.5, part1)
    if (!part1) return ''
    if (part1[0] === '^') return '__TEMP_NMT_TAG__' + part1.substring(1) + '}'

    let matchLanguage = part1[0] === '&'
    // console.info(' >0', matchLanguage, part1)
    if (matchLanguage) part1 = part1.substring(1)
    try {
      let noMoreTry = part1[0] === '#'
      if (noMoreTry) part1 = part1.substring(1)
      args[lastArgsIndex] = 'return ' + part1
      let func = Function.constructor.apply(null, args)
      let result = func.apply(thisArg || null, values)
      // if (str1.indexOf("!='table'") !== -1) console.info(' =>', args, result)
      // console.info('  >1', matchLanguage, result)
      if (result === undefined || result === null) return ''
      if (noMoreTry && result.indexOf('{') !== -1 && result.indexOf('}') !== -1) {
        result = result.replace(/\{/g, '__TEMP_NMT_TAG__')
      }
      if (matchLanguage) {
        // console.info('   >2', matchLanguage, result)
        if ($.lang && $.lang[result]) {
          result = $.lang[result]
        }
      }
      return result
    } catch (err) {
      // if(str1.indexOf("!='table'") !== -1) console.error(str, err)
      // console.error(str, err)
      // return full
      if (part1.indexOf('.') !== -1) part1 = '' // 变量找不到返回空

      if (matchLanguage) {
        if ($.lang && $.lang[part1]) {
          part1 = $.lang[part1]
        }
      }
      return part1
    }
  })
  // if(str1.indexOf("||'label'") !== -1) console.info(222,str)

  // console.info(222, str, args)
  return str
}

function splitVar (v) {
  if (v.indexOf('[\'')) {
    v = v.replaceAll('\']', '')
    v = v.replaceAll('[\'', '.')
  }
  if (v.indexOf('[')) {
    v = v.replaceAll(']', '')
    v = v.replaceAll('[', '.')
  }
  return v.split('.')
}

function renderAction (event) {
  // if (!renderBox.renderRowHeight) renderBox.renderRowHeight = renderBox.renderChilds.length ? renderBox.scrollHeight / renderBox.renderChilds.length : 30
  // console.info('>> #', renderBox.scrollHeight, renderBox.renderChilds.length, renderBox.scrollHeight / renderBox.renderChilds.length)
  // console.info('>> ^', render.box, renderBox.renderChilds)
  // $.timer('渲染').trace('开始计算')
  // let t1 = new Date().getTime()
  // let rrr = Math.floor(Math.random() * 100000).toString(36)
  // console.info(rrr, 111, this.renderTID, this.renderChilds.length, this)
  if (this.renderTID) clearTimeout(this.renderTID)
  this.renderTID = setTimeout(() => {
    // console.info(rrr, 222, this.renderChilds.length)
    this.renderTID = 0

    let makeList = []
    for (let i = 0; i < this.renderChilds.length; i++) {
      let rowNode = this.renderChilds[i]
      // console.info("  >>>", i, rowNode.offsetTop, this.scrollTop, this.clientHeight, rowNode.offsetTop, this.scrollTop - this.clientHeight)
      if (rowNode.offsetTop >= this.scrollTop - this.clientHeight) {
        if (!rowNode.renderMade) {
          rowNode.renderMade = true
          makeList.push(rowNode)
        }
      }
      // console.info("    >>>>>", i, rowNode.offsetTop, this.scrollTop, this.clientHeight, rowNode.offsetTop >= this.scrollTop, this.clientHeight * 2)
      if (rowNode.offsetTop >= this.scrollTop + this.clientHeight * 2) {
        // console.info(' >> $', i, rowNode.offsetTop, '>=', this.scrollTop + this.clientHeight * 2, '|', this.scrollTop, '+', this.clientHeight, '* 2')
        break
      }
    }
    // console.info(makeList.length)
    // let t2 = new Date().getTime()
    // console.info('    >>>>>>>>>>>>>>>>====------------>2', t2 - t1)

    // $.timer('渲染').trace('开始生成'+makeList.length)
    // let t9 = 0
    // let t9c = 0
    let isAsync = this.renderChilds.length > 100
    // console.info(rrr,333, makeList.length, isAsync)
    if (makeList.length > 0) {
      // _make(makeList, this.datas, level + 1, dataFields, this.thisArg, {})

      if (isAsync) {
        for (let i = 0; i < makeList.length; i += 10) {
          let start = i
          let end = Math.min(i + 10, makeList.length)
          // setTimeout((thatRowNode, thatDatas) => {
          //   refresh(thatRowNode, thatDatas, this.thisArg)
          //   thatRowNode.style.visibility = 'visible'
          // }, 0, rowNode, $.copy(this.datas))
          // console.info(rrr,444.1, makeList.length, isAsync)
          setTimeout(() => {
            // console.info(rrr,444.2, start, end)
            for (let j = start; j < end; j++) {
              let rowNode = makeList[j]

              if (rowNode.data) {
                for (let k in rowNode.data) {
                  this.datas[k] = rowNode.data[k]
                }
              }
              refresh(rowNode, this.datas, this.thisArg)
              rowNode.style.visibility = 'visible'
            }
          }, 0)

          // if (rowNode.data) {
          //   for (let k in rowNode.data) {
          //     this.datas[k] = rowNode.data[k]
          //   }
          // }
        }
      } else {
        for (let rowNode of makeList) {
          // console.info(rrr,555.1, makeList.length, rowNode)
          if (rowNode.data) {
            for (let k in rowNode.data) {
              this.datas[k] = rowNode.data[k]
            }
          }
          refresh(rowNode, this.datas, this.thisArg)
          rowNode.style.visibility = 'visible'
        }
      }
      // console.info(3333, this.renderRowEventTarget, this.thisArg)

      setTimeout(() => {
        let eventNodes = []
        for (let rowNode of makeList) {
          if (this.renderRowEvent) {
            eventNodes.push(...$.all('[events]', rowNode))
          }
        }
        if (eventNodes.length > 0) {
          makeEvents(eventNodes, this.renderRowEventTarget)
        }
      })
    }
    // let t3 = new Date().getTime()
    // console.info('    >>>>>>>>>>>>>>>>====------------>3', t3 - t2, t9c, t9)

    // $.timer('渲染').trace('完成')
    // console.info(event)
    // console.info(this.renderChilds.length, event.currentTarget.scrollTop, event.currentTarget.clientHeight)
    // TODO 根据滚轮滚动对数据进行重新定位和渲染
  }, 30)

}

function _make (nodes, datas, level, dataFields, thisArg, render) {
  if (!level) level = 0
  if (!dataFields) dataFields = []
  if (!(nodes instanceof Array)) {
    let targetNode = nodes
    nodes = []
    for (let node of targetNode.childNodes) {
      nodes.push(node)
    }
  }

  if (!render) render = {}
  render = {
    box: render.box,
    // parent: render.parent,
    row: render.row,
  }

  // let t1 = new Date().getTime()
  // if(nodes.length>1000) {
  //   console.info(' ====>1', t1, nodes)
  // }
  // let aaa1 = 0
  for (let node of nodes) {
    if (!node) continue
    if (node.isTplMaked) {
      node.parentElement.removeChild(node)
      continue
    }

    if (node.isRenderRow && !render.box && node.renderBox) {
      // console.info('node.isRenderRow', node, node.isRenderRow, render.box, node.renderBox, $.json(render))
      render.box = node.renderBox
      render.box.renderChilds = []
    }

    // if(aaa1 === 0 && nodes.length>1000) {
    //   aaa1 = 1
    //   let t2 = new Date().getTime()
    //   console.info('    ====>1.5', t2 - t1)
    // }

    // 初始化动态dom
    if (node.tagName === 'DOM') {
      let cdom = document.createComment('')
      cdom.domFrom = node.innerText
      cdom.attributes = node.attributes
      cdom.parentTagName = node.parentElement.tagName
      node.parentElement.insertBefore(cdom, node)
      node.parentElement.removeChild(node)
      node = cdom // 让下面可以立刻处理
    }

    // 动态渲染节点
    let isRendingRow = false
    let isRenderRow = false
    if (render.row) {
      isRendingRow = true
    } else {
      // 动态渲染行
      if (render.box) {
        // if (node.hasAttribute && node.hasAttribute('renderParent')) {
        //   // node.renderBox = render.box
        //   render.parent = node
        // }
        if (node.isRenderRow || (node.hasAttribute && node.hasAttribute('renderRow'))) {
          // console.info('********', node.isRenderRow, node.hasAttribute && node.hasAttribute('renderRow'), node)
          node.isRenderRow = true
          node.renderBox = render.box
          isRenderRow = true
          // console.info('isRenderRow', node)
          // setTimeout(() => {
          //   render.box.renderTopOffset = render.parent ? render.parent.offsetTop : 0
          //   // console.info('    >>1', render.parent.offsetTop)
          // })
          // render.box.renderRowHeight = node.getAttribute('renderRowHeight') || 30
          // render.box.renderCount = node.getAttribute('renderCount') || 30
          // console.info('  >>1', render.box.renderTopOffset, node.clientHeight, node.getAttribute('renderRowHeight'))
          // node.renderBox.renderChilds.push(node)
          render.row = node
          if (render.box.renderRowEvent === undefined) render.box.renderRowEvent = !!$('[events]', node)
        }
      }

      // 动态渲染容器
      if (node.isRenderBox || (node.hasAttribute && node.hasAttribute('renderBox'))) {
        node.isRenderBox = true
        let renderBox = node
        renderBox.renderRowEventTarget = thisArg
        render.box = renderBox
        renderBox.renderChilds = []
        if (renderBox.renderAction) {
          renderBox.removeEventListener('scroll', renderBox.renderAction)
        }

        // let renderAction = event => {
        //   // if (!renderBox.renderRowHeight) renderBox.renderRowHeight = renderBox.renderChilds.length ? renderBox.scrollHeight / renderBox.renderChilds.length : 30
        //   // console.info('>> #', renderBox.scrollHeight, renderBox.renderChilds.length, renderBox.scrollHeight / renderBox.renderChilds.length)
        //   // console.info('>> ^', render.box, renderBox.renderChilds)
        //   // $.timer('渲染').trace('开始计算')
        //   // let t1 = new Date().getTime()
        //   if (this.renderTID !== 0) clearTimeout(this.renderTID)
        //   this.renderTID = setTimeout(() => {
        //     this.renderTID = 0
        //
        //     let makeList = []
        //     for (let i = 0; i < renderBox.renderChilds.length; i++) {
        //       let rowNode = renderBox.renderChilds[i]
        //       if (rowNode.offsetTop >= renderBox.scrollTop - renderBox.clientHeight) {
        //         if (!rowNode.renderMade) {
        //           rowNode.renderMade = true
        //           makeList.push(rowNode)
        //         }
        //       }
        //       if (rowNode.offsetTop >= renderBox.scrollTop + renderBox.clientHeight * 2) {
        //         // console.info(' >> $', i, rowNode.offsetTop, '>=', renderBox.scrollTop + renderBox.clientHeight * 2, '|', renderBox.scrollTop, '+', renderBox.clientHeight, '* 2')
        //         break
        //       }
        //     }
        //     // console.info(makeList.length)
        //     // let t2 = new Date().getTime()
        //     // console.info('    >>>>>>>>>>>>>>>>====------------>2', t2 - t1)
        //
        //     // $.timer('渲染').trace('开始生成'+makeList.length)
        //     // let t9 = 0
        //     // let t9c = 0
        //     if (makeList.length > 0) {
        //       // _make(makeList, datas, level + 1, dataFields, thisArg, {})
        //       // console.info(makeList)
        //       let eventNodes = []
        //       for (let rowNode of makeList) {
        //         if (rowNode.data) {
        //           for (let k in rowNode.data) {
        //             datas[k] = rowNode.data[k]
        //           }
        //         }
        //         // console.info(rowNode, datas, thisArg)
        //         // let tt1 = new Date().getTime()
        //         setTimeout(() => {
        //           refresh(rowNode, datas, thisArg)
        //           rowNode.style.visibility = 'visible'
        //         })
        //         // let tt2 = new Date().getTime()
        //         // t9 += tt2 - tt1
        //         // t9c++
        //         // console.info('  >> visible', rowNode)
        //       }
        //       // console.info(3333, renderBox.renderRowEventTarget, thisArg)
        //       setTimeout(() => {
        //         for (let rowNode of makeList) {
        //           if (renderBox.renderRowEvent) {
        //             eventNodes.push(...$.all('[events]', rowNode))
        //           }
        //         }
        //         if (eventNodes.length > 0) {
        //           makeEvents(eventNodes, renderBox.renderRowEventTarget)
        //         }
        //       })
        //     }
        //     // let t3 = new Date().getTime()
        //     // console.info('    >>>>>>>>>>>>>>>>====------------>3', t3 - t2, t9c, t9)
        //
        //     // $.timer('渲染').trace('完成')
        //     // console.info(event)
        //     // console.info(renderBox.renderChilds.length, event.currentTarget.scrollTop, event.currentTarget.clientHeight)
        //     // TODO 根据滚轮滚动对数据进行重新定位和渲染
        //   }, 100)
        //
        // }
        renderBox.renderAction = renderAction
        renderBox.datas = datas
        renderBox.thisArg = thisArg
        renderBox.addEventListener('scroll', renderAction)
        // let t1 = new Date().getTime()
        setTimeout(() => {
          // let t2 = new Date().getTime()
          // console.info('    ====------------>2', t2 - t1)
          // renderAction({ currentTarget: renderBox })
          renderBox.renderAction()
          // let t3 = new Date().getTime()
          // console.info('    ====------------>3', t3 - t2)
        })
      }
    }

    // 初始化循环和条件
    if (node.attributes && (node.attributes.each || node.attributes['if'])) {
      let which = node.attributes.each ? 'each' : 'if'
      let cdom = document.createComment('')
      if (node.attributes.each) {
        cdom.eachs = { index: 'index', item: 'item', items: '' }
        // let eachs = node.getAttribute('each').split(/\s*,\s*|\s+in\s+/i).reverse()
        let eachs = []
        let a = node.getAttribute('each').split(/\s+in\s+/i)
        if (a.length === 1) {
          eachs.push(a[0])
        } else if (a.length === 2) {
          eachs = a[0].split(/\s*,\s*/i).reverse()
          eachs.unshift(a[1])
        }
        // console.info(77, eachs)
        let eachVar = eachs[0]
        cdom.eachs.items = eachVar
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
      if (node.isRenderBox) cdom.isRenderBox = node.isRenderBox
      if (node.isRenderRow) cdom.isRenderRow = node.isRenderRow
      if (node.renderBox) cdom.renderBox = node.renderBox
      node = cdom // 让下面可以立刻处理
    }

    // 初始化属性
    if (node.vars === undefined) {
      node.vars = false
      let vars = {}
      if (node.attributes) {
        // 待处理列表
        // for (let attr of node.attributes) {
        // for (let i in node.attributes) {
        let attrs = []
        for (let i = 0; i < node.attributes.length; i++) {
          attrs.push(node.attributes[i])
        }
        for (let i = 0; i < attrs.length; i++) {
          let attr = attrs[i]
          if (attr.value && attr.value.indexOf('{') !== -1 && attr.value.indexOf('}') !== -1) {
            if (attr.name === 'class') {
              vars['className'] = attr.value
              node.className = ''
            } else if (attr.name === 'disabled' || attr.name === 'checked' || attr.name === 'selected' || attr.name === 'readonly' || attr.name === 'required') {
              let attrName = attr.name
              if (attr.name === 'readonly') attrName = 'readOnly'
              vars[attrName] = attr.value
              node.removeAttribute(attr.name)
            } else if (attr.name[0] === '_') {
              vars[attr.name.substr(1)] = attr.value
              node.setAttribute(attr.name.substr(1), '')
              node.removeAttribute(attr.name)
            } else {
              vars[attr.name] = attr.value
              node.setAttribute(attr.name, '')
            }
            if (!node.vars) node.vars = vars
          }
        }
      }

      // 处理 TextNode
      if (node.data && typeof node.data === 'string' && node.data.indexOf('{') !== -1 && node.data.indexOf('}') !== -1) {
        vars['data'] = node.data
        node.data = ''
        if (!node.vars) node.vars = vars
      }
    }

    if (isRendingRow && node.style && node.hasAttribute('renderRow')) {
      node.style.visibility = 'hidden'
      // console.info('>> hidden', node)
      // node.rendered = false
      //   tpl.makeEvents(this.$.all('[events]'), this)
      continue
    }

    // 处理属性
    if (level === 0 && node.getAttribute && node.getAttribute('module')) {
      // module 的第一级不处理（由调用方处理）
    } else {
      makeNodeVars(node, datas, thisArg)
    }
    // if (node.vars) {
    //     for (let key in node.vars) {
    //         let newValue = makeString(node.vars[key], datas)
    //         if (key === 'data') {
    //             let div = document.createElement('div')
    //             div.innerHTML = newValue
    //             node.data = div.innerHTML
    //         }else if (key === 'className') {
    //             node[key] = newValue
    //         } else if (key === 'disabled' || key === 'checked' || key === 'selected') {
    //             node[key] = newValue === 'true' || newValue === '1'
    //         } else {
    //             node.setAttribute(key, newValue)
    //         }
    //     }
    // }

    // 初始化数据绑定 bind
    if (node.binds === undefined) {
      node.binds = false
      if (node.attributes && node.attributes.bind) {
        let bindVar = node.attributes.bind.value
        node.bindVar = bindVar
        node.binds = splitVar(bindVar)

        switch (node.tagName) {
          case 'INPUT':
          case 'TEXTAREA':
          case 'SELECT':
            node.addEventListener('change', (e) => {
              let v = null
              if (node.tagName === 'SELECT') {
                v = e.target.options[e.target.selectedIndex].value
              } else if (node.type === 'checkbox') {
                if (e.target.checked !== null) {
                  v = e.target.checked
                } else {
                  v = e.target.getAttribute('checked') === null
                }
              } else if (node.type === 'radio') {
                if (e.target.checked !== null) {
                  v = e.target.value
                  e.target.name = bindVar
                }
              } else {
                v = e.target.value
              }
              if (v !== null) {
                // if (node.type === 'checkbox') console.info(111, e.target.binds, v, node.bindDatas)
                _setVarsValue(e.target.binds, v, node.bindDatas)
                let onbind = e.target.getAttribute('onbind')
                if (onbind) {
                  let func = Function.constructor.apply(null, [onbind])
                  func(e)
                }
              }
            })
            break
          default:
            // 支持 radio、checkbox
            let bindType = node.getAttribute('bindType')
            if (!bindType) {
              if (node.innerHTML.indexOf('type="radio"') !== -1) {
                bindType = 'radio'
              } else if (node.innerHTML.indexOf('type="checkbox"') !== -1) {
                bindType = 'checkbox'
              }
            }

            // let radios = $.all('[type="radio"]', node)
            // let checkboxs = $.all('[type="checkbox"]', node)
            // if (radios.length > 0 || checkboxs.length > 0) {
            // for (let radio of radios) {
            //   radio.checked = radio.value === data
            // }
            // for (let checkbox of checkboxs) {
            //   checkbox.checked = checkbox.value === data
            // }
            if (bindType) {
              node.addEventListener('change', (e) => {
                if (bindType === 'radio') {
                  _setVarsValue(e.currentTarget.binds, e.target.value, node.bindDatas)
                } else if (bindType === 'checkbox') {
                  let values = []
                  $.all('[type="checkbox"]', n => {
                    if (n.checked) values.push(n.value)
                  }, node)
                  _setVarsValue(e.currentTarget.binds, values, node.bindDatas)
                }

                let onbind = e.currentTarget.getAttribute('onbind')
                if (onbind) {
                  let func = Function.constructor.apply(null, [onbind])
                  func(e)
                }

              })
            }
          // }
        }
      }
    }

    // 处理绑定
    if (node.bindVar) {
      let bindVar = makePreVars(node.bindVar, datas, false, thisArg)
      if (bindVar.indexOf('[') !== -1) {
        // 处理有数组的情况
        node.binds = []
        for (let k of splitVar(bindVar)) {
          if (k.endsWith(']') && k.indexOf('[') !== -1) {
            let a = k.split('[', 2)
            k = a[0]
            let index = a[1].substring(0, a[1].length - 1)
            node.binds.push(k)
            node.binds.push(index)
          } else {
            node.binds.push(k)
          }
        }
      } else {
        node.binds = splitVar(bindVar)
      }

      // if(node.bindVar.indexOf('{')!==-1)console.info(node.bindVar, bindVar)

      // if (bindVar.indexOf('{') !== -1) {
      //   bindVar = makeString(bindVar, datas)
      // }

      // if (bindVar.indexOf('{') !== -1) {
      //   // console.info(node.attributes.bind.value, datas)
      //   // 处理中括号引用
      //   bindVar = bindVar.replace(/\{.*?}/g, word => {
      //     let r = makeString(word, datas)
      //     return r || ''
      //   })
      //   // console.info('  =>>', bindVar)
      // }
      //
      // if (bindVar.indexOf('[') !== -1) {
      //   // console.info(node.attributes.bind.value, datas)
      //   // 处理中括号引用
      //   bindVar = bindVar.replace(/\[.*?]/g, word => {
      //     // console.info('---', word.substring(1, word.length - 1))
      //     let r = makeString('{' + word.substring(1, word.length - 1) + '}', datas)
      //     return r ? '.' + r : word
      //   })
      //   // console.info('  =>>', bindVar)
      // }

      node.bindDatas = {}
      for (let k in datas) {
        node.bindDatas[k] = datas[k]
      }
      let data = datas
      for (let k of node.binds) {
        data = data[k]
        if (!data) break
      }
      if (!data && bindVar) {
        data = makeString('{' + bindVar + '}', datas, thisArg)
        // if (!data && nodeBinds.length === 1) {
        //   data = nodeBinds[0]
        // }
        // if(bindVar.indexOf('$')!==-1)console.info(222, bindVar, data)
      }
      switch (node.tagName) {
        case 'INPUT':
        case 'TEXTAREA':
        case 'SELECT':
          if (node.tagName === 'SELECT') {
            let thatNode = node
            setTimeout(() => {
              let selectedIndex = 0
              for (let i = 0; i < thatNode.options.length; i++) {
                let o = thatNode.options[i]
                // console.info('===', o.value, data, thatNode.options)
                if (o.value == data) {
                  selectedIndex = i
                  break
                }
              }
              // console.info('  >>>', selectedIndex)
              thatNode.selectedIndex = selectedIndex
            })
          } else if (node.type === 'checkbox') {
            if (data === true || data === 'true' || data === 1 || data === '1') {
              node.checked = true
              // node.setAttribute('checked', '')
            } else {
              node.checked = false
              // node.removeAttribute('checked')
            }
          } else if (node.type === 'radio') {
            if (data == node.value) {
              node.checked = true
            } else {
              node.checked = false
            }
          } else {
            node.value = data || ''
          }
          break
        default:
          let bindType = node.getAttribute('bindType')
          if (!bindType) {
            if (node.innerHTML.indexOf('type="radio"') !== -1) {
              bindType = 'radio'
            } else if (node.innerHTML.indexOf('type="checkbox"') !== -1) {
              bindType = 'checkbox'
            }
          }

          if (bindType) {
            // 延后处理，等子节点先渲染好（如循环、判断）
            setTimeout(() => {
              // let isTestNode = $.hasClass(node, 'testNode')
              if (bindType === 'radio') {
                let radios = $.all('[type="radio"]', node)
                // let isTestNode = $.hasClass(node, 'testNode')
                // if (isTestNode) console.info(11, node.ifs, node.eachs)
                if (radios.length > 0) {
                  // if (isTestNode) console.info(22)
                  for (let radio of radios) {
                    radio.checked = radio.value === data
                  }
                }
              } else if (bindType === 'checkbox') {
                let checkboxs = $.all('[type="checkbox"]', node)
                if (checkboxs.length > 0) {
                  // if (isTestNode) console.info(33)
                  if (!data instanceof Array) data = [data]
                  for (let checkbox of checkboxs) {
                    checkbox.checked = data.indexOf(checkbox.value) !== -1
                  }
                }
              }
            })
          } else {
            node.innerHTML = data || ''
          }

        // let radios = $.all('[type="radio"]', node)
        // let isTestNode = $.hasClass(node, 'testNode')
        // if (isTestNode) console.info(11, node.ifs, node.eachs)
        // if (radios.length > 0) {
        //   if (isTestNode) console.info(22)
        //   for (let radio of radios) {
        //     radio.checked = radio.value === data
        //   }
        // } else {
        //   let checkboxs = $.all('[type="checkbox"]', node)
        //   if (checkboxs.length > 0) {
        //     if (isTestNode) console.info(33)
        //     if (!data instanceof Array) data = [data]
        //     for (let checkbox of checkboxs) {
        //       checkbox.checked = data.indexOf(checkbox.value) !== -1
        //     }
        //   } else {
        //     if (isTestNode) console.info(44)
        //     node.innerHTML = data || ''
        //   }
        // }

        // let nodeChildren = node.children
        // if (nodeChildren.length > 0) {
        //   // console.info(nodeBinds, nodeChildren)
        //   node.innerHTML = data || ''
        // } else {
        //   node.innerText = data || ''
        // }

        // let checkboxs = $.all('[type="checkbox"]', node)
        // if(checkboxs){
        //   console.info(nodeBinds, checkboxs)
        // }else{
        //   let radios = $.all('[type="radio"]', node)
        //   if(radios){
        //     console.info(nodeBinds, radios)
        //   }else{
        //     node.innerText = data || ''
        //   }
        // }
      }
    }

    // 不处理SUBVIEW（除第一级）
    if (level > 0) {
      if (node.id && node.id.startsWith('SUBVIEW_')) continue
      if (node.getAttribute && node.getAttribute('module')) continue
    }

    // 处理动态dom
    if (node.domFrom) {
      let domHtml = makeString(node.domFrom, datas, thisArg)
      if (domHtml) {
        let dom = document.createElement(node.parentTagName || 'div')
        dom.innerHTML = domHtml
        _make(dom, datas, level + 1, dataFields, thisArg, render)
        for (let domItem of dom.children) {
          domItem.firstChild.isTplMaked = true
          for (let i = 0; i < node.attributes.length; i++) {
            let attr = node.attributes[i]
            domItem.setAttribute(attr.name, attr.value)
          }
          node.parentElement.insertBefore(domItem, node)
        }
      }
    }

    // 处理条件判断
    if (node['ifs']) {
      // let ifs = node['ifs']
      // let ifs = makePreVars(node['ifs'], datas, true)
      let ifs = makePreVars(node['ifs'], datas, false, thisArg)
      // if (node['ifs'].indexOf('依赖') !== -1) console.info(node['ifs'], ifs)
      // .startsWith('{') ? makeString(node['ifs'], datas) : node['ifs']
      // if (ifs.indexOf('{') !== -1) {
      //   // 预处理循环中的动态变量
      //   ifs = ifs.replace(/\{.*?}/g, word => {
      //     return makeString(word, datas) || ''
      //   })
      // }
      //
      // if (ifs.indexOf('[') !== -1) {
      //   // 预处理循环中的动态变量
      //   ifs = ifs.replace(/\[.*?]/g, word => {
      //     let r = makeString('{' + word.substring(1, word.length - 1) + '}', datas)
      //     if (!r) {
      //       return word
      //     }
      //     if (/\d+/.test(r)) {
      //       return '[' + r + ']'
      //     }
      //     return '.' + r
      //   })
      // }

      let r = makeString('{' + ifs + '}', datas, thisArg)
      let isShow
      if (r.indexOf('&&') !== -1 || r.indexOf('||') !== -1) {
        // if (node['ifs'].indexOf('标题') !== -1) console.info('  >', node['ifs'], ifs, '【'+r+'】')
        // 处理复杂判断
        let a = r.split('||')
        for (let i in a) {
          let b = a[i].split('&&')
          for (let j in b) {
            b[j] = b[j] && b[j] !== 'false' && b[j] !== '0' && b[j] !== 'undefined' && b[j] !== 'null' ? 'true' : 'false'
          }
          a[i] = b.join('&&')
        }
        r = a.join('||')
        isShow = makeString('{' + r + '}', datas, thisArg)
      } else {
        isShow = r
      }

      // let isShow = makeString('{' + ifs + '}', datas)
      // if (node['ifs'].indexOf('标题') !== -1) console.info('  >', node['ifs'], ifs, '【'+isShow+'】')
      // if (isShow && isShow.charAt(0) !== '{' && isShow !== 'false' && isShow !== '0' && isShow !== 'undefined' && isShow !== 'null') {
      if (isShow && isShow !== 'false' && isShow !== '0' && isShow !== 'undefined' && isShow !== 'null') {
        let dom = document.createElement(node.parentTagName || 'div')
        dom.innerHTML = node.htmlTpl
        _make(dom, datas, level + 1, dataFields, thisArg, render)
        dom.firstChild.isTplMaked = true
        node.parentElement.insertBefore(dom.firstChild, node)
        // _make(node.previousSibling, datas)
      }
      continue
    }

    // 处理循环
    if (node.eachs) {
      if (node.eachs.items) {
        // 根据 items 找到数据
        let eachVars = node.eachs.items.split('||')
        // if (eachVars.length > 1) console.info(111, eachVars)
        let itemsData = []
        for (let eachVar of eachVars) {
          let s1 = eachVar
          eachVar = makePreVars(eachVar, datas, false, thisArg)
          // if(s1.indexOf('[argName]')!==-1) console.info(s1, '>>', eachVar)
          // if (eachVar.indexOf('[') !== -1) {
          //   // 预处理循环中的动态变量
          //   eachVar = eachVar.replace(/\[.*?]/g, word => {
          //     let r = makeString('{' + word.substring(1, word.length - 1) + '}', datas)
          //     if (!r) {
          //       return ''
          //     }
          //     if (/\d+/.test(r)) {
          //       return '[' + r + ']'
          //     }
          //     return '.' + r
          //   })
          // }

          let findArr = splitVar(eachVar)
          let findData = datas
          for (let itemsA of findArr) {
            findData = findData[itemsA]
            if (findData === undefined) {
              break
            }
          }
          // if (eachVars.length > 1) console.info('  222', findArr, findData, datas['item'])
          // console.info(99, findArr, findData)

          // 处理数字循环
          if (!findData) {
            if (/^[1-9]\d*$/.test(eachVar)) eachVar = '1,' + eachVar
            if (/^[0-9]+,[0-9]+$/.test(eachVar)) {
              findData = []
              let a = eachVar.split(',')
              let n1 = parseInt(a[0])
              let n2 = parseInt(a[1])
              if (n2 > n1) {
                for (let i = n1; i <= n2; i++) findData.push(i)
              } else {
                for (let i = n1; i >= n2; i--) findData.push(i)
              }
            }
          }

          if (findData) {
            if (findData instanceof Array) {
              itemsData = findData
            } else if (typeof findData === 'object') {
              itemsData = findData
            } else {
              itemsData = [findData]
            }
            // console.info('eachVar', eachVar, findData, itemsData)
            break
          }
        }

        if (itemsData) {
          // if (isRenderRow && itemsData.length > render.box.renderCount) {
          //   // 动态渲染超长列表（小于50行不做处理）
          //   // render.box.renderRow = node
          //   render.box.renderData = itemsData
          //   render.box.style.overflowY = 'hidden !important'
          //   render.box.style.overflowX = 'auto !important'
          //   // let parent = render.parent || render.box
          //   // parent.style.height = (render.box.renderRowHeight * itemsData.length) + 'px'
          //   // console.info('  >>2 out eachs', parent.style.height, itemsData)
          //
          //   // 生成可复用对象池
          //   for (let index = 0; index < render.box.renderCount; index++) {
          //     let dom = document.createElement(node.parentTagName || 'div')
          //     dom.innerHTML = node.htmlTpl
          //     datas[node.eachs.index] = index
          //     datas[node.eachs.item] = itemsData[index]
          //     let newDataFields = $.copy(dataFields)
          //     newDataFields.push(node.eachs.index)
          //     newDataFields.push(node.eachs.item)
          //     _make(dom, datas, level + 1, newDataFields, thisArg, render)
          //     dom.firstChild.isTplMaked = true
          //     let newDom = dom.firstChild
          //     node.parentElement.insertBefore(dom.firstChild, node)
          //
          //     // 设置 data
          //     let newDomData = {}
          //     for (let df of newDataFields) {
          //       // console.info(111, df, datas[df])
          //       newDomData[df] = datas[df]
          //     }
          //     newDom.data = newDomData
          //     // console.info('  222', newDomData, newDom.data)
          //
          //     // _make(node.previousSibling, datas)
          //   }
          //
          // } else {
          // 处理数据
          // let laterMakes = [] // TODO 是否必要在这里预先生成30条，剩下的延后生成？或者能够复用组件？
          for (let index in itemsData) {
            let dom = document.createElement(node.parentTagName || 'div')
            dom.innerHTML = node.htmlTpl
            datas[node.eachs.index] = index
            datas[node.eachs.item] = itemsData[index]
            let newDataFields = $.copy(dataFields)
            newDataFields.push(node.eachs.index)
            newDataFields.push(node.eachs.item)
            // 设置 data
            let newDomData = {}
            for (let df of newDataFields) {
              newDomData[df] = datas[df]
            }

            // 处理节点
            // if(isRenderRow && index > 30){
            //   laterMakes.push([dom, datas, level + 1, newDataFields, thisArg, render])
            // }else{
            _make(dom, datas, level + 1, newDataFields, thisArg, render)
            let newDom = dom.firstChild
            newDom.isTplMaked = true
            node.parentElement.insertBefore(newDom, node)
            newDom.data = newDomData
            if (isRenderRow) {
              render.box.renderChilds.push(newDom)
            }
            // }

          }
          // if (isRenderRow) {
          //   render.box.renderRowCount = itemsData.length
          // }
          // }
        }
      }
      // 循环会处理好子对象，不需要在继续
      continue
    }

    // 事件对象存储index&item
    if (dataFields.length > 0 && node.getAttribute && node.getAttribute('events')) {
      // console.info('===', '['+node.getAttribute('events')+']' , dataFields)
      if (!node.data) node.data = {}
      for (let df of dataFields) {
        // console.info('    ===', df, datas[df])
        node.data[df] = datas[df]
      }
    }

    // 递归处理子集
    _make(node, datas, level + 1, dataFields, thisArg, render)
  }
  // let t2 = new Date().getTime()
  // if(nodes.length>1000) {
  //   console.info('    ====>2', t2 - t1)
  // }

}

function makePreVars (str, datas, isBool, thisArg) {
  let str1 = str
  // if (str1.indexOf('+') !== -1) console.info('  makePreVars', str, datas)
  // if (str1.indexOf('!item.if') !== -1) console.info('  makePreVars1', str, isBool, $.json(datas.item, 2))
  if (str.indexOf('{') !== -1) {
    // 预处理循环中的动态变量
    str = str.replace(/\{[^{]+?}/g, word => {
      let r = makeString(word, datas, thisArg) || ''
      // if (str1.indexOf('!item.if') !== -1) console.info('    >>', word, r, r && r !== 'false' && r !== '0' && r !== 'undefined' && r !== 'null' ? 'true' : 'false')
      return !isBool ? r : r && r !== 'false' && r !== '0' && r !== 'undefined' && r !== 'null' ? 'true' : 'false'
    })
  }
  // if (str1.indexOf('!item.if') !== -1) console.info('  makePreVars2', str)

  if (str.indexOf('[') !== -1) {
    // 预处理循环中的动态变量
    // if (str1.indexOf('+') !== -1) console.info(111,str)
    str = str.replace(/\[[^\[]+?]/g, word => {
      let r = makeString('{' + word.substring(1, word.length - 1) + '}', datas, thisArg)
      // if (str1.indexOf('+') !== -1) console.info(222,word, '{' + word.substring(1, word.length - 1) + '}', r)
      // console.info(0, str, r)
      if (!r) {
        // if (str1.indexOf('+') !== -1) console.info(333,str)
        // console.info(111, word)
        return word
      }
      // if (/^[\-+]?[0-9]\d*$/.test(r)) {
      if (/^[a-zA-Z]/.test(r)) {
        // if (str1.indexOf('+') !== -1) console.info(444,str)
        // console.info(222, '[' + r + ']')
        // return '[' + r + ']'
        return '.' + r  // 数字也可以用这种方式
      } else if (/^[0-9]\d*$/.test(r)) {
        return '[' + r + ']'
      }
      // if (str1.indexOf("!='table'") !== -1) console.info(555,str)
      // console.info(333, '.' + r)
      return '[\'' + r + '\']'
    })
  }
  // if (str1.indexOf("!='table'") !== -1) console.info('  makePreVars3', str)

  if (str.indexOf('{') !== -1) {
    // 预处理循环中的动态变量
    str = str.replace(/\{[^{]+?}/g, word => {
      let r = makeString(word, datas, thisArg) || ''
      return !isBool ? r : r && r !== 'false' && r !== '0' && r !== 'undefined' && r !== 'null' ? 'true' : 'false'
    })
  }
  // if (str1.indexOf('!item.if') !== -1) console.info('  makePreVars4', str)

  if (str.indexOf('[') !== -1) {
    // 预处理循环中的动态变量
    str = str.replace(/\[[^\[]+?]/g, word => {
      let r = makeString('{' + word.substring(1, word.length - 1) + '}', datas, thisArg)
      // console.info(' ====', str, r)
      if (!r) {
        // console.info(' == 0', word)
        return word
      }
      // if (/^[\-+]?[1-9]\d*$/.test(r)) {
      if (/^[a-zA-Z]/.test(r)) {
        // console.info(' == 1', '[' + r + ']')
        return '[' + r + ']'
      } else if (/^[0-9]\d*$/.test(r)) {
        return '[' + r + ']'
      }
      // console.info(' == 2', '[' + r + ']')
      return '[\'' + r + '\']'
    })
  }
  // if (str1.indexOf('!item.if') !== -1) console.info('  makePreVars5', str)
  // if (str1.indexOf('!item.if') !== -1) console.info('')

  // if (str1.indexOf('field.key') !== -1) console.info('  >> makePreVars', str1, '=>', str)
  return str
}

function makeNodeVars (node, datas, thisArg) {
  if (node.vars) {
    for (let key in node.vars) {
      if (key === 'bind') {
        // 绑定对象后续另行处理
        node.setAttribute(key, node.vars[key])
        continue
      }
      let newValue = makeString(node.vars[key], datas, thisArg)
      if (key === 'data') {
        let div = document.createElement('div')
        div.innerHTML = newValue
        // 暂不支持变量中包含html内容
        // if (div.childNodes.length > 1) {
        //     console.info(node.parentNode)
        //     // div.insertBefore()
        // } else
        if (div.childNodes.length === 1 && div.childNodes[0].data) {
          node.data = div.childNodes[0].data
        } else {
          node.data = newValue
          // $.clear(node)
          // for(let subNode of div.children){
          //   console.info(111, subNode.nodeType, subNode.nodeName, subNode)
          //   node.appendChild(subNode)
          // }
          // console.info(222, newValue)
        }

      } else if (key === 'className') {
        node[key] = newValue
      } else if (key === 'disabled' || key === 'checked' || key === 'selected' || key === 'readOnly' || key === 'required') {
        node[key] = newValue === 'true' || newValue === '1'
      } else {
        node.setAttribute(key, newValue)
      }
    }
  }
}

function refresh (node, datas, thisArg) {
  // 仅处理属性
  makeNodeVars(node, datas, thisArg)
  // if (node.vars) {
  //     for (let key in node.vars) {
  //         let newValue = makeString(node.vars[key], datas)
  //         if (key === 'data') {
  //             let div = document.createElement('div')
  //             div.innerHTML = newValue
  //             node.data = div.innerHTML
  //         }else if (key === 'className') {
  //             node[key] = newValue
  //         } else if (key === 'disabled' || key === 'checked' || key === 'selected') {
  //             node[key] = newValue === 'true' || newValue === '1'
  //         } else {
  //             node.setAttribute(key, newValue)
  //         }
  //     }
  // }
  let dataFields = []
  for (let k in datas) {
    if (k !== 'data') dataFields.push(k)
  }
  _make(node, datas, 0, dataFields, thisArg, {})
  fixSvg(node)
}

function make (targetNode, datas, thisArg) {
  _make([targetNode], datas, 0, [], thisArg, {})
  fixSvg(targetNode)
}

function makeSelf (targetNode, datas, thisArg) {
  makeNodeVars(targetNode, datas, thisArg)
}

function makeSubs (targetNode, datas, thisArg) {
  let a = []
  for (let node of targetNode.childNodes) a.push(node)
  _make(a, datas, 0, [], thisArg, {})
  fixSvg(targetNode)
}

let _svgCaches = {}
let _svgCaching = {}

function convertSvgNode (to, from) {
  for (let node of from.childNodes) {
    if (node.nodeType === 1) {
      if (node.nodeName.toLowerCase() === 'style') {
        to.appendChild(node)
      } else {
        let newNode = document.createElementNS('http://www.w3.org/2000/svg', node.nodeName.toLowerCase())
        for (let attr of node.attributes) {
          newNode.setAttribute(attr.name, attr.value)
        }
        to.appendChild(newNode)

        if (node.childNodes.length) {
          convertSvgNode(newNode, node)
        }
      }
    }
  }
}

function makeSvg (node, data) {
  let div = document.createElement('div')
  div.innerHTML = data
  let svg = div.childNodes[0]
  while (node.childNodes.length) node.removeChild(node.childNodes[0])

  for (let attr of svg.attributes) {
    if (node.getAttribute('_' + attr.name)) continue
    if (attr.name === 'style' && node.hasAttribute('style')) continue
    node.setAttribute(attr.name, attr.value)
  }

  convertSvgNode(node, svg)
}

// 修复 svg
function fixSvg (dom) {
  if (!dom) dom = document.body
  let nodes = dom.nodeName.toLowerCase() === 'svg' ? [dom] : dom.querySelectorAll('svg[src]')
  for (let node of nodes) {
    let src = node.getAttribute('src')
    if (src && node.getAttribute('_loadedSrc') !== src) {
      for (let attr of node.attributes) {
        if (attr.name.startsWith('_')) continue
        if (!node.getAttribute('_' + attr.name)) node.setAttribute('_' + attr.name, attr.value)
      }

      let svgCache = _svgCaches[src]
      if (!svgCache) {
        // 是否正在缓存？
        if (_svgCaching[src]) {
          _svgCaching[src].push(node)
        } else {
          // 获取svg数据
          _svgCaching[src] = []
          fetch(src).then(r => r.text()).then(svgData => {
            let m = svgData.match(new RegExp('<svg.*?>.*?</svg>', 'is'))
            if (m) {
              m[0] = m[0].replace(/<(\w+)([^<]+?)\/>/g, '<$1$2></$1>')
              _svgCaches[src] = m[0]
              makeSvg(node, m[0])
              if (_svgCaching[src].length > 0) {
                for (let pendingNode of _svgCaching[src]) {
                  makeSvg(pendingNode, m[0])
                }
              }
            }
            node.setAttribute('_loadedSrc', src)
            if (_svgCaching[src].length > 0) {
              for (let pendingNode of _svgCaching[src]) {
                pendingNode.setAttribute('_loadedSrc', src)
              }
            }
          }).catch(e => {
            console.error(e)
          })
        }
      } else {
        // 从缓存创建
        makeSvg(node, svgCache)
        node.setAttribute('_loadedSrc', src)
      }
    }
  }
}

function makeEvents (nodes, target) {
  if (nodes && target) {
    for (let node of nodes) {
      // console.info(' >>>0', node.getAttribute('events'))
      // if (node.getAttribute('events') === 'dragover,drop') {
      //   console.info(' >>>1', node.getAttribute('events'), node)
      // }

      // if (node.hasAttribute('events')) {
      //   let events = node.getAttribute('events').split(',')
      //   // console.info(' !!!1 ', node)
      //   // console.info('   !!!2 ', events)
      //   for (let e of events) {
      //     let a = e.split(':')
      //     if (a.length === 1) a.push(a[0])
      //     // console.info('   >> !!!3 ', a[1], target[a[1]])
      //     if (target[a[1]]) {
      //       if (!node.events) node.events = {}
      //       if (!node.events[a[0]]) {
      //         node.events[a[0]] = true
      //         node.addEventListener(a[0], target[a[1]].bind(target), a.length > 2)
      //       }
      //     }
      //   }
      // }

      if (node.hasAttribute('events')) {
        let events = node.getAttribute('events').split(',')
        for (let e of events) {
          e = e.trim()
          if (!e) continue
          let a = e.split(':')
          if (a.length === 1) a.push(a[0])
          // if(a[1]==='save2')console.info('   >> !!!3 ', a[1], target[a[1]])

          if (target[a[1]]) {
            if (!node.events) node.events = {}
            if (!node.events[a[0]] || node.events[a[0]] !== a[1]) {
              // if(a[1]==='onSubMenu')console.info('~~~onSubMenu', a, target[a[1]], target)
              if (node.events[a[0] + 'Func']) node.removeEventListener(a[0], node.events[a[0] + 'Func'])
              let func = target[a[1]].bind(target)
              node.events[a[0]] = a[1]
              node.events[a[0] + 'Func'] = func
              // console.info(a, func)

              node.addEventListener(a[0], func, a.length > 2)
            }
          }
        }
      }

    }
  }
}

export default { refresh, make, makeSelf, makeSubs, makeString, fixSvg, makeEvents }
