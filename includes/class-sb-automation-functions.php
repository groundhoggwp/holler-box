<?php
/**
 *
 * @since       0.1.0
 */


// Exit if accessed directly
if( !defined( 'ABSPATH' ) ) exit;

if( !class_exists( 'SB_Automation_Functions' ) ) {

    /**
     * SB_Automation_Functions class
     *
     * @since       0.2.0
     */
    class SB_Automation_Functions {

        /**
         * @var         SB_Automation_Functions $instance The one true SB_Automation_Functions
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
         * @return      object self::$instance The one true SB_Automation_Functions
         */
        public static function instance() {
            if( !self::$instance ) {
                self::$instance = new SB_Automation_Functions();
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

            add_action( 'wp', array( $this, 'show_logic' ) );

        }

        /**
         * Determine if we should show items, if so, add hooks
         *
         * @since       0.1.0
         * @return      void
         */
        public function show_logic() {

            // @TODO: is user logged in check, page conditionals
            //if( !is_user_logged_in() ) {
                add_action( 'wp_footer', array( $this, 'display_notification_box' ) );
                // add_filter( 'body_class', array( $this, 'body_classes' ) );
                add_action( 'wp_enqueue_scripts', array( $this, 'scripts_styles' ) );
            //}
                
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

            wp_enqueue_script( 'sb-automation-js', SB_Automation_URL . 'assets/js/sb-automation' . $suffix . '.js', array( 'jquery' ), SB_Automation_VER, true );
            wp_enqueue_style( 'sb-automation-css', SB_Automation_URL . 'assets/css/sb-automation' . $suffix . '.css', null, SB_Automation_VER );

            wp_localize_script( 'sb-automation-js', 'sbAutoVars', $this->get_localized_vars()
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

            $array['sbNonce'] = wp_create_nonce('sb-automation');

            // @TODO: if( setting exists )
            // $array['lastSeen'] = 'none'; // in days. default is none

            // $array['expires'] = '90'; // how long we should show this in num days

            $array['noteDefault'] = array( 
                'content' => '<p>Join our webinar Thursday at 11, <a href="#">click here to register.</a></p>',
                // 'content' => '<p>Hi there, have any questions?</p>',
                'showOptin' => 'true',
                // 'showChat' => 'true',
                'optinMsg' => 'Please enter your email and we will reply asap.',
                'placeholder' => 'Email',
                'confirmMsg' => 'Sent, thanks!'
            );

            // $array['noteInteracted'] = array( 
            //     'content' => '<p>Thanks for interacting!</p>',
            //     'showOptin' => 'false'
            // );

            $array['noteReturning'] = array( 
                'content' => '<p>Hi again!</p>',
                'showOptin' => 'false',
                'optinMsg' => 'Enter your email.',
                'placeholder' => 'Email'
            );

            $array['delay'] = '1000'; // time delay in milliseconds, default 100

            return $array;
        }

        /**
         * Show the box
         *
         * @since       0.1.0
         * @return      HTML
         */
        public function display_notification_box() {

            ?>

            <div id="sb-floating-btn"><i class="icon icon-chat"></i></div>

            <div id="sb-notification-box">
                
                <div class="sb-box-rows">
                        <?php echo get_avatar('scott@apppresser.com', 50 ); ?>
                    <div class="sb-row" id="sb-first-row"></div>
                </div>

                <div id="sb-note-optin" class="sb-row sb-email-row sb-hide">
                    <input type="email" name="email" id="sb-email-input" placeholder="Enter email" autocomplete="on" autocapitalize="off" />
                    <button class="sb-email-btn" id="sb-submit-email"><?php echo _e('Send', 'sb-automation' ); ?></button>
                </div>
                
                <div id="sb-chat" class="sb-hide">
                    
                    <div class="sb-row sb-text">
                        <input type="text" id="sb-text-input" placeholder="Type your message" />
                        <i id="sb-submit-text" class="icon icon-mail"></i>
                    </div>
                </div>

                <span id="sb-powered-by"><a href="http://scottbolinger.com" target="_blank">Scottomator</a></span>
                <div class="sb-close"><i class="icon icon-cancel"></i></div>
 
            </div>

            <?php
        }

        /**
         * Add body class
         *
         * @since       0.1.0
         * @return      array()
         */
        public function body_classes( $classes ) {
            $classes[] = 'sb-top-margin';
            return $classes;
        }

    }

    $sb_automation_functions = new SB_Automation_Functions();
    $sb_automation_functions->instance();

} // end class_exists check