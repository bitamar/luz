<?php
/**
 * @file
 * luz.features.menu_custom.inc
 */

/**
 * Implements hook_menu_default_menu_custom().
 */
function luz_menu_default_menu_custom() {
  $menus = array();

  // Exported menu: menu-luz.
  $menus['menu-luz'] = array(
    'menu_name' => 'menu-luz',
    'title' => 'Luz',
    'description' => '',
    'language' => 'und',
    'i18n_mode' => 5,
  );
  // Translatables
  // Included for use with string extractors like potx.
  t('Luz');


  return $menus;
}
