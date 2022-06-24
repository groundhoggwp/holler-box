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
	 * Key props from the post
	 *
	 * @param $key
	 *
	 * @return array|mixed
	 */
	public function __get( $key ){
		return $this->post->$key;
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
	 * @return bool|WP_Error true on successful update, false otherwise
	 */
	protected function _commit_post_args() {

		// Update the post
		$id = wp_update_post( wp_parse_args( $this->_post_args, [
			'ID' => $this->post->ID
		] ) );

		// Reset the post args
		$this->_post_args = [];

		if ( ! $id ) {
			return false;
		}

		if ( is_wp_error( $id ) ) {
			return $id;
		}

		return true;
	}

	/**
	 * Update the popup with the new settings
	 *
	 * @param $settings
	 *
	 * @return bool|WP_Error
	 */
	public function update( $settings ) {

		foreach ( $settings as $setting => $value ) {
			$this->update_setting( $setting, $value );
		}

		// Commit any temp post args
		$result = $this->_commit_post_args();

		if ( ! $result || is_wp_error( $result ) ){
			return $result;
		}

		// Fetch updated info
		$this->setup( $this->post->ID );

		return $result;
	}

	/**
	 * Update a specific setting
	 *
	 * @param $setting
	 * @param $value
	 */
	protected function update_setting( $setting, $value ) {

		switch ( $setting ) {
			case 'id':
				// don't save this!
				break;
			case 'post_title':
			case 'post_status':
			case 'post_content':
				$this->_set_post_arg( $setting, $value );
				break;
			default:
				$this->_update_meta( $setting, $value );
				break;
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

					// check the advanced conditions
					return $this->check_advanced_rules();
				}
			}
		}

		// Otherwise, return false
		return false;
	}

	/**
	 * Checks the advanced conditions of the popup to see if wre can show it or not
	 *
	 * For each of the enabled conditions, if any false then return false
	 *
	 * @return bool true if can show, otherwise false
	 */
	public function check_advanced_rules() {
		$rules = $this->_get_meta( 'advanced_rules' );

		foreach ( $rules as $type => $rule ) {

			// Skip rules which aren't enabled
			if ( ! $rule['enabled'] ) {
				continue;
			}

			// Any false rule will prevent the popup from showing
			if ( ! self::check_condition( wp_parse_args( $rule, [
				'type' => $type
			] ) ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Serializable version of the post
	 *
	 * @return array|mixed|object
	 */
	public function jsonSerialize() {
		$json = wp_parse_args( $this->post->to_array(), wp_parse_args( $this->settings, [
			'after_submit'    => 'close',
			'success_message' => __( 'Thanks for subscribing.' )
		] ) );

		// Render shortcodes
		$json['post_content'] = do_shortcode( $json['post_content'] );
		$json['success_message'] = do_shortcode( $json['success_message'] );

		return $json;
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

		foreach ( $integrations as $i => $integration ) {
			$results[ $integration['type'] . '_' . $i ] = Holler_Integrations::_do( $integration, $lead );
		}

		Holler_Reporting::instance()->add_conversion( $this );

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
		echo $this->_get_meta( 'css' );
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

		// These are checked on the frontend, so just return true
		self::add_display_condition( 'show_up_to_x_times', '__return_true' );
		self::add_display_condition( 'hide_if_converted', '__return_true' );
		self::add_display_condition( 'show_after_x_page_views', '__return_true' );
		self::add_display_condition( 'show_on_x_devices', '__return_true' );

		// Check for logged-in/out
		self::add_display_condition( 'show_for_x_visitors', function ( $filter ) {
			switch ( $filter['visitor'] ) {
				default:
					return true;
				case 'logged_in':
					return is_user_logged_in();
				case 'logged_out':
					return ! is_user_logged_in();
			}
		} );

		// Check these
		self::add_display_condition( 'entire_site', '__return_true' );
		self::add_display_condition( '404_page', 'is_404' );
		self::add_display_condition( 'search_page', 'is_search' );
		self::add_display_condition( 'front_page', 'is_front_page' );
		self::add_display_condition( 'blog_page', function () {
			global $wp_query;

			return $wp_query->is_posts_page;
		} );

		self::add_display_condition( 'regex', function ( $filter ) {
			$filter = wp_parse_args( $filter, [ 'regex' => '' ] );

			global $wp;
			$current_slug = trailingslashit( add_query_arg( [], $wp->request ) );
			if ( $current_slug !== '/' ){
				$current_slug = '/' . $current_slug;
			}

			try  {
				return preg_match( "#{$filter['regex']}#", $current_slug );
			} catch (Exception $e) {
				return false;
			}
		} );

		$post_types = get_post_types( [], 'objects' );
		$post_types = array_filter( $post_types, function ( $pt ) {
			return $pt->public && $pt->name !== 'hollerbox';
		} );

		foreach ( $post_types as $post_type ) {
			$post_type->taxonomies = get_object_taxonomies( $post_type->name, 'objects' );
		}

		foreach ( $post_types as $post_type ) {

			// Single post
			self::add_display_condition( $post_type->name, function ( $condition ) use ( $post_type ) {

				if ( ! is_singular( $post_type->name ) ) {
					return false;
				}

				$post_ids = wp_parse_id_list( wp_list_pluck( $condition['selected'], 'id' ) );

				// If no posts were selected, assume all
				if ( empty( $post_ids ) ) {
					return true;
				}

				return in_array( get_the_ID(), $post_ids );
			} );

			// Is Post Archive
			self::add_display_condition( $post_type->name . '_archive', function ( $condition ) use ( $post_type ) {
				return is_post_type_archive( $post_type->name );
			} );

			// Add taxonomy stuff
			foreach ( $post_type->taxonomies as $taxonomy ) {

				// Post in Taxonomy
				self::add_display_condition( $post_type->name . '_in_' . $taxonomy->name, function ( $condition ) use ( $post_type, $taxonomy ) {

					// If not a singular, def false
					if ( ! is_singular( $post_type->name ) ) {
						return false;
					}

					$term_ids = wp_parse_id_list( wp_list_pluck( $condition['selected'], 'id' ) );

					// If no posts were selected, assume all
					if ( empty( $term_ids ) ) {
						return true;
					}

					return has_term( $term_ids, $taxonomy->name );
				} );

				// Taxonomy Archive
				self::add_display_condition( $taxonomy->name . '_archive', function ( $condition ) use ( $post_type, $taxonomy ) {

					$term_ids = wp_parse_id_list( wp_list_pluck( $condition['selected'], 'id' ) );

					switch ( $taxonomy->name ) {
						case 'category':
							return is_category( $term_ids );
						case 'post_tag':
							return is_tag( $term_ids );
						default:
							return is_tax( $taxonomy->name, $term_ids );
					}
				} );
			}
		}

		do_action( 'hollerbox/init_display_conditions' );
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

		// ignore
		if ( ! is_callable( self::$display_conditions[ $condition['type'] ] ) ){
			return true;
		}

		return call_user_func( self::$display_conditions[ $condition['type'] ], $condition );
	}
}
