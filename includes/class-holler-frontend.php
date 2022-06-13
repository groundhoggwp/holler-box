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

	public function __construct() {
		add_action( 'wp', [ $this, 'get_active_popups' ] );
		add_action( 'wp_head', [ $this, 'popup_css' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
		add_filter( 'body_class', [ $this, 'body_classes' ], 10, 2 );
	}

	public function popup_css() {
		?>
		<style id="hollerbox-styles">
			<?php foreach ( $this->active as $popup ):

				$popup->output_css();

			endforeach;?>
		</style>
		<?php
	}

	public function enqueue_scripts() {

		wp_enqueue_style( 'hollerbox-popups', Holler_Box_URL . 'assets/css/popups.css' );
		wp_enqueue_script( 'hollerbox-popups', Holler_Box_URL . 'assets/js/popups.js', [], false, true );

		$l10n = [
			'active'      => $this->active,
			'is_preview'  => is_preview(),
			'is_frontend' => ! is_admin(),
			'routes'      => [
				'submit' => rest_url( 'hollerbox/submit' ),
			],
			'nonces'      => [
				'_wprest' => wp_create_nonce( 'wp_rest' )
			]
		];

		wp_localize_script( 'hollerbox-popups', 'HollerBox', $l10n );

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
	 * Find which popups are active for the current request
	 *
	 * @param $query
	 */
	public function get_active_popups() {

		$args = [ 'post_type' => 'hollerbox', 'posts_per_page' => - 1, 'post_status' => 'publish' ];

		// The Query
		$the_query = new WP_Query( $args );

		// The Loop
		if ( $the_query->have_posts() ) {

			while ( $the_query->have_posts() ) {
				$the_query->the_post();
				$id = get_the_id();

				$popup = new Holler_Popup( $id );

				if ( $popup->can_show() ) {
					$this->add_active( $popup );
				}
			}

			/* Restore original Post Data */
			wp_reset_postdata();
		}

	}


}
