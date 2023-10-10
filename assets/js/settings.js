( ($) => {

  const {
    icons,
    toggle,
    input,
    tinymceElement,
    textarea,
    dialog,
    select,
    confirmationModal,
    tooltip
  } = HollerBox.elements

  const { __, sprintf } = wp.i18n

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

    let __params = new URLSearchParams()

    Object.keys(params).forEach(k => {
      __params.append(k, params[k])
    })

    const response = await fetch(route + '?' + __params, {
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

    data.append( 'holler_admin_ajax_nonce', HollerBox.nonces._adminajax )

    const response = await fetch(ajaxurl, {
      method: 'POST',
      credentials: 'same-origin',
      body: data,
      ...opts,
    })

    return response.json()
  }

  /**
   * There can be only one!
   *
   * @param items
   * @returns {any[]}
   */
  const arrayUnique = (items) => {
    let set = new Set(items)
    return [...set]
  }

  const skipButton = (text) => {
    // language=HTML
    return `
        <div class="display-flex center" style="margin-top: 40px">
            <button id="skip" class="holler-button secondary text">
                ${ text }
            </button>
        </div>`
  }

  const setupPage = ({
    title = '',
    render = () => {},
    onMount = () => {},
    onSkip = () => {},
    onNext = () => {},
    showButtons = true,
    ...rest
  }) => ( {
    ...rest,
    render: () => {

      const buttons = () => {

        if (!showButtons) {
          return ''
        }

        // language=HTML
        return `
            <div class="display-flex flex-end gap-10" style="margin-top: 30px">
                <button id="skip" class="holler-button secondary text">${ __('Skip') }</button>
                <button id="next" class="holler-button primary">${ __('Next') }</button>
            </div>`
      }

      // language=HTML
      return `
          <div class="setup-page">
              <div id="logo">
                  ${ icons.hollerbox_full }
              </div>
              <div class="page-inner">
                  <div class="holler-panel">
                      <div class="inside">
                          <h1>${ title }</h1>
                          ${ render() }
                          ${ buttons() }
                      </div>
                  </div>
              </div>
          </div>`
    },
    onMount: (...args) => {
      onMount(...args)
      $('#skip').on('click', e => onSkip(...args))
      $('#next').on('click', e => onSkip(...args))
    },

  } )

  let settings = {
    cookie_name: 'viewed_cookie_policy',
    cookie_value: 'yes',
    cookie_compliance: false,
    is_legacy_user: false,
    setup_complete: false,
    license: '',
    is_licensed: false,
    credit_disabled: false,
    telemetry_subscribed: false,
    telemetry_email: HollerBox.currentUser.data.user_email,
    gdpr_enabled: false,
    script_debug_mode: false,
    delete_all_data: false,
    disable_all: false,
    gdpr_text: `<p>I consent to the terms and conditions.</p>`,
    stacked_delay: 5,
    cookie_lifetime: 1,
    cookie_lifetime_period: 'months',
    ...HollerBox.settings,
    set (_new) {
      settings = {
        ...settings,
        ..._new,
      }
    },
  }

  const setup_answers = {
    role: '',
    business: '',
    license: settings.license,
    telemetry_subscribed: settings.telemetry_subscribed,
    marketing_subscribed: true,
    subscribed: settings.telemetry_subscribed,
    install_groundhogg: true,
    install_mailhawk: true,
    email: settings.telemetry_email,
  }

  const saveSettings = () => {
    return apiPost(HollerBox.routes.settings, {
      settings,
    })
  }

  const pages = [
    {
      slug: /settings/,
      render: () => {

        const utmSource = '?utm_source=settings_page&utm_medium=link&utm_campaign=hollerbox'

        const links = [
          ['https://hollerwp.com', 'dashicons dashicons-admin-site', 'HollerWP.com'],
          ['https://hollerbox.helpscoutdocs.com/', 'dashicons dashicons-media-document', 'Documentation'],
          ['https://hollerwp.com/pricing/', 'dashicons dashicons-store', 'Pricing'],
          ['https://hollerwp.com/account/support/', 'dashicons dashicons-sos', 'Support'],
          ['https://hollerwp.com/account/', 'dashicons dashicons-admin-users', 'My Account'],
          [
            'https://hollerwp.com/improvements-are-coming-with-hollerbox-2-0-new-editor-new-features-reporting-and-more/',
            'dashicons dashicons-star-filled',
            'What\'s new in 2.0?',
          ],
        ]

        const links2 = [
          ['https://groundhogg.io', icons.groundhogg, 'Groundhogg - CRM'],
          ['https://mailhawk.io', icons.mailhawk_bird, 'MailHawk - SMTP'],
        ]

        let expiry

        if (settings.license_expiry === 'lifetime') {
          expiry = 'never'
        }
        else {

          try {
            expiry = new Date(settings.license_expiry)
          }
          catch (e) {
            expiry = new Date()
          }

          expiry = expiry.toLocaleDateString()

        }

        // language=HTML
        return `
            <div class="holler-header is-sticky">
                <div id="logo">
                    <a href="https://hollerwp.com" target="_blank">${ icons.hollerbox_full }</a>
                </div>
                <button id="save-settings" class="holler-button medium primary">${ __('Save Changes') }</button>
            </div>
            <div class="display-flex" id="page">
                <div id="settings">

                    <div class="holler-panel">
                        <div class="holler-panel-header">
                            <h2>${ __('License') }</h2>
                        </div>
                        <div class="inside">
                            <p>${ settings.is_licensed ? ( sprintf(__('🎉 Your license is valid and expires %s.'),
                                            expiry) ) :
                                    sprintf(__(
                                                    'Enter your license key to receive updates and support for HollerBox - %s.'),
                                            HollerBox.installed.legacy ? 'Legacy' : 'Pro') }</p>
                            <div class="display-flex gap-10">
                                ${ input({
                                    id: 'license',
                                    className: 'full-width',
                                    type: settings.license ? 'password' : 'text',
                                    placeholder: __('Your license key'),
                                    value: settings.license,
                                    readonly: settings.is_licensed,
                                }) }
                                <button
                                        id="${ settings.is_licensed ? 'deactivate' : 'activate' }"
                                        class="holler-button ${ settings.is_licensed ? 'secondary' : 'primary' }">
                                    ${ settings.is_licensed ? __('Deactivate') : __('Activate') }
                                </button>
                            </div>
                            <!-- If licensed and pro is not installed, prompt to install pro -->
                            ${ HollerBox.installed.hollerBoxPro || ! settings.is_licensed ? '' : `<p>🚨️ ${__('You can <a href="https://help.hollerwp.com/article/604-pro-how-to-install-the-pro-plugin">install HollerBox Pro</a> and access additional templates and features!')}</p>` }
                        </div>
                    </div>
                    <div class="holler-panel">
                        <div class="holler-panel-header">
                            <h2>${ __('General') }</h2>
                        </div>
                        <div class="inside">
                            <div class="display-flex gap-20">
                                <div>
                                    <p><b><label>${ __('Stacked Popup Delay (in seconds)') }</label></b></p>
                                    ${ input({
                                        id: 'stacked-delay',
                                        name: 'stacked_delay',
                                        className: 'full-width text-setting',
                                        value: settings.stacked_delay,
                                        type: 'number',
                                        placeholder: 5,
                                    }) }
                                    <p>
                                        ${ __('Force a delay between popups that are triggered at the same time.',
                                                'holler-box') }</p>
                                </div>
                            </div>
                            <div class="disable-credit ${ settings.is_licensed ? '' : 'disable-changes' }">
                                <label class="display-flex gap-20"><b>${ __(
                                        'Hide the <span class="credit">⚡ by HollerBox</span> attribution') }</b>
                                    ${ toggle({
                                        name: 'credit_disabled',
                                        className: 'setting-toggle',
                                        checked: settings.credit_disabled,
                                    }) }</label>
                                <p>${ __('Can only be disabled when HollerBox is licensed.', 'holler-box') }</p>
                            </div>
                            <label class="display-flex gap-20"><b>${ __('Send anonymous telemetry') }</b>
                                ${ toggle({
                                    name: 'telemetry_subscribed',
                                    className: 'setting-toggle',
                                    checked: settings.telemetry_subscribed,
                                }) }</label>
                            <p>
                                ${ __('Occasionally send HollerBox non-sensitive information about your site so we can improve our plugin and provide you with a better experience.',
                                        'holler-box') }</p>
                        </div>
                    </div>
                    <div class="holler-panel">
                        <div class="holler-panel-header">
                            <h2>${ __('GDPR') }</h2>
                        </div>
                        <div class="inside">
                            <label class="display-flex gap-20"><b>${ __('Enable GDPR Consent') }</b>
                                ${ toggle({
                                    name: 'gdpr_enabled',
                                    className: 'setting-toggle',
                                    checked: settings.gdpr_enabled,
                                }) }</label>
                            <p>${ __('Show a GDPR consent checkbox on all forms.', 'holler-box') }</p>
                            <p><b>${ __('GDPR Consent Text') }</b></p>
                            ${ textarea({
                                id: 'gdpr-text',
                                value: settings.gdpr_text,
                            }) }
                        </div>
                    </div>
                    <div class="holler-panel">
                        <div class="holler-panel-header">
                            <h2>${ __('Cookie Settings') }</h2>
                        </div>
                        <div class="inside">
                            <p><b><label>${ __('Cookie Lifetime') }</label></b></p>
                            <div class="holler-input-group">
                                ${ input({
                                    type: 'number',
                                    id: 'cookie-lifetime',
                                    name: 'cookie_lifetime',
                                    className: 'text-setting',
                                    value: settings.cookie_lifetime,
                                }) }
                                ${ select({
                                    id: 'cookie-lifetime-period',
                                    name: 'cookie_lifetime_period',
                                    className: 'text-setting',
                                    selected: settings.cookie_lifetime_period,
                                    options: {
                                        days: 'Days',
                                        weeks: 'Weeks',
                                        months: 'Months',
                                        years: 'Years',
                                    },
                                }) }
                            </div>
                            <p>
                                ${ __('How long the HollerBox tracking cookies should last in the browser.',
                                        'holler-box') }</p>
                        </div>
                        <hr/>
                        <div class="inside">
                            <label class="display-flex gap-20"><b>${ __('Enable Cookie Compliance') }</b>
                                ${ toggle({
                                    name: 'cookie_compliance',
                                    className: 'setting-toggle',
                                    checked: settings.cookie_compliance,
                                }) }</label>
                            <p>
                                ${ __('If you are using a cookie consent plugin such as <b>CookieYes</b> then this will prevent popups until cookies are accepted.',
                                        'holler-box') }</p>
                            <div class="display-flex gap-20">
                                <div>
                                    <p><b><label>${ __('Cookie Name') }</label></b></p>
                                    ${ input({
                                        id: 'cookie-name',
                                        name: 'cookie_name',
                                        className: 'full-width text-setting',
                                        value: settings.cookie_name,
                                    }) }
                                    <p>${ __('Name of the cookie where consent is stored.', 'holler-box') }</p>
                                </div>
                                <div>
                                    <p><b><label>${ __('Cookie Value') }</label></b></p>
                                    ${ input({
                                        id: 'cookie-value',
                                        name: 'cookie_value',
                                        className: 'full-width text-setting',
                                        value: settings.cookie_value,
                                    }) }
                                    <p>${ __('Value of the cookie indicating consent was given.', 'holler-box') }</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="holler-panel danger-zone">
                        <div class="holler-panel-header">
                            <h2>⚠️ ${ __('Danger Zone') }</h2>
                        </div>
                        <div class="inside">
                            <label class="display-flex gap-20"><b>${ __('Enable Script Debug') }</b>
                                ${ toggle({
                                    name: 'script_debug_mode',
                                    className: 'setting-toggle',
                                    checked: settings.script_debug_mode,
                                }) }</label>
                            <p>${ __('Use non-minified JS files for debugging purposes.', 'holler-box') }</p>
                            <label class="display-flex gap-20"><b>${ __('Delete all data when uninstalling') }</b>
                                ${ toggle({
                                    name: 'delete_all_data',
                                    className: 'setting-toggle',
                                    checked: settings.delete_all_data,
                                }) }</label>
                            <p>${ __('The will delete all popups, reports, and options associated with HollerBox.',
                                    'holler-box') }</p>
                            <label class="display-flex gap-20"><b>${ __('Temporarily disable all popups') }</b>
                                ${ toggle({
                                    name: 'disable_all',
                                    className: 'setting-toggle',
                                    checked: settings.disable_all,
                                }) }</label>
                            <p>
                                ${ __('Disable all active popups. This is only temporary and when turned off all popups will become active again.',
                                        'holler-box') }</p>
                        </div>
                    </div>
                </div>
                <div id="right">
                    <div class="holler-panel">
                        <div class="holler-panel-header">
                            <h2>${ __('Helpful Links') }</h2>
                        </div>
                        <div class="display-flex column holler-menu">
                            ${ links.map(
                                    ([href, dashicon, text]) => `<a href="${ href +
                                    utmSource }" target="_blank"><span class="${ dashicon }"></span> ${ text }</a>`).
                                    join('') }
                        </div>
                    </div>
                    <div class="holler-panel">
                        <div class="holler-panel-header">
                            <h2>${ __('Recommend Plugins') }</h2>
                        </div>
                        <div class="display-flex column holler-menu">
                            ${ links2.map(
                                    ([href, icon, text]) => `<a href="${ href +
                                    utmSource }" target="_blank">${ icon } ${ text }</a>`).join('') }
                        </div>
                    </div>
	                <div class="holler-panel">
		                <div class="holler-panel-header">
			                <h2>${ __('Tools') }</h2>
		                </div>
		                <div class="display-flex column holler-menu">
			                <a href="#" id="clear-user-cache"><span class="dashicons dashicons-trash"></span>${__('Clear user stats cache')}</a>
		                </div>
	                </div>
                </div>
            </div>
        `
      },
      onMount: (params, setPage) => {

        let license = ''

        $('#activate').on('click', e => {

          apiPost(HollerBox.routes.licensing, {
            license,
          }).then(r => {

            if (!r.success) {
              return
            }

            settings.set(r.license_data)
            setPage('/settings/')

            dialog({
              message: __('License Activated!'),
            })

          }).catch(e => {
            dialog({
              message: e.message,
              type: 'error',
            })
          })

        })
        $('#deactivate').on('click', e => {

          apiPost(HollerBox.routes.licensing, {}, {
            method: 'DELETE',
          }).then(r => {

            if (!r.success) {
              return
            }

            settings.set({
              is_licensed: false,
              license: '',
            })
            setPage('/settings/')

            dialog({
              message: __('License deactivated!'),
            })

          }).catch(e => {
            dialog({
              message: e.message,
              type: 'error',
            })
          })

        })

        $('#license').on('input', e => license = e.target.value)

        $('#save-settings').on('click', e => {
          saveSettings().then(r => {
            dialog({
              message: 'Settings saved!',
            })
          })
        })

        $('.setting-toggle').on('change', e => {
          settings.set({
            [e.target.name]: e.target.checked,
          })
        })

        $('.text-setting').on('change', e => {
          settings.set({
            [e.target.name]: e.target.value,
          })
        })

        wp.editor.remove('gdpr-text')
        tinymceElement('gdpr-text', {}, (content) => {
          settings.gdpr_text = content
        })

        tooltip( '#clear-user-cache', {
          content: __('The IDs of closed and converted popups are<br/> stored in <code>usermeta</code> for logged in users to<br/> improve visibility accuracy. Clear the cache to<br/> reset the stats for all users.'),
          position: 'left'
        })

        $('#clear-user-cache').on('click', e => {
          e.preventDefault()
          confirmationModal({
            alert: `<p>${__('Are you sure? This will delete any stats for closed and converted popups for all users.', 'holler-box' )}</p>`,
            confirmText: __('Clear'),
            onConfirm: () => {
              adminAjax({
                action: 'holler_clear_user_stats_cache'
              }).then( r => {
                if ( r.success ){
                  dialog({
                    message: __('Cache cleared!', 'holler-box')
                  })
                }
              }).catch( e => {
                dialog({
                  type: 'error',
                  message: e.message
                })
              })
            }
          })
        })
      },
    },

    /**
     * Start HollerBox Setup
     */
    setupPage({
      title: __('🎉 Thanks for Choosing HollerBox'),
      slug: /s\/start/,
      showButtons: false,
      render: () => {
        // language=HTML
        return `
            <p>
                ${ __('In just a few minutes you\'ll be creating popups with HollerBox and generating more leads and sales! Click the button below to start the guided setup.') }
            </p>
            <div class="display-flex center" style="margin-top: 30px">
                <button id="start" class="holler-button primary big">${ __('Let\'s get started!') }</button>
            </div>
        `
      },
      onMount: (params, setPage) => {
        $('#start').on('click', e => setPage('/s/role/'))
      },
    }),

    /**
     * Explain changes in HollerBox 2.0
     */
    setupPage({
      title: __('Changes in HollerBox 2.0'),
      slug: /legacy-user/,
      showButtons: false,
      render: () => {
        // language=HTML
        return `
            <p>
                ${ __('Hi there, we have made some big changes to HollerBox in 2.0 that might affect you! Please read the changes to make sure your popups continue to function as expected.') }</p>
            <h2>🍾 ${ __('WHAT\'S NEW IN HOLLERBOX 2.0?') }</h2>
            <p>
                ${ __('For a full breakdown, we recommend reading our <a href="https://hollerwp.com/improvements-are-coming-with-hollerbox-2-0-new-editor-new-features-reporting-and-more/" target="_blank">2.0 press release</a>.') }</p>
            <ul>
                <li>${ __('New visual popup builder') }</li>
                <li>${ __('New visibility controls') }</li>
                <li>${ __('More/New layouts and templates') }</li>
                <li>${ __('Groundhogg Integration') }</li>
                <li>${ __('Zapier Integration') }</li>
                <li>${ __('Webhook Integration') }</li>
                <li>${ __('Better emails') }</li>
                <li>${ __('And more!') }</li>
            </ul>
            <h2>⚠️ BREAKING CHANGES</h2>
            <p>
                ${ __('The underlying architecture of HollerBox has changed drastically, so we recommend reviewing your active popups to ensure that they were migrated successfully.') }</p>
            <p>
                ${ __('Some features have been removed from the <b>free</b> version of HollerBox and moved to <b>Pro</b>.') }</p>
            <p><b>${ __('What was moved to Pro?') }</b></p>
            <ul>
                <li>${ __('ActiveCampaign integration') }</li>
                <li>${ __('ConvertKit integration') }</li>
                <li>${ __('MailChimp Integration') }</li>
                <li>${ __('MailPoet Integration') }</li>
            </ul>
            <p><b>${ __('Pro users') }</b></p>
            <p>
                ${ __('If you have a pro license, <a href="#" target="_blank"><u>install or update HollerBox Pro</u></a> to regain access to these integrations immediately (if you not have already done so).') }</p>
            <p>
            <p><b>${ __('Why were these features removed from the free version?') }</b></p>
            <p>
                ${ __('We want HollerBox to be a sustainable business, so we added some features to the free version, while moving others to paid.') }</p>
            <div class="display-flex center" style="margin-top: 30px">
                <button class="holler-button primary big" id="continue">${ __('Sounds good! Continue to HollerBox') }
                </button>
            </div>
        `
      },
      onMount: (params, setPage) => {

        $('#continue').on('click', e => {

          settings.set({
            legacy_user_agreed: true,
          })

          saveSettings()

          setPage('/s/start/')
        })
      },
    }),

    /**
     * Apply for a legacy-license
     */
    setupPage({
      title: __('Obtain a Legacy license'),
      slug: /legacy-license\/?$/,
      showButtons: false,
      render: () => {
        // language=HTML
        return `
            <p>
                ${ __('We want to make obtaining a Legacy License as simple as possible so you can continue to be successful with HollerBox!') }</p>
            <h2>${ __('WHAT IS A LEGACY LICENSE?') }</h2>
            <p>
                ${ __('A Legacy license will give you access to features that used to be free but are now part of the Pro version, specifically...') }</p>
            <ul>
                <li>${ __('ActiveCampaign integration') }</li>
                <li>${ __('ConvertKit integration') }</li>
                <li>${ __('MailChimp Integration') }</li>
                <li>${ __('MailPoet Integration') }</li>
            </ul>
            <p>${ __('The Legacy License...') }</p>
            <ul>
                <li>${ __('Does not expire') }</li>
                <li>${ __('Can be used on up to 3 sites') }</li>
            </ul>
            <h2>What is NOT included with a Legacy License</h2>
            <p>With a Legacy license you will not receive other Pro features such as...</p>
            <ul>
                <li>${ __('Premium support') }</li>
                <li>${ __('Advanced layouts and templates') }</li>
                <li>${ __('Popup Scheduling') }</li>
                <li>${ __('Inactivity Trigger') }</li>
                <li>${ __('And more...') }</li>
            </ul>
            <h2>${ __('Obtain your license') }</h2>
            <p>Obtain a license by filling out the details below.</p>
            <div class="inside display-flex column gap-10">
                <div class="holler-rows-and-columns">
                    <div class="row">
                        <div class="col">
                            <label>Your Name</label>
                            ${ input({
                                placeholder: 'John Doe',
                                name: 'name',
                                className: 'holler-input',
                            }) }
                        </div>
                        <div class="col">
                            <label>Your Email Address</label>
                            ${ input({
                                type: 'email',
                                placeholder: 'Your email address',
                                value: setup_answers.email,
                                name: 'email',
                                className: 'holler-input',
                            }) }
                        </div>
                    </div>
                </div>
                <button id="apply" class="holler-button primary medium">${ __('Apply Now') }</button>
            </div>
            ${ skipButton('Actually, I don\'t need a legacy license') }
        `
      },
      onSkip: (p, setPage) => setPage('/s/start/'),
      onMount: (params, setPage) => {

        let data = {
          name: '',
          email: setup_answers.email,
        }

        $('.holler-input').on('change input', e => {
          data[e.target.name] = e.target.value
        })

        $('#apply').on('click', e => {

          apiPost(HollerBox.routes.root + '/telemetry/legacy', data)

          setPage('/legacy-license/next/')

        })

      },
    }),

    /**
     * Legacy License Next Steps
     */
    setupPage({
      title: __('Use Your Legacy license'),
      slug: /legacy-license\/next/,
      showButtons: false,
      render: () => {
        // language=HTML
        return `
            <p>
                ${ __('We are sending you an email to your inbox with instructions on how to obtain your legacy license and use it!') }</p>
            <p>${ __('The subject line is <b>"[HollerBox] Legacy License Next Steps"</b>') }</p>
            <p>${ __('You have until <b>August 31st, 2022</b> to claim and activate your Legacy License.') }</p>
            ${ skipButton('✅ I understand, continue setup') }
        `
      },
      onSkip: (p, setPage) => setPage('/s/start/'),
      onMount: (params, setPage) => {

      },
    }),

    /**
     * Ask for the role
     */
    setupPage({
      title: __('What is your role?'),
      slug: /s\/role/,
      showButtons: false,
      render: () => {

        let items = [
          'Agency/Freelancer',
          'Business Owner',
          'Marketing Team',
          'Developer',
        ]

        // language=HTML
        return `
            <p>
                ${ __('Can you tell us a bit about yourself so we can better tailor your experience?') }
            </p>
            <div id="items" class="display-flex column gap-10">
                ${ items.map(
                        r => `<button class="holler-button secondary text select-item medium" data-item="${ r }">${ r }</button>`).
                        join('') }
            </div>
        `
      },
      onMount: (params, setPage) => {
        $('.select-item').on('click', e => {
          setup_answers.role = e.target.dataset.item
          setPage('/s/business/')
        })
      },
    }),

    /**
     * Ask for the kind of business
     */
    setupPage({
      title: __('What kind of business are we building?'),
      slug: /s\/business/,
      showButtons: false,
      render: () => {

        let items = [
          'Community/Membership',
          'Learning/Education',
          'Software',
          'Ecommerce',
          'Publishing/Media',
          'Something else',
        ]

        // language=HTML
        return `
            <p>
                ${ __('Can you tell us a bit about your business so we can make recommendations for how to use HollerBox to get the best results?') }
            </p>
            <div id="items" class="display-flex column gap-10">
                ${ items.map(
                        i => `<button class="holler-button secondary text select-item medium" data-item="${ i }">${ i }</button>`).
                        join('') }
            </div>
        `
      },
      onMount: (params, setPage) => {
        $('.select-item').on('click', e => {
          setup_answers.business = e.target.dataset.item
          setPage(settings.is_licensed ? '/s/telemetry-2/' : '/s/license/')
        })
      },
    }),

    /**
     * Ask for the license key
     */
    setupPage({
      title: __('Have a license key?'),
      slug: /s\/license/,
      showButtons: false,
      render: () => {

        // language=HTML
        return `
            <p>
                ${ __('If you have previously purchased a license for HollerBox you can enter it now! <i><a href="#" target="_blank">Where do I find my license?</a></i>') }
            </p>
            <div class="inside display-flex gap-10">
                ${ input({
                    id: 'license',
                    placeholder: __('Your license key'),
                }) }
                <button id="activate" class="holler-button primary medium">${ __('Activate') }</button>
            </div>
            ${ skipButton(__('I don\'t have a license yet.')) }
        `
      },
      onSkip: (p, setPage) => setPage('/s/telemetry/'),
      onMount: (params, setPage) => {

        $('#license').on('change input', e => {
          setup_answers.license = e.target.value
        })

        $('#activate').on('click', e => {

          apiPost(HollerBox.routes.licensing, {
            license: setup_answers.license,
          }).then(r => {

            if (!r.success) {
              return
            }

            settings.set(r.license_data)
            setPage('/s/telemetry-2/')

            dialog({
              message: __('License Activated!'),
            })

          }).catch(e => {
            dialog({
              message: e.message,
              type: 'error',
            })
          })
        })
      },
    }),

    /**
     * Prompt to enable telemetry
     */
    setupPage({
      title: __('Want 15% OFF HollerBox Pro?'),
      slug: /s\/telemetry\/?$/,
      showButtons: false,
      render: () => {
        // language=HTML
        return `
            <p>
                ${ __('You can help improve HollerBox and get 15% OFF the first year of <b>Pro</b> by enabling anonymous telemetry.',
                        'holler-box') }</p>
            <div class="inside display-flex column align-center gap-20">
                <label>${ input({
                    type: 'checkbox',
                    id: 'subscribe',
                    checked: setup_answers.marketing_subscribed,
                }) }
                    ${ __('Add me to the email list.',
                            'holler-box') }</label>
                <button id="optin" class="holler-button primary medium">
                    <b>${ __('Yes, I want 15% OFF', 'holler-box') }</b>
                </button>
            </div>
            <p><b>${ __('What information is shared?', 'holler-box') }</b></p>
            <ul>
                <li>${ __('Your name and email address.', 'holler-box') }</li>
                <li>${ __('Total number of active popups', 'holler-box') }</li>
                <li>${ __('Error messages and plugin failures', 'holler-box') }</li>
                <li>${ __('System info such as WordPress version and language', 'holler-box') }</li>
                <li>${ __('Installed plugins', 'holler-box') }</li>
            </ul>
            <p><b>${ __('What information is <b>NOT</b> shared?', 'holler-box') }</b></p>
            <ul>
                <li>${ __('Any personally identifiable information about your users or contacts', 'holler-box') }</li>
                <li>${ __('Any site content such as emails or posts', 'holler-box') }</li>
                <li>${ __('Passwords, usernames, or any data that might impact security', 'holler-box') }</li>
            </ul>
            <p>🔒<i>${ __('We do not sell or share any of your information with third party vendors.',
                    'holler-box') }</i></p>
            <p><i>${ __('You can opt out at any time.', 'holler-box') }</i></p>
            ${ skipButton(__('No thanks, I don\'t want 15% OFF.')) }`
      },
      onSkip: (p, setPage) => setPage(
        HollerBox.installed.mailhawk && HollerBox.installed.groundhogg ? '/s/subscribe/' : '/s/plugins/'),
      onMount: (params, setPage) => {
        $('#optin').on('click', e => {

          setup_answers.telemetry_subscribed = true
          settings.telemetry_subscribed = true

          apiPost(`${ HollerBox.routes.root }/telemetry`, setup_answers).then(() => {
            setup_answers.subscribed = true
            setPage(HollerBox.installed.mailhawk && HollerBox.installed.groundhogg ? '/s/next-steps/' : '/s/plugins/')
          })

        })

        $('#subscribe').on('change', e => {
          setup_answers.marketing_subscribed = e.target.checked
        })
      },
    }),

    /**
     * Prompt to enable telemetry
     */
    setupPage({
      title: __('Help improve HollerBox?'),
      slug: /s\/telemetry-2/,
      showButtons: false,
      render: () => {
        // language=HTML
        return `
            <p>
                ${ __('You can help improve HollerBox by enabling anonymous telemetry. This will occasionally send us data about HollerBox and how you use it. We use this data to improve feature, fix bugs, and create new products.',
                        'holler-box') }</p>
            <div class="inside display-flex column align-center gap-20">
                <button id="optin" class="holler-button primary medium">
                    <b>${ __('Yes, I\'m In!', 'holler-box') }</b>
                </button>
            </div>
            <p><b>${ __('What information is shared?', 'holler-box') }</b>
            </p>
            <ul>
                <li>${ __('Your name and email address.', 'holler-box') }</li>
                <li>${ __('Total number of active popups', 'holler-box') }</li>
                <li>${ __('Error messages and plugin failures', 'holler-box') }</li>
                <li>${ __('System info such as WordPress version and language', 'holler-box') }</li>
                <li>${ __('Installed plugins', 'holler-box') }</li>
            </ul>
            <p><b>${ __('What information is <b>NOT</b> shared?', 'holler-box') }</b></p>
            <ul>
                <li>${ __('Any personally identifiable information about your users or contacts', 'holler-box') }</li>
                <li>${ __('Any site content such as emails or posts', 'holler-box') }</li>
                <li>${ __('Passwords, usernames, or any data that might impact security', 'holler-box') }</li>
            </ul>
            <p>🔒<i>${ __('We do not sell or share any of your information with third party vendors.',
                    'holler-box') }</i></p>
            <p><i>${ __('You can opt out at any time.', 'holler-box') }</i></p>
            ${ skipButton(__('No thanks, I don\'t want to help improve HollerBox.')) }`
      },
      onSkip: (p, setPage) => setPage(
        HollerBox.installed.mailhawk && HollerBox.installed.groundhogg ? '/s/subscribe/' : '/s/plugins/'),
      onMount: (params, setPage) => {
        $('#optin').on('click', e => {
          setup_answers.telemetry_subscribed = true
          settings.telemetry_subscribed = true

          apiPost(`${ HollerBox.routes.root }/telemetry`, setup_answers).then(() => {
            setup_answers.subscribed = true
            setPage(HollerBox.installed.mailhawk && HollerBox.installed.groundhogg ? '/s/next-steps/' : '/s/plugins/')
          })
        })
      },
    }),

    /**
     * Prompt to install recommended plugins
     */
    setupPage({
      title: __('Install Recommended Plugins'),
      slug: /s\/plugins/,
      showButtons: false,
      render: () => {
        // language=HTML
        return `
            <p>${ __('These WordPress plugins make it easier to collect leads, send emails, and grow your business!',
                    'holler-box') }</p>
            <div class="display-flex gap-20 column">
                <div class="holler-panel outlined plugin">
                    <div class="inside display-flex gap-20">
                        <div class="icon">
                            ${ icons.groundhogg }
                        </div>
                        <div>
                            <h2>Groundhogg - CRM for WordPress</h2>
                            <p>FREE CRM & Marketing Automation for WordPress. Build your list, send emails, and create
                                automations that will help you grow.</p>
                        </div>
                    </div>
                    <div class="plugin-actions inside display-flex space-between align-center">
                        <a href="https://wordpress.org/plugins/groundhogg/" target="_blank">${ __('More details') }</a>
                        ${ toggle({
                            id: 'install-groundhogg',
                            onLabel: 'Yes',
                            offLabel: 'No',
                            checked: setup_answers.install_groundhogg,
                        }) }
                    </div>
                </div>
                <div class="holler-panel outlined plugin">
                    <div class="inside display-flex gap-20">
                        <div class="icon">
                            ${ icons.mailhawk_bird }
                        </div>
                        <div>
                            <h2>MailHawk - SMTP</h2>
                            <p>Make sure your emails reach the inbox with MailHawk. The dedicated SMTP service for
                                WordPress.</p>
                        </div>
                    </div>
                    <div class="plugin-actions inside display-flex space-between align-center">
                        <a href="https://wordpress.org/plugins/mailhawk/" target="_blank">${ __('More details') }</a>
                        ${ toggle({
                            id: 'install-mailhawk',
                            onLabel: 'Yes',
                            offLabel: 'No',
                            checked: setup_answers.install_mailhawk,
                        }) }
                    </div>
                </div>
            </div>
            <div class="display-flex center" style="margin-top: 30px">
                <button id="install" class="holler-button primary medium">${ __('Install & Continue') }</button>
            </div>
            ${ skipButton(__('I\'ll do this later')) }`
      },
      onSkip: (p, setPage) => setPage(setup_answers.subscribed ? '/s/next-steps/' : '/s/subscribe/'),
      onMount: (params, setPage) => {

        $('#install-groundhogg').on('change', e => {
          setup_answers.install_groundhogg = e.target.checked
        })
        $('#install-mailhawk').on('change', e => {
          setup_answers.install_mailhawk = e.target.checked
        })

        $('#install').on('click', e => {

          // Install async, no need to wait
          apiPost(HollerBox.routes.install, {
            slug: 'mailhawk',
          }).then(() => {
            apiPost(HollerBox.routes.install, {
              slug: 'groundhogg',
            })
          })

          setPage(setup_answers.subscribed ? '/s/next-steps/' : '/s/subscribe/')

        })
      },
    }),

    /**
     * Prompt to subscribe
     */
    setupPage({
      title: __('Subscribe!'),
      slug: /s\/subscribe/,
      showButtons: false,
      render: () => {

        // language=HTML
        return `
            <p>
                ${ __('Stay up to date on the latest changes & improvements, courses, articles, deals and promotions available to the HollerBox community by subscribing!') }
            </p>
            <div class="inside display-flex gap-10">
                ${ input({
                    type: 'email',
                    id: 'email',
                    placeholder: __('Your email address'),
                    value: setup_answers.email,
                }) }
                <button id="subscribe" class="holler-button primary medium">${ __('Subscribe') }</button>
            </div>
            <p><b>${ __('Why subscribe?', 'holler-box') }</b></p>
            <ul>
                <li>${ __('First to know about events, articles, deals, promotions and more!', 'holler-box') }</li>
                <li>${ __('Tailored onboarding experience.', 'holler-box') }</li>
                <li>${ __('Unsubscribe anytime.', 'holler-box') }</li>
            </ul>
            <p>🔒 <i>${ __('HollerBox does not sell or share your data with third party vendors.', 'holler-box') }</i>
            </p>
            ${ skipButton(__('I don\'t want to stay informed...')) }
        `
      },
      onSkip: (p, setPage) => setPage('/s/next-steps/'),
      onMount: (params, setPage) => {

        $('#email').on('input', e => {
          setup_answers.email = e.target.value
        })

        $('#subscribe').on('click', e => {
          setup_answers.marketing_subscribed = true
          setup_answers.telemetry_subscribed = false

          apiPost(`${ HollerBox.routes.root }/telemetry`, setup_answers).then(() => {
            setup_answers.subscribed = true
            setPage('/s/next-steps/')
          })
        })
      },
    }),

    /**
     * Take them back to the settings page
     */
    setupPage({
      title: __('Next Steps...'),
      slug: /s\/next-steps/,
      showButtons: false,
      render: () => {

        // language=HTML
        return `
            <p>${ __('🎉 Congrats! You\'re ready to start creating popups with HollerBox! Let\'s create one now!') }</p>
            <div class="display-flex center" style="margin-top: 30px">
                <button id="new-popup" class="holler-button primary medium">${ __('Create a Popup') }</button>
            </div>
            ${ skipButton(__('I\'ll make one later.')) }
        `
      },
      onSkip: (p, setPage) => setPage('/settings/'),
      onMount: (params, setPage) => {

        settings.set({
          setup_complete: true,
        })

        saveSettings()

        $('#new-popup').on('click', e => {

          window.open(HollerBox.admin_url + '/post-new.php?post_type=hollerbox', '_self')

        })

      },
    }),
  ]

  const Page = {

    slug: '',
    currentPage: pages[0],
    params: [],

    getCurSlug () {
      return window.location.hash.substring(1)
    },

    initFromSlug () {
      this.slug = this.getCurSlug()
      this.params = this.getCurSlug().split('/').filter(p => p)
      this.mount()
    },

    init () {
      if (window.location.hash) {
        this.initFromSlug()
      }
      else {

        // Setup was complete
        if (settings.setup_complete) {
          history.pushState({}, '', `#/settings/`)
          this.initFromSlug()
        }
        // Legacy user, send to legacy setup
        else if (settings.is_legacy_user) {
          history.pushState({}, '', `#/legacy-user/`)
          this.initFromSlug()
        }
        // Start guided setup
        else {
          history.pushState({}, '', `#/s/start`)
          this.initFromSlug()
        }
      }

      window.addEventListener('popstate', (e) => {
        this.initFromSlug()
      })
    },

    mount () {

      this.currentPage = pages.find(p => this.slug.match(p.slug))

      console.log(this.slug, this.currentPage.slug)

      const setPage = (slug) => {
        history.pushState({}, '', `#${ slug }`)
        this.initFromSlug()
      }

      $('#holler-app').html(this.currentPage.render(this.params))
      this.currentPage.onMount(this.params, setPage)
    },

  }

  $(() => Page.init())

} )(jQuery)
