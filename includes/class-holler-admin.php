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
	class Holler_Admin {

		/**
		 * @since       0.2.0
		 * @var         Holler_Admin $instance The one true Holler_Admin
		 */
		private static $instance;

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
			}

			return self::$instance;
		}

		public function __construct() {
			$this->hooks();
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

			add_action( 'admin_menu', [ $this, 'register_admin_pages' ] );
			add_action( 'init', [ $this, 'register_cpt' ] );
			add_filter( 'manage_hollerbox_posts_columns', [ $this, 'register_cpt_columns' ], 999 );
			add_action( 'manage_hollerbox_posts_custom_column', [ $this, 'do_cpt_columns' ], 10, 2 );
			add_filter( 'post_row_actions', [ $this, 'manage_cpt_row_actions' ], 10, 2 );

			add_action( 'admin_enqueue_scripts', [ $this, 'admin_scripts' ] );
		}

		public function admin_scripts( $hook ) {

			wp_register_style( 'hollerbox-elements', Holler_Box_URL . 'assets/css/elements.css' );
			wp_register_style( 'baremetrics-calendar', Holler_Box_URL . 'assets/css/calendar.css' );
			wp_register_style( 'hollerbox-admin', Holler_Box_URL . 'assets/css/admin.css', [
				'hollerbox-elements',
				'baremetrics-calendar',
			] );
			wp_register_script( 'hollerbox-elements', Holler_Box_URL . 'assets/js/elements.js', [
				'jquery',
				'wp-i18n',
			] );
			wp_register_script( 'baremetrics-calendar', Holler_Box_URL . 'assets/js/baremetrics-calendar.js', [
				'moment'
			] );
			wp_register_script( 'hollerbox-chart-js', Holler_Box_URL . 'assets/js/chart.js' );
			wp_register_script( 'hollerbox-reporting', Holler_Box_URL . 'assets/js/reports.js', [
				'hollerbox-chart-js',
				'hollerbox-elements',
				'baremetrics-calendar'
			] );

			wp_register_script( 'hollerbox-settings', Holler_Box_URL . 'assets/js/settings.js', [
				'hollerbox-elements',
			] );

			if ( $hook === 'edit.php' && get_current_screen()->post_type === 'hollerbox' ) {
				wp_enqueue_style( 'hollerbox-admin' );
			}

			if ( $hook === 'hollerbox_page_hollerbox_reports' ) {
				wp_enqueue_style( 'hollerbox-admin' );
				wp_enqueue_script( 'hollerbox-reporting' );

				wp_localize_script( 'hollerbox-elements', 'HollerBox', [
					'admin_url' => untrailingslashit( admin_url() ),
					'routes'    => [
						'root'   => rest_url( 'hollerbox' ),
						'report' => rest_url( 'hollerbox/report' ),
					],
					'nonces'    => [
						'_wprest' => wp_create_nonce( 'wp_rest' )
					],
				] );
			}

			if ( $hook === 'hollerbox_page_hollerbox' ) {
				wp_enqueue_style( 'hollerbox-admin' );
				wp_enqueue_script( 'hollerbox-settings' );

				wp_enqueue_editor();

				wp_add_inline_script( 'hollerbox-elements', 'var HollerBox = ' . wp_json_encode( [
						'admin_url'   => untrailingslashit( admin_url() ),
						'currentUser' => wp_get_current_user(),
						'routes'      => [
							'root'      => rest_url( 'hollerbox' ),
							'settings'  => rest_url( 'hollerbox/settings' ),
							'licensing' => rest_url( 'hollerbox/licensing' ),
							'install'   => rest_url( 'hollerbox/install' ),
						],
						'installed'   => [
							'hollerBoxPro' => defined( 'Holler_Box_Pro_VER' ),
							'groundhogg'   => defined( 'GROUNDHOGG_VERSION' ),
							'mailhawk'     => defined( 'MAILHAWK_VERSION' ),
						],
						'nonces'      => [
							'_wprest' => wp_create_nonce( 'wp_rest' ),
						],
						'settings'    => get_option( 'hollerbox_settings', [
							'is_licensed' => false
						] )
					] ), 'before' );
			}

		}

		/**
		 * Add settings
		 *
		 * @access      public
		 * @since       0.1
		 */
		public function register_admin_pages() {
			add_submenu_page( 'edit.php?post_type=hollerbox', 'HollerBox Reports', 'Reports', 'manage_options', 'hollerbox_reports', [
				$this,
				'reports_page'
			] );

			add_submenu_page( 'edit.php?post_type=hollerbox', 'HollerBox Settings', 'Settings', 'manage_options', 'hollerbox', [
				$this,
				'settings_page'
			] );
		}

		/**
		 * Render the settigns page
		 *
		 * @return void
		 */
		public function settings_page() {
			?>
            <div id="holler-app"></div><?php
		}

		/**
		 * Render the settigns page
		 *
		 * @return void
		 */
		public function reports_page() {

			?>
            <div id="holler-app"></div><?php
		}

		/**
		 * Enqueue scripts for the popup editor
		 *
		 * @return void
		 */
		public function builder_scripts() {

			global $post;
			$groundhogg_installed = defined( 'GROUNDHOGG_VERSION' );

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

			wp_register_script( 'hollerbox-popups', Holler_Box_URL . 'assets/js/popups.js' );
			wp_register_script( 'hollerbox-builder', Holler_Box_URL . 'assets/js/popup-builder.js', [
				'hollerbox-elements',
				'hollerbox-popups',
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

			$user         = wp_get_current_user();
			$user->avatar = get_avatar_url( $user->user_email );

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
					'_wprest'    => wp_create_nonce( 'wp_rest' ),
					'trash_post' => wp_create_nonce( 'trash-post_' . $popup->ID )
				],
				'installed'           => [
					'groundhogg' => $groundhogg_installed,
					'mailhawk'   => defined( 'MAILHAWK_VERSION' ),
				],
				'user'                => wp_get_current_user(),
				'assets'              => [
					'groundhogg_banner' => Holler_Box_URL . 'assets/img/groundhogg-banner.png',
				],
				'css_editor_settings' => $settings,
				'currentUser'         => $user,
			] );

			if ( $groundhogg_installed ) {
				\Groundhogg\enqueue_filter_assets();
			}

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

			if ( did_action( 'load-post-new.php' ) || did_action( 'load-post.php' ) ) {
				$this->render_builder();
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
		 * Output HTML to for the builder
		 *
		 * @return void
		 */
		public function render_builder() {

			remove_all_actions( 'admin_notices' );

			add_filter( 'screen_options_show_screen', '__return_false' );
			add_action( 'in_admin_footer', [ $this, 'builder_scripts' ] );

			require_once ABSPATH . 'wp-admin/admin-header.php';

			?>
            <div id="holler-app"></div><?php
		}

		/**
		 * Reguister the HollerBox post type
		 *
		 * @return void
		 */
		public function register_cpt() {

			global $wp_post_types;

			$labels = array(
				'name'               => __( 'HollerBox', 'holler-box' ),
				'singular_name'      => __( 'Popup', 'holler-box' ),
				'menu_name'          => __( 'HollerBox', 'holler-box' ),
				'name_admin_bar'     => __( 'HollerBox', 'holler-box' ),
				'add_new'            => __( 'Add New', 'holler-box' ),
				'add_new_item'       => __( 'Add New Popup', 'holler-box' ),
				'new_item'           => __( 'New Popup', 'holler-box' ),
				'edit_item'          => __( 'Edit Popup', 'holler-box' ),
				'view_item'          => __( 'View Popup', 'holler-box' ),
				'all_items'          => __( 'All Popups', 'holler-box' ),
				'search_items'       => __( 'Search Popups', 'holler-box' ),
				'parent_item_colon'  => __( 'Parent Popups:', 'holler-box' ),
				'not_found'          => __( 'No Popups found.', 'holler-box' ),
				'not_found_in_trash' => __( 'No Popups found in trash.', 'holler-box' )
			);

			$args = [
				'labels'             => $labels,
				'public'             => false,
				'show_ui'            => true,
				'show_in_nav_menus'  => false,
				'show_in_menu'       => true,
				'show_in_rest'       => false,
				'query_var'          => true,
				'capability_type'    => [ 'popup', 'popups' ],
				'map_meta_cap'       => true,
				'has_archive'        => false,
				'hierarchical'       => false,
				'menu_icon'          => 'dashicons-testimonial',
				'supports'           => [ 'title' ],
				'show_in_customizer' => false,
			];

			register_post_type( 'hollerbox', $args );

			// get the generated caps
			$caps = array_values( (array) get_post_type_object( 'hollerbox' )->cap );

			$role = get_role( 'administrator' );

			// If admin does nto have permission
			if ( ! $role->has_cap( $caps[0] ) ) {

				// Add all the caps
				foreach ( $caps as $cap ) {
					$role->add_cap( $cap );
				}
			}
		}

		/**
		 * Register custom columns for HollerBox
		 *
		 * @param $columns array
		 *
		 * @return array
		 */
		public function register_cpt_columns( $columns ) {

			$columns = array_filter( $columns, function ( $colum ) {
				return in_array( $colum, [ 'cb', 'title' ] );
			}, ARRAY_FILTER_USE_KEY );

			$columns['impressions'] = __( 'Impressions' );
			$columns['conversions'] = __( 'Conversions' );
			$columns['cvr']         = __( 'CVR' );
			$columns['date']        = __( 'Date' );

			return $columns;
		}

		/**
		 * Do custom columns
		 *
		 * @param $column  string
		 * @param $post_id int
		 *
		 * @return void
		 */
		public function do_cpt_columns( $column, $post_id ) {

			$popup = new Holler_Popup( $post_id );

			switch ( $column ) {
				case 'conversions':
					echo number_format_i18n( $popup->get_conversions() );
					break;
				case 'impressions':
					echo number_format_i18n( $popup->get_impressions() );
					break;
				case 'cvr':

					$impressions = $popup->get_impressions();
					$conversions = $popup->get_conversions();
					$cvr         = ceil( ( $conversions / ( $impressions ?: 1 ) ) * 100 );

					echo $cvr . '%';

					break;
			}

		}

		/**
		 * Filter the row actions
		 *
		 * @param $actions array
		 * @param $post    WP_Post
		 *
		 * @return array
		 */
		public function manage_cpt_row_actions( $actions, $post ) {
			$post_type = get_post_type( $post );

			if ( $post_type !== 'hollerbox' ) {
				return $actions;
			}

			// remove unwanted actions
			$actions = array_filter( $actions, function ( $action ) {
				return ! in_array( $action, [ 'view' ] );
			}, ARRAY_FILTER_USE_KEY );

			$url  = esc_url( admin_url( 'edit.php?post_type=hollerbox&page=hollerbox_reports#/popup/' . $post->ID ) );
			$text = __( 'Report' );

			$actions['report'] = "<a href=\"${url}\">{$text}</a>";

			return $actions;
		}

	}

} // end class_exists check
