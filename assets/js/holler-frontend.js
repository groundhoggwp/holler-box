(function(window, document, $, undefined){

  var holler = {};

  holler.init = function() {

    // set defaults
    holler.newVisitor = false;

    // determine if new or returning visitor
    holler.checkCookie();

    // if we have active items, loop through them
    if( window.hollerVars.active )
      holler.doActive( window.hollerVars.active );
    
  }

  // determine if new or returning visitor
  holler.checkCookie = function() {

    if( holler.getCookie('hwp_visit') === "" ) {

      // New visitor, set visitor cookie. This tracks original visit
      holler.setCookie('hwp_visit', Date.now(), parseInt( window.hollerVars.expires ));
      holler.setCookie('hwp_new', 'true', 1 );
      holler.newVisitor = true;

    } else if( holler.getCookie('hwp_new') != "" ) {
      holler.newVisitor = true;
    }

  }

  // Notification box exists
  holler.doActive = function( ids ) {

    for (var i = 0; i < ids.length; i++) {
      holler.doChecks( ids[i] );
    }

  }

  // Check if we should display item
  holler.doChecks = function( id, forceShow ) {

    // If markup doesn't exist, bail
    var item = document.getElementById( 'hwp-' + id );
    if( !item )
      return;

    var vars = window.hollerVars[id];

    if( !vars.visitor )
      return;

    if( vars.visitor === 'new' && holler.newVisitor != true )
      return;

    if( vars.visitor === 'returning' && holler.newVisitor != false )
      return;

    // hide after interacted with?
    if( vars.showSettings === 'interacts' && holler.getCookie( 'hwp_' + id + '_int' ) != '' )
      return;

    var shown = holler.getCookie( 'hwp_' + id + '_shown' );

    // only show once?
    if( vars.showSettings === 'hide_for' && shown === 'true' )
      return;

    // passes checks, show it

    holler.floatingBtn = document.getElementById('hwp-floating-btn');

    holler.noteListeners( id );

    if( vars.bgColor )
      item.style.backgroundColor = vars.bgColor;

    if( vars.btnColor1 )
      $('#' + 'hwp-' + id + ' .hwp-email-btn, #hwp-floating-btn' ).css('background-color', vars.btnColor1 );

    // Delay showing item?
    if( vars.display_when != 'scroll' ) {

      // don't show yet if using exit detect or link activation. Shows when we use the forceShow argument
      if( vars.display_when === 'exit' && !forceShow || vars.display_when === 'link' && !forceShow )
        return;

      var delay = ( vars.display_when === 'delay' ? parseInt( vars.delay ) : 0 );

      setTimeout( function() {
        holler.showNote( id );

        // Track that note was shown. Here because this loads once per page, showNote() loads on hide/show, too many times.
        if( holler.getCookie( 'hwp-' + id + '_hide' ) != 'true' )
          holler.countNoteShown(id);

      }, delay * 1000 );

    } else {

      // Use scroll detect setting
      holler.detectScroll( id );

    }

  }

  // Event listeners
  holler.noteListeners = function( id ) {

    $('body')
    .on('click', '.hwp-close', holler.hideItem )
    .on('click', '#hwp-floating-btn', holler.btnClick )
    .on('click', '#hwp-' + id + ' a', holler.interactionLink )
    .on('click', '.hwp-text i', holler.sendText )
    .on('click', '#hwp-' + id + ' .hwp-email-btn', holler.emailSubmitClick )

    $('.hwp-text-input').on('keypress', holler.submitChatTextOnEnter );

    $('#hwp-' + id + ' .hwp-email-input').on('keypress', holler.submitEmailOnEnter );

  }

  // detect when user scrolls partway down the page
  // https://www.sitepoint.com/jquery-capture-vertical-scroll-percentage/
  holler.detectScroll = function( id ) {

    $(window).scroll(
      // debounce so we don't adversely affect scroll performance
      holler.debounce( function() {

        var wintop = $(window).scrollTop(), docheight = $(document).height(), winheight = $(window).height();
        var  scrolltrigger = 0.5;

        // when user scrolls below fold, show it
        if( (wintop/(docheight-winheight)) > scrolltrigger && !holler.show['hwp-' + id] ) {
          holler.showNote( id );
          holler.show['hwp-' + id] = true

          // count the impression
          if( holler.getCookie( 'hwp-' + id + '_hide' ) != 'true' )
            holler.countNoteShown(id);
        }
      }, 250) )

  }

  // Show/hide elements based on options object
  holler.showNote = function( id ) {

    var options = window.hollerVars[id];

    var item = document.getElementById( 'hwp-' + id );

    // visitor has hidden this item, don't show box
    if( holler.getCookie( 'hwp-' + id + '_hide' ) === 'true' ) {

      // hide box, show btn
      holler.transitionOut( item );

      if( options.hideBtn != '1' && options.position != 'holler-banner' )
        holler.transitionIn( holler.floatingBtn );

    } else {

      // Show the box and what's in it
      holler.transitionIn( item );

      // box content
      $('#hwp-' + id + ' .hwp-first-row').html( options.content );

      if( options.hideBtn != '1' && options.position != 'holler-banner' )
        holler.transitionOut( holler.floatingBtn );

      // Show email opt-in, but not if we have a chatbox (it gets shown after user input)
      if( options.showEmail === "1" && options.showChat != "1" )
        holler.showEmailSubmit( id );

      // show the chatbox
      if( options.showChat === '1' )
        holler.transitionIn( document.querySelector( '#hwp-' + id + ' .hwp-chat' ) );

    }

    // Button should not be shown
    if( options.hideBtn === '1' )
      holler.hide( holler.floatingBtn );

    if( options.position === 'holler-banner' && holler.getCookie( 'hwp-' + id + '_hide' ) != 'true' )
      holler.toggleBnrMargin( id );

    // Should we hide it
    if( options.hide_after === 'delay' ) {

      setTimeout( function() {
        holler.transitionOut( item );
      }, parseInt( options.hide_after_delay ) * 1000 );

    }

  }

  // Set a cookie. https://www.w3schools.com/js/js_cookies.asp
  holler.setCookie = function(cname, cvalue, exdays, path) {
      var d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      var expires = "expires="+ d.toUTCString();
      if( !path )
        path = '/';
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=" + path;
      return cvalue;
  }

  // Get a cookie by name. https://www.w3schools.com/js/js_cookies.asp
  holler.getCookie = function(cname) {
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
  holler.debounce = function(fn, delay) {
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
  holler.toggleBnrMargin = function( id, hide ) {

    if( hide && hide === true ) {
      $('body').css('margin-top', '');
    } else {
      var height = $('#hwp-' + id).outerHeight();
      $('body').css('margin-top', height);
    }
    
  }

  // check how old cookie is
  // return true or false
  // holler.lastSeen = function( cookie ) {

  //   // Display to everyone if no lastSeen filter is set
  //   if( !window.hollerVars.lastSeen || window.hollerVars.lastSeen === 'none' ) {
  //     console.log("lastSeen true (show the thing)");
  //     return true;
  //   }
    
  //   // Compare cookie age and lastSeen setting. If we want to show something to people who visited at least 2 days ago, lastSeen would be 2.
  //   var daysAgo = parseInt( window.hollerVars.lastSeen );
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
  holler.hideItem = function( e ) {

    e.stopImmediatePropagation();

    var closest = $(e.target).closest('.holler-box');

    var id = closest.attr('id').split('-')[1];

    holler.toggleHide( id );

    if( closest.hasClass('holler-banner') )
      holler.toggleBnrMargin( id, true );

    // prevent duplicate firing
    return false;

  }

  // floating button clicked
  holler.btnClick = function(e) {

    e.stopImmediatePropagation();

    var id = $(this).data('id');

    holler.toggleHide( id );

  }

  // Handle show/hide storage items, then run showNote func. Used when floating btn is clicked
  holler.toggleHide = function( id ) {

    var hide = holler.getCookie( 'hwp-' + id + '_hide');

    if( hide === 'true' ) {
      holler.setCookie( 'hwp-' + id + '_hide', 'true', -1 );
    } else {
      holler.setCookie( 'hwp-' + id + '_hide', 'true', 1 );
    }

    holler.showNote( id );

  }

  holler.transitionIn = function(item) {

    item.style.display = 'block';

    setTimeout( function() {
      $(item).addClass('hwp-transition-in').removeClass('hwp-hide');
    }, 1);

    setTimeout( function() {
      $(item).removeClass('hwp-transition-in').addClass('hwp-show');
    }, 300);

  }

  holler.transitionOut = function(item) {
    
    $(item).addClass('hwp-transition-out').removeClass('hwp-show');

    setTimeout( function() {
      $(item).removeClass('hwp-transition-out').addClass('hwp-hide');
      $(item).css('display','');
    }, 200);

  }

  holler.show = function(item) {
    
    item.style.display = 'block';
    $(item).removeClass('hwp-hide').addClass('hwp-show');

  }

  holler.hide = function(item) {
    
    $(item).removeClass('hwp-show').addClass('hwp-hide');
    $(item).css('display','');

  }

  // See if there's a message from before that hasn't been submitted yet
  holler.checkExistingMsg = function() {
    var msg = window.localStorage.getItem('hwp-full-msg');

    if( msg && msg != '' ) {

      var msgs = msg.split("/n");

      for (var i = 0; i < msgs.length; i++) {
        $( '#' + holler.activeID + ' .hwp-box-rows').append('<div class="hwp-row hwp-visitor-row">' + msgs[i] + '</div>');
      }

      holler.showEmailSubmit();

    }

  }

  // Detect enter key
  holler.submitChatTextOnEnter = function(e) {

    if ( e.target.value && e.target.value != '' && e.keyCode == 13 ) {

      var id = $(e.target).closest('.holler-box').attr('id').split('-')[1];

      holler.submitText(e.target.value, id);

      e.target.value = '';

    }

  }

  // Detect enter key
  holler.submitEmailOnEnter = function(e) {

    if ( e.target.value && e.target.value != '' && e.keyCode == 13 ) {

      var id = $(e.target).closest('.holler-box').attr('id').split('-')[1];

      e.preventDefault();

      holler.emailSubmitted( id );

    }

  }

  // Add chat text on icon click
  holler.sendText = function(e) {
    e.stopImmediatePropagation();

    var id = $(e.target).closest('.holler-box').attr('id').split('-')[1];

    var text = $('#hwp-' + id + ' .hwp-text-input').val();

    if ( text && text != '' ) {
      holler.submitText(text, id);
      $('#hwp-' + id + ' .hwp-text-input').val('').focus();
    }
  }

  // User entered a message
  holler.submitText = function(text, id) {

    var fullMsg = window.localStorage.getItem('hwp-full-msg');

    $('#hwp-' + id + ' .hwp-box-rows').append('<div class="hwp-row hwp-visitor-row">' + text + '</div>');

    if( fullMsg ) {
      fullMsg += '\n' + text; 
    } else {
      fullMsg = text;
    }

    window.localStorage.setItem( 'hwp-full-msg', fullMsg );

    setTimeout( function() {
      holler.showEmailSubmit( id );
    }, 5000 );
    
  }

  // Show email field
  holler.showEmailSubmit = function( id ) {

    var emailRow = $('#hwp-' + id + ' .hwp-email-row');

    var options = window.hollerVars[id];

    // don't show duplicates
    if( emailRow.hasClass('hwp-show') )
      return;

    // Setup localized vars
    var textInput = document.querySelector('#hwp-' + id + ' .hwp-email-input');
    
    textInput.setAttribute('placeholder', options.placeholder );

    $('.hwp-away-msg').remove();

    $('#hwp-' + id ).addClass('has-optin');

    emailRow.removeClass('hwp-hide').addClass('hwp-show');

    emailRow.prepend( '<span class="hwp-away-msg">' + options.optinMsg + '</span>' );

  }

  // handle click of email submit btn
  holler.emailSubmitClick = function(e) {

    e.stopImmediatePropagation();
    e.preventDefault();

    var id = $(e.target).closest('.holler-box').attr('id').split('-')[1];

    holler.emailSubmitted( id );
  }

  // User submitted email, send to server
  holler.emailSubmitted = function( id ) {

    var email = $('#hwp-' + id + ' .hwp-email-input').val();

    if( !email )
      return;

    // validate email
    if( email.indexOf('@') === -1 || email.indexOf('.') === -1 ) {
      alert('Something is wrong with your email, please try again.')
      return;
    }

    // honeypot
    if( $( '#hwp-' + id + ' input[name=hwp_hp]').val() != "" )
      return;

    // do different things for email providers
    if( window.hollerVars[id].emailProvider === 'ck' ) {
      holler.ckSubscribe( email, id );
      return;
    } else if( window.hollerVars[id].emailProvider === 'mc' ) {
      holler.mcSubscribe( email, id );
      return;
    }

    // send default message to server
    // concatenate messages together
    var fullMsg = window.localStorage.getItem('hwp-full-msg');

    holler.sendMsg( email, fullMsg, id );

  }


  // Convertkit subscribe through API
  holler.ckSubscribe = function( email, id ) {

    var options = window.hollerVars[id];

    var formId = $('#hwp-' + id + ' .ck-form-id').val();
    var apiUrl = 'https://api.convertkit.com/v3/forms/' + formId + '/subscribe';

    $.ajax({
      method: "POST",
      url: apiUrl,
      data: { email: email, api_key: options.ckApi }
      })
      .done(function(msg) {

        // reset to defaults
        holler.showConfirmation( id );
        $('#hwp-' + id + ' .hwp-email-row').hide();
        holler.conversion( id );

      })
      .fail(function(err) {

        $('#hwp-' + id + ' .hwp-email-row').prepend('<span id="hwp-err">There seems to be a problem, can you try again?</span>');

        setTimeout( function() {
          $('#hwp-err').remove();
        }, 3000);

        console.log(err);
      });

  }

  // Submit to MailChimp
  holler.mcSubscribe = function( email, id ) {

    var listId = $('#hwp-' + id + ' .mc-list-id').val();

    if( !listId ) {
      alert("MailChimp list ID is missing.");
      return;
    }

    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: { email: email, list_id: listId, action: 'hwp_mc_subscribe', nonce: window.hollerVars.hwpNonce }
      })
      .done(function(msg) {

        // reset to defaults
        holler.showConfirmation( id );
        $('#hwp-' + id + ' .hwp-email-row').hide();
        holler.conversion( id );

      })
      .fail(function(err) {
        console.log(err);
      });

  }

  // Send email along with chat message to server
  holler.sendMsg = function( email, msg, id ) {

    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: { email: email, id: id, msg: msg, action: 'hwp_send_email', nonce: window.hollerVars.hwpNonce }
      })
      .done(function(msg) {

        // reset to defaults
        holler.clearChat( id );
        holler.showConfirmation( id );

        holler.conversion( id );

      })
      .fail(function(err) {
        console.log(err);
      });
  }

  holler.clearChat = function( id ) {

    if( !$( '#hwp-' + id + ' .hwp-chat' ).hasClass('hwp-hide') ) {
      window.localStorage.removeItem('hwp-full-msg');
      $('#hwp-' + id + ' .hwp-visitor-row, #hwp-' + id + ' .hwp-away-msg').remove();
    }

    holler.hide( $( '#hwp-' + id + ' .hwp-email-row' ) );

  }

  // callback when interaction link clicked
  holler.interactionLink = function(e) {
    e.stopImmediatePropagation();

    var id = $(e.target).closest('.holler-box').attr('id').split('-')[1];

    holler.conversion( id );
  }

  // Callback for user interaction
  holler.conversion = function( id ) {

    var params = { action: 'hwp_track_event', nonce: window.hollerVars.hwpNonce, id: id };

    // store interaction data
    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: params
      })
      .done(function(msg) {
        // console.log(msg);
      })
      .fail(function(err) {
        console.log(err);
      });

    holler.setCookie('hwp_' + id + '_int', 'true', 1 );

  }

  // show confirmation message after email submitted
  holler.showConfirmation = function( id ) {

    var options = window.hollerVars[id];

    var msg = ( options.confirmMsg != '' ? options.confirmMsg : "Thanks!" );

    if( options.position === 'holler-banner' ) {

      $('#hwp-' + id + ' .hwp-box-rows').addClass('hwp-full-width').html(msg);

    } else {

      $('#hwp-' + id + ' .hwp-first-row').html(msg);
    }

    if( options.showChat === '1' ) {
      holler.clearChat( id );
    }

  }

  // Callback for tracking views
  holler.countNoteShown = function( id ) {

    var options = window.hollerVars[id];

    var hideFor = ( options.hideForDays ? parseInt( options.hideForDays ) : 1 );
    holler.setCookie( 'hwp_' + id + '_shown', 'true', hideFor );

    var params = { action: 'hwp_track_view', nonce: window.hollerVars.hwpNonce, id: id };

    // store interaction data
    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: params
      })
      .done(function(msg) {
        //console.log(msg);
      })
      .fail(function(err) {
        //console.log(err);
      });

  }

  holler.init();

  window.hollerbox = holler;

})(window, document, jQuery);