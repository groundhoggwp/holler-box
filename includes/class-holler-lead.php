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

	public function __construct( WP_REST_Request $request ) {
		$this->name  = sanitize_text_field( $request->get_param( 'name' ) );
		$this->email = sanitize_email( strtolower( $request->get_param( 'email' ) ) );

		$parts              = explode( ' ', $this->name );
		$this->first_name   = trim( $parts[0] );
		$this->last_name    = trim( $parts[1] );
		$this->phone        = sanitize_text_field( $request->get_param( 'phone' ) );
		$this->location     = sanitize_text_field( $request->get_param( 'location' ) );
		$this->referrer     = sanitize_text_field( $request->get_param( 'referer' ) );
		$this->gdpr_consent = $request->get_param( 'gdpr_consent' ) === 'yes';
		$this->message      = sanitize_textarea_field( $request->get_param( 'message' ) );
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
