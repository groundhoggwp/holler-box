<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Holler_Reporting {

	public static $instance;
	const TABLE_VERSION = '1.0';

	protected $table_name;

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

		add_action( 'deleted_post', [ $this, 'maybe_delete_stats' ], 10, 2 );
	}

	/**
	 * Delete associated stats from the reporting because we no longer need them
	 *
	 * @param $post_id
	 * @param $post WP_Post
	 *
	 * @return void
	 */
	public function maybe_delete_stats( $post_id, $post ) {

		if ( $post->post_type !== 'hollerbox' ) {
			return;
		}

		global $wpdb;

		$wpdb->query( "DELETE FROM $this->table_name WHERE popup_id = $post_id" );
	}

	/**
	 * Create or upgrade the table depending on the table version
	 *
	 * @return void
	 */
	public function maybe_create_table() {
		$this->create_table();
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
	public function create_table() {

		global $wpdb;

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

		$charset_collate = $wpdb->get_charset_collate();

		$max_index_length = $this->max_key_length();

		$sql = "CREATE TABLE " . $this->table_name . " (
        s_type varchar(10) NOT NULL,
        s_date date NOT NULL,
        s_count INT unsigned NOT NULL,
        popup_id bigint(20) unsigned NOT NULL,
        location varchar($max_index_length) NOT NULL,
        content varchar($max_index_length) NOT NULL,
        PRIMARY KEY (popup_id, s_type, s_date, location, content),
        KEY s_date (s_date),
        KEY s_type (s_type),
        KEY popup_id (popup_id),
        KEY content (content)
        ) $charset_collate ENGINE=InnoDB;";

		dbDelta( $sql );

		update_option( $this->table_name . '_table_version', self::TABLE_VERSION );
	}

	/**
	 * @throws Exception
	 *
	 * @param Holler_Popup $popup
	 * @param string       $location
	 * @param string       $content
	 *
	 * @param string       $type
	 *
	 * @return void
	 */
	protected function increment_stat( string $type, Holler_Popup $popup, $location, $content = '' ) {
		global $wpdb;

		$date = new DateTime( 'now', wp_timezone() );

		$wpdb->query( $wpdb->prepare(
			"INSERT INTO $this->table_name (s_type, s_count, popup_id, location, content, s_date)
			VALUES (%s, %d, %d, %s, %s, %s)
			ON DUPLICATE KEY UPDATE s_count = s_count + 1",
			$type, 1, $popup->ID, $location, $content, $date->format( 'Y-m-d' ) ) );
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
	 * @param $content  string
	 *
	 * @return void
	 */
	public function add_conversion( Holler_Popup $popup, string $location, string $content ) {
		$this->increment_stat( 'conversion', $popup, $location, $content );
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
	public function get_total_popup_count_for_interval( string $type, Holler_Popup $popup, DateInterval $interval ) {

		$date  = new DateTime( 'now', wp_timezone() );
		$today = $date->format( 'Y-m-d' );
		$date->sub( $interval );
		$prev = $date->format( 'Y-m-d' );

		return $this->_get_total_count_for_interval( [
			'popup_id' => $popup->ID,
			'after'    => $prev,
			'before'   => $today,
			's_type'   => $type
		] );
	}

	/**
	 * Get the impression count for a given interval
	 *
	 * @param $query
	 *
	 * @return int
	 */
	public function _get_total_count_for_interval( $query = [] ) {

		global $wpdb;

		$cache_key = md5( wp_json_encode( $query ) );

		$count = wp_cache_get( $cache_key, 'hollerbox:counts', null, $found );

		if ( $found ) {
			return $count;
		}

		$default_date = new DateTime( '30 days ago', wp_timezone() );

		$query = wp_parse_args( $query, [
			'before' => current_time( 'Y-m-d' ),
			'after'  => $default_date->format( 'Y-m-d' )
		] );

		$clauses = [];

		foreach ( $query as $column => $value ) {

			if ( ! $this->is_valid_column( $column ) ) {
				continue;
			}

			switch ( $column ) {
				case 'before':
					$clauses[] = $wpdb->prepare( "s_date <= %s", $value );
					break;
				case 'after':
					$clauses[] = $wpdb->prepare( "s_date >= %s", $value );
					break;
				case 's_type':
				case 'location':
				case 'content':
				case 's_date':
					$clauses[] = $wpdb->prepare( "$column = %s", $value );
					break;
				default:
					$clauses[] = $wpdb->prepare( "$column = %d", $value );
					break;
			}
		}

		$where = implode( ' AND ', $clauses );

		$query = "SELECT SUM(s_count) FROM $this->table_name WHERE $where";

		$count = intval( $wpdb->get_var( $query ) );

		wp_cache_set( $cache_key, $count, 'hollerbox:counts' );

		return $count;
	}

	/**
	 * Get all impressions for all popups for the last 30 days
	 *
	 * @return int
	 */
	public function get_total_impressions_last_30() {
		$after = new DateTime( '30 days ago' );

		return $this->_get_total_count_for_interval( [
			's_type' => 'impression',
			'after'  => $after->format( 'Y-m-d' )
		] );
	}

	/**
	 * Get all conversions for all popups for the last 30 days
	 *
	 * @return int
	 */
	public function get_total_conversions_last_30() {
		$after = new DateTime( '30 days ago' );

		return $this->_get_total_count_for_interval( [
			's_type' => 'conversion',
			'after'  => $after->format( 'Y-m-d' )
		] );
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
		return $this->get_total_popup_count_for_interval( 'impression', $popup, $interval );
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
		return $this->get_total_popup_count_for_interval( 'conversion', $popup, $interval );
	}

	/**
	 * Ensures that a column is valid for SQL queries
	 *
	 * @param $column
	 *
	 * @return bool
	 */
	public function is_valid_column( $column ) {
		return in_array( $column, [
			's_type',
			's_count',
			'popup_id',
			'location',
			's_date',
			'content'
		] );
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
					$clauses[] = $wpdb->prepare( 's_date <= %s', $value );
					break;
				case 'after':
					$clauses[] = $wpdb->prepare( 's_date >= %s', $value );
					break;
				case 's_type':
				case 'location':
				case 'content':
				case 's_date':
					$clauses[] = $wpdb->prepare( "$column = %s", $value );
					break;
				default:
					if ( $this->is_valid_column( $column ) ) {
						if ( is_numeric( $column ) ) {
							$clauses[] = $wpdb->prepare( "$column = %d", $value );
						} else {
							$clauses[] = $wpdb->prepare( "$column = %s", $value );
						}
					}
					break;
			}
		}

		$where = implode( ' AND ', $clauses );

		$query = "SELECT * FROM $this->table_name WHERE $where";

		return $wpdb->get_results( $query );
	}

	/**
	 * Max key length
	 *
	 * @return int
	 */
	public function max_key_length() {
		global $wpdb;

		return $wpdb->charset === 'utf8mb4' ? 191 : 255;
	}

	/**
	 * Change location to varchar 255
	 * Update primary key to include location
	 *
	 * @return void
	 */
	public function update_2_1_2() {
		global $wpdb;

		$max_index_length = $this->max_key_length();

		$wpdb->query( "ALTER TABLE {$this->table_name} MODIFY COLUMN location varchar($max_index_length) NOT NULL, DROP PRIMARY KEY, ADD PRIMARY KEY (popup_id, s_type, s_date, location);" );
	}

	/**
	 * Add the new column
	 *
	 * @return void
	 */
	public function update_2_2() {
		global $wpdb;

		$max_index_length = $this->max_key_length();

		$commands = [
			// Change the engine to InnoDB
			"ALTER TABLE {$this->table_name} ENGINE=InnoDB;",
			// Add the content columns
			"ALTER TABLE {$this->table_name} ADD content varchar($max_index_length) NOT NULL;",
			// Add index
			"CREATE INDEX content ON {$this->table_name} (content);",
			// Update the primary key
			"ALTER TABLE {$this->table_name} DROP PRIMARY KEY, ADD PRIMARY KEY (popup_id, s_type, s_date, location, content);"
		];

		foreach ( $commands as $command ) {
			$wpdb->query( $command );
		}
	}

}
