=== Holler Box - Perfectly Timed, Non-Intrusive Popup Messages ===

Contributors: scottopolis
Tags: popup, optin, mailchimp, wordpress popup
Requires at least: 4.5
Tested up to: 4.7.5
Stable tag: 0.4.1
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

= 0.4.1 =

* Fix MailChimp url trailing slash
* Email title setting
* Various fixes

= 0.4 = 

* Initial release