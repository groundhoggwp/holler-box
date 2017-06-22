# Holler Box

Nobody likes in-your-face popups, but we still have important messages we need our visitors to see.

How can we communicate these messages effectively, without being annoying?

Holler Box is a small, non-intrusive message box that doesn’t interrupt your visitors. It shows them the right message at the right time, without getting in their face.

Collect more email leads, get more sales during a promotion, or get the word out about your event. Use our smart filter system to choose where and when to show it, for example only on your blog posts to new visitors.

Other tools are over overly-complex, and take too long to setup a simple message. Holler Box is lightweight and easy to use, you can add a new message to your site in under 30 seconds.

Keep track of who has seen your messages and how well they are working, so you can tweak and improve. Add any WordPress content such as shortcodes and media, right in the comfort of your wp-admin.

It’s time to get smart about how we display our popups, start communicating better with Holler Box!

See live demos at the [Holler Box website](http://hollerwp.com/)

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

## Installation

Go to your WordPress admin, Plugins => Add New, and search for "Holler Box." Install and activate.

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

- Pages: choose all pages, or select certain pages and begin typing a page title. It will automatically populate a drop down list, simply click the page title or enter page titles comma separated like this: Home, Features, pricing
- New or returning: show to only new visitors (since you activated the plugin), or returning visitors. Tracked with the hwp_visit cookie.
- When should we show: after the page loads, show immediately, with a delay, or based on user scroll.
- When should it disappear: if you want the notification to show briefly and then disappear automatically, enter a delay here.
- How often show we show it: a visitor will be shown your message, then you can choose to continue showing it, or hide it based on number of days or user interaction. Interaction is either submitting an email, or clicking a link with a class of hwp-interaction.
- Hide the button: the button appears when the notification is hidden, you can choose to not display the button. If the notification is hidden, the user will not be able to reopen it.
- Gravatar email: enter an email associated with a Gravatar account, or leave blank to hide the avatar.

Developers can contribute on Github https://github.com/scottopolis/holler-box

## FAQ

*Does it use the wp_mail() function to send mail?* 

Yes, if you have an SMTP plugin like Postman, Mailgun, or other mail plugin it will automatically use that to send mail.

*How do I setup MailChimp?*

First, add your API key under Holler Box => Settings.

You can find your API key in your MailChimp account under Account => Extras => API Keys. Generate a new one if it doesn't exist.

Save your API key.

Next, in your Holler Box, choose Mailchimp as the opt-in provider. Add your list ID. You can find this under Lists => Your List => Settings => List name and defaults. Look on the right side of the screen for List ID.

Copy/paste that into the MailChimp list ID field and save.

*How do I find my Convertkit form ID and API key?*

Your API key is on your account page.

To get your form ID, visit Forms => your form. Look in the browser address bar, it should be something like this:

https://app.convertkit.com/landing_pages/445667/edit

That number is the form ID, in this case it's 445667. Enter that number as the Convertkit form ID.

*How do I setup MailPoet?*

Install MailPoet, version 3 or later. Create a new Holler Box, and select MailPoet as the email provider. Choose your list and save, new subscribers will be added to this.

**Troubleshooting**

*Emails are not sending*

The wp_mail() function is unreliable on many hosts. Install [Postman](https://wordpress.org/plugins/postman-smtp/) or another SMTP plugin to use a more reliable mail service.

*Email signups are not working* 

Make sure your email form does not have a required field that is not displayed. For example, if you required first and last name, it will not work. Change your form to only require email, the rest of the fields optional. If you need extra fields, use the custom HTML form option.