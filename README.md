# Holler Box

Holler Box is a popup and banner plugin that gives eCommerce store owners everything they need to collect leads and generate more sales.

It's lightweight and easy-to-use, not like other overly complex tools.

https://www.youtube.com/watch?v=VKGkah5mBrg

Holler Box works like this:

### 1. Increase Your Email Opt-ins

Step one is to collect more leads at the top of your funnel, so you can follow up with customers and potentially convert them into customers.

Holler Box allows you to create email optin forms easily, choose where and when to display them, and integrate with your email provider. Using the Holler Box smart display filters, you can show your opt-in in the right place at the right time, to increase your conversion rates and eventually get more sales.

Use Holler Box to announce a webinar, a live event, or get traffic to a new article. It's flexible so you can get your message across.

### 2. Increase Sales

Holler Box Pro has a couple of ways to increase your sales.

**Announce Promotions with the Holler Banner (pro only)**

When you are running a sale or promotion on your store, you want the right people to know about it to get as many sales as possible. Use the Holler Banner to show your promotion or discount code in a header banner on your site, and automatically deactivate it when the promotion ends.

Using the Holler Box smart display filters, you can choose to show the promotion only to logged out visitors, not to any logged in customers.

**Social Proof (pro only)**

Social proof is a big part of converting a potential sale. If are using WooCommerce or Easy Digital Downloads, now you can show your customers that other people are buying with the Holler Box Sales Notification add-on.

It displays the name and package purchased by your latest customer to anyone who visits your site. Choose where and when to show it, for example only once per visitor per day.

Watch your conversion rates skyrocket with this amazing social proof!

### 3. Gather Feedback

An important part of any eCommerce store is gathering feedback from site visitors.

Using the expanded pop-out option (pro only), you can ask for feedback using an embedded Gravity Form. This allows you to tweak and optimize your site based on real input from your potential customers.

### Conversion data and more

Get conversion data right in your admin to see how well your messages are working, so you can tweak and improve. 

Add any WordPress content such as shortcodes and media, and feel secure knowing you own your own data. No 3rd party services are displaying your popups with Holler Box.

The best part about Holler Box is that it is effective with being annoying. It shows your audience the right message at the right time, without turning people off.

Start collecting more leads and getting more sales with Holler Box Pro today.

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