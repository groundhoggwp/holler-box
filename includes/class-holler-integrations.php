<?php

class Holler_Integrations {

	public static $instance;

	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new Holler_Integrations();
		}

		return self::$instance;
	}

	public function __construct() {
		if ( empty( self::$integrations ) ) {
			$this->init();
		}
	}

	/**
	 * Registry of callbacks for specific integrations
	 *
	 * @var callable[]
	 */
	private static $integrations = [];

	/**
	 * Register an integration handler
	 *
	 * @param $id       string
	 * @param $callback callable
	 */
	public static function register( $id, $callback ) {

		if ( ! is_callable( $callback ) ) {
			return;
		}

		self::$integrations[ $id ] = $callback;
	}

	/**
	 * Do an integration
	 *
	 * @param $integration array
	 * @param $lead        Holler_Lead
	 *
	 * @return false|mixed false if the provided integration is not registered
	 */
	public static function _do( $integration, $lead ) {

		// Setup the instance and init integrations
		if ( empty( self::$integrations ) ) {
			self::instance();
		}

		$type = $integration['type'];

		if ( ! isset( self::$integrations[ $type ] ) ) {
			return 'Unknown integration ' . $type;
		}

		return call_user_func( self::$integrations[ $type ], $integration, $lead );
	}

	/**
	 * Register the basic integration types
	 */
	public function init() {

		self::register( 'email', [ $this, 'email' ] );
		self::register( 'groundhogg', [ $this, 'groundhogg' ] );
		self::register( 'webhook', [ $this, 'webhook' ] );
//		self::register( 'user', [ $this, 'user' ] );

		do_action( 'hollerbox/register_integrations' );
	}

	/**
	 * Process the email integration
	 *
	 * @param $props array
	 * @param $lead  Holler_Lead
	 *
	 * @return bool|mixed|void
	 */
	public function email( $props, $lead ) {

		$props = wp_parse_args( $props, [
			'to'       => [],
			'from'     => '',
			'reply_to' => '',
			'subject'  => '',
			'content'  => '',
		] );

		$to = array_map( function ( $email ) use ( $lead ) {
			return $email === '{{email}}' ? $lead->get_email() : $email;
		}, $props['to'] );

		$to = array_filter( $to, function ( $email ) {
			return is_email( $email );
		} );

		$message = wp_kses_post( $props['content'] );
		$subject = sanitize_text_field( $props['subject'] );

		$headers = [
			'Content-Type: text/html',
		];

		if ( is_email( $props['reply_to'] ) ) {
			$headers[] = sprintf( 'Reply-to: %s', $props['reply_to'] );
		}

		if ( is_email( $props['from'] ) ) {
			$headers[] = sprintf( 'From: %s', $props['from'] );
		}

		return wp_mail(
			$to,
			$subject,
			$message,
			$headers
		);

	}

	/**
	 * Process the webhook integration
	 *
	 * @param $props array
	 * @param $lead  Holler_Lead
	 *
	 * @return bool|mixed|void
	 */
	public function webhook( $props, $lead ) {

		$props = wp_parse_args( $props, [
			'url'     => '',
			'method'  => 'post',
			'payload' => 'json',
		] );

		$headers = [];

		$body = [
			'full_name'  => $lead->get_name(),
			'first_name' => $lead->get_first_name(),
			'last_name'  => $lead->get_last_name(),
			'email'      => $lead->get_email(),
			'ip4'        => $lead->get_ip(),
		];

		if ( $props['method'] === 'get' ) {
			return wp_remote_get( add_query_arg( $body, $props['url'] ), [
				'sslverify'  => is_ssl(),
				'user-agent' => 'HollerBox/' . HOLLERBOX_VERSION . '; ' . home_url()
			] );
		}

		if ( $props['payload'] === 'json' ) {
			$body                    = wp_json_encode( $body );
			$headers['Content-type'] = sprintf( 'application/json; charset=%s', get_bloginfo( 'charset' ) );
		}

		return wp_remote_request( $props['url'], [
			'method'      => strtoupper( $props['method'] ),
			'body'        => $body,
			'headers'     => $headers,
			'data_format' => 'body',
			'sslverify'   => is_ssl(),
			'user-agent'  => 'HollerBox/' . HOLLERBOX_VERSION . '; ' . home_url()
		] );
	}

	/**
	 * Process the Zapier integration
	 *
	 * @param $props array
	 * @param $lead  Holler_Lead
	 *
	 * @return bool|mixed|void
	 */
	public function zapier( $props, $lead ) {

		$props = wp_parse_args( $props, [
			'url' => '',
		] );

		$body = [
			'full_name'  => $lead->get_name(),
			'first_name' => $lead->get_first_name(),
			'last_name'  => $lead->get_last_name(),
			'email'      => $lead->get_email(),
			'ip4'        => $lead->get_ip(),
		];

		$headers                 = [];
		$body                    = wp_json_encode( $body );
		$headers['Content-type'] = sprintf( 'application/json; charset=%s', get_bloginfo( 'charset' ) );

		return wp_remote_post( $props['url'], [
			'body'        => $body,
			'headers'     => $headers,
			'data_format' => 'body',
			'sslverify'   => is_ssl(),
			'user-agent'  => 'HollerBox/' . HOLLERBOX_VERSION . '; ' . home_url()
		] );
	}

	/**
	 * Process the groundhogg integration
	 *
	 * @param $props array
	 * @param $lead  Holler_Lead
	 *
	 * @return bool|mixed|void
	 */
	public function groundhogg( $props, $lead ) {

		if ( ! defined( 'GROUNDHOGG_VERSION' ) ) {
			return false;
		}

		$contact = new \Groundhogg\Contact( $lead->email );

		if ( ! $contact->exists() ) {
			$contact->create( [
				'first_name' => $lead->first_name,
				'last_name'  => $lead->last_name,
				'email'      => $lead->email,
			] );
		} else {
			$contact->update( array_filter( [
				'first_name' => $lead->first_name,
				'last_name'  => $lead->last_name,
			] ) );
		}

		$contact->add_tag( map_deep( $props['tags'], 'sanitize_text_field' ) );

		\Groundhogg\after_form_submit_handler( $contact );

		return true;
	}

	/**
	 * Create a new user integration
	 *
	 * @param $props
	 * @param $lead
	 *
	 * @return bool
	 */
	public function user( $props, $lead ) {

		$props = wp_parse_args( $props, [
			'role'   => 'subscriber',
			'format' => 'email',
			'login'  => false
		] );

		$email_address = $lead->get_email();

		$password = wp_generate_password();

		$role = $props['role'];

		// Email already exists...
		if ( email_exists( $email_address ) ) {
			return false;
		}

		switch ( $props['format'] ) {
			default:
			case 'email_address':
				$username = $lead->get_email();
				break;
			case 'first_last':
				$username = strtolower( sprintf( "%s_%s", $lead->get_first_name(), $lead->get_last_name() ) );
				break;
			case 'last_first':
				$username = strtolower( sprintf( "%s_%s", $lead->get_last_name(), $lead->get_first_name() ) );
				break;
		}

		// More or less guaranteed unique at this point.
		$username = $this->generate_unique_username( $username );

		$user_id = wp_create_user( $username, $password, $email_address );
		$user    = new \WP_User( $user_id );
		$user->set_role( $role );

		$user->first_name = $lead->get_first_name();
		$user->last_name  = $lead->get_last_name();

		wp_update_user( $user );

		wp_new_user_notification( $user_id, null, 'user' );

		return true;

	}

	/**
	 * Ensure a username is unique by checking if it is already taken, and if it is adding a unique string after it.
	 *
	 * @param string $username
	 * @param bool   $known_exists to avoid double-checking the same username during every recursion
	 *
	 * @return string
	 */
	private function generate_unique_username( $username, $known_exists = false ) {

		$username = sanitize_user( $username );

		if ( ! $known_exists && ! username_exists( $username ) ) {
			return $username;
		}

		$new_username = uniqid( $username . '_' );

		if ( ! username_exists( $new_username ) ) {
			return $new_username;
		} else {
			return $this->generate_unique_username( $username, true );
		}
	}

}

