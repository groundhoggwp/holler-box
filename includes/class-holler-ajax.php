<?php

/**
 * Handles sending messages
 * @since       0.1.0
 */
// Exit if accessed directly
if (!defined('ABSPATH'))
    exit;

if (!class_exists('Holler_Ajax')) {

    /**
     * Holler_Ajax class
     *
     * @since       0.2.0
     */
    class Holler_Ajax {

        /**
         * @var         Holler_Ajax $instance The one true Holler_Ajax
         * @since       0.2.0
         */
        private static $instance;
        public static $errorpath = '../php-error-log.php';

        // sample: error_log("meta: " . $meta . "\r\n",3,self::$errorpath);

        /**
         * Get active instance
         *
         * @access      public
         * @since       0.2.0
         * @return      self self::$instance The one true Holler_Ajax
         */
        public static function instance() {

            if (!self::$instance) {
                self::$instance = new Holler_Ajax();
                self::$instance->hooks();
            }

            return self::$instance;
        }

        /**
         * Include necessary files
         *
         * @access      private
         * @since       0.2.0
         * @return      void
         */
        private function hooks() {

            add_action('wp_ajax_nopriv_hwp_send_email', array($this, 'hwp_send_email'));
            add_action('wp_ajax_hwp_send_email', array($this, 'hwp_send_email'));

            add_action('wp_ajax_nopriv_hwp_mc_subscribe', array($this, 'hwp_mc_subscribe'));
            add_action('wp_ajax_hwp_mc_subscribe', array($this, 'hwp_mc_subscribe'));

            add_action('wp_ajax_nopriv_hwp_ac_subscribe', array($this, 'hwp_ac_subscribe'));
            add_action('wp_ajax_hwp_ac_subscribe', array($this, 'hwp_ac_subscribe'));

            add_action('wp_ajax_nopriv_hwp_mailpoet_subscribe', array($this, 'mailpoet_subscribe'));
            add_action('wp_ajax_hwp_mailpoet_subscribe', array($this, 'mailpoet_subscribe'));

            add_action('wp_ajax_nopriv_hwp_track_event', array($this, 'hwp_track_event'));
            add_action('wp_ajax_hwp_track_event', array($this, 'hwp_track_event'));

            add_action('wp_ajax_nopriv_hwp_track_view', array($this, 'hwp_track_view'));
            add_action('wp_ajax_hwp_track_view', array($this, 'hwp_track_view'));

            add_action('wp_ajax_hwp_toggle_active', array($this, 'toggle_active'));

            add_action('wp_ajax_hwp_ajax_page_search', array($this, 'page_search'));

            add_action('wp_ajax_hwp_ajax_post_search', array($this, 'post_search'));

        }
        
         public function mailType($content_type) {
            $mail_type = 'text/html';
            return apply_filters('holler_box_mailtype', $mail_type);
        }

        public function charType($charset) {
            $charType = 'utf-8';
            return apply_filters('holler_box_mail_chartype', $charType);
        }

        /**
         * Send message via email
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_send_email() {

            if (empty($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'holler-box')) {
                wp_send_json_error('Verification failed.');
            }

            if (empty($_GET['id']) || empty($_GET['email']))
                wp_send_json_error('Missing required field.');

            $msg = $_GET['msg'] . "\n";

            $email = $_GET['email'];

            $name = ( !empty( $_GET['name'] ) ? $_GET['name'] : null );

            $title = $_GET['title'];

            if (!empty($title))
                $msg .= "\nForm: " . $title;

            $msg .= "\nEmail: " . $email;

            if (!empty($name))
                $msg .= "\nName: " . $name;

            $msg = apply_filters( 'hwp_email_msg', $msg, $email, $name );

            $id = $_GET['id'];

            $title = get_option('hwp_email_title');

            $title = (!empty($title) ? $title : "New Holler Box Submission" );

            $sendto = get_post_meta($id, 'opt_in_send_to', 1);

            $headers = array('Reply-To: <' . $email . '>');
            
            add_filter('wp_mail_content_type', array($this, 'mailType')); // to support mail content type.
            add_filter('wp_mail_charset', array($this, 'charType'));  // to support email content in different language 
            
            $endcodedTitle='=?UTF-8?B?'.base64_encode($title).'?='; // to support different language than English

            $success = wp_mail($sendto, $endcodedTitle, $msg, $headers);
            
            remove_filter('wp_mail_content_type', 'set_html_content_type');

            wp_send_json_success('Sent ' . $msg . ' from ' . $email . ' Success: ' . $success);
        }

        /**
         * Subscribe user via MailChimp API
         * Help from https://www.codexworld.com/add-subscriber-to-list-mailchimp-api-php/
         * 
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_mc_subscribe() {

            if (empty($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'holler-box')) {
                wp_send_json_error('Verification failed.');
            }

            $list_id = $_GET['list_id'];

            $interests = $_GET['interests'];

            $email = sanitize_text_field($_GET['email']);
            $name = sanitize_text_field($_GET['name']);

            // MailChimp API credentials
            $api_key = get_option('hwp_mc_api_key');

            // Double opt-in = 'pending'
            // no double opt = 'subscribed'
            // 'subscribed' doesn't send final welcome email
            $status = ( get_option('hwp_mc_status') === '1' ? 'subscribed' : 'pending' );

            if (empty($list_id) || empty($api_key) || empty($email))
                wp_send_json_error('Missing required field.');

            $headers = array(
                'Authorization' => 'Basic ' . base64_encode('user:' . $api_key),
                'Content-Type' => 'application/json'
            );

            // MailChimp API URL
            $member_id = md5(strtolower($email));
            $data_center = substr($api_key, strpos($api_key, '-') + 1);
            $url = 'https://' . $data_center . '.api.mailchimp.com/3.0/lists/' . $list_id . '/members/' . $member_id;

            // member information
            $body = array(
                'email_address' => $email,
                'status' => $status
            );

            if (!empty($name)) {
                $body['merge_fields'] = [
                    'FNAME' => $name,
                        //'LNAME'     => $lname
                ];
            }

            // Interests are groups => groups. Need to convert "true" string to boolean for MC api
            if (!empty($interests)) {
                foreach ($interests as $key => $value) {
                    $interestsNew[$key] = true;
                }
                $body['interests'] = $interestsNew;
            }

            $response = wp_remote_post($url, array(
                'method' => 'PUT',
                'timeout' => 15,
                'headers' => $headers,
                'body' => json_encode($body)
                    )
            );

            if (is_wp_error($response)) {
                $error_message = $response->get_error_message();
                wp_send_json_error($error_message);
            } else {
                wp_send_json_success($response);
            }
        }

        public function apiUrl() {
            return get_option('hwp_ac_url') . '/api/3/';
        }

        public function apiKey() {
            return get_option('hwp_ac_api_key');
        }

        public function processApiRequest($args, $action = false) {

            $headers = array(
                'Api-Token' => $this->apiKey(),
                'Content-Type' => 'application/json'
            );


            $appUrl = ($action) ? $this->apiUrl() . $action : $this->apiUrl();

            $response = wp_remote_post($appUrl, array(
                'method' => 'POST',
                'timeout' => 15,
                'headers' => $headers,
                'body' => json_encode($args)
                    )
            );
            
            return json_decode(wp_remote_retrieve_body($response));
        }

        private function joinList($contactId, $list_id) {

            $contactList = array(
                "contactList" => array(
                    "contact" => $contactId,
                    "list" => $list_id,
                    "status" => 1
                )
            );

            return $this->processApiRequest($contactList, "contactLists");
        }
        
        private function is_error($response){
               if($response->errors){
                   return true;
               }
               return false;
        }
        
        private function get_error_message($response){
            return  $response->errors[0]->detail;
        }

        /**
         * Subscribe user via Active Campaign API (v3)
         * 
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_ac_subscribe() {

             if (empty($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'holler-box')) {
              wp_send_json_error('Verification failed.');
              } 

            $list_id = $_GET['list_id'];

            $email = sanitize_text_field($_GET['email']);
            $name = sanitize_text_field($_GET['name']);

            if (empty($list_id) || empty($email))
                wp_send_json_error('Missing required field.');

            // member information
            $contacts = array(
                'contact' => array(
                    'email' => $email,
                    'firstName' => $name
                ),
            );

            $response = $this->processApiRequest($contacts, "contacts");
          
            if ($this->is_error($response)) {
                $error_message = $this->get_error_message($response);
                wp_send_json_error($error_message);
            } else {
                $contactId = $response->contact->id;
                $response = $this->joinList($contactId, $list_id);
                wp_send_json_success($response);
            }
        }

        /**
         * Subscribe user via MailPoet API
         * http://beta.docs.mailpoet.com/article/195-add-subscribers-through-your-own-form-or-plugin
         * 
         *
         * @since       0.6.0
         * @return      void
         */
        public function mailpoet_subscribe() {

            if (empty($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'holler-box')) {
                wp_send_json_error('Verification failed.');
            }

            if (!class_exists('\MailPoet\API\API'))
                wp_send_json_error('Please install and activate the MailPoet plugin.');

            $list = $_GET['list_id'];
            $name = sanitize_text_field($_GET['name']);

            $subscriber = array(
                'email' => sanitize_text_field($_GET['email'])
            );

            if (empty($subscriber))
                wp_send_json_error('Missing required field.');

            if (!empty($name))
                $subscriber['first_name'] = $name;

            // Subscribe via MailPoet 3 API
            try {
                $subscriber = \MailPoet\API\API::MP('v1')->addSubscriber($subscriber, array($list));
            } catch (Exception $exception) {
                wp_send_json_error($exception->getMessage());
            }

            wp_send_json_success($subscriber);
        }

        /**
         * Track event (click)
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_track_event() {

            $id = $_GET['id'];

            if (empty($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'holler-box') || empty($id)) {
                wp_send_json_error('Missing required field.');
            }

            $conversions = get_post_meta($id, 'hwp_conversions', 1);

            if ($conversions) {
                update_post_meta($id, 'hwp_conversions', intval($conversions) + 1);
            } else {
                $conversions = update_post_meta($id, 'hwp_conversions', 1);
            }

            wp_send_json_success('Interaction tracked, total: ' . $conversions);
        }

        /**
         * Track note shown (for conversion rates)
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_track_view() {

            $id = $_GET['id'];

            if (empty($_GET['nonce']) || !wp_verify_nonce($_GET['nonce'], 'holler-box') || empty($id)) {
                wp_send_json_error('Missing required field.');
            }

            if (get_post_meta($id, 'hwp_views', 1)) {
                $views = get_post_meta($id, 'hwp_views', 1);
                $views = update_post_meta($id, 'hwp_views', intval($views) + 1);
            } else {
                $views = update_post_meta($id, 'hwp_views', 1);
            }

            wp_send_json_success('View tracked, total: ' . get_post_meta($id, 'hwp_views', 1));
        }

        /**
         * Toggle active meta value. ID is required
         *
         * @since       0.1.0
         * @return      void
         */
        public function toggle_active() {

            $id = $_GET['id'];

            if (empty($id))
                wp_send_json_error('ID is required.');

            if (get_post_meta($id, 'hwp_active', 1) === '1') {
                delete_post_meta($id, 'hwp_active');
            } else {
                update_post_meta($id, 'hwp_active', '1');
            }

            wp_send_json_success('Toggled. New value: ' . get_post_meta($id, 'hwp_active', 1));
        }

        /**
         * Used for autofilling pages via admin text field, using jQuery suggest
         *
         * @access      public
         * @since       0.1
         * @return      void
         */
        public function page_search() {

            $s = wp_unslash($_GET['q']);

            $comma = _x(',', 'page delimiter');
            if (',' !== $comma)
                $s = str_replace($comma, ',', $s);
            if (false !== strpos($s, ',')) {
                $s = explode(',', $s);
                $s = $s[count($s) - 1];
            }
            $s = trim($s);

            $term_search_min_chars = 2;

            $the_query = new WP_Query(
                    array(
                's' => $s,
                'posts_per_page' => 5,
                'post_type' => 'page'
                    )
            );

            if ($the_query->have_posts()) {
                while ($the_query->have_posts()) {
                    $the_query->the_post();
                    $results[] = get_the_title();
                }
                /* Restore original Post Data */
                wp_reset_postdata();
            } else {
                $results = 'No results';
            }

            echo join($results, "\n");
            wp_die();
        }

        /**
         * Used for autofilling pages via admin text field, using jQuery suggest
         *
         * @access      public
         * @since       0.1
         * @return      void
         */
        public function post_search() {

            $s = wp_unslash($_GET['q']);

            $comma = _x(',', 'page delimiter');
            if (',' !== $comma)
                $s = str_replace($comma, ',', $s);
            if (false !== strpos($s, ',')) {
                $s = explode(',', $s);
                $s = $s[count($s) - 1];
            }
            $s = trim($s);

            $term_search_min_chars = 2;

            $types = get_option( 'hwp_post_types', ['post']);

            $the_query = new WP_Query(
                    array(
                's' => $s,
                'posts_per_page' => 5,
                'post_type' => $types
                    )
            );

            if ($the_query->have_posts()) {
                while ($the_query->have_posts()) {
                    $the_query->the_post();
                    $results[] = get_the_title();
                }
                /* Restore original Post Data */
                wp_reset_postdata();
            } else {
                $results = 'No results';
            }

            echo join($results, "\n");
            wp_die();
        }

    }

    $holler_ajax = new Holler_Ajax();
    $holler_ajax->instance();
} // end class_exists check
