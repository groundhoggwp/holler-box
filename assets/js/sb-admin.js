(function(window, document, $, undefined){

  var sbAdmin = {};

  sbAdmin.init = function() {

  	sbAdmin.listeners();
  	sbAdmin.toggleShowOn();
  	sbAdmin.toggleDatepicker();
  	sbAdmin.toggleEmail();

    $('.sb-datepicker').datepicker({
		dateFormat : 'D, m/d/yy'
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
	.on('change', '#show_email', sbAdmin.toggleEmail )
	.on('change', 'input[name=show_until]', sbAdmin.toggleDatepicker )
	.on('change', 'input[name=show_on]', sbAdmin.toggleShowOn )
	.on('keyup', '#content', sbAdmin.updatePreviewContent )

  }

  sbAdmin.toggleShowOn = function() {

	if( $('input[name=show_on]:checked').val() === 'limited' ) {
		$('#show-certain-pages').show();
	} else {
		$('#show-certain-pages').hide();
	}

  }

  sbAdmin.toggleEmail = function() {

  	if( $('#show_email').is(':checked') ) {
		$("#show-email-options, #sb-note-optin").show();
	} else {
		$("#show-email-options, #sb-note-optin").hide();
	}

  }

  sbAdmin.toggleDatepicker = function() {

	if( $('input[name=show_until]:checked').val() === 'date' ) {
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