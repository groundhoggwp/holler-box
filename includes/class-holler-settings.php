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
	 * @param string|array $setting
	 * @param mixed  $default
	 *
	 * @return mixed
	 */
	public function get( $setting, $default = false ) {

		if ( is_array( $setting ) ) {

			$settings = [];

			foreach ( $setting as $key ) {
				$settings[ $key ] = $this->settings[ $key ] ?? ( is_array( $default ) && isset( $default[ $key ] ) ? $default[ $key ] : false );
			}

			return $settings;
		}

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

		switch ( $name ) {
			case 'stacked_delay':
				$value = absint( $value );
				break;
			case 'cookie_compliance':
			case 'gdpr_enabled':
			case 'credit_disabled':
			case 'disable_all':
			case 'script_debug_mode':
			case 'delete_all_data':
			case 'telemetry_subscribed':
			case 'is_licensed':
			case 'is_legacy_user':
			case 'legacy_user_agreed':
				$value = boolval( $value );
				break;
			case 'gdpr_text':
				$value = wp_kses_post( $value );
				break;
			case 'cookie_name':
			case 'cookie_value':
			default:
				$value = sanitize_text_field( $value );
				break;
		}

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
