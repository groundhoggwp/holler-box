( ($) => {

  const { input, select, textarea, toggle, icons } = HollerBox.elements
  const { sprintf, __, _x, _n } = wp.i18n

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
        <div class="control-group">
            <div class="control-group-header">
                <div class="control-group-name">${ control.name }</div>
                <button class="toggle-indicator"></button>
            </div>
            <div class="controls">
                ${ control.render(popup) }
            </div>
        </div>`
  }

  const Controls = {

    template: {
      name: __('Template', 'holler-box'),
      render: ({
        template = 'popup_standard',
      }) => {
        return [
          singleControl({
            label: __('Template'),
            control: select({
              id: 'template',
            }, Templates.map( t => ({ value: t.id, text: t.id})), template),
          }),
        ].join('')
      },
      onMount: (settings, updateSetting) => {
        $('#template').on('change', e => {
          updateSetting({
            template: e.target.value,
          })
        })
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
          singleControl({
            label: __('Text'),
            control: textarea({
              id: 'text-text',
              value: text,
            }),
          }),
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
    overlay: {
      name: __('Overlay', 'holler-box'),
      render: ({ overlay_color }) => {
        return [
          singleControl({
            label: __('Color'),
            control: input({
              id: 'overlay-color',
              value: overlay_color,
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
      },
      css: ({
        id,
        overlay_color = '',
      }) => {

        // language=CSS
        return `
            #${ id } .holler-box-overlay {
                background-color: ${ overlay_color };
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
      render: ({}) => {
        return [].join('')
      },
      onMount: (settings, updateSetting) => {
      },
    },
    fields: {
      name: __('Fields', 'holler-box'),
      render: ({}) => {
        return [].join('')
      },
      onMount: (settings, updateSetting) => {
      },
    },

  }

  const Templates = [
    {
      id: 'popup_standard',
      controls: [
        Controls.template,
        Controls.position,
        Controls.title,
        Controls.text,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        text: 'Enter your email below. We\'ll never spam you.',
        button_text: 'Subscribe',
      },
    },
    {
      id: 'popup_image_left',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.text,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        text: 'Enter your email below. We\'ll never spam you.',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/150x300'
      },
    },
    {
      id: 'popup_form_below',
      controls: [
        Controls.template,
        Controls.position,
        Controls.image,
        Controls.title,
        Controls.text,
        Controls.fields,
        Controls.button,
        Controls.modal,
        Controls.close_button,
        Controls.overlay,
      ],
      defaults: {
        title: 'Join our email list!',
        content: `<p>✅ 100% Free</p><p>✅ No Spam</p><p>✅ Great Content</p>`,
        text: 'Enter your email below. We\'ll never spam you.',
        button_text: 'Subscribe',
        image_src: 'https://via.placeholder.com/200'
      },
    },
  ]

  const renderEditor = () => {

    //language=HTML
    return `
        <div id="header">
            <h1 class="holler-title">PopupName</h1>
            <div class="actions display-flex align-center gap-20">
                <button class="holler-button danger text">${__('Disable')}</button>
                <button class="holler-button primary">${__('Save Changes')}</button>   
                <button class="holler-button secondary text icon">${icons.verticalDots}</button>   
            </div>
        </div>
        <div id="editor">
            <div id="preview"></div>
            <div id="controls"></div>
        </div>`

  }

  const Editor = {

    popup: {
      id: 'temp-id',
      template: 'popup_standard'

    },

    getTemplate () {
      return Templates.find(t => t.id === this.popup.template)
    },

    getPopup () {
      return {
        ...Templates.find(t => t.id === this.popup.template).defaults,
        ...this.popup,
      }
    },

    updatePreview () {
      $('#preview').html(HollerBox.types[this.popup.template].render(this.getPopup()))
      $('#holler-box-overrides').text(this.getTemplate().controls.map(control => {
        try {
          return control.css(this.getPopup())
        }
        catch (e) {
          return ''
        }
      }).join(''))
    },

    mount () {
      $('#app').html(renderEditor())
      this.updatePreview()
      $('#controls').
        html(this.getTemplate().controls.map(control => controlGroup(control, this.getPopup())))
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
        }
        else {
          this.updatePreview()
        }

      }

      this.getTemplate().
        controls.
        forEach(control => control.onMount(this.getPopup(), updateSettings))

      $('.control-group').on('click', '.control-group-header', e => {
        $('.control-group').removeClass('open')
        $(e.currentTarget).parent().toggleClass('open')
      })

    },

  }

  $(() => {
    $('head').append(`<style id="holler-box-overrides"></style>`)
    Editor.mount()
  })

} )(jQuery)
