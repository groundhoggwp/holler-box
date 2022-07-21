( ($) => {

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
    adminPageURL,
    moreMenu,
    dialog,
    copyObject,
    bold,
    codeEditor,
    objectEquals,
    loadingDots,
    confirmationModal,
    mediaPicker,
  } = HollerBox.elements

  const { sprintf, __, _x, _n } = wp.i18n

  const maybeLog = (error) => {
    if (HollerBox.settings.script_debug_mode) {
      console.debug(error)
    }
  }

  const isGroundhoggInstalled = () => {
    return HollerBox.installed.groundhogg && typeof Groundhogg !== 'undefined'
  }

  if (isGroundhoggInstalled()) {
    const { createFilters } = Groundhogg.filters.functions
  }

  const isPro = () => {
    return typeof HollerBoxPro !== 'undefined'
  }

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
      ...opts,
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
      body: JSON.stringify(data),
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
      body: JSON.stringify(data),
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

    if (!( data instanceof FormData )) {
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
            <label>${ label }</label>
            ${ control }
        </div>`
  }

  const controlGroup = (control, popup) => {
    //language=HTML
    return `
        <div class="control-group" ${ control.id ? `id="${ control.id }"` : '' }>
            <div class="control-group-header">
                <div class="control-group-name">${ control.name }</div>
                <button class="toggle-indicator"></button>
            </div>
            <div class="controls">
                ${ control.render(popup) }
            </div>
        </div>`
  }

  const proFeatureModal = ({
    feature = '',
  }) => {

    modal({
      dialogClasses: 'pro-feature',
      // language=HTML
      content: `
          <div>
              <h1>${ __('Upgrade to Pro!') }</h1>
              <p>${ sprintf(__('The %s is a premium feature. Upgrade to unlock it.'), bold(feature)) }</p>
              <p>${ __('With Pro you also get...') }</p>
              <ul>
                  <li>✅ ${ __('Banners, sidebars, and more templates!') }</li>
                  <li>✅ ${ __('Unlimited premium popups!') }</li>
                  <li>✅ ${ __('New CRM integrations!') }</li>
                  <li>✅ ${ __('Premium support!') }</li>
              </ul>
              <p>${ __('Starting from just <b>$30</justb>/m.') }</p>
              <div class="display-flex center" style="margin-top: 20px">
                  <a href="https://hollerwp.com/pricing/" target="_blank" class="holler-button primary big bold">👉
                      ${ __('GET PRO') }</a>
              </div>
          </div>`,
    })
  }

  const proCrmIntegrationsAd = () => {
    // language=HTML
    return `
        <div class="holler-pro-ad">
            Unlock more CRM Integrations when you get <a href="https://hollerwp.com/pricing/" target="_blank"><b>HollerBox
            Pro!</b></a> Including, ActiveCampaign, HubSpot, ConvertKit, MailChimp, and more!
        </div>`
  }

  const selectIntegrationModal = ({
    onSelect = () => {},
  }) => {
    modal({
      dialogClasses: 'select-integration no-padding',
      //language=HTML
      content: `
          <div class="holler-header is-sticky">
              <h3>${ __('Select an integration') }</h3>
              <button class="holler-button secondary text icon holler-modal-button-close"><span
                      class="dashicons dashicons-no-alt"></span>
              </button>
          </div>
          <div id="integrations-here"></div>`,
      width: 800,
      onOpen: ({ close }) => {

        $('#integrations-here').html(Object.keys(IntegrationGroups).map(group => {

          let integrations = Object.keys(Integrations).filter(k => Integrations[k].group === group).map(i => {

            i = {
              id: i,
              ...getIntegration(i),
            }

            //language=HTML
            return `
                <div class="integration" data-integration="${ i.id }">
                    <div class="icon">
                        ${ i.icon }
                    </div>
                    <p class="integration-name">${ i.name }</p>
                </div>`
          }).join('')

          // language=HTML
          return `<h2>${ IntegrationGroups[group] }</h2>
          <div class="integration-group">
              ${ integrations }
              ${ !isPro() && group === 'crm' ? proCrmIntegrationsAd() : '' }
          </div>`

        }).join(''))

        $('.integration').on('click', e => {

          let integration = e.currentTarget.dataset.integration

          onSelect(integration)
          close()
        })

      },
    })
  }

  const proTemplatesAd = () => {
    // language=HTML
    return `
        <div class="holler-pro-ad">
            Unlock more templates when you get <a href="https://hollerwp.com/pricing/" target="_blank"><b>HollerBox
            Pro!</b></a> Including, banners, side-ins, sidebars, FOMO (Sale Notifications), and more!
        </div>`
  }

  const selectTemplateModal = ({
    modalSettings = {},
    onSelect = (t) => {},
  }) => {

    modal({
      ...modalSettings,
      dialogClasses: 'select-template no-padding',
      // language=HTML
      content: `
          <div class="holler-header is-sticky">
              <h3>${ __('Select Template') }</h3>
              ${ modalSettings.canClose ? '' : `<button class="holler-button secondary text icon holler-modal-button-close"><span
                      class="dashicons dashicons-no-alt"></span>
              </button>` }
          </div>
          ${ isPro() ? '' : proTemplatesAd() }
          <div id="templates"></div>`,
      width: 1200,
      onOpen: ({ close }) => {

        $('#templates').html(Object.keys(Templates).map(t => {

          t = {
            id: t,
            ...Templates[t],
          }

          //language=HTML
          return `
              <div class="template" data-template="${ t.id }">
                  <div class="preview-wrap">
                      <div class="preview">
                          ${ HollerBox.templates[t.id].render({
                              ...t.defaults,
                          }) }
                      </div>
                  </div>
                  <p class="template-name">
                      ${ t.name ? t.name : t.id }
                  </p>
              </div>`
        }).join(''))

        $('.template').on('click', e => {

          let template = e.currentTarget.dataset.template

          onSelect(template)
          close()
        })

      },
    })

  }

  const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    )
  }

  const IntegrationIcons = {

    //language=HTML
    zapier: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <defs></defs>
            <path fill="#ff4a00"
                  d="M63.2 26.4H44.4l13.2-13.2-3-4a29 29 0 01-4-3.6L37.2 18.8V.5a17.3 17.3 0 00-5-.5 15.6 15.6 0 00-5.1.5v18.8L13.5 5.6a13.7 13.7 0 00-4 3.6c-1 1.5-2.6 2.5-3.6 4L19 26.4H.8l-.5 5a15.6 15.6 0 00.5 5.2h18.8L5.9 50.3a27.2 27.2 0 007.6 7.6l13.2-13.2v18.8a17.3 17.3 0 005 .5 15.6 15.6 0 005.1-.5V44.7L50 57.9a13.7 13.7 0 004-3.6 29 29 0 003.6-4L44.4 37h18.8a17.3 17.3 0 00.5-5.1 19 19 0 00-.5-5.6zm-23.3 5a25.7 25.7 0 01-1 6.7 15.2 15.2 0 01-6.6 1 25.7 25.7 0 01-6.6-1 15.2 15.2 0 01-1-6.6 25.7 25.7 0 011-6.6 15.2 15.2 0 016.6-1 25.7 25.7 0 016.6 1 29.7 29.7 0 011 6.6z"></path>
        </svg>`,
  }

  /**
   * Register client with SendWP.
   *
   * @since 3.36.1
   *
   * @param {string} register_url Registration URL.
   * @param {string} client_state string state for oauth.
   * @param {string} redirect_uri Client redirect URL.
   * @param {int} partner_id SendWP partner ID.
   * @return {void}
   */
  const sendToMailHawk = ({
    register_url = '',
    client_state = '',
    redirect_uri = '',
    partner_id = '',
  }) => {

    const form = document.createElement('form')
    form.setAttribute('method', 'GET')
    form.setAttribute('target', '_blank')
    form.setAttribute('action', register_url)
    form.classList.add('hidden')

    const addInput = (name, value) => {
      let input = document.createElement('input')
      input.setAttribute('type', 'hidden')
      input.setAttribute('name', name)
      input.setAttribute('value', value)
      form.appendChild(input)
    }

    addInput('mailhawk_plugin_signup', 'yes')
    addInput('state', client_state)
    // Redirect back to current page
    addInput('redirect_uri', redirect_uri)
    addInput('partner_id', partner_id)

    document.body.appendChild(form)

    Editor.commit().then(() => {

      confirmationModal({
        // language=HTML
        alert: `<p>${ __('You are being taken to <b>MailHawk.io</b> to complete the connection, continue?') }</p><p>
            <i>${ __('Your work has been saved!') }</i></p>`,
        onConfirm: () => {
          form.submit()
          $('#promote-mailhawk').remove()
        },
        confirmText: __('Connect!'),
      })

    })
  }

  const IntegrationGroups = {
    basic: __('Basic'),
    crm: __('CRM (Email Marketing)'),
    advanced: __('Advanced'),
  }

  const Integrations = {
    email: {
      id: 'email',
      group: 'basic',
      icon: icons.email,
      name: __('Send Email', 'holler-box'),
      _name: ({ to = [] }) => {

        if (!to.length) {
          return __('Send Email', 'holler-box')
        }

        if (to.length === 1) {
          return sprintf(__('Send email to %s', 'holler-box'), to[0])
        }

        return sprintf(__('Send email to %d recipients', 'holler-box'), to.length)
      },
      edit: ({
        to = ['{{email}}'],
        from = '',
        subject = '',
        content = '',
        reply_to = '',
      }) => {

        const promoteMailHawk = () => {

          if (HollerBox.installed.mailhawk) {
            return ''
          }

          //language=HTML
          return `
              <p id="promote-mailhawk" class="holler-notice display-flex gap-20 align-center">
                  ${ icons.mailhawk_bird }
                  <span>${ __(
                          'Need SMTP? Send better email with <b>MailHawk</b>! Starting at <b>$1</b>/month!') }</span>
                  <button class="holler-button secondary small" id="connect-mailhawk">${ __('Connect!') }</button>
              </p>`
        }

        const Replacements = {
          email: __('The lead\'s email address'),
          full_name: __('The lead\'s full name (if available)'),
          first_name: __('The lead\'s first name (if available)'),
          last_name: __('The lead\'s last name (if available)'),
          message: __('The chat message (if available)'),
          location: __('The URL where the form was submitted'),
          referrer: __('The URL where the lead came from'),
          ip_address: __('The lead\'s IP address'),
        }

        // language=HTML
        return `
            <div>
                ${ promoteMailHawk() }
                <div class="holler-rows-and-columns">
                    <div class="row">
                        <div class="col">
                            <label>${ __('To') }</label>
                            <div id="select-to"></div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <label>${ __('From') }</label>
                            ${ input({
                                type: 'email',
                                name: 'from',
                                id: 'from',
                                value: from,
                            }) }
                        </div>
                        <div class="col">
                            <label>${ __('Reply-to <i>(optional)</i>') }</label>
                            ${ input({
                                type: 'email',
                                name: 'reply_to',
                                id: 'reply_to',
                                value: reply_to,
                            }) }
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <label>${ __('Subject Line') }</label>
                            ${ input({
                                id: 'subject',
                                name: 'subject',
                                value: subject,
                            }) }
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            ${ textarea({
                                id: 'email-content',
                                name: 'content',
                                value: content,
                            }) }
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <div class="holler-panel outlined closed">
                                <div class="holler-panel-header">
                                    <h2>${ __('Replacements') }</h2>
                                    <button class="toggle-indicator"></button>
                                </div>
                                <div class="inside">
                                    <table class="replacements">
                                        ${ Object.keys(Replacements).map(r => {
                                            // language=HTML
                                            return `<tr><td><code>{{${ r }}}</code></td><td>${ Replacements[r] }</td></tr>`
                                        }).join('') }
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
      },
      onMount: ({ to = [] }, { updateIntegration }) => {

        $('.replacements code').on('click', e => {

          navigator.clipboard.writeText(e.target.innerText)

          dialog({
            message: __('Copied!'),
          })
        })

        $('.holler-modal .holler-panel-header').on('click', e => {
          $(e.currentTarget).closest('.holler-panel').toggleClass('closed')
        })

        if (!HollerBox.installed.mailhawk) {
          let $connect = $('#connect-mailhawk')

          $connect.on('click', e => {

            $connect.html(`<span class="holler-spinner"></span>`)

            const error = () => dialog({
              message: sprintf(__('We were unable to install %s, please try again.'), 'MailHawk'),
              type: 'error',
            })

            apiPost(`${ HollerBox.routes.root }/install`, {
              slug: 'mailhawk',
            }).then(r => {

              if (!r.success) {
                return error()
              }

              sendToMailHawk(r)
            }).catch(e => error())

          })
        }

        $('#from, #reply_to, #subject').on('change', e => {
          updateIntegration({
            [e.target.name]: e.target.value,
          })
        })

        itemPicker('#select-to', {
          placeholder: 'Add a recipient',
          fetchOptions: (search, resolve) => {
            resolve([
              {
                id: search,
                text: search,
              },
              {
                id: '{{email}}',
                text: '{{email}}',
              },
            ])
          },
          selected: to.map(v => ( { id: v, text: v } )),
          isValidSelection: id => id === '{{email}}' || validateEmail(id),
          tags: true,
          noneSelected: '{{email}}',
          onChange: (selected) => {
            updateIntegration({
              to: selected.map(({ id }) => id),
            })
          },
        })

        wp.editor.remove('email-content')
        tinymceElement('email-content', {}, (content) => {
          updateIntegration({
            content,
          })
        })

      },
      defaults: {
        to: ['{{email}}'],
        from: HollerBox.user.data.user_email,
        reply_to: '',
        subject: 'You\'re subscribed!',
        //language=HTML
        content: '<p>Hi {{first}}!</p><p>Thanks for subscribing 🙂.</p>',
      },
    },
    groundhogg: {
      id: 'groundhogg',
      group: 'crm',
      name: __('Groundhogg', 'holler-box'),
      icon: icons.groundhogg,
      edit: ({ tags }) => {

        // Groundhogg is not installed
        if (!HollerBox.installed.groundhogg) {
          // language=HTML
          return `
              <p class="holler-notice">
                  ${ __('Groundhogg is not activated. Groundhogg must be activated to use the integration.') }</p>`
        }

        // language=HTML
        return `
            <p>${ __('Select which tags to add to the new contact record.') }</p>
            <div id="groundhogg-tags"></div>`
      },
      onMount: ({ tags = [] }, { updateIntegration }) => {

        // Groundhogg is not installed
        if (!HollerBox.installed.groundhogg) {
          return
        }

        let timeout

        itemPicker('#groundhogg-tags', {
          selected: tags.map(t => ( { id: t, text: t } )),
          placeholder: __('Type to add...'),
          tags: true,
          onChange: (selected) => {
            updateIntegration({
              tags: selected.map(t => t.id),
            })
          },
          noneSelected: __('Select some tags...'),
          fetchOptions: (search, resolve) => {

            if (timeout) {
              clearTimeout(timeout)
            }

            timeout = setTimeout(() => {

              apiGet(`${ HollerBox.home_url }/wp-json/gh/v4/tags`, {
                search,
              }).then(r => r.items).then(items => {

                if (!items.length) {
                  return resolve([{ id: search, text: search }])
                }

                resolve(items.map(t => ( { id: t.data.tag_name, text: t.data.tag_name } )))
              }).catch(e => {
                return resolve([{ id: search, text: search }])
              })

            }, 1000)

          },
        })
      },
      beforeAdd: (add = () => {}) => {

        if (HollerBox.installed.groundhogg) {
          return true
        }

        modal({
          dialogClasses: 'promote-groundhogg',
          // language=HTML
          width: 800,
          content: `
              <div>
                  <img src="${ HollerBox.assets.groundhogg_banner }" alt="Groundhogg Banner">
                  <h1>${ __('<b>Free</b> CRM & Marketing Automation for WordPress!') }</h1>
                  <p>
                      ${ __('Groundhogg is the most powerful CRM & marketing automation plugin that you install right on your WordPress site.') }</p>
                  <p><b>${ __('Use Groundhogg to...') }</b></p>
                  <ul>
                      <li>✅ ${ __('Collect leads and built your list!') }</li>
                      <li>✅ ${ __('Send email blasts to people the subscribe!') }</li>
                      <li>✅ ${ __('Manage your contacts and lists!') }</li>
                      <li>✅ ${ __('Create automated drip/followup sequences') }</li>
                      <li>✅ ${ __('And more!') }</li>
                  </ul>
                  <p>
                      ${ __('Groundhogg has <b>no limits</b>, allowing you to grow at your own pace without getting in the way.') }</p>
                  <ul>
                      <li>✅ ${ __('Unlimited contacts!') }</li>
                      <li>✅ ${ __('GDPR Compliant') }</li>
                      <li>✅ ${ __('100% Self-hosted') }</li>
                      <li>✅ ${ __('Lots of integrations') }</li>
                  </ul>
                  <p>${ __('Install for free today and start turning your leads into revenue!') }</p>
                  <div class="display-flex center gap-20" style="margin-top: 20px">
                      <button id="install-groundhogg" class="holler-button primary big bold">
                          ${ __('Install Now!') }
                      </button>
                      <a href="https://wordpress.org/plugins/groundhogg/" target="_blank"
                         class="holler-button secondary big">
                          ${ __('More Info!') }</a>
                  </div>
              </div>`,
          onOpen: ({ close }) => {
            let $connect = $('#install-groundhogg')

            $connect.on('click', e => {

              $connect.html(`<span class="holler-spinner"></span>`)

              const error = () => dialog({
                message: sprintf(__('We were unable to install %s, please try again.'), 'Groundhogg'),
                type: 'error',
              })

              apiPost(`${ HollerBox.routes.root }/install`, {
                slug: 'groundhogg',
              }).then(r => {

                if (!r.success) {
                  return error()
                }

                HollerBox.installed.groundhogg = true

                add()
                close()

              }).catch(e => error())

            })
          },
        })

        return false
      },
    },
    webhook: {
      id: 'webhook',
      group: 'advanced',
      name: 'Webhook',
      icon: icons.webhook,
      defaults: {
        method: 'post',
      },
      _name: ({ method = 'post', url }) => {

        if (!url) {
          return __('Webhook', 'holler-box')
        }

        try {
          url = new URL(url)
        }
        catch (e) {
          return __('Webhook', 'holler-box')
        }

        return sprintf(__('%s to %s', 'holler-box'), bold(method.toUpperCase()), bold(url.hostname))
      },
      edit: ({ url, method, payload }) => {
        // language=HTML
        return `
            <div class="holler-rows-and-columns">
                <div class="row">
                    <div class="col">
                        <label>${ __('Webhook URL') }</label>
                        <div class="holler-input-group">
                            ${ select({
                                id: 'method',
                            }, {
                                post: 'POST',
                                get: 'GET',
                                patch: 'PATCH',
                                put: 'PUT',
                                delete: 'DELETE',
                            }, method) }
                            ${ input({
                                id: 'url',
                                type: 'url',
                                className: 'full-width',
                                value: url,
                            }) }
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <label for="payload">${ __('Request Type') }</label>
                        <div>
                            ${ select({
                                id: 'payload',
                            }, {
                                json: 'JSON',
                                form: 'Form Data',
                            }, payload) }
                        </div>
                    </div>
                </div>
            </div>
        `
      },
      onMount: ({ url, method, payload }, { updateIntegration }) => {

        $('#method,#url,#payload').on('input change', e => {

          switch (e.target.id) {
            case 'method':
              method = e.target.value
              break
            case 'url':
              url = e.target.value
              break
            case 'payload':
              payload = e.target.value
              break
          }

          updateIntegration({
            [e.target.id]: e.target.value,
          })
        })

        $('#test-webhook').on('click', e => {

        })
      },
    },
    zapier: {
      id: 'zapier',
      group: 'advanced',
      name: 'Zapier',
      icon: IntegrationIcons.zapier,
      defaults: {},
      edit: ({ url }) => {
        // language=HTML
        return `
            <div class="holler-rows-and-columns">
                <div class="row">
                    <div class="col">
                        <label>${ __('Zap URL') }</label>
                        <div class="holler-input-group">
                            ${ input({
                                id: 'url',
                                type: 'url',
                                className: 'full-width',
                                value: url,
                            }) }
                        </div>
                    </div>
                </div>
            </div>
        `
      },
      onMount: ({ url, method, payload }, { updateIntegration }) => {

        $('#url').on('input change', e => {
          updateIntegration({
            url: e.target.value,
          })
        })
      },
    },
  }

  const getIntegration = (type) => {
    return Integrations[type]
  }

  const renderIntegration = (id, { type, ...rest }) => {

    let integration = getIntegration(type)

    if (!integration) {
      return `
		<div class="integration" data-id="${ id }">
			<div class="name">${ __('Error') }</div>
			<button class="holler-button secondary text icon integration-more" data-id="${ id }">${ icons.verticalDots }
			</button>
		</div>`
    }

    let name

    try {
      name = integration._name(rest)
    }
    catch (e) {
      name = integration.name
    }

    // language=HTML
    return `
        <div class="integration" data-id="${ id }">
            <div class="icon">${ integration.icon }</div>
            <div class="name">${ name }</div>
            <button class="holler-button secondary text icon integration-more" data-id="${ id }">${ icons.verticalDots }
            </button>
        </div>`
  }

  const editIntegrationUI = (integration) => {
    // language=HTML
    return `
        <div class="holler-header is-sticky">
            <h3 style="font-weight: 400">
                ${ sprintf(__('Edit %s Integration', 'HollerBox'),
                        `<b>${ getIntegration(integration.type).name }</b>`) }</h3>
            <button class="holler-button secondary text icon holler-modal-button-close"><span
                    class="dashicons dashicons-no-alt"></span></button>
        </div>
        <div id="edit-here">
            ${ getIntegration(integration.type).edit(integration) }
            <div class="display-flex flex-end gap-10" style="margin-top: 20px">
                <button class="holler-button danger text holler-modal-button-close">${ __('Cancel') }</button>
                <button id="commit-integration" class="holler-button primary">${ __('Save Changes') }</button>
            </div>
        </div>`
  }

  const Controls = {
    integration: {
      name: __('Integration', 'holler-box'),
      render: ({
        integrations = [],
      }) => {

        return [
          `<div id="integrations"></div>`,
          `<button class="holler-button secondary" id="add-integration">${ __('Add Integration') }</button>`,
        ].join('')

      },
      onMount: ({ integrations = [] }, updateSetting) => {

        $('#add-integration').on('click', e => {
          selectIntegrationModal({
            onSelect: (i) => {

              const add = () => addIntegration({
                type: i,
                ...getIntegration(i).defaults,
              })

              try {
                if (Integrations[i].beforeAdd(add)) {
                  add()
                }
              }
              catch (e) {
                add()
              }

            },
          })
        })

        const editIntegrationModal = () => {
          modal({
            content: `<div id="edit-here"></div>`,
            dialogClasses: 'no-padding edit-integration',
            width: 500,
            onOpen: ({ close, setContent }) => {

              let temp = copyObject(editingIntegration)

              const mount = () => {
                setContent(editIntegrationUI(temp))

                try {
                  getIntegration(temp.type).onMount(temp, {
                    getState: () => temp,
                    updateIntegration: (_new, remount = false) => {
                      temp = {
                        ...temp,
                        ..._new,
                      }

                      if (remount) {
                        mount()
                      }
                    },
                    reMount: () => mount(),
                  })
                }
                catch (e) {
                }

                $('#commit-integration').on('click', e => {
                  updateIntegration(temp)
                  close()
                })

              }

              mount()

            },
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
                    key: 'edit',
                    text: __('Edit'),
                  },
                  {
                    key: 'delete',
                    text: `<span class="holler-text danger">${ __('Delete') }</span>`,
                  },
                ],
                onSelect: k => {
                  switch (k) {
                    case 'edit':

                      editIntegrationModal()

                      break
                    case 'delete':
                      dangerConfirmationModal({
                        alert: `<p>${ __('Are you sure you want to delete this integration?') }</p>`,
                        confirmText: __('Delete'),
                        onConfirm: () => {
                          deleteIntegration()
                        },
                      })
                      break
                  }
                },
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
            integrations,
          })

          editingIntegrationId = integrations.length - 1
          editingIntegration = integrations[editingIntegrationId]

          editIntegrationModal()

          mount()

        }

        const deleteIntegration = () => {
          integrations.splice(editingIntegrationId, 1)

          updateSetting({
            integrations,
          })

          mount()
        }

        const updateIntegration = (newSettings) => {
          integrations[editingIntegrationId] = {
            ...integrations[editingIntegrationId],
            ...newSettings,
          }

          updateSetting({
            integrations,
          })

          mount()
        }

        mount()

      },
    },
    template: {
      name: __('Template', 'holler-box'),
      render: ({
        template = 'popup_standard',
      }) => {
        return [
          `<label>${ __('Current Template:') } <b>${ Templates[template].name }</b></label>`,
          `<button class="holler-button secondary" id="change-template">${ __('Change Template') }</button>`,
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#change-template').on('click', e => {
          selectTemplateModal({
            onSelect: (template) => {
              updateSetting({
                template,
              }, {
                reRenderControls: true,
                suppressAnimations: false,
              })
            },
          })
        })
      },
    },
    submit: {
      name: __('After Submit', 'holler-box'),
      render: ({
        after_submit = 'close',
        redirect_url = '',
        success_message = '',
        hide_after_submit = false,
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
          `<div id="dependent-controls"></div>`,
        ]

        return controls.join('')
      },
      onMount: ({ after_submit = 'close', redirect_url = '', success_message = '' }, updateSetting) => {

        const mountDependentControls = () => {

          const setUI = (ui) => {
            $('#dependent-controls').html(ui)
          }

          switch (after_submit) {
            case 'message':
              setUI([
                textarea({
                  id: 'success-message',
                  value: success_message,
                }),
                `<p class="holler-notice info">${ __('Shortcodes will be rendered on the frontend.') }</p>`,
              ].join(''))

              wp.editor.remove('success-message')
              tinymceElement('success-message', {}, (success_message) => {
                updateSetting({
                  success_message,
                })
              })

              break

            case 'redirect':
              setUI(input({
                type: 'url',
                id: 'redirect_url',
                className: 'full-width',
                placeholder: 'https://example.com',
                value: redirect_url,
              }))

              $('#redirect_url').on('input change', e => updateSetting({
                redirect_url: e.target.value,
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
          }, {
            suppressAnimations: false,
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
          `<p class="holler-notice info">${ __('Shortcodes will be rendered on the frontend.') }</p>`,
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        wp.editor.remove('text-content')
        tinymceElement('text-content', {}, (post_content) => {
          updateSetting({
            post_content,
          })
        })
      },
    },
    chat_content: {
      name: __('Chat Prompts', 'holler-box'),
      render: ({
        post_content = '',
        name_prompt = '',
        email_prompt = '',
        message_prompt = '',
      }) => {

        const prompt = ({ label, id, value }) => {
          // language=HTML
          return `
              <div class="holler-panel outlined closed">
                  <div class="holler-panel-header">
                      <h2>${ label }</h2>
                      <button class="toggle-indicator"></button>
                  </div>
                  <div class="inside">
                      ${ textarea({
                          id,
                          value,
                      }) }
                  </div>
              </div>`
        }

        return [
          prompt({
            label: __('Greeting'),
            value: post_content,
            id: 'post-content',
          }),
          prompt({
            label: __('Name Prompt'),
            value: name_prompt,
            id: 'name-prompt',
          }),
          prompt({
            label: __('Email Prompt'),
            value: email_prompt,
            id: 'email-prompt',
          }),
          prompt({
            label: __('Message Prompt'),
            value: message_prompt,
            id: 'message-prompt',
          }),
          `<p class="holler-notice info">${ __('Shortcodes will <b>not</b> be rendered in chat messages.') }</p>`,
        ].join('')
      },
      onMount: (settings, updateSetting) => {

        $('.holler-panel-header').on('click', e => {
          $(e.currentTarget).closest('.holler-panel').toggleClass('closed')
        })

        let editors = [
          'post-content',
          'name-prompt',
          'email-prompt',
          'message-prompt',
        ]

        editors.forEach(id => {
          wp.editor.remove(id)
          tinymceElement(id, {}, (content) => {
            updateSetting({
              [id.replace('-', '_')]: content,
            })
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
            #${ id } .holler-box-button {
                background-color: ${ button_color };
                color: ${ button_text_color };
            }
        `
      },
    },
    form: {
      name: __('Form', 'holler-box'),
      render: ({
        form_color = '',
      }) => {
        return [

          singleControl({
            label: __('Background Color'),
            control: input({
              id: 'form-color',
              value: form_color,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#form-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              form_color: ui.color.toString(),
            })
          },
        })
      },
      css: ({
        id,
        form_color = '#e8eff9',
      }) => {

        // language=CSS
        return `
            #${ id } form.holler-box-form {
                background-color: ${ form_color };
            }
        `
      },
    },
    progress: {
      name: __('Progress Bar', 'holler-box'),
      render: ({
        progress_bar_color = '',
        progress_percentage = '',
      }) => {
        return [
          singleControl({
            label: __('Color'),
            control: input({
              id: 'progress-color',
              value: progress_bar_color,
            }),
          }),
          singleControl({
            label: __('Percentage'),
            control: input({
              type: 'number',
              id: 'progress-percentage',
              value: progress_percentage,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {

        $('#progress-percentage').on('change input', e => {
          updateSetting({
            progress_percentage: e.target.value,
          })
        })

        $('#progress-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              progress_bar_color: ui.color.toString(),
            })
          },
        })
      },
      css: ({
        id,
        progress_bar_color = '#1e73be',
        progress_percentage = '50',
      }) => {

        // language=CSS
        return `
            #${ id } .holler-box-progress-bar-fill {
                width: ${ progress_percentage }%;
                background-color: ${ progress_bar_color };
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
            #${ id } .holler-box-button {
                background-color: ${ button_color };
                color: ${ button_text_color };
            }
        `
      },
    },
    overlay: {
      name: __('Overlay', 'holler-box'),
      render: ({
        overlay_enabled = true,
        disable_scrolling = false,
        overlay_color,
        overlay_opacity = 0.5,
      }) => {
        return [
          singleControl({
            label: __('Show Overlay'),
            control: toggle({
              id: 'overlay-enabled',
              checked: overlay_enabled,
            }),
          }),
          singleControl({
            label: __('Disable Scrolling'),
            control: toggle({
              id: 'disable-scrolling',
              checked: disable_scrolling,
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
              max: 1,
              min: 0,
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

        $('#disable-scrolling').on('change', e => {
          updateSetting({
            disable_scrolling: e.target.checked,
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
            #${ id } .holler-box-overlay::after {
                background-color: ${ overlay_color };
                opacity: ${ overlay_opacity };
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
      render: ({ close_button_color = '' }) => {
        return [
          singleControl({
            label: __('Color'),
            control: input({
              id: 'close-button-color',
              value: close_button_color,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#close-button-color').wpColorPicker({
          change: (e, ui) => {
            updateSetting({
              close_button_color: ui.color.toString(),
            })
          },
        })
      },
      css: ({
        id,
        close_button_color = '#000000',
      }) => {

        // language=CSS
        return `
            #${ id } .holler-box-modal-close {
                color: ${ close_button_color };
            }
        `
      },
    },
    image: {
      name: __('Image', 'holler-box'),
      render: ({ image_src = '', image_width = '' }) => {
        return [

          //language=HTML
          `
              <div class="holler-input-group">
                  ${ input({
                      className: 'full-width',
                      id: 'image-src',
                      value: image_src,
                  }) }
                  <button id="select-image" class="holler-button secondary icon">${ icons.image }</button>
              </div>`,
          singleControl({
            label: __('Width'),
            control: input({
              type: 'number',
              id: 'image-width',
              value: image_width,
            }),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {

        $('#image-width').on('change input', e => {
          updateSetting({
            image_width: e.target.value,
          })
        })

        let $src = $('#image-src')

        $src.on('change', e => {
          updateSetting({
            image_src: e.target.value,
          })
        })

        $('#select-image').on('click', (event) => {
          mediaPicker({
            onSelect: (attachment) => {
              $src.val(attachment.url)
              updateSetting({
                image_src: attachment.url,
              })
            },
          })
        })

      },
      css: ({ id, image_width }) => {
        //language=CSS
        return `#${ id } .image-width {
            width: ${ image_width }px;
        }
        `
      },
    },
    avatar: {
      name: __('Avatar', 'holler-box'),
      render: ({ avatar = '' }) => {
        return [

          //language=HTML
          `
              <div class="holler-input-group">
                  ${ input({
                      className: 'full-width',
                      id: 'image-src',
                      value: avatar,
                  }) }
                  <button id="select-image" class="holler-button secondary icon">${ icons.image }</button>
              </div>`,
          `<p>${ __('Square images work best!', 'holler-box') }</p>`,
        ].join('')
      },
      onMount: (settings, updateSetting) => {

        let $src = $('#image-src')

        $src.on('change', e => {
          updateSetting({
            avatar: e.target.value,
          })
        })

        $('#select-image').on('click', (event) => {
          mediaPicker({
            onSelect: (attachment) => {
              $src.val(attachment.url)
              updateSetting({
                avatar: attachment.url,
              })
            },
          })
        })
      },
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
            [e.target.name]: e.target.value,
          })
        })
      },
    },
    custom_css: {
      id: 'codemirror',
      name: __('Custom CSS', 'holler-box'),
      render: ({
        custom_css = '',
      }) => {
        return [
          textarea({
            id: 'custom-css',
            value: custom_css,
          }),
          `<p>${ __('Use the <code>popup</code> selector to target elements in your popup.') }</p>`,
        ].join('')
      },
      onMount: ({ custom_css = '' }, updateSetting) => {
        this.codeMirror = codeEditor('#custom-css', {
          onChange: custom_css => {
            updateSetting({ custom_css })
          },
          initialContent: custom_css,
          height: 500,
        })
      },
      css: ({ custom_css = '', id = '' }) => custom_css.replaceAll('popup', `#${ id }`),
    },
  }

  HollerBox.controls = Controls

  const standardPopupContent = `<h1>Subscribe!</h1><p>Your information is secure 🔒. We'll never spam you</p>`

  const Templates = {
    notification_box: {
      id: 'notification_box',
      name: __('Notification'),
      controls: [
        Controls.position,
        Controls.content,
        Controls.avatar,
      ],
      defaults: {
        post_content: '<p>This is a message.</p>',
        position: 'bottom-right',
        avatar: HollerBox.gravatar,
      },
    },
    notification_box_with_button: {
      id: 'notification_box_with_button',
      name: __('Notification with Button'),
      controls: [
        Controls.position,
        Controls.content,
        Controls.avatar,
        Controls.link_button,
      ],
      defaults: {
        post_content: '<p>This is a message.</p>',
        position: 'bottom-right',
        button_text: 'Check it out!',
        avatar: HollerBox.gravatar,
      },
    },
    notification_box_with_form: {
      id: 'notification_box_with_form',
      name: __('Notification with Form'),
      controls: [
        Controls.position,
        Controls.content,
        Controls.avatar,
        Controls.fields,
        Controls.button,
        Controls.submit,
        Controls.integration,
      ],
      defaults: {
        post_content: '<p>This is a message.</p>',
        position: 'bottom-right',
        avatar: HollerBox.gravatar,
        button_text: 'Signup',
        after_submit: 'message',
        success_message: `<p>${ __('Thanks for subscribing!') }</p>`,
      },
    },
    fake_chat: {
      id: 'fake_chat',
      name: __('Fake Chat'),
      controls: [
        Controls.position,
        Controls.avatar,
        Controls.chat_content,
        Controls.submit,
        Controls.integration,
      ],
      defaults: {
        post_content: `<p>${ __('How can we help you?') }</p>`,
        position: 'bottom-right',
        avatar: HollerBox.gravatar,
        after_submit: 'message',
        success_message: `<p>${ __('Your message has been received!') }</p>`,
      },
    },
    popup_custom: {
      id: 'popup_custom',
      name: __('Standard Popup'),
      controls: [
        Controls.position,
        Controls.content,
        Controls.overlay,
      ],
      defaults: {
        post_content: standardPopupContent,
        position: 'center-center',
      },
    },
    popup_standard: {
      id: 'popup_standard',
      name: __('Popup with Form'),
      controls: [
        Controls.position,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.overlay,
        Controls.submit,
        Controls.integration,
      ],
      defaults: {

        post_content: standardPopupContent,
        button_text: 'Subscribe',
        position: 'center-center',
      },
    },
    popup_image_left: {
      id: 'popup_image_left',
      name: __('Popup with Form, Image Left'),
      controls: [
        Controls.position,
        Controls.image,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.overlay,
        Controls.submit,
        Controls.integration,
      ],
      defaults: {
        post_content: standardPopupContent,
        button_text: 'Subscribe',
        position: 'center-center',
        image_src: `${ HollerBox.assets.root }/img/default/woman-yellow.png`,
        image_width: 200,
      },
    },
    popup_image_right: {
      id: 'popup_image_right',
      name: __('Popup with Form, Image Right'),
      controls: [
        Controls.position,
        Controls.image,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.overlay,
        Controls.submit,
        Controls.integration,
        Controls.close_button,
      ],
      defaults: {
        post_content: standardPopupContent,
        button_text: 'Subscribe',
        position: 'center-center',
        image_src: `${ HollerBox.assets.root }/img/default/man-thumbs-up.png`,
        image_width: 200,
      },
    },
    popup_form_below: {
      id: 'popup_form_below',
      name: __('Popup with Image Right, Horizontal Form'),
      controls: [
        Controls.position,
        Controls.image,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.form,
        Controls.close_button,
        Controls.overlay,
        Controls.submit,
        Controls.integration,
      ],
      defaults: {
        post_content: standardPopupContent,
        button_text: 'Subscribe',
        form_color: '#e8eff9',
        position: 'center-center',
        close_button_color: '#ffffff',
        image_src: `${ HollerBox.assets.root }/img/default/woman-working.png`,
        image_width: 300,
      },
    },
    popup_progress_bar: {
      id: 'popup_progress_bar',
      name: __('Popup with Progress Bar'),
      controls: [
        Controls.position,
        Controls.image,
        Controls.content,
        Controls.progress,
        Controls.fields,
        Controls.button,
        Controls.overlay,
        Controls.submit,
        Controls.integration,
      ],
      defaults: {
        post_content: standardPopupContent,
        button_text: 'Subscribe',
        position: 'center-center',
        image_src: `${ HollerBox.assets.root }/img/default/shopping.png`,
        image_width: 300,
      },
    },
    popup_image_beside_text_top: {
      id: 'popup_image_beside_text_top',
      name: __('Popup with Text Above'),
      controls: [
        Controls.position,
        Controls.image,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.form,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        post_content: standardPopupContent,
        button_text: 'Subscribe',
        image_src: `${ HollerBox.assets.root }/img/default/man-working.png`,
        image_width: 300,
        position: 'center-center',
        form_color: '#e8eff9',
      },
    },
    popup_full_image_background: {
      id: 'popup_full_image_background',
      name: __('Popup with Image Background'),
      controls: [
        Controls.position,
        Controls.image,
        Controls.content,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        post_content: standardPopupContent,
        button_text: 'Subscribe',
        image_src: `${ HollerBox.assets.root }/img/default/yellow-gradient.png`,
        position: 'center-center',
      },
    },
  }

  HollerBox.adminTemplates = Templates

  const popupTitle = () => {
    return `<h1 class="holler-title" tabindex="0">
            ${ sprintf(Editor.getPopup().post_status === 'publish' ? __('Editing %s') : __('Creating %s'),
      `<b>${ Editor.getPopup().post_title.length ? Editor.getPopup().post_title : __(
        'Popup title...') }</b>`) }</h1>`
  }

  const renderEditor = () => {

    const actions = () => {

      if (Editor.getPopup().post_status === 'publish') {
        //language=HTML
        return `
            <button class="holler-button danger text" id="disable">${ __('Disable') }</button>
            <button class="holler-button primary" id="save">${ __('Save Changes') }</button>`
      }
      else {
        //language=HTML
        return `
            <button class="holler-button secondary text" id="save">${ __('Save draft') }</button>
            <button class="holler-button action" id="enable">${ __('Publish') }</button>`
      }

    }

    //language=HTML
    return `
        <div id="header">
            <div class="holler">${ icons.hollerbox }</div>
            <div class="inside-header">
                ${ popupTitle() }
                <div class="actions display-flex align-center gap-20">
                    <div id="responsive-controls" class="holler-input-group">
                        <button id="preview-desktop" class="holler-button ${ Editor.previewMode === 'desktop'
                                ? 'primary'
                                : 'secondary' } icon">
                            ${ icons.desktop }
                        </button>
                        <button id="preview-mobile" class="holler-button ${ Editor.previewMode === 'mobile'
                                ? 'primary'
                                : 'secondary' } icon">
                            ${ icons.mobile }
                        </button>
                    </div>
                    ${ actions() }
                    <button id="popup-more" class="holler-button secondary text icon">${ icons.verticalDots }</button>
                </div>
            </div>
        </div>
        <div id="editor">
            <div class="control-wrap">
                <div id="controls"></div>
            </div>
            <div id="frame" class="${ Editor.previewMode === 'desktop'
                    ? 'desktop'
                    : 'mobile' }">
                <iframe id="iframe-preview" src="${ HollerBox.home_url }?suppress_hollerbox=1"></iframe>
            </div>
        </div>`

  }

  const Editor = {

    popup: {},
    previewMode: 'desktop',
    globalControls: [
      Controls.custom_css,
    ],

    // static version of the popup to compare against
    _popup: {},

    getTemplate () {
      return Templates[this.popup.template]
    },

    getPopup () {
      return {
        ...this.getTemplate()?.defaults,
        ...this.popup,
      }
    },

    generateCSS () {
      return this.getControls().map(control => {
        try {
          return control.css(this.getPopup())
        }
        catch (e) {
          return ''
        }
      }).join('').replace(/(\r\n|\n|\r)/gm, '')
    },

    processShortcodeTimeout: null,
    processedContent: '',

    updatePreview (suppressAnimations = true) {

      this.popup.css = this.generateCSS()

      let frame = document.getElementById('iframe-preview')

      const postPreview = () => {
        frame.contentWindow.postMessage({
          popup: {
            ...this.getPopup(),
          },
          suppressAnimations,
        }, '*')
      }

      postPreview()

    },

    init () {
      $('head').append(`<style id="holler-box-overrides"></style>`)

      this.setPopup(HollerBox.popup)
      this.setControlCopy()
      this.setTitle()

      try {
        this.mount()
      }
      catch (e) {

        maybeLog(e)

        if (!Templates.hasOwnProperty(this.popup.template)) {
          confirmationModal({
            canClose: false,
            alert: `<p>${ __(
              'We could not load the editor because the defined template is no longer available.') }</p>`,
            confirmText: __('Change Template'),
            onConfirm: () => {
              selectTemplateModal({
                modalSettings: {
                  canClose: false,
                },
                onSelect: (t) => {
                  this.popup.template = t
                  this.mount()
                },
              })
            },
          })

          return
        }

        confirmationModal({
          canClose: false,
          alert: `<p>${ __('Something went wrong loading the editor') }</p>`,
          onConfirm: () => {

          },
        })

      }
    },

    titleSuffix: '',

    setTitle () {
      if (!this.titleSuffix) {
        this.titleSuffix = document.title
      }

      document.title = `${ this.popup.post_title } ${ this.titleSuffix }`
    },

    setPopup (popup) {

      // Force object {}
      if (typeof popup.triggers !== 'object' || Array.isArray(popup.triggers)) {
        popup.triggers = {}
      }

      // Force object {}
      if (typeof popup.advanced_rules !== 'object' || Array.isArray(popup.advanced_rules)) {
        popup.advanced_rules = {}
      }

      this.popup = {
        display_rules: [],
        ...popup,
        id: `popup-${ popup.ID }`,
      }
    },

    setControlCopy () {
      // Keep static copy
      this._popup = copyObject(this.popup, {})
    },

    hasChanges () {
      return !objectEquals(this.popup, this._popup)
    },

    isAutodraft () {
      return this.popup.post_status === 'auto-draft'
    },

    getControls () {
      return [
        Controls.template,
        ...this.getTemplate().controls,
        ...this.globalControls,
      ]
    },

    mount () {

      const renderControls = () => {
        return [
          ...this.getControls().map(control => controlGroup(control, this.getPopup())),
          // language=HTML
          `
              <button id="edit-display-conditions" class="control-button">${ __('Display Conditions') } <span
                      class="dashicons dashicons-visibility"></span></button>`,
          // language=HTML
          `
              <button id="edit-triggers" class="control-button">${ __('Triggers') } <span
                      class="dashicons dashicons-external"></span></button>`,
        ].join('')
      }

      $('#holler-app').html(renderEditor())

      if (this.popup.template) {
        $('#controls').html(renderControls())

        document.getElementById('iframe-preview').addEventListener('load', () => {
          this.updatePreview(false)
        })
      }

      this.onMount()
    },

    onMount () {

      const $frame = $('#frame')

      const $mobile = $('#preview-mobile')
      const $desktop = $('#preview-desktop')

      $mobile.on('click', e => {
        this.previewMode = 'mobile'
        $desktop.removeClass('primary').addClass('secondary')
        $mobile.removeClass('secondary').addClass('primary')
        $frame.removeClass('desktop').addClass('mobile')
      })

      $desktop.on('click', e => {
        this.previewMode = 'desktop'
        $desktop.addClass('primary').removeClass('secondary')
        $mobile.addClass('secondary').removeClass('primary')
        $frame.addClass('desktop').removeClass('mobile')
      })

      const updateSettings = (newSettings, opts = {}) => {

        const {
          suppressAnimations = true,
          reRenderControls = false,
        } = opts

        this.popup = {
          ...this.popup,
          ...newSettings,
        }

        if (reRenderControls) {
          this.mount()
        }
        else {
          this.updatePreview(suppressAnimations)
        }

      }

      if (!this.popup.template) {
        selectTemplateModal({
          modalSettings: {
            canClose: false,
          },
          onSelect: (template) => {
            updateSettings({
              post_title: Templates[template].name,
              template,
              ...Templates[template].defaults,
            }, { reRenderControls: true, suppressAnimations: false })
          },
        })

        return
      }

      this.getControls().forEach(control => control.onMount(this.getPopup(), updateSettings))

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

      const titleEdit = () => {
        const $title = $('.holler-title')

        $title.on('click', e => {

          const $input = $(input({
            name: 'post_title',
            id: 'post-title',
            className: 'holler-title',
            value: this.popup.post_title,
          }))

          $title.replaceWith($input)

          $input.focus()

          $input.on('blur keydown', e => {

            if (e.type === 'keydown' && e.key !== 'Enter') {
              return
            }

            updateSettings({
              post_title: $input.val(),
            })

            $input.replaceWith(popupTitle())
            this.setTitle()
            titleEdit()

          })

        })
      }

      titleEdit()

      $('#save').on('click', e => {
        this.commit()
      })
      $('#enable').on('click', e => {
        this.enable(updateSettings)
      })
      $('#disable').on('click', e => {
        this.disable()
      })

      let $moreButton = $('#popup-more')
      $moreButton.on('click', e => {
        moreMenu(e.currentTarget, {
          items: [
            { key: 'report', text: __('View Report') },
            { key: 'trash', text: `<span class="holler-text danger">${ __('Trash') }</span>` },
          ],
          onSelect: k => {
            switch (k) {
              case 'report':
                window.open(
                  `${ HollerBox.admin_url }/edit.php?post_type=hollerbox&page=hollerbox_reports#/popup/${ this.popup.ID }/`,
                  '_blank')
                break
              case 'trash':
                window.open(
                  `${ HollerBox.admin_url }/post.php?post=${ this.popup.ID }&action=trash&_wpnonce=${ HollerBox.nonces.trash_post }`,
                  '_self')
                break
            }
          },
        })

      })

    },

    enable (updateSettings) {

      if (!Object.values(this.popup.triggers).some(({ enabled = false }) => enabled)) {

        confirmationModal({
          alert: `<p>${ __('You do not have any triggers enabled, enable a trigger so your popup will display!',
            'holler-box') }</p>`,
          confirmText: __('Edit Triggers', 'holler-box'),
          closeText: __('Publish Anyway', 'holler-box'),
          onConfirm: () => {
            editTriggersModal(this.getPopup(), updateSettings)
          },
          onCancel: () => {
            this.popup.post_status = 'publish'
            return this.commit()
          },
        })

        return
      }

      if (!this.popup.display_rules.length) {

        confirmationModal({
          alert: `<p>${ __(
            'You do not have any active display rules! Add a display rule so visitors will see your popup.',
            'holler-box') }</p>`,
          confirmText: __('Add Display Rules', 'holler-box'),
          closeText: __('Publish Anyway', 'holler-box'),
          onConfirm: () => {
            editDisplayConditionsModal(this.getPopup(), updateSettings)
          },
          onCancel: () => {
            this.popup.post_status = 'publish'
            return this.commit()
          },
        })

        return
      }

      this.popup.post_status = 'publish'
      return this.commit().then(() => this.mount())
    },

    disable () {
      this.popup.post_status = 'draft'
      return this.commit().then(() => this.mount())
    },

    commit () {

      // from auto-draft
      if (this.isAutodraft()) {
        this.popup.post_status = 'draft'
      }

      return apiPatch(`${ HollerBox.routes.popup }/${ this.popup.ID }`, {
        ...this.popup,
      }).then(r => {

        this.setPopup(r)

        this.setControlCopy()

        dialog({
          message: __('Popup saved!'),
        })

        if (window.location.href.match(/post-new\.php/)) {
          window.history.pushState({}, '', `${ HollerBox.admin_url }/post.php?post=${ this.popup.ID }&action=edit`)
        }

      })

    },

  }

  const isValidRegex = (_r) => {
    try {
      new RegExp(_r)
    }
    catch (e) {
      return false
    }

    return true
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
        group: 'special',
      },
      {
        type: ' search_page',
        name: __('Search Page'),
        group: 'special',
      },
      {
        type: 'front_page',
        name: __('Front Page'),
        group: 'special',
      },
      {
        type: 'blog_page',
        name: __('Blog/Posts Page'),
        group: 'special',
      },
      {
        type: 'regex',
        name: __('Custom Regex'),
        group: 'special',
        render: ({ uuid, regex = '' }) => {
          return input({
            id: `${ uuid }-regex`,
            value: regex,
            className: 'full-width',
            placeholder: 'my-page/*',
            style: { marginTop: 10 },
          })
        },
        onMount: ({ uuid, regex }, updateRule) => {

          const $input = $(`#${ uuid }-regex`)

          const maybeInvalid = (_regex) => {
            if (!isValidRegex(_regex)) {
              $input.addClass('invalid')
            }
            else {
              $input.removeClass('invalid')
            }
          }

          $input.on('input', e => {

            let _regex = e.target.value

            updateRule({
              regex: _regex,
            })

            maybeInvalid(_regex)

          })

          maybeInvalid(regex)
        },
      },
    ],
  }

  const itemPicker = (selector, {
    placeholder = __('Type to search...'),
    fetchOptions = (search, resolve) => {},
    selected = [],
    onChange = () => {},
    tags = false,
    noneSelected = __('All'),
    isValidSelection = () => true,
  }) => {

    let $el = $(selector)
    let search = ''
    let options = []

    const renderItem = ({ id, text }) => {
      // language=HTML
      return `
          <div class="holler-picker-item ${ isValidSelection(id) ? '' : 'is-invalid' }">
              <span class="holler-picker-item-text">${ text }</span>
              <span class="holler-picker-item-delete" tabindex="0" data-id="${ id }">&times;</span>
          </div>`
    }

    const render = () => {
      // language=HTML
      return `
          <div class="holler-picker">
              <div class="holler-picker-selected">
                  ${ selected.map(renderItem).join('') }
                  ${ input({
                      className: 'holler-picker-search',
                      value: search,
                      name: 'search',
                      type: 'search',
                      autocomplete: 'off',
                      placeholder: selected.length ? placeholder : noneSelected,
                  }) }
              </div>
              <div class="holler-picker-options"></div>
          </div>`
    }

    const renderOptions = () => {

      let _options = options.filter(opt => !selected.some(_opt => opt.id === _opt.id))

      if (!_options.length) {
        return `
		  <div class="holler-picker-no-options">${ __('No results found...') }</div>`
      }

      // language=HTML
      return _options.map(({
        id,
        text,
      }) => `
          <div class="holler-picker-option" tabindex="0" data-id="${ id }">${ text }</div>`).join('')
    }

    const showOptions = () => {
      const $options = $el.find('.holler-picker-options')

      $options.html(renderOptions())

      $options.find('.holler-picker-option').on('click', e => {
        selectOption(e.currentTarget.dataset.id)
      })

      placeOptions()
    }

    const placeOptions = () => {

      const $options = $el.find('.holler-picker-options')

      const {
        left,
        right,
        top,
        bottom,
      } = $el[0].getBoundingClientRect()

      $options.css({
        maxHeight: window.innerHeight - bottom - 20,
        top: bottom,
        left,
        width: $el.width(),
      })
    }

    const focusSearch = () => {
      $el.find('.holler-picker-search').focus()
    }

    const createOption = (value) => {
      let option = { id: value, text: value }
      options = []
      search = ''
      selected.push(option)
      onChange(selected)
      mount()
      focusSearch()
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
        $picker.find('.holler-picker-options').html(`<div class="holler-picker-no-options">${ __('Searching') }</div>`)

        let { stop } = loadingDots('.holler-picker-no-options')

        placeOptions()

        fetchOptions(search, (opts) => {
          stop()
          setOptions(opts)
        })
      })

      if (tags) {
        $picker.find('.holler-picker-search').on('keydown', e => {
          if (e.key !== 'Enter' && e.key !== ',') {
            return
          }

          createOption(e.target.value)
        })
      }

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
    updateRule = () => {},
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
          selected,
        })
      },
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
        return `<div id="picker-${ uuid }" class="picker-here"></div>`
      },
      onMount: ({ uuid, selected = [] }, updateRule) => {

        termPicker(`#picker-${ uuid }`, {
          selected,
          label,
          term: pt_key,
          type: 'post_type',
          updateRule,
        })
      },
    })

    Object.values(post_type.taxonomies).forEach(tax => {

      SearchesCache[tax.name] = {}

      DisplayConditions.conditions.push({
        type: `${ pt_key }_in_${ tax.name }`,
        name: sprintf(__('In %s'), tax.label),
        group: pt_key,
        render: ({ uuid }) => {
          return `<div id="picker-${ uuid }" class="picker-here"></div>`
        },
        onMount: ({ uuid, selected = [] }, updateRule) => {
          termPicker(`#picker-${ uuid }`, {
            selected,
            label: tax.label,
            term: tax.name,
            type: 'taxonomy',
            updateRule,
          })
        },
      })

    })

    if (post_type.has_archive) {

      // Archive
      DisplayConditions.conditions.push({
        type: `${ pt_key }_archive`,
        name: sprintf(__('%s Archive'), label),
        group: pt_key,
      })
    }

    Object.values(post_type.taxonomies).forEach(tax => {

      DisplayConditions.conditions.push({
        type: `${ tax.name }_archive`,
        name: sprintf(__('%s Archive'), tax.label),
        group: pt_key,
        render: ({ uuid }) => {
          return `<div id="picker-${ uuid }" class="picker-here"></div>`
        },
        onMount: ({ uuid, selected = [] }, updateRule) => {
          termPicker(`#picker-${ uuid }`, {
            selected,
            label: tax.label,
            term: tax.name,
            type: 'taxonomy',
            updateRule,
          })
        },
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
        return `<label>${ sprintf(__('Show up to %s times'), input({ type: 'number', id: 'times', value: times })) }`
      },
      onMount: (trigger, updateTrigger) => {
        $('#times').on('change', e => {
          updateTrigger({
            times: e.target.value,
          })
        })
      },
    },
    show_after_x_page_views: {
      name: __('Show after X page views'),
      controls: ({ views = 0 }) => {
        //language=HTML
        return `<label>${ sprintf(__('Show after %s views'), input({ type: 'number', id: 'views', value: views })) }`
      },
      onMount: (trigger, updateTrigger) => {
        $('#views').on('change', e => {
          updateTrigger({
            views: e.target.value,
          })
        })
      },
    },
    show_for_x_visitors: {
      name: __('Show for X visitors'),
      controls: ({ visitor = 'all' }) => {
        //language=HTML
        return select({ id: 'visitor' }, {
          all: __('All'),
          logged_in: __('Logged-in only'),
          logged_out: __('Logged-out only'),
        }, visitor)
      },
      onMount: (trigger, updateTrigger) => {
        $('#visitor').on('change', e => {
          updateTrigger({
            visitor: e.target.value,
          })
        })
      },
    },
    show_to_new_or_returning: {
      name: __('Show to New or Returning'),
      controls: ({ visitor = 'all' }) => {
        //language=HTML
        return select({ id: 'nor-visitor' }, {
          all: __('All'),
          new: __('New visitors'),
          returning: __('Returning visitors'),
        }, visitor)
      },
      onMount: (trigger, updateTrigger) => {
        $('#nor-visitor').on('change', e => {
          updateTrigger({
            visitor: e.target.value,
          })
        })
      },
    },
    show_on_x_devices: {
      name: __('Show on X devices'),
      controls: ({ device = 'all' }) => {
        //language=HTML
        return select({ id: 'device' }, {
          all: __('All'),
          desktop: __('Desktop only'),
          mobile: __('Mobile only'),
        }, device)
      },
      onMount: (trigger, updateTrigger) => {
        $('#device').on('change', e => {
          updateTrigger({
            device: e.target.value,
          })
        })
      },
    },
    hide_if_converted: {
      name: __('Hide if previously converted'),
      controls: () => '',
      onMount: () => {},
    },
    hide_if_closed: {
      name: __('Hide if previously closed'),
      controls: () => '',
      onMount: () => {},
    },
  }

  if (isGroundhoggInstalled()) {
    AdvancedDisplayRules.groundhogg = {
      name: __('Show only to Groundhogg contacts'),
      controls: ({ filters = [] }) => {
        //language=HTML
        return `
            <button class="holler-button secondary small" id="edit-groundhogg-filters">${ __('Edit Filters') }</button>`
      },
      onMount: (trigger, updateTrigger) => {

        $('#edit-groundhogg-filters').on('click', e => {

          modal({
            width: 500,
            // language=HTML
            content: `
                <div class="holler-header">
                    <h3>${ __('Edit Groundhogg Filters') }</h3>
                    <button class="holler-button secondary text icon holler-modal-button-close"><span
                            class="dashicons dashicons-no-alt"></span>
                    </button>
                </div>
                <div id="holler-groundhogg-filters"></div>`,
            dialogClasses: 'overflow-visible has-header',
            onOpen: () => {
              createFilters('#holler-groundhogg-filters', trigger?.filters || [], (filters) => {
                updateTrigger({
                  filters,
                })
              }).init()
            },
          })

        })

      },
    }
  }

  const renderDisplayRule = (rule, i) => {

    let extraUI = ''

    try {
      extraUI = DisplayConditions.conditions.find(c => c.type === rule.type).render({
        ...rule,
        i,
      })
    }
    catch (e) {

    }

    //language=HTML
    return `
        <div class="rule">
            <div class="display-flex gap-10">
                <select data-i=${ i } class="full-width change-type" name="type">
                    ${ Object.keys(DisplayConditions.groups).map(g => {

                        let types = DisplayConditions.conditions.filter(t => t.group === g)
                        let opts = types.map(t => `<option value="${ t.type }" ${ rule.type === t.type
                                ? 'selected'
                                : '' }>${ t.name }</option>`)

                        return `<optgroup label="${ DisplayConditions.groups[g] }">${ opts }</optgroup>`
                    }) }
                </select>
                <button data-i=${ i } class="holler-button secondary text icon delete-display-rule"><span
                        class="dashicons dashicons-dismiss"></span>
                </button>
            </div>
            ${ extraUI }
        </div>`
  }

  const editDisplayConditionsModal = ({
    display_rules = [],
    exclude_rules = [],
    advanced_rules = {},
  }, updateSettings) => {

    const rulesEditor = (selector, {
      rules = [],
      onUpdate = (rules) => {},
    }) => {

      const $el = $(selector)

      const commitRules = () => {
        onUpdate(rules)
      }

      const updateRule = (i, ruleSettings, reRender = false) => {
        rules[i] = {
          ...rules[i],
          ...ruleSettings,
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
        $el.html(`<div class="rules">${ rules.map((rule, i) => renderDisplayRule(rule, i)).join('') }</div>`).
          append(`<button class="holler-button secondary add-rule">${ __('Add Rule') }</button>`)

        $el.find('.change-type').on('change', e => {
          updateRule(parseInt(e.target.dataset.i), {
            type: e.target.value,
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
              i,
            }, (settings) => {
              updateRule(i, settings)
            })
          }
          catch (e) {}
        })

        $el.find('.add-rule').on('click', e => {
          rules.push({
            type: 'entire_site',
            uuid: uuid(),
          })

          commitRules()

          mountRules()
        })
      }

      mountRules()
    }

    const proConditionsAd = () => {
      //language=HTML
      return `
          <div class="holler-pro-ad">
              Unlock popup <b>Scheduling</b> with <b><a href="https://hollerwp.com/pricing/" target="_blank">HollerBox
              Pro!</a></b>
          </div>`
    }

    modal({
      //language=HTML
      width: 800,
      dialogClasses: 'no-padding',
      //language=HTML
      content: `
          <div class="holler-header is-sticky">
              <h3>${ __('Edit Display Conditions') }</h3>
              <button class="holler-button secondary text icon holler-modal-button-close"><span
                      class="dashicons dashicons-no-alt"></span>
              </button>
          </div>
          <table class="display-conditions-grid">
              <tr>
                  <th>${ __('Include') }</th>
                  <td>
                      <div id="include-rules"></div>
                  </td>
              </tr>
              <tr>
                  <th>${ __('Exclude') }</th>
                  <td>
                      <div id="exclude-rules"></div>
                  </td>
              </tr>
              <tr>
                  <th>${ __('Advanced') }</th>
                  <td id="triggers">
                      ${ Object.keys(AdvancedDisplayRules).map(t => renderTrigger({
                          id: t,
                          ...AdvancedDisplayRules[t],
                      }, advanced_rules[t], advanced_rules[t] ? advanced_rules[t].enabled : false)).join('') }
                      ${ isPro() ? '' : proConditionsAd() }
                  </td>
              </tr>
          </table>`,
      onOpen: () => {

        rulesEditor('#include-rules', {
          rules: display_rules.filter(r => r?.type),
          onUpdate: (display_rules) => {
            updateSettings({
              display_rules,
            })
          },
        })

        rulesEditor('#exclude-rules', {
          rules: exclude_rules.filter(r => r?.type),
          onUpdate: (exclude_rules) => {
            updateSettings({
              exclude_rules,
            })
          },
        })

        const updateTrigger = (t, settings) => {
          advanced_rules[t] = {
            ...advanced_rules[t],
            ...settings,
          }

          updateSettings({
            advanced_rules,
          })
        }

        Object.keys(AdvancedDisplayRules).forEach(t => {
          try {
            AdvancedDisplayRules[t].onMount(advanced_rules[t], (settings) => {
              updateTrigger(t, settings)
            })
          }
          catch (e) {
          }
        })

        $('[name="toggle-trigger"]').on('change', e => {
          if (e.target.checked) {
            $(`.trigger[data-id=${ e.target.dataset.trigger }]`).addClass('enabled')
            updateTrigger(e.target.dataset.trigger, { enabled: true })
          }
          else {
            $(`.trigger[data-id=${ e.target.dataset.trigger }]`).removeClass('enabled')
            updateTrigger(e.target.dataset.trigger, { enabled: false })
          }
        })
      },
    })
  }

  const Triggers = {
    on_page_load: {
      name: __('On Page Load'),
      controls: ({ delay = 0 }) => {
        //language=HTML
        return `<label>${ sprintf(__('Show after %s seconds'), input({ type: 'number', id: 'delay', value: delay })) }`
      },
      onMount: (trigger, updateTrigger) => {
        $('#delay').on('change', e => {
          updateTrigger({
            delay: e.target.value,
          })
        })
      },
    },
    element_click: {
      name: __('On Click'),
      controls: ({ selector }) => {
        //language=HTML
        return `<label>${ sprintf(__('Clicked element %s'), input({
            placeholder: '.my-class',
            id: 'selector',
            value: selector,
        })) } ${ select({
            id: 'trigger_multiple',
        }, {
            once: 'Trigger Once',
            multiple: 'Trigger Multiple Times',
        }) }`
      },
      onMount: (trigger, updateTrigger) => {
        $('#selector').on('change', e => {
          updateTrigger({
            selector: e.target.value,
          })
        })
        $('#trigger_multiple').on('change', e => {
          updateTrigger({
            trigger_multiple: e.target.value,
          })
        })
      },
    },
    scroll_detection: {
      name: __('On Scroll'),
      controls: ({ depth = 50 }) => {
        //language=HTML
        return `<label>${ sprintf(__('Scrolled past %s'), input({
            type: 'number',
            min: 0,
            max: 100,
            placeholder: '50',
            id: 'scroll-depth',
            value: depth,
        })) } %`
      },
      onMount: (trigger, updateTrigger) => {
        $('#scroll-depth').on('change', e => {
          updateTrigger({
            depth: e.target.value,
          })
        })
      },
    },
    exit_intent: {
      name: __('On Page Exit Intent'),
      controls: () => '',
    },
  }

  const renderTrigger = (trigger, settings = {}, enabled) => {
    //language=HTML
    return `
        <div class="trigger ${ enabled ? 'enabled' : '' }" data-id="${ trigger.id }">
            <div class="name">${ trigger.name }</div>
            <div class="controls">
                ${ trigger.controls(settings) }
            </div>
            <div class="enabled">${ toggle({
                className: 'toggle-trigger',
                name: 'toggle-trigger',
                dataTrigger: trigger.id,
                value: 1,
                checked: enabled,
            }) }
            </div>
        </div>`
  }

  const proTriggersAd = () => {
    //language=HTML
    return `
        <div class="holler-pro-ad">
            Unlock the <b>Inactivity</b> trigger with <b><a href="https://hollerwp.com/pricing/" target="_blank">HollerBox
            Pro!</a></b>
        </div>`
  }

  const editTriggersModal = ({
    triggers = {},
  }, updateSettings) => {

    modal({
      width: 800,
      dialogClasses: 'has-header',
      //language=HTML

      content: `
          <div class="holler-header">
              <h3>${ __('Edit Triggers') }</h3>
              <button class="holler-button secondary text icon holler-modal-button-close"><span
                      class="dashicons dashicons-no-alt"></span>
              </button>
          </div>
          <div id="triggers">
              ${ Object.keys(Triggers).map(t => renderTrigger({
                  id: t,
                  ...Triggers[t],
              }, triggers[t], triggers[t] ? triggers[t].enabled : false)).join('') }
              ${ isPro() ? '' : proTriggersAd() }
          </div>`,
      onOpen: () => {

        const updateTrigger = (t, settings) => {
          triggers[t] = {
            ...triggers[t],
            ...settings,
          }

          updateSettings({
            triggers,
          })
        }

        Object.keys(Triggers).forEach(t => {
          try {
            Triggers[t].onMount(triggers[t], (settings) => {
              updateTrigger(t, settings)
            })
          }
          catch (e) {
          }
        })

        $('[name="toggle-trigger"]').on('change', e => {
          if (e.target.checked) {
            $(`.trigger[data-id=${ e.target.dataset.trigger }]`).addClass('enabled')
            updateTrigger(e.target.dataset.trigger, { enabled: true })
          }
          else {
            $(`.trigger[data-id=${ e.target.dataset.trigger }]`).removeClass('enabled')
            updateTrigger(e.target.dataset.trigger, { enabled: false })
          }
        })
      },
    })

  }

  window.addEventListener('beforeunload', e => {

    event.preventDefault()

    if (Editor.hasChanges()) {

      console.log(Editor.hasChanges())

      let msg = __('You have unsaved changes, are you sure you want to leave?')
      e.returnValue = msg
      return msg
    }

    return null

  })

  $(() => {
    Editor.init()
  })

  HollerBox.editor = Editor

  HollerBox._editor = {
    Controls,
    Templates,
    Integrations,
    AdvancedDisplayRules,
    DisplayConditions,
    Triggers,
  }

  HollerBox._helpers = {
    itemPicker,
    termPicker,
    apiDelete,
    apiPatch,
    apiGet,
    apiPost,
    singleControl,
  }

} )(jQuery)
