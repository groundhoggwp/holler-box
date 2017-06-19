# Holler Box

Smart, Stylish Popup Messages for WordPress sites.

Show customizable marketing messages to your site visitors easily, with beautiful design. Convert website visitors, upsell customers, and get your message out to the right people at the right time.

Easily announce a sale, webinar, new article, email opt-in, and lots more.

Use our smart filter system to show to the right visitor at the right time.

Keep track of who has seen your messages and how well they are working, so you can tweak and improve.

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

*How do I find my MailChimp form url?*

In your MailChimp account, go to Lists => Your List => Signup Forms => General Forms.

<img src="http://hollerwp.com/wp-content/uploads/2017/06/Screen-Shot-2017-06-06-at-1.29.42-PM-300x158.png" alt="" width="300" height="158" class="alignnone size-medium wp-image-74" />

Copy the list url.

<img src="http://hollerwp.com/wp-content/uploads/2017/06/Screen-Shot-2017-06-06-at-1.29.51-PM-300x95.png" alt="" width="300" height="95" class="alignnone size-medium wp-image-75" />

Next, to un-shorten the link: Paste it into your web browser's address bar, and press enter. It will go to your signup form on the web, copy the address in your address bar now. The url should look like this:

http://mycompany.us16.list-manage2.com/subscribe?u=d7sgadsg8d8f999asf9&id=590bg8f9d

That is the url you will use in the MailChimp list setting.

<strong>How do I find my Convertkit form ID and API key?</strong>

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