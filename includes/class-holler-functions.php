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

            add_action( 'wp', array( $this, 'get_active_items' ) );
            add_action( 'wp_footer', array( $this, 'maybe_display_items' ) );
            add_action( 'wp_enqueue_scripts', array( $this, 'scripts_styles' ) );
            add_action( 'hwp_email_form', array( $this, 'email_forms' ) );

            add_filter( 'hollerbox_classes', array( $this, 'add_hb_classes'), 10, 2 );

            add_action( 'init', array( $this, 'preview_box' ) );

        }

        /**
         * Load scripts
         *
         * @since       0.1.0
         * @return      void
         */
        public function scripts_styles( $hook ) {

            if( ! empty( self::$active ) ) {

                // Use minified libraries if SCRIPT_DEBUG is turned off
                $suffix = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

                wp_enqueue_script( 'holler-js', Holler_Box_URL . 'assets/js/holler-frontend' . $suffix . '.js', array( 'jquery' ), Holler_Box_VER, true );
                wp_enqueue_style( 'holler-css', Holler_Box_URL . 'assets/css/holler-frontend' . $suffix . '.css', null, Holler_Box_VER );

                wp_localize_script( 'holler-js', 'hollerVars', $this->get_localized_vars() );

            }

        }

        /**
         * Return localized vars from settings
         *
         * @since       0.1.0
         * @return      array
         */
        public function get_localized_vars() {

            $array = array();

            $array['ajaxurl'] = admin_url( 'admin-ajax.php' );

            $array['pluginUrl'] = Holler_Box_URL;

            $array['hwpNonce'] = wp_create_nonce('holler-box');

            // @TODO: if( setting exists )
            // $array['lastSeen'] = 'none'; // in days. default is none

            $array['expires'] = '999'; // how long we should show this in num days

            $array['isMobile'] = wp_is_mobile();

            $array['disable_tracking'] = get_option('hwp_disable_tracking');

            // active notification IDs
            $array['active'] = self::$active;

            $array['emailErr'] = __( 'Please enter a valid email address.', 'holler-box' );

            foreach (self::$active as $key => $post_id) {

                $type = get_post_meta( $post_id, 'hwp_type', 1 );

                $array[$post_id] = array(
                    'type' => $type,
                    'showEmail' => get_post_meta($post_id, 'show_optin', 1),
                    'showChat' => ( $type === 'chat' ? '1' : '' ),
                    'emailProvider' => get_post_meta( $post_id, 'email_provider', 1 ),
                    'redirect' => get_post_meta( $post_id, 'hwp_redirect', 1 ),
                    'ckApi' => get_option( 'hwp_ck_api_key' ),
                    'visitor' => get_post_meta($post_id, 'new_or_returning', 1),
                    'hideBtn' => get_post_meta($post_id, 'hide_btn', 1),
                    'optinMsg' => get_post_meta($post_id, 'opt_in_message', 1),
                    'placeholder' => get_post_meta($post_id, 'opt_in_placeholder', 1),
                    'confirmMsg' => get_post_meta($post_id, 'opt_in_confirmation', 1),
                    'display_when' => get_post_meta($post_id, 'display_when', 1),
                    'delay' => get_post_meta($post_id, 'scroll_delay', 1),
                    'showSettings' => get_post_meta($post_id, 'show_settings', 1),
                    'hideForDays' => get_post_meta($post_id, 'hide_for_days', 1),
                    'hide_after' => get_post_meta($post_id, 'hide_after', 1),
                    'hide_after_delay' => get_post_meta($post_id, 'hide_after_delay', 1),
                    'devices' => get_post_meta($post_id, 'hwp_devices', 1),
                    'bgColor' => get_post_meta($post_id, 'bg_color', 1),
                    'btnColor1' => get_post_meta($post_id, 'button_color1', 1),
                    'position' => get_post_meta($post_id, 'position', 1)
                );

                $array[$post_id] = apply_filters( 'hwp_localized_vars', $array[$post_id], $post_id );

            }

            return $array;
        }

        /**
         * Show the box
         *
         * @since       0.1.0
         * @return      string
         */
        public function maybe_display_items() {

            // do checks for page conditionals, logged in, etc here
            // if any of the checks are true, we show it
            $post_id = ( is_category() ? 0 : get_queried_object_id() );
            $logged_in = is_user_logged_in();

            foreach (self::$active as $key => $box_id) {

                $show_it = false;

                $should_expire = get_post_meta( $box_id, 'expiration', 1 );
                $expiration = get_post_meta( $box_id, 'hwp_until_date', 1 );

                if( $should_expire === '1' && !empty( $expiration ) ) {
                    // check if we've passed expiration date
                    if( strtotime('now') >= strtotime( $expiration ) ) {
                        delete_post_meta( $box_id, 'hwp_active' );
                        $show_it = true;
                    }
                }

                $logged_in_meta = get_post_meta( $box_id, 'logged_in', 1 );

                // check logged in conditional
                if( $logged_in && $logged_in_meta === 'logged_out' || !$logged_in && $logged_in_meta === 'logged_in' )
                    continue;

                $show_on = get_post_meta( $box_id, 'show_on', 1 );

                $show_on_pages = get_post_meta( $box_id, 'show_on_pages', 1 );

                /*
                 * this is deprecated since 0.5.1, handle backwards compat
                 */
                if( is_array( $show_on ) && in_array( $post_id, $show_on ) ) {
                    $show_it = true;
                }
                /* end deprecated */

                // check if we should show on current page by id
                if( $show_on === 'limited' && !empty( $show_on_pages ) ) {

                    // turn titles into array of ids
                    $arr = self::titles_to_ids( $show_on_pages );

                    if( in_array( $post_id, $arr ) )
                        $show_it = true;

                } elseif ( $show_on === 'all' ) {

                    $show_it = true;

                }

                // if show_it is true, that means we display this notification. $box_id is holler box id
                $show_it = apply_filters( 'hwp_display_notification', $show_it, $box_id, $post_id  );

                if( $show_it === false )
                    continue;

                self::$instance->show_box_types( $box_id );

            }

        }

        /**
         * Show box based on what type it is
         *
         */
        public function show_box_types( $box_id ) {

            $type = get_post_meta( $box_id, 'hwp_type', 1 );

            if( $type === 'hwp-popup' ) {
                $this->display_popup( $box_id );
            } elseif ( $type === 'footer-bar' ) {
                $this->display_footer_bar( $box_id );
            } else {
                $this->display_notification_box( $box_id );
            }

        }

        /**
         * Loop through items, store active items in self::$active[] for later use
         *
         * @since       0.1.0
         * @return      void
         */
        public function get_active_items() {

            $args = array( 'post_type' => 'hollerbox', 'posts_per_page'=> -1 );
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
         * @param       int $id
         * @return      string
         */
        public function display_notification_box( $id ) {

            $avatar_email = get_post_meta($id, 'avatar_email', 1);
            $type = get_post_meta( $id, 'hwp_type', 1 );
            $bg_color = esc_html( get_post_meta( $id, 'bg_color', 1 ) );
            $btn_color = esc_html( get_post_meta( $id, 'button_color1', 1 ) );
            ?>
            <style type="text/css">
            #hwp-<?php echo intval( $id ); ?>, #hwp-<?php echo intval( $id ); ?> a, #hwp-<?php echo intval( $id ); ?> i, #hwp-<?php echo intval( $id ); ?> .holler-inside { color: <?php echo esc_html( get_post_meta( $id, 'text_color', 1 ) ); ?> !important; }
            #hwp-<?php echo intval( $id ); ?>, #hwp-<?php echo intval( $id ); ?> .hwp-row { background-color: <?php echo $bg_color; ?> }
            #hwp-<?php echo intval( $id ); ?> .hwp-email-btn, .hwp-floating-btn.hwp-btn-<?php echo intval( $id ); ?> { background-color: <?php echo $btn_color; ?>; }
            </style>

            <?php if( $type != 'holler-banner' && $type != 'fomo' ) : ?>
            <div data-id="<?php echo esc_attr( $id ); ?>" class="hwp-floating-btn hwp-btn-<?php echo esc_attr( $id ); ?> <?php echo esc_attr( get_post_meta( $id, 'position', 1 ) ); ?>"><i class="icon icon-chat"></i></div>
            <?php endif; ?>

            <div id="hwp-<?php echo esc_attr( $id ); ?>" class="holler-box hwp-hide <?php echo apply_filters( 'hollerbox_classes', '', $id ); ?>">

                <div class="holler-inside">

                    <div class="hwp-close"><i class="icon icon-cancel"></i></div>

                    <?php do_action('hollerbox_above_content', $id); ?>

                    <div class="hwp-box-rows">

                        <?php if( !empty($avatar_email) ) echo get_avatar( apply_filters( 'hwp_avatar_email', $avatar_email, $id), 50 ); ?>

                        <div class="hwp-row hwp-first-row">

                            <?php echo self::get_box_content( $id ); ?>

                        </div>

                    </div>

                <div class="hwp-row hwp-note-optin hwp-email-row hwp-hide">
                    <?php do_action('hwp_email_form', $id); ?>
                </div>

                <div class="hwp-chat hwp-hide">

                    <div class="hwp-row hwp-text">
                        <input type="text" class="hwp-text-input" placeholder="<?php _e( 'Type your message', 'holler-box' ); ?>" />
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
         * Output popup markup
         *
         * @since       1.0.0
         * @param       int $id
         * @return      string
         */
        public function display_popup( $id ) {

            $img_url = get_post_meta( $id, 'popup_image', 1 );
            $template = get_post_meta( $id, 'hwp_template', 1 );
            $img = ( !empty( $img_url ) ? $img_url : Holler_Box_URL . 'assets/img/ebook-mockup-300.png' );
            $bg_color = esc_html( get_post_meta( $id, 'bg_color', 1 ) );

            ?>

            <style type="text/css">
            #hwp-<?php echo intval( $id ); ?>, #hwp-<?php echo intval( $id ); ?> a, #hwp-<?php echo intval( $id ); ?> i, #hwp-<?php echo intval( $id ); ?> .holler-inside, #hwp-<?php echo intval( $id ); ?> .holler-title { color: <?php echo esc_html( get_post_meta( $id, 'text_color', 1 ) ); ?> !important; }
            #hwp-<?php echo intval( $id ); ?>.hwp-template-4 { border-top-color: <?php echo esc_html( get_post_meta( $id, 'button_color1', 1 ) ); ?>; }
            #hwp-<?php echo intval( $id ); ?>, #hwp-<?php echo intval( $id ); ?> .hwp-first-row { background-color: <?php echo $bg_color; ?> }
            #hwp-<?php echo intval( $id ); ?> .hwp-email-btn, #hwp-<?php echo intval( $id ); ?> .hwp-progress > span, #hwp-<?php echo intval( $id ); ?> .hwp-email-btn { background-color: <?php echo esc_html( get_post_meta( $id, 'button_color1', 1 ) ); ?> }
            <?php if( $template === 'hwp-template-5' ) : ?>
            #hwp-<?php echo intval( $id ); ?>.hwp-template-5 { background: url( <?php echo '"' . esc_url( $img ) . '"'; ?> ) no-repeat center; background-size: cover; }
            <?php endif; ?>
            <?php if( $template === 'hwp-template-6' && $bg_color ) : ?>
            #hwp-<?php echo intval( $id ); ?>.hwp-template-6 .hwp-email-row:before { border-color: <?php echo $bg_color; ?> transparent transparent transparent; }
            <?php endif; ?>
            </style>

            <div id="hwp-bd-<?php echo esc_attr( $id ); ?>" data-id="<?php echo esc_attr( $id ); ?>" class="hwp-backdrop hwp-hide"></div>

            <div id="hwp-<?php echo esc_attr( $id ); ?>" class="holler-box hwp-hide <?php echo apply_filters( 'hollerbox_classes', '', $id ); ?>">

            <?php self::get_popup_template( $template, $id, $img ); ?>

            </div>
            <?php
        }

        /**
         * Returns the desired template markup
         *
         * @since       1.0.0
         * @param       int $id
         * @return      string
         */
        public function get_popup_template( $template, $id, $img ) {

            ?>

            <?php if( $template === 'hwp-template-progress' ) : ?>
                <div class="hwp-progress">
                  <span style="width: 50%"></span>
                </div>
                <span class="hwp-progress-text"><?php _e( '50% Complete', 'holler-box' ); ?></span>
            <?php endif; ?>

            <div class="hwp-popup-inside">

                <?php if( $template === 'hwp-template-2' || $template === 'hwp-template-progress' ) : ?>
                    <div class="hwp-img-wrap">
                        <img src="<?php echo $img; ?>" class="hwp-popup-image" />
                    </div>
                <?php endif; ?>

                <div class="holler-inside">

                <div class="hwp-close"><i class="icon icon-cancel"></i></div>

                <?php if( $template === 'hwp-template-3' ) : ?>
                    <div class="hwp-img-wrap">
                        <img src="<?php echo $img; ?>" class="hwp-popup-image" />
                    </div>
                <?php endif; ?>

                <h2 class="holler-title"><?php echo get_the_title( $id ); ?></h2>

                <?php do_action('hollerbox_above_content', $id); ?>

                <div class="hwp-row hwp-first-row">

                    <?php echo self::get_box_content( $id ); ?>

                </div>

                <?php if( $template === 'hwp-template-4' ) : ?>
                    <div class="hwp-img-wrap">
                        <img src="<?php echo $img; ?>" class="hwp-popup-image" />
                    </div>
                <?php endif; ?>

                <div class="hwp-row hwp-note-optin hwp-email-row hwp-hide">
                    <?php do_action('hwp_email_form', $id); ?>
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
         * Output footer bar markup
         *
         * @since       1.0.1
         * @param       int $id
         * @return      string
         */
        public function display_footer_bar( $id ) {

            $img_url = get_post_meta( $id, 'popup_image', 1 );
            $img = ( !empty( $img_url ) ? $img_url : Holler_Box_URL . 'assets/img/ebook-mockup-cropped.png' );
            $bg_color = esc_html( get_post_meta( $id, 'bg_color', 1 ) );
            $btn_color = esc_html( get_post_meta( $id, 'button_color1', 1 ) );
            ?>

            <style type="text/css">
            #hwp-<?php echo intval( $id ); ?>, #hwp-<?php echo intval( $id ); ?> a, #hwp-<?php echo intval( $id ); ?> i, #hwp-<?php echo intval( $id ); ?> .holler-inside, #hwp-<?php echo intval( $id ); ?> .holler-title { color: <?php echo esc_html( get_post_meta( $id, 'text_color', 1 ) ); ?> !important; }
            #hwp-<?php echo intval( $id ); ?>.hwp-template-4 { border-top-color: <?php echo $btn_color; ?>; }
            #hwp-<?php echo intval( $id ); ?> .hwp-email-btn { background-color: <?php echo $btn_color; ?>; }
            #hwp-<?php echo intval( $id ); ?>, #hwp-<?php echo intval( $id ); ?> .hwp-first-row { background-color: <?php echo $bg_color; ?> }
            </style>

            <div id="hwp-<?php echo esc_attr( $id ); ?>" class="holler-box hwp-hide <?php echo apply_filters( 'hollerbox_classes', '', $id ); ?>">

                <div class="holler-inside">

                    <div class="hwp-img-wrap">
                        <img src="<?php echo $img; ?>" class="hwp-popup-image" />
                    </div>

                    <div class="hwp-close"><i class="icon icon-cancel"></i></div>

                    <div class="hwp-content-wrap">

                        <?php do_action('hollerbox_above_content', $id); ?>

                        <h2 class="holler-title"><?php echo get_the_title( $id ); ?></h2>

                        <div class="hwp-row hwp-first-row">

                            <?php echo self::get_box_content( $id ); ?>

                        </div>

                    </div>

                    <div class="hwp-row hwp-note-optin hwp-email-row hwp-hide">
                        <?php do_action('hwp_email_form', $id); ?>
                    </div>

                    <?php do_action('hollerbox_below_content', $id); ?>

                </div>

            </div>
            <?php
        }

        /**
         * Display box content
         * Content was added dynamically with Javscript prior to 1.1.0, now it's echoed with PHP to maximize compatibility.
         *
         * @since       1.1.0
         * @param       int $id
         * @return      string
         */
        public static function get_box_content( $id ) {

            $post_content = get_post($id);
            $content = $post_content->post_content;
            $content = apply_filters('hollerbox_content', $content, $id );
            return do_shortcode( $content );

        }

        /**
         * Handle different email provider forms
         *
         * @since       0.1.0
         * @param       int $id
         * @return      string
         */
        public function email_forms( $id ) {

            $provider = get_post_meta( $id, 'email_provider', 1 );

            $mc_list_id = esc_attr( get_post_meta( $id, 'mc_list_id', 1 ) );

            $mc_url = get_post_meta( $id, 'mc_url', 1 );

            $ac_list_id = esc_attr( get_post_meta( $id, 'ac_list_id', 1 ) );

            $drip_tags = esc_html( get_post_meta( $id, 'drip_tags', 1 ) );

            $submit_text = get_post_meta( $id, 'submit_text', 1 );
            $btn_text = ( !empty( $submit_text ) ? $submit_text : 'Send' );

            if( $mc_url && empty( $mc_list_id ) && is_user_logged_in() ) {
                echo 'Site admin: please update your MailChimp settings.';
            }

            if( $provider === 'custom' ) {

                echo get_post_meta( $id, 'custom_email_form', 1 );

            } else {

                if( $provider === 'ck' ) {
                    echo '<input type="hidden" class="ck-form-id" value="' . esc_attr( get_post_meta( $id, 'ck_id', 1 ) ) . '" />';
                } elseif( $provider === 'mc' && !empty( $mc_list_id ) ) {
                    echo '<input type="hidden" class="mc-list-id" value="' . $mc_list_id . '" />';
                    echo '<input type="hidden" class="mc-interests" value=' . json_encode( get_post_meta( $id, 'mc_interests', 1 ) ) . ' />';
                } elseif( $provider === 'mailpoet' ) {
                    echo '<input type="hidden" class="mailpoet-list-id" value="' . esc_attr( get_post_meta( $id, 'mailpoet_list_id', 1 ) ) . '" />';
                } elseif( $provider === 'ac' && !empty( $ac_list_id ) ) {
                    echo '<input type="hidden" class="ac-list-id" value="' . $ac_list_id . '" />';
                } elseif( $provider === 'drip' && !empty( $drip_tags ) ) {
                    echo '<input type="hidden" class="drip-tags" value="' . $drip_tags . '" />';
                }
                ?>
                <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="hwp_hp" tabindex="-1" value=""></div>

                <?php self::name_row( $id ); ?>

                <input type="email" name="email" class="hwp-email-input <?php if( get_post_meta( $id, 'dont_show_name', 1 ) === '1' ) echo 'no-name'; ?>" placeholder="<?php _e( 'Enter email', 'holler-box' ); ?>" autocomplete="on" autocapitalize="off" />
                <button class="hwp-email-btn"><?php echo $btn_text; ?></button>
                <?php
            }
        }

        /**
         * Email form name
         *
         * @since       1.0.0
         * @param       int $id
         * @return      string
         */
        public function name_row( $id ) {

            $type = get_post_meta( $id, 'hwp_type', 1 );

            if( get_post_meta( $id, 'dont_show_name', 1 ) === '1' || $type != 'hwp-popup' && $type != 'popout' )
                return;

            ?>
            <input type="text" placeholder="<?php echo esc_attr( get_post_meta( $id, 'name_placeholder', 1 ) ); ?>" class="hwp-name" />
            <?php
        }

        /**
         * Turn string of page titles into array of page IDs
         *
         * @param string $string
         * @return array
         */
        public static function titles_to_ids( $string, $type = "page" ) {

            // explode into array
            $arr = explode( ",", $string );

            $newarr = array();
            
            $types = get_option( 'hwp_post_types', []);

            // using the display on post, so search the set post types
            if( $types !== 'page' && !empty( $types ) ) {
                $type = $types;
            }

            foreach ($arr as $key => $value) {
                $title = trim( $value );
                $title = str_replace("’","'", $title );
                $title = str_replace( array("“", "”"),'"', $title );
                $page = get_page_by_title( html_entity_decode( $title ), 'OBJECT', $type );

                // cant get id of null
                if( !$page ) continue;

                $newarr[] = $page->ID;
            }

            return $newarr;

        }

        /**
         * Add extra classes to hollerbox element
         *
         * @param string $classes
         * @param int $id
         * @return string
         */
        public static function add_hb_classes( $classes, $id ) {

            $type = get_post_meta( $id, 'hwp_type', 1 );
            if( $type === 'hwp-popup' ) {
                $classes .= ' ' . get_post_meta( $id, 'hwp_template', 1 );
            } else if( $type != 'holler-banner' ) {
                $classes .= get_post_meta( $id, 'position', 1 );
            }

            $display_when = get_post_meta( $id, 'display_when', 1 );
            if( $display_when === 'exit' ) {
                $classes .= ' hwp-show-on-exit';
            }

            $classes .= ' ' . $type;

            return $classes;
        }

        /**
         * Preview box on front end
         *
         */
        public static function preview_box() {

            if( isset( $_GET['hwp_preview'] ) ) {

                $box_id = $_GET['hwp_preview'];

            } else {

                return;

            }

            self::$active[] = $box_id;

            self::$instance->show_box_types( $box_id );

        }

    }

    $holler_Functions = new Holler_Functions();
    $holler_Functions->instance();

} // end class_exists check
