<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


class Holler_Licensing {

	const PRO_ITEM_ID = 132;
	const STORE_URL = 'https://hollerwp.com';

	public function __construct(){

		if ( self::$instance ){
			return;
		}

		add_action( 'rest_api_init', [ $this, 'init' ] );
	}

	public function init() {

		register_rest_route( 'hollerbox', 'licensing', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'activate' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
			[
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'deactivate' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
		] );

	}

	/**
	 * @since       0.1.0
	 * @var         Holler_Licensing $instance
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
			self::$instance = new Holler_Licensing();
		}

		return self::$instance;
	}

	/**
	 * Create an EDD updater for the pro version
	 *
	 * @param $file
	 * @param $version
	 *
	 * @return Holler_EDD_SL_Plugin_Updater
	 */
	public function edd_updater( $file, $version ){

		// EDD Stuff
		return new \Holler_EDD_SL_Plugin_Updater( self::STORE_URL, $file, [
			'version' => $version,
			'license' => Holler_Settings::instance()->get( 'license' ),
			'item_id' => $this->get_pro_item_id(),
			'url'     => home_url(),
			'author'  => 'Groundhogg Inc.'
		] );
	}

	/**
	 * Get the ID of the item to license in the store
	 *
	 * @return mixed|void
	 */
	public function get_pro_item_id(){
		return apply_filters( 'hollerbox/pro_item_id', self::PRO_ITEM_ID );
	}

	/**
	 * Get the error message for a given error.
	 *
	 * @param       $error
	 * @param false $expiry
	 *
	 * @return string
	 */
	protected function get_license_error_message( $error, $expiry = false ) {

		switch ( $error ) {
			case 'expired' :
				$message = sprintf(
					_x( 'Your license key expired on %s.', 'notice', 'groundhogg' ),
					date_i18n( get_option( 'date_format' ), strtotime( $expiry, current_time( 'timestamp' ) ) )
				);
				break;
			case 'invalid' :
			case 'disabled' :
				$message = _x( 'Your license key has been disabled.', 'notice', 'groundhogg' );
				break;
			case 'site_inactive' :
				$message = _x( 'Your license is not active for this URL.', 'notice', 'groundhogg' );
				break;
			case 'key_mismatch' :
			case 'invalid_item_id' :
			case 'item_name_mismatch' :
				$message = sprintf( _x( 'The extension you are licensing is unrecognized.', 'notice', 'groundhogg' ) );
				break;
			case 'missing_url' :
			case 'missing' :
				$message = sprintf( _x( 'This appears to be an invalid license key.', 'notice', 'groundhogg' ) );
				break;
			case 'no_activations_left':
				$message = _x( 'Your license key has reached its activation limit.', 'notice', 'groundhogg' );
				break;
			default :
				$message = _x( 'An error occurred, please try again.', 'notice', 'groundhogg' );
				break;
		}

		return $message;
	}

	/**
	 * Activate a new license key
	 *
	 * @return array|bool|WP_Error
	 */
	protected function _activate( $license ) {

		$existing_license = Holler_Settings::instance()->get( 'license' );

		// Exiting license is the same as is being added, return true
		if ( $existing_license && $license === $existing_license ) {
			return true;
		}

		// A new license is being activated, let's deactivate the old one
		if ( $existing_license ) {
			$res = $this->_deactivate();

			if ( is_wp_error( $res ) ) {
				return $res;
			}
		}

		$response = wp_remote_post( self::STORE_URL, [
			'body' => [
				'edd_action' => 'activate_license',
				'item_id'    => $this->get_pro_item_id(),
				'license'    => $license,
				'url'        => home_url(),
			]
		] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$license_data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( false === $license_data->success ) {
			$message = self::get_license_error_message( $license_data->error, $license_data->expires );

			return new WP_Error( $license_data->error, $message );
		}

		$expiry = $license_data->expires;

		Holler_Settings::instance()->update( 'license', $license );
		Holler_Settings::instance()->update( 'license_expiry', $expiry );
		Holler_Settings::instance()->update( 'is_licensed', true );

		return true;
	}

	/**
	 * Deactivate the current license key
	 *
	 * @return array|bool|WP_Error
	 */
	protected function _deactivate() {

		$existing_license = Holler_Settings::instance()->get( 'license' );

		if ( ! $existing_license ) {
			return true;
		}

		$response = wp_remote_post( self::STORE_URL, [
			'body' => [
				'edd_action' => 'deactivate_license',
				'item_id'    => $this->get_pro_item_id(),
				'license'    => $existing_license,
				'url'        => home_url(),
			]
		] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		Holler_Settings::instance()->update( 'is_licensed', false );
		Holler_Settings::instance()->update( 'license', '' );
		Holler_Settings::instance()->update( 'license_expiry', '' );

		return true;
	}

	/**
	 * Activate a license for the first time
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function activate( WP_REST_Request $request ) {

		$license = sanitize_text_field( $request->get_param( 'license' ) );

		$result = $this->_activate( $license );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( [
			'success'      => true,
			'license_data' => [
				'is_licensed'    => true,
				'license'        => Holler_Settings::instance()->get( 'license' ),
				'license_expiry' => Holler_Settings::instance()->get( 'license_expiry' ),
			]
		] );
	}

	/**
	 * Deactivate the current license
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return array|bool|WP_Error|WP_HTTP_Response|WP_REST_Response
	 */
	public function deactivate( WP_REST_Request $request ) {

		$result = $this->_deactivate();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( [
			'success' => true,
		] );
	}


	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

}
