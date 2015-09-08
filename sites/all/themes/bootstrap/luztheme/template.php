<?php

/**
 * @file
 * template.php
 */

function luztheme_preprocess_node(&$variables) {
  global $user;

  if (!drupal_is_front_page()) {
    return;
  }

  if (isset($variables['elements']['#link_to_week'])) {
    if (user_access('edit any workshop content')) {
      $variables['edit_link'] = l(t('Edit'), 'node/' . $variables['nid'] . '/edit', array('attributes' => array('class' => array('edit')), 'query' => array('destination' => '<front>?week=' . $variables['elements']['#link_to_week'])));
    }
  }

  if ($variables['type'] == 'workshop') {
    if (luz_user_attending_workshop($variables['node'], $user->uid)) {
      $variables['classes_array'][] = 'attending';
    }

    $minute_height = 25/60;
    $wrapper = entity_metadata_wrapper('node', $variables['node']);
    $start_time = $wrapper->field_date->value->value();

    $variables['top_offset'] = floor(25 * (date('H', $start_time) - 8) + (date('i', $start_time) / 60) * 25);
    $end_time = $wrapper->field_date->value2->value();
    $variables['height'] = floor($minute_height * ($end_time - $start_time) / 60) + 1;

    // Not using label() to get the english name.
    $variables['classes_array'][] = 'type-' . drupal_html_class($wrapper->field_type->name->value());
    $variables['title'] = NULL;
  }
}

function luztheme_preprocess_field(&$variables, $hook) {

  switch ($variables['element']['#field_name']) {

    case 'field_participants':
      if ($variables['items']) {
        foreach ($variables['items'] as $delta => $item) {
          if (empty($item['entity'])) {
            continue;
          }

          $item = reset($item['entity']['field_collection_item']);
          $wrapper = entity_metadata_wrapper('field_collection_item', $item['#entity']);
          if (!$wrapper->field_active->value()) {
            unset($variables['items'][$delta]);
          }
        }
      }
      break;
  }
}

function luztheme_preprocess_html(&$variables) {
  global $language;

  $variables['classes_array'][] = 'lang-' . $language->language;
}

function luztheme_preprocess_page(&$variables) {
  global $user;

  $item = menu_get_item();

  $width = 5;
  $variables['luz_menu'] = FALSE;
  if (drupal_is_front_page()) {
    $width = 12;

    $wrapper = entity_metadata_wrapper('user', $user);
    // Recurrent students see four weeks.
    if ($wrapper->field_repeat->value()) {
      $variables['luz_menu'] = menu_tree(variable_get('menu_main_links_source', 'menu-luz'));
      $variables['luz_menu']['#theme_wrappers'] = array('menu_tree__primary');
    }
  }
  elseif ($item['path'] == 'node/add/workshop' || $item['path'] == 'node/%/edit' || $item['path'] == 'admin/people') {
    $width = 8;
  }
  elseif ($item['path'] == 'luz/attendance/%/%' || $item['path'] == 'luz/attendance') {
    $width = 12;
  }

  $variables['content_column_class'] = " class=\"col-sm-$width\"";
}

function luztheme_link($variables) {
  if ($variables['path'] == '<front>' && isset($variables['options']['attributes']['class'])) {
    foreach ($variables['options']['attributes']['class'] as $i => $class) {
      if ($class == 'active' && !luztheme_link_is_active($variables)) {
        unset($variables['options']['attributes']['class'][$i]);
      }
    }
    if (isset($variables['options']['query']['week'])) {
      $variables['options']['attributes']['data-week'] = $variables['options']['query']['week'];
    }
  }

  return theme_link($variables);
}

function luztheme_menu_link(array $variables) {
  $element = $variables['element'];
  $sub_menu = '';

  if ($element['#below']) {
    $sub_menu = drupal_render($element['#below']);
  }
  $output = l($element['#title'], $element['#href'], $element['#localized_options']);

  $link = $variables['element']['#original_link'];
  if ($link['link_path'] == '<front>' && luztheme_link_is_active($link)) {
    $element['#attributes']['class'][] = 'active';
  }

  return '<li' . drupal_attributes($element['#attributes']) . '>' . $output . $sub_menu . "</li>\n";
}

function luztheme_link_is_active($link) {
  if (array_key_exists('week', $_GET)) {
    return isset($link['options']['query']['week']) ? $_GET['week'] == $link['options']['query']['week'] :  $_GET['week'] == 0;
  }
  else {
    return !isset($link['options']['query']['week']) || $link['options']['query']['week'] == 0;
  }
}

function luztheme_process_flag(&$variables) {
  $variables['btn_class'] = '';
  if ($variables['flag']->name == 'attend' && $variables['action'] == 'flag') {
    $variables['btn_class'] = 'btn-default btn';
  }
}

/**
 * Translate usernames to hebrew in the participant field.
 */
function luztheme_field__field_participant($variables) {
  global $language;

  $output = '';

  foreach ($variables['items'] as $item) {
    if ($language->language == 'he' && $variables['element']['#entity_type'] == 'field_collection_item') {
      $wrapper = entity_metadata_wrapper('field_collection_item', $variables['element']['#object']);
      $item['#markup'] = $wrapper->field_participant->field_he_name->value();
    }

    $output .= drupal_render($item);
  }
  return $output;
}

/**
 * Returns HTML for a date_select 'time' label.
 */
function luztheme_date_part_label_time($variables) {
  if (substr($variables['element']['#id'], -5) == 'value') {
    return t('Starting time');
  }
  else {
    return t('Ending time');
  }
}

function luztheme_preprocess_user($variables) {
  dpm($variables);
}
