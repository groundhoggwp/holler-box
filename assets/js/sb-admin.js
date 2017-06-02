(function(window, document, $, undefined){

  var sbAdmin = {};

  sbAdmin.init = function() {

  	sbAdmin.listeners();
  	sbAdmin.toggleShowOn();
  	sbAdmin.toggleDatepicker();
  	sbAdmin.emailCheckbox();
    sbAdmin.toggleEmailForm();

    $('.sb-datepicker').datepicker({
  		dateFormat : 'mm/dd/yy'
  	});

  	$('.sb-automation-colors').wpColorPicker();

    $('#settings_meta_box').addClass('closed');
    
  }

  sbAdmin.listeners = function() {

  	// Handle live preview update with visual editor
  	$(document).on( 'tinymce-editor-init', function( event, editor ) {

  		// Update preview on first page load
  		sbAdmin.updatePreviewContent();

  		// add listener to visual editor for live updates
  		window.tinymce.activeEditor.on( 'keyup', function(e) {
  			sbAdmin.updatePreviewContent();
  		})

  	} );

  	// Updates preview if page loaded with HTML editor tab
  	if( $('#wp-content-wrap').hasClass('html-active') ) {
  		sbAdmin.updatePreviewContent();
  	}

  	$('body')
  	.on('change', 'input[name=show_optin]', sbAdmin.emailCheckbox )
    .on('change', '.sb-switch input', sbAdmin.toggleSwitch )
  	.on('change', 'input[name=expiration]', sbAdmin.toggleDatepicker )
  	.on('change', 'input[name=show_on]', sbAdmin.toggleShowOn )
    .on('change', 'input[name=email_provider]', sbAdmin.toggleEmailForm )
  	.on('keyup', '#content', sbAdmin.updatePreviewContent )
    .on('focus', 'input#scroll_delay', function() {
      $('input[name=display_when][value=delay]').prop('checked', 'checked'); 
    })

  }

  sbAdmin.toggleShowOn = function() {

  	if( $('input[name=show_on]:checked').val() === 'limited' ) {
  		$('#show-certain-pages').show();
  	} else {
  		$('#show-certain-pages').hide();
  	}

  }

  // New item selected, update preview and settings display
  sbAdmin.emailCheckbox = function() {

    var optin = $("#show-email-options, #sb-note-optin");

    if( $('input[name=show_optin]').is(':checked') ) {

      optin.show();

    } else {

      optin.hide();

    }


  }

  // Handle display of different email options
  sbAdmin.toggleEmailForm = function() {

    var defaultDiv = $('#default-email-options');
    var custom = $('#custom-email-options');
    var checkedVal = $('input[name=email_provider]:checked').val();
    var itemTypeVal = $('input[name=item_type]:checked').val();
    var optin = $("#sb-note-optin");
    var mcUrl = $('#mc_url, .mc-description');
    var ckId = $('#ck_id');

    // Show optin in preview
    if( itemTypeVal === 'optin' ) {

      optin.show();
      $('#show-email-options').show();

    }

    if( checkedVal === 'default' ) {
      defaultDiv.show();
      custom.hide();
      ckId.hide();
      mcUrl.hide();
    } else if( checkedVal === 'custom' ) {
      custom.show();
      defaultDiv.hide();
      ckId.hide();
      mcUrl.hide();
    } else if( checkedVal === 'mc' ) {
      mcUrl.show();
      ckId.hide();
      custom.hide();
      defaultDiv.hide();
    } else if( checkedVal === 'ck' ) {
      ckId.show();
      mcUrl.hide();
      custom.hide();
      defaultDiv.hide();
    }

  }

  sbAdmin.toggleChat = function() {

    if( $('input[name=show_chat]').is(':checked') ) {
      $('#sb-chat').removeClass('sb-hide');
    } else {
      $('#sb-chat').addClass('sb-hide');
    }

  }

  sbAdmin.toggleSwitch = function() {

    sbAdmin.toggleActiveAjax( $(this).data('id') );

  }

  // Toggle meta value via ajax
  sbAdmin.toggleActiveAjax = function( id ) {

    var params = { action: 'sb_toggle_active', id: id };

    // store interaction data
    $.ajax({
      method: "GET",
      url: window.ajaxurl,
      data: params
      })
      .done(function(msg) {
        console.log(msg);
      })
      .fail(function(err) {
        console.log(err);
      });

  }

  sbAdmin.toggleDatepicker = function() {

  	if( $('input[name=expiration]').is(':checked') ) {
  		$('#sb-until-datepicker').show();
  	} else {
  		$('#sb-until-datepicker').hide();
  	}

  }

  sbAdmin.updatePreviewContent = function() {

  	var content;

  	if( $('#wp-content-wrap').hasClass('tmce-active') ) {
  		// rich editor selected
  		content = window.tinymce.get('content').getContent();
  	} else {
  		// HTML editor selected
  		content = $('#content').val();
  	}

    var firstRow = document.getElementById('sb-first-row');
    if( firstRow )
  	 firstRow.innerHTML = content;
  }

  sbAdmin.init();

  window.sbAdmin = sbAdmin;

})(window, document, jQuery);