(function(window, document, $, undefined){

  var sbAdmin = {};

  sbAdmin.init = function() {

  	sbAdmin.listeners();
  	sbAdmin.toggleShowOn();
  	sbAdmin.toggleDatepicker();
  	//sbAdmin.toggleItems();

    $('.sb-datepicker').datepicker({
  		dateFormat : 'mm/dd/yy'
  	});

  	$('.sb-automation-colors').wpColorPicker();
    
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
  	.on('change', 'input[name=item_type]', sbAdmin.toggleItems )
    .on('change', '.sb-switch input', sbAdmin.toggleSwitch )
  	.on('change', 'input[name=expiration]', sbAdmin.toggleDatepicker )
  	.on('change', 'input[name=show_on]', sbAdmin.toggleShowOn )
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
  sbAdmin.toggleItems = function() {

    var checkedItemVal = $('input[name=item_type]:checked').val();
    var chat = $('#sb-chat');
    var optin = $("#show-email-options, #sb-note-optin");

  	if( checkedItemVal === 'optin' ) {

  		optin.show();
      chat.attr("class", "sb-hide" );

  	} else if( checkedItemVal === 'chatbox' ) {

  		chat.removeClass('sb-hide');
      optin.hide();

  	} else if( checkedItemVal === 'quickie' ) {
      // quickie
      chat.attr("class", "sb-hide" );
      optin.hide();

      $('input[name=hide_after][value=delay]').prop('checked', 'checked');
      $('input[value=hide_for]').prop('checked', 'checked');
    } else {

      chat.attr("class", "sb-hide" );
      optin.hide();
      
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

  	document.getElementById('sb-first-row').innerHTML = content;
  }

  sbAdmin.init();

  window.sbAdmin = sbAdmin;

})(window, document, jQuery);