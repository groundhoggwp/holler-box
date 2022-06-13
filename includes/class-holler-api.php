<?php

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


class Holler_Api {

	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'init' ] );
	}

	public function init() {

		register_rest_route( 'hollerbox', 'popup/(?P<popup_id>\d+)', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'read' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'update' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
			[
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'delete' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			],
		] );

		register_rest_route( 'hollerbox', 'submit/(?P<popup_id>\d+)', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'submit' ],
				'permission_callback' => '__return_true'
			]
		] );

		register_rest_route( 'hollerbox', 'options', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'read_options' ],
				'permission_callback' => [ $this, 'permission_callback' ]
			]
		] );
	}

	/**
	 * Standard 404 message
	 *
	 * @return WP_Error
	 */
	protected static function ERROR_404() {
		return new WP_Error( 'missing', 'Popup not found.', [ 'status' => 404 ] );
	}

	/**
	 * Submit a form for a specific popup
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function submit( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		$lead = new Holler_Lead( $request );

		$response = $popup->submit( $lead );

		return rest_ensure_response( $response );
	}

	/**
	 * Update a popup with some specific settings
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		return rest_ensure_response( $popup );
	}

	/**
	 * Update a popup with some specific settings
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update( WP_REST_Request $request ) {

		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		$new_settings = $request->get_json_params();

		$popup->update( $new_settings );

		return rest_ensure_response( $popup );
	}

	/**
	 * Delete a popup
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function delete( WP_REST_Request $request ) {
		$id = absint( $request->get_param( 'popup_id' ) );

		$popup = new Holler_Popup( $id );

		if ( ! $popup->exists() ) {
			return self::ERROR_404();
		}

		$popup->delete();

		return rest_ensure_response( [ 'success' => true ] );
	}

	/**
	 * Get options for the display condition pickers
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response
	 */
	public function read_options( WP_REST_Request $request ) {

		$search  = $request->get_param( 'search' );
		$options = [];

		if ( $post_type = $request->get_param( 'post_type' ) ) {

			$posts = get_posts( [
				'numberposts' => 30,
				'post_type'   => $post_type,
				's'           => $search,
			] );

			$options = array_map( function ( $post ) {
				return [ 'id' => $post->ID, 'text' => $post->post_title ];
			}, $posts );
		}

		if ( $taxonomy = $request->get_param( 'taxonomy' ) ) {

			$terms = get_terms( [
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'search'     => $search,
				'number'     => 30
			] );

			$options = array_map( function ( $term ) {
				return [ 'id' => $term->term_id, 'text' => $term->name ];
			}, $terms );
		}

		return rest_ensure_response( $options );

	}

	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

}