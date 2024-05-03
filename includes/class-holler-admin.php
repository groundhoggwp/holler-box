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
		 * @return      self self::$instance The one true Holler_Admin
		 * @since       0.2.0
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
		 * @return      void
		 *
		 *
		 * @since       0.2.0
		 */
		private function hooks() {

			add_filter( 'replace_editor', [ $this, 'replace_editor' ], 10, 2 );
			add_action( 'admin_action_hollerbox_export', [ $this, 'export_popup' ] );
			add_action( 'admin_action_hollerbox_duplicate', [ $this, 'duplicate_popup' ] );

			add_action( 'admin_menu', [ $this, 'register_admin_pages' ] );
			add_action( 'init', [ $this, 'register_cpt' ] );
			add_filter( 'manage_hollerbox_posts_columns', [ $this, 'register_cpt_columns' ], 999 );
			add_action( 'manage_hollerbox_posts_custom_column', [ $this, 'do_cpt_columns' ], 10, 2 );
			add_filter( 'post_row_actions', [ $this, 'manage_cpt_row_actions' ], 10, 2 );

			add_action( 'admin_enqueue_scripts', [ $this, 'admin_scripts' ] );

			add_action( 'edit_user_profile', [ $this, 'admin_user' ] );
			add_action( 'show_user_profile', [ $this, 'admin_user' ] );
			add_action( 'wp_ajax_holler_clear_user_stats_cache', [ $this, 'ajax_clear_user_cache' ] );
		}

		const CLEAR_CACHE_NONCE = 'holler_clear_cache';
		const ADMIN_AJAX_NONCE = 'holler_admin_ajax';

		/**
		 * Helper function to verify nonces easily
		 *
		 * @param        $name
		 * @param string $action
		 *
		 * @return bool
		 */
		public function verify_nonce( $name, $action = '' ) {

			if ( ! $action ) {
				$action = $name;
			}

			return isset( $_REQUEST[ $name ] ) && wp_verify_nonce( $_REQUEST[ $name ], $action );
		}

		/**
		 * Wrapper for admin ajax nonce
		 *
		 * @return bool
		 */
		public function verify_admin_ajax_nonce() {
			return $this->verify_nonce( 'holler_admin_ajax_nonce', self::ADMIN_AJAX_NONCE );
		}

		/**
		 * Clear popup cache for all users
		 */
		public function ajax_clear_user_cache() {

			if ( ! current_user_can( 'edit_popups' ) ) {
				return;
			}

			if ( ! $this->verify_admin_ajax_nonce() ) {
				return;
			}

			global $wpdb;

			$wpdb->query( "DELETE FROM $wpdb->usermeta WHERE meta_key in ('hollerbox_popup_conversions','hollerbox_closed_popups');" );

			if ( wp_doing_ajax() ) {
				wp_send_json_success();
			}
		}

		/**
		 * Show options for clearing popup cache
		 *
		 * @param $user WP_User
		 */
		public function admin_user( $user ) {

			if ( ! current_user_can( 'edit_popups' ) ) {
				return;
			}

			if ( $this->verify_nonce( 'holler_clear_cache_single_user', self::CLEAR_CACHE_NONCE ) ) {
				delete_user_meta( $user->ID, 'hollerbox_closed_popups' );
				delete_user_meta( $user->ID, 'hollerbox_popup_conversions' );

				return;
			}

			$closed    = wp_parse_id_list( get_user_meta( $user->ID, 'hollerbox_closed_popups', true ) );
			$converted = wp_parse_id_list( get_user_meta( $user->ID, 'hollerbox_popup_conversions', true ) );

			if ( empty( $closed ) && empty( $converted ) ) {
				return;
			}

			$closed = array_map( function ( $id ) {
				$popup = new Holler_Popup( $id );

				return sprintf( '<a href="%s">%s</a>', get_edit_post_link( $popup->ID ), $popup->post_title );
			}, $closed );

			$converted = array_map( function ( $id ) {
				$popup = new Holler_Popup( $id );

				return sprintf( '<a href="%s">%s</a>', get_edit_post_link( $popup->ID ), $popup->post_title );
			}, $converted );

			?>
			<h2><?php _e( 'HollerBox' ) ?></h2>
			<table class="form-table">
				<tr>
					<th><?php _e( 'Closed popups', 'holler-box' ); ?></th>
					<td><?php echo implode( ', ', $closed ) ?></td>
				</tr>
				<tr>
					<th><?php _e( 'Converted popups', 'holler-box' ); ?></th>
					<td><?php echo implode( ', ', $converted ) ?></td>
				</tr>
			</table>
			<p>
				<a href="<?php echo esc_url( wp_nonce_url( $_SERVER['REQUEST_URI'], self::CLEAR_CACHE_NONCE, 'holler_clear_cache_single_user' ) ) ?>"
				   class="button button-secondary"><?php _e( 'Clear user cache' ); ?></a></p>
			<?php


		}

		public function admin_scripts( $hook ) {

			$dot_min = Holler_Settings::instance()->get( 'script_debug_mode' ) ? '' : '.min';

			wp_register_style( 'hollerbox-elements', Holler_Box_URL . 'assets/css/elements.css' );
			wp_register_style( 'baremetrics-calendar', Holler_Box_URL . 'assets/css/calendar.css' );
			wp_register_style( 'hollerbox-admin', Holler_Box_URL . 'assets/css/admin.css', [
				'hollerbox-elements',
				'baremetrics-calendar',
			] );

			wp_register_script( 'hollerbox-elements', Holler_Box_URL . 'assets/js/elements' . $dot_min . '.js', [
				'jquery',
				'wp-i18n',
			] );

			wp_register_script( 'baremetrics-calendar', Holler_Box_URL . 'assets/js/baremetrics-calendar' . $dot_min . '.js', [
				'moment'
			] );

			wp_register_script( 'hollerbox-morphdom', Holler_Box_URL . 'assets/js/lib/morphdom' . $dot_min . '.js', [], HOLLERBOX_VERSION );
			wp_register_script( 'hollerbox-make-el', Holler_Box_URL . 'assets/js/make-el' . $dot_min . '.js', [
				'hollerbox-morphdom'
			], HOLLERBOX_VERSION );

			wp_register_script( 'hollerbox-chart-js', Holler_Box_URL . 'assets/js/chart.min.js' );
			wp_register_script( 'hollerbox-reporting', Holler_Box_URL . 'assets/js/reports' . $dot_min . '.js', [
				'hollerbox-chart-js',
				'hollerbox-elements',
				'baremetrics-calendar',
				'hollerbox-make-el'
			] );

			wp_register_script( 'hollerbox-settings', Holler_Box_URL . 'assets/js/settings' . $dot_min . '.js', [
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
						'_wprest'    => wp_create_nonce( 'wp_rest' ),
						'_adminajax' => wp_create_nonce( 'holler_admin_ajax' )
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
							'legacy'       => defined( 'Holler_Box_Legacy_VER' ),
							'groundhogg'   => defined( 'GROUNDHOGG_VERSION' ),
							'mailhawk'     => defined( 'MAILHAWK_VERSION' ),
						],
						'nonces'      => [
							'_wprest'    => wp_create_nonce( 'wp_rest' ),
							'_adminajax' => wp_create_nonce( 'holler_admin_ajax' )
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

			$dot_min = Holler_Settings::instance()->get( 'script_debug_mode' ) ? '' : '.min';

			global $post;

			$groundhogg_installed = defined( 'GROUNDHOGG_VERSION' );

			if ( $groundhogg_installed && function_exists( 'Groundhogg\enqueue_filter_assets' ) ){
				\Groundhogg\enqueue_filter_assets();
			}

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

			wp_enqueue_style( 'hollerbox-popups', Holler_Box_URL . 'assets/css/popups.css', [], HOLLERBOX_VERSION );
			wp_enqueue_style( 'hollerbox-elements', Holler_Box_URL . 'assets/css/elements.css', [], HOLLERBOX_VERSION );
			wp_enqueue_style( 'hollerbox-builder', Holler_Box_URL . 'assets/css/popup-builder.css', [
				'wp-color-picker'
			], HOLLERBOX_VERSION );

			wp_register_script( 'hollerbox-morphdom', Holler_Box_URL . 'assets/js/lib/morphdom' . $dot_min . '.js', [], HOLLERBOX_VERSION );
			wp_register_script( 'hollerbox-make-el', Holler_Box_URL . 'assets/js/make-el' . $dot_min . '.js', [
				'hollerbox-morphdom'
			], HOLLERBOX_VERSION );
			wp_register_script( 'hollerbox-popups', Holler_Box_URL . 'assets/js/popups' . $dot_min . '.js', [], HOLLERBOX_VERSION );
			wp_register_script( 'hollerbox-builder', Holler_Box_URL . 'assets/js/popup-builder' . $dot_min . '.js', [
				'hollerbox-elements',
				'hollerbox-popups',
				'wp-color-picker',
				'hollerbox-make-el'
			], HOLLERBOX_VERSION );

			wp_enqueue_script( 'hollerbox-builder' );

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
					'library' => rest_url( 'hollerbox/library' ),
				],
				'nonces'              => [
					'_wprest'    => wp_create_nonce( 'wp_rest' ),
					'trash_post' => wp_create_nonce( 'trash-post_' . $popup->ID ),
					'export'     => wp_create_nonce( 'export' ),
					'duplicate'  => wp_create_nonce( 'duplicate' )
				],
				'installed'           => [
					'groundhogg' => $groundhogg_installed,
					'mailhawk'   => defined( 'MAILHAWK_VERSION' ),
				],
				'user'                => wp_get_current_user(),
				'assets'              => [
					'groundhogg_banner'   => Holler_Box_URL . 'assets/img/groundhogg-banner.png',
					'library_coming_soon' => Holler_Box_URL . 'assets/img/template-library-coming-soon.png',
					'root'                => Holler_Box_URL . 'assets',
				],
				'css_editor_settings' => $settings,
				'currentUser'         => $user,
				'settings'            => [
					'script_debug_mode' => Holler_Settings::instance()->get( 'script_debug_mode' )
				]
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
				'menu_icon'          => 'data:image/svg+xml;base64,' . base64_encode( self::HollerIcon() ),
				'supports'           => [ 'title', 'page-attributes', 'author' ],
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

		public static function HollerIcon( $props = [] ) {

			return '<svg height="20" width="20" viewBox="75.27 55.67 134.43 152.31" xmlns="http://www.w3.org/2000/svg">
  <path fill="black" d="M 144.47 165.97 L 126.46 155.57 L 126.46 148.31 L 144.47 158.71 Z M 126.46 162.76 L 144.47 173.16 L 144.47 180.42 L 126.46 170.02 Z M 98.66 101.809 L 98.8 101.89 L 144.36 128.2 L 189.92 101.89 L 190.06 101.809 L 144.36 75.428 Z M 193.66 103.887 L 193.66 108.38 L 202.21 103.45 L 202.21 165.92 L 144.36 199.32 L 108.64 178.7 L 98.04 187.35 L 98.04 172.58 L 84.02 164.49 L 84.02 115.62 L 76.53 111.3 L 76.53 168.81 L 90.55 176.91 L 90.55 203.14 L 109.37 187.77 L 144.36 207.98 L 209.7 170.25 L 209.7 90.47 L 190.06 101.809 Z M 193.66 108.38 L 144.36 136.85 L 95.06 108.38 L 95.06 161 L 144.36 189.46 L 193.66 161 Z M 95.06 103.887 L 98.66 101.809 L 90.25 96.96 L 146.73 64.35 L 189.65 89.73 L 197.09 85.43 L 146.78 55.67 L 75.27 96.96 L 95.06 108.38 Z" style=""/>
</svg>';
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
				return in_array( $colum, [ 'cb', 'title', 'author' ] );
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
					echo number_format_i18n( $popup->get_conversions( 365 ) );
					break;
				case 'impressions':
					echo number_format_i18n( $popup->get_impressions( 365 ) );
					break;
				case 'cvr':

					$impressions = $popup->get_impressions( 365 );
					$conversions = $popup->get_conversions( 365 );
					$cvr         = ceil( ( $conversions / ( $impressions ?: 1 ) ) * 100 );

					echo $cvr . '%';

					break;
			}

		}

		/**
		 * Export a popup
		 */
		public function export_popup() {

			if ( ! current_user_can( 'edit_popups' ) ) {
				wp_die( 'Insufficient permissions' );
			}

			if ( ! $this->verify_nonce( '_wpnonce', 'export' ) ) {
				wp_die( 'Invalid nonce' );
			}

			$popup = new Holler_Popup( absint( $_GET['popup'] ) );

			if ( ! $popup->exists() ) {
				wp_die( 'Popup does not exist' );
			}

			$filename = $popup->post_name . '.json';
			$content  = wp_json_encode( $popup );

			header( 'Content-Description: File Transfer' );
			header( 'Content-Type: application/json' );
			header( 'Content-Disposition: attachment; filename=' . $filename );

			$file = fopen( 'php://output', 'w' );
			fputs( $file, $content );
			fclose( $file );
			exit();

		}

		/**
		 * Duplicate a popup
		 */
		public function duplicate_popup() {
			if ( ! current_user_can( 'edit_popups' ) ) {
				wp_die( 'Insufficient permissions' );
			}

			if ( ! $this->verify_nonce( '_wpnonce', 'duplicate' ) ) {
				wp_die( 'Invalid nonce' );
			}

			$popup = new Holler_Popup( absint( $_GET['popup'] ) );

			if ( ! $popup->exists() ) {
				wp_die( 'Popup does not exist' );
			}

			$new = $popup->duplicate();

			wp_redirect( get_edit_post_link( $new->ID, 'redirect' ) );
			die();
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

			$actions['report'] = "<a href=\"{$url}\">{$text}</a>";

			$url  = esc_url( wp_nonce_url( admin_url( 'edit.php?post_type=hollerbox&action=hollerbox_export&popup=' . $post->ID ), 'export' ) );
			$text = __( 'Export' );

			$actions['export'] = "<a href=\"{$url}\">{$text}</a>";

			$url  = esc_url( wp_nonce_url( admin_url( 'edit.php?post_type=hollerbox&action=hollerbox_duplicate&popup=' . $post->ID ), 'duplicate' ) );
			$text = __( 'Duplicate' );

			$actions['duplicate'] = "<a href=\"{$url}\">{$text}</a>";

			$trash = $actions['trash'];
			unset( $actions['trash'] );
			$actions['trash'] = $trash;

			return $actions;
		}

	}

} // end class_exists check
