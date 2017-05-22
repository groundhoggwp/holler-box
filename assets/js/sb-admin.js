(function(window, document, $, undefined){

  var sbAdmin = {};

  sbAdmin.init = function() {

  	sbAdmin.listeners();
  	sbAdmin.toggleShowOn();
  	sbAdmin.toggleDatepicker();
  	sbAdmin.toggleEmail();
  	sbAdmin.updatePreviewContent( $('.wp-editor-area').val() );

    $('.sb-datepicker').datepicker({
		dateFormat : 'D, m/d/yy'
	});

	$('.sb-automation-colors').wpColorPicker();
    
  }

  sbAdmin.listeners = function() {

  	$('body')
	.on('change', '#show-email', sbAdmin.toggleEmail )
	.on('change', 'input[name=show-until]', sbAdmin.toggleDatepicker )
	.on('change', 'input[name=show-on]', sbAdmin.toggleShowOn )
	.on('keyup', '.wp-editor-area', function(e) {
		sbAdmin.updatePreviewContent( e.target.value );
	})

  }

  sbAdmin.toggleShowOn = function() {

	if( $('input[name=show-on]:checked').val() === 'limited' ) {
		$('#show-certain-pages').show();
	} else {
		$('#show-certain-pages').hide();
	}

  }

  sbAdmin.toggleEmail = function() {

  	if( $('#show-email').is(':checked') ) {
		$("#show-email-options, #sb-note-optin").show();
	} else {
		$("#show-email-options, #sb-note-optin").hide();
	}

  }

  sbAdmin.toggleDatepicker = function() {

	if( $('input[name=show-until]:checked').val() === 'date' ) {
		$('#sb-until-datepicker').show();
	} else {
		$('#sb-until-datepicker').hide();
	}

  }

  sbAdmin.updatePreviewContent = function( content ) {
  	document.getElementById('sb-first-row').innerHTML = content;
  }

  sbAdmin.init();

  window.sbAdmin = sbAdmin;

})(window, document, jQuery);