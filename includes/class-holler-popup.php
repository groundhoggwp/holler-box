<?php

/**
 * Add form tags to allowed HTML
 *
 * @param $tags array
 *
 * @return array
 */
function holler_box_allow_form_tags( $tags ) {

	$tags['input'] = [
		'name'        => true,
		'type'        => true,
		'value'       => true,
		'placeholder' => true,
		'max'         => true,
		'min'         => true,
		'step'        => true,
		'maxlength'   => true,
		'minlength'   => true,
	];

	$tags['select'] = [
		'name'  => true,
		'value' => true,
	];

	$tags['option'] = [
		'value' => true,
	];

	return $tags;
}

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

		// Upgrades
		$this->maybe_upgrade_2_0();
		$this->maybe_upgrade_2_0_integrations();

		do_action( 'hollerbox/popup/__construct', $this );
	}

	/**
	 * Key props from the post
	 *
	 * @param $key
	 *
	 * @return array|mixed
	 */
	public function __get( $key ) {
		return $this->post->$key ?? ( $this->settings[ $key ] ?? false );
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

		if ( ! $result || is_wp_error( $result ) ) {
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
			case 'items':
			case 'timeout':
			case 'has_shortcodes':
				// don't save this!
				break;
			case 'post_title':
			case 'post_status':
				$this->_set_post_arg( $setting, sanitize_text_field( $value ) );
				break;
			case 'post_content':
				$this->_set_post_arg( $setting, wp_kses_post( $value ) );
				break;
			case 'menu_order':
				$this->_set_post_arg( $setting, absint( $value ) );
				break;
			case 'success_message':
			case 'name_prompt':
			case 'email_prompt':
			case 'message_prompt':
			case 'yes_message':
			case 'no_message':
				$this->_update_meta( $setting, wp_kses_post( $value ) );
				break;
			case 'custom_form_html':

				add_filter( 'wp_kses_allowed_html', 'holler_box_allow_form_tags' );
				$this->_update_meta( $setting, wp_kses_post( $value ) );
				remove_filter( 'wp_kses_allowed_html', 'holler_box_allow_form_tags' );

				break;
			case 'fomo_text':
			case 'button_text':
			case 'email_placeholder':
			case 'name_placeholder':
			case 'phone_placeholder':
			case 'image_src':
			case 'position':
				$this->_update_meta( $setting, sanitize_text_field( $value ) );
				break;
			case 'fomo_time_ago':
			case 'fomo_display_time':
			case 'fomo_loop_delay':
				$this->_update_meta( $setting, absint( $value ) );
				break;
			default:

				$key   = sanitize_key( $setting );
				$value = apply_filters( 'hollerbox/popup/update_setting', $value, $key, $this );

				$this->_update_meta( $key, $value );
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
		$this->settings[ $meta_key ] = $meta_value;
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

		if ( isset( $this->settings[ $meta_key ] ) ) {
			return $this->settings[ $meta_key ];
		}

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
				if ( $this->check_condition( $condition ) ) {
					return false;
				}
			}
		}

		// If any include condition is satisfied return true
		$display_conditions = $this->_get_meta( 'display_rules' );

		if ( is_array( $display_conditions ) ) {
			foreach ( $display_conditions as $condition ) {
				if ( $this->check_condition( $condition ) ) {

					// check the advanced conditions
					if ( ! $this->check_advanced_rules() ) {
						return false;
					}

					/**
					 * Whether to show the popup or not, possibly based on external settings
					 *
					 * @param $can_show bool
					 * @param $popup    Holler_Popup
					 */
					return apply_filters( 'hollerbox/popup/can_show', true, $this );
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
			if ( ! $this->check_condition( wp_parse_args( $rule, [
				'type' => $type
			] ) ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Whether the passed content contains any shortcode
	 *
	 * @param string $content Content to search for shortcodes.
	 *
	 * @return bool Whether the passed content contains the given shortcode.
	 * @since 3.6.0
	 *
	 * @global array $shortcode_tags
	 *
	 */
	public static function content_has_shortcodes( $content ) {
		if ( false === strpos( $content, '[' ) ) {
			return false;
		}

		preg_match_all( '/' . get_shortcode_regex() . '/', $content, $matches, PREG_SET_ORDER );

		return ! empty( $matches );
	}

	/**
	 * Serializable version of the post
	 *
	 * @return mixed
	 */
	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return wp_parse_args( $this->post->to_array(), wp_parse_args( $this->settings, [
			'after_submit'    => 'close',
			'success_message' => __( 'Thanks for subscribing.' ),
			'has_shortcodes'  => [
				'in_content'         => self::content_has_shortcodes( $this->post_content ),
				'in_success_message' => self::content_has_shortcodes( $this->success_message )
			]
		] ) );
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
	 * @return string[]|WP_Error|WP_Error[]
	 */
	public function submit( $lead ) {

		$integrations = $this->_get_meta( 'integrations' );

		if ( empty( $integrations ) ) {
			return new WP_Error( 'no_integrations', 'You have no configured any integrations for this popup.' );
		}

		$failures = [];

		foreach ( $integrations as $i => $integration ) {
			$result = Holler_Integrations::_do( $integration, $lead, $this );

			if ( is_wp_error( $result ) ) {
				$failures[] = sprintf( '<b>%s</b>: %s', $integration['type'], $result->get_error_message() );
			}
		}

		/**
		 * When a form inside a popup has been submitted.
		 *
		 * @param $popup Holler_Popup
		 * @param $lead  Holler_Lead
		 */
		do_action( 'hollerbox/submitted', $this, $lead );

		if ( current_user_can( 'edit_popups' ) && ! empty( $failures ) ) {
			return [
				'status'   => 'failed',
				'failures' => $failures
			];
		}

		return [
			'status' => count( $failures ) < count( $integrations ) ? 'success' : 'failed'
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

	/**
	 * Echo the CSS for this popup
	 *
	 * @return void
	 */
	public function output_css() {
		echo $this->_get_meta( 'css' );
	}

	/**
	 * Output popup content in the event it contains shortcodes
	 *
	 * @return void
	 */
	public function maybe_output_content() {

		if ( self::content_has_shortcodes( $this->post_content ) ) {
			?>
		<div id="holler-<?php echo $this->ID ?>-content">
			<?php echo do_shortcode( wpautop( $this->post_content ) ) ?>
			</div><?php
		}

		if ( self::content_has_shortcodes( $this->success_message ) ) {
			?>
		<div id="holler-<?php echo $this->ID ?>-success-message">
			<?php echo do_shortcode( wpautop( $this->success_message ) ) ?>
			</div><?php
		}

	}

	/**
	 * Callbacks for whether we should display a popup
	 *
	 * @var callable[]
	 */
	static $display_conditions = [];

	/**
	 * Groundhogg integration for displaying of poups
	 *
	 * @param $filter
	 *
	 * @return bool
	 */
	static function groundhogg_display_condition( $filter ) {
		// Groundhogg is not installed
		if ( ! defined( 'GROUNDHOGG_VERSION' ) ) {
			return true;
		}

		$contact = \Groundhogg\get_contactdata();

		if ( ! $contact ) {
			return false;
		}

		$filters = $filter['filters'];

		// No filters were defined, so we are going to ignore...
		if ( empty( $filters ) ) {
			return true;
		}

		add_action( 'gh_parse_contact_query', function ( $query ) {
			unset( $query->query_vars['owner'] );
		} );

		$query = new \Groundhogg\Contact_Query();

		$count = $query->count( [
			'filters' => $filters,
			'include' => [ $contact->get_id() ]
		] );

		// If 1 or more contacts match, return
		return $count >= 1;
	}

	/**
	 * Initialize the display conditions
	 */
	static function init_display_conditions() {

		// These are checked on the frontend, so just return true
		self::add_display_condition( 'show_up_to_x_times', '__return_true' );

		self::add_display_condition( 'hide_if_converted', function ( $filter, $popup ) {

			// Show if no user
			if ( ! is_user_logged_in() ) {
				return true;
			}

			$conversions = wp_parse_id_list( get_user_meta( get_current_user_id(), 'hollerbox_popup_conversions', true ) );

			return ! in_array( $popup->ID, $conversions );
		} );

		self::add_display_condition( 'hide_if_closed', function ( $filter, $popup ) {

			// Show if no user
			if ( ! is_user_logged_in() ) {
				return true;
			}

			$closed = wp_parse_id_list( get_user_meta( get_current_user_id(), 'hollerbox_closed_popups', true ) );

			return ! in_array( $popup->ID, $closed );
		} );

		self::add_display_condition( 'show_after_x_page_views', '__return_true' );
		self::add_display_condition( 'show_after_x_content_views', '__return_true' );
		self::add_display_condition( 'show_after_x_potential_views', '__return_true' );
		self::add_display_condition( 'show_on_x_devices', '__return_true' );
		self::add_display_condition( 'show_to_new_or_returning', '__return_true' );

		// Groundhogg integration
		self::add_display_condition( 'groundhogg', [ self::class, 'groundhogg_display_condition' ] );

		// Groundhogg integration, but negated.
		self::add_display_condition( 'groundhogg_hide', function ( $filter ) {

			// Groundhogg is not installed
			if ( ! defined( 'GROUNDHOGG_VERSION' ) ) {
				return true;
			}

			return ! Holler_Popup::groundhogg_display_condition( $filter );
		} );

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
			if ( $current_slug !== '/' ) {
				$current_slug = '/' . $current_slug;
			}

			try {
				return preg_match( "#{$filter['regex']}#", $current_slug );
			} catch ( Exception $e ) {
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

				$condition = wp_parse_args( $condition, [
					'selected' => []
				] );

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

					$condition = wp_parse_args( $condition, [
						'selected' => []
					] );

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

					$condition = wp_parse_args( $condition, [
						'selected' => []
					] );

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
	protected function check_condition( $condition ) {
		if ( empty( self::$display_conditions ) ) {
			self::init_display_conditions();
		}

		// ignore
		if ( ! is_callable( self::$display_conditions[ $condition['type'] ] ) ) {
			return true;
		}

		return call_user_func( self::$display_conditions[ $condition['type'] ], $condition, $this );
	}

	/**
	 * Get the number of impressions for the number of days given
	 *
	 * @param $days int the number of days to go back for stats
	 *
	 * @return int
	 */
	public function get_impressions( $days = 30 ) {
		$interval = new DateInterval( "P{$days}D" );

		return Holler_Reporting::instance()->get_total_impressions_for_interval( $this, $interval );
	}

	/**
	 * Get the number of submissions for the number of days given
	 *
	 * @param $days
	 *
	 * @return int
	 */
	public function get_conversions( $days = 30 ) {
		$interval = new DateInterval( "P{$days}D" );

		return Holler_Reporting::instance()->get_total_conversions_for_interval( $this, $interval );
	}

	/**
	 * Get report data for a specific time period for this popup
	 *
	 * @param array $query
	 *
	 * @return array
	 */
	public function get_report_data( array $query ) {

		$query['popup_id'] = $this->ID;

		return Holler_Reporting::instance()->get_report_data( $query );
	}

	/**
	 * Is this a new Popup?
	 *
	 * @return bool
	 */
	public function is_new() {
		return in_array( $this->post_status, [ 'new', 'auto-draft' ] );
	}

	/**
	 * Duplicate this popup and all it's settings
	 *
	 * @return Holler_Popup
	 */
	public function duplicate() {

		$post_id = wp_insert_post( [
			'post_content'          => $this->post_content,
			'post_content_filtered' => $this->post_content_filtered,
			'post_title'            => $this->post_title . ' - (copy)',
			'post_status'           => 'draft',
			'post_type'             => 'hollerbox',
			'menu_order'            => $this->menu_order,
		] );

		$popup = new Holler_Popup( $post_id );
		$popup->update( $this->settings );

		return $popup;
	}

	/**
	 * Migrates:
	 * - display conditions
	 * - triggers
	 * - template
	 * - some settings
	 *   - position
	 *
	 * @return void
	 */
	public function maybe_upgrade_2_0() {

		// Already upgraded or is new version
		if ( $this->_get_meta( 'template' ) || $this->is_new() ) {
			return;
		}

		// We are gunna use Draft && Publish to indicate active and inactive
		// if popup is not active, move it to draft
		$hwp_active = $this->_get_meta( 'hwp_active' );

		if ( ! $hwp_active ) {
			$this->update_setting( 'post_status', 'draft' );
		}

		$hwp_type      = $this->_get_meta( 'hwp_type' );
		$show_optin    = $this->_get_meta( 'show_optin' );
		$image         = $this->_get_meta( 'popup_image' );
		$curr_position = $this->_get_meta( 'position' );
		$new_template  = 'popup_custom';

		$position_map = [
			'hwp-bottomright' => 'bottom-right',
			'hwp-bottomleft'  => 'bottom-left',
			'hwp-topright'    => 'top-right',
			'hwp-topleft'     => 'top-left',
		];

		$new_position = $position_map[ $curr_position ] ?? 'center-center';

		switch ( $hwp_type ) {
			case 'hwp-popup':
				$hwp_template = $this->_get_meta( 'hwp_template' );

				$template_map = [
					'hwp-template-0'        => $show_optin ? 'popup_standard' : 'popup_custom',
					'hwp-template-1'        => 'popup_standard',
					'hwp-template-2'        => 'popup_image_left',
					'hwp-template-3'        => 'popup_form_below',
					'hwp-template-4'        => 'popup_image_beside_text_top',
					'hwp-template-5'        => 'popup_full_image_background',
					'hwp-template-6'        => 'popup_standard',
					'hwp-template-progress' => 'popup_progress_bar',
				];

				$new_template = $template_map[ $hwp_template ] ?? 'popup_standard';
				break;
			case 'notification':
				$new_template = $show_optin ? 'notification_with_form' : 'notification';
				break;
			case 'holler-banner':
				$new_template = $show_optin ? 'banner_with_form' : 'banner_standard';

				if ( $image ) {
					$new_template = 'banner_with_form_image_right';
				}

				$new_position = 'top-left';
				break;
			case 'footer-bar':
				$new_template = $show_optin ? 'banner_with_form' : 'banner_standard';

				if ( $image ) {
					$new_template = 'banner_with_form_image_right';
				}

				$new_position = 'bottom-left';
				break;
			case 'popout':
				$new_template = 'sidebar_standard';
				$new_position = 'center-right';
				break;
			case 'fomo':
				$new_template = 'fomo';
				break;
			case 'chat':
				$new_template = 'fake_chat';
				break;
		}

		$this->update_setting( 'template', $new_template );
		$this->update_setting( 'position', $new_position );
		$this->update_setting( 'email_placeholder', $this->_get_meta( 'opt_in_placeholder' ) );
		$this->update_setting( 'success_message', $this->_get_meta( 'opt_in_confirmation' ) );

		if ( $image ) {
			$this->update_setting( 'image_src', $image );
		}

		$avatar_email = $this->_get_meta( 'avatar_email' );
		if ( $avatar_email ) {
			$this->_update_meta( 'avatar', get_avatar_url( $avatar_email ) );
		}

		$triggers     = [];
		$display_when = $this->_get_meta( 'display_when' );

		switch ( $display_when ) {
			case 'link':
				$triggers['element_click'] = [
					'enabled'          => true,
					'trigger_multiple' => 'multiple',
					'selector'         => sprintf( '.holler-show[data-id="%d"]', $this->ID )
				];
				break;
			case 'immediately':
				$triggers['on_page_load'] = [
					'enabled' => true,
					'delay'   => 0
				];
				break;
			case 'delay':
				$triggers['on_page_load'] = [
					'enabled' => true,
					'delay'   => absint( $this->_get_meta( 'scroll_delay' ) )
				];
				break;
			case 'scroll':
				$triggers['scroll_detection'] = [
					'enabled' => true,
					'depth'   => 50
				];
				break;
			case 'exit':
				$triggers['exit_intent'] = [
					'enabled' => true,
				];
				break;
		}

		$this->update_setting( 'triggers', $triggers );

		$exclude_rules  = [];
		$display_rules  = [];
		$advanced_rules = [];

		// Migrate show_on
		$show_on = $this->_get_meta( 'show_on' );

		// Just show on the entire site
		if ( $show_on === 'all' ) {
			$display_rules[] = [
				'uuid' => wp_generate_uuid4(),
				'type' => 'entire_site'
			];
		} else {

			$post_titles_to_ids = function ( $titles, $post_type ) {
				return array_map( function ( $title ) use ( $post_type ) {
					$post = get_page_by_title( $title, OBJECT, $post_type );

					return [
						'id'   => $post->ID,
						'text' => $post->post_title
					];
				}, $titles );
			};

			// Show/exclude on pages
			$pages         = $post_titles_to_ids( wp_parse_list( $this->_get_meta( 'show_on_pages' ) ), 'page' );
			$exclude_pages = $post_titles_to_ids( wp_parse_list( $this->_get_meta( 'hwp_show_exclude_pages' ) ), 'page' );

			if ( ! empty( $pages ) ) {
				$display_rules[] = [
					'uuid'     => wp_generate_uuid4(),
					'type'     => 'page',
					'selected' => $pages
				];
			}

			if ( ! empty( $exclude_pages ) ) {
				$exclude_rules[] = [
					'uuid'     => wp_generate_uuid4(),
					'type'     => 'page',
					'selected' => $pages
				];
			}

			// Show on posts
			$posts = $post_titles_to_ids( wp_parse_list( $this->_get_meta( 'hwp_show_on_posts' ) ), 'post' );

			if ( ! empty( $posts ) ) {
				$display_rules[] = [
					'uuid'     => wp_generate_uuid4(),
					'type'     => 'post',
					'selected' => $posts
				];
			}

			$term_names_to_terms = function ( $terms, $taxonomy ) {
				return array_map( function ( $term ) use ( $taxonomy ) {
					$term = get_term_by( 'name', $term, $taxonomy );

					return [
						'text' => $term->name,
						'id'   => $term->term_id
					];
				}, $terms );
			};

			// Show on tags
			$tags = $term_names_to_terms( wp_parse_list( $this->_get_meta( 'hwp_show_on_tags' ) ), 'post_tag' );

			if ( ! empty( $tags ) ) {
				$display_rules[] = [
					'uuid'     => wp_generate_uuid4(),
					'type'     => 'post_in_post_tag',
					'selected' => $tags
				];

				$display_rules[] = [
					'uuid'     => wp_generate_uuid4(),
					'type'     => 'post_tag_archive',
					'selected' => $tags
				];
			}

			// Show on categories
			$cats = $term_names_to_terms( wp_parse_list( $this->_get_meta( 'hwp_show_on_cats' ) ), 'category' );

			if ( ! empty( $cats ) ) {
				$display_rules[] = [
					'uuid'     => wp_generate_uuid4(),
					'type'     => 'post_in_category',
					'selected' => $cats
				];

				$display_rules[] = [
					'uuid'     => wp_generate_uuid4(),
					'type'     => 'category_archive',
					'selected' => $cats
				];
			}

			$post_types = wp_parse_list( $this->_get_meta( 'hwp_show_on_types' ) );

			if ( ! empty( $post_types ) ) {
				foreach ( $post_types as $post_type ) {
					$display_rules[] = [
						'uuid'     => wp_generate_uuid4(),
						'type'     => $post_type,
						'selected' => []
					];
				}
			}
		}

		$show_until = $this->_get_meta( 'hwp_until_date' );

		if ( $show_until ) {
			$expires                           = $this->_get_meta( 'expiration' );
			$advanced_rules['show_until_date'] = [
				'enabled' => boolval( $expires ),
				'date'    => $show_until
			];
		}

		$show_on_devices = $this->_get_meta( 'hwp_devices' );
		if ( $show_on_devices ) {
			$advanced_rules['show_on_x_devices'] = [
				'enabled' => $show_on_devices !== 'all',
				'device'  => str_replace( '_only', '', $show_on_devices )
			];
		}

		$show_to_logged_in = $this->_get_meta( 'logged_in' );

		if ( $show_to_logged_in ) {
			$advanced_rules['show_for_x_visitors'] = [
				'enabled' => true,
				'visitor' => $show_to_logged_in
			];
		}

		$show_to_new_or_returning = $this->_get_meta( 'new_or_returning' );

		if ( $show_to_new_or_returning ) {
			$advanced_rules['show_to_new_or_returning'] = [
				'enabled' => true,
				'visitor' => $show_to_logged_in
			];
		}

		$show_settings = $this->_get_meta( 'show_settings' );

		if ( $show_settings === 'interacts' ) {
			$advanced_rules['show_up_to_x_times'] = [
				'enabled' => true,
				'times'   => 1
			];

			$advanced_rules['hide_if_converted'] = [
				'enabled' => true,
			];
		}

		$this->update_setting( 'display_rules', $display_rules );
		$this->update_setting( 'exclude_rules', $exclude_rules );
		$this->update_setting( 'advanced_rules', $advanced_rules );

		$this->_commit_post_args();
	}

	/**
	 * Integrations upgrade path
	 *
	 * @return void
	 * @throws Exception
	 */
	public function maybe_upgrade_2_0_integrations() {

		$integrations = $this->_get_meta( 'integrations' );

		// If there are existing integrations, bugger off
		if ( ! empty( $integrations ) ) {
			return;
		}

		// Get the legacy email provider
		$email_provider = $this->_get_meta( 'email_provider' );

		if ( empty( $email_provider ) ) {
			return;
		}

		$integrations = [];

		if ( in_array( $email_provider, [ 'ac', 'mc', 'drip', 'mailpoet', 'ck' ] ) ) {

			if ( ! class_exists( 'Holler_Pro_CRMs' ) ) {

				// Pro not installed but using PRO integration
				// Remember this site is a legacy user
				Holler_Settings::instance()->update( 'is_legacy_user', true );

				// Quit now
				return;

			} else {

				switch ( $email_provider ) {
					case 'drip':
						// There were never any settings for Drip, kinda weird
						$integrations[] = [
							'type'    => 'drip',
							'account' => '',
							'key'     => '',
							'tags'    => []
						];
						break;
					case 'ac':

						$ac_key = get_option( 'hwp_ac_api_key' );
						$ac_url = get_option( 'hwp_ac_url' );
						$ac_acc = explode( '.', parse_url( $ac_url, PHP_URL_HOST ) )[0];

						$list_id = $this->_get_meta( 'ac_list_id' );

						$res = Holler_Pro_CRMs::activecampaign_v1( [
							'account'  => $ac_acc,
							'key'      => $ac_key,
							'endpoint' => 'list_view',
							'body'     => [
								'id' => $list_id
							]
						] );

						if ( is_wp_error( $res ) ) {
							break;
						}

						$integrations[] = [
							'type'    => 'activecampaign',
							'key'     => $ac_key,
							'account' => $ac_acc,
							'lists'   => [
								[
									'id'   => $list_id,
									'text' => $res->name
								]
							],
							'tags'    => []
						];
						break;
					case 'ck':

						$ck_key  = get_option( 'hwp_ck_api_key' );
						$form_id = $this->_get_meta( 'ck_id' );
						$res     = Holler_Pro_CRMs::convertkit( [
							'endpoint' => 'forms',
							'key'      => $ck_key,
							'method'   => 'GET',
						] );

						if ( is_wp_error( $res ) ) {
							break;
						}

						$forms = $res->forms;

						$form = array_filter( $forms, function ( $form ) use ( $form_id ) {
							return $form->id == $form_id;
						} );

						$integrations[] = [
							'type'  => 'convertkit',
							'key'   => $ck_key,
							'forms' => [
								[
									'id'   => $form_id,
									'text' => $form[0]->name
								]
							]
						];
						break;
					case 'mc':
						$mc_key = get_option( 'hwp_mc_api_key' );

						$list_id = $this->_get_meta( 'mc_list_id' );

						$res = Holler_Pro_CRMs::mailchimp( [
							'key'      => $mc_key,
							'endpoint' => 'lists/' . $list_id,
							'body'     => [
								'fields' => 'id,name'
							]
						] );

						if ( is_wp_error( $res ) ) {
							break;
						}

						$integrations[] = [
							'type'  => 'mailchimp',
							'key'   => $mc_key,
							'lists' => [
								[
									'id'   => $list_id,
									'text' => $res->name
								]
							],
							'tags'  => []
						];
						break;
					case 'mailpoet':

						if ( ! class_exists( '\MailPoet\API\API' ) ) {
							break;
						}

						$list_id = $this->_get_meta( 'mailpoet_list_id' );

						$api   = \MailPoet\API\API::MP( 'v1' );
						$lists = $api->getLists();

						$list = array_filter( $lists, function ( $list ) use ( $list_id ) {
							return $list['id'] == $list_id;
						} );

						$integrations[] = [
							'type'  => 'mailpoet',
							'lists' => [
								[
									'id'   => $list_id,
									'text' => $list[0]['name']
								]
							],
						];

						break;
				}
			}
		} else {

			$integrations[] = [
				'type'     => 'email',
				'to'       => [ $this->_get_meta( 'opt_in_send_to' ) ],
				'reply_to' => '{{email}}',
				'subject'  => get_option( 'hwp_email_title' ) ?: 'New HollerBox Submission',
				//language=HTML
				'content'  => "
<p>Form: <b>{$this->post_title}</b></p>
<p>Name: <b>{{name}}</b></p>
<p>Email: <b>{{email}}</b></p>",
			];
		}

		$this->update_setting( 'integrations', $integrations );
	}
}
