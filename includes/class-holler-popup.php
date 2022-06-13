<?php

class Holler_Popup implements JsonSerializable {

	/**
	 * @var WP_Post
	 */
	protected $post;
	protected $settings = [];

	/**
	 * Initialize the popup
	 *
	 * @param int|WP_Post $id
	 */
	public function __construct( $id = false ) {
		$this->setup( $id );
	}

	/**
	 * Setup the popup data
	 *
	 * @param $id
	 */
	protected function setup( $id ) {
		$this->post = get_post( $id );

		if ( ! $this->exists() ) {
			return;
		}

		// Get all the post meta
		$this->settings = get_post_meta( $this->post->ID );

		// map to single value
		foreach ( $this->settings as $setting => &$value ) {
			if ( is_array( $value ) && count( $value ) === 1 ) {
				$value = maybe_unserialize( $value[0] );
			}
		}
	}

	/**
	 * Whether the popup exists or not
	 *
	 * @return bool
	 */
	public function exists() {
		return boolval( $this->post );
	}

	/**
	 * Temp storage for updating the associated WP_Post
	 *
	 * @var array
	 */
	protected $_post_args = [];

	/**
	 * Set the temp post args
	 *
	 * @param $arg
	 * @param $value
	 */
	protected function _set_post_arg( $arg, $value ) {
		$this->_post_args[ $arg ] = $value;
	}

	/**
	 * Commit post args during update
	 *
	 * @return bool true on successful update, false otherwise
	 */
	protected function _commit_post_args() {

		// Update the post
		$id = wp_update_post( wp_parse_args( $this->_post_args, [
			'ID' => $this->post->ID
		] ) );

		if ( ! $id || is_wp_error( $id ) ) {
			return false;
		}

		// Reset the post args
		$this->_post_args = [];

		return true;
	}

	/**
	 * Update the popup with the new settings
	 */
	public function update( $settings ) {

		foreach ( $settings as $setting => $value ) {
			$this->update_setting( $setting, $value );
		}

		// Commit any temp post args
		$this->_commit_post_args();

		// Fetch updated info
		$this->setup( $this->post->ID );
	}

	/**
	 * Update a specific setting
	 *
	 * @param $setting
	 * @param $value
	 */
	protected function update_setting( $setting, $value ) {

		switch ( $setting ) {
			case 'post_title':
			case 'post_status':
			case 'post_content':
				$this->_set_post_arg( $setting, $value );
				break;
			default:
				$this->_update_meta( $setting, $value );
		}
	}

	/**
	 * Update post meta data
	 *
	 * @param $meta_key
	 * @param $meta_value
	 */
	protected function _update_meta( $meta_key, $meta_value ) {
		update_post_meta( $this->post->ID, $meta_key, $meta_value );
	}

	/**
	 * Get post meta data
	 *
	 * @param $meta_key
	 *
	 * @return mixed
	 */
	protected function _get_meta( $meta_key ) {
		return get_post_meta( $this->post->ID, $meta_key, true );
	}

	/**
	 * Loop through display conditions and match to the current query
	 *
	 * @return bool true if showing, false otherwise
	 */
	public function can_show() {

		// If any exclude condition is satisfied return false
		$exclude_conditions = $this->_get_meta( 'exclude_rules' );

		if ( is_array( $exclude_conditions ) ) {
			foreach ( $exclude_conditions as $condition ) {
				if ( self::check_condition( $condition ) ) {
					return false;
				}
			}
		}

		// If any include condition is satisfied return true
		$display_conditions = $this->_get_meta( 'display_rules' );

		if ( is_array( $display_conditions ) ) {
			foreach ( $display_conditions as $condition ) {
				if ( self::check_condition( $condition ) ) {
					return true;
				}
			}
		}

		// Otherwise, return false
		return false;
	}

	/**
	 * Serializable version of the post
	 *
	 * @return array|mixed|object
	 */
	public function jsonSerialize() {
		return wp_parse_args( $this->post->to_array(), $this->settings );
	}

	/**
	 * Delete the post
	 *
	 * @param false $force whether to force deletion
	 */
	public function delete( $force = false ) {
		return wp_delete_post( $this->post->ID, $force );
	}

	/**
	 * This popup was submitted so do all the integrations and stuff
	 *
	 * @param $lead Holler_Lead
	 *
	 * @return string[]|false
	 */
	public function submit( $lead ) {

		$integrations = $this->_get_meta( 'integrations' );

		if ( empty( $integrations ) ) {
			return false;
		}

		$results = [];

		foreach ( $integrations as $integration ) {
			$results[ $integration['type'] ] = Holler_Integrations::_do( $integration, $lead );
		}

		return [
			'status'  => 'success',
			'results' => $results
		];
	}

	/**
	 * Return an array of strings representing CSS classes
	 *
	 * @return string[]
	 */
	public function get_body_classes() {
		return [];
	}

	public function output_css() {
		echo $this->_get_meta( 'custom_css' );
	}

	/**
	 * Callbacks for whether we should display a popup
	 *
	 * @var callable[]
	 */
	static $display_conditions = [];

	/**
	 * Initialize the display conditions
	 */
	static function init_display_conditions() {
		self::add_display_condition( 'entire_site', '__return_true' );
		self::add_display_condition( '404_page', 'is_404' );
		self::add_display_condition( 'search_page', 'is_search' );
		self::add_display_condition( 'front_page', 'is_front_page' );
		self::add_display_condition( 'blog_page', function () {
			global $wp_query;

			return $wp_query->is_posts_page;
		} );
	}

	/**
	 * Add a display condition
	 *
	 * @param $id       string
	 * @param $callback callable
	 */
	static function add_display_condition( $id, $callback ) {
		self::$display_conditions[ $id ] = $callback;
	}

	/**
	 * Check a display condition
	 *
	 * @param $condition
	 *
	 * @return false|mixed
	 */
	static function check_condition( $condition ) {
		if ( empty( self::$display_conditions ) ) {
			self::init_display_conditions();
		}

		return call_user_func( self::$display_conditions[ $condition['type'] ], $condition );
	}
}
