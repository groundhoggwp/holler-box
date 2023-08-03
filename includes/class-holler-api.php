<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


class Holler_Api {

	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'init' ] );
	}

	public function init() {

		register_rest_route( 'hollerbox', 'popup/(?P<popup_id>\d+)', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'read' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'update' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
			[
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'delete' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
		] );

		register_rest_route( 'hollerbox', 'submit/(?P<popup_id>\d+)', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'submit' ],
				'permission_callback' => '__return_true'
			]
		] );

		register_rest_route( 'hollerbox', '/report', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'read_report' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			]
		] );

		register_rest_route( 'hollerbox', 'options', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'read_options' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			]
		] );

		register_rest_route( 'hollerbox', 'closed', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'track_popup_closed' ],
				'permission_callback' => 'is_user_logged_in'
			]
		] );

		register_rest_route( 'hollerbox', 'conversion', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'track_conversion' ],
				'permission_callback' => '__return_true'
			]
		] );

		register_rest_route( 'hollerbox', 'impression', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'track_impression' ],
				'permission_callback' => '__return_true'
			]
		] );

		register_rest_route( 'hollerbox', 'install', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'install_plugin' ],
				'permission_callback' => [ $this, 'plugins_permission_callback' ]
			]
		] );

		register_rest_route( 'hollerbox', 'settings', [
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'update_settings' ],
				'permission_callback' => [ $this, 'options_permission_callback' ]
			]
		] );

		register_rest_route( 'hollerbox', 'library', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'library' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			]
		] );
	}

	/**
	 * Do library stuff
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function library(){

		$response = wp_remote_get( 'https://library.groundhogg.io/wp-json/hollerbox/list/' );

		if ( is_wp_error( $response ) ){
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		$json = json_decode( $body );

		return rest_ensure_response( $json );
	}

	/**
	 * Get all report data for specific time rage
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response
	 */
	public function read_report( WP_REST_Request $request ) {

		$fallback = new DateTime( '30 days ago', wp_timezone() );

		$before = sanitize_text_field( $request->get_param( 'before' ) ?: current_time( 'Y-m-d' ) );
		$after  = sanitize_text_field( $request->get_param( 'after' ) ?: $fallback->format( 'Y-m-d' ) );

		$data = Holler_Reporting::instance()->get_report_data( [
			'before' => $before,
			'after'  => $after
		] );

		$popups = array_unique( wp_parse_id_list( wp_list_pluck( $data, 'popup_id' ) ) );
		$popups = array_map( function ( $id ) {
			return new Holler_Popup( $id );
		}, $popups );

		return rest_ensure_response( [
			'data'   => $data,
			'popups' => array_values( $popups ),
		] );
	}

	/**
	 * When a popup is closed
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response
	 */
	public function track_popup_closed( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		if ( ! is_user_logged_in() ){
			return self::ERROR_401();
		}

		$closed_popups   = wp_parse_id_list( get_user_meta( get_current_user_id(), 'hollerbox_closed_popups', true ) );
		$closed_popups[] = $popup->ID;
		update_user_meta( get_current_user_id(), 'hollerbox_closed_popups', implode( ',', array_unique( $closed_popups ) ) );

		return rest_ensure_response( [
			'success' => true
		] );
	}

	/**
	 * Track a popup conversion
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response
	 */
	public function track_conversion( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		// Parse the location
		$location = parse_url( sanitize_text_field( $request->get_param( 'location' ) ), PHP_URL_PATH );
		$content  = sanitize_text_field( $request->get_param( 'content' ) );

		Holler_Reporting::instance()->add_conversion( $popup, $location, $content );

		if ( is_user_logged_in() ) {
			$conversions   = wp_parse_id_list( get_user_meta( get_current_user_id(), 'hollerbox_popup_conversions', true ) );
			$conversions[] = $popup->ID;
			update_user_meta( get_current_user_id(), 'hollerbox_popup_conversions', implode( ',', array_unique( $conversions ) ) );
		}

		return rest_ensure_response( [
			'success' => true
		] );
	}

	/**
	 * Track an impression
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response
	 */
	public function track_impression( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		// Parse the location
		$location = parse_url( sanitize_text_field( $request->get_param( 'location' ) ), PHP_URL_PATH );

		Holler_Reporting::instance()->add_impression( $popup, $location );

		return rest_ensure_response( [
			'success' => true
		] );
	}

	/**
	 * Standard 404 message
	 *
	 * @return WP_Error
	 */
	public static function ERROR_404() {
		return new WP_Error( 'missing', 'Popup not found.', [ 'status' => 404 ] );
	}

	/**
	 * Standard 401 message
	 *
	 * @return WP_Error
	 */
	public static function ERROR_401() {
		return new WP_Error( 'access_denied', 'Insufficient permissions.', [ 'status' => 401 ] );
	}

	/**
	 * Install either MailHawk or Groundhogg remotely
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool|void|WP_Error
	 */
	public function install_plugin( WP_REST_Request $request ) {

		$slug = sanitize_text_field( $request->get_param( 'slug' ) );

		if ( ! in_array( $slug, [ 'groundhogg', 'mailhawk' ] ) ) {
			return new WP_Error( 'invalid_slug', 'Not a valid slug.', [ 'status' => 401 ] );
		}

		$installed = $this->_install_plugin( $slug );

		if ( is_wp_error( $installed ) ) {
			return $installed;
		}

		if ( ! $installed ) {
			return new WP_Error( 'not_installed', 'Unable to install.', [ 'status' => 500 ] );
		}

		$response = [];

		switch ( $slug ) {
			case 'mailhawk':

				if ( ! defined( 'MAILHAWK_VERSION' ) ) {
					return new WP_Error( 'mailhawk_missing', 'Unable to find MailHawk.', [ 'status' => 500 ] );
				}

				$response = [
					'partner_id'   => '', // todo change this
					'register_url' => esc_url( trailingslashit( MAILHAWK_LICENSE_SERVER_URL ) ),
					'redirect_uri' => \MailHawk\get_admin_mailhawk_uri(),
					'client_state' => esc_attr( \MailHawk\Keys::instance()->state() ),
				];

				break;
			case 'groundhogg':
				$response = [];
				break;
		}


		return rest_ensure_response( wp_parse_args( $response, [
			'success' => true
		] ) );

	}

	/**
	 * Pre-process the post content
	 *
	 * @param $slug string
	 *
	 * @return WP_Error|bool
	 */
	public function _install_plugin( $slug ) {

		include_once ABSPATH . 'wp-admin/includes/plugin.php';

		foreach ( get_plugins() as $path => $details ) {

			if ( false === strpos( $path, sprintf( '/%s.php', $slug ) ) ) {
				continue;
			}

			$activate = activate_plugin( $path );

			if ( is_wp_error( $activate ) ) {
				return $activate;
			}

			return true;
		}

		include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		include_once ABSPATH . 'wp-admin/includes/file.php';
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Use the WordPress Plugins API to get the plugin download link.
		$api = plugins_api(
			'plugin_information',
			array(
				'slug' => $slug,
			)
		);

		if ( is_wp_error( $api ) ) {
			return $api;
		}

		// Use the AJAX upgrader skin to quietly install the plugin.
		$upgrader = new \Plugin_Upgrader( new \WP_Ajax_Upgrader_Skin() );
		$install  = $upgrader->install( $api->download_link );

		if ( is_wp_error( $install ) ) {
			return $install;
		}

		$activate = activate_plugin( $upgrader->plugin_info() );

		if ( is_wp_error( $activate ) ) {
			return $activate;
		}

		return true;
	}

	/**
	 * Submit a form for a specific popup
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function submit( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		$lead = new Holler_Lead( $request );

		$response = $popup->submit( $lead );

		if ( is_wp_error( $response ) ) {
			return rest_ensure_response( $response );
		}

		if ( $response['status'] === 'success' ) {
			$this->track_conversion( $request );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Update a popup with some specific settings
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		return rest_ensure_response( $popup );
	}

	/**
	 * Update a popup with some specific settings
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		$new_settings = $request->get_json_params();

		$result = $popup->update( $new_settings );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $popup );
	}

	/**
	 * Delete a popup
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function delete( WP_REST_Request $request ) {
		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		$popup->delete();

		return rest_ensure_response( [ 'success' => true ] );
	}

	/**
	 * Delete a popup
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function update_settings( WP_REST_Request $request ) {
		$settings = $request->get_param( 'settings' );

		foreach ( $settings as $option_name => $option_value ) {
			Holler_Settings::instance()->update( $option_name, $option_value, false );
		}

		Holler_Settings::instance()->commit();

		return rest_ensure_response( [ 'success' => true ] );
	}

	/**
	 * Get options for the display condition pickers
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response
	 */
	public function read_options( WP_REST_Request $request ) {

		$search  = $request->get_param( 'search' );
		$options = [];

		if ( $post_type = $request->get_param( 'post_type' ) ) {

			$posts = get_posts( [
				'numberposts' => 30,
				'post_type'   => $post_type,
				's'           => $search,
			] );

			$options = array_map( function ( $post ) {
				return [ 'id' => $post->ID, 'text' => $post->post_title ];
			}, $posts );
		}

		if ( $taxonomy = $request->get_param( 'taxonomy' ) ) {

			$terms = get_terms( [
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'search'     => $search,
				'number'     => 30
			] );

			$options = array_map( function ( $term ) {
				return [ 'id' => $term->term_id, 'text' => $term->name ];
			}, $terms );
		}

		return rest_ensure_response( $options );

	}

	public function permission_callback() {
		return current_user_can( 'edit_popups' );
	}

	public function options_permission_callback() {
		return current_user_can( 'manage_options' );
	}

	public function plugins_permission_callback() {
		return current_user_can( 'install_plugins' );
	}

}
