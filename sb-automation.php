<?php
/**
 * Plugin Name:     SB Marketing Automation
 * Plugin URI:      http://scottbolinger.com
 * Description:     Convert visitors to customers with personalized messaging.
 * Version:         0.1
 * Author:          Scott Bolinger
 * Author URI:      http://scottbolinger.com
 * Text Domain:     sb-automation
 *
 * @author          Scott Bolinger
 * @copyright       Copyright (c) Scott Bolinger 2017
 *
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'SB_Automation' ) ) {

    /**
     * Main SB_Automation class
     *
     * @since       0.1.0
     */
    class SB_Automation {

        /**
         * @var         SB_Automation $instance The one true SB_Automation
         * @since       0.1.0
         */
        private static $instance;


        /**
         * Get active instance
         *
         * @access      public
         * @since       0.1.0
         * @return      object self::$instance The one true SB_Automation
         */
        public static function instance() {
            if( !self::$instance ) {
                self::$instance = new SB_Automation();
                self::$instance->setup_constants();
                self::$instance->includes();
                self::$instance->load_textdomain();
                self::$instance->hooks();
            }

            return self::$instance;
        }


        /**
         * Setup plugin constants
         *
         * @access      private
         * @since       0.1.0
         * @return      void
         */
        private function setup_constants() {
            // Plugin version
            define( 'SB_Automation_VER', '0.1' );

            // Plugin path
            define( 'SB_Automation_DIR', plugin_dir_path( __FILE__ ) );

            // Plugin URL
            define( 'SB_Automation_URL', plugin_dir_url( __FILE__ ) );
        }


        /**
         * Include necessary files
         *
         * @access      private
         * @since       0.1.0
         * @return      void
         */
        private function includes() {

            require_once SB_Automation_DIR . 'includes/class-sb-automation-functions.php';
            require_once SB_Automation_DIR . 'includes/class-sb-automation-ajax.php';

            if( is_admin() )
                require_once SB_Automation_DIR . 'includes/class-sb-automation-admin.php';
            
        }


        /**
         * Run action and filter hooks
         *
         * @access      private
         * @since       0.1.0
         * @return      void
         *
         *
         */
        private function hooks() {

        }


        /**
         * Internationalization
         *
         * @access      public
         * @since       0.1.0
         * @return      void
         */
        public function load_textdomain() {

            load_plugin_textdomain( 'sb-automation' );
            
        }

    }
} // End if class_exists check


/**
 * The main function responsible for returning the one true EDD_Metrics
 * instance to functions everywhere
 *
 * @since       0.1.0
 * @return      \EDD_Metrics The one true EDD_Metrics
 *
 */
function SB_Automation_load() {
    return SB_Automation::instance();
}
add_action( 'plugins_loaded', 'SB_Automation_load' );


/**
 * The activation hook is called outside of the singleton because WordPress doesn't
 * register the call from within the class, since we are preferring the plugins_loaded
 * hook for compatibility, we also can't reference a function inside the plugin class
 * for the activation function. If you need an activation function, put it here.
 *
 * @since       0.1.0
 * @return      void
 */
function SB_Automation_activation() {
    /* Activation functions here */
}
register_activation_hook( __FILE__, 'SB_Automation_activation' );
