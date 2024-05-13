( () => {

  const Cookies = {

    MINUTE_IN_SECONDS: 60,
    HOUR_IN_SECONDS: this.MINUTE_IN_SECONDS * 60,
    DAY_IN_SECONDS: this.HOUR_IN_SECONDS * 24,
    WEEK_IN_SECONDS: this.DAY_IN_SECONDS * 7,
    MONTH_IN_SECONDS: this.DAY_IN_SECONDS * 30,

    closedPopups: 'holler-closed-popups',
    popupConversions: 'holler-popup-conversions',
    popupViews: 'holler-popup-views',
    pageViews: 'holler-page-views',
    contentViews: 'holler-content-views',
    potentialViews: 'holler-potential-views',
    sessions: 'holler-sessions',

    addClosedPopup (id) {
      let allClosed = this.getCookie(this.closedPopups, '').split(',')
      allClosed.push(id)
      this.setCookie(this.closedPopups, allClosed.join(),
        HollerBox.cookie_lifetime)
    },

    isClosed (id) {
      let allClosed = this.getCookie(this.closedPopups, '').
        split(',').
        map(id => parseInt(id))
      return allClosed.includes(id)
    },

    addPopupCount (cookie, id, ttl = false) {

      if (ttl === false) {
        ttl = HollerBox.cookie_lifetime
      }

      let counts = JSON.parse(this.getCookie(cookie, '{}'))

      if (!counts) {
        counts = {}
      }

      if (counts[id]) {
        counts[id] += 1
      }
      else {
        counts[id] = 1
      }

      this.setCookie(cookie, JSON.stringify(counts), ttl)
    },

    getPopupCount (cookie, id) {
      let counts = JSON.parse(this.getCookie(cookie, '{}'))
      return parseInt(counts[id] ?? 0)
    },

    addPopupConversion (id) {
      this.addPopupCount(this.popupConversions, id)
    },

    getPopupConversions (id) {
      return this.getPopupCount(this.popupConversions, id)
    },

    addPopupView (id) {
      this.addPopupCount(this.popupViews, id)
    },

    addContentView (id) {
      this.addPopupCount(this.contentViews, id)
    },

    addPotentialView (id) {
      this.addPopupCount(this.potentialViews, id)
    },

    getPopupViews (id) {
      return this.getPopupCount(this.popupViews, id)
    },

    getContentViews (id) {
      return this.getPopupCount(this.contentViews, id)
    },

    getPotentialViews (id) {
      return this.getPopupCount(this.potentialViews, id)
    },

    addPageView () {
      this.setCookie(this.pageViews, this.getPageViews() + 1,
        this.DAY_IN_SECONDS)
    },

    getPageViews () {
      return parseInt(this.getCookie(this.pageViews, 0))
    },

    setCookie (name, value, duration) {

      if (isBuilderPreview()) {
        return
      }

      let d = new Date()
      d.setTime(d.getTime() + ( duration * 1000 ))
      let expires = 'expires=' + d.toUTCString()
      document.cookie = name + '=' + value + ';' + expires + ';path=/'
    },

    getCookie (cname, _default = null) {
      let name = cname + '='
      let ca = document.cookie.split(';')
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') {
          c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length)
        }
      }
      return _default
    },

    getSessions () {
      let obj = JSON.parse(this.getCookie(this.sessions, '{}'))
      return parseInt(obj.sessions || 0)
    },

    maybeAddSession () {
      let obj = JSON.parse(this.getCookie(this.sessions, '{}'))

      let lastSession = new Date(obj.lastSession)
      lastSession.setDate(lastSession.getDate() + 1)
      let now = new Date()

      if (now > lastSession) {
        this.setCookie(this.sessions, JSON.stringify({
          sessions: parseInt(obj.sessions) + 1,
          lastSession: now.toString(),
        }), HollerBox.cookie_lifetime)
      }
    },

    hasAccepted () {

      if (!HollerBox.settings.cookie_compliance) {
        return true
      }

      let { cookie_name = '', cookie_value = '' } = HollerBox.settings

      return this.getCookie(cookie_name) === cookie_value
    },
  }

  function ApiError (message) {
    this.name = 'ApiError'
    this.message = message
  }

  ApiError.prototype = Error.prototype

  /**
   * Post data
   *
   * @param url
   * @param data
   * @param opts
   * @returns {Promise<any>}
   */
  async function apiPost (url = '', data = {}, opts = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': HollerBox.nonces._wprest,
      },
      body: JSON.stringify(data),
      ...opts,
    })

    let json = await response.json()

    if (!response.ok) {
      throw new ApiError(json.message)
    }

    return json
  }

  const maybeLog = (error) => {
    if (HollerBox.settings?.script_debug_mode) {
      console.debug(error)
    }
  }

  const overlay = () => {
    //language=HTML
    return `
        <div class="holler-box-overlay"></div>`
  }

  const closeButton = () => {

    let curr = currentPopup()

    if (curr && !curr.isCloseable()) {
      return ''
    }

    let {
      close_button_size = 'small',
      close_button_icon = 'normal',
    } = curr

    // Force notification close button icon
    if (curr.isNotification()) {
      close_button_icon = 'normal'
    }

    const closeIcons = {
      //language=HTML
      normal: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 365.7 365.7">
              <path fill="currentColor"
                    d="M243 183 356 70c13-13 13-33 0-46L341 9a32 32 0 0 0-45 0L183 123 70 9a32 32 0 0 0-46 0L9 24a32 32 0 0 0 0 46l114 113L9 296a32 32 0 0 0 0 45l15 15c13 13 33 13 46 0l113-113 113 113c12 13 33 13 45 0l15-15c13-12 13-33 0-45zm0 0"/>
          </svg>`,
      //language=HTML
      filled: `
          <svg viewBox="0 0 511.8 511.8" xmlns="http://www.w3.org/2000/svg">
              <path
                      d="M 286 256 L 361 180 C 366.359 174.641 368.452 166.83 366.49 159.51 C 362.264 143.736 342.547 138.453 331 150 L 256 226 L 180 150 C 174.641 144.641 166.83 142.548 159.51 144.51 C 143.736 148.736 138.453 168.453 150 180 L 226 256 L 150 331 C 144.641 336.359 142.548 344.17 144.51 351.49 C 148.736 367.264 168.453 372.547 180 361 L 256 286 L 331 361 C 336.359 366.359 344.17 368.452 351.49 366.49 C 367.264 362.264 372.547 342.547 361 331 Z"
                      style="fill: rgb(255, 255, 255);"/>
              <path fill="currentColor"
                    d="M 436.9 74.4 C 297.181 -64.934 59.024 -0.768 8.216 189.899 C -15.363 278.388 10.056 372.735 74.9 437.4 C 214.619 576.734 452.776 512.568 503.584 321.901 C 527.163 233.412 501.744 139.065 436.9 74.4 Z M 360.9 330.4 C 372.447 341.947 367.164 361.664 351.39 365.89 C 344.07 367.852 336.259 365.759 330.9 360.4 L 255.9 285.4 L 179.9 360.4 C 168.353 371.947 148.636 366.664 144.41 350.89 C 142.448 343.57 144.541 335.759 149.9 330.4 L 225.9 255.4 L 149.9 179.4 C 138.353 167.853 143.636 148.136 159.41 143.91 C 166.73 141.948 174.541 144.041 179.9 149.4 L 255.9 225.4 L 330.9 149.4 C 342.447 137.853 362.164 143.136 366.39 158.91 C 368.352 166.23 366.259 174.041 360.9 179.4 L 285.9 255.4 L 360.9 330.4 Z"/>
          </svg>`,
    }

    let classes = [
      close_button_size,
      close_button_icon,
    ]

    if (curr.isBanner() || curr.isSidebar()) {
      classes.push('icon-inside')
    }

    //language=HTML
    return `
        <button class="holler-box-modal-close ${ classes.join(' ') }">
            ${ closeIcons[close_button_icon] }
        </button>`
  }

  const credit = () => {

    // Credit is disabled
    if (HollerBox.settings?.credit_disabled) {
      return ''
    }

    //language=HTML
    return `
        <div class="holler-box-credit"><a href="https://hollerwp.com/">⚡ by
            HollerBox</a></div>`
  }

  const createHTML = (HTML) => {
    let div = document.createElement('div')
    div.innerHTML = HTML
    return div.firstElementChild

  }

  /**
   * If it's not a string just return the value
   *
   * @param string
   * @returns {*}
   */
  const escapeStr = (string) => {
    return string.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  }

  const gdprInput = () => {

    const HTML = createHTML(HollerBox.settings.gdpr_text)

    //language=HTML
    return `<label class="holler-gdpr-consent">
        <input type="checkbox"
               name="gdpr_consent"
               value="yes" required>
        <span>${ HTML.innerHTML }</span></label>`
  }

  const nameInput = (placeholder = 'Your name', required = true) => {
    //language=HTML
    return `<input class="holler-box-input" type="text" name="name"
                   placeholder="${ escapeStr(placeholder) }" ${ required ? 'required' : '' }>`
  }

  const phoneInput = (placeholder = 'Mobile Number', required = false) => {
    //language=HTML
    return `<input class="holler-box-input" type="tel" name="phone"
                   placeholder="${ escapeStr(placeholder) }" ${ required ? 'required' : '' }>`
  }

  const emailInput = (placeholder = 'Your email') => {
    //language=HTML
    return `<input class="holler-box-input" type="email" name="email"
                   placeholder="${ escapeStr(placeholder) }" required>`
  }

  const submitButton = (text, type = 'submit') => {
    //language=HTML
    return `
        <button type="${ type }" class="holler-box-button">${ text }</button>`
  }

  const __title = (title) => {
    //language=HTML
    return `
        <h2 class="holler-box-modal-title">${ title }</h2>
    `
  }

  const __content = (content) => {
    //language=HTML
    return `
        <div class="holler-box-modal-content">
            ${ content }
        </div>
    `
  }

  const __chatResponse = (content) => {
    //language=HTML
    return `
        <div class="holler-box-chat-response">
            <div class="content">
                ${ content }
            </div>
        </div>
    `
  }

  const __chatMessage = ({ content, avatar }) => {

    content = `<div class="content">${ content }</div>`

    //language=HTML
    return `
        <div class="holler-box-chat-message">
            ${ avatar ? `<img src="${ avatar }" class="avatar" alt="">` : '' }
            ${ content }
        </div>
    `
  }

  const notificationClosedTemplate = ({ id, position }) => {
    // language=HTML
    return `
        <div id="${ id }" class="holler-box holler-notification-box">
            <div class="positioner ${ position }">
                <div class="animation slide-in">
                    <div class="holler-box-modal notification-closed">
                        <svg xmlns="http://www.w3.org/2000/svg"
                             viewBox="0 0 512 512">
                            <rect width="107.6" height="145.6" x="319.1"
                                  y="76.6" fill="#fff" rx="5" ry="5"/>
                            <path fill="#f44336"
                                  d="M373 0a139 139 0 1 0 1 278 139 139 0 0 0-1-278zm22 187a16 16 0 0 1-32 0v-70h-11a16 16 0 0 1 0-32h27c8 0 16 8 16 16zm0 0"/>
                            <path fill="#ffa000"
                                  d="M299 427a85 85 0 1 1-171 0 85 85 0 0 1 171 0zm0 0"/>
                            <path fill="#ffc107"
                                  d="M380 320h-7A182 182 0 0 1 220 43h-7c-82 0-149 67-149 149v59c0 43-18 83-51 110a37 37 0 0 0 24 66h352a37 37 0 0 0 24-66c-13-12-24-26-33-41zm0 0"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>`
  }

  /**
   *
   * @param string
   * @return {*}
   */
  const removeTrailingSlash = (string) => {
    return string.replace(/\/$/, '')
  }

  /**
   *
   * @param url
   * @return {URL}
   */
  const makeURL = (url) => {
    try {
      return new URL(url)
    }
    catch (e) {
      try {
        return new URL(`${ removeTrailingSlash(HollerBox.nav.home) }${ url.startsWith('/') ? '' : '/' }${ url }`)
      }
      catch (e) {
        return new URL(HollerBox.nav.home)
      }
    }
  }

  const SubmitActions = {
    close: (popup) => {
      popup.close()
    },
    redirect: (popup) => {

      let { redirect_url = '' } = popup

      let url = makeURL(redirect_url)
      let home = new URL(HollerBox.home_url)

      if (isBuilderPreview()) {

        if (url.hostname !== home.hostname) {
          popup.close()
          return
        }

        url.searchParams.append('suppress_hollerbox', 1)

      }

      window.open(url, '_self')
    },
    message: (popup) => {
      // just re-open it with the message
      popup.open()
    },
  }

  function sanitizeTextField (string) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#x27;',
      '/': '&#x2F;',
    }
    const reg = /[&<>"'/]/ig
    return string.replace(reg, (match) => ( map[match] ))
  }

  const CommonActions = {
    maybeDisableScrolling: (popup) => {
      if (popup.disable_scrolling) {
        document.body.classList.add('disable-scrolling')
      }
    },
    enableScrolling: () => {
      document.body.classList.remove('disable-scrolling')
    },
    notificationClosed: (popup) => {
      localStorage.setItem( `holler_chat_${popup.ID}_status`, 'closed' )
      popup.closed = true
      popup.open()
    },
    notificationOpened: (popup) => {
      if (popup.closed) {
        document.getElementById(popup.id).addEventListener('click', e => {
          popup.close().then(() => {
            localStorage.setItem( `holler_chat_${popup.ID}_status`, 'open' )
            popup.closed = false
            popup.open()
          })
        })
      }
    },
    formSubmitted: (popup, filters = {}) => {

      const isCustomForm = popup.use_custom_form

      if (isCustomForm) {

        let customForm
        let parser = new DOMParser()
        let doc = parser.parseFromString(popup.custom_form_html, 'text/html')
        customForm = document.importNode(doc.querySelector('form'), true)

        if (!customForm) {
          throw new Error('Invalid form object')
        }

        let form = popup.querySelector('form.holler-box-form')
        customForm.classList.add('holler-box-form', 'custom-form')

        let newForm = document.createElement('form')
        newForm.setAttribute('action', customForm.getAttribute('action'))
        newForm.setAttribute('method', customForm.getAttribute('method'))
        newForm.classList.add('holler-box-form', 'custom-form')

        Array.from(customForm.elements).forEach(el => {

          el.removeAttribute('style')

          switch (el.tagName) {
            case 'INPUT':
              switch (el.type) {
                default:
                  el.classList.add('holler-box-input')
                  break
                case 'submit':
                case 'button':
                  el.classList.add('holler-box-button')
                  break
                case 'radio':
                case 'checkbox':

                  if (el.parentNode.tagName === 'LABEL') {
                    el = el.parentNode
                    break
                  }

                  if (!el.id) {
                    break
                  }

                  let label = customForm.querySelector(`label[for='${ el.id }']`)

                  if (!label) {
                    break
                  }

                  let div = document.createElement('div')
                  div.appendChild(label)
                  div.appendChild(el)

                  el = div

                  break
              }
              break
            case 'TEXTAREA':
            case 'SELECT':
              el.classList.add('holler-box-input')
              break
            case 'BUTTON':
              el.classList.add('holler-box-button')
              break
          }

          newForm.append(el)
        })

        form.replaceWith(newForm)
      }

      const {
        modifyFormData = (fd) => {},
        modifyPayload = (pl) => {},
      } = filters

      const { id, after_submit = 'close' } = popup

      let theForm = popup.querySelector('form.holler-box-form')

      /**
       * Handles the form submit action
       *
       * @param e
       * @return {Promise<T>}
       */
      const handleFormSubmit = e => {
        e.preventDefault()

        let form = e.target
        let formData = new FormData(form)

        if (isCustomForm) {

          let propertiesMap = {
            'email': 'email',
            'name': 'name',
            'first': 'name',
            'last': 'name',
            'phone': 'phone',
            'tel': 'phone',
          }

          for (const pair of formData.entries()) {
            for (const prop in propertiesMap) {
              if (pair[0].match(new RegExp(prop, 'i'))) {

                let mapTo = propertiesMap[prop]

                if (formData.has(mapTo) && formData.get(mapTo) !== pair[1]) {
                  formData.set(mapTo, `${ formData.get(mapTo) } ${ pair[1] }`)
                }
                else if (!formData.has(mapTo)) {
                  formData.append(mapTo, pair[1])
                }
              }
            }
          }
        }

        formData.append('location', window.location.href)
        formData.append('referer', document.referrer)

        modifyFormData(formData)

        form.querySelector('button').innerHTML = '<span class="holler-spinner"></span>'

        let payload = Object.fromEntries(formData)

        modifyPayload(payload)

        return popup.submit({
          ...payload,
          content: 'Form Submitted',
        }).
          then(({ status = 'success', failures = [] }) => {

            // Ignore if custom form
            if (isCustomForm) {
              return
            }

            if (status === 'failed') {

              if (!failures.length) {
                alert('Something when wrong, please try again later.')
                popup.close()
                return
              }

              console.log(failures)

              popup.querySelector('form').innerHTML = [
                `<div class="hollerbox-integration-errors">`,
                `<p>There are issues with some of your integrations:</p>`,
                `<ul>`,
                ...failures.map(f => `<li>${ f }</li>`),
                `</ul>`,
                `<p>Only admins see this message.</p>`,
                `</div>`,
              ].join('')

              return
            }

            SubmitActions[after_submit](popup)
          }).
          catch(e => {
            maybeLog(e)

            if (isBuilderPreview()) {
              SubmitActions[after_submit](popup)
              return
            }

            // Don't close if custom form otherwise it won't submit for real
            if (!isCustomForm) {
              popup.close()
            }
          }).finally(() => {

            if (isBuilderPreview()) {
              return
            }

            if (isCustomForm) {
              form.removeEventListener('submit', handleFormSubmit)
              form.submit()
            }
          })
      }

      theForm.addEventListener('submit', handleFormSubmit)
    },
    buttonClicked: (popup) => {

      const { id, button_link } = popup

      let button = document.querySelector(`#${ id } button.holler-box-button`)

      let url = makeURL(button_link)
      let home = new URL(HollerBox.home_url)

      button.addEventListener('click', e => {
        e.preventDefault()
        button.innerHTML = '<span class="holler-spinner"></span>'
        popup.converted('Clicked Button').then(() => {

          if (isBuilderPreview()) {

            if (url.hostname !== home.hostname) {
              popup.close()
              return
            }

            url.searchParams.append('suppress_hollerbox', 1)
          }

          window.open(url, '_self')
        })
      })

    },
  }

  const isGDPREnabled = () => {
    return HollerBox.settings?.gdpr_enabled ?? false
  }

  const formProps = ({
    enable_name = true,
    enable_phone = false,
    ...props
  }) => ( {
    name: enable_name,
    phone: enable_phone,
    ...props,
  } )

  const form = props => {

    const {
      email = true,
      name = true,
      phone = false,
      direction = 'vertical',
      name_placeholder = 'Name',
      email_placeholder = 'Email',
      phone_placeholder = 'Phone',
      button_text = 'Subscribe',
      phone_required = false,
      name_required = true,
    } = formProps(props)

    let classes = [
      'holler-box-form',
      direction,
      name ? 'has-name' : '',
      phone ? 'has-phone' : '',
      isGDPREnabled() ? 'has-gdpr' : '',
    ]

    //language=HTML
    return `
        <form class="${ classes.join(' ') }">
            <div class="fields">
                ${ name ? nameInput(name_placeholder, name_required) : '' }
                ${ email ? emailInput(email_placeholder) : '' }
                ${ phone ? phoneInput(phone_placeholder, phone_required) : '' }
                ${ direction === 'vertical' && isGDPREnabled()
                        ? gdprInput()
                        : '' }
                ${ submitButton(button_text) }
            </div>
            ${ direction === 'horizontal' && isGDPREnabled() ? gdprInput() : '' }
        </form>`
  }

  const PopupTemplates = {
    notification_box: {
      render: ({
        id = '',
        position = 'bottom-right',
        post_content = '',
        avatar = '',
        closed = false,
      }) => {

        if (closed) {
          return notificationClosedTemplate({ id, position })
        }

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-notification-box">
                <div class="positioner ${ position }">
                    <div class="animation slide-in">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                ${ avatar ? `<img src="${ avatar }" alt="">` : '' }
                                ${ __content(post_content) }
                            </div>
                            ${ credit() }
                        </div>
                    </div>
                </div>
            </div>`
      },
      onOpen: CommonActions.notificationOpened,
      onClosed: CommonActions.notificationClosed,
    },
    notification_box_with_button: {
      render: ({
        id = '',
        position = 'bottom-right',
        post_content = '',
        avatar = '',
        button_text = '',
        closed = false,
      }) => {

        if (closed) {
          return notificationClosedTemplate({ id, position })
        }

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-notification-box with-button">
                <div class="positioner ${ position }">
                    <div class="animation slide-in">
                        <div class="holler-box-modal ">
                            ${ closeButton() }
                            <div class="display-flex">
                                ${ avatar ? `<img src="${ avatar }" alt="">` : '' }
                                ${ __content(post_content) }
                            </div>
                            <div class="holler-button-cta">
                                ${ submitButton(button_text, 'button') }
                            </div>
                            ${ credit() }
                        </div>
                    </div>
                </div>
            </div>`
      },
      onOpen: (popup) => {
        CommonActions.notificationOpened(popup)
        CommonActions.buttonClicked(popup)
      },
      onClosed: CommonActions.notificationClosed,
    },
    notification_box_with_form: {
      render: ({
        id = '',
        position = 'bottom-right',
        post_content = '',
        avatar = '',
        button_text = 'Signup',
        email_placeholder = 'Email',
        success_message = '',
        closed = false,
        submitted = false,
      }) => {

        if (closed) {
          return notificationClosedTemplate({ id, position })
        }

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-notification-box with-form ${ submitted
                         ? 'no-animation'
                         : '' }">
                <div class="positioner ${ position }">
                    <div class="animation slide-in">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                ${ avatar ? `<img src="${ avatar }" alt="">` : '' }
                                ${ __content(
                                        submitted ? success_message : post_content) }
                            </div>
                            ${ submitted ? '' : form({
                                direction: 'horizontal',
                                name: false,
                                button_text,
                                email_placeholder,
                            }) }
                            ${ credit() }
                        </div>
                    </div>
                </div>
            </div>`
      },
      onOpen: (popup) => {
        CommonActions.notificationOpened(popup)
        CommonActions.formSubmitted(popup)
      },
      onClosed: CommonActions.notificationClosed,
    },
    fake_chat: {
      render: (popup) => {

        const {
          id = '',
          position = 'bottom-right',
          post_content = '',
          avatar = '',
          button_text = '',
          message_placeholder = 'Type your message',
          state = 'message',
          closed = false,
          doAnimations = true,
        } = popup

        if (closed) {
          // language=HTML
          return `
              <div id="${ id }" class="holler-box holler-notification-box">
                  <div class="positioner ${ position }">
                      <div class="animation slide-in">
                          <div class="holler-box-modal notification-closed">
                              <svg xmlns="http://www.w3.org/2000/svg"
                                   viewBox="0 0 512 512">
                                  <path fill="#fff"
                                        d="M303.4 61.4A207 207 0 0 0 195 31C89 31 0 110 0 211a169 169 0 0 0 32 98.7L2.6 401.4a15 15 0 0 0 21.1 18l88.8-45.2c3.6 1.6 7.3 3 11 4.3A198.2 198.2 0 0 1 92 271c0-114.9 96.7-203.2 211.4-209.6z"/>
                                  <path fill="#fff"
                                        d="M480 369.7a169 169 0 0 0 32-98.7c0-101.1-89-180-195-180s-195 79-195 180c0 101.1 89 180 195 180 28.4 0 56.7-5.8 82.4-16.8l88.8 45.2a15 15 0 0 0 21-18zM256 286a15 15 0 1 1 0-30 15 15 0 0 1 0 30zm60 0a15 15 0 1 1 0-30 15 15 0 0 1 0 30zm60 0a15 15 0 1 1 0-30 15 15 0 0 1 0 30z"/>
                              </svg>
                          </div>
                      </div>
                  </div>
              </div>`
        }

        if (!popup.messages) {
          popup.messages = []
        }

        if (!popup.messages.length) {
          // language=HTML
          popup.messages.push(__chatMessage({ avatar, content: post_content }))
        }

        let input

        switch (state) {
          default:
          case 'message':
          case 'message_2':
            // language=HTML
            input = `<textarea rows="1" name="message"
                               placeholder="${ message_placeholder }"
                               class="holler-box-input" required></textarea>`
            break
          case 'name':
            input = nameInput()
            break
          case 'email':
            input = emailInput()
            break
        }

        // no form
        if (state === 'done') {
          // language=HTML
          return `
              <div id="${ id }"
                   class="holler-box holler-notification-box with-chat">
                  <div class="positioner ${ position }">
                      <div class="animation ${ doAnimations ? 'slide-in' : '' }">
                          <div class="holler-box-modal ">
                              ${ closeButton() }
                              ${ popup.messages.join('') }
                              <div class="close-chat-wrap">
                                  <button class="close-chat">&times; Close
                                      chat
                                  </button>
                              </div>
                              ${ credit() }
                          </div>
                      </div>
                  </div>
              </div>`
        }

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-notification-box with-chat">
                <div class="positioner ${ position }">
                    <div class="animation ${ doAnimations ? 'slide-in' : '' }">
                        <div class="holler-box-modal ">
                            ${ closeButton() }
                            ${ popup.messages.join('') }
                            <form class="holler-chat-form">
                                ${ input }
                                <button type="submit" class="send-message">
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                         viewBox="0 0 404.644 404.644">
                                        <path fill="currentColor"
                                              d="M5.535 386.177c-3.325 15.279 8.406 21.747 19.291 16.867l367.885-188.638h.037c4.388-2.475 6.936-6.935 6.936-12.08 0-5.148-2.548-9.611-6.936-12.085h-.037L24.826 1.6C13.941-3.281 2.21 3.189 5.535 18.469c.225 1.035 21.974 97.914 33.799 150.603l192.042 33.253-192.042 33.249C27.509 288.26 5.759 385.141 5.535 386.177z"/>
                                    </svg>
                                </button>
                            </form>
                            ${ credit() }
                        </div>
                    </div>
                </div>
            </div>`
      },
      beforeOpen: (popup) => {
        if (!popup.state) {
          popup.state = 'message'
        }

        if (!popup.responses) {
          popup.responses = {}
        }

        if (!popup.messages) {
          popup.messages = []
        }

        let status = localStorage.getItem( `holler_chat_${popup.ID}_status` )

        popup.closed = status === 'closed';
      },
      onOpen: (popup) => {

        if (popup.closed) {
          return CommonActions.notificationOpened(popup)
        }

        // scroll to bottom of div
        let modal = popup.querySelector('.holler-box-modal')
        modal.scrollTop = modal.scrollHeight

        const form = document.querySelector(`#${ popup.id } form.holler-chat-form`)

        // auto-focus to input after submit
        if (popup.state !== 'message') {
          document.querySelector(`#${ popup.id } .holler-box-input`)?.focus()
        }

        if (['message', 'more'].includes(popup.state)) {
          document.querySelector(`#${ popup.id } .holler-box-input`).
            addEventListener('keydown', e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                form.dispatchEvent(new Event('submit'))
              }
            })
        }

        if (popup.state === 'done') {

          document.querySelector(`#${ popup.id } .close-chat`).
            addEventListener('click', () => {
              popup.close()
            })
        }

        if (!form) {
          return
        }

        form.addEventListener('submit', e => {
          e.preventDefault()

          let fd = new FormData(e.target)

          switch (popup.state) {
            default:
            case 'message':

              let message = sanitizeTextField(fd.get('message'))

              popup.responses.message = message
              popup.messages.push(__chatResponse(message))
              popup.messages.push(__chatMessage({
                content: popup.name_prompt ?? '<p>What is your name?</p>',
                avatar: popup.avatar,
              }))
              popup.state = 'name'
              break
            case 'name':

              let name = sanitizeTextField(fd.get('name'))

              popup.responses.name = name
              popup.messages.push(__chatResponse(name))
              popup.messages.push(__chatMessage({
                content: popup.email_prompt ??
                  '<p>What is your best email address?</p>',
                avatar: popup.avatar,
              }))
              popup.state = 'email'
              break
            case 'email':
              popup.responses.email = fd.get('email')
              popup.messages.push(__chatResponse(fd.get('email')))
              popup.messages.push(__chatMessage({
                content: popup.message_prompt ??
                  '<p>Thanks for providing that information!</p><p>Can you please describe your needs in more detail?</p>',
                avatar: popup.avatar,
              }))
              popup.state = 'more'
              break
            case 'more':

              let message2 = '\n\n' + sanitizeTextField(fd.get('message'))

              popup.responses.message += message2

              popup.messages.push(__chatResponse(message2))

              popup.state = 'done'

              popup.submit({
                ...popup.responses,
                content: 'Chat',
              }).then(r => {
                switch (popup.after_submit) {
                  case 'message':

                    popup.messages.push(__chatMessage({
                      content: popup.success_message,
                      avatar: popup.avatar,
                    }))

                    popup.open()

                    break
                  case 'close':
                    popup.close()
                    break
                  case 'redirect':
                    SubmitActions['redirect'](popup)
                    break
                }
              }).catch(e => maybeLog(e))

              break
          }

          popup.doAnimations = false

          popup.open()
        })

      },
      onClosed: (popup) => {
        CommonActions.notificationClosed(popup)
        popup.doAnimations = true
      },
    },
    popup_custom: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        post_content = '',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-custom">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            ${ __content(post_content) }
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: CommonActions.maybeDisableScrolling,
      onClosed: CommonActions.enableScrolling,
    },
    popup_standard: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        post_content = '',
        submitted = false,
        success_message = '',
        overlay_enabled = true,

        ...props
      }) => {

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-popup holler-popup-standard ${ submitted
                         ? 'no-animation'
                         : '' }">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            ${ __content(
                                    submitted ? success_message : post_content) }
                            ${ submitted ? '' : form({
                                direction: 'vertical',
                                ...props,
                            }) }
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: popup => {
        CommonActions.formSubmitted(popup)
        CommonActions.maybeDisableScrolling(popup)
      },
      onClose: CommonActions.enableScrolling,
    },
    popup_image_left: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        title = '',
        post_content = '',
        image_src = '',
        submitted = false,
        success_message = '',
        overlay_enabled = true,
        ...props
      }) => {

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-popup holler-popup-image-left ${ submitted
                         ? 'no-animation'
                         : '' }">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                <div class="left image-width"
                                     style="background-image: url('${ image_src }')">
                                </div>
                                <div class="right">
                                    ${ __content(submitted
                                            ? success_message
                                            : post_content) }
                                    ${ submitted ? '' : form({
                                        direction: 'vertical',
                                        ...props,
                                    }) }
                                </div>
                            </div>
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: popup => {
        CommonActions.formSubmitted(popup)
        CommonActions.maybeDisableScrolling(popup)
      },
      onClose: CommonActions.enableScrolling,
    },
    popup_image_right: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        title = '',
        post_content = '',
        image_src = '',
        submitted = false,
        success_message = '',
        overlay_enabled = true,
        ...props
      }) => {

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-popup holler-popup-image-right ${ submitted
                         ? 'no-animation'
                         : '' }">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                <div class="left">
                                    ${ __content(submitted
                                            ? success_message
                                            : post_content) }
                                    ${ submitted ? '' : form({
                                        direction: 'vertical',
                                        ...props,
                                    }) }
                                </div>
                                <div class="right image-width"
                                     style="background-image: url('${ image_src }')">
                                </div>
                            </div>
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: popup => {
        CommonActions.formSubmitted(popup)
        CommonActions.maybeDisableScrolling(popup)
      },
      onClose: CommonActions.enableScrolling,
    },
    popup_form_below: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        post_content = '',
        image_src = '',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
        ...props
      }) => {

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-popup holler-popup-form-below ${ submitted
                         ? 'no-animation'
                         : '' }">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                <div class="left">
                                    ${ __content(submitted
                                            ? success_message
                                            : post_content) }
                                </div>
                                <div class="right image-width"
                                     style="background-image: url('${ image_src }')">
                                </div>
                            </div>
                            ${ submitted ? '' : form({
                                direction: 'horizontal',
                                ...props,
                                phone: false,
                            }) }
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: popup => {
        CommonActions.formSubmitted(popup)
        CommonActions.maybeDisableScrolling(popup)
      },
      onClose: CommonActions.enableScrolling,
    },
    popup_progress_bar: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        post_content = '',
        image_src = '',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
        ...props
      }) => {

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-popup holler-popup-progress-bar ${ submitted
                         ? 'no-animation'
                         : '' }">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="holler-box-progress-bar-wrap">
                                <div class="holler-box-progress-bar">
                                    <div
                                            class="holler-box-progress-bar-fill ${ submitted
                                                    ? 'filled'
                                                    : '' }"></div>
                                </div>
                            </div>
                            <div class="display-flex">
                                <div class="left image-width"
                                     style="background-image: url('${ image_src }')">
                                </div>
                                <div class="right">
                                    ${ __content(submitted
                                            ? success_message
                                            : post_content) }
                                    ${ submitted ? '' : form({
                                        direction: 'vertical',
                                        ...props,
                                    }) }
                                </div>
                            </div>
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: popup => {
        CommonActions.formSubmitted(popup)
        CommonActions.maybeDisableScrolling(popup)
      },
      onClose: CommonActions.enableScrolling,
    },
    popup_image_beside_text_top: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        title = '',
        post_content = '',
        image_src = '',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
        ...props
      }) => {

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-popup holler-popup-image-beside-text-top ${ submitted
                         ? 'no-animation'
                         : '' }">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            ${ __content(
                                    submitted ? success_message : post_content) }
                            <div class="display-flex">
                                <div class="left image-width"
                                     style="background-image: url('${ image_src }')">
                                </div>
                                ${ submitted ? '' : form({
                                    direction: 'vertical',
                                    ...props,
                                }) }
                            </div>
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: popup => {
        CommonActions.formSubmitted(popup)
        CommonActions.maybeDisableScrolling(popup)
      },
      onClose: CommonActions.enableScrolling,
    },
    popup_full_image_background: {
      render: ({
        id = '',
        position = 'center-center',
        animation = 'appear',
        image_src = '',
        post_content = '',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
        ...props
      }) => {

        // language=HTML
        return `
            <div id="${ id }"
                 class="holler-box holler-popup holler-popup-full-image-background ${ submitted
                         ? 'no-animation'
                         : '' }">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal"
                             style="background-image: url('${ image_src }')">
                            ${ closeButton() }
                            ${ __content(
                                    submitted ? success_message : post_content) }
                            ${ submitted ? '' : form({
                                direction: 'vertical',
                                ...props,
                            }) }
                        </div>
                        ${ credit() }
                    </div>
                </div>
            </div>`
      },
      onOpen: popup => {
        CommonActions.formSubmitted(popup)
        CommonActions.maybeDisableScrolling(popup)
      },
      onClose: CommonActions.enableScrolling,
    },
  }

  const notificationTemplates = () => [
    ...Object.keys(PopupTemplates).
      filter(s => s.startsWith('notification_box')), 'fake_chat',
  ]

  function getScrollPercent () {
    var h = document.documentElement,
      b = document.body,
      st = 'scrollTop',
      sh = 'scrollHeight'
    return ( h[st] || b[st] ) / ( ( h[sh] || b[sh] ) - h.clientHeight ) * 100
  }

  const PopupStack = {

    stack: [],

    add (p) {
      this.stack.push(p)
    },

    next () {
      let p = this.stack.pop()

      if (p) {

        setTimeout(() => {
          p.maybeOpen()
        }, HollerBox.settings.stacked_delay * 1000)
      }
    },

  }

  const TriggerCallbacks = {
    on_page_load: ({ delay = 1 }, show) => {
      setTimeout(show, delay * 1000)
    },
    element_click: (
      { selector = '', trigger_multiple = 'once' }, show, popup) => {
      document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('click', e => {

          if (trigger_multiple === 'multiple') {
            popup._triggered = false
          }

          if (show()) {
            e.preventDefault()
          }
        })
      })
    },
    scroll_detection: ({ depth = 50 }, show) => {
      document.addEventListener('scroll', () => {
        if (getScrollPercent() >= parseInt(depth)) {
          show()
        }
      })
    },
    exit_intent: (popup, show) => {
      if (isMobile()) {

        // Back Button
        window.addEventListener('popstate', (event) => {

          // if show is true, the popup is going to open
          if (show()) {
            // Prevent the actual page navigation by pushing a new state onto the history stack
            history.pushState(null, document.title, window.location.href)
          }
        })

        // using touch events (scroll up)

        // Wait 1 seconds
        setTimeout(() => {
          // Fast scroll up
          let startY = 0
          let startTime = 0
          let startScroll = 0

          window.addEventListener('touchstart', function (event) {
            startY = event.touches[0].clientY
            startTime = Date.now()
            startScroll = window.scrollY
          })

          window.addEventListener('touchmove', function (event) {
            const deltaY = startY - event.touches[0].clientY
            const currentTime = Date.now()
            const timeDiff = currentTime - startTime

            // Check if the touch movement is upward and the speed is above a certain threshold
            if (deltaY < 0 && startScroll > window.scrollY && Math.abs(deltaY) / timeDiff > 0.5) {
              // Fast scroll up detected, perform your desired action here
              show()
            }
          })

          window.addEventListener('touchend', function (event) {
            startY = 0
            startTime = 0
            startScroll = 0
          })
        }, 1000)
      }

      // Desktop mouseout
      window.addEventListener('mouseout', e => {
        if (!e.toElement && !e.relatedTarget) {
          show()
        }
      })

    },
  }

  const isMobile = () => {
    const screenWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const screenHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    return isMobile || ( screenWidth < 768 && screenHeight < 1024 )
  }

  const isDesktop = () => !isMobile()

  const AdvancedDisplayRules = {
    hide_if_converted: ({}, popup) => popup.getConversions() === 0,
    hide_if_closed: ({}, popup) => !Cookies.isClosed(popup.ID),
    show_up_to_x_times: ({ times = 1 }, popup) => parseInt(times) >
      popup.getViews(),
    show_after_x_page_views: ({ views }) => parseInt(views) <
      Cookies.getPageViews(),
    show_after_x_content_views: ({ views }, popup) => {
      views = parseInt(views)
      return views < Cookies.getContentViews(popup.ID)
    },
    show_after_x_potential_views: ({ views }, popup) => {
      views = parseInt(views)
      if (views < Cookies.getPotentialViews(popup.ID)) {
        return true
      }

      Cookies.addPotentialView(popup.ID)
      return false
    },
    show_to_new_or_returning: ({ visitor = 'all' }) => {
      switch (visitor) {
        default:
        case 'all':
          return true
        case 'new':
          return Cookies.getSessions() <= 1
        case 'returning':
          return Cookies.getSessions() > 1
      }
    },
    show_on_x_devices: ({ device }) => {
      switch (device) {
        default:
          return true
        case 'mobile':
          return isMobile()
        case 'desktop':
          return isDesktop()
      }
    },
  }

  const Popup = (popup) => ( {
    template: '',
    ...popup,
    id: `popup-${ popup.ID }`,
    _triggered: false,
    _open: false,
    _converted: false,
    _template: {},
    submitted: false,

    isOpen () {
      return this._open
    },

    isClosed () {
      return !this.isOpen()
    },

    isSubmitted () {
      return this.submitted
    },

    isConverted () {
      return this._converted
    },

    isViewed () {
      return this._viewed
    },

    wasTriggered () {
      return this._triggered
    },

    isNotification () {
      return notificationTemplates().includes(this.template)
    },

    isPopup () {
      return this.template.startsWith('popup_')
    },

    isBanner () {
      return this.template.startsWith('banner_')
    },

    isSidebar () {
      return this.template.startsWith('sidebar_')
    },

    isCloseable () {
      if (this.isNotification()) {
        return true
      }

      return !this.disable_closing || this.isConverted()
    },

    querySelector (selector = '') {
      return document.querySelector(`#${ this.id } ${ selector }`)
    },

    querySelectorAll (selector = '') {
      return document.querySelectorAll(`#${ this.id } ${ selector }`)
    },

    addEventListener (event, callback) {
      return this.querySelector().addEventListener(event, callback)
    },

    render () {
      try {
        let div = document.createElement('div')
        div.innerHTML = this._template.render(this)
        let popup = div.firstElementChild
        popup.setAttribute('tabindex', 0)

        return popup
      }
      catch (e) {
        maybeLog(e)
        return ''
      }
    },

    addToDom () {
      let el = document.getElementById(this.id)

      let rendered = this.render()

      if (el) {
        el.replaceWith(rendered)
      }
      else {
        document.body.append(rendered)
      }

      if (!isBuilderPreview()) {
        rendered.focus()
      }
    },

    removeFromDom () {
      document.getElementById(this.id)?.remove()
    },

    converted (content = '') {

      this._converted = true

      if (isBuilderPreview()) {
        return Promise.resolve()
      }

      Cookies.addPopupConversion(this.ID)

      if (content) {
        return apiPost(HollerBox.routes.conversion, {
          popup_id: this.ID,
          location: window.location.href,
          referer: document.referrer,
          content,
        })
      }
    },

    viewed () {

      // Don't double count views
      if (this.isViewed()) {
        return Promise.resolve()
      }

      this._viewed = true

      if (isBuilderPreview()) {
        return Promise.resolve()
      }

      Cookies.addPopupView(this.ID)

      return apiPost(HollerBox.routes.impression, {
        popup_id: this.ID,
        location: window.location.href,
        referer: document.referrer,
      })
    },

    submit (data) {

      return apiPost(`${ HollerBox.routes.submit }/${ this.ID }`, {
        location: window.location.href,
        referrer: document.referrer,
        ...data,
      }).then(r => {
        this.submitted = true
        this.converted(false)

        this.dispatchEvent('holler_submit', {
          data,
          response: r,
        })

        return r
      })
    },

    dispatchEvent (event, data = {}) {

      let customEvent = new CustomEvent(event, {
        detail: {
          popup: this,
          ...data,
        },
      })

      // also dispatch from element
      let el = this.querySelector()
      if (el) {
        el.dispatchEvent(customEvent)
      }

      document.dispatchEvent(customEvent)
    },

    getConversions () {
      return Cookies.getPopupConversions(this.ID)
    },

    getViews () {
      return Cookies.getPopupViews(this.ID)
    },

    cleanup () {
      try {
        this._template.cleanup(this)
      }
      catch (e) {
        maybeLog(e)
      }
    },

    /**
     * Special handler functions for popups with shortcode content
     *
     * @param when
     */
    handleShortcodeContent (when) {

      if (isBuilderPreview()) {
        return
      }

      switch (when) {
        case 'beforeAddToDom':
          // if the popup content has shortcodes, replace non rendered content with dom target

          if (this.has_shortcodes.in_content) {
            this.post_content = `<div id="post-content-for-${ this.ID }-goes-here"></div>`
          }

          if (this.has_shortcodes.in_success_message) {
            this.success_message = `<div id="success-message-for-${ this.ID }-goes-here"></div>`
          }
          break
        case 'afterAddToDom':
          // move the content from the container to the popup

          if (this.has_shortcodes.in_content) {
            let target = this.querySelector(`#post-content-for-${ this.ID }-goes-here`)
            let content = document.querySelector(`#holler-${ this.ID }-content`)
            if (target && content) {
              content.querySelectorAll('p:empty').forEach(el => el.remove())
              target.replaceWith(content)
            }
          }

          if (this.has_shortcodes.in_success_message) {
            let target = this.querySelector(`#success-message-for-${ this.ID }-goes-here`)
            let content = document.querySelector(`#holler-${ this.ID }-success-message`)
            if (target && content) {
              content.querySelectorAll('p:empty').forEach(el => el.remove())
              target.replaceWith(content)
            }
          }
          break
        case 'beforeRemoveFromDom':
          // move the content back to the container

          let container = document.querySelector('#hollerbox-popup-content')

          // handle shortcode based content
          if (this.has_shortcodes.in_content) {
            let content = document.querySelector(`#holler-${ this.ID }-content`)
            if (content && container) {
              container.append(content)
            }
          }

          if (this.has_shortcodes.in_success_message) {
            let content = document.querySelector(`#holler-${ this.ID }-success-message`)
            if (content && container) {
              container.append(content)
            }
          }
          break
      }
    },

    async open () {

      this._triggered = true
      this._open = true

      try {
        await this._template.beforeOpen(this)
      }
      catch (e) {
        maybeLog(e)
      }

      this.handleShortcodeContent('beforeAddToDom')

      this.addToDom()

      this.handleShortcodeContent('afterAddToDom')

      // Closing is disabled except for conversion
      if (this.isCloseable()) {

        // close button
        this.querySelectorAll('.holler-box-modal-close').forEach(el => {
          el.addEventListener('click', e => {
            this.close()
          })
        })

        // after 2 seconds, overlay also acts as escape
        setTimeout(() => {

          let overlay = this.querySelector('.holler-box-overlay')

          if (overlay) {
            this.querySelector('.holler-box-overlay').
              addEventListener('click', e => {
                this.close()
              })
          }
        }, 2000)

        this.querySelector().addEventListener('keyup', e => {
          if (e.key === 'Escape') {
            this.close()
          }
        })
      }

      try {
        this._template.onOpen(this)
      }
      catch (e) {
        maybeLog(e)
      }

      this.viewed()

      this.dispatchEvent('holler_open')
    },

    async close () {

      try {
        await this._template.onClose(this)
      }
      catch (e) {
        maybeLog(e)
      }

      this.handleShortcodeContent('beforeRemoveFromDom')

      this.removeFromDom()

      this._open = false

      try {
        await this._template.onClosed(this)
      }
      catch (e) {
        maybeLog(e)
      }

      if (isBuilderPreview()) {

        this.submitted = false
        this._converted = false

        if (!this.isOpen()) {
          setTimeout(() => this.open(), 1000)
        }

        this.dispatchEvent('holler_close')

        return
      }

      Cookies.addClosedPopup(this.ID)

      // We can track the closing of the popup
      if (HollerBox.is_user_logged_in) {
        apiPost(HollerBox.routes.closed, {
          popup_id: this.ID,
        }).catch(e => console.log(e))
      }

      this.dispatchEvent('holler_close')

      PopupStack.next()
    },

    /**
     * Checks if a popup that is already open is blocking to the given one
     *
     * @param other a popup that is already open
     * @return {boolean}
     */
    isBlocking (other) {

      // Don't show notifications that are in the same position
      if (other.isNotification() && this.isNotification() && other.position ===
        this.position) {
        return true
      }

      // Usually, notifications are not blocking
      return !this.isNotification()
    },

    maybeOpen () {

      // do not open if already opened
      if (this.isOpen() || this.wasTriggered()) {
        return false
      }

      // Loop through advanced frontend rules
      for (let rule in this.advanced_rules) {

        // Not enabled? Skip
        if (!this.advanced_rules[rule].enabled) {
          continue
        }

        // if the rule is frontend
        if (AdvancedDisplayRules.hasOwnProperty(rule)) {

          // If fails the condition, return and don't show
          if (!AdvancedDisplayRules[rule](this.advanced_rules[rule], this)) {
            return false
          }
        }

      }

      // If another popup is open, push top the stack
      if (HollerBox.active.some(p => p.isOpen() && p.isBlocking(this))) {
        PopupStack.add(this)
        return false
      }

      this.open()

      return true
    },

    setTemplate () {
      // Template is unregistered
      if (!PopupTemplates.hasOwnProperty(this.template)) {
        return false
      }

      // polyfill methods
      this._template = {
        render: () => '',
        onOpen: () => {},
        beforeOpen: () => {},
        onClose: () => {},
        onClosed: () => {},
        cleanup: () => {},
        ...PopupTemplates[this.template],
      }

      return true

    },

    init () {

      if (!this.setTemplate()) {
        return
      }

      Cookies.addContentView(this.ID)

      const show = () => this.maybeOpen()

      Object.keys(TriggerCallbacks).forEach(_t => {

        if (this.triggers[_t]?.enabled) {
          TriggerCallbacks[_t](this.triggers[_t], show, this)
        }
      })

      // Support for content upgrade legacy
      document.querySelectorAll(`.holler-upgrade.holler-show[data-id="${ this.ID }"]`).
        forEach(el => {
          el.addEventListener('click', e => {
            e.preventDefault()
            popup._triggered = false
            show()
          })
        })

      this.dispatchEvent('holler_init')
    },

  } )

  // we are on the site frontend
  if (HollerBox.is_frontend) {

    const initHollerBox = () => {

      if (HollerBox._initialized) {
        return
      }

      HollerBox._initialized = true

      HollerBox.active = HollerBox.active.map(p => Popup(p))
      HollerBox.active.sort(
        ({ menu_order: a = 10 }, { menu_order: b = 10 }) => a - b)

      HollerBox.active.forEach(popup => {
        popup.init()
      })

      Cookies.addPageView()
      Cookies.maybeAddSession()
    }

    window.addEventListener('load', () => {

      // Consent was given
      if (Cookies.hasAccepted()) {
        initHollerBox()
        return
      }

      // Add a click listener to wait for cookie consent
      document.addEventListener('click', () => {
        setTimeout(() => {
          if (Cookies.hasAccepted()) {
            initHollerBox()
          }
        }, 100)
      })

    })

  }

  /**
   * Function to check if we clicked inside an element with a particular class
   * name.
   *
   * @param {Object} e The event
   * @param {String} selector The class name to check against
   * @return {Boolean}
   */
  function clickedIn (e, selector) {
    var el = e.tagName ? e : e.srcElement || e.target

    if (el && el.matches(selector)) {
      return el
    }
    else {
      while (el = el.parentNode) {
        if (typeof el.matches !== 'undefined' && el.matches(selector)) {
          return el
        }
      }
    }

    return false
  }

  const isBuilderPreview = () => HollerBox.is_builder_preview

  let popup

  // We are in the builder preview
  if (isBuilderPreview()) {

    let home = new URL(HollerBox.home_url)

    window.addEventListener(
      'message',
      function (event) {
        if (event.origin === window.location.origin) {

          if (popup) {
            popup.cleanup()
          }

          const {
            cssOnly = false,
            suppressAnimations = true,
            overrides = {},
            popup: _popup = {},
          } = event.data

          // shallow copy
          popup = Popup(_popup)

          popup = {
            ...popup,
            ...overrides,
          }

          popup.setTemplate()

          if (cssOnly) {
            document.getElementById(
              'hollerbox-builder-styles').innerHTML = popup.css
            return
          }

          if (suppressAnimations) {
            document.body.classList.add('holler-suppress-animations')
          }
          else {
            document.body.classList.remove('holler-suppress-animations')
            document.body.style.marginTop = '0'
            document.body.style.marginBottom = '0'
          }

          // Remove any popups or possible modifications
          document.querySelectorAll('.holler-box').forEach(el => el.remove())
          document.getElementById(
            'hollerbox-builder-styles').innerHTML = popup.css

          popup.open()
        }
      },
      false,
    )

    window.addEventListener('load', () => {

      document.addEventListener('click', e => {
        let el = clickedIn(e, 'a')

        if (!el) {
          return
        }

        let url

        try {
          url = new URL(el.href)
        }
        catch (e) {
          maybeLog(e)
          return
        }

        if (url.searchParams.has('suppress_hollerbox')) {
          return
        }

        e.preventDefault()

        if (url.hostname !== home.hostname
          || url.pathname.match(/wp-admin/)
          || url.pathname.match(/wp-login\.php/)
        ) {
        }
        else {
          url.searchParams.append('suppress_hollerbox', 1)
          el.href = url

          el.click()
        }
      })

      // Click in to builder preview
      document.querySelectorAll('a').forEach(el => {

        const noClick = () => {
          el.classList.add('no-click')
          el.addEventListener('click', e => {
            e.preventDefault()
          })
        }

        let url

        try {
          url = new URL(el.href)
        }
        catch (e) {
          noClick()
          return
        }

        if (url.hostname !== home.hostname
          || url.pathname.match(/wp-admin/)
          || url.pathname.match(/wp-login\.php/)
        ) {
          noClick()
        }
        else {
          url.searchParams.append('suppress_hollerbox', 1)

          el.href = url
        }
      })

      // Prevent submitting forms to other pages
      document.querySelectorAll('form').forEach(el => {
        el.addEventListener('submit', e => {
          e.preventDefault()
          e.stopImmediatePropagation()
        })
      })
    })
  }

  /**
   * The current Popup
   *
   * @return {*}
   */
  const currentPopup = () => {

    // Builder Preview
    if (isBuilderPreview()) {
      return popup
    }

    // Editor
    if (HollerBox.hasOwnProperty('editor')) {

      if (HollerBox.editor.current_preview) {
        return Popup(HollerBox.editor.current_preview)
      }

      return Popup(HollerBox.editor.getPopup())
    }

    // Frontend
    return HollerBox.active.find(p => p.isOpen())
  }

  HollerBox.cookies = Cookies
  HollerBox.templates = PopupTemplates
  HollerBox._frontend = {
    CommonActions,
    SubmitActions,
    closeButton,
    credit,
    form,
    nameInput,
    emailInput,
    __content,
    overlay,
    submitButton,
    TriggerCallbacks,
    maybeLog,
    isBuilderPreview,
    makeURL,
  }

} )()
