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
         * @return      object self::$instance The one true Holler_Admin
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
            add_filter('manage_edit-hollerbox_columns', array( $this, 'notification_columns' ) );
            add_action( 'manage_hollerbox_posts_custom_column', array( $this, 'custom_columns' ), 10, 2 );
            add_action(  'transition_post_status',  array( $this, 'save_default_meta' ), 10, 3 );

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

            wp_enqueue_script( 'holler-admin', Holler_Box_URL . 'assets/js/holler-admin.js', array( 'wp-color-picker', 'jquery-ui-datepicker' ), Holler_Box_VER, true );
            
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

            if( isset( $_POST['hwp_email_title'] ) ) {
                update_option( 'hwp_email_title', sanitize_text_field( $_POST['hwp_email_title'] ) );
            }

            if( isset( $_POST['hwp_powered_by'] ) ) {
                update_option( 'hwp_powered_by', sanitize_text_field( $_POST['hwp_powered_by'] ) );
            } elseif( !empty( $_POST ) && empty( $_POST['hwp_powered_by'] )  ) {
                delete_option( 'hwp_powered_by' );
            }

            ?>
            <div id="holler-wrap" class="wrap">          

            <h2><?php _e('Settings', 'hollerbox'); ?></h2>

            <form method="post" action="edit.php?post_type=hollerbox&page=hollerbox">

                <h3><?php _e('Email Settings', 'hollerbox'); ?></h3>

                <p><?php _e('Email title', 'hollerbox'); ?></p>
                
                <input id="hwp_email_title" name="hwp_email_title" value="<?php echo esc_html( get_option( 'hwp_email_title' ) ); ?>" placeholder="New Holler Box Message" type="text" size="50" />

                <p><?php _e('If you are using Convertkit, entery your API key. It can be found on your <a href="https://app.convertkit.com/account/edit#account_info" target="_blank">account info page.</a>', 'hollerbox'); ?></p>
                
                <input id="hwp_ck_api_key" name="hwp_ck_api_key" value="<?php echo esc_html( get_option( 'hwp_ck_api_key' ) ); ?>" placeholder="Convertkit API key" type="text" size="50" />

                <h3><?php _e('Miscellaneous', 'hollerbox'); ?></h3>

                <p>
                    <input type="checkbox" id="hwp_powered_by" name="hwp_powered_by" value="1" <?php checked('1', get_option( 'hwp_powered_by' ), true); ?> />
                    <?php _e( 'Hide attribution links', 'hollerbox' ); ?>
                </p>

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
         * @return      void
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
                'name'              => __( 'Holler Box', 'hollerbox' ),
                'singular_name'     => __( 'Holler Box', 'hollerbox' ),
                'menu_name'         => __( 'Holler Box', 'hollerbox' ),
                'name_admin_bar'        => __( 'Holler Box', 'hollerbox' ),
                'add_new'           => __( 'Add New', 'hollerbox' ),
                'add_new_item'      => __( 'Add New Box', 'hollerbox' ),
                'new_item'          => __( 'New Box', 'hollerbox' ),
                'edit_item'         => __( 'Edit Box', 'hollerbox' ),
                'view_item'         => __( 'View Box', 'hollerbox' ),
                'all_items'         => __( 'All Boxes', 'hollerbox' ),
                'search_items'      => __( 'Search Boxes', 'hollerbox' ),
                'parent_item_colon' => __( 'Parent Boxes:', 'hollerbox' ),
                'not_found'         => __( 'No Boxes found.', 'hollerbox' ),
                'not_found_in_trash' => __( 'No Boxes found in Trash.', 'hollerbox' )
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
                __( 'Display', 'hollerbox' ),
                array( $this, 'display_meta_box_callback' ),
                'hollerbox',
                'normal',
                'high'
            );

            add_meta_box(
                'settings_meta_box',
                __( 'Advanced Settings', 'hollerbox' ),
                array( $this, 'settings_meta_box_callback' ),
                'hollerbox',
                'normal',
                'high'
            );

            // add_meta_box(
            //     'preview_meta_box',
            //     __( 'Preview', 'hollerbox' ),
            //     array( $this, 'preview_meta_box_callback' ),
            //     'hollerbox',
            //     'side'
            // );

        }

        /**
         * Display appearance meta box
         *
         * @since     0.1
         */
        public function display_meta_box_callback( $post ) {

            ?>

            <?php wp_nonce_field( basename( __FILE__ ), 'hollerbox_meta_box_nonce' ); ?>

            <p>
                <input type="checkbox" id="hwp_active" name="hwp_active" value="1" <?php checked(1, get_post_meta( $post->ID, 'hwp_active', true ), true); ?> />
                <label for="hwp_active"><?php _e( 'Activate? Check to show this box.', 'hollerbox' ); ?></label>
            </p>

            <p>
                <label for="position"><?php _e( 'Position' ); ?></label>
            </p>
            <p>
                <input type="radio" name="position" value="hwp-bottomright" <?php checked( "hwp-bottomright", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Bottom right', 'hollerbox' ); ?>
                <input type="radio" name="position" value="hwp-bottomleft" <?php checked( "hwp-bottomleft", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Bottom left', 'hollerbox' ); ?>
                <input type="radio" name="position" value="hwp-topright" <?php checked( "hwp-topright", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Top right', 'hollerbox' ); ?>
                <input type="radio" name="position" value="hwp-topleft" <?php checked( "hwp-topleft", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <?php _e( 'Top left', 'hollerbox' ); ?>
                <?php do_action('hwp_position_settings', $post->ID); ?>
            </p>

            <p>Button color</p>
            <input type="text" name="button_color1" value="<?php echo esc_html( get_post_meta( $post->ID, 'button_color1', true ) ); ?>" class="hwp-colors" data-default-color="#1191cb" />
            
            <p>Background color</p>
            <input type="text" name="bg_color" value="<?php echo esc_html( get_post_meta( $post->ID, 'bg_color', true ) ); ?>" class="hwp-colors" data-default-color="#ffffff" />

            <p>Text color</p>
            <input type="text" name="text_color" value="<?php echo esc_html( get_post_meta( $post->ID, 'text_color', true ) ); ?>" class="hwp-colors" data-default-color="#333333" />

            <p>
                <input type="checkbox" id="show_optin" name="show_optin" value="1" <?php checked('1', get_post_meta( $post->ID, 'show_optin', true ), true); ?> />
                <?php _e( 'Show email opt-in', 'hollerbox' ); ?>
                <div id="show-email-options">

                    <p>
                    <input type="radio" name="email_provider" value="default" <?php checked("default", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'Default', 'hollerbox' ); ?><br>
                    <input type="radio" name="email_provider" value="ck" <?php checked("ck", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'Convertkit', 'hollerbox' ); ?><input id="ck_id" name="ck_id" value="<?php echo get_post_meta( $post->ID, 'ck_id', 1 ); ?>" placeholder="Convertkit list ID" type="text" /><br>
                    <input type="radio" name="email_provider" value="mc" <?php checked("mc", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'MailChimp', 'hollerbox' ); ?><input id="mc_url" name="mc_url" placeholder="MailChimp list url" value="<?php echo get_post_meta( $post->ID, 'mc_url', 1 ); ?>" type="text" /> <span class="mc-description">Get your list url under Signup forms => General forms => Signup form URL. Do not use shortened url.</span><br>
                    <input type="radio" name="email_provider" value="custom" <?php checked("custom", get_post_meta( $post->ID, 'email_provider', true ), true); ?> />
                    <?php _e( 'Custom', 'hollerbox' ); ?>
                    </p>

                    <div id="default-email-options">

                        <label for="opt_in_message"><?php _e( 'Message', 'hollerbox' ); ?></label>
                        <input class="widefat" type="text" name="opt_in_message" id="opt_in_message" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_message', true ) ); ?>" size="20" />

                        <label for="opt_in_placeholder"><?php _e( 'Placeholder', 'hollerbox' ); ?></label>
                        <input class="widefat" type="text" name="opt_in_placeholder" id="opt_in_placeholder" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_placeholder', true ) ); ?>" size="20" />

                        <label for="opt_in_send_to"><?php _e( 'Send to email', 'hollerbox' ); ?></label>
                        <input class="widefat" type="email" name="opt_in_send_to" id="opt_in_send_to" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_send_to', true ) ); ?>" size="20" />

                    </div>

                    <div id="custom-email-options">
                        <label for="custom_email_form"><?php _e( 'Insert HTML form code here', 'hollerbox' ); ?></label>
                        <textarea class="hwp-textarea" name="custom_email_form" id="custom_email_form"><?php echo esc_html( get_post_meta( $post->ID, 'custom_email_form', true ) ); ?></textarea>
                    </div>

                    <label for="opt_in_confirmation"><?php _e( 'Confirmation Message', 'hollerbox' ); ?></label>
                    <input class="widefat" type="text" name="opt_in_confirmation" id="opt_in_confirmation" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_confirmation', true ) ); ?>" size="20" />

                </div>
            </p>

            <p>
                <input type="checkbox" id="show_chat" name="show_chat" value="1" <?php checked('1', get_post_meta( $post->ID, 'show_chat', true ), true); ?> />
                <?php _e( 'Show chat', 'hollerbox' ); ?>
            </p>

        <?php }

        /**
         * Display settings meta box
         *
         * @since     0.1
         */
        public function settings_meta_box_callback( $post ) { ?>

            <label><?php _e( 'What pages?', 'hollerbox' ); ?></label>

            <p>
                <input type="radio" name="show_on" value="all" <?php if( get_post_meta( $post->ID, 'show_on', 1 ) === "all" ) echo 'checked="checked"'; ?>> All pages<br>
                <input type="radio" name="show_on" value="limited" <?php if( is_array( get_post_meta( $post->ID, 'show_on', 1 ) ) ) echo 'checked="checked"'; ?>> Certain pages<br>
                <div id="show-certain-pages">
                <p>Enter page/post IDs, separated by comma:</p>
                <input placeholder="Example: 2,25,311" class="widefat" type="text" name="hwp_page_ids" id="hwp_page_ids" value="<?php echo esc_attr( get_post_meta( $post->ID, 'hwp_page_ids', true ) ); ?>" size="20" />
                </div>
            </p>

            <hr>

            <label>Show to these visitors</label>

            <p> 
                <input type="radio" name="logged_in" value="logged_in" <?php checked('logged_in', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> Logged in only<br>
                <input type="radio" name="logged_in" value="logged_out" <?php checked('logged_out', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> Logged out only<br>
                <input type="radio" name="logged_in" value="all" <?php checked('all', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> All visitors<br>
            </p>
            <hr>
            <p><label for="visitor"><?php _e( 'New or returning', 'hollerbox' ); ?></label></p>
            <p>
                <input type="radio" name="new_or_returning" value="new" <?php checked('new', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> New visitors only<br>
                <input type="radio" name="new_or_returning" value="returning" <?php checked('returning', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> Returning visitors only<br>
                <input type="radio" name="new_or_returning" value="all" <?php checked('all', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> All visitors<br>
            </p>
            <hr>
            <p>
                <label for="visitor"><?php _e( 'When should we show it?', 'hollerbox' ); ?></label>
            </p>
            <p>
                <input type="radio" name="display_when" value="immediately" <?php checked('immediately', get_post_meta( $post->ID, 'display_when', true ), true); ?>> Immediately<br>
                <input type="radio" name="display_when" value="delay" <?php checked('delay', get_post_meta( $post->ID, 'display_when', true ), true); ?>> Delay of <input type="number" class="hwp-number-input" id="scroll_delay" name="scroll_delay" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'scroll_delay', true ) ); ?>" /> seconds<br>
                <input type="radio" name="display_when" value="scroll" <?php checked('scroll', get_post_meta( $post->ID, 'display_when', true ), true); ?>> User scrolls halfway down the page
            </p>
            <hr>
            <p>
                <label for="hide_after"><?php _e( 'After it displays, when should it disappear?', 'hollerbox' ); ?></label>
            </p>
            <p>
                <input type="radio" name="hide_after" value="never" <?php checked('never', get_post_meta( $post->ID, 'hide_after', true ), true); ?>> When user clicks hide<br>
                <input type="radio" name="hide_after" value="delay" <?php checked('delay', get_post_meta( $post->ID, 'hide_after', true ), true); ?>> Delay of <input type="number" class="hwp-number-input" id="hide_after_delay" name="hide_after_delay" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'hide_after_delay', true ) ); ?>" /> seconds<br>
            </p>
            <hr>
            <p>
                <label for="show_settings"><?php _e( 'How often should we show it to each visitor?', 'hollerbox' ); ?></label>
            </p>
            <p>
                <input type="radio" name="show_settings" value="always" <?php checked('always', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> Every page load<br>
                <input type="radio" name="show_settings" value="hide_for" <?php checked('hide_for', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> Show, then hide for <input type="number" class="hwp-number-input" id="hide_for_days" name="hide_for_days" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'hide_for_days', true ) ); ?>" /> days<br>
                <input type="radio" name="show_settings" value="interacts" <?php checked('interacts', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> Hide after user interacts (clicks link or submits email)
            </p>
            <hr>
            <p>
                <input type="checkbox" id="hide_btn" name="hide_btn" value="1" <?php checked(1, get_post_meta( $post->ID, 'hide_btn', true ), true); ?> />
                <label for="hide_btn"><?php _e( 'Hide the floating button? (Appears when box is hidden.)', 'hollerbox' ); ?></label>
            </p>
            <hr>
            <p><label for="avatar_email"><?php _e( 'Gravatar Email', 'hollerbox' ); ?></label></p>
            <p>
                <input type="text" class="widefat" name="avatar_email" size="20" value="<?php echo sanitize_email( get_post_meta( $post->ID, 'avatar_email', true ) ); ?>" /> 
            </p>

            <?php do_action('hwp_advanced_settings', $post->ID ); ?>

        <?php }

        /**
         * Display preview
         *
         * @since     0.1
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
                    <button class="hwp-email-btn" id="hwp-submit-email"><?php echo _e('Send', 'hollerbox' ); ?></button>
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
         */
        public function save_default_meta( $new_status, $old_status, $post ) {
            
            if ( $old_status === 'new' && $new_status === 'auto-draft' && $post->post_type === 'hollerbox' ) {

                // if we already have a setting, bail
                if( !empty( get_post_meta( $post->ID, 'item_type' ) ) )
                    return;

                // set some defaults
                update_post_meta( $post->ID, 'show_on', 'all' );
                update_post_meta( $post->ID, 'logged_in', 'all' );
                update_post_meta( $post->ID, 'avatar_email', get_option('admin_email') );
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
                'show_chat',
                'opt_in_message',
                'opt_in_confirmation',
                'opt_in_placeholder',
                'opt_in_send_to',
                'button_color1',
                'bg_color',
                'text_color',
                'hwp_page_ids',
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
                'mc_url' );

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
                $sanitized = wp_kses( $_POST[ $value ], $allowedposttags);
                update_post_meta( $post_id, $value, $sanitized );
            }

            // keys that need special handling
            if( empty( $_POST[ 'show_on' ] ) ) {
                delete_post_meta( $post_id, 'show_on' );
            } elseif( $_POST[ 'show_on' ] === 'limited' && !empty( $_POST[ 'hwp_page_ids' ] ) ) {

                // sanitize, remove whitespace, explode into array
                $sanitized = sanitize_text_field( $_POST[ 'hwp_page_ids' ] );
                $sanitized = preg_replace('/\s+/', '', $sanitized);
                update_post_meta( $post_id, 'show_on', explode( ',', $sanitized ) );

            } else {
                update_post_meta( $post_id, 'show_on', $_POST[ 'show_on' ] );
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