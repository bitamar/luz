<div id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix"<?php print $attributes; ?> <?php if (isset($top_offset)): ?>style="top: <?php print $top_offset; ?>px; min-height: <?php print $height; ?>px; "<?php endif; ?>>

  <?php if($title): ?>
    <h5<?php print $title_attributes; ?>><?php print $title; ?></h5>
  <?php endif; ?>

  <div class="content"<?php print $content_attributes; ?>>

    <?php
      hide($content['comments']);
      hide($content['links']);
      print render($content);
    ?>
  </div>

  <?php print render($content['links']); ?>

  <?php print render($content['comments']); ?>

  <?php if (isset($edit_link)): ?>
    <?php print $edit_link; ?>
  <?php endif; ?>

</div>
