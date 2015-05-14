<?php
/**
 * @file
 * luz.features.menu_links.inc
 */

/**
 * Implements hook_menu_default_menu_links().
 */
function luz_menu_default_menu_links() {
  $menu_links = array();

  // Exported menu link: menu-luz_---:<front>
  $menu_links['menu-luz_---:<front>'] = array(
    'menu_name' => 'menu-luz',
    'link_path' => '<front>',
    'router_path' => '',
    'link_title' => 'השבוע הבא הבא הבא',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'alter' => TRUE,
      'query' => array(
        'week' => 3,
      ),
      'identifier' => 'menu-luz_---:<front>',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 1,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => 0,
    'customized' => 1,
  );
  // Exported menu link: menu-luz_--:<front>
  $menu_links['menu-luz_--:<front>'] = array(
    'menu_name' => 'menu-luz',
    'link_path' => '<front>',
    'router_path' => '',
    'link_title' => 'השבוע הבא הבא',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'alter' => TRUE,
      'query' => array(
        'week' => 2,
      ),
      'identifier' => 'menu-luz_--:<front>',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 1,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => 0,
    'customized' => 1,
  );
  // Exported menu link: menu-luz_-:<front>
  $menu_links['menu-luz_-:<front>'] = array(
    'menu_name' => 'menu-luz',
    'link_path' => '<front>',
    'router_path' => '',
    'link_title' => 'השבוע הזה',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
      'alter' => TRUE,
      'query' => array(
        'week' => 0,
      ),
      'identifier' => 'menu-luz_-:<front>',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 1,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -46,
    'customized' => 1,
  );
  // Exported menu link: menu-luz_next-next-next-week:<front>
  $menu_links['menu-luz_next-next-next-week:<front>'] = array(
    'menu_name' => 'menu-luz',
    'link_path' => '<front>',
    'router_path' => '',
    'link_title' => 'Next next next week',
    'options' => array(
      'query' => array(
        'week' => 3,
      ),
      'attributes' => array(
        'title' => '',
      ),
      'alter' => TRUE,
      'identifier' => 'menu-luz_next-next-next-week:<front>',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 1,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -47,
    'customized' => 1,
  );
  // Exported menu link: menu-luz_next-next-week:<front>
  $menu_links['menu-luz_next-next-week:<front>'] = array(
    'menu_name' => 'menu-luz',
    'link_path' => '<front>',
    'router_path' => '',
    'link_title' => 'Next next week',
    'options' => array(
      'query' => array(
        'week' => 2,
      ),
      'attributes' => array(
        'title' => '',
      ),
      'alter' => TRUE,
      'identifier' => 'menu-luz_next-next-week:<front>',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 1,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -48,
    'customized' => 1,
  );
  // Exported menu link: menu-luz_next-week:<front>
  $menu_links['menu-luz_next-week:<front>'] = array(
    'menu_name' => 'menu-luz',
    'link_path' => '<front>',
    'router_path' => '',
    'link_title' => 'Next week',
    'options' => array(
      'query' => array(
        'week' => 1,
      ),
      'attributes' => array(
        'title' => '',
      ),
      'alter' => TRUE,
      'identifier' => 'menu-luz_next-week:<front>',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 1,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -49,
    'customized' => 1,
  );
  // Exported menu link: menu-luz_this-week:<front>
  $menu_links['menu-luz_this-week:<front>'] = array(
    'menu_name' => 'menu-luz',
    'link_path' => '<front>',
    'router_path' => '',
    'link_title' => 'This week',
    'options' => array(
      'query' => array(
        'week' => 0,
      ),
      'attributes' => array(
        'title' => '',
      ),
      'alter' => TRUE,
      'identifier' => 'menu-luz_this-week:<front>',
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 1,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => -50,
    'customized' => 1,
  );
  // Translatables
  // Included for use with string extractors like potx.
  t('Next next next week');
  t('Next next week');
  t('Next week');
  t('This week');
  t('השבוע הבא הבא');
  t('השבוע הבא הבא הבא');
  t('השבוע הזה');


  return $menu_links;
}
