(($) => {

  const {
    input,
    select,
    textarea,
    toggle,
    icons,
    uuid,
    tinymceElement,
    improveTinyMCE,
    dangerConfirmationModal,
    modal,
    clickedIn,
    moreMenu,
    dialog,
    loadingDots,
    confirmationModal,
  } = HollerBox.elements
  const { sprintf, __, _x, _n } = wp.i18n

  improveTinyMCE()

  function ApiError (message) {
    this.name = 'ApiError'
    this.message = message
  }

  ApiError.prototype = Error.prototype

  /**
   * Fetch stuff from the API
   * @param route
   * @param params
   * @param opts
   */
  async function apiGet (route, params = {}, opts = {}) {

    const response = await fetch(route + '?' + $.param(params), {
      headers: {
        'X-WP-Nonce': HollerBox.nonces._wprest,
      },
      ...opts
    })

    let json = await response.json()

    if (!response.ok) {
      console.log(json)
      throw new ApiError(json.message)
    }

    return json
  }

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

  /**
   * Post data
   *
   * @param url
   * @param data
   * @param opts
   * @returns {Promise<any>}
   */
  async function apiPatch (url = '', data = {}, opts = {}) {
    const response = await fetch(url, {
      ...opts,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': HollerBox.nonces._wprest,
      },
      body: JSON.stringify(data)
    })

    let json = await response.json()

    if (!response.ok) {
      console.log(json)
      throw new ApiError(json.message)
    }

    return json
  }

  /**
   * Post data
   *
   * @param url
   * @param data
   * @param opts
   * @returns {Promise<any>}
   */
  async function apiDelete (url = '', data = {}, opts = {}) {
    const response = await fetch(url, {
      ...opts,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': HollerBox.nonces._wprest,
      },
      body: JSON.stringify(data)
    })

    let json = await response.json()

    if (!response.ok) {
      console.log(json)
      throw new ApiError(json.message)
    }

    return json
  }

  /**
   * Post data
   *
   * @param data
   * @param opts
   * @returns {Promise<any>}
   */
  async function adminAjax (data = {}, opts = {}) {

    if (!(data instanceof FormData)) {
      const fData = new FormData()

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          fData.append(key, data[key])
        }
      }

      data = fData
    }

    const response = await fetch(ajaxurl, {
      method: 'POST',
      credentials: 'same-origin',
      body: data,
      ...opts,
    })

    return response.json()
  }

  const singleControl = ({
    label = '',
    control = '',
  }) => {
    //language=HTML
    return `
		<div class="control">
			<label>${label}</label>
			${control}
		</div>`
  }

  const controlGroup = (control, popup) => {
    //language=HTML
    return `
		<div class="control-group">
			<div class="control-group-header">
				<div class="control-group-name">${control.name}</div>
				<button class="toggle-indicator"></button>
			</div>
			<div class="controls">
				${control.render(popup)}
			</div>
		</div>`
  }

  const selectIntegrationModal = ({
    onSelect = () => {}
  }) => {
    modal({
      dialogClasses: 'select-integration has-header',
      //language=HTML
      content: `
		  <div class="holler-header">
			  <h3>${__('Select an integration')}</h3>
			  <button class="holler-button secondary text icon holler-modal-button-close"><span
				  class="dashicons dashicons-no-alt"></span>
			  </button>
		  </div>
		  <div id="integrations-here"></div>`,
      width: 800,
      onOpen: ({ close }) => {

        $('#integrations-here').html(Integrations.map(i => {
          //language=HTML
          return `
			  <div class="integration" data-integration="${i.id}">
				  <div class="icon">
					  ${i.icon}
				  </div>
				  <p class="integration-name">${i.name}</p>
			  </div>`
        }).join(''))

        $('.integration').on('click', e => {
          onSelect(e.currentTarget.dataset.integration)
          close()
        })

      }
    })
  }

  const selectTemplateModal = ({
    onSelect = (t) => {}
  }) => {

    modal({
      dialogClasses: 'select-template no-padding',
      // language=HTML
      content: `
		  <div class="holler-header is-sticky">
			  <h3>${__('Select Template')}</h3>
			  <button class="holler-button secondary text icon holler-modal-button-close"><span
				  class="dashicons dashicons-no-alt"></span>
			  </button>
		  </div>
		  <div id="templates"></div>`,
      width: 1200,
      onOpen: ({ close }) => {

        $('#templates').html(Templates.map(t => {
          //language=HTML
          return `
			  <div class="template" data-template="${t.id}">
				  <div class="preview-wrap">
					  <div class="preview">
						  ${HollerBox.types[t.id].render({
							  ...t.defaults,
						  })}
					  </div>
				  </div>
				  <p class="template-name">${t.name ? t.name : t.id}</p>
			  </div>`
        }).join(''))

        $('.template').on('click', e => {
          onSelect(e.currentTarget.dataset.template)
          close()
        })

      }
    })

  }

  const Integrations = [
    {
      id: 'email',
      icon: icons.email,
      name: __('Send Email', 'holler-box'),
      _name: ({ to = '' }) => {

        if (!to) {
          return __('Send Email', 'holler-box')
        }

        return sprintf(__('Send email to %s', 'holler-box'), to)
      },
      edit: ({ to, cc, bcc, from, content, reply_to, subject }) => {
        // language=HTML
        return ``
      },
      defaults: {
        to: 'subscriber',
        cc: '',
        bcc: '',
        from: '',
        reply_to: '',
        subject: '',
        content: ''
      }
    },
    {
      id: 'groundhogg',
      name: __('Groundhogg', 'holler-box'),
      icon: icons.groundhogg,
      edit: ({ tags }) => {
        // language=HTML
        return ``
      },
    },
    {
      id: 'webhook',
      name: 'Webhook',
      icon: icons.webhook,
      edit: ({ url, method, payload }) => {
        // language=HTML
        return `
			<div class="holler-rows-and-columns">
				<div class="row">
					<div class="col">
						<label>${__('Webhook URL')}</label>
						<div class="holler-input-group">
							${select({
								id: 'method'
							}, {
								post: 'POST',
								get: 'GET',
								patch: 'PATCH',
								put: 'PUT',
								delete: 'DELETE',
							}, method)}
							${input({
								id: 'url',
								type: 'url',
								className: 'full-width',
								value: url
							})}
							<button class="holler-button secondary">${__('Test')}</button>
						</div>
					</div>
				</div>
				<div class="row">
					<div class="col">
						<label for="payload">${__('Request Type')}</label>
						<div>
							${select({
								id: 'payload'
							}, {
								json: 'JSON',
								form: 'Form Data',
							}, payload)}
						</div>
					</div>
				</div>
			</div>
        `
      },
    }
  ]

  const getIntegration = (type) => {
    return Integrations.find(i => i.id === type)
  }

  const renderIntegration = (id, { type, ...rest }) => {

    let integration = getIntegration(type)

    if (!integration) {
      return `
		<div class="integration" data-id="${id}">
			<div class="name">${__('Error')}</div>
			<button class="holler-button secondary text icon integration-more" data-id="${id}">${icons.verticalDots}
			</button>
		</div>`
    }

    let name

    try {
      name = integration._name(rest)
    } catch (e) {
      name = integration.name
    }

    // language=HTML
    return `
		<div class="integration" data-id="${id}">
			<div class="icon">${integration.icon}</div>
			<div class="name">${name}</div>
			<button class="holler-button secondary text icon integration-more" data-id="${id}">${icons.verticalDots}
			</button>
		</div>`
  }

  const editIntegrationUI = (integration) => {
    // language=HTML
    return `
		<div class="holler-header">
			<h3 style="font-weight: 400">
				${sprintf(__('Edit %s Integration', 'HollerBox'), `<b>${getIntegration(integration.type).name}</b>`)}</h3>
			<button class="holler-button secondary text icon holler-modal-button-close"><span
				class="dashicons dashicons-no-alt"></span></button>
		</div>
		${getIntegration(integration.type).edit(integration)}
		<div class="display-flex flex-end gap-10" style="margin-top: 20px">
			<button class="holler-button danger text">${__('Cancel')}</button>
			<button class="holler-button primary">${__('Save Changes')}</button>
		</div>`
  }

  const Controls = {

    integration: {
      name: __('Integration', 'holler-box'),
      render: ({
        integrations = []
      }) => {

        return [
          `<div id="integrations"></div>`,
          `<button class="holler-button secondary" id="add-integration">${__('Add Integration')}</button>`
        ].join('')

      },
      onMount: ({ integrations = [] }, updateSetting) => {

        $('#add-integration').on('click', e => {
          selectIntegrationModal({
            onSelect: (i) => {

              addIntegration({
                type: i,
                ...getIntegration(i).defaults
              })
            }
          })
        })

        const editIntegrationModal = () => {
          modal({
            content: `<div id="edit-here"></div>`,
            dialogClasses: 'has-header',
            width: 500,
            onOpen: ({ close, setContent }) => {

              setContent(editIntegrationUI(editingIntegration))
            }
          })
        }

        const mount = () => {
          $('#integrations').html(integrations.map((i, id) => renderIntegration(id, i)).join(''))

          $('.integration').on('click', e => {

            editingIntegrationId = parseInt(e.currentTarget.dataset.id)
            editingIntegration = integrations[editingIntegrationId]

            if (clickedIn(e, '.integration-more')) {
              moreMenu($(e.currentTarget).find('.integration-more'), {
                items: [
                  {
                    key: 'delete',
                    text: `<span class="holler-text danger">${__('Delete')}</span>`
                  }
                ],
                onSelect: k => {
                  switch (k) {
                    case 'delete':
                      dangerConfirmationModal({
                        alert: `<p>${__('Are you sure you want to delete this integration?')}</p>`,
                        confirmText: __('Delete'),
                        onConfirm: () => {
                          deleteIntegration()
                        }
                      })
                      break
                  }
                }
              })
              return
            }

            editIntegrationModal()
          })
        }

        let editingIntegration, editingIntegrationId

        const addIntegration = (integration) => {
          integrations.push(integration)

          updateSetting({
            integrations
          })

          editingIntegrationId = integrations.length - 1
          editingIntegration = integrations[editingIntegrationId]

          editIntegrationModal()

          mount()

        }

        const deleteIntegration = () => {
          integrations.splice(editingIntegrationId, 1)

          updateSetting({
            integrations
          })

          mount()
        }

        const updateIntegration = (newSettings) => {
          integrations[editingIntegrationId] = {
            ...integrations[editingIntegrationId],
            ...newSettings
          }

          updateSetting({
            integrations
          })

          mount()
        }

        mount()

      }
    },
    template: {
      name: __('Template', 'holler-box'),
      render: ({
        template = 'popup_standard',
      }) => {
        return [
          `<button class="holler-button secondary" id="change-template">${__('Change Template')}</button>`
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#change-template').on('click', e => {
          selectTemplateModal({
            onSelect: (template) => {
              updateSetting({
                template
              }, true)
            }
          })
        })
      },
    },
    submit: {
      name: __('After Submit', 'holler-box'),
      render: ({
        after_submit = 'message',
        redirect_url = '',
        success_message = ''
      }) => {
        let controls = [
          singleControl({
            label: __('What happens when the form is submitted?'),
            control: select({
              id: 'after-submit',
            }, {
              message: __('Show a message'),
              redirect: __('Redirect to page'),
              close: __('Close the popup'),
            }, after_submit),
          }),
          `<div id="dependent-controls"></div>`
        ]

        return controls.join('')
      },
      onMount: ({ after_submit, redirect_url = '', success_message = '' }, updateSetting) => {

        const mountDependentControls = () => {

          const setUI = (ui) => {
            $('#dependent-controls').html(ui)
          }

          switch (after_submit) {
            case 'message':
              setUI(textarea({
                id: 'success-message',
                value: success_message
              }))

              wp.editor.remove('success-message')
              tinymceElement('success-message', {}, (success_message) => {
                updateSetting({
                  success_message
                })
              })

              break

            case 'redirect':
              setUI(input({
                type: 'url',
                id: 'redirect_url',
                value: redirect_url
              }))
              break
            default:
            case 'close':
              setUI('')
              break
          }
        }

        $('#after-submit').on('change', e => {

          after_submit = e.target.value
          updateSetting({
            after_submit,
          })

          mountDependentControls()
        })

        mountDependentControls()
      },
    },
    position: {
      name: __('Position', 'holler-box'),
      render: ({
        position = 'center-center',
      }) => {
        return [
          singleControl({
            label: __('Position'),
            control: select({
              id: 'position',
            }, {
              'top-left': __('Top Left'),
              'top-center': __('Top Center'),
              'top-right': __('Top Right'),
              'center-left': __('Center Left'),
              'center-center': __('Center Center'),
              'center-right': __('Center Right'),
              'bottom-left': __('Bottom Left'),
              'bottom-center': __('Bottom Center'),
              'bottom-right': __('Bottom Right'),
            }, position),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#position').on('change', e => {
          updateSetting({
            position: e.target.value,
          })
        })
      },
    },
    title: {
      name: __('Title', 'holler-box'),
      render: ({
        title = 'Subscribe now!',
      }) => {
        return [
          singleControl({
            label: __('Text'),
            control: input({
              id: 'title-text',
              value: title,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#title-text').on('change input', e => {
          updateSetting({
            title: e.target.value,
          })
        })
      },
    },
    text: {
      name: __('Text', 'holler-box'),
      render: ({
        text = 'Enter your email below. We\'ll never spam you.',
      }) => {
        return [
          textarea({
            id: 'text-text',
            value: text,
            className: 'full-width',
            rows: 3,
          })
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#text-text').on('change input', e => {
          updateSetting({
            text: e.target.value,
          })
        })
      },
    },
    content: {
      name: __('Content', 'holler-box'),
      render: ({
        post_content = '',
      }) => {
        return [
          textarea({
            id: 'text-content',
            value: post_content,
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {

        wp.editor.remove('text-content')

        tinymceElement('text-content', {}, (post_content) => {
          updateSetting({
            post_content
          })
        })
      },
    },
    button: {
      name: __('Button', 'holler-box'),
      render: ({
        button_text = 'Subscribe',
        button_color = '',
        button_text_color = '',
      }) => {
        return [
          singleControl({
            label: __('Button Text'),
            control: input({
              id: 'button-text',
              value: button_text,
            }),
          }),
          singleControl({
            label: __('Button Color'),
            control: input({
              id: 'button-color',
              value: button_color,
            }),
          }),
          singleControl({
            label: __('Text Color'),
            control: input({
              id: 'button-text-color',
              value: button_text_color,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#button-text').on('change input', e => {
          updateSetting({
            button_text: e.target.value,
          })
        })

        $('#button-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              button_color: ui.color.toString(),
            })
          },
        })

        $('#button-text-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              button_text_color: ui.color.toString(),
            })
          },
        })
      },
      css: ({
        id,
        button_color = '',
        button_text_color = '',
      }) => {

        // language=CSS
        return `
            #${id} .holler-box-button {
                background-color: ${button_color};
                color: ${button_text_color};
            }
        `
      },
    },
    link_button: {
      name: __('Button', 'holler-box'),
      render: ({
        button_text = 'Get Started',
        button_link = '',
        button_color = '',
        button_text_color = '',
      }) => {
        return [
          singleControl({
            label: __('Button Text'),
            control: input({
              id: 'button-text',
              name: 'button_text',
              value: button_text,
            }),
          }),
          singleControl({
            label: __('Button Link'),
            control: input({
              id: 'button-link',
              type: 'url',
              name: 'button_link',
              value: button_link,
            }),
          }),
          singleControl({
            label: __('Button Color'),
            control: input({
              id: 'button-color',
              value: button_color,
            }),
          }),
          singleControl({
            label: __('Text Color'),
            control: input({
              id: 'button-text-color',
              value: button_text_color,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#button-text, #button-link').on('change input', e => {
          updateSetting({
            [e.target.name]: e.target.value,
          })
        })

        $('#button-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              button_color: ui.color.toString(),
            })
          },
        })

        $('#button-text-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              button_text_color: ui.color.toString(),
            })
          },
        })
      },
      css: ({
        id,
        button_color = '',
        button_text_color = '',
      }) => {

        // language=CSS
        return `
            #${id} .holler-box-button {
                background-color: ${button_color};
                color: ${button_text_color};
            }
        `
      },
    },
    overlay: {
      name: __('Overlay', 'holler-box'),
      render: ({ overlay_enabled = true, overlay_color, overlay_opacity = 0.5 }) => {
        return [
          singleControl({
            label: __('Enabled'),
            control: toggle({
              id: 'overlay-enabled',
              checked: overlay_enabled
            }),
          }),
          singleControl({
            label: __('Color'),
            control: input({
              id: 'overlay-color',
              value: overlay_color,
            }),
          }),
          singleControl({
            label: __('Opacity'),
            control: input({
              type: 'number',
              step: '0.01',
              id: 'overlay-opacity',
              value: overlay_opacity,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#overlay-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              overlay_color: ui.color.toString(),
            })
          },
        })

        $('#overlay-opacity').on('change input', e => {
          updateSetting({
            overlay_opacity: e.target.value,
          })
        })

        $('#overlay-enabled').on('change', e => {
          updateSetting({
            overlay_enabled: e.target.checked,
          })
        })
      },
      css: ({
        id,
        overlay_opacity = 0.5,
        overlay_color = '',
      }) => {

        // language=CSS
        return `
            #${id} .holler-box-overlay {
                background-color: ${overlay_color};
                opacity: ${overlay_opacity};
            }
        `
      },
    },
    modal: {
      name: __('Modal', 'holler-box'),
      render: ({}) => {
        return [].join('')
      },
      onMount: (settings, updateSetting) => {
      },
    },
    close_button: {
      name: __('Close Button', 'holler-box'),
      render: ({}) => {
        return [].join('')
      },
      onMount: (settings, updateSetting) => {
      },
    },
    image: {
      name: __('Image', 'holler-box'),
      render: ({ image_src = '', image_width = '' }) => {
        return [

          //language=HTML
          `
			  <div class="holler-input-group">
				  ${input({
					  className: 'full-width',
					  id: 'image-src',
					  value: image_src
				  })}
				  <button id="select-image" class="holler-button secondary icon">${icons.image}</button>
			  </div>`,
          singleControl({
            label: __('Width'),
            control: input({
              type: 'number',
              id: 'image-width',
              value: image_width
            })
          })
        ].join('')
      },
      onMount: (settings, updateSetting) => {

        $('#image-width').on('change input', e => {
          updateSetting({
            image_width: e.target.value,
          })
        })

        $('#image-src').on('change', e => {
          updateSetting({
            image_src: e.target.value,
          })
        })

        // Uploading files
        var file_frame

        $('#select-image').on('click', (event) => {

          var picker = $(this)

          event.preventDefault()
          // If the media frame already exists, reopen it.
          if (file_frame) {
            // Open frame
            file_frame.open()
            return
          }
          // Create the media frame.
          file_frame = wp.media.frames.file_frame = wp.media({
            title: __('Select a image to upload'),
            button: {
              text: __('Use this image'),
            },
            multiple: false	// Set to true to allow multiple files to be selected

          })
          // When an image is selected, run a callback.
          file_frame.on('select', function () {
            // We set multiple to false so only get one image from the uploader
            var attachment = file_frame.state().get('selection').first().toJSON()

            $('#image-src').val(attachment.url)

            updateSetting({
              image_src: attachment.url,
              // height: height,
            })
          })
          // Finally, open the modal
          file_frame.open()
        })

      },
      css: ({ id, image_width }) => {
        //language=CSS
        return `#${id} img {
            width: ${image_width}px;
        }
        `
      }
    },
    avatar: {
      name: __('Avatar', 'holler-box'),
      render: ({ avatar = '' }) => {
        return [

          //language=HTML
          `
			  <div class="holler-input-group">
				  ${input({
					  className: 'full-width',
					  id: 'image-src',
					  value: avatar
				  })}
				  <button id="select-image" class="holler-button secondary icon">${icons.image}</button>
			  </div>`,
          `<p>${__('Square images work best!', 'holler-box')}</p>`
        ].join('')
      },
      onMount: (settings, updateSetting) => {

        $('#image-src').on('change', e => {
          updateSetting({
            avatar: e.target.value,
          })
        })

        // Uploading files
        var file_frame

        $('#select-image').on('click', (event) => {

          var picker = $(this)

          event.preventDefault()
          // If the media frame already exists, reopen it.
          if (file_frame) {
            // Open frame
            file_frame.open()
            return
          }
          // Create the media frame.
          file_frame = wp.media.frames.file_frame = wp.media({
            title: __('Select a image to upload'),
            button: {
              text: __('Use this image'),
            },
            multiple: false	// Set to true to allow multiple files to be selected

          })
          // When an image is selected, run a callback.
          file_frame.on('select', function () {
            // We set multiple to false so only get one image from the uploader
            var attachment = file_frame.state().get('selection').first().toJSON()

            $('#image-src').val(attachment.url)

            updateSetting({
              avatar: attachment.url,
              // height: height,
            })
          })
          // Finally, open the modal
          file_frame.open()
        })
      }
    },
    fields: {
      name: __('Fields', 'holler-box'),
      render: ({ name_placeholder = 'Name', email_placeholder = 'Email' }) => {
        return [
          singleControl({
            label: __('Name Placeholder'),
            control: input({
              id: 'name-placeholder',
              name: 'name_placeholder',
              value: name_placeholder,
            }),
          }),
          singleControl({
            label: __('Email Placeholder'),
            control: input({
              id: 'email-placeholder',
              name: 'email_placeholder',
              value: email_placeholder,
            }),
          }),

        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#email-placeholder,#name-placeholder').on('input change', e => {
          updateSetting({
            [e.target.name]: e.target.value
          })
        })
      },
    },

  }

  const Templates = [
    {
      id: 'notification_box',
      controls: [
        Controls.template,
        Controls.position,
        Controls.content,
        Controls.avatar,
      ],
      defaults: {
        post_content: '<p>This is a message.</p>',
        position: 'bottom-right',
        avatar: HollerBox.gravatar
      },
    },
    {
      id: 'notification_box_with_button',
      controls: [
        Controls.template,
        Controls.position,
        Controls.content,
        Controls.avatar,
        Controls.link_button,
      ],
      defaults: {
        post_content: '<p>This is a message.</p>',
        position: 'bottom-right',
        button_text: 'Check it out!',
        avatar: HollerBox.gravatar
      },
    },
    {
      id: 'notification_box_with_form',
      controls: [
        Controls.template,
        Controls.position,
        Controls.content,
        Controls.avatar,
        Controls.fields,
        Controls.button,
        Controls.integration,
        Controls.submit,
      ],
      defaults: {
        post_content: '<p>This is a message.</p>',
        position: 'bottom-right',
        avatar: HollerBox.gravatar,
        button_text: 'Signup',
      },
    },
    {
      id: 'popup_standard',
      controls: [
        Controls.template,
        Controls.position,
        Controls.title,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        post_content: '<p>Enter your email below. We\'ll never spam you.</p>',
        button_text: 'Subscribe',
        position: 'center-center',
      },
    },
    {
      id: 'popup_image_left',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        post_content: '<p>Enter your email below. We\'ll never spam you.</p>',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/150x300',
        position: 'center-center',
      },
    },
    {
      id: 'popup_form_below',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        post_content: '<p>Enter your email below. We\'ll never spam you.</p>',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/200',
        position: 'center-center',
      },
    },
    {
      id: 'popup_progress_bar',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        post_content: '<p>Enter your email below. We\'ll never spam you.</p>',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/150x300',
        position: 'center-center',
      },
    },
    {
      id: 'popup_image_beside_text_top',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        post_content: '<p>Enter your email below. We\'ll never spam you.</p>',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/200',
        position: 'center-center',
      },
    },
    {
      id: 'popup_full_image_background',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        post_content: '<p>Enter your email below. We\'ll never spam you.</p>',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/200',
        position: 'center-center',
      },
    },
    {
      id: 'popup_text_top_with_color_background',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        post_content: '<p>Enter your email below. We\'ll never spam you.</p>',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/200',
        position: 'center-center',
      },
    },
  ]

  const renderEditor = () => {

    const actions = () => {

      if (Editor.getPopup().post_status === 'publish') {
        //language=HTML
        return `
			<button class="holler-button danger text" id="disable">${__('Disable')}</button>
			<button class="holler-button primary" id="save">${__('Save Changes')}</button>`
      } else {
        //language=HTML
        return `
			<button class="holler-button secondary text" id="save">${__('Save draft')}</button>
			<button class="holler-button action" id="enable">${__('Publish')}</button>`
      }

    }

    const popupTitle = () => {
      if (Editor.getPopup().post_status === 'publish') {
        //language=HTML
        return `<h1 class="holler-title" tabindex="0">
			${sprintf(__('Editing %s'), `<b>${Editor.getPopup().post_title}</b>`)}</h1>`
      } else {
        //language=HTML
        return `<h1 class="holler-title" tabindex="0">
			${sprintf(__('Creating %s'), `<b>${Editor.getPopup().post_title.length ? Editor.getPopup().post_title : __('Popup title...')}</b>`)}</h1>`
      }
    }

    //language=HTML
    return `
		<div id="header">
			<div class="holler">${icons.hollerbox}</div>
			<div class="inside-header">
				${popupTitle()}
				<div class="actions display-flex align-center gap-20">
					${actions()}
					<button class="holler-button secondary text icon">${icons.verticalDots}</button>
				</div>
			</div>
		</div>
		<div id="editor">
			<div class="control-wrap">
				<div id="controls"></div>
			</div>
			<div id="preview"></div>
		</div>`

  }

  const Editor = {

    popup: {
      id: `popup-${HollerBox.popup.ID}`,
      ...HollerBox.popup
    },

    getTemplate () {
      return Templates.find(t => t.id === this.popup.template)
    },

    getPopup () {
      return {
        ...Templates.find(t => t.id === this.popup.template)?.defaults,
        ...this.popup,
      }
    },

    generateCSS () {
      return this.getTemplate().controls.map(control => {
        try {
          return control.css(this.getPopup())
        } catch (e) {
          return ''
        }
      }).join('')
    },

    updatePreview () {
      $('#preview').html(HollerBox.types[this.popup.template].render(this.getPopup()))
      let css = this.generateCSS()
      $('#holler-box-overrides').text(css)

      this.popup.custom_css = css
    },

    mount () {

      const renderControls = () => {
        // language=HTML
        return [
          ...this.getTemplate().controls.map(control => controlGroup(control, this.getPopup())),
          `
			  <button id="edit-display-conditions" class="control-button">${__('Display Conditions')} <span
				  class="dashicons dashicons-visibility"></span></button>`,
          `
			  <button id="edit-triggers" class="control-button">${__('Triggers')} <span
				  class="dashicons dashicons-external"></span>
			  </button>`
        ].join('')
      }

      $('#holler-app').html(renderEditor())

      if (this.popup.template) {
        this.updatePreview()
        $('#controls').html(renderControls())
      }

      this.onMount()
    },

    onMount () {

      const updateSettings = (newSettings, reRenderControls = false) => {

        this.popup = {
          ...this.popup,
          ...newSettings,
        }

        if (reRenderControls) {
          this.mount()
        } else {
          this.updatePreview()
        }

      }

      if (!this.popup.template) {
        selectTemplateModal({
          onSelect: (template) => {
            updateSettings({
              template,
              ...Templates.find(t => t.id === template).defaults,
            }, true)
          }
        })

        return
      }

      this.getTemplate().controls.forEach(control => control.onMount(this.getPopup(), updateSettings))

      $('.control-group').on('click', '.control-group-header', e => {
        $('.control-group').removeClass('open')
        $(e.currentTarget).parent().toggleClass('open')
      })

      $('#edit-triggers').on('click', e => {
        editTriggersModal(this.getPopup(), updateSettings)
      })

      $('#edit-display-conditions').on('click', e => {
        editDisplayConditionsModal(this.getPopup(), updateSettings)
      })

      $('.holler-title').on('click', e => {})
      $('#save').on('click', e => {
        this.commit()
      })
      $('#enable').on('click', e => {
        this.enable(updateSettings)
      })
      $('#disable').on('click', e => {
        this.disable()
      })

    },

    enable (updateSettings) {

      if (!Object.values(this.popup.triggers).some(({ enabled = false }) => enabled)) {

        confirmationModal({
          alert: `<p>${__('You do not have any triggers enabled, enable a trigger so your popup will display!', 'holler-box')}</p>`,
          confirmText: __('Edit Triggers', 'holler-box'),
          closeText: __('Publish Anyway', 'holler-box'),
          onConfirm: () => {
            editTriggersModal(this.getPopup(), updateSettings)
          },
          onCancel: () => {
            this.popup.post_status = 'publish'
            return this.commit()
          }
        })

        return
      }

      if (!this.popup.display_rules.length) {

        confirmationModal({
          alert: `<p>${__('You do not have any active display rules! Add a display rule so visitors will see your popup.', 'holler-box')}</p>`,
          confirmText: __('Add Display Rules', 'holler-box'),
          closeText: __('Publish Anyway', 'holler-box'),
          onConfirm: () => {
            editDisplayConditionsModal(this.getPopup(), updateSettings)
          },
          onCancel: () => {
            this.popup.post_status = 'publish'
            return this.commit()
          }
        })

        return
      }

      this.popup.post_status = 'publish'
      return this.commit()
    },

    disable () {
      this.popup.post_status = 'draft'
      return this.commit()
    },

    commit () {

      return apiPatch(`${HollerBox.routes.popup}/${this.popup.ID}`, {
        ...this.popup
      }).then(r => {

        dialog({
          message: __('Popup saved!')
        })

        this.mount()

      })

    }

  }

  const DisplayConditions = {
    groups: {
      basic: __('Basic'),
      special: __('Special Pages'),
    },
    conditions: [
      {
        type: 'entire_site',
        name: __('Entire Site'),
        group: 'basic',
      },
      {
        type: '404_page',
        name: __('404 Page'),
        group: 'special'
      },
      {
        type: ' search_page',
        name: __('Search Page'),
        group: 'special'
      },
      {
        type: 'front_page',
        name: __('Front Page'),
        group: 'special'
      },
      {
        type: 'blog_page',
        name: __('Blog/Posts Page'),
        group: 'special'
      },
    ],
  }

  const itemPicker = (selector, {
    placeholder = __('Type to search...'),
    fetchOptions = (search, resolve) => {},
    selected = [],
    onChange = () => {},
    noneSelected = __('All')
  }) => {

    let $el = $(selector)
    let search = ''
    let options = []

    const renderItem = ({ id, text }) => {
      // language=HTML
      return `
		  <div class="holler-picker-item">
			  <span class="holler-picker-item-text">${text}</span>
			  <span class="holler-picker-item-delete" tabindex="0" data-id="${id}">&times;</span>
		  </div>`
    }

    const render = () => {
      // language=HTML
      return `
		  <div class="holler-picker">
			  <div class="holler-picker-selected">
				  ${selected.map(renderItem).join('')}
				  ${input({
					  className: 'holler-picker-search',
					  value: search,
					  name: 'search',
					  type: 'search',
					  autocomplete: 'off',
					  placeholder: selected.length ? placeholder : noneSelected,
				  })}
			  </div>
			  <div class="holler-picker-options"></div>
		  </div>`
    }

    const renderOptions = () => {

      let _options = options.filter(opt => !selected.some(_opt => opt.id === _opt.id))

      if (!_options.length) {
        return `
		  <div class="holler-picker-no-options">${__('No results found...')}</div>`
      }

      // language=HTML
      return _options.map(({
        id,
        text
      }) => `
		  <div class="holler-picker-option" tabindex="0" data-id="${id}">${text}</div>`).join('')
    }

    const showOptions = () => {
      $el.find('.holler-picker-options').html(renderOptions())

      $('.holler-picker-option').on('click', e => {
        selectOption(e.currentTarget.dataset.id)
      })
    }

    const focusSearch = () => {
      $el.find('.holler-picker-search').focus()
    }

    const selectOption = (id) => {
      let option = { ...options.find(opt => opt.id == id) }
      options = []
      search = ''
      selected.push(option)
      onChange(selected)
      mount()
      focusSearch()
    }

    const unSelectOption = (id) => {
      selected = selected.filter(opt => opt.id != id)
      onChange(selected)
      mount()
      focusSearch()
    }

    const setOptions = (opts) => {
      if ($el.is(':focus-within')) {
        options = opts

        showOptions()
      }
    }

    const mount = () => {
      $el.html(render())

      let $picker = $el.find('.holler-picker')

      $picker.find('.holler-picker-search').on('input', e => {
        search = e.target.value

        $picker.addClass('options-visible')
        $picker.find('.holler-picker-options').html(`<div class="holler-picker-no-options">${__('Searching')}</div>`)

        let { stop } = loadingDots('.holler-picker-no-options')

        fetchOptions(search, (opts) => {
          stop()
          setOptions(opts)
        })
      })

      $picker.find('.holler-picker-item-delete').on('click', e => {
        unSelectOption(e.target.dataset.id)
      })

      $picker.on('focusout', e => {

        if (e.relatedTarget && $picker.find(e.relatedTarget)) {
          return
        }

        search = ''
        options = []
        mount()
      })
    }

    mount()

  }

  const termPicker = (selector, {
    selected = [],
    label = '',
    type = 'post_type',
    term = '',
    updateRule = () => {}
  }) => {

    let timeout

    itemPicker(selector, {
      selected,
      noneSelected: sprintf(__('All %s'), label),
      fetchOptions: (search, resolve) => {

        if (SearchesCache[term][search]) {
          resolve(SearchesCache[term][search])
          return
        }

        if (timeout) {
          clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
          apiGet(HollerBox.routes.options, {
            search,
            [type]: term,
          }).then(options => {
            SearchesCache[term][search] = options
            resolve(options)
          })
        }, 500)
      },
      onChange: (selected) => {
        updateRule({
          selected
        })
      }
    })
  }

  const SearchesCache = {}

  Object.values(HollerBox.post_types).forEach(post_type => {

    let pt_key = post_type.name
    let label = post_type.label

    DisplayConditions.groups[pt_key] = label
    SearchesCache[pt_key] = {}

    DisplayConditions.conditions.push({
      type: pt_key,
      name: label,
      group: pt_key,
      render: ({ uuid }) => {
        return `<div id="picker-${uuid}" class="picker-here"></div>`
      },
      onMount: ({ uuid, selected = [] }, updateRule) => {

        termPicker(`#picker-${uuid}`, {
          selected,
          label,
          term: pt_key,
          type: 'post_type',
          updateRule
        })
      }
    })

    Object.values(post_type.taxonomies).forEach(tax => {

      SearchesCache[tax.name] = {}

      DisplayConditions.conditions.push({
        type: `${pt_key}_in_${tax.name}`,
        name: sprintf(__('In %s'), tax.label),
        group: pt_key,
        render: ({ uuid }) => {
          return `<div id="picker-${uuid}" class="picker-here"></div>`
        },
        onMount: ({ uuid, selected = [] }, updateRule) => {
          termPicker(`#picker-${uuid}`, {
            selected,
            label: tax.label,
            term: tax.name,
            type: 'taxonomy',
            updateRule
          })
        }
      })

    })

    if (post_type.has_archive) {

      // Archive
      DisplayConditions.conditions.push({
        type: `${pt_key}_archive`,
        name: sprintf(__('%s Archive'), label),
        group: pt_key
      })
    }

    Object.values(post_type.taxonomies).forEach(tax => {

      DisplayConditions.conditions.push({
        type: `${tax.name}_archive`,
        name: sprintf(__('%s Archive'), tax.label),
        group: pt_key,
        render: ({ uuid }) => {
          return `<div id="picker-${uuid}" class="picker-here"></div>`
        },
        onMount: ({ uuid, selected = [] }, updateRule) => {
          termPicker(`#picker-${uuid}`, {
            selected,
            label: tax.label,
            term: tax.name,
            type: 'taxonomy',
            updateRule
          })
        }
      })

    })

    if (post_type.hierarchical) {
      // child of
    }

  })

  const AdvancedDisplayRules = {
    show_up_to_x_times: {
      name: __('Show up to X times'),
      controls: ({ times = 1 }) => {
        //language=HTML
        return `<label>${sprintf(__('Show up to %s times'), input({ type: 'number', id: 'times', value: times }))}`
      },
      onMount: (trigger, updateTrigger) => {
        $('#times').on('change', e => {
          updateTrigger({
            times: e.target.value
          })
        })
      }
    },
    show_after_x_page_views: {
      name: __('Show after X page views'),
      controls: ({ views = 0 }) => {
        //language=HTML
        return `<label>${sprintf(__('Show after %s views'), input({ type: 'number', id: 'views', value: views }))}`
      },
      onMount: (trigger, updateTrigger) => {
        $('#views').on('change', e => {
          updateTrigger({
            views: e.target.value
          })
        })
      }
    },
    // show_until_date: {},
    // hide_for_x_visitors: {},
    // show_on_x_devices: {},
  }

  const renderDisplayRule = (rule, i) => {

    let extraUI = ''

    try {
      extraUI = DisplayConditions.conditions.find(c => c.type === rule.type).render({
        ...rule,
        i
      })
    } catch (e) {

    }

    //language=HTML
    return `
		<div class="rule">
			<div class="display-flex gap-10">
				<select data-i=${i} class="full-width change-type" name="type">
					${Object.keys(DisplayConditions.groups).map(g => {

						let types = DisplayConditions.conditions.filter(t => t.group === g)
						let opts = types.map(t => `<option value="${t.type}" ${rule.type === t.type ? 'selected' : ''}>${t.name}</option>`)

						return `<optgroup label="${DisplayConditions.groups[g]}">${opts}</optgroup>`
					})}
				</select>
				<button data-i=${i} class="holler-button secondary text icon delete-display-rule"><span
					class="dashicons dashicons-dismiss"></span>
				</button>
			</div>
			${extraUI}
		</div>`
  }

  const editDisplayConditionsModal = ({
    display_rules = [],
    exclude_rules = [],
    advanced_rules = {}
  }, updateSettings) => {

    const rulesEditor = (selector, {
      rules = [],
      onUpdate = (rules) => {}
    }) => {

      const $el = $(selector)

      const commitRules = () => {
        onUpdate(rules)
      }

      const updateRule = (i, ruleSettings, reRender = false) => {
        rules[i] = {
          ...rules[i],
          ...ruleSettings
        }

        commitRules()

        if (reRender) {
          mountRules()
        }
      }

      const deleteRule = (i) => {
        rules.splice(i, 1)
        commitRules()
      }

      const mountRules = () => {
        $el.html(`<div class="rules">${rules.map((rule, i) => renderDisplayRule(rule, i)).join('')}</div>`).append(`<button class="holler-button secondary add-rule">${__('Add Rule')}</button>`)

        $el.find('.change-type').on('change', e => {
          updateRule(parseInt(e.target.dataset.i), {
            type: e.target.value
          }, true)
        })

        $el.find('.delete-display-rule').on('click', e => {
          deleteRule(parseInt(e.currentTarget.dataset.i))
          mountRules()
        })

        rules.forEach((rule, i) => {
          try {
            DisplayConditions.conditions.find(c => c.type === rule.type).onMount({
              ...rule,
              i
            }, (settings) => {
              updateRule(i, settings)
            })
          } catch (e) {}
        })

        $el.find('.add-rule').on('click', e => {
          rules.push({
            type: 'entire_site',
            uuid: uuid()
          })

          commitRules()

          mountRules()
        })
      }

      mountRules()
    }

    modal({
      //language=HTML
      width: 800,
      dialogClasses: 'no-padding',
      //language=HTML
      content: `
		  <div class="holler-header is-sticky">
			  <h3>${__('Edit Display Conditions')}</h3>
			  <button class="holler-button secondary text icon holler-modal-button-close"><span
				  class="dashicons dashicons-no-alt"></span>
			  </button>
		  </div>
		  <table class="display-conditions-grid">
			  <tr>
				  <th>${__('Include')}</th>
				  <td>
					  <div id="include-rules"></div>
				  </td>
			  </tr>
			  <tr>
				  <th>${__('Exclude')}</th>
				  <td>
					  <div id="exclude-rules"></div>
				  </td>
			  </tr>
			  <tr>
				  <th>${__('Advanced')}</th>
				  <td id="triggers">
					  ${Object.keys(AdvancedDisplayRules).map(t => renderTrigger({
						  id: t,
						  ...AdvancedDisplayRules[t]
					  })).join('')}
				  </td>
			  </tr>
		  </table>`,
      onOpen: () => {

        rulesEditor('#include-rules', {
          rules: display_rules.filter(r => r?.type),
          onUpdate: (display_rules) => {
            updateSettings({
              display_rules
            })
          }
        })

        rulesEditor('#exclude-rules', {
          rules: exclude_rules.filter(r => r?.type),
          onUpdate: (exclude_rules) => {
            updateSettings({
              exclude_rules
            })
          }
        })

        $('[name="toggle-trigger"]').on('change', e => {

          if (e.target.checked) {
            $(`.trigger[data-id=${e.target.dataset.trigger}]`).addClass('enabled')
          } else {
            $(`.trigger[data-id=${e.target.dataset.trigger}]`).removeClass('enabled')
          }

        })

      }
    })
  }

  const Triggers = {
    on_page_load: {
      name: __('On Page Load'),
      controls: ({ delay = 0 }) => {
        //language=HTML
        return `<label>${sprintf(__('Show after %s seconds'), input({ type: 'number', id: 'delay', value: delay }))}`
      },
      onMount: (trigger, updateTrigger) => {
        $('#delay').on('change', e => {
          updateTrigger({
            delay: e.target.value
          })
        })
      }
    },
    element_click: {
      name: __('On Click'),
      controls: ({ selector }) => {
        //language=HTML
        return `<label>${sprintf(__('Clicked element %s'), input({
			placeholder: '.my-class',
			id: 'selector',
			value: selector
		}))}`
      },
      onMount: (trigger, updateTrigger) => {
        $('#selector').on('change', e => {
          updateTrigger({
            selector: e.target.value
          })
        })
      }
    },
    scroll_detection: {
      name: __('On Scroll'),
      controls: ({ depth = 50 }) => {
        //language=HTML
        return `<label>${sprintf(__('Scrolled past %s'), input({
			type: 'number',
			min: 0,
			max: 100,
			placeholder: '50',
			id: 'selector',
			value: depth
		}))} %`
      },
      onMount: (trigger, updateTrigger) => {
        $('#selector').on('change', e => {
          updateTrigger({
            selector: e.target.value
          })
        })
      }
    },
    exit_intent: {
      name: __('On Page Exit Intent'),
      controls: () => ''
    },
  }

  const renderTrigger = (trigger, settings = {}, enabled) => {
    //language=HTML
    return `
		<div class="trigger ${enabled ? 'enabled' : ''}" data-id="${trigger.id}">
			<div class="name">${trigger.name}</div>
			<div class="controls">
				${trigger.controls(settings)}
			</div>
			<div class="enabled">${toggle({
				className: 'toggle-trigger',
				name: 'toggle-trigger',
				dataTrigger: trigger.id,
				value: 1,
				checked: enabled
			})}
			</div>
		</div>`
  }

  const editTriggersModal = ({
    triggers = {}
  }, updateSettings) => {

    modal({
      width: 800,
      dialogClasses: 'has-header',
      //language=HTML

      content: `
		  <div class="holler-header">
			  <h3>${__('Edit Triggers')}</h3>
			  <button class="holler-button secondary text icon holler-modal-button-close"><span
				  class="dashicons dashicons-no-alt"></span>
			  </button>
		  </div>
		  <div id="triggers">
			  ${Object.keys(Triggers).map(t => renderTrigger({
				  id: t,
				  ...Triggers[t]
			  }, triggers[t], triggers[t] ? triggers[t].enabled : false)).join('')}
		  </div>`,
      onOpen: () => {

        const updateTrigger = (t, settings) => {
          triggers[t] = {
            ...triggers[t],
            ...settings
          }

          updateSettings({
            triggers
          })
        }

        Object.keys(Triggers).forEach(t => {
          try {
            Triggers[t].onMount(triggers[t], (settings) => {
              updateTrigger(t, settings)
            })
          } catch (e) {
          }
        })

        $('[name="toggle-trigger"]').on('change', e => {
          if (e.target.checked) {
            $(`.trigger[data-id=${e.target.dataset.trigger}]`).addClass('enabled')
            updateTrigger(e.target.dataset.trigger, { enabled: true })
          } else {
            $(`.trigger[data-id=${e.target.dataset.trigger}]`).removeClass('enabled')
            updateTrigger(e.target.dataset.trigger, { enabled: false })
          }
        })
      }
    })

  }

  $(() => {
    $('head').append(`<style id="holler-box-overrides"></style>`)
    Editor.mount()
  })

})(jQuery)
