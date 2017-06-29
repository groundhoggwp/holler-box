<?php
/**
 * Admin UI, register CPT and meta
 * @since       0.1.0
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'Holler_Admin' ) ) {

    /**
     * Holler_Admin class
     *
     * @since       0.2.0
     */
    class Holler_Admin extends Holler_Box {

        /**
         * @var         Holler_Admin $instance The one true Holler_Admin
         * @since       0.2.0
         */
        private static $instance;
        public static $errorpath = '../php-error-log.php';
        // sample: error_log("meta: " . $meta . "\r\n",3,self::$errorpath);

        /**
         * Get active instance
         *
         * @access      public
         * @since       0.2.0
         * @return      self self::$instance The one true Holler_Admin
         */
        public static function instance() {
            if( !self::$instance ) {
                self::$instance = new Holler_Admin();
                self::$instance->hooks();
            }

            return self::$instance;
        }


        /**
         * Run action and filter hooks
         *
         * @access      private
         * @since       0.2.0
         * @return      void
         *
         *
         */
        private function hooks() {

            add_action( 'admin_menu', array( $this, 'settings_page' ) );
            add_action( 'init', array( $this, 'register_cpt' ) );
            add_action( 'save_post', array( $this, 'save_settings' ), 10, 2 );
            add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
            add_filter( 'manage_edit-hollerbox_columns', array( $this, 'notification_columns' ) );
            add_action( 'manage_hollerbox_posts_custom_column', array( $this, 'custom_columns' ), 10, 2 );
            add_action( 'transition_post_status',  array( $this, 'save_default_meta' ), 10, 3 );
        }

        /**
         * Scripts and styles
         *
         * @access      public
         * @since       0.1
         * @return      void
         */
        public function enqueue_scripts() {

            // Date picker: https://gist.github.com/slushman/8fd9e1cc8161c395ec5b

            // Color picker: https://make.wordpress.org/core/2012/11/30/new-color-picker-in-wp-3-5/
            wp_enqueue_style( 'holler-admin', Holler_Box_URL . 'assets/css/holler-admin.css', array( 'wp-color-picker' ), Holler_Box_VER );

            wp_enqueue_script( 'holler-admin', Holler_Box_URL . 'assets/js/holler-admin.js', array( 'wp-color-picker', 'jquery-ui-datepicker', 'suggest' ), Holler_Box_VER, true );
            
        }

        /**
         * Add settings
         *
         * @access      public
         * @since       0.1
         */
        public function settings_page() {

            add_submenu_page( 'edit.php?post_type=hollerbox', 'Holler Box Settings', 'Settings', 'manage_options', 'hollerbox', array( $this, 'render_settings') );
            
        }

        /**
         * Add settings
         *
         * @access      public
         * @since       0.1
         */
        public function render_settings() {

            if( isset( $_POST['hwp_ck_api_key'] ) ) {
                update_option( 'hwp_ck_api_key', sanitize_text_field( $_POST['hwp_ck_api_key'] ) );
            }

            if( isset( $_POST['hwp_mc_api_key'] ) ) {
                update_option( 'hwp_mc_api_key', sanitize_text_field( $_POST['hwp_mc_api_key'] ) );
            }

            if( isset( $_POST['hwp_email_title'] ) ) {
                update_option( 'hwp_email_title', sanitize_text_field( $_POST['hwp_email_title'] ) );
            }

            if( isset( $_POST['hwp_powered_by'] ) ) {
                update_option( 'hwp_powered_by', sanitize_text_field( $_POST['hwp_powered_by'] ) );
            } elseif( !empty( $_POST ) && empty( $_POST['hwp_powered_by'] )  ) {
                delete_option( 'hwp_powered_by' );
            }

            $license_key = get_option( 'hwp_pro_edd_license' );

            ?>
            <div id="holler-wrap" class="wrap">          

            <h2><?php _e('Settings', 'holler-box'); ?></h2>

            <?php if( !$license_key ) : ?>

                <div id="hwp-upgrade-box" class="widgets-holder-wrap">
                    
                    <div class="hwp-content">
                        <h2>Get Holler Box Pro!</h2>
                        <ul>
                        <li>More display settings like taxonomy and post type</li>
                        <li>Header banner option</li>
                        <li>Bigger popout option</li>
                        <li>EDD and WooCommerce integration</li>
                        <li>Exit detection, link activation</li>
                        <li>Priority support</li>
                        <li>Lots more...</li>
                        </ul>
                        <a href="https://hollerwp.com/pro?utm_source=wp_admin&utm_campaign=hwp_settings" class="button button-primary">View features &amp; pricing</a>
                    </div>
                    
                </div>

            <?php endif; ?>

            <form method="post" action="edit.php?post_type=hollerbox&page=hollerbox">

                <h3><?php _e('Email Settings', 'holler-box'); ?></h3>

                <p><?php _e('Email title', 'holler-box'); ?></p>
                
                <input id="hwp_email_title" name="hwp_email_title" value="<?php echo esc_html( get_option( 'hwp_email_title' ) ); ?>" placeholder="New Holler Box Message" type="text" size="50" />

                <p><?php _e('If you are using Convertkit, entery your API key. It can be found on your <a href="https://app.convertkit.com/account/edit#account_info" target="_blank">account info page.</a>', 'holler-box'); ?></p>
                
                <input id="hwp_ck_api_key" name="hwp_ck_api_key" value="<?php echo esc_html( get_option( 'hwp_ck_api_key' ) ); ?>" placeholder="Convertkit API key" type="text" size="50" />

                <p><?php _e('If you are using MailChimp, entery your API key. It can be found under Account -> Extras -> API Keys.', 'holler-box'); ?></p>
                
                <input id="hwp_mc_api_key" name="hwp_mc_api_key" value="<?php echo esc_html( get_option( 'hwp_mc_api_key' ) ); ?>" placeholder="MailChimp API key" type="text" size="50" />

                <h3><?php _e('Miscellaneous', 'holler-box'); ?></h3>

                <p>
                    <input type="checkbox" id="hwp_powered_by" name="hwp_powered_by" value="1" <?php checked('1', get_option( 'hwp_powered_by' ), true); ?> />
                    <?php _e( 'Hide attribution links', 'holler-box' ); ?>
                </p>

                <?php do_action( 'hwp_settings_page' ); ?>

            <?php submit_button(); ?>

            </form>

            </div>
            <?php
            
        }

        /**
         * Add columns
         *
         * @access      public
         * @since       0.1
         * @param       array $columns
         * @return      array
         */
        public function notification_columns( $columns ) {
            $date = $columns['date'];
            unset($columns['date']);
            $columns["impressions"] = "Impressions";
            $columns["conversions"] = "Conversions";
            $columns["active"] = "Active";
            $columns['date'] = $date;
            return $columns;
        }

        /**
         * Column content
         *
         * @access      public
         * @since       0.1
         * @param       string $column
         * @param       int $post_id
         * @return      void
         */
        public function custom_columns( $column, $post_id ) {

            $conversions = get_post_meta( $post_id, 'hwp_conversions', 1);
            $views = get_post_meta( $post_id, 'hwp_views', 1);

            // if( empty( $conversions ) || empty( $views ) ) {
            //     $rate = '0%';
            // } else {
            //     $rate = intval( $conversions ) / intval( $views );
            //     $rate = number_format( $rate, 3 ) * 100 . '%';
            // }

            switch ( $column ) {
                case 'impressions':
                    echo $views;
                    break;
                case 'conversions':
                    echo $conversions;
                    break;
                case 'active':
                    echo '<label class="hwp-switch"><input data-id="' . $post_id . '" type="checkbox" value="1" ' . checked(1, get_post_meta( $post_id, 'hwp_active', true ), false) . ' /><div class="hwp-slider hwp-round"></div></label>';
                    break;
            }

        }

        // Register holler box post type
        public function register_cpt() {

            $labels = array(
                'name'              => __( 'Holler Box', 'holler-box' ),
                'singular_name'     => __( 'Holler Box', 'holler-box' ),
                'menu_name'         => __( 'Holler Box', 'holler-box' ),
                'name_admin_bar'        => __( 'Holler Box', 'holler-box' ),
                'add_new'           => __( 'Add New', 'holler-box' ),
                'add_new_item'      => __( 'Add New Box', 'holler-box' ),
                'new_item'          => __( 'New Box', 'holler-box' ),
                'edit_item'         => __( 'Edit Box', 'holler-box' ),
                'view_item'         => __( 'View Box', 'holler-box' ),
                'all_items'         => __( 'All Boxes', 'holler-box' ),
                'search_items'      => __( 'Search Boxes', 'holler-box' ),
                'parent_item_colon' => __( 'Parent Boxes:', 'holler-box' ),
                'not_found'         => __( 'No Boxes found.', 'holler-box' ),
                'not_found_in_trash' => __( 'No Boxes found in Trash.', 'holler-box' )
            );

            $args = array(
                'labels'                => $labels,
                'public'                => true,
                'publicly_queryable' => false,
                'show_ui'           => true,
                'show_in_nav_menus' => false,
                'show_in_menu'      => true,
                'show_in_rest'      => false,
                'query_var'         => true,
                // 'rewrite'           => array( 'slug' => 'hollerbox' ),
                'capability_type'   => 'post',
                'has_archive'       => true,
                'hierarchical'      => true,
                //'menu_position'     => 50,
                'menu_icon'         => 'dashicons-testimonial',
                'supports'          => array( 'title', 'editor' ),
                'show_in_customizer' => false,
                'register_meta_box_cb' => array( $this, 'notification_meta_boxes' )
            );

            register_post_type( 'hollerbox', $args );
        }

        /**
         * Add Meta Box
         *
         * @since     0.1
         */
        public function notification_meta_boxes() {

            add_meta_box(
                'display_meta_box',
                __( 'Display', 'holler-box' ),
                array( $this, 'display_meta_box_callback' ),
                'hollerbox',
                'normal',
                'high'
            );

            add_meta_box(
                'settings_meta_box',
                __( 'Advanced Settings', 'holler-box' ),
                array( $this, 'settings_meta_box_callback' ),
                'hollerbox',
                'normal',
                'high'
            );

            // add_meta_box(
            //     'preview_meta_box',
            //     __( 'Preview', 'holler-box' ),
            //     array( $this, 'preview_meta_box_callback' ),
            //     'holler-box',
            //     'side'
            // );

        }

        /**
         * Display appearance meta box
         *
         * @since     0.1
         * @param     WP_Post $post
         */
        public function display_meta_box_callback( $post ) {

            ?>

            <?php wp_nonce_field( basename( __FILE__ ), 'hollerbox_meta_box_nonce' ); ?>

            <p>
                <input type="checkbox" id="hwp_active" name="hwp_active" value="1" <?php checked(1, get_post_meta( $post->ID, 'hwp_active', true ), true); ?> />
                <label for="hwp_active"><?php _e( 'Activate? Check to show this box.', 'holler-box' ); ?></label>
            </p>

            <p>
                <label for="position"><?php _e( 'Position' ); ?></label>
            </p>
            <p>
                <input type="radio" name="position" value="hwp-bottomright" <?php checked( "hwp-bottomright", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Bottom right', 'holler-box' ); ?>
                <input type="radio" name="position" value="hwp-bottomleft" <?php checked( "hwp-bottomleft", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Bottom left', 'holler-box' ); ?>
                <input type="radio" name="position" value="hwp-topright" <?php checked( "hwp-topright", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Top right', 'holler-box' ); ?>
                <input type="radio" name="position" value="hwp-topleft" <?php checked( "hwp-topleft", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Top left', 'holler-box' ); ?>
                <?php do_action('hwp_position_settings', $post->ID); ?>
            </p>

            <p><?php _e( 'Button color', 'holler-box' ); ?></p>
            <input type="text" name="button_color1" value="<?php echo esc_html( get_post_meta( $post->ID, 'button_color1', true ) ); ?>" class="hwp-colors" data-default-color="#1191cb" />
            
            <p><?php _e( 'Background color', 'holler-box' ); ?></p>
            <input type="text" name="bg_color" value="<?php echo esc_html( get_post_meta( $post->ID, 'bg_color', true ) ); ?>" class="hwp-colors" data-default-color="#ffffff" />

            <p><?php _e( 'Text color', 'holler-box' ); ?></p>
            <input type="text" name="text_color" value="<?php echo esc_html( get_post_meta( $post->ID, 'text_color', true ) ); ?>" class="hwp-colors" data-default-color="#333333" />

            <p>
                <input type="checkbox" id="show_optin" name="show_optin" value="1" <?php checked('1', get_post_meta( $post->ID, 'show_optin', true ), true); ?> />
                <?php _e( 'Show email opt-in', 'holler-box' ); ?>
                <div id="show-email-options">

                    <p>
                    <input type="radio" name="email_provider" value="default" <?php checked("default", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'Default', 'holler-box' ); ?><br>

                    <input type="radio" name="email_provider" value="ck" <?php checked("ck", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'Convertkit', 'holler-box' ); ?><input id="ck_id" name="ck_id" value="<?php echo get_post_meta( $post->ID, 'ck_id', 1 ); ?>" placeholder="Convertkit list ID" type="text" /><br>

                    <input type="radio" name="email_provider" value="mc" <?php checked("mc", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'MailChimp', 'holler-box' ); ?><input id="mc_list_id" name="mc_list_id" placeholder="MailChimp list ID" value="<?php echo get_post_meta( $post->ID, 'mc_list_id', 1 ); ?>" type="text" /> <span class="mc-description"><?php _e( 'Get your list ID under Lists => Settings => List name and defaults => List ID (on right side of screen)', 'holler-box' ); ?></span><br>
                    
                    <?php if( class_exists('\MailPoet\API\API') ) : ?>

                        <input type="radio" name="email_provider" value="mailpoet" <?php checked("mailpoet", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                        <?php _e( 'MailPoet', 'holler-box' ); ?>
                        <select name="mailpoet_list_id" id="mailpoet_list_id">
                    
                        <?php

                        $subscription_lists = \MailPoet\API\API::MP('v1')->getLists();

                        if( !empty( $subscription_lists ) ) :

                            foreach ($subscription_lists as $list) {
                                echo '<option value="' . $list['id'] . '"' . selected( get_post_meta( $post->ID, 'mailpoet_list_id', 1 ), $list['id'] ) . '">';
                                echo $list['name'];
                                echo '</option>';
                            };

                        else:

                            echo 'Please add a MailPoet List.';

                        endif;

                        ?>
                        </select>
                        <br>
                    <?php endif; ?>

                    <input type="radio" name="email_provider" value="custom" <?php checked("custom", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'Custom', 'holler-box' ); ?>
                    </p>

                    <div id="default-email-options">

                        <label for="opt_in_message"><?php _e( 'Message', 'holler-box' ); ?></label>
                        <input class="widefat" type="text" name="opt_in_message" id="opt_in_message" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_message', true ) ); ?>" size="20" />

                        <label for="opt_in_placeholder"><?php _e( 'Placeholder', 'holler-box' ); ?></label>
                        <input class="widefat" type="text" name="opt_in_placeholder" id="opt_in_placeholder" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_placeholder', true ) ); ?>" size="20" />

                        <label for="opt_in_send_to"><?php _e( 'Send to email', 'holler-box' ); ?></label>
                        <input class="widefat" type="email" name="opt_in_send_to" id="opt_in_send_to" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_send_to', true ) ); ?>" size="20" />

                    </div>

                    <div id="custom-email-options">
                        <label for="custom_email_form"><?php _e( 'Insert HTML form code here', 'holler-box' ); ?></label>
                        <textarea class="hwp-textarea" name="custom_email_form" id="custom_email_form"><?php echo esc_html( get_post_meta( $post->ID, 'custom_email_form', true ) ); ?></textarea>
                    </div>

                    <label for="opt_in_confirmation"><?php _e( 'Confirmation Message', 'holler-box' ); ?></label>
                    <input class="widefat" type="text" name="opt_in_confirmation" id="opt_in_confirmation" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_confirmation', true ) ); ?>" size="20" />

                </div>
            </p>

            <p>
                <input type="checkbox" id="show_chat" name="show_chat" value="1" <?php checked('1', get_post_meta( $post->ID, 'show_chat', true ), true); ?> />
                <?php _e( 'Show chat', 'holler-box' ); ?>
            </p>

        <?php }

        /**
         * Display settings meta box
         *
         * @since     0.1
         * @param       WP_Post $post
         */
        public function settings_meta_box_callback( $post ) {
            $show_on = get_post_meta( $post->ID, 'show_on', 1 );
            ?>

            <label><?php _e( 'What pages?', 'holler-box' ); ?></label>

            <div class="hwp-settings-group">
                <?php if( is_array( $show_on ) ) echo '<p>We have updated this setting, please re-enter pages and save.</p>'; ?>
                <input type="radio" name="show_on" value="all" <?php if( $show_on === "all" ) echo 'checked="checked"'; ?>> All pages<br>
                <input type="radio" name="show_on" value="limited" <?php if( $show_on === "limited" ) echo 'checked="checked"'; ?>> Certain pages<br>
                <div id="show-certain-pages" class="hwp-hidden-field">
                <p><?php  _e('Show on pages', 'holler-box' ); ?></p>
                <input placeholder="Start typing page title" class="widefat" type="text" name="show_on_pages" id="show_on_pages" value="<?php echo get_post_meta( $post->ID, 'show_on_pages', 1 ); ?>" size="20" />
                </div>

                <?php do_action('hwp_page_settings', $post->ID ); ?>

            </div>

            <hr>

            <label><?php _e( 'Show to these visitors', 'holler-box' ); ?></label>

            <div class="hwp-settings-group"> 
                <input type="radio" name="logged_in" value="logged_in" <?php checked('logged_in', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> <?php _e( 'Logged in only', 'holler-box' ); ?><br>
                <input type="radio" name="logged_in" value="logged_out" <?php checked('logged_out', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> <?php _e( 'Logged out only', 'holler-box' ); ?><br>
                <input type="radio" name="logged_in" value="all" <?php checked('all', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> <?php _e( 'All visitors', 'holler-box' ); ?><br>
            </div>
            <hr>
            <p><label for="visitor"><?php _e( 'New or returning', 'holler-box' ); ?></label></p>
            <div class="hwp-settings-group">
                <input type="radio" name="new_or_returning" value="new" <?php checked('new', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> <?php _e( 'New visitors only', 'holler-box' ); ?><br>
                <input type="radio" name="new_or_returning" value="returning" <?php checked('returning', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> <?php _e( 'Returning visitors only', 'holler-box' ); ?><br>
                <input type="radio" name="new_or_returning" value="all" <?php checked('all', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> <?php _e( 'All visitors', 'holler-box' ); ?><br>
            </div>
            <hr>
            <p>
                <label for="visitor"><?php _e( 'When should we show it?', 'holler-box' ); ?></label>
            </p>
            <div class="hwp-settings-group">
                <input type="radio" name="display_when" value="immediately" <?php checked('immediately', get_post_meta( $post->ID, 'display_when', true ), true); ?>> <?php _e( 'Immediately', 'holler-box' ); ?><br>
                <input type="radio" name="display_when" value="delay" <?php checked('delay', get_post_meta( $post->ID, 'display_when', true ), true); ?>> <?php _e( 'Delay of', 'holler-box' ); ?> <input type="number" class="hwp-number-input" id="scroll_delay" name="scroll_delay" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'scroll_delay', true ) ); ?>" /> <?php _e( 'seconds', 'holler-box' ); ?><br>
                <input type="radio" name="display_when" value="scroll" <?php checked('scroll', get_post_meta( $post->ID, 'display_when', true ), true); ?>> <?php _e( 'User scrolls halfway down the page', 'holler-box' ); ?> <br>

                <?php do_action('hwp_display_when_settings', $post->ID ); ?>

            </div>
            <hr>
            <p>
                <label for="hide_after"><?php _e( 'After it displays, when should it disappear?', 'holler-box' ); ?></label>
            </p>
            <div class="hwp-settings-group">
                <input type="radio" name="hide_after" value="never" <?php checked('never', get_post_meta( $post->ID, 'hide_after', true ), true); ?>> <?php _e( 'When user clicks hide', 'holler-box' ); ?><br>
                <input type="radio" name="hide_after" value="delay" <?php checked('delay', get_post_meta( $post->ID, 'hide_after', true ), true); ?>> <?php _e( 'Delay of', 'holler-box' ); ?> <input type="number" class="hwp-number-input" id="hide_after_delay" name="hide_after_delay" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'hide_after_delay', true ) ); ?>" /> <?php _e( 'seconds', 'holler-box' ); ?><br>
            </div>
            <hr>
            <p>
                <label for="show_settings"><?php _e( 'How often should we show it to each visitor?', 'holler-box' ); ?></label>
            </p>
            <div class="hwp-settings-group">
                <input type="radio" name="show_settings" value="always" <?php checked('always', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> <?php _e( 'Every page load', 'holler-box' ); ?><br>
                <input type="radio" name="show_settings" value="hide_for" <?php checked('hide_for', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> <?php _e( 'Show, then hide for', 'holler-box' ); ?> <input type="number" class="hwp-number-input" id="hide_for_days" name="hide_for_days" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'hide_for_days', true ) ); ?>" /> <?php _e( 'days', 'holler-box' ); ?><br>
                <input type="radio" name="show_settings" value="interacts" <?php checked('interacts', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> <?php _e( 'Hide after user interacts (clicks link or submits email)', 'holler-box' ); ?>
            </div>
            <hr>
            <p>
                <input type="checkbox" id="hide_btn" name="hide_btn" value="1" <?php checked(1, get_post_meta( $post->ID, 'hide_btn', true ), true); ?> />
                <label for="hide_btn"><?php _e( 'Hide the floating button? (Appears when box is hidden.)', 'holler-box' ); ?></label>
            </p>
            <hr>
            <p><label for="avatar_email"><?php _e( 'Gravatar Email', 'holler-box' ); ?></label></p>
            <p>
                <input type="text" class="widefat" name="avatar_email" size="20" value="<?php echo sanitize_email( get_post_meta( $post->ID, 'avatar_email', true ) ); ?>" /> 
            </p>

            <?php do_action('hwp_advanced_settings_after', $post->ID ); ?>

            <?php 
                $license_key = get_option( 'hwp_pro_edd_license' );
                if( !$license_key ) {
                    echo '<p>Get more powerful display and customization settings in <strong><a href="https://hollerwp.com/pro?utm_source=wp_admin&utm_campaign=below_settings">Holler Box Pro</a></strong></p>';
                }
            ?>

        <?php }

        /**
         * Display preview
         *
         * @since     0.1
         * @param       WP_Post $post
         */
        public function preview_meta_box_callback( $post ) { ?>

            <!-- <div id="hwp-floating-btn"><i class="icon icon-chat"></i></div> -->

            <div id="hwp-notification-box">
                
                <div class="hwp-box-rows">
                        <img alt="" src="<?php echo plugins_url( 'assets/img/mystery-man.png', dirname(__FILE__) ); ?>" class="avatar avatar-50 photo" height="50" width="50">
                    <div class="hwp-row" id="hwp-first-row"></div>
                </div>

                <div id="hwp-note-optin" class="hwp-row hwp-email-row">
                    <input type="email" name="email" id="hwp-email-input" placeholder="Enter email" autocomplete="on" autocapitalize="off" />
                    <button class="hwp-email-btn" id="hwp-submit-email"><?php _e('Send', 'holler-box' ); ?></button>
                </div>
                
                <div id="hwp-chat" class="hwp-hide">
                    
                    <div class="hwp-row hwp-text">
                        <input type="text" id="hwp-text-input" placeholder="Type your message" />
                        <i id="hwp-submit-text" class="icon icon-mail"></i>
                    </div>
                </div>

                <span id="hwp-powered-by"><a href="http://scottbolinger.com" target="_blank">Scottomator</a></span>
                <div class="hwp-close"><i class="icon icon-cancel"></i></div>
 
            </div>

        <?php }

        /**
         * Save meta box defaults when new post is created
         *
         * @since     0.1
         * @param     string $new_status
         * @param     string $old_status
         * @param     WP_Post $post
         */
        public function save_default_meta( $new_status, $old_status, $post ) {
            
            if ( $old_status === 'new' && $new_status === 'auto-draft' && $post->post_type === 'hollerbox' ) {

                $item_type = get_post_meta( $post->ID, 'item_type' );

                // if we already have a setting, bail
                if( !empty( $item_type ) )
                    return;

                $avatar_email = get_option('admin_email');

                // set some defaults
                update_post_meta( $post->ID, 'show_on', 'all' );
                update_post_meta( $post->ID, 'logged_in', 'all' );
                update_post_meta( $post->ID, 'avatar_email', $avatar_email );
                update_post_meta( $post->ID, 'display_when', 'delay' );
                update_post_meta( $post->ID, 'scroll_delay', 1 );
                update_post_meta( $post->ID, 'show_settings', 'always' );
                update_post_meta( $post->ID, 'new_or_returning', 'all' );
                update_post_meta( $post->ID, 'hide_after', 'never' );
                update_post_meta( $post->ID, 'hide_after_delay', 3 );
                update_post_meta( $post->ID, 'hide_for_days', 1 );
                update_post_meta( $post->ID, 'hwp_active', '1' );
                update_post_meta( $post->ID, 'position', 'hwp-bottomright' );
                update_post_meta( $post->ID, 'opt_in_placeholder', 'Enter your email' );

            }

        }

        /**
         * Save meta box settings
         *
         * @since     0.1
         * @param     int $post_id
         * @return    void
         */
        public function save_settings( $post_id ) {

            // nonce check
            if ( !isset( $_POST['hollerbox_meta_box_nonce'] ) || !wp_verify_nonce( $_POST['hollerbox_meta_box_nonce'], basename( __FILE__ ) ) )
                return $post_id;

            $post_type = get_post_type($post_id);

            // If this isn't our post type, don't update it.
            if ( "hollerbox" != $post_type ) 
                return;

            // Check if the current user has permission to edit the post.
            if ( !current_user_can( 'edit_post', $post_id ) )
                return $post_id;

            $keys = array(
                'show_optin', 
                'show_on',
                'show_chat',
                'opt_in_message',
                'opt_in_confirmation',
                'opt_in_placeholder',
                'opt_in_send_to',
                'button_color1',
                'bg_color',
                'text_color',
                'show_on_pages',
                'logged_in',
                'new_or_returning',
                'avatar_email',
                'show_settings',
                'hide_for_days',
                'hide_after',
                'hide_after_delay',
                'hwp_active',
                'display_when',
                'scroll_delay',
                'position',
                'hide_btn',
                'email_provider',
                'custom_email_form',
                'ck_id',
                'mc_list_id',
                'mailpoet_list_id' );

            $keys = apply_filters( 'hwp_settings_array', $keys );

            global $allowedposttags;
            $allowedposttags["iframe"] = array(

                'align' => true,
                'width' => true,
                'height' => true,
                'frameborder' => true,
                'name' => true,
                'src' => true,
                'id' => true,
                'class' => true,
                'style' => true,
                'scrolling' => true,
                'marginwidth' => true,
                'marginheight' => true,
                'allowfullscreen' => true

            );
            $allowedposttags["input"] = array(
                'type' => true,
                'value' => true,
                'id' => true,
                'name' => true,
                'class' => true,
                'placeholder' => true,
            );
            $allowedposttags["div"] = array(
                'style' => true,
                'id' => true,
                'class' => true,
                'align' => true
            );

            // sanitize data
            foreach ($keys as $key => $value) {
                if( empty( $_POST[ $value ] ) ) {
                    delete_post_meta( $post_id, $value );
                    continue;
                }
                $trimmed = trim( $_POST[ $value ] );
                $sanitized = wp_kses( $trimmed, $allowedposttags);
                update_post_meta( $post_id, $value, $sanitized );
            }

            // notification expiration date
            if( empty( $_POST[ 'expiration' ] ) ) {
                delete_post_meta( $post_id, 'expiration' );
                delete_post_meta( $post_id, 'hwp_until_date' );
            } elseif( $_POST[ 'expiration' ] === '1' && !empty( $_POST[ 'hwp_until_date' ] ) ) {

                $sanitized = wp_kses( $_POST[ 'hwp_until_date' ], $allowedposttags);
                update_post_meta( $post_id, 'hwp_until_date', $sanitized );
                update_post_meta( $post_id, 'expiration', '1' );

            } else {
                update_post_meta( $post_id, 'expiration', $_POST[ 'expiration' ] );
            }
            
        }

    }

    $holler_admin = new Holler_Admin();
    $holler_admin->instance();

} // end class_exists check