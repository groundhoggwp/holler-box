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
	 * @param $lead Holler_Lead
	 *
	 * @return false|mixed false if the provided integration is not registered
	 */
	public static function _do( $integration, $lead ) {

		// Setup the instance and init integrations
		if ( empty( self::$integrations ) ){
			self::instance();
		}

		$type = $integration['type'];

		if ( ! isset( self::$integrations[ $type ] ) ) {
			return false;
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
		self::register( 'user', [ $this, 'user' ] );

		do_action( 'hollerbox/register_integrations' );
	}

	/**
	 * Process the email integration time
	 *
	 * @param $props array
	 * @param $lead Holler_Lead
	 *
	 * @return bool|mixed|void
	 */
	public function email( $props, $lead ) {

		$props = wp_parse_args( $props, [
			'to'       => '',
			'from'     => '',
			'reply_to' => '',
			'bcc'      => '',
			'cc'       => '',
			'subject'  => '',
			'message'  => '',
		] );

		return wp_mail(
			$props['to'],
			$props['subject'],
			$props['message'],
			[
				// todo email headers
			]
		);

	}

	/**
	 * Process the groundhogg integration time
	 *
	 * @param $props array
	 * @param $lead Holler_Lead
	 *
	 * @return bool|mixed|void
	 */
	public function groundhogg( $props, $lead ){

		if ( ! defined( 'GROUNDHOGG_VERSION' ) ){
			return false;
		}

		$tags = wp_parse_id_list( $props['tags'] );

		$name = \Groundhogg\split_name( $lead->name );

		$contact = new \Groundhogg\Contact( $lead->email );

		if ( ! $contact->exists() ){
			$contact->create([
				'first_name' => $name[0]
			]);
		}

	}

}
