<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Holler_Reporting {

	public static $instance;

	/**
	 * Get the instance
	 *
	 * @return Holler_Reporting
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new Holler_Reporting();
		}

		return self::$instance;
	}

	public function __construct() {

	}

	/**
	 * Increment the daily impression count for the given popup
	 *
	 * @param $popup Holler_Popup
	 *
	 * @return void
	 */
	public function add_impression( $popup ){

	}

	/**
	 * Increment the daily conversion count for the given popup
	 *
	 * @param $popup Holler_Popup
	 *
	 * @return void
	 */
	public function add_conversion( $popup ){

	}

}
