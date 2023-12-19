<?php

class Holler_Updater {

	public function __construct() {
		add_action( 'admin_init', [ $this, 'maybe_upgrade' ] );
	}

	public function get_updates() {
		return [
			'2.0'   => [ $this, 'v_2_0' ],
			'2.1.2' => [ $this, 'v_2_1_2' ],
			'2.2'   => [ $this, 'v_2_2' ],
		];
	}

	public function v_2_2() {
		Holler_Reporting::instance()->update_2_2();
	}

	/**
	 * Updated the stats table
	 *
	 * @return void
	 */
	public function v_2_1_2() {
		Holler_Reporting::instance()->update_2_1_2();
	}

	/**
	 * Upate to 2.0
	 *
	 * @return void
	 */
	public function v_2_0() {

		// Migrate some settings over
		Holler_Settings::instance()->update( 'license', get_option( 'hwp_pro_edd_license' ), false );
		Holler_Settings::instance()->update( 'is_licensed', get_option( 'hwp_pro_edd_license_status' ) === 'valid', false );
		Holler_Settings::instance()->update( 'credit_disabled', get_option( 'hwp_powered_by' ), false );

		$options = [
			'hwp_ac_api_key',
			'hwp_ck_api_key',
			'hwp_mc_api_key',
			'hwp_powered_by',
		];

		// If any of the settings were set and are not empty, this person is a legacy user
		foreach ( $options as $option ) {
			$val = get_option( $option );
			if ( ! empty( $val ) ) {
				Holler_Settings::instance()->update( 'is_legacy_user', true, false );
				break;
			}
		}

		// Commit the settings
		Holler_Settings::instance()->commit();

		// Create the reports table
		Holler_Reporting::instance()->create_table();
	}

	/**
	 * Array of updates which have already been performed
	 *
	 * @return false|mixed|void
	 */
	public function get_previous_updates() {
		return get_option( 'holler_previous_updates', [] );
	}

	/**
	 * Whether an update for a specific version was performed
	 *
	 * @param $version
	 *
	 * @return bool
	 */
	public function did_update( $version ) {
		return in_array( $version, $this->get_previous_updates() );
	}

	/**
	 * Remember that we did this update
	 *
	 * @param $version
	 *
	 * @return void
	 */
	public function update_complete( $version ) {
		$updates   = $this->get_previous_updates();
		$updates[] = $version;
		update_option( 'holler_previous_updates', $updates );
	}

	/**
	 * Maybe perform updates
	 *
	 * @return void
	 */
	public function maybe_upgrade() {
		foreach ( $this->get_updates() as $update => $callback ) {
			if ( $this->did_update( $update ) ) {
				continue;
			}

			if ( is_callable( $callback ) ) {
				call_user_func( $callback );

				$this->update_complete( $update );
			}
		}
	}

}
