<?php


// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


/**
 * Holler_Functions class
 *
 * @since       0.2.0
 */
class Holler_Frontend {

	/**
	 * @var Holler_Popup[]
	 */
	protected $active = [];

	public function is_builder_preview() {
		return isset( $_GET['suppress_hollerbox'] ) && current_user_can( 'edit_popups' );
	}

	public function __construct() {
		add_action( 'wp', [ $this, 'get_active_popups' ] );
		add_action( 'wp_head', [ $this, 'popup_css' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
		add_filter( 'body_class', [ $this, 'body_classes' ], 10, 2 );
	}

	public function popup_css() {

		if ( $this->is_builder_preview() ):
			?>
            <style id="hollerbox-builder-styles"></style>
		<?php
		endif;

		?>
        <style id="hollerbox-frontend-styles">

            .no-click {
                cursor: not-allowed;
                /*pointer-events: none;*/
            }

            <?php foreach ( $this->active as $popup ):

				$popup->output_css();

			endforeach;?>
        </style>
		<?php
	}

	public function enqueue_scripts() {

		wp_enqueue_style( 'hollerbox-popups', Holler_Box_URL . 'assets/css/popups.css', [], time() );
		wp_enqueue_script( 'hollerbox-popups', Holler_Box_URL . 'assets/js/popups.js', [], time(), true );

		$l10n = [
			'active'             => array_map( function ( $popup ) {
                $popup = $popup->jsonSerialize();

                // Remove secret properties
                unset( $popup[ 'integrations' ] );

                return $popup;
            }, $this->active ),
			'home_url'           => home_url(),
			'is_preview'         => is_preview(),
			'is_frontend'        => ! is_admin(),
			'is_builder_preview' => $this->is_builder_preview(),
			'routes'             => [
				'root'       => rest_url( 'hollerbox' ),
				'conversion' => rest_url( 'hollerbox/conversion' ),
				'impression' => rest_url( 'hollerbox/impression' ),
				'submit'     => rest_url( 'hollerbox/submit' ),
			],
			'nonces'             => [
				'_wprest' => wp_create_nonce( 'wp_rest' )
			],
			'settings'           => [
				'credit_disabled' => Holler_Settings::instance()->get( 'credit_disabled' ),
				'gdpr_enabled'    => Holler_Settings::instance()->get( 'gdpr_enabled' ),
				'gdpr_text'       => Holler_Settings::instance()->get( 'gdpr_text' ),
			]
		];

		do_action( 'hollerbox/scripts' );

		wp_add_inline_script( 'hollerbox-popups', "HollerBox = " . wp_json_encode( $l10n ), 'before' );

	}

	/**
	 * Add popup classes to the main body
	 *
	 * @param $classes
	 * @param $class
	 *
	 * @return array|mixed
	 */
	public function body_classes( $classes, $class ) {

		foreach ( $this->active as $popup ) {
			$classes = array_merge( $classes, $popup->get_body_classes() );
		}

		return $classes;
	}

	/**
	 * @param $popup Holler_Popup
	 */
	protected function add_active( $popup ) {
		$this->active[] = $popup;
	}

	/**
	 * There are active popups on this page
	 *
	 * @return bool
	 */
	public function has_active() {
		return ! empty( $this->active );
	}

	/**
	 * Find which popups are active for the current request
	 *
	 * @param $query
	 */
	public function get_active_popups() {


		if ( $this->is_builder_preview() ) {

			// hide admin bar
			add_filter( 'show_admin_bar', '__return_false' );

			// prevent query monitor output in preview
			add_filter( 'qm/process', '__return_false' );

			// Suppress popups from being displayed
			return;
		}

		$args = [ 'post_type' => 'hollerbox', 'posts_per_page' => - 1, 'post_status' => 'publish' ];

		// The Query
		$the_query = new WP_Query( $args );
		$popups    = [];

		// The Loop
		if ( $the_query->have_posts() ) {

			while ( $the_query->have_posts() ) {
				$the_query->the_post();
				$id = get_the_id();

				$popup = new Holler_Popup( $id );

				$popups[] = $popup;
			}

			/* Restore original Post Data */
			wp_reset_postdata();
		}

		// only show active popups for the current query
		foreach ( $popups as $popup ) {
			if ( $popup->can_show() ) {
				$this->add_active( $popup );
			}
		}

		if ( $this->has_active() && ! $this->is_builder_preview() ) {
			add_action( 'admin_bar_menu', [ $this, 'holler_box_menu_item' ], 99 );
		}

	}

	/**
	 * Add HollerBox menu item to admin bar
	 *
	 * @param $wp_admin_bar WP_Admin_Bar
	 *
	 * @return void
	 */
	public function holler_box_menu_item( $wp_admin_bar ) {

		if ( ! $this->has_active() ) {
			return;
		}

		$wp_admin_bar->add_node( [
			'id'    => 'manage-hollerbox',
			'title' => '<svg width="20" height="20" style="padding-top: 5px;" xmlns="http://www.w3.org/2000/svg" viewBox="75.3 55.7 134.4 152.3">
            <path fill="#e8ad0b" d="m144 137-49-29v53l49 28 50-28v-53Zm0 43-18-10v-7l18 10Zm0-14-18-10v-8l18 11Z"/>
            <path fill="#e8ad0b" d="m190 102-46-26-45 26 45 26 46-26z"/>
            <path fill="" d="m126 170 18 10v-7l-18-10v7zm18-11-18-11v8l18 10v-7z"/>
            <path fill="#fff"
                    d="m190 102-46 26-45-26-9-5 57-33 43 26 7-5-50-29-72 41 20 11 49 29 50-29 8-5v63l-58 33-35-20-11 8v-14l-14-9v-48l-7-5v58l14 8v26l18-15 35 20 66-38V90l-20 12z"/>
        </svg>'
		] );

		foreach ( $this->active as $popup ) {

			$wp_admin_bar->add_node( [
				'parent' => 'manage-hollerbox',
				'id'     => 'holler-' . $popup->ID,
				'title'  => $popup->post_title,
				'href'   => get_edit_post_link( $popup->ID )
			] );

		}

	}


}
