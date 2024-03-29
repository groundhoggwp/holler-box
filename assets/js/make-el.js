(($) => {

  /**
   *
   * @param string
   * @return {boolean}
   */
  function isString (string) {
    return typeof string === 'string'
  }

  const AttributeHandlers = {
    value: ( el, value ) => {
      el.value = value
    },
    className: (el, attribute) => {
      if (isString(attribute)) {
        attribute = attribute.split(' ').map( c => c.trim() ).filter( c => c )
      }

      el.classList.add(...attribute)
    },
    eventHandlers: (el, events) => {
      for (let event in events) {
        el.addEventListener(event, events[event])
      }
    },
    onInput: (el, func) => AttributeHandlers.eventHandlers(el, { input: func }),
    onChange: (el, func) => AttributeHandlers.eventHandlers(el, { change: func }),
    onFocus: (el, func) => AttributeHandlers.eventHandlers(el, { focus: func }),
    onClick: (el, func) => AttributeHandlers.eventHandlers(el, { click: func }),
    style: (el, style) => {

      if (isString(style)) {
        el.style = style
        return
      }

      for (let attribute in style) {
        el.style[attribute] = style[attribute]
      }
    },
    onCreate: (el, func) => func(el),

  }

  /**
   *
   * @param html
   * @return {ChildNode}
   */
  function htmlToElement (html) {
    var template = document.createElement('template')
    html = html.trim() // Never return a text node of whitespace as the result
    template.innerHTML = html
    return template.content.firstChild
  }

  /**
   *
   * @param html
   * @return {NodeListOf<ChildNode>}
   */
  function htmlToElements (html) {
    var template = document.createElement('template')
    template.innerHTML = html
    return template.content.childNodes
  }

  /**
   *
   * @param tagName
   * @param attributes
   * @param children
   * @return {*}
   */
  const makeEl = (tagName, attributes, children = null) => {

    let el = tagName === 'fragment' ? document.createDocumentFragment() : document.createElement(tagName)

    for (let attributeName in attributes) {

      if (attributes[attributeName] === false) {
        continue
      }

      if (AttributeHandlers.hasOwnProperty(attributeName)) {
        AttributeHandlers[attributeName](el, attributes[attributeName])
        continue
      }

      if (attributeName.startsWith('data')) {
        let dataName = attributeName.replace(/^data(.+)/, '$1')
        dataName = dataName.charAt(0).toLowerCase() + dataName.slice(1)

        el.dataset[dataName] = attributes[attributeName]
        continue
      }

      el.setAttribute(attributeName, attributes[attributeName])
    }

    if (children === null) {
      return el
    }

    if (!Array.isArray(children)) {
      children = [children]
    }

    children.forEach(child => {

      if (! child) {
        return
      }

      // Template literals
      if (isString(child)) {
        let _children = htmlToElements(child)
        while (_children.length) {
          el.appendChild(_children[0])
        }
        return
      }

      el.appendChild(child)
    })

    return el
  }

  const Input = (attributes) => {
    return makeEl('input', {
      type: 'text',
      ...attributes,
    })
  }

  const Textarea = (attributes) => {
    return makeEl('textarea', {
      ...attributes,
    })
  }

  const Select = (attributes) => {

    let {
      options = {},
      selected = '',
      onChange = e => {},
      ...rest
    } = attributes

    if (!Array.isArray(options)) {
      options = Object.keys(options).map(key => ({ value: key, text: options[key] }))
    }

    if (!Array.isArray(selected)) {
      selected = [selected]
    }

    options = options.map(opt => typeof opt === 'string' ? { value: opt, text: opt } : opt).
    map(({ value, text }) => makeEl('option', {
      value,
      selected: selected.includes(value),
    }, text))

    return makeEl('select', {
      ...rest,
      onChange: (e) => {
        if (rest.multiple) {
          e.target.values = e.target.querySelectorAll('option:checked').map(el => el.value)
        }

        onChange(e)
      },
    }, options)
  }

  const Button = (attributes, children) => {
    return makeEl('button', {
      ...attributes,
    }, children)
  }

  const Toggle = ({
    onLabel = 'On',
    offLabel = 'Off',
    ...atts
  }) => {

    return makeEl('label', {
      className: 'holler-switch',
    }, [
      Input({
        ...atts,
        type: 'checkbox',
      }),
      //language=HTML
      `<span class="slider round"></span>
	  <span class="on">${onLabel}</span>
	  <span class="off">${offLabel}</span>`,
    ])
  }

  const Div = (attributes = {}, children = []) => {
    return makeEl('div', attributes, children)
  }

  const Dashicon = (icon) => {
    return makeEl('span', {
      className: `dashicons dashicons-${icon}`,
    })
  }

  const Fragment = ( children ) => {
    return makeEl( 'fragment', {}, children )
  }

  const Span = (attributes = {}, children = []) => {
    return makeEl('span', attributes, children )
  }

  const Label = (attributes = {}, children = []) => {
    return makeEl('label', attributes, children )
  }

  const InputRepeater = ({
    onChange = () => {},
    rows = [],
    cells = [],
    sortable = false,
    fillRow = () => Array(cells.length).fill(''),
  }) => {

    const changeEvent = () => new CustomEvent()

    const removeRow = (rowIndex) => {
      rows.splice(rowIndex, 1)
      onChange(rows)
    }

    const addRow = () => {
      rows.push(fillRow())
      onChange(rows)
    }

    const onCellChange = (rowIndex, cellIndex, value) => {
      rows[rowIndex][cellIndex] = value
      onChange(rows)
    }

    const RepeaterRow = (row, rowIndex) => Div({
      className: 'holler-input-repeater-row',
      dataRow: rowIndex,
    }, [
      // Cells
      ...cells.map((cellCallback, cellIndex) => cellCallback({
        value: row[cellIndex] ?? '',
        dataRow: rowIndex,
        dataCell: cellIndex,
        onChange: e => onCellChange(rowIndex, cellIndex, e.target.value),
      }, row)),
      // Sortable Handle
      sortable ? makeEl('span', {
        className: 'handle',
        dataRow: rowIndex,
      }, Dashicon('move')) : null,
      // Remove Row Button
      Button({
        className: 'holler-button dashicon remove-row',
        dataRow: rowIndex,
        onClick: e => removeRow(rowIndex),
      }, Dashicon('no-alt')),
    ])

    let repeater = Div({
      className: 'holler-input-repeater',
      onCreate: el => {

        if (!sortable) {
          return
        }

        $(el).sortable({
          handle: '.handle',
          update: (e, ui) => {

            let $row = $(ui.item)
            let oldIndex = parseInt($row.data('row'))
            let curIndex = $row.index()

            let row = rows[oldIndex]

            rows.splice(oldIndex, 1)
            rows.splice(curIndex, 0, row)
            onChange(rows, repeater)
          },
        })
      },
    }, [
      ...rows.map((row, i) => RepeaterRow(row, i)),
      Div({
        className: 'holler-input-repeater-row-add',
      }, [
        `<div class="spacer"></div>`,
        // Add Row Button
        Button({
          className: 'add-row holler-button dashicon',
          onClick: e => addRow(),
        }, Dashicon('plus-alt2')),
      ]),
    ])

    return repeater
  }

  window.MakeEl = {
    makeEl,
    Input,
    Textarea,
    Select,
    Button,
    Toggle,
    Div,
    Span,
    Label,
    InputRepeater,
    Fragment
  }
})(jQuery)