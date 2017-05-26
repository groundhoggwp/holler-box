<?php
/**
 * Handles sending messages
 * @since       0.1.0
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'SB_Automation_Ajax' ) ) {

    /**
     * SB_Automation_Ajax class
     *
     * @since       0.2.0
     */
    class SB_Automation_Ajax {

        /**
         * @var         SB_Automation_Ajax $instance The one true SB_Automation_Ajax
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
         * @return      object self::$instance The one true SB_Automation_Ajax
         */
        public static function instance() {
            if( !self::$instance ) {
                self::$instance = new SB_Automation_Ajax();
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

            add_action( 'wp_ajax_nopriv_sb_send_email', array( $this, 'sb_send_email' ) );
            add_action( 'wp_ajax_sb_send_email', array( $this, 'sb_send_email' ) );

            add_action( 'wp_ajax_nopriv_sb_track_event', array( $this, 'sb_track_event' ) );
            add_action( 'wp_ajax_sb_track_event', array( $this, 'sb_track_event' ) );

        }

        /**
         * Send message via email
         *
         * @since       0.1.0
         * @return      void
         */
        public function sb_send_email() {

            if( empty( $_GET['nonce'] ) || !wp_verify_nonce( $_GET['nonce'], 'sb-automation' ) ) {
                wp_send_json_error('Verification failed.' );
            }


            $msg = $_GET['msg'];

            $email = $_GET['email'];

            $headers = array( 'Reply-To: <' . $email . '>' );

            $success = wp_mail( 'support@apppresser.com', 'New SB Message', $msg, $headers );

            wp_send_json_success( 'Sent ' . $msg . ' from ' . $email . ' Success: ' . $success );
                
        }

        /**
         * Track event (click)
         *
         * @since       0.1.0
         * @return      void
         */
        public function sb_track_event() {

            // Tracking should be post meta, need to send post ID

            $id = $_GET['id'];

            // $email = $_GET['email'];

            if( $interactions = get_post_meta( $id, 'sb_interactions', 1 ) ) {
                update_post_meta( $id, 'sb_interactions', intval( $interactions ) + 1 );
            } else {
                $interactions = update_post_meta( $id, 'sb_interactions', 1 );
            }

            wp_send_json_success( 'Interaction tracked, total: ' . $interactions );
                
        }


    }

    $sb_automation_ajax = new SB_Automation_Ajax();
    $sb_automation_ajax->instance();

} // end class_exists check