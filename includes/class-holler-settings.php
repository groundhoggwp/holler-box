<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Holler_Settings {

	public static $instance;

	/**
	 * Get the instance
	 *
	 * @return Holler_Settings
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new Holler_Settings();
		}

		return self::$instance;
	}

	protected $settings = [];
	const OPTION_NAME = 'hollerbox_settings';

	/**
	 * Get the settings from the option
	 */
	public function __construct() {
		$this->settings = get_option( self::OPTION_NAME, [] );
	}

	/**
	 * Get a setting
	 *
	 * @param string $setting
	 * @param mixed  $default
	 *
	 * @return mixed
	 */
	public function get( string $setting, $default = false ) {
		return $this->settings[ $setting ] ?? $default;
	}

	/**
	 * Update a setting
	 *
	 * @param $name   string
	 * @param $value  mixed
	 * @param $commit bool
	 *
	 * @return void
	 */
	public function update( string $name, $value, bool $commit = true ) {
		$this->settings[ $name ] = $value;

		if ( $commit ) {
			$this->commit();
		}
	}

	/**
	 * Commit the settings as they are in the instance
	 *
	 * @return bool
	 */
	public function commit() {
		return update_option( self::OPTION_NAME, $this->settings );
	}

	/**
	 * Drop the option name
	 * @return void
	 */
	public function drop() {
		delete_option( self::OPTION_NAME );
	}

}
