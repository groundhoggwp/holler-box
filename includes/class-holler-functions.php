<?php
/**
 * Holler Box Functions
 * @since       0.1.0
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'Holler_Functions' ) ) {

    /**
     * Holler_Functions class
     *
     * @since       0.2.0
     */
    class Holler_Functions {

        /**
         * @var         Holler_Functions $instance The one true Holler_Functions
         * @since       0.2.0
         */
        private static $instance;
        public static $errorpath = '../php-error-log.php';
        public static $active = array();
        // sample: error_log("meta: " . $meta . "\r\n",3,self::$errorpath);

        /**
         * Get active instance
         *
         * @access      public
         * @since       0.2.0
         * @return      object self::$instance The one true Holler_Functions
         */
        public static function instance() {
            if( !self::$instance ) {
                self::$instance = new Holler_Functions();
                self::$instance->hooks();
            }

            return self::$instance;
        }


        /**
         * Include necessary files
         *
         * @access      private
         * @since       0.2.0
         * @return      void
         */
        private function hooks() {

            add_action('wp', array( $this, 'get_active_items' ) );
            add_action( 'wp_footer', array( $this, 'maybe_display_items' ) );
            add_action( 'wp_enqueue_scripts', array( $this, 'scripts_styles' ) );
            add_action( 'hwp_email_form', array( $this, 'email_forms' ) );

        }

        /**
         * Load scripts
         *
         * @since       0.1.0
         * @return      void
         */
        public function scripts_styles( $hook ) {

            // Use minified libraries if SCRIPT_DEBUG is turned off
            $suffix = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

            wp_enqueue_script( 'holler-js', Holler_Box_URL . 'assets/js/holler-frontend' . $suffix . '.js', array( 'jquery' ), Holler_Box_VER, true );
            wp_enqueue_style( 'holler-css', Holler_Box_URL . 'assets/css/holler-frontend' . $suffix . '.css', null, Holler_Box_VER );

            wp_localize_script( 'holler-js', 'hollerVars', $this->get_localized_vars()
            );

        }

        /**
         * Return localized vars from settings
         *
         * @since       0.1.0
         * @return      array()
         */
        public function get_localized_vars() {

            $array = array();

            $array['ajaxurl'] = admin_url( 'admin-ajax.php' );

            $array['hwpNonce'] = wp_create_nonce('holler-box');

            // @TODO: if( setting exists )
            // $array['lastSeen'] = 'none'; // in days. default is none

            $array['expires'] = '999'; // how long we should show this in num days

            // active notification IDs
            $array['active'] = self::$active;

            foreach (self::$active as $key => $value) {

                $content_post = get_post($value);
                $content = $content_post->post_content;
                // adding the_content filter has crazy results, like CK forms
                $content = apply_filters('hollerbox_content', $content, $value );
                $content = do_shortcode( $content );
                // $content = apply_filters('the_content_more_link', $content);
                $content = str_replace(']]>', ']]&gt;', $content);

                $array[$value] = array( 
                    'content' => $content,
                    'showEmail' => get_post_meta($value, 'show_optin', 1),
                    'showChat' => get_post_meta( $value, 'show_chat', 1 ),
                    'emailProvider' => get_post_meta( $value, 'email_provider', 1 ),
                    'ckApi' => get_option( 'hwp_ck_api_key' ),
                    'visitor' => get_post_meta($value, 'new_or_returning', 1),
                    'hideBtn' => get_post_meta($value, 'hide_btn', 1),
                    'optinMsg' => get_post_meta($value, 'opt_in_message', 1),
                    'placeholder' => get_post_meta($value, 'opt_in_placeholder', 1),
                    'confirmMsg' => get_post_meta($value, 'opt_in_confirmation', 1),
                    'display_when' => get_post_meta($value, 'display_when', 1),
                    'delay' => get_post_meta($value, 'scroll_delay', 1),
                    'showSettings' => get_post_meta($value, 'show_settings', 1),
                    'hideForDays' => get_post_meta($value, 'hide_for_days', 1),
                    'hide_after' => get_post_meta($value, 'hide_after', 1),
                    'hide_after_delay' => get_post_meta($value, 'hide_after_delay', 1),
                    'bgColor' => get_post_meta($value, 'bg_color', 1),
                    'btnColor1' => get_post_meta($value, 'button_color1', 1),
                    'position' => get_post_meta($value, 'position', 1)
                );
            }

            return $array;
        }

        /**
         * Show the box
         *
         * @since       0.1.0
         * @return      HTML
         */
        public function maybe_display_items() {

            // do checks for page conditionals, logged in, etc here

            $continue = false;
            $post_id = get_the_ID();

            foreach (self::$active as $key => $value) {

                $should_expire = get_post_meta( $value, 'expiration', 1 );
                $expiration = get_post_meta( $value, 'hwp_until_date', 1 );

                if( $should_expire === '1' && !empty( $expiration ) ) {
                    // check if we've passed expiration date
                    if( strtotime('now') >= strtotime( $expiration ) ) {
                        delete_post_meta( $value, 'hwp_active' );
                        $continue = true;
                    }
                }

                $logged_in = is_user_logged_in();
                $logged_in_meta = get_post_meta( $value, 'logged_in', 1 );

                // check logged in conditional
                if( $logged_in && $logged_in_meta === 'logged_out' || !$logged_in && $logged_in_meta === 'logged_in' )
                    $continue = true;

                // if continue is true, that means we do not display this notification. $value is holler box id
                $continue = apply_filters( 'hwp_display_notification', $continue, $value, $post_id  );

                if( $continue === true )
                    continue;

                $this->display_notification_box( $value );
            }

        }

        /**
         * Loop through items, store active items in self::$active[] for later use
         *
         * @since       0.1.0
         * @return      HTML
         */
        public function get_active_items() {

            $args = array( 'post_type' => 'hollerbox' );
            // The Query
            $the_query = new WP_Query( $args );

            // The Loop
            if ( $the_query->have_posts() ) {

                while ( $the_query->have_posts() ) {
                    $the_query->the_post();
                    $id = get_the_id();
                    if( get_post_meta( $id, 'hwp_active', 1 ) != '1' )
                        continue;

                    self::$active[] = strval( $id );

                }

                /* Restore original Post Data */
                wp_reset_postdata();
            }

        }

        /**
         * Output notification markup
         *
         * @since       0.1.0
         * @return      HTML
         */
        public function display_notification_box( $id ) {

            $avatar_email = get_post_meta($id, 'avatar_email', 1);
            ?>
            <style type="text/css">
            #hwp-<?php echo $id; ?>, #hwp-<?php echo $id; ?> a, #hwp-<?php echo $id; ?> i { color: <?php echo get_post_meta( $id, 'text_color', 1 ); ?>; }
            </style>

            <?php if( get_post_meta( $id, 'position', 1 ) != 'holler-banner' ) : ?>
            <div id="hwp-floating-btn" data-id="<?php echo $id; ?>" class="<?php echo get_post_meta( $id, 'position', 1 ); ?>"><i class="icon icon-chat"></i></div>
            <?php endif; ?>

            <div id="hwp-<?php echo $id; ?>" class="holler-box hwp-hide <?php echo get_post_meta( $id, 'position', 1 ); ?>">

                <div class="holler-inside">
                
                <div class="hwp-close"><i class="icon icon-cancel"></i></div>

                <?php do_action('hollerbox_above_content', $id); ?>
                
                <div class="hwp-box-rows">
                        <?php if( !empty($avatar_email) ) echo get_avatar( apply_filters( 'hwp_avatar_email', $avatar_email, $id), 50 ); ?>
                    <div class="hwp-row hwp-first-row"></div>
                </div>

                <div class="hwp-row hwp-note-optin hwp-email-row hwp-hide">
                    <?php do_action('hwp_email_form', $id); ?>
                </div>
                
                <div class="hwp-chat hwp-hide">
                    
                    <div class="hwp-row hwp-text">
                        <input type="text" class="hwp-text-input" placeholder="Type your message" />
                        <i class="icon icon-mail"></i>
                    </div>
                </div>

                <?php do_action('hollerbox_below_content', $id); ?>

                <?php 

                $powered_by = get_option( 'hwp_powered_by' );

                if( empty( $powered_by ) ) : ?>
                    <span class="hwp-powered-by"><a href="http://hollerwp.com" target="_blank">Holler Box</a></span>
                <?php endif; ?>

                </div>
 
            </div>
            <?php
        }

        /**
         * Handle different email provider forms
         *
         * @since       0.1.0
         * @return      array()
         */
        public function email_forms( $id ) {

            $provider = get_post_meta( $id, 'email_provider', 1 );

            $mc_list_id = get_post_meta( $id, 'mc_list_id', 1 );

            $mc_url = get_post_meta( $id, 'mc_url', 1 );

            if( $mc_url && empty( $mc_list_id ) && is_user_logged_in() ) {
                echo 'Site admin: please update your MailChimp settings.';
            }

            if( $provider === 'custom' ) {

                echo get_post_meta( $id, 'custom_email_form', 1 );

            } else {

                if( $provider === 'ck' ) {
                    echo '<input type="hidden" class="ck-form-id" value="' . get_post_meta( $id, 'ck_id', 1 ) . '" />';
                } elseif( $provider === 'mc' && !empty( $mc_list_id ) ) {
                    echo '<input type="hidden" class="mc-list-id" value="' . get_post_meta( $id, 'mc_list_id', 1 ) . '" />';
                }
                ?>
                <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="hwp_hp" tabindex="-1" value=""></div>
                <input type="email" name="email" class="hwp-email-input" placeholder="Enter email" autocomplete="on" autocapitalize="off" />
                <button class="hwp-email-btn"><?php echo _e('Send', 'hollerbox' ); ?></button>
                <?php
            }
        }

    }

    $holler_Functions = new Holler_Functions();
    $holler_Functions->instance();

} // end class_exists check