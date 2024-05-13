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
	 * @param $integration  array
	 * @param $lead         Holler_Lead
	 * @param $popup        Holler_Popup
	 *
	 * @return true|WP_Error false if the provided integration is not registered
	 */
	public static function _do( $integration, $lead, $popup ) {

		// Setup the instance and init integrations
		if ( empty( self::$integrations ) ) {
			self::instance();
		}

		$type = $integration['type'];

		if ( ! isset( self::$integrations[ $type ] ) ) {
			return new WP_Error( 'unknown_integration', 'Unknown integration type ' . $type );
		}

		/**
		 * Action before the integration
		 *
		 * @param $lead Holler_Lead
		 * @param $popup Holler_Popup
		 */
		do_action( "hollerbox/integrations/$type/before", $lead, $popup );

		// Do the integration
		$result = call_user_func( self::$integrations[ $type ], $integration, $lead, $popup );

		/**
		 * Action after the integration
		 *
		 * @param $lead Holler_Lead
		 * @param $popup Holler_Popup
		 */
		do_action( "hollerbox/integrations/$type/after", $lead, $popup );

		return $result;
	}

	/**
	 * Register the basic integration types
	 */
	public function init() {

		self::register( 'email', [ $this, 'email' ] );
		self::register( 'groundhogg', [ $this, 'groundhogg' ] );
		self::register( 'webhook', [ $this, 'webhook' ] );
		self::register( 'zapier', [ $this, 'zapier' ] );

		do_action( 'hollerbox/register_integrations' );
	}

	/**
	 * @var WP_Error
	 */
	protected $wp_mail_error;

	/**
	 * Catch email failed error
	 *
	 * @param $wp_error
	 *
	 * @return void
	 */
	public function catch_mail_failed( $wp_error ) {
		$this->wp_mail_error = $wp_error;
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

		$replacements = [
			'{{email}}'      => $lead->email,
			'{{name}}'       => $lead->name,
			'{{full_name}}'  => $lead->name,
			'{{first_name}}' => $lead->first_name,
			'{{last_name}}'  => $lead->last_name,
			'{{phone}}'      => $lead->phone,
			'{{location}}'   => $lead->location,
			'{{referrer}}'   => $lead->referrer,
			'{{ip_address}}' => $lead->get_ip(),
			'{{message}}'    => $lead->get_message_formatted(),
		];

		/**
		 * Add additional replacements
		 *
		 * @param $replacements array
		 * @param $props array
		 * @param $lead Holler_Lead
		 */
		$replacements = apply_filters( 'hollerbox/integrations/email/replacements', $replacements, $props, $lead );

		$message = wp_kses_post( $props['content'] );
		$message = str_replace( array_keys( $replacements ), array_values( $replacements ), $message );

		$subject = sanitize_text_field( $props['subject'] );
		$subject = str_replace( array_keys( $replacements ), array_values( $replacements ), $subject );

		$headers = [
			'Content-Type: text/html',
		];

		$reply_to = str_replace( '{{email}}', $lead->email, $props['reply_to'] );

		if ( is_email( $reply_to ) ) {
			$headers[] = sprintf( 'Reply-to: %s', $reply_to );
		}

		if ( is_email( $props['from'] ) ) {
			$headers[] = sprintf( 'From: %s', $props['from'] );
		}

		add_action( 'wp_mail_failed', [ $this, 'catch_mail_failed' ] );

		$result = wp_mail(
			$to,
			$subject,
			$message,
			$headers
		);

		remove_action( 'wp_mail_failed', [ $this, 'catch_mail_failed' ] );

		return $result ?: $this->wp_mail_error;
	}

	/**
	 * Process the webhook integration
	 *
	 * @param $props  array
	 * @param $lead   Holler_Lead
	 * @param $popup  Holler_Popup
	 *
	 * @return bool|mixed|void
	 */
	public function webhook( $props, $lead, $popup ) {

		$props = wp_parse_args( $props, [
			'url'     => '',
			'method'  => 'post',
			'payload' => 'json',
		] );

		$headers = [];

		$body = [
			'full_name'    => $lead->get_name(),
			'first_name'   => $lead->get_first_name(),
			'last_name'    => $lead->get_last_name(),
			'phone'        => $lead->get_phone(),
			'email'        => $lead->get_email(),
			'ip4'          => $lead->get_ip(),
			'gdpr_consent' => $lead->gdpr_consent,
		];

		if ( $lead->message ) {
			$body['message'] = $lead->message;
		}

		/**
		 * Filter the outgoing webhook body
		 *
		 * @param $body   array
		 * @param $props  array
		 * @param $lead   Holler_Lead
		 * @param $popup  Holler_Popup
		 */
		$body = apply_filters( 'hollerbox/integrations/webhook/body', $body, $props, $lead, $popup );

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

		$response = wp_remote_request( $props['url'], [
			'method'      => strtoupper( $props['method'] ),
			'body'        => $body,
			'headers'     => $headers,
			'data_format' => 'body',
			'sslverify'   => is_ssl(),
			'user-agent'  => 'HollerBox/' . HOLLERBOX_VERSION . '; ' . home_url()
		] );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return true;
	}

	/**
	 * Process the Zapier integration
	 *
	 * @param $props array
	 * @param $lead  Holler_Lead
	 * @param $popup Holler_Popup
	 *
	 * @return bool|mixed|void
	 */
	public function zapier( $props, $lead, $popup ) {

		$props = wp_parse_args( $props, [
			'url' => '',
		] );

		$props['method']  = 'POST';
		$props['payload'] = 'json';

		return $this->webhook( $props, $lead, $popup );
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

		// Gave consent
		if ( $lead->gdpr_consent ) {
			$contact->set_marketing_consent();
			$contact->set_gdpr_consent();
			$contact->set_terms_agreement();
		}

		if ( $lead->message ) {
			$contact->update_meta( 'hollerbox_chat_message', $lead->message );
		}

		if ( $lead->phone ) {
			$contact->update_meta( 'primary_phone', $lead->phone );
		}

		\Groundhogg\after_form_submit_handler( $contact );

		$contact->update_meta( 'source_page', $lead->location );

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

