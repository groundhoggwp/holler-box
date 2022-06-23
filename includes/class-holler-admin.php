<?php
/**
 * Admin UI, register CPT and meta
 *
 * @since       0.1.0
 */


// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Holler_Admin' ) ) {

	/**
	 * Holler_Admin class
	 *
	 * @since       0.2.0
	 */
	class Holler_Admin extends Holler_Box {

		/**
		 * @since       0.2.0
		 * @var         Holler_Admin $instance The one true Holler_Admin
		 */
		private static $instance;
		public static $errorpath = '../php-error-log.php';
		// sample: error_log("meta: " . $meta . "\r\n",3,self::$errorpath);

		/**
		 * Get active instance
		 *
		 * @access      public
		 * @since       0.2.0
		 * @return      self self::$instance The one true Holler_Admin
		 */
		public static function instance() {
			if ( ! self::$instance ) {
				self::$instance = new Holler_Admin();
				self::$instance->hooks();
			}

			return self::$instance;
		}


		/**
		 * Run action and filter hooks
		 *
		 * @access      private
		 * @since       0.2.0
		 * @return      void
		 *
		 *
		 */
		private function hooks() {

			add_filter( 'replace_editor', [ $this, 'replace_editor' ], 10, 2 );
			add_action( 'load-post-new.php', [ $this, 'post_new' ] );
			add_action( 'load-post.php', [ $this, 'post' ] );

			add_action( 'admin_menu', array( $this, 'settings_page' ) );
			add_action( 'init', array( $this, 'register_cpt' ) );
		}

		/**
		 * Add settings
		 *
		 * @access      public
		 * @since       0.1
		 */
		public function settings_page() {

			add_submenu_page( 'edit.php?post_type=hollerbox', 'Holler Box Settings', 'Settings', 'manage_options', 'hollerbox', array(
				$this,
				'render_settings'
			) );

		}

		public function builder_scripts() {

			global $post;

			wp_enqueue_media();
			wp_enqueue_editor();

			$settings = wp_enqueue_code_editor( [
				'type'       => 'text/css',
				'codemirror' => [
					'indentUnit' => 2,
					'tabSize'    => 2,
					'lint'       => true,
				],
			] );

			wp_enqueue_script( 'csslint' );


			wp_enqueue_style( 'hollerbox-popups', Holler_Box_URL . 'assets/css/popups.css' );
			wp_enqueue_style( 'hollerbox-elements', Holler_Box_URL . 'assets/css/elements.css' );
			wp_enqueue_style( 'hollerbox-builder', Holler_Box_URL . 'assets/css/popup-builder.css', [
				'wp-color-picker'
			] );

			wp_register_script( 'hollerbox-elements', Holler_Box_URL . 'assets/js/elements.js', [
				'jquery'
			] );

			wp_register_script( 'hollerbox-popups', Holler_Box_URL . 'assets/js/popups.js' );
			wp_register_script( 'hollerbox-builder', Holler_Box_URL . 'assets/js/popup-builder.js', [
				'hollerbox-elements',
				'hollerbox-popups',
				'wp-i18n',
				'wp-color-picker',
			] );

			wp_enqueue_script( 'hollerbox-builder', Holler_Box_URL . 'assets/js/popup-builder.js' );

			$post_types = get_post_types( [], 'objects' );
			$post_types = array_filter( $post_types, function ( $pt ) {
				return $pt->public && $pt->name !== 'hollerbox';
			} );

			foreach ( $post_types as $post_type ) {
				$post_type->taxonomies = get_object_taxonomies( $post_type->name, 'objects' );
			}

			$popup = new Holler_Popup( $post );

			wp_localize_script( 'hollerbox-elements', 'HollerBox', [
				'gravatar'            => get_avatar_url( get_current_user_id() ),
				'post_types'          => $post_types,
				'popup'               => $popup,
				'home_url'            => home_url(),
				'admin_url'           => untrailingslashit( admin_url() ),
				'shortcode_regex'     => get_shortcode_regex(),
				'routes'              => [
					'root'    => rest_url( 'hollerbox' ),
					'options' => rest_url( 'hollerbox/options' ),
					'content' => rest_url( 'hollerbox/content' ),
					'popup'   => rest_url( 'hollerbox/popup' ),
				],
				'nonces'              => [
					'_wprest' => wp_create_nonce( 'wp_rest' )
				],
				'installed'           => [
					'groundhogg' => defined( 'GROUNDHOGG_VERSION' ),
					'mailhawk'   => defined( 'MAILHAWK_VERSION' ),
				],
				'user'                => wp_get_current_user(),
				'assets'              => [
					'groundhogg_banner' => Holler_Box_URL . 'assets/img/groundhogg-banner.png',
				],
				'css_editor_settings' => $settings
			] );

			do_action( 'hollerbox/admin/scripts' );
		}

		/**
		 * Replace post editor with custom one
		 *
		 * @param $bool
		 * @param $post
		 *
		 * @return string
		 */
		public function replace_editor( $bool, $post ) {

			if ( $post->post_type !== 'hollerbox' ) {
				return $bool;
			}

			return true;
		}

		/**
		 * Load the editor on the post-new.php page
		 */
		public function post_new() {
			$screen = get_current_screen();

			// Only show on edit/add screen
			if ( $screen->post_type !== 'hollerbox' ) {
				return;
			}

			$this->render_builder();
		}

		/**
		 * Load the editor on the post.php page
		 */
		public function post() {

			$screen = get_current_screen();

			// Only show on edit/add screen
			if ( $screen->post_type !== 'hollerbox' || $_GET['action'] !== 'edit' ) {
				return;
			}

			$this->render_builder();
		}

		/**
		 * @return bool|mixed
		 */
		public function render_builder() {

			add_filter( 'screen_options_show_screen', '__return_false' );
			add_action( 'in_admin_footer', [ $this, 'builder_scripts' ] );

			require_once ABSPATH . 'wp-admin/admin-header.php';

			?>
            <div id="holler-app"></div><?php
		}

		// Register holler box post type
		public function register_cpt() {

			$labels = array(
				'name'               => __( 'Holler Box', 'holler-box' ),
				'singular_name'      => __( 'Holler Box', 'holler-box' ),
				'menu_name'          => __( 'Holler Box', 'holler-box' ),
				'name_admin_bar'     => __( 'Holler Box', 'holler-box' ),
				'add_new'            => __( 'Add New', 'holler-box' ),
				'add_new_item'       => __( 'Add New Box', 'holler-box' ),
				'new_item'           => __( 'New Box', 'holler-box' ),
				'edit_item'          => __( 'Edit Box', 'holler-box' ),
				'view_item'          => __( 'View Box', 'holler-box' ),
				'all_items'          => __( 'All Boxes', 'holler-box' ),
				'search_items'       => __( 'Search Boxes', 'holler-box' ),
				'parent_item_colon'  => __( 'Parent Boxes:', 'holler-box' ),
				'not_found'          => __( 'No Boxes found.', 'holler-box' ),
				'not_found_in_trash' => __( 'No Boxes found in Trash.', 'holler-box' )
			);

			$args = array(
				'labels'               => $labels,
				'public'               => true,
				'publicly_queryable'   => true,
				'show_ui'              => true,
				'show_in_nav_menus'    => false,
				'show_in_menu'         => true,
				'show_in_rest'         => false,
				'query_var'            => true,
				// 'rewrite'           => array( 'slug' => 'hollerbox' ),
				'capability_type'      => 'post',
				'has_archive'          => true,
				'hierarchical'         => true,
				//'menu_position'     => 50,
				'menu_icon'            => 'dashicons-testimonial',
				'supports'             => array( 'title', 'editor' ),
				'show_in_customizer'   => false,
				'register_meta_box_cb' => array( $this, 'notification_meta_boxes' )
			);

			register_post_type( 'hollerbox', $args );
		}

	}

	$holler_admin = new Holler_Admin();
	$holler_admin->instance();

} // end class_exists check
