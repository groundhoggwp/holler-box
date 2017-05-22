<?php
/**
 * Admin UI, register CPT and meta
 * @since       0.1.0
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'SB_Automation_Admin' ) ) {

    /**
     * SB_Automation_Admin class
     *
     * @since       0.2.0
     */
    class SB_Automation_Admin extends SB_Automation {

        /**
         * @var         SB_Automation_Admin $instance The one true SB_Automation_Admin
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
         * @return      object self::$instance The one true SB_Automation_Admin
         */
        public static function instance() {
            if( !self::$instance ) {
                self::$instance = new SB_Automation_Admin();
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
            add_action( 'save_post', array( $this, 'save_meta_boxes' ), 10, 2 );
            add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

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
            wp_enqueue_style( 'sb-admin', SB_Automation_URL . 'assets/css/sb-admin.css', array( 'wp-color-picker' ), SB_Automation_VER );

            wp_enqueue_script( 'sb-admin', SB_Automation_URL . 'assets/js/sb-admin.js', array( 'wp-color-picker', 'jquery-ui-datepicker' ), SB_Automation_VER, true );
            
        }


        /**
         * Internationalization
         *
         * @access      public
         * @since       0.1
         * @return      void
         */
        public function load_textdomain() {

            load_plugin_textdomain( 'sb-automation' );
            
        }


        /**
         * Add settings
         *
         * @access      public
         * @since       0.1
         */
        public function settings_page() {

            add_submenu_page( 'options-general.php', 'SB Automation', 'SB Automation', 'manage_options', 'sb_automation', array( $this, 'render_settings') );
            
        }

        /**
         * Add settings
         *
         * @access      public
         * @since       0.1
         */
        public function render_settings() {

            ?>
            <div id="sb-automation-wrap" class="wrap">

                <h2>Interactions: <?php echo get_option('sb_interactions', true ); ?></h2>

            </div>
            <?php
            
        }

        // Register sb_campaign post type
        public function register_cpt() {

            $labels = array(
                'name'              => __( 'SB Campaigns', 'sb-automation' ),
                'singular_name'     => __( 'Campaign', 'sb-automation' ),
                'menu_name'         => __( 'SB Campaigns', 'sb-automation' ),
                'name_admin_bar'        => __( 'Campaign', 'sb-automation' ),
                'add_new'           => __( 'Add New', 'sb-automation' ),
                'add_new_item'      => __( 'Add New Campaign', 'sb-automation' ),
                'new_item'          => __( 'New Campaign', 'sb-automation' ),
                'edit_item'         => __( 'Edit Campaign', 'sb-automation' ),
                'view_item'         => __( 'View Campaign', 'sb-automation' ),
                'all_items'         => __( 'All Campaigns', 'sb-automation' ),
                'search_items'      => __( 'Search Campaigns', 'sb-automation' ),
                'parent_item_colon' => __( 'Parent Campaigns:', 'sb-automation' ),
                'not_found'         => __( 'No Campaigns found.', 'sb-automation' ),
                'not_found_in_trash' => __( 'No Campaigns found in Trash.', 'sb-automation' )
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
                'rewrite'           => array( 'slug' => 'campaigns' ),
                'capability_type'   => 'post',
                'has_archive'       => true,
                'hierarchical'      => true,
                'menu_position'     => 50,
                'menu_icon'         => 'dashicons-welcome-add-page',
                'supports'          => array( 'title', 'editor' ),
                'show_in_customizer' => false,
                'register_meta_box_cb' => array( $this, 'campaign_meta_boxes' )
            );

            register_post_type( 'sb_campaign', $args );
        }

        /**
         * Add Meta Box
         *
         * @since     0.1
         */
        public function campaign_meta_boxes() {

            add_meta_box(
                'targeting_meta_box',
                __( 'Targeting', 'sb-automation' ),
                array( $this, 'targeting_meta_box_callback' ),
                'sb_campaign',
                'normal',
                'high'
            );

            add_meta_box(
                'appearance_meta_box',
                __( 'Appearance', 'sb-automation' ),
                array( $this, 'appearance_meta_box_callback' ),
                'sb_campaign',
                'normal',
                'high'
            );

            add_meta_box(
                'settings_meta_box',
                __( 'Settings', 'sb-automation' ),
                array( $this, 'settings_meta_box_callback' ),
                'sb_campaign',
                'normal',
                'high'
            );

            add_meta_box(
                'preview_meta_box',
                __( 'Preview', 'sb-automation' ),
                array( $this, 'preview_meta_box_callback' ),
                'sb_campaign',
                'side'
            );

        }

        /**
         * Display targeting meta box
         *
         * @since     0.1
         */
        public function targeting_meta_box_callback( $post ) { ?>

            <?php wp_nonce_field( basename( __FILE__ ), 'sb_campaign_meta_box_nonce' ); ?>

            <h3>Show on these pages</h3>

            <p>
                <label for="show-on"><?php _e( 'Show on:', 'sb-automation' ); ?></label>
                <br>
                <input type="radio" name="show-on" value="all" checked> All pages<br>
                <input type="radio" name="show-on" value="limited"> Certain pages<br>
                <div id="show-certain-pages">
                <p>Enter page/post IDs:</p>
                <input placeholder="Example: 2,25,311" class="widefat" type="text" name="sb-page-ids" id="sb-page-ids" value="<?php echo esc_attr( get_post_meta( $post->ID, 'sb_page_ids', true ) ); ?>" size="20" />
                </div>
            </p>

            <h3>Show to these visitors (default: all visitors)</h3>

            <p> 
                <label for="logged-in"><?php _e( 'Logged in/out', 'sb-automation' ); ?></label><br>
                <input type="radio" name="logged-in" value="all" checked> All visitors<br>
                <input type="radio" name="logged-in" value="logged-in"> Logged in<br>
                <input type="radio" name="logged-in" value="logged-out"> Logged out
            </p>
            <p>
                <label for="visitor"><?php _e( 'New or returning', 'sb-automation' ); ?></label><br>
                <input type="radio" name="new-or-returning" value="all" checked> All visitors<br>
                <input type="radio" name="new-or-returning" value="new"> New visitors only<br>
                <input type="radio" name="new-or-returning" value="returning"> Returning visitors only
            </p>

        <?php }

        /**
         * Display appearance meta box
         *
         * @since     0.1
         */
        public function appearance_meta_box_callback( $post ) { ?>

            <p>
                <input type="checkbox" id="show-email" name="show-email" value="true">
                <label for="show-email"><?php _e( 'Show Email Field?', 'sb-automation' ); ?></label>
                <div id="show-email-options">
                <label for="opt-in-message"><?php _e( 'Message', 'sb-automation' ); ?></label>
                <input class="widefat" type="text" name="opt-in-message" id="opt-in-message" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_message', true ) ); ?>" size="20" />

                <label for="opt-in-placeholder"><?php _e( 'Placeholder', 'sb-automation' ); ?></label>
                <input class="widefat" type="text" name="opt-in-placeholder" id="opt-in-placeholder" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_placeholder', true ) ); ?>" size="20" />

                <label for="opt-in-confirmation"><?php _e( 'Confirmation Message', 'sb-automation' ); ?></label>
                <input class="widefat" type="text" name="opt-in-confirmation" id="opt-in-confirmation" value="<?php echo esc_attr( get_post_meta( $post->ID, 'opt_in_confirmation', true ) ); ?>" size="20" />

                </div>
            </p>

            <p>Accent color</p>
            <input type="text" value="#bada55" class="sb-automation-colors" data-default-color="#effeff" />
            
            <p>Background color</p>
            <input type="text" value="#ffffff" class="sb-automation-colors" data-default-color="#ffffff" />

        <?php }

        /**
         * Display settings meta box
         *
         * @since     0.1
         */
        public function settings_meta_box_callback( $post ) { ?>

            <p>
                <label for="avatar-email"><?php _e( 'Gravatar Email', 'sb-automation' ); ?></label><br>
                <input type="text" class="widefat" name="avatar-email" size="20" /> 
            <p>
                <label for="visitor"><?php _e( 'Show until', 'sb-automation' ); ?></label><br>
                <input type="radio" name="show-until" value="always" checked> Always<br>
                <input type="radio" name="show-until" value="interaction"> User interacts (Submit email, click link)<br>
                <input type="radio" name="show-until" value="date"> A certain date
                <div id="sb-until-datepicker" class="sb-datepicker"></div>
            </p>

        <?php }

        /**
         * Display preview
         *
         * @since     0.1
         */
        public function preview_meta_box_callback( $post ) { ?>

            <!-- <div id="sb-floating-btn"><i class="icon icon-chat"></i></div> -->

            <div id="sb-notification-box">
                
                <div class="sb-box-rows">
                        <?php echo get_avatar('scott@apppresser.com', 50 ); ?>
                    <div class="sb-row" id="sb-first-row"></div>
                </div>

                <div id="sb-note-optin" class="sb-row sb-email-row">
                    <input type="email" name="email" id="sb-email-input" placeholder="Enter email" autocomplete="on" autocapitalize="off" />
                    <button class="sb-email-btn" id="sb-submit-email"><?php echo _e('Send', 'sb-automation' ); ?></button>
                </div>
                
                <div id="sb-chat" class="sb-hide">
                    
                    <div class="sb-row sb-text">
                        <input type="text" id="sb-text-input" />
                        <i id="sb-submit-text" class="icon icon-mail"></i>
                    </div>
                </div>

                <span id="sb-powered-by"><a href="http://scottbolinger.com" target="_blank">Scottomator</a></span>
                <div class="sb-close"><i class="icon icon-cancel"></i></div>
 
            </div>

        <?php }

        /**
         * Save meta box settings
         *
         * @since     0.1
         */
        public function save_meta_boxes( $post_id ) {

            // nonce check
            if ( !isset( $_POST['sb_campaign_meta_box_nonce'] ) || !wp_verify_nonce( $_POST['sb_campaign_meta_box_nonce'], basename( __FILE__ ) ) )
                return $post_id;

            $post_type = get_post_type($post_id);

            // If this isn't a 'book' post, don't update it.
            if ( "sb_campaign" != $post_type ) 
                return;

            // Check if the current user has permission to edit the post.
            if ( !current_user_can( 'edit_post', $post_id ) )
                return $post_id;

            // update_post_meta();

        }


    }

    $sb_automation_admin = new SB_Automation_Admin();
    $sb_automation_admin->instance();

} // end class_exists check