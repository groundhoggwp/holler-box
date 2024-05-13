<?php
/**
 * Plugin Name:     HollerBox
 * Plugin URI:      https://hollerwp.com
 * Description:     Powerful Popups & Lead Generation for Small Businesses & Agencies using WordPress
 * Version:         2.3.7
 * Author:          Groundhogg Inc.
 * Author URI:      https://groundhogg.io
 * Text Domain:     holler-box
 *
 * @author          Groundhogg Inc.
 * @copyright       Copyright (c) Groundhogg Inc 2022
 *
 */


// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HOLLERBOX_VERSION', '2.3.7' );

if ( ! class_exists( 'Holler_Box' ) ) {

	/**
	 * Main Holler_Box class
	 *
	 */
	class Holler_Box {

		/**
		 * @var Holler_Box $instance The one true Holler_Box
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
			if ( ! self::$instance ) {
				self::$instance = new Holler_Box();
			}

			return self::$instance;
		}

		public function __construct() {

			if ( self::$instance ) {
				return;
			}

			$this->setup_constants();
			$this->includes();
			$this->load_textdomain();
			$this->hooks();

			new Holler_Admin();
			new Holler_Api();
			new Holler_Frontend();
			new Holler_Telemetry();
			new Holler_Updater();

			Holler_Licensing::instance();
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
			define( 'Holler_Box_VER', HOLLERBOX_VERSION );

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
			require_once __DIR__ . '/includes/class-holler-api.php';
			require_once __DIR__ . '/includes/class-holler-admin.php';
			require_once __DIR__ . '/includes/class-holler-popup.php';
			require_once __DIR__ . '/includes/class-holler-frontend.php';
			require_once __DIR__ . '/includes/class-holler-lead.php';
			require_once __DIR__ . '/includes/class-holler-integrations.php';
			require_once __DIR__ . '/includes/class-holler-reporting.php';
			require_once __DIR__ . '/includes/class-holler-settings.php';
			require_once __DIR__ . '/includes/class-holler-licensing.php';
			require_once __DIR__ . '/includes/class-holler-telemetry.php';
			require_once __DIR__ . '/includes/class-holler-updater.php';
			require_once __DIR__ . '/includes/Holler_EDD_SL_Plugin_Updater.php';
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
	Holler_Box::instance();

	do_action( 'hollerbox/loaded' );
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

	holler_box_load();

	Holler_Reporting::instance()->create_table();
}

register_activation_hook( __FILE__, 'holler_box_activation' );
