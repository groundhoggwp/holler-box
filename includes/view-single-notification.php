<?php

if( empty( $_GET['id'] ) ) :
	echo '<h2>Error, no notification ID.</h2>';
	echo '<a href="' . admin_url() . 'admin.php?page=sb_automation">Back</a>';

else: 

$id = $_GET['id'];

$content_post = get_post($id);
$content = $content_post->post_content;
$content = apply_filters('the_content', $content);
$content = str_replace(']]>', ']]&gt;', $content);

// echo '<a href="' . admin_url() . 'admin.php?page=sb_automation">Back</a>';

?>

<h1 class="wp-heading-inline">Edit Notification</h1>

<input class="sb-title-input" type="text" name="post_title" id="post_title" value="<?php echo esc_html( get_the_title( $id ) ); ?>" size="20" />

<?php wp_editor( $content, 'sb_post_content', $settings = array() ); ?> 

<div class="sb-metabox">

    <?php $this->appearance_meta_box_callback( $id ); ?>

</div>

<div class="sb-metabox">

    <?php $this->targeting_meta_box_callback( $id ); ?>

</div>

<div class="sb-metabox">

    <?php $this->settings_meta_box_callback( $id ); ?>

</div>

<?php $this->preview_meta_box_callback( $id ); ?>

<?php endif; ?>