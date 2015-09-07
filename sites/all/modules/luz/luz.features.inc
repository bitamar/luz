<?php
/**
 * @file
 * luz.features.inc
 */

/**
 * Implements hook_flag_default_flags().
 */
function luz_flag_default_flags() {
  $flags = array();
  // Exported flag: "Attend".
  $flags['attend'] = array(
    'entity_type' => 'node',
    'title' => 'Attend',
    'global' => 0,
    'types' => array(
      0 => 'workshop',
    ),
    'flag_short' => 'Join',
    'flag_long' => 'I\'m coming to this workshop',
    'flag_message' => '',
    'unflag_short' => 'I\'m not coming',
    'unflag_long' => 'I\'m not coming to this workshop',
    'unflag_message' => '',
    'unflag_denied_text' => ' ',
    'link_type' => 'toggle',
    'weight' => 0,
    'show_in_links' => array(
      'full' => 'full',
      'teaser' => 'teaser',
      'rss' => 0,
    ),
    'show_as_field' => 0,
    'show_on_form' => 0,
    'access_author' => '',
    'show_contextual_link' => 0,
    'i18n' => 0,
    'module' => 'luz',
    'locked' => array(
      0 => 'name',
    ),
    'api_version' => 3,
  );
  return $flags;

}

/**
 * Implements hook_node_info().
 */
function luz_node_info() {
  $items = array(
    'event' => array(
      'name' => t('Event'),
      'base' => 'node_content',
      'description' => '',
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
    'workshop' => array(
      'name' => t('Workshop'),
      'base' => 'node_content',
      'description' => '',
      'has_title' => '1',
      'title_label' => t('Title'),
      'help' => '',
    ),
  );
  drupal_alter('node_info', $items);
  return $items;
}
