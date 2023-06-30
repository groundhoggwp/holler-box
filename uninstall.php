<?php

/**
 * Uninstall HollerBox
 *
 * Deletes all the plugin data i.e.
 *        1. Custom Post types.
 *        2. Terms & Taxonomies.
 *        3. Plugin pages.
 *        4. Plugin options.
 *        5. Capabilities.
 *        6. Roles.
 *        7. Database tables.
 *        8. Cron events.
 *
 * @since       1.4.3
 * @subpackage  Uninstall
 * @copyright   Copyright (c) 2015, Pippin Williamson
 * @license     http://opensource.org/licenses/gpl-2.0.php GNU Public License
 * @package     WPGH
 */

// Exit if accessed directly.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Load our main plugin file
include_once __DIR__ . '/holler-box.php';

Holler_Box::instance();

global $wpdb;

if ( \Holler_Settings::instance()->get( 'delete_all_data' ) ) {

	\Holler_Reporting::instance()->drop();

	// Delete all the posts
	$wpdb->query( "DELETE p,tr,pm
    FROM $wpdb->posts p
    LEFT JOIN $wpdb->term_relationships tr
        ON (p.ID = tr.object_id)
    LEFT JOIN $wpdb->postmeta pm
        ON (p.ID = pm.post_id)
    WHERE p.post_type = 'hollerbox';" );

	// Delete cached user meta
	$wpdb->query( "DELETE FROM $wpdb->usermeta WHERE meta_key in ('hollerbox_popup_conversions','hollerbox_closed_popups');" );

	\Holler_Settings::instance()->drop();

	wp_clear_scheduled_hook( 'hollerbox/telemetry' );

}
