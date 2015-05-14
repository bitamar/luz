<?php
/**
 * @file
 * luz.features.user_role.inc
 */

/**
 * Implements hook_user_default_roles().
 */
function luz_user_default_roles() {
  $roles = array();

  // Exported role: content manager.
  $roles['content manager'] = array(
    'name' => 'content manager',
    'weight' => 2,
  );

  return $roles;
}
