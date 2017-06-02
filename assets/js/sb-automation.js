(function(window, document, $, undefined){

  var sbAutomation = {};

  sbAutomation.init = function() {

    // set defaults
    sbAutomation.newVisitor = false;

    // determine if new or returning visitor
    sbAutomation.checkCookie();

    // if we have active items, loop through them
    if( window.sbAutoVars.active )
      sbAutomation.doActive( window.sbAutoVars.active );
    
  }

  // determine if new or returning visitor
  sbAutomation.checkCookie = function() {

    if( sbAutomation.getCookie('sb_visit') === "" ) {

      // New visitor, set visitor cookie. This tracks original visit
      sbAutomation.setCookie('sb_visit', Date.now(), parseInt( window.sbAutoVars.expires ));
      sbAutomation.setCookie('sb_new', 'true', 1 );
      sbAutomation.newVisitor = true;

    } else if( sbAutomation.getCookie('sb_new') != "" ) {
      sbAutomation.newVisitor = true;
    }

  }

  // Notification box exists
  sbAutomation.doActive = function( ids ) {

    for (var i = 0; i < ids.length; i++) {
      sbAutomation.doChecks( ids[i] );
    }

  }

  // Check if we should display item
  sbAutomation.doChecks = function( id ) {

    // If markup doesn't exist, bail
    var item = document.getElementById( 'sb-' + id );
    if( !item )
      return;

    var vars = window.sbAutoVars[id];

    if( !vars.visitor )
      return;

    if( vars.visitor === 'new' && sbAutomation.newVisitor != true )
      return;

    if( vars.visitor === 'returning' && sbAutomation.newVisitor != false )
      return;

    var shown = sbAutomation.getCookie( 'sb_' + id + '_shown' );

    // only show once?
    if( vars.showSettings === 'hide_for' && shown === 'true' ) {
      return;
    } else if( vars.showSettings === 'hide_for' && shown === '' ) {
      var hideFor = ( vars.hideForDays ? parseInt( vars.hideForDays ) : 1 );
      sbAutomation.setCookie( 'sb_' + id + '_shown', 'true', hideFor );
    }

    // hide after interacted with?
    if( vars.showSettings === 'interacts' && sbAutomation.getCookie( 'sb_' + id + '_int' ) != '' )
      return;

    // passes checks, show it

    sbAutomation.floatingBtn = document.getElementById('sb-floating-btn');

    sbAutomation.noteListeners( id );

    if( vars.bgColor )
      item.style.backgroundColor = vars.bgColor;

    if( vars.btnColor1 )
      $('#' + 'sb-' + id + ' .sb-email-btn, #sb-floating-btn' ).css('background-color', vars.btnColor1 );

    // Delay showing item?
    if( vars.display_when != 'scroll' ) {

      var delay = ( vars.display_when === 'delay' ? parseInt( vars.delay ) : 0 );

      setTimeout( function() {
        sbAutomation.showNote( id );
      }, delay * 1000 );

    } else {

      // Use scroll detect setting
      sbAutomation.detectScroll( id );

    }

  }

  // Event listeners
  sbAutomation.noteListeners = function( id ) {

    $('body')
    .on('click', '.sb-close', sbAutomation.hideItem )
    .on('click', '#sb-floating-btn', sbAutomation.btnClick )
    .on('click', '.sb-interaction', sbAutomation.interactionLink )
    .on('click', '.sb-full-side', sbAutomation.fullSide )
    .on('click', '.sb-text i', sbAutomation.sendText )
    .on('click', '#sb-' + id + ' .sb-email-btn', sbAutomation.emailSubmitClick )
    // .on('submit', '.sb-notification-box form', sbAutomation.handleForms );

    $('.sb-text-input').on('keypress', sbAutomation.submitChatTextOnEnter );

    $('#sb-' + id + ' .sb-email-input').on('keypress', sbAutomation.submitEmailOnEnter );

  }

  // detect when user scrolls partway down the page
  // https://www.sitepoint.com/jquery-capture-vertical-scroll-percentage/
  sbAutomation.detectScroll = function( id ) {

    $(window).scroll(
      // debounce so we don't adversely affect scroll performance
      sbAutomation.debounce( function() {

        var wintop = $(window).scrollTop(), docheight = $(document).height(), winheight = $(window).height();
        var  scrolltrigger = 0.5;

        // when user scrolls below fold, show it
        if( (wintop/(docheight-winheight)) > scrolltrigger && !sbAutomation.show['sb-' + id] ) {
          sbAutomation.showNote( id );
          sbAutomation.show['sb-' + id] = true
        }
      }, 250) )

  }

  sbAutomation.fullSide = function(e) {

    // prevents firing twice
    e.stopImmediatePropagation();

    var id = $(e.target).closest('.sb-notification-box').attr('id');

    var item = $( '#' + id );
    
    item.toggleClass('sb-full-side');

    item.toggleClass('sb-minimizing', !item.hasClass('sb-full-side') );
    setTimeout( function() {
      item.removeClass('sb-minimizing');
    }, 1000);

    return false;

  }

  // Show/hide elements based on options object
  sbAutomation.showNote = function( id ) {

    var options = window.sbAutoVars[id];

    var item = document.getElementById( 'sb-' + id );

    $('#sb-' + id + ' .sb-first-row').html( options.content );

    // visitor has hidden this item, don't show box
    if( options.hideFirst === 'true' || sbAutomation.getCookie( 'sb-' + id + '_hide' ) === 'true' ) {

      // hide box, show btn
      sbAutomation.transitionOut( item );

      if( options.hideBtn != '1' && options.position != 'sb-banner-top' )
        sbAutomation.transitionIn( sbAutomation.floatingBtn );

    } else {

      // Show the box
      sbAutomation.transitionIn( item );

      if( options.hideBtn != '1' && options.position != 'sb-banner-top' )
        sbAutomation.transitionOut( sbAutomation.floatingBtn );

    }

    // Show email opt-in
    if( options.showEmail === "1" ) {
      sbAutomation.show( document.querySelector( '#sb-' + id + ' .sb-note-optin' ) );
      // Setup localized vars
      var textInput = document.querySelector('#sb-' + id + ' .sb-email-input');

      // if text input is missing, we are using a different email form
      if(!textInput)
        return;
      
      textInput.setAttribute('placeholder', options.placeholder );

      $('.sb-away-msg').remove();
      $('#sb-' + id + ' .sb-email-row').prepend( '<span class="sb-away-msg">' + options.optinMsg + '</span>' );

      $('#sb-' + id ).addClass('has-optin');
    }

    // Button should not be shown
    if( options.hideBtn === '1' )
      sbAutomation.hide( sbAutomation.floatingBtn );

    if( options.position === 'sb-banner-top' && sbAutomation.getCookie( 'sb-' + id + '_hide' ) != 'true' )
      sbAutomation.toggleBnrMargin( id );

    // Should we hide it
    if( options.hide_after === 'delay' ) {

      setTimeout( function() {
        sbAutomation.transitionOut( item );
      }, parseInt( options.hide_after_delay ) * 1000 );

    }

  }

  // Set a cookie. https://www.w3schools.com/js/js_cookies.asp
  sbAutomation.setCookie = function(cname, cvalue, exdays) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      var expires = "expires="+ d.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
      return cvalue;
  }

  // Get a cookie by name. https://www.w3schools.com/js/js_cookies.asp
  sbAutomation.getCookie = function(cname) {
      var name = cname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
              return c.substring(name.length, c.length);
          }
      }
      return "";
  }

  // Reusable function to throttle or debounce function calls
  sbAutomation.debounce = function(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  // Add top-margin to body when banner is present
  sbAutomation.toggleBnrMargin = function( id, hide ) {

    if( hide && hide === true ) {
      $('body').css('margin-top', '');
    } else {
      var height = $('#sb-' + id).outerHeight();
      $('body').css('margin-top', height);
    }
    
  }

  // check how old cookie is
  // return true or false
  // sbAutomation.lastSeen = function( cookie ) {

  //   // Display to everyone if no lastSeen filter is set
  //   if( !window.sbAutoVars.lastSeen || window.sbAutoVars.lastSeen === 'none' ) {
  //     console.log("lastSeen true (show the thing)");
  //     return true;
  //   }
    
  //   // Compare cookie age and lastSeen setting. If we want to show something to people who visited at least 2 days ago, lastSeen would be 2.
  //   var daysAgo = parseInt( window.sbAutoVars.lastSeen );
  //   var days = new Date();
  //   days.setDate(days.getDate()-daysAgo);
    
  //   // If cookie is older than lastSeen setting, return true to show item. 
  //   if( cookie <= days ) {
  //     // cookie is older than daysAgo
  //     console.log("lastSeen true (show the thing)");
  //     return true;
  //   } else {
  //     console.log("lastSeen false (don't show the thing)", days);
  //     return false;
  //   }

  // }

  // User clicked hide
  sbAutomation.hideItem = function( e ) {

    e.stopImmediatePropagation();

    var closest = $(e.target).closest('.sb-notification-box');

    var id = closest.attr('id').split('-')[1];

    sbAutomation.toggleHide( id );

    if( closest.hasClass('sb-banner-top') )
      sbAutomation.toggleBnrMargin( id, true );

    // prevent duplicate firing
    return false;

  }

  // floating button clicked
  sbAutomation.btnClick = function(e) {

    e.stopImmediatePropagation();

    var id = $(this).data('id');

    sbAutomation.toggleHide( id );

  }

  // Handle show/hide storage items, then run showNote func. Used when floating btn is clicked
  sbAutomation.toggleHide = function( id ) {

    var hide = sbAutomation.getCookie( 'sb-' + id + '_hide');

    if( hide === 'true' ) {
      sbAutomation.setCookie( 'sb-' + id + '_hide', 'true', -1 );
    } else {
      sbAutomation.setCookie( 'sb-' + id + '_hide', 'true', 1 );

      setTimeout( function() {
        // clear current chat if hidden
        sbAutomation.clearChat();
      }, 1000);
    }

    sbAutomation.showNote( id );

  }

  sbAutomation.transitionIn = function(item) {

    item.style.display = 'block';

    setTimeout( function() {
      $(item).addClass('sb-transition-in').removeClass('sb-hide');
    }, 1);

    setTimeout( function() {
      $(item).removeClass('sb-transition-in').addClass('sb-show');
    }, 100);

  }

  sbAutomation.transitionOut = function(item) {
    
    $(item).addClass('sb-transition-out').removeClass('sb-show');

    setTimeout( function() {
      $(item).removeClass('sb-transition-out').addClass('sb-hide');
      $(item).css('display','');
    }, 200);

  }

  sbAutomation.show = function(item) {
    
    item.style.display = 'block';
    $(item).removeClass('sb-hide').addClass('sb-show');

  }

  sbAutomation.hide = function(item) {
    
    $(item).removeClass('sb-show').addClass('sb-hide');
    $(item).css('display','');

  }

  // See if there's a message from before that hasn't been submitted yet
  sbAutomation.checkExistingMsg = function() {
    var msg = window.localStorage.getItem('sb-full-msg');

    if( msg && msg != '' ) {

      var msgs = msg.split("/n");

      for (var i = 0; i < msgs.length; i++) {
        $( '#' + sbAutomation.activeID + ' .sb-box-rows').append('<div class="sb-row sb-visitor-row">' + msgs[i] + '</div>');
      }

      sbAutomation.showEmailSubmit();

    }

  }

  // Detect enter key
  sbAutomation.submitChatTextOnEnter = function(e) {

    if ( e.target.value && e.target.value != '' && e.keyCode == 13 ) {

      sbAutomation.submitText(e.target.value);

      e.target.value = '';

    }

  }

  // Detect enter key
  sbAutomation.submitEmailOnEnter = function(e) {

    if ( e.target.value && e.target.value != '' && e.keyCode == 13 ) {

      var id = $(e.target).closest('.sb-notification-box').attr('id').split('-')[1];

      e.preventDefault();

      sbAutomation.emailSubmitted( id );

    }

  }

  // Add chat text on click
  sbAutomation.sendText = function(e) {
    e.stopImmediatePropagation();
    var text = $('#' + sbAutomation.activeID + ' .sb-text-input').val();
    if ( text && text != '' ) {
      sbAutomation.submitText(text);
      $('#' + sbAutomation.activeID + ' .sb-text-input').val('').focus();
    }
  }

  // User entered a message
  sbAutomation.submitText = function(text) {

    var fullMsg = window.localStorage.getItem('sb-full-msg');

    $('#' + sbAutomation.activeID + ' .sb-box-rows').append('<div class="sb-row sb-visitor-row">' + text + '</div>');

    if( fullMsg ) {
      fullMsg += '\n' + text; 
    } else {
      fullMsg = text;
    }

    window.localStorage.setItem( 'sb-full-msg', fullMsg );

    setTimeout( function() {
      sbAutomation.showEmailSubmit();
    }, 5000 );
    
  }

  // Show email field
  sbAutomation.showEmailSubmit = function() {

    var emailRow = $('#' + sbAutomation.activeID + ' .sb-email-row');

    // don't show duplicates
    if( emailRow.hasClass('sb-show') )
      return;

    emailRow.removeClass('sb-hide').addClass('sb-show');

    emailRow.prepend( '<span class="sb-away-msg">' + sbAutomation.activeOptions.optinMsg + '</span>' );

    $('#' + sbAutomation.activeID + ' .sb-email-input').focus();
  }

  sbAutomation.emailSubmitClick = function(e) {

    e.stopImmediatePropagation();
    e.preventDefault();

    var id = $(e.target).closest('.sb-notification-box').attr('id').split('-')[1];

    sbAutomation.emailSubmitted( id );
  }

  // User submitted email, send to server
  sbAutomation.emailSubmitted = function( id ) {

    var email = $('#sb-' + id + ' .sb-email-input').val();

    if( !email )
      return;

    // validate email
    if( email.indexOf('@') === -1 || email.indexOf('.') === -1 ) {
      alert('Something is wrong with your email, please try again.')
      return;
    }

    // honeypot
    if( $( '#sb-' + id + ' input[name=sb_hp]').val() != "" )
      return;

    if( window.sbAutoVars[id].emailProvider === 'ck' ) {
      sbAutomation.ckSubscribe( email, id );
      return;
    } else if( window.sbAutoVars[id].emailProvider === 'mc' ) {
      sbAutomation.mcSubscribe( id );
      return;
    }

    // send message to server
    // concatenate messages together
    var fullMsg = window.localStorage.getItem('sb-full-msg');

    sbAutomation.sendMsg( email, fullMsg, id );

  }


  // Convertkit subscribe through API
  sbAutomation.ckSubscribe = function( email, id ) {

    var options = window.sbAutoVars[id];

    var formId = $('#sb-' + id + ' .ck-form-id').val();
    var apiUrl = 'https://aapi.convertkit.com/v3/forms/' + formId + '/subscribe';

    $.ajax({
      method: "POST",
      url: apiUrl,
      data: { email: email, api_key: options.ckApi }
      })
      .done(function(msg) {
        console.log(msg);

        // reset to defaults
        sbAutomation.showConfirmation( id );
        $('#sb-' + id + ' .sb-email-row').hide();
        sbAutomation.interacted( id );

      })
      .fail(function(err) {

        $('#sb-' + id + ' .sb-email-row').prepend('<span id="sb-err">There seems to be a problem, can you try again?</span>');

        setTimeout( function() {
          $('#sb-err').remove();
        }, 3000);

        console.log(err);
      });

  }

  // Submit the form with an ajax/jsonp request.
  // https://github.com/rydama/mailchimp-ajax-signup/blob/master/ajax-subscribe.html
  // Based on http://stackoverflow.com/a/15120409/215821
  sbAutomation.mcSubscribe = function( id ) {

    var form = $('#sb-' + id + ' form.sb-mc-form');

    $.ajax({
        type: "GET",
        url: form.attr("action"),
        data: form.serialize(),
        cache: false,
        dataType: "jsonp",
        jsonp: "c", // trigger MailChimp to return a JSONP response
        contentType: "application/json; charset=utf-8",
        error: function(error){
            // According to jquery docs, this is never called for cross-domain JSONP requests
            console.log(error)
        },
        success: function(data){
            if (data.result != "success") {

                var message = data.msg || "Sorry. Unable to subscribe. Please try again later.";
                if (data.msg && data.msg.indexOf("already subscribed") >= 0) {
                    message = "You're already subscribed. Thank you.";
                }

                $('#sb-' + id + ' .sb-email-row').prepend('<span id="sb-err">' + message + '</span>');

                setTimeout( function() {
                  $('#sb-err').remove();
                }, 3000);

            } else {
              // reset to defaults
              sbAutomation.showConfirmation( id );
              $('#sb-' + id + ' .sb-email-row').hide();
              sbAutomation.interacted( id );
            }
        }
    });

  }

  // Send email along with chat message to server
  sbAutomation.sendMsg = function( email, msg, id ) {

    $.ajax({
      method: "GET",
      url: window.sbAutoVars.ajaxurl,
      data: { email: email, id: id, msg: msg, action: 'sb_send_email', nonce: window.sbAutoVars.sbNonce }
      })
      .done(function(msg) {
        console.log(msg);

        // reset to defaults
        sbAutomation.clearChat();
        sbAutomation.showConfirmation( id );

        sbAutomation.interacted( id );

      })
      .fail(function(err) {
        console.log(err);
      });
  }

  sbAutomation.clearChat = function() {

    if( !$(sbAutomation.chatBox).hasClass('sb-hide') ) {
      window.localStorage.removeItem('sb-full-msg');
      $('#' + sbAutomation.activeID + ' .sb-visitor-row, #' + sbAutomation.activeID + ' .sb-away-msg').remove();
    }

    sbAutomation.hide( sbAutomation.noteOptin );

  }

  // callback when interaction link clicked
  sbAutomation.interactionLink = function(e) {
    e.stopImmediatePropagation();
    var id = $(this).data('id');
    sbAutomation.interacted( id );
  }

  // Callback for user interaction
  sbAutomation.interacted = function( id ) {

    var params = { action: 'sb_track_event', nonce: window.sbAutoVars.sbNonce, id: id };

    // store interaction data
    $.ajax({
      method: "GET",
      url: window.sbAutoVars.ajaxurl,
      data: params
      })
      .done(function(msg) {
        console.log(msg);
      })
      .fail(function(err) {
        console.log(err);
      });

    sbAutomation.setCookie('sb_' + id + '_int', 'true', 1 );

  }

  sbAutomation.handleForms = function(e) {

    var id = $(e.target).closest('.sb-notification-box').attr('id').split('-')[1];

    setTimeout( function() {
      sbAutomation.interacted(id);
      $(e.target).closest('.sb-email-row').hide();
      sbAutomation.showConfirmation(id);
    }, 1000);

  }

  sbAutomation.showConfirmation = function( id ) {

    var options = window.sbAutoVars[id];

    var msg = ( options.confirmMsg != '' ? options.confirmMsg : "Thanks!" );

    if( options.position === 'sb-banner-top' ) {

      $('#sb-' + id + ' .sb-box-rows').addClass('sb-full-width').html(msg);

    } else {

      $('#sb-' + id + ' .sb-first-row').html(msg);
    }

  }

  sbAutomation.init();

  window.sbAutomation = sbAutomation;

})(window, document, jQuery);