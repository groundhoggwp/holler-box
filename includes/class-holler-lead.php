<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Holler_Lead {

	public $email = '';
	public $name = '';
	public $first_name = '';
	public $last_name = '';
	public $phone = '';
	public $location = '';
	public $referrer = '';
	public $message = '';
	public $gdpr_consent = false;
	public $request = null;

	public function __construct( WP_REST_Request $request ) {

		$this->name = sanitize_text_field( $request->get_param( 'name' ) );

		$parts            = explode( ' ', $this->name );
		$this->first_name = trim( $parts[0] );

		if ( isset( $parts[1] ) ) {
			$this->last_name = trim( $parts[1] );
		}

		$this->email        = sanitize_email( strtolower( $request->get_param( 'email' ) ) );

		if ( is_user_logged_in() ){

			$user = wp_get_current_user();

			if ( ! $this->email ){
				$this->email = $user->user_email;
			}

			if ( ! $this->first_name ){
				$this->first_name = $user->first_name;
			}

			if ( ! $this->last_name ){
				$this->last_name = $user->last_name;
			}
		}

		if ( defined( 'GROUNDHOGG_VERSION' ) && \Groundhogg\is_a_contact( \Groundhogg\get_current_contact() ) ){

			$contact = \Groundhogg\get_current_contact();

			if ( ! $this->email ){
				$this->email = $contact->get_email();
			}

			if ( ! $this->first_name ){
				$this->first_name = $contact->get_first_name();
			}

			if ( ! $this->last_name ){
				$this->last_name = $contact->get_last_name();
			}
		}

		$this->phone        = sanitize_text_field( $request->get_param( 'phone' ) );
		$this->location     = sanitize_text_field( $request->get_param( 'location' ) );
		$this->referrer     = sanitize_text_field( $request->get_param( 'referer' ) );
		$this->gdpr_consent = $request->get_param( 'gdpr_consent' ) === 'yes';
		$this->message      = sanitize_textarea_field( $request->get_param( 'message' ) );
		$this->request      = $request;
	}

	/**
	 * Get the lead's email address
	 *
	 * @return string
	 */
	public function get_email() {
		return $this->email;
	}

	/**
	 * Get the lead's name
	 *
	 * @return string
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Get the first name
	 *
	 * @return string
	 */
	public function get_first_name() {
		return $this->first_name;
	}

	/**
	 * Get the last name
	 *
	 * @return string
	 */
	public function get_last_name() {
		return $this->last_name;
	}

	/**
	 * Get the phone number
	 *
	 * @return string
	 */
	public function get_phone() {
		return $this->phone;
	}

	/**
	 * Get the chat message
	 *
	 * @return string
	 */
	public function get_message_formatted() {
		return wpautop( $this->message );
	}

	/**
	 * Get the leads IP address
	 *
	 * @return string
	 */
	public function get_ip() {
		if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) )   //check ip from share internet
		{
			$ip = $_SERVER['HTTP_CLIENT_IP'];
		} else if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) )   //to check ip is pass from proxy
		{
			$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
		} else {
			$ip = $_SERVER['REMOTE_ADDR'];
		}

		return $ip;
	}


}
