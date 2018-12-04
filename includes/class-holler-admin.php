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

            add_action( 'admin_init', array( $this, 'maybe_show_upgrade_link' ) );

            add_action( 'hwp_type_settings', array( $this, 'type_upsell' ), 99 );

            add_action( 'admin_init', array( $this, 'update_meta' ) );

            add_action( 'post_submitbox_minor_actions', array( $this, 'preview_link' ) );

            add_filter('page_row_actions', array( $this, 'row_actions' ), 10, 2 );

            add_action( 'edit_form_after_title', array( $this, 'type_settings' ) );

        }

        /**
         * Perform meta upgrades when plugin is updated
         *
         * @access      public
         * @since       1.0.0
         * @return      void
         */
        public function update_meta() {

            // stop doing this after 1.0.1
            if( Holler_Box_VER > '1.0.1' )
                return;

            // The Query
            $the_query = new WP_Query( array( 'post_type' => 'hollerbox' ) );

            // The Loop
            if ( $the_query->have_posts() ) {
                while ( $the_query->have_posts() ) {
                    $the_query->the_post();

                    $id = get_the_ID();

                    // update chat meta
                    if( get_post_meta( $id, 'show_chat', true ) === '1' ) {
                        update_post_meta( $id, 'hwp_type', 'chat' );
                        delete_post_meta( $id, 'show_chat' );
                    }

                }
                /* Restore original Post Data */
                wp_reset_postdata();
            }

        }

        /**
         * Show or hide upgrade link
         *
         * @access      public
         * @since       1.3.1
         * @return      void
         */
        public function maybe_show_upgrade_link() {

            if( !is_plugin_active('hollerbox-pro/holler-box-pro.php') ) {
                add_filter( 'plugin_action_links_holler-box/holler-box.php', array( $this, 'hwp_plugin_links' ) );
            }

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

            if( isset( $_POST['hwp_ac_api_key'] ) ) {
                update_option( 'hwp_ac_api_key', sanitize_text_field( $_POST['hwp_ac_api_key'] ) );
            }

            if( isset( $_POST['hwp_ac_url'] ) ) {
                update_option( 'hwp_ac_url', sanitize_text_field( $_POST['hwp_ac_url'] ) );
            }

            if( isset( $_POST['hwp_mc_status'] ) ) {
                update_option( 'hwp_mc_status', sanitize_text_field( $_POST['hwp_mc_status'] ) );
            } elseif( !empty( $_POST ) && empty( $_POST['hwp_mc_status'] )  ) {
                delete_option( 'hwp_mc_status' );
            }

            if( isset( $_POST['hwp_email_title'] ) ) {
                update_option( 'hwp_email_title', sanitize_text_field( $_POST['hwp_email_title'] ) );
            }

            if( isset( $_POST['hwp_powered_by'] ) ) {
                update_option( 'hwp_powered_by', sanitize_text_field( $_POST['hwp_powered_by'] ) );
            } elseif( !empty( $_POST ) && empty( $_POST['hwp_powered_by'] )  ) {
                delete_option( 'hwp_powered_by' );
            }

            if( isset( $_POST['hwp_disable_tracking'] ) ) {
                update_option( 'hwp_disable_tracking', sanitize_text_field( $_POST['hwp_disable_tracking'] ) );
            } elseif( !empty( $_POST ) && empty( $_POST['hwp_disable_tracking'] )  ) {
                delete_option( 'hwp_disable_tracking' );
            }

            ?>
            <div id="holler-wrap" class="wrap">          

            <h2><?php _e('Settings', 'holler-box'); ?></h2>

            <div id="hwp-upgrade-box" class="widgets-holder-wrap">
                
                <div class="hwp-content">

                    <?php if( !is_plugin_active('hollerbox-pro/holler-box-pro.php') && !is_plugin_active('hollerbox-sales/holler-box-sales.php') ) : ?>

                    <h3>Get 50% off the Holler Box Pro Bundle!</h3>

                    <img src="<?php echo Holler_Box_URL . 'assets/img/fomo-small.png'; ?>" class="hwp-upsell-img" />

                    <p>Get advanced settings, more popups, and sale notifications with Pro.</p>

                    <ul>
                    <li>EDD and WooCommerce integration</li>
                    <li>Content upgrade popups</li>
                    <li>CPT and taxonomy settings</li>
                    <li>Lots more...</li>
                    </ul>

                    <p><strong>Discount code: HOLLER50</strong><br><small>*Only applies to Pro Bundle</small></p>

                    
                    <a href="https://hollerwp.com/pro?utm_source=settings_page&utm_medium=link&utm_campaign=hwp_settings" class="button button-primary">View features &amp; pricing</a>

                    <?php endif; ?>

                </div>
                
            </div>

            <form method="post" action="edit.php?post_type=hollerbox&page=hollerbox">

                <h3><?php _e('Email Settings', 'holler-box'); ?></h3>

                <p><?php _e('Email title <em>(only used with "send to email" setting)</em>', 'holler-box'); ?></p>
                
                <input id="hwp_email_title" name="hwp_email_title" value="<?php echo esc_html( get_option( 'hwp_email_title' ) ); ?>" placeholder="New Holler Box Message" type="text" size="50" />

                <p><?php _e('If you are using ConvertKit, entery your API key. It can be found on your <a href="https://app.convertkit.com/account/edit#account_info" target="_blank">account info page.</a>', 'holler-box'); ?></p>
                
                <input id="hwp_ck_api_key" name="hwp_ck_api_key" value="<?php echo esc_html( get_option( 'hwp_ck_api_key' ) ); ?>" placeholder="ConvertKit API key" type="text" size="50" />

                <p><?php _e('If you are using Active Campaign, enter your url and API key. It can be found under My Settings -> Developer.', 'holler-box'); ?></p>

                <input id="hwp_ac_url" name="hwp_ac_url" value="<?php echo esc_html( get_option( 'hwp_ac_url' ) ); ?>" placeholder="Active Campaign URL" type="text" size="50" /><br/>

                <input id="hwp_ac_api_key" name="hwp_ac_api_key" value="<?php echo esc_html( get_option( 'hwp_ac_api_key' ) ); ?>" placeholder="Active Campaign API key" type="password" size="50" /><br/>

                <p><?php _e('If you are using MailChimp, enter your API key. It can be found under Account -> Extras -> API Keys.', 'holler-box'); ?></p>
                
                <input id="hwp_mc_api_key" name="hwp_mc_api_key" value="<?php echo esc_html( get_option( 'hwp_mc_api_key' ) ); ?>" placeholder="MailChimp API key" type="text" size="50" /><br/>

                <p>
                    <input type="checkbox" id="hwp_mc_status" name="hwp_mc_status" value="1" <?php checked('1', get_option( 'hwp_mc_status' ), true); ?> />
                    <?php _e( 'Disable MailChimp double-opt in? Check to subscribe users to your list without confirmation. If checked, MailChimp will not send a final welcome email.', 'holler-box' ); ?>
                </p>

                <h3><?php _e('Miscellaneous', 'holler-box'); ?></h3>

                <p>
                    <input type="checkbox" id="hwp_disable_tracking" name="hwp_disable_tracking" value="1" <?php checked('1', get_option( 'hwp_disable_tracking' ), true); ?> />
                    <?php _e( 'Disable Tracking (High traffic sites should check this for better performance)', 'holler-box' ); ?>
                </p>

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

            if( !get_option('hwp_disable_tracking') ) {
                $columns["impressions"] = "Impressions";
                $columns["conversions"] = "Conversions";
                $columns["rate"] = "Percent";
            } else {
                $columns["tracking_disabled"] = "Views (Disabled)";
                $columns["conversions"] = "Conversions";
            }
            
            $columns["active"] = "Active";
            $columns['date'] = $date;

            // remove wp seo columns
            unset( $columns['wpseo-score'] );
            unset( $columns['wpseo-title'] );
            unset( $columns['wpseo-metadesc'] );
            unset( $columns['wpseo-focuskw'] );
            unset( $columns['wpseo-score-readability'] );
            unset( $columns['wpseo-links'] );

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

            if( get_option( 'hwp_disable_tracking' ) ) {

                $views = $rate = '<small>Disabled</small>';

            } else {

                $views = get_post_meta( $post_id, 'hwp_views', 1);

                if( empty( $conversions ) || empty( $views ) ) {
                    $rate = '0%';
                } else {
                    $rate = intval( $conversions ) / intval( $views );
                    $rate = number_format( $rate, 3 ) * 100 . '%';
                }

            }

            switch ( $column ) {
                case 'impressions':
                    echo $views;
                    break;
                case 'conversions':
                    echo $conversions;
                    break;
                case 'rate':
                    echo $rate;
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

        }

        public function type_settings() {

            global $post;

            if( $post->post_type != 'hollerbox' )
                return;
            
            ?>
            
            <div class="postbox" style="margin-top:15px">
                <div class="inside">

                    <h4>
                        <label for="type"><?php _e( 'Choose a Holler Box Type' ); ?></label>
                    </h4>
                    <p>
                        <label class="hwp-radio-withimage">
                            <span class="text">Notification Box</span>
                            <img src="<?php echo Holler_Box_URL . 'assets/img/bottom-right-icon.png'; ?>" class="hwp-radio-image" />
                            <input type="radio" name="hwp_type" value="notification" <?php checked( "notification", get_post_meta( $post->ID, 'hwp_type', true ) ); ?> />
                        </label>

                        <label class="hwp-radio-withimage">
                            <span class="text">Popup</span>
                            <img src="<?php echo Holler_Box_URL . 'assets/img/popup-icon.png'; ?>" class="hwp-radio-image" />
                            <input type="radio" name="hwp_type" value="hwp-popup" <?php checked( "hwp-popup", get_post_meta( $post->ID, 'hwp_type', 1 ) ); ?> />
                        </label>

                        <label class="hwp-radio-withimage">
                            <span class="text">Faux Chat</span>
                            <img src="<?php echo Holler_Box_URL . 'assets/img/chat-icon.png'; ?>" class="hwp-radio-image" />
                            <input type="radio" name="hwp_type" value="chat" <?php checked( "chat", get_post_meta( $post->ID, 'hwp_type', true ) ); ?> />
                        </label>

                        <?php do_action('hwp_type_settings', $post->ID); ?>
                    </p>
                </div>
            </div>

            <?php
        }

        /**
         * Display upsell text if license is missing
         *
         * @since     1.0.0
         * @param     WP_Post $post
         */
        public function type_upsell() {

            $license_key = get_option( 'hwp_pro_edd_license' );
            if( $license_key )
                return;

            ?>
            <p style="clear:both;"><small><a href="https://hollerwp.com/pro?utm_source=template_settings&utm_medium=link&utm_campaign=hwp_settings" target="_blank" style="color:#999">Get banners, sale notification popups, and more with Pro</a></small></p>
            <?php
        }

        /**
         * Add preview link to submit box
         *
         */
        public function preview_link( $post ) {

            $status = $post->post_status;
            $type = $post->post_type;

            if( $type != 'hollerbox' )
                return;

            if( $status === 'draft' || $status === 'publish' ) {
                echo '<a href="' . home_url() . '?hwp_preview=' . $post->ID . '" target="_blank" class="button">Preview Box</a>';
            }

        }

        /**
         * Add preview link to row actions
         *
         */
        public function row_actions( $actions, $post ) {

            if ( $post->post_type === "hollerbox" ) {

                $actions['hwp_preview'] = '<a href="' . home_url() . '?hwp_preview=' . $post->ID . '" target="_blank">Preview</a>';

            }

            return $actions;

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

            

            <div class="hwp-section" id="position-settings">

                <h4>
                    <label for="position"><?php _e( 'Position' ); ?></label>
                </h4>

                <input type="radio" name="position" value="hwp-bottomright" <?php checked( "hwp-bottomright", get_post_meta( $post->ID, 'position', true ) ); ?> />
                <label>Bottom Right</label>

                <input type="radio" name="position" value="hwp-bottomleft" <?php checked( "hwp-bottomleft", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <label>Bottom Left</label>

                <input type="radio" name="position" value="hwp-topright" <?php checked( "hwp-topright", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <label>Top Right</label>

                <input type="radio" name="position" value="hwp-topleft" <?php checked( "hwp-topleft", get_post_meta( $post->ID, 'position', 1 ) ); ?> />
                <label>Top Left</label>

                <?php do_action('hwp_position_settings', $post->ID); ?>
            </div>

            <?php do_action('hwp_after_position_settings', $post->ID); ?>

            <div class="hwp-section" id="popup-templates">

                <h4>
                    <label for="position"><?php _e( 'Choose a Template' ); ?></label>
                </h4>

                <label class="hwp-radio-withimage popup-template">
                    <span class="text">Custom (Displays editor content)</span>
                    <img src="<?php echo Holler_Box_URL . 'assets/img/popup-template-0.png'; ?>" class="hwp-template-image" />
                    <input type="radio" name="hwp_template" value="hwp-template-0" <?php checked( "hwp-template-0", get_post_meta( $post->ID, 'hwp_template', true ) ); ?> />
                </label>

                <label class="hwp-radio-withimage popup-template">
                    <span class="text">Standard</span>
                    <img src="<?php echo Holler_Box_URL . 'assets/img/popup-template-1.png'; ?>" class="hwp-template-image" />
                    <input type="radio" name="hwp_template" value="hwp-template-1" <?php checked( "hwp-template-1", get_post_meta( $post->ID, 'hwp_template', true ) ); ?> />
                </label>

                <label class="hwp-radio-withimage popup-template">
                    <span class="text">Image Left</span>
                    <img src="<?php echo Holler_Box_URL . 'assets/img/popup-template-2.png'; ?>" class="hwp-template-image" />
                    <input type="radio" name="hwp_template" value="hwp-template-2" <?php checked( "hwp-template-2", get_post_meta( $post->ID, 'hwp_template', true ) ); ?> />
                </label>

                <label class="hwp-radio-withimage popup-template">
                    <span class="text">Above/Below</span>
                    <img src="<?php echo Holler_Box_URL . 'assets/img/popup-template-3.png'; ?>" class="hwp-template-image" />
                    <input type="radio" name="hwp_template" value="hwp-template-3" <?php checked( "hwp-template-3", get_post_meta( $post->ID, 'hwp_template', true ) ); ?> />
                </label>

                <label class="hwp-radio-withimage popup-template">
                    <span class="text">Progress Bar</span>
                    <img src="<?php echo Holler_Box_URL . 'assets/img/popup-template-progress.png'; ?>" class="hwp-template-image" />
                    <input type="radio" name="hwp_template" value="hwp-template-progress" <?php checked( "hwp-template-progress", get_post_meta( $post->ID, 'hwp_template', true ) ); ?> />
                </label>

                <?php do_action('hwp_popup_templates', $post->ID); ?>

            </div>

            <div class="hwp-section" id="popup-options">

                <h4>
                    <label for="position"><?php _e( 'Popup Options' ); ?></label>
                </h4>
                
                <p>
                    <?php _e( 'Upload a Custom Image', 'holler-box' ); ?>
                </p>
                
                <img src="<?php echo get_post_meta( $post->ID, 'popup_image', 1 ); ?>" class="hwp-popup-image" />

                <input id="hwp-image-url" size="50" type="text" name="popup_image" value="<?php echo get_post_meta( $post->ID, 'popup_image', 1 ); ?>" />
                <input id="hwp-upload-btn" type="button" class="button" value="Upload Image" />

            </div>

            <div class="hwp-section" id="box-colors">
                
                <div id="send-btn-color">
                    <p><?php _e( 'Accent color', 'holler-box' ); ?></p>
                    <input type="text" name="button_color1" value="<?php echo esc_html( get_post_meta( $post->ID, 'button_color1', true ) ); ?>" class="hwp-colors" data-default-color="#1191cb" />
                </div>
                
                <p><?php _e( 'Background color', 'holler-box' ); ?></p>
                <input type="text" name="bg_color" value="<?php echo esc_html( get_post_meta( $post->ID, 'bg_color', true ) ); ?>" class="hwp-colors" data-default-color="#ffffff" />
                
                <p><?php _e( 'Text color', 'holler-box' ); ?></p>
                <input type="text" name="text_color" value="<?php echo esc_html( get_post_meta( $post->ID, 'text_color', true ) ); ?>" class="hwp-colors" data-default-color="#333333" />

            </div>

            <div class="hwp-section noborder" id="show-optin">

                <p>
                <input type="checkbox" id="show_optin" name="show_optin" value="1" <?php checked('1', get_post_meta( $post->ID, 'show_optin', true ), true); ?> />
                <?php _e( 'Show email opt-in', 'holler-box' ); ?>
                </p>

                <div id="show-email-options">

                    <select name="email_provider">

                        <option value="default" <?php selected( get_post_meta( $post->ID, 'email_provider', true ), "default"); ?> >
                            <?php _e( 'Send to email address', 'holler-box' ); ?>
                        </option>

                        <option value="ck" <?php selected( get_post_meta( $post->ID, 'email_provider', true ), "ck"); ?> >
                            <?php _e( 'ConvertKit', 'holler-box' ); ?>
                        </option>

                        <option value="mc" <?php selected( get_post_meta( $post->ID, 'email_provider', true ), "mc"); ?> >
                            <?php _e( 'MailChimp', 'holler-box' ); ?>
                        </option>

                        <option value="ac" <?php selected( get_post_meta( $post->ID, 'email_provider', true ), "ac"); ?> >
                            <?php _e( 'Active Campaign', 'holler-box' ); ?>
                        </option>

                        <option value="drip" <?php selected( get_post_meta( $post->ID, 'email_provider', true ), "drip"); ?> >
                            <?php _e( 'Drip', 'holler-box' ); ?>
                        </option>

                        <?php if( class_exists('\MailPoet\API\API') ) : ?>

                        <option value="mailpoet" <?php selected( get_post_meta( $post->ID, 'email_provider', true ), "mailpoet"); ?> >
                            <?php _e( 'MailPoet', 'holler-box' ); ?>
                        </option>

                        <?php endif; ?>

                        <option value="custom" <?php selected( get_post_meta( $post->ID, 'email_provider', true ), "custom"); ?> >
                            <?php _e( 'Custom', 'holler-box' ); ?>
                        </option>

                    </select>

                    <?php do_action( 'hwp_below_provider_select', $post->ID ); ?>

                    <p id="convertkit-fields">
                        <?php _e( 'ConvertKit List ID, <a href=
                        "http://hollerbox.helpscoutdocs.com/article/6-convertkit-integration" target="_blank">click for help.</a> <em>*required</em>', 'holler-box' ); ?>
                        <input id="ck_id" name="ck_id" class="widefat" value="<?php echo get_post_meta( $post->ID, 'ck_id', 1 ); ?>" placeholder="ConvertKit list ID" type="text" />
                    </p>
                    
                    <div id="mailchimp-fields">
                        <?php _e( 'MailChimp List *required', 'holler-box' ); ?>

                            <?php

                            $lists = self::get_mc_lists(); 

                            if( is_array($lists) && !empty( $lists ) ) :

                                echo '<select name="mc_list_id">';

                                foreach ($lists as $list) {
                                    echo '<option value="' . $list["id"] . '"' . selected( get_post_meta( $post->ID, "mc_list_id", 1 ), $list["id"] ) . '>';
                                    echo $list['name'];
                                    echo '</option>';
                                }

                                echo '</select>';

                            else:

                                echo '<p style="color:red">There was a problem getting your lists. Please check your MailChimp API key in the Holler Box settings.</p>';

                            endif;

                            echo apply_filters( 'hwp_mc_upsell', '<small>Want MailChimp groups and interests? <a href="https://hollerwp.com/pro?utm_source=mc_upsell&utm_medium=link&utm_campaign=hwp_settings" target="_blank">Get Holler Box Pro.</a></small>' );

                            do_action( 'hwp_mc_settings', $post->ID );

                            ?>

                    </div>

                    <div id="ac-fields">
                        <?php _e( 'Active Campaign List *required', 'holler-box' ); ?>

                            <?php

                            $lists = self::get_ac_lists();

                            if( is_array($lists) && !empty( $lists ) ) :

                                echo '<select name="ac_list_id">';

                                foreach ($lists as $list) {
                                    echo '<option value="' . $list["id"] . '"' . selected( get_post_meta( $post->ID, "ac_list_id", 1 ), $list["id"] ) . '>';
                                    echo $list['name'];
                                    echo '</option>';
                                }

                                echo '</select>';

                            else:

                                echo '<p style="color:red">There was a problem getting your lists. Please check your Active Campaign API key in the Holler Box settings.</p>';

                            endif;

                            ?>

                    </div>
                    
                    <?php if( class_exists('\MailPoet\API\API') ) : ?>

                        <div id="mailpoet-fields">

                        <?php _e( 'MailPoet List <em>*required</em>', 'holler-box' ); ?>

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

                        </div>

                    <?php endif; ?>

                    
                    <div id="send-to-option">
                        <p>
                            <label for="opt_in_send_to"><?php _e( 'Send to email <em>*required</em>', 'holler-box' ); ?></label>
                            <input class="widefat" type="email" name="opt_in_send_to" id="opt_in_send_to" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_send_to', true ) ); ?>" size="20" />
                        </p>
                    </div>

                    <div id="custom-email-options">
                        <p>
                            <label for="custom_email_form"><?php _e( 'Insert HTML form code here', 'holler-box' ); ?></label>
                            <textarea class="hwp-textarea" name="custom_email_form" id="custom_email_form"><?php echo esc_html( get_post_meta( $post->ID, 'custom_email_form', true ) ); ?></textarea>
                        </p>
                    </div>

                    <div id="default-email-options">

                        <div id="hwp-name-fields">

                        <p>
                            <?php _e( 'Name Field Placeholder', 'holler-box' ); ?>
                            <input id="name_placeholder" name="name_placeholder" class="widefat" value="<?php echo get_post_meta( $post->ID, 'name_placeholder', 1 ); ?>" placeholder="First Name" type="text" />
                        </p>

                        <p>
                            <input type="checkbox" id="dont_show_name" name="dont_show_name" value="1" <?php checked('1', get_post_meta( $post->ID, 'dont_show_name', true ), true); ?> />
                            <?php _e( 'Don\'t show first name field', 'holler-box' ); ?>
                        </p>

                        </div>

                        <p>
                            <label for="opt_in_message"><?php _e( 'Small text above email field', 'holler-box' ); ?></label>
                            <input class="widefat" type="text" name="opt_in_message" id="opt_in_message" placeholder="We don't spam or share your information." value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_message', true ) ); ?>" size="20" />
                        </p>

                        <p>
                            <label for="opt_in_placeholder"><?php _e( 'Placeholder', 'holler-box' ); ?></label>
                            <input class="widefat" type="text" name="opt_in_placeholder" id="opt_in_placeholder" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_placeholder', true ) ); ?>" size="20" />
                        </p>

                        <p>
                            <label for="opt_in_confirmation"><?php _e( 'Confirmation Message', 'holler-box' ); ?></label>
                            <input class="widefat" type="text" name="opt_in_confirmation" id="opt_in_confirmation" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_confirmation', true ) ); ?>" size="20" />
                        </p>

                        <p>
                            <label for="submit_text"><?php _e( 'Submit Button Text', 'holler-box' ); ?></label>
                            <input class="widefat" type="text" name="submit_text" id="submit_text" value="<?php echo esc_attr( get_post_meta( $post->ID, 'submit_text', true ) ); ?>" size="20" placeholder="Send" />
                        </p>

                        <?php do_action( 'hwp_email_settings', $post->ID ); ?>

                    </div>

                </div>

            </div>

        <?php }

        /**
         * Get MailChimp lists
         * 
         *
         * @since       0.8.3
         * @return      void
         */
        public function get_mc_lists() {

            $transient = get_transient( 'hwp_mc_lists' );

            if( $transient != false )
                return $transient;

            // MailChimp API credentials
            $api_key = get_option('hwp_mc_api_key');

            if( empty( $api_key) )
                return 'Please add your MailChimp API key in the Holler Box settings.';

            // MailChimp API URL
            $data_center = substr($api_key,strpos($api_key,'-')+1);
            $url = 'https://' . $data_center . '.api.mailchimp.com/3.0/lists/';

            $headers = array(
                'Authorization' => 'Basic ' . base64_encode( 'user:' . $api_key ),
                'Content-Type' => 'application/json'
              );

            $response = wp_remote_get( $url, array(
                'timeout' => 10,
                'body' => array( 'count' => 20 ),
                'headers' => $headers,
                )
            );

            if ( is_wp_error( $response ) ) {
               $error_message = $response->get_error_message();
               return $error_message;
            } else {
                $api_response = json_decode( wp_remote_retrieve_body( $response ), true );
                if( array_key_exists( 'lists', $api_response ) ) {
                    return $api_response['lists'];

                    set_transient( 'hwp_mc_lists', $api_response['lists'], HOUR_IN_SECONDS );

                } else {
                    return $api_response;
                }
            }

        }

        /**
         * Get Active Campaign lists
         * 
         *
         * @since       0.8.3
         * @return      void
         */
        public function get_ac_lists() {

            $transient = get_transient( 'hwp_ac_lists' );

            if( $transient != false )
                return $transient;

            // Active Campaign API credentials
            $api_key = get_option('hwp_ac_api_key');
            $api_url = get_option('hwp_ac_url') . '/api/3/lists';

            if( empty( $api_key) )
                return 'Please add your Active Campaign API key in the Holler Box settings.';

            $headers = array(
                'Api-Token' => $api_key,
                'Content-Type' => 'application/json'
              );

            $response = wp_remote_get( $api_url, array(
                'timeout' => 10,
                'headers' => $headers,
                )
            );

            if ( is_wp_error( $response ) ) {
               $error_message = $response->get_error_message();
               return $error_message;
            } else {
                $api_response = json_decode( wp_remote_retrieve_body( $response ), true );


                if( is_array( $api_response) && array_key_exists( 'lists', $api_response ) ) {
                    return $api_response['lists'];

                    set_transient( 'hwp_ac_lists', $api_response['lists'], HOUR_IN_SECONDS );
                } else {
                    return $api_response;
                }
            }

        }

        /**
         * Advanced settings meta box
         *
         * @since     0.1
         * @param       WP_Post $post
         */
        public function settings_meta_box_callback( $post ) {
            $show_on = get_post_meta( $post->ID, 'show_on', 1 );
            ?>

            <?php do_action('hwp_advanced_settings_before', $post->ID ); ?>

            <div class="hwp-section">

                <p><label><?php _e( 'What pages?', 'holler-box' ); ?></label></p>

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

            </div>

            <div class="hwp-section">

                <p><label><?php _e( 'Show to these visitors', 'holler-box' ); ?></label></p>

                <div class="hwp-settings-group"> 
                    <input type="radio" name="logged_in" value="all" <?php checked('all', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> <?php _e( 'All visitors', 'holler-box' ); ?><br>
                    <input type="radio" name="logged_in" value="logged_in" <?php checked('logged_in', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> <?php _e( 'Logged in only', 'holler-box' ); ?><br>
                    <input type="radio" name="logged_in" value="logged_out" <?php checked('logged_out', get_post_meta( $post->ID, 'logged_in', true ), true); ?>> <?php _e( 'Logged out only', 'holler-box' ); ?><br>
                </div>
            </div>

            <div class="hwp-section">

                <p><label for="visitor"><?php _e( 'New or returning', 'holler-box' ); ?></label></p>

                <div class="hwp-settings-group">
                    <input type="radio" name="new_or_returning" value="all" <?php checked('all', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> <?php _e( 'All visitors', 'holler-box' ); ?><br>
                    <input type="radio" name="new_or_returning" value="new" <?php checked('new', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> <?php _e( 'New visitors only', 'holler-box' ); ?><br>
                    <input type="radio" name="new_or_returning" value="returning" <?php checked('returning', get_post_meta( $post->ID, 'new_or_returning', true ), true); ?>> <?php _e( 'Returning visitors only', 'holler-box' ); ?><br>
                </div>
            </div>

            <div class="hwp-section">

                <p>
                    <label for="visitor"><?php _e( 'When should we show it?', 'holler-box' ); ?></label>
                </p>

                <div class="hwp-settings-group">
                    <input type="radio" name="display_when" value="immediately" <?php checked('immediately', get_post_meta( $post->ID, 'display_when', true ), true); ?>> <?php _e( 'Immediately', 'holler-box' ); ?><br>
                    <input type="radio" name="display_when" value="delay" <?php checked('delay', get_post_meta( $post->ID, 'display_when', true ), true); ?>> <?php _e( 'Delay of', 'holler-box' ); ?> <input type="number" class="hwp-number-input" id="scroll_delay" name="scroll_delay" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'scroll_delay', true ) ); ?>" /> <?php _e( 'seconds', 'holler-box' ); ?><br>
                    <input type="radio" name="display_when" value="scroll" <?php checked('scroll', get_post_meta( $post->ID, 'display_when', true ), true); ?>> <?php _e( 'User scrolls halfway down the page', 'holler-box' ); ?><br>
                    <input type="radio" name="display_when" value="exit" <?php checked('exit', get_post_meta( $post->ID, 'display_when', true ), true); ?>> <?php _e( 'Exit Detection', 'holler-box' ); ?><br>

                    <?php do_action('hwp_display_when_settings', $post->ID ); ?>

                </div>
            </div>

            <div class="hwp-section" id="hwp-disappear">

                <p>
                    <label for="hide_after"><?php _e( 'After it displays, when should it disappear?', 'holler-box' ); ?></label>
                </p>

                <div class="hwp-settings-group">
                    <input type="radio" name="hide_after" value="never" <?php checked('never', get_post_meta( $post->ID, 'hide_after', true ), true); ?>> <?php _e( 'When user clicks hide', 'holler-box' ); ?><br>
                    <input type="radio" name="hide_after" value="delay" <?php checked('delay', get_post_meta( $post->ID, 'hide_after', true ), true); ?>> <?php _e( 'Delay of', 'holler-box' ); ?> <input type="number" class="hwp-number-input" id="hide_after_delay" name="hide_after_delay" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'hide_after_delay', true ) ); ?>" /> <?php _e( 'seconds', 'holler-box' ); ?><br>
                </div>

            </div>

            <div class="hwp-section">

                <p>
                    <label for="show_settings"><?php _e( 'How often should we show it to each visitor?', 'holler-box' ); ?></label>
                </p>

                <div class="hwp-settings-group">
                    <input type="radio" name="show_settings" value="interacts" <?php checked('interacts', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> <?php _e( 'Hide after user interacts (Close or email submit)', 'holler-box' ); ?><br>
                    <input type="radio" name="show_settings" value="always" <?php checked('always', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> <?php _e( 'Every page load', 'holler-box' ); ?><br>
                    <input type="radio" name="show_settings" value="hide_for" <?php checked('hide_for', get_post_meta( $post->ID, 'show_settings', true ), true); ?>> <?php _e( 'Show, then hide for', 'holler-box' ); ?> <input type="number" class="hwp-number-input" id="hide_for_days" name="hide_for_days" size="2" value="<?php echo intval( get_post_meta( $post->ID, 'hide_for_days', true ) ); ?>" /> <?php _e( 'days', 'holler-box' ); ?><br>
                </div>
            </div>

            <div class="hwp-section">

                <p>
                    <label for="hide_after"><?php _e( 'Show on Devices', 'holler-box' ); ?></label>
                </p>

                <div class="hwp-settings-group">
                    <input type="radio" name="hwp_devices" value="all" <?php checked('all', get_post_meta( $post->ID, 'hwp_devices', true ), true); ?>> <?php _e( 'All devices', 'holler-box' ); ?><br>
                    <input type="radio" name="hwp_devices" value="desktop_only" <?php checked('desktop_only', get_post_meta( $post->ID, 'hwp_devices', true ), true); ?>> <?php _e( 'Desktop only', 'holler-box' ); ?><br>
                    <input type="radio" name="hwp_devices" value="mobile_only" <?php checked('mobile_only', get_post_meta( $post->ID, 'hwp_devices', true ), true); ?>> <?php _e( 'Mobile only', 'holler-box' ); ?><br>
                </div>

            </div>

            <div class="hwp-section">

                <p>
                    <input type="checkbox" id="hide_btn" name="hide_btn" value="1" <?php checked(1, get_post_meta( $post->ID, 'hide_btn', true ), true); ?> />
                    <label for="hide_btn"><?php _e( 'Hide the floating button? (Appears when box is hidden.)', 'holler-box' ); ?></label>
                </p>

            </div>

            <div class="hwp-section noborder">
                
                <div class="avatar-email">

                    <p><label for="avatar_email"><?php _e( 'Gravatar Email', 'holler-box' ); ?></label></p>

                    <input type="text" class="widefat" name="avatar_email" size="20" value="<?php echo sanitize_email( get_post_meta( $post->ID, 'avatar_email', true ) ); ?>" /> 

                </div>

                <?php do_action('hwp_advanced_settings_after', $post->ID ); ?>

                <?php 
                    
                    if( !is_plugin_active('hollerbox-pro/holler-box-pro.php') ) {
                        echo '<p>Get more powerful display and customization settings in <strong><a href="https://hollerwp.com/pro?utm_source=after_settings&utm_medium=link&utm_campaign=hwp_settings">Holler Box Pro</a></strong></p>';
                    }
                ?>

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

                $item_type = get_post_meta( $post->ID, 'hwp_type' );

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
                update_post_meta( $post->ID, 'show_settings', 'interacts' );
                update_post_meta( $post->ID, 'new_or_returning', 'all' );
                update_post_meta( $post->ID, 'hide_after', 'never' );
                update_post_meta( $post->ID, 'hide_after_delay', 3 );
                update_post_meta( $post->ID, 'hide_for_days', 1 );
                update_post_meta( $post->ID, 'hwp_devices', 'all' );
                update_post_meta( $post->ID, 'hwp_active', '1' );
                update_post_meta( $post->ID, 'hwp_type', 'notification' );
                update_post_meta( $post->ID, 'position', 'hwp-bottomright' );
                update_post_meta( $post->ID, 'opt_in_placeholder', 'Enter your email' );
                update_post_meta( $post->ID, 'name_placeholder', 'First name' );

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
                'display_when',
                'scroll_delay',
                'position',
                'hwp_devices',
                'hide_btn',
                'email_provider',
                'custom_email_form',
                'ck_id',
                'mc_list_id',
                'ac_list_id',
                'mailpoet_list_id',
                'hwp_type',
                'hwp_template',
                'name_placeholder',
                'dont_show_name',
                'popup_image',
                'submit_text' );

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
                if( is_string( $_POST[ $value ] ) )
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

            // Check for type. If it's popup, delete the avatar.
            $type = get_post_meta( $post_id, 'hwp_type', 1 );
            if( $type === 'hwp-popup' )
                delete_post_meta( $post_id, 'avatar_email' );

            do_action( 'hwp_custom_settings_save', $post_id );
            
        }

        /**
         * Add upgrade link to plugin row
         *
         * @since     0.9.1
         * @return    void
         */
        public function hwp_plugin_links( $links ) {

            $links[] = '<a href="https://hollerwp.com/pro?utm_source=plugin_row&utm_medium=link&utm_campaign=hwp_settings" target="_blank" style="font-weight:bold;color:green;">Upgrade</a>';
            return $links;

        }

    }

    $holler_admin = new Holler_Admin();
    $holler_admin->instance();

} // end class_exists check