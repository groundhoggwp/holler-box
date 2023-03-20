<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


class Holler_Telemetry {

	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_endpoints' ] );
		add_action( 'init', [ $this, 'schedule_cron_events' ] );
		add_action( 'hollerbox/telemetry', [ $this, 'send_telemetry' ] );
	}

	/**
	 * Add the cron event
	 *
	 * @return void
	 */
	public function schedule_cron_events() {
		if ( ! wp_next_scheduled( 'hollerbox/telemetry' ) ) {
			wp_schedule_event( time(), 'weekly', 'hollerbox/telemetry' );
		}
	}

	/**
	 * Register any rest API endpoints for the telemetry
	 *
	 * @return void
	 */
	public function register_endpoints() {

		register_rest_route( 'hollerbox', '/telemetry', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'optin' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
		] );

		register_rest_route( 'hollerbox', '/telemetry/legacy', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'optin_legacy' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
		] );

	}

	/**
	 * Send telemetry weekly
	 *
	 * @return void
	 */
	public function send_telemetry() {

		// Opted out of telemetry
		if ( ! Holler_Settings::instance()->get( 'telemetry_subscribed' ) ) {
			return;
		}

		$request = [
			'email'       => Holler_Settings::instance()->get( 'telemetry_email' ),
			'date'        => current_time( 'mysql' ),
			'system_info' => [
				'php_version' => PHP_VERSION,
				'wp_version'  => get_bloginfo( 'version' ),
				'hb_version'  => HOLLERBOX_VERSION,
				'site_lang'   => get_bloginfo( 'language' ),
			],
			'usage'       => [
				'conversions' => Holler_Reporting::instance()->get_total_conversions_last_30(),
				'impressions' => Holler_Reporting::instance()->get_total_impressions_last_30()
			]
		];

		wp_remote_post( 'https://hollerwp.com/wp-json/gh/v3/webhook-listener?auth_token=JVq8f3u&step_id=36', [
			'body'    => wp_json_encode( $request ),
			'headers' => [
				'Content-Type' => 'application/json'
			],
		] );

	}

	/**
	 * Optin top telemetry
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function optin( WP_REST_Request $request ) {

		$telemetry = $request->get_param( 'telemetry_subscribed' ) ?: false;
		$marketing = $request->get_param( 'marketing_subscribed' ) ?: false;
		$email     = sanitize_email( $request->get_param( 'email' ) );

		$user = wp_get_current_user();
		$name = $user->display_name;

		if ( ! $email ) {
			$email = $user->user_email;
		}

		if ( ! empty( $user->first_name ) ) {
			$name = $user->first_name . ' ' . $user->last_name;
		}

		if ( ! $telemetry && ! $marketing ) {
			return rest_ensure_response( [ 'success' => true ] );
		}

		$request = [
			'email'     => $email,
			'name'      => $name,
			'role'      => sanitize_text_field( $request->get_param( 'role' ) ),
			'business'  => sanitize_text_field( $request->get_param( 'business' ) ),
			'marketing' => $marketing ? 'yes' : 'no',
			'telemetry' => $telemetry ? 'yes' : 'no'
		];

		if ( $telemetry ) {
			// Remember telemetry optin for later
			Holler_Settings::instance()->update( 'telemetry_subscribed', true );
			Holler_Settings::instance()->update( 'telemetry_email', $email );

			$request['system_info'] = [
				'php_version' => PHP_VERSION,
				'wp_version'  => get_bloginfo( 'version' ),
				'hb_version'  => HOLLERBOX_VERSION,
				'site_lang'   => get_bloginfo( 'language' ),
			];
		}

		wp_remote_post( 'https://hollerwp.com/wp-json/gh/v3/webhook-listener?auth_token=JVq8f3u&step_id=34', [
			'body'    => wp_json_encode( $request ),
			'headers' => [
				'Content-Type' => 'application/json'
			],
		] );

		return rest_ensure_response( [ 'success' => true ] );
	}

	/**
	 * Optin top telemetry
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function optin_legacy( WP_REST_Request $request ) {

		$email = sanitize_email( $request->get_param( 'email' ) );
		$name  = sanitize_text_field( $request->get_param( 'name' ) );

		$request = [
			'email'     => $email,
			'name'      => $name,
		];

		wp_remote_post( 'https://hollerwp.com/wp-json/gh/v3/webhook-listener?auth_token=NdZ6FeU&step_id=44', [
			'body'    => wp_json_encode( $request ),
			'headers' => [
				'Content-Type' => 'application/json'
			],
		] );

		return rest_ensure_response( [ 'success' => true ] );
	}

	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

}
