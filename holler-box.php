<?php
/**
 * Plugin Name:     HollerBox
 * Plugin URI:      https://hollerwp.com
 * Description:     A lightweight popup plugin with lead generation opt-in forms.
 * Version:         1.5.8
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

define( 'HOLLERBOX_VERSION', '2.0' );

if ( ! class_exists( 'Holler_Box' ) ) {

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
		 * @return      self The one true Holler_Box
		 * @since       0.1.0
		 */
		public static function instance() {
			if ( ! self::$instance ) {
				self::$instance = new Holler_Box();
				self::$instance->setup_constants();
				self::$instance->includes();
				self::$instance->load_textdomain();
				self::$instance->hooks();

				new Holler_Api();
				new Holler_Frontend();
			}

			return self::$instance;
		}


		/**
		 * Setup plugin constants
		 *
		 * @access      private
		 * @return      void
		 * @since       0.1.0
		 */
		private function setup_constants() {
			// Plugin version
			define( 'Holler_Box_VER', '1.5.8' );

			// Plugin path
			define( 'Holler_Box_DIR', plugin_dir_path( __FILE__ ) );

			// Plugin URL
			define( 'Holler_Box_URL', plugin_dir_url( __FILE__ ) );
		}


		/**
		 * Include necessary files
		 *
		 * @access      private
		 * @return      void
		 * @since       0.1.0
		 */
		private function includes() {

			require_once __DIR__ . '/includes/class-holler-api.php';
			require_once __DIR__ . '/includes/class-holler-admin.php';
			require_once __DIR__ . '/includes/class-holler-popup.php';
			require_once __DIR__ . '/includes/class-holler-frontend.php';
			require_once __DIR__ . '/includes/class-holler-lead.php';
			require_once __DIR__ . '/includes/class-holler-integrations.php';
			require_once __DIR__ . '/includes/class-holler-reporting.php';

		}


		/**
		 * Run action and filter hooks
		 *
		 * @access      private
		 * @return      void
		 *
		 *
		 * @since       0.1.0
		 */
		private function hooks() {

		}


		/**
		 * Internationalization
		 *
		 * @access      public
		 * @return      void
		 * @since       0.1.0
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
 * @return      \Holler_Box The one true Holler_Box
 *
 * @since       0.1.0
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
 * @return      void
 * @since       0.1.0
 */
function holler_box_activation() {
	/* Activation functions here */
}

register_activation_hook( __FILE__, 'holler_box_activation' );
