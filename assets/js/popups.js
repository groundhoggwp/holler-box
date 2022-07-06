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
    sessions: 'holler-sessions',

    addClosedPopup (id) {
      let allClosed = this.getCookie(this.closedPopups, '').split(',')
      allClosed.push(id)
      this.setCookie(this.closedPopups, allClosed.join(), this.MONTH_IN_SECONDS)
    },

    isClosed (id) {
      let allClosed = this.getCookie(this.closedPopups, '').split(',').map(id => parseInt(id))
      return allClosed.includes(id)
    },

    addPopupCount (cookie, id) {
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

      this.setCookie(cookie, JSON.stringify(counts), this.DAY_IN_SECONDS)
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

    getPopupViews (id) {
      return this.getPopupCount(this.popupViews, id)
    },

    addPageView () {
      this.setCookie(this.pageViews, this.getPageViews() + 1, this.DAY_IN_SECONDS)
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
        }), Cookies.MONTH_IN_SECONDS)
      }
    },

    hasAccepted () {

      if (!HollerBox.settings.cookie_compliance) {
        return true
      }

      return this.getCookie(HollerBox.settings.cookie_name) === HollerBox.settings.cookie_value
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

  const overlay = () => {
    //language=HTML
    return `
        <div class="holler-box-overlay"></div>`
  }

  const closeButton = () => {
    //language=HTML
    return `
        <button class="holler-box-modal-close">&times;</button>`
  }

  const credit = () => {

    // Credit is disabled
    if (HollerBox.settings?.credit_disabled) {
      return ''
    }

    //language=HTML
    return `
        <div class="holler-box-credit"><a href="https://hollerwp.com/">⚡ by HollerBox</a></div>`
  }

  const createHTML = (HTML) => {
    let div = document.createElement('div')
    div.innerHTML = HTML
    return div.firstElementChild
  }

  const gdprInput = () => {

    const HTML = createHTML(HollerBox.settings.gdpr_text)

    //language=HTML
    return `<label class="holler-gdpr-consent"><input type="checkbox" name="gdpr_consent" value="yes" required>
        <span>${ HTML.innerHTML }</span></label>`
  }

  const nameInput = (placeholder = 'Your name') => {
    //language=HTML
    return `<input class="holler-box-input" type="text" name="name" placeholder="${ placeholder }" required>`
  }

  const emailInput = (placeholder = 'Your email') => {
    //language=HTML
    return `<input class="holler-box-input" type="email" name="email" placeholder="${ placeholder }" required>`
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
            <img src="${ avatar }" class="avatar" alt="">
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <rect width="107.6" height="145.6" x="319.1" y="76.6" fill="#fff" rx="5" ry="5"/>
                            <path fill="#f44336"
                                  d="M373 0a139 139 0 1 0 1 278 139 139 0 0 0-1-278zm22 187a16 16 0 0 1-32 0v-70h-11a16 16 0 0 1 0-32h27c8 0 16 8 16 16zm0 0"/>
                            <path fill="#ffa000" d="M299 427a85 85 0 1 1-171 0 85 85 0 0 1 171 0zm0 0"/>
                            <path fill="#ffc107"
                                  d="M380 320h-7A182 182 0 0 1 220 43h-7c-82 0-149 67-149 149v59c0 43-18 83-51 110a37 37 0 0 0 24 66h352a37 37 0 0 0 24-66c-13-12-24-26-33-41zm0 0"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>`
  }

  const SubmitActions = {
    close: (popup) => {
      popup.close()
    },
    redirect: (popup) => {

      let { redirect_url = '' } = popup

      let url = new URL(redirect_url)
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
      popup.closed = true
      popup.open()
    },
    notificationOpened: (popup) => {
      if (popup.closed) {
        document.getElementById(popup.id).addEventListener('click', e => {
          popup.close().then(() => {
            popup.closed = false
            popup.open()
          })
        })
      }
    },
    formSubmitted: (popup) => {

      const { id, after_submit = 'close' } = popup

      document.querySelector(`#${ id } form.holler-box-form`).addEventListener('submit', e => {
        e.preventDefault()

        let form = e.target
        let formData = new FormData(form)

        formData.append('location', window.location.href)
        formData.append('referer', document.referrer)

        form.querySelectorAll('input, button').forEach(el => el.disabled = true)
        form.querySelector('button').innerHTML = '<span class="holler-spinner"></span>'

        const submit = () => apiPost(`${ HollerBox.routes.submit }/${ popup.ID }`, Object.fromEntries(formData)).
          then((r) => {
            popup.submitted = true
            popup.converted(false)

            SubmitActions[after_submit](popup)

            document.dispatchEvent(new CustomEvent('holler_submit', {
              formData,
              form,
            }))
          }).
          catch(e => {
            alert('Something went wrong, please try again.')
          })

        setTimeout(() => submit(), 500)
      })
    },
    buttonClicked: (popup) => {

      const { id, button_link } = popup

      let button = document.querySelector(`#${ id } button.holler-box-button`)

      button.addEventListener('click', e => {
        e.preventDefault()
        button.innerHTML = '<span class="holler-spinner"></span>'
        popup.converted().then(() => {
          window.open(button_link, '_self')
        })
      })

    },
  }

  const isGDPREnabled = () => {
    return HollerBox.settings?.gdpr_enabled ?? false
  }

  const form = ({
    email = true,
    name = true,
    direction = 'vertical',
    email_placeholder = 'Name',
    name_placeholder = 'Email',
    button_text = 'Subscribe',
  }) => {

    //language=HTML
    return `
        <form class="holler-box-form ${ direction } ${ isGDPREnabled() ? 'has-gdpr' : '' }">
            <div class="fields">
                ${ name ? nameInput(name_placeholder) : '' }
                ${ email ? emailInput(email_placeholder) : '' }
                ${ direction === 'vertical' && isGDPREnabled() ? gdprInput() : '' }
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
                                <img src="${ avatar }" alt="">
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
            <div id="${ id }" class="holler-box holler-notification-box with-button">
                <div class="positioner ${ position }">
                    <div class="animation slide-in">
                        <div class="holler-box-modal ">
                            ${ closeButton() }
                            <div class="display-flex">
                                <img src="${ avatar }" alt="">
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

        if (submitted) {
          // language=HTML
          return `
              <div id="${ id }" class="holler-box holler-notification-box with-form">
                  <div class="positioner ${ position }">
                      <div class="holler-box-modal ${ position }">
                          ${ closeButton() }
                          <div class="display-flex">
                              <img src="${ avatar }" alt="">
                              ${ __content(success_message) }
                          </div>
                          ${ credit() }
                      </div>
                  </div>
              </div>`
        }

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-notification-box with-form">
                <div class="positioner ${ position }">
                    <div class="animation slide-in">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                <img src="${ avatar }" alt="">
                                ${ __content(post_content) }
                            </div>
                            ${ form({
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
          doAnminations = true,
        } = popup

        if (closed) {
          return notificationClosedTemplate({ id, position })
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
            input = `<textarea rows="1" name="message" placeholder="${ message_placeholder }"
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
              <div id="${ id }" class="holler-box holler-notification-box with-chat">
                  <div class="positioner ${ position }">
                      <div class="animation ${ doAnminations ? 'slide-in' : '' }">
                          <div class="holler-box-modal ">
                              ${ closeButton() }
                              ${ popup.messages.join('') }
                              <div class="close-chat-wrap">
                                  <button class="close-chat">&times; Close chat</button>
                              </div>
                              ${ credit() }
                          </div>
                      </div>
                  </div>
              </div>`
        }

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-notification-box with-chat">
                <div class="positioner ${ position }">
                    <div class="animation ${ doAnminations ? 'slide-in' : '' }">
                        <div class="holler-box-modal ">
                            ${ closeButton() }
                            ${ popup.messages.join('') }
                            <form class="holler-chat-form">
                                ${ input }
                                <button type="submit" class="send-message">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 404.644 404.644">
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
          document.querySelector(`#${ popup.id } .holler-box-input`).addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              form.dispatchEvent(new Event('submit'))
            }
          })
        }

        if (popup.state === 'done') {

          document.querySelector(`#${ popup.id } .close-chat`).addEventListener('click', () => {
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
                content: popup.email_prompt ?? '<p>What is your best email address?</p>',
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

              apiPost(`${ HollerBox.routes.submit }/${ popup.ID }`, popup.responses).
                then(r => {
                  popup.submitted = true
                  popup.converted(false)
                  document.dispatchEvent(new CustomEvent('holler_submit', this.responses))
                }).then(() => {

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

              }).catch(e => {})

              break
          }

          popup.doAnminations = false

          popup.open()
        })

      },
      onClosed: (popup) => {
        CommonActions.notificationClosed(popup)
        popup.doAnminations = true
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
        title = '',
        post_content = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        submitted = false,
        success_message = '',
        overlay_enabled = true,
      }) => {

        if (submitted) {
          // language=HTML
          return `
              <div id="${ id }" class="holler-box holler-popup holler-popup-standard">
                  ${ overlay_enabled ? overlay() : '' }
                  <div class="positioner ${ position }">
                      <div class="holler-box-modal">
                          ${ closeButton() }
                          ${ __content(success_message) }
                      </div>
                      ${ credit() }
                  </div>
              </div>`
        }

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-standard">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            ${ __content(post_content) }
                            ${ form({
                                direction: 'vertical',
                                button_text,
                                name_placeholder,
                                email_placeholder,
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
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        submitted = false,
        success_message = '',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-image-left">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                <div class="left image-width" style="background-image: url('${ image_src }')">
                                </div>
                                <div class="right">
                                    ${ submitted ? `${ __content(success_message) }` : `
              ${ __content(post_content) }
							${ form({
                                        direction: 'vertical',
                                        button_text,
                                        name_placeholder,
                                        email_placeholder,
                                    }) }` }
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
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        submitted = false,
        success_message = '',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-image-right">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                <div class="left">
                                    ${ submitted ? `${ __content(success_message) }` : `
              ${ __content(post_content) }
							${ form({
                                        direction: 'vertical',
                                        button_text,
                                        name_placeholder,
                                        email_placeholder,
                                    }) }` }
                                </div>
                                <div class="right image-width" style="background-image: url('${ image_src }')">
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
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-form-below">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="display-flex">
                                <div class="left">
                                    ${ __content(submitted ? success_message : post_content) }
                                </div>
                                <div class="right image-width" style="background-image: url('${ image_src }')">
                                </div>
                            </div>
                            ${ submitted ? '' : form({
                                direction: 'horizontal',
                                button_text,
                                name_placeholder,
                                email_placeholder,
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
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-progress-bar">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            <div class="holler-box-progress-bar-wrap">
                                <div class="holler-box-progress-bar">
                                    <div class="holler-box-progress-bar-fill ${ submitted ? 'filled' : '' }"></div>
                                </div>
                            </div>
                            <div class="display-flex">
                                <div class="left image-width" style="background-image: url('${ image_src }')">
                                </div>
                                <div class="right">
                                    ${ __content(submitted ? success_message : post_content) }
                                    ${ submitted ? '' : form({
                                        direction: 'vertical',
                                        button_text,
                                        name_placeholder,
                                        email_placeholder,
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
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-image-beside-text-top">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal">
                            ${ closeButton() }
                            ${ __content(submitted ? success_message : post_content) }
                            <div class="display-flex">
                                <div class="left image-width" style="background-image: url('${ image_src }')">
                                </div>
                                ${ submitted ? '' : form({
                                    direction: 'vertical',
                                    button_text,
                                    name_placeholder,
                                    email_placeholder,
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
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
        submitted = false,
        success_message = '',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup holler-popup-full-image-background">
                ${ overlay_enabled ? overlay() : '' }
                <div class="positioner ${ position }">
                    <div class="animation ${ animation }">
                        <div class="holler-box-modal" style="background-image: url('${ image_src }')">
                            ${ closeButton() }
                            ${ __content(submitted ? success_message : post_content) }
                            ${ submitted ? '' : form({
                                direction: 'vertical',
                                button_text,
                                name_placeholder,
                                email_placeholder,
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
        p.maybeOpen()
      }
    },

  }

  const TriggerCallbacks = {
    on_page_load: ({ delay = 1 }, show) => {
      setTimeout(show, delay * 1000)
    },
    element_click: ({ selector = '', trigger_multiple = 'once' }, show, popup) => {
      document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('click', () => {

          if (trigger_multiple === 'multiple') {
            popup._triggered = false
          }

          show()
        })
      })
    },
    scroll_detection: ({ depth = 50 }, show) => {
      document.addEventListener('scroll', () => {
        if (getScrollPercent() >= depth) {
          show()
        }
      })
    },
    exit_intent: (popup, show) => {
      window.addEventListener('mouseout', e => {
        if (!e.toElement && !e.relatedTarget) {
          show()
        }
      })

    },
  }

  const AdvancedDisplayRules = {
    hide_if_converted: ({}, popup) => popup.getConversions() === 0,
    hide_if_closed: ({}, popup) => !Cookies.isClosed(popup.ID),
    show_up_to_x_times: ({ times = 1 }, popup) => parseInt(times) > popup.getViews(),
    show_after_x_page_views: ({ views }) => parseInt(views) < Cookies.getPageViews(),
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
          return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) <= 480
        case 'desktop':
          return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 480
      }
    },
  }

  const Popup = (popup) => ( {

    ...popup,
    id: `popup-${ popup.ID }`,
    _triggered: false,
    _open: false,

    isOpen () {
      return this._open
    },

    wasTriggered () {
      return this._triggered
    },

    querySelector (selector = '') {
      return document.querySelector(`#${ this.id } ${ selector }`)
    },

    querySelectorAll (selector = '') {
      return document.querySelectorAll(`#${ this.id } ${ selector }`)
    },

    render () {
      try {
        let div = document.createElement('div')
        div.innerHTML = PopupTemplates[this.template].render(this)
        return div.firstElementChild
      }
      catch (e) {
        return ''
      }
    },

    addToDom () {
      let el = document.getElementById(this.id)

      if (el) {
        el.replaceWith(this.render())
      }
      else {
        document.body.append(this.render())
      }
    },

    removeFromDom () {
      document.getElementById(this.id)?.remove()
    },

    converted (check = true) {

      if (isBuilderPreview()) {
        return
      }

      Cookies.addPopupConversion(this.ID)

      if (check) {
        return apiPost(HollerBox.routes.conversion, {
          popup_id: this.ID,
          location: window.location.href,
          referer: document.referrer,
        })
      }
    },

    viewed () {

      if (isBuilderPreview()) {
        return
      }

      Cookies.addPopupView(this.ID)

      return apiPost(HollerBox.routes.impression, {
        popup_id: this.ID,
        location: window.location.href,
        referer: document.referrer,
      })
    },

    getConversions () {
      return Cookies.getPopupConversions(this.ID)
    },

    getViews () {
      return Cookies.getPopupViews(this.ID)
    },

    cleanup () {
      try {
        PopupTemplates[this.template].cleanup(this)
      }
      catch (e) {
      }
    },

    async open () {

      try {
        await PopupTemplates[this.template].beforeOpen(this)
      }
      catch (e) {
      }

      this.addToDom()

      this._triggered = true
      this._open = true

      document.querySelectorAll(`#${ this.id } .holler-box-modal-close`).forEach(el => {
        el.addEventListener('click', e => {
          this.close()
        })
      })

      try {
        PopupTemplates[this.template].onOpen(this)
      }
      catch (e) {
      }

      this.viewed()
    },

    async close () {

      try {
        await PopupTemplates[this.template].onClose(this)
      }
      catch (e) {
      }

      this.removeFromDom()
      this._open = false

      try {
        await PopupTemplates[this.template].onClosed(this)
      }
      catch (e) {
      }

      if (isBuilderPreview()) {

        this.submitted = false

        if (!this.isOpen()) {
          setTimeout(() => this.open(), 1000)
        }

        return
      }

      Cookies.addClosedPopup(this.ID)

      PopupStack.next()
    },

    maybeOpen () {

      // do not open if already opened
      if (this.isOpen() || this.wasTriggered()) {
        return
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
            return
          }
        }

      }

      // If another popup is open, push top the stack
      if (HollerBox.active.some(p => p.isOpen())) {
        PopupStack.add(this)
        return
      }

      this.open()
    },

    init () {

      const show = () => this.maybeOpen()

      Object.keys(TriggerCallbacks).forEach(_t => {

        if (this.triggers[_t]?.enabled) {
          TriggerCallbacks[_t](this.triggers[_t], show, this)
        }
      })
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

  // We are in the builder preview
  if (isBuilderPreview()) {

    let home = new URL(HollerBox.home_url)
    let popup

    window.addEventListener(
      'message',
      function (event) {
        if (event.origin === window.location.origin) {

          if (popup) {
            popup.cleanup()
          }

          // shallow copy
          popup = Popup(event.data.popup)

          if (event.data.suppressAnimations) {
            document.body.classList.add('holler-suppress-animations')
          }
          else {
            document.body.classList.remove('holler-suppress-animations')
            document.body.style.marginTop = '0'
            document.body.style.marginBottom = '0'
          }

          // Remove any popups or possible modifications
          document.querySelectorAll('.holler-box').forEach(el => el.remove())
          document.getElementById('hollerbox-builder-styles').innerHTML = popup.css

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

  HollerBox.templates = PopupTemplates
  HollerBox._frontend = {
    CommonActions,
    closeButton,
    credit,
    form,
    nameInput,
    emailInput,
    __content,
    submitButton,
    TriggerCallbacks,
  }

} )()
