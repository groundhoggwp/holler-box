<?php
/**
 * Handles sending messages
 * @since       0.1.0
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'Holler_Ajax' ) ) {

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
         * @return      object self::$instance The one true Holler_Ajax
         */
        public static function instance() {
            if( !self::$instance ) {
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

            add_action( 'wp_ajax_nopriv_hwp_send_email', array( $this, 'hwp_send_email' ) );
            add_action( 'wp_ajax_hwp_send_email', array( $this, 'hwp_send_email' ) );

            add_action( 'wp_ajax_nopriv_hwp_track_event', array( $this, 'hwp_track_event' ) );
            add_action( 'wp_ajax_hwp_track_event', array( $this, 'hwp_track_event' ) );

            add_action( 'wp_ajax_nopriv_hwp_track_view', array( $this, 'hwp_track_view' ) );
            add_action( 'wp_ajax_hwp_track_view', array( $this, 'hwp_track_view' ) );

            add_action( 'wp_ajax_hwp_toggle_active', array( $this, 'toggle_active' ) );

        }

        /**
         * Send message via email
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_send_email() {

            if( empty( $_GET['nonce'] ) || !wp_verify_nonce( $_GET['nonce'], 'holler-box' ) ) {
                wp_send_json_error('Verification failed.' );
            }

            if( empty( $_GET['id'] ) || empty( $_GET['email'] ) )
                wp_send_json_error('Missing required field.' );

            $msg = $_GET['msg'];

            $email = $_GET['email'];

            $id = $_GET['id'];

            $sendto = get_post_meta( $id, 'opt_in_send_to', 1);

            $headers = array( 'Reply-To: <' . $email . '>' );

            $success = wp_mail( $sendto, 'New Message', $msg, $headers );

            wp_send_json_success( 'Sent ' . $msg . ' from ' . $email . ' Success: ' . $success );
                
        }

        /**
         * Track event (click)
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_track_event() {

            $id = $_GET['id'];

            if( empty( $_GET['nonce'] ) || !wp_verify_nonce( $_GET['nonce'], 'holler-box' ) || empty( $id ) ) {
                wp_send_json_error('Missing required field.');
            }

            $conversions = get_post_meta( $id, 'hwp_conversions', 1 );

            if( $conversions ) {
                update_post_meta( $id, 'hwp_conversions', intval( $conversions ) + 1 );
            } else {
                $conversions = update_post_meta( $id, 'hwp_conversions', 1 );
            }

            wp_send_json_success( 'Interaction tracked, total: ' . $conversions );
                
        }

        /**
         * Track note shown (for conversion rates)
         *
         * @since       0.1.0
         * @return      void
         */
        public function hwp_track_view() {

            $id = $_GET['id'];

            if( empty( $_GET['nonce'] ) || !wp_verify_nonce( $_GET['nonce'], 'holler-box' ) || empty( $id ) ) {
                wp_send_json_error('Missing required field.');
            }

            if( get_post_meta( $id, 'hwp_views', 1 ) ) {
                $views = get_post_meta( $id, 'hwp_views', 1 );
                $views = update_post_meta( $id, 'hwp_views', intval( $views ) + 1 );
            } else {
                $views = update_post_meta( $id, 'hwp_views', 1 );
            }

            wp_send_json_success( 'View tracked, total: ' . get_post_meta( $id, 'hwp_views', 1 ) );
                
        }

        /**
         * Toggle active meta value. ID is required
         *
         * @since       0.1.0
         * @return      void
         */
        public function toggle_active() {

            $id = $_GET['id'];

            if( empty($id) )
                wp_send_json_error('ID is required.');

            if( get_post_meta( $id, 'hwp_active', 1 ) === '1' ) {
                delete_post_meta( $id, 'hwp_active' );
            } else {
                update_post_meta( $id, 'hwp_active', '1' );
            }

            wp_send_json_success( 'Toggled. New value: ' . get_post_meta( $id, 'hwp_active', 1 ) );
                
        }


    }

    $holler_ajax = new Holler_Ajax();
    $holler_ajax->instance();

} // end class_exists check