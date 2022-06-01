( () => {

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
    return `<input class="holler-box-input" type="text" name="name" placeholder="${ placeholder }">`
  }

  const emailInput = (placeholder) => {
    //language=HTML
    return `<input class="holler-box-input" type="email" name="email" placeholder="${ placeholder }">`
  }

  const submitButton = (text) => {
    //language=HTML
    return `
        <button type="button" class="holler-box-button">${ text }</button>`
  }

  const form = ({
    direction = 'vertical',
    email_placeholder = 'Name',
    name_placeholder = 'Email',
    button_text = 'Subscribe',
  }) => {
    //language=HTML
    return `
        <form class="holler-box-form ${ direction }">
            ${ nameInput(name_placeholder) }
            ${ emailInput(email_placeholder) }
            ${ submitButton(button_text) }
        </form>`
  }

  const Types = {
    notification_box: {},
    popup_custom: {
      render: ({
        id = '',
        position = 'center-center',
        content = '',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-custom">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <div class="holler-box-modal-content">
                        ${ content }
                    </div>
                </div>
            </div>`
      },
    },
    popup_standard: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        text = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-standard">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <h6 class="holler-box-modal-title">${ title }</h6>
                    <p class="holler-box-modal-text">${ text }</p>
                    ${ form({
                        direction: 'vertical',
                        button_text,
                        name_placeholder,
                        email_placeholder,
                    }) }
                </div>
            </div>`
      },
    },
    popup_image_left: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        text = '',
        image_src = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-image-left">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <div class="display-flex">
                        <div class="left">
                            <img src="${ image_src }" alt="" title=""/>
                        </div>
                        <div class="right">
                            <h6 class="holler-box-modal-title">${ title }</h6>
                            <p class="holler-box-modal-text">${ text }</p>
                            ${ form({
                                direction: 'vertical',
                                button_text,
                                name_placeholder,
                                email_placeholder,
                            }) }
                        </div>
                    </div>
                </div>
            </div>`
      },
    },
    popup_form_below: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        text = '',
        content = '',
        image_src = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-form-below">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <div class="display-flex">
                        <div class="left">
                            <h6 class="holler-box-modal-title">${ title }</h6>
                            <div class="holler-box-modal-content">
                                ${ content }
                            </div>
                            <p class="holler-box-modal-text">${ text }</p>
                        </div>
                        <div class="right">
                            <img src="${ image_src }" alt="" title=""/>
                        </div>
                    </div>
                    ${ form({
                        direction: 'horizontal',
                        button_text,
                        name_placeholder,
                        email_placeholder,
                    }) }
                </div>
            </div>`
      },
    },
    popup_progress_bar: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        text = '',
        image_src = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-progress-bar">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <div class="holler-box-progress-bar-wrap">
                        <div class="holler-box-progress-bar">
                            <div class="holler-box-progress-bar-fill"></div>
                        </div>
                    </div>
                    <div class="display-flex">
                        <div class="left">
                            <img src="${ image_src }" alt="" title=""/>
                        </div>
                        <div class="right">
                            <h6 class="holler-box-modal-title">${ title }</h6>
                            <p class="holler-box-modal-text">${ text }</p>
                            ${ form({
                                direction: 'vertical',
                                button_text,
                                name_placeholder,
                                email_placeholder,
                            }) }
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
        text = '',
        image_src = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-image-beside-text-top">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <h6 class="holler-box-modal-title">${ title }</h6>
                    <p class="holler-box-modal-text">${ text }</p>
                    <div class="display-flex">
                        <div class="left">
                            <img src="${ image_src }" alt="" title=""/>
                        </div>
                        <div class="right">
                            ${ form({
                                direction: 'vertical',
                                button_text,
                                name_placeholder,
                                email_placeholder,
                            }) }
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
        text = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-full-image-background">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <h6 class="holler-box-modal-title">${ title }</h6>
                    <p class="holler-box-modal-text">${ text }</p>
                    ${ form({
                        direction: 'vertical',
                        button_text,
                        name_placeholder,
                        email_placeholder,
                    }) }
                </div>
            </div>`
      },
    },
    popup_text_top_with_color_background: {
      render: ({
        id = '',
        position = 'center-center',
        title = '',
        text = '',
        button_text = 'Subscribe',
        name_placeholder = 'Name',
        email_placeholder = 'Email',
      }) => {

        // language=HTML
        return `
            <div id="${ id }" class="holler-box holler-popup-text-with-color-background">
                ${ overlay() }
                <div class="holler-box-modal ${ position }">
                    ${ closeButton() }
                    <div class="holler-box-modal-title-wrap">
                        <h6 class="holler-box-modal-title">${ title }</h6>
                        <p class="holler-box-modal-text">${ text }</p>
                    </div>
                    ${ form({
                        direction: 'vertical',
                        button_text,
                        name_placeholder,
                        email_placeholder,
                    }) }
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

  HollerBox.types = Types;

} )()
