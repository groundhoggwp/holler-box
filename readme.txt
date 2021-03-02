=== Holler Box - Lightweight popup plugin ===

Contributors: scottopolis
Tags: popup, optin, lead generation, email opt-in, pop up
Requires at least: 4.5
Tested up to: 5.6.2
Stable tag: 1.5.4
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Popups with lead generation forms that won't slow down your site.

== Description ==

Holler Box is a popup plugin focused on being lightweight and easy to use.

## Included for free

- Add unlimited popups
- Exit-intent popups
- Choose between subtle notification bubble or lightbox popup
- Integrate with MailChimp, ConvertKit, MailPoet, Drip, Active Campaign, or a custom form
- Limit to certain pages
- Time delay
- Scroll triggers
- Show to logged in/out and new or returning visitors
- Choose between 3 customizable popup template designs
- Use shortcodes and WordPress content in your popups
- Conversion rate analytics
- Add forms and shortcodes to your popups
- Bonus! Faux chat email capture
- Plugin integrations: Restrict Content Pro, Paid Memberships Pro, MemberPress, and most membership plugins
- Forms plugins like Ninja Forms, Gravity Forms, WPForms, Contact Form 7, etc.
- eCommerce buy buttons
- Lots more

Holler Box is trusted by some of the best brands in WordPress, like Memberpress, SearchWP, Slocum Studio, Pixel Jar, and more.

## Holler Box Pro

Here's a short list of features available only in Pro:

- <a href="https://hollerwp.com/downloads/sale-notification-popup/" target="_blank">Sale notification popups</a> (Scott just bought Holler Box Pro)
- Content upgrades
- More popup designs
- Advanced targeting filters, like choose a post or page to display the popup
- Scheduling
- Header banner
- Support and updates
- Lots more...

<a href="http://hollerwp.com/pro" target="_blank">Get the Pro version here</a>.

== Installation ==

Install and activate this plugin.

Visit the Holler Box menu item, and add a new box. Give it a title (not displayed on the front end), and add your content.

Content can be pretty much anything, but keep your message short.

**Display**

- Activate: Choose to activate this item on publish.
- Position: the notification position, or banner
- Choose your colors
- Show email opt-in: default sends to your email address, or choose a provider or custom HTML form. Details below.
- Default: sends to the email address you enter in the settings.
- MailChimp integration: add your API key in the settings, then your list ID (Get your list ID in your MailChimp account under Lists => Settings => List name and defaults => List ID on right side of screen) 
- ConvertKit: visit Holler Box => Settings, enter <a href="https://app.convertkit.com/account/edit" target="_blank">your API key</a>. Choose ConvertKit when creating your new Holler Box, then enter your form ID. Find your form ID by visiting your signup form, then copy the numbers in the url (or in the embed code).
- Show chat: show the (fake) live chat

**Advanced Settings**

- Pages: choose all pages, or select certain pages and begin typing a page title. It will automatically populate a drop down list, simply click the page title or enter page titles comma separated like this: Home, Features, Pricing
- New or returning: show to only new visitors (since you activated the plugin), or returning visitors. Tracked with the hwp_visit cookie.
- When should we show: after the page loads, show immediately, with a delay, or based on user scroll.
- When should it disappear: if you want the notification to show briefly and then disappear automatically, enter a delay here.
- How often show we show it: a visitor will be shown your message, then you can choose to continue showing it, or hide it based on number of days or user interaction. Interaction is either submitting an email, or clicking a link with a class of hwp-interaction.
- Hide the button: the button appears when the notification is hidden, you can choose to not display the button. If the notification is hidden, the user will not be able to reopen it.
- Gravatar email: enter an email associated with a Gravatar account, or leave blank to hide the avatar.

Developers can contribute on [Github](https://github.com/scottopolis/holler-box)

== FAQ ==

*Are there any limitations?*

No, you can create unlimited forms using all of the features described on this page. The <a href="http://hollerwp.com/pro" target="_blank">Pro version</a> offers optional extended functionality.

*Does it use the wp_mail() function to send mail?* 

Yes, if you have an SMTP plugin like Postman, Mailgun, or other mail plugin it will automatically use that to send mail.

*How do I setup MailChimp?*

First, add your API key under Holler Box => Settings.

You can find your API key in your MailChimp account under Account => Extras => API Keys. Generate a new one if it doesn't exist.

Save your API key.

Next, in your Holler Box, choose Mailchimp as the opt-in provider. Add your list ID. You can find this under Lists => Your List => Settings => List name and defaults. Look on the right side of the screen for List ID.

Copy/paste that into the MailChimp list ID field and save.

<strong>How do I find my ConvertKit form ID and API key?</strong>

Your API key is on your account page.

To get your form ID, visit Forms => your form. Look in the browser address bar, it should be something like this:

https://app.convertkit.com/landing_pages/445667/edit

That number is the form ID, in this case it's 445667. Enter that number as the ConvertKit form ID.

*How do I setup MailPoet?*

Install MailPoet, version 3 or later. Create a new Holler Box, and select MailPoet as the email provider. Choose your list and save, new subscribers will be added to this list.

**Troubleshooting**

*Emails are not sending*

The wp_mail() function is unreliable on many hosts. Install <a href="https://wordpress.org/plugins/postman-smtp/" target="_blank">Postman</a> or another SMTP plugin to use a more reliable mail service.

*Email signups are not working* 

Make sure your email form does not have a required field that is not displayed. For example, if you required first and last name, it will not work. Change your form to only require email, the rest of the fields optional. If you need extra fields, use the custom HTML form option.

== Screenshots ==

1. Notification box

2. Popup

3. (Fake) Live chat with email capture

4. Purchase notification (Pro)

5. Settings 1

6. Settings 2

7. Conversion Analytics

== Changelog ==

= 1.5.4 =

* Support for display on post in Pro version
* Fix for display on category archive pages

= 1.5.3 =

* Fix device detection with caching enabled

= 1.5.2 =

* Fix blurry text
* Fix issue with special characters in page titles

= 1.5.1 =

* Fix err msg
* Bump tested up to

= 1.5.0 =

* Allow name field in popout
* Translate email error string
* Fix top banner showing on all pages
* Update deprecated jQuery load function

= 1.4.2 =

* Update for WP 4.9.8

= 1.4.1 =

* Don't add scripts/styles to page unless there is an active box
* Move type settings before editor

= 1.4.0 =

* Fix display in Internet Explorer
* Support multiple popups and time ago settings with FOMO add-on

= 1.3.0 =

* Feature: redirect to url after email submission (Pro only)
* Feature: Drip integration (requires Drip plugin)
* Feature: Active Campaign integration (thanks WP E-Signature team!)
* Change: new boxes automatically default to "hide after user interacts"
* hwp_email_msg filter for "send to email" setting

= 1.2.0 =

* Hide popup after user hides by default
* Support for url redirect after submission (Pro)
* Bug fixes 

= 1.2.0 =

* Feature: Preview boxes before publishing by clicking "Preview"
* Feature: Choose devices setting: mobile, desktop, or both
* FOMO popup updates and new integrations
* Bug fixes 

= 1.1.1 =

* Fix for holler banner

= 1.1.0 =

* Major compatibility improvement: box content is now displayed with PHP to make it easier to display forms and other shortcodes.
* Ninja Forms compatibility
* Exit-intent is now included in the free version! Look under advanced settings.
* New progress bar popup template and custom template
* Support for Pro footer bar
* New screenshots

= 1.0.1 =

* Fix for banner display

= 1.0.0 =

This is a major update, everything is backwards compatible but you may need to re-save some settings if you make any changes to your Holler Boxes.

* Lightbox popups with templates!
* Holler Box types: notification box, popup, FOMO, chat, and more
* CPT UI settings updates
* Support for Pro features: name field, content upgrades, fomo updates
* Bug fixes and tweaks

= 0.9.1 =

* Holler Box Types: support for new popup and FOMO types
* Loading spinner while email is submitting
* Fix bug with multiple boxes on same page

= 0.9.0 =

* CPT settings design updates
* MailChimp single opt-in setting
* Support for MailChimp groups in Holler Box Pro
* Conversion rate admin column
* Bug fixes

= 0.8.2 =

* Fix input margin CSS
* Fix conversion tracking bug
* Settings page updates

= 0.8.1 =

* Fix for FontAwesome conflicts
* PHP docs cleanup props @thefrosty
* Escape some values props @jacobarriola

= 0.8.0 =

* Fix settings page permissions error
* Hide first for mobile
* Updates for Pro

= 0.7.0 =

* MailPoet 3 Integration
* Translation updates

= 0.6.0 =

* Change display logic for better future compatibility
* Add auto-complete to certain pages field
* Add more hooks and filters
* Compatibility with Pro features like banner, exit detection, link activation, taxonomy and post type filters, and more

= 0.5.1 =

* Fix possible conflict with Fontello

= 0.5.0 =

* BREAKING CHANGE: If using MailChimp, please visit Holler Box => Settings and add a MailChimp API key. Next, visit your Holler Box and change your MailChimp list URL to your list ID, then save.

= 0.4.1 =

* Fix MailChimp url trailing slash
* Email title setting
* Various fixes

= 0.4 = 

* Initial release