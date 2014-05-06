(function ($) {
    $(document).ready(function() {
        var dateFrom = $(".form-item-field-date-und-0-value-date input");
        dateFrom.change(function(){
            $(".form-item-field-date-und-0-value2-date input").val(dateFrom.val());
       });
    });
})(jQuery);
