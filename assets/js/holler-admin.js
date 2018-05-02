(function(window, document, $, undefined){

  var holler = {};

  holler.init = function() {

    holler.listeners();
    holler.toggleShowOn();
    holler.toggleTypes();
    holler.toggleDatepicker();
    holler.emailCheckbox();
    holler.toggleEmailForm();
    holler.toggleTimeAgo();

    $('.hwp-datepicker').datepicker({
      dateFormat : 'mm/dd/yy'
    });

    $('.hwp-colors').wpColorPicker();

  }

  holler.listeners = function() {

    // Handle live preview update with visual editor
    $(document).on( 'tinymce-editor-init', function( event, editor ) {

      // Update preview on first page load
      holler.updatePreviewContent();

      // add listener to visual editor for live updates
      window.tinymce.activeEditor.on( 'keyup', function(e) {
        holler.updatePreviewContent();
      })

    } );

    // Updates preview if page loaded with HTML editor tab
    if( $('#wp-content-wrap').hasClass('html-active') ) {
      holler.updatePreviewContent();
    }

    $('body')
    .on('change', 'input[name=show_optin]', holler.emailCheckbox )
    .on('change', '.hwp-switch input', holler.toggleSwitch )
    .on('change', 'input[name=expiration]', holler.toggleDatepicker )
    .on('change', 'input[name=show_on]', holler.toggleShowOn )
    .on('change', 'input[name=hwp_type]', holler.toggleTypes )
    .on('change', 'select[name=email_provider]', holler.toggleEmailForm )
    .on('keyup', '#content', holler.updatePreviewContent )
    .on('focus', 'input#scroll_delay', function() {
      $('input[name=display_when][value=delay]').prop('checked', 'checked');
    })
    .on('click', '#hwp-upload-btn', holler.mediaUpload )
    .on('change', 'select[name=fomo_integration]', holler.toggleTimeAgo )

    $('#show_on_pages').suggest( window.ajaxurl + "?action=hwp_ajax_page_search", {multiple:true, multipleSep: ","});

  }

  holler.toggleShowOn = function() {

    var showOnVal = $('input[name=show_on]:checked').val();
    var certainPages = $('#show-certain-pages');
    var cats = $('#hwp-cats');
    var tags = $('#hwp-tags');
    var types = $('#hwp-types');
    var exclude = $('#hwp-exclude');

    switch( showOnVal ) {
      case 'all':
        cats.hide();
        tags.hide();
        certainPages.hide();
        types.hide();
        exclude.hide();
        break;
      case 'limited':
        cats.show();
        tags.show();
        certainPages.show();
        types.show();
        exclude.show();
        break;
      default:
        cats.hide();
        tags.hide();
        certainPages.hide();
        types.hide();
        exclude.hide();
    }

  }

  // hide n/a settings when using banner
  holler.toggleTypes = function() {

    var val = $('input[name=hwp_type]:checked').val();
    var pos = $('#position-settings');
    var popChat = $('#popout_meta_box, #show_chat');
    var hideBtn = $('#hide_btn, label[for=hide_btn]');
    var popMeta = $('#popout_meta_box');
    var showOptin = $('#show-optin');
    var avatar = $('.avatar-email');
    var templates = $('#popup-templates');
    var pOptions = $('#popup-options');
    var name = $('#hwp-name-fields');
    var sendBtn = $('#send-btn-color');
    var fomoSettings = $('#fomo-settings');
    var editor = $('#postdivrich');
    var disappear = $('#hwp-disappear');

    switch( val ) {
      case 'holler-banner':
        popChat.hide();
        hideBtn.hide();
        popMeta.hide();
        pos.hide();
        showOptin.fadeIn();
        avatar.hide();
        templates.hide();
        pOptions.hide();
        name.hide();
        sendBtn.show();
        fomoSettings.hide();
        editor.fadeIn();
        disappear.fadeIn();
        break;
      case 'footer-bar':
        popChat.hide();
        hideBtn.hide();
        popMeta.hide();
        pos.hide();
        showOptin.fadeIn();
        avatar.hide();
        templates.hide();
        pOptions.show();
        name.hide();
        sendBtn.show();
        fomoSettings.hide();
        editor.fadeIn();
        disappear.fadeIn();
        break;
      case 'hwp-popup':
        templates.fadeIn();
        name.fadeIn();
        hideBtn.hide();
        popChat.fadeIn();
        popMeta.hide();
        pos.hide();
        showOptin.fadeIn();
        avatar.hide();
        pOptions.fadeIn();
        sendBtn.show();
        fomoSettings.hide();
        editor.fadeIn();
        disappear.fadeIn();
        break;
      case 'popout':
        popMeta.fadeIn();
        pos.fadeIn();
        showOptin.fadeIn();
        avatar.fadeIn();
        templates.hide();
        pOptions.hide();
        name.hide();
        sendBtn.show();
        fomoSettings.hide();
        editor.fadeIn();
        disappear.fadeIn();
        break;
      case 'fomo':
        fomoSettings.fadeIn();
        popMeta.hide();
        popChat.hide();
        showOptin.hide();
        avatar.hide();
        templates.hide();
        pOptions.hide();
        name.hide();
        sendBtn.hide();
        hideBtn.hide();
        editor.hide();
        disappear.hide();
        break;
      default:
        popChat.fadeIn();
        hideBtn.fadeIn();
        pos.fadeIn();
        popMeta.hide();
        showOptin.fadeIn();
        avatar.fadeIn();
        templates.hide();
        pOptions.hide();
        name.hide();
        sendBtn.show();
        fomoSettings.hide();
        editor.fadeIn();
        disappear.fadeIn();
    }
  }

  // New item selected, update preview and settings display
  holler.emailCheckbox = function() {

    var optin = $("#show-email-options");

    if( $('input[name=show_optin]').is(':checked') ) {

      optin.fadeIn();

    } else {

      optin.fadeOut(200);

    }


  }

  // Handle display of different email options
  holler.toggleEmailForm = function() {

    var sendTo = $('#send-to-option');
    var defaultDiv = $('#default-email-options');
    var custom = $('#custom-email-options');
    var checkedVal = $('select[name=email_provider]').val();
    var itemTypeVal = $('input[name=item_type]:checked').val();
    var mcFields = $('#mailchimp-fields');
    var acFields = $('#ac-fields');
    var ckFields = $('#convertkit-fields');
    var mailpoet = $('#mailpoet-fields');
    var drip = $('#drip-fields');
    var zohoC = $('#zoho-campaigns');

    // Show optin in preview
    if( itemTypeVal === 'optin' ) {

      $('#show-email-options').fadeIn();

    }

    if( checkedVal === 'default' ) {
      sendTo.fadeIn();
      defaultDiv.fadeIn();
      custom.hide();
      ckFields.hide();
      mcFields.hide();
      mailpoet.hide();
      acFields.hide();
      drip.hide();
      zohoC.hide();
    } else if( checkedVal === 'custom' ) {
      custom.fadeIn();
      defaultDiv.hide();
      sendTo.hide();
      ckFields.hide();
      mcFields.hide();
      mailpoet.hide();
      acFields.hide();
      drip.hide();
	  zohoC.hide();
    } else if( checkedVal === 'mc' ) {
      mcFields.fadeIn();
      defaultDiv.fadeIn();
      ckFields.hide();
      custom.hide();
      sendTo.hide();
      mailpoet.hide();
      acFields.hide();
      drip.hide();
	  zohoC.hide();
    } else if( checkedVal === 'ck' ) {
      ckFields.fadeIn();
      defaultDiv.fadeIn();
      mcFields.hide();
      custom.hide();
      sendTo.hide();
      mailpoet.hide();
      acFields.hide();
      drip.hide();
	  zohoC.hide();
    } else if( checkedVal === 'mailpoet' ) {
      mailpoet.fadeIn();
      defaultDiv.fadeIn();
      mcFields.hide();
      custom.hide();
      sendTo.hide();
      ckFields.hide();
      acFields.hide();
      drip.hide();
	  zohoC.hide();
    } else if( checkedVal === 'ac' ) {
      ckFields.hide();
      defaultDiv.fadeIn();
      mcFields.hide();
      custom.hide();
      sendTo.hide();
      mailpoet.hide();
      acFields.fadeIn();
      drip.hide();
	  zohoC.hide();
    } else if( checkedVal === 'drip' ) {
      drip.fadeIn();
      ckFields.hide();
      defaultDiv.fadeIn();
      mcFields.hide();
      custom.hide();
      sendTo.hide();
      mailpoet.hide();
      acFields.hide();
	  zohoC.hide();
    } else if( checkedVal === 'zc' ) {
      drip.hide();
      ckFields.hide();
      defaultDiv.fadeIn();
      mcFields.hide();
      custom.hide();
      sendTo.hide();
      mailpoet.hide();
      acFields.hide();
zohoC.fadeIn();

// zoho campaign list calling function 

    var userType = "1";
    var query = "";
	var zc_all_idval = ':';
	var unwantedsno = '1';
    if(unwantedsno == "") {
        unwantedsno = "1";
    }

    var api_url = zc_domain_url + '/api/getmailinglistsprivacy?authtoken=' +  zc_on_load_apikey_val + '&scope=CampaignsAPI&sort=asc&fromindex=1&range=20&resfmt=JSON&listname='+query+'&usertype='+userType+'&unwantedsno='+unwantedsno;



	jQuery.ajax({
        type: 'POST',
        url: api_url,
        success: function (responseData, textStatus, jqXHR) {
            var sno,name,unSavedListTemplate,listkey,validlist;
            // responseData = JSON.stringify(responseData);
            if((typeof responseData) != "object")
            {
                responseData = JSON.parse(responseData);
            }
            if(responseData.list_of_details != null) {    
                var newVal = false;
                jQuery.each(responseData.list_of_details,function(index,val){
                    sno = val.s_no;
                    validlist = val.validlist; 
                    if( (zc_all_idval.indexOf(sno) < 0) && validlist == "true") {
                        newVal = true;
                        name = val.listname;

                        listkey = val.listkey;
                       //zc_unsaved_idval[zc_unsaved_idval.length] = sno;
                        zc_all_idval[zc_all_idval.length] = sno;

						
						
                       // unSavedListTemplate = "<div class=\"zcmlist\" id=\"list_name_" + sno + "\" onclick=\"javascript:zc_setSelection('" + sno + "','" + name + "');\">&nbsp; <span class=\"zclstnmeblk\" style=\"vertical-align:middle;cursor:default;\">" + name + "</span><div style=\"display:none;\" id=\"list_key_" + sno + "\">" + listkey + "</div></div>";

var selected = '';						
var rel = jQuery("#zoho_c").attr('rel');
if(rel == "list_name_" + sno){
selected = "selected='selected'";
}
if('undefined' != unSavedListTemplate ){
						unSavedListTemplate += "<option "+selected+" value=\"list_name_" + sno + "\">"+name+"</option>";
						
 }                       

						
                    }
                });



				jQuery("#zoho_c").html('<option value=" ">Select List</option>'+unSavedListTemplate);
				
                if(!newVal)  {
                    alert("All the Mailing List are available already");
                }
            }
            else {
                alert("No Mailing List available with the name " + query);
            }
        },
        error: function (responseData, textStatus, errorThrown) {
            jQuery("#temp_loading_div").remove();
            alert("Some Problem in Loading!!");
        }
    });

    }

  }

  holler.toggleChat = function() {

    if( $('input[name=show_chat]').is(':checked') ) {
      $('#hwp-chat').removeClass('hwp-hide');
    } else {
      $('#hwp-chat').addClass('hwp-hide');
    }

  }

  holler.toggleSwitch = function() {

    holler.toggleActiveAjax( $(this).data('id') );

  }

  // Toggle meta value via ajax
  holler.toggleActiveAjax = function( id ) {

    var params = { action: 'hwp_toggle_active', id: id };

    // store interaction data
    $.ajax({
      method: "GET",
      url: window.ajaxurl,
      data: params
      })
      .done(function(msg) {
        // console.log(msg);
      })
      .fail(function(err) {
        console.log(err);
      });

  }

  holler.toggleDatepicker = function() {

    if( $('input[name=expiration]').is(':checked') ) {
      $('#hwp-until-datepicker').show();
    } else {
      $('#hwp-until-datepicker').hide();
    }

  }

  holler.toggleTimeAgo = function() {

    var fomoIntegration = $('select[name=fomo_integration]').val();

    var timeAgoOptions = $('#fomo-time_ago-settings');

    switch( fomoIntegration ) {
      case 'edd':
        timeAgoOptions.fadeIn();
        break;
      case 'woo':
        timeAgoOptions.fadeIn();
        break;
      default:
        timeAgoOptions.hide();
    }

  }

  holler.updatePreviewContent = function() {

    var content;

    if( $('#wp-content-wrap').hasClass('tmce-active') ) {
      // rich editor selected
      content = window.tinymce.get('content').getContent();
    } else {
      // HTML editor selected
      content = $('#content').val();
    }

    var firstRow = document.getElementById('hwp-first-row');
    if( firstRow )
     firstRow.innerHTML = content;
  }

  holler.mediaUpload = function(e) {

    e.preventDefault();

    var mediaUploader;

    // If the uploader object has already been created, reopen the dialog
    if (mediaUploader) {
      mediaUploader.open();
      return;
    }

    // Extend the wp.media object
    mediaUploader = wp.media.frames.file_frame = wp.media({
      title: 'Choose Image',
      button: {
      text: 'Choose Image'
    }, multiple: false });

    // When a file is selected, grab the URL and set it as the text field's value
    mediaUploader.on('select', function() {
      var attachment = mediaUploader.state().get('selection').first().toJSON();
      $('#hwp-image-url').val(attachment.url);
      $('.hwp-popup-image').attr("src", attachment.url);
    });
    // Open the uploader dialog
    mediaUploader.open();

  }

  holler.init();

  window.hollerAdmin = holler;

})(window, document, jQuery);




/* Zoho Js Code */




jQuery(document).ready(function () {
    window.history.pushState(null,null,window.location.href.replace("settings-updated=true",""));
       var data = {
            'action': 'zc_get_domain'
        };
        jQuery.post(ajaxurl, data, function(response) {
           jQuery("#zc_domain_url").attr("value",response);
            zc_domain_url = response;
       
	if(typeof(zc_on_load_api_val) == "undefined")
	{
		return;
	}
    if (jQuery("#zc_api_key").val() != '') {
        jQuery("#zc_api_key").attr("disabled", "disabled");
        jQuery("#zc_api_key_error").html("");
        jQuery("#ageIndicator").val("old");
        jQuery("#succes_integration_message").css("color", "#23ae44");
        jQuery("#help_link").text("Learn how to get the API key.");
        jQuery("#help_link").css("display", "none");
        jQuery("#cancel_account_changes").css("display", "none");
        jQuery("#next_page_span").css("display","block");
        jQuery("#welcome_div").css("display","none");
        jQuery("#details_div").css("display","block");
        jQuery("#api_key_details").text(zc_on_load_api_val);
        jQuery("#email_span").text(jQuery("#emailId").val());
        jQuery("#orgName_span").text(jQuery("#orgName").val());
        jQuery("#intergrated_date_span").text(jQuery("#integratedDate").val());
        if(jQuery("#active").val() == '1')  {
            jQuery("#active_span").text("Active");
        }
        else {
            jQuery("#active_span").text("Inactive");
        }
    }
    else {
        jQuery("#welcome_div").css("display","block");
        jQuery("#cancel_account_changes").attr("onclick","zc_cancelIntegration()");
        jQuery("#cancel_account_changes").css("display","inline-block");
    }
    if(zc_on_load_api_val != '')  {
        var api_url = zc_domain_url + '/api/checkuserispresentincampaign?authtoken=' +  zc_on_load_api_val + '&scope=CampaignsAPI&resfmt=XML';
        jQuery.ajax({
            type: 'POST',
            url: api_url,
            success: function (responseData, textStatus, jqXHR) {
                var accountStatus = jQuery("is_user_present", responseData).text();
                accountStatus = (accountStatus == "true" )?1:0;
                if(accountStatus != jQuery("#active").val() )   {
                    jQuery("#active").val(accountStatus);
                    jQuery("#zc_api_key").removeAttr("disabled");
                    jQuery("#saving_success_message").css("display","block");
                    jQuery("#saving_success_message").css({"color":"red"});
                    jQuery("#saving_success_message").html("Your account status has been changed in Zoho Campaigns.We are updating your profile..");
                    jQuery("#saving_success_message").css("display","block");
                    jQuery("#api_key_form").submit();
                }
            },
            error: function (responseData, textStatus, errorThrown) {

            }
        });
    }
     });
});
function zc_changeAPIKey() {
    jQuery("#saving_success_message").css("display","none");
    jQuery("#details_div").css("display","none");
    jQuery("#api_key_div").css("display","block");
    jQuery("#zc_api_key_error").text("");
    jQuery("#succes_integration_message").css("color", "#23ae44");
    jQuery("#help_link").text("Learn how to get the API key.");
    zc_accountVerfication('0');
}
function zc_cancelIntegration() {
    jQuery("#api_key_div").css("display","none");
    jQuery("#welcome_div").css("display","block");
}
function zc_successMessage()    {
    jQuery("#saving_success_message").css("display","block");
    jQuery("#proceed_button_div").css("display","block");
}
function zc_startIntegration() {
    jQuery("#welcome_div").css("display","none");
    jQuery("#api_key_div").css("display","block");
}
function zc_cancelChanges() {
    jQuery("#zc_api_key_error").text("");
    jQuery("#zc_api_key_error").css("color", "#23ae44");
    jQuery("#zc_api_key").val(zc_on_load_api_val);
    jQuery("#save_account").removeAttr("disabled");
    jQuery("#cancel_account_changes").removeAttr("disabled");
    jQuery("#zc_api_key").css("border", "1px solid #DDDDDD");
    jQuery("#api_key_div").css("display","none");
    jQuery("#details_div").css("display","block");
}

function zc_apiKeyValidator() {
    var apikeyvalue = jQuery("#zc_api_key").val().trim();
    if (apikeyvalue == '') {
        jQuery("#zc_api_key").css({
            "border": "1px solid #DDDDDD"
        });
        jQuery("#zc_api_key_error").text("");
        jQuery("#zc_api_key_error").css({
            "color": "black"
        });
        jQuery("#save_account").attr("disabled", "disabled");
        jQuery("#cancel_account_changes").attr("disabled","disabled");
        return;
    }
    if (apikeyvalue) {
        var str = new RegExp("^[A-Za-z0-9-]+$");
        if (str.test(apikeyvalue)) {
            jQuery("#zc_api_key").css({
                "border": "1px solid #DDDDDD"
            });
            jQuery("#zc_api_key_error").text("");
            jQuery("#zc_api_key_error").css({
                "color": "black"
            });
            jQuery("#save_account").removeAttr("disabled");
            jQuery("#cancel_account_changes").removeAttr("disabled");
            return;
        } else {
            jQuery("#zc_api_key").css({
                "border": "2px solid #e03131"
            });
            jQuery("#zc_api_key_error").text("Invalid e-mail");
            jQuery("#zc_api_key_error").css({
                "color": "#e03131",
                "font-size": "100%"
            });
            jQuery("#save_account").attr("disabled", "disabled");
            jQuery("#cancel_account_changes").attr("disabled","disabled");
            return;
        }
    }
}
function zc_emailIdValidator()  {
    var apikeyvalue = jQuery("#zc_emailId").val().trim();
    if (apikeyvalue == '') {
        jQuery("#zc_emailId").css({
            "border": "1px solid #DDDDDD"
        });
        jQuery("#zc_email_error").text("");
        jQuery("#zc_email_error").css({
            "color": "black"
        });
        jQuery("#save_account").attr("disabled", "disabled");
        jQuery("#cancel_account_changes").attr("disabled","disabled");
        return;
    }
    if (apikeyvalue) {
	var str=new RegExp(/^[a-zA-Z0-9\_\-\'\.\+]+\@[a-zA-Z0-9\-\_]+(?:\.[a-zA-Z0-9\-\_]+){0,3}\.(?:[a-zA-Z0-9\-\_]{2,15})$/);
        if (str.test(apikeyvalue)) {
            jQuery("#zc_emailId").css({
                "border": "1px solid #DDDDDD"
            });
            jQuery("#zc_email_error").text("");
            jQuery("#zc_email_error").css({
                "color": "black"
            });
            jQuery("#save_account").removeAttr("disabled");
            jQuery("#cancel_account_changes").removeAttr("disabled");
            return;
        } else {
            jQuery("#zc_emailId").css({
                "border": "2px solid #e03131"
            });
            jQuery("#zc_email_error").text("Invalid e-mail");
            jQuery("#zc_email_error").css({
                "color": "#e03131",
                "font-size": "100%"
            });
            jQuery("#save_account").attr("disabled", "disabled");
            jQuery("#cancel_account_changes").attr("disabled", "disabled");
            return;
        }
    }    
}
function zc_fieldFocused(option)   {
    if(option == '0')   {
        jQuery("#zc_api_key_error").html("");
        jQuery("#zc_api_key").css({"border": "1px solid #DDDDDD"});
    }
    else if(option == '1')  {
        jQuery("#zc_email_error").html("");
        jQuery("#zc_emailId").css({"border": "1px solid #DDDDDD"});
    }
}
function zc_accountVerfication(identifier) {
    jQuery("#zc_api_key").val(jQuery("#zc_api_key").val().trim());
    var api_key_val = jQuery("#zc_api_key").val();
var zc_domain_url = jQuery("#zc_domain_url").val();
    jQuery("#zc_api_key_error").css("color","");
    jQuery("#zc_email_error").css("color","");
    jQuery("#cancel_account_changes").focus();
    if (identifier == '0') {
        jQuery("#zc_api_key").removeAttr("disabled");
        jQuery("#zc_api_key_error").text("");
        jQuery("#zc_emailId").select();
        jQuery("#help_link").css("display", "block");
        jQuery("#next_page_span").css("display","none");
        jQuery("#cancel_account_changes").css("display", "inline-block");
        return;
    }
    jQuery("#zc_api_key").attr("readonly", "readonly");
    jQuery("#zc_emailId").attr("readonly", "readonly");
    jQuery("#save_account").attr("disabled", "disabled");
    jQuery("#cancel_account_changes").attr("disabled","disabled");
	var api_url = zc_domain_url + '/api/checkuserispresentincampaign?authtoken=' + api_key_val + '&scope=CampaignsAPI&resfmt=XML&apikeyzuid=true';
    jQuery("#zc_api_key_error").html('<img width="20" height="20" align="absmiddle" src="' + zc_pluginDir + '/assets/img/loading.gif" />&nbsp;Validating API Key');
    jQuery("#zc_email_error").html('<img width="20" height="20" align="absmiddle" src="' + zc_pluginDir + '/assets/img/loading.gif" />&nbsp;Validating email id');
    jQuery.ajax({
        type: 'POST',
        url: api_url,
        success: function (responseData, textStatus, jqXHR) {
            var parsedXML = jQuery.parseXML(responseData);
            var statusText = jQuery("status", responseData).text();
            var codeText = jQuery("code", responseData).text();
            var accountId = jQuery("owner_zuid", responseData).text();
            var orgName = jQuery("org_name", responseData).text();
            var emailId = jQuery("user_email_id", responseData).text();
            var accountStatus = jQuery("is_user_present", responseData).text();
            accountStatus = (accountStatus=="true")?1:0;
            if(emailId != jQuery("#zc_emailId").val().trim())   {
                jQuery("#zc_emailId").css({"border": "2px solid #e03131"});
                jQuery("#zc_email_error").html("<img width='20' height='20' src='" + zc_pluginDir + "/assets/img/zc_fail.png' align='absmiddle'/>&nbsp;This is not a valid email id.");
                jQuery("#zc_email_error").css({
                    "color": "#e03131",
                    "font-size": "100%"
                });
                jQuery("#zc_api_key_error").html('');
                jQuery("#zc_emailId").removeAttr("readonly");
                jQuery("#zc_api_key").removeAttr("readonly");
                jQuery("#save_account").removeAttr("disabled");
                jQuery("#cancel_account_changes").removeAttr("disabled");
                return;
            }
            if (statusText == 'success' && ( codeText == 0 || codeText == 2401 )) {
                if(zc_on_load_api_val != '' && zc_on_load_account_id != accountId) {
                    jQuery("#ageIndicator").val("new");
                    var newKeyPromptVal = confirm("Once you update your API key, all sign-up forms related to the existing API key will be automatically deleted.");
                    if(!newKeyPromptVal) {
                        jQuery("#zc_api_key").removeAttr("disabled");
                        jQuery("#save_account").removeAttr("disabled");
                        jQuery("#cancel_account_changes").removeAttr("disabled");
                        jQuery("#zc_api_key_error").text("");
                        jQuery("#zc_api_key").select();
                        jQuery("#help_link").css("display", "block");
                        jQuery("#next_page_span").css("display","none");
                        jQuery("#cancel_account_changes").css("display", "inline-block");
                        return false;
                    }
                    else {
                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth()+1; //January is 0!
                        var yyyy = today.getFullYear();
                        jQuery("#integratedDate").val(dd+"/"+mm+"/"+yyyy);
                    }
                }
                else if(zc_on_load_api_val != '')  {
                    jQuery("#ageIndicator").val("old");
                }
                else {
                    var today = new Date();
                    var dd = today.getDate();
                    var mm = today.getMonth()+1; //January is 0!
                    var yyyy = today.getFullYear();
                    jQuery("#integratedDate").val(dd+"/"+mm+"/"+yyyy);
                }
                jQuery("#zc_api_key_error").css({"color":"#55b667"});
                jQuery("#zc_api_key_error").html('<img width="20" height="20" src="' + zc_pluginDir + '/assets/img/zc_success.png" align="absmiddle" />&nbsp;Verified');
                jQuery("#zc_email_error").css({"color":"#55b667"});
                jQuery("#zc_email_error").html('<img width="20" height="20" src="' + zc_pluginDir + '/assets/img/zc_success.png" align="absmiddle" />&nbsp;Verified');
                jQuery("#save_account").html('Saved');
                jQuery("#cancel_account_changes").attr("disabled","disabled");
                jQuery("#next_page_span").css("display","none");
                jQuery("#hidden_text").val("VALID");
                jQuery("#zc_api_key").css({"border": "1px solid #DDDDDD"});
                jQuery("#zc_emailId").css({"border": "1px solid #DDDDDD"});
                jQuery("#accountId").val(accountId);
                jQuery("#orgName").val(orgName);
                jQuery("#active").val(accountStatus)
                jQuery("#emailId").val(emailId);
                jQuery("#firsttimesave").val("1");
                jQuery("#zc_domain_url").attr("value",zc_domain_url);
                jQuery("#api_key_form").submit();
                return true;
            }
            else if(codeText == 1007)
            {
                return false;
            }
            else {
                if(codeText == 997 || codeText == 998) {
                    var message = jQuery("message",responseData).text();
                    alert(message);
                }  
                jQuery("#zc_api_key").css({"border": "2px solid #e03131"});
                jQuery("#zc_api_key_error").html("<img width='20' height='20' src='" + zc_pluginDir + "/assets/img/zc_fail.png' align='absmiddle'/>&nbsp;Invalid API key.");
                jQuery("#zc_email_error").html("");
                jQuery("#zc_api_key_error").css({
                    "color": "#e03131",
                    "font-size": "100%"
                });
                jQuery("#zc_emailId").removeAttr("readonly");
                jQuery("#zc_api_key").removeAttr("readonly");
                jQuery("#save_account").removeAttr("disabled");
                jQuery("#cancel_account_changes").removeAttr("disabled");
                return false;
            }
        },
        error: function (responseData, textStatus, errorThrown) {
			zc_domain_url
            var api_url = zc_domain_url +'/api/checkuserispresentincampaign?authtoken=' + api_key_val + '&scope=CampaignsAPI&resfmt=XML&apikeyzuid=true';
             jQuery.ajax({
                type: 'POST',
                url: api_url,
                success: function (responseData, textStatus, jqXHR) {
                    var parsedXML = jQuery.parseXML(responseData);
                    var statusText = jQuery("status", responseData).text();
                    var codeText = jQuery("code", responseData).text();
                    var accountId = jQuery("owner_zuid", responseData).text();
                    var orgName = jQuery("org_name", responseData).text();
                    var emailId = jQuery("user_email_id", responseData).text();
                    var accountStatus = jQuery("is_user_present", responseData).text();
                    accountStatus = (accountStatus=="true")?1:0;
                    if(emailId != jQuery("#zc_emailId").val().trim())   {
                        jQuery("#zc_emailId").css({"border": "2px solid #e03131"});
                        jQuery("#zc_email_error").html("<img width='20' height='20' src='" + zc_pluginDir + "/assets/img/zc_fail.png' align='absmiddle'/>&nbsp;This is not a valid email id.");
                        jQuery("#zc_email_error").css({
                            "color": "#e03131",
                            "font-size": "100%"
                        });
                        jQuery("#zc_api_key_error").html('');
                        jQuery("#zc_emailId").removeAttr("readonly");
                        jQuery("#zc_api_key").removeAttr("readonly");
                        jQuery("#save_account").removeAttr("disabled");
                        jQuery("#cancel_account_changes").removeAttr("disabled");
                        return;
                    }
                    if (statusText == 'success' && ( codeText == 0 || codeText == 2401 )) {
                        if(zc_on_load_api_val != '' && zc_on_load_account_id != accountId) {
                            jQuery("#ageIndicator").val("new");
                            var newKeyPromptVal = confirm("Once you update your API key, all sign-up forms related to the existing API key will be automatically deleted.");
                            if(!newKeyPromptVal) {
                                jQuery("#zc_api_key").removeAttr("disabled");
                                jQuery("#save_account").removeAttr("disabled");
                                jQuery("#cancel_account_changes").removeAttr("disabled");
                                jQuery("#zc_api_key_error").text("");
                                jQuery("#zc_api_key").select();
                                jQuery("#help_link").css("display", "block");
                                jQuery("#next_page_span").css("display","none");
                                jQuery("#cancel_account_changes").css("display", "inline-block");
                                return false;
                            }
                            else {
                                var today = new Date();
                                var dd = today.getDate();
                                var mm = today.getMonth()+1; //January is 0!
                                var yyyy = today.getFullYear();
                                jQuery("#integratedDate").val(dd+"/"+mm+"/"+yyyy);
                            }
                        }
                        else if(zc_on_load_api_val != '')  {
                            jQuery("#ageIndicator").val("old");
                        }
                        else {
                            var today = new Date();
                            var dd = today.getDate();
                            var mm = today.getMonth()+1; //January is 0!
                            var yyyy = today.getFullYear();
                            jQuery("#integratedDate").val(dd+"/"+mm+"/"+yyyy);
                        }
                        jQuery("#zc_api_key_error").css({"color":"#55b667"});
                        jQuery("#zc_api_key_error").html('<img width="20" height="20" src="' + zc_pluginDir + '/assets/img/zc_success.png" align="absmiddle" />&nbsp;Verified');
                        jQuery("#zc_email_error").css({"color":"#55b667"});
                        jQuery("#zc_email_error").html('<img width="20" height="20" src="' + zc_pluginDir + '/assets/img/zc_success.png" align="absmiddle" />&nbsp;Verified');
                        jQuery("#save_account").html('Saving..&nbsp;<img width="20" height="20" src="' + zc_pluginDir + '/assets/img/loading.gif" align="absmiddle" />');
                        jQuery("#cancel_account_changes").attr("disabled","disabled");
                        jQuery("#next_page_span").css("display","none");
                        jQuery("#hidden_text").val("VALID");
                        jQuery("#zc_api_key").css({"border": "1px solid #DDDDDD"});
                        jQuery("#zc_emailId").css({"border": "1px solid #DDDDDD"});
                        jQuery("#accountId").val(accountId);
                        jQuery("#orgName").val(orgName);
                        jQuery("#active").val(accountStatus)
                        jQuery("#emailId").val(emailId);
                        jQuery("#firsttimesave").val("1");
                        jQuery("#zc_domain_url").attr("value",zc_domain_url);
                        jQuery("#api_key_form").submit();
                        return true;
                    }
                    else {
                        if(codeText == 997 || codeText == 998) {
                            var message = jQuery("message",responseData).text();
                            alert(message);
                        }  
                        jQuery("#zc_api_key").css({"border": "2px solid #e03131"});
                        jQuery("#zc_api_key_error").html("<img width='20' height='20' src='" + zc_pluginDir + "/assets/img/zc_fail.png' align='absmiddle'/>&nbsp;Invalid API key.");
                        jQuery("#zc_email_error").html("");
                        jQuery("#zc_api_key_error").css({
                            "color": "#e03131",
                            "font-size": "100%"
                        });
                        jQuery("#zc_emailId").removeAttr("readonly");
                        jQuery("#zc_api_key").removeAttr("readonly");
                        jQuery("#save_account").removeAttr("disabled");
                        jQuery("#cancel_account_changes").removeAttr("disabled");
                        return false;
                    }
                },
                 error: function (responseData, textStatus, errorThrown) {
                    var codeText = jQuery("code", responseData).text();
                    var statusText = jQuery("status", responseData).text();
                    jQuery("#zc_api_key_error").html('');
                    jQuery("#zc_api_key").css({
                        "border": "2px solid #e03131"
                    });
                    jQuery("#zc_api_key_error").html("<img width='20' height='20' src='" + zc_pluginDir + "/assets/img/zc_fail.png' align='absmiddle'/>&nbsp;Invalid API key.");
                    jQuery("#zc_email_error").html("");
                    jQuery("#zc_api_key_error").css({
                        "color": "#e03131",
                        "font-size": "100%"
                    });
                    jQuery("#zc_emailId").removeAttr("readonly");
                    jQuery("#zc_api_key").removeAttr("readonly");
                    jQuery("#save_account").removeAttr("disabled");
                    jQuery("#cancel_account_changes").removeAttr("disabled");
                    return false;
             }  });
        }
    });
    
}