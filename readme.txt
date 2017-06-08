=== Holler Box - Smart, Stylish Popup Messages ===

Contributors: scottopolis
Tags: popup, optin, mailchimp, wordpress popup
Requires at least: 4.5
Tested up to: 4.8
Stable tag: 0.5.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Convert more visitors to customers with personalized popup messages.

== Description ==

Show customizable marketing messages to your site visitors easily, with beautiful design. Convert website visitors, upsell customers, and get your message out to the right people at the right time.

Easily announce a sale, webinar, new article, email opt-in, and lots more.

Use our smart filter system to show to the right visitor at the right time.

Keep track of who has seen your messages and how well they are working, so you can tweak and improve.

See live demos at the <a href="http://hollerwp.com/" target="_blank">Holler Box website</a>.

## What can you do with it?

**Smart notification box**

Show a non-intrusive Intercom style notification box with your message. Announce a webinar, collect email optins, show your latest blog post, and lots more.

Choose where and when you show it, and to which visitors. For example, show your sale announcement only on the pricing page to returning visitors. Show your email optin only on your blog posts.

**Header Banner** 

Show a header banner to announce a sale, keep track of how many people click on it. (Pro only)

**(Fake) Live Chat with Opt-in**

Show a live chat box to collect customer questions and emails, without having to actually deal with the hassle of live chat! As soon as your visitor types a question, an email opt-in pops up so you can follow up with them at a convenient time.

**Polls and Forms**

Embed anything into your Holler Box, including a feedback form or poll.

**Impressions and Conversions**

See how your messages are performing. Track views and conversions (link clicks and message opens) so you can optimize and improve. 

**Interactivity**

Add a link, video, contact form, or simple opt-in form that integrates with major email providers like MailChimp and Convertkit.

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
- MailChimp integration: enter your <a href="http://kb.mailchimp.com/lists/signup-forms/share-your-signup-form" target="_blank">full signup form url</a>. (Must not be the shortened url) 
- Convertkit: visit Holler Box => Settings, enter <a href="https://app.convertkit.com/account/edit" target="_blank">your API key</a>. Choose Convertkit when creating your new Holler Box, then enter your form ID. Find your form ID by visiting your signup form, then copy the numbers in the url (or in the embed code).
- Show chat: show the (fake) live chat

**Advanced Settings**

- Pages: choose all pages, or enter page IDs, separated by comma. For example: 701,5,678
- New or returning: show to only new visitors (since you activated the plugin), or returning visitors. Tracked with the hwp_visit cookie.
- When should we show: after the page loads, show immediately, with a delay, or based on user scroll.
- When should it disappear: if you want the notification to show briefly and then disappear automatically, enter a delay here.
- How often show we show it: a visitor will be shown your message, then you can choose to continue showing it, or hide it based on number of days or user interaction. Interaction is either submitting an email, or clicking a link with a class of hwp-interaction.
- Hide the button: the button appears when the notification is hidden, you can choose to not display the button. If the notification is hidden, the user will not be able to reopen it.
- Gravatar email: enter an email associated with a Gravatar account, or leave blank to hide the avatar.

Developers can contribute on Github https://github.com/scottopolis/holler-box

== FAQ ==

*Does it use the wp_mail() function to send mail?* 

Yes, if you have an SMTP plugin like Postman, Mailgun, or other mail plugin it will automatically use that to send mail.

*How do I setup MailChimp?*

First, add your API key under Holler Box => Settings.

You can find your API key in your MailChimp account under Account => Extras => API Keys. Generate a new one if it doesn't exist.

Save your API key.

Next, in your Holler Box, choose Mailchimp as the opt-in provider. Add your list ID. You can find this under Lists => Your List => Settings => List name and defaults. Look on the right side of the screen for List ID.

Copy/paste that into the MailChimp list ID field and save.

<strong>How do I find my Convertkit form ID and API key?</strong>

Your API key is on your account page.

To get your form ID, visit Forms => your form. Look in the browser address bar, it should be something like this:

https://app.convertkit.com/landing_pages/445667/edit

That number is the form ID, in this case it's 445667. Enter that number as the Convertkit form ID.

**Troubleshooting**

*Emails are not sending*

The wp_mail() function is unreliable on many hosts. Install <a href="https://wordpress.org/plugins/postman-smtp/" target="_blank">Postman</a> or another SMTP plugin to use a more reliable mail service.

*Email signups are not working* 

Make sure your email form does not have a required field that is not displayed. For example, if you required first and last name, it will not work. Change your form to only require email, the rest of the fields optional. If you need extra fields, use the custom HTML form option.

== Screenshots ==

1. Default notification box with link

2. Opt-in form

3. (Fake) Live chat with email capture

4. Purchase notification

5. Hidden view

6. Display settings

7. Advanced settings

8. CPT

== Changelog ==

= 0.5.0 =

* BREAKING CHANGE: If using MailChimp, please visit Holler Box => Settings and add a MailChimp API key. Next, visit your Holler Box and change your MailChimp list URL to your list ID, then save.

= 0.4.1 =

* Fix MailChimp url trailing slash
* Email title setting
* Various fixes

= 0.4 = 

* Initial release