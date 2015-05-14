(function ($) {
    Drupal.behaviors.luzDate = {};

    // The timepicker relies on the gone $.browser
    $.browser = [];

    Drupal.behaviors.luzDate.attach = function (context, settings) {
        var dateField = $(".field-name-field-date");
        var dateFrom = dateField.find(".form-item-field-date-und-0-value-date input");
        dateFrom.change(function() {
            dateField.find(".form-item-field-date-und-0-value2-date input").val(dateFrom.val());
        });

        var lengthInput = dateField.find(".form-item-field-date-und-0-length input");

        dateField.find(".form-item-field-date-und-0-value-time input, .form-item-field-date-und-0-value2-time input").change(function() {
            var timeFromMinutes = Drupal.behaviors.luzDate.getInputMinutes(".form-item-field-date-und-0-value-time");
            var timeToMinutes = Drupal.behaviors.luzDate.getInputMinutes(".form-item-field-date-und-0-value2-time");

            var length = Drupal.behaviors.luzDate.getTimeFromMinutes(timeToMinutes - timeFromMinutes);
            if (lengthInput.val() != length) lengthInput.val(length);
        });

        lengthInput.change(function() {
            var timeFromMinutes = Drupal.behaviors.luzDate.getInputMinutes(".form-item-field-date-und-0-value-time");
            var lengthMinutes = Drupal.behaviors.luzDate.getInputMinutes(".form-item-field-date-und-0-length");
            var timeTo = Drupal.behaviors.luzDate.getTimeFromMinutes(timeFromMinutes + lengthMinutes);
            var timeToInput = dateField.find(".form-item-field-date-und-0-value2-time input");
            if (timeToInput.val() != timeTo) timeToInput.val(timeTo);
        });
    };

    Drupal.behaviors.luzDate.getInputMinutes = function(inputName) {
        var time =  $(".field-name-field-date " + inputName + " input").val().split(":");
        return parseInt(time[0]) * 60 + parseInt(time[1]);
    };

    Drupal.behaviors.luzDate.getTimeFromMinutes = function(minutes) {
        var hours = Math.floor(minutes / 60);
        if (hours < 10) hours = "0" + hours;
        var minutes = minutes % 60;
        if (minutes < 10) minutes = "0" + minutes;
        return hours + ":" + minutes;
    };

})(jQuery);
