(function(window, document, $, undefined){

  var holler = {};

  holler.init = function() {

    // set defaults
    holler.newVisitor = false;

    holler.checkForPreview();

  }

  // Polyfill for Date.now() on IE
  if ( ! Date.now ) {

    Date.now = function now() {

      return new Date().getTime();

    };

  }

  function hollerGetUrlParameter( name ) {

    name = name.replace( /[\[]/, '\\[').replace(/[\]]/, '\\]' );

    var regex = new RegExp( '[\\?&]' + name + '=([^&#]*)' );

    var results = regex.exec( location.search );

    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));

  };

  // if using the ?hwp_preview=ID query string, show it no matter what
  holler.checkForPreview = function() {

    if( hollerGetUrlParameter( 'hwp_preview' ) ) {

      var id = hollerGetUrlParameter( 'hwp_preview' )

      holler.showNote( id );

      holler.noteListeners( id );

      return;

    }

    // No preview, continue...
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

    // maybe hide on certain devices
    if( window.hollerVars.isMobile === "" && vars.devices === "mobile_only" ) {
      return;
    } else if( window.hollerVars.isMobile === "1" && vars.devices === "desktop_only" ) {
      return;
    }

    var shown = holler.getCookie( 'hwp_' + id + '_shown' );

    // only show once?
    if( vars.showSettings === 'hide_for' && shown === 'true' && !forceShow )
      return;

    // passes checks, show it

    if( vars.display_when === 'exit' ) {

      // bail if it's been closed already
      if( holler.getCookie( 'hwp-' + id + '_hide' ) === 'true' )
        return;

      // add exit listener
      $('body').on( 'mouseleave', holler.mouseExit );

    }

    // Delay showing item?
    if( vars.display_when != 'scroll' ) {

      // don't show yet if using exit detect or link activation. Shows when we use the forceShow argument
      if( vars.display_when === 'exit' && !forceShow || vars.display_when === 'link' && !forceShow )
        return;

      var delay = ( vars.display_when === 'delay' ? parseInt( vars.delay ) : 0 );

      // should we show popup?
      if( vars.type === 'hwp-popup' && vars.showSettings === 'always' ) {

        // remove cookie so popup shows properly
        holler.setCookie( 'hwp-' + id + '_hide', '', -1 );

      } else if( vars.type === 'hwp-popup' && vars.showSettings === 'interacts' && holler.getCookie( 'hwp-' + id + '_hide' ) === 'true' ) {

        // don't show popup if user has hidden
        return;

      }

      setTimeout( function() {
        holler.showNote( id );

        // Track that note was shown. Here because this loads once per page, showNote() loads on hide/show, too many times.
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
    .on('click', '.hwp-floating-btn', holler.btnClick )
    .on('click', '.hwp-text i', holler.sendText )
    .on('click', '#hwp-' + id + ' .hwp-email-btn', holler.emailSubmitClick )
    .on('click', '.hwp-backdrop', holler.bdClick );

    $('.hwp-text-input').on('keypress', holler.submitChatTextOnEnter );

    $('#hwp-' + id + ' .hwp-email-input').on('keypress', holler.submitEmailOnEnter );

    $('#hwp-' + id + ' a').on('click', holler.interactionLink )

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
          holler.countNoteShown(id);
        }
      }, 250) )

  }

  // Show/hide elements based on options object
  holler.showNote = function( id ) {

    var options = window.hollerVars[id];

    var item = document.getElementById( 'hwp-' + id );

    // show/hide backdrop for popups
    if( options.type === 'hwp-popup' && $(item).hasClass('hwp-show') ) {
      holler.transitionOut( $('#hwp-bd-' + id) );
    } else if( options.type === 'hwp-popup' ) {
      holler.transitionIn( $('#hwp-bd-' + id) );
    }

    // visitor has hidden this item, don't show box unless it's a popup
    if( holler.getCookie( 'hwp-' + id + '_hide' ) === 'true' ) {

      // hide box, show btn
      holler.transitionOut( item );

      // if set to show every page load and floating btn is hidden, need to delete hide cookie so it shows properly
      if( options.showSettings === 'always' ) {

        if( options.hideBtn === '1' || options.type == 'holler-banner' || options.type == 'footer-bar' ) {
          holler.setCookie( 'hwp-' + id + '_hide', '', -1 );
        }
        
      }

      // show stuff that should always be shown. Includes holler banner and footer bar if show every page load is selected
      if( options.hideBtn != '1' && options.type != 'holler-banner' || options.type == 'holler-banner' && options.showSettings === 'always' ) {
        holler.transitionIn( $( '.hwp-btn-' + id ) );
      }

    } else {

      if( options.type === 'fomo' && options.fomoLoopTimes ) {
        holler.fomoLoopStart( id, item, options.fomoLoopTimes, 1 );
      } else if( options.type === 'fomo' ) {
        holler.fomoContent( id, item );
      } else {
        // Show the box and what's in it
        holler.transitionIn( item );
      }

      if( options.hideBtn != '1' && options.type != 'holler-banner' )
        holler.transitionOut( $( '.hwp-btn-' + id ) );

      // Show email opt-in, but not if we have a chatbox (it gets shown after user input)
      if( options.showEmail === "1" && options.showChat != "1" )
        holler.showEmailSubmit( id );

      // show the chatbox
      if( options.showChat === '1' )
        holler.transitionIn( document.querySelector( '#hwp-' + id + ' .hwp-chat' ) );

    }

    // Button should not be shown
    if( options.hideBtn === '1' )
      holler.hide( $( '.hwp-btn-' + id ) );

    if( options.type === 'holler-banner' && holler.getCookie( 'hwp-' + id + '_hide' ) != 'true' )
      holler.toggleBnrMargin( id );
    

    // Should we hide it after a delay? Skip if showing multiple fomos
    if( options.hide_after === 'delay' && !options.fomoDisplayTime ) {

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

    // reset
    $('body').css('padding-top', '');

    if( !hide ) {
      var height = $('#hwp-' + id).outerHeight();
      $('body').css('padding-top', height);
    }
    
  }

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

    console.log('hide ' + id, hide)

    if( hide === 'true' ) {
      holler.setCookie( 'hwp-' + id + '_hide', 'true', -1 );
    } else {
      holler.setCookie( 'hwp-' + id + '_hide', 'true', 1 );
    }

    holler.showNote( id );

  }

  holler.transitionIn = function(item) {

    $(item).css('display','block');

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

    if( !email ) {
      var msg;
      if( window.hollerVars.emailErr ) {
        msg = window.hollerVars.emailErr;
      } else {
        msg = 'Please enter your email.';
      }
      alert( msg + ' err1' );
      return;
    }

    var name = $('#hwp-' + id + ' .hwp-name').val();

    var title = $('#hwp-' + id + ' .holler-title').text();

    // validate email
    if( email.indexOf('@') === -1 || email.indexOf('.') === -1 ) {
      alert( window.hollerVars.emailErr + ' err2')
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
    } else if( window.hollerVars[id].emailProvider === 'ac' ) {
      holler.acSubscribe( email, id );
      return;
    } else if( window.hollerVars[id].emailProvider === 'mailpoet' ) {
      holler.mpSubscribe( email, id );
      return;
    } else if( window.hollerVars[id].emailProvider === 'drip' ) {
      holler.dripSubscribe( email, id );
      return;
    }

    // send default message to server
    // concatenate messages together
    var fullMsg = window.localStorage.getItem('hwp-full-msg');

    holler.sendMsg( email, name, fullMsg, id, title );

  }


  // ConvertKit subscribe through API
  holler.ckSubscribe = function( email, id ) {

    var options = window.hollerVars[id];

    var formId = $('#hwp-' + id + ' .ck-form-id').val();
    var apiUrl = 'https://api.convertkit.com/v3/forms/' + formId + '/subscribe';

    var name = $('#hwp-' + id + ' .hwp-name').val();

    holler.showSpinner( id );

    $.ajax({
      method: "POST",
      url: apiUrl,
      data: { email: email, api_key: options.ckApi, first_name: name }
      })
      .done(function(msg) {

        // reset to defaults
        holler.showConfirmation( id );
        $('#hwp-' + id + ' .hwp-email-row').hide();
        holler.conversion( id );

      })
      .fail(function(err) {

        holler.hideSpinner();

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
    var name = $('#hwp-' + id + ' .hwp-name').val();

    var interestIds = $('#hwp-' + id + ' .mc-interests').val();
    if( interestIds )
      interestIds = JSON.parse( interestIds );

    if( !listId ) {
      alert("MailChimp list ID is missing.");
      return;
    }

    holler.showSpinner( id );

    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: { email: email, list_id: listId, action: 'hwp_mc_subscribe', interests: interestIds, nonce: window.hollerVars.hwpNonce, name: name }
      })
      .done(function(msg) {

        // reset to defaults
        holler.showConfirmation( id );
        $('#hwp-' + id + ' .hwp-email-row').hide();
        holler.conversion( id );

      })
      .fail(function(err) {
        console.log(err);
        holler.hideSpinner();
      });

  }

  // Submit to Active Campaign
  holler.acSubscribe = function( email, id ) {

    var listId = $('#hwp-' + id + ' .ac-list-id').val();
    var name = $('#hwp-' + id + ' .hwp-name').val();

    if( !listId ) {
      alert("List ID is missing.");
      return;
    }

    holler.showSpinner( id );

    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: { email: email, list_id: listId, action: 'hwp_ac_subscribe', nonce: window.hollerVars.hwpNonce, name: name }
      })
      .done(function(msg) {

        // console.log(msg)

        if( msg.success == true ) {

          // reset to defaults
          holler.showConfirmation( id );
          $('#hwp-' + id + ' .hwp-email-row').hide();
          holler.conversion( id );

        } else {
          console.warn(msg)
          $('#hwp-' + id + ' .hwp-first-row').html('<p>' + msg.data + '</p>');
          holler.hideSpinner();
        }

      })
      .fail(function(err) {
        console.warn(err);
        holler.hideSpinner();
      });

  }

  // Submit to Drip
  holler.dripSubscribe = function( email, id ) {

    if( !window._dcq ) {
      alert("Drip code not installed properly.");
      return;
    }

    var tags = $('#hwp-' + id + ' .drip-tags').val();
    var name = $('#hwp-' + id + ' .hwp-name').val();

    var tagArr = tags.split(",");

    holler.showSpinner( id );

    holler.dripid = id;

    var response = _dcq.push(["identify", {
      email: email,
      first_name: name,
      tags: tagArr,
      success: holler.dripResponse,
      failure: holler.dripResponse
    }]);

  }

  holler.dripResponse = function( response ) {

    holler.hideSpinner();

    if( response.success == true ) {

      // reset to defaults
      holler.showConfirmation( holler.dripid );
      $('#hwp-' + holler.dripid + ' .hwp-email-row').hide();
      holler.conversion( holler.dripid );

    } else {
      console.warn(response);
      $('#hwp-' + holler.dripid + ' .hwp-first-row').html('<p>' + response.error + '</p>');
    }

  }

  // Submit to MailPoet
  holler.mpSubscribe = function( email, id ) {

    var listId = $('#hwp-' + id + ' .mailpoet-list-id').val();

    if( !listId ) {
      alert("List ID is missing.");
      return;
    }

    var name = $('#hwp-' + id + ' .hwp-name').val();

    holler.showSpinner( id );

    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: { email: email, list_id: listId, action: 'hwp_mailpoet_subscribe', nonce: window.hollerVars.hwpNonce, name: name }
      })
      .done(function(msg) {

        // console.log(msg)

        // reset to defaults
        holler.showConfirmation( id );
        $('#hwp-' + id + ' .hwp-email-row').hide();
        holler.conversion( id );

      })
      .fail(function(err) {
        console.log(err);
        holler.hideSpinner();
      });

  }

  // Send email along with chat message to server
  holler.sendMsg = function( email, name, msg, id, title ) {

    holler.showSpinner( id );

    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: { email: email, name: name, id: id, msg: msg, action: 'hwp_send_email', nonce: window.hollerVars.hwpNonce, title: title }
      })
      .done(function(msg) {

        // reset to defaults
        holler.clearChat( id );
        holler.showConfirmation( id );

        holler.conversion( id );

      })
      .fail(function(err) {
        console.log(err);
        holler.hideSpinner();
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

    // don't count attribution clicks as conversions
    if( e.target.href === 'http://hollerwp.com/' ) 
      return;

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

        var redirect = window.hollerVars[id].redirect;

        if( redirect ) {

          $('#hwp-' + id + ' .hwp-first-row').append( ' Redirecting... <img src="' + window.hollerVars.pluginUrl + 'assets/img/loading.gif" class="hwp-loading" />');

          setTimeout( function() {
            window.location.href = redirect;
          }, 1000);

        }

      })
      .fail(function(err) {
        console.log(err);
      });

    holler.setCookie('hwp_' + id + '_int', 'true', 1 );

  }

  // show confirmation message after email submitted
  holler.showConfirmation = function( id ) {

    holler.hideSpinner();

    var options = window.hollerVars[id];

    var msg = ( options.confirmMsg != '' ? options.confirmMsg : "Thanks!" );

    if( options.type === 'holler-banner' ) {

      $('#hwp-' + id + ' .hwp-box-rows').addClass('hwp-full-width').html(msg);

      holler.toggleBnrMargin( id );

    } else {

      $('#hwp-' + id + ' .hwp-first-row').html(msg);

    }

    if( options.showChat === '1' ) {
      holler.clearChat( id );
    }

  }

  // Callback for tracking views
  holler.countNoteShown = function( id ) {

    // add click listeners and such. Doing it here because it's most reliable way of knowing when note is actually shown on page.
    holler.noteListeners( id );

    var options = window.hollerVars[id];

    var hideFor = ( options.hideForDays ? parseInt( options.hideForDays ) : 1 );
    holler.setCookie( 'hwp_' + id + '_shown', 'true', hideFor );

    // don't track view if it's disabled
    if( window.hollerVars.disable_tracking === '1' ) {
      return;
    }

    var params = { action: 'hwp_track_view', nonce: window.hollerVars.hwpNonce, id: id };

    // store interaction data
    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: params
      })
      .done(function(msg) {
        // console.log('track', msg);
      })
      .fail(function(err) {
        //console.log(err);
      });

  }

  holler.showSpinner = function( id ) {

    $( '#hwp-' + id + ' .hwp-email-row' ).html( '<img src="' + window.hollerVars.pluginUrl + 'assets/img/loading.gif" class="hwp-loading" />');
    $('#hwp-' + id + ' .hwp-name-row').hide();

  }

  holler.hideSpinner = function() {
    $('img.hwp-loading').remove();
  }

  holler.bdClick = function(e) {

    e.stopImmediatePropagation();

    var id = $(e.currentTarget).data('id');

    holler.toggleHide( id );

  }

  // detect mouse leave and show a box
  holler.mouseExit = function(e) {

    var el = $('.holler-box.hwp-show-on-exit')[0];

    if( !el )
      return;

    if( $(el).hasClass('hwp-show') )
      return;
    
    var id = el.id.split('-')[1];

    holler.doChecks( id, true );

  }

  // multiple fomos start here
  holler.fomoLoopStart = function ( id, item, times, i ) {

    var options = window.hollerVars[id];

    // delay between notifications
    var loopDelay = ( options.fomoLoopDelay ? parseInt( options.fomoLoopDelay ) * 1000 : 7000 );

    // how long it is up on the page before disappearing
    var displayTime = ( options.fomoDisplayTime ? parseInt( options.fomoDisplayTime ) * 1000 : 3000 );

    // show the first fomo
    holler.fomoContent( id, item )

    // wait for displayTime seconds, then hide fomo. Run loop to show other fomos with loopDelay
    holler.fomoDisplayTime( displayTime ).then( function() {
      holler.transitionOut(item)
      holler.fomoLoop( id, item, times, i, loopDelay )
    });

  }

  holler.fomoDisplayTime = function( displayTime ) {

    return new Promise(

      function( resolve ) {
        // hide the popup
         setTimeout(function() {
          resolve()
        }, displayTime );
      }

    )

  }

  holler.fomoLoop = function( id, item, times, i, loopDelay ) {

    // show multiple popups on a single page
    setTimeout(function () {
      i++;
      if ( i < parseInt( times ) + 1 ) {
         holler.fomoLoopStart( id, item, times, i )
      }

    }, loopDelay );

  }

  holler.fomoContent = function( id, item ) {

    var int;

    int = holler.getCookie( 'hwp_fomo' );

    if( int && int > 0 ) {
      int = parseInt( int ) + 1;
    } else {
      int = 1;
    }

    var params = { action: 'hwp_fomo_ajax', nonce: window.hollerVars.hwpNonce, int: int, id: id };

    // store interaction data
    $.ajax({
      method: "GET",
      url: window.hollerVars.ajaxurl,
      data: params
      })
      .done(function(data) {
        // console.log(data);

        if( !data.data ) {
          holler.setCookie( 'hwp_fomo', 0, 1 );
          return;
        }

        // box content
        $('#hwp-' + id + ' .hwp-first-row').html( data.data );

        // Show the box and what's in it
        holler.transitionIn( item );

        // re-add click listener
        $('#hwp-' + id + ' a').on('click', holler.interactionLink );

        if( parseInt( int ) > 10 )
          int = 1;
        
        holler.setCookie( 'hwp_fomo', int, 1 );

      })
      .fail(function(err) {
        holler.setCookie( 'hwp_fomo', 1, 1 );
        console.log(err);
      });

  }

  $(window).on( 'load', function() {
    holler.init();
  });

  window.hollerbox = holler;

})(window, document, jQuery);