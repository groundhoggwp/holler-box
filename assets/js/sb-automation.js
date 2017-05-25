(function(window, document, $, undefined){

  var sbAutomation = {};

  sbAutomation.init = function() {

    // set defaults
    sbAutomation.newVisitor = false;
    sbAutomation.noteInteracted = false;
    sbAutomation.noteHidden = false;

    // determine if new or returning visitor
    sbAutomation.checkCookie();

    // if we have active items, loop through them
    if( window.sbAutoVars.active )
      sbAutomation.doActive( window.sbAutoVars.active );
    
  }

  // Notification box exists
  sbAutomation.doActive = function( ids ) {

    for (var i = 0; i < ids.length; i++) {
      sbAutomation.doChecks( ids[i] );
    }

  }

  // Check if we should display item
  sbAutomation.doChecks = function( id ) {

    console.log('dochecks' + id)

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

    // passes checks, show it
    sbAutomation.activeID = 'sb-' + id;
    sbAutomation.activeOptions = vars;
    sbAutomation.cacheSelectors();
    sbAutomation.noteListeners();

    setTimeout( function() {
      sbAutomation.showNote();
    }, sbAutomation.delay );

  } 

  // determine if new or returning visitor
  sbAutomation.checkCookie = function() {

    if( sbAutomation.getCookie('sb_visit') === "" ) {

      // New visitor, set cookie
      var cookie = sbAutomation.setCookie('sb_visit', Date.now(), parseInt( window.sbAutoVars.expires ));
      sbAutomation.newVisitor = true;

    }

    console.log('new visitor?' + sbAutomation.newVisitor )

  }

  // Cache selectors and fire up the item display
  sbAutomation.cacheSelectors = function() {

    sbAutomation.floatingBtn = document.getElementById('sb-floating-btn');
    // sbAutomation.banner = document.getElementById( 'sb-banner' );
    sbAutomation.chatBox = document.querySelector('#' + sbAutomation.activeID + ' .sb-chat');
    sbAutomation.noteOptin = document.querySelector('#' + sbAutomation.activeID + ' .sb-note-optin');
    sbAutomation.delay = ( window.sbAutoVars.delay ? parseInt( window.sbAutoVars.delay ) : '1000' );
    sbAutomation.firstRow = document.querySelector('#' + sbAutomation.activeID + ' .sb-first-row');

  }

  // Event listeners
  sbAutomation.noteListeners = function() {

    $('body')
    .on('click', '.sb-close', sbAutomation.hideItem )
    .on('click', '.sb-email-btn', sbAutomation.emailSubmitted )
    .on('click', '#sb-floating-btn', sbAutomation.toggleHide )
    .on('click', '.sb-interaction', sbAutomation.interactionLink )
    .on('click', '.sb-text i', sbAutomation.sendText );

    $('.sb-text-input').on('keypress', sbAutomation.submitChatTextOnEnter );

    $('.sb-email-input').on('keypress', sbAutomation.submitEmailOnEnter );

  }

  // Show/hide elements based on options object
  sbAutomation.showNote = function() {

    var options = sbAutomation.activeOptions;

    var item = document.getElementById( sbAutomation.activeID );

    sbAutomation.firstRow.innerHTML = options.content;

    // visitor has hidden this item, don't show box
    if( options.hideFirst === 'true' || window.localStorage.getItem( 'sb_hide_note' ) === 'true' ) {

      // hide box, show btn
      sbAutomation.transitionOut( item );

      if( options.showBtn != 'false' )
        sbAutomation.transitionIn( sbAutomation.floatingBtn );

    } else {

      // Show the box
      sbAutomation.transitionIn( item );

      if( options.showBtn != 'false' )
        sbAutomation.transitionOut( sbAutomation.floatingBtn );

    }

    // Show email opt-in
    if( options.showOptin === 'true' && options.showChat != 'true' ) {
      sbAutomation.transitionIn( sbAutomation.noteOptin );
      // Setup localized vars
      var textInput = document.querySelector('#' + sbAutomation.activeID + ' .sb-email-input');
      if( textInput )
        textInput.setAttribute('placeholder', options.placeholder );
    }

    // Button should not be shown
    if( options.showBtn === 'false' )
      sbAutomation.hide( sbAutomation.floatingBtn );

    // Should we show the chat box?
    if( options.showChat === 'true' ) {
      sbAutomation.transitionIn( sbAutomation.chatBox );
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

    // hide the item that was clicked
    // var el = $(e.target).closest('.sb-show');

    sbAutomation.toggleHide();

    // prevent duplicate firing
    return false;

  }

  // Handle show/hide storage items, then run showNote func. Used when floating btn is clicked
  sbAutomation.toggleHide = function() {

    var hide = window.localStorage.getItem('sb_hide_note');

    if( hide === 'true' ) {
      window.localStorage.removeItem('sb_hide_note');
    } else {
      window.localStorage.setItem('sb_hide_note', 'true');

      setTimeout( function() {
        // clear current chat if hidden
        sbAutomation.clearChat();
      }, 1000);
    }

    sbAutomation.showNote();

  }

  sbAutomation.transitionIn = function(item) {

    item.style.display = 'block';

    setTimeout( function() {
      $(item).removeClass('sb-hide').addClass('sb-transition-in');
    }, 1);

    setTimeout( function() {
      $(item).removeClass('sb-transition-in').addClass('sb-show');
    }, 100);

  }

  sbAutomation.transitionOut = function(item) {
    
    $(item).addClass('sb-transition-out');

    setTimeout( function() {
      $(item).removeClass('sb-transition-out, sb-show').addClass('sb-hide');
      item.removeAttribute('style');
    }, 500);

  }

  sbAutomation.show = function(item) {
    
    item.style.display = 'block';
    $(item).removeClass('sb-hide').addClass('sb-show');

  }

  sbAutomation.hide = function(item) {
    
    $(item).removeClass('sb-show').addClass('sb-hide');
    item.removeAttribute('style');

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

      sbAutomation.emailSubmitted();

    }

  }

  // Add chat text on click
  sbAutomation.sendText = function(e) {
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
      fullMsg += '/n' + text; 
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

  // User submitted email, send to server
  sbAutomation.emailSubmitted = function(e) {

    var email = $('#' + sbAutomation.activeID + ' .sb-email-input').val()

    // validate email
    if( !email || email.indexOf('@') === -1 || email.indexOf('.') === -1 ) {
      alert('Something is wrong with your email, please try again.')
      return;
    }

    // send message to server
    // concatenate messages together
    var fullMsg = window.localStorage.getItem('sb-full-msg');

    sbAutomation.sendMsg( email, fullMsg );

  }

  // Send email along with chat message to server
  sbAutomation.sendMsg = function( email, msg ) {
    // @TODO: add nonce
    $.ajax({
      method: "GET",
      url: window.sbAutoVars.ajaxurl,
      data: { email: email, msg: msg, action: 'sb_send_email', nonce: window.sbAutoVars.sbNonce }
      })
      .done(function(msg) {
        console.log(msg);

        // reset to defaults
        sbAutomation.clearChat();
        sbAutomation.showConfirmation();

        sbAutomation.interacted({ event:'message_sent' });

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
    sbAutomation.interacted( { event:'link_clicked', details: { href: e.target.href } } );
  }

  // Callback for user interaction
  sbAutomation.interacted = function( data ) {

    var params = { action: 'sb_track_event', nonce: window.sbAutoVars.sbNonce, event: data.event, id: sbAutomation.activeID };

    if( data.data ) {
      params.details = data.details;
    }

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

    sbAutomation.setCookie('sb_note_int', 'true', 1 );

  }

  sbAutomation.showConfirmation = function() {

    sbAutomation.firstRow.innerHTML = sbAutomation.activeOptions.confirmMsg;

  }

  sbAutomation.init();

  window.sbAutomation = sbAutomation;

})(window, document, jQuery);