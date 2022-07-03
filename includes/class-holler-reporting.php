<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Holler_Reporting {

	public static $instance;
	const TABLE_VERSION = '1.0';

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

	/**
	 * Setup the table name
	 * Enqueue any relevant actions
	 */
	public function __construct() {
		global $wpdb;
		$this->table_name = $wpdb->prefix . 'hollerbox_stats';
		$this->maybe_create_table();
	}

	/**
	 * Create or upgrade the table depending on the table version
	 *
	 * @return void
	 */
	public function maybe_create_table() {
		$table_version = get_option( $this->table_name . '_table_version' );

		if ( ! $table_version || version_compare( $table_version, self::TABLE_VERSION, '<' ) ) {
			$this->create_table();
		}
	}

	/**
	 * Check if the stats table exists
	 *
	 * @since  2.4
	 *
	 * @param string $table The table name
	 *
	 * @return bool          If the table name exists
	 */
	public function table_exists() {
		global $wpdb;

		return $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE '%s'", $this->table_name ) ) === $this->table_name;
	}

	/**
	 * Drops the table
	 */
	public function drop() {

		if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
			exit;
		}

		delete_option( $this->table_name . '_table_version' );

		global $wpdb;

		$wpdb->query( "DROP TABLE IF EXISTS " . $this->table_name );
	}

	/**
	 * Creates the table
	 *
	 * @return void
	 */
	protected function create_table() {

		global $wpdb;

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE " . $this->table_name . " (
        s_type varchar(10) NOT NULL,
        s_date date NOT NULL,
        s_count bigint(20) unsigned NOT NULL,
        popup_id bigint(20) unsigned NOT NULL,
        location text NOT NULL,
        KEY s_date (s_date),
        KEY s_type (s_type),
        KEY popup_id (popup_id)
        ) $charset_collate;";

		dbDelta( $sql );

		update_option( $this->table_name . '_table_version', self::TABLE_VERSION );
	}

	protected $table_name;

	/**
	 * @throws Exception
	 *
	 * @param Holler_Popup $popup
	 * @param string       $type
	 *
	 * @return void
	 */
	protected function increment_stat( string $type, Holler_Popup $popup, $location ) {
		global $wpdb;

		$date = new DateTime( 'now', wp_timezone() );

		$updated = $wpdb->query( $wpdb->prepare( "
UPDATE $this->table_name 
SET s_count = s_count + 1 
WHERE popup_id = %d AND s_type = %s AND s_date = %s AND location = %s",
			$popup->ID, $type, $date->format( 'Y-m-d' ), $location ) );

		// No rows were effected
		if ( ! $updated ) {

			// Create a new row
			$wpdb->insert( $this->table_name, [
				's_type'   => $type,
				's_count'  => 1,
				'popup_id' => $popup->ID,
				'location' => $location,
				's_date'   => $date->format( 'Y-m-d' ),
			], [
				'%s',
				'%d',
				'%d',
				'%s',
				'%s',
			] );
		}
	}

	/**
	 * Increment the daily impression count for the given popup
	 *
	 * @param $popup    Holler_Popup
	 * @param $location string
	 *
	 * @return void
	 */
	public function add_impression( Holler_Popup $popup, string $location ) {
		$this->increment_stat( 'impression', $popup, $location );
	}

	/**
	 * Increment the daily conversion count for the given popup
	 *
	 * @param $popup    Holler_Popup
	 * @param $location string
	 *
	 * @return void
	 */
	public function add_conversion( Holler_Popup $popup, string $location ) {
		$this->increment_stat( 'conversion', $popup, $location );
	}

	/**
	 * Get the impression count for a given interval
	 *
	 * @param $type     string
	 * @param $popup    Holler_Popup
	 * @param $interval DateInterval
	 *
	 * @return int
	 */
	public function get_total_count_for_interval( string $type, Holler_Popup $popup, DateInterval $interval ) {

		$cache_key = "{$popup->post_name}:{$type}";

		$count = wp_cache_get( $cache_key, 'hollerbox:counts', null, $found );

		if ( $found ) {
			return $count;
		}

		$date  = new DateTime( 'now', wp_timezone() );
		$today = $date->format( 'Y-m-d' );
		$date->sub( $interval );
		$prev = $date->format( 'Y-m-d' );

		global $wpdb;

		$count = $wpdb->get_var( $wpdb->prepare( "
SELECT SUM(s_count) 
FROM $this->table_name 
WHERE s_date >= %s AND s_date <= %s AND s_type = %s AND popup_id = %d ",
			$prev, $today, $type, $popup->ID ) );

		wp_cache_set( $cache_key, $count, 'hollerbox:counts' );

		return $count;
	}

	/**
	 * Get the impression count for a given interval
	 *
	 * @param $popup    Holler_Popup
	 * @param $interval DateInterval
	 *
	 * @return int
	 */
	public function get_total_impressions_for_interval( Holler_Popup $popup, DateInterval $interval ) {
		return $this->get_total_count_for_interval( 'impression', $popup, $interval );
	}

	/**
	 * Get the submission count for a given interval
	 *
	 * @param $popup    Holler_Popup
	 * @param $interval DateInterval
	 *
	 * @return int
	 */
	public function get_total_conversions_for_interval( Holler_Popup $popup, DateInterval $interval ) {
		return $this->get_total_count_for_interval( 'conversion', $popup, $interval );
	}

	/**
	 * Get rows of report data for the given query
	 *
	 * @param array $query
	 *
	 * @return array
	 */
	public function get_report_data( array $query = [] ) {

		global $wpdb;

		$default_date = new DateTime( '30 days ago', wp_timezone() );

		$query = wp_parse_args( $query, [
			'before' => current_time( 'Y-m-d' ),
			'after'  => $default_date->format( 'Y-m-d' )
		] );

		$clauses = [];

		foreach ( $query as $column => $value ) {
			switch ( $column ) {
				case 'before':
					$clauses[] = "s_date <= '$value'";
					break;
				case 'after':
					$clauses[] = "s_date >= '$value'";
					break;
				case 's_type':
				case 'location':
				case 's_date':
					$clauses[] = "$column = '$value'";
					break;
				default:
					$clauses[] = "$column = $value";
					break;
			}
		}

		$where = implode( ' AND ', $clauses );

		$query = "SELECT * FROM $this->table_name WHERE $where";

		return $wpdb->get_results( $query );
	}

}
