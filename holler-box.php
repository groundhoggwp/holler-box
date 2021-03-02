<?php
/**
 * Plugin Name:     Holler Box
 * Plugin URI:      https://hollerwp.com
 * Description:     A lightweight popup plugin with lead generation opt-in forms.
 * Version:         1.5.4
 * Author:          Scott Bolinger
 * Author URI:      https://scottbolinger.com
 * Text Domain:     holler-box
 *
 * @author          Scott Bolinger
 * @copyright       Copyright (c) Scott Bolinger 2021
 *
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'Holler_Box' ) ) {

    /**
     * Main Holler_Box class
     *
     * @since       0.1.0
     */
    class Holler_Box {

        /**
         * @var         Holler_Box $instance The one true Holler_Box
         * @since       0.1.0
         */
        private static $instance;


        /**
         * Get active instance
         *
         * @access      public
         * @since       0.1.0
         * @return      self The one true Holler_Box
         */
        public static function instance() {
            if( !self::$instance ) {
                self::$instance = new Holler_Box();
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
            define( 'Holler_Box_VER', '1.5.4' );

            // Plugin path
            define( 'Holler_Box_DIR', plugin_dir_path( __FILE__ ) );

            // Plugin URL
            define( 'Holler_Box_URL', plugin_dir_url( __FILE__ ) );
        }


        /**
         * Include necessary files
         *
         * @access      private
         * @since       0.1.0
         * @return      void
         */
        private function includes() {

            require_once Holler_Box_DIR . 'includes/class-holler-functions.php';
            require_once Holler_Box_DIR . 'includes/class-holler-ajax.php';

            if( is_admin() )
                require_once Holler_Box_DIR . 'includes/class-holler-admin.php';
            
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

            load_plugin_textdomain( 'holler-box' );
            
        }

    }
} // End if class_exists check


/**
 * The main function responsible for returning the one true EDD_Metrics
 * instance to functions everywhere
 *
 * @since       0.1.0
 * @return      \Holler_Box The one true Holler_Box
 *
 */
function holler_box_load() {
    return Holler_Box::instance();
}
add_action( 'plugins_loaded', 'holler_box_load' );


/**
 * The activation hook is called outside of the singleton because WordPress doesn't
 * register the call from within the class, since we are preferring the plugins_loaded
 * hook for compatibility, we also can't reference a function inside the plugin class
 * for the activation function. If you need an activation function, put it here.
 *
 * @since       0.1.0
 * @return      void
 */
function holler_box_activation() {
    /* Activation functions here */
}
register_activation_hook( __FILE__, 'holler_box_activation' );
