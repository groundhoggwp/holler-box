(() => {

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

  const nameInput = (placeholder) => {
    //language=HTML
    return `<input class="holler-box-input" type="text" name="name" placeholder="${placeholder}" required>`
  }

  const emailInput = (placeholder) => {
    //language=HTML
    return `<input class="holler-box-input" type="email" name="email" placeholder="${placeholder}" required>`
  }

  const submitButton = (text) => {
    //language=HTML
    return `
		<button type="submit" class="holler-box-button">${text}</button>`
  }

  const __title = (title) => {
    //language=HTML
    return `
		<div class="holler-box-modal-title">${title}</div>
    `
  }

  const __content = (content) => {
    //language=HTML
    return `
		<div class="holler-box-modal-content">
			${content}
		</div>
    `
  }

  /**
   * Handler for submitting a form
   *
   * @param popup
   */
  const handleFormSubmit = (popup) => {

    const { id, after_submit = 'close' } = popup

    document.querySelector(`#${id} form.holler-box-form`).addEventListener('submit', e => {
      e.preventDefault()

      let form = e.target
      let formData = new FormData(form)

      apiPost(`${HollerBox.routes.submit}/${popup.ID}`, Object.fromEntries(formData)).then(r => {
        popup.submitted = true
        SubmitActions[after_submit](popup)
      }).catch(e => {

      })
    })
  }

  /**
   * Handle openening and closing of notification popups
   *
   * @param popup
   */
  const handleNotificationOnClose = (popup) => {

    popup.closed = true

    addPopupToBody(popup)

    document.getElementById(popup.id).addEventListener('click', e => {
      popup.closed = false
      addPopupToBody(popup)
    })
  }

  const notificationClosedTemplate = ({ id, position }) => {
    // language=HTML
    return `
		<div id="${id}" class="holler-box holler-notification-box">
			<div class="holler-box-modal notification-closed ${position}">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
					<rect width="107.6" height="145.6" x="319.1" y="76.6" fill="#fff" rx="5" ry="5"/>
					<path fill="#f44336"
					      d="M373 0a139 139 0 1 0 1 278 139 139 0 0 0-1-278zm22 187a16 16 0 0 1-32 0v-70h-11a16 16 0 0 1 0-32h27c8 0 16 8 16 16zm0 0"/>
					<path fill="#ffa000" d="M299 427a85 85 0 1 1-171 0 85 85 0 0 1 171 0zm0 0"/>
					<path fill="#ffc107"
					      d="M380 320h-7A182 182 0 0 1 220 43h-7c-82 0-149 67-149 149v59c0 43-18 83-51 110a37 37 0 0 0 24 66h352a37 37 0 0 0 24-66c-13-12-24-26-33-41zm0 0"/>
				</svg>
			</div>
		</div>`
  }

  const SubmitActions = {
    close: (popup) => {
      closePopup(popup)
    },
    redirect: ({ redirect_url = '' }) => {
      window.open(redirect_url, '_self')
    },
    message: (popup) => {
      addPopupToBody(popup)
    },
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
		<form class="holler-box-form ${direction}">
			${name ? nameInput(name_placeholder) : ''}
			${email ? emailInput(email_placeholder) : ''}
			${submitButton(button_text)}
		</form>`
  }

  const Types = {
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
			<div id="${id}" class="holler-box holler-notification-box">
				<div class="holler-box-modal ${position}">
					${closeButton()}
					<div class="display-flex">
						<img src="${avatar}" alt="">
						<div class="holler-box-modal-content">
							${post_content}
						</div>
					</div>
				</div>
			</div>`
      },
      onClose: handleNotificationOnClose,
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
			<div id="${id}" class="holler-box holler-notification-box with-button">
				<div class="holler-box-modal ${position}">
					${closeButton()}
					<div class="display-flex">
						<img src="${avatar}" alt="">
						<div class="holler-box-modal-content">
							${post_content}
						</div>
					</div>
					<div class="holler-button-cta">
						${submitButton(button_text)}
					</div>
				</div>
			</div>`
      },
      onClose: handleNotificationOnClose,
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
        submitted = false
      }) => {

        if (closed) {
          return notificationClosedTemplate({ id, position })
        }

        if (submitted) {
          // language=HTML
          return `
			  <div id="${id}" class="holler-box holler-notification-box with-form">
				  <div class="holler-box-modal ${position}">
					  ${closeButton()}
					  <div class="display-flex">
						  <img src="${avatar}" alt="">
						  <div class="holler-box-modal-content">
							  ${success_message}
						  </div>
					  </div>
				  </div>
			  </div>`
        }

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-notification-box with-form">
				<div class="holler-box-modal ${position}">
					${closeButton()}
					<div class="display-flex">
						<img src="${avatar}" alt="">
						<div class="holler-box-modal-content">
							${post_content}
						</div>
					</div>
					${form({
						direction: 'horizontal',
						name: false,
						button_text,
						email_placeholder,
					})}
				</div>
			</div>`
      },
      onOpen: handleFormSubmit,
      onClose: handleNotificationOnClose

    },
    popup_custom: {
      render: ({
        id = '',
        position = 'center-center',
        post_content = '',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-popup-custom">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					${__content(post_content)}
				</div>
			</div>`
      },
    },
    popup_standard: {
      render: ({
        id = '',
        position = 'center-center',
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
			  <div id="${id}" class="holler-box holler-popup-standard">
				  ${ overlay_enabled ? overlay() : ''}
				  <div class="holler-box-modal ${position}">
					  ${closeButton()}
					  ${__title(title)}
					  ${__content(success_message)}
				  </div>
			  </div>`
        }

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-popup-standard">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					${__title(title)}
					${__content(post_content)}
					${form({
						direction: 'vertical',
						button_text,
						name_placeholder,
						email_placeholder,
					})}
				</div>
			</div>`
      },
      onOpen: handleFormSubmit
    },
    popup_image_left: {
      render: ({
        id = '',
        position = 'center-center',
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
			<div id="${id}" class="holler-box holler-popup-image-left">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					<div class="display-flex">
						<div class="left">
							<img src="${image_src}" alt="" title=""/>
						</div>
						<div class="right">
							${__title(title)}
							${submitted ? `${__content(success_message)}` : `
              ${__content(post_content)}
							${form({
								direction: 'vertical',
								button_text,
								name_placeholder,
								email_placeholder,
							})}`}
						</div>
					</div>
				</div>
      </div>`
      },
      onOpen: handleFormSubmit,
      onClose: (popup) => {
        showPopup()
      }
    },
    popup_form_below: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        post_content = '',
        image_src = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-popup-form-below">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					<div class="display-flex">
						<div class="left">
							${__title(title)}
							${__content(post_content)}
						</div>
						<div class="right">
							<img src="${image_src}" alt="" title=""/>
						</div>
					</div>
					${form({
						direction: 'horizontal',
						button_text,
						name_placeholder,
						email_placeholder,
					})}
				</div>
			</div>`
      },
    },
    popup_progress_bar: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        post_content = '',
        image_src = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-popup-progress-bar">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					<div class="holler-box-progress-bar-wrap">
						<div class="holler-box-progress-bar">
							<div class="holler-box-progress-bar-fill"></div>
						</div>
					</div>
					<div class="display-flex">
						<div class="left">
							<img src="${image_src}" alt="" title=""/>
						</div>
						<div class="right">
							${__title(title)}
							${__content(post_content)}
							${form({
								direction: 'vertical',
								button_text,
								name_placeholder,
								email_placeholder,
							})}
						</div>
					</div>
				</div>
			</div>`
      },
    },
    popup_image_beside_text_top: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        post_content = '',
        image_src = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-popup-image-beside-text-top">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					${__title(title)}
					${__content(post_content)}
					<div class="display-flex">
						<div class="left">
							<img src="${image_src}" alt="" title=""/>
						</div>
						<div class="right">
							${form({
								direction: 'vertical',
								button_text,
								name_placeholder,
								email_placeholder,
							})}
						</div>
					</div>
				</div>
			</div>`
      },
    },
    popup_full_image_background: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        post_content = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-popup-full-image-background">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					${__title(title)}
					${__content(post_content)}
					${form({
						direction: 'vertical',
						button_text,
						name_placeholder,
						email_placeholder,
					})}
				</div>
			</div>`
      },
    },
    popup_text_top_with_color_background: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        post_content = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
        overlay_enabled = true,
      }) => {

        // language=HTML
        return `
			<div id="${id}" class="holler-box holler-popup-text-with-color-background">
				${ overlay_enabled ? overlay() : ''}
				<div class="holler-box-modal ${position}">
					${closeButton()}
					<div class="holler-box-modal-title-wrap">
						${__title(title)}
						<div class="holler-box-modal-content">
							${post_content}
						</div>
					</div>
					${form({
						direction: 'vertical',
						button_text,
						name_placeholder,
						email_placeholder,
					})}
				</div>
			</div>`
      },
    },
    faux_chat: {},
    top_banner: {},
    footer_bar: {},
    popout: {},
    fomo: {},
  }

  HollerBox.types = Types

  function getScrollPercent () {
    var h = document.documentElement,
      b = document.body,
      st = 'scrollTop',
      sh = 'scrollHeight'
    return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100
  }

  /**
   * Create the popup Element
   *
   * @param popup
   * @return {Element}
   */
  const renderPopup = (popup) => {
    try {
      let div = document.createElement('div')
      div.innerHTML = Types[popup.template].render(popup)
      return div.firstElementChild
    } catch (e) {}
  }

  /**
   * Close wrapper for the popup
   *
   * @param popup
   */
  const closePopup = (popup) => {

    try {
      Types[popup.template].onClose(popup)
    } catch (e) {
      removePopupFromBody(popup)
      popup.triggered = false
    }

  }

  /**
   * Remove the popup from the DOM
   *
   * @param popup
   */
  const removePopupFromBody = (popup) => {
    document.getElementById(popup.id).remove()
  }

  /**
   * Add the popup to the DOM
   *
   * @param popup
   */
  const addPopupToBody = (popup) => {

    let el = document.getElementById(popup.id)

    if (el) {
      el.replaceWith(renderPopup(popup))
    } else {
      document.body.append(renderPopup(popup))
    }

    popup.triggered = true

    const { id } = popup

    document.querySelectorAll(`#${id} .holler-box-modal-close`).forEach(el => {
      el.addEventListener('click', e => {
        closePopup(popup)
      })
    })

    try {
      Types[popup.template].onOpen(popup)
    } catch (e) {

    }
  }

  /**
   * Show the popup if not yet triggered
   *
   * @param popup
   */
  const showPopup = (popup) => {
    // don't show if it's already open
    if (popup.triggered) {
      return
    }

    addPopupToBody(popup)
  }

  const TriggerCallbacks = {
    on_page_load: ({ delay = 1 }, show) => {
      setTimeout(show, delay * 1000)
    },
    element_click: ({ selector = '' }, show) => {
      document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('click', show)
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

  if (HollerBox.is_frontend) {

    HollerBox.active.forEach(popup => {

      const { triggers = {} } = popup

      Object.keys(TriggerCallbacks).forEach(_t => {

        popup.triggered = false
        popup.id = `popup-${popup.ID}`

        if (triggers[_t].enabled) {
          TriggerCallbacks[_t](triggers[_t], () => {
            showPopup(popup)
          })
        }
      })

    })

  }

})()
