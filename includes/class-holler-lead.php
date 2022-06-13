<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Holler_Lead {

	public $email = '';
	public $name = '';

	public function __construct( WP_REST_Request $request ) {
		$this->name  = sanitize_text_field( $request->get_param( 'name' ) );
		$this->email = sanitize_email( $request->get_param( 'email' ) );
	}

	/**
	 * Get the lead's email address
	 *
	 * @return string
	 */
	public function get_email(){
		return $this->email;
	}

	/**
	 * Get the lead's name
	 *
	 * @return string
	 */
	public function get_name(){
		return $this->name;
	}

}
